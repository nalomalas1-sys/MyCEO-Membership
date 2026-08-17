-- Migration: Add avatar config for children and branding for companies
-- This adds JSON-based avatar configuration on children and simple theme fields on companies.

-- Add avatar_config JSONB column to children table
ALTER TABLE public.children
ADD COLUMN IF NOT EXISTS avatar_config JSONB;

-- Add simple branding fields to companies
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS theme_color TEXT,
ADD COLUMN IF NOT EXISTS banner_url TEXT;

-- Register this migration version
SELECT register_migration_version(
  '20240101000040_add_avatar_and_branding',  -- migration_name (match filename)
  '20240101000040',                          -- migration_timestamp
  1,                                         -- version_major
  3,                                         -- version_minor
  0,                                         -- version_patch
  'Add avatar_config on children and theme_color/banner_url on companies', -- description
  '{"tables": ["children", "companies"], "columns_added": ["children.avatar_config", "companies.theme_color", "companies.banner_url"]}'::JSONB,
  NULL                                       -- rollback_script (optional)
);

