import {
  char,
  integer,
  pgTable,
  serial,
  unique,
  varchar,
} from 'drizzle-orm/pg-core';
import { createdAndUpdatedTimestamps } from './shared-types';

/* 
Location Hierarchy:
countries (ülke)
└── provinces (il)
    └── counties (ilçe)
        └── districts (belde / merkez / belediye)
            └── neighborhoods (mahalle + posta kodu)
*/

export const countries = pgTable('countries', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  code: char('code', { length: 2 }).notNull().unique(),
  ...createdAndUpdatedTimestamps,
});

export const provinces = pgTable(
  'provinces',
  {
    plateCode: integer('plate_code').primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    countryId: integer('country_id')
      .notNull()
      .references(() => countries.id, { onDelete: 'restrict' }),
    ...createdAndUpdatedTimestamps,
  },
  (table) => [
    unique('unique_name_per_country').on(table.name, table.countryId),
  ],
);

export const counties = pgTable(
  'counties',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    provincePlateCode: integer('province_plate_code')
      .notNull()
      .references(() => provinces.plateCode, { onDelete: 'restrict' }),
    ...createdAndUpdatedTimestamps,
  },
  (table) => [
    unique('unique_name_per_province').on(table.name, table.provincePlateCode),
  ],
);

export const districts = pgTable(
  'districts',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    countyId: integer('county_id')
      .notNull()
      .references(() => counties.id, { onDelete: 'restrict' }),
    ...createdAndUpdatedTimestamps,
  },
  (table) => [unique('unique_name_per_county').on(table.name, table.countyId)],
);

export const neighborhoods = pgTable(
  'neighborhoods',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 200 }).notNull(),
    postalCode: char('postal_code', { length: 5 }).notNull(),
    districtId: integer('district_id')
      .notNull()
      .references(() => districts.id, { onDelete: 'restrict' }),
    ...createdAndUpdatedTimestamps,
  },
  (table) => [
    unique('unique_name_per_district').on(table.name, table.districtId),
  ],
);
