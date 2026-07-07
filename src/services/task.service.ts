import { db } from '../db/index.js';
import { tasks } from '../db/schema/tasks.js';
import { eq, and } from 'drizzle-orm';
import { CreateTaskInput, UpdateTaskInput } from '../schemas/task.schema.js';

interface CreateTaskData extends CreateTaskInput {
    workspaceId: string;
    projectId: string;
    createdBy: string;
}

export const createTaskInDb = async (data: CreateTaskData) => {
    const [newTask] = await db.insert(tasks).values({
        workspaceId: data.workspaceId,
        projectId: data.projectId,
        createdBy: data.createdBy,
        title: data.title,
        description: data.description,
        status: data.status || 'TODO',
        assigneeId: data.assigneeId,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
    }).returning();

    if (!newTask) {
        throw new Error("Database failed to return the newly created task");
    }

    return newTask;
};

export const getProjectTasksFromDb = async (workspaceId: string, projectId: string) => {
    return await db
        .select()
        .from(tasks)
        // Drizzle Standard: and() wrapped eq() checks
        .where(
            and(
                eq(tasks.workspaceId, workspaceId),
                eq(tasks.projectId, projectId)
            )
        );
};

export const updateTaskInDb = async (taskId: string, updateData: UpdateTaskInput) => {
    
    const parsedDueDate = updateData.dueDate === undefined 
        ? undefined 
        : (updateData.dueDate === null ? null : new Date(updateData.dueDate));

    const [updatedTask] = await db.update(tasks)
        .set({
            ...updateData,
            dueDate: parsedDueDate,
            updatedAt: new Date(),
        })
        .where(eq(tasks.id, taskId))
        .returning();

    return updatedTask;
};