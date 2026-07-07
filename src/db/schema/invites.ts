import {
  pgTable,
  uuid,
  text,
  timestamp,
  pgEnum,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

import { workspaces, roleEnum } from './workspaces.js';
import { users } from './users.js';

export const inviteStatusEnum = pgEnum('invite_status', [
  'PENDING',
  'ACCEPTED',
  'DECLINED',
  'EXPIRED',
]);

export const workspaceInvites = pgTable(
  'workspace_invites',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    workspaceId: uuid('workspace_id')
      .references(() => workspaces.id, {
        onDelete: 'cascade',
      })
      .notNull(),

    email: text('email').notNull(),

    role: roleEnum('role').default('MEMBER').notNull(),

    tokenHash: text('token_hash').notNull(),

    invitedById: uuid('invited_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),

    status: inviteStatusEnum('status').default('PENDING').notNull(),

    expiresAt: timestamp('expires_at').notNull(),

    acceptedAt: timestamp('accepted_at'),

    declinedAt: timestamp('declined_at'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('workspace_invites_workspace_idx').on(table.workspaceId),
    index('workspace_invites_email_idx').on(table.email),
    uniqueIndex('workspace_invites_token_hash_unique_idx').on(table.tokenHash),
  ]
);