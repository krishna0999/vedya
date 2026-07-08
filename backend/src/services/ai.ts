// AI form generation (ROADMAP Phase 1). NL prompt → the same FormDraft JSON the
// engine already consumes: the model proposes {title, fields} in a loose wire
// shape, Zod validates it, coerceWireForm turns it into real schema Fields with
// fresh uuids, and persistence flows through createFormWith — the one insert
// path for new forms, shared with blank create and templates.
//
// The OpenAI HTTP call is isolated in callOpenAI; everything after the network
// (parseGeneratedForm, coerceWireForm) is pure and unit-tested.
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { DateConfig, Field, FieldOption, FormDraft } from '../schema/index';
import { env } from '../config/env';
import { pool } from '../db/pool';
import { AppError } from '../lib/errors';
import { limitsForPlan } from '../limits';
import { createFormWith } from './forms';

// ---------------------------------------------------------------------------
// Wire shape: what we ask the model to emit. Deliberately looser than Field —
// no ids (we own identity), options as plain strings, only the validation keys
// a model can meaningfully fill. Everything else is coerced server-side.
// ---------------------------------------------------------------------------

const WIRE_FIELD_TYPES = [
  'short_text', 'long_text', 'email', 'phone', 'number',
  'single_select', 'multi_select', 'dropdown', 'multi_dropdown',
  'date', 'rating', 'section_break',
] as const;

const SELECT_TYPES = new Set<string>(['single_select', 'multi_select', 'dropdown', 'multi_dropdown']);

const WireFieldSchema = z.object({
  type: z.enum(WIRE_FIELD_TYPES),
  label: z.string().trim().min(1).max(200),
  required: z.boolean().optional(),
  description: z.string().trim().max(500).optional(),
  placeholder: z.string().trim().max(200).optional(),
  options: z.array(z.string().trim().min(1).max(120)).max(24).optional(),
  date: z.object({ mode: z.enum(['single', 'range']) }).optional(),
  validation: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
      minLength: z.number().int().min(0).optional(),
      maxLength: z.number().int().positive().optional(),
    })
    .optional(),
});

const WireFormSchema = z.object({
  title: z.string().trim().min(1).max(140),
  fields: z.array(WireFieldSchema).min(1).max(30),
});

export type WireForm = z.infer<typeof WireFormSchema>;

// ---------------------------------------------------------------------------
// Pure conversion: wire shape → schema Fields the renderer/validator consume.
// ---------------------------------------------------------------------------

// Coerce one wire field into a real Field, repairing model mistakes instead of
// failing the whole generation: a select without usable options degrades to
// short_text; options on non-select types are dropped; rating gets a sane star
// count. Every field and option gets a fresh uuid (CLAUDE.md §3 #1).
export function coerceWireForm(wire: WireForm): { title: string; fields: Field[] } {
  const fields = wire.fields.map((wf): Field => {
    let type = wf.type;

    // Dedupe option labels case-insensitively, preserving first occurrence.
    const seen = new Set<string>();
    const optionLabels = (wf.options ?? []).filter((label) => {
      const key = label.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (SELECT_TYPES.has(type) && optionLabels.length < 2) type = 'short_text';

    const field: Field = {
      id: randomUUID(),
      type,
      label: wf.label,
      // section_break is presentational — it can never be required.
      required: type === 'section_break' ? false : (wf.required ?? false),
    };
    if (wf.description) field.description = wf.description;
    if (wf.placeholder && type !== 'section_break') field.placeholder = wf.placeholder;

    if (SELECT_TYPES.has(type)) {
      field.options = optionLabels.map(
        (label): FieldOption => ({ id: randomUUID(), label }),
      );
    }

    if (type === 'date') {
      const date: DateConfig = {
        mode: wf.date?.mode ?? 'single',
        showPresets: false,
        presets: [],
      };
      field.date = date;
    }

    if (type === 'rating') {
      // Star count: model's validation.max clamped to something renderable.
      const stars = Math.round(wf.validation?.max ?? 5);
      field.validation = { max: Math.min(10, Math.max(2, stars)) };
    } else if (wf.validation && (type === 'short_text' || type === 'long_text' || type === 'number')) {
      const v: Field['validation'] = {};
      if (type === 'number') {
        if (wf.validation.min !== undefined) v.min = wf.validation.min;
        if (wf.validation.max !== undefined) v.max = wf.validation.max;
      } else {
        if (wf.validation.minLength !== undefined) v.minLength = wf.validation.minLength;
        if (wf.validation.maxLength !== undefined) v.maxLength = wf.validation.maxLength;
      }
      if (Object.keys(v).length > 0) field.validation = v;
    }

    return field;
  });

  return { title: wire.title, fields };
}

// Parse the model's raw text into a validated, coerced form. Throws a 502-style
// AppError on anything unusable — the model, not the user, produced the JSON.
export function parseGeneratedForm(raw: string): { title: string; fields: Field[] } {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new AppError(502, 'The AI returned an unusable response. Try rephrasing your prompt.');
  }
  const parsed = WireFormSchema.safeParse(json);
  if (!parsed.success) {
    throw new AppError(502, 'The AI returned an unusable form. Try rephrasing your prompt.');
  }
  return coerceWireForm(parsed.data);
}

// ---------------------------------------------------------------------------
// OpenAI call — the only impure edge besides the database.
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You design forms for a form builder. Given a description, reply with ONLY a JSON object — no markdown fences, no commentary — in exactly this shape:
{"title":"...","fields":[{"type":"...","label":"...","required":true,"description":"...","placeholder":"...","options":["..."],"date":{"mode":"single"},"validation":{"max":5}}]}

Field types: short_text, long_text, email, phone, number, single_select (radio buttons, pick one), multi_select (checkboxes, pick many), dropdown (pick one from a list), multi_dropdown (pick many from a list), date, rating (stars), section_break (a heading that groups the fields after it; not a question).

Rules:
- Use 4-12 fields for typical prompts — only what the description actually needs.
- "options" is required for the four select types (2-10 short options) and must be omitted for every other type.
- Use date {"mode":"range"} when the answer is a period (stay dates, availability window), otherwise {"mode":"single"}.
- For rating, "validation":{"max":N} sets the star count (default 5).
- Include "description" or "placeholder" only when they genuinely help the respondent.
- Labels are the questions respondents see: clear, human, no numbering.
- "required" only for fields the form's purpose cannot work without.`;

async function callOpenAI(prompt: string): Promise<string> {
  if (!env.openaiConfigured) {
    throw new AppError(503, 'AI generation is not configured yet — add an OpenAI API key to enable it.');
  }

  let res: Response;
  try {
    res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.OPENAI_API_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: env.OPENAI_MODEL,
        temperature: 0.4,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
      }),
      signal: AbortSignal.timeout(45_000),
    });
  } catch {
    throw new AppError(502, 'Could not reach the AI service. Please try again.');
  }

  if (!res.ok) {
    // Auth/key problems are configuration, not transient upstream weather.
    if (res.status === 401) {
      throw new AppError(503, 'AI generation is misconfigured (invalid OpenAI API key).');
    }
    // OpenAI 429 is either insufficient_quota (account out of credits) or a
    // rate limit — both read as "unavailable right now", not a user mistake.
    if (res.status === 429) {
      throw new AppError(503, 'AI generation is unavailable: the OpenAI account is out of credits or rate-limited.');
    }
    throw new AppError(502, 'AI generation failed. Please try again.');
  }

  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new AppError(502, 'The AI returned an empty response. Please try again.');
  }
  return content;
}

// ---------------------------------------------------------------------------
// Metering + the public entry point.
// ---------------------------------------------------------------------------

async function assertWithinQuota(userId: string, plan: string): Promise<void> {
  const limit = limitsForPlan(plan).aiGenerationsPerMonth;
  if (!Number.isFinite(limit)) return;
  const { rows } = await pool.query<{ count: string }>(
    `SELECT count(*) FROM ai_generations
      WHERE user_id = $1 AND created_at >= date_trunc('month', now())`,
    [userId],
  );
  if (Number(rows[0]!.count) >= limit) {
    throw new AppError(429, `You've used all ${limit} AI generations for this month.`);
  }
}

// Generate a form from a prompt and persist it as a normal draft. Only a
// successful generation consumes quota (failures are on us, not the user).
export async function generateForm(userId: string, plan: string, prompt: string): Promise<FormDraft> {
  await assertWithinQuota(userId, plan);
  const raw = await callOpenAI(prompt);
  const { title, fields } = parseGeneratedForm(raw);
  const draft = await createFormWith(userId, { title, fields });
  await pool.query(
    'INSERT INTO ai_generations (user_id, prompt, form_id) VALUES ($1, $2, $3)',
    [userId, prompt, draft.id],
  );
  return draft;
}
