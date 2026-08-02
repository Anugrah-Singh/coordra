import { pgTable, uuid, text, timestamp, pgEnum, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

import { users } from './users.js';

export const roleEnum = pgEnum('workspace_role', [
  'OWNER',
  'ADMIN',
  'MANAGER',
  'MEMBER',
  'VIEWER',
]);

export const workspaces = pgTable('workspaces', {
  id: uuid('id').primaryKey().defaultRandom(),

  name: text('name').notNull(),

  slug: text('slug').notNull().unique(),

  createdAt: timestamp('created_at').defaultNow().notNull(),

  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const workspaceMembers = pgTable(
  'workspace_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    workspaceId: uuid('workspace_id')
      .references(() => workspaces.id, {
        onDelete: 'cascade',
      })
      .notNull(),

    userId: uuid('user_id')
      .references(() => users.id, {
        onDelete: 'cascade',
      })
      .notNull(),

    role: roleEnum('role').default('MEMBER').notNull(),

    joinedAt: timestamp('joined_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('workspace_user_unique_idx').on(table.workspaceId, table.userId),
    uniqueIndex('workspace_single_owner_idx')
      .on(table.workspaceId)
      .where(sql`${table.role} = 'OWNER'`),
  ]
);
