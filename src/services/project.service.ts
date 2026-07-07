import { db } from '../db/index.js';
import { projects } from '../db/schema/projects.js';
import { eq } from 'drizzle-orm';
import { CreateProjectInput } from '../schemas/project.schema.js';

interface CreateProjectData extends CreateProjectInput {
    workspaceId: string;
}

export const createProjectInDb = async (data: CreateProjectData) => {
    const [newProject] = await db.insert(projects).values({
        workspaceId: data.workspaceId,
        name: data.name,
        description: data.description,
    }).returning();

    if (!newProject) {
        throw new Error("Database failed to return the newly created project")
    }

    return newProject;
};


export const getWorkspaceProjectsFromDb = async (workspaceId: string) => {
    return await db
        .select()
        .from(projects)
        .where(eq(projects.workspaceId, workspaceId));
};

