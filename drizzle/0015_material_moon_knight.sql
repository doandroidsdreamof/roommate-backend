ALTER TABLE "posting_images" ADD COLUMN "images" jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "posting_images" DROP COLUMN "image_url";