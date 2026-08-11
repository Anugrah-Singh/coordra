import assert from 'node:assert/strict';
import './setup.js';
import { randomUUID } from 'node:crypto';
import { after, describe, it } from 'node:test';

import { eq, inArray } from 'drizzle-orm';
import request from 'supertest';

const [appModule, dbModule, schema, proposals] = await Promise.all([
  import('../../src/app.js'),
  import('../../src/db/index.js'),
  import('../../src/db/schema/index.js'),
  import('../../src/domains/assistant/service.js'),
]);
const app = appModule.createApp();
const owner = request.agent(app);
const member = request.agent(app);
const viewer = request.agent(app);
const outsider = request.agent(app);
const runId = `${Date.now().toString(36)}-${randomUUID().slice(0, 6)}`;
const password = 'PulseIntegration123!';
const emails = {
  owner: `pulse-owner-${runId}@example.com`,
  member: `pulse-member-${runId}@example.com`,
  viewer: `pulse-viewer-${runId}@example.com`,
  outsider: `pulse-outsider-${runId}@example.com`,
};
const userIds: string[] = [];
let workspaceId: string | undefined;

const registerAndLogin = async (
  agent: ReturnType<typeof request.agent>,
  email: string,
  fullName: string
) => {
  const registration = await request(app)
    .post('/api/auth/register')
    .send({ email, password, fullName })
    .expect(201);
  userIds.push(registration.body.data.id);
  await agent.post('/api/auth/login').send({ email, password }).expect(200);
  return registration.body.data.id as string;
};

after(async () => {
  try {
    if (workspaceId) {
      await dbModule.db
        .delete(schema.workspaces)
        .where(eq(schema.workspaces.id, workspaceId));
    }
    if (userIds.length) {
      await dbModule.db.delete(schema.users).where(inArray(schema.users.id, userIds));
    }
  } finally {
    await dbModule.closeDatabase();
  }
});

describe('Pulse approval integration', () => {
  it('isolates proposals and executes create, update, and comment exactly once', async () => {
    const ownerId = await registerAndLogin(owner, emails.owner, 'Pulse Owner');
    const memberId = await registerAndLogin(member, emails.member, 'Pulse Member');
    const viewerId = await registerAndLogin(viewer, emails.viewer, 'Pulse Viewer');
    await registerAndLogin(outsider, emails.outsider, 'Pulse Outsider');

    const workspace = await owner
      .post('/api/workspaces')
      .send({ name: `Pulse Workspace ${runId}` })
      .expect(201);
    workspaceId = workspace.body.data.id;

    const memberResult = await owner
      .post(`/api/workspaces/${workspaceId}/members`)
      .send({ email: emails.member, role: 'MEMBER' })
      .expect(201);
    await owner
      .post(`/api/workspaces/${workspaceId}/members`)
      .send({ email: emails.viewer, role: 'VIEWER' })
      .expect(201);

    await request(app).get(`/api/workspaces/${workspaceId}/assistant/status`).expect(401);
    const status = await viewer
      .get(`/api/workspaces/${workspaceId}/assistant/status`)
      .expect(200);
    assert.equal(status.body.data.enabled, false);
    await outsider.get(`/api/workspaces/${workspaceId}/assistant/status`).expect(403);
    await viewer
      .post(`/api/workspaces/${workspaceId}/assistant/messages`)
      .send({ message: 'Create a task', timeZone: 'UTC', history: [] })
      .expect(503);

    const project = await owner
      .post(`/api/workspaces/${workspaceId}/projects`)
      .send({ name: 'Pulse Launch' })
      .expect(201);
    const projectId = project.body.data.id as string;

    const createProposal = await proposals.createStoredProposal({
      workspaceId: workspaceId!,
      requesterId: memberId,
      actionType: 'CREATE_TASK',
      payload: {
        projectId,
        projectName: 'Pulse Launch',
        title: 'Prepared by Pulse',
        priority: 'HIGH',
      },
    });
    await viewer
      .post(
        `/api/workspaces/${workspaceId}/assistant/proposals/${createProposal.id}/approve`
      )
      .expect(404);
    const edited = await member
      .patch(`/api/workspaces/${workspaceId}/assistant/proposals/${createProposal.id}`)
      .send({ priority: 'URGENT', assigneeId: memberId })
      .expect(200);
    assert.equal(edited.body.data.payload.priority, 'URGENT');
    const created = await member
      .post(
        `/api/workspaces/${workspaceId}/assistant/proposals/${createProposal.id}/approve`
      )
      .expect(200);
    const taskId = created.body.data.resource.id as string;
    assert.equal(created.body.data.proposal.status, 'EXECUTED');
    await member
      .post(
        `/api/workspaces/${workspaceId}/assistant/proposals/${createProposal.id}/approve`
      )
      .expect(409);

    const updateProposal = await proposals.createStoredProposal({
      workspaceId: workspaceId!,
      requesterId: memberId,
      actionType: 'UPDATE_TASK',
      payload: {
        projectId,
        projectName: 'Pulse Launch',
        taskId,
        taskTitle: 'Prepared by Pulse',
        status: 'IN_PROGRESS',
      },
    });
    const commentProposal = await proposals.createStoredProposal({
      workspaceId: workspaceId!,
      requesterId: memberId,
      actionType: 'ADD_COMMENT',
      payload: {
        projectId,
        projectName: 'Pulse Launch',
        taskId,
        taskTitle: 'Prepared by Pulse',
        content: 'Approved Pulse context.',
      },
    });
    await member
      .post(
        `/api/workspaces/${workspaceId}/assistant/proposals/${updateProposal.id}/approve`
      )
      .expect(200);
    await member
      .post(
        `/api/workspaces/${workspaceId}/assistant/proposals/${commentProposal.id}/approve`
      )
      .expect(200);

    const task = await member
      .get(`/api/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`)
      .expect(200);
    assert.equal(task.body.data.status, 'IN_PROGRESS');
    const comments = await member
      .get(
        `/api/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}/comments`
      )
      .expect(200);
    assert.equal(comments.body.data.length, 1);

    const rejectable = await proposals.createStoredProposal({
      workspaceId: workspaceId!,
      requesterId: memberId,
      actionType: 'ADD_COMMENT',
      payload: {
        projectId,
        projectName: 'Pulse Launch',
        taskId,
        taskTitle: 'Prepared by Pulse',
        content: 'Do not post.',
      },
    });
    await member
      .post(`/api/workspaces/${workspaceId}/assistant/proposals/${rejectable.id}/reject`)
      .expect(200);
    await member
      .post(`/api/workspaces/${workspaceId}/assistant/proposals/${rejectable.id}/approve`)
      .expect(409);

    const expired = await proposals.createStoredProposal({
      workspaceId: workspaceId!,
      requesterId: ownerId,
      actionType: 'CREATE_TASK',
      payload: { projectId, projectName: 'Pulse Launch', title: 'Expired task' },
      now: new Date(Date.now() - 16 * 60 * 1000),
    });
    await owner
      .post(`/api/workspaces/${workspaceId}/assistant/proposals/${expired.id}/approve`)
      .expect(410);

    const stale = await proposals.createStoredProposal({
      workspaceId: workspaceId!,
      requesterId: memberId,
      actionType: 'CREATE_TASK',
      payload: { projectId, projectName: 'Pulse Launch', title: 'Stale role' },
    });
    await owner
      .patch(
        `/api/workspaces/${workspaceId}/members/${memberResult.body.data.membershipId}/role`
      )
      .send({ role: 'VIEWER' })
      .expect(200);
    await member
      .post(`/api/workspaces/${workspaceId}/assistant/proposals/${stale.id}/approve`)
      .expect(403);

    const concurrent = await proposals.createStoredProposal({
      workspaceId: workspaceId!,
      requesterId: ownerId,
      actionType: 'CREATE_TASK',
      payload: { projectId, projectName: 'Pulse Launch', title: 'Exactly once' },
    });
    const approvals = await Promise.all([
      owner.post(
        `/api/workspaces/${workspaceId}/assistant/proposals/${concurrent.id}/approve`
      ),
      owner.post(
        `/api/workspaces/${workspaceId}/assistant/proposals/${concurrent.id}/approve`
      ),
    ]);
    assert.deepEqual(approvals.map((response) => response.status).sort(), [200, 409]);
    const tasks = await owner
      .get(`/api/workspaces/${workspaceId}/projects/${projectId}/tasks?limit=100`)
      .expect(200);
    assert.equal(
      tasks.body.data.filter((item: { title: string }) => item.title === 'Exactly once')
        .length,
      1
    );

    const audit = await owner
      .get(`/api/workspaces/${workspaceId}/audit-logs?limit=100`)
      .expect(200);
    const pulseAudits = audit.body.data.filter((row: { action: string }) =>
      row.action.startsWith('AI_ASSISTED_')
    );
    assert.equal(pulseAudits.length, 4);
    assert.ok(viewerId);
  });
});
