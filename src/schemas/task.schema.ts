import { z } from 'zod';
import { paginationQuerySchema, PaginationQuery } from './pagination.schema.js';

const taskStatusEnum = z.enum(
  ['BACKLOG', 'TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED'],
  {
    error: () => 'Invalid task status',
  }
);

const taskPriorityEnum = z.enum(
  ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
  {
    error: () => 'Invalid task priority',
  }
);

const taskBaseParamsSchema = z.object({
  workspaceId: z.uuid({ message: 'Invalid workspace ID' }),
  projectId: z.uuid({ message: 'Invalid project ID' }),
});

const taskActionParamsSchema = taskBaseParamsSchema.extend({
  taskId: z.uuid({ message: 'Invalid task ID' }),
});

export const createTaskSchema = z.object({
  params: taskBaseParamsSchema,

  body: z.object({
    title: z
      .string({
        error: (issue) =>
          issue.input === undefined
            ? 'Task title is required'
            : 'Task title must be a string',
      })
      .min(1, { error: 'Task title cannot be empty' })
      .trim(),

    description: z.string().trim().optional().nullable(),

    status: taskStatusEnum.optional(),

    priority: taskPriorityEnum.optional(),

    assigneeId: z
      .uuid({ message: 'Invalid assignee ID' })
      .optional()
      .nullable(),

    dueDate: z
      .iso
      .datetime({ message: 'Due date must be a valid ISO datetime' })
      .optional()
      .nullable(),
  }),
});

export const getTasksSchema = z.object({
  params: taskBaseParamsSchema,

  query: z.object({
    ...paginationQuerySchema,
    status: taskStatusEnum.optional(),
    priority: taskPriorityEnum.optional(),
    assigneeId: z.uuid({ message: 'Invalid assignee ID' }).optional(),
    includeArchived: z.enum(['true', 'false']).optional(),
  }),
});

export const taskParamsSchema = z.object({
  params: taskActionParamsSchema,
});

export const updateTaskSchema = z.object({
  params: taskActionParamsSchema,

  body: z
    .object({
      title: z
        .string()
        .min(1, { message: 'Title cannot be empty' })
        .trim()
        .optional(),

      description: z.string().trim().optional().nullable(),

      status: taskStatusEnum.optional(),

      priority: taskPriorityEnum.optional(),

      assigneeId: z
        .uuid({ message: 'Invalid assignee ID' })
        .optional()
        .nullable(),

      dueDate: z
        .iso
        .datetime({ message: 'Invalid ISO datetime' })
        .optional()
        .nullable(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field is required to update task',
    }),
});

export const updateTaskStatusSchema = z.object({
  params: taskActionParamsSchema,

  body: z.object({
    status: taskStatusEnum,
  }),
});

export const assignTaskSchema = z.object({
  params: taskActionParamsSchema,

  body: z.object({
    assigneeId: z
      .uuid({ message: 'Invalid assignee ID' })
      .nullable(),
  }),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>['body'];
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>['body'];
export type UpdateTaskStatusInput =
  z.infer<typeof updateTaskStatusSchema>['body'];
export type AssignTaskInput = z.infer<typeof assignTaskSchema>['body'];

export type TaskParams = z.infer<typeof createTaskSchema>['params'];
export type TaskActionParams = z.infer<typeof taskParamsSchema>['params'];
export type TaskListQuery =
  z.infer<typeof getTasksSchema>['query'] & PaginationQuery;