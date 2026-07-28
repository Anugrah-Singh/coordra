import 'dotenv/config';

const baseUrl = process.env.API_BASE_URL ?? 'http://localhost:8000';

const email = process.env.SMOKE_EMAIL;
const password = process.env.SMOKE_PASSWORD;

const parseResponse = async (response: Response): Promise<unknown> => {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const assertSuccessfulResponse = async (
  name: string,
  response: Response
): Promise<unknown> => {
  const body = await parseResponse(response);

  if (!response.ok) {
    throw new Error(
      `${name} failed with HTTP ${response.status}: ${JSON.stringify(body)}`
    );
  }

  console.log(`✅ ${name}: HTTP ${response.status}`);

  return body;
};

const run = async (): Promise<void> => {
  const liveResponse = await fetch(`${baseUrl}/health/live`);

  await assertSuccessfulResponse('Liveness check', liveResponse);

  const readyResponse = await fetch(`${baseUrl}/health/ready`);

  await assertSuccessfulResponse('Readiness check', readyResponse);

  if (!email || !password) {
    console.log(
      'ℹ️ SMOKE_EMAIL and SMOKE_PASSWORD are not set; authenticated checks were skipped.'
    );
    return;
  }

  const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  await assertSuccessfulResponse('Login check', loginResponse);

  const setCookie = loginResponse.headers.get('set-cookie');

  if (!setCookie) {
    throw new Error('Login succeeded but did not return an auth cookie');
  }

  const authCookie = setCookie.split(';')[0];

  if (!authCookie) {
    throw new Error('Unable to extract authentication cookie');
  }

  const authenticatedHeaders = {
    Cookie: authCookie,
  };

  await assertSuccessfulResponse(
    'Current-user check',
    await fetch(`${baseUrl}/api/auth/me`, {
      headers: authenticatedHeaders,
    })
  );

  await assertSuccessfulResponse(
    'Workspace-list check',
    await fetch(`${baseUrl}/api/workspaces`, {
      headers: authenticatedHeaders,
    })
  );

  await assertSuccessfulResponse(
    'Notification-list check',
    await fetch(`${baseUrl}/api/notifications?page=1&limit=1`, {
      headers: authenticatedHeaders,
    })
  );

  console.log('✅ Backend smoke test completed successfully.');
};

run().catch((error: unknown) => {
  console.error('❌ Backend smoke test failed:', error);
  process.exitCode = 1;
});
