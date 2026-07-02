import { pgTable, uuid, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { workspaces } from './workspaces.js';
import { projects } from './projects.js';
import { users } from './users.js';

export const taskStatusEnum = pgEnum('task_status', [
    'BACKLOG',
    'TODO',
    'IN_PROGRESS',
    'DONE'
]);

export const tasks = pgTable('tasks', {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id').references(() => workspaces.id, {
        onDelete: 'cascade'
    }).notNull(),

    projectId: uuid('project_id').references(() => projects.id, {
        onDelete: 'cascade'
    }).notNull(),

    assigneeId: uuid('assignee_id').references(() => users.id, {
        onDelete: 'set null'
    }),

    title: text('title').notNull(),
    description: text('description'),
    status: taskStatusEnum('status').default('TODO').notNull(),
    dueDate: timestamp('due_date'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
});