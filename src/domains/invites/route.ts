import { Router } from 'express';
import { z } from 'zod';

import { env } from '../../config/env.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { inviteCreationRateLimiter } from '../../middlewares/rateLimit.middleware.js';
import { requireWorkspaceAdmin } from '../../middlewares/rbac.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { emitUserEvent, emitWorkspaceEvent } from '../../utils/socketEvents.js';
import {
  acceptWorkspaceInvite,
  createWorkspaceInvite,
  declineWorkspaceInvite,
  deleteWorkspaceInvite,
  getWorkspaceInvites,
} from './service.js';

const workspaceId = z.uuid('Invalid workspace ID');
const role = z.enum(['ADMIN', 'MANAGER', 'MEMBER', 'VIEWER']);
export const createWorkspaceInviteSchema = z.object({
  params: z.object({ workspaceId }),
  body: z.object({
    email: z.email('Invalid email address').trim().toLowerCase(),
    role: role.default('MEMBER'),
  }),
});
export const inviteParamsSchema = z.object({
  params: z.object({ workspaceId, inviteId: z.uuid('Invalid invite ID') }),
});
export const inviteTokenSchema = z.object({
  params: z.object({ token: z.string().min(32).max(256) }),
});
export const getWorkspaceInvitesSchema = z.object({
  params: z.object({ workspaceId }),
  query: z.object({ page: z.string().optional(), limit: z.string().optional() }),
});

const router = Router({ mergeParams: true });
router.get(
  '/',
  requireWorkspaceAdmin,
  validate(getWorkspaceInvitesSchema),
  async (req, res) => {
    res.json({
      data: await getWorkspaceInvites({
        workspaceId: String(req.params.workspaceId),
        page: req.query.page as string | undefined,
        limit: req.query.limit as string | undefined,
      }),
    });
  }
);
router.post(
  '/',
  requireWorkspaceAdmin,
  inviteCreationRateLimiter,
  validate(createWorkspaceInviteSchema),
  async (req, res) => {
    const result = await createWorkspaceInvite({
      workspaceId: String(req.params.workspaceId),
      invitedById: res.locals.userId,
      email: req.body.email,
      role: req.body.role,
    });
    emitWorkspaceEvent(String(req.params.workspaceId), 'workspace_invite_created', {
      inviteId: result.invite.id,
    });
    if (result.notification) {
      emitUserEvent(result.notification.userId, 'notification_created', {
        notificationId: result.notification.id,
      });
    }
    res.status(201).json({
      data: {
        invite: result.invite,
        ...(env.NODE_ENV === 'test'
          ? {
              token: result.rawToken,
              invitePath: `/workspace-invites/${result.rawToken}`,
            }
          : {}),
      },
    });
  }
);
router.delete(
  '/:inviteId',
  requireWorkspaceAdmin,
  validate(inviteParamsSchema),
  async (req, res) => {
    const invite = await deleteWorkspaceInvite({
      workspaceId: String(req.params.workspaceId),
      inviteId: String(req.params.inviteId),
      actorId: res.locals.userId,
    });
    emitWorkspaceEvent(String(req.params.workspaceId), 'workspace_invite_deleted', {
      inviteId: String(req.params.inviteId),
    });
    res.json({ data: invite });
  }
);

export const inviteTokenRouter = Router();
inviteTokenRouter.use(requireAuth);
inviteTokenRouter.post(
  '/:token/accept',
  validate(inviteTokenSchema),
  async (req, res) => {
    const result = await acceptWorkspaceInvite({
      token: String(req.params.token),
      actorId: res.locals.userId,
    });
    emitWorkspaceEvent(result.invite.workspaceId, 'workspace_invite_accepted', {
      inviteId: result.invite.id,
      memberId: result.membership.id,
    });
    res.json({ data: result });
  }
);
inviteTokenRouter.post(
  '/:token/decline',
  validate(inviteTokenSchema),
  async (req, res) => {
    const result = await declineWorkspaceInvite({
      token: String(req.params.token),
      actorId: res.locals.userId,
    });
    emitWorkspaceEvent(result.invite.workspaceId, 'workspace_invite_declined', {
      inviteId: result.invite.id,
    });
    res.json({ data: result });
  }
);

export default router;
