# Coordra deployment guide

Coordra keeps the Express API at the repository root and the Next.js app in `frontend/`.
The production topology is Vercel → Render → Neon, with Groq called only by Render.

## Backend on Render

Create the `coordra-api` service from `render.yaml` and configure:

```env
DATABASE_URL=<pooled Neon URL>
JWT_SECRET=<long random value>
FRONTEND_URL=https://<vercel-origin>
TRUST_PROXY_HOPS=1
AI_ENABLED=true
AI_PROVIDER=groq
GROQ_API_KEY=<server-only Groq key>
GROQ_MODEL=openai/gpt-oss-20b
AI_MAX_STEPS=4
```

Keep `GROQ_API_KEY` only on Render. The API enforces 20 assistant requests per user per
hour plus an IP ceiling; configure Groq project quota controls as the outer limit. To
isolate a provider incident, set `AI_ENABLED=false` and redeploy. Every normal workspace
route remains available and the frontend hides **Ask Pulse**.

Verify `/health/live`, `/health/ready`, and `/api-docs` after deployment.

## Frontend on Vercel

Import `Anugrah-Singh/coordra`, set the root directory to `frontend`, and configure only:

```env
NEXT_PUBLIC_API_URL=https://<render-api-host>
```

The browser never receives AI credentials. `frontend/vercel.json` selects Next.js App
Router behavior without legacy SPA rewrites.

## Database and migrations

Neon runtime traffic uses the pooled URL. Migration automation must use the direct Neon
URL and run `npm run db:migrate`. `0000_initial.sql` remains the clean domain baseline;
`0001_ai_action_proposals.sql` adds only Pulse proposal persistence.

## Demo data

```bash
DEMO_SEED_CONFIRM=coordra-demo \
DEMO_SEED_PASSWORD='<strong-demo-password>' \
npm run db:seed:demo
```

The guarded seed replaces only the `coordra-demo` workspace. It presents Owner, Member,
and Viewer accounts using `@coordra.demo` addresses while the application retains all
five roles.

## Production checks

1. Run `BASE_URL=https://<api-host> npm run test:smoke`.
2. Verify login/session restoration and ordinary project/task/comment flows with AI off.
3. Enable Pulse and ask a read-only project question.
4. Review and approve one proposal; confirm the task/comment and `AI_ASSISTED_*` audit.
5. Temporarily use an invalid Groq key; confirm a safe Pulse error while normal pages work.
6. Open two authenticated browsers and confirm approval triggers the existing live refresh.

## Pulse failure drills

- **503 AI_DISABLED:** verify `AI_ENABLED` and keep using normal workspace routes.
- **503 AI_PROVIDER_ERROR:** check Render-to-Groq connectivity, key, model, and quota; no
  provider response details are returned to clients.
- **429:** identify whether the user or IP hourly ceiling was reached.
- **409:** the proposal was already claimed/rejected/executed; do not retry as a new write.
- **410:** the 15-minute proposal expired; ask Pulse to prepare a fresh proposal.
