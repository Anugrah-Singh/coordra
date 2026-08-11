import { pk, timestamps, createdAtCol } from './columns.js';
import { index, jsonb, pgEnum, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';

import { users } from './users.js';
import { workspaces } from './workspaces.js';

export const aiActionTypeEnum = pgEnum('ai_action_type', [
  'CREATE_TASK',
  'UPDATE_TASK',
  'ADD_COMMENT',
]);

export const aiActionStatusEnum = pgEnum('ai_action_status', [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'EXPIRED',
  'EXECUTED',
  'FAILED',
]);

export const aiActionProposals = pgTable(
  'ai_action_proposals',
  {
    ...pk,
    workspaceId: uuid('workspace_id')
      .references(() => workspaces.id, { onDelete: 'cascade' })
      .notNull(),
    requesterId: uuid('requester_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    actionType: aiActionTypeEnum('action_type').notNull(),
    payload: jsonb('payload').notNull(),
    status: aiActionStatusEnum('status').default('PENDING').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    ...createdAtCol,
    executedAt: timestamp('executed_at'),
  },
  (table) => [
    index('ai_action_proposals_workspace_idx').on(table.workspaceId),
    index('ai_action_proposals_requester_idx').on(table.requesterId),
    index('ai_action_proposals_status_idx').on(table.status),
    index('ai_action_proposals_expiry_idx').on(table.expiresAt),
  ]
);
