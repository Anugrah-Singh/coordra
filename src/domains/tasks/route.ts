import { workspaceParams, projectParams, taskParams, wId } from '../shared.params.js';
import { Router } from 'express';
import { z } from 'zod';

import {
  requireWorkspaceContributor,
  requireWorkspaceMember,
} from '../../middlewares/rbac.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { emitUserEvent, emitWorkspaceEvent } from '../../utils/socketEvents.js';
import commentRoutes from '../comments/route.js';
import { taskLabelRouter as taskLabelRoutes } from '../labels/route.js';
import {
  createTask,
  duplicateTask,
  getProjectTasks,
  getTaskById,
  updateTask,
} from './service.js';

const status = z.enum(['BACKLOG', 'TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED']);
const priority = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);

const taskFields = {
  title: z.string().trim().min(1).optional(),
  description: z.string().trim().nullable().optional(),
  status: status.optional(),
  priority: priority.optional(),
  assigneeId: z.uuid().nullable().optional(),
  dueDate: z.iso.datetime().nullable().optional(),
};
export const createTaskSchema = z.object({
  params: projectParams,
  body: z.object({ ...taskFields, title: z.string().trim().min(1) }),
});
export const getTasksSchema = z.object({
  params: projectParams,
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    status: status.optional(),
    priority: priority.optional(),
    assigneeId: z.uuid().optional(),
    includeArchived: z.enum(['true', 'false']).optional(),
  }),
});
export const taskParamsSchema = z.object({ params: taskParams });
export const updateTaskSchema = z.object({
  params: taskParams,
  body: z
    .object({ ...taskFields, archived: z.boolean().optional() })
    .refine((value) => Object.keys(value).length > 0, 'At least one field is required'),
});

const router = Router({ mergeParams: true });
router.post(
  '/',
  requireWorkspaceContributor,
  validate(createTaskSchema),
  async (req, res) => {
    const task = await createTask({
      workspaceId: String(req.params.workspaceId),
      projectId: String(req.params.projectId),
      createdById: res.locals.userId,
      ...req.body,
    });
    emitWorkspaceEvent(String(req.params.workspaceId), 'task_created', {
      projectId: String(req.params.projectId),
      task,
    });
    res.status(201).json({ data: task });
  }
);
router.get('/', requireWorkspaceMember, validate(getTasksSchema), async (req, res) => {
  res.json({
    data: await getProjectTasks({
      workspaceId: String(req.params.workspaceId),
      projectId: String(req.params.projectId),
      filters: req.query,
    }),
  });
});
router.get(
  '/:taskId',
  requireWorkspaceMember,
  validate(taskParamsSchema),
  async (req, res) => {
    res.json({
      data: await getTaskById(
        String(req.params.workspaceId),
        String(req.params.projectId),
        String(req.params.taskId)
      ),
    });
  }
);
router.patch(
  '/:taskId',
  requireWorkspaceContributor,
  validate(updateTaskSchema),
  async (req, res) => {
    const result = await updateTask({
      workspaceId: String(req.params.workspaceId),
      projectId: String(req.params.projectId),
      taskId: String(req.params.taskId),
      actorId: res.locals.userId,
      ...req.body,
    });
    emitWorkspaceEvent(String(req.params.workspaceId), 'workspace:changed', {
      resource: 'task',
      action: 'updated',
      projectId: String(req.params.projectId),
      taskId: String(req.params.taskId),
    });
    if (result.notification) {
      emitUserEvent(result.notification.userId, 'notifications:changed', {
        action: 'created',
        notificationId: result.notification.id,
      });
    }
    res.json({ data: result.task });
  }
);
router.post(
  '/:taskId/duplicate',
  requireWorkspaceContributor,
  validate(taskParamsSchema),
  async (req, res) => {
    const task = await duplicateTask({
      workspaceId: String(req.params.workspaceId),
      projectId: String(req.params.projectId),
      taskId: String(req.params.taskId),
      actorId: res.locals.userId,
    });
    emitWorkspaceEvent(String(req.params.workspaceId), 'task_duplicated', {
      projectId: String(req.params.projectId),
      taskId: task.id,
    });
    res.status(201).json({ data: task });
  }
);
router.use('/:taskId/labels', taskLabelRoutes);
router.use('/:taskId/comments', commentRoutes);

export default router;
