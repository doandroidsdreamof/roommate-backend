ALTER TABLE "districts" DROP CONSTRAINT "districts_county_id_counties_id_fk";
--> statement-breakpoint
ALTER TABLE "neighborhoods" DROP CONSTRAINT "neighborhoods_district_id_districts_id_fk";
--> statement-breakpoint
ALTER TABLE "districts" ADD CONSTRAINT "districts_county_id_counties_id_fk" FOREIGN KEY ("county_id") REFERENCES "public"."counties"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neighborhoods" ADD CONSTRAINT "neighborhoods_district_id_districts_id_fk" FOREIGN KEY ("district_id") REFERENCES "public"."districts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "counties" ADD CONSTRAINT "unique_name_per_province" UNIQUE("name","province_plate_code");--> statement-breakpoint
ALTER TABLE "districts" ADD CONSTRAINT "unique_name_per_county" UNIQUE("name","county_id");--> statement-breakpoint
ALTER TABLE "neighborhoods" ADD CONSTRAINT "unique_name_per_district" UNIQUE("name","district_id");--> statement-breakpoint
ALTER TABLE "provinces" ADD CONSTRAINT "unique_name_per_country" UNIQUE("name","country_id");