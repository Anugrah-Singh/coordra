import { Request, Response, NextFunction } from 'express';

import {
    createTaskInDb,
    getProjectTasksFromDb,
    updateTaskInDb,
} from '../services/task.service.js';

import {
    CreateTaskInput,
    UpdateTaskInput,
    TaskParams,
    TaskUpdateParams,
} from '../schemas/task.schema.js';

import { getIO } from '../socket.js';

export const createTaskHandler = async (
    req: Request<TaskParams, {}, CreateTaskInput>,
    res: Response,
    next: NextFunction
) => {
    try {
        const { workspaceId, projectId } = req.params;
        const createdById = res.locals.userId as string;

        const newTask = await createTaskInDb({
            workspaceId,
            projectId,
            createdById,
            ...req.body,
        });

        const io = getIO();
        io.to(workspaceId).emit('task_created', {
            projectId,
            task: newTask,
        });

        res.status(201).json({
            success: true,
            message: 'Task created successfully',
            data: newTask,
        });
    } catch (error) {
        next(error);
    }
};

export const getProjectTasksHandler = async (
    req: Request<TaskParams>,
    res: Response,
    next: NextFunction
) => {
    try {
        const { workspaceId, projectId } = req.params;

        const projectTasks = await getProjectTasksFromDb(workspaceId, projectId);

        res.status(200).json({
            success: true,
            message: 'Tasks retrieved successfully',
            data: projectTasks,
        });
    } catch (error) {
        next(error);
    }
};

export const updateTaskHandler = async (
    req: Request<TaskUpdateParams, {}, UpdateTaskInput>,
    res: Response,
    next: NextFunction
) => {
    try {
        const { workspaceId, projectId, taskId } = req.params;

        const updatedTask = await updateTaskInDb(
            workspaceId,
            taskId,
            req.body
        );

        if (!updatedTask) {
            return res.status(404).json({
                success: false,
                message: 'Task not found',
            });
        }

        const io = getIO();
        io.to(workspaceId).emit('task_updated', {
            projectId,
            task: updatedTask,
        });

        res.status(200).json({
            success: true,
            message: 'Task updated successfully',
            data: updatedTask,
        });
    } catch (error) {
        next(error);
    }
};