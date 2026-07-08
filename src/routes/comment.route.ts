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
} from '../schemas/comment.schema.js';

import {
  createCommentHandler,
  getTaskCommentsHandler,
  deleteCommentHandler,
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
  getTaskCommentsHandler
);

router.delete(
  '/:commentId',
  requireAuth,
  requireWorkspaceContributor,
  validate(deleteCommentSchema),
  deleteCommentHandler
);

export default router;
