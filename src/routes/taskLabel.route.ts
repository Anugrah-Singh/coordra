import { Router } from 'express';

import { requireAuth } from '../middlewares/auth.middleware.js';

import {
  requireWorkspaceContributor,
  requireWorkspaceMember,
} from '../middlewares/rbac.middleware.js';

import { validate } from '../middlewares/validate.middleware.js';

import { taskLabelParamsSchema, taskLabelsListSchema } from '../schemas/label.schema.js';

import {
  addLabelToTaskHandler,
  getTaskLabelsHandler,
  removeLabelFromTaskHandler,
} from '../controllers/label.controller.js';

const router = Router({ mergeParams: true });

router.get(
  '/',
  requireAuth,
  requireWorkspaceMember,
  validate(taskLabelsListSchema),
  getTaskLabelsHandler
);

router.post(
  '/:labelId',
  requireAuth,
  requireWorkspaceContributor,
  validate(taskLabelParamsSchema),
  addLabelToTaskHandler
);

router.delete(
  '/:labelId',
  requireAuth,
  requireWorkspaceContributor,
  validate(taskLabelParamsSchema),
  removeLabelFromTaskHandler
);

export default router;
