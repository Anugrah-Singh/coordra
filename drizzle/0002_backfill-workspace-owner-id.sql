-- 1. First, use existing OWNER memberships where they exist.
UPDATE "workspaces" AS w
SET "owner_id" = wm."user_id"
FROM "workspace_members" AS wm
WHERE wm."workspace_id" = w."id"
  AND wm."role" = 'OWNER'
  AND w."owner_id" IS NULL;
--> statement-breakpoint

-- 2. For workspaces that still have no owner_id,
-- promote the earliest joined member to OWNER.
WITH fallback_owner AS (
  SELECT DISTINCT ON (wm."workspace_id")
    wm."workspace_id",
    wm."user_id"
  FROM "workspace_members" wm
  WHERE wm."removed_at" IS NULL
  ORDER BY wm."workspace_id", wm."joined_at" ASC
)
UPDATE "workspaces" AS w
SET "owner_id" = fo."user_id"
FROM fallback_owner fo
WHERE fo."workspace_id" = w."id"
  AND w."owner_id" IS NULL;
--> statement-breakpoint

-- 3. Make sure the promoted fallback user also has OWNER role.
UPDATE "workspace_members" AS wm
SET "role" = 'OWNER'
FROM "workspaces" AS w
WHERE wm."workspace_id" = w."id"
  AND wm."user_id" = w."owner_id"
  AND wm."role" <> 'OWNER';
--> statement-breakpoint

-- 4. Final safety check.
-- If this fails, those workspaces have no members at all.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "workspaces"
    WHERE "owner_id" IS NULL
  ) THEN
    RAISE EXCEPTION 'Cannot continue: some workspaces have no members to promote as owner';
  END IF;
END $$;
--> statement-breakpoint