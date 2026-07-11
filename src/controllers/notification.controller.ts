import { Request, Response, NextFunction } from 'express';

import {
  getUnreadNotificationCountFromDb,
  getUserNotificationsFromDb,
  markAllNotificationsReadInDb,
  markNotificationReadInDb,
} from '../services/notification.service.js';

import {
  GetNotificationsQuery,
  NotificationParams,
  ReadAllNotificationsQuery,
} from '../schemas/notification.schema.js';

import { emitUserEvent } from '../utils/socketEvents.js';

export const getNotificationsHandler = async (
  req: Request<{}, {}, {}, GetNotificationsQuery>,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = res.locals.userId as string;

    const userNotifications = await getUserNotificationsFromDb({
      userId,
      workspaceId: req.query.workspaceId,
      unreadOnly: req.query.unreadOnly,
      page: req.query.page,
      limit: req.query.limit,
    });

    res.status(200).json({
      success: true,
      message: 'Notifications retrieved successfully',
      data: userNotifications,
    });
  } catch (error) {
    next(error);
  }
};

export const getUnreadNotificationCountHandler = async (
  req: Request<{}, {}, {}, ReadAllNotificationsQuery>,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = res.locals.userId as string;

    const count = await getUnreadNotificationCountFromDb({
      userId,
      workspaceId: req.query.workspaceId,
    });

    res.status(200).json({
      success: true,
      message: 'Unread notification count retrieved successfully',
      data: {
        count,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const markNotificationReadHandler = async (
  req: Request<NotificationParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = res.locals.userId as string;
    const { notificationId } = req.params;

    const notification = await markNotificationReadInDb({
      userId,
      notificationId,
    });

    emitUserEvent(userId, 'notification_read', {
      notification,
    });

    res.status(200).json({
      success: true,
      message: 'Notification marked as read successfully',
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

export const markAllNotificationsReadHandler = async (
  req: Request<{}, {}, {}, ReadAllNotificationsQuery>,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = res.locals.userId as string;

    const notifications = await markAllNotificationsReadInDb({
      userId,
      workspaceId: req.query.workspaceId,
    });

    emitUserEvent(userId, 'notifications_read_all', {
      workspaceId: req.query.workspaceId ?? null,
      count: notifications.length,
    });

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read successfully',
      data: {
        count: notifications.length,
        notifications,
      },
    });
  } catch (error) {
    next(error);
  }
};