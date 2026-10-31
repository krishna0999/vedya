// The form schema — the single source of truth (CLAUDE.md §3).
// This module MUST stay zero-runtime-dep and self-contained: no Fastify, no
// Node built-ins. The frontend imports it via the `@schema` Vite alias, so
// anything server-only here would leak into the client bundle.

export type FieldType =
  | 'short_text' | 'long_text' | 'email' | 'phone' | 'number'
  | 'single_select' | 'multi_select' | 'dropdown' | 'multi_dropdown'
  | 'date' | 'rating' | 'section_break';

// Answer shape for a date field in range mode (both ends ISO 'YYYY-MM-DD').
export interface DateRangeValue {
  start: string;
  end: string;
}

// A date-picker shortcut, e.g. { label: 'Tomorrow', offsetDays: 1 }.
export interface DatePreset {
  label: string;
  offsetDays: number;
}

// Per-field config for `date` fields. `mode` decides single date vs a range;
// presets are optional shortcut buttons the creator opts into.
export interface DateConfig {
  mode: 'single' | 'range';
  showPresets: boolean;
  presets: DatePreset[];
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
  date?: DateConfig;                // `date` fields only (single/range + presets)
  // RESERVED for the logic wedge (§9). Renderer must already no-op on it
  // so v1 forms are forward-compatible with v2 logic.
  visibleIf?: unknown;              // becomes `Condition` in v2
}

export interface Theme {
  primaryColor: string;
  fontFamily: string;
  borderRadius: number;
}

// What a respondent sees after submitting. Part of the published snapshot, so
// edits go live on the next publish like everything else respondents see.
export interface FormEnding {
  message?: string;      // replaces the default thank-you line
  redirectUrl?: string;  // http(s) only (isSafeRedirectUrl); sent there after submit
}

// Whether the form takes responses. Stored on the draft but read LIVE by the
// public endpoints, so closing a form never needs a republish.
export interface FormAccess {
  closed?: boolean;       // manual off switch
  closesAt?: string;      // ISO timestamp; closed from then on
  maxResponses?: number;  // closed once the form has this many responses
}

export interface FormDraft {              // editable working copy
  id: string;
  ownerId: string;
  title: string;
  category?: string;               // owner-set form type (e.g. 'Survey'); optional
  fields: Field[];
  theme: Theme;
  ending?: FormEnding;
  access?: FormAccess;
  updatedAt: string;
}

export interface FormVersion {            // IMMUTABLE — created on publish
  versionId: string;
  formId: string;
  version: number;                 // monotonic: 1, 2, 3…
  fields: Field[];                 // frozen
  theme: Theme;
  ending?: FormEnding;
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
