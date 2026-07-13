# WorkspaceOS — SaaS Team Workspace

A recruiter-ready, multi-tenant team collaboration platform built with React, Express, TypeScript, PostgreSQL, Drizzle ORM, Neon, and Socket.IO.

WorkspaceOS combines a polished project-management interface with backend engineering features that are typically hidden in portfolio projects: tenant-isolated queries, hierarchical RBAC, secure cookie authentication, audit logging, authenticated real-time rooms, production-safe migrations, and ephemeral preview databases in CI.

> **Repository status:** the backend API, React frontend, Swagger documentation, demo seed, CI workflows, and deployment templates are included. Live URLs and screenshots should be added after deploying your own fork.

## Product tour

A user can:

- register, sign in, and restore a cookie-backed session
- create and switch between isolated workspaces
- create projects and manage tasks on a five-column Kanban board
- drag tasks between Backlog, To do, In progress, Blocked, and Done
- assign tasks, set priorities and due dates, archive, unarchive, and duplicate work
- add comments and workspace labels
- invite teammates and manage hierarchical roles
- view notifications and workspace audit activity
- see collaboration updates through Socket.IO without refreshing

## Engineering highlights

- **Multi-tenant isolation:** workspace IDs are enforced throughout routes, RBAC middleware, and database queries.
- **Hierarchical authorization:** `OWNER → ADMIN → MANAGER → MEMBER → VIEWER`.
- **Secure authentication:** bcrypt passwords, JWT in an HttpOnly cookie, secure production cookie settings, credentialed CORS, and Origin/Referer validation.
- **Database integrity:** required project-task relationships, cascading cleanup, transactional workspace ownership, and audit records.
- **Real-time collaboration:** authenticated Socket.IO connections, user rooms, workspace rooms, and cache invalidation on live events.
- **Production migration workflow:** direct Neon connections for migrations and pooled connections for the running API.
- **Preview databases:** pull requests can create isolated Neon branches, apply Drizzle migrations, run integration tests, and clean up afterward.
- **Recruiter-friendly API inspection:** Swagger UI at `/api-docs` and raw OpenAPI JSON at `/api-docs.json`.

## Architecture

```text
Browser
  ├─ React 19 + Vite + TypeScript
  ├─ TanStack Query + Axios
  ├─ React Router
  ├─ dnd-kit Kanban interactions
  └─ Socket.IO Client
          │ HTTPS / WebSocket (HttpOnly auth cookie)
          ▼
Express 5 + Socket.IO
  ├─ security / authentication / validation
  ├─ workspace RBAC and tenant checks
  ├─ controllers
  ├─ transactional services
  └─ Drizzle ORM
          │
          ▼
Neon PostgreSQL
```

### CI/CD database strategy

```text
Pull request
  → GitHub Actions
  → Neon ephemeral branch
  → Drizzle migrations over direct connection
  → authenticated integration tests
  → merge or branch cleanup

Runtime API → pooled Neon connection
Migrations  → direct/unpooled Neon connection
```

## Technology stack

### Frontend

- React 19 and TypeScript
- Vite
- React Router
- TanStack Query
- Axios
- React Hook Form and Zod
- dnd-kit
- Socket.IO Client
- Lucide icons and Sonner toasts

### Backend

- Node.js 24 LTS and TypeScript
- Express 5
- PostgreSQL and Neon
- Drizzle ORM
- Zod
- Socket.IO
- JWT, bcrypt, Helmet, CORS, and express-rate-limit
- Supertest and the Node test runner through `tsx`

## Repository structure

```text
.
├── frontend/                 # React application
├── src/                      # Express and Socket.IO backend
│   ├── config/
│   ├── controllers/
│   ├── db/schema/
│   ├── docs/openapi.ts
│   ├── middlewares/
│   ├── routes/
│   ├── schemas/
│   ├── services/
│   └── utils/
├── drizzle/                  # immutable migration history
├── scripts/
│   ├── seed-demo.ts
│   └── smoke-test.ts
├── tests/
│   └── integration/
├── .github/workflows/
├── docs/DEPLOYMENT.md
└── render.yaml
```

## Local setup

### Prerequisites

- Node.js `24.18.0` (`.nvmrc` is included)
- a Neon PostgreSQL database
- pooled and direct Neon connection strings

### 1. Install dependencies

```bash
nvm use
npm ci
npm --prefix frontend ci
```

### 2. Configure the backend

```bash
cp .env.example .env
```

Set at least:

```env
NODE_ENV=development
PORT=8000
DATABASE_URL=<pooled-neon-runtime-url>
JWT_SECRET=<random-value-at-least-32-characters>
FRONTEND_URL=http://localhost:5173
TRUST_PROXY_HOPS=0
```

### 3. Configure the frontend

```bash
cp frontend/.env.example frontend/.env
```

```env
VITE_API_URL=http://localhost:8000
```

The browser never stores the JWT. Axios and Socket.IO send the backend’s HttpOnly cookie with credentials.

### 4. Apply migrations

Use the **direct/unpooled** Neon connection temporarily as `DATABASE_URL` for migration execution:

```bash
npm run db:migrate
```

Do not modify an already-applied migration. After changing a Drizzle schema, create a new migration with:

```bash
npm run db:generate
```

### 5. Start both applications

Terminal one:

```bash
npm run dev
```

Terminal two:

```bash
npm run frontend:dev
```

Open `http://localhost:5173`.

## Demo data

The seed is idempotent and intentionally guarded. It deletes and recreates only the workspace with slug `workspaceos-demo`; unrelated records are not touched.

```bash
DEMO_SEED_CONFIRM=workspaceos-demo \
DEMO_SEED_PASSWORD='Use-A-Strong-Demo-Password' \
npm run db:seed:demo
```

Demo accounts:

```text
owner@taskspace.demo
admin@taskspace.demo
member@taskspace.demo
viewer@taskspace.demo
```

All four use the value supplied through `DEMO_SEED_PASSWORD`.

Set `DEMO_MODE=true` only in the portfolio/demo deployment when authorized users should receive a copyable invitation link after creating an invite. Keep it `false` for a normal production environment.

## Commands

```bash
# Backend
npm run typecheck
npm run test:typecheck
npm test
npm run test:integration
npm run test:coverage
npm run build
npm run backend:verify

# Frontend
npm run frontend:typecheck
npm run frontend:build

# Both
npm run verify
```

Integration tests require a migrated test/preview database. Database-independent backend verification and the frontend build run without one.

## API documentation

With the backend running:

```text
Swagger UI:  http://localhost:8000/api-docs
OpenAPI JSON: http://localhost:8000/api-docs.json
```

Documented areas include authentication, users, workspaces, members, ownership transfer, projects, tasks, comments, labels, invitations, notifications, and audit logs.

The stable error envelope is:

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "Validation failed",
  "errors": []
}
```

## Main routes

```text
/
/login
/register
/invite/:token
/app
/app/workspaces/:workspaceId
/app/workspaces/:workspaceId/projects
/app/workspaces/:workspaceId/projects/:projectId
/app/workspaces/:workspaceId/members
/app/workspaces/:workspaceId/activity
/app/workspaces/:workspaceId/settings
```

## Security controls

- HttpOnly JWT authentication cookie
- `Secure` cookie in production
- `SameSite` policy
- credentialed CORS allowlist
- Origin/Referer CSRF validation
- Helmet security headers
- login, registration, and global API rate limiting
- 100 KB request-body limit
- Zod input validation and unknown-field stripping
- hierarchical workspace RBAC
- workspace-scoped resource queries
- hashed invitation tokens
- stable API error codes
- hidden production stack traces
- readiness and liveness probes
- graceful server and database shutdown

## Deployment

A concrete Vercel + Render + Neon guide is included in [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

Included deployment assets:

- `render.yaml` for the Express API
- `frontend/vercel.json` for SPA route rewrites
- frontend production environment example
- production smoke-test command
- frontend and backend GitHub Actions verification
- existing Neon migration and preview-environment workflows

## Portfolio finishing checklist

After deployment, add these repository-only assets:

1. live frontend and API documentation URLs
2. demo password used by the deployed seed
3. six polished screenshots
4. a 60–90 second two-browser collaboration demo
5. repository social preview image
6. final measured endpoint, test, and real-time event counts

Do not invent those values before the live deployment is verified.

## Resume bullets

- Built a multi-tenant collaboration platform using React, Express 5, TypeScript, PostgreSQL, Drizzle ORM, and Socket.IO, with hierarchical workspace RBAC and tenant-isolated data access.
- Designed a GitHub Actions pipeline that provisions isolated Neon database branches for pull requests, applies migrations, and runs authenticated integration tests before merge.
- Implemented secure cookie authentication, origin validation, rate limiting, audit logging, real-time workspace rooms, task workflows, invitations, notifications, and production health checks.

## Author

**Anugrah Singh**
