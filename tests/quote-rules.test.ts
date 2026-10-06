// Run with `npm test` (Node 24 runs TypeScript directly).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { normaliseFields, phoneDigits, validateField, validateFields } from '../src/lib/quote-rules.ts';

const valid = {
  name: 'Jordan Smith',
  phone: '(905) 555-0123',
  email: 'Jordan@Example.com',
  city: 'Burlington',
  projectType: 'Kitchen cabinetry',
  dimensions: '',
  description: 'Two-tone kitchen with an island and pantry wall.',
};

test('a complete request has no errors', () => {
  assert.deepEqual(validateFields(normaliseFields(valid)), {});
});

test('name, phone, email, city, project type and description are required; dimensions are optional', () => {
  const errors = validateFields(normaliseFields({}));
  assert.deepEqual(Object.keys(errors).sort(), ['city', 'description', 'email', 'name', 'phone', 'projectType']);
});

test('phone numbers: 10 digits, with or without a leading 1', () => {
  assert.equal(phoneDigits('905-555-0123'), '9055550123');
  assert.equal(phoneDigits('+1 (905) 555 0123'), '9055550123');
  assert.equal(phoneDigits('555-0123'), null);
  assert.equal(phoneDigits('2 905 555 0123'), null);
  assert.match(validateField('phone', '12345') ?? '', /10-digit/);
});

test('email format', () => {
  assert.equal(validateField('email', 'name@example.com'), undefined);
  assert.ok(validateField('email', 'name@example'));
  assert.ok(validateField('email', 'name example.com'));
});

test('project type must be one of the listed options', () => {
  assert.equal(validateField('projectType', 'Closet'), undefined);
  assert.ok(validateField('projectType', 'Swimming pool'));
});

test('description needs at least 20 characters', () => {
  assert.ok(validateField('description', 'Too short'));
});

test('normalising trims, lower-cases email, strips control characters and caps length', () => {
  const fields = normaliseFields({
    name: '  Jordan\u0007 Smith ',
    email: ' Jordan@Example.COM ',
    city: 'Hamilton\r\nInjected: header',
    description: `Line one\r\nLine two${'x'.repeat(5000)}`,
  });
  assert.equal(fields.name, 'Jordan Smith');
  assert.equal(fields.email, 'jordan@example.com');
  assert.equal(fields.city, 'Hamilton Injected: header');
  assert.ok(fields.description.startsWith('Line one\nLine two'));
  assert.equal(fields.description.length, 3000);
});

test('non-string values are treated as empty', () => {
  assert.equal(normaliseFields({ name: 42 as unknown as string }).name, '');
});
