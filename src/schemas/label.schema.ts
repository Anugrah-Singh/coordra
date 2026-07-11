import { z } from 'zod';

import {
  paginationQuerySchema,
  PaginationQuery,
} from './pagination.schema.js';

const colorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, {
    message: 'Color must be a valid hex color like #FFAA00',
  });

export const createLabelSchema = z.object({
  params: z.object({
    workspaceId: z.uuid({ message: 'Invalid workspace ID' }),
  }),

  body: z.object({
    name: z
      .string()
      .min(1, { message: 'Label name is required' })
      .max(50, { message: 'Label name cannot exceed 50 characters' })
      .trim(),

    color: colorSchema.optional(),
  }),
});

export const updateLabelSchema = z.object({
  params: z.object({
    workspaceId: z.uuid({ message: 'Invalid workspace ID' }),
    labelId: z.uuid({ message: 'Invalid label ID' }),
  }),

  body: z
    .object({
      name: z
        .string()
        .min(1, { message: 'Label name cannot be empty' })
        .max(50, { message: 'Label name cannot exceed 50 characters' })
        .trim()
        .optional(),

      color: colorSchema.optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field is required to update label',
    }),
});

export const labelParamsSchema = z.object({
  params: z.object({
    workspaceId: z.uuid({ message: 'Invalid workspace ID' }),
    labelId: z.uuid({ message: 'Invalid label ID' }),
  }),
});

export const taskLabelParamsSchema = z.object({
  params: z.object({
    workspaceId: z.uuid({ message: 'Invalid workspace ID' }),
    projectId: z.uuid({ message: 'Invalid project ID' }),
    taskId: z.uuid({ message: 'Invalid task ID' }),
    labelId: z.uuid({ message: 'Invalid label ID' }),
  }),
});

export const taskLabelsListSchema = z.object({
  params: z.object({
    workspaceId: z.uuid({ message: 'Invalid workspace ID' }),
    projectId: z.uuid({ message: 'Invalid project ID' }),
    taskId: z.uuid({ message: 'Invalid task ID' }),
  }),

  query: z.object({
    ...paginationQuerySchema,
  }),
});

export const getWorkspaceLabelsSchema = z.object({
  params: z.object({
    workspaceId: z.uuid({ message: 'Invalid workspace ID' }),
  }),

  query: z.object({
    ...paginationQuerySchema,
  }),
});

export type CreateLabelInput = z.infer<typeof createLabelSchema>['body'];
export type UpdateLabelInput = z.infer<typeof updateLabelSchema>['body'];

export type LabelWorkspaceParams =
  z.infer<typeof createLabelSchema>['params'];

export type LabelActionParams =
  z.infer<typeof labelParamsSchema>['params'];

export type TaskLabelParams =
  z.infer<typeof taskLabelParamsSchema>['params'];

export type TaskLabelsListParams =
  z.infer<typeof taskLabelsListSchema>['params'];

export type LabelListQuery =
  z.infer<typeof getWorkspaceLabelsSchema>['query'] & PaginationQuery;

export type TaskLabelListQuery =
  z.infer<typeof taskLabelsListSchema>['query'] & PaginationQuery;