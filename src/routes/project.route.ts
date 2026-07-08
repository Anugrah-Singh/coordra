import { Router } from 'express';

import { requireAuth } from '../middlewares/auth.middleware.js';

import {
  requireWorkspaceMember,
  requireWorkspaceContributor,
} from '../middlewares/rbac.middleware.js';

import { validate } from '../middlewares/validate.middleware.js';
import { createProjectSchema } from '../schemas/project.schema.js';

import {
  createProjectHandler,
  getWorkspaceProjectsHandler,
} from '../controllers/project.controller.js';

import taskRoutes from './task.route.js';

const router = Router({ mergeParams: true });

router.post(
  '/',
  requireAuth,
  requireWorkspaceContributor,
  validate(createProjectSchema),
  createProjectHandler
);

router.get(
  '/',
  requireAuth,
  requireWorkspaceMember,
  getWorkspaceProjectsHandler
);

router.use('/:projectId/tasks', taskRoutes);

export default router;
