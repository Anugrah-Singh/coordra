import { timestamp, uuid } from 'drizzle-orm/pg-core';

export const pk = {
  id: uuid('id').primaryKey().defaultRandom(),
};

export const createdAtCol = {
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
};

export const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
};
