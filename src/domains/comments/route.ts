import { Router } from 'express';
import { z } from 'zod';

import {
  requireWorkspaceContributor,
  requireWorkspaceMember,
} from '../../middlewares/rbac.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { emitWorkspaceEvent } from '../../utils/socketEvents.js';
import {
  createComment,
  deleteComment,
  getTaskComments,
  updateComment,
} from './service.js';

const params = z.object({ workspaceId: z.uuid(), projectId: z.uuid(), taskId: z.uuid() });
const actionParams = params.extend({ commentId: z.uuid() });
const body = z.object({ content: z.string().trim().min(1, 'Comment cannot be empty') });
export const createCommentSchema = z.object({ params, body });
export const updateCommentSchema = z.object({ params: actionParams, body });
export const deleteCommentSchema = z.object({ params: actionParams });
export const getCommentsSchema = z.object({
  params,
  query: z.object({ page: z.string().optional(), limit: z.string().optional() }),
});

const router = Router({ mergeParams: true });
router.post(
  '/',
  requireWorkspaceContributor,
  validate(createCommentSchema),
  async (req, res) => {
    const comment = await createComment({
      workspaceId: String(req.params.workspaceId),
      projectId: String(req.params.projectId),
      taskId: String(req.params.taskId),
      userId: res.locals.userId,
      content: req.body.content,
    });
    emitWorkspaceEvent(String(req.params.workspaceId), 'comment_created', {
      taskId: String(req.params.taskId),
      commentId: comment.id,
    });
    res.status(201).json({ data: comment });
  }
);
router.get('/', requireWorkspaceMember, validate(getCommentsSchema), async (req, res) => {
  res.json({
    data: await getTaskComments({
      workspaceId: String(req.params.workspaceId),
      projectId: String(req.params.projectId),
      taskId: String(req.params.taskId),
      page: req.query.page as string | undefined,
      limit: req.query.limit as string | undefined,
    }),
  });
});
router.patch(
  '/:commentId',
  requireWorkspaceContributor,
  validate(updateCommentSchema),
  async (req, res) => {
    const comment = await updateComment({
      workspaceId: String(req.params.workspaceId),
      projectId: String(req.params.projectId),
      taskId: String(req.params.taskId),
      commentId: String(req.params.commentId),
      actorId: res.locals.userId,
      content: req.body.content,
    });
    emitWorkspaceEvent(String(req.params.workspaceId), 'comment_updated', {
      taskId: String(req.params.taskId),
      commentId: String(req.params.commentId),
    });
    res.json({ data: comment });
  }
);
router.delete(
  '/:commentId',
  requireWorkspaceContributor,
  validate(deleteCommentSchema),
  async (req, res) => {
    const comment = await deleteComment({
      workspaceId: String(req.params.workspaceId),
      projectId: String(req.params.projectId),
      taskId: String(req.params.taskId),
      commentId: String(req.params.commentId),
      actorId: res.locals.userId,
    });
    emitWorkspaceEvent(String(req.params.workspaceId), 'comment_deleted', {
      taskId: String(req.params.taskId),
      commentId: String(req.params.commentId),
    });
    res.json({ data: comment });
  }
);

export default router;
