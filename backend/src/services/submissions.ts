// Public submission path. The server re-validates every submission with the SAME
// shared validateAnswers used by the client (CLAUDE.md §3, §10) — the client
// check is UX; this is authoritative. Never trust client-side validation.
import { randomUUID } from 'node:crypto';
import { validateAnswers, type Field } from '../schema/index';
import { env } from '../config/env';
import { pool } from '../db/pool';
import { AppError, unprocessable } from '../lib/errors';
import { limitsForPlan } from '../limits';
import { getPublishedVersion } from './forms';

export interface SubmitMeta {
  ip?: string;
  userAgent?: string;
}

const json = (v: unknown) => JSON.stringify(v);

// Fields that carry an answer (section_break is presentational).
const answerFields = (fields: Field[]) => fields.filter((f) => f.type !== 'section_break');

// Freemium gate (CLAUDE.md §8): reject once the owner is at their monthly cap,
// counted across ALL of their forms in the current calendar month.
async function assertWithinQuota(formId: string): Promise<void> {
  const { rows } = await pool.query<{ plan: string; month_count: string }>(
    `SELECT u.plan,
            (SELECT count(*) FROM submissions s
               JOIN forms f2 ON f2.id = s.form_id
              WHERE f2.owner_id = u.id
                AND s.submitted_at >= date_trunc('month', now())) AS month_count
       FROM forms f JOIN users u ON u.id = f.owner_id
      WHERE f.id = $1`,
    [formId],
  );
  const row = rows[0];
  if (!row) return; // getPublishedVersion already 404s if the form is missing
  if (Number(row.month_count) >= limitsForPlan(row.plan).responsesPerMonth) {
    throw new AppError(403, 'This form is not accepting responses right now.');
  }
}

// Bot check (Cloudflare Turnstile). Without it a script can burn an owner's
// whole monthly response quota in minutes and take their form offline. Fails
// closed: if Cloudflare can't confirm a human, the submission is refused.
async function assertHuman(token: string | undefined, ip: string | undefined): Promise<void> {
  const secret = env.TURNSTILE_SECRET_KEY;
  if (!secret) return; // not configured (local dev)
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: new URLSearchParams({ secret, response: token ?? '', ...(ip && { remoteip: ip }) }),
    signal: AbortSignal.timeout(10_000),
  }).catch(() => null);
  const ok = res?.ok && ((await res.json()) as { success?: boolean }).success === true;
  if (!ok) throw new AppError(403, "We couldn't verify you're human. Please try again.");
}

export async function submit(
  formId: string,
  answers: Record<string, unknown>,
  meta: SubmitMeta,
  turnstileToken?: string,
): Promise<{ id: string; submittedAt: string }> {
  await assertHuman(turnstileToken, meta.ip); // before any DB work: shed bots cheaply
  const version = await getPublishedVersion(formId); // 404 if unpublished/missing
  await assertWithinQuota(formId); // freemium response cap

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
