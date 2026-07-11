import { Router } from 'express';

import { requireAuth } from '../middlewares/auth.middleware.js';

import {
  requireWorkspaceContributor,
  requireWorkspaceManager,
  requireWorkspaceMember,
} from '../middlewares/rbac.middleware.js';

import { validate } from '../middlewares/validate.middleware.js';

import {
  createLabelSchema,
  labelParamsSchema,
  updateLabelSchema,
  getWorkspaceLabelsSchema,
} from '../schemas/label.schema.js';

import {
  createLabelHandler,
  deleteLabelHandler,
  getWorkspaceLabelsHandler,
  updateLabelHandler,
} from '../controllers/label.controller.js';

const router = Router({ mergeParams: true });

router.get(
  '/',
  requireAuth,
  requireWorkspaceMember,
  validate(getWorkspaceLabelsSchema),
  getWorkspaceLabelsHandler
);

router.post(
  '/',
  requireAuth,
  requireWorkspaceContributor,
  validate(createLabelSchema),
  createLabelHandler
);

router.patch(
  '/:labelId',
  requireAuth,
  requireWorkspaceContributor,
  validate(updateLabelSchema),
  updateLabelHandler
);

router.delete(
  '/:labelId',
  requireAuth,
  requireWorkspaceManager,
  validate(labelParamsSchema),
  deleteLabelHandler
);

export default router;