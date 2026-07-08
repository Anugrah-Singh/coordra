import { Request, Response, NextFunction } from 'express';
import { and, eq, isNull } from 'drizzle-orm';

import { db } from '../db/index.js';
import { workspaceMembers } from '../db/schema/workspaces.js';

type WorkspaceRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER' | 'VIEWER';

const ROLE_RANK: Record<WorkspaceRole, number> = {
  VIEWER: 1,
  MEMBER: 2,
  MANAGER: 3,
  ADMIN: 4,
  OWNER: 5,
};

const hasMinimumRole = (
  actualRole: WorkspaceRole,
  requiredRole: WorkspaceRole
) => {
  return ROLE_RANK[actualRole] >= ROLE_RANK[requiredRole];
};

const getWorkspaceId = (req: Request) => {
  const workspaceId = req.params.workspaceId;

  if (!workspaceId || typeof workspaceId !== 'string') {
    return null;
  }

  return workspaceId;
};

export const requireWorkspaceRole = (requiredRole: WorkspaceRole) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = res.locals.userId as string | undefined;
      const workspaceId = getWorkspaceId(req);

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      if (!workspaceId) {
        return res.status(400).json({
          success: false,
          message: 'Workspace id is required',
        });
      }

      const [member] = await db
        .select({
          id: workspaceMembers.id,
          workspaceId: workspaceMembers.workspaceId,
          userId: workspaceMembers.userId,
          role: workspaceMembers.role,
        })
        .from(workspaceMembers)
        .where(
          and(
            eq(workspaceMembers.workspaceId, workspaceId),
            eq(workspaceMembers.userId, userId),
            isNull(workspaceMembers.removedAt)
          )
        )
        .limit(1);

      if (!member) {
        return res.status(403).json({
          success: false,
          message: 'You are not a member of this workspace',
        });
      }

      if (!hasMinimumRole(member.role as WorkspaceRole, requiredRole)) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to perform this action',
        });
      }

      res.locals.workspaceId = workspaceId;
      res.locals.workspaceMemberId = member.id;
      res.locals.workspaceRole = member.role;

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const requireWorkspaceMember = requireWorkspaceRole('VIEWER');

export const requireWorkspaceContributor = requireWorkspaceRole('MEMBER');

export const requireWorkspaceManager = requireWorkspaceRole('MANAGER');

export const requireWorkspaceAdmin = requireWorkspaceRole('ADMIN');

export const requireWorkspaceOwner = requireWorkspaceRole('OWNER');