import { Router } from 'express';

import { requireAuth } from '../middlewares/auth.middleware.js';

import {
  requireWorkspaceMember,
  requireWorkspaceContributor,
} from '../middlewares/rbac.middleware.js';

import { validate } from '../middlewares/validate.middleware.js';

import {
  createCommentSchema,
  deleteCommentSchema,
  getCommentsSchema,
  updateCommentSchema,
} from '../schemas/comment.schema.js';

import {
  createCommentHandler,
  deleteCommentHandler,
  getTaskCommentsHandler,
  updateCommentHandler,
} from '../controllers/comment.controller.js';

const router = Router({ mergeParams: true });

router.post(
  '/',
  requireAuth,
  requireWorkspaceContributor,
  validate(createCommentSchema),
  createCommentHandler
);

router.get(
  '/',
  requireAuth,
  requireWorkspaceMember,
  validate(getCommentsSchema),
  getTaskCommentsHandler
);

router.patch(
  '/:commentId',
  requireAuth,
  requireWorkspaceMember,
  validate(updateCommentSchema),
  updateCommentHandler
);

router.delete(
  '/:commentId',
  requireAuth,
  requireWorkspaceMember,
  validate(deleteCommentSchema),
  deleteCommentHandler
);

export default router;