import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';

import { workspaces } from './workspaces.js';
import { users } from './users.js';

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    workspaceId: uuid('workspace_id')
      .references(() => workspaces.id, {
        onDelete: 'cascade',
      })
      .notNull(),

    actorId: uuid('actor_id').references(() => users.id, {
      onDelete: 'set null',
    }),

    action: text('action').notNull(),

    entityType: text('entity_type').notNull(),

    entityId: uuid('entity_id'),

    oldValue: jsonb('old_value'),

    newValue: jsonb('new_value'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('audit_logs_workspace_idx').on(table.workspaceId),
    index('audit_logs_actor_idx').on(table.actorId),
    index('audit_logs_entity_idx').on(table.entityType, table.entityId),
  ]
);