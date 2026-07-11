import { Request, Response, NextFunction } from 'express';

import { emitWorkspaceEvent } from '../utils/socketEvents.js';

import {
  getWorkspaceMembersFromDb,
  addWorkspaceMemberByEmail,
  updateWorkspaceMemberRoleInDb,
  softRemoveWorkspaceMemberInDb,
} from '../services/member.service.js';

import {
  AddMemberInput,
  UpdateMemberRoleInput,
  MemberParams,
  MemberActionParams,
  MemberListQuery,
} from '../schemas/member.schema.js';

export const addMemberHandler = async (
  req: Request<MemberParams, {}, AddMemberInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { workspaceId } = req.params;
    const { email, role } = req.body;
    const actorId = res.locals.userId as string;


    const result = await addWorkspaceMemberByEmail({
      workspaceId,
      actorId,
      email,
      role,
    });

    emitWorkspaceEvent(workspaceId, 'member_added', {
        workspaceId,
        member: {
        membershipId: result.membership?.id,
        userId: result.user.id,
        email: result.user.email,
        fullName: result.user.fullName,
        role: result.membership?.role,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Member successfully added to the workspace',
      data: {
        membershipId: result.membership?.id,
        userId: result.user.id,
        email: result.user.email,
        fullName: result.user.fullName,
        role: result.membership?.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getWorkspaceMembersHandler = async (
  req: Request<MemberParams, {}, {}, MemberListQuery>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { workspaceId } = req.params;

    const members = await getWorkspaceMembersFromDb({
      workspaceId,
      page: req.query.page,
      limit: req.query.limit,
    });

    res.status(200).json({
      success: true,
      message: 'Workspace members retrieved successfully',
      data: members,
    });
  } catch (error) {
    next(error);
  }
};

export const updateMemberRoleHandler = async (
  req: Request<MemberActionParams, {}, UpdateMemberRoleInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { workspaceId, memberId } = req.params;
    const { role } = req.body;
    const actorId = res.locals.userId as string;


    const updatedMember = await updateWorkspaceMemberRoleInDb({
      workspaceId,
      actorId,
      memberId,
      role,
    });

    emitWorkspaceEvent(workspaceId, 'member_role_updated', {
        workspaceId,
        memberId,
        member: updatedMember,
    });

    res.status(200).json({
      success: true,
      message: 'Member role updated successfully',
      data: updatedMember,
    });
  } catch (error) {
    next(error);
  }
};

export const removeMemberHandler = async (
  req: Request<MemberActionParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { workspaceId, memberId } = req.params;
    const actorId = res.locals.userId as string;


    const removedMember = await softRemoveWorkspaceMemberInDb({
      workspaceId,
      actorId,
      memberId,
    });

    emitWorkspaceEvent(workspaceId, 'member_removed', {
      workspaceId,
      memberId,
      member: removedMember,
    });

    res.status(200).json({
      success: true,
      message: 'Member removed successfully',
      data: removedMember,
    });
  } catch (error) {
    next(error);
  }
};