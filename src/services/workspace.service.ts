import { db } from '../db/index.js';
import { eq, and, isNull } from 'drizzle-orm';
import { workspaces, workspaceMembers } from '../db/schema/workspaces.js';

type CreateWorkspaceServiceInput = {
    name: string;
    ownerId: string;
};

const generateWorkspaceSlug = (name: string) => {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
};

export const createWorkspaceInDb = async (data: CreateWorkspaceServiceInput) => {
    const generatedSlug = generateWorkspaceSlug(data.name);

    const result = await db.transaction(async (tx) => {
        const [newWorkspace] = await tx
            .insert(workspaces)
            .values({
                name: data.name,
                slug: generatedSlug,
                ownerId: data.ownerId,
            })
            .returning();

        if (!newWorkspace) {
            throw new Error('Database failed to return the newly created workspace');
        }

        await tx.insert(workspaceMembers).values({
            workspaceId: newWorkspace.id,
            userId: data.ownerId,
            role: 'OWNER',
        });

        return newWorkspace;
    });

    return result;
};

export const getUserWorkspacesFromDb = async (userId: string) => {
    return await db
        .select({
            id: workspaces.id,
            name: workspaces.name,
            slug: workspaces.slug,
            ownerId: workspaces.ownerId,
            createdAt: workspaces.createdAt,
            updatedAt: workspaces.updatedAt,
            role: workspaceMembers.role,
        })
        .from(workspaces)
        .innerJoin(
            workspaceMembers,
            eq(workspaceMembers.workspaceId, workspaces.id)
        )
        .where(
            and(
                eq(workspaceMembers.userId, userId),
                isNull(workspaceMembers.removedAt)
            )
        );
};