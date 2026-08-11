import { insertAuditLog } from '../activity/service.js';
import { and, desc, eq, inArray } from 'drizzle-orm';

import { db } from '../../db/index.js';
import { auditLogs } from '../../db/schema/auditLogs.js';
import { projects } from '../../db/schema/projects.js';
import { comments } from '../../db/schema/comments.js';
import { tasks } from '../../db/schema/tasks.js';
import { users } from '../../db/schema/users.js';
import { getPagination } from '../../utils/pagination.js';

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

    await insertAuditLog(tx, {
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

export const getProjectSummary = async (data: {
  workspaceId: string;
  projectId?: string | undefined;
}) => {
  const projectConditions = [eq(projects.workspaceId, data.workspaceId)];
  if (data.projectId) projectConditions.push(eq(projects.id, data.projectId));

  const scopedProjects = await db
    .select()
    .from(projects)
    .where(and(...projectConditions))
    .orderBy(desc(projects.updatedAt), desc(projects.id))
    .limit(20);

  if (data.projectId && scopedProjects.length === 0) {
    throw createHttpError('Project not found', 404);
  }
  if (scopedProjects.length === 0) return [];

  const projectIds = scopedProjects.map((project) => project.id);
  const scopedTasks = await db
    .select({
      id: tasks.id,
      projectId: tasks.projectId,
      status: tasks.status,
      assigneeId: tasks.assigneeId,
      assigneeName: users.fullName,
      updatedAt: tasks.updatedAt,
    })
    .from(tasks)
    .leftJoin(users, eq(tasks.assigneeId, users.id))
    .where(
      and(eq(tasks.workspaceId, data.workspaceId), inArray(tasks.projectId, projectIds))
    );

  const taskIds = scopedTasks.map((task) => task.id);
  const commentActivity =
    taskIds.length === 0
      ? []
      : await db
          .select({ taskId: comments.taskId, createdAt: comments.createdAt })
          .from(comments)
          .where(
            and(
              eq(comments.workspaceId, data.workspaceId),
              inArray(comments.taskId, taskIds)
            )
          );

  return scopedProjects.map((project) => {
    const projectTasks = scopedTasks.filter((task) => task.projectId === project.id);
    const counts = {
      total: projectTasks.length,
      unfinished: projectTasks.filter((task) => task.status !== 'DONE').length,
      blocked: projectTasks.filter((task) => task.status === 'BLOCKED').length,
      done: projectTasks.filter((task) => task.status === 'DONE').length,
    };
    const activityTimes = [
      project.updatedAt,
      ...projectTasks.map((task) => task.updatedAt),
      ...commentActivity
        .filter((activity) => projectTasks.some((task) => task.id === activity.taskId))
        .map((activity) => activity.createdAt),
    ];
    const activeByMember = new Map<string, { name: string; count: number }>();
    for (const task of projectTasks) {
      if (!task.assigneeId || task.status === 'DONE') continue;
      const current = activeByMember.get(task.assigneeId) ?? {
        name: task.assigneeName ?? 'Workspace member',
        count: 0,
      };
      current.count += 1;
      activeByMember.set(task.assigneeId, current);
    }

    return {
      id: project.id,
      name: project.name,
      description: project.description,
      taskCounts: counts,
      lastActivityAt: new Date(
        Math.max(...activityTimes.map((value) => value.getTime()))
      ),
      memberLoad: [...activeByMember.entries()].map(([memberId, value]) => ({
        memberId,
        memberName: value.name,
        activeTasks: value.count,
      })),
    };
  });
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

    await insertAuditLog(tx, {
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

    await insertAuditLog(tx, {
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
