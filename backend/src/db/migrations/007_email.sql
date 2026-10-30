-- Email flows: verification + password reset. Owners only get response
-- notifications once they've proved they own the inbox (email_verified_at).
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at timestamptz;

-- Single-use emailed links. Only a SHA-256 of the token is stored, so a leaked
-- table can't be replayed; consuming a token deletes its row.
CREATE TABLE IF NOT EXISTS email_tokens (
  token_hash text PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose    text NOT NULL CHECK (purpose IN ('verify', 'reset')),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS email_tokens_user_idx ON email_tokens (user_id, purpose);
