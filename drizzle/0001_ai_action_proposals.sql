CREATE TYPE "public"."ai_action_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', 'EXECUTED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."ai_action_type" AS ENUM('CREATE_TASK', 'UPDATE_TASK', 'ADD_COMMENT');--> statement-breakpoint
CREATE TABLE "ai_action_proposals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"requester_id" uuid NOT NULL,
	"action_type" "ai_action_type" NOT NULL,
	"payload" jsonb NOT NULL,
	"status" "ai_action_status" DEFAULT 'PENDING' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"executed_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "ai_action_proposals" ADD CONSTRAINT "ai_action_proposals_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_action_proposals" ADD CONSTRAINT "ai_action_proposals_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_action_proposals_workspace_idx" ON "ai_action_proposals" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "ai_action_proposals_requester_idx" ON "ai_action_proposals" USING btree ("requester_id");--> statement-breakpoint
CREATE INDEX "ai_action_proposals_status_idx" ON "ai_action_proposals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ai_action_proposals_expiry_idx" ON "ai_action_proposals" USING btree ("expires_at");