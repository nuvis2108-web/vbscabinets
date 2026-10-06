// Minimal MIME builder for one multipart/alternative message (plain text + HTML), UTF-8, base64 bodies.
// Hand-written to avoid a dependency; it only needs to produce the notification email.

interface MimeInput {
  from: { name: string; address: string };
  to: string;
  replyTo?: string;
  subject: string;
  text: string;
  html: string;
  /** Domain used for the Message-ID. */
  domain: string;
}

const CRLF = '\r\n';

function base64Utf8(value: string): string {
  let binary = '';
  for (const byte of new TextEncoder().encode(value)) binary += String.fromCharCode(byte);
  return btoa(binary);
}

/** Base64 body wrapped at 76 characters, as RFC 2045 requires. */
function base64Body(value: string): string {
  return base64Utf8(value).replace(/.{1,76}/g, (line) => line + CRLF);
}

/** RFC 2047 encoded-word, so names and subjects with accents or "·" survive every mail client. */
function encodeHeader(value: string): string {
  const clean = value.replace(/[\r\n]+/g, ' ');
  return /^[\x20-\x7e]*$/.test(clean) ? clean : `=?UTF-8?B?${base64Utf8(clean)}?=`;
}

export function buildMime(input: MimeInput): string {
  const boundary = `vbs-${crypto.randomUUID()}`;
  const headers = [
    `From: ${encodeHeader(input.from.name)} <${input.from.address}>`,
    `To: <${input.to}>`,
    ...(input.replyTo ? [`Reply-To: <${input.replyTo.replace(/[\r\n<>]/g, '')}>`] : []),
    `Subject: ${encodeHeader(input.subject)}`,
    `Date: ${new Date().toUTCString().replace('GMT', '+0000')}`,
    `Message-ID: <${crypto.randomUUID()}@${input.domain}>`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
  ];

  const part = (type: string, body: string) =>
    [`--${boundary}`, `Content-Type: ${type}; charset=utf-8`, 'Content-Transfer-Encoding: base64', '', base64Body(body)].join(
      CRLF,
    );

  return [headers.join(CRLF), '', part('text/plain', input.text), part('text/html', input.html), `--${boundary}--`, ''].join(
    CRLF,
  );
}
