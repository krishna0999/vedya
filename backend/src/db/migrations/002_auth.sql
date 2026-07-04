-- Auth (CLAUDE.md §2, Lucia). Adds password storage to users and the sessions
-- table Lucia's NodePostgresAdapter expects (columns: id, user_id, expires_at).

ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash text;

CREATE TABLE IF NOT EXISTS sessions (
  id         text PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions (user_id);
