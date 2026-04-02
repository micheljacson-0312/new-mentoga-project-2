-- Add slug to consultants table
ALTER TABLE consultants ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_consultants_slug ON consultants(slug);

-- Function to generate initial slugs for existing consultants (optional but good)
UPDATE consultants 
SET slug = LOWER(REPLACE(u.first_name || '-' || u.last_name || '-' || SUBSTRING(consultants.id::text, 1, 4), ' ', '-'))
FROM user_profiles u
WHERE consultants.user_id = u.id AND consultants.slug IS NULL;
