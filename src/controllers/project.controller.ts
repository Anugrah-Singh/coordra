import { Request, Response, NextFunction } from 'express';

import {
  createProjectInDb,
  deleteProjectFromDb,
  getProjectByIdFromDb,
  getWorkspaceProjectsFromDb,
  updateProjectInDb,
} from '../services/project.service.js';

import {
  CreateProjectInput,
  GetProjectsQuery,
  ProjectActionParams,
  ProjectWorkspaceParams,
  UpdateProjectInput,
} from '../schemas/project.schema.js';

import { emitWorkspaceEvent } from '../utils/socketEvents.js';

export const createProjectHandler = async (
  req: Request<ProjectWorkspaceParams, {}, CreateProjectInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { workspaceId } = req.params;
    const actorId = res.locals.userId as string;

    const newProject = await createProjectInDb({
      workspaceId,
      actorId,
      name: req.body.name,
      description: req.body.description ?? null,
    });
    emitWorkspaceEvent(workspaceId, 'project_created', {
      workspaceId,
      project: newProject,
    });

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: newProject,
    });
  } catch (error) {
    next(error);
  }
};

export const getWorkspaceProjectsHandler = async (
  req: Request<ProjectWorkspaceParams, {}, {}, GetProjectsQuery>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { workspaceId } = req.params;

    const workspaceProjects = await getWorkspaceProjectsFromDb({
      workspaceId,
      page: req.query.page,
      limit: req.query.limit,
    });

    res.status(200).json({
      success: true,
      message: 'Projects retrieved successfully',
      data: workspaceProjects,
    });
  } catch (error) {
    next(error);
  }
};

export const getProjectByIdHandler = async (
  req: Request<ProjectActionParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { workspaceId, projectId } = req.params;

    const project = await getProjectByIdFromDb(workspaceId, projectId);

    res.status(200).json({
      success: true,
      message: 'Project retrieved successfully',
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProjectHandler = async (
  req: Request<ProjectActionParams, {}, UpdateProjectInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { workspaceId, projectId } = req.params;
    const actorId = res.locals.userId as string;

    const updateData: {
        workspaceId: string;
        projectId: string;
        actorId: string;
        name?: string;
        description?: string | null;
    } = {
        workspaceId,
        projectId,
        actorId,
    };

    if (req.body.name !== undefined) {
        updateData.name = req.body.name;
    }

    if (req.body.description !== undefined) {
        updateData.description = req.body.description;
    }

    const updatedProject = await updateProjectInDb(updateData);

    emitWorkspaceEvent(workspaceId, 'project_updated', {
      workspaceId,
      projectId,
      project: updatedProject,
    });

    res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      data: updatedProject,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProjectHandler = async (
  req: Request<ProjectActionParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { workspaceId, projectId } = req.params;
    const actorId = res.locals.userId as string;

    const deletedProject = await deleteProjectFromDb({
      workspaceId,
      projectId,
      actorId,
    });

    emitWorkspaceEvent(workspaceId, 'project_deleted', {
      workspaceId,
      projectId,
      project: deletedProject,
    });

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully',
      data: deletedProject,
    });
  } catch (error) {
    next(error);
  }
};