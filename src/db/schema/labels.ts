import {
  pgTable,
  uuid,
  timestamp,
  text,
  primaryKey,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

import { workspaces } from './workspaces.js';
import { tasks } from './tasks.js';

export const labels = pgTable(
  'labels',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    workspaceId: uuid('workspace_id')
      .references(() => workspaces.id, {
        onDelete: 'cascade',
      })
      .notNull(),

    name: text('name').notNull(),

    color: text('color').default('#000000').notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('labels_workspace_name_unique_idx').on(
      table.workspaceId,
      table.name
    ),
  ]
);

export const taskLabels = pgTable(
  'task_labels',
  {
    taskId: uuid('task_id')
      .references(() => tasks.id, {
        onDelete: 'cascade',
      })
      .notNull(),

    labelId: uuid('label_id')
      .references(() => labels.id, {
        onDelete: 'cascade',
      })
      .notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.taskId, table.labelId],
    }),
    index('task_labels_task_idx').on(table.taskId),
    index('task_labels_label_idx').on(table.labelId),
  ]
);