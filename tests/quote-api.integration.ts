// End-to-end test of POST /api/quote and the signed /photos links against the local Wrangler servers.
// Start both first:  npm run dev:mailer   and   npm run dev:functions
// Then:               npm run test:api
// Uses Cloudflare's always-pass Turnstile test secret from .dev.vars. Never point this at production.
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

const BASE = process.env.QUOTE_TEST_URL ?? 'http://127.0.0.1:8788';
const EMAIL_DIR = 'workers/quote-mailer/.wrangler/tmp';
const TOKEN = 'XXXX.DUMMY.TOKEN.XXXX';

const realPhoto = readFileSync('src/assets/images/oak-nightstands.jpg');

/** A real JPEG with an EXIF segment carrying fake GPS data inserted right after SOI. */
function jpegWithGps(): Uint8Array {
  const payload = Buffer.from('Exif\0\0GPSLatitude=43.2557;GPSLongitude=-79.8711');
  const app1 = Buffer.concat([Buffer.from([0xff, 0xe1, (payload.length + 2) >> 8, (payload.length + 2) & 0xff]), payload]);
  return Buffer.concat([realPhoto.subarray(0, 2), app1, realPhoto.subarray(2)]);
}

const validFields = {
  name: 'Integration Test',
  phone: '905-555-0123',
  email: 'integration@example.com',
  city: 'Burlington',
  projectType: 'Closet',
  dimensions: 'About 8 ft wide',
  description: 'Walk-in closet with drawers, double hanging and a shoe wall.',
};

function form(fields: Record<string, string> = validFields, files: { group: string; bytes: Uint8Array; name: string; type?: string }[] = []) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.append(key, value);
  data.append('cf-turnstile-response', TOKEN);
  for (const file of files) data.append(file.group, new Blob([file.bytes], { type: file.type ?? 'image/jpeg' }), file.name);
  return data;
}

const post = (body: FormData | string, accept = 'application/json', headers: Record<string, string> = {}) =>
  fetch(`${BASE}/api/quote`, { method: 'POST', body, headers: { Accept: accept, ...headers }, redirect: 'manual' });

function emailFiles(): string[] {
  const found: string[] = [];
  const walk = (dir: string) => {
    let entries: string[] = [];
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const entry of entries) {
      const path = join(dir, entry);
      if (statSync(path).isDirectory()) walk(path);
      else if (entry.endsWith('.eml')) found.push(path);
    }
  };
  walk(EMAIL_DIR);
  return found;
}

function decodeTextPart(eml: string): string {
  const part = eml.split('Content-Type: text/plain; charset=utf-8\r\nContent-Transfer-Encoding: base64\r\n\r\n')[1].split('\r\n--')[0];
  return Buffer.from(part.replace(/\r\n/g, ''), 'base64').toString('utf8');
}

test('valid request: stores photos privately, emails VBS signed links, strips GPS metadata', async () => {
  const before = new Set(emailFiles());
  const response = await post(
    form(validFields, [
      { group: 'space', bytes: jpegWithGps(), name: 'IMG_0001.jpg' },
      { group: 'space', bytes: realPhoto, name: 'IMG_0002.jpg' },
      { group: 'inspiration', bytes: realPhoto, name: 'pinterest.jpg' },
    ]),
  );
  assert.equal(response.status, 200);
  const body = (await response.json()) as { ok: boolean; reference: string };
  assert.equal(body.ok, true);
  assert.match(body.reference, /^VBS-\d{4}-[A-Z2-9]{6}$/);

  const newEmails = emailFiles().filter((file) => !before.has(file));
  assert.equal(newEmails.length, 1, 'exactly one email sent');
  const eml = readFileSync(newEmails[0], 'utf8');
  assert.match(eml, /^To: <vbscustom@gmail\.com>$/m);
  assert.match(eml, /^Reply-To: <integration@example\.com>$/m);

  const text = decodeTextPart(eml);
  assert.ok(text.includes(body.reference));
  assert.ok(text.includes('Phone: 905-555-0123'));
  assert.ok(text.includes('2 of the space, 1 inspiration'));

  const gallery = /View all photos: (\S+)/.exec(text)![1];
  const photoLinks = [...text.matchAll(/^(?:Space photo|Inspiration image) \d+: (\S+)$/gm)].map((match) => match[1]);
  assert.equal(photoLinks.length, 3);

  const galleryResponse = await fetch(gallery);
  assert.equal(galleryResponse.status, 200);
  assert.equal(galleryResponse.headers.get('X-Robots-Tag'), 'noindex, nofollow');
  assert.equal((await galleryResponse.text()).match(/<img /g)?.length, 3);

  for (const link of photoLinks) {
    const photo = await fetch(link);
    assert.equal(photo.status, 200);
    assert.equal(photo.headers.get('Content-Type'), 'image/jpeg');
    assert.match(photo.headers.get('Cache-Control') ?? '', /no-store/);
    const bytes = Buffer.from(await photo.arrayBuffer());
    assert.ok(!bytes.includes('Exif'), 'EXIF removed');
    assert.ok(!bytes.includes('GPSLatitude'), 'GPS removed');
  }

  // Tampering with any part of a link fails.
  const first = new URL(photoLinks[0]);
  const otherPhoto = new URL(first);
  otherPhoto.pathname = first.pathname.replace('space-01', 'space-02');
  assert.equal((await fetch(otherPhoto)).status, 403, 'signature is tied to one photo');
  const laterExpiry = new URL(first);
  laterExpiry.searchParams.set('exp', String(Number(first.searchParams.get('exp')) + 60));
  assert.equal((await fetch(laterExpiry)).status, 403, 'expiry cannot be extended');
  const unsigned = new URL(first);
  unsigned.search = '';
  assert.equal((await fetch(unsigned)).status, 403, 'unsigned access refused');
});

test('missing and invalid fields return per-field errors and send nothing', async () => {
  const before = emailFiles().length;
  const response = await post(form({ ...validFields, name: '', phone: '555', email: 'nope', projectType: 'Pool' }));
  assert.equal(response.status, 400);
  const body = (await response.json()) as { code: string; fieldErrors: Record<string, string> };
  assert.equal(body.code, 'invalid');
  assert.deepEqual(Object.keys(body.fieldErrors).sort(), ['email', 'name', 'phone', 'projectType']);
  assert.equal(emailFiles().length, before);
});

test('unconverted HEIC is rejected and never stored or emailed', async () => {
  const before = emailFiles().length;
  const heic = Buffer.concat([Buffer.from([0, 0, 0, 0x18]), Buffer.from('ftypheic'), Buffer.alloc(64)]);
  const response = await post(form(validFields, [{ group: 'space', bytes: heic, name: 'IMG_1234.HEIC', type: 'image/heic' }]));
  assert.equal(response.status, 400);
  const body = (await response.json()) as { fileErrors: string[] };
  assert.match(body.fileErrors[0], /IMG_1234\.HEIC.*JPEG, PNG or WebP/);
  assert.equal(emailFiles().length, before);
});

test('PNG and other non-JPEG files are rejected', async () => {
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
  const response = await post(form(validFields, [{ group: 'inspiration', bytes: png, name: 'idea.png', type: 'image/png' }]));
  assert.equal(response.status, 400);
});

test('more than 8 space photos or 4 inspiration images is rejected', async () => {
  const nine = Array.from({ length: 9 }, (_, i) => ({ group: 'space', bytes: realPhoto, name: `s${i}.jpg` }));
  const response = await post(form(validFields, nine));
  assert.equal(response.status, 400);
  assert.match(((await response.json()) as { message: string }).message, /up to 8 photos/);

  const five = Array.from({ length: 5 }, (_, i) => ({ group: 'inspiration', bytes: realPhoto, name: `i${i}.jpg` }));
  const response2 = await post(form(validFields, five));
  assert.equal(response2.status, 400);
  assert.match(((await response2.json()) as { message: string }).message, /up to 4 inspiration/);
});

test('a file over 10 MB is rejected', async () => {
  const big = Buffer.concat([realPhoto.subarray(0, 4), Buffer.alloc(10 * 1024 * 1024 + 1)]);
  const response = await post(form(validFields, [{ group: 'space', bytes: big, name: 'huge.jpg' }]));
  assert.equal(response.status, 400);
  assert.match(((await response.json()) as { message: string }).message, /too large/);
});

test('honeypot submissions look successful but send nothing', async () => {
  const before = emailFiles().length;
  const response = await post(form({ ...validFields, company: 'Spam Inc' }));
  assert.equal(response.status, 200);
  assert.equal(((await response.json()) as { ok: boolean }).ok, true);
  assert.equal(emailFiles().length, before);
});

test('a missing Turnstile token is refused', async () => {
  const data = new FormData();
  for (const [key, value] of Object.entries(validFields)) data.append(key, value);
  const response = await post(data);
  assert.equal(response.status, 403);
  assert.equal(((await response.json()) as { code: string }).code, 'verification');
});

test('wrong method and content type are refused', async () => {
  assert.equal((await fetch(`${BASE}/api/quote`)).status, 405);
  assert.equal((await post('name=x', 'application/json', { 'Content-Type': 'application/x-www-form-urlencoded' })).status, 415);
});

test('a plain form post (no JavaScript) redirects to the thank-you page', async () => {
  const response = await post(form(), 'text/html');
  assert.equal(response.status, 303);
  assert.match(response.headers.get('Location') ?? '', /\/contact\/thanks\?ref=VBS-\d{4}-[A-Z2-9]{6}$/);
});
