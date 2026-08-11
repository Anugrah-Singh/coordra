import { pk, timestamps, createdAtCol } from './columns.js';
import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { workspaces } from './workspaces.js';

export const projects = pgTable('projects', {
  ...pk,

  workspaceId: uuid('workspace_id')
    .references(() => workspaces.id, {
      onDelete: 'cascade',
    })
    .notNull(),

  name: text('name').notNull(),
  description: text('description'),

  ...timestamps,
});
