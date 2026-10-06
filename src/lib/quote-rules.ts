// Request a Quote — field rules shared by the browser form (src/components/QuoteForm.astro)
// and the Pages Function (functions/api/quote.ts), so both sides always agree.
// Plain TypeScript with no imports: it has to run in the browser, in Workers and under `node --test`.

export const PROJECT_TYPES = [
  'Kitchen cabinetry',
  'Closet',
  'Media wall / TV wall',
  'Fireplace built-in',
  'Other built-in',
  'Custom furniture / woodworking',
  'Floating shelves',
  'Garage shelving',
  'Sliding doors',
  'Other',
] as const;

export const UPLOAD_LIMITS = {
  /** Photos of the space as it is now. */
  space: 8,
  /** Inspiration images. */
  inspiration: 4,
  /** Per file, after browser resizing (a resized photo is normally under 1 MB). */
  fileBytes: 10 * 1024 * 1024,
  /** Whole request. The Workers free plan allows 100 MB; we stay well under it. */
  requestBytes: 60 * 1024 * 1024,
  /** Longest edge of a resized photo, in pixels. */
  resizeEdge: 2000,
  /** JPEG quality used when re-encoding in the browser. */
  jpegQuality: 0.82,
} as const;

export type PhotoGroup = 'space' | 'inspiration';

export interface QuoteFields {
  name: string;
  phone: string;
  email: string;
  city: string;
  projectType: string;
  dimensions: string;
  description: string;
}

export type FieldName = keyof QuoteFields;
export type FieldErrors = Partial<Record<FieldName, string>>;

export const FIELD_NAMES: FieldName[] = ['name', 'phone', 'email', 'city', 'projectType', 'dimensions', 'description'];

const MAX_LENGTH: Record<FieldName, number> = {
  name: 100,
  phone: 30,
  email: 254,
  city: 100,
  projectType: 60,
  dimensions: 200,
  description: 3000,
};

// Control characters other than tab and newline. Single-line fields also lose tabs and newlines.
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const LINE_BREAKS = /[\t\r\n]+/g;

/** Trims, strips control characters and caps every field. Unknown keys are ignored. */
export function normaliseFields(raw: Partial<Record<string, unknown>>): QuoteFields {
  const clean = (name: FieldName, multiline = false) => {
    let value = typeof raw[name] === 'string' ? (raw[name] as string) : '';
    value = value.replace(CONTROL_CHARS, '');
    value = multiline ? value.replace(/\r\n?/g, '\n') : value.replace(LINE_BREAKS, ' ');
    return value.trim().slice(0, MAX_LENGTH[name]);
  };

  return {
    name: clean('name'),
    phone: clean('phone'),
    email: clean('email').toLowerCase(),
    city: clean('city'),
    projectType: clean('projectType'),
    dimensions: clean('dimensions'),
    description: clean('description', true),
  };
}

/** 10-digit North American number, digits only, or null if it isn't one. Accepts a leading 1 / +1. */
export function phoneDigits(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return digits;
  if (digits.length === 11 && digits.startsWith('1')) return digits.slice(1);
  return null;
}

export function formatPhone(digits: string): string {
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}

// Deliberately simple: one @, no spaces, a dot in the domain. The real check is VBS replying.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Validates one field. Returns an error message, or undefined when the value is fine. */
export function validateField(name: FieldName, value: string): string | undefined {
  switch (name) {
    case 'name':
      if (!value) return 'Enter your name.';
      if (value.length < 2) return 'Enter your full name.';
      return;
    case 'phone':
      if (!value) return 'Enter your phone number.';
      if (!phoneDigits(value)) return 'Enter a 10-digit phone number, for example 905-555-0123.';
      return;
    case 'email':
      if (!value) return 'Enter your email address.';
      if (!EMAIL.test(value)) return 'Enter an email address like name@example.com.';
      return;
    case 'city':
      if (!value) return 'Enter the city or town where the project is.';
      return;
    case 'projectType':
      if (!value) return 'Choose a project type.';
      if (!(PROJECT_TYPES as readonly string[]).includes(value)) return 'Choose a project type from the list.';
      return;
    case 'dimensions':
      return;
    case 'description':
      if (!value) return 'Tell us a little about the project.';
      if (value.length < 20) return 'Add a little more detail — at least 20 characters.';
      return;
  }
}

export function validateFields(fields: QuoteFields): FieldErrors {
  const errors: FieldErrors = {};
  for (const name of FIELD_NAMES) {
    const error = validateField(name, fields[name]);
    if (error) errors[name] = error;
  }
  return errors;
}

export const MESSAGES = {
  tooManyPhotos: (group: PhotoGroup) =>
    group === 'space'
      ? `You can add up to ${UPLOAD_LIMITS.space} photos of the space.`
      : `You can add up to ${UPLOAD_LIMITS.inspiration} inspiration images.`,
  unsupportedImage: (fileName: string) =>
    `“${fileName}” couldn't be prepared for upload. Please choose a JPEG, PNG or WebP image instead.`,
  fileTooLarge: (fileName: string) => `“${fileName}” is too large. Please choose a smaller photo.`,
} as const;
