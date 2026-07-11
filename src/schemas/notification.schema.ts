import { z } from 'zod';
import { paginationQuerySchema, PaginationQuery } from './pagination.schema.js';


export const getNotificationsSchema = z.object({
  query: z.object({
    ...paginationQuerySchema,
    workspaceId: z.uuid({ message: 'Invalid workspace ID' }).optional(),
    unreadOnly: z.enum(['true', 'false']).optional(),
  }),
});

export const notificationParamsSchema = z.object({
  params: z.object({
    notificationId: z.uuid({ message: 'Invalid notification ID' }),
  }),
});

export const readAllNotificationsSchema = z.object({
  query: z.object({
    workspaceId: z.uuid({ message: 'Invalid workspace ID' }).optional(),
  }),
});

export type GetNotificationsQuery =
  z.infer<typeof getNotificationsSchema>['query'] & PaginationQuery;

export type NotificationParams =
  z.infer<typeof notificationParamsSchema>['params'];

export type ReadAllNotificationsQuery =
  z.infer<typeof readAllNotificationsSchema>['query'];