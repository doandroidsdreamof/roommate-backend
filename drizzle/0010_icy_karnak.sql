ALTER TABLE "posting_images" DROP CONSTRAINT "posting_images_posting_id_postings_id_fk";
--> statement-breakpoint
ALTER TABLE "posting_images" ADD COLUMN "posting_specs_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "posting_images" ADD CONSTRAINT "posting_images_posting_specs_id_posting_specs_id_fk" FOREIGN KEY ("posting_specs_id") REFERENCES "public"."posting_specs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posting_images" DROP COLUMN "posting_id";