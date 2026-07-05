// Template catalog integrity + instantiation contract. No DB needed: we test the
// static catalog and the pure id-regeneration helper. The DB-backed
// createFormFromTemplate just clones (tested here) + createFormWith (tested via
// the forms path), so there's nothing extra worth a live database here.
import { describe, expect, it } from 'vitest';
import { DraftPatchSchema } from '../api/schemas';
import { TEMPLATES } from '../data/templates';
import { cloneFieldsWithFreshIds, listTemplates } from './templates';

describe('template catalog', () => {
  it('exposes at least a handful of templates', () => {
    expect(TEMPLATES.length).toBeGreaterThanOrEqual(6);
  });

  it('every template has schema-valid fields', () => {
    for (const t of TEMPLATES) {
      // DraftPatchSchema.fields is z.array(FieldSchema) — the same boundary the
      // builder's autosave goes through. If a template can't parse, the builder
      // couldn't have produced it.
      expect(() => DraftPatchSchema.parse({ fields: t.fields }), t.id).not.toThrow();
    }
  });

  it('has unique field ids and option ids within each template', () => {
    for (const t of TEMPLATES) {
      const fieldIds = t.fields.map((f) => f.id);
      expect(new Set(fieldIds).size, `${t.id} field ids`).toBe(fieldIds.length);
      for (const f of t.fields) {
        if (!f.options) continue;
        const optIds = f.options.map((o) => o.id);
        expect(new Set(optIds).size, `${t.id}.${f.id} option ids`).toBe(optIds.length);
      }
    }
  });

  it('select-family fields always carry options', () => {
    const selectTypes = new Set(['single_select', 'multi_select', 'dropdown', 'multi_dropdown']);
    for (const t of TEMPLATES) {
      for (const f of t.fields) {
        if (selectTypes.has(f.type)) {
          expect(f.options?.length, `${t.id}.${f.id}`).toBeGreaterThan(0);
        }
      }
    }
  });
});

describe('listTemplates', () => {
  it('returns categories and cards with a question count that excludes section breaks', () => {
    const { categories, templates } = listTemplates();
    expect(categories.length).toBeGreaterThan(0);
    for (const card of templates) {
      const nonBreak = card.fields.filter((f) => f.type !== 'section_break').length;
      expect(card.fieldCount).toBe(nonBreak);
    }
  });
});

describe('cloneFieldsWithFreshIds', () => {
  it('assigns fresh ids to every field and option, sharing none with the source', () => {
    const source = TEMPLATES.find((t) => t.fields.some((f) => f.options))!;
    const cloned = cloneFieldsWithFreshIds(source.fields);

    const srcFieldIds = new Set(source.fields.map((f) => f.id));
    for (const f of cloned) {
      expect(srcFieldIds.has(f.id)).toBe(false);
    }

    const srcOptIds = new Set(source.fields.flatMap((f) => f.options?.map((o) => o.id) ?? []));
    const clonedOptIds = cloned.flatMap((f) => f.options?.map((o) => o.id) ?? []);
    for (const id of clonedOptIds) {
      expect(srcOptIds.has(id)).toBe(false);
    }
    expect(new Set(clonedOptIds).size).toBe(clonedOptIds.length);
  });

  it('preserves everything except ids (labels, types, validation)', () => {
    const [first] = cloneFieldsWithFreshIds(TEMPLATES[0]!.fields);
    const src = TEMPLATES[0]!.fields[0]!;
    expect(first!.label).toBe(src.label);
    expect(first!.type).toBe(src.type);
    expect(first!.required).toBe(src.required);
  });

  it('does not mutate the source template', () => {
    const before = JSON.stringify(TEMPLATES[0]!.fields);
    cloneFieldsWithFreshIds(TEMPLATES[0]!.fields);
    expect(JSON.stringify(TEMPLATES[0]!.fields)).toBe(before);
  });
});
