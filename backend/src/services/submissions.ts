// Public submission path. The server re-validates every submission with the SAME
// shared validateAnswers used by the client (CLAUDE.md §3, §10) — the client
// check is UX; this is authoritative. Never trust client-side validation.
import { randomUUID } from 'node:crypto';
import { validateAnswers, type Field } from '../schema/index';
import { pool } from '../db/pool';
import { unprocessable } from '../lib/errors';
import { getPublishedVersion } from './forms';

export interface SubmitMeta {
  ip?: string;
  userAgent?: string;
}

const json = (v: unknown) => JSON.stringify(v);

// Fields that carry an answer (section_break is presentational).
const answerFields = (fields: Field[]) => fields.filter((f) => f.type !== 'section_break');

export async function submit(
  formId: string,
  answers: Record<string, unknown>,
  meta: SubmitMeta,
): Promise<{ id: string; submittedAt: string }> {
  const version = await getPublishedVersion(formId); // 404 if unpublished/missing

  const result = validateAnswers(version, answers);
  if (!result.valid) throw unprocessable('The form has validation errors.', result.errors);

  // Keep only known answer keys; snapshot each answer-bearing field's label so
  // exports stay human-readable even after the form is edited (CLAUDE.md §3).
  const cleaned: Record<string, unknown> = {};
  const labelSnapshot: Record<string, string> = {};
  for (const field of answerFields(version.fields)) {
    labelSnapshot[field.id] = field.label;
    if (field.id in answers) cleaned[field.id] = answers[field.id];
  }

  const id = randomUUID();
  const { rows } = await pool.query<{ submitted_at: Date }>(
    `INSERT INTO submissions (id, form_id, version_id, answers, label_snapshot, meta)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING submitted_at`,
    [id, formId, version.versionId, json(cleaned), json(labelSnapshot), json(meta)],
  );
  return { id, submittedAt: rows[0]!.submitted_at.toISOString() };
}
