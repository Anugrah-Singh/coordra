-- Custom SQL migration file, put your code below! --

UPDATE "workspaces" AS w
SET "owner_id" = wm."user_id"
FROM "workspace_members" AS wm
WHERE wm."workspace_id" = w."id"
  AND wm."role" = 'OWNER'
  AND w."owner_id" IS NULL;
--> statement-breakpoint

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "workspaces"
    WHERE "owner_id" IS NULL
  ) THEN
    RAISE EXCEPTION 'Cannot continue: some workspaces still have no owner_id';
  END IF;
END $$;
--> statement-breakpoint