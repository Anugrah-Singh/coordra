import { z } from 'zod';
import { createDocument } from 'zod-openapi';

import {
  loginSchema,
  registerSchema as createUserSchema,
} from '../domains/auth/route.js';
import {
  createWorkspaceSchema,
  deleteWorkspaceSchema,
  transferWorkspaceOwnerSchema,
  updateWorkspaceSchema,
} from '../domains/workspaces/route.js';
import { createProjectSchema, updateProjectSchema } from '../domains/projects/route.js';
import { createTaskSchema, updateTaskSchema } from '../domains/tasks/route.js';
import {
  createLabelSchema,
  replaceTaskLabelsSchema,
  updateLabelSchema,
} from '../domains/labels/route.js';
import { createCommentSchema } from '../domains/comments/route.js';
import { createWorkspaceInviteSchema } from '../domains/invites/route.js';
import { addMemberSchema, updateMemberRoleSchema } from '../domains/members/route.js';
import {
  assistantMessageSchema,
  editProposalSchema,
} from '../domains/assistant/route.js';

const dataEnvelope = (schema: z.ZodType = z.unknown()) => z.object({ data: schema });
const errorEnvelope = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    fields: z.record(z.string(), z.string()),
  }),
});
const responses = (status = '200') => ({
  [status]: {
    description: 'Success',
    content: { 'application/json': { schema: dataEnvelope() } },
  },
  '400': {
    description: 'Validation error',
    content: { 'application/json': { schema: errorEnvelope } },
  },
  '401': { description: 'Authentication required' },
  '403': { description: 'Insufficient workspace role' },
  '404': { description: 'Resource not found' },
  '409': { description: 'Conflict' },
  '410': { description: 'Expired resource' },
  '429': { description: 'Rate limited' },
  '503': { description: 'Pulse disabled or provider unavailable' },
});
const body = (schema: z.ZodType) => ({
  content: { 'application/json': { schema } },
});
const id = z.uuid();
const workspaceParams = z.object({ workspaceId: id });
const projectParams = z.object({ workspaceId: id, projectId: id });
const taskParams = z.object({ workspaceId: id, projectId: id, taskId: id });

export const openApiDocument = createDocument({
  openapi: '3.1.0',
  info: {
    title: 'Coordra API',
    version: '3.0.0',
    description:
      'Cookie-authenticated, tenant-scoped coordination API with approval-gated Pulse actions.',
  },
  tags: [
    'auth',
    'workspaces',
    'members',
    'invites',
    'projects',
    'tasks',
    'labels',
    'comments',
    'activity',
    'assistant',
  ].map((name) => ({ name })),
  paths: {
    '/api/auth/register': {
      post: {
        tags: ['auth'],
        requestBody: body(createUserSchema.shape.body),
        responses: responses('201'),
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['auth'],
        requestBody: body(loginSchema.shape.body),
        responses: responses(),
      },
    },
    '/api/auth/logout': { post: { tags: ['auth'], responses: responses() } },
    '/api/auth/me': { get: { tags: ['auth'], responses: responses() } },
    '/api/workspaces': {
      get: { tags: ['workspaces'], responses: responses() },
      post: {
        tags: ['workspaces'],
        requestBody: body(createWorkspaceSchema.shape.body),
        responses: responses('201'),
      },
    },
    '/api/workspaces/{workspaceId}': {
      get: {
        tags: ['workspaces'],
        requestParams: { path: workspaceParams },
        responses: responses(),
      },
      patch: {
        tags: ['workspaces'],
        requestParams: { path: workspaceParams },
        requestBody: body(updateWorkspaceSchema.shape.body),
        responses: responses(),
      },
      delete: {
        tags: ['workspaces'],
        requestParams: { path: workspaceParams },
        requestBody: body(deleteWorkspaceSchema.shape.body),
        responses: responses(),
      },
    },
    '/api/workspaces/{workspaceId}/transfer-owner': {
      patch: {
        tags: ['workspaces'],
        requestParams: { path: workspaceParams },
        requestBody: body(transferWorkspaceOwnerSchema.shape.body),
        responses: responses(),
      },
    },
    '/api/workspaces/{workspaceId}/members': {
      get: {
        tags: ['members'],
        requestParams: { path: workspaceParams },
        responses: responses(),
      },
      post: {
        tags: ['members'],
        requestParams: { path: workspaceParams },
        requestBody: body(addMemberSchema.shape.body),
        responses: responses('201'),
      },
    },
    '/api/workspaces/{workspaceId}/members/{memberId}/role': {
      patch: {
        tags: ['members'],
        requestParams: { path: z.object({ workspaceId: id, memberId: id }) },
        requestBody: body(updateMemberRoleSchema.shape.body),
        responses: responses(),
      },
    },
    '/api/workspaces/{workspaceId}/invites': {
      get: {
        tags: ['invites'],
        requestParams: { path: workspaceParams },
        responses: responses(),
      },
      post: {
        tags: ['invites'],
        requestParams: { path: workspaceParams },
        requestBody: body(createWorkspaceInviteSchema.shape.body),
        responses: responses('201'),
      },
    },
    '/api/workspaces/{workspaceId}/projects': {
      get: {
        tags: ['projects'],
        requestParams: { path: workspaceParams },
        responses: responses(),
      },
      post: {
        tags: ['projects'],
        requestParams: { path: workspaceParams },
        requestBody: body(createProjectSchema.shape.body),
        responses: responses('201'),
      },
    },
    '/api/workspaces/{workspaceId}/projects/{projectId}': {
      get: {
        tags: ['projects'],
        requestParams: { path: projectParams },
        responses: responses(),
      },
      patch: {
        tags: ['projects'],
        requestParams: { path: projectParams },
        requestBody: body(updateProjectSchema.shape.body),
        responses: responses(),
      },
      delete: {
        tags: ['projects'],
        requestParams: { path: projectParams },
        responses: responses(),
      },
    },
    '/api/workspaces/{workspaceId}/projects/{projectId}/tasks': {
      get: {
        tags: ['tasks'],
        requestParams: { path: projectParams },
        responses: responses(),
      },
      post: {
        tags: ['tasks'],
        requestParams: { path: projectParams },
        requestBody: body(createTaskSchema.shape.body),
        responses: responses('201'),
      },
    },
    '/api/workspaces/{workspaceId}/projects/{projectId}/tasks/{taskId}': {
      get: {
        tags: ['tasks'],
        requestParams: { path: taskParams },
        responses: responses(),
      },
      patch: {
        tags: ['tasks'],
        requestParams: { path: taskParams },
        requestBody: body(updateTaskSchema.shape.body),
        responses: responses(),
      },
    },
    '/api/workspaces/{workspaceId}/projects/{projectId}/tasks/{taskId}/duplicate': {
      post: {
        tags: ['tasks'],
        requestParams: { path: taskParams },
        responses: responses('201'),
      },
    },
    '/api/workspaces/{workspaceId}/projects/{projectId}/tasks/{taskId}/labels': {
      get: {
        tags: ['labels'],
        requestParams: { path: taskParams },
        responses: responses(),
      },
      put: {
        tags: ['labels'],
        requestParams: { path: taskParams },
        requestBody: body(replaceTaskLabelsSchema.shape.body),
        responses: responses(),
      },
    },
    '/api/workspaces/{workspaceId}/labels': {
      get: {
        tags: ['labels'],
        requestParams: { path: workspaceParams },
        responses: responses(),
      },
      post: {
        tags: ['labels'],
        requestParams: { path: workspaceParams },
        requestBody: body(createLabelSchema.shape.body),
        responses: responses('201'),
      },
    },
    '/api/workspaces/{workspaceId}/labels/{labelId}': {
      patch: {
        tags: ['labels'],
        requestParams: { path: z.object({ workspaceId: id, labelId: id }) },
        requestBody: body(updateLabelSchema.shape.body),
        responses: responses(),
      },
      delete: {
        tags: ['labels'],
        requestParams: { path: z.object({ workspaceId: id, labelId: id }) },
        responses: responses(),
      },
    },
    '/api/workspaces/{workspaceId}/projects/{projectId}/tasks/{taskId}/comments': {
      get: {
        tags: ['comments'],
        requestParams: { path: taskParams },
        responses: responses(),
      },
      post: {
        tags: ['comments'],
        requestParams: { path: taskParams },
        requestBody: body(createCommentSchema.shape.body),
        responses: responses('201'),
      },
    },
    '/api/workspaces/{workspaceId}/audit-logs': {
      get: {
        tags: ['activity'],
        requestParams: { path: workspaceParams },
        responses: responses(),
      },
    },
    '/api/workspaces/{workspaceId}/assistant/status': {
      get: {
        tags: ['assistant'],
        requestParams: { path: workspaceParams },
        responses: responses(),
      },
    },
    '/api/workspaces/{workspaceId}/assistant/messages': {
      post: {
        tags: ['assistant'],
        requestParams: { path: workspaceParams },
        requestBody: body(assistantMessageSchema.shape.body),
        responses: responses(),
      },
    },
    '/api/workspaces/{workspaceId}/assistant/proposals/{proposalId}': {
      patch: {
        tags: ['assistant'],
        requestParams: {
          path: z.object({ workspaceId: id, proposalId: id }),
        },
        requestBody: body(editProposalSchema.shape.body),
        responses: responses(),
      },
    },
    '/api/workspaces/{workspaceId}/assistant/proposals/{proposalId}/reject': {
      post: {
        tags: ['assistant'],
        requestParams: {
          path: z.object({ workspaceId: id, proposalId: id }),
        },
        responses: responses(),
      },
    },
    '/api/workspaces/{workspaceId}/assistant/proposals/{proposalId}/approve': {
      post: {
        tags: ['assistant'],
        requestParams: {
          path: z.object({ workspaceId: id, proposalId: id }),
        },
        responses: responses(),
      },
    },
    '/api/notifications': { get: { tags: ['activity'], responses: responses() } },
  },
});
