import { db } from '../db/index.js';
import { eq } from 'drizzle-orm';
import { workspaces, workspaceMembers } from '../db/schema/workspaces.js';
import { CreateWorkspaceInput } from '../schemas/workspace.schema.js';

export const createWorkspaceInDb = async (data: CreateWorkspaceInput) => {
    // 1. Generate the URL-friendly slug
    const generatedSlug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-') // Replace non-alphanumeric characters with hyphens
        .replace(/(^-|-$)+/g, ''); // Trim leading or trailing hyphens
    
    // The Atomic Transaction Block
    const result = await db.transaction(async (tx) => {
        //create the workspace
        const [newWorkspace] = await tx.insert(workspaces).values({
            name: data.name,
            slug: generatedSlug,
        }).returning();

        if (!newWorkspace) {
            throw new Error(
                "Database failed to return the newly created workspace"
            );
        }

        await tx.insert(workspaceMembers).values({
            workspaceId: newWorkspace.id,
            userId: data.ownerId,
            role: 'OWNER',
        });
        // We return the workspace data to send back to the frontend
        return newWorkspace;
    });
    // .returning() gives us back an array of the inserted rows.
    // We return the first (and only) item in that array.
    return result;
};

export const getUserWorkspacesFromDb = async (userId: string) => {
    return await db
        .select({
            id: workspaces.id,
            name: workspaces.name,
            slug: workspaces.slug,
            createdAt: workspaces.createdAt,
            // We can grab their structural role at the same time!
            role: workspaceMembers.role, 
        })
        .from(workspaces)
        .innerJoin(workspaceMembers, eq(workspaceMembers.workspaceId, workspaces.id))
        .where(eq(workspaceMembers.userId, userId));
};