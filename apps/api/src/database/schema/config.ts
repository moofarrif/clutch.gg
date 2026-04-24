import { pgTable, varchar, jsonb, timestamp } from 'drizzle-orm/pg-core';

export const config = pgTable('config', {
  key: varchar('key', { length: 100 }).primaryKey(),
  value: jsonb('value').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
