CREATE TYPE "public"."account_status" AS ENUM('active', 'suspended', 'deleted');--> statement-breakpoint
CREATE TYPE "public"."age_range" AS ENUM('18-24', '25-30', '31-35', '36-40', '41-45', '46-50', '51-55', '56-60', '61-65', '65+');--> statement-breakpoint
CREATE TYPE "public"."alcohol_consumption" AS ENUM('never', 'occasionally', 'socially', 'regularly');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('male', 'female', 'other', 'prefer_not_to_say');--> statement-breakpoint
CREATE TYPE "public"."gender_preference" AS ENUM('female_only', 'male_only', 'mixed');--> statement-breakpoint
CREATE TYPE "public"."housing_search_type" AS ENUM('looking_for_room', 'looking_for_roommate', 'offering_room');--> statement-breakpoint
CREATE TYPE "public"."occupant_gender_composition" AS ENUM('all_male', 'all_female', 'mixed');--> statement-breakpoint
CREATE TYPE "public"."pet_compatibility" AS ENUM('yes_love_pets', 'no_bothered', 'no', 'doesnt_matter');--> statement-breakpoint
CREATE TYPE "public"."pet_ownership" AS ENUM('cat', 'dog', 'other', 'none');--> statement-breakpoint
CREATE TYPE "public"."posting_status" AS ENUM('active', 'inactive', 'rented');--> statement-breakpoint
CREATE TYPE "public"."posting_type" AS ENUM('offering_room', 'looking_for_room', 'looking_for_roommate');--> statement-breakpoint
CREATE TYPE "public"."smoking_habit" AS ENUM('regular', 'social', 'no');--> statement-breakpoint
CREATE TYPE "public"."actions" AS ENUM('pass', 'like');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('pending', 'verified', 'expired', 'failed');--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"expires_at" timestamp DEFAULT (NOW() AT TIME ZONE 'UTC') + INTERVAL '3 months' NOT NULL,
	"is_revoked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "refresh_tokens_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"status" "verification_status" DEFAULT 'pending' NOT NULL,
	"identifier" varchar(255) NOT NULL,
	"attempts_count" integer DEFAULT 0 NOT NULL,
	"code" varchar(6),
	"code_expires_at" timestamp,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "verifications_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "verifications_identifier_unique" UNIQUE("identifier"),
	CONSTRAINT "attempts_count" CHECK ("verifications"."attempts_count" <= 3)
);
--> statement-breakpoint
CREATE TABLE "counties" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"province_plate_code" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unique_name_per_province" UNIQUE("name","province_plate_code")
);
--> statement-breakpoint
CREATE TABLE "countries" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"code" char(2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "countries_name_unique" UNIQUE("name"),
	CONSTRAINT "countries_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "districts" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"county_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unique_name_per_county" UNIQUE("name","county_id")
);
--> statement-breakpoint
CREATE TABLE "neighborhoods" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"postal_code" char(5) NOT NULL,
	"district_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unique_name_per_district" UNIQUE("name","district_id")
);
--> statement-breakpoint
CREATE TABLE "provinces" (
	"plate_code" integer PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"country_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unique_name_per_country" UNIQUE("name","country_id")
);
--> statement-breakpoint
CREATE TABLE "posting_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"posting_specs_id" uuid NOT NULL,
	"images" jsonb NOT NULL,
	"is_verified" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "posting_specs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"posting_id" uuid NOT NULL,
	"description" text NOT NULL,
	"deposit_amount" integer NOT NULL,
	"bills_included" boolean DEFAULT false NOT NULL,
	"floor" integer NOT NULL,
	"total_floors" integer NOT NULL,
	"has_balcony" boolean NOT NULL,
	"has_parking" boolean NOT NULL,
	"has_elevator" boolean NOT NULL,
	"current_occupants" integer,
	"total_capacity" integer,
	"available_rooms" integer,
	"occupant_gender_composition" "occupant_gender_composition",
	"occupant_age_range" "age_range",
	"preferred_roommate_age_range" "age_range",
	"smoking_allowed" boolean,
	"alcohol_friendly" boolean,
	"has_pets" boolean,
	"current_pet_ownership" "pet_ownership",
	"available_until" timestamp with time zone,
	"nearby_transport" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "posting_specs_posting_id_unique" UNIQUE("posting_id")
);
--> statement-breakpoint
CREATE TABLE "postings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "posting_type" NOT NULL,
	"status" "posting_status" DEFAULT 'active' NOT NULL,
	"title" varchar(100) NOT NULL,
	"cover_image_url" text NOT NULL,
	"is_verified" boolean DEFAULT false,
	"city" varchar(100) NOT NULL,
	"district" varchar(100) NOT NULL,
	"neighborhood_id" integer NOT NULL,
	"latitude" numeric(10, 7) NOT NULL,
	"longitude" numeric(10, 7) NOT NULL,
	"rent_amount" integer NOT NULL,
	"room_count" integer NOT NULL,
	"bathroom_count" integer NOT NULL,
	"square_meters" integer NOT NULL,
	"is_furnished" boolean NOT NULL,
	"preferred_roommate_gender" "gender_preference" NOT NULL,
	"available_from" timestamp with time zone NOT NULL,
	"bookmark_count" integer DEFAULT 0 NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"housing_search_type" "housing_search_type" NOT NULL,
	"budget_min" integer,
	"budget_max" integer,
	"gender_preference" "gender_preference",
	"smoking_habit" "smoking_habit",
	"pet_ownership" "pet_ownership",
	"pet_compatibility" "pet_compatibility",
	"alcohol_consumption" "alcohol_consumption",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "profile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(30) NOT NULL,
	"age_range" "age_range" NOT NULL,
	"gender" "gender" NOT NULL,
	"city" varchar(100) NOT NULL,
	"district" varchar(100) NOT NULL,
	"photo_url" text,
	"photo_verified" boolean DEFAULT false NOT NULL,
	"account_status" "account_status" DEFAULT 'active' NOT NULL,
	"last_active_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profile_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "user_blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"blocker_id" uuid NOT NULL,
	"blocked_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_bookmarks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"posting_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone_number" varchar(20),
	"is_active" boolean DEFAULT true NOT NULL,
	"is_email_verified" boolean DEFAULT false NOT NULL,
	"is_phone_verified" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"is_anonymized" boolean DEFAULT false NOT NULL,
	"posting_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_phone_number_unique" UNIQUE("phone_number")
);
--> statement-breakpoint
CREATE TABLE "swipes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"swiper_id" uuid NOT NULL,
	"swiped_id" uuid NOT NULL,
	"actions" "actions" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unique_swipe" UNIQUE("swiper_id","swiped_id")
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_first_id" uuid NOT NULL,
	"user_second_id" uuid NOT NULL,
	"matched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"unmatched_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unique_match" UNIQUE("user_first_id","user_second_id"),
	CONSTRAINT "check_different_users" CHECK ("matches"."user_first_id" != "matches"."user_second_id")
);
--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verifications" ADD CONSTRAINT "verifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "counties" ADD CONSTRAINT "counties_province_plate_code_provinces_plate_code_fk" FOREIGN KEY ("province_plate_code") REFERENCES "public"."provinces"("plate_code") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "districts" ADD CONSTRAINT "districts_county_id_counties_id_fk" FOREIGN KEY ("county_id") REFERENCES "public"."counties"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neighborhoods" ADD CONSTRAINT "neighborhoods_district_id_districts_id_fk" FOREIGN KEY ("district_id") REFERENCES "public"."districts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provinces" ADD CONSTRAINT "provinces_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posting_images" ADD CONSTRAINT "posting_images_posting_specs_id_posting_specs_id_fk" FOREIGN KEY ("posting_specs_id") REFERENCES "public"."posting_specs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posting_specs" ADD CONSTRAINT "posting_specs_posting_id_postings_id_fk" FOREIGN KEY ("posting_id") REFERENCES "public"."postings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "postings" ADD CONSTRAINT "postings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "postings" ADD CONSTRAINT "postings_neighborhood_id_neighborhoods_id_fk" FOREIGN KEY ("neighborhood_id") REFERENCES "public"."neighborhoods"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preferences" ADD CONSTRAINT "preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile" ADD CONSTRAINT "profile_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_blocks" ADD CONSTRAINT "user_blocks_blocker_id_users_id_fk" FOREIGN KEY ("blocker_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_blocks" ADD CONSTRAINT "user_blocks_blocked_id_users_id_fk" FOREIGN KEY ("blocked_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_bookmarks" ADD CONSTRAINT "user_bookmarks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_bookmarks" ADD CONSTRAINT "user_bookmarks_posting_id_postings_id_fk" FOREIGN KEY ("posting_id") REFERENCES "public"."postings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "swipes" ADD CONSTRAINT "swipes_swiper_id_users_id_fk" FOREIGN KEY ("swiper_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "swipes" ADD CONSTRAINT "swipes_swiped_id_users_id_fk" FOREIGN KEY ("swiped_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_user_first_id_users_id_fk" FOREIGN KEY ("user_first_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_user_second_id_users_id_fk" FOREIGN KEY ("user_second_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "refresh_token_hash_idx" ON "refresh_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "postings_created_at_idx" ON "postings" USING btree ("created_at" DESC NULLS LAST) WHERE "postings"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "postings_user_id_idx" ON "postings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "preferences_user_id_idx" ON "preferences" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "preferences_housing_type_idx" ON "preferences" USING btree ("housing_search_type");--> statement-breakpoint
CREATE INDEX "preferences_user_housing_idx" ON "preferences" USING btree ("user_id","housing_search_type");--> statement-breakpoint
CREATE INDEX "preferences_budget_range_idx" ON "preferences" USING btree ("budget_min","budget_max");--> statement-breakpoint
CREATE INDEX "profile_user_id_idx" ON "profile" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "profile_city_gender_status_idx" ON "profile" USING btree ("city","gender","account_status");--> statement-breakpoint
CREATE INDEX "user_blocks_blocker_idx" ON "user_blocks" USING btree ("blocker_id");--> statement-breakpoint
CREATE INDEX "user_blocks_blocked_idx" ON "user_blocks" USING btree ("blocked_id");--> statement-breakpoint
CREATE INDEX "user_blocks_blocker_blocked_idx" ON "user_blocks" USING btree ("blocker_id","blocked_id");--> statement-breakpoint
CREATE INDEX "user_bookmarks_user_created_idx" ON "user_bookmarks" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "user_bookmarks_posting_idx" ON "user_bookmarks" USING btree ("posting_id");--> statement-breakpoint
CREATE INDEX "users_not_deleted_idx" ON "users" USING btree ("id") WHERE "users"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "swiper_idx" ON "swipes" USING btree ("swiper_id");--> statement-breakpoint
CREATE INDEX "swiped_idx" ON "swipes" USING btree ("swiped_id");--> statement-breakpoint
CREATE INDEX "user_first_idx" ON "matches" USING btree ("user_first_id");--> statement-breakpoint
CREATE INDEX "user_second_idx" ON "matches" USING btree ("user_second_id");--> statement-breakpoint
CREATE INDEX "matches_matched_at_idx" ON "matches" USING btree ("matched_at" DESC NULLS LAST);