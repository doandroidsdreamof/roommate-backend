DROP INDEX "postings_created_at_idx";--> statement-breakpoint
CREATE INDEX "postings_created_at_idx" ON "postings" USING btree ("created_at" DESC NULLS LAST) WHERE "postings"."deleted_at" IS NULL;