import { pgTable, uuid, varchar, integer, real, timestamp, index, primaryKey, unique } from 'drizzle-orm/pg-core';
import { users } from './users';

export const squads = pgTable('squads', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 50 }).notNull(),
  tag: varchar('tag', { length: 10 }),
  creatorId: uuid('creator_id').references(() => users.id).notNull(),
  avgMmr: integer('avg_mmr').notNull().default(1000),
  wins: integer('wins').notNull().default(0),
  losses: integer('losses').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_squads_creator').on(t.creatorId),
  index('idx_squads_mmr').on(t.avgMmr),
]);

export const squadMembers = pgTable('squad_members', {
  squadId: uuid('squad_id').references(() => squads.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  role: varchar('role', { length: 20 }).notNull().default('member'),
  joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  primaryKey({ columns: [t.squadId, t.userId] }),
  index('idx_squad_members_squad').on(t.squadId),
  index('idx_squad_members_user').on(t.userId),
]);

export const squadInvitations = pgTable('squad_invitations', {
  id: uuid('id').primaryKey().defaultRandom(),
  squadId: uuid('squad_id').references(() => squads.id, { onDelete: 'cascade' }).notNull(),
  fromUserId: uuid('from_user_id').references(() => users.id).notNull(),
  toUserId: uuid('to_user_id').references(() => users.id).notNull(),
  type: varchar('type', { length: 20 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique('uq_squad_invite').on(t.squadId, t.fromUserId, t.toUserId),
  index('idx_squad_invites_to').on(t.toUserId),
  index('idx_squad_invites_squad').on(t.squadId),
]);
