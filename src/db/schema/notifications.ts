import { pk, timestamps, createdAtCol } from './columns.js';
import { pgTable, uuid, text, timestamp, pgEnum, index } from 'drizzle-orm/pg-core';

import { workspaces } from './workspaces.js';
import { users } from './users.js';

export const notificationTypeEnum = pgEnum('notification_type', [
  'TASK_ASSIGNED',
  'COMMENT_MENTION',
  'TASK_STATUS_CHANGED',
  'COMMENT_ADDED',
  'MEMBER_INVITED',
  'PROJECT_UPDATED',
]);

export const notifications = pgTable(
  'notifications',
  {
    ...pk,

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

    type: notificationTypeEnum('type').notNull(),

    message: text('message').notNull(),

    resourceType: text('resource_type'),

    resourceId: uuid('resource_id'),

    readAt: timestamp('read_at'),

    ...createdAtCol,
  },
  (table) => [
    index('notifications_workspace_idx').on(table.workspaceId),
    index('notifications_user_idx').on(table.userId),
    index('notifications_read_idx').on(table.readAt),
  ]
);
