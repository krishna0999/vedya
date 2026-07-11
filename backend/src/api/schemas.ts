// Zod parsers for API request bodies — the runtime trust boundary (CLAUDE.md §6).
// These parse/validate shape only; the canonical TypeScript types still come from
// @schema. The field-type list here mirrors schema/types.ts FieldType.
import { z } from 'zod';

const FieldTypeSchema = z.enum([
  'short_text', 'long_text', 'email', 'phone', 'number',
  'single_select', 'multi_select', 'dropdown', 'multi_dropdown',
  'date', 'rating', 'section_break',
]);

const FieldOptionSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.string().optional(),
  description: z.string().optional(),
});

const FieldValidationSchema = z.object({
  min: z.number().optional(),
  max: z.number().optional(),
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
  pattern: z.string().optional(),
  patternMessage: z.string().optional(),
});

const DateConfigSchema = z.object({
  mode: z.enum(['single', 'range']),
  showPresets: z.boolean(),
  presets: z.array(z.object({ label: z.string(), offsetDays: z.number() })),
});

const FieldSchema = z.object({
  id: z.string().min(1),
  type: FieldTypeSchema,
  label: z.string(),
  required: z.boolean(),
  description: z.string().optional(),
  placeholder: z.string().optional(),
  options: z.array(FieldOptionSchema).optional(),
  validation: FieldValidationSchema.optional(),
  date: DateConfigSchema.optional(),
  visibleIf: z.unknown().optional(), // reserved (§9) — passed through untouched
});

const ThemeSchema = z.object({
  primaryColor: z.string(),
  fontFamily: z.string(),
  borderRadius: z.number(),
});

export const CreateFormSchema = z.object({
  title: z.string().optional(),
});

// Instantiate a form from a catalog template. The id is a stable template slug;
// the service validates it exists (404 otherwise).
export const FromTemplateSchema = z.object({
  templateId: z.string().min(1),
});

// AI generation: the user's natural-language description of the form they want.
export const GenerateFormSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(10, 'Describe the form in at least a few words.')
    .max(1000, 'Keep the description under 1000 characters.'),
});

// Autosave patch: any subset of the editable draft. Fields must all parse if present.
export const DraftPatchSchema = z
  .object({
    title: z.string().optional(),
    fields: z.array(FieldSchema).optional(),
    theme: ThemeSchema.optional(),
  })
  .strict();

export const SubmissionBodySchema = z.object({
  answers: z.record(z.string(), z.unknown()),
});

const PasswordSchema = z.string().min(8, 'Password must be at least 8 characters.').max(256);

export const CredentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  password: PasswordSchema,
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Enter your current password.'),
  newPassword: PasswordSchema,
});

// Empty string clears the name (stored as NULL); the UI falls back to email.
export const UpdateProfileSchema = z.object({
  name: z.string().trim().max(80, 'Name must be 80 characters or fewer.'),
});
