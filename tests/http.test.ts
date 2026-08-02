import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import request from 'supertest';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@127.0.0.1:5432/test';
process.env.JWT_SECRET = 'test-only-jwt-secret-that-is-at-least-32-characters';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.DB_POOL_MAX = '1';
process.env.SHUTDOWN_TIMEOUT_MS = '1000';

const { APP_ERROR_CODES } = await import('../src/utils/AppError.js');
const { createApp } = await import('../src/app.js');
const app = createApp();

const expectError = (body: unknown, code: string, message?: string): void => {
  assert.equal(typeof body, 'object');
  const envelope = body as {
    error: { code: string; message: string; fields: Record<string, string> };
  };
  assert.equal(envelope.error.code, code);
  if (message) assert.equal(envelope.error.message, message);
  assert.equal(typeof envelope.error.fields, 'object');
};

describe('HTTP foundation', () => {
  it('reports liveness and startup readiness', async () => {
    const live = await request(app).get('/health/live').expect(200);
    assert.equal(live.body.status, 'alive');
    assert.equal(typeof live.body.uptimeSeconds, 'number');

    const ready = await request(app).get('/health/ready').expect(503);
    assert.equal(ready.body.status, 'not-ready');
    assert.equal(ready.body.reason, 'Server is starting');
  });

  it('uses the standard authentication error envelope', async () => {
    const response = await request(app).get('/api/workspaces').expect(401);
    expectError(
      response.body,
      APP_ERROR_CODES.AUTHENTICATION_REQUIRED,
      'Authentication required'
    );
  });

  it('validates login and registration with field errors', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'not-an-email', password: '' })
      .expect(400);
    expectError(login.body, APP_ERROR_CODES.VALIDATION_ERROR, 'Validation failed');
    assert.ok(Object.keys(login.body.error.fields).length > 0);

    const registration = await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: '123', fullName: '' })
      .expect(400);
    expectError(registration.body, APP_ERROR_CODES.VALIDATION_ERROR);
    assert.ok(Object.keys(registration.body.error.fields).length > 0);
  });

  it('rejects oversized request bodies', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ payload: 'x'.repeat(110 * 1024) })
      .expect(413);
    expectError(response.body, APP_ERROR_CODES.PAYLOAD_TOO_LARGE);
  });

  it('returns the standard route-not-found envelope', async () => {
    const response = await request(app).get('/api/does-not-exist').expect(404);
    expectError(response.body, APP_ERROR_CODES.ROUTE_NOT_FOUND);
  });

  it('allows safe requests without Origin and trusted unsafe requests', async () => {
    await request(app).get('/api/workspaces').expect(401);
    const response = await request(app)
      .post('/api/auth/register')
      .set('Origin', 'http://localhost:3000')
      .send({ email: 'bad', password: '123', fullName: '' })
      .expect(400);
    expectError(response.body, APP_ERROR_CODES.VALIDATION_ERROR);
  });

  it('rejects untrusted or malformed origins', async () => {
    const attacker = await request(app)
      .post('/api/auth/register')
      .set('Origin', 'https://attacker.example')
      .send({
        email: 'user@example.com',
        password: 'safe-test-password',
        fullName: 'User',
      })
      .expect(403);
    expectError(attacker.body, APP_ERROR_CODES.FORBIDDEN);

    const malformed = await request(app)
      .post('/api/auth/register')
      .set('Referer', 'not-a-valid-url')
      .send({
        email: 'user@example.com',
        password: 'safe-test-password',
        fullName: 'User',
      })
      .expect(403);
    expectError(malformed.body, APP_ERROR_CODES.FORBIDDEN);
  });

  it('does not expose JWT verification internals', async () => {
    const response = await request(app)
      .get('/api/workspaces')
      .set('Cookie', 'auth_token=definitely-not-a-valid-jwt')
      .expect(401);
    expectError(response.body, APP_ERROR_CODES.INVALID_AUTH_TOKEN);
    assert.equal('real_reason' in response.body.error, false);
  });
});
