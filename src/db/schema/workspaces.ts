import {
    pgTable, 
    uuid, 
    text, 
    timestamp, 
    pgEnum, 
    uniqueIndex
} from 'drizzle-orm/pg-core';

import {users} from './users.js';

// Role-Based Access Control (RBAC) levels
export const roleEnum = pgEnum('workspace_role',
    [
        'OWNER',
        "ADMIN",
        "MANAGER",
        "MEMBER",
        "VIEWER"
    ]
);

export const workspaces = pgTable('workspaces', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const workspaceMembers = pgTable('workspace_members', {
    id: uuid('id').primaryKey().defaultRandom(),
    // Cascading deletes: If a workspace or user dies, destroy this membership record.
    workspaceId: uuid('workspace_id').references(() => workspaces.id, {
        onDelete: 'cascade'
    }).notNull(),
    userId: uuid('user_id').references(() => users.id, {
        onDelete: 'cascade'
    }).notNull(),
    role: roleEnum('role').default('MEMBER').notNull(),
    joinedAt: timestamp('joined_at').defaultNow().notNull(),
}, (table) => [
    // Database-level protection: A user can't join the same workspace twice
    uniqueIndex('Workspace_user_unique_idx').on(
        table.workspaceId, table.userId
    ),

]);