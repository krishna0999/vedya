import { describe, it, expect } from 'vitest';
import { validateAnswers } from './validate';
import type { Field, FormVersion } from './types';

// Build a FormVersion around a set of fields with sane frozen-version metadata.
function versionOf(fields: Field[]): FormVersion {
  return {
    versionId: 'v-1',
    formId: 'f-1',
    version: 1,
    fields,
    theme: { primaryColor: '#000', fontFamily: 'Inter', borderRadius: 8 },
    publishedAt: '2026-07-04T00:00:00.000Z',
  };
}

// Minimal field factory — override what a test cares about.
function field(partial: Partial<Field> & Pick<Field, 'id' | 'type'>): Field {
  return { label: partial.id, required: false, ...partial };
}

describe('required / empties', () => {
  it('flags a required field that is missing, empty string, or whitespace', () => {
    const f = versionOf([field({ id: 'name', type: 'short_text', required: true })]);
    expect(validateAnswers(f, {}).errors.name).toBeDefined();
    expect(validateAnswers(f, { name: '' }).errors.name).toBeDefined();
    expect(validateAnswers(f, { name: '   ' }).errors.name).toBeDefined();
  });

  it('passes an optional field left empty, skipping type checks', () => {
    const f = versionOf([field({ id: 'age', type: 'number' })]);
    const res = validateAnswers(f, {});
    expect(res.valid).toBe(true);
    expect(res.errors).toEqual({});
  });

  it('treats an empty array as empty for required multi_select', () => {
    const f = versionOf([field({ id: 'tags', type: 'multi_select', required: true, options: [{ id: 'o1', label: 'A' }] })]);
    expect(validateAnswers(f, { tags: [] }).errors.tags).toBeDefined();
  });
});

describe('text: length + pattern', () => {
  const f = versionOf([
    field({ id: 't', type: 'short_text', validation: { minLength: 2, maxLength: 5, pattern: '^[a-z]+$', patternMessage: 'lowercase only' } }),
  ]);
  it('enforces min/max length', () => {
    expect(validateAnswers(f, { t: 'a' }).errors.t).toContain('at least 2');
    expect(validateAnswers(f, { t: 'abcdef' }).errors.t).toContain('at most 5');
  });
  it('enforces pattern with custom message', () => {
    expect(validateAnswers(f, { t: 'AB' }).errors.t).toBe('lowercase only');
    expect(validateAnswers(f, { t: 'abc' }).valid).toBe(true);
  });
  it('does not punish the respondent for an author-supplied invalid regex', () => {
    const bad = versionOf([field({ id: 't', type: 'short_text', validation: { pattern: '([' } })]);
    expect(validateAnswers(bad, { t: 'anything' }).valid).toBe(true);
  });
});

describe('email', () => {
  const f = versionOf([field({ id: 'e', type: 'email', required: true })]);
  it('accepts a well-formed address', () => {
    expect(validateAnswers(f, { e: 'a@b.co' }).valid).toBe(true);
  });
  it('rejects malformed addresses', () => {
    for (const bad of ['nope', 'a@b', 'a b@c.com', '@b.co']) {
      expect(validateAnswers(f, { e: bad }).errors.e).toBeDefined();
    }
  });
});

describe('number / rating: type + bounds', () => {
  const f = versionOf([field({ id: 'n', type: 'number', validation: { min: 1, max: 10 } })]);
  it('rejects non-number types (never trust the client)', () => {
    expect(validateAnswers(f, { n: '5' }).errors.n).toBe('Enter a number.');
    expect(validateAnswers(f, { n: NaN }).errors.n).toBe('Enter a number.');
  });
  it('enforces min/max', () => {
    expect(validateAnswers(f, { n: 0 }).errors.n).toContain('at least 1');
    expect(validateAnswers(f, { n: 11 }).errors.n).toContain('at most 10');
    expect(validateAnswers(f, { n: 5 }).valid).toBe(true);
  });
  it('rating uses the same numeric-bounds rules', () => {
    const r = versionOf([field({ id: 'r', type: 'rating', validation: { min: 1, max: 5 } })]);
    expect(validateAnswers(r, { r: 6 }).errors.r).toContain('at most 5');
    expect(validateAnswers(r, { r: 4 }).valid).toBe(true);
  });
});

describe('selects: membership', () => {
  const opts = [
    { id: 'o1', label: 'Red', value: 'red' },
    { id: 'o2', label: 'Green' }, // value defaults to label
  ];
  it('single_select / dropdown must be a known option value', () => {
    const f = versionOf([field({ id: 's', type: 'single_select', options: opts })]);
    expect(validateAnswers(f, { s: 'red' }).valid).toBe(true);
    expect(validateAnswers(f, { s: 'Green' }).valid).toBe(true); // defaulted value
    expect(validateAnswers(f, { s: 'blue' }).errors.s).toBeDefined();
  });
  it('multi_select checks every item and selection count via min/max', () => {
    const f = versionOf([field({ id: 'm', type: 'multi_select', options: opts, validation: { min: 1, max: 1 } })]);
    expect(validateAnswers(f, { m: ['red'] }).valid).toBe(true);
    expect(validateAnswers(f, { m: ['red', 'nope'] }).errors.m).toBeDefined();
    expect(validateAnswers(f, { m: ['red', 'Green'] }).errors.m).toContain('at most 1');
  });
  it('multi_dropdown validates identically to multi_select', () => {
    const f = versionOf([field({ id: 'm', type: 'multi_dropdown', options: opts, required: true })]);
    expect(validateAnswers(f, { m: ['red', 'Green'] }).valid).toBe(true);
    expect(validateAnswers(f, { m: ['blue'] }).errors.m).toBeDefined();
    expect(validateAnswers(f, { m: [] }).errors.m).toBeDefined();
  });
});

describe('date', () => {
  const f = versionOf([field({ id: 'd', type: 'date' })]);
  it('accepts ISO calendar dates', () => {
    expect(validateAnswers(f, { d: '2026-07-04' }).valid).toBe(true);
  });
  it('rejects non-ISO / invalid dates', () => {
    for (const bad of ['07/04/2026', '2026-13-40', 'yesterday', '2026-7-4']) {
      expect(validateAnswers(f, { d: bad }).errors.d).toBeDefined();
    }
  });
});

describe('date (range mode)', () => {
  const f = versionOf([
    field({ id: 'dr', type: 'date', required: true, date: { mode: 'range', showPresets: false, presets: [] } }),
  ]);
  it('accepts a valid {start,end} object', () => {
    expect(validateAnswers(f, { dr: { start: '2026-07-01', end: '2026-07-10' } }).valid).toBe(true);
    expect(validateAnswers(f, { dr: { start: '2026-07-01', end: '2026-07-01' } }).valid).toBe(true);
  });
  it('rejects reversed, malformed, or missing ranges', () => {
    expect(validateAnswers(f, { dr: { start: '2026-07-10', end: '2026-07-01' } }).errors.dr).toContain('on or after');
    expect(validateAnswers(f, { dr: { start: 'nope', end: '2026-07-01' } }).errors.dr).toBeDefined();
    expect(validateAnswers(f, {}).errors.dr).toBeDefined();
  });
  it('single-mode date still expects an ISO string', () => {
    const single = versionOf([field({ id: 'd', type: 'date', required: true })]);
    expect(validateAnswers(single, { d: '2026-07-04' }).valid).toBe(true);
    expect(validateAnswers(single, { d: { start: '2026-07-01', end: '2026-07-10' } }).errors.d).toBeDefined();
  });
});

describe('section_break', () => {
  it('never produces an error, even when required is somehow set', () => {
    const f = versionOf([field({ id: 'sec', type: 'section_break', required: true })]);
    expect(validateAnswers(f, {}).valid).toBe(true);
  });
});

describe('whole form', () => {
  it('collects errors keyed by Field.id and reports valid=false', () => {
    const f = versionOf([
      field({ id: 'name', type: 'short_text', required: true }),
      field({ id: 'email', type: 'email', required: true }),
      field({ id: 'age', type: 'number', validation: { min: 18 } }),
    ]);
    const res = validateAnswers(f, { email: 'bad', age: 10 });
    expect(res.valid).toBe(false);
    expect(Object.keys(res.errors).sort()).toEqual(['age', 'email', 'name']);
  });

  it('is valid when every field passes and ignores unknown answer keys', () => {
    const f = versionOf([field({ id: 'name', type: 'short_text', required: true })]);
    const res = validateAnswers(f, { name: 'Ada', stray: 'ignored' });
    expect(res.valid).toBe(true);
    expect(res.errors).toEqual({});
  });
});
