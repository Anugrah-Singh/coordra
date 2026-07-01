import { pgTable, uuid, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { workspaces } from './workspaces.js';
import { users } from './users.js';

export const notificationTypeEnum = pgEnum('notification_type', [
    'TASK_ASSIGNED',
    'COMMENT_MENTION',
    'PROHECT_UPDATE',
]);

export const notifications = pgTable('notifications', {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id').references(() => workspaces.id, {
        onDelete: 'cascade'
    }).notNull(),
    userId: uuid('user_id').references(() => users.id, {
        onDelete: 'cascade'
    }).notNull(),
    
    type: notificationTypeEnum('text').notNull(),
    message: text('message').notNull(),
// Optional: Can point to a Task ID or Project ID to create a clickable link
    resourceId: uuid('resource_id'),
// If null, the notification is unread
    readAt: timestamp('read_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

