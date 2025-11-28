CREATE TABLE "user_bookmarks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"posting_id" uuid NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "postings" ADD COLUMN "bookmark_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_bookmarks" ADD CONSTRAINT "user_bookmarks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_bookmarks" ADD CONSTRAINT "user_bookmarks_posting_id_postings_id_fk" FOREIGN KEY ("posting_id") REFERENCES "public"."postings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posting_specs" DROP COLUMN "house_rules";--> statement-breakpoint
ALTER TABLE "posting_specs" DROP COLUMN "amenities";--> statement-breakpoint
ALTER TABLE "postings" DROP COLUMN "favorite_count";