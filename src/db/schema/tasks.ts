import { pk, timestamps, createdAtCol } from './columns.js';
import { index, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { projects } from './projects.js';
import { users } from './users.js';
import { workspaces } from './workspaces.js';

export const taskStatusEnum = pgEnum('task_status', [
  'BACKLOG',
  'TODO',
  'IN_PROGRESS',
  'DONE',
  'BLOCKED',
]);

export const taskPriorityEnum = pgEnum('task_priority', [
  'LOW',
  'MEDIUM',
  'HIGH',
  'URGENT',
]);

export const tasks = pgTable(
  'tasks',
  {
    ...pk,

    workspaceId: uuid('workspace_id')
      .references(() => workspaces.id, {
        onDelete: 'cascade',
      })
      .notNull(),

    projectId: uuid('project_id')
      .references(() => projects.id, {
        onDelete: 'cascade',
      })
      .notNull(),

    assigneeId: uuid('assignee_id').references(() => users.id, {
      onDelete: 'set null',
    }),

    createdById: uuid('created_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),

    title: text('title').notNull(),

    description: text('description'),

    status: taskStatusEnum('status').default('BACKLOG').notNull(),

    priority: taskPriorityEnum('priority').default('MEDIUM').notNull(),

    dueDate: timestamp('due_date'),

    archivedAt: timestamp('archived_at'),

    ...timestamps,
  },
  (table) => [
    index('tasks_workspace_idx').on(table.workspaceId),

    index('tasks_project_idx').on(table.projectId),

    index('tasks_assignee_idx').on(table.assigneeId),

    index('tasks_status_idx').on(table.status),

    index('tasks_priority_idx').on(table.priority),
  ]
);
