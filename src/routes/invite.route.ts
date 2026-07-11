import { Router } from 'express';

import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireWorkspaceAdmin } from '../middlewares/rbac.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';

import {
  createWorkspaceInviteSchema,
  inviteParamsSchema,
  getWorkspaceInvitesSchema,
} from '../schemas/invite.schema.js';

import { inviteCreationRateLimiter } from '../middlewares/rateLimit.middleware.js';

import {
  createWorkspaceInviteHandler,
  deleteWorkspaceInviteHandler,
  getWorkspaceInvitesHandler,
} from '../controllers/invite.controller.js';

const router = Router({ mergeParams: true });

router.get(
  '/',
  requireAuth,
  requireWorkspaceAdmin,
  validate(getWorkspaceInvitesSchema),
  getWorkspaceInvitesHandler
);

router.post(
  '/',
  requireAuth,
  requireWorkspaceAdmin,
  inviteCreationRateLimiter,
  validate(createWorkspaceInviteSchema),
  createWorkspaceInviteHandler
);

router.delete(
  '/:inviteId',
  requireAuth,
  requireWorkspaceAdmin,
  validate(inviteParamsSchema),
  deleteWorkspaceInviteHandler
);

export default router;