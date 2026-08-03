import { NextFunction, Request, Response } from 'express';

import { and, eq } from 'drizzle-orm';

import { z } from 'zod';

import { db } from '../db/index.js';

import { workspaceMembers } from '../db/schema/workspaces.js';

import { APP_ERROR_CODES } from '../utils/AppError.js';

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
): boolean => {
  return ROLE_RANK[actualRole] >= ROLE_RANK[requiredRole];
};

const getWorkspaceId = (req: Request): string | null => {
  const workspaceId = req.params.workspaceId;

  return typeof workspaceId === 'string' ? workspaceId : null;
};

export const requireWorkspaceRole = (requiredRole: WorkspaceRole) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = res.locals.userId as string | undefined;

      const workspaceId = getWorkspaceId(req);

      if (!userId) {
        res.status(401).json({
          success: false,

          code: APP_ERROR_CODES.AUTHENTICATION_REQUIRED,

          message: 'Authentication required',
        });

        return;
      }

      if (!workspaceId) {
        res.status(400).json({
          success: false,

          code: APP_ERROR_CODES.BAD_REQUEST,

          message: 'Workspace id is required',
        });

        return;
      }

      if (!z.uuid().safeParse(workspaceId).success) {
        res.status(400).json({
          success: false,

          code: APP_ERROR_CODES.BAD_REQUEST,

          message: 'Invalid workspace ID',
        });

        return;
      }

      const [member] = await db
        .select({
          id: workspaceMembers.id,

          role: workspaceMembers.role,
        })
        .from(workspaceMembers)
        .where(
          and(
            eq(workspaceMembers.workspaceId, workspaceId),

            eq(workspaceMembers.userId, userId)
          )
        )
        .limit(1);

      if (!member) {
        res.status(403).json({
          success: false,

          code: APP_ERROR_CODES.FORBIDDEN,

          message: 'You are not a member of this workspace',
        });

        return;
      }

      if (!hasMinimumRole(member.role, requiredRole)) {
        res.status(403).json({
          success: false,

          code: APP_ERROR_CODES.FORBIDDEN,

          message: 'You do not have permission to perform this action',
        });

        return;
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
