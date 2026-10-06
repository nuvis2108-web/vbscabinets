// vbs-quote-mailer — sends quote notifications to VBS. Pages Functions can't use the send_email binding,
// so the Pages Function calls this Worker through a service binding. It has no public URL
// (workers_dev and preview_urls are off), and its binding can only deliver to vbscustom@gmail.com.

import { EmailMessage } from 'cloudflare:email';
import { buildMime } from './mime';

interface Env {
  MAILER: SendEmail;
  FROM_ADDRESS: string;
  FROM_NAME: string;
  TO_ADDRESS: string;
}

interface SendRequest {
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
}

const EMAIL = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]{2,}$/;

function parse(body: unknown): SendRequest | null {
  if (!body || typeof body !== 'object') return null;
  const { subject, text, html, replyTo } = body as Record<string, unknown>;
  if (typeof subject !== 'string' || typeof text !== 'string' || typeof html !== 'string') return null;
  if (!subject || subject.length > 300 || text.length > 100_000 || html.length > 200_000) return null;
  if (replyTo !== undefined && (typeof replyTo !== 'string' || !EMAIL.test(replyTo))) return null;
  return { subject, text, html, replyTo };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });

    const message = parse(await request.json().catch(() => null));
    if (!message) return new Response('Invalid message', { status: 400 });

    const raw = buildMime({
      from: { name: env.FROM_NAME, address: env.FROM_ADDRESS },
      to: env.TO_ADDRESS,
      replyTo: message.replyTo,
      subject: message.subject,
      text: message.text,
      html: message.html,
      domain: env.FROM_ADDRESS.split('@')[1],
    });

    try {
      await env.MAILER.send(new EmailMessage(env.FROM_ADDRESS, env.TO_ADDRESS, raw));
    } catch (error) {
      console.error('mailer: send failed', error instanceof Error ? error.message : error);
      return new Response('Send failed', { status: 502 });
    }
    return new Response('Sent', { status: 200 });
  },
} satisfies ExportedHandler<Env>;
