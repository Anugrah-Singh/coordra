import { and, desc, eq } from 'drizzle-orm';

import { db } from '../../db/index.js';
import { auditLogs } from '../../db/schema/auditLogs.js';
import { users } from '../../db/schema/users.js';
import { workspaceMembers } from '../../db/schema/workspaces.js';
import { getPagination } from '../../utils/pagination.js';

type AssignableWorkspaceRole = 'ADMIN' | 'MANAGER' | 'MEMBER' | 'VIEWER';

const createHttpError = (message: string, status: number) => {
  return Object.assign(new Error(message), {
    status,
    statusCode: status,
  });
};

export const getWorkspaceMembers = async (data: {
  workspaceId: string;
  page?: string | undefined;
  limit?: string | undefined;
}) => {
  const pagination = getPagination({
    page: data.page,
    limit: data.limit,
  });

  return await db
    .select({
      membershipId: workspaceMembers.id,
      userId: users.id,
      fullName: users.fullName,
      email: users.email,
      role: workspaceMembers.role,
      joinedAt: workspaceMembers.joinedAt,
    })
    .from(workspaceMembers)
    .innerJoin(users, eq(workspaceMembers.userId, users.id))
    .where(eq(workspaceMembers.workspaceId, data.workspaceId))
    .orderBy(desc(workspaceMembers.joinedAt), desc(workspaceMembers.id))
    .limit(pagination.limit)
    .offset(pagination.offset);
};

export const addWorkspaceMemberByEmail = async (data: {
  workspaceId: string;
  actorId: string;
  email: string;
  role: AssignableWorkspaceRole;
}) => {
  return await db.transaction(async (tx) => {
    const [targetUser] = await tx
      .select()
      .from(users)
      .where(eq(users.email, data.email))
      .limit(1);

    if (!targetUser) {
      throw createHttpError('User not found in the system', 404);
    }

    const [existingMembership] = await tx
      .select()
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, data.workspaceId),
          eq(workspaceMembers.userId, targetUser.id)
        )
      )
      .limit(1);

    if (existingMembership) {
      throw createHttpError('User is already an active member of this workspace', 409);
    }

    const [newMember] = await tx
      .insert(workspaceMembers)
      .values({
        workspaceId: data.workspaceId,
        userId: targetUser.id,
        role: data.role,
      })
      .returning();

    if (!newMember) {
      throw createHttpError('Failed to add workspace member', 500);
    }

    await tx.insert(auditLogs).values({
      workspaceId: data.workspaceId,
      actorId: data.actorId,
      action: 'MEMBER_ADDED',
      entityType: 'workspace_member',
      entityId: newMember.id,
      oldValue: null,
      newValue: {
        userId: targetUser.id,
        role: newMember.role,
      },
    });

    return {
      membership: newMember,
      user: targetUser,
    };
  });
};

export const updateWorkspaceMemberRole = async (data: {
  workspaceId: string;
  actorId: string;
  memberId: string;
  role: AssignableWorkspaceRole;
}) => {
  return await db.transaction(async (tx) => {
    const [targetMember] = await tx
      .select()
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.id, data.memberId),
          eq(workspaceMembers.workspaceId, data.workspaceId)
        )
      )
      .limit(1);

    if (!targetMember) {
      throw createHttpError('Member not found', 404);
    }

    if (targetMember.role === 'OWNER') {
      throw createHttpError('Owner role cannot be changed from member settings', 400);
    }

    const [updatedMember] = await tx
      .update(workspaceMembers)
      .set({
        role: data.role,
      })
      .where(eq(workspaceMembers.id, data.memberId))
      .returning();

    if (!updatedMember) {
      throw createHttpError('Failed to update member role', 500);
    }

    await tx.insert(auditLogs).values({
      workspaceId: data.workspaceId,
      actorId: data.actorId,
      action: 'MEMBER_ROLE_UPDATED',
      entityType: 'workspace_member',
      entityId: updatedMember.id,
      oldValue: {
        role: targetMember.role,
      },
      newValue: {
        role: updatedMember.role,
      },
    });

    return updatedMember;
  });
};

export const removeWorkspaceMember = async (data: {
  workspaceId: string;
  actorId: string;
  memberId: string;
}) => {
  return await db.transaction(async (tx) => {
    const [targetMember] = await tx
      .select()
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.id, data.memberId),
          eq(workspaceMembers.workspaceId, data.workspaceId)
        )
      )
      .limit(1);

    if (!targetMember) {
      throw createHttpError('Member not found', 404);
    }

    if (targetMember.role === 'OWNER') {
      throw createHttpError(
        'Workspace owner cannot be removed from member settings',
        400
      );
    }

    const [removedMember] = await tx
      .delete(workspaceMembers)
      .where(eq(workspaceMembers.id, data.memberId))
      .returning();

    if (!removedMember) {
      throw createHttpError('Failed to remove workspace member', 500);
    }

    await tx.insert(auditLogs).values({
      workspaceId: data.workspaceId,
      actorId: data.actorId,
      action: 'MEMBER_REMOVED',
      entityType: 'workspace_member',
      entityId: removedMember.id,
      oldValue: {
        userId: targetMember.userId,
        role: targetMember.role,
      },
      newValue: {
        userId: removedMember.userId,
        role: removedMember.role,
      },
    });

    return removedMember;
  });
};
