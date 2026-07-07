import { z } from 'zod';

export const createProjectSchema = z.object({
    body: z.object({
        name: z.string({
            error: (issue) => issue.input === undefined
                ? 'Project name is required'
                : 'Project name must be a string'
        })
        .min(3, 'Project name must be at least 3 characters long')
        .max(100, 'Project name cannot exceed 100 characters')
        .trim(),

        description: z.string().optional(),
    }),
    params: z.object({
        workspaceId: z.uuid({
            error: 'Invalid workspace ID format'
        }),
    })
});


export type CreateProjectInput = z.infer<typeof createProjectSchema>['body'];
export type ProjectParams = z.infer<typeof createProjectSchema>['params'];
