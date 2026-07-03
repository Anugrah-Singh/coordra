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

        // In a real app, this might come from the authenticated user's JWT,
        // but for now, we will require it in the body to test our database.
        ownerId: z.guid({
            error: (issue) => issue.input === undefined
                ? 'Owner ID is required'
                : 'Invalid UUID format for ownerId'
        }),
    }),
});


export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>['body'];
