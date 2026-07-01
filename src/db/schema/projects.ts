import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { workspaces } from './workspaces.js';

export const projects = pgTable('projects', {
    id: uuid('id').primaryKey().defaultRandom(),

    workspaceId: uuid('workspace_id').references(() => 
        workspaces.id, {
        onDelete: 'cascade'
    }).notNull(),

    name: text('name').notNull(),
    description: text('description'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});