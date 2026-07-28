import { z } from 'zod';

const workspaceNameSchema = z
  .string({
    error: (issue) =>
      issue.input === undefined
        ? 'Workspace name is required'
        : 'Workspace name must be a string',
  })
  .trim()
  .min(3, {
    error: 'Workspace name must be at least 3 characters long',
  })
  .max(50, {
    error: 'Workspace name cannot exceed 50 characters',
  });

const workspaceIdParamsSchema = z.object({
  workspaceId: z.uuid({
    message: 'Invalid workspace ID',
  }),
});

export const createWorkspaceSchema = z.object({
  body: z.object({
    name: workspaceNameSchema,
  }),
});

export const getWorkspaceSchema = z.object({
  params: workspaceIdParamsSchema,
});

export const updateWorkspaceSchema = z.object({
  params: workspaceIdParamsSchema,

  body: z.object({
    name: workspaceNameSchema,
  }),
});

export const deleteWorkspaceSchema = z.object({
  params: workspaceIdParamsSchema,

  body: z.object({
    confirmationName: workspaceNameSchema,
  }),
});

export const transferWorkspaceOwnerSchema = z.object({
  params: workspaceIdParamsSchema,

  body: z.object({
    newOwnerMemberId: z.uuid({
      message: 'Invalid member ID',
    }),
  }),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>['body'];

export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>['body'];

export type DeleteWorkspaceInput = z.infer<typeof deleteWorkspaceSchema>['body'];

export type TransferWorkspaceOwnerInput = z.infer<
  typeof transferWorkspaceOwnerSchema
>['body'];

export type WorkspaceParams = z.infer<typeof workspaceIdParamsSchema>;
