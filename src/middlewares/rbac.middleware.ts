import { Request, Response, NextFunction } from 'express';
import { and, eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { workspaceMembers } from '../db/schema/workspaces.js';


export const requireWorkspaceOwner = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = res.locals.userId;
        const { workspaceId } = req.params;

        if (!workspaceId || typeof workspaceId !== 'string') {
            res.status(400).json({
                success: false,
                message: 'Invalid or missing workspace ID in the URL'
            });
            return;
        }

        const [memberProfile] = await db
            .select()
            .from(workspaceMembers)
            .where(
                and(
                    eq(workspaceMembers.workspaceId, workspaceId),
                    eq(workspaceMembers.userId, userId)
                )
            );
        if (!memberProfile || memberProfile.role !== 'OWNER') {
            res.status(403).json({
                success: false,
                message: 'Fornidden: You must be the workspace owner to perform this action'
            });
            return;
        }

        next();
    } catch (error) {
        next(error);
    }
};


export const requireWorkspaceMember = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try{
        const userId = res.locals.userId;
        const { workspaceId } = req.params;

        if(!workspaceId || typeof workspaceId !== 'string') {
            res.status(400).json({
                success: false,
                message: 'Invalid or missing workspace ID in URL',
            });
            return;
        }

        const [membership] = await db
            .select()
            .from(workspaceMembers)
            .where(
                and(
                    eq(workspaceMembers.workspaceId, workspaceId),
                    eq(workspaceMembers.userId, userId)
                )
            );

        if (!membership) {
            res.status(403).json({
                success: false,
                message: 'Forbidden: You do not belong to this workspace',
            });
            return;
        }

        next();
    } catch(error) {
        next(error);
    }
};