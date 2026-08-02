import { Router } from 'express';
import { z } from 'zod';

import {
  requireWorkspaceContributor,
  requireWorkspaceManager,
  requireWorkspaceMember,
} from '../../middlewares/rbac.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { emitWorkspaceEvent } from '../../utils/socketEvents.js';
import taskRoutes from '../tasks/route.js';
import {
  createProject,
  deleteProject,
  getProjectById,
  getWorkspaceProjects,
  updateProject,
} from './service.js';

const workspaceId = z.uuid('Invalid workspace ID');
const projectId = z.uuid('Invalid project ID');
const name = z.string().trim().min(1).max(100);
const description = z.string().trim().max(500).nullable().optional();
export const createProjectSchema = z.object({
  params: z.object({ workspaceId }),
  body: z.object({ name, description }),
});
export const projectParamsSchema = z.object({
  params: z.object({ workspaceId, projectId }),
});
export const updateProjectSchema = z.object({
  params: z.object({ workspaceId, projectId }),
  body: z
    .object({ name: name.optional(), description })
    .refine((value) => Object.keys(value).length > 0, 'At least one field is required'),
});
export const getProjectsSchema = z.object({
  params: z.object({ workspaceId }),
  query: z.object({ page: z.string().optional(), limit: z.string().optional() }),
});

const router = Router({ mergeParams: true });
router.post(
  '/',
  requireWorkspaceContributor,
  validate(createProjectSchema),
  async (req, res) => {
    const project = await createProject({
      workspaceId: String(req.params.workspaceId),
      actorId: res.locals.userId,
      name: req.body.name,
      description: req.body.description ?? null,
    });
    emitWorkspaceEvent(String(req.params.workspaceId), 'project_created', {
      projectId: project.id,
    });
    res.status(201).json({ data: project });
  }
);
router.get('/', requireWorkspaceMember, validate(getProjectsSchema), async (req, res) => {
  res.json({
    data: await getWorkspaceProjects({
      workspaceId: String(req.params.workspaceId),
      page: req.query.page as string | undefined,
      limit: req.query.limit as string | undefined,
    }),
  });
});
router.get(
  '/:projectId',
  requireWorkspaceMember,
  validate(projectParamsSchema),
  async (req, res) => {
    res.json({
      data: await getProjectById(
        String(req.params.workspaceId),
        String(req.params.projectId)
      ),
    });
  }
);
router.patch(
  '/:projectId',
  requireWorkspaceContributor,
  validate(updateProjectSchema),
  async (req, res) => {
    const project = await updateProject({
      workspaceId: String(req.params.workspaceId),
      projectId: String(req.params.projectId),
      actorId: res.locals.userId,
      ...req.body,
    });
    emitWorkspaceEvent(String(req.params.workspaceId), 'project_updated', {
      projectId: String(req.params.projectId),
    });
    res.json({ data: project });
  }
);
router.delete(
  '/:projectId',
  requireWorkspaceManager,
  validate(projectParamsSchema),
  async (req, res) => {
    const project = await deleteProject({
      workspaceId: String(req.params.workspaceId),
      projectId: String(req.params.projectId),
      actorId: res.locals.userId,
    });
    emitWorkspaceEvent(String(req.params.workspaceId), 'project_deleted', {
      projectId: String(req.params.projectId),
    });
    res.json({ data: project });
  }
);
router.use('/:projectId/tasks', taskRoutes);

export default router;
