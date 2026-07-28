import { Request, Response, NextFunction } from 'express';

import {
  archiveTask,
  assignTask,
  createTask,
  duplicateTask,
  getProjectTasks,
  getTaskById,
  unarchiveTask,
  updateTask,
  updateTaskStatus,
} from '../services/task.service.js';

import {
  AssignTaskInput,
  CreateTaskInput,
  TaskActionParams,
  TaskListQuery,
  TaskParams,
  UpdateTaskInput,
  UpdateTaskStatusInput,
} from '../schemas/task.schema.js';

import { emitUserEvent, emitWorkspaceEvent } from '../utils/socketEvents.js';

export const createTaskHandler = async (
  req: Request<TaskParams, {}, CreateTaskInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { workspaceId, projectId } = req.params;
    const createdById = res.locals.userId as string;

    const newTask = await createTask({
      workspaceId,
      projectId,
      createdById,
      title: req.body.title,
      description: req.body.description,
      status: req.body.status,
      priority: req.body.priority,
      assigneeId: req.body.assigneeId,
      dueDate: req.body.dueDate,
    });

    emitWorkspaceEvent(workspaceId, 'task_created', {
      workspaceId,
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
  req: Request<TaskParams, {}, {}, TaskListQuery>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { workspaceId, projectId } = req.params;

    const projectTasks = await getProjectTasks({
      workspaceId,
      projectId,
      filters: req.query,
    });

    res.status(200).json({
      success: true,
      message: 'Tasks retrieved successfully',
      data: projectTasks,
    });
  } catch (error) {
    next(error);
  }
};

export const getTaskByIdHandler = async (
  req: Request<TaskActionParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { workspaceId, projectId, taskId } = req.params;

    const task = await getTaskById(workspaceId, projectId, taskId);

    res.status(200).json({
      success: true,
      message: 'Task retrieved successfully',
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTaskHandler = async (
  req: Request<TaskActionParams, {}, UpdateTaskInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { workspaceId, projectId, taskId } = req.params;
    const actorId = res.locals.userId as string;

    const updatedTask = await updateTask({
      workspaceId,
      projectId,
      taskId,
      actorId,
      title: req.body.title,
      description: req.body.description,
      status: req.body.status,
      priority: req.body.priority,
      assigneeId: req.body.assigneeId,
      dueDate: req.body.dueDate,
    });

    emitWorkspaceEvent(workspaceId, 'task_updated', {
      workspaceId,
      projectId,
      taskId,
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

export const updateTaskStatusHandler = async (
  req: Request<TaskActionParams, {}, UpdateTaskStatusInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { workspaceId, projectId, taskId } = req.params;
    const actorId = res.locals.userId as string;

    const updatedTask = await updateTaskStatus({
      workspaceId,
      projectId,
      taskId,
      actorId,
      status: req.body.status,
    });

    emitWorkspaceEvent(workspaceId, 'task_status_changed', {
      workspaceId,
      projectId,
      taskId,
      task: updatedTask,
    });

    res.status(200).json({
      success: true,
      message: 'Task status updated successfully',
      data: updatedTask,
    });
  } catch (error) {
    next(error);
  }
};

export const assignTaskHandler = async (
  req: Request<TaskActionParams, {}, AssignTaskInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { workspaceId, projectId, taskId } = req.params;
    const actorId = res.locals.userId as string;

    const result = await assignTask({
      workspaceId,
      projectId,
      taskId,
      actorId,
      assigneeId: req.body.assigneeId,
    });

    emitWorkspaceEvent(workspaceId, 'task_assigned', {
      workspaceId,
      projectId,
      taskId,
      task: result.task,
    });

    if (result.notification) {
      emitUserEvent(result.notification.userId, 'notification_created', {
        notification: result.notification,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Task assignment updated successfully',
      data: result.task,
    });
  } catch (error) {
    next(error);
  }
};

export const archiveTaskHandler = async (
  req: Request<TaskActionParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { workspaceId, projectId, taskId } = req.params;
    const actorId = res.locals.userId as string;

    const archivedTask = await archiveTask({
      workspaceId,
      projectId,
      taskId,
      actorId,
    });

    emitWorkspaceEvent(workspaceId, 'task_archived', {
      workspaceId,
      projectId,
      taskId,
      task: archivedTask,
    });

    res.status(200).json({
      success: true,
      message: 'Task archived successfully',
      data: archivedTask,
    });
  } catch (error) {
    next(error);
  }
};

export const unarchiveTaskHandler = async (
  req: Request<TaskActionParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { workspaceId, projectId, taskId } = req.params;
    const actorId = res.locals.userId as string;

    const unarchivedTask = await unarchiveTask({
      workspaceId,
      projectId,
      taskId,
      actorId,
    });

    emitWorkspaceEvent(workspaceId, 'task_unarchived', {
      workspaceId,
      projectId,
      taskId,
      task: unarchivedTask,
    });

    res.status(200).json({
      success: true,
      message: 'Task unarchived successfully',
      data: unarchivedTask,
    });
  } catch (error) {
    next(error);
  }
};

export const duplicateTaskHandler = async (
  req: Request<TaskActionParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { workspaceId, projectId, taskId } = req.params;
    const actorId = res.locals.userId as string;

    const duplicatedTask = await duplicateTask({
      workspaceId,
      projectId,
      taskId,
      actorId,
    });

    emitWorkspaceEvent(workspaceId, 'task_duplicated', {
      workspaceId,
      projectId,
      sourceTaskId: taskId,
      task: duplicatedTask,
    });

    res.status(201).json({
      success: true,
      message: 'Task duplicated successfully',
      data: duplicatedTask,
    });
  } catch (error) {
    next(error);
  }
};
