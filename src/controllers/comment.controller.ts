import { Request, Response, NextFunction } from 'express';
import { createCommentInDb, getTaskCommentsFromDb, deleteCommentFromDb } from '../services/comment.service.js';
import { CreateCommentInput, CommentParams, DeleteCommentParams } from '../schemas/comment.schema.js';
import { getIO } from '../socket.js';

export const createCommentHandler = async (
    req: Request<CommentParams, {}, CreateCommentInput>,
    res: Response,
    next: NextFunction
) => {
    try {
        const { workspaceId, taskId } = req.params;
        const userId = res.locals.userId;

        const newComment = await createCommentInDb({
            workspaceId,
            taskId,
            userId,
            content: req.body.content
        });

        // Broadcast to everyone in the workspace room
        const io = getIO();
        io.to(workspaceId).emit('comment_created', {
            taskId,
            comment: newComment
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
    req: Request<CommentParams>,
    res: Response,
    next: NextFunction
) => {
    try {
        const { taskId } = req.params;
        const taskComments = await getTaskCommentsFromDb(taskId);

        res.status(200).json({
            success: true,
            message: 'Comments retrieved successfully',
            data: taskComments,
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
        const { workspaceId, taskId, commentId } = req.params;
        const userId = res.locals.userId;

        const deletedComment = await deleteCommentFromDb(commentId, userId);

        if (!deletedComment) {
            return res.status(403).json({ 
                success: false, 
                message: 'Comment not found or you lack permission to delete it' 
            });
        }

        const io = getIO();
        io.to(workspaceId).emit('comment_deleted', {
            taskId,
            commentId
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