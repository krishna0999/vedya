// Field-type catalog for the builder: palette display + default-field factory.
// The renderer/validator are driven by the schema; this is builder-only metadata.
import type { DatePreset, Field, FieldType } from '@schema';
import type { IconName } from '@/lib/icons';

// Predefined date presets a creator can add to a date field in the builder.
export const DATE_PRESET_CATALOG: DatePreset[] = [
  { label: 'Today', offsetDays: 0 },
  { label: 'Tomorrow', offsetDays: 1 },
  { label: 'In 3 days', offsetDays: 3 },
  { label: 'In a week', offsetDays: 7 },
  { label: 'In two weeks', offsetDays: 14 },
  { label: 'In a month', offsetDays: 30 },
];

export type FieldCategory = 'Basic' | 'Choice' | 'Advanced';

export interface FieldTypeMeta {
  type: FieldType;
  label: string; // palette label
  hasOptions: boolean; // select-family
  icon: IconName; // palette card glyph
  category: FieldCategory; // palette grouping
}

export const FIELD_TYPES: FieldTypeMeta[] = [
  { type: 'short_text', label: 'Short text', hasOptions: false, icon: 'text-t', category: 'Basic' },
  { type: 'long_text', label: 'Long text', hasOptions: false, icon: 'bars-3-bottom-left', category: 'Basic' },
  { type: 'email', label: 'Email', hasOptions: false, icon: 'envelope', category: 'Basic' },
  { type: 'phone', label: 'Phone', hasOptions: false, icon: 'phone', category: 'Basic' },
  { type: 'number', label: 'Number', hasOptions: false, icon: 'hashtag', category: 'Basic' },
  { type: 'single_select', label: 'Single choice', hasOptions: true, icon: 'circle-dot', category: 'Choice' },
  { type: 'multi_select', label: 'Multiple choice', hasOptions: true, icon: 'checkbox', category: 'Choice' },
  { type: 'dropdown', label: 'Dropdown', hasOptions: true, icon: 'select-box', category: 'Choice' },
  { type: 'multi_dropdown', label: 'Multi-select dropdown', hasOptions: true, icon: 'list-bullet', category: 'Choice' },
  { type: 'date', label: 'Date', hasOptions: false, icon: 'calendar', category: 'Advanced' },
  { type: 'rating', label: 'Rating', hasOptions: false, icon: 'star-outline', category: 'Advanced' },
  { type: 'section_break', label: 'Section break', hasOptions: false, icon: 'minus', category: 'Advanced' },
];

export const FIELD_CATEGORIES: FieldCategory[] = ['Basic', 'Choice', 'Advanced'];

const META_BY_TYPE = new Map(FIELD_TYPES.map((m) => [m.type, m]));

export function metaFor(type: FieldType): FieldTypeMeta | undefined {
  return META_BY_TYPE.get(type);
}

export function typeHasOptions(type: FieldType): boolean {
  return META_BY_TYPE.get(type)?.hasOptions ?? false;
}

const DEFAULT_LABEL: Record<FieldType, string> = {
  short_text: 'Short text',
  long_text: 'Long text',
  email: 'Email',
  phone: 'Phone',
  number: 'Number',
  single_select: 'Single choice',
  multi_select: 'Multiple choice',
  dropdown: 'Dropdown',
  multi_dropdown: 'Multi-select dropdown',
  date: 'Date',
  rating: 'Rating',
  section_break: 'Section',
};

function uuid(): string {
  return crypto.randomUUID();
}

// Build a fresh field with sensible defaults for its type.
export function makeField(type: FieldType): Field {
  const field: Field = {
    id: uuid(),
    type,
    label: DEFAULT_LABEL[type],
    required: false,
  };
  if (typeHasOptions(type)) {
    field.options = [
      { id: uuid(), label: 'Option 1' },
      { id: uuid(), label: 'Option 2' },
    ];
  }
  if (type === 'rating') field.validation = { max: 5 };
  if (type === 'date') {
    field.date = {
      mode: 'single',
      showPresets: true,
      presets: [
        { label: 'Today', offsetDays: 0 },
        { label: 'Tomorrow', offsetDays: 1 },
      ],
    };
  }
  return field;
}

export function makeOption(label = 'New option'): { id: string; label: string } {
  return { id: uuid(), label };
}
