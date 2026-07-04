import { db } from '../db/index.js';
import { workspaces } from '../db/schema/workspaces.js';
import { CreateWorkspaceInput } from '../schemas/workspace.schema.js';

export const createWorkspaceInDb = async (data: CreateWorkspaceInput) => {
    const generatedSlug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-') // Replace non-alphanumeric characters with hyphens
        .replace(/(^-|-$)+/g, ''); // Trim leading or trailing hyphens
    
    const result = await db.insert(workspaces).values({
        name: data.name,
        slug: generatedSlug,
    }).returning();

    // .returning() gives us back an array of the inserted rows.
    // We return the first (and only) item in that array.
    return result[0];
};