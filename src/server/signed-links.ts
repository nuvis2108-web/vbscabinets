// Signed, expiring links to private quote photos. The R2 bucket is never public: the only way to see a
// photo is a /photos/… URL carrying an HMAC-SHA256 signature made with PHOTO_LINK_SECRET.

export const PHOTO_LINK_DAYS = 30;

const encoder = new TextEncoder();

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
    'verify',
  ]);
}

function toBase64Url(bytes: ArrayBuffer): string {
  let binary = '';
  for (const byte of new Uint8Array(bytes)) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) return null;
  const binary = atob(value.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

const message = (path: string, expires: number) => encoder.encode(`${path}\n${expires}`);

/** Expiry timestamp (seconds since epoch) for links created now. */
export function linkExpiry(now = Date.now()): number {
  return Math.floor(now / 1000) + PHOTO_LINK_DAYS * 24 * 60 * 60;
}

export async function signedUrl(origin: string, path: string, expires: number, secret: string): Promise<string> {
  const signature = await crypto.subtle.sign('HMAC', await hmacKey(secret), message(path, expires));
  return `${origin}${path}?exp=${expires}&sig=${toBase64Url(signature)}`;
}

/** True only for an unexpired link whose signature matches this exact path. */
export async function verifySignedPath(
  path: string,
  exp: string | null,
  sig: string | null,
  secret: string,
  now = Date.now(),
): Promise<boolean> {
  if (!exp || !sig || !/^\d{10}$/.test(exp)) return false;
  const expires = Number(exp);
  if (expires < Math.floor(now / 1000)) return false;

  const signature = fromBase64Url(sig);
  if (!signature) return false;
  // crypto.subtle.verify compares in constant time.
  return crypto.subtle.verify('HMAC', await hmacKey(secret), signature, message(path, expires));
}
