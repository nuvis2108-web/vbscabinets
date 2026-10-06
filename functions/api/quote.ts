// POST /api/quote — receives the Request a Quote form.
// Order: size/type checks → honeypot → Turnstile → field + file validation → private R2 upload
// → notification email (via the vbs-quote-mailer Worker) → success with a reference number.

import {
  FIELD_NAMES,
  MESSAGES,
  UPLOAD_LIMITS,
  normaliseFields,
  validateFields,
  type FieldErrors,
  type PhotoGroup,
} from '../../src/lib/quote-rules';
import { isIsoMediaImage, stripJpegMetadata } from '../../src/server/jpeg';
import { buildQuoteEmail, type PhotoLink } from '../../src/server/quote-email';
import { PHOTO_LINK_DAYS, linkExpiry, signedUrl } from '../../src/server/signed-links';
import { verifyTurnstile } from '../../src/server/turnstile';

interface Env {
  QUOTE_UPLOADS: R2Bucket;
  QUOTE_MAILER: Fetcher;
  TURNSTILE_SECRET_KEY: string;
  PHOTO_LINK_SECRET: string;
  /** "production", "preview" or "local" — set in wrangler.toml. */
  QUOTE_ENV?: string;
}

type ErrorCode =
  | 'method'
  | 'config'
  | 'content_type'
  | 'too_large'
  | 'bad_request'
  | 'verification'
  | 'invalid'
  | 'storage'
  | 'email';

const ERROR_MESSAGES: Record<ErrorCode, string> = {
  method: 'This address only accepts quote requests from the form.',
  config: "Our quote form isn't available right now.",
  content_type: "Your request couldn't be read. Please try again.",
  too_large: 'Your photos are too large to send together. Please remove a few and try again.',
  bad_request: "Your request couldn't be read. Please try again.",
  verification: "We couldn't verify the form. Please complete the check and try again.",
  invalid: 'Please check the highlighted fields.',
  storage: "Your request didn't send because of a problem on our side.",
  email: "Your request didn't send because of a problem on our side.",
};

const STATUS: Record<ErrorCode, number> = {
  method: 405,
  config: 503,
  content_type: 415,
  too_large: 413,
  bad_request: 400,
  verification: 403,
  invalid: 400,
  storage: 502,
  email: 502,
};

const REFERENCE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Short, readable reference for the customer and the email subject, e.g. VBS-2610-7F3KQ2. */
function newReference(now: Date): string {
  const random = crypto.getRandomValues(new Uint8Array(6));
  const suffix = Array.from(random, (byte) => REFERENCE_ALPHABET[byte % REFERENCE_ALPHABET.length]).join('');
  const yymm = `${String(now.getUTCFullYear()).slice(2)}${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  return `VBS-${yymm}-${suffix}`;
}

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  const wantsJson = (request.headers.get('Accept') ?? '').includes('application/json');

  const fail = (code: ErrorCode, extra: { fieldErrors?: FieldErrors; fileErrors?: string[] } = {}) => {
    const message = extra.fileErrors?.[0] ?? ERROR_MESSAGES[code];
    if (wantsJson) {
      return Response.json({ ok: false, code, message, ...extra }, { status: STATUS[code], headers: noStore });
    }
    return errorPage(message, STATUS[code]);
  };

  const succeed = (reference: string) =>
    wantsJson
      ? Response.json({ ok: true, reference }, { headers: noStore })
      : Response.redirect(new URL(`/contact/thanks?ref=${reference}`, request.url).href, 303);

  if (request.method !== 'POST') {
    return new Response(ERROR_MESSAGES.method, { status: 405, headers: { Allow: 'POST', ...noStore } });
  }

  if (!env.QUOTE_UPLOADS || !env.QUOTE_MAILER || !env.TURNSTILE_SECRET_KEY || !env.PHOTO_LINK_SECRET) {
    console.error('quote: missing binding or secret — check wrangler.toml and the Pages project settings');
    return fail('config');
  }

  if (!(request.headers.get('Content-Type') ?? '').startsWith('multipart/form-data')) return fail('content_type');
  if (Number(request.headers.get('Content-Length') ?? 0) > UPLOAD_LIMITS.requestBytes) return fail('too_large');

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail('bad_request');
  }

  const text = (name: string) => {
    const value = form.get(name);
    return typeof value === 'string' ? value : '';
  };

  const now = new Date();
  const reference = newReference(now);

  // Honeypot: real visitors never see this field. Pretend it worked and store nothing.
  if (text('company')) return succeed(reference);

  const ip = request.headers.get('CF-Connecting-IP');
  if (!(await verifyTurnstile(env.TURNSTILE_SECRET_KEY, text('cf-turnstile-response'), ip))) {
    return fail('verification');
  }

  const fields = normaliseFields(Object.fromEntries(FIELD_NAMES.map((name) => [name, text(name)])));
  const fieldErrors = validateFields(fields);

  // Files: count, size, and JPEG-only (the browser converts everything to JPEG and strips metadata;
  // HEIC/HEIF or anything else that arrives unconverted is rejected and never stored).
  const fileErrors: string[] = [];
  const photos: { group: PhotoGroup; bytes: Uint8Array }[] = [];

  for (const group of ['space', 'inspiration'] as const) {
    const files = form.getAll(group).filter((entry): entry is File => typeof entry !== 'string' && entry.size > 0);
    if (files.length > UPLOAD_LIMITS[group]) {
      fileErrors.push(MESSAGES.tooManyPhotos(group));
      continue;
    }
    for (const file of files) {
      const name = file.name.slice(0, 80) || 'photo';
      if (file.size > UPLOAD_LIMITS.fileBytes) {
        fileErrors.push(MESSAGES.fileTooLarge(name));
        continue;
      }
      const bytes = new Uint8Array(await file.arrayBuffer());
      const stripped = stripJpegMetadata(bytes);
      if (!stripped) {
        if (isIsoMediaImage(bytes)) console.warn('quote: rejected unconverted HEIC/HEIF upload');
        fileErrors.push(MESSAGES.unsupportedImage(name));
        continue;
      }
      photos.push({ group, bytes: stripped });
    }
  }

  if (Object.keys(fieldErrors).length || fileErrors.length) {
    return fail('invalid', { fieldErrors, fileErrors });
  }

  // Private storage: quotes/<id>/… — the id is random, and the bucket has no public access.
  const id = crypto.randomUUID();
  const counters = { space: 0, inspiration: 0 };
  const stored = photos.map((photo) => {
    const index = String(++counters[photo.group]).padStart(2, '0');
    return { ...photo, fileName: `${photo.group}-${index}.jpg`, index };
  });

  try {
    await Promise.all(
      stored.map((photo) =>
        env.QUOTE_UPLOADS.put(`quotes/${id}/${photo.fileName}`, photo.bytes, {
          httpMetadata: { contentType: 'image/jpeg' },
          customMetadata: { reference },
        }),
      ),
    );
    // Backup copy of the request, so nothing is lost if the email step fails.
    await env.QUOTE_UPLOADS.put(
      `quotes/${id}/submission.json`,
      JSON.stringify({ reference, submittedAt: now.toISOString(), fields, photos: stored.map((p) => p.fileName) }, null, 2),
      { httpMetadata: { contentType: 'application/json' }, customMetadata: { reference } },
    );
  } catch (error) {
    console.error(`quote ${reference}: R2 upload failed`, error instanceof Error ? error.message : error);
    return fail('storage');
  }

  const origin = new URL(request.url).origin;
  const expires = linkExpiry(now.getTime());
  const photoLinks: PhotoLink[] = await Promise.all(
    stored.map(async (photo) => ({
      label: `${photo.group === 'space' ? 'Space photo' : 'Inspiration image'} ${Number(photo.index)}`,
      url: await signedUrl(origin, `/photos/${id}/${photo.fileName}`, expires, env.PHOTO_LINK_SECRET),
    })),
  );
  const galleryUrl = stored.length ? await signedUrl(origin, `/photos/${id}/`, expires, env.PHOTO_LINK_SECRET) : null;

  const email = buildQuoteEmail({
    fields,
    reference,
    submittedAt: now,
    galleryUrl,
    photos: photoLinks,
    linkDays: PHOTO_LINK_DAYS,
    environment: env.QUOTE_ENV,
  });

  try {
    const response = await env.QUOTE_MAILER.fetch('https://quote-mailer/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(email),
    });
    if (!response.ok) throw new Error(`mailer responded ${response.status}`);
  } catch (error) {
    // Treated as a failure so the customer uses another channel; the request is still saved in R2.
    console.error(`quote ${reference}: email failed`, error instanceof Error ? error.message : error);
    return fail('email');
  }

  return succeed(reference);
};

const noStore = { 'Cache-Control': 'no-store' };

// Only reached by browsers submitting without JavaScript (which can't pass Turnstile), or by direct posts.
function errorPage(message: string, status: number): Response {
  const escaped = message.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const html = `<!doctype html><html lang="en-CA"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>Request not sent | VBS Closets &amp; Cabinets</title></head>
<body style="font-family:system-ui,sans-serif;background:#f7f4ef;color:#171717;max-width:40rem;margin:0 auto;padding:48px 24px;line-height:1.6">
<h1 style="font-weight:500">Your request wasn't sent</h1><p>${escaped}</p>
<p>You can also reach us directly: call <a href="tel:+14373766267">437-376-6267</a>, message us on
<a href="https://wa.me/14373766267">WhatsApp</a>, or email <a href="mailto:vbscustom@gmail.com">vbscustom@gmail.com</a>.</p>
<p><a href="/contact">Back to the quote form</a></p></body></html>`;
  return new Response(html, { status, headers: { 'Content-Type': 'text/html; charset=utf-8', ...noStore } });
}
