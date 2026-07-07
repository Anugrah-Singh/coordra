import {
  pgTable,
  uuid,
  text,
  timestamp,
  pgEnum,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

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

  ownerId: uuid('owner_id').references(() => users.id, {
      onDelete: 'restrict',
    }),

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

    removedAt: timestamp('removed_at'),
  },
  (table) => [
    uniqueIndex('workspace_user_unique_idx').on(
      table.workspaceId,
      table.userId
    ),
  ]
);