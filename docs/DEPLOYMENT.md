# Deployment Guide

This repository keeps the Express backend at the project root and the Next.js frontend in `frontend/`.

## Recommended topology

- **Frontend:** Vercel
- **Backend:** Render
- **Database:** Neon PostgreSQL
- **Runtime API connection:** pooled Neon URL
- **Migration connection:** direct/unpooled Neon URL stored in GitHub Actions

## 1. Deploy the backend

Create the Render service from `render.yaml`, then provide:

- `DATABASE_URL`: pooled Neon runtime connection
- `JWT_SECRET`: a long random value
- `FRONTEND_URL`: the exact Vercel production origin
- `TRUST_PROXY_HOPS=1`: trust only the hosting platform hop used by the included Render setup

Verify:

```text
GET https://<api-host>/health/live
GET https://<api-host>/health/ready
GET https://<api-host>/api-docs
```

## 2. Deploy the frontend

Import the repository into Vercel and set the root directory to `frontend`.

Set:

```env
NEXT_PUBLIC_API_URL=https://<api-host>
```

No `vercel.json` rewrite is required. Vercel detects the Next.js App Router
from `frontend/` and serves static and dynamic routes natively.

## 3. Cookie and cross-origin checks

The backend uses an HttpOnly JWT cookie. In production, validate that:

- both services use HTTPS
- `FRONTEND_URL` exactly matches the browser origin
- requests include credentials
- login sets a `Secure` cookie
- refreshing a protected route restores the user through `/api/auth/me`
- Socket.IO connects with credentials

## 4. Migrations

Keep the existing GitHub Actions migration workflow. Its `DATABASE_URL` secret must be the **direct/unpooled** Neon connection. Do not run migrations through the pooled runtime URL.

## 5. Demo data

Only run the seed against the intended portfolio database:

```bash
DEMO_SEED_CONFIRM=workspaceos-demo \
DEMO_SEED_PASSWORD='<strong-demo-password>' \
npm run db:seed:demo
```

The seed removes and recreates only the workspace with slug `workspaceos-demo`; unrelated application data is untouched.

## 6. Production smoke check

```bash
BASE_URL=https://<api-host> npm run test:smoke
```

Then validate in the browser:

1. login and session restoration
2. workspace/project/task CRUD
3. Kanban drag and drop
4. comments and labels
5. member permissions
6. invitation link flow
7. notifications and audit log
8. two-browser real-time updates
