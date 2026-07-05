// Template library service. Listing is static catalog data; instantiation clones
// a template into a real, owner-scoped form. Regenerating every field and option
// id on instantiation means each created form owns its identity — two forms from
// the same template never share a field id (CLAUDE.md §3 non-negotiable #1).
import { randomUUID } from 'node:crypto';
import type { Field, FormDraft, Theme } from '../schema/index';
import { DEFAULT_THEME } from '../lib/theme';
import { notFound } from '../lib/errors';
import { TEMPLATE_CATEGORIES, TEMPLATES, findTemplate } from '../data/templates';
import { createFormWith } from './forms';

// Card shape for the gallery — the catalog minus the (heavier) fields array,
// plus a field count for the card. Includes fields for client-side preview.
export interface TemplateSummary {
  id: string;
  title: string;
  category: string;
  description: string;
  icon: string;
  fieldCount: number;
  fields: Field[];
}

export function listTemplates(): { categories: string[]; templates: TemplateSummary[] } {
  return {
    categories: TEMPLATE_CATEGORIES,
    templates: TEMPLATES.map((t) => ({
      id: t.id,
      title: t.title,
      category: t.category,
      description: t.description,
      icon: t.icon,
      // section_break fields are presentational; keep them in the preview but
      // don't count them as questions.
      fieldCount: t.fields.filter((fld) => fld.type !== 'section_break').length,
      fields: t.fields,
    })),
  };
}

// Deep-clone a template's fields, assigning a fresh uuid to every field and every
// option so the instantiated form shares no identity with the template or with
// any other form built from it.
export function cloneFieldsWithFreshIds(fields: Field[]): Field[] {
  return fields.map((field) => {
    const next: Field = { ...field, id: randomUUID() };
    if (field.options) {
      next.options = field.options.map((o) => ({ ...o, id: randomUUID() }));
    }
    return next;
  });
}

export async function createFormFromTemplate(ownerId: string, templateId: string): Promise<FormDraft> {
  const template = findTemplate(templateId);
  if (!template) throw notFound('Template');
  const theme: Theme = { ...DEFAULT_THEME, ...template.theme };
  return createFormWith(ownerId, {
    title: template.title,
    fields: cloneFieldsWithFreshIds(template.fields),
    theme,
  });
}
