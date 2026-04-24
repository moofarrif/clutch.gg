import { pgTable, uuid, varchar, integer, primaryKey, index } from 'drizzle-orm/pg-core';
import { users } from './users';
import { matches } from './matches';

export const matchVotes = pgTable('match_votes', {
  matchId: uuid('match_id').references(() => matches.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  vote: varchar('vote', { length: 10 }).notNull(),
  scoreA: integer('score_a'),
  scoreB: integer('score_b'),
}, (t) => [
  primaryKey({ columns: [t.matchId, t.userId] }),
  index('idx_match_votes_match').on(t.matchId),
]);
