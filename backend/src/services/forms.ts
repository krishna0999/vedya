// Form persistence + publishing. Plain TS over the pg pool — no Fastify here, so
// this is testable against a throwaway database. All owner-scoped reads/writes
// filter by owner_id (the auth trust boundary until Lucia arrives in step 5).
import { randomUUID } from 'node:crypto';
import type { Field, FormDraft, FormVersion, Submission, Theme } from '../schema/index';
import { pool } from '../db/pool';
import { notFound } from '../lib/errors';
import { DEFAULT_THEME } from '../lib/theme';
import { limitsForPlan } from '../limits';
import { toCsv, type CsvColumn } from './csv';

// Every value bound to a jsonb column is JSON-stringified explicitly: node-postgres
// would otherwise turn a JS array (e.g. Field[]) into a Postgres array literal,
// which is not valid jsonb.
const json = (v: unknown) => JSON.stringify(v);

export interface FormSummary {
  id: string;
  title: string;
  updatedAt: string;
  published: boolean;
  responseCount: number;
}

export interface DraftPatch {
  title?: string;
  fields?: Field[];
  theme?: Theme;
}

interface DraftRow { current_draft: FormDraft }

async function loadOwnedDraft(ownerId: string, formId: string): Promise<FormDraft> {
  const { rows } = await pool.query<DraftRow>(
    'SELECT current_draft FROM forms WHERE id = $1 AND owner_id = $2',
    [formId, ownerId],
  );
  const row = rows[0];
  if (!row) throw notFound('Form');
  return row.current_draft;
}

export async function createForm(ownerId: string, title?: string): Promise<FormDraft> {
  const draft: FormDraft = {
    id: randomUUID(),
    ownerId,
    title: title?.trim() || 'Untitled form',
    fields: [],
    theme: { ...DEFAULT_THEME },
    updatedAt: new Date().toISOString(),
  };
  await pool.query(
    'INSERT INTO forms (id, owner_id, title, current_draft) VALUES ($1, $2, $3, $4)',
    [draft.id, ownerId, draft.title, json(draft)],
  );
  return draft;
}

export async function listForms(ownerId: string): Promise<FormSummary[]> {
  const { rows } = await pool.query<{
    id: string; title: string; updated_at: Date; published: boolean; response_count: string;
  }>(
    `SELECT f.id, f.title, f.updated_at,
            f.published_version_id IS NOT NULL AS published,
            (SELECT count(*) FROM submissions s WHERE s.form_id = f.id) AS response_count
       FROM forms f
      WHERE f.owner_id = $1
      ORDER BY f.updated_at DESC`,
    [ownerId],
  );
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    updatedAt: r.updated_at.toISOString(),
    published: r.published,
    responseCount: Number(r.response_count),
  }));
}

export async function getForm(ownerId: string, formId: string): Promise<FormDraft> {
  return loadOwnedDraft(ownerId, formId);
}

export async function updateForm(ownerId: string, formId: string, patch: DraftPatch): Promise<FormDraft> {
  const current = await loadOwnedDraft(ownerId, formId);
  const next: FormDraft = {
    ...current,
    title: patch.title ?? current.title,
    fields: patch.fields ?? current.fields,
    theme: patch.theme ?? current.theme,
    updatedAt: new Date().toISOString(),
  };
  await pool.query(
    'UPDATE forms SET title = $3, current_draft = $4, updated_at = now() WHERE id = $1 AND owner_id = $2',
    [formId, ownerId, next.title, json(next)],
  );
  return next;
}

export async function deleteForm(ownerId: string, formId: string): Promise<void> {
  const { rowCount } = await pool.query(
    'DELETE FROM forms WHERE id = $1 AND owner_id = $2',
    [formId, ownerId],
  );
  if (!rowCount) throw notFound('Form');
}

// Snapshot the current draft into a new immutable form_versions row and point the
// form at it. Transactional so the version insert and the pointer update commit
// together (CLAUDE.md §3 non-negotiable #2).
export async function publishForm(ownerId: string, formId: string): Promise<FormVersion> {
  const draft = await loadOwnedDraft(ownerId, formId);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query<{ id: string; version: number; published_at: Date }>(
      `INSERT INTO form_versions (form_id, version, schema, theme)
       VALUES ($1,
               (SELECT COALESCE(MAX(version), 0) + 1 FROM form_versions WHERE form_id = $1),
               $2, $3)
       RETURNING id, version, published_at`,
      [formId, json(draft.fields), json(draft.theme)],
    );
    const created = rows[0]!;
    await client.query('UPDATE forms SET published_version_id = $2 WHERE id = $1', [formId, created.id]);
    await client.query('COMMIT');
    return {
      versionId: created.id,
      formId,
      version: created.version,
      fields: draft.fields,
      theme: draft.theme,
      publishedAt: created.published_at.toISOString(),
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Public: the currently published version for the renderer. 404 if the form does
// not exist or has never been published.
export async function getPublishedVersion(formId: string): Promise<FormVersion> {
  const { rows } = await pool.query<{
    id: string; version: number; schema: Field[]; theme: Theme; published_at: Date;
  }>(
    `SELECT fv.id, fv.version, fv.schema, fv.theme, fv.published_at
       FROM forms f
       JOIN form_versions fv ON fv.id = f.published_version_id
      WHERE f.id = $1`,
    [formId],
  );
  const row = rows[0];
  if (!row) throw notFound('Form');
  return {
    versionId: row.id,
    formId,
    version: row.version,
    fields: row.schema,
    theme: row.theme,
    publishedAt: row.published_at.toISOString(),
  };
}

// Public: the published version plus whether to show the "Made with —" badge,
// derived from the owner's plan (CLAUDE.md §8). One query, no owner scoping.
export async function getPublicForm(formId: string): Promise<{ version: FormVersion; branding: boolean }> {
  const { rows } = await pool.query<{
    id: string; version: number; schema: Field[]; theme: Theme; published_at: Date; plan: string;
  }>(
    `SELECT fv.id, fv.version, fv.schema, fv.theme, fv.published_at, u.plan
       FROM forms f
       JOIN form_versions fv ON fv.id = f.published_version_id
       JOIN users u ON u.id = f.owner_id
      WHERE f.id = $1`,
    [formId],
  );
  const row = rows[0];
  if (!row) throw notFound('Form');
  return {
    version: {
      versionId: row.id,
      formId,
      version: row.version,
      fields: row.schema,
      theme: row.theme,
      publishedAt: row.published_at.toISOString(),
    },
    branding: limitsForPlan(row.plan).branding,
  };
}

async function assertOwnsForm(ownerId: string, formId: string): Promise<void> {
  const { rows } = await pool.query('SELECT 1 FROM forms WHERE id = $1 AND owner_id = $2', [formId, ownerId]);
  if (!rows[0]) throw notFound('Form');
}

interface SubmissionRow {
  id: string; version_id: string; answers: Record<string, unknown>;
  label_snapshot: Record<string, string>; submitted_at: Date; meta: Record<string, unknown>;
}

function rowToSubmission(formId: string, r: SubmissionRow): Submission {
  return {
    id: r.id,
    formId,
    versionId: r.version_id,
    answers: r.answers,
    labelSnapshot: r.label_snapshot,
    meta: { submittedAt: r.submitted_at.toISOString(), ...(r.meta as { ip?: string; userAgent?: string }) },
  };
}

export async function listSubmissions(ownerId: string, formId: string): Promise<Submission[]> {
  await assertOwnsForm(ownerId, formId);
  const { rows } = await pool.query<SubmissionRow>(
    `SELECT id, version_id, answers, label_snapshot, submitted_at, meta
       FROM submissions WHERE form_id = $1 ORDER BY submitted_at DESC`,
    [formId],
  );
  return rows.map((r) => rowToSubmission(formId, r));
}

// CSV column set: union of answer-bearing field ids across ALL of a form's
// versions, in first-appearance order, each headed by its most recent label.
async function buildColumns(formId: string): Promise<CsvColumn[]> {
  const { rows } = await pool.query<{ schema: Field[] }>(
    'SELECT schema FROM form_versions WHERE form_id = $1 ORDER BY version ASC',
    [formId],
  );
  const columns = new Map<string, CsvColumn>();
  for (const { schema } of rows) {
    for (const field of schema) {
      if (field.type === 'section_break') continue; // presentational, no answer
      // Map preserves first-appearance order; overwriting keeps position while
      // adopting the newer label.
      columns.set(field.id, { id: field.id, header: field.label });
    }
  }
  return [...columns.values()];
}

export async function exportSubmissionsCsv(ownerId: string, formId: string): Promise<string> {
  await assertOwnsForm(ownerId, formId);
  const [columns, submissions] = await Promise.all([
    buildColumns(formId),
    listSubmissions(ownerId, formId),
  ]);
  return toCsv(columns, submissions);
}
