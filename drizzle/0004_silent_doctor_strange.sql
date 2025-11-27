CREATE TYPE "public"."gender_preference" AS ENUM('female_only', 'male_only', 'mixed');--> statement-breakpoint
CREATE TYPE "public"."housing_search_type" AS ENUM('looking_for_room', 'looking_for_roommate', 'offering_room');--> statement-breakpoint
CREATE TYPE "public"."pet_compatibility" AS ENUM('yes_love_pets', 'no_bothered', 'no', 'doesnt_matter');--> statement-breakpoint
CREATE TYPE "public"."pet_ownership" AS ENUM('cat', 'dog', 'other', 'none');--> statement-breakpoint
CREATE TYPE "public"."smoking_habit" AS ENUM('regular', 'social', 'no');--> statement-breakpoint
CREATE TABLE "preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"housing_search_type" "housing_search_type" NOT NULL,
	"budget_min" varchar(20),
	"budget_max" varchar(20),
	"search_timeline" varchar(50),
	"gender_preference" "gender_preference",
	"smoking_habit" "smoking_habit",
	"pet_ownership" "pet_ownership",
	"pet_compatibility" "pet_compatibility",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "preferences" ADD CONSTRAINT "preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile" ADD CONSTRAINT "profile_name_unique" UNIQUE("name");