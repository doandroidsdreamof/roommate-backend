import { relations } from 'drizzle-orm';
import { refreshToken, verifications } from './auth.schema';
import {
  counties,
  districts,
  neighborhoods,
  provinces,
} from './locations.schema';
import { postingImages, postings, postingSpecs } from './postings.schema';
import { preferences, profile, users } from './users.schema';

// Location Relations
export const provincesRelations = relations(provinces, ({ many }) => ({
  counties: many(counties),
}));

export const countiesRelations = relations(counties, ({ one, many }) => ({
  province: one(provinces, {
    fields: [counties.provincePlateCode],
    references: [provinces.plateCode],
  }),
  districts: many(districts),
}));

export const districtsRelations = relations(districts, ({ one, many }) => ({
  county: one(counties, {
    fields: [districts.countyId],
    references: [counties.id],
  }),
  neighborhoods: many(neighborhoods),
}));

export const neighborhoodsRelations = relations(neighborhoods, ({ one }) => ({
  district: one(districts, {
    fields: [neighborhoods.districtId],
    references: [districts.id],
  }),
}));

// User Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  verifications: one(verifications),
  refreshToken: one(refreshToken),
  profile: one(profile),
  preferences: one(preferences),
  postings: many(postings),
}));

export const verificationsRelations = relations(verifications, ({ one }) => ({
  user: one(users, {
    fields: [verifications.userId],
    references: [users.id],
  }),
}));

export const refreshTokenRelations = relations(refreshToken, ({ one }) => ({
  user: one(users, {
    fields: [refreshToken.userId],
    references: [users.id],
  }),
}));

export const profileRelations = relations(profile, ({ one }) => ({
  user: one(users, {
    fields: [profile.userId],
    references: [users.id],
  }),
}));

export const preferencesRelations = relations(preferences, ({ one }) => ({
  user: one(users, {
    fields: [preferences.userId],
    references: [users.id],
  }),
}));

// Posting Relations
export const postingsRelations = relations(postings, ({ one, many }) => ({
  user: one(users, {
    fields: [postings.userId],
    references: [users.id],
  }),
  neighborhood: one(neighborhoods, {
    fields: [postings.neighborhoodId],
    references: [neighborhoods.id],
  }),
  specs: one(postingSpecs),
  images: many(postingImages),
}));

export const postingSpecsRelations = relations(postingSpecs, ({ one }) => ({
  posting: one(postings, {
    fields: [postingSpecs.postingId],
    references: [postings.id],
  }),
}));

export const postingImagesRelations = relations(postingImages, ({ one }) => ({
  posting: one(postings, {
    fields: [postingImages.postingId],
    references: [postings.id],
  }),
}));
