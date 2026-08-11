import { workspaceParams, projectParams, taskParams, wId } from '../shared.params.js';
import { Router } from 'express';
import { z } from 'zod';

import {
  requireWorkspaceContributor,
  requireWorkspaceManager,
  requireWorkspaceMember,
} from '../../middlewares/rbac.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { emitWorkspaceEvent } from '../../utils/socketEvents.js';
import {
  createLabel,
  deleteLabel,
  getTaskLabels,
  getWorkspaceLabels,
  replaceTaskLabels,
  updateLabel,
} from './service.js';

const workspaceId = z.uuid();
const labelId = z.uuid();
const color = z.string().regex(/^#[0-9A-Fa-f]{6}$/);
const paging = z.object({ page: z.string().optional(), limit: z.string().optional() });
export const createLabelSchema = z.object({
  params: z.object({ workspaceId }),
  body: z.object({ name: z.string().trim().min(1).max(50), color: color.optional() }),
});
export const updateLabelSchema = z.object({
  params: z.object({ workspaceId, labelId }),
  body: z
    .object({
      name: z.string().trim().min(1).max(50).optional(),
      color: color.optional(),
    })
    .refine((value) => Object.keys(value).length > 0),
});
export const labelParamsSchema = z.object({ params: z.object({ workspaceId, labelId }) });
export const getWorkspaceLabelsSchema = z.object({
  params: z.object({ workspaceId }),
  query: paging,
});

export const taskLabelsListSchema = z.object({ params: taskParams, query: paging });
export const replaceTaskLabelsSchema = z.object({
  params: taskParams,
  body: z.object({ labelIds: z.array(labelId).max(100) }),
});

const router = Router({ mergeParams: true });
router.get(
  '/',
  requireWorkspaceMember,
  validate(getWorkspaceLabelsSchema),
  async (req, res) => {
    res.json({
      data: await getWorkspaceLabels({
        workspaceId: String(req.params.workspaceId),
        page: req.query.page as string | undefined,
        limit: req.query.limit as string | undefined,
      }),
    });
  }
);
router.post(
  '/',
  requireWorkspaceContributor,
  validate(createLabelSchema),
  async (req, res) => {
    const label = await createLabel({
      workspaceId: String(req.params.workspaceId),
      actorId: res.locals.userId,
      name: req.body.name,
      color: req.body.color,
    });
    emitWorkspaceEvent(String(req.params.workspaceId), 'label_created', {
      labelId: label.id,
    });
    res.status(201).json({ data: label });
  }
);
router.patch(
  '/:labelId',
  requireWorkspaceContributor,
  validate(updateLabelSchema),
  async (req, res) => {
    const label = await updateLabel({
      workspaceId: String(req.params.workspaceId),
      labelId: String(req.params.labelId),
      actorId: res.locals.userId,
      ...req.body,
    });
    emitWorkspaceEvent(String(req.params.workspaceId), 'label_updated', {
      labelId: label.id,
    });
    res.json({ data: label });
  }
);
router.delete(
  '/:labelId',
  requireWorkspaceManager,
  validate(labelParamsSchema),
  async (req, res) => {
    const label = await deleteLabel({
      workspaceId: String(req.params.workspaceId),
      labelId: String(req.params.labelId),
      actorId: res.locals.userId,
    });
    emitWorkspaceEvent(String(req.params.workspaceId), 'label_deleted', {
      labelId: label.id,
    });
    res.json({ data: label });
  }
);

export const taskLabelRouter = Router({ mergeParams: true });
taskLabelRouter.get(
  '/',
  requireWorkspaceMember,
  validate(taskLabelsListSchema),
  async (req, res) => {
    res.json({
      data: await getTaskLabels({
        workspaceId: String(req.params.workspaceId),
        projectId: String(req.params.projectId),
        taskId: String(req.params.taskId),
        page: req.query.page as string | undefined,
        limit: req.query.limit as string | undefined,
      }),
    });
  }
);
taskLabelRouter.put(
  '/',
  requireWorkspaceContributor,
  validate(replaceTaskLabelsSchema),
  async (req, res) => {
    const labels = await replaceTaskLabels({
      workspaceId: String(req.params.workspaceId),
      projectId: String(req.params.projectId),
      taskId: String(req.params.taskId),
      labelIds: req.body.labelIds,
      actorId: res.locals.userId,
    });
    emitWorkspaceEvent(String(req.params.workspaceId), 'workspace:changed', {
      resource: 'task-labels',
      action: 'replaced',
      taskId: String(req.params.taskId),
    });
    res.json({ data: labels });
  }
);

export default router;
