// Builds the notification email VBS receives for each quote request. Sending happens in the
// vbs-quote-mailer Worker (workers/quote-mailer), because Pages Functions can't use send_email directly.

import { formatPhone, phoneDigits, type QuoteFields } from '../lib/quote-rules';

export interface PhotoLink {
  label: string;
  url: string;
}

export interface QuoteEmail {
  subject: string;
  text: string;
  html: string;
  replyTo: string;
}

interface QuoteEmailInput {
  fields: QuoteFields;
  reference: string;
  submittedAt: Date;
  galleryUrl: string | null;
  photos: PhotoLink[];
  linkDays: number;
  /** Prefixes the subject so preview/test emails can't be mistaken for real leads. */
  environment?: string;
}

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function buildQuoteEmail(input: QuoteEmailInput): QuoteEmail {
  const { fields, reference, galleryUrl, photos } = input;
  const digits = phoneDigits(fields.phone);
  const phone = digits ? formatPhone(digits) : fields.phone;
  const submitted = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Toronto',
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(input.submittedAt);

  const prefix = input.environment && input.environment !== 'production' ? `[${input.environment.toUpperCase()}] ` : '';
  const subject = `${prefix}Quote request · ${fields.projectType} · ${fields.city} · ${reference}`;

  const rows: [string, string][] = [
    ['Reference', reference],
    ['Name', fields.name],
    ['Phone', phone],
    ['Email', fields.email],
    ['City', fields.city],
    ['Project type', fields.projectType],
    ['Rough dimensions', fields.dimensions || 'Not provided'],
  ];

  const spaceCount = photos.filter((photo) => photo.label.startsWith('Space')).length;
  const inspirationCount = photos.length - spaceCount;
  const photoSummary = photos.length
    ? `${spaceCount} of the space, ${inspirationCount} inspiration`
    : 'No photos were attached.';

  const text = [
    `New quote request — ${reference}`,
    `Submitted ${submitted}`,
    '',
    ...rows.map(([label, value]) => `${label}: ${value}`),
    '',
    'Project description:',
    fields.description,
    '',
    `Photos: ${photoSummary}`,
    ...(galleryUrl ? [`View all photos: ${galleryUrl}`, ''] : []),
    ...photos.map((photo) => `${photo.label}: ${photo.url}`),
    '',
    `Photo links expire after ${input.linkDays} days. Reply to this email to answer the customer directly.`,
  ].join('\n');

  const rowHtml = rows
    .map(
      ([label, value]) =>
        `<tr><th align="left" style="padding:6px 16px 6px 0;color:#625b54;font-weight:600;vertical-align:top">${escapeHtml(label)}</th>` +
        `<td style="padding:6px 0">${escapeHtml(value)}</td></tr>`,
    )
    .join('');

  const photoHtml = photos.length
    ? `<p style="margin:24px 0 8px"><strong>Photos:</strong> ${escapeHtml(photoSummary)}</p>` +
      (galleryUrl
        ? `<p style="margin:0 0 16px"><a href="${escapeHtml(galleryUrl)}" style="display:inline-block;background:#171717;color:#ffffff;padding:12px 20px;border-radius:4px;text-decoration:none;font-weight:600">View all photos</a></p>`
        : '') +
      `<ul style="margin:0;padding-left:20px">${photos
        .map((photo) => `<li><a href="${escapeHtml(photo.url)}">${escapeHtml(photo.label)}</a></li>`)
        .join('')}</ul>`
    : `<p style="margin:24px 0 0">${escapeHtml(photoSummary)}</p>`;

  const html = `<!doctype html><html><body style="margin:0;padding:24px;background:#f7f4ef;font-family:Arial,Helvetica,sans-serif;color:#171717;font-size:15px;line-height:1.5">
<div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e4ddd3;border-radius:4px;padding:24px">
<p style="margin:0;color:#7d5f40;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase">New quote request</p>
<h1 style="margin:8px 0 4px;font-size:22px;font-weight:600">${escapeHtml(fields.projectType)} · ${escapeHtml(fields.city)}</h1>
<p style="margin:0 0 16px;color:#625b54">Submitted ${escapeHtml(submitted)}</p>
<table cellpadding="0" cellspacing="0" style="border-collapse:collapse">${rowHtml}</table>
<p style="margin:24px 0 8px"><strong>Project description</strong></p>
<p style="margin:0;white-space:pre-wrap">${escapeHtml(fields.description)}</p>
${photoHtml}
<p style="margin:24px 0 0;color:#625b54;font-size:13px">Photo links expire after ${input.linkDays} days. Reply to this email to answer the customer directly.</p>
</div></body></html>`;

  return { subject, text, html, replyTo: fields.email };
}
