import { InferSelectModel } from 'drizzle-orm';
import { refreshToken, verifications } from './auth.schema';
import {
  counties,
  districts,
  neighborhoods,
  provinces,
} from './locations.schema';
import {
  postingImages,
  postings,
  postingSpecs,
  postingViews,
} from './postings.schema';
import {
  preferences,
  profile,
  userBlocks,
  userBookmarks,
  users,
} from './users.schema';
import { swipes } from './swipes.schema';
import { matches } from './matches.schema';
import { conversations, userKeys, pendingMessages } from './messages.schema';

// User Types
export type User = InferSelectModel<typeof users>;
export type Profile = InferSelectModel<typeof profile>;
export type Preferences = InferSelectModel<typeof preferences>;
export type UserBookmark = InferSelectModel<typeof userBookmarks>;
export type UserBlocks = InferSelectModel<typeof userBlocks>;

// Auth Types
export type Verification = InferSelectModel<typeof verifications>;
export type RefreshToken = InferSelectModel<typeof refreshToken>;

// Location Types
export type Province = InferSelectModel<typeof provinces>;
export type County = InferSelectModel<typeof counties>;
export type District = InferSelectModel<typeof districts>;
export type Neighborhood = InferSelectModel<typeof neighborhoods>;

// Posting Types
export type Posting = InferSelectModel<typeof postings>;
export type PostingSpecs = InferSelectModel<typeof postingSpecs>;
export type PostingImage = InferSelectModel<typeof postingImages>;
export type PostingViews = InferSelectModel<typeof postingViews>;

// Swipes and Matches
export type Swipes = InferSelectModel<typeof swipes>;
export type Matches = InferSelectModel<typeof matches>;

// Messaging types
export type Conversation = InferSelectModel<typeof conversations>;
export type UserKey = InferSelectModel<typeof userKeys>;
export type PendingMessage = InferSelectModel<typeof pendingMessages>;
