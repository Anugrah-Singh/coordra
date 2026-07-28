import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';

import { workspaces } from './workspaces.js';
import { tasks } from './tasks.js';
import { users } from './users.js';

export const comments = pgTable(
  'comments',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    workspaceId: uuid('workspace_id')
      .references(() => workspaces.id, {
        onDelete: 'cascade',
      })
      .notNull(),

    taskId: uuid('task_id')
      .references(() => tasks.id, {
        onDelete: 'cascade',
      })
      .notNull(),

    authorId: uuid('author_id')
      .references(() => users.id, {
        onDelete: 'cascade',
      })
      .notNull(),

    content: text('content').notNull(),

    editedAt: timestamp('edited_at'),

    createdAt: timestamp('created_at').defaultNow().notNull(),

    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('comments_workspace_idx').on(table.workspaceId),
    index('comments_task_idx').on(table.taskId),
    index('comments_author_idx').on(table.authorId),
  ]
);
