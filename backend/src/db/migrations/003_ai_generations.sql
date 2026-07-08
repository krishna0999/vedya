-- AI form generation metering (ROADMAP Phase 1). One row per successful
-- generation; the monthly quota check counts rows since the start of the
-- calendar month. Prompts are kept for future analytics / SEO template pages.

CREATE TABLE IF NOT EXISTS ai_generations (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  prompt     text NOT NULL,
  form_id    uuid REFERENCES forms(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- The quota check is always (user, this month) — index exactly that access path.
CREATE INDEX IF NOT EXISTS ai_generations_user_created_idx
  ON ai_generations (user_id, created_at DESC);
