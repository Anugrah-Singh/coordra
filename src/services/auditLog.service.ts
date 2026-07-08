import { desc, eq } from 'drizzle-orm';

import { db } from '../db/index.js';
import { auditLogs } from '../db/schema/auditLogs.js';
import { users } from '../db/schema/users.js';

export const getWorkspaceAuditLogsFromDb = async (workspaceId: string) => {
  return await db
    .select({
      id: auditLogs.id,
      workspaceId: auditLogs.workspaceId,
      actorId: auditLogs.actorId,
      actorEmail: users.email,
      actorName: users.fullName,
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      oldValue: auditLogs.oldValue,
      newValue: auditLogs.newValue,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.actorId, users.id))
    .where(eq(auditLogs.workspaceId, workspaceId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(50);
};