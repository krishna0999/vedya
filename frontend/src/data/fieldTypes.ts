// Field-type catalog for the builder: palette display + default-field factory.
// The renderer/validator are driven by the schema; this is builder-only metadata.
import type { DatePreset, Field, FieldType } from '@schema';

// Predefined date presets a creator can add to a date field in the builder.
export const DATE_PRESET_CATALOG: DatePreset[] = [
  { label: 'Today', offsetDays: 0 },
  { label: 'Tomorrow', offsetDays: 1 },
  { label: 'In 3 days', offsetDays: 3 },
  { label: 'In a week', offsetDays: 7 },
  { label: 'In two weeks', offsetDays: 14 },
  { label: 'In a month', offsetDays: 30 },
];

export interface FieldTypeMeta {
  type: FieldType;
  label: string; // palette label
  hasOptions: boolean; // select-family
  group: 'text' | 'choice' | 'date' | 'other';
}

export const FIELD_TYPES: FieldTypeMeta[] = [
  { type: 'short_text', label: 'Short text', hasOptions: false, group: 'text' },
  { type: 'long_text', label: 'Long text', hasOptions: false, group: 'text' },
  { type: 'email', label: 'Email', hasOptions: false, group: 'text' },
  { type: 'phone', label: 'Phone', hasOptions: false, group: 'text' },
  { type: 'number', label: 'Number', hasOptions: false, group: 'text' },
  { type: 'single_select', label: 'Single choice', hasOptions: true, group: 'choice' },
  { type: 'multi_select', label: 'Multiple choice', hasOptions: true, group: 'choice' },
  { type: 'dropdown', label: 'Dropdown', hasOptions: true, group: 'choice' },
  { type: 'multi_dropdown', label: 'Multi-select dropdown', hasOptions: true, group: 'choice' },
  { type: 'date', label: 'Date', hasOptions: false, group: 'date' },
  { type: 'rating', label: 'Rating', hasOptions: false, group: 'other' },
  { type: 'section_break', label: 'Section break', hasOptions: false, group: 'other' },
];

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
