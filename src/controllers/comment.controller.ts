import { Request, Response, NextFunction } from 'express';

import {
  createCommentInDb,
  deleteCommentFromDb,
  getTaskCommentsFromDb,
  updateCommentInDb,
} from '../services/comment.service.js';

import {
  CommentListQuery,
  CreateCommentInput,
  CommentParams,
  DeleteCommentParams,
  UpdateCommentInput,
  UpdateCommentParams,
} from '../schemas/comment.schema.js';

import { emitWorkspaceEvent } from '../utils/socketEvents.js';

export const createCommentHandler = async (
  req: Request<CommentParams, {}, CreateCommentInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { workspaceId, projectId, taskId } = req.params;
    const userId = res.locals.userId as string;

    const newComment = await createCommentInDb({
      workspaceId,
      projectId,
      taskId,
      userId,
      content: req.body.content,
    });

    emitWorkspaceEvent(workspaceId, 'comment_created', {
      workspaceId,
      projectId,
      taskId,
      comment: newComment,
    });

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: newComment,
    });
  } catch (error) {
    next(error);
  }
};

export const getTaskCommentsHandler = async (
  req: Request<CommentParams, {}, {}, CommentListQuery>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { workspaceId, projectId, taskId } = req.params;

    const taskComments = await getTaskCommentsFromDb({
      workspaceId,
      projectId,
      taskId,
      page: req.query.page,
      limit: req.query.limit,
    });

    res.status(200).json({
      success: true,
      message: 'Comments retrieved successfully',
      data: taskComments,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCommentHandler = async (
  req: Request<UpdateCommentParams, {}, UpdateCommentInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { workspaceId, projectId, taskId, commentId } = req.params;
    const actorId = res.locals.userId as string;

    const updatedComment = await updateCommentInDb({
      workspaceId,
      projectId,
      taskId,
      commentId,
      actorId,
      content: req.body.content,
    });

    emitWorkspaceEvent(workspaceId, 'comment_updated', {
      workspaceId,
      projectId,
      taskId,
      commentId,
      comment: updatedComment,
    });

    res.status(200).json({
      success: true,
      message: 'Comment updated successfully',
      data: updatedComment,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCommentHandler = async (
  req: Request<DeleteCommentParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { workspaceId, projectId, taskId, commentId } = req.params;
    const actorId = res.locals.userId as string;

    const deletedComment = await deleteCommentFromDb({
      workspaceId,
      projectId,
      taskId,
      commentId,
      actorId,
    });

    emitWorkspaceEvent(workspaceId, 'comment_deleted', {
      workspaceId,
      projectId,
      taskId,
      commentId,
      comment: deletedComment,
    });

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
      data: deletedComment,
    });
  } catch (error) {
    next(error);
  }
};