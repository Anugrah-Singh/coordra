import assert from 'node:assert/strict';

import { describe, it } from 'node:test';

import request from 'supertest';

process.env.NODE_ENV = 'test';

process.env.DATABASE_URL = 'postgresql://test:test@127.0.0.1:5432/test';

process.env.JWT_SECRET = 'test-only-jwt-secret-that-is-at-least-32-characters';

const frontendOrigin = 'http://localhost:3000';

process.env.FRONTEND_URL = `${frontendOrigin}/`;

process.env.DB_POOL_MAX = '1';

process.env.SHUTDOWN_TIMEOUT_MS = '1000';

const { APP_ERROR_CODES } = await import('../src/utils/AppError.js');

const { createApp } = await import('../src/app.js');

const app = createApp();

describe('Backend HTTP foundation', () => {
  it('returns a successful liveness response', async () => {
    const response = await request(app)
      .get('/health/live')
      .expect('Content-Type', /json/)
      .expect(200);

    assert.equal(response.body.status, 'alive');

    assert.equal(typeof response.body.timestamp, 'string');

    assert.equal(typeof response.body.uptimeSeconds, 'number');
  });

  it('reports not-ready before server startup', async () => {
    const response = await request(app)
      .get('/health/ready')
      .expect('Content-Type', /json/)
      .expect(503);

    assert.deepEqual(
      {
        status: response.body.status,

        reason: response.body.reason,
      },
      {
        status: 'not-ready',

        reason: 'Server is starting',
      }
    );
  });

  it('supports the backwards-compatible health endpoint', async () => {
    const response = await request(app)
      .get('/health')
      .expect('Content-Type', /json/)
      .expect(200);

    assert.equal(response.body.status, 'ok');
  });

  it('rejects protected routes without authentication', async () => {
    const response = await request(app)
      .get('/api/workspaces')
      .expect('Content-Type', /json/)
      .expect(401);

    assert.deepEqual(response.body, {
      success: false,

      code: APP_ERROR_CODES.AUTHENTICATION_REQUIRED,

      message: 'Authentication required',
    });
  });

  it('rejects malformed login requests', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'not-an-email',

        password: '',
      })
      .expect('Content-Type', /json/)
      .expect(400);

    assert.equal(response.body.success, false);

    assert.equal(response.body.code, APP_ERROR_CODES.VALIDATION_ERROR);

    assert.equal(response.body.message, 'Validation failed');

    assert.ok(Array.isArray(response.body.errors));
  });

  it('rejects invalid user registration input', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({
        email: 'not-an-email',

        password: '123',

        fullName: '',
      })
      .expect('Content-Type', /json/)
      .expect(400);

    assert.equal(response.body.success, false);

    assert.equal(response.body.code, APP_ERROR_CODES.VALIDATION_ERROR);

    assert.equal(response.body.message, 'Validation failed');

    assert.ok(Array.isArray(response.body.errors));
  });

  it('rejects JSON bodies larger than 100kb', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({
        payload: 'x'.repeat(110 * 1024),
      })
      .expect('Content-Type', /json/)
      .expect(413);

    assert.deepEqual(response.body, {
      success: false,

      code: APP_ERROR_CODES.PAYLOAD_TOO_LARGE,

      message: 'Request body is too large.',
    });
  });

  it('returns a JSON response for unknown routes', async () => {
    const response = await request(app)
      .get('/api/does-not-exist')
      .expect('Content-Type', /json/)
      .expect(404);

    assert.deepEqual(response.body, {
      success: false,

      code: APP_ERROR_CODES.ROUTE_NOT_FOUND,

      message: 'Route not found: ' + 'GET /api/does-not-exist',
    });
  });

  it('allows safe API methods without an Origin header', async () => {
    const response = await request(app)
      .get('/api/workspaces')
      .expect('Content-Type', /json/)
      .expect(401);

    assert.equal(response.body.code, APP_ERROR_CODES.AUTHENTICATION_REQUIRED);
  });

  it('allows state-changing requests from the configured frontend origin', async () => {
    const response = await request(app)
      .post('/api/users')
      .set('Origin', frontendOrigin)
      .send({
        email: 'invalid-email',

        password: '123',

        fullName: '',
      })
      .expect('Content-Type', /json/)
      .expect(400);

    assert.equal(response.body.code, APP_ERROR_CODES.VALIDATION_ERROR);
  });

  it('rejects state-changing requests from an untrusted origin', async () => {
    const response = await request(app)
      .post('/api/users')
      .set('Origin', 'https://attacker.example')
      .send({
        email: 'user@example.com',

        password: 'safe-test-password',

        fullName: 'Test User',
      })
      .expect('Content-Type', /json/)
      .expect(403);

    assert.deepEqual(response.body, {
      success: false,
      code: APP_ERROR_CODES.FORBIDDEN,
      message: 'Request origin is not allowed',
    });
  });

  it('accepts the configured frontend through the Referer fallback', async () => {
    const response = await request(app)
      .post('/api/users')
      .set('Referer', `${frontendOrigin}/register`)
      .send({
        email: 'invalid-email',

        password: '123',

        fullName: '',
      })
      .expect('Content-Type', /json/)
      .expect(400);

    assert.equal(response.body.code, APP_ERROR_CODES.VALIDATION_ERROR);
  });

  it('rejects an invalid Referer on a state-changing request', async () => {
    const response = await request(app)
      .post('/api/users')
      .set('Referer', 'not-a-valid-url')
      .send({
        email: 'user@example.com',

        password: 'safe-test-password',

        fullName: 'Test User',
      })
      .expect('Content-Type', /json/)
      .expect(403);

    assert.deepEqual(response.body, {
      success: false,
      code: APP_ERROR_CODES.FORBIDDEN,
      message: 'Request origin could not be verified',
    });
  });

  it('does not expose JWT verification errors', async () => {
    const response = await request(app)
      .get('/api/workspaces')
      .set('Cookie', 'auth_token=definitely-not-a-valid-jwt')
      .expect('Content-Type', /json/)
      .expect(401);

    assert.deepEqual(response.body, {
      success: false,

      code: APP_ERROR_CODES.INVALID_AUTH_TOKEN,

      message: 'Invalid or expired token',
    });

    assert.equal('real_reason' in response.body, false);

    assert.equal('stack' in response.body, false);
  });

  it('rejects registration passwords shorter than 12 characters', async () => {
    const response = await request(app)
      .post('/api/users')
      .set('Origin', frontendOrigin)
      .send({
        email: 'user@example.com',

        password: 'short123',

        fullName: 'Test User',
      })
      .expect('Content-Type', /json/)
      .expect(400);

    assert.ok(
      response.body.errors.some(
        (error: { field: string; message: string }) =>
          error.field === 'body.password' &&
          error.message.includes('at least 12 characters')
      )
    );
  });

  it('rejects excessively long registration passwords', async () => {
    const response = await request(app)
      .post('/api/users')
      .set('Origin', frontendOrigin)
      .send({
        email: 'user@example.com',

        password: 'x'.repeat(129),

        fullName: 'Test User',
      })
      .expect('Content-Type', /json/)
      .expect(400);

    assert.ok(
      response.body.errors.some(
        (error: { field: string; message: string }) =>
          error.field === 'body.password' &&
          error.message.includes('cannot exceed 128 characters')
      )
    );
  });
});
