-- Adds default teams (Data Team, Partners, PCN) for every site_id found
-- in public.profiles, without creating duplicates. Safe to run multiple times.

WITH site_ids AS (
  SELECT DISTINCT site_id
  FROM public.profiles
  WHERE site_id IS NOT NULL
)
INSERT INTO public.teams (site_id, name)
SELECT si.site_id, v.name
FROM site_ids si
CROSS JOIN (VALUES ('Data Team'), ('Partners'), ('PCN')) AS v(name)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.teams t
  WHERE t.site_id = si.site_id
    AND LOWER(t.name) = LOWER(v.name)
);

