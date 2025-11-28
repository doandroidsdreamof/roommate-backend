CREATE TYPE "public"."alcohol_consumption" AS ENUM('never', 'occasionally', 'socially', 'regularly');--> statement-breakpoint
ALTER TABLE "postings" ALTER COLUMN "rent_amount" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "postings" ALTER COLUMN "deposit_amount" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "postings" ALTER COLUMN "bills_included" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "postings" ALTER COLUMN "room_count" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "postings" ALTER COLUMN "bathroom_count" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "postings" ALTER COLUMN "square_meters" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "postings" ALTER COLUMN "floor" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "postings" ALTER COLUMN "total_floors" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "postings" ALTER COLUMN "is_furnished" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "postings" ALTER COLUMN "has_balcony" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "postings" ALTER COLUMN "has_parking" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "postings" ALTER COLUMN "has_elevator" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "postings" ALTER COLUMN "preferred_roommate_gender" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "postings" ADD COLUMN "smoking_allowed" boolean;--> statement-breakpoint
ALTER TABLE "postings" ADD COLUMN "alcohol_friendly" boolean;--> statement-breakpoint
ALTER TABLE "postings" ADD COLUMN "has_pets" boolean;--> statement-breakpoint
ALTER TABLE "preferences" ADD COLUMN "alcohol_consumption" "alcohol_consumption";--> statement-breakpoint
ALTER TABLE "postings" DROP COLUMN "preferred_smoking_habit";--> statement-breakpoint
ALTER TABLE "postings" DROP COLUMN "current_smoking_habit";--> statement-breakpoint
ALTER TABLE "postings" DROP COLUMN "preferred_pet_compatibility";