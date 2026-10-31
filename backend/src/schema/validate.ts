// Pure validation — the ONE validator (CLAUDE.md §3). The client runs this for
// instant UX feedback; the server runs the SAME function as the authoritative
// trust boundary. Never two divergent validators. No side effects, no I/O.

import type { FormAccess, Field, FormVersion, ValidationResult } from './types';

// Deliberately simple, permissive-but-sane email check. We validate shape, not
// deliverability — the latter is a delivery-time concern, not a form concern.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/; // ISO calendar date (YYYY-MM-DD)
// E.164: '+' then 7–15 digits, first non-zero. Rich per-country validity is a
// client-side concern (libphonenumber); this is the shared shape check.
const PHONE_RE = /^\+[1-9]\d{6,14}$/;

// Hard ceilings, whatever the author configured: a stranger must not be able
// to store ~1MB per answer (the body limit) and fill the database.
export const ANSWER_MAX_LENGTH = { short_text: 1000, long_text: 10000, email: 254 } as const;

function isIsoDate(value: unknown): boolean {
  return typeof value === 'string' && DATE_RE.test(value) && !Number.isNaN(Date.parse(value));
}

function isEmpty(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function allowedOptionValues(field: Field): Set<string> {
  // An option's submitted value defaults to its label (mirrors FieldOption.value).
  return new Set((field.options ?? []).map((o) => o.value ?? o.label));
}

// Returns the first error message for a field, or null if it passes.
function validateField(field: Field, value: unknown): string | null {
  // section_break is presentational — it never carries an answer.
  if (field.type === 'section_break') return null;

  const empty = isEmpty(value);
  if (field.required && empty) return 'This field is required.';
  if (empty) return null; // optional + empty → nothing more to check

  const v = field.validation ?? {};

  switch (field.type) {
    case 'phone': {
      if (typeof value !== 'string' || !PHONE_RE.test(value)) return 'Enter a valid phone number.';
      return null;
    }

    case 'short_text':
    case 'long_text': {
      if (typeof value !== 'string') return 'Expected text.';
      const cap = Math.min(v.maxLength ?? Infinity, ANSWER_MAX_LENGTH[field.type]);
      if (value.length > cap) return `Must be at most ${cap} character${cap === 1 ? '' : 's'}.`;
      if (v.minLength != null && value.length < v.minLength) {
        return `Must be at least ${v.minLength} character${v.minLength === 1 ? '' : 's'}.`;
      }
      if (v.pattern) {
        let re: RegExp;
        try {
          re = new RegExp(v.pattern);
        } catch {
          // Author supplied an invalid regex — don't punish the respondent for it.
          return null;
        }
        if (!re.test(value)) return v.patternMessage ?? 'Invalid format.';
      }
      return null;
    }

    case 'email': {
      if (typeof value !== 'string') return 'Expected text.';
      if (value.length > ANSWER_MAX_LENGTH.email || !EMAIL_RE.test(value)) return 'Enter a valid email address.';
      return null;
    }

    case 'number':
    case 'rating': {
      if (typeof value !== 'number' || Number.isNaN(value)) return 'Enter a number.';
      if (v.min != null && value < v.min) return `Must be at least ${v.min}.`;
      if (v.max != null && value > v.max) return `Must be at most ${v.max}.`;
      return null;
    }

    case 'single_select':
    case 'dropdown': {
      if (typeof value !== 'string') return 'Select an option.';
      if (!allowedOptionValues(field).has(value)) return 'Select a valid option.';
      return null;
    }

    case 'multi_select':
    case 'multi_dropdown': {
      if (!Array.isArray(value)) return 'Select one or more options.';
      const allowed = allowedOptionValues(field);
      for (const item of value) {
        if (typeof item !== 'string' || !allowed.has(item)) return 'Select valid options.';
      }
      // For multi_select, min/max constrain the NUMBER of selections.
      if (v.min != null && value.length < v.min) {
        return `Select at least ${v.min} option${v.min === 1 ? '' : 's'}.`;
      }
      if (v.max != null && value.length > v.max) {
        return `Select at most ${v.max} option${v.max === 1 ? '' : 's'}.`;
      }
      return null;
    }

    case 'date': {
      if (field.date?.mode === 'range') {
        if (typeof value !== 'object' || value === null) return 'Select a date range.';
        const r = value as { start?: unknown; end?: unknown };
        if (!isIsoDate(r.start) || !isIsoDate(r.end)) return 'Select a valid date range.';
        // ISO 'YYYY-MM-DD' compares correctly as strings.
        if ((r.start as string) > (r.end as string)) return 'The end date must be on or after the start date.';
        return null;
      }
      if (!isIsoDate(value)) return 'Enter a valid date.';
      return null;
    }

    default: {
      // Exhaustiveness guard: adding a FieldType without handling it here is a
      // compile error, not a silent pass-through.
      const _exhaustive: never = field.type;
      return _exhaustive;
    }
  }
}

/**
 * Validate a set of answers against a published FormVersion.
 * Pure: same input → same output, no side effects. Answers are keyed by Field.id.
 * Unknown keys in `answers` (not present in the schema) are ignored here — the
 * submit service is responsible for stripping them before storage.
 */
export function validateAnswers(
  version: FormVersion,
  answers: Record<string, unknown>,
): ValidationResult {
  const errors: Record<string, string> = {};
  for (const field of version.fields) {
    const err = validateField(field, answers[field.id]);
    if (err) errors[field.id] = err;
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

// --- Form metadata ---------------------------------------------------------
// The form's own name, not an answer — but it lives here for the same reason
// validateAnswers does: the builder needs it for instant feedback and the API
// needs it as the trust boundary, and two copies of the rule would drift.

export const FORM_TITLE_MAX = 100;

/** Returns an error message for a form title, or null if it passes. */
export function validateFormTitle(title: string): string | null {
  const trimmed = title.trim();
  if (trimmed === '') return 'Give your form a name.';
  if (trimmed.length > FORM_TITLE_MAX) {
    return `Keep the name under ${FORM_TITLE_MAX} characters.`;
  }
  return null;
}

/** Redirect targets run in the respondent's browser: plain web links only, so a
 * creator can't smuggle in a javascript: or data: URL. */
export function isSafeRedirectUrl(url: string): boolean {
  try {
    const { protocol } = new URL(url);
    return protocol === 'https:' || protocol === 'http:';
  } catch {
    return false;
  }
}

/** Whether a form has stopped taking responses (manual switch, date, or cap). */
export function isFormClosed(
  access: FormAccess | null | undefined,
  responseCount: number,
  now: number = Date.now(),
): boolean {
  if (!access) return false;
  if (access.closed) return true;
  if (access.closesAt && Date.parse(access.closesAt) <= now) return true;
  return access.maxResponses !== undefined && responseCount >= access.maxResponses;
}
