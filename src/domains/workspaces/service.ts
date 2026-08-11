import { insertAuditLog } from '../activity/service.js';
import { randomBytes } from 'node:crypto';

import { and, eq, sql } from 'drizzle-orm';

import { db } from '../../db/index.js';

import { auditLogs } from '../../db/schema/auditLogs.js';

import { workspaceMembers, workspaces } from '../../db/schema/workspaces.js';

import { AppError } from '../../utils/AppError.js';

type CreateWorkspaceServiceInput = {
  name: string;
  ownerId: string;
};

type TransferWorkspaceOwnershipInput = {
  workspaceId: string;
  currentOwnerId: string;
  newOwnerMemberId: string;
};

const generateWorkspaceSlug = (name: string): string => {
  const baseSlug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

  const suffix = randomBytes(4).toString('hex');

  return `${baseSlug || 'workspace'}-${suffix}`;
};

export const createWorkspace = async (data: CreateWorkspaceServiceInput) => {
  const generatedSlug = generateWorkspaceSlug(data.name);

  return await db.transaction(async (tx) => {
    const [newWorkspace] = await tx
      .insert(workspaces)
      .values({
        name: data.name,
        slug: generatedSlug,
      })
      .returning();

    if (!newWorkspace) {
      throw AppError.internalError('Failed to create workspace');
    }

    const [ownerMembership] = await tx
      .insert(workspaceMembers)
      .values({
        workspaceId: newWorkspace.id,

        userId: data.ownerId,

        role: 'OWNER',
      })
      .returning();

    if (!ownerMembership) {
      throw AppError.internalError('Failed to create workspace owner membership');
    }

    return newWorkspace;
  });
};

export const getUserWorkspaces = async (userId: string) => {
  return await db
    .select({
      id: workspaces.id,
      name: workspaces.name,
      slug: workspaces.slug,
      ownerId: sql<string>`(
        select ${workspaceMembers.userId}
        from ${workspaceMembers}
        where ${workspaceMembers.workspaceId} = ${workspaces.id}
          and ${workspaceMembers.role} = 'OWNER'
        limit 1
      )`,
      createdAt: workspaces.createdAt,
      updatedAt: workspaces.updatedAt,
      role: workspaceMembers.role,
    })
    .from(workspaces)
    .innerJoin(workspaceMembers, eq(workspaceMembers.workspaceId, workspaces.id))
    .where(eq(workspaceMembers.userId, userId));
};

export const transferWorkspaceOwnership = async (
  data: TransferWorkspaceOwnershipInput
) => {
  return await db.transaction(async (tx) => {
    const [workspace] = await tx
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, data.workspaceId))
      .limit(1);

    if (!workspace) {
      throw AppError.notFound('Workspace not found');
    }

    const [currentOwner] = await tx
      .select({ userId: workspaceMembers.userId })
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, data.workspaceId),
          eq(workspaceMembers.userId, data.currentOwnerId),
          eq(workspaceMembers.role, 'OWNER')
        )
      )
      .limit(1);

    if (!currentOwner) {
      throw AppError.forbidden('Only the current workspace owner can transfer ownership');
    }

    const [newOwnerMembership] = await tx
      .select()
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.id, data.newOwnerMemberId),

          eq(workspaceMembers.workspaceId, data.workspaceId)
        )
      )
      .limit(1);

    if (!newOwnerMembership) {
      throw AppError.notFound('New owner must be an active workspace member');
    }

    if (newOwnerMembership.userId === data.currentOwnerId) {
      throw AppError.badRequest('You are already the workspace owner');
    }

    const [previousOwnerMembership] = await tx
      .update(workspaceMembers)
      .set({
        role: 'ADMIN',
      })
      .where(
        and(
          eq(workspaceMembers.workspaceId, data.workspaceId),

          eq(workspaceMembers.userId, data.currentOwnerId)
        )
      )
      .returning();

    if (!previousOwnerMembership) {
      throw AppError.internalError('Failed to update the previous owner membership');
    }

    const [promotedMember] = await tx
      .update(workspaceMembers)
      .set({
        role: 'OWNER',
      })
      .where(eq(workspaceMembers.id, data.newOwnerMemberId))
      .returning();

    if (!promotedMember) {
      throw AppError.internalError('Failed to promote the new workspace owner');
    }

    const [updatedWorkspace] = await tx
      .update(workspaces)
      .set({
        updatedAt: new Date(),
      })
      .where(eq(workspaces.id, data.workspaceId))
      .returning();

    if (!updatedWorkspace) {
      throw AppError.internalError('Failed to update workspace owner');
    }

    await insertAuditLog(tx, {
      workspaceId: data.workspaceId,

      actorId: data.currentOwnerId,

      action: 'OWNER_TRANSFERRED',

      entityType: 'workspace',

      entityId: data.workspaceId,

      oldValue: {
        ownerId: data.currentOwnerId,
      },

      newValue: {
        ownerId: newOwnerMembership.userId,

        newOwnerMemberId: data.newOwnerMemberId,
      },
    });

    return {
      workspace: updatedWorkspace,

      newOwnerMembership: promotedMember,
    };
  });
};

export const getWorkspaceById = async (workspaceId: string) => {
  const [workspace] = await db
    .select({
      id: workspaces.id,
      name: workspaces.name,
      slug: workspaces.slug,
      ownerId: sql<string>`(
        select ${workspaceMembers.userId}
        from ${workspaceMembers}
        where ${workspaceMembers.workspaceId} = ${workspaces.id}
          and ${workspaceMembers.role} = 'OWNER'
        limit 1
      )`,
      createdAt: workspaces.createdAt,
      updatedAt: workspaces.updatedAt,
    })
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);

  if (!workspace) {
    throw AppError.notFound('Workspace not found');
  }

  return workspace;
};

export const updateWorkspace = async (data: {
  workspaceId: string;
  actorId: string;
  name: string;
}) => {
  return await db.transaction(async (tx) => {
    const [existingWorkspace] = await tx
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, data.workspaceId))
      .limit(1);

    if (!existingWorkspace) {
      throw AppError.notFound('Workspace not found');
    }

    const [updatedWorkspace] = await tx
      .update(workspaces)
      .set({
        name: data.name,
        updatedAt: new Date(),
      })
      .where(eq(workspaces.id, data.workspaceId))
      .returning();

    if (!updatedWorkspace) {
      throw AppError.internalError('Failed to update workspace');
    }

    await insertAuditLog(tx, {
      workspaceId: data.workspaceId,

      actorId: data.actorId,

      action: 'WORKSPACE_UPDATED',

      entityType: 'workspace',

      entityId: updatedWorkspace.id,

      oldValue: {
        name: existingWorkspace.name,
      },

      newValue: {
        name: updatedWorkspace.name,
      },
    });

    return updatedWorkspace;
  });
};

export const deleteWorkspace = async (data: {
  workspaceId: string;
  actorId: string;
  confirmationName: string;
}) => {
  const [existingWorkspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, data.workspaceId))
    .limit(1);

  if (!existingWorkspace) {
    throw AppError.notFound('Workspace not found');
  }

  const [ownerMembership] = await db
    .select({ id: workspaceMembers.id })
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, data.workspaceId),
        eq(workspaceMembers.userId, data.actorId),
        eq(workspaceMembers.role, 'OWNER')
      )
    )
    .limit(1);

  if (!ownerMembership) {
    throw AppError.forbidden('Only the workspace owner can delete this workspace');
  }

  if (existingWorkspace.name !== data.confirmationName) {
    throw AppError.badRequest('Workspace name confirmation does not match');
  }

  const [deletedWorkspace] = await db
    .delete(workspaces)
    .where(
      and(eq(workspaces.id, data.workspaceId), eq(workspaces.name, data.confirmationName))
    )
    .returning();

  if (!deletedWorkspace) {
    throw AppError.conflict('Workspace changed before it could be deleted');
  }

  return deletedWorkspace;
};
