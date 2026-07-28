import { Router } from 'express';

import { requireAuth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';

import {
  getNotificationsSchema,
  notificationParamsSchema,
  readAllNotificationsSchema,
} from '../schemas/notification.schema.js';

import {
  getNotificationsHandler,
  getUnreadNotificationCountHandler,
  markAllNotificationsReadHandler,
  markNotificationReadHandler,
} from '../controllers/notification.controller.js';

const router = Router();

router.get('/', requireAuth, validate(getNotificationsSchema), getNotificationsHandler);

router.get(
  '/unread-count',
  requireAuth,
  validate(readAllNotificationsSchema),
  getUnreadNotificationCountHandler
);

router.patch(
  '/read-all',
  requireAuth,
  validate(readAllNotificationsSchema),
  markAllNotificationsReadHandler
);

router.patch(
  '/:notificationId/read',
  requireAuth,
  validate(notificationParamsSchema),
  markNotificationReadHandler
);

export default router;
