import { char, integer, pgTable, serial, varchar } from 'drizzle-orm/pg-core';
import { createdAndUpdatedTimestamps } from './shared-types';

/* 
Location Hierarchy:
provinces (il)
└── counties (ilçe)
    └── districts (belde / merkez / belediye)
        └── neighborhoods (mahalle + posta kodu)
*/

export const provinces = pgTable('provinces', {
  plateCode: integer('plate_code').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  ...createdAndUpdatedTimestamps,
});

export const counties = pgTable('counties', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  provincePlateCode: integer('province_plate_code')
    .notNull()
    .references(() => provinces.plateCode, { onDelete: 'restrict' }),
  ...createdAndUpdatedTimestamps,
});

export const districts = pgTable('districts', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  countyId: integer('county_id')
    .notNull()
    .references(() => counties.id, { onDelete: 'cascade' }),
  ...createdAndUpdatedTimestamps,
});

export const neighborhoods = pgTable('neighborhoods', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  code: char('postal_code', { length: 5 }).notNull(),
  districtId: integer('district_id')
    .notNull()
    .references(() => districts.id, { onDelete: 'cascade' }),
  ...createdAndUpdatedTimestamps,
});
