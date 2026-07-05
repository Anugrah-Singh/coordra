import { z } from 'zod';

export const createWorkspaceSchema = z.object({
    body: z.object({
        name: z.string({
            error: (issue) => issue.input === undefined
              ? 'Workspace name is required'
              : 'Workspace name must be a string'
        })
        .min(3, { error: 'Workspace name must be at least 3 characters long' })
        .max(50, { error: 'Workspace name cannot exceed 50 characters' })
        .trim(),

    }),
});


export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>['body'];
