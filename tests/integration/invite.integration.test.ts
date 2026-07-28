import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

import {
  after,
  describe,
  it,
} from 'node:test';

import {
  and,
  eq,
  inArray,
} from 'drizzle-orm';

import request from 'supertest';

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL is required for integration tests'
  );
}

process.env.NODE_ENV = 'test';

process.env.JWT_SECRET ??=
  'integration-test-only-jwt-secret-with-at-least-32-characters';

process.env.FRONTEND_URL ??=
  'http://localhost:3000';

process.env.DB_POOL_MAX ??= '2';

process.env.SHUTDOWN_TIMEOUT_MS ??=
  '1000';

const [
  { createApp },
  { closeDatabase, db },
  { workspaceInvites },
  { users },
  {
    workspaceMembers,
    workspaces,
  },
] = await Promise.all([
  import('../../src/app.js'),
  import('../../src/db/index.js'),
  import('../../src/db/schema/invites.js'),
  import('../../src/db/schema/users.js'),
  import('../../src/db/schema/workspaces.js'),
]);

const app = createApp();

const ownerAgent = request.agent(app);
const inviteeAgent = request.agent(app);
const otherUserAgent = request.agent(app);
const raceUserAgent = request.agent(app);

const runId =
  `${Date.now().toString(36)}-` +
  randomUUID().slice(0, 8);

const password =
  'IntegrationPassword123!';

const ownerEmail =
  `invite-owner-${runId}@example.com`;

const inviteeEmail =
  `invite-target-${runId}@example.com`;

const otherUserEmail =
  `invite-other-${runId}@example.com`;

const raceUserEmail =
  `invite-race-${runId}@example.com`;

const workspaceName =
  `Invite Workspace ${runId}`;

let workspaceId: string | undefined;

const createdUserIds: string[] = [];

const registerAndLogin = async (
  agent: ReturnType<typeof request.agent>,
  data: {
    email: string;
    fullName: string;
  }
): Promise<string> => {
  const registration = await request(app)
    .post('/api/users')
    .send({
      email: data.email,
      password,
      fullName: data.fullName,
    })
    .expect(201);

  const userId =
    registration.body.data.id as string;

  createdUserIds.push(userId);

  await agent
    .post('/api/auth/login')
    .send({
      email: data.email,
      password,
    })
    .expect(200);

  return userId;
};

const createInvite = async (data: {
  email: string;
  role?:
    | 'ADMIN'
    | 'MANAGER'
    | 'MEMBER'
    | 'VIEWER';
}) => {
  assert.ok(workspaceId);

  const response = await ownerAgent
    .post(
      `/api/workspaces/${workspaceId}/invites`
    )
    .send({
      email: data.email,
      role: data.role ?? 'MEMBER',
    })
    .expect(201);

  return {
    invite:
      response.body.data.invite as {
        id: string;
        email: string;
        status: string;
      },

    token:
      response.body.data.token as string,
  };
};

after(async () => {
  try {
    if (workspaceId) {
      await db
        .delete(workspaces)
        .where(
          eq(workspaces.id, workspaceId)
        );
    }

    if (createdUserIds.length > 0) {
      await db
        .delete(users)
        .where(
          inArray(
            users.id,
            createdUserIds
          )
        );
    }
  } finally {
    await closeDatabase();
  }
});

describe(
  'Workspace invite integration',
  () => {
    it(
      'creates the workspace and test users',
      async () => {
        await registerAndLogin(
          ownerAgent,
          {
            email: ownerEmail,
            fullName: 'Invite Owner',
          }
        );

        await registerAndLogin(
          inviteeAgent,
          {
            email: inviteeEmail,
            fullName: 'Invite Target',
          }
        );

        await registerAndLogin(
          otherUserAgent,
          {
            email: otherUserEmail,
            fullName: 'Other User',
          }
        );

        await registerAndLogin(
          raceUserAgent,
          {
            email: raceUserEmail,
            fullName: 'Race User',
          }
        );

        const workspaceCreation =
          await ownerAgent
            .post('/api/workspaces')
            .send({
              name: workspaceName,
            })
            .expect(201);

        workspaceId =
          workspaceCreation.body.data.id;

        assert.ok(workspaceId);
      }
    );

    it(
      'prevents duplicate active invitations',
      async () => {
        const firstInvite =
          await createInvite({
            email: inviteeEmail,
            role: 'MEMBER',
          });

        assert.equal(
          firstInvite.invite.status,
          'PENDING'
        );

        await ownerAgent
          .post(
            `/api/workspaces/${workspaceId}/invites`
          )
          .send({
            email: inviteeEmail,
            role: 'MEMBER',
          })
          .expect(409);

        await ownerAgent
          .delete(
            `/api/workspaces/${workspaceId}` +
              `/invites/${firstInvite.invite.id}`
          )
          .expect(200);
      }
    );

    it(
      'rejects invite acceptance by a different email address',
      async () => {
        const { invite, token } =
          await createInvite({
            email: inviteeEmail,
          });

        await otherUserAgent
          .post(
            `/api/workspace-invites/${token}/accept`
          )
          .expect(403);

        const [storedInvite] = await db
          .select({
            status:
              workspaceInvites.status,
          })
          .from(workspaceInvites)
          .where(
            eq(
              workspaceInvites.id,
              invite.id
            )
          )
          .limit(1);

        assert.equal(
          storedInvite?.status,
          'PENDING'
        );

        await ownerAgent
          .delete(
            `/api/workspaces/${workspaceId}` +
              `/invites/${invite.id}`
          )
          .expect(200);
      }
    );

    it(
      'accepts an invitation and prevents duplicate acceptance',
      async () => {
        const { invite, token } =
          await createInvite({
            email: inviteeEmail,
            role: 'MANAGER',
          });

        const acceptance =
          await inviteeAgent
            .post(
              `/api/workspace-invites/${token}/accept`
            )
            .expect(200);

        assert.equal(
          acceptance.body.data
            .invite.status,
          'ACCEPTED'
        );

        assert.equal(
          acceptance.body.data
            .membership.role,
          'MANAGER'
        );

        await inviteeAgent
          .post(
            `/api/workspace-invites/${token}/accept`
          )
          .expect(400);

        const [membership] = await db
          .select({
            role: workspaceMembers.role,
            removedAt:
              workspaceMembers.removedAt,
          })
          .from(workspaceMembers)
          .where(
            and(
              eq(
                workspaceMembers.workspaceId,
                workspaceId!
              ),
              eq(
                workspaceMembers.userId,
                createdUserIds[1]!
              )
            )
          )
          .limit(1);

        assert.equal(
          membership?.role,
          'MANAGER'
        );

        assert.equal(
          membership?.removedAt,
          null
        );

        const [storedInvite] = await db
          .select({
            id: workspaceInvites.id,
            status:
              workspaceInvites.status,
          })
          .from(workspaceInvites)
          .where(
            eq(
              workspaceInvites.id,
              invite.id
            )
          )
          .limit(1);

        assert.equal(
          storedInvite?.status,
          'ACCEPTED'
        );
      }
    );

    it(
      'reactivates a previously removed member',
      async () => {
        assert.ok(workspaceId);

        const [membership] = await db
          .select({
            id: workspaceMembers.id,
          })
          .from(workspaceMembers)
          .where(
            and(
              eq(
                workspaceMembers.workspaceId,
                workspaceId
              ),
              eq(
                workspaceMembers.userId,
                createdUserIds[1]!
              )
            )
          )
          .limit(1);

        assert.ok(membership);

        await ownerAgent
          .delete(
            `/api/workspaces/${workspaceId}` +
              `/members/${membership.id}`
          )
          .expect(200);

        const { token } =
          await createInvite({
            email: inviteeEmail,
            role: 'VIEWER',
          });

        const acceptance =
          await inviteeAgent
            .post(
              `/api/workspace-invites/${token}/accept`
            )
            .expect(200);

        assert.equal(
          acceptance.body.data
            .membership.id,
          membership.id
        );

        assert.equal(
          acceptance.body.data
            .membership.role,
          'VIEWER'
        );

        assert.equal(
          acceptance.body.data
            .membership.removedAt,
          null
        );
      }
    );

    it(
      'persists the EXPIRED status for an expired invite',
      async () => {
        const { invite, token } =
          await createInvite({
            email: otherUserEmail,
          });

        await db
          .update(workspaceInvites)
          .set({
            expiresAt: new Date(
              Date.now() - 60_000
            ),
          })
          .where(
            eq(
              workspaceInvites.id,
              invite.id
            )
          );

        await otherUserAgent
          .post(
            `/api/workspace-invites/${token}/accept`
          )
          .expect(400);

        const [expiredInvite] = await db
          .select({
            status:
              workspaceInvites.status,
          })
          .from(workspaceInvites)
          .where(
            eq(
              workspaceInvites.id,
              invite.id
            )
          )
          .limit(1);

        assert.equal(
          expiredInvite?.status,
          'EXPIRED'
        );
      }
    );

    it(
      'allows only one concurrent terminal transition',
      async () => {
        const { invite, token } =
          await createInvite({
            email: raceUserEmail,
          });

        const [
          acceptResult,
          declineResult,
        ] = await Promise.all([
          raceUserAgent
            .post(
              `/api/workspace-invites/${token}/accept`
            )
            .then(
              (response) =>
                response.status
            ),

          raceUserAgent
            .post(
              `/api/workspace-invites/${token}/decline`
            )
            .then(
              (response) =>
                response.status
            ),
        ]);

        const statuses = [
          acceptResult,
          declineResult,
        ].sort();

        assert.equal(
          statuses.filter(
            (status) => status === 200
          ).length,
          1
        );

        assert.equal(
          statuses.filter(
            (status) =>
              status === 400 ||
              status === 409
          ).length,
          1
        );

        const [storedInvite] = await db
          .select({
            status:
              workspaceInvites.status,
          })
          .from(workspaceInvites)
          .where(
            eq(
              workspaceInvites.id,
              invite.id
            )
          )
          .limit(1);

        assert.ok(
          storedInvite?.status ===
            'ACCEPTED' ||
            storedInvite?.status ===
              'DECLINED'
        );
      }
    );

    it(
      'allows the owner to delete the test workspace',
      async () => {
        assert.ok(workspaceId);

        const deletion =
          await ownerAgent
            .delete(
              `/api/workspaces/${workspaceId}`
            )
            .send({
              confirmationName:
                workspaceName,
            })
            .expect(200);

        assert.equal(
          deletion.body.data.id,
          workspaceId
        );
      }
    );
  }
);