import { pgTable, uuid, varchar, real, integer, text, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users';

export const matches = pgTable('matches', {
  id: uuid('id').primaryKey().defaultRandom(),
  creatorId: uuid('creator_id').references(() => users.id).notNull(),
  dateTime: timestamp('date_time', { withTimezone: true }).notNull(),
  courtName: varchar('court_name', { length: 200 }).notNull(),
  courtLat: real('court_lat').notNull(),
  courtLng: real('court_lng').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('open'),
  maxPlayers: integer('max_players').notNull().default(10),
  result: varchar('result', { length: 20 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_matches_status').on(t.status),
  index('idx_matches_date').on(t.dateTime),
  index('idx_matches_geo').on(t.status, t.courtLat, t.courtLng),
  index('idx_matches_creator').on(t.creatorId),
]);
