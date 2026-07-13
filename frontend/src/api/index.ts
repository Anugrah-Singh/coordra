import { request } from '../lib/api';
import type {
  AuditLog,
  Label,
  Notification,
  Project,
  Task,
  TaskComment,
  TaskFilters,
  TaskPriority,
  TaskStatus,
  User,
  Workspace,
  WorkspaceInvite,
  WorkspaceMember,
  WorkspaceRole,
} from '../types/api';

const workspacePath = (workspaceId: string) =>
  `/api/workspaces/${workspaceId}`;

const projectPath = (workspaceId: string, projectId: string) =>
  `${workspacePath(workspaceId)}/projects/${projectId}`;

const taskPath = (
  workspaceId: string,
  projectId: string,
  taskId: string
) => `${projectPath(workspaceId, projectId)}/tasks/${taskId}`;

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

export const authApi = {
  me: () => request<{ user: User }>({ method: 'GET', url: '/api/auth/me' }),

  login: (input: { email: string; password: string }) =>
    request<{ user: User }>({
      method: 'POST',
      url: '/api/auth/login',
      data: input,
    }),

  register: (input: {
    email: string;
    password: string;
    fullName: string;
  }) =>
    request<User>({
      method: 'POST',
      url: '/api/users',
      data: input,
    }),

  logout: () =>
    request<void>({
      method: 'POST',
      url: '/api/auth/logout',
    }),
};

export const workspaceApi = {
  list: () =>
    request<Workspace[]>({ method: 'GET', url: '/api/workspaces' }),

  get: (workspaceId: string) =>
    request<Workspace>({ method: 'GET', url: workspacePath(workspaceId) }),

  create: (name: string) =>
    request<Workspace>({
      method: 'POST',
      url: '/api/workspaces',
      data: { name },
    }),

  update: (workspaceId: string, name: string) =>
    request<Workspace>({
      method: 'PATCH',
      url: workspacePath(workspaceId),
      data: { name },
    }),

  remove: (workspaceId: string, confirmationName: string) =>
    request<Workspace>({
      method: 'DELETE',
      url: workspacePath(workspaceId),
      data: { confirmationName },
    }),

  transferOwner: (workspaceId: string, newOwnerMemberId: string) =>
    request<unknown>({
      method: 'PATCH',
      url: `${workspacePath(workspaceId)}/transfer-owner`,
      data: { newOwnerMemberId },
    }),
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

  create: (
    workspaceId: string,
    input: { name: string; description?: string | null }
  ) =>
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
    }
  ) =>
    request<Task>({
      method: 'PATCH',
      url: taskPath(workspaceId, projectId, taskId),
      data: input,
    }),

  updateStatus: (
    workspaceId: string,
    projectId: string,
    taskId: string,
    status: TaskStatus
  ) =>
    request<Task>({
      method: 'PATCH',
      url: `${taskPath(workspaceId, projectId, taskId)}/status`,
      data: { status },
    }),

  archive: (workspaceId: string, projectId: string, taskId: string) =>
    request<Task>({
      method: 'PATCH',
      url: `${taskPath(workspaceId, projectId, taskId)}/archive`,
    }),

  unarchive: (workspaceId: string, projectId: string, taskId: string) =>
    request<Task>({
      method: 'PATCH',
      url: `${taskPath(workspaceId, projectId, taskId)}/unarchive`,
    }),

  duplicate: (workspaceId: string, projectId: string, taskId: string) =>
    request<Task>({
      method: 'POST',
      url: `${taskPath(workspaceId, projectId, taskId)}/duplicate`,
    }),
};

export const memberApi = {
  list: (workspaceId: string) =>
    request<WorkspaceMember[]>({
      method: 'GET',
      url: `${workspacePath(workspaceId)}/members?limit=100`,
    }),

  add: (
    workspaceId: string,
    input: { email: string; role: Exclude<WorkspaceRole, 'OWNER'> }
  ) =>
    request<WorkspaceMember>({
      method: 'POST',
      url: `${workspacePath(workspaceId)}/members`,
      data: input,
    }),

  updateRole: (
    workspaceId: string,
    memberId: string,
    role: Exclude<WorkspaceRole, 'OWNER'>
  ) =>
    request<WorkspaceMember>({
      method: 'PATCH',
      url: `${workspacePath(workspaceId)}/members/${memberId}/role`,
      data: { role },
    }),

  remove: (workspaceId: string, memberId: string) =>
    request<WorkspaceMember>({
      method: 'DELETE',
      url: `${workspacePath(workspaceId)}/members/${memberId}`,
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

  addToTask: (
    workspaceId: string,
    projectId: string,
    taskId: string,
    labelId: string
  ) =>
    request<Label>({
      method: 'POST',
      url: `${taskPath(workspaceId, projectId, taskId)}/labels/${labelId}`,
    }),

  removeFromTask: (
    workspaceId: string,
    projectId: string,
    taskId: string,
    labelId: string
  ) =>
    request<Label>({
      method: 'DELETE',
      url: `${taskPath(workspaceId, projectId, taskId)}/labels/${labelId}`,
    }),
};

export const commentApi = {
  list: (workspaceId: string, projectId: string, taskId: string) =>
    request<TaskComment[]>({
      method: 'GET',
      url: `${taskPath(workspaceId, projectId, taskId)}/comments?limit=100`,
    }),

  create: (
    workspaceId: string,
    projectId: string,
    taskId: string,
    content: string
  ) =>
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

  remove: (
    workspaceId: string,
    projectId: string,
    taskId: string,
    commentId: string
  ) =>
    request<TaskComment>({
      method: 'DELETE',
      url: `${taskPath(workspaceId, projectId, taskId)}/comments/${commentId}`,
    }),
};

export const notificationApi = {
  list: (workspaceId?: string) =>
    request<Notification[]>({
      method: 'GET',
      url: `/api/notifications${toSearch({
        workspaceId,
        limit: '50',
      })}`,
    }),

  unreadCount: (workspaceId?: string) =>
    request<{ count: number }>({
      method: 'GET',
      url: `/api/notifications/unread-count${toSearch({ workspaceId })}`,
    }),

  markRead: (notificationId: string) =>
    request<Notification>({
      method: 'PATCH',
      url: `/api/notifications/${notificationId}/read`,
    }),

  markAllRead: (workspaceId?: string) =>
    request<{ count: number; notifications: Notification[] }>({
      method: 'PATCH',
      url: `/api/notifications/read-all${toSearch({ workspaceId })}`,
    }),
};

export const inviteApi = {
  list: (workspaceId: string) =>
    request<WorkspaceInvite[]>({
      method: 'GET',
      url: `${workspacePath(workspaceId)}/invites?limit=100`,
    }),

  create: (
    workspaceId: string,
    input: { email: string; role: Exclude<WorkspaceRole, 'OWNER'> }
  ) =>
    request<{ invite: WorkspaceInvite; token?: string; invitePath?: string }>({
      method: 'POST',
      url: `${workspacePath(workspaceId)}/invites`,
      data: input,
    }),

  remove: (workspaceId: string, inviteId: string) =>
    request<WorkspaceInvite>({
      method: 'DELETE',
      url: `${workspacePath(workspaceId)}/invites/${inviteId}`,
    }),

  accept: (token: string) =>
    request<unknown>({
      method: 'POST',
      url: `/api/workspace-invites/${encodeURIComponent(token)}/accept`,
    }),

  decline: (token: string) =>
    request<unknown>({
      method: 'POST',
      url: `/api/workspace-invites/${encodeURIComponent(token)}/decline`,
    }),
};

export const auditApi = {
  list: (workspaceId: string) =>
    request<AuditLog[]>({
      method: 'GET',
      url: `${workspacePath(workspaceId)}/audit-logs?limit=100`,
    }),
};
