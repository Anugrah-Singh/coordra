import { Router } from 'express';
import inviteRoutes from './invite.route.js';

import labelRoutes from './label.route.js';

import {
  createWorkspaceHandler,
  getUserWorkspacesHandler,
  transferWorkspaceOwnerHandler
} from '../controllers/workspace.controllers.js';

import { requireAuth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { 
    createWorkspaceSchema, 
    transferWorkspaceOwnerSchema
} from '../schemas/workspace.schema.js';

import { 
    requireWorkspaceOwner 
} from '../middlewares/rbac.middleware.js';

import memberRoutes from './member.route.js';
import projectRoutes from './project.route.js';
import auditLogRoutes from './auditLog.route.js';

const router = Router();

router.post(
  '/',
  requireAuth,
  validate(createWorkspaceSchema),
  createWorkspaceHandler
);

router.get(
  '/',
  requireAuth,
  getUserWorkspacesHandler
);

router.patch(
  '/:workspaceId/transfer-owner',
  requireAuth,
  requireWorkspaceOwner,
  validate(transferWorkspaceOwnerSchema),
  transferWorkspaceOwnerHandler
);

router.use('/:workspaceId/audit-logs', auditLogRoutes);

router.use('/:workspaceId/labels', labelRoutes);

router.use('/:workspaceId/invites', inviteRoutes);

router.use('/:workspaceId/members', memberRoutes);

router.use('/:workspaceId/projects', projectRoutes);

export default router;
