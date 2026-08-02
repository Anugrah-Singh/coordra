import { Router } from 'express';
import { z } from 'zod';

import { requireAuth } from '../../middlewares/auth.middleware.js';
import { requireWorkspaceAdmin } from '../../middlewares/rbac.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { emitUserEvent } from '../../utils/socketEvents.js';
import {
  getNotifications,
  getWorkspaceAuditLogs,
  markAllNotificationsRead,
  markNotificationRead,
} from './service.js';

const paging = { page: z.string().optional(), limit: z.string().optional() };
export const getWorkspaceAuditLogsSchema = z.object({
  params: z.object({ workspaceId: z.uuid() }),
  query: z.object(paging),
});
export const getNotificationsSchema = z.object({
  query: z.object({
    ...paging,
    workspaceId: z.uuid().optional(),
    unreadOnly: z.enum(['true', 'false']).optional(),
  }),
});
export const notificationParamsSchema = z.object({
  params: z.object({ notificationId: z.uuid() }),
});
export const readAllNotificationsSchema = z.object({
  query: z.object({ workspaceId: z.uuid().optional() }),
});

const router = Router({ mergeParams: true });
router.get(
  '/',
  requireWorkspaceAdmin,
  validate(getWorkspaceAuditLogsSchema),
  async (req, res) => {
    res.json({
      data: await getWorkspaceAuditLogs({
        workspaceId: String(req.params.workspaceId),
        page: req.query.page as string | undefined,
        limit: req.query.limit as string | undefined,
      }),
    });
  }
);

export const notificationRouter = Router();
notificationRouter.use(requireAuth);
notificationRouter.get('/', validate(getNotificationsSchema), async (req, res) => {
  res.json({
    data: await getNotifications({
      userId: res.locals.userId,
      workspaceId: req.query.workspaceId as string | undefined,
      unreadOnly: req.query.unreadOnly as 'true' | 'false' | undefined,
      page: req.query.page as string | undefined,
      limit: req.query.limit as string | undefined,
    }),
  });
});
notificationRouter.patch(
  '/read-all',
  validate(readAllNotificationsSchema),
  async (req, res) => {
    const notifications = await markAllNotificationsRead(
      res.locals.userId,
      req.query.workspaceId as string | undefined
    );
    emitUserEvent(res.locals.userId, 'notifications:changed', { action: 'read-all' });
    res.json({ data: { count: notifications.length, notifications } });
  }
);
notificationRouter.patch(
  '/:notificationId/read',
  validate(notificationParamsSchema),
  async (req, res) => {
    const notification = await markNotificationRead(
      res.locals.userId,
      String(req.params.notificationId)
    );
    emitUserEvent(res.locals.userId, 'notifications:changed', { action: 'read' });
    res.json({ data: notification });
  }
);

export default router;
