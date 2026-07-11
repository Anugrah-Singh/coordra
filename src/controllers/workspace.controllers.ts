import { Request, Response, NextFunction } from 'express';
import {
  createWorkspaceInDb,
  deleteWorkspaceFromDb,
  getUserWorkspacesFromDb,
  getWorkspaceByIdFromDb,
  transferWorkspaceOwnershipInDb,
  updateWorkspaceInDb,
} from '../services/workspace.service.js';

import {
  CreateWorkspaceInput,
  DeleteWorkspaceInput,
  TransferWorkspaceOwnerInput,
  UpdateWorkspaceInput,
  WorkspaceParams,
} from '../schemas/workspace.schema.js';

import { emitWorkspaceEvent } from '../utils/socketEvents.js';

export const createWorkspaceHandler = async (
    req: Request<{}, {}, CreateWorkspaceInput>,
    res: Response,
    next: NextFunction
) => {
    try {
        const ownerId = res.locals.userId;
        // 1. The data is already safe. 
        // We don't need 'if (!req.body.name)' because our Zod middleware guaranteed it.
        const workspaceData = {
            name: req.body.name,
            ownerId: ownerId
        };

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

export const getUserWorkspacesHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
    
        const userId = res.locals.userId;

        const workspaces = await getUserWorkspacesFromDb(userId);

        res.status(200).json({
            success: true,
            message: 'Workspaces retrieved successfully',
            data: workspaces,
        });

    } catch (error) {
        next(error);
    }
};

export const transferWorkspaceOwnerHandler = async (
  req: Request<WorkspaceParams, {}, TransferWorkspaceOwnerInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { workspaceId } = req.params;
    const { newOwnerMemberId } = req.body;
    const currentOwnerId = res.locals.userId as string;

    const result = await transferWorkspaceOwnershipInDb({
      workspaceId,
      currentOwnerId,
      newOwnerMemberId,
    });

    emitWorkspaceEvent(workspaceId, 'owner_transferred', {
        workspaceId,
        oldOwnerId: currentOwnerId,
        newOwnerMemberId,
        workspace: result.workspace,
        newOwnerMembership: result.newOwnerMembership,
    });

    res.status(200).json({
      success: true,
      message: 'Workspace ownership transferred successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getWorkspaceByIdHandler = async (
  req: Request<WorkspaceParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { workspaceId } = req.params;

    const workspace =
      await getWorkspaceByIdFromDb(workspaceId);

    res.status(200).json({
      success: true,
      message: 'Workspace retrieved successfully',
      data: workspace,
    });
  } catch (error) {
    next(error);
  }
};

export const updateWorkspaceHandler = async (
  req: Request<
    WorkspaceParams,
    {},
    UpdateWorkspaceInput
  >,
  res: Response,
  next: NextFunction
) => {
  try {
    const { workspaceId } = req.params;
    const actorId = res.locals.userId as string;

    const updatedWorkspace =
      await updateWorkspaceInDb({
        workspaceId,
        actorId,
        name: req.body.name,
      });

    emitWorkspaceEvent(
      workspaceId,
      'workspace_updated',
      {
        workspaceId,
        workspace: updatedWorkspace,
      }
    );

    res.status(200).json({
      success: true,
      message: 'Workspace updated successfully',
      data: updatedWorkspace,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteWorkspaceHandler = async (
  req: Request<
    WorkspaceParams,
    {},
    DeleteWorkspaceInput
  >,
  res: Response,
  next: NextFunction
) => {
  try {
    const { workspaceId } = req.params;
    const actorId = res.locals.userId as string;

    const deletedWorkspace =
      await deleteWorkspaceFromDb({
        workspaceId,
        actorId,
        confirmationName:
          req.body.confirmationName,
      });

    emitWorkspaceEvent(
      workspaceId,
      'workspace_deleted',
      {
        workspaceId,
        workspace: deletedWorkspace,
      }
    );

    res.status(200).json({
      success: true,
      message: 'Workspace deleted successfully',
      data: deletedWorkspace,
    });
  } catch (error) {
    next(error);
  }
};