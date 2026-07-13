export type WorkspaceRole =
  | 'OWNER'
  | 'ADMIN'
  | 'MANAGER'
  | 'MEMBER'
  | 'VIEWER';

export type TaskStatus =
  | 'BACKLOG'
  | 'TODO'
  | 'IN_PROGRESS'
  | 'BLOCKED'
  | 'DONE';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type User = {
  id: string;
  email: string;
  fullName: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Workspace = {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  role?: WorkspaceRole;
  createdAt: string;
  updatedAt: string;
};

export type Project = {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Task = {
  id: string;
  workspaceId: string;
  projectId: string;
  assigneeId: string | null;
  createdById: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  archivedAt: string | null;
  duplicatedFromTaskId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type WorkspaceMember = {
  membershipId: string;
  userId: string;
  fullName: string;
  email: string;
  role: WorkspaceRole;
  joinedAt: string;
};

export type Label = {
  id: string;
  workspaceId: string;
  name: string;
  color: string;
  createdAt: string;
};

export type TaskComment = {
  id: string;
  workspaceId: string;
  taskId: string;
  authorId: string;
  content: string;
  editedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Notification = {
  id: string;
  workspaceId: string;
  userId: string;
  type: string;
  message: string;
  resourceType: string | null;
  resourceId: string | null;
  readAt: string | null;
  createdAt: string;
};

export type WorkspaceInvite = {
  id: string;
  workspaceId: string;
  email: string;
  role: WorkspaceRole;
  invitedById: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
  expiresAt: string;
  acceptedAt: string | null;
  declinedAt: string | null;
  createdAt: string;
};

export type AuditLog = {
  id: string;
  workspaceId: string;
  actorId: string | null;
  actorEmail: string | null;
  actorName: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  oldValue: unknown;
  newValue: unknown;
  createdAt: string;
};

export type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data: T;
};

export type ApiErrorPayload = {
  success?: false;
  code?: string;
  message?: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
};

export type TaskFilters = {
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  includeArchived?: boolean;
};
