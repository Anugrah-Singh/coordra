import { desc, eq } from 'drizzle-orm';

import { getPagination } from '../utils/pagination.js';

import { db } from '../db/index.js';
import { auditLogs } from '../db/schema/auditLogs.js';
import { users } from '../db/schema/users.js';

export const getWorkspaceAuditLogs = async (data: {
  workspaceId: string;
  page?: string | undefined;
  limit?: string | undefined;
}) => {
  const pagination = getPagination({
    page: data.page,
    limit: data.limit,
  });

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
    .where(eq(auditLogs.workspaceId, data.workspaceId))
    .orderBy(desc(auditLogs.createdAt), desc(auditLogs.id))
    .limit(pagination.limit)
    .offset(pagination.offset);
};
