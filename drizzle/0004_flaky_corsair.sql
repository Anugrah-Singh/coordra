ALTER TABLE "tasks"
DROP CONSTRAINT "tasks_project_id_projects_id_fk";
--> statement-breakpoint

DELETE FROM "tasks"
WHERE "project_id" IS NULL;
--> statement-breakpoint

ALTER TABLE "tasks"
ALTER COLUMN "project_id" SET NOT NULL;
--> statement-breakpoint

ALTER TABLE "tasks"
ADD CONSTRAINT "tasks_project_id_projects_id_fk"
FOREIGN KEY ("project_id")
REFERENCES "public"."projects"("id")
ON DELETE cascade
ON UPDATE no action;