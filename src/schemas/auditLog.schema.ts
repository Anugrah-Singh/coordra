import { z } from 'zod';

export const getWorkspaceAuditLogsSchema = z.object({
  params: z.object({
    workspaceId: z.uuid({ message: 'Invalid workspace ID' }),
  }),
});

export type GetWorkspaceAuditLogsParams =
  z.infer<typeof getWorkspaceAuditLogsSchema>['params'];