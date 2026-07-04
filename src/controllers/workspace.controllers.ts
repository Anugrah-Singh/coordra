import { Request, Response, NextFunction } from 'express';
import { createWorkspaceInDb } from '../services/workspace.service.js';
import { CreateWorkspaceInput } from '../schemas/workspace.schema.js';

export const createWorkspaceHandler = async (
    req: Request<{}, {}, CreateWorkspaceInput>,
    res: Response,
    next: NextFunction
) => {
    try {
        // 1. The data is already safe. 
        // We don't need 'if (!req.body.name)' because our Zod middleware guaranteed it.
        const workspaceData = req.body;

        // 2. Delegate the heavy lifting to the Service layer
        const newWorkspace = await createWorkspaceInDb(workspaceData);

        // 3. Package the successful HTTP response
        res.status(201).json({
            success: true,
            message: 'Workspace created successfully',
            data: newWorkspace,
        });
    } catch (error) {
    // 4. The Safety Net
    // If Postgres crashes (e.g., database goes offline), we catch the error 
    // and pass it to 'next()'. This instantly throws the error down to the 
    // Global Error Handler we wrote in server.ts.
    next(error);
    }
};