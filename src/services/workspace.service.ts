import {
  randomBytes,
} from 'node:crypto';

import {
  and,
  eq,
  isNull,
} from 'drizzle-orm';

import { db } from '../db/index.js';

import { auditLogs } from '../db/schema/auditLogs.js';

import {
  workspaceMembers,
  workspaces,
} from '../db/schema/workspaces.js';

import {
  badRequest,
  conflict,
  forbidden,
  internalError,
  notFound,
} from '../utils/httpErrors.js';

type CreateWorkspaceServiceInput = {
  name: string;
  ownerId: string;
};

type TransferWorkspaceOwnershipInput = {
  workspaceId: string;
  currentOwnerId: string;
  newOwnerMemberId: string;
};

const generateWorkspaceSlug = (
  name: string
): string => {
  const baseSlug = name
    .toLowerCase()
    .trim()
    .replace(
      /[^a-z0-9]+/g,
      '-'
    )
    .replace(
      /(^-|-$)+/g,
      ''
    );

  const suffix = randomBytes(4)
    .toString('hex');

  return `${
    baseSlug || 'workspace'
  }-${suffix}`;
};

export const createWorkspaceInDb =
  async (
    data: CreateWorkspaceServiceInput
  ) => {
    const generatedSlug =
      generateWorkspaceSlug(data.name);

    return await db.transaction(
      async (tx) => {
        const [newWorkspace] =
          await tx
            .insert(workspaces)
            .values({
              name: data.name,
              slug: generatedSlug,
              ownerId: data.ownerId,
            })
            .returning();

        if (!newWorkspace) {
          throw internalError(
            'Failed to create workspace'
          );
        }

        const [ownerMembership] =
          await tx
            .insert(
              workspaceMembers
            )
            .values({
              workspaceId:
                newWorkspace.id,

              userId:
                data.ownerId,

              role: 'OWNER',
            })
            .returning();

        if (!ownerMembership) {
          throw internalError(
            'Failed to create workspace owner membership'
          );
        }

        return newWorkspace;
      }
    );
  };

export const getUserWorkspacesFromDb =
  async (
    userId: string
  ) => {
    return await db
      .select({
        id: workspaces.id,
        name: workspaces.name,
        slug: workspaces.slug,
        ownerId:
          workspaces.ownerId,
        createdAt:
          workspaces.createdAt,
        updatedAt:
          workspaces.updatedAt,
        role:
          workspaceMembers.role,
      })
      .from(workspaces)
      .innerJoin(
        workspaceMembers,
        eq(
          workspaceMembers.workspaceId,
          workspaces.id
        )
      )
      .where(
        and(
          eq(
            workspaceMembers.userId,
            userId
          ),

          isNull(
            workspaceMembers.removedAt
          )
        )
      );
  };

export const transferWorkspaceOwnershipInDb =
  async (
    data:
      TransferWorkspaceOwnershipInput
  ) => {
    return await db.transaction(
      async (tx) => {
        const [workspace] =
          await tx
            .select()
            .from(workspaces)
            .where(
              eq(
                workspaces.id,
                data.workspaceId
              )
            )
            .limit(1);

        if (!workspace) {
          throw notFound(
            'Workspace not found'
          );
        }

        if (
          workspace.ownerId !==
          data.currentOwnerId
        ) {
          throw forbidden(
            'Only the current workspace owner can transfer ownership'
          );
        }

        const [newOwnerMembership] =
          await tx
            .select()
            .from(
              workspaceMembers
            )
            .where(
              and(
                eq(
                  workspaceMembers.id,
                  data.newOwnerMemberId
                ),

                eq(
                  workspaceMembers.workspaceId,
                  data.workspaceId
                ),

                isNull(
                  workspaceMembers.removedAt
                )
              )
            )
            .limit(1);

        if (!newOwnerMembership) {
          throw notFound(
            'New owner must be an active workspace member'
          );
        }

        if (
          newOwnerMembership.userId ===
          data.currentOwnerId
        ) {
          throw badRequest(
            'You are already the workspace owner'
          );
        }

        const [previousOwnerMembership] =
          await tx
            .update(
              workspaceMembers
            )
            .set({
              role: 'ADMIN',
            })
            .where(
              and(
                eq(
                  workspaceMembers.workspaceId,
                  data.workspaceId
                ),

                eq(
                  workspaceMembers.userId,
                  data.currentOwnerId
                ),

                isNull(
                  workspaceMembers.removedAt
                )
              )
            )
            .returning();

        if (!previousOwnerMembership) {
          throw internalError(
            'Failed to update the previous owner membership'
          );
        }

        const [promotedMember] =
          await tx
            .update(
              workspaceMembers
            )
            .set({
              role: 'OWNER',
            })
            .where(
              eq(
                workspaceMembers.id,
                data.newOwnerMemberId
              )
            )
            .returning();

        if (!promotedMember) {
          throw internalError(
            'Failed to promote the new workspace owner'
          );
        }

        const [updatedWorkspace] =
          await tx
            .update(workspaces)
            .set({
              ownerId:
                newOwnerMembership.userId,

              updatedAt:
                new Date(),
            })
            .where(
              eq(
                workspaces.id,
                data.workspaceId
              )
            )
            .returning();

        if (!updatedWorkspace) {
          throw internalError(
            'Failed to update workspace owner'
          );
        }

        await tx
          .insert(auditLogs)
          .values({
            workspaceId:
              data.workspaceId,

            actorId:
              data.currentOwnerId,

            action:
              'OWNER_TRANSFERRED',

            entityType:
              'workspace',

            entityId:
              data.workspaceId,

            oldValue: {
              ownerId:
                data.currentOwnerId,
            },

            newValue: {
              ownerId:
                newOwnerMembership.userId,

              newOwnerMemberId:
                data.newOwnerMemberId,
            },
          });

        return {
          workspace:
            updatedWorkspace,

          newOwnerMembership:
            promotedMember,
        };
      }
    );
  };

export const getWorkspaceByIdFromDb =
  async (
    workspaceId: string
  ) => {
    const [workspace] =
      await db
        .select({
          id: workspaces.id,
          name: workspaces.name,
          slug: workspaces.slug,
          ownerId:
            workspaces.ownerId,
          createdAt:
            workspaces.createdAt,
          updatedAt:
            workspaces.updatedAt,
        })
        .from(workspaces)
        .where(
          eq(
            workspaces.id,
            workspaceId
          )
        )
        .limit(1);

    if (!workspace) {
      throw notFound(
        'Workspace not found'
      );
    }

    return workspace;
  };

export const updateWorkspaceInDb =
  async (data: {
    workspaceId: string;
    actorId: string;
    name: string;
  }) => {
    return await db.transaction(
      async (tx) => {
        const [existingWorkspace] =
          await tx
            .select()
            .from(workspaces)
            .where(
              eq(
                workspaces.id,
                data.workspaceId
              )
            )
            .limit(1);

        if (!existingWorkspace) {
          throw notFound(
            'Workspace not found'
          );
        }

        const [updatedWorkspace] =
          await tx
            .update(workspaces)
            .set({
              name: data.name,
              updatedAt:
                new Date(),
            })
            .where(
              eq(
                workspaces.id,
                data.workspaceId
              )
            )
            .returning();

        if (!updatedWorkspace) {
          throw internalError(
            'Failed to update workspace'
          );
        }

        await tx
          .insert(auditLogs)
          .values({
            workspaceId:
              data.workspaceId,

            actorId:
              data.actorId,

            action:
              'WORKSPACE_UPDATED',

            entityType:
              'workspace',

            entityId:
              updatedWorkspace.id,

            oldValue: {
              name:
                existingWorkspace.name,
            },

            newValue: {
              name:
                updatedWorkspace.name,
            },
          });

        return updatedWorkspace;
      }
    );
  };

export const deleteWorkspaceFromDb =
  async (data: {
    workspaceId: string;
    actorId: string;
    confirmationName: string;
  }) => {
    const [existingWorkspace] =
      await db
        .select()
        .from(workspaces)
        .where(
          eq(
            workspaces.id,
            data.workspaceId
          )
        )
        .limit(1);

    if (!existingWorkspace) {
      throw notFound(
        'Workspace not found'
      );
    }

    if (
      existingWorkspace.ownerId !==
      data.actorId
    ) {
      throw forbidden(
        'Only the workspace owner can delete this workspace'
      );
    }

    if (
      existingWorkspace.name !==
      data.confirmationName
    ) {
      throw badRequest(
        'Workspace name confirmation does not match'
      );
    }

    const [deletedWorkspace] =
      await db
        .delete(workspaces)
        .where(
          and(
            eq(
              workspaces.id,
              data.workspaceId
            ),

            eq(
              workspaces.ownerId,
              data.actorId
            ),

            eq(
              workspaces.name,
              data.confirmationName
            )
          )
        )
        .returning();

    if (!deletedWorkspace) {
      throw conflict(
        'Workspace changed before it could be deleted'
      );
    }

    return deletedWorkspace;
  };