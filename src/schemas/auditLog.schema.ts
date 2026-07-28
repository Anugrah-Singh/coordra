import { z } from 'zod';

import { paginationQuerySchema, PaginationQuery } from './pagination.schema.js';

export const getWorkspaceAuditLogsSchema = z.object({
  params: z.object({
    workspaceId: z.uuid({ message: 'Invalid workspace ID' }),
  }),

  query: z.object({
    ...paginationQuerySchema,
  }),
});

export type GetWorkspaceAuditLogsParams = z.infer<
  typeof getWorkspaceAuditLogsSchema
>['params'];

export type GetWorkspaceAuditLogsQuery = z.infer<
  typeof getWorkspaceAuditLogsSchema
>['query'] &
  PaginationQuery;
