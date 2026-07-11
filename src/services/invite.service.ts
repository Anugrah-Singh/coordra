import { createHash, randomBytes } from 'node:crypto';

import {
  and,
  desc,
  eq,
  gt,
  lte,
} from 'drizzle-orm';

import { db } from '../db/index.js';
import { auditLogs } from '../db/schema/auditLogs.js';
import { workspaceInvites } from '../db/schema/invites.js';
import { notifications } from '../db/schema/notifications.js';
import { users } from '../db/schema/users.js';
import { workspaceMembers } from '../db/schema/workspaces.js';
import { getPagination } from '../utils/pagination.js';

type AssignableInviteRole = 'ADMIN' | 'MANAGER' | 'MEMBER' | 'VIEWER';

const INVITE_EXPIRY_DAYS = 7;

const createHttpError = (message: string, status: number) => {
  return Object.assign(new Error(message), {
    status,
    statusCode: status,
  });
};

const createInviteToken = () => randomBytes(32).toString('hex');

const hashInviteToken = (token: string) =>
  createHash('sha256').update(token).digest('hex');

const getInviteExpiryDate = () => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);
  return expiresAt;
};

const markInviteExpiredIfNeeded = async (
  tokenHash: string,
  checkedAt: Date
): Promise<boolean> => {
  const [expiredInvite] = await db
    .update(workspaceInvites)
    .set({
      status: 'EXPIRED',
    })
    .where(
      and(
        eq(workspaceInvites.tokenHash, tokenHash),
        eq(workspaceInvites.status, 'PENDING'),
        lte(workspaceInvites.expiresAt, checkedAt)
      )
    )
    .returning({
      id: workspaceInvites.id,
    });

  return expiredInvite !== undefined;
};

export const getWorkspaceInvitesFromDb = async (data: {
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
      id: workspaceInvites.id,
      workspaceId: workspaceInvites.workspaceId,
      email: workspaceInvites.email,
      role: workspaceInvites.role,
      invitedById: workspaceInvites.invitedById,
      status: workspaceInvites.status,
      expiresAt: workspaceInvites.expiresAt,
      acceptedAt: workspaceInvites.acceptedAt,
      declinedAt: workspaceInvites.declinedAt,
      createdAt: workspaceInvites.createdAt,
    })
    .from(workspaceInvites)
    .where(eq(workspaceInvites.workspaceId, data.workspaceId))
    .orderBy(
      desc(workspaceInvites.createdAt),
      desc(workspaceInvites.id)
    )
    .limit(pagination.limit)
    .offset(pagination.offset);
};

export const createWorkspaceInviteInDb = async (data: {
  workspaceId: string;
  invitedById: string;
  email: string;
  role: AssignableInviteRole;
}) => {
  return await db.transaction(async (tx) => {
    const normalizedEmail = data.email.toLowerCase();

    const [existingPendingInvite] = await tx
      .select()
      .from(workspaceInvites)
      .where(
        and(
          eq(workspaceInvites.workspaceId, data.workspaceId),
          eq(workspaceInvites.email, normalizedEmail),
          eq(workspaceInvites.status, 'PENDING')
        )
      )
      .limit(1);

    if (
      existingPendingInvite &&
      existingPendingInvite.expiresAt.getTime() > Date.now()
    ) {
      throw createHttpError('A pending invite already exists for this email', 409);
    }

    const [targetUser] = await tx
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (targetUser) {
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

      if (existingMembership && existingMembership.removedAt === null) {
        throw createHttpError('User is already an active workspace member', 409);
      }
    }

    const rawToken = createInviteToken();
    const tokenHash = hashInviteToken(rawToken);

    const [invite] = await tx
      .insert(workspaceInvites)
      .values({
        workspaceId: data.workspaceId,
        email: normalizedEmail,
        role: data.role,
        tokenHash,
        invitedById: data.invitedById,
        expiresAt: getInviteExpiryDate(),
      })
      .returning();

    if (!invite) {
      throw createHttpError('Failed to create workspace invite', 500);
    }

    await tx.insert(auditLogs).values({
      workspaceId: data.workspaceId,
      actorId: data.invitedById,
      action: 'WORKSPACE_INVITE_CREATED',
      entityType: 'workspace_invite',
      entityId: invite.id,
      oldValue: null,
      newValue: {
        email: invite.email,
        role: invite.role,
        status: invite.status,
        expiresAt: invite.expiresAt,
      },
    });

    let createdNotification: typeof notifications.$inferSelect | null = null;

    if (targetUser) {
      const [notification] = await tx
        .insert(notifications)
        .values({
          workspaceId: data.workspaceId,
          userId: targetUser.id,
          type: 'MEMBER_INVITED',
          message: `You were invited to join a workspace as ${invite.role}`,
          resourceType: 'workspace_invite',
          resourceId: invite.id,
        })
        .returning();

      createdNotification = notification ?? null;
    }

    return {
      invite,
      rawToken,
      notification: createdNotification,
    };
  });
};

export const deleteWorkspaceInviteInDb = async (data: {
  workspaceId: string;
  inviteId: string;
  actorId: string;
}) => {
  return await db.transaction(async (tx) => {
    const [existingInvite] = await tx
      .select()
      .from(workspaceInvites)
      .where(
        and(
          eq(workspaceInvites.id, data.inviteId),
          eq(workspaceInvites.workspaceId, data.workspaceId)
        )
      )
      .limit(1);

    if (!existingInvite) {
      throw createHttpError('Invite not found', 404);
    }

    const [deletedInvite] = await tx
      .delete(workspaceInvites)
      .where(
        and(
          eq(workspaceInvites.id, data.inviteId),
          eq(workspaceInvites.workspaceId, data.workspaceId)
        )
      )
      .returning();

    if (!deletedInvite) {
      throw createHttpError('Failed to delete invite', 500);
    }

    await tx.insert(auditLogs).values({
      workspaceId: data.workspaceId,
      actorId: data.actorId,
      action: 'WORKSPACE_INVITE_DELETED',
      entityType: 'workspace_invite',
      entityId: deletedInvite.id,
      oldValue: {
        email: existingInvite.email,
        role: existingInvite.role,
        status: existingInvite.status,
      },
      newValue: null,
    });

    return deletedInvite;
  });
};

export const acceptWorkspaceInviteInDb = async (data: {
  token: string;
  actorId: string;
}) => {
  const tokenHash = hashInviteToken(data.token);
  const checkedAt = new Date();

  const inviteWasExpired =
    await markInviteExpiredIfNeeded(
      tokenHash,
      checkedAt
    );

  if (inviteWasExpired) {
    throw createHttpError('Invite has expired', 400);
  }

  return await db.transaction(async (tx) => {

    const [invite] = await tx
      .select()
      .from(workspaceInvites)
      .where(eq(workspaceInvites.tokenHash, tokenHash))
      .limit(1);

    if (!invite) {
      throw createHttpError('Invite not found', 404);
    }

    if (invite.status !== 'PENDING') {
      throw createHttpError(`Invite is already ${invite.status.toLowerCase()}`, 400);
    }

    const [actor] = await tx
      .select()
      .from(users)
      .where(eq(users.id, data.actorId))
      .limit(1);

    if (!actor) {
      throw createHttpError('User not found', 404);
    }

    if (actor.email.toLowerCase() !== invite.email.toLowerCase()) {
      throw createHttpError('This invite belongs to a different email address', 403);
    }

    const now = new Date();

    const [updatedInvite] = await tx
      .update(workspaceInvites)
      .set({
        status: 'ACCEPTED',
        acceptedAt: now,
      })
      .where(
        and(
          eq(workspaceInvites.id, invite.id),
          eq(workspaceInvites.status, 'PENDING'),
          gt(workspaceInvites.expiresAt, checkedAt)
        )
      )
      .returning();

    if (!updatedInvite) {
      throw createHttpError(
        'Invite state changed before it could be accepted',
        409
      );
    }

    const [existingMembership] = await tx
      .select()
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, invite.workspaceId),
          eq(workspaceMembers.userId, actor.id)
        )
      )
      .limit(1);

    let membership: typeof workspaceMembers.$inferSelect;

    if (existingMembership && existingMembership.removedAt === null) {
      membership = existingMembership;
    } else if (existingMembership && existingMembership.removedAt !== null) {
      const [reactivatedMembership] = await tx
        .update(workspaceMembers)
        .set({
          role: invite.role,
          removedAt: null,
          joinedAt: now,
        })
        .where(eq(workspaceMembers.id, existingMembership.id))
        .returning();

      if (!reactivatedMembership) {
        throw createHttpError('Failed to reactivate workspace membership', 500);
      }

      membership = reactivatedMembership;
    } else {
      const [newMembership] = await tx
        .insert(workspaceMembers)
        .values({
          workspaceId: invite.workspaceId,
          userId: actor.id,
          role: invite.role,
          joinedAt: now,
        })
        .returning();

      if (!newMembership) {
        throw createHttpError('Failed to create workspace membership', 500);
      }

      membership = newMembership;
    }

    await tx.insert(auditLogs).values({
      workspaceId: invite.workspaceId,
      actorId: actor.id,
      action: 'WORKSPACE_INVITE_ACCEPTED',
      entityType: 'workspace_invite',
      entityId: invite.id,
      oldValue: {
        status: invite.status,
      },
      newValue: {
        status: updatedInvite.status,
        acceptedAt: updatedInvite.acceptedAt,
        membershipId: membership.id,
        role: membership.role,
      },
    });

    return {
      invite: updatedInvite,
      membership,
      user: actor,
    };
  });
};

export const declineWorkspaceInviteInDb = async (data: {
  token: string;
  actorId: string;
}) => {
  const tokenHash = hashInviteToken(data.token);
  const checkedAt = new Date();

  const inviteWasExpired =
    await markInviteExpiredIfNeeded(
      tokenHash,
      checkedAt
    );

  if (inviteWasExpired) {
    throw createHttpError('Invite has expired', 400);
  }

  return await db.transaction(async (tx) => {

    const [invite] = await tx
      .select()
      .from(workspaceInvites)
      .where(eq(workspaceInvites.tokenHash, tokenHash))
      .limit(1);

    if (!invite) {
      throw createHttpError('Invite not found', 404);
    }

    if (invite.status !== 'PENDING') {
      throw createHttpError(`Invite is already ${invite.status.toLowerCase()}`, 400);
    }

    const [actor] = await tx
      .select()
      .from(users)
      .where(eq(users.id, data.actorId))
      .limit(1);

    if (!actor) {
      throw createHttpError('User not found', 404);
    }

    if (actor.email.toLowerCase() !== invite.email.toLowerCase()) {
      throw createHttpError('This invite belongs to a different email address', 403);
    }

    const [declinedInvite] = await tx
      .update(workspaceInvites)
      .set({
        status: 'DECLINED',
        declinedAt: new Date(),
      })
      .where(
        and(
          eq(workspaceInvites.id, invite.id),
          eq(workspaceInvites.status, 'PENDING'),
          gt(workspaceInvites.expiresAt, checkedAt)
        )
      )
      .returning();

    if (!declinedInvite) {
      throw createHttpError(
        'Invite state changed before it could be declined',
        409
      );
    }

    await tx.insert(auditLogs).values({
      workspaceId: invite.workspaceId,
      actorId: actor.id,
      action: 'WORKSPACE_INVITE_DECLINED',
      entityType: 'workspace_invite',
      entityId: invite.id,
      oldValue: {
        status: invite.status,
      },
      newValue: {
        status: declinedInvite.status,
        declinedAt: declinedInvite.declinedAt,
      },
    });

    return {
      invite: declinedInvite,
      user: actor,
    };
  });
};