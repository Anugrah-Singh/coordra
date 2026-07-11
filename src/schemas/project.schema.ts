import { z } from 'zod';
import { paginationQuerySchema, PaginationQuery } from './pagination.schema.js';

export const createProjectSchema = z.object({
  params: z.object({
    workspaceId: z.uuid({ message: 'Invalid workspace ID' }),
  }),

  body: z.object({
    name: z
      .string()
      .min(1, { message: 'Project name is required' })
      .max(100, { message: 'Project name cannot exceed 100 characters' })
      .trim(),

    description: z
      .string()
      .max(500, { message: 'Project description cannot exceed 500 characters' })
      .trim()
      .optional()
      .nullable(),
  }),
});

export const projectParamsSchema = z.object({
  params: z.object({
    workspaceId: z.uuid({ message: 'Invalid workspace ID' }),
    projectId: z.uuid({ message: 'Invalid project ID' }),
  }),
});

export const updateProjectSchema = z.object({
  params: z.object({
    workspaceId: z.uuid({ message: 'Invalid workspace ID' }),
    projectId: z.uuid({ message: 'Invalid project ID' }),
  }),

  body: z
    .object({
      name: z
        .string()
        .min(1, { message: 'Project name cannot be empty' })
        .max(100, { message: 'Project name cannot exceed 100 characters' })
        .trim()
        .optional(),

      description: z
        .string()
        .max(500, {
          message: 'Project description cannot exceed 500 characters',
        })
        .trim()
        .optional()
        .nullable(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field is required to update project',
    }),
});

export const getProjectsSchema = z.object({
  params: z.object({
    workspaceId: z.uuid({ message: 'Invalid workspace ID' }),
  }),

  query: z.object({
    ...paginationQuerySchema,
  }),
});

export type CreateProjectInput =
  z.infer<typeof createProjectSchema>['body'];

export type UpdateProjectInput =
  z.infer<typeof updateProjectSchema>['body'];

export type ProjectWorkspaceParams =
  z.infer<typeof createProjectSchema>['params'];

export type ProjectActionParams =
  z.infer<typeof projectParamsSchema>['params'];

export type GetProjectsQuery =
  z.infer<typeof getProjectsSchema>['query'] & PaginationQuery;