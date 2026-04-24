import { pgTable, uuid, varchar, boolean, timestamp, primaryKey, index } from 'drizzle-orm/pg-core';
import { users } from './users';
import { matches } from './matches';

export const matchPlayers = pgTable('match_players', {
  matchId: uuid('match_id').references(() => matches.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  team: varchar('team', { length: 10 }),
  confirmed: boolean('confirmed').default(false),
  noShow: boolean('no_show').default(false),
  joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
  confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
}, (t) => [
  primaryKey({ columns: [t.matchId, t.userId] }),
  index('idx_match_players_match').on(t.matchId),
  index('idx_match_players_user').on(t.userId),
]);
