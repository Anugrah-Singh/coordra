import { request } from '@/lib/api-client';
import type {
  Label,
  Project,
  Task,
  TaskComment,
  TaskFilters,
  TaskPriority,
  TaskStatus,
} from '@/types/api';

const workspacePath = (workspaceId: string) => `/api/workspaces/${workspaceId}`;

const projectPath = (workspaceId: string, projectId: string) =>
  `${workspacePath(workspaceId)}/projects/${projectId}`;

const taskPath = (workspaceId: string, projectId: string, taskId: string) =>
  `${projectPath(workspaceId, projectId)}/tasks/${taskId}`;

export const projectKeys = {
  all: ['projects'] as const,
  list: (workspaceId: string) => ['projects', workspaceId] as const,
  detail: (workspaceId: string, projectId: string) =>
    ['project', workspaceId, projectId] as const,
  tasks: (workspaceId: string, projectId: string) =>
    ['tasks', workspaceId, projectId] as const,
  labels: (workspaceId: string) => ['labels', workspaceId] as const,
};

const toSearch = (params: Record<string, string | boolean | undefined>) => {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      search.set(key, String(value));
    }
  });

  const query = search.toString();
  return query ? `?${query}` : '';
};

export const projectApi = {
  list: (workspaceId: string) =>
    request<Project[]>({
      method: 'GET',
      url: `${workspacePath(workspaceId)}/projects?limit=100`,
    }),

  get: (workspaceId: string, projectId: string) =>
    request<Project>({
      method: 'GET',
      url: projectPath(workspaceId, projectId),
    }),

  create: (workspaceId: string, input: { name: string; description?: string | null }) =>
    request<Project>({
      method: 'POST',
      url: `${workspacePath(workspaceId)}/projects`,
      data: input,
    }),

  update: (
    workspaceId: string,
    projectId: string,
    input: { name?: string; description?: string | null }
  ) =>
    request<Project>({
      method: 'PATCH',
      url: projectPath(workspaceId, projectId),
      data: input,
    }),

  remove: (workspaceId: string, projectId: string) =>
    request<Project>({
      method: 'DELETE',
      url: projectPath(workspaceId, projectId),
    }),
};

export const taskApi = {
  list: (workspaceId: string, projectId: string, filters?: TaskFilters) =>
    request<Task[]>({
      method: 'GET',
      url: `${projectPath(workspaceId, projectId)}/tasks${toSearch({
        limit: '100',
        status: filters?.status,
        priority: filters?.priority,
        assigneeId: filters?.assigneeId,
        includeArchived: filters?.includeArchived,
      })}`,
    }),

  get: (workspaceId: string, projectId: string, taskId: string) =>
    request<Task>({
      method: 'GET',
      url: taskPath(workspaceId, projectId, taskId),
    }),

  create: (
    workspaceId: string,
    projectId: string,
    input: {
      title: string;
      description?: string | null;
      status?: TaskStatus;
      priority?: TaskPriority;
      assigneeId?: string | null;
      dueDate?: string | null;
    }
  ) =>
    request<Task>({
      method: 'POST',
      url: `${projectPath(workspaceId, projectId)}/tasks`,
      data: input,
    }),

  update: (
    workspaceId: string,
    projectId: string,
    taskId: string,
    input: {
      title?: string;
      description?: string | null;
      status?: TaskStatus;
      priority?: TaskPriority;
      assigneeId?: string | null;
      dueDate?: string | null;
      archived?: boolean;
    }
  ) =>
    request<Task>({
      method: 'PATCH',
      url: taskPath(workspaceId, projectId, taskId),
      data: input,
    }),

  duplicate: (workspaceId: string, projectId: string, taskId: string) =>
    request<Task>({
      method: 'POST',
      url: `${taskPath(workspaceId, projectId, taskId)}/duplicate`,
    }),
};

export const labelApi = {
  list: (workspaceId: string) =>
    request<Label[]>({
      method: 'GET',
      url: `${workspacePath(workspaceId)}/labels?limit=100`,
    }),

  create: (workspaceId: string, input: { name: string; color?: string }) =>
    request<Label>({
      method: 'POST',
      url: `${workspacePath(workspaceId)}/labels`,
      data: input,
    }),

  update: (
    workspaceId: string,
    labelId: string,
    input: { name?: string; color?: string }
  ) =>
    request<Label>({
      method: 'PATCH',
      url: `${workspacePath(workspaceId)}/labels/${labelId}`,
      data: input,
    }),

  remove: (workspaceId: string, labelId: string) =>
    request<Label>({
      method: 'DELETE',
      url: `${workspacePath(workspaceId)}/labels/${labelId}`,
    }),

  listForTask: (workspaceId: string, projectId: string, taskId: string) =>
    request<Label[]>({
      method: 'GET',
      url: `${taskPath(workspaceId, projectId, taskId)}/labels?limit=100`,
    }),

  replaceForTask: (
    workspaceId: string,
    projectId: string,
    taskId: string,
    labelIds: string[]
  ) =>
    request<Label[]>({
      method: 'PUT',
      url: `${taskPath(workspaceId, projectId, taskId)}/labels`,
      data: { labelIds },
    }),
};

export const commentApi = {
  list: (workspaceId: string, projectId: string, taskId: string) =>
    request<TaskComment[]>({
      method: 'GET',
      url: `${taskPath(workspaceId, projectId, taskId)}/comments?limit=100`,
    }),

  create: (workspaceId: string, projectId: string, taskId: string, content: string) =>
    request<TaskComment>({
      method: 'POST',
      url: `${taskPath(workspaceId, projectId, taskId)}/comments`,
      data: { content },
    }),

  update: (
    workspaceId: string,
    projectId: string,
    taskId: string,
    commentId: string,
    content: string
  ) =>
    request<TaskComment>({
      method: 'PATCH',
      url: `${taskPath(workspaceId, projectId, taskId)}/comments/${commentId}`,
      data: { content },
    }),

  remove: (workspaceId: string, projectId: string, taskId: string, commentId: string) =>
    request<TaskComment>({
      method: 'DELETE',
      url: `${taskPath(workspaceId, projectId, taskId)}/comments/${commentId}`,
    }),
};
