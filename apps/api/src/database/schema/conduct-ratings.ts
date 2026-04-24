import { pgTable, uuid, smallint, timestamp, unique, index } from 'drizzle-orm/pg-core';
import { users } from './users';
import { matches } from './matches';

export const conductRatings = pgTable('conduct_ratings', {
  id: uuid('id').primaryKey().defaultRandom(),
  matchId: uuid('match_id').references(() => matches.id, { onDelete: 'cascade' }).notNull(),
  raterId: uuid('rater_id').references(() => users.id).notNull(),
  ratedId: uuid('rated_id').references(() => users.id).notNull(),
  score: smallint('score').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique('uq_conduct_rating').on(t.matchId, t.raterId, t.ratedId),
  index('idx_conduct_ratings_rated').on(t.ratedId),
]);
