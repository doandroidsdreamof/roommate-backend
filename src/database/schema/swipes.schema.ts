import { pgTable, uuid, unique, index } from 'drizzle-orm/pg-core';
import { createdAndUpdatedTimestamps } from './shared-types';
import { users } from './users.schema';
import { swipesEnum } from './enums.schema';

export const swipes = pgTable(
  'swipes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    swiperId: uuid('swiper_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    swipedId: uuid('swiped_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    action: swipesEnum('actions').notNull(),
    ...createdAndUpdatedTimestamps,
  },
  (table) => [
    unique('unique_swipe').on(table.swiperId, table.swipedId),
    index('swiper_idx').on(table.swiperId),
    index('swiped_idx').on(table.swipedId),
  ],
);
