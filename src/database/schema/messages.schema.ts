import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { users } from './users.schema';

export const conversations = pgTable(
  'conversations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userFirstId: uuid('user_first_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    userSecondId: uuid('user_second_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('conversations_user_first_idx').on(table.userFirstId),
    index('conversations_user_second_idx').on(table.userSecondId),
  ],
);

export const userKeys = pgTable('user_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  publicKey: text('public_key').notNull(),
  keyId: uuid('key_id').notNull().unique(),
  deviceModel: text('device_model'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const pendingMessages = pgTable(
  'pending_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),
    senderId: uuid('sender_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    recipientId: uuid('recipient_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    messages: jsonb('messages')
      .$type<Array<{ message: string; createdAt: Date }>>()
      .notNull(),
    nonce: text('nonce').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    expiresAt: timestamp('expires_at')
      .default(sql`NOW() + INTERVAL '7 days'`)
      .notNull(),
  },
  (table) => [
    uniqueIndex('pending_messages_conversation_unique').on(
      table.conversationId,
    ),
  ],
);
