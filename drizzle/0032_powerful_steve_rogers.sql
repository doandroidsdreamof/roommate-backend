ALTER TABLE "preferences" ALTER COLUMN "budget_min" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "preferences" ALTER COLUMN "budget_max" SET DATA TYPE integer;--> statement-breakpoint
CREATE INDEX "preferences_budget_range_idx" ON "preferences" USING btree ("budget_min","budget_max");--> statement-breakpoint
CREATE INDEX "user_blocks_blocker_blocked_idx" ON "user_blocks" USING btree ("blocker_id","blocked_id");--> statement-breakpoint
CREATE INDEX "user_bookmarks_posting_idx" ON "user_bookmarks" USING btree ("posting_id");