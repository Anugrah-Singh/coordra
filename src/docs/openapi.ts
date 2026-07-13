const json = (schema: Record<string, unknown>) => ({
  content: {
    'application/json': {
      schema,
    },
  },
});

const success = (
  description: string,
  dataSchema: Record<string, unknown>,
  statusExample?: unknown
) => ({
  description,
  ...json({
    type: 'object',
    required: ['success', 'data'],
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string' },
      data: dataSchema,
    },
    ...(statusExample === undefined ? {} : { example: statusExample }),
  }),
});

const errorResponse = {
  description: 'API error',
  ...json({ $ref: '#/components/schemas/ApiError' }),
};

const workspaceId = {
  name: 'workspaceId',
  in: 'path',
  required: true,
  schema: { type: 'string', format: 'uuid' },
};

const projectId = {
  name: 'projectId',
  in: 'path',
  required: true,
  schema: { type: 'string', format: 'uuid' },
};

const taskId = {
  name: 'taskId',
  in: 'path',
  required: true,
  schema: { type: 'string', format: 'uuid' },
};

const pagination = [
  {
    name: 'page',
    in: 'query',
    schema: { type: 'integer', minimum: 1, default: 1 },
  },
  {
    name: 'limit',
    in: 'query',
    schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
  },
];

const secure = [{ cookieAuth: [] }];

export const openApiDocument = {
  openapi: '3.1.0',
  info: {
    title: 'SaaS Team Workspace API',
    version: '1.0.0',
    description:
      'Multi-tenant team collaboration API with cookie authentication, workspace RBAC, task management, invitations, notifications, audit logs and Socket.IO events.',
  },
  servers: [
    { url: 'http://localhost:8000', description: 'Local development' },
  ],
  tags: [
    { name: 'Health' },
    { name: 'Authentication' },
    { name: 'Workspaces' },
    { name: 'Members' },
    { name: 'Projects' },
    { name: 'Tasks' },
    { name: 'Comments' },
    { name: 'Labels' },
    { name: 'Invitations' },
    { name: 'Notifications' },
    { name: 'Audit logs' },
  ],
  paths: {
    '/health/live': {
      get: {
        tags: ['Health'],
        summary: 'Liveness check',
        responses: {
          '200': success('Server process is alive', {
            type: 'object',
            properties: {
              status: { type: 'string', example: 'alive' },
              timestamp: { type: 'string', format: 'date-time' },
              uptimeSeconds: { type: 'integer' },
            },
          }),
        },
      },
    },
    '/health/ready': {
      get: {
        tags: ['Health'],
        summary: 'Readiness and database check',
        responses: {
          '200': { description: 'Application and database are ready' },
          '503': { description: 'Application is starting, stopping, or database is unavailable' },
        },
      },
    },
    '/api/users': {
      post: {
        tags: ['Authentication'],
        summary: 'Register a user',
        requestBody: {
          required: true,
          ...json({ $ref: '#/components/schemas/RegisterInput' }),
        },
        responses: {
          '201': success('User created', { $ref: '#/components/schemas/User' }),
          '400': errorResponse,
          '409': errorResponse,
          '429': errorResponse,
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Log in and set the HttpOnly JWT cookie',
        requestBody: {
          required: true,
          ...json({ $ref: '#/components/schemas/LoginInput' }),
        },
        responses: {
          '200': success('Logged in', {
            type: 'object',
            properties: { user: { $ref: '#/components/schemas/User' } },
          }),
          '401': errorResponse,
          '429': errorResponse,
        },
      },
    },
    '/api/auth/logout': {
      post: {
        tags: ['Authentication'],
        summary: 'Clear the authentication cookie',
        responses: { '200': { description: 'Logged out' } },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Restore the current session',
        security: secure,
        responses: {
          '200': success('Authenticated user', {
            type: 'object',
            properties: { user: { $ref: '#/components/schemas/User' } },
          }),
          '401': errorResponse,
        },
      },
    },
    '/api/workspaces': {
      get: {
        tags: ['Workspaces'],
        summary: 'List active workspaces for the current user',
        security: secure,
        responses: {
          '200': success('Workspace list', {
            type: 'array',
            items: { $ref: '#/components/schemas/WorkspaceWithRole' },
          }),
          '401': errorResponse,
        },
      },
      post: {
        tags: ['Workspaces'],
        summary: 'Create a workspace and owner membership',
        security: secure,
        requestBody: {
          required: true,
          ...json({
            type: 'object',
            required: ['name'],
            properties: { name: { type: 'string', minLength: 3, maxLength: 50 } },
          }),
        },
        responses: {
          '201': success('Workspace created', { $ref: '#/components/schemas/Workspace' }),
          '400': errorResponse,
          '401': errorResponse,
        },
      },
    },
    '/api/workspaces/{workspaceId}': {
      parameters: [workspaceId],
      get: {
        tags: ['Workspaces'],
        summary: 'Get a workspace',
        security: secure,
        responses: {
          '200': success('Workspace', { $ref: '#/components/schemas/Workspace' }),
          '403': errorResponse,
          '404': errorResponse,
        },
      },
      patch: {
        tags: ['Workspaces'],
        summary: 'Rename a workspace',
        security: secure,
        requestBody: {
          required: true,
          ...json({
            type: 'object',
            required: ['name'],
            properties: { name: { type: 'string', minLength: 3, maxLength: 50 } },
          }),
        },
        responses: {
          '200': success('Workspace updated', { $ref: '#/components/schemas/Workspace' }),
          '403': errorResponse,
          '404': errorResponse,
        },
      },
      delete: {
        tags: ['Workspaces'],
        summary: 'Delete a workspace as its owner',
        security: secure,
        requestBody: {
          required: true,
          ...json({
            type: 'object',
            required: ['confirmationName'],
            properties: { confirmationName: { type: 'string' } },
          }),
        },
        responses: {
          '200': success('Workspace deleted', { $ref: '#/components/schemas/Workspace' }),
          '400': errorResponse,
          '403': errorResponse,
        },
      },
    },
    '/api/workspaces/{workspaceId}/transfer-owner': {
      parameters: [workspaceId],
      patch: {
        tags: ['Workspaces'],
        summary: 'Transfer workspace ownership',
        security: secure,
        requestBody: {
          required: true,
          ...json({
            type: 'object',
            required: ['newOwnerMemberId'],
            properties: { newOwnerMemberId: { type: 'string', format: 'uuid' } },
          }),
        },
        responses: {
          '200': { description: 'Ownership transferred' },
          '400': errorResponse,
          '403': errorResponse,
          '404': errorResponse,
        },
      },
    },
    '/api/workspaces/{workspaceId}/members': {
      parameters: [workspaceId],
      get: {
        tags: ['Members'],
        summary: 'List active workspace members',
        security: secure,
        parameters: pagination,
        responses: {
          '200': success('Member list', {
            type: 'array',
            items: { $ref: '#/components/schemas/WorkspaceMember' },
          }),
          '403': errorResponse,
        },
      },
      post: {
        tags: ['Members'],
        summary: 'Add an existing user by email',
        security: secure,
        requestBody: {
          required: true,
          ...json({ $ref: '#/components/schemas/MemberInput' }),
        },
        responses: {
          '201': success('Member added', { $ref: '#/components/schemas/WorkspaceMember' }),
          '403': errorResponse,
          '404': errorResponse,
          '409': errorResponse,
        },
      },
    },
    '/api/workspaces/{workspaceId}/members/{memberId}/role': {
      parameters: [
        workspaceId,
        { name: 'memberId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      patch: {
        tags: ['Members'],
        summary: 'Change a member role',
        security: secure,
        requestBody: {
          required: true,
          ...json({
            type: 'object',
            required: ['role'],
            properties: { role: { $ref: '#/components/schemas/AssignableRole' } },
          }),
        },
        responses: {
          '200': success('Member updated', { $ref: '#/components/schemas/WorkspaceMember' }),
          '403': errorResponse,
          '404': errorResponse,
        },
      },
    },
    '/api/workspaces/{workspaceId}/members/{memberId}': {
      parameters: [
        workspaceId,
        { name: 'memberId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      delete: {
        tags: ['Members'],
        summary: 'Soft-remove a member',
        security: secure,
        responses: {
          '200': { description: 'Member removed' },
          '403': errorResponse,
          '404': errorResponse,
        },
      },
    },
    '/api/workspaces/{workspaceId}/projects': {
      parameters: [workspaceId],
      get: {
        tags: ['Projects'],
        summary: 'List workspace projects',
        security: secure,
        parameters: pagination,
        responses: {
          '200': success('Project list', {
            type: 'array',
            items: { $ref: '#/components/schemas/Project' },
          }),
          '403': errorResponse,
        },
      },
      post: {
        tags: ['Projects'],
        summary: 'Create a project',
        security: secure,
        requestBody: {
          required: true,
          ...json({ $ref: '#/components/schemas/ProjectInput' }),
        },
        responses: {
          '201': success('Project created', { $ref: '#/components/schemas/Project' }),
          '403': errorResponse,
        },
      },
    },
    '/api/workspaces/{workspaceId}/projects/{projectId}': {
      parameters: [workspaceId, projectId],
      get: {
        tags: ['Projects'],
        summary: 'Get a project',
        security: secure,
        responses: {
          '200': success('Project', { $ref: '#/components/schemas/Project' }),
          '404': errorResponse,
        },
      },
      patch: {
        tags: ['Projects'],
        summary: 'Update a project',
        security: secure,
        requestBody: { required: true, ...json({ $ref: '#/components/schemas/ProjectInput' }) },
        responses: {
          '200': success('Project updated', { $ref: '#/components/schemas/Project' }),
          '403': errorResponse,
          '404': errorResponse,
        },
      },
      delete: {
        tags: ['Projects'],
        summary: 'Delete a project and cascade its tasks',
        security: secure,
        responses: {
          '200': success('Project deleted', { $ref: '#/components/schemas/Project' }),
          '403': errorResponse,
          '404': errorResponse,
        },
      },
    },
    '/api/workspaces/{workspaceId}/projects/{projectId}/tasks': {
      parameters: [workspaceId, projectId],
      get: {
        tags: ['Tasks'],
        summary: 'List project tasks',
        security: secure,
        parameters: [
          ...pagination,
          { name: 'status', in: 'query', schema: { $ref: '#/components/schemas/TaskStatus' } },
          { name: 'priority', in: 'query', schema: { $ref: '#/components/schemas/TaskPriority' } },
          { name: 'assigneeId', in: 'query', schema: { type: 'string', format: 'uuid' } },
          { name: 'includeArchived', in: 'query', schema: { type: 'boolean', default: false } },
        ],
        responses: {
          '200': success('Task list', {
            type: 'array',
            items: { $ref: '#/components/schemas/Task' },
          }),
          '404': errorResponse,
        },
      },
      post: {
        tags: ['Tasks'],
        summary: 'Create a task',
        security: secure,
        requestBody: { required: true, ...json({ $ref: '#/components/schemas/TaskInput' }) },
        responses: {
          '201': success('Task created', { $ref: '#/components/schemas/Task' }),
          '400': errorResponse,
          '403': errorResponse,
          '404': errorResponse,
        },
      },
    },
    '/api/workspaces/{workspaceId}/projects/{projectId}/tasks/{taskId}': {
      parameters: [workspaceId, projectId, taskId],
      get: {
        tags: ['Tasks'],
        summary: 'Get a task',
        security: secure,
        responses: {
          '200': success('Task', { $ref: '#/components/schemas/Task' }),
          '404': errorResponse,
        },
      },
      patch: {
        tags: ['Tasks'],
        summary: 'Update task fields',
        security: secure,
        requestBody: { required: true, ...json({ $ref: '#/components/schemas/TaskInput' }) },
        responses: {
          '200': success('Task updated', { $ref: '#/components/schemas/Task' }),
          '400': errorResponse,
          '403': errorResponse,
          '404': errorResponse,
        },
      },
    },
    '/api/workspaces/{workspaceId}/projects/{projectId}/tasks/{taskId}/status': {
      parameters: [workspaceId, projectId, taskId],
      patch: {
        tags: ['Tasks'],
        summary: 'Move a task to another status',
        security: secure,
        requestBody: {
          required: true,
          ...json({
            type: 'object',
            required: ['status'],
            properties: { status: { $ref: '#/components/schemas/TaskStatus' } },
          }),
        },
        responses: {
          '200': success('Task status updated', { $ref: '#/components/schemas/Task' }),
          '403': errorResponse,
          '404': errorResponse,
        },
      },
    },
    '/api/workspaces/{workspaceId}/projects/{projectId}/tasks/{taskId}/assign': {
      parameters: [workspaceId, projectId, taskId],
      patch: {
        tags: ['Tasks'],
        summary: 'Assign or unassign a task',
        security: secure,
        requestBody: {
          required: true,
          ...json({
            type: 'object',
            required: ['assigneeId'],
            properties: { assigneeId: { type: ['string', 'null'], format: 'uuid' } },
          }),
        },
        responses: {
          '200': success('Task assignment updated', { $ref: '#/components/schemas/Task' }),
          '400': errorResponse,
          '403': errorResponse,
        },
      },
    },
    '/api/workspaces/{workspaceId}/projects/{projectId}/tasks/{taskId}/archive': {
      parameters: [workspaceId, projectId, taskId],
      patch: {
        tags: ['Tasks'],
        summary: 'Archive a task',
        security: secure,
        responses: { '200': success('Task archived', { $ref: '#/components/schemas/Task' }) },
      },
    },
    '/api/workspaces/{workspaceId}/projects/{projectId}/tasks/{taskId}/unarchive': {
      parameters: [workspaceId, projectId, taskId],
      patch: {
        tags: ['Tasks'],
        summary: 'Restore an archived task',
        security: secure,
        responses: { '200': success('Task restored', { $ref: '#/components/schemas/Task' }) },
      },
    },
    '/api/workspaces/{workspaceId}/projects/{projectId}/tasks/{taskId}/duplicate': {
      parameters: [workspaceId, projectId, taskId],
      post: {
        tags: ['Tasks'],
        summary: 'Duplicate a task',
        security: secure,
        responses: { '201': success('Task duplicated', { $ref: '#/components/schemas/Task' }) },
      },
    },
    '/api/workspaces/{workspaceId}/projects/{projectId}/tasks/{taskId}/comments': {
      parameters: [workspaceId, projectId, taskId],
      get: {
        tags: ['Comments'],
        summary: 'List task comments',
        security: secure,
        parameters: pagination,
        responses: {
          '200': success('Comment list', {
            type: 'array',
            items: { $ref: '#/components/schemas/Comment' },
          }),
        },
      },
      post: {
        tags: ['Comments'],
        summary: 'Add a comment',
        security: secure,
        requestBody: {
          required: true,
          ...json({
            type: 'object',
            required: ['content'],
            properties: { content: { type: 'string', minLength: 1 } },
          }),
        },
        responses: {
          '201': success('Comment created', { $ref: '#/components/schemas/Comment' }),
        },
      },
    },
    '/api/workspaces/{workspaceId}/projects/{projectId}/tasks/{taskId}/comments/{commentId}': {
      parameters: [
        workspaceId,
        projectId,
        taskId,
        { name: 'commentId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      patch: {
        tags: ['Comments'],
        summary: 'Edit a comment',
        security: secure,
        requestBody: {
          required: true,
          ...json({
            type: 'object',
            required: ['content'],
            properties: { content: { type: 'string', minLength: 1 } },
          }),
        },
        responses: { '200': success('Comment updated', { $ref: '#/components/schemas/Comment' }) },
      },
      delete: {
        tags: ['Comments'],
        summary: 'Delete a comment',
        security: secure,
        responses: { '200': success('Comment deleted', { $ref: '#/components/schemas/Comment' }) },
      },
    },
    '/api/workspaces/{workspaceId}/labels': {
      parameters: [workspaceId],
      get: {
        tags: ['Labels'],
        summary: 'List workspace labels',
        security: secure,
        parameters: pagination,
        responses: {
          '200': success('Label list', {
            type: 'array',
            items: { $ref: '#/components/schemas/Label' },
          }),
        },
      },
      post: {
        tags: ['Labels'],
        summary: 'Create a label',
        security: secure,
        requestBody: { required: true, ...json({ $ref: '#/components/schemas/LabelInput' }) },
        responses: { '201': success('Label created', { $ref: '#/components/schemas/Label' }) },
      },
    },
    '/api/workspaces/{workspaceId}/labels/{labelId}': {
      parameters: [
        workspaceId,
        { name: 'labelId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      patch: {
        tags: ['Labels'],
        summary: 'Update a label',
        security: secure,
        requestBody: { required: true, ...json({ $ref: '#/components/schemas/LabelInput' }) },
        responses: { '200': success('Label updated', { $ref: '#/components/schemas/Label' }) },
      },
      delete: {
        tags: ['Labels'],
        summary: 'Delete a label',
        security: secure,
        responses: { '200': success('Label deleted', { $ref: '#/components/schemas/Label' }) },
      },
    },
    '/api/workspaces/{workspaceId}/projects/{projectId}/tasks/{taskId}/labels': {
      parameters: [workspaceId, projectId, taskId],
      get: {
        tags: ['Labels'],
        summary: 'List labels attached to a task',
        security: secure,
        parameters: pagination,
        responses: {
          '200': success('Task labels', {
            type: 'array',
            items: { $ref: '#/components/schemas/Label' },
          }),
        },
      },
    },
    '/api/workspaces/{workspaceId}/projects/{projectId}/tasks/{taskId}/labels/{labelId}': {
      parameters: [
        workspaceId,
        projectId,
        taskId,
        { name: 'labelId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      post: {
        tags: ['Labels'],
        summary: 'Attach a label to a task',
        security: secure,
        responses: { '201': success('Label attached', { $ref: '#/components/schemas/Label' }) },
      },
      delete: {
        tags: ['Labels'],
        summary: 'Remove a label from a task',
        security: secure,
        responses: { '200': success('Label removed', { $ref: '#/components/schemas/Label' }) },
      },
    },
    '/api/workspaces/{workspaceId}/invites': {
      parameters: [workspaceId],
      get: {
        tags: ['Invitations'],
        summary: 'List workspace invitations',
        security: secure,
        parameters: pagination,
        responses: {
          '200': success('Invitation list', {
            type: 'array',
            items: { $ref: '#/components/schemas/Invitation' },
          }),
        },
      },
      post: {
        tags: ['Invitations'],
        summary: 'Create a secure workspace invitation',
        description: 'Raw invitation tokens are returned only in test mode or when DEMO_MODE=true.',
        security: secure,
        requestBody: { required: true, ...json({ $ref: '#/components/schemas/MemberInput' }) },
        responses: {
          '201': success('Invitation created', {
            type: 'object',
            properties: {
              invite: { $ref: '#/components/schemas/Invitation' },
              token: { type: 'string' },
              invitePath: { type: 'string' },
            },
          }),
          '409': errorResponse,
        },
      },
    },
    '/api/workspaces/{workspaceId}/invites/{inviteId}': {
      parameters: [
        workspaceId,
        { name: 'inviteId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      delete: {
        tags: ['Invitations'],
        summary: 'Revoke an invitation',
        security: secure,
        responses: { '200': success('Invitation deleted', { $ref: '#/components/schemas/Invitation' }) },
      },
    },
    '/api/workspace-invites/{token}/accept': {
      parameters: [
        { name: 'token', in: 'path', required: true, schema: { type: 'string', minLength: 32 } },
      ],
      post: {
        tags: ['Invitations'],
        summary: 'Accept an invitation',
        security: secure,
        responses: { '200': { description: 'Invitation accepted and membership created' }, '400': errorResponse, '403': errorResponse },
      },
    },
    '/api/workspace-invites/{token}/decline': {
      parameters: [
        { name: 'token', in: 'path', required: true, schema: { type: 'string', minLength: 32 } },
      ],
      post: {
        tags: ['Invitations'],
        summary: 'Decline an invitation',
        security: secure,
        responses: { '200': { description: 'Invitation declined' }, '400': errorResponse, '403': errorResponse },
      },
    },
    '/api/notifications': {
      get: {
        tags: ['Notifications'],
        summary: 'List current-user notifications',
        security: secure,
        parameters: [
          ...pagination,
          { name: 'workspaceId', in: 'query', schema: { type: 'string', format: 'uuid' } },
          { name: 'unreadOnly', in: 'query', schema: { type: 'boolean' } },
        ],
        responses: {
          '200': success('Notification list', {
            type: 'array',
            items: { $ref: '#/components/schemas/Notification' },
          }),
        },
      },
    },
    '/api/notifications/unread-count': {
      get: {
        tags: ['Notifications'],
        summary: 'Get unread notification count',
        security: secure,
        parameters: [{ name: 'workspaceId', in: 'query', schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': success('Unread count', {
            type: 'object',
            properties: { count: { type: 'integer' } },
          }),
        },
      },
    },
    '/api/notifications/read-all': {
      patch: {
        tags: ['Notifications'],
        summary: 'Mark all notifications as read',
        security: secure,
        parameters: [{ name: 'workspaceId', in: 'query', schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'Notifications marked read' } },
      },
    },
    '/api/notifications/{notificationId}/read': {
      parameters: [
        { name: 'notificationId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      patch: {
        tags: ['Notifications'],
        summary: 'Mark one notification as read',
        security: secure,
        responses: { '200': success('Notification updated', { $ref: '#/components/schemas/Notification' }), '404': errorResponse },
      },
    },
    '/api/workspaces/{workspaceId}/audit-logs': {
      parameters: [workspaceId],
      get: {
        tags: ['Audit logs'],
        summary: 'List workspace audit activity',
        security: secure,
        parameters: pagination,
        responses: {
          '200': success('Audit log list', {
            type: 'array',
            items: { $ref: '#/components/schemas/AuditLog' },
          }),
          '403': errorResponse,
        },
      },
    },
  },
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'auth_token',
        description: 'HttpOnly JWT cookie set by POST /api/auth/login.',
      },
    },
    schemas: {
      ApiError: {
        type: 'object',
        required: ['success', 'code', 'message'],
        properties: {
          success: { type: 'boolean', const: false },
          code: { type: 'string', example: 'VALIDATION_ERROR' },
          message: { type: 'string', example: 'Validation failed' },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string', example: 'body.email' },
                message: { type: 'string' },
              },
            },
          },
        },
      },
      User: {
        type: 'object',
        required: ['id', 'email', 'fullName'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          fullName: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      RegisterInput: {
        type: 'object',
        required: ['email', 'password', 'fullName'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 12, maxLength: 128 },
          fullName: { type: 'string', minLength: 2, maxLength: 100 },
        },
      },
      LoginInput: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
      WorkspaceRole: {
        type: 'string',
        enum: ['OWNER', 'ADMIN', 'MANAGER', 'MEMBER', 'VIEWER'],
      },
      AssignableRole: {
        type: 'string',
        enum: ['ADMIN', 'MANAGER', 'MEMBER', 'VIEWER'],
      },
      Workspace: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          slug: { type: 'string' },
          ownerId: { type: 'string', format: 'uuid' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      WorkspaceWithRole: {
        allOf: [
          { $ref: '#/components/schemas/Workspace' },
          {
            type: 'object',
            properties: { role: { $ref: '#/components/schemas/WorkspaceRole' } },
          },
        ],
      },
      WorkspaceMember: {
        type: 'object',
        properties: {
          membershipId: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          fullName: { type: 'string' },
          email: { type: 'string', format: 'email' },
          role: { $ref: '#/components/schemas/WorkspaceRole' },
          joinedAt: { type: 'string', format: 'date-time' },
        },
      },
      MemberInput: {
        type: 'object',
        required: ['email', 'role'],
        properties: {
          email: { type: 'string', format: 'email' },
          role: { $ref: '#/components/schemas/AssignableRole' },
        },
      },
      Project: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          workspaceId: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          description: { type: ['string', 'null'] },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      ProjectInput: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          description: { type: ['string', 'null'], maxLength: 500 },
        },
      },
      TaskStatus: {
        type: 'string',
        enum: ['BACKLOG', 'TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE'],
      },
      TaskPriority: {
        type: 'string',
        enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      },
      Task: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          workspaceId: { type: 'string', format: 'uuid' },
          projectId: { type: 'string', format: 'uuid' },
          assigneeId: { type: ['string', 'null'], format: 'uuid' },
          createdById: { type: ['string', 'null'], format: 'uuid' },
          title: { type: 'string' },
          description: { type: ['string', 'null'] },
          status: { $ref: '#/components/schemas/TaskStatus' },
          priority: { $ref: '#/components/schemas/TaskPriority' },
          dueDate: { type: ['string', 'null'], format: 'date-time' },
          archivedAt: { type: ['string', 'null'], format: 'date-time' },
          duplicatedFromTaskId: { type: ['string', 'null'], format: 'uuid' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      TaskInput: {
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 1 },
          description: { type: ['string', 'null'] },
          status: { $ref: '#/components/schemas/TaskStatus' },
          priority: { $ref: '#/components/schemas/TaskPriority' },
          assigneeId: { type: ['string', 'null'], format: 'uuid' },
          dueDate: { type: ['string', 'null'], format: 'date-time' },
        },
      },
      Comment: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          workspaceId: { type: 'string', format: 'uuid' },
          taskId: { type: 'string', format: 'uuid' },
          authorId: { type: 'string', format: 'uuid' },
          content: { type: 'string' },
          editedAt: { type: ['string', 'null'], format: 'date-time' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Label: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          workspaceId: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          color: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      LabelInput: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 50 },
          color: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
        },
      },
      Invitation: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          workspaceId: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          role: { $ref: '#/components/schemas/WorkspaceRole' },
          status: { type: 'string', enum: ['PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED'] },
          expiresAt: { type: 'string', format: 'date-time' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Notification: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          workspaceId: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          type: { type: 'string' },
          message: { type: 'string' },
          resourceType: { type: ['string', 'null'] },
          resourceId: { type: ['string', 'null'], format: 'uuid' },
          readAt: { type: ['string', 'null'], format: 'date-time' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      AuditLog: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          actorName: { type: ['string', 'null'] },
          actorEmail: { type: ['string', 'null'] },
          action: { type: 'string' },
          entityType: { type: 'string' },
          entityId: { type: ['string', 'null'], format: 'uuid' },
          oldValue: {},
          newValue: {},
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
} as const;
