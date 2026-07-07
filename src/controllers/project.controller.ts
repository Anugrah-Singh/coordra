import { Request, Response, NextFunction } from 'express';
import { createProjectInDb, getWorkspaceProjectsFromDb } from '../services/project.service.js';
import { CreateProjectInput, ProjectParams } from '../schemas/project.schema.js';

export const createProjectHandler = async (
    req: Request<ProjectParams, {}, CreateProjectInput>,
    res: Response,
    next: NextFunction
) => {
    try {
        const { workspaceId } = req.params;
        const { name, description } = req.body;

        const newProject = await createProjectInDb({
            workspaceId,
            name,
            description
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
    req: Request<ProjectParams>,
    res: Response,
    next: NextFunction
) => {
    try {
        const { workspaceId } = req.params;

        const workspaceProjects = await getWorkspaceProjectsFromDb(workspaceId);

        res.status(200).json({
            success: true,
            message: 'Projects retrieved successfully',
            data: workspaceProjects,
        });
    } catch (error) {
        next(error);
    }
};
