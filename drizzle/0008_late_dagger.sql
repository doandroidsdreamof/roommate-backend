CREATE TABLE "posting_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"posting_id" uuid NOT NULL,
	"image_url" text NOT NULL,
	"is_verified" boolean DEFAULT false,
	"display_order" integer NOT NULL,
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
	"house_rules" text,
	"amenities" text,
	"nearby_transport" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "posting_specs_posting_id_unique" UNIQUE("posting_id")
);
--> statement-breakpoint
ALTER TABLE "postings" ADD COLUMN "cover_image_url" text NOT NULL;--> statement-breakpoint
ALTER TABLE "postings" ADD COLUMN "is_verified" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "posting_images" ADD CONSTRAINT "posting_images_posting_id_postings_id_fk" FOREIGN KEY ("posting_id") REFERENCES "public"."postings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posting_specs" ADD CONSTRAINT "posting_specs_posting_id_postings_id_fk" FOREIGN KEY ("posting_id") REFERENCES "public"."postings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "postings" DROP COLUMN "description";--> statement-breakpoint
ALTER TABLE "postings" DROP COLUMN "deposit_amount";--> statement-breakpoint
ALTER TABLE "postings" DROP COLUMN "bills_included";--> statement-breakpoint
ALTER TABLE "postings" DROP COLUMN "floor";--> statement-breakpoint
ALTER TABLE "postings" DROP COLUMN "total_floors";--> statement-breakpoint
ALTER TABLE "postings" DROP COLUMN "has_balcony";--> statement-breakpoint
ALTER TABLE "postings" DROP COLUMN "has_parking";--> statement-breakpoint
ALTER TABLE "postings" DROP COLUMN "has_elevator";--> statement-breakpoint
ALTER TABLE "postings" DROP COLUMN "current_occupants";--> statement-breakpoint
ALTER TABLE "postings" DROP COLUMN "total_capacity";--> statement-breakpoint
ALTER TABLE "postings" DROP COLUMN "available_rooms";--> statement-breakpoint
ALTER TABLE "postings" DROP COLUMN "occupant_gender_composition";--> statement-breakpoint
ALTER TABLE "postings" DROP COLUMN "occupant_age_range";--> statement-breakpoint
ALTER TABLE "postings" DROP COLUMN "preferred_roommate_age_range";--> statement-breakpoint
ALTER TABLE "postings" DROP COLUMN "smoking_allowed";--> statement-breakpoint
ALTER TABLE "postings" DROP COLUMN "alcohol_friendly";--> statement-breakpoint
ALTER TABLE "postings" DROP COLUMN "has_pets";--> statement-breakpoint
ALTER TABLE "postings" DROP COLUMN "current_pet_ownership";--> statement-breakpoint
ALTER TABLE "postings" DROP COLUMN "available_until";