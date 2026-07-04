// Pure CSV export (CLAUDE.md §5): union of field ids across the form's versions,
// headers from label_snapshot, one row per submission. No I/O — takes plain data,
// returns a string. Kept pure so it is unit-testable without a database.
import type { Submission } from '../schema/index';

export interface CsvColumn {
  id: string;      // Field.id — the immutable response key
  header: string;  // human-readable label (from label_snapshot / latest version)
}

// Format one answer value into a single CSV cell string (pre-escaping).
function formatValue(value: unknown): string {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map((v) => formatValue(v)).join('; ');
  // Date-range answers are { start, end }.
  if (typeof value === 'object') {
    const o = value as Record<string, unknown>;
    if (typeof o.start === 'string' && typeof o.end === 'string') return `${o.start} – ${o.end}`;
    return JSON.stringify(value);
  }
  return String(value);
}

// RFC-4180 quoting, plus a light guard against spreadsheet formula injection:
// a cell that a user could make begin with = + - @ is neutralised with a
// leading apostrophe so Excel/Sheets won't evaluate it.
function escapeCell(raw: string): string {
  let cell = raw;
  if (/^[=+\-@\t\r]/.test(cell)) cell = `'${cell}`;
  if (/[",\r\n]/.test(cell)) cell = `"${cell.replace(/"/g, '""')}"`;
  return cell;
}

/**
 * Build a CSV document. Leading meta columns (submission id + timestamp) precede
 * one column per field. `submissions` are emitted in the order given.
 */
export function toCsv(columns: CsvColumn[], submissions: Submission[]): string {
  const header = ['Submission ID', 'Submitted at', ...columns.map((c) => c.header)];
  const rows = submissions.map((s) => [
    s.id,
    s.meta.submittedAt,
    ...columns.map((c) => formatValue(s.answers[c.id])),
  ]);
  return [header, ...rows].map((row) => row.map(escapeCell).join(',')).join('\r\n');
}
