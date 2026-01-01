ALTER TABLE "posting_specs" ADD CONSTRAINT "posting_specs_deposit_non_negative" CHECK ("posting_specs"."deposit_amount" >= 0);--> statement-breakpoint
ALTER TABLE "posting_specs" ADD CONSTRAINT "posting_specs_description_not_empty" CHECK (LENGTH(TRIM("posting_specs"."description")) > 0);--> statement-breakpoint
ALTER TABLE "postings" ADD CONSTRAINT "postings_bookmark_count_non_negative" CHECK ("postings"."bookmark_count" >= 0);--> statement-breakpoint
ALTER TABLE "postings" ADD CONSTRAINT "postings_view_count_non_negative" CHECK ("postings"."view_count" >= 0);--> statement-breakpoint
ALTER TABLE "preferences" ADD CONSTRAINT "preferences_budget_min_positive" CHECK ("preferences"."budget_min" IS NULL OR "preferences"."budget_min" > 0);--> statement-breakpoint
ALTER TABLE "preferences" ADD CONSTRAINT "preferences_budget_max_positive" CHECK ("preferences"."budget_max" IS NULL OR "preferences"."budget_max" > 0);--> statement-breakpoint
ALTER TABLE "preferences" ADD CONSTRAINT "preferences_budget_valid_range" CHECK (
        "preferences"."budget_min" IS NULL 
        OR "preferences"."budget_max" IS NULL 
        OR "preferences"."budget_max" > "preferences"."budget_min"
      );--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_posting_count_non_negative" CHECK ("users"."posting_count" >= 0);