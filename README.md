# SaaS Team Workspace — Backend

A production-oriented, multi-tenant team collaboration backend built with Node.js, TypeScript, Express, PostgreSQL, Drizzle ORM, Neon and Socket.IO.

## Features

* Secure registration and login with bcrypt, JWT and HttpOnly cookies
* Origin-based CSRF protection
* Multi-tenant workspaces
* Hierarchical workspace RBAC
* Workspace ownership transfer
* Projects and task management
* Task assignment, priorities, status, archive and duplication
* Comments and labels
* Workspace invitation lifecycle
* Notifications and unread counts
* Audit logging
* Authenticated Socket.IO collaboration
* Liveness and readiness endpoints
* Graceful application shutdown
* Automated unit and integration tests
* GitHub Actions CI/CD
* Neon preview database branches for pull requests
* Automated Drizzle migrations

## Technology Stack

* Node.js 24
* TypeScript
* Express 5
* PostgreSQL
* Neon
* Drizzle ORM
* Socket.IO
* Zod
* JWT
* bcrypt
* Supertest
* GitHub Actions

## Architecture

The backend uses a layered architecture:

```text
Routes
  → Authentication, validation and RBAC middleware
  → Controllers
  → Services
  → Drizzle ORM
  → Neon PostgreSQL
```

Controllers handle HTTP and real-time responses. Services contain business rules and transactional database operations.

## Workspace Roles

| Role    | Access                                         |
| ------- | ---------------------------------------------- |
| OWNER   | Full workspace control and ownership transfer  |
| ADMIN   | Workspace administration and member management |
| MANAGER | Project and destructive resource management    |
| MEMBER  | Standard collaboration and task contribution   |
| VIEWER  | Read-only workspace access                     |

## Environment Variables

Create a `.env` file:

```env
NODE_ENV=development
PORT=8000
DATABASE_URL=postgresql://...
JWT_SECRET=replace-with-at-least-32-characters
FRONTEND_URL=http://localhost:5173
DB_POOL_MAX=20
SHUTDOWN_TIMEOUT_MS=10000
```

Use the pooled Neon connection for the running API.

Use the direct, unpooled Neon connection for database migrations.

## Installation

```bash
nvm use
npm ci
```

## Development

```bash
npm run dev
```

The default server URL is:

```text
http://localhost:8000
```

## Database Migrations

Generate a migration after changing a Drizzle schema:

```bash
npm run db:generate
```

Apply migrations:

```bash
npm run db:migrate
```

Never edit an already-applied migration. Create a new migration for every schema change.

## Testing

Run HTTP foundation tests:

```bash
npm test
```

Run integration tests against a migrated Neon branch:

```bash
npm run test:integration
```

Run coverage:

```bash
npm run test:coverage
```

Run all database-independent backend verification:

```bash
npm run backend:verify
```

## Health Endpoints

```text
GET /health
GET /health/live
GET /health/ready
```

## Main API Areas

```text
/api/auth
/api/users
/api/workspaces
/api/workspaces/:workspaceId/members
/api/workspaces/:workspaceId/projects
/api/workspaces/:workspaceId/labels
/api/workspaces/:workspaceId/invites
/api/workspaces/:workspaceId/audit-logs
/api/notifications
/api/workspace-invites
```

## Real-Time Collaboration

Socket.IO connections authenticate through the same JWT cookie used by the HTTP API.

Authenticated users automatically join:

```text
user:<userId>
```

Users can join workspace rooms only after active workspace membership is confirmed.

Real-time events include:

* workspace updates
* projects
* tasks
* comments
* labels
* member changes
* invitations
* notifications

## CI/CD

### Backend CI

Runs on pull requests and pushes to `main`:

* dependency installation
* TypeScript checks
* HTTP tests
* production build
* production dependency audit

### Neon Preview Environments

Each internal pull request automatically:

1. Creates a Neon preview database branch
2. Validates the direct database URL
3. Applies Drizzle migrations
4. Runs authenticated integration tests
5. Deletes the preview branch when the pull request closes

### Production Migrations

Schema and migration changes merged into `main` automatically trigger the production migration workflow.

## Security Controls

* HttpOnly authentication cookies
* Secure production cookies
* SameSite cookie policy
* Origin and Referer verification
* Helmet security headers
* Credentialed CORS allowlist
* Login and registration rate limiting
* Global API rate limiting
* Zod input validation
* Unknown-field stripping
* Request body-size limits
* Role-based authorization
* Workspace-scoped database queries
* Hashed invitation tokens
* Stable API error codes
* Hidden production stack traces

## Status

The backend MVP is complete and ready for frontend integration.

Production deployment still requires platform configuration for environment variables, the frontend URL, the production Neon database and application monitoring.
