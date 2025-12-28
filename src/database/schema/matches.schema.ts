import {
  pgTable,
  timestamp,
  uuid,
  unique,
  index,
  check,
} from 'drizzle-orm/pg-core';
import { createdAndUpdatedTimestamps } from './shared-types';
import { users } from './users.schema';
import { sql } from 'drizzle-orm';

export const matches = pgTable(
  'matches',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userFirstId: uuid('user_first_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    userSecondId: uuid('user_second_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    matchedAt: timestamp('matched_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    unmatchedAt: timestamp('unmatched_at', { withTimezone: true }),
    ...createdAndUpdatedTimestamps,
  },
  (table) => [
    unique('unique_match').on(table.userFirstId, table.userSecondId),
    index('user_first_idx').on(table.userFirstId),
    index('user_second_idx').on(table.userSecondId),
    index('matches_matched_at_idx').on(table.matchedAt.desc()),
    check(
      'check_different_users',
      sql`${table.userFirstId} != ${table.userSecondId}`,
    ),
  ],
);
