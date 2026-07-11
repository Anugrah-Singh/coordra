import { Router } from 'express';

import auditLogRoutes from './auditLog.route.js';
import inviteRoutes from './invite.route.js';
import labelRoutes from './label.route.js';
import memberRoutes from './member.route.js';
import projectRoutes from './project.route.js';

import {
  createWorkspaceHandler,
  deleteWorkspaceHandler,
  getUserWorkspacesHandler,
  getWorkspaceByIdHandler,
  transferWorkspaceOwnerHandler,
  updateWorkspaceHandler,
} from '../controllers/workspace.controllers.js';

import { requireAuth } from '../middlewares/auth.middleware.js';

import {
  requireWorkspaceAdmin,
  requireWorkspaceMember,
  requireWorkspaceOwner,
} from '../middlewares/rbac.middleware.js';

import { validate } from '../middlewares/validate.middleware.js';

import {
  createWorkspaceSchema,
  deleteWorkspaceSchema,
  getWorkspaceSchema,
  transferWorkspaceOwnerSchema,
  updateWorkspaceSchema,
} from '../schemas/workspace.schema.js';

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

router.get(
  '/:workspaceId',
  requireAuth,
  requireWorkspaceMember,
  validate(getWorkspaceSchema),
  getWorkspaceByIdHandler
);

router.patch(
  '/:workspaceId',
  requireAuth,
  requireWorkspaceAdmin,
  validate(updateWorkspaceSchema),
  updateWorkspaceHandler
);

router.patch(
  '/:workspaceId/transfer-owner',
  requireAuth,
  requireWorkspaceOwner,
  validate(transferWorkspaceOwnerSchema),
  transferWorkspaceOwnerHandler
);

router.delete(
  '/:workspaceId',
  requireAuth,
  requireWorkspaceOwner,
  validate(deleteWorkspaceSchema),
  deleteWorkspaceHandler
);

router.use(
  '/:workspaceId/audit-logs',
  auditLogRoutes
);

router.use(
  '/:workspaceId/labels',
  labelRoutes
);

router.use(
  '/:workspaceId/invites',
  inviteRoutes
);

router.use(
  '/:workspaceId/members',
  memberRoutes
);

router.use(
  '/:workspaceId/projects',
  projectRoutes
);

export default router;