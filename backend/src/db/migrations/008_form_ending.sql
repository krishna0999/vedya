-- The post-submit ending (thank-you message, redirect URL), frozen with the
-- rest of the published snapshot. Nullable: older versions use the default.
ALTER TABLE form_versions ADD COLUMN IF NOT EXISTS ending jsonb;
