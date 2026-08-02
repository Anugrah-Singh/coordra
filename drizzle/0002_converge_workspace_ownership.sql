ALTER TABLE "workspaces" DROP COLUMN IF EXISTS "owner_id";--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "workspace_single_owner_idx" ON "workspace_members" USING btree ("workspace_id") WHERE "workspace_members"."role" = 'OWNER';
