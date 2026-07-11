import { Router } from 'express';

import { requireAuth } from '../middlewares/auth.middleware.js';

import {
  requireWorkspaceMember,
  requireWorkspaceContributor,
  requireWorkspaceManager,
} from '../middlewares/rbac.middleware.js';

import { validate } from '../middlewares/validate.middleware.js';

import {
  createProjectSchema,
  getProjectsSchema,
  projectParamsSchema,
  updateProjectSchema,
} from '../schemas/project.schema.js';

import {
  createProjectHandler,
  deleteProjectHandler,
  getProjectByIdHandler,
  getWorkspaceProjectsHandler,
  updateProjectHandler,
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
  validate(getProjectsSchema),
  getWorkspaceProjectsHandler
);

router.get(
  '/:projectId',
  requireAuth,
  requireWorkspaceMember,
  validate(projectParamsSchema),
  getProjectByIdHandler
);

router.patch(
  '/:projectId',
  requireAuth,
  requireWorkspaceContributor,
  validate(updateProjectSchema),
  updateProjectHandler
);

router.delete(
  '/:projectId',
  requireAuth,
  requireWorkspaceManager,
  validate(projectParamsSchema),
  deleteProjectHandler
);

router.use('/:projectId/tasks', taskRoutes);

export default router;