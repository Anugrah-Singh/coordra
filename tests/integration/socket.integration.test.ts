import assert from 'node:assert/strict';
import './setup.js';
import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';

import { after, before, describe, it } from 'node:test';

import { eq, inArray } from 'drizzle-orm';

import request from 'supertest';

import { io as createSocketClient, type Socket } from 'socket.io-client';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required for integration tests');
}

const [
  { createApp },
  { closeDatabase, db },
  { closeSocketServer, initSocket },
  { users },
  { workspaces },
] = await Promise.all([
  import('../../src/app.js'),
  import('../../src/db/index.js'),
  import('../../src/socket.js'),
  import('../../src/db/schema/users.js'),
  import('../../src/db/schema/workspaces.js'),
]);

const app = createApp();
const httpServer = createServer(app);

const ownerAgent = request.agent(app);

const runId = `${Date.now().toString(36)}-` + randomUUID().slice(0, 8);

const ownerEmail = `socket-owner-${runId}@example.com`;

const outsiderEmail = `socket-outsider-${runId}@example.com`;

const password = 'IntegrationPassword123!';

const workspaceName = `Socket Workspace ${runId}`;

let baseUrl = '';

let ownerUserId: string | undefined;
let outsiderUserId: string | undefined;
let workspaceId: string | undefined;

let ownerCookie = '';
let outsiderCookie = '';

const activeSockets: Socket[] = [];

const extractCookie = (setCookieHeader: string | string[] | undefined): string => {
  const firstHeader = Array.isArray(setCookieHeader)
    ? setCookieHeader[0]
    : setCookieHeader;

  const cookie = firstHeader?.split(';')[0];

  if (!cookie) {
    throw new Error('Login response did not include an auth cookie');
  }

  return cookie;
};

const connectAuthenticatedSocket = async (cookie: string): Promise<Socket> => {
  const socket = createSocketClient(baseUrl, {
    autoConnect: false,
    reconnection: false,

    extraHeaders: {
      Cookie: cookie,
    },
  });

  activeSockets.push(socket);

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Timed out while connecting Socket.IO client'));
    }, 5_000);

    socket.once('connect', () => {
      clearTimeout(timeout);
      resolve();
    });

    socket.once('connect_error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });

    socket.connect();
  });

  return socket;
};

const waitForEvent = <T>(socket: Socket, eventName: string): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => {
      socket.off(eventName, handleEvent);

      reject(new Error(`Timed out waiting for ${eventName}`));
    }, 5_000);

    const handleEvent = (payload: T) => {
      clearTimeout(timeout);
      resolve(payload);
    };

    socket.once(eventName, handleEvent);
  });
};

before(async () => {
  initSocket(httpServer);

  await new Promise<void>((resolve, reject) => {
    const handleError = (error: Error) => {
      reject(error);
    };

    httpServer.once('error', handleError);

    httpServer.listen(0, '127.0.0.1', () => {
      httpServer.off('error', handleError);

      const address = httpServer.address();

      if (!address || typeof address === 'string') {
        reject(new Error('Unable to resolve test server port'));

        return;
      }

      baseUrl = `http://127.0.0.1:${address.port}`;

      resolve();
    });
  });

  const ownerRegistration = await request(app)
    .post('/api/auth/register')
    .send({
      email: ownerEmail,
      password,
      fullName: 'Socket Owner',
    })
    .expect(201);

  ownerUserId = ownerRegistration.body.data.id;

  const ownerLogin = await ownerAgent
    .post('/api/auth/login')
    .send({
      email: ownerEmail,
      password,
    })
    .expect(200);

  ownerCookie = extractCookie(ownerLogin.headers['set-cookie']);

  const workspaceCreation = await ownerAgent
    .post('/api/workspaces')
    .send({
      name: workspaceName,
    })
    .expect(201);

  workspaceId = workspaceCreation.body.data.id;

  const outsiderRegistration = await request(app)
    .post('/api/auth/register')
    .send({
      email: outsiderEmail,
      password,
      fullName: 'Socket Outsider',
    })
    .expect(201);

  outsiderUserId = outsiderRegistration.body.data.id;

  const outsiderLogin = await request(app)
    .post('/api/auth/login')
    .send({
      email: outsiderEmail,
      password,
    })
    .expect(200);

  outsiderCookie = extractCookie(outsiderLogin.headers['set-cookie']);
});

after(async () => {
  for (const socket of activeSockets) {
    socket.disconnect();
  }

  try {
    if (workspaceId) {
      await db.delete(workspaces).where(eq(workspaces.id, workspaceId));
    }

    const userIds = [ownerUserId, outsiderUserId].filter(
      (id): id is string => id !== undefined
    );

    if (userIds.length > 0) {
      await db.delete(users).where(inArray(users.id, userIds));
    }
  } finally {
    await closeSocketServer();
    await closeDatabase();
  }
});

describe('Socket.IO integration', () => {
  it('rejects unauthenticated connections', async () => {
    const socket = createSocketClient(baseUrl, {
      autoConnect: false,
      reconnection: false,
    });

    activeSockets.push(socket);

    const error = await new Promise<Error>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Expected socket authentication failure'));
      }, 5_000);

      socket.once('connect_error', (connectionError) => {
        clearTimeout(timeout);
        resolve(connectionError);
      });

      socket.connect();
    });

    assert.equal(error.message, 'Authentication required');

    assert.equal(socket.connected, false);
  });

  it('allows a workspace member to join the workspace room', async () => {
    assert.ok(workspaceId);

    const socket = await connectAuthenticatedSocket(ownerCookie);

    const joinedEvent = waitForEvent<{
      workspaceId: string;
      role: string;
    }>(socket, 'workspace:joined');

    socket.emit('workspace:join', workspaceId);

    const payload = await joinedEvent;

    assert.deepEqual(payload, {
      workspaceId,
      role: 'OWNER',
    });
  });

  it('denies an authenticated non-member from joining the workspace room', async () => {
    assert.ok(workspaceId);

    const socket = await connectAuthenticatedSocket(outsiderCookie);

    const errorEvent = waitForEvent<{
      message: string;
    }>(socket, 'workspace:error');

    socket.emit('workspace:join', workspaceId);

    const payload = await errorEvent;

    assert.equal(payload.message, 'You do not have access to this workspace');
  });

  it('delivers workspace change events to joined workspace members', async () => {
    assert.ok(workspaceId);

    const socket = await connectAuthenticatedSocket(ownerCookie);

    const joinedEvent = waitForEvent(socket, 'workspace:joined');

    socket.emit('workspace:join', workspaceId);

    await joinedEvent;

    const projectCreation = await ownerAgent
      .post(`/api/workspaces/${workspaceId}/projects`)
      .send({
        name: `Socket Project ${runId}`,
      })
      .expect(201);

    const projectId = projectCreation.body.data.id as string;

    const taskEvent = waitForEvent<{
      workspaceId: string;
      projectId: string;
      task: {
        id: string;
        title: string;
      };
    }>(socket, 'workspace:changed');

    const taskCreation = await ownerAgent
      .post(`/api/workspaces/${workspaceId}` + `/projects/${projectId}/tasks`)
      .send({
        title: `Socket Task ${runId}`,
        priority: 'MEDIUM',
      })
      .expect(201);

    const payload = await taskEvent;

    assert.equal(payload.workspaceId, workspaceId);

    assert.equal(payload.projectId, projectId);

    assert.equal(payload.task.id, taskCreation.body.data.id);

    assert.equal(payload.task.title, `Socket Task ${runId}`);
  });
});
