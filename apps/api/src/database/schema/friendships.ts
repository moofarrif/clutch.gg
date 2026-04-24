import { pgTable, uuid, varchar, timestamp, unique, index } from 'drizzle-orm/pg-core';
import { users } from './users';

export const friendships = pgTable('friendships', {
  id: uuid('id').primaryKey().defaultRandom(),
  requesterId: uuid('requester_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  addresseeId: uuid('addressee_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique('uq_friendship').on(t.requesterId, t.addresseeId),
  index('idx_friendships_addressee').on(t.addresseeId),
  index('idx_friendships_requester').on(t.requesterId),
  index('idx_friendships_status').on(t.status),
]);
