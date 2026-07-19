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
  category?: string; // owner-set form type, shown as a badge on the card
  updatedAt: string;
  published: boolean;
  responseCount: number;
  viewCount: number;
  previewFields: Field[]; // first few questions, for the card's mini paper preview
}

// Basic analytics (ROADMAP Phase 1): the three headline numbers. Conversion is
// derived client-side (submissions / views).
export interface FormStats {
  views: number;
  submissions: number;
}

export interface DraftPatch {
  title?: string;
  category?: string;
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

// Seed for a new form: whatever fields/theme the caller already has in hand.
// This is the ONE insert path for a fresh form — a blank create, a template
// instantiation (services/templates), and AI generation all flow through here,
// so they can never drift on how a draft is persisted.
export interface NewFormSeed {
  title?: string;
  category?: string;
  fields?: Field[];
  theme?: Theme;
}

export async function createFormWith(ownerId: string, seed: NewFormSeed = {}): Promise<FormDraft> {
  const draft: FormDraft = {
    id: randomUUID(),
    ownerId,
    title: seed.title?.trim() || 'Untitled form',
    ...(seed.category && { category: seed.category }),
    fields: seed.fields ?? [],
    theme: seed.theme ?? { ...DEFAULT_THEME },
    updatedAt: new Date().toISOString(),
  };
  await pool.query(
    'INSERT INTO forms (id, owner_id, title, current_draft) VALUES ($1, $2, $3, $4)',
    [draft.id, ownerId, draft.title, json(draft)],
  );
  return draft;
}

export async function createForm(ownerId: string, title?: string): Promise<FormDraft> {
  return createFormWith(ownerId, { title });
}

export async function listForms(ownerId: string): Promise<FormSummary[]> {
  const { rows } = await pool.query<{
    id: string; title: string; category: string | null; updated_at: Date; published: boolean;
    response_count: string; view_count: string;
    fields: Field[] | null;
  }>(
    `SELECT f.id, f.title, f.updated_at,
            f.current_draft->>'category' AS category,
            f.published_version_id IS NOT NULL AS published,
            f.current_draft->'fields' AS fields,
            (SELECT count(*) FROM submissions s WHERE s.form_id = f.id) AS response_count,
            (SELECT count(*) FROM form_views v WHERE v.form_id = f.id) AS view_count
       FROM forms f
      WHERE f.owner_id = $1
      ORDER BY f.updated_at DESC`,
    [ownerId],
  );
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    ...(r.category && { category: r.category }),
    updatedAt: r.updated_at.toISOString(),
    published: r.published,
    responseCount: Number(r.response_count),
    viewCount: Number(r.view_count),
    // Only what the card preview draws — questions, not layout breaks.
    previewFields: (r.fields ?? [])
      .filter((f) => f.type !== 'section_break')
      .slice(0, 3),
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
    category: patch.category ?? current.category,
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

// Public: record one renderer view. Only published forms count (the WHERE
// doubles as the existence check), and it never throws — analytics must not
// break the public path. Callers fire-and-forget.
export async function recordView(formId: string): Promise<void> {
  await pool
    .query(
      `INSERT INTO form_views (form_id)
       SELECT id FROM forms WHERE id = $1 AND published_version_id IS NOT NULL`,
      [formId],
    )
    .catch(() => {}); // malformed uuid, db hiccup — swallow, a lost view is fine
}

// Owner: headline analytics numbers for one form.
export async function getFormStats(ownerId: string, formId: string): Promise<FormStats> {
  await assertOwnsForm(ownerId, formId);
  const { rows } = await pool.query<{ views: string; submissions: string }>(
    `SELECT (SELECT count(*) FROM form_views  WHERE form_id = $1) AS views,
            (SELECT count(*) FROM submissions WHERE form_id = $1) AS submissions`,
    [formId],
  );
  return { views: Number(rows[0]!.views), submissions: Number(rows[0]!.submissions) };
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

// ---------------------------------------------------------------------------
// Account-level usage (the /usage analytics dashboard).

export interface UsageDay {
  day: string; // YYYY-MM-DD
  views: number;
  submissions: number;
}

export interface AccountUsage {
  plan: string;
  // null = unlimited (Infinity doesn't survive JSON)
  limits: { responsesPerMonth: number | null; aiGenerationsPerMonth: number };
  forms: number;
  published: number;
  views: number;
  submissions: number;
  monthSubmissions: number;
  monthAiGenerations: number;
  timeline: UsageDay[]; // last 30 days, gaps filled with zeros
}

export async function getAccountUsage(ownerId: string, plan: string): Promise<AccountUsage> {
  const totalsQ = pool.query<{
    forms: string; published: string; views: string; submissions: string;
    month_submissions: string; month_ai: string;
  }>(
    `SELECT
       (SELECT count(*) FROM forms WHERE owner_id = $1) AS forms,
       (SELECT count(*) FROM forms WHERE owner_id = $1 AND published_version_id IS NOT NULL) AS published,
       (SELECT count(*) FROM form_views v JOIN forms f ON f.id = v.form_id WHERE f.owner_id = $1) AS views,
       (SELECT count(*) FROM submissions s JOIN forms f ON f.id = s.form_id WHERE f.owner_id = $1) AS submissions,
       (SELECT count(*) FROM submissions s JOIN forms f ON f.id = s.form_id
         WHERE f.owner_id = $1 AND s.submitted_at >= date_trunc('month', now())) AS month_submissions,
       (SELECT count(*) FROM ai_generations WHERE user_id = $1 AND created_at >= date_trunc('month', now())) AS month_ai`,
    [ownerId],
  );
  // ponytail: days bucket in the server's timezone; per-owner TZ if it ever matters.
  const timelineQ = pool.query<{ day: string; views: string; submissions: string }>(
    `SELECT to_char(d.day, 'YYYY-MM-DD') AS day,
            coalesce(v.c, 0) AS views,
            coalesce(s.c, 0) AS submissions
       FROM generate_series(current_date - 29, current_date, interval '1 day') AS d(day)
       LEFT JOIN (SELECT v.viewed_at::date AS day, count(*) AS c
                    FROM form_views v JOIN forms f ON f.id = v.form_id
                   WHERE f.owner_id = $1 AND v.viewed_at >= current_date - 29
                   GROUP BY 1) v ON v.day = d.day::date
       LEFT JOIN (SELECT s.submitted_at::date AS day, count(*) AS c
                    FROM submissions s JOIN forms f ON f.id = s.form_id
                   WHERE f.owner_id = $1 AND s.submitted_at >= current_date - 29
                   GROUP BY 1) s ON s.day = d.day::date
      ORDER BY 1`,
    [ownerId],
  );
  const [totals, timeline] = await Promise.all([totalsQ, timelineQ]);
  const t = totals.rows[0]!;
  const lim = limitsForPlan(plan);
  return {
    plan,
    limits: {
      responsesPerMonth: Number.isFinite(lim.responsesPerMonth) ? lim.responsesPerMonth : null,
      aiGenerationsPerMonth: lim.aiGenerationsPerMonth,
    },
    forms: Number(t.forms),
    published: Number(t.published),
    views: Number(t.views),
    submissions: Number(t.submissions),
    monthSubmissions: Number(t.month_submissions),
    monthAiGenerations: Number(t.month_ai),
    timeline: timeline.rows.map((r) => ({
      day: r.day,
      views: Number(r.views),
      submissions: Number(r.submissions),
    })),
  };
}

// ---------------------------------------------------------------------------
// Account-wide data export ("own your data"): the full dump of everything an
// owner has — profile, every form's draft, its published versions, and every
// submission. One JSON document; the browser downloads it.

export interface AccountExport {
  exportedAt: string;
  account: { id: string; email: string; name: string | null; plan: string; createdAt: string };
  forms: Array<{
    id: string;
    title: string;
    currentDraft: unknown;
    publishedVersionId: string | null;
    createdAt: string;
    updatedAt: string;
    versions: Array<{ id: string; version: number; schema: unknown; theme: unknown; publishedAt: string }>;
    submissions: Array<{
      id: string; versionId: string; answers: unknown; labelSnapshot: unknown;
      submittedAt: string; meta: unknown;
    }>;
  }>;
}

// ponytail: whole dump assembled in memory — fine for v1 volumes; stream or
// paginate if an account ever holds enough submissions to strain the response.
export async function exportAccount(ownerId: string): Promise<AccountExport> {
  const accountQ = pool.query<{ id: string; email: string; name: string | null; plan: string; created_at: Date }>(
    'SELECT id, email, name, plan, created_at FROM users WHERE id = $1',
    [ownerId],
  );
  const formsQ = pool.query<{
    id: string; title: string; current_draft: unknown; published_version_id: string | null;
    created_at: Date; updated_at: Date;
  }>(
    `SELECT id, title, current_draft, published_version_id, created_at, updated_at
       FROM forms WHERE owner_id = $1 ORDER BY created_at`,
    [ownerId],
  );
  const versionsQ = pool.query<{
    id: string; form_id: string; version: number; schema: unknown; theme: unknown; published_at: Date;
  }>(
    `SELECT v.id, v.form_id, v.version, v.schema, v.theme, v.published_at
       FROM form_versions v JOIN forms f ON f.id = v.form_id
      WHERE f.owner_id = $1 ORDER BY v.form_id, v.version`,
    [ownerId],
  );
  const submissionsQ = pool.query<{
    id: string; form_id: string; version_id: string; answers: unknown; label_snapshot: unknown;
    submitted_at: Date; meta: unknown;
  }>(
    `SELECT s.id, s.form_id, s.version_id, s.answers, s.label_snapshot, s.submitted_at, s.meta
       FROM submissions s JOIN forms f ON f.id = s.form_id
      WHERE f.owner_id = $1 ORDER BY s.form_id, s.submitted_at`,
    [ownerId],
  );
  const [account, forms, versions, submissions] = await Promise.all([
    accountQ, formsQ, versionsQ, submissionsQ,
  ]);

  const a = account.rows[0];
  if (!a) throw notFound('Account');

  // Bucket children by form_id so each form carries its own versions/submissions.
  const versionsByForm = new Map<string, AccountExport['forms'][number]['versions']>();
  for (const v of versions.rows) {
    const list = versionsByForm.get(v.form_id) ?? [];
    list.push({ id: v.id, version: v.version, schema: v.schema, theme: v.theme, publishedAt: v.published_at.toISOString() });
    versionsByForm.set(v.form_id, list);
  }
  const subsByForm = new Map<string, AccountExport['forms'][number]['submissions']>();
  for (const s of submissions.rows) {
    const list = subsByForm.get(s.form_id) ?? [];
    list.push({
      id: s.id, versionId: s.version_id, answers: s.answers, labelSnapshot: s.label_snapshot,
      submittedAt: s.submitted_at.toISOString(), meta: s.meta,
    });
    subsByForm.set(s.form_id, list);
  }

  return {
    exportedAt: new Date().toISOString(),
    account: {
      id: a.id, email: a.email, name: a.name, plan: a.plan, createdAt: a.created_at.toISOString(),
    },
    forms: forms.rows.map((f) => ({
      id: f.id,
      title: f.title,
      currentDraft: f.current_draft,
      publishedVersionId: f.published_version_id,
      createdAt: f.created_at.toISOString(),
      updatedAt: f.updated_at.toISOString(),
      versions: versionsByForm.get(f.id) ?? [],
      submissions: subsByForm.get(f.id) ?? [],
    })),
  };
}
