// The form schema — the single source of truth (CLAUDE.md §3).
// This module MUST stay zero-runtime-dep and self-contained: no Fastify, no
// Node built-ins. The frontend imports it via the `@schema` Vite alias, so
// anything server-only here would leak into the client bundle.

export type FieldType =
  | 'short_text' | 'long_text' | 'email' | 'phone' | 'number'
  | 'single_select' | 'multi_select' | 'dropdown' | 'multi_dropdown'
  | 'date' | 'date_range' | 'rating' | 'section_break';

// Answer shape for a date_range field (both ends ISO 'YYYY-MM-DD').
export interface DateRangeValue {
  start: string;
  end: string;
}

export interface FieldOption {
  id: string;            // stable uuid (selects only)
  label: string;
  value?: string;        // defaults to label
  description?: string;  // optional helper text shown under the option label
}

export interface FieldValidation {
  min?: number; max?: number;        // number/rating: value bounds; multi_select: selection count
  minLength?: number; maxLength?: number;
  pattern?: string; patternMessage?: string;
}

export interface Field {
  id: string;            // IMMUTABLE uuid — the response key, forever
  type: FieldType;
  label: string;
  required: boolean;
  description?: string;
  placeholder?: string;
  options?: FieldOption[];          // select-family only
  validation?: FieldValidation;
  // RESERVED for the logic wedge (§9). Renderer must already no-op on it
  // so v1 forms are forward-compatible with v2 logic.
  visibleIf?: unknown;              // becomes `Condition` in v2
}

export interface Theme {
  primaryColor: string;
  fontFamily: string;
  borderRadius: number;
}

export interface FormDraft {              // editable working copy
  id: string;
  ownerId: string;
  title: string;
  fields: Field[];
  theme: Theme;
  updatedAt: string;
}

export interface FormVersion {            // IMMUTABLE — created on publish
  versionId: string;
  formId: string;
  version: number;                 // monotonic: 1, 2, 3…
  fields: Field[];                 // frozen
  theme: Theme;
  publishedAt: string;
}

export interface Submission {
  id: string;
  formId: string;
  versionId: string;                       // schema version collected under
  answers: Record<string, unknown>;        // keyed by Field.id
  labelSnapshot: Record<string, string>;   // Field.id -> label at submit time
  meta: { submittedAt: string; ip?: string; userAgent?: string };
}

// Result of validateAnswers — errors keyed by Field.id (the immutable response key).
export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;  // Field.id -> human-readable message
}
