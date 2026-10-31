// Per-question summary for the Responses "Summary" tab: pure, so it's tested
// without a DOM. Summarises the form's CURRENT questions; answers to questions
// since deleted stay visible in the Responses table and CSV.
import type { Field, Submission } from '@schema';

export interface Bar { label: string; count: number; pct: number }

export type FieldSummary =
  // pct is of the people who answered this question (for multi-select a
  // respondent can count towards several options, so they can sum past 100%).
  | { kind: 'choice'; field: Field; answered: number; bars: Bar[] }
  | { kind: 'rating'; field: Field; answered: number; average: number | null; bars: Bar[] }
  | { kind: 'number'; field: Field; answered: number; average: number | null; min: number | null; max: number | null }
  // Free text, email, phone, dates: the most recent answers, newest first.
  | { kind: 'list'; field: Field; answered: number; recent: { value: string; submittedAt: string }[] };

const CHOICE = new Set(['single_select', 'dropdown', 'multi_select', 'multi_dropdown']);
const RECENT_LIMIT = 5;

const isEmpty = (v: unknown) =>
  v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);

const pct = (n: number, of: number) => (of === 0 ? 0 : Math.round((n / of) * 100));

function asText(v: unknown): string {
  if (Array.isArray(v)) return v.join(', ');
  if (v && typeof v === 'object') {
    const r = v as { start?: unknown; end?: unknown };
    if (typeof r.start === 'string' && typeof r.end === 'string') return `${r.start} – ${r.end}`;
    return JSON.stringify(v);
  }
  return String(v);
}

// `submissions` arrive newest first (the API's order), which `recent` relies on.
export function summarize(fields: Field[], submissions: Submission[]): FieldSummary[] {
  return fields
    .filter((f) => f.type !== 'section_break')
    .map((field): FieldSummary => {
      const values = submissions
        .map((s) => ({ v: s.answers[field.id], at: s.meta.submittedAt }))
        .filter((x) => !isEmpty(x.v));
      const answered = values.length;

      if (CHOICE.has(field.type)) {
        // Counted by stored value, labelled by the current option. Values that
        // no current option has (renamed/removed options) keep their own row.
        const counts = new Map<string, number>();
        for (const { v } of values) for (const x of Array.isArray(v) ? v : [v]) {
          const key = String(x);
          counts.set(key, (counts.get(key) ?? 0) + 1);
        }
        const options = field.options ?? [];
        const bars: Bar[] = options.map((o) => {
          const count = counts.get(o.value ?? o.label) ?? 0;
          return { label: o.label, count, pct: pct(count, answered) };
        });
        const known = new Set(options.map((o) => o.value ?? o.label));
        for (const [key, count] of counts) {
          if (!known.has(key)) bars.push({ label: key, count, pct: pct(count, answered) });
        }
        return { kind: 'choice', field, answered, bars };
      }

      if (field.type === 'rating') {
        const max = field.validation?.max ?? 5;
        const nums = values.map(({ v }) => Number(v)).filter(Number.isFinite);
        const bars: Bar[] = [];
        for (let star = max; star >= 1; star--) {
          const count = nums.filter((n) => n === star).length;
          bars.push({ label: `${star} star${star === 1 ? '' : 's'}`, count, pct: pct(count, nums.length) });
        }
        const average = nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
        return { kind: 'rating', field, answered, average, bars };
      }

      if (field.type === 'number') {
        const nums = values.map(({ v }) => Number(v)).filter(Number.isFinite);
        return {
          kind: 'number',
          field,
          answered,
          average: nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null,
          min: nums.length ? Math.min(...nums) : null,
          max: nums.length ? Math.max(...nums) : null,
        };
      }

      return {
        kind: 'list',
        field,
        answered,
        recent: values.slice(0, RECENT_LIMIT).map(({ v, at }) => ({ value: asText(v), submittedAt: at })),
      };
    });
}
