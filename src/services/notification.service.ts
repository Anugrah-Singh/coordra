import { and, count, desc, eq, isNull, type SQL } from 'drizzle-orm';

import { db } from '../db/index.js';
import { notifications } from '../db/schema/notifications.js';
import { getPagination } from '../utils/pagination.js';

const createHttpError = (message: string, status: number) => {
  return Object.assign(new Error(message), {
    status,
    statusCode: status,
  });
};

export const getUserNotifications = async (data: {
  userId: string;
  workspaceId?: string | undefined;
  unreadOnly?: 'true' | 'false' | undefined;
  page?: string | undefined;
  limit?: string | undefined;
}) => {
  const conditions: SQL[] = [eq(notifications.userId, data.userId)];

  if (data.workspaceId !== undefined) {
    conditions.push(eq(notifications.workspaceId, data.workspaceId));
  }

  if (data.unreadOnly === 'true') {
    conditions.push(isNull(notifications.readAt));
  }

  const pagination = getPagination({
    page: data.page,
    limit: data.limit,
  });

  return await db
    .select()
    .from(notifications)
    .where(and(...conditions))
    .orderBy(desc(notifications.createdAt), desc(notifications.id))
    .limit(pagination.limit)
    .offset(pagination.offset);
};

export const getUnreadNotificationCount = async (data: {
  userId: string;
  workspaceId?: string | undefined;
}) => {
  const conditions: SQL[] = [
    eq(notifications.userId, data.userId),
    isNull(notifications.readAt),
  ];

  if (data.workspaceId !== undefined) {
    conditions.push(eq(notifications.workspaceId, data.workspaceId));
  }

  const [result] = await db
    .select({
      count: count(),
    })
    .from(notifications)
    .where(and(...conditions));

  return result?.count ?? 0;
};

export const markNotificationRead = async (data: {
  userId: string;
  notificationId: string;
}) => {
  const [existingNotification] = await db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.id, data.notificationId),
        eq(notifications.userId, data.userId)
      )
    )
    .limit(1);

  if (!existingNotification) {
    throw createHttpError('Notification not found', 404);
  }

  const [updatedNotification] = await db
    .update(notifications)
    .set({
      readAt: existingNotification.readAt ?? new Date(),
    })
    .where(
      and(
        eq(notifications.id, data.notificationId),
        eq(notifications.userId, data.userId)
      )
    )
    .returning();

  if (!updatedNotification) {
    throw createHttpError('Failed to mark notification as read', 500);
  }

  return updatedNotification;
};

export const markAllNotificationsRead = async (data: {
  userId: string;
  workspaceId?: string | undefined;
}) => {
  const conditions: SQL[] = [
    eq(notifications.userId, data.userId),
    isNull(notifications.readAt),
  ];

  if (data.workspaceId !== undefined) {
    conditions.push(eq(notifications.workspaceId, data.workspaceId));
  }

  return await db
    .update(notifications)
    .set({
      readAt: new Date(),
    })
    .where(and(...conditions))
    .returning();
};
