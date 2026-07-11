import { Router } from 'express';

import { requireAuth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';

import { inviteTokenSchema } from '../schemas/invite.schema.js';

import {
  acceptWorkspaceInviteHandler,
  declineWorkspaceInviteHandler,
} from '../controllers/invite.controller.js';

const router = Router();

router.post(
  '/:token/accept',
  requireAuth,
  validate(inviteTokenSchema),
  acceptWorkspaceInviteHandler
);

router.post(
  '/:token/decline',
  requireAuth,
  validate(inviteTokenSchema),
  declineWorkspaceInviteHandler
);

export default router;