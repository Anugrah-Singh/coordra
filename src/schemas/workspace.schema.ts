import { z } from 'zod';

export const createWorkspaceSchema = z.object({
  body: z.object({
    name: z
      .string({
        error: (issue) =>
          issue.input === undefined
            ? 'Workspace name is required'
            : 'Workspace name must be a string',
      })
      .min(3, { error: 'Workspace name must be at least 3 characters long' })
      .max(50, { error: 'Workspace name cannot exceed 50 characters' })
      .trim(),
  }),
});

export const transferWorkspaceOwnerSchema = z.object({
  params: z.object({
    workspaceId: z.uuid({ message: 'Invalid workspace ID' }),
  }),

  body: z.object({
    newOwnerMemberId: z.uuid({ message: 'Invalid member ID' }),
  }),
});

export type CreateWorkspaceInput =
  z.infer<typeof createWorkspaceSchema>['body'];

export type TransferWorkspaceOwnerInput =
  z.infer<typeof transferWorkspaceOwnerSchema>['body'];

export type WorkspaceParams =
  z.infer<typeof transferWorkspaceOwnerSchema>['params'];