# Database Migrations

This directory contains all database migrations for the MyCEO LMS platform.

## Migration Naming

Migrations follow the format: `YYYYMMDDHHMMSS_description.sql`

Example: `20240101000013_create_schema_versions_table.sql`

## Versioning System

All migrations are tracked using semantic versioning (MAJOR.MINOR.PATCH) via the `schema_versions` table.

### Version Number Guidelines

- **MAJOR (1.x.x → 2.0.0)**: Breaking changes
  - Dropping columns/tables
  - Changing column types
  - Removing functions used in application code

- **MINOR (1.0.x → 1.1.0)**: New features (backward compatible)
  - Adding new tables
  - Adding new columns (nullable or with defaults)
  - Adding new functions
  - Adding new indexes

- **PATCH (1.0.0 → 1.0.1)**: Bug fixes (backward compatible)
  - Fixing RLS policies
  - Correcting data
  - Performance improvements
  - Small schema adjustments

## Setup

1. **Apply the versioning migration first:**
   ```bash
   # The versioning system is in: 20240101000013_create_schema_versions_table.sql
   ```

2. **Register existing migrations (one-time):**
   ```bash
   # Run the registration script to retroactively register all existing migrations
   psql -f supabase/migrations/register_existing_migrations.sql
   ```

## Creating New Migrations

1. **Create the migration file** with timestamp:
   ```
   YYYYMMDDHHMMSS_your_description.sql
   ```

2. **Add version registration** at the end of your migration:
   ```sql
   -- Register this migration version
   SELECT register_migration_version(
     '20240101000014_your_migration_name',  -- migration_name (match filename)
     '20240101000014',                       -- migration_timestamp
     1,                                      -- version_major
     2,                                      -- version_minor
     1,                                      -- version_patch
     'Description of what this migration does',  -- description
     '{"tables": ["table_name"], "functions": ["function_name"]}'::JSONB,  -- changes_summary
     NULL                                    -- rollback_script (optional)
   );
   ```

3. **Update the changelog** (`MIGRATION_CHANGELOG.md`) with:
   - Version number
   - Migration name
   - Type (MAJOR/MINOR/PATCH)
   - Description
   - Detailed changes

## Querying Versions

### Get Current Schema Version
```sql
SELECT * FROM get_current_schema_version();
```

### Get All Migration History
```sql
SELECT 
  migration_name,
  version_major || '.' || version_minor || '.' || version_patch as version,
  description,
  applied_at
FROM schema_versions
ORDER BY applied_at DESC;
```

### Get Version by Migration Name
```sql
SELECT * FROM schema_versions 
WHERE migration_name = '20240101000010_award_achievements_function';
```

## Migration Files

- `20240101000000_initial_schema.sql` - Initial database schema
- `20240101000001_rls_policies.sql` - Row Level Security policies
- `20240101000002_functions.sql` - Core business logic functions
- `20240101000003_user_registration.sql` - User registration
- `20240101000004_allow_child_access_code_lookup.sql` - Access code lookup
- `20240101000005_add_pdf_presentation_lesson_types.sql` - Lesson types
- `20240101000006_create_lesson_files_bucket.sql` - Lesson files storage
- `20240101000007_add_admin_users_policy.sql` - Admin policies
- `20240101000008_fix_admin_users_policy_recursion.sql` - Policy fix
- `20240101000009_seed_achievements.sql` - Achievement data
- `20240101000010_award_achievements_function.sql` - Achievement function
- `20240101000011_add_soft_delete_to_children.sql` - Soft delete
- `20240101000012_create_profile_pictures_bucket.sql` - Profile pictures
- `20240101000013_create_schema_versions_table.sql` - Versioning system
- `register_existing_migrations.sql` - One-time registration script

## Best Practices

1. **Always test migrations** on a development database first
2. **Keep migrations idempotent** - use `IF NOT EXISTS`, `ON CONFLICT`, etc.
3. **Document breaking changes** clearly in the changelog
4. **Use transactions** where appropriate
5. **Version incrementally** - don't skip version numbers
6. **Include rollback scripts** for complex migrations (optional but recommended)

## Related Files

- `MIGRATION_CHANGELOG.md` - Detailed changelog of all migrations
- `register_existing_migrations.sql` - Script to register pre-versioning migrations



