// Server-side Cloudflare Turnstile check. Tokens are single-use and expire after 5 minutes.

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
export const TURNSTILE_ACTION = 'quote';

interface VerifyResult {
  success: boolean;
  action?: string;
  'error-codes'?: string[];
}

export async function verifyTurnstile(secret: string, token: string, ip: string | null): Promise<boolean> {
  if (!token || token.length > 2048) return false;

  const body = new FormData();
  body.append('secret', secret);
  body.append('response', token);
  if (ip) body.append('remoteip', ip);

  try {
    const response = await fetch(VERIFY_URL, { method: 'POST', body });
    if (!response.ok) return false;
    const result = (await response.json()) as VerifyResult;
    // Cloudflare's test keys return an empty action, so only compare it when one is present.
    if (result.action && result.action !== TURNSTILE_ACTION) return false;
    return result.success === true;
  } catch {
    return false;
  }
}
