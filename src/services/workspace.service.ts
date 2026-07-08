import { db } from '../db/index.js';
import { eq, and, isNull } from 'drizzle-orm';
import { workspaces, workspaceMembers } from '../db/schema/workspaces.js';
import { auditLogs } from '../db/schema/auditLogs.js';

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

type TransferWorkspaceOwnershipInput = {
  workspaceId: string;
  currentOwnerId: string;
  newOwnerMemberId: string;
};

const createHttpError = (message: string, status: number) => {
  return Object.assign(new Error(message), {
    status,
    statusCode: status,
  });
};

export const transferWorkspaceOwnershipInDb = async (
  data: TransferWorkspaceOwnershipInput
) => {
  return await db.transaction(async (tx) => {
    const [workspace] = await tx
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, data.workspaceId))
      .limit(1);

    if (!workspace) {
      throw createHttpError('Workspace not found', 404);
    }

    if (workspace.ownerId !== data.currentOwnerId) {
      throw createHttpError('Only the current workspace owner can transfer ownership', 403);
    }

    const [newOwnerMembership] = await tx
      .select()
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.id, data.newOwnerMemberId),
          eq(workspaceMembers.workspaceId, data.workspaceId),
          isNull(workspaceMembers.removedAt)
        )
      )
      .limit(1);

    if (!newOwnerMembership) {
      throw createHttpError('New owner must be an active workspace member', 404);
    }

    if (newOwnerMembership.userId === data.currentOwnerId) {
      throw createHttpError('You are already the workspace owner', 400);
    }

    await tx
      .update(workspaceMembers)
      .set({
        role: 'ADMIN',
      })
      .where(
        and(
          eq(workspaceMembers.workspaceId, data.workspaceId),
          eq(workspaceMembers.userId, data.currentOwnerId),
          isNull(workspaceMembers.removedAt)
        )
      );

    const [promotedMember] = await tx
      .update(workspaceMembers)
      .set({
        role: 'OWNER',
      })
      .where(eq(workspaceMembers.id, data.newOwnerMemberId))
      .returning();

    const [updatedWorkspace] = await tx
      .update(workspaces)
      .set({
        ownerId: newOwnerMembership.userId,
        updatedAt: new Date(),
      })
      .where(eq(workspaces.id, data.workspaceId))
      .returning();
    
        if (!updatedWorkspace) {
      throw createHttpError('Failed to update workspace owner', 500);
    }

    await tx.insert(auditLogs).values({
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