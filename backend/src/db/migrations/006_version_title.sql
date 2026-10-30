-- The form title shown to respondents, frozen with the rest of the published
-- snapshot so renaming a draft doesn't change the live form until republish.
-- Nullable: versions published before this fall back to forms.title.
ALTER TABLE form_versions ADD COLUMN IF NOT EXISTS title text;
