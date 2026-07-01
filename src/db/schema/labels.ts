import { pgTable, uuid, timestamp, text, primaryKey } from 'drizzle-orm/pg-core';
import { workspaces } from './workspaces.js';
import { tasks } from './tasks.js';


// 1. The Labels Table (Workspace Scoped)
export const labels = pgTable('labels', {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id').references(() => workspaces.id, {
        onDelete: 'cascade'
    }),
    name: text('name').notNull(),
    color: text('color').default('#000000').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull()
});


//2. The Junction Table for Tasks <-> Labels
export const taskLabels = pgTable('task_labels',  {
    taskId: uuid('id').references(() => tasks.id, {
        onDelete: 'cascade'
    }),
    lableId: uuid('label_id').references(() => labels.id, {
        onDelete: 'cascade'
    }).notNull(),
}, (table) => [
    //A task cannot have the exact same label applied twice
    primaryKey({ columns: [table.taskId, table.lableId] })
]);
