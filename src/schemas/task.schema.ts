import { z } from 'zod';

const taskStatusEnum = z.enum(
    ['BACKLOG', 'IN_PROGRESS', 'DONE', 'BLOCKED'],
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

export const createTaskSchema = z.object({
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

        description: z.string().optional(),

        status: taskStatusEnum.optional(),

        priority: taskPriorityEnum.optional(),

        assigneeId: z
            .uuid({ message: 'Invalid Assignee ID' })
            .optional()
            .nullable(),

        dueDate: z
            .iso
            .datetime({ message: 'Due date must be a valid ISO datetime' })
            .optional()
            .nullable(),
    }),

    params: z.object({
        workspaceId: z.uuid({ message: 'Invalid workspace ID format' }),
        projectId: z.uuid({ message: 'Invalid project ID format' }),
    }),
});

export const updateTaskSchema = z.object({
    body: z.object({
        title: z
            .string()
            .min(1, { message: 'Title cannot be empty' })
            .trim()
            .optional(),

        description: z.string().optional(),

        status: taskStatusEnum.optional(),

        priority: taskPriorityEnum.optional(),

        assigneeId: z
            .uuid({ message: 'Invalid Assignee ID' })
            .optional()
            .nullable(),

        dueDate: z
            .iso
            .datetime({ message: 'Invalid ISO datetime' })
            .optional()
            .nullable(),
    }),

    params: z.object({
        workspaceId: z.uuid({ message: 'Invalid workspace ID' }),
        projectId: z.uuid({ message: 'Invalid project ID' }),
        taskId: z.uuid({ message: 'Invalid task ID' }),
    }),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>['body'];
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>['body'];
export type TaskParams = z.infer<typeof createTaskSchema>['params'];
export type TaskUpdateParams = z.infer<typeof updateTaskSchema>['params'];