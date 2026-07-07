import { Request, Response, NextFunction } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users } from '../db/schema/users.js';
import { workspaceMembers } from '../db/schema/workspaces.js';
import { getWorkspaceMembersFromDb } from '../services/member.service.js';


export const addMemberHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { workspaceId } = req.params;
        
        if (!workspaceId || typeof workspaceId !== 'string') {
            res.status(400).json({
                success: false,
                message: 'Invalid or missing workspace ID in the URL'
            });
            return;
        
        }
        const { email, role } = req.body;

        const [targetUser] = await db.select().from(users).where(
            eq(users.email, email)
        );

        if (!targetUser) {
            res.status(404).json({
                success: false,
                message: 'User not found in the system'
            });
            return;
        }

        

        await db.insert(workspaceMembers).values({
            workspaceId: workspaceId,
            userId: targetUser.id,
            role: role
        });

        res.status(201).json({
            success: true,
            message: 'Member successfully added to the workspace',
            data: {
                userId: targetUser.id,
                email: targetUser.email,
                role: role
            }
        });
    } catch (error: any) {
        // Postgres Error 23505: Unique Constraint Violation
        if (error.code === '23505') {
            res.status(409).json({
                success: false,
                message: 'Uset is already a member of this worksoace'
            });
            return;
        }
        next(error);
    }
};


export const getWorkspaceMembersHandler = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const { workspaceId } = req.params;

        if (!workspaceId || typeof workspaceId !== 'string') {
            res.status(400).json({
                success: false,
                message: 'Invalid or missing workspace ID in the URL'
            });
            return;
        }

        const members = await getWorkspaceMembersFromDb(workspaceId);

        res.status(200).json({
            success: true,
            message: 'Workspace members retrieved successfully',
            data: members,
        });
    } catch (error) {
        next(error);
    }
}