CREATE TYPE "public"."occupant_gender_composition" AS ENUM('male_only', 'female_only', 'mixed', 'not_specified');--> statement-breakpoint
CREATE TYPE "public"."posting_status" AS ENUM('active', 'inactive', 'rented', 'expired');--> statement-breakpoint
CREATE TYPE "public"."posting_type" AS ENUM('offering_room', 'looking_for_room', 'looking_for_roommate');--> statement-breakpoint
CREATE TABLE "postings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "posting_type" NOT NULL,
	"status" "posting_status" DEFAULT 'active' NOT NULL,
	"title" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"city" varchar(100) NOT NULL,
	"district" varchar(100) NOT NULL,
	"neighborhood_id" integer NOT NULL,
	"latitude" numeric(10, 7) NOT NULL,
	"longitude" numeric(10, 7) NOT NULL,
	"rent_amount" integer,
	"deposit_amount" integer,
	"bills_included" boolean DEFAULT false,
	"room_count" integer,
	"bathroom_count" integer,
	"square_meters" integer,
	"floor" integer,
	"total_floors" integer,
	"is_furnished" boolean,
	"has_balcony" boolean,
	"has_parking" boolean,
	"has_elevator" boolean,
	"current_occupants" integer,
	"total_capacity" integer,
	"available_rooms" integer,
	"occupant_gender_composition" "occupant_gender_composition",
	"occupant_age_range" "age_range",
	"preferred_roommate_gender" "gender_preference",
	"preferred_roommate_age_range" "age_range",
	"preferred_smoking_habit" "smoking_habit",
	"current_smoking_habit" "smoking_habit",
	"preferred_pet_compatibility" "pet_compatibility",
	"current_pet_ownership" "pet_ownership",
	"available_from" timestamp with time zone NOT NULL,
	"available_until" timestamp with time zone,
	"view_count" integer DEFAULT 0 NOT NULL,
	"favorite_count" integer DEFAULT 0 NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profile" DROP CONSTRAINT "profile_name_unique";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_anonymized" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "postings" ADD CONSTRAINT "postings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "postings" ADD CONSTRAINT "postings_neighborhood_id_neighborhoods_id_fk" FOREIGN KEY ("neighborhood_id") REFERENCES "public"."neighborhoods"("id") ON DELETE restrict ON UPDATE no action;