import assert from 'node:assert/strict';
import './setup.js';
import { randomUUID } from 'node:crypto';

import { after, describe, it } from 'node:test';

import { eq, inArray } from 'drizzle-orm';

import request from 'supertest';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required for integration tests');
}

const [{ createApp }, { closeDatabase, db }, { users }, { workspaces }] =
  await Promise.all([
    import('../../src/app.js'),
    import('../../src/db/index.js'),
    import('../../src/db/schema/users.js'),
    import('../../src/db/schema/workspaces.js'),
  ]);

const app = createApp();

const ownerAgent = request.agent(app);
const memberAgent = request.agent(app);

const runId = `${Date.now().toString(36)}-` + randomUUID().slice(0, 8);

const ownerEmail = `collab-owner-${runId}@example.com`;

const memberEmail = `collab-member-${runId}@example.com`;

const password = 'IntegrationPassword123!';

const workspaceName = `Collaboration ${runId}`;

let ownerUserId: string | undefined;
let memberUserId: string | undefined;
let workspaceId: string | undefined;

after(async () => {
  try {
    if (workspaceId) {
      await db.delete(workspaces).where(eq(workspaces.id, workspaceId));
    }

    const userIds = [ownerUserId, memberUserId].filter(
      (id): id is string => id !== undefined
    );

    if (userIds.length > 0) {
      await db.delete(users).where(inArray(users.id, userIds));
    }
  } finally {
    await closeDatabase();
  }
});

describe('Project and task collaboration integration', () => {
  it('covers projects, tasks, labels, comments, notifications, and RBAC', async () => {
    const ownerRegistration = await request(app)
      .post('/api/auth/register')
      .send({
        email: ownerEmail,
        password,
        fullName: 'Collaboration Owner',
      })
      .expect(201);

    ownerUserId = ownerRegistration.body.data.id;

    await ownerAgent
      .post('/api/auth/login')
      .send({
        email: ownerEmail,
        password,
      })
      .expect(200);

    const workspaceCreation = await ownerAgent
      .post('/api/workspaces')
      .send({
        name: workspaceName,
      })
      .expect(201);

    workspaceId = workspaceCreation.body.data.id;

    assert.ok(workspaceId);

    const memberRegistration = await request(app)
      .post('/api/auth/register')
      .send({
        email: memberEmail,
        password,
        fullName: 'Collaboration Member',
      })
      .expect(201);

    memberUserId = memberRegistration.body.data.id;

    assert.ok(memberUserId);

    await ownerAgent
      .post(`/api/workspaces/${workspaceId}/members`)
      .send({
        email: memberEmail,
        role: 'MEMBER',
      })
      .expect(201);

    await memberAgent
      .post('/api/auth/login')
      .send({
        email: memberEmail,
        password,
      })
      .expect(200);

    const projectCreation = await ownerAgent
      .post(`/api/workspaces/${workspaceId}/projects`)
      .send({
        name: `Integration Project ${runId}`,
        description: 'Project created by the integration test',
      })
      .expect(201);

    const projectId = projectCreation.body.data.id as string;

    assert.ok(projectId);

    // MEMBER has contributor access and can
    // create a task inside the project.
    const taskCreation = await memberAgent
      .post(`/api/workspaces/${workspaceId}` + `/projects/${projectId}/tasks`)
      .send({
        title: `Integration Task ${runId}`,
        description: 'Task collaboration test',
        priority: 'HIGH',
      })
      .expect(201);

    const taskId = taskCreation.body.data.id as string;

    assert.equal(taskCreation.body.data.status, 'BACKLOG');

    assert.equal(taskCreation.body.data.priority, 'HIGH');

    // Assigning a task produces one unread
    // TASK_ASSIGNED notification.
    await ownerAgent
      .patch(
        `/api/workspaces/${workspaceId}` + `/projects/${projectId}` + `/tasks/${taskId}`
      )
      .send({
        assigneeId: memberUserId,
      })
      .expect(200);

    const unreadCount = await memberAgent
      .get('/api/notifications')
      .query({
        workspaceId,
      })
      .expect(200);

    assert.equal(unreadCount.body.data.unreadCount, 1);

    const notificationList = await memberAgent
      .get('/api/notifications')
      .query({
        workspaceId,
        unreadOnly: 'true',
        page: '1',
        limit: '10',
      })
      .expect(200);

    assert.ok(Array.isArray(notificationList.body.data.notifications));

    const assignmentNotification = notificationList.body.data.notifications.find(
      (notification: { id: string; type: string; resourceId: string | null }) =>
        notification.type === 'TASK_ASSIGNED' && notification.resourceId === taskId
    );

    assert.ok(assignmentNotification, 'TASK_ASSIGNED notification was not found');

    await memberAgent
      .patch(`/api/notifications/` + `${assignmentNotification.id}/read`)
      .expect(200);

    const countAfterRead = await memberAgent
      .get('/api/notifications')
      .query({
        workspaceId,
      })
      .expect(200);

    assert.equal(countAfterRead.body.data.unreadCount, 0);

    const statusUpdate = await memberAgent
      .patch(
        `/api/workspaces/${workspaceId}` + `/projects/${projectId}` + `/tasks/${taskId}`
      )
      .send({
        status: 'IN_PROGRESS',
      })
      .expect(200);

    assert.equal(statusUpdate.body.data.status, 'IN_PROGRESS');

    const labelCreation = await memberAgent
      .post(`/api/workspaces/${workspaceId}/labels`)
      .send({
        name: `Priority ${runId}`,
        color: '#FFAA00',
      })
      .expect(201);

    const labelId = labelCreation.body.data.id as string;

    await memberAgent
      .put(
        `/api/workspaces/${workspaceId}` +
          `/projects/${projectId}` +
          `/tasks/${taskId}/labels`
      )
      .send({ labelIds: [labelId] })
      .expect(200);

    const taskLabels = await memberAgent
      .get(
        `/api/workspaces/${workspaceId}` +
          `/projects/${projectId}` +
          `/tasks/${taskId}/labels`
      )
      .query({
        page: '1',
        limit: '10',
      })
      .expect(200);

    assert.equal(
      taskLabels.body.data.some((label: { id: string }) => label.id === labelId),
      true
    );

    const commentCreation = await memberAgent
      .post(
        `/api/workspaces/${workspaceId}` +
          `/projects/${projectId}` +
          `/tasks/${taskId}/comments`
      )
      .send({
        content: 'Initial integration comment',
      })
      .expect(201);

    const commentId = commentCreation.body.data.id as string;

    const commentUpdate = await memberAgent
      .patch(
        `/api/workspaces/${workspaceId}` +
          `/projects/${projectId}` +
          `/tasks/${taskId}` +
          `/comments/${commentId}`
      )
      .send({
        content: 'Updated integration comment',
      })
      .expect(200);

    assert.equal(commentUpdate.body.data.content, 'Updated integration comment');

    // Owners may delete another member's comment.
    await ownerAgent
      .delete(
        `/api/workspaces/${workspaceId}` +
          `/projects/${projectId}` +
          `/tasks/${taskId}` +
          `/comments/${commentId}`
      )
      .expect(200);

    await memberAgent
      .patch(
        `/api/workspaces/${workspaceId}` + `/projects/${projectId}` + `/tasks/${taskId}`
      )
      .send({ archived: true })
      .expect(200);

    const activeTaskList = await memberAgent
      .get(`/api/workspaces/${workspaceId}` + `/projects/${projectId}/tasks`)
      .query({
        page: '1',
        limit: '20',
      })
      .expect(200);

    assert.equal(
      activeTaskList.body.data.some((task: { id: string }) => task.id === taskId),
      false
    );

    const archivedTaskList = await memberAgent
      .get(`/api/workspaces/${workspaceId}` + `/projects/${projectId}/tasks`)
      .query({
        includeArchived: 'true',
        page: '1',
        limit: '20',
      })
      .expect(200);

    assert.equal(
      archivedTaskList.body.data.some((task: { id: string }) => task.id === taskId),
      true
    );

    await memberAgent
      .patch(
        `/api/workspaces/${workspaceId}` + `/projects/${projectId}` + `/tasks/${taskId}`
      )
      .send({ archived: false })
      .expect(200);

    const duplication = await ownerAgent
      .post(
        `/api/workspaces/${workspaceId}` +
          `/projects/${projectId}` +
          `/tasks/${taskId}/duplicate`
      )
      .expect(201);

    assert.equal(duplication.body.data.status, 'BACKLOG');
    assert.match(duplication.body.data.title, /\(Copy\)$/);

    // Project deletion requires MANAGER or above.
    await memberAgent
      .delete(`/api/workspaces/${workspaceId}` + `/projects/${projectId}`)
      .expect(403);

    const deletion = await ownerAgent
      .delete(`/api/workspaces/${workspaceId}`)
      .send({
        confirmationName: workspaceName,
      })
      .expect(200);

    assert.equal(deletion.body.data.id, workspaceId);
  });
});
