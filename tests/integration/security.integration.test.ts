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

const firstOwnerAgent = request.agent(app);

const secondOwnerAgent = request.agent(app);

const runId = `${Date.now().toString(36)}-` + randomUUID().slice(0, 8);

const password = 'IntegrationPassword123!';

const firstEmail = `security-first-${runId}@example.com`;

const secondEmail = `security-second-${runId}@example.com`;

const createdUserIds: string[] = [];

const createdWorkspaceIds: string[] = [];

const registerAndLogin = async (
  agent: ReturnType<typeof request.agent>,

  email: string,

  fullName: string
): Promise<string> => {
  const registration = await request(app)
    .post('/api/auth/register')
    .send({
      email,
      password,
      fullName,
    })
    .expect(201);

  const userId = registration.body.data.id as string;

  createdUserIds.push(userId);

  await agent
    .post('/api/auth/login')
    .send({
      email,
      password,
    })
    .expect(200);

  return userId;
};

after(async () => {
  try {
    for (const workspaceId of createdWorkspaceIds) {
      await db.delete(workspaces).where(eq(workspaces.id, workspaceId));
    }

    if (createdUserIds.length > 0) {
      await db.delete(users).where(inArray(users.id, createdUserIds));
    }
  } finally {
    await closeDatabase();
  }
});

describe('Cross-workspace security', () => {
  it('prevents creating a task with a project from another workspace', async () => {
    await registerAndLogin(firstOwnerAgent, firstEmail, 'First Security Owner');

    await registerAndLogin(secondOwnerAgent, secondEmail, 'Second Security Owner');

    const firstWorkspaceResponse = await firstOwnerAgent
      .post('/api/workspaces')
      .send({
        name: `First Workspace ${runId}`,
      })
      .expect(201);

    const firstWorkspaceId = firstWorkspaceResponse.body.data.id as string;

    createdWorkspaceIds.push(firstWorkspaceId);

    const secondWorkspaceResponse = await secondOwnerAgent
      .post('/api/workspaces')
      .send({
        name: `Second Workspace ${runId}`,
      })
      .expect(201);

    const secondWorkspaceId = secondWorkspaceResponse.body.data.id as string;

    createdWorkspaceIds.push(secondWorkspaceId);

    const foreignProjectResponse = await secondOwnerAgent
      .post(`/api/workspaces/${secondWorkspaceId}/projects`)
      .send({
        name: `Foreign Project ${runId}`,
      })
      .expect(201);

    const foreignProjectId = foreignProjectResponse.body.data.id as string;

    const response = await firstOwnerAgent
      .post(
        `/api/workspaces/${firstWorkspaceId}` + `/projects/${foreignProjectId}` + '/tasks'
      )
      .send({
        title: 'Cross-workspace task attempt',
      })
      .expect(404);

    assert.equal(response.body.error.code, 'RESOURCE_NOT_FOUND');
    assert.equal(response.body.error.message, 'Project not found in this workspace');
  });

  it('allows duplicate workspace names by generating unique slugs', async () => {
    const duplicatedName = `Duplicate Name ${runId}`;

    const firstResponse = await firstOwnerAgent
      .post('/api/workspaces')
      .send({
        name: duplicatedName,
      })
      .expect(201);

    const secondResponse = await secondOwnerAgent
      .post('/api/workspaces')
      .send({
        name: duplicatedName,
      })
      .expect(201);

    createdWorkspaceIds.push(firstResponse.body.data.id, secondResponse.body.data.id);

    assert.notEqual(firstResponse.body.data.slug, secondResponse.body.data.slug);
  });
});
