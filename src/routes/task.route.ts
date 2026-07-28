import { Router } from 'express';

import taskLabelRoutes from './taskLabel.route.js';

import { requireAuth } from '../middlewares/auth.middleware.js';

import {
  requireWorkspaceMember,
  requireWorkspaceContributor,
} from '../middlewares/rbac.middleware.js';

import { validate } from '../middlewares/validate.middleware.js';

import {
  assignTaskSchema,
  createTaskSchema,
  getTasksSchema,
  taskParamsSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
} from '../schemas/task.schema.js';

import {
  archiveTaskHandler,
  assignTaskHandler,
  createTaskHandler,
  duplicateTaskHandler,
  getProjectTasksHandler,
  getTaskByIdHandler,
  unarchiveTaskHandler,
  updateTaskHandler,
  updateTaskStatusHandler,
} from '../controllers/task.controller.js';

import commentRoutes from './comment.route.js';

const router = Router({ mergeParams: true });

router.post(
  '/',
  requireAuth,
  requireWorkspaceContributor,
  validate(createTaskSchema),
  createTaskHandler
);

router.get(
  '/',
  requireAuth,
  requireWorkspaceMember,
  validate(getTasksSchema),
  getProjectTasksHandler
);

router.get(
  '/:taskId',
  requireAuth,
  requireWorkspaceMember,
  validate(taskParamsSchema),
  getTaskByIdHandler
);

router.patch(
  '/:taskId',
  requireAuth,
  requireWorkspaceContributor,
  validate(updateTaskSchema),
  updateTaskHandler
);

router.patch(
  '/:taskId/status',
  requireAuth,
  requireWorkspaceContributor,
  validate(updateTaskStatusSchema),
  updateTaskStatusHandler
);

router.patch(
  '/:taskId/assign',
  requireAuth,
  requireWorkspaceContributor,
  validate(assignTaskSchema),
  assignTaskHandler
);

router.patch(
  '/:taskId/archive',
  requireAuth,
  requireWorkspaceContributor,
  validate(taskParamsSchema),
  archiveTaskHandler
);

router.patch(
  '/:taskId/unarchive',
  requireAuth,
  requireWorkspaceContributor,
  validate(taskParamsSchema),
  unarchiveTaskHandler
);

router.post(
  '/:taskId/duplicate',
  requireAuth,
  requireWorkspaceContributor,
  validate(taskParamsSchema),
  duplicateTaskHandler
);

router.use('/:taskId/labels', taskLabelRoutes);

router.use('/:taskId/comments', commentRoutes);

export default router;
