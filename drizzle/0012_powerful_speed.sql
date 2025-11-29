ALTER TABLE "posting_specs" ALTER COLUMN "occupant_gender_composition" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."occupant_gender_composition";--> statement-breakpoint
CREATE TYPE "public"."occupant_gender_composition" AS ENUM('all_male', 'all_female', 'mixed');--> statement-breakpoint
ALTER TABLE "posting_specs" ALTER COLUMN "occupant_gender_composition" SET DATA TYPE "public"."occupant_gender_composition" USING "occupant_gender_composition"::"public"."occupant_gender_composition";--> statement-breakpoint
ALTER TABLE "postings" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "postings" ALTER COLUMN "status" SET DEFAULT 'active'::text;--> statement-breakpoint
DROP TYPE "public"."posting_status";--> statement-breakpoint
CREATE TYPE "public"."posting_status" AS ENUM('active', 'inactive', 'rented');--> statement-breakpoint
ALTER TABLE "postings" ALTER COLUMN "status" SET DEFAULT 'active'::"public"."posting_status";--> statement-breakpoint
ALTER TABLE "postings" ALTER COLUMN "status" SET DATA TYPE "public"."posting_status" USING "status"::"public"."posting_status";