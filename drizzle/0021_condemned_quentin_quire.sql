CREATE INDEX "swiper_idx" ON "swipes" USING btree ("swiper_id");--> statement-breakpoint
CREATE INDEX "user_first_idx" ON "matches" USING btree ("user_first_id");--> statement-breakpoint
CREATE INDEX "user_second_idx" ON "matches" USING btree ("user_second_id");--> statement-breakpoint
ALTER TABLE "swipes" ADD CONSTRAINT "unique_swipe" UNIQUE("swiper_id","swiped_id");--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "unique_match" UNIQUE("user_first_id","user_second_id");--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "check_different_users" CHECK ("matches"."user_first_id" != "matches"."user_second_id");