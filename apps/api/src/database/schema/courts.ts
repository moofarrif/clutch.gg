import { pgTable, uuid, varchar, real, text, timestamp, boolean, index } from 'drizzle-orm/pg-core';

export const courts = pgTable('courts', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 200 }).notNull(),
  address: varchar('address', { length: 500 }).notNull(),
  city: varchar('city', { length: 100 }).notNull(),
  lat: real('lat').notNull(),
  lng: real('lng').notNull(),
  surface: varchar('surface', { length: 50 }).notNull().default('sintética'),
  photoUrl: text('photo_url'),
  verified: boolean('verified').notNull().default(false),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_courts_city').on(t.city),
  index('idx_courts_active').on(t.active),
  index('idx_courts_geo').on(t.lat, t.lng),
]);
