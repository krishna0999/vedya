-- Basic form analytics (ROADMAP Phase 1): one row per public-renderer view.
-- Counts only for now (views / submissions / conversion); keeping raw rows
-- instead of a counter so Phase 3 timelines don't need a schema change.

CREATE TABLE IF NOT EXISTS form_views (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id   uuid NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  viewed_at timestamptz NOT NULL DEFAULT now()
);

-- Every read is count-by-form; index exactly that.
CREATE INDEX IF NOT EXISTS form_views_form_idx ON form_views (form_id);
