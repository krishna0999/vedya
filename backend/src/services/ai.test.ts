// Tests for the pure half of AI generation: model output → schema Fields.
// The OpenAI call and persistence are exercised end-to-end manually; identity,
// coercion, and rejection rules are what must never regress.
import { describe, expect, it } from 'vitest';
import { AppError } from '../lib/errors';
import { parseGeneratedForm } from './ai';

const wire = (fields: unknown[]) => JSON.stringify({ title: 'Test form', fields });

describe('parseGeneratedForm', () => {
  it('assigns fresh uuids to every field and option', () => {
    const { fields } = parseGeneratedForm(
      wire([
        { type: 'short_text', label: 'Name' },
        { type: 'single_select', label: 'Size', options: ['S', 'M', 'L'] },
      ]),
    );
    expect(fields).toHaveLength(2);
    expect(fields[0]!.id).toMatch(/^[0-9a-f-]{36}$/);
    const optionIds = fields[1]!.options!.map((o) => o.id);
    expect(new Set([fields[0]!.id, fields[1]!.id, ...optionIds]).size).toBe(5);
  });

  it('degrades a select without at least two options to short_text', () => {
    const { fields } = parseGeneratedForm(
      wire([{ type: 'dropdown', label: 'Pick one', options: ['Only'] }]),
    );
    expect(fields[0]!.type).toBe('short_text');
    expect(fields[0]!.options).toBeUndefined();
  });

  it('drops options on non-select types and dedupes select options', () => {
    const { fields } = parseGeneratedForm(
      wire([
        { type: 'short_text', label: 'Name', options: ['a', 'b'] },
        { type: 'multi_select', label: 'Days', options: ['Mon', 'mon', 'Tue'] },
      ]),
    );
    expect(fields[0]!.options).toBeUndefined();
    expect(fields[1]!.options!.map((o) => o.label)).toEqual(['Mon', 'Tue']);
  });

  it('builds a full DateConfig and never marks a section_break required', () => {
    const { fields } = parseGeneratedForm(
      wire([
        { type: 'date', label: 'Stay', date: { mode: 'range' }, required: true },
        { type: 'section_break', label: 'About you', required: true },
      ]),
    );
    expect(fields[0]!.date).toEqual({ mode: 'range', showPresets: false, presets: [] });
    expect(fields[0]!.required).toBe(true);
    expect(fields[1]!.required).toBe(false);
  });

  it('clamps rating stars and defaults them to 5', () => {
    const { fields } = parseGeneratedForm(
      wire([
        { type: 'rating', label: 'Score' },
        { type: 'rating', label: 'Huge', validation: { max: 50 } },
      ]),
    );
    expect(fields[0]!.validation).toEqual({ max: 5 });
    expect(fields[1]!.validation).toEqual({ max: 10 });
  });

  it('keeps only the validation keys that fit the type', () => {
    const { fields } = parseGeneratedForm(
      wire([
        { type: 'number', label: 'Age', validation: { min: 18, maxLength: 3 } },
        { type: 'short_text', label: 'Bio', validation: { maxLength: 100, max: 9 } },
      ]),
    );
    expect(fields[0]!.validation).toEqual({ min: 18 });
    expect(fields[1]!.validation).toEqual({ maxLength: 100 });
  });

  it('rejects non-JSON and structurally invalid output with a 502', () => {
    expect(() => parseGeneratedForm('not json')).toThrowError(AppError);
    try {
      parseGeneratedForm(JSON.stringify({ title: 'No fields', fields: [] }));
      expect.unreachable();
    } catch (err) {
      expect((err as AppError).statusCode).toBe(502);
    }
  });
});
