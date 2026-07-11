import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import {
  after,
  describe,
  it,
} from 'node:test';

import {
  eq,
  inArray,
} from 'drizzle-orm';

import request from 'supertest';

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL is required for integration tests'
  );
}

// These must be assigned before importing application modules
// because env.ts validates configuration during module loading.
process.env.NODE_ENV = 'test';

process.env.JWT_SECRET ??=
  'integration-test-only-jwt-secret-with-at-least-32-characters';

process.env.FRONTEND_URL ??=
  'http://localhost:5173';

process.env.DB_POOL_MAX ??= '2';

process.env.SHUTDOWN_TIMEOUT_MS ??=
  '1000';

const [
  { createApp },
  { closeDatabase, db },
  { users },
  { workspaces },
] = await Promise.all([
  import('../../src/app.js'),
  import('../../src/db/index.js'),
  import('../../src/db/schema/users.js'),
  import('../../src/db/schema/workspaces.js'),
]);

const app = createApp();

const ownerAgent = request.agent(app);
const memberAgent = request.agent(app);

const runId =
  `${Date.now().toString(36)}-` +
  randomUUID().slice(0, 8);

const ownerEmail =
  `workspace-owner-${runId}@example.com`;

const memberEmail =
  `workspace-member-${runId}@example.com`;

const password =
  'IntegrationPassword123!';

const originalWorkspaceName =
  `Integration Workspace ${runId}`;

const updatedWorkspaceName =
  `Updated Workspace ${runId}`;

let ownerUserId: string | undefined;
let memberUserId: string | undefined;
let workspaceId: string | undefined;

after(async () => {
  try {
    // The API test normally deletes the workspace.
    // This fallback keeps the branch clean when an
    // assertion fails before deletion.
    if (workspaceId) {
      await db
        .delete(workspaces)
        .where(
          eq(workspaces.id, workspaceId)
        );
    }

    const userIds = [
      ownerUserId,
      memberUserId,
    ].filter(
      (id): id is string =>
        id !== undefined
    );

    if (userIds.length > 0) {
      await db
        .delete(users)
        .where(
          inArray(users.id, userIds)
        );
    }
  } finally {
    await closeDatabase();
  }
});

describe(
  'Workspace HTTP integration',
  () => {
    it(
      'enforces membership, authorization, removal, and owner-only deletion',
      async () => {
        const ownerRegistration =
          await request(app)
            .post('/api/users')
            .send({
              email: ownerEmail,
              password,
              fullName:
                'Integration Owner',
            })
            .expect(201);

        ownerUserId =
          ownerRegistration.body.data.id;

        assert.equal(
          ownerRegistration.body.data.email,
          ownerEmail
        );

        await ownerAgent
          .post('/api/auth/login')
          .send({
            email: ownerEmail,
            password,
          })
          .expect(200);

        const workspaceCreation =
          await ownerAgent
            .post('/api/workspaces')
            .send({
              name:
                originalWorkspaceName,
            })
            .expect(201);

        workspaceId =
          workspaceCreation.body.data.id;

        assert.equal(
          workspaceCreation.body.data.name,
          originalWorkspaceName
        );

        const ownerWorkspaceRead =
          await ownerAgent
            .get(
              `/api/workspaces/${workspaceId}`
            )
            .expect(200);

        assert.equal(
          ownerWorkspaceRead.body.data.id,
          workspaceId
        );

        const memberRegistration =
          await request(app)
            .post('/api/users')
            .send({
              email: memberEmail,
              password,
              fullName:
                'Integration Member',
            })
            .expect(201);

        memberUserId =
          memberRegistration.body.data.id;

        const memberAddition =
          await ownerAgent
            .post(
              `/api/workspaces/${workspaceId}/members`
            )
            .send({
              email: memberEmail,
              role: 'MEMBER',
            })
            .expect(201);

        const membershipId =
          memberAddition.body.data
            .membershipId as string;

        assert.ok(membershipId);

        await memberAgent
          .post('/api/auth/login')
          .send({
            email: memberEmail,
            password,
          })
          .expect(200);

        // Active members can read the workspace.
        await memberAgent
          .get(
            `/api/workspaces/${workspaceId}`
          )
          .expect(200);

        // MEMBER is below the required ADMIN role.
        await memberAgent
          .patch(
            `/api/workspaces/${workspaceId}`
          )
          .send({
            name:
              'Unauthorized Workspace Name',
          })
          .expect(403);

        // Only OWNER can delete a workspace.
        await memberAgent
          .delete(
            `/api/workspaces/${workspaceId}`
          )
          .send({
            confirmationName:
              originalWorkspaceName,
          })
          .expect(403);

        const workspaceUpdate =
          await ownerAgent
            .patch(
              `/api/workspaces/${workspaceId}`
            )
            .send({
              name:
                updatedWorkspaceName,
            })
            .expect(200);

        assert.equal(
          workspaceUpdate.body.data.name,
          updatedWorkspaceName
        );

        // The owner removes the member.
        await ownerAgent
          .delete(
            `/api/workspaces/${workspaceId}/members/${membershipId}`
          )
          .expect(200);

        const removedMemberWorkspaces =
          await memberAgent
            .get('/api/workspaces')
            .expect(200);

        assert.ok(
          Array.isArray(
            removedMemberWorkspaces.body.data
          )
        );

        assert.equal(
          removedMemberWorkspaces.body.data.some(
            (workspace: {
              id: string;
            }) =>
              workspace.id === workspaceId
          ),
          false
        );

        // Removed members no longer pass workspace RBAC.
        await memberAgent
          .get(
            `/api/workspaces/${workspaceId}`
          )
          .expect(403);

        // Confirmation must match the current name.
        await ownerAgent
          .delete(
            `/api/workspaces/${workspaceId}`
          )
          .send({
            confirmationName:
              originalWorkspaceName,
          })
          .expect(400);

        const deletion =
          await ownerAgent
            .delete(
              `/api/workspaces/${workspaceId}`
            )
            .send({
              confirmationName:
                updatedWorkspaceName,
            })
            .expect(200);

        assert.equal(
          deletion.body.data.id,
          workspaceId
        );

        const ownerWorkspaces =
          await ownerAgent
            .get('/api/workspaces')
            .expect(200);

        assert.equal(
          ownerWorkspaces.body.data.some(
            (workspace: {
              id: string;
            }) =>
              workspace.id === workspaceId
          ),
          false
        );
      }
    );
  }
);