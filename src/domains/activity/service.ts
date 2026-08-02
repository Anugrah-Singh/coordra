import { and, count, desc, eq, isNull, type SQL } from 'drizzle-orm';

import { db } from '../../db/index.js';
import { auditLogs } from '../../db/schema/auditLogs.js';
import { notifications } from '../../db/schema/notifications.js';
import { comments } from '../../db/schema/comments.js';
import { projects } from '../../db/schema/projects.js';
import { tasks } from '../../db/schema/tasks.js';
import { users } from '../../db/schema/users.js';
import { internalError, notFound } from '../../utils/httpErrors.js';
import { getPagination } from '../../utils/pagination.js';

export const getWorkspaceAuditLogs = async (input: {
  workspaceId: string;
  page?: string | undefined;
  limit?: string | undefined;
}) => {
  const paging = getPagination(input);
  return db
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
    .where(eq(auditLogs.workspaceId, input.workspaceId))
    .orderBy(desc(auditLogs.createdAt), desc(auditLogs.id))
    .limit(paging.limit)
    .offset(paging.offset);
};

const ACTION_LABELS: Record<string, string> = {
  PROJECT_CREATED: 'created a project',
  PROJECT_UPDATED: 'updated a project',
  TASK_CREATED: 'created a task',
  TASK_UPDATED: 'updated a task',
  COMMENT_CREATED: 'added a comment',
  MEMBER_ADDED: 'added a workspace member',
  MEMBER_ROLE_UPDATED: 'changed a member role',
  AI_ASSISTED_CREATE_TASK: 'approved a Pulse task',
  AI_ASSISTED_UPDATE_TASK: 'approved a Pulse task update',
  AI_ASSISTED_ADD_COMMENT: 'approved a Pulse comment',
};

export const getRecentActivity = async (workspaceId: string) => {
  const rows = await db
    .select({
      id: auditLogs.id,
      actorName: users.fullName,
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.actorId, users.id))
    .where(eq(auditLogs.workspaceId, workspaceId))
    .orderBy(desc(auditLogs.createdAt), desc(auditLogs.id))
    .limit(20);

  const resourceTitle = async (entityType: string, entityId: string | null) => {
    if (!entityId) return 'Workspace';
    if (entityType === 'project') {
      const [row] = await db
        .select({ title: projects.name })
        .from(projects)
        .where(and(eq(projects.workspaceId, workspaceId), eq(projects.id, entityId)))
        .limit(1);
      return row?.title ?? 'Project';
    }
    if (entityType === 'task') {
      const [row] = await db
        .select({ title: tasks.title })
        .from(tasks)
        .where(and(eq(tasks.workspaceId, workspaceId), eq(tasks.id, entityId)))
        .limit(1);
      return row?.title ?? 'Task';
    }
    if (entityType === 'comment') {
      const [row] = await db
        .select({ title: tasks.title })
        .from(comments)
        .innerJoin(tasks, eq(comments.taskId, tasks.id))
        .where(and(eq(comments.workspaceId, workspaceId), eq(comments.id, entityId)))
        .limit(1);
      return row?.title ?? 'Task comment';
    }
    return entityType.replaceAll('_', ' ');
  };

  return Promise.all(
    rows.map(async (row) => ({
      actorName: row.actorName ?? 'Former workspace member',
      actionLabel:
        ACTION_LABELS[row.action] ?? row.action.toLowerCase().replaceAll('_', ' '),
      resourceTitle: await resourceTitle(row.entityType, row.entityId),
      createdAt: row.createdAt,
    }))
  );
};

const notificationConditions = (input: {
  userId: string;
  workspaceId?: string | undefined;
  unreadOnly?: boolean;
}) => {
  const conditions: SQL[] = [eq(notifications.userId, input.userId)];
  if (input.workspaceId)
    conditions.push(eq(notifications.workspaceId, input.workspaceId));
  if (input.unreadOnly) conditions.push(isNull(notifications.readAt));
  return conditions;
};

export const getNotifications = async (input: {
  userId: string;
  workspaceId?: string | undefined;
  unreadOnly?: 'true' | 'false' | undefined;
  page?: string | undefined;
  limit?: string | undefined;
}) => {
  const paging = getPagination(input);
  const scoped = { ...input, unreadOnly: input.unreadOnly === 'true' };
  const [items, unread] = await Promise.all([
    db
      .select()
      .from(notifications)
      .where(and(...notificationConditions(scoped)))
      .orderBy(desc(notifications.createdAt), desc(notifications.id))
      .limit(paging.limit)
      .offset(paging.offset),
    db
      .select({ count: count() })
      .from(notifications)
      .where(and(...notificationConditions({ ...input, unreadOnly: true }))),
  ]);
  return { notifications: items, unreadCount: unread[0]?.count ?? 0 };
};

export const markNotificationRead = async (userId: string, notificationId: string) => {
  const [notification] = await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)))
    .returning();
  if (!notification) throw notFound('Notification not found');
  return notification;
};

export const markAllNotificationsRead = async (
  userId: string,
  workspaceId?: string | undefined
) => {
  const conditions = notificationConditions({ userId, workspaceId, unreadOnly: true });
  const updated = await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(...conditions))
    .returning();
  if (!updated) throw internalError('Failed to mark notifications as read');
  return updated;
};
