// Run with `npm test`. Covers metadata stripping, signed photo links and the email MIME builder.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isIsoMediaImage, isJpeg, stripJpegMetadata } from '../src/server/jpeg.ts';
import { linkExpiry, signedUrl, verifySignedPath } from '../src/server/signed-links.ts';
import { buildMime } from '../workers/quote-mailer/src/mime.ts';

const segment = (marker: number, payload: number[]) => [0xff, marker, (payload.length + 2) >> 8, (payload.length + 2) & 0xff, ...payload];
const ascii = (text: string) => Array.from(text, (char) => char.charCodeAt(0));

// SOI, APP0 (JFIF), APP1 (Exif with a fake GPS tag), APP2 (ICC), COM, DQT, SOS + scan data, EOI
const jpegWithMetadata = new Uint8Array([
  0xff, 0xd8,
  ...segment(0xe0, ascii('JFIF\0')),
  ...segment(0xe1, ascii('Exif\0\0GPSLatitude=43.25')),
  ...segment(0xe2, ascii('ICC_PROFILE')),
  ...segment(0xfe, ascii('camera comment')),
  ...segment(0xdb, [0, 1, 2, 3]),
  0xff, 0xda, 0x00, 0x02, 0x11, 0x22, 0x33,
  0xff, 0xd9,
]);

test('strips EXIF/GPS, ICC and comment segments but keeps image data', () => {
  const stripped = stripJpegMetadata(jpegWithMetadata);
  assert.ok(stripped);
  const text = String.fromCharCode(...stripped);
  assert.ok(!text.includes('Exif'));
  assert.ok(!text.includes('GPS'));
  assert.ok(!text.includes('ICC_PROFILE'));
  assert.ok(!text.includes('camera comment'));
  assert.ok(text.includes('JFIF'));
  // Everything from start-of-scan onwards is byte-identical.
  const sos = jpegWithMetadata.indexOf(0xda) - 1;
  assert.deepEqual(stripped.slice(stripped.length - (jpegWithMetadata.length - sos)), jpegWithMetadata.slice(sos));
});

test('rejects non-JPEG and malformed files', () => {
  const heic = new Uint8Array([0, 0, 0, 0x18, ...ascii('ftypheic'), 0, 0, 0, 0]);
  assert.equal(stripJpegMetadata(heic), null);
  assert.ok(isIsoMediaImage(heic));
  assert.equal(stripJpegMetadata(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a])), null);
  assert.equal(isJpeg(new Uint8Array([0xff, 0xd8])), false);
  // Segment length runs past the end of the file.
  assert.equal(stripJpegMetadata(new Uint8Array([0xff, 0xd8, 0xff, 0xe1, 0x40, 0x00, 0x01])), null);
});

const secret = 'test-secret';
const path = '/photos/0f8fad5b-d9cb-469f-a165-70867728950e/space-01.jpg';

test('signed links verify for the exact path until they expire', async () => {
  const expires = linkExpiry();
  const url = new URL(await signedUrl('https://vbscabinets.ca', path, expires, secret));
  const exp = url.searchParams.get('exp');
  const sig = url.searchParams.get('sig');

  assert.equal(await verifySignedPath(path, exp, sig, secret), true);
  assert.equal(await verifySignedPath(path.replace('01', '02'), exp, sig, secret), false, 'other photo');
  assert.equal(await verifySignedPath(path, String(expires + 1), sig, secret), false, 'changed expiry');
  assert.equal(await verifySignedPath(path, exp, sig, 'wrong-secret'), false, 'wrong secret');
  assert.equal(await verifySignedPath(path, exp, null, secret), false, 'missing signature');
  assert.equal(await verifySignedPath(path, exp, 'not*base64', secret), false, 'garbage signature');
  const afterExpiry = (expires + 1) * 1000;
  assert.equal(await verifySignedPath(path, exp, sig, secret, afterExpiry), false, 'expired');
});

test('links last 30 days', () => {
  const now = Date.UTC(2026, 9, 6);
  assert.equal(linkExpiry(now) - now / 1000, 30 * 24 * 60 * 60);
});

test('MIME message: headers, UTF-8 encoding and no header injection', () => {
  const raw = buildMime({
    from: { name: 'VBS Quote Form', address: 'quotes@vbscabinets.ca' },
    to: 'vbscustom@gmail.com',
    replyTo: 'customer@example.com',
    subject: 'Quote request · Kitchen cabinetry · Burlington\r\nBcc: attacker@example.com',
    text: 'Café — 12 ft wall',
    html: '<p>Café — 12 ft wall</p>',
    domain: 'vbscabinets.ca',
  });
  const [head] = raw.split('\r\n\r\n');
  assert.match(head, /^From: VBS Quote Form <quotes@vbscabinets\.ca>$/m);
  assert.match(head, /^To: <vbscustom@gmail\.com>$/m);
  assert.match(head, /^Reply-To: <customer@example\.com>$/m);
  assert.match(head, /^Subject: =\?UTF-8\?B\?[A-Za-z0-9+/=]+\?=$/m);
  assert.doesNotMatch(head, /^Bcc:/m);
  assert.match(head, /^Content-Type: multipart\/alternative; boundary="vbs-/m);

  const subject = /^Subject: =\?UTF-8\?B\?(.+)\?=$/m.exec(head)![1];
  assert.equal(Buffer.from(subject, 'base64').toString('utf8'), 'Quote request · Kitchen cabinetry · Burlington Bcc: attacker@example.com');

  const textPart = raw.split('Content-Type: text/plain; charset=utf-8\r\nContent-Transfer-Encoding: base64\r\n\r\n')[1].split('\r\n--')[0];
  assert.equal(Buffer.from(textPart.replace(/\r\n/g, ''), 'base64').toString('utf8'), 'Café — 12 ft wall');
});
