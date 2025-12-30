ALTER TABLE "verifications" DROP CONSTRAINT "attempts_count";--> statement-breakpoint
ALTER TABLE "verifications" ADD CONSTRAINT "attempts_count" CHECK ("verifications"."attempts_count" >= 0 AND "verifications"."attempts_count" <= 3);--> statement-breakpoint
ALTER TABLE "swipes" ADD CONSTRAINT "no_self_swipe" CHECK ("swipes"."swiper_id" != "swipes"."swiped_id");