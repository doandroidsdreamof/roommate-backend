DROP INDEX "conversations_last_message_idx";--> statement-breakpoint
ALTER TABLE "conversations" DROP COLUMN "last_message_at";