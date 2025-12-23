DROP INDEX "profile_city_gender_status_idx";--> statement-breakpoint
CREATE INDEX "profile_city_gender_status_idx" ON "profile" USING btree ("city","gender","account_status");