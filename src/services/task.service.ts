import { and, eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { tasks } from '../db/schema/tasks.js';
import { CreateTaskInput, UpdateTaskInput } from '../schemas/task.schema.js';
import { removeUndefined } from '../utils/removeUndefined.js';

type CreateTaskServiceInput = CreateTaskInput & {
    workspaceId: string;
    projectId: string;
    createdById: string;
};

export const createTaskInDb = async (data: CreateTaskServiceInput) => {
    const [newTask] = await db
        .insert(tasks)
        .values({
            workspaceId: data.workspaceId,
            projectId: data.projectId,
            createdById: data.createdById,
            title: data.title,
            description: data.description,
            status: data.status,
            priority: data.priority,
            assigneeId: data.assigneeId,
            dueDate: data.dueDate ? new Date(data.dueDate) : null,
        })
        .returning();

    return newTask;
};

export const getProjectTasksFromDb = async (
    workspaceId: string,
    projectId: string
) => {
    return await db
        .select()
        .from(tasks)
        .where(
            and(
                eq(tasks.workspaceId, workspaceId),
                eq(tasks.projectId, projectId)
            )
        );
};

export const updateTaskInDb = async (
    workspaceId: string,
    taskId: string,
    data: UpdateTaskInput
) => {
    const updateData = removeUndefined({
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        assigneeId: data.assigneeId,
        dueDate:
            data.dueDate === undefined
                ? undefined
                : data.dueDate === null
                    ? null
                    : new Date(data.dueDate),
        updatedAt: new Date(),
    });

    const [updatedTask] = await db
        .update(tasks)
        .set(updateData)
        .where(
            and(
                eq(tasks.id, taskId),
                eq(tasks.workspaceId, workspaceId)
            )
        )
        .returning();

    return updatedTask;
};