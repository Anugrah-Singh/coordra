import { Request, Response, NextFunction } from 'express';

import {
  addLabelToTaskInDb,
  createLabelInDb,
  deleteLabelInDb,
  getTaskLabelsFromDb,
  getWorkspaceLabelsFromDb,
  removeLabelFromTaskInDb,
  updateLabelInDb,
} from '../services/label.service.js';

import {
  CreateLabelInput,
  LabelActionParams,
  LabelWorkspaceParams,
  TaskLabelParams,
  TaskLabelsListParams,
  UpdateLabelInput,
  LabelListQuery,
  TaskLabelListQuery,
} from '../schemas/label.schema.js';

import { emitWorkspaceEvent } from '../utils/socketEvents.js';

export const getWorkspaceLabelsHandler = async (
  req: Request<LabelWorkspaceParams, {}, {}, LabelListQuery>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { workspaceId } = req.params;

    const workspaceLabels = await getWorkspaceLabelsFromDb({
      workspaceId,
      page: req.query.page,
      limit: req.query.limit,
    });

    res.status(200).json({
      success: true,
      message: 'Workspace labels retrieved successfully',
      data: workspaceLabels,
    });
  } catch (error) {
    next(error);
  }
};

export const createLabelHandler = async (
  req: Request<LabelWorkspaceParams, {}, CreateLabelInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { workspaceId } = req.params;
    const actorId = res.locals.userId as string;

    const newLabel = await createLabelInDb({
      workspaceId,
      actorId,
      name: req.body.name,
      color: req.body.color,
    });

    emitWorkspaceEvent(workspaceId, 'label_created', {
      workspaceId,
      label: newLabel,
    });

    res.status(201).json({
      success: true,
      message: 'Label created successfully',
      data: newLabel,
    });
  } catch (error) {
    next(error);
  }
};

export const updateLabelHandler = async (
  req: Request<LabelActionParams, {}, UpdateLabelInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { workspaceId, labelId } = req.params;
    const actorId = res.locals.userId as string;

    const updateData: {
      workspaceId: string;
      labelId: string;
      actorId: string;
      name?: string;
      color?: string;
    } = {
      workspaceId,
      labelId,
      actorId,
    };

    if (req.body.name !== undefined) {
      updateData.name = req.body.name;
    }

    if (req.body.color !== undefined) {
      updateData.color = req.body.color;
    }

    const updatedLabel = await updateLabelInDb(updateData);

    emitWorkspaceEvent(workspaceId, 'label_updated', {
      workspaceId,
      labelId,
      label: updatedLabel,
    });

    res.status(200).json({
      success: true,
      message: 'Label updated successfully',
      data: updatedLabel,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteLabelHandler = async (
  req: Request<LabelActionParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { workspaceId, labelId } = req.params;
    const actorId = res.locals.userId as string;

    const deletedLabel = await deleteLabelInDb({
      workspaceId,
      labelId,
      actorId,
    });

    emitWorkspaceEvent(workspaceId, 'label_deleted', {
      workspaceId,
      labelId,
      label: deletedLabel,
    });

    res.status(200).json({
      success: true,
      message: 'Label deleted successfully',
      data: deletedLabel,
    });
  } catch (error) {
    next(error);
  }
};

export const getTaskLabelsHandler = async (
  req: Request<TaskLabelsListParams, {}, {}, TaskLabelListQuery>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { workspaceId, projectId, taskId } = req.params;

    const taskLabelList = await getTaskLabelsFromDb({
      workspaceId,
      projectId,
      taskId,
      page: req.query.page,
      limit: req.query.limit,
    });

    res.status(200).json({
      success: true,
      message: 'Task labels retrieved successfully',
      data: taskLabelList,
    });
  } catch (error) {
    next(error);
  }
};

export const addLabelToTaskHandler = async (
  req: Request<TaskLabelParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { workspaceId, projectId, taskId, labelId } = req.params;
    const actorId = res.locals.userId as string;

    const label = await addLabelToTaskInDb({
      workspaceId,
      projectId,
      taskId,
      labelId,
      actorId,
    });

    emitWorkspaceEvent(workspaceId, 'task_label_added', {
      workspaceId,
      projectId,
      taskId,
      labelId,
      label,
    });

    res.status(201).json({
      success: true,
      message: 'Label added to task successfully',
      data: label,
    });
  } catch (error) {
    next(error);
  }
};

export const removeLabelFromTaskHandler = async (
  req: Request<TaskLabelParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { workspaceId, projectId, taskId, labelId } = req.params;
    const actorId = res.locals.userId as string;

    const label = await removeLabelFromTaskInDb({
      workspaceId,
      projectId,
      taskId,
      labelId,
      actorId,
    });

    emitWorkspaceEvent(workspaceId, 'task_label_removed', {
      workspaceId,
      projectId,
      taskId,
      labelId,
      label,
    });

    res.status(200).json({
      success: true,
      message: 'Label removed from task successfully',
      data: label,
    });
  } catch (error) {
    next(error);
  }
};