import { relations } from 'drizzle-orm';
import { refreshToken, verifications } from './auth.schema';
import {
  counties,
  countries,
  districts,
  neighborhoods,
  provinces,
} from './locations.schema';
import { postingImages, postings, postingSpecs } from './postings.schema';
import {
  preferences,
  profile,
  userBlocks,
  userBookmarks,
  users,
} from './users.schema';
import { swipes } from './swipes.schema';
import { matches } from './matches.schema';
import { conversations, pendingMessages, userKeys } from './messages.schema';

// Location Relations
export const countriesRelations = relations(countries, ({ many }) => ({
  provinces: many(provinces),
}));

export const provincesRelations = relations(provinces, ({ one, many }) => ({
  country: one(countries, {
    fields: [provinces.countryId],
    references: [countries.id],
  }),
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
  verifications: one(verifications), // TODO rename it singular
  refreshToken: one(refreshToken),
  profile: one(profile),
  preferences: one(preferences),
  postings: many(postings),
  bookmarks: many(userBookmarks),
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
  preferences: one(preferences, {
    fields: [profile.userId],
    references: [preferences.userId],
  }),
}));

export const preferencesRelations = relations(preferences, ({ one }) => ({
  user: one(users, {
    fields: [preferences.userId],
    references: [users.id],
  }),
  profile: one(profile, {
    fields: [preferences.userId],
    references: [profile.userId],
  }),
}));

// Posting Relations
export const postingsRelations = relations(postings, ({ one }) => ({
  user: one(users, {
    fields: [postings.userId],
    references: [users.id],
  }),
  neighborhood: one(neighborhoods, {
    fields: [postings.neighborhoodId],
    references: [neighborhoods.id],
  }),
  specs: one(postingSpecs),
}));

export const postingSpecsRelations = relations(postingSpecs, ({ one }) => ({
  posting: one(postings, {
    fields: [postingSpecs.postingId],
    references: [postings.id],
  }),
}));

export const postingImagesRelations = relations(postingImages, ({ one }) => ({
  postingSpecs: one(postingSpecs, {
    fields: [postingImages.postingSpecsId],
    references: [postingSpecs.id],
  }),
}));

export const userBookmarksRelations = relations(userBookmarks, ({ one }) => ({
  user: one(users, {
    fields: [userBookmarks.userId],
    references: [users.id],
  }),
  posting: one(postings, {
    fields: [userBookmarks.postingId],
    references: [postings.id],
  }),
}));

export const userBlocksRelations = relations(userBlocks, ({ one }) => ({
  blocker: one(users, {
    fields: [userBlocks.blockerId],
    references: [users.id],
  }),
  blocked: one(users, {
    fields: [userBlocks.blockedId],
    references: [users.id],
  }),
}));

export const swipesRelations = relations(swipes, ({ one }) => ({
  swiper: one(users, {
    fields: [swipes.swiperId],
    references: [users.id],
  }),
  swiped: one(users, {
    fields: [swipes.swipedId],
    references: [users.id],
  }),
}));

export const matchesRelations = relations(matches, ({ one }) => ({
  userFrist: one(users, {
    fields: [matches.userFirstId],
    references: [users.id],
  }),
  userSecond: one(users, {
    fields: [matches.userSecondId],
    references: [users.id],
  }),
}));

export const conversationsRelations = relations(
  conversations,
  ({ one, many }) => ({
    userFirst: one(users, {
      fields: [conversations.userFirstId],
      references: [users.id],
    }),
    userSecond: one(users, {
      fields: [conversations.userSecondId],
      references: [users.id],
    }),
    pendingMessages: many(pendingMessages),
  }),
);

export const pendingMessagesRelations = relations(
  pendingMessages,
  ({ one }) => ({
    conversation: one(conversations, {
      fields: [pendingMessages.conversationId],
      references: [conversations.id],
    }),
    sender: one(users, {
      fields: [pendingMessages.senderId],
      references: [users.id],
    }),
    recipient: one(users, {
      fields: [pendingMessages.recipientId],
      references: [users.id],
    }),
  }),
);
export const userKeysRelations = relations(userKeys, ({ one }) => ({
  user: one(users, {
    fields: [userKeys.userId],
    references: [users.id],
  }),
}));
