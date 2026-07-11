-- Optional display name for the profile. Nullable — accounts predate it and the
-- UI falls back to the email local part, so no backfill is needed.
ALTER TABLE users ADD COLUMN IF NOT EXISTS name text;
