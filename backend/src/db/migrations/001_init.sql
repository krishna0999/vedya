-- Initial schema (CLAUDE.md §5). form_versions rows are INSERT-ONLY — never
-- updated — so old submissions always map to the exact schema that produced them.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE IF NOT EXISTS users (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email      citext UNIQUE NOT NULL,
  plan       text NOT NULL DEFAULT 'free',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS forms (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id             uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title                text NOT NULL DEFAULT 'Untitled form',
  current_draft        jsonb NOT NULL,             -- the editable FormDraft
  published_version_id uuid,                        -- -> form_versions.id
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS forms_owner_idx ON forms (owner_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS form_versions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id      uuid NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  version      int NOT NULL,                        -- monotonic per form: 1, 2, 3…
  schema       jsonb NOT NULL,                      -- frozen Field[]
  theme        jsonb NOT NULL,
  published_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (form_id, version)
);

-- The FK on forms.published_version_id is added here (after form_versions exists).
ALTER TABLE forms
  DROP CONSTRAINT IF EXISTS forms_published_version_fk;
ALTER TABLE forms
  ADD CONSTRAINT forms_published_version_fk
  FOREIGN KEY (published_version_id) REFERENCES form_versions(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS submissions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id        uuid NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  version_id     uuid NOT NULL REFERENCES form_versions(id),
  answers        jsonb NOT NULL,                    -- keyed by Field.id
  label_snapshot jsonb NOT NULL,                    -- Field.id -> label at submit time
  submitted_at   timestamptz NOT NULL DEFAULT now(),
  meta           jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS submissions_form_idx ON submissions (form_id, submitted_at DESC);
