import { pgTable, uuid, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users';
import { matches } from './matches';

export const eloHistory = pgTable('elo_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  matchId: uuid('match_id').references(() => matches.id).notNull(),
  mmrBefore: integer('mmr_before').notNull(),
  mmrAfter: integer('mmr_after').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_elo_history_user').on(t.userId, t.createdAt),
]);
