import { and, desc, eq } from 'drizzle-orm';

import { db } from '../db/index.js';
import { auditLogs } from '../db/schema/auditLogs.js';
import { projects } from '../db/schema/projects.js';
import { getPagination } from '../utils/pagination.js';

type CreateProjectData = {
  workspaceId: string;
  actorId: string;
  name: string;
  description?: string | null;
};

type UpdateProjectData = {
  workspaceId: string;
  projectId: string;
  actorId: string;
  name?: string;
  description?: string | null;
};

const createHttpError = (message: string, status: number) => {
  return Object.assign(new Error(message), {
    status,
    statusCode: status,
  });
};

export const createProject = async (data: CreateProjectData) => {
  return await db.transaction(async (tx) => {
    const [newProject] = await tx
      .insert(projects)
      .values({
        workspaceId: data.workspaceId,
        name: data.name,
        description: data.description ?? null,
      })
      .returning();

    if (!newProject) {
      throw createHttpError('Failed to create project', 500);
    }

    await tx.insert(auditLogs).values({
      workspaceId: data.workspaceId,
      actorId: data.actorId,
      action: 'PROJECT_CREATED',
      entityType: 'project',
      entityId: newProject.id,
      oldValue: null,
      newValue: {
        name: newProject.name,
        description: newProject.description,
      },
    });

    return newProject;
  });
};

export const getWorkspaceProjects = async (data: {
  workspaceId: string;
  page?: string | undefined;
  limit?: string | undefined;
}) => {
  const pagination = getPagination({
    page: data.page,
    limit: data.limit,
  });

  return await db
    .select()
    .from(projects)
    .where(eq(projects.workspaceId, data.workspaceId))
    .orderBy(desc(projects.createdAt), desc(projects.id))
    .limit(pagination.limit)
    .offset(pagination.offset);
};

export const getProjectById = async (workspaceId: string, projectId: string) => {
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.workspaceId, workspaceId), eq(projects.id, projectId)))
    .limit(1);

  if (!project) {
    throw createHttpError('Project not found', 404);
  }

  return project;
};

export const updateProject = async (data: UpdateProjectData) => {
  return await db.transaction(async (tx) => {
    const [existingProject] = await tx
      .select()
      .from(projects)
      .where(
        and(eq(projects.workspaceId, data.workspaceId), eq(projects.id, data.projectId))
      )
      .limit(1);

    if (!existingProject) {
      throw createHttpError('Project not found', 404);
    }

    const [updatedProject] = await tx
      .update(projects)
      .set({
        name: data.name ?? existingProject.name,
        description:
          data.description !== undefined ? data.description : existingProject.description,
        updatedAt: new Date(),
      })
      .where(
        and(eq(projects.workspaceId, data.workspaceId), eq(projects.id, data.projectId))
      )
      .returning();

    if (!updatedProject) {
      throw createHttpError('Failed to update project', 500);
    }

    await tx.insert(auditLogs).values({
      workspaceId: data.workspaceId,
      actorId: data.actorId,
      action: 'PROJECT_UPDATED',
      entityType: 'project',
      entityId: updatedProject.id,
      oldValue: {
        name: existingProject.name,
        description: existingProject.description,
      },
      newValue: {
        name: updatedProject.name,
        description: updatedProject.description,
      },
    });

    return updatedProject;
  });
};

export const deleteProject = async (data: {
  workspaceId: string;
  projectId: string;
  actorId: string;
}) => {
  return await db.transaction(async (tx) => {
    const [existingProject] = await tx
      .select()
      .from(projects)
      .where(
        and(eq(projects.workspaceId, data.workspaceId), eq(projects.id, data.projectId))
      )
      .limit(1);

    if (!existingProject) {
      throw createHttpError('Project not found', 404);
    }

    const [deletedProject] = await tx
      .delete(projects)
      .where(
        and(eq(projects.workspaceId, data.workspaceId), eq(projects.id, data.projectId))
      )
      .returning();

    if (!deletedProject) {
      throw createHttpError('Failed to delete project', 500);
    }

    await tx.insert(auditLogs).values({
      workspaceId: data.workspaceId,
      actorId: data.actorId,
      action: 'PROJECT_DELETED',
      entityType: 'project',
      entityId: deletedProject.id,
      oldValue: {
        name: existingProject.name,
        description: existingProject.description,
      },
      newValue: null,
    });

    return deletedProject;
  });
};
