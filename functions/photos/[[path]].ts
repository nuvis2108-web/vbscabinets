// GET /photos/<quote-id>/                 → private gallery of every photo in a quote
// GET /photos/<quote-id>/<group>-NN.jpg   → one photo
// Both require an unexpired ?exp=…&sig=… made by functions/api/quote.ts. The R2 bucket itself stays private.

import { signedUrl, verifySignedPath } from '../../src/server/signed-links';

interface Env {
  QUOTE_UPLOADS: R2Bucket;
  PHOTO_LINK_SECRET: string;
}

const PATH = /^\/photos\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/((?:space|inspiration)-\d{2}\.jpg)?$/;

const privateHeaders = {
  'Cache-Control': 'private, no-store',
  'X-Robots-Tag': 'noindex, nofollow',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
};

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD', ...privateHeaders } });
  }
  if (!env.QUOTE_UPLOADS || !env.PHOTO_LINK_SECRET) return message(503, "Photos aren't available right now.");

  const url = new URL(request.url);
  const match = PATH.exec(url.pathname);
  const exp = url.searchParams.get('exp');
  const valid = match && (await verifySignedPath(url.pathname, exp, url.searchParams.get('sig'), env.PHOTO_LINK_SECRET));
  if (!match || !valid || !exp) {
    return message(403, "This photo link has expired or isn't valid. Photo links work for 30 days after a quote request.");
  }

  const [, id, fileName] = match;

  if (fileName) {
    const object = await env.QUOTE_UPLOADS.get(`quotes/${id}/${fileName}`);
    if (!object) return message(404, 'This photo is no longer available. Photos are deleted 180 days after a quote request.');
    return new Response(request.method === 'HEAD' ? null : object.body, {
      headers: {
        ...privateHeaders,
        'Content-Type': 'image/jpeg',
        'Content-Length': String(object.size),
        'Content-Disposition': `inline; filename="${fileName}"`,
      },
    });
  }

  // Gallery: sign each photo with the same expiry as the gallery link itself.
  const listing = await env.QUOTE_UPLOADS.list({ prefix: `quotes/${id}/`, include: ['customMetadata'] });
  const files = listing.objects
    .map((object) => object.key.slice(`quotes/${id}/`.length))
    .filter((name) => /^(space|inspiration)-\d{2}\.jpg$/.test(name))
    .sort();
  if (!files.length) return message(404, 'These photos are no longer available. Photos are deleted 180 days after a quote request.');

  const reference = listing.objects.find((object) => object.customMetadata?.reference)?.customMetadata?.reference ?? '';
  const expires = Number(exp);
  const items = await Promise.all(
    files.map(async (name) => ({
      name,
      label: `${name.startsWith('space') ? 'Space photo' : 'Inspiration image'} ${Number(name.slice(-6, -4))}`,
      url: await signedUrl('', `/photos/${id}/${name}`, expires, env.PHOTO_LINK_SECRET),
    })),
  );

  const section = (title: string, prefix: string) => {
    const group = items.filter((item) => item.name.startsWith(prefix));
    if (!group.length) return '';
    return `<h2>${title} (${group.length})</h2><div class="grid">${group
      .map(
        (item) =>
          `<figure><a href="${item.url}"><img src="${item.url}" alt="${item.label}" loading="lazy"></a><figcaption>${item.label}</figcaption></figure>`,
      )
      .join('')}</div>`;
  };

  const html = `<!doctype html><html lang="en-CA"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex, nofollow"><title>Quote photos ${escapeHtml(reference)} | VBS</title>
<style>body{margin:0;padding:24px;background:#f7f4ef;color:#171717;font:16px/1.5 system-ui,sans-serif}main{max-width:1180px;margin:0 auto}
h1{font-weight:500;margin:0 0 4px}p{color:#625b54;margin:0 0 24px}h2{font-size:18px;font-weight:600;margin:32px 0 16px}
.grid{display:grid;gap:16px;grid-template-columns:repeat(auto-fill,minmax(240px,1fr))}figure{margin:0}
img{display:block;width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:4px;background:#e4ddd3}figcaption{font-size:14px;color:#625b54;margin-top:8px}</style>
</head><body><main><h1>Quote photos</h1><p>${escapeHtml(reference)} · Select a photo to open it full size. This page is private and stops working when the link expires.</p>
${section('Photos of the space', 'space')}${section('Inspiration images', 'inspiration')}</main></body></html>`;

  return new Response(html, {
    headers: {
      ...privateHeaders,
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Security-Policy': "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
    },
  });
};

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function message(status: number, text: string): Response {
  const html = `<!doctype html><html lang="en-CA"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex, nofollow"><title>Quote photos | VBS</title></head>
<body style="font-family:system-ui,sans-serif;background:#f7f4ef;color:#171717;max-width:40rem;margin:0 auto;padding:48px 24px;line-height:1.6">
<p>${escapeHtml(text)}</p></body></html>`;
  return new Response(html, { status, headers: { ...privateHeaders, 'Content-Type': 'text/html; charset=utf-8' } });
}
