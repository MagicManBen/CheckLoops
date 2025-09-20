Import target: table `item_allowed_types`

Columns in CSV (in order):
- id (optional) — leave mapped or ignore; Postgres can auto-generate if you untick it
- site_id (required)
- item_id (required, must exist in `items`)
- check_type_id (required, must exist in `check_types`)
- frequency (text like `7 days`, `1 mon`)
- required (true/false)
- warn_before (text like `3 days`)
- scheduled_day (e.g., `Mon`, `Thu`, or numeric as per your app)
- responsible_team_id (nullable)
- active (true/false)
- created_at (timestamptz)

Recommended Supabase import settings:
1) Open SQL Editor > Table Editor > `item_allowed_types` > Import Data
2) File: `item_allowed_types_export.csv`
3) CSV options: Header row = Yes, Delimiter = comma, Quote = `"` (default)
4) Column mapping:
   - Map all columns 1:1. If you want Postgres to assign fresh IDs, unmap `id` or set `id` to auto.
   - If you see type warnings for `frequency` or `warn_before`, temporarily change column type to `text` then convert back to `interval` after import using an UPDATE + CAST.
5) Constraints: Keep FKs enabled to avoid orphan rows. If some `items` or `check_types` are missing, either:
   - Import those first, or
   - Filter the CSV to only rows whose `item_id`/`check_type_id` exist.

Post-import sequence fix (run in SQL editor):
SELECT setval('item_allowed_types_id_seq', GREATEST((SELECT COALESCE(MAX(id), 0) FROM item_allowed_types), 1));

Optional: Convert frequency/warn_before to interval (if columns are interval):
UPDATE item_allowed_types SET frequency = NULL WHERE frequency = '';
UPDATE item_allowed_types SET warn_before = NULL WHERE warn_before = '';
-- If stored as text during import, convert back to interval like:
-- ALTER TABLE item_allowed_types ALTER COLUMN frequency TYPE interval USING NULLIF(frequency,'')::interval;
-- ALTER TABLE item_allowed_types ALTER COLUMN warn_before TYPE interval USING NULLIF(warn_before,'')::interval;

Validation queries:
SELECT COUNT(*) FROM item_allowed_types WHERE site_id = 2;
SELECT iat.id, i.item_name, ct.name, iat.frequency, iat.required
FROM item_allowed_types iat
JOIN items i ON i.id = iat.item_id
JOIN check_types ct ON ct.id = iat.check_type_id
WHERE iat.site_id = 2
ORDER BY i.item_name, ct.name
LIMIT 20;