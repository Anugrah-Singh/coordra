import { Request, Response, NextFunction } from 'express';

import {
  acceptWorkspaceInviteInDb,
  createWorkspaceInviteInDb,
  declineWorkspaceInviteInDb,
  deleteWorkspaceInviteInDb,
  getWorkspaceInvitesFromDb,
} from '../services/invite.service.js';

import {
  CreateWorkspaceInviteInput,
  InviteActionParams,
  InviteTokenParams,
  WorkspaceInviteParams,
  InviteListQuery,
} from '../schemas/invite.schema.js';

import {
  emitUserEvent,
  emitWorkspaceEvent,
} from '../utils/socketEvents.js';

export const getWorkspaceInvitesHandler = async (
  req: Request<WorkspaceInviteParams, {}, {}, InviteListQuery>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { workspaceId } = req.params;

    const invites = await getWorkspaceInvitesFromDb({
      workspaceId,
      page: req.query.page,
      limit: req.query.limit,
    });

    res.status(200).json({
      success: true,
      message: 'Workspace invites retrieved successfully',
      data: invites,
    });
  } catch (error) {
    next(error);
  }
};

export const createWorkspaceInviteHandler = async (
  req: Request<WorkspaceInviteParams, {}, CreateWorkspaceInviteInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { workspaceId } = req.params;
    const invitedById = res.locals.userId as string;

    const result = await createWorkspaceInviteInDb({
      workspaceId,
      invitedById,
      email: req.body.email,
      role: req.body.role,
    });

    emitWorkspaceEvent(workspaceId, 'workspace_invite_created', {
      workspaceId,
      invite: result.invite,
    });

    if (result.notification) {
      emitUserEvent(result.notification.userId, 'notification_created', {
        notification: result.notification,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Workspace invite created successfully',
      data: {
        invite: result.invite,
        token: result.rawToken,
        invitePath: `/workspace-invites/${result.rawToken}`,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteWorkspaceInviteHandler = async (
  req: Request<InviteActionParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { workspaceId, inviteId } = req.params;
    const actorId = res.locals.userId as string;

    const deletedInvite = await deleteWorkspaceInviteInDb({
      workspaceId,
      inviteId,
      actorId,
    });

    emitWorkspaceEvent(workspaceId, 'workspace_invite_deleted', {
      workspaceId,
      inviteId,
      invite: deletedInvite,
    });

    res.status(200).json({
      success: true,
      message: 'Workspace invite deleted successfully',
      data: deletedInvite,
    });
  } catch (error) {
    next(error);
  }
};

export const acceptWorkspaceInviteHandler = async (
  req: Request<InviteTokenParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token } = req.params;
    const actorId = res.locals.userId as string;

    const result = await acceptWorkspaceInviteInDb({
      token,
      actorId,
    });

    emitWorkspaceEvent(result.invite.workspaceId, 'workspace_invite_accepted', {
      workspaceId: result.invite.workspaceId,
      invite: result.invite,
      membership: result.membership,
      user: {
        id: result.user.id,
        email: result.user.email,
        fullName: result.user.fullName,
      },
    });

    emitWorkspaceEvent(result.invite.workspaceId, 'member_added', {
      workspaceId: result.invite.workspaceId,
      member: {
        membershipId: result.membership.id,
        userId: result.user.id,
        email: result.user.email,
        fullName: result.user.fullName,
        role: result.membership.role,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Workspace invite accepted successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const declineWorkspaceInviteHandler = async (
  req: Request<InviteTokenParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token } = req.params;
    const actorId = res.locals.userId as string;

    const result = await declineWorkspaceInviteInDb({
      token,
      actorId,
    });

    emitWorkspaceEvent(result.invite.workspaceId, 'workspace_invite_declined', {
      workspaceId: result.invite.workspaceId,
      invite: result.invite,
      user: {
        id: result.user.id,
        email: result.user.email,
        fullName: result.user.fullName,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Workspace invite declined successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};