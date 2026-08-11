# Graph Report - /home/shubham-singh/code/SAAS-Team-Workspace-cleanup  (2026-08-11)

## Corpus Check
- Corpus is ~46,754 words - fits in a single context window. You may not need a graph.

## Summary
- 810 nodes · 1824 edges · 144 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Structure Signals
- Entity graph basis: 668 non-file, non-concept node(s)
- Weakly connected components: 106
- Singleton components: 85
- Isolated nodes: 85
- Largest component: 345 node(s) (52% of the entity graph basis)
- Low-cohesion communities: 3
- Largest low-cohesion community: 22 node(s) (cohesion 0.09)

## Workspace Bridges
1. `router` - connects `Domains Route — Audit`, `Domains Route — Delete`, `Domains Route — Handles`, `Domains Route — Handles \(3\)`, `Domains Route — Handles \(4\)`, `Domains Route — Handles \(5\)`, `Domains Route — Handles \(6\)`, `Domains Route — ID`, `Domains Route — ID \(10\)`, `Domains Route — ID \(11\)`, `Domains Route — ID \(12\)`, `Domains Route — ID \(13\)`, `Domains Route — ID \(14\)`, `Domains Route — ID \(15\)`, `Domains Route — ID \(16\)`, `Domains Route — ID \(17\)`, `Domains Route — ID \(18\)`, `Domains Route — ID \(19\)`, `Domains Route — ID \(20\)`, `Domains Route — ID \(21\)`, `Domains Route — ID \(22\)`, `Domains Route — ID \(23\)`, `Domains Route — ID \(24\)`, `Domains Route — ID \(27\)`, `Domains Route — ID \(28\)`, `Domains Route — ID \(29\)`, `Domains Route — ID \(3\)`, `Domains Route — ID \(4\)`, `Domains Route — ID \(5\)`, `Domains Route — ID \(6\)`, `Domains Route — ID \(7\)`, `Domains Route — ID \(8\)`, `Domains Route — ID \(9\)`, `Domains Route — Messages`, `Domains Route — Post`, `Domains Route — Post \(3\)`, `Domains Route — Post \(4\)`, `Domains Route — Post \(5\)`, `Domains Route — Post \(6\)`, `Domains Route — Post \(7\)`, `Domains Route — Router`, `Domains Route — Router \(2\)`, `Domains Route — Router \(3\)`, `Domains Route — Router \(4\)`, `Domains Route — Router \(5\)`, `Domains Route — Status`; home: `Domains Route — ID \(2\)`; degree 57; score 4808.06
  source files: `/home/shubham-singh/code/SAAS-Team-Workspace-cleanup/src/domains/activity/route.ts`, `/home/shubham-singh/code/SAAS-Team-Workspace-cleanup/src/domains/api.ts`, `/home/shubham-singh/code/SAAS-Team-Workspace-cleanup/src/domains/assistant/route.ts`, `/home/shubham-singh/code/SAAS-Team-Workspace-cleanup/src/domains/comments/route.ts`, `/home/shubham-singh/code/SAAS-Team-Workspace-cleanup/src/domains/invites/route.ts`, `/home/shubham-singh/code/SAAS-Team-Workspace-cleanup/src/domains/labels/route.ts`, `/home/shubham-singh/code/SAAS-Team-Workspace-cleanup/src/domains/members/route.ts`, `/home/shubham-singh/code/SAAS-Team-Workspace-cleanup/src/domains/projects/route.ts`, `/home/shubham-singh/code/SAAS-Team-Workspace-cleanup/src/domains/tasks/route.ts`, `/home/shubham-singh/code/SAAS-Team-Workspace-cleanup/src/domains/workspaces/route.ts`
2. `router` - connects `Domains Route — Handles`, `Domains Route — ID \(10\)`, `Domains Route — ID \(11\)`, `Domains Route — ID \(12\)`, `Domains Route — ID \(13\)`, `Domains Route — ID \(2\)`, `Domains Route — ID \(22\)`, `Domains Route — ID \(23\)`, `Domains Route — ID \(24\)`, `Domains Route — ID \(25\)`, `Domains Route — ID \(3\)`, `Domains Route — ID \(4\)`, `Domains Route — ID \(5\)`, `Domains Route — ID \(6\)`, `Domains Route — ID \(7\)`, `Domains Route — ID \(8\)`, `Domains Route — Post`, `Domains Route — Post \(6\)`; home: `Domains Route — ID \(9\)`; degree 21; score 423.79
  source files: `/home/shubham-singh/code/SAAS-Team-Workspace-cleanup/src/domains/comments/route.ts`, `/home/shubham-singh/code/SAAS-Team-Workspace-cleanup/src/domains/labels/route.ts`, `/home/shubham-singh/code/SAAS-Team-Workspace-cleanup/src/domains/projects/route.ts`, `/home/shubham-singh/code/SAAS-Team-Workspace-cleanup/src/domains/tasks/route.ts`, `/home/shubham-singh/code/SAAS-Team-Workspace-cleanup/src/domains/workspaces/route.ts`
3. `router` - connects `Domains Route — Comment`, `Domains Route — ID \(10\)`, `Domains Route — ID \(11\)`, `Domains Route — ID \(12\)`, `Domains Route — ID \(13\)`, `Domains Route — ID \(3\)`, `Domains Route — ID \(4\)`, `Domains Route — ID \(5\)`, `Domains Route — ID \(6\)`, `Domains Route — ID \(7\)`, `Domains Route — ID \(8\)`, `Domains Route — ID \(9\)`, `Domains Route — Label`, `Domains Route — Post`; home: `Domains Route — ID \(25\)`; degree 16; score 266.9
  source files: `/home/shubham-singh/code/SAAS-Team-Workspace-cleanup/src/domains/comments/route.ts`, `/home/shubham-singh/code/SAAS-Team-Workspace-cleanup/src/domains/labels/route.ts`, `/home/shubham-singh/code/SAAS-Team-Workspace-cleanup/src/domains/projects/route.ts`, `/home/shubham-singh/code/SAAS-Team-Workspace-cleanup/src/domains/tasks/route.ts`
4. `Page\(\)` - connects `Frontend App`, `Frontend App — Activity`, `Frontend App — App`, `Frontend App — App \(2\)`, `Frontend App — App \(3\)`, `Frontend App — App \(4\)`, `Frontend App — ID`, `Frontend App — Login`, `Frontend App — Register`, `Frontend Card`; home: `Frontend Page — Page`; degree 11; score 13069.99
  source files: `/home/shubham-singh/code/SAAS-Team-Workspace-cleanup/frontend/src/app/app/page.tsx`, `/home/shubham-singh/code/SAAS-Team-Workspace-cleanup/frontend/src/app/app/workspaces/\[workspaceId\]/activity/page.tsx`, `/home/shubham-singh/code/SAAS-Team-Workspace-cleanup/frontend/src/app/app/workspaces/\[workspaceId\]/members/page.tsx`, `/home/shubham-singh/code/SAAS-Team-Workspace-cleanup/frontend/src/app/app/workspaces/\[workspaceId\]/page.tsx`, `/home/shubham-singh/code/SAAS-Team-Workspace-cleanup/frontend/src/app/app/workspaces/\[workspaceId\]/projects/\[projectId\]/page.tsx`, `/home/shubham-singh/code/SAAS-Team-Workspace-cleanup/frontend/src/app/app/workspaces/\[workspaceId\]/projects/page.tsx`, `/home/shubham-singh/code/SAAS-Team-Workspace-cleanup/frontend/src/app/app/workspaces/\[workspaceId\]/settings/page.tsx`, `/home/shubham-singh/code/SAAS-Team-Workspace-cleanup/frontend/src/app/login/page.tsx`, `/home/shubham-singh/code/SAAS-Team-Workspace-cleanup/frontend/src/app/page.tsx`, `/home/shubham-singh/code/SAAS-Team-Workspace-cleanup/frontend/src/app/register/page.tsx`, `/home/shubham-singh/code/SAAS-Team-Workspace-cleanup/frontend/src/components/LandingPage.tsx`
5. `Button\(\)` - connects `Frontend Dialog`, `Frontend Dialog — Dialog \(2\)`, `Frontend Error`, `Frontend Pulse Message`, `Frontend Pulse Proposal`, `Frontend Select`; home: `Frontend Card`; degree 24; score 8190.43
  source files: `/home/shubham-singh/code/SAAS-Team-Workspace-cleanup/frontend/src/app/error.tsx`, `/home/shubham-singh/code/SAAS-Team-Workspace-cleanup/frontend/src/components/app-shell/AppSidebar.tsx`, `/home/shubham-singh/code/SAAS-Team-Workspace-cleanup/frontend/src/components/app-shell/WorkspaceCreateDialog.tsx`, `/home/shubham-singh/code/SAAS-Team-Workspace-cleanup/frontend/src/components/LandingCta.tsx`, `/home/shubham-singh/code/SAAS-Team-Workspace-cleanup/frontend/src/components/LandingPage.tsx`, `/home/shubham-singh/code/SAAS-Team-Workspace-cleanup/frontend/src/components/NotFoundPage.tsx`, `/home/shubham-singh/code/SAAS-Team-Workspace-cleanup/frontend/src/components/shared/LoadingButton.tsx`, `/home/shubham-singh/code/SAAS-Team-Workspace-cleanup/frontend/src/components/ui/button.tsx`, `/home/shubham-singh/code/SAAS-Team-Workspace-cleanup/frontend/src/components/ui/dialog.tsx`, `/home/shubham-singh/code/SAAS-Team-Workspace-cleanup/frontend/src/features/assistant/PulseDrawer.tsx`, `/home/shubham-singh/code/SAAS-Team-Workspace-cleanup/frontend/src/features/assistant/PulseMessage.tsx`, `/home/shubham-singh/code/SAAS-Team-Workspace-cleanup/frontend/src/features/assistant/PulseProposal.tsx`, `/home/shubham-singh/code/SAAS-Team-Workspace-cleanup/frontend/src/features/collaboration/MembersPage.tsx`, `/home/shubham-singh/code/SAAS-Team-Workspace-cleanup/frontend/src/features/projects/ProjectBoardHeader.tsx`, `/home/shubham-singh/code/SAAS-Team-Workspace-cleanup/frontend/src/features/projects/ProjectBoardPage.tsx`, `/home/shubham-singh/code/SAAS-Team-Workspace-cleanup/frontend/src/features/projects/ProjectsPage.tsx`, `/home/shubham-singh/code/SAAS-Team-Workspace-cleanup/frontend/src/features/projects/TaskModal.tsx`, `/home/shubham-singh/code/SAAS-Team-Workspace-cleanup/frontend/src/features/workspaces/SettingsPage.tsx`, `/home/shubham-singh/code/SAAS-Team-Workspace-cleanup/frontend/src/features/workspaces/WorkspaceDangerSettings.tsx`, `/home/shubham-singh/code/SAAS-Team-Workspace-cleanup/frontend/src/features/workspaces/WorkspaceDashboardPage.tsx`, `/home/shubham-singh/code/SAAS-Team-Workspace-cleanup/frontend/src/features/workspaces/WorkspaceLabelsSettings.tsx`, `/home/shubham-singh/code/SAAS-Team-Workspace-cleanup/frontend/src/features/workspaces/WorkspaceListPage.tsx`, `/home/shubham-singh/code/SAAS-Team-Workspace-cleanup/frontend/src/features/workspaces/WorkspaceOwnershipSettings.tsx`
6. `router` - connects `Domains Route — ID \(14\)`, `Domains Route — ID \(15\)`, `Domains Route — ID \(16\)`, `Domains Route — ID \(2\)`, `Domains Route — Messages`, `Domains Route — Status`; home: `Domains Route — Router \(2\)`; degree 7; score 90.72
  source files: `/home/shubham-singh/code/SAAS-Team-Workspace-cleanup/src/domains/assistant/route.ts`, `/home/shubham-singh/code/SAAS-Team-Workspace-cleanup/src/domains/workspaces/route.ts`

## God Nodes
1. `app` - 84 edges
2. `apiRouter` - 72 edges
3. `router` - 58 edges
4. `Button\(\)` - 25 edges
5. `insertAuditLog\(\)` - 24 edges
6. `router` - 22 edges
7. `router` - 17 edges
8. `Card\(\)` - 16 edges
9. `EmptyState\(\)` - 15 edges
10. `AppError` - 14 edges

## Surprising Connections
- `page /app/workspaces/\[workspaceId\]/activity` --renders--> `Page\(\)`  [EXTRACTED]
  /home/shubham-singh/code/SAAS-Team-Workspace-cleanup/frontend/src/app/app/workspaces/\[workspaceId\]/activity/page.tsx → /home/shubham-singh/code/SAAS-Team-Workspace-cleanup/frontend/src/app/register/page.tsx  _bridges separate communities; peripheral node \`page /app/workspaces/\[workspaceId\]/activity\` unexpectedly reaches hub \`Page\(\)\`_
- `page /app/workspaces/\[workspaceId\]/members` --renders--> `Page\(\)`  [EXTRACTED]
  /home/shubham-singh/code/SAAS-Team-Workspace-cleanup/frontend/src/app/app/workspaces/\[workspaceId\]/members/page.tsx → /home/shubham-singh/code/SAAS-Team-Workspace-cleanup/frontend/src/app/register/page.tsx  _bridges separate communities; peripheral node \`page /app/workspaces/\[workspaceId\]/members\` unexpectedly reaches hub \`Page\(\)\`_
- `page /app/workspaces/\[workspaceId\]` --renders--> `Page\(\)`  [EXTRACTED]
  /home/shubham-singh/code/SAAS-Team-Workspace-cleanup/frontend/src/app/app/workspaces/\[workspaceId\]/page.tsx → /home/shubham-singh/code/SAAS-Team-Workspace-cleanup/frontend/src/app/register/page.tsx  _bridges separate communities; peripheral node \`page /app/workspaces/\[workspaceId\]\` unexpectedly reaches hub \`Page\(\)\`_
- `page /app/workspaces/\[workspaceId\]/projects/\[projectId\]` --renders--> `Page\(\)`  [EXTRACTED]
  /home/shubham-singh/code/SAAS-Team-Workspace-cleanup/frontend/src/app/app/workspaces/\[workspaceId\]/projects/\[projectId\]/page.tsx → /home/shubham-singh/code/SAAS-Team-Workspace-cleanup/frontend/src/app/register/page.tsx  _bridges separate communities; peripheral node \`page /app/workspaces/\[workspaceId\]/projects/\[projectId\]\` unexpectedly reaches hub \`Page\(\)\`_
- `page /app/workspaces/\[workspaceId\]/projects` --renders--> `Page\(\)`  [EXTRACTED]
  /home/shubham-singh/code/SAAS-Team-Workspace-cleanup/frontend/src/app/app/workspaces/\[workspaceId\]/projects/page.tsx → /home/shubham-singh/code/SAAS-Team-Workspace-cleanup/frontend/src/app/register/page.tsx  _bridges separate communities; peripheral node \`page /app/workspaces/\[workspaceId\]/projects\` unexpectedly reaches hub \`Page\(\)\`_

## Semantic Anomalies
- **[HIGH] Bridge node** - router bridges Domains Route — ID \(2\) and Domains Route — ID, Domains Service, Domains Route — Post \(7\), Domains Route — Handles \(6\), Domains Route — ID \(27\), Domains Route — ID \(28\), Domains Route — ID \(29\), Domains Route — Delete, Domains Route — Router, Domains Route — Router \(2\), Domains Route — Router \(4\), Domains Route — Router \(3\), Domains Route — Router \(5\), Domains Route — ID \(9\), Domains Route — Audit, Domains Route — Status, Domains Route — Messages, Domains Route — ID \(14\), Domains Route — ID \(16\), Domains Route — ID \(15\), Domains Route — Handles \(4\), Domains Route — Post \(4\), Domains Route — ID \(19\), Domains Route — ID \(18\), Domains Route — Handles \(3\), Domains Route — Post \(3\), Domains Route — ID \(17\), Domains Route — Handles \(5\), Domains Route — Post \(5\), Domains Route — ID \(21\), Domains Route — ID \(20\), Domains Route — Post \(6\), Domains Route — Handles, Domains Route — ID \(23\), Domains Route — ID \(24\), Domains Route — ID \(22\), Domains Route — Post, Domains Route — ID \(10\), Domains Route — ID \(11\), Domains Route — ID \(12\), Domains Route — ID \(13\), Domains Route — ID \(7\), Domains Route — ID \(8\), Domains Route — ID \(6\), Domains Route — ID \(5\), Domains Route — ID \(3\), Domains Route — ID \(4\).
  _High betweenness centrality \(4291.064\) across 48 communities makes this node a likely dependency chokepoint._
- **[HIGH] Bridge node** - Page\(\) bridges Frontend Page — Page and Frontend Card, Frontend App — Activity, Frontend App — App \(2\), Frontend App — App, Frontend App — ID, Frontend App — App \(3\), Frontend App — App \(4\), Frontend App — Login, Frontend App, Frontend App — Register.
  _High betweenness centrality \(12958.991\) across 11 communities makes this node a likely dependency chokepoint._
- **[HIGH] Bridge node** - apiRouter bridges Domains Route — ID and Domains Route, Domains Route — Post \(2\), Domains Route — Notification, Domains Route — Token, Domains Route — ID \(2\).
  _High betweenness centrality \(10020.739\) across 6 communities makes this node a likely dependency chokepoint._
- **[HIGH] Low-cohesion community** - Domains Route is weakly connected for its size.
  _Cohesion score 0.09 across 22 nodes suggests this community may mix unrelated responsibilities._
- **[HIGH] Low-cohesion community** - Domains Service is weakly connected for its size.
  _Cohesion score 0.11 across 18 nodes suggests this community may mix unrelated responsibilities._

## Communities

### Community 0 - "Frontend Card"
Cohesion (entity basis within full-graph community): 0.04
Nodes (59): AppLayout\(\), AppSidebar\(\), NavLink\(\), AuditLogPage\(\), AuthProvider\(\), useAuth\(\), Avatar\(\), Badge\(\) (+51 more)

### Community 1 - "Domains Route"
Cohesion (entity basis within full-graph community): 0.02
Nodes (90): enforceApiEnvelope\(\), POST /api/workspace-invites/:token/accept, POST /api/workspace-invites/:token/decline, USE /api/workspace-invites, GET /api/notifications, PATCH /api/notifications/:notificationId/read, PATCH /api/notifications/read-all, USE /api/notifications (+82 more)

### Community 2 - "Domains Service"
Cohesion (entity basis within full-graph community): 0.03
Nodes (70): getPagination\(\), acceptWorkspaceInvite\(\), addWorkspaceMemberByEmail\(\), approveProposal\(\), canDeleteComment\(\), createComment\(\), CreateCommentData, createCommentInTransaction\(\) (+62 more)

### Community 3 - "Domains Route — ID"
Cohesion (entity basis within full-graph community): 0.03
Nodes (68): requireAuth\(\), apiRouter, POST /workspace-invites/:token/accept, POST /workspace-invites/:token/decline, USE /workspace-invites, GET /notifications, PATCH /notifications/:notificationId/read, PATCH /notifications/read-all (+60 more)

### Community 4 - "Frontend Select"
Cohesion (entity basis within full-graph community): 0.14
Nodes (12): CardContent\(\), CardHeader\(\), CardTitle\(\), Checkbox\(\), ProjectBoardHeader\(\), Select\(\), SelectGroup\(\), SelectItem\(\) (+4 more)

### Community 5 - "Domains Route — ID \(2\)"
Cohesion (entity basis within full-graph community): 0.17
Nodes (12): router, USE /:workspaceId/projects/:projectId/tasks/:taskId/comments, USE /:workspaceId/projects/:projectId/tasks/:taskId/labels, USE /:workspaceId/assistant, USE /:workspaceId/projects/:projectId/tasks, USE /, USE /:workspaceId/assistant, USE /:workspaceId/audit-logs (+4 more)

### Community 6 - "Db Ai Action Proposals"
Cohesion (entity basis within full-graph community): n/a
Nodes (0): 

### Community 7 - "Utils App Error"
Cohesion (entity basis within full-graph community): 0.18
Nodes (11): AppError, .badRequest\(\), .conflict\(\), .constructor\(\), .forbidden\(\), .gone\(\), .internalError\(\), .notFound\(\) (+3 more)

### Community 8 - "Ai Tools"
Cohesion (entity basis within full-graph community): 0.14
Nodes (9): isValidTimeZone\(\), resolveName\(\), findTasks\(\), clarification\(\), proposalResult\(\), resolutionChoices\(\), resolveAssignee\(\), resolveProject\(\) (+1 more)

### Community 9 - "Frontend Empty"
Cohesion (entity basis within full-graph community): 0.29
Nodes (7): Empty\(\), EmptyContent\(\), EmptyDescription\(\), EmptyHeader\(\), EmptyMedia\(\), EmptyTitle\(\), EmptyState\(\)

### Community 10 - "Frontend Pulse Message"
Cohesion (entity basis within full-graph community): 0.3
Nodes (5): formatInline\(\), FormattedContent\(\), parseBlocks\(\), parseTableLine\(\), PulseMessage\(\)

### Community 11 - "Frontend Avatar"
Cohesion (entity basis within full-graph community): 0
Nodes (5): AvatarBadge\(\), AvatarFallback\(\), AvatarGroup\(\), AvatarGroupCount\(\), AvatarImage\(\)

### Community 12 - "Frontend Dialog"
Cohesion (entity basis within full-graph community): 0.2
Nodes (5): DialogClose\(\), DialogContent\(\), DialogFooter\(\), DialogOverlay\(\), DialogPortal\(\)

### Community 13 - "Ai Provider"
Cohesion (entity basis within full-graph community): 0.3
Nodes (5): generatePulseText\(\), runPulseMessage\(\), systemInstructions\(\), getTaskRiskFacts\(\), buildPulseTools\(\)

### Community 14 - "Frontend Pulse Proposal"
Cohesion (entity basis within full-graph community): 0.33
Nodes (4): DiffBadge\(\), ProposalDiffSummary\(\), PulseProposalCard\(\), toLocalInput\(\)

### Community 15 - "Src Socket"
Cohesion (entity basis within full-graph community): 0
Nodes (4): getIo\(\), getWorkspaceMembership\(\), initSocket\(\), parseCookies\(\)

### Community 16 - "Src Server"
Cohesion (entity basis within full-graph community): 0.33
Nodes (4): createApp\(\), closeDatabase\(\), shutdown\(\), closeSocketServer\(\)

### Community 17 - "Frontend App Error Boundary"
Cohesion (entity basis within full-graph community): 0.4
Nodes (5): AppErrorBoundary, .componentDidCatch\(\), .getDerivedStateFromError\(\), .render\(\), Component

### Community 18 - "Middlewares Error Middleware"
Cohesion (entity basis within full-graph community): 0.5
Nodes (4): getDatabaseErrorCode\(\), getErrorCodeForStatus\(\), getLegacyHttpStatus\(\), globalErrorHandler\(\)

### Community 19 - "Domains Route — ID \(3\)"
Cohesion (entity basis within full-graph community): 0.4
Nodes (5): inline handles\_route PATCH /:commentId, PATCH /:commentId, PATCH /:projectId/tasks/:taskId/comments/:commentId, PATCH /:taskId/comments/:commentId, PATCH /:workspaceId/projects/:projectId/tasks/:taskId/comments/:commentId

### Community 20 - "Frontend Scroll Area"
Cohesion (entity basis within full-graph community): 0.67
Nodes (4): KanbanBoard\(\), onDragEnd\(\), ScrollArea\(\), ScrollBar\(\)

### Community 21 - "Frontend Popover"
Cohesion (entity basis within full-graph community): 0
Nodes (4): PopoverAnchor\(\), PopoverDescription\(\), PopoverHeader\(\), PopoverTitle\(\)

### Community 22 - "Frontend Projects API"
Cohesion (entity basis within full-graph community): 0.33
Nodes (4): projectPath\(\), taskPath\(\), toSearch\(\), workspacePath\(\)

### Community 23 - "Frontend Tooltip"
Cohesion (entity basis within full-graph community): 0
Nodes (4): Tooltip\(\), TooltipContent\(\), TooltipProvider\(\), TooltipTrigger\(\)

### Community 24 - "Frontend Dialog — Dialog"
Cohesion (entity basis within full-graph community): 0.5
Nodes (4): AppDialog\(\), Dialog\(\), DialogDescription\(\), DialogHeader\(\)

### Community 25 - "Utils Auth Cookie"
Cohesion (entity basis within full-graph community): 1
Nodes (1): getAuthCookieOptions\(\)

### Community 26 - "Integration Setup"
Cohesion (entity basis within full-graph community): 1
Nodes (1): makeRunId\(\)

### Community 27 - "Middlewares Csrf Middleware"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): getRequestOrigin\(\), requireTrustedOrigin\(\), sendOriginError\(\)

### Community 28 - "Frontend Dialog — Dialog \(2\)"
Cohesion (entity basis within full-graph community): 0.5
Nodes (4): DialogTitle\(\), DialogTrigger\(\), PulseDrawer\(\), submit\(\)

### Community 29 - "Domains Route — ID \(4\)"
Cohesion (entity basis within full-graph community): 0.5
Nodes (4): inline handles\_route DELETE /:commentId, DELETE /:projectId/tasks/:taskId/comments/:commentId, DELETE /:taskId/comments/:commentId, DELETE /:workspaceId/projects/:projectId/tasks/:taskId/comments/:commentId

### Community 30 - "Domains Route — ID \(5\)"
Cohesion (entity basis within full-graph community): 0.5
Nodes (4): inline handles\_route GET /, GET /:projectId/tasks/:taskId/comments, GET /:taskId/comments, GET /:workspaceId/projects/:projectId/tasks/:taskId/comments

### Community 31 - "Domains Route — ID \(6\)"
Cohesion (entity basis within full-graph community): 0.5
Nodes (4): inline handles\_route POST /, POST /:projectId/tasks/:taskId/comments, POST /:taskId/comments, POST /:workspaceId/projects/:projectId/tasks/:taskId/comments

### Community 32 - "Domains Route — Comment"
Cohesion (entity basis within full-graph community): 0.5
Nodes (4): DELETE /:commentId, router, GET /, POST /

### Community 33 - "Domains Route — Token"
Cohesion (entity basis within full-graph community): 0.5
Nodes (4): inline handles\_route POST /:token/accept, inviteTokenRouter, POST /:token/accept, USE /

### Community 34 - "Domains Route — ID \(7\)"
Cohesion (entity basis within full-graph community): 0.5
Nodes (4): inline handles\_route GET /, GET /:projectId/tasks/:taskId/labels, GET /:taskId/labels, GET /:workspaceId/projects/:projectId/tasks/:taskId/labels

### Community 35 - "Domains Route — ID \(8\)"
Cohesion (entity basis within full-graph community): 0.5
Nodes (4): inline handles\_route PUT /, PUT /:projectId/tasks/:taskId/labels, PUT /:taskId/labels, PUT /:workspaceId/projects/:projectId/tasks/:taskId/labels

### Community 36 - "Domains Route — ID \(9\)"
Cohesion (entity basis within full-graph community): 0.5
Nodes (4): router, USE /:projectId/tasks/:taskId/comments, USE /:projectId/tasks/:taskId/labels, USE /:projectId/tasks

### Community 37 - "Domains Route — ID \(10\)"
Cohesion (entity basis within full-graph community): 0.5
Nodes (4): GET /:projectId/tasks, inline handles\_route GET /, GET /, GET /:workspaceId/projects/:projectId/tasks

### Community 38 - "Domains Route — ID \(11\)"
Cohesion (entity basis within full-graph community): 0.5
Nodes (4): GET /:projectId/tasks/:taskId, inline handles\_route GET /:taskId, GET /:taskId, GET /:workspaceId/projects/:projectId/tasks/:taskId

### Community 39 - "Domains Route — ID \(12\)"
Cohesion (entity basis within full-graph community): 0.5
Nodes (4): PATCH /:projectId/tasks/:taskId, inline handles\_route PATCH /:taskId, PATCH /:taskId, PATCH /:workspaceId/projects/:projectId/tasks/:taskId

### Community 40 - "Domains Route — Post"
Cohesion (entity basis within full-graph community): 0.5
Nodes (4): POST /:projectId/tasks, inline handles\_route POST /, POST /, POST /:workspaceId/projects/:projectId/tasks

### Community 41 - "Domains Route — ID \(13\)"
Cohesion (entity basis within full-graph community): 0.5
Nodes (4): POST /:projectId/tasks/:taskId/duplicate, inline handles\_route POST /:taskId/duplicate, POST /:taskId/duplicate, POST /:workspaceId/projects/:projectId/tasks/:taskId/duplicate

### Community 42 - "Frontend Kanban Board"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): KanbanColumn\(\), priorityTone\(\), TaskCard\(\)

### Community 43 - "Frontend Providers"
Cohesion (entity basis within full-graph community): 1
Nodes (2): Providers\(\), Toaster\(\)

### Community 44 - "Frontend Popover — Popover"
Cohesion (entity basis within full-graph community): 0.5
Nodes (4): NotificationsMenu\(\), Popover\(\), PopoverContent\(\), PopoverTrigger\(\)

### Community 45 - "Middlewares Rbac Middleware"
Cohesion (entity basis within full-graph community): 0
Nodes (3): getWorkspaceId\(\), hasMinimumRole\(\), requireWorkspaceRole\(\)

### Community 46 - "Scripts Seed Demo"
Cohesion (entity basis within full-graph community): 0.33
Nodes (3): daysFromNow\(\), requireSeedConfirmation\(\), seedDemo\(\)

### Community 47 - "Scripts Smoke Test"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): assertSuccessfulResponse\(\), parseResponse\(\), run\(\)

### Community 48 - "Utils Socket Events"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): getIoIfInitialized\(\), emitUserEvent\(\), emitWorkspaceEvent\(\)

### Community 49 - "Frontend Use Workspace Socket"
Cohesion (entity basis within full-graph community): 0.5
Nodes (4): useWorkspaceSocket\(\), invalidateNotifications\(\), invalidateWorkspace\(\), onWorkspaceError\(\)

### Community 50 - "Frontend Alert"
Cohesion (entity basis within full-graph community): 0
Nodes (2): AlertAction\(\), AlertDescription\(\)

### Community 51 - "Frontend Alert — Alert"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): Alert\(\), AlertTitle\(\), ErrorPanel\(\)

### Community 52 - "Middlewares Rate Limit Middleware"
Cohesion (entity basis within full-graph community): 1
Nodes (1): createRateLimiter\(\)

### Community 53 - "Frontend Auth Gates"
Cohesion (entity basis within full-graph community): 0
Nodes (2): ProtectedGate\(\), PublicOnlyGate\(\)

### Community 54 - "Frontend Backend Wakeup"
Cohesion (entity basis within full-graph community): 1
Nodes (2): BackendWakeup\(\), checkHealth\(\)

### Community 55 - "Frontend Collaboration API"
Cohesion (entity basis within full-graph community): 0
Nodes (2): toSearch\(\), workspacePath\(\)

### Community 56 - "Frontend Dashboard Portfolio"
Cohesion (entity basis within full-graph community): 0
Nodes (2): DashboardPortfolio\(\), DashboardPortfolioProps

### Community 57 - "Frontend Error"
Cohesion (entity basis within full-graph community): 1
Nodes (1): Error\(\)

### Community 58 - "Frontend App"
Cohesion (entity basis within full-graph community): 0
Nodes (2): error /, page /

### Community 59 - "Frontend Layout"
Cohesion (entity basis within full-graph community): 1
Nodes (2): layout /app, Layout\(\)

### Community 60 - "Frontend Loading"
Cohesion (entity basis within full-graph community): 1
Nodes (2): loading /, Loading\(\)

### Community 61 - "Frontend Not Found"
Cohesion (entity basis within full-graph community): 1
Nodes (2): not-found /, NotFound\(\)

### Community 62 - "Frontend Page"
Cohesion (entity basis within full-graph community): 1
Nodes (2): page /app/workspaces, WorkspacesIndexPage\(\)

### Community 63 - "Domains Route — Status"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): inline handles\_route GET /status, GET /status, GET /:workspaceId/assistant/status

### Community 64 - "Domains Route — ID \(14\)"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): inline handles\_route PATCH /proposals/:proposalId, PATCH /proposals/:proposalId, PATCH /:workspaceId/assistant/proposals/:proposalId

### Community 65 - "Domains Route — Messages"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): inline handles\_route POST /messages, POST /messages, POST /:workspaceId/assistant/messages

### Community 66 - "Domains Route — ID \(15\)"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): inline handles\_route POST /proposals/:proposalId/approve, POST /proposals/:proposalId/approve, POST /:workspaceId/assistant/proposals/:proposalId/approve

### Community 67 - "Domains Route — ID \(16\)"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): inline handles\_route POST /proposals/:proposalId/reject, POST /proposals/:proposalId/reject, POST /:workspaceId/assistant/proposals/:proposalId/reject

### Community 68 - "Domains Route — Post \(2\)"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): inline handles\_route POST /register, router, POST /register

### Community 69 - "Domains Route — ID \(17\)"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): inline handles\_route DELETE /:inviteId, DELETE /:inviteId, DELETE /:workspaceId/invites/:inviteId

### Community 70 - "Domains Route — Post \(3\)"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): inline handles\_route POST /, POST /, POST /:workspaceId/invites

### Community 71 - "Domains Route — ID \(18\)"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): inline handles\_route DELETE /:labelId, DELETE /:labelId, DELETE /:workspaceId/labels/:labelId

### Community 72 - "Domains Route — ID \(19\)"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): inline handles\_route PATCH /:labelId, PATCH /:labelId, PATCH /:workspaceId/labels/:labelId

### Community 73 - "Domains Route — Post \(4\)"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): inline handles\_route POST /, POST /, POST /:workspaceId/labels

### Community 74 - "Domains Route — Label"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): taskLabelRouter, GET /, PUT /

### Community 75 - "Domains Route — ID \(20\)"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): inline handles\_route DELETE /:memberId, DELETE /:memberId, DELETE /:workspaceId/members/:memberId

### Community 76 - "Domains Route — ID \(21\)"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): inline handles\_route PATCH /:memberId/role, PATCH /:memberId/role, PATCH /:workspaceId/members/:memberId/role

### Community 77 - "Domains Route — Post \(5\)"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): inline handles\_route POST /, POST /, POST /:workspaceId/members

### Community 78 - "Domains Route — ID \(22\)"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): inline handles\_route DELETE /:projectId, DELETE /:projectId, DELETE /:workspaceId/projects/:projectId

### Community 79 - "Domains Route — Handles"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): inline handles\_route GET /, GET /, GET /:workspaceId/projects

### Community 80 - "Domains Route — ID \(23\)"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): inline handles\_route GET /:projectId, GET /:projectId, GET /:workspaceId/projects/:projectId

### Community 81 - "Domains Route — ID \(24\)"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): inline handles\_route PATCH /:projectId, PATCH /:projectId, PATCH /:workspaceId/projects/:projectId

### Community 82 - "Domains Route — Post \(6\)"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): inline handles\_route POST /, POST /, POST /:workspaceId/projects

### Community 83 - "Domains Route — ID \(25\)"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): router, USE /:taskId/comments, USE /:taskId/labels

### Community 84 - "Integration Invite Integration Test"
Cohesion (entity basis within full-graph community): 0
Nodes (2): createInvite\(\), registerAndLogin\(\)

### Community 85 - "Docs Openapi"
Cohesion (entity basis within full-graph community): 1
Nodes (1): body\(\)

### Community 86 - "Frontend Select — Select"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): SelectContent\(\), SelectScrollDownButton\(\), SelectScrollUpButton\(\)

### Community 87 - "Integration Socket Integration Test"
Cohesion (entity basis within full-graph community): 0
Nodes (2): connectAuthenticatedSocket\(\), extractCookie\(\)

### Community 88 - "Ai Types"
Cohesion (entity basis within full-graph community): 1
Nodes (2): canRolePropose\(\), roleToolNames\(\)

### Community 89 - "Frontend Use Pulse"
Cohesion (entity basis within full-graph community): 1
Nodes (1): boundHistory\(\)

### Community 90 - "Frontend Assistant API"
Cohesion (entity basis within full-graph community): 1
Nodes (1): path\(\)

### Community 91 - "Integration Assistant Integration Test"
Cohesion (entity basis within full-graph community): 1
Nodes (1): registerAndLogin\(\)

### Community 92 - "Frontend Layout — Layout"
Cohesion (entity basis within full-graph community): 1
Nodes (2): layout /, RootLayout\(\)

### Community 93 - "Frontend Page — Page"
Cohesion (entity basis within full-graph community): 1
Nodes (2): page /app, Page\(\)

### Community 94 - "Frontend App — App"
Cohesion (entity basis within full-graph community): 1
Nodes (1): page /app/workspaces/\[workspaceId\]

### Community 95 - "Frontend App — Activity"
Cohesion (entity basis within full-graph community): 1
Nodes (1): page /app/workspaces/\[workspaceId\]/activity

### Community 96 - "Frontend App — App \(2\)"
Cohesion (entity basis within full-graph community): 1
Nodes (1): page /app/workspaces/\[workspaceId\]/members

### Community 97 - "Frontend App — App \(3\)"
Cohesion (entity basis within full-graph community): 1
Nodes (1): page /app/workspaces/\[workspaceId\]/projects

### Community 98 - "Frontend App — ID"
Cohesion (entity basis within full-graph community): 1
Nodes (1): page /app/workspaces/\[workspaceId\]/projects/\[projectId\]

### Community 99 - "Frontend App — App \(4\)"
Cohesion (entity basis within full-graph community): 1
Nodes (1): page /app/workspaces/\[workspaceId\]/settings

### Community 100 - "Frontend App — Login"
Cohesion (entity basis within full-graph community): 1
Nodes (1): page /login

### Community 101 - "Frontend App — Register"
Cohesion (entity basis within full-graph community): 1
Nodes (1): page /register

### Community 102 - "Domains Route — Audit"
Cohesion (entity basis within full-graph community): 1
Nodes (2): inline handles\_route GET /, GET /:workspaceId/audit-logs

### Community 103 - "Domains Route — Handles \(2\)"
Cohesion (entity basis within full-graph community): 1
Nodes (2): inline handles\_route GET /, GET /

### Community 104 - "Domains Route — ID \(26\)"
Cohesion (entity basis within full-graph community): 1
Nodes (2): inline handles\_route PATCH /:notificationId/read, PATCH /:notificationId/read

### Community 105 - "Domains Route — All"
Cohesion (entity basis within full-graph community): 1
Nodes (2): inline handles\_route PATCH /read-all, PATCH /read-all

### Community 106 - "Domains Route — Notification"
Cohesion (entity basis within full-graph community): 1
Nodes (2): notificationRouter, USE /

### Community 107 - "Domains Route — Router"
Cohesion (entity basis within full-graph community): 1
Nodes (2): router, GET /

### Community 108 - "Domains Route — Router \(2\)"
Cohesion (entity basis within full-graph community): 1
Nodes (2): router, USE /

### Community 109 - "Domains Route — Me"
Cohesion (entity basis within full-graph community): 1
Nodes (2): inline handles\_route GET /me, GET /me

### Community 110 - "Domains Route — Demo"
Cohesion (entity basis within full-graph community): 1
Nodes (2): inline handles\_route POST /demo, POST /demo

### Community 111 - "Domains Route — Login"
Cohesion (entity basis within full-graph community): 1
Nodes (2): inline handles\_route POST /login, POST /login

### Community 112 - "Domains Route — Logout"
Cohesion (entity basis within full-graph community): 1
Nodes (2): inline handles\_route POST /logout, POST /logout

### Community 113 - "Domains Route — Handles \(3\)"
Cohesion (entity basis within full-graph community): 1
Nodes (2): inline handles\_route GET /, GET /:workspaceId/invites

### Community 114 - "Domains Route — Decline"
Cohesion (entity basis within full-graph community): 1
Nodes (2): inline handles\_route POST /:token/decline, POST /:token/decline

### Community 115 - "Domains Route — Router \(3\)"
Cohesion (entity basis within full-graph community): 1
Nodes (2): router, GET /

### Community 116 - "Domains Route — Handles \(4\)"
Cohesion (entity basis within full-graph community): 1
Nodes (2): inline handles\_route GET /, GET /:workspaceId/labels

### Community 117 - "Domains Route — Router \(4\)"
Cohesion (entity basis within full-graph community): 1
Nodes (2): router, GET /

### Community 118 - "Domains Route — Handles \(5\)"
Cohesion (entity basis within full-graph community): 1
Nodes (2): inline handles\_route GET /, GET /:workspaceId/members

### Community 119 - "Domains Route — Router \(5\)"
Cohesion (entity basis within full-graph community): 1
Nodes (2): router, GET /

### Community 120 - "Domains Route — Delete"
Cohesion (entity basis within full-graph community): 1
Nodes (2): inline handles\_route DELETE /:workspaceId, DELETE /:workspaceId

### Community 121 - "Domains Route — Handles \(6\)"
Cohesion (entity basis within full-graph community): 1
Nodes (2): inline handles\_route GET /, GET /

### Community 122 - "Domains Route — ID \(27\)"
Cohesion (entity basis within full-graph community): 1
Nodes (2): inline handles\_route GET /:workspaceId, GET /:workspaceId

### Community 123 - "Domains Route — ID \(28\)"
Cohesion (entity basis within full-graph community): 1
Nodes (2): inline handles\_route PATCH /:workspaceId, PATCH /:workspaceId

### Community 124 - "Domains Route — ID \(29\)"
Cohesion (entity basis within full-graph community): 1
Nodes (2): inline handles\_route PATCH /:workspaceId/transfer-owner, PATCH /:workspaceId/transfer-owner

### Community 125 - "Domains Route — Post \(7\)"
Cohesion (entity basis within full-graph community): 1
Nodes (2): inline handles\_route POST /, POST /

### Community 126 - "HTTP Test Tests"
Cohesion (entity basis within full-graph community): 1
Nodes (1): expectError\(\)

### Community 127 - "Db Migrate"
Cohesion (entity basis within full-graph community): 1
Nodes (1): runMigrations\(\)

### Community 128 - "Docs Openapi — Data"
Cohesion (entity basis within full-graph community): 1
Nodes (2): dataEnvelope\(\), responses\(\)

### Community 129 - "Utils Remove Undefined"
Cohesion (entity basis within full-graph community): 1
Nodes (1): removeUndefined\(\)

### Community 130 - "Ai Risks"
Cohesion (entity basis within full-graph community): 1
Nodes (1): deriveRisks\(\)

### Community 131 - "Integration Security Integration Test"
Cohesion (entity basis within full-graph community): 1
Nodes (1): registerAndLogin\(\)

### Community 132 - "Src Server — Error"
Cohesion (entity basis within full-graph community): 1
Nodes (2): startServer\(\), handleError\(\)

### Community 133 - "Domains Service — Activity"
Cohesion (entity basis within full-graph community): 1
Nodes (2): getRecentActivity\(\), resourceTitle\(\)

### Community 134 - "Integration Socket Integration Test — Event"
Cohesion (entity basis within full-graph community): 1
Nodes (2): waitForEvent\(\), handleEvent\(\)

### Community 135 - "Frontend Use Pulse — After"
Cohesion (entity basis within full-graph community): 1
Nodes (2): usePulse\(\), invalidateAfterApproval\(\)

### Community 136 - "Middlewares Validate Middleware"
Cohesion (entity basis within full-graph community): 1
Nodes (1): validate\(\)

### Community 137 - "Frontend Workspaces API"
Cohesion (entity basis within full-graph community): 1
Nodes (1): workspacePath\(\)

### Community 138 - "Assistant Test TypeScript"
Cohesion (entity basis within full-graph community): n/a
Nodes (0): 

### Community 139 - "Drizzle Config TypeScript"
Cohesion (entity basis within full-graph community): n/a
Nodes (0): 

### Community 140 - "Next Config TypeScript"
Cohesion (entity basis within full-graph community): n/a
Nodes (0): 

### Community 141 - "Next Env D TypeScript"
Cohesion (entity basis within full-graph community): n/a
Nodes (0): 

### Community 142 - "Vitest Config TypeScript"
Cohesion (entity basis within full-graph community): n/a
Nodes (0): 

### Community 143 - "Vitest Setup TypeScript"
Cohesion (entity basis within full-graph community): n/a
Nodes (0): 

## Knowledge Gaps
- **283 weakly connected node(s):** `Layout\(\)`, `layout /app`, `page /app`, `layout /`, `page /app/workspaces/\[workspaceId\]/activity` (+278 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Frontend Assistant API`** (2 nodes): `assistant.api.ts`, `path\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Integration Assistant Integration Test`** (2 nodes): `assistant.integration.test.ts`, `registerAndLogin\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Frontend Layout — Layout`** (2 nodes): `layout /`, `RootLayout\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Frontend Page — Page`** (2 nodes): `page /app`, `Page\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Frontend App — App`** (2 nodes): `page /app/workspaces/\[workspaceId\]`, `/app/workspaces/\[workspaceId\]`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Frontend App — Activity`** (2 nodes): `page /app/workspaces/\[workspaceId\]/activity`, `/app/workspaces/\[workspaceId\]/activity`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Frontend App — App \(2\)`** (2 nodes): `page /app/workspaces/\[workspaceId\]/members`, `/app/workspaces/\[workspaceId\]/members`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Frontend App — App \(3\)`** (2 nodes): `page /app/workspaces/\[workspaceId\]/projects`, `/app/workspaces/\[workspaceId\]/projects`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Frontend App — ID`** (2 nodes): `page /app/workspaces/\[workspaceId\]/projects/\[projectId\]`, `/app/workspaces/\[workspaceId\]/projects/\[projectId\]`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Frontend App — App \(4\)`** (2 nodes): `page /app/workspaces/\[workspaceId\]/settings`, `/app/workspaces/\[workspaceId\]/settings`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Frontend App — Login`** (2 nodes): `page /login`, `/login`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Frontend App — Register`** (2 nodes): `page /register`, `/register`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Domains Route — Audit`** (2 nodes): `inline handles\_route GET /`, `GET /:workspaceId/audit-logs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Domains Route — Handles \(2\)`** (2 nodes): `inline handles\_route GET /`, `GET /`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Domains Route — ID \(26\)`** (2 nodes): `inline handles\_route PATCH /:notificationId/read`, `PATCH /:notificationId/read`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Domains Route — All`** (2 nodes): `inline handles\_route PATCH /read-all`, `PATCH /read-all`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Domains Route — Notification`** (2 nodes): `notificationRouter`, `USE /`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Domains Route — Router`** (2 nodes): `router`, `GET /`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Domains Route — Router \(2\)`** (2 nodes): `router`, `USE /`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Domains Route — Me`** (2 nodes): `inline handles\_route GET /me`, `GET /me`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Domains Route — Demo`** (2 nodes): `inline handles\_route POST /demo`, `POST /demo`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Domains Route — Login`** (2 nodes): `inline handles\_route POST /login`, `POST /login`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Domains Route — Logout`** (2 nodes): `inline handles\_route POST /logout`, `POST /logout`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Domains Route — Handles \(3\)`** (2 nodes): `inline handles\_route GET /`, `GET /:workspaceId/invites`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Domains Route — Decline`** (2 nodes): `inline handles\_route POST /:token/decline`, `POST /:token/decline`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Domains Route — Router \(3\)`** (2 nodes): `router`, `GET /`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Domains Route — Handles \(4\)`** (2 nodes): `inline handles\_route GET /`, `GET /:workspaceId/labels`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Domains Route — Router \(4\)`** (2 nodes): `router`, `GET /`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Domains Route — Handles \(5\)`** (2 nodes): `inline handles\_route GET /`, `GET /:workspaceId/members`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Domains Route — Router \(5\)`** (2 nodes): `router`, `GET /`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Domains Route — Delete`** (2 nodes): `inline handles\_route DELETE /:workspaceId`, `DELETE /:workspaceId`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Domains Route — Handles \(6\)`** (2 nodes): `inline handles\_route GET /`, `GET /`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Domains Route — ID \(27\)`** (2 nodes): `inline handles\_route GET /:workspaceId`, `GET /:workspaceId`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Domains Route — ID \(28\)`** (2 nodes): `inline handles\_route PATCH /:workspaceId`, `PATCH /:workspaceId`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Domains Route — ID \(29\)`** (2 nodes): `inline handles\_route PATCH /:workspaceId/transfer-owner`, `PATCH /:workspaceId/transfer-owner`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Domains Route — Post \(7\)`** (2 nodes): `inline handles\_route POST /`, `POST /`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `HTTP Test Tests`** (2 nodes): `http.test.ts`, `expectError\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Db Migrate`** (2 nodes): `migrate.ts`, `runMigrations\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Docs Openapi — Data`** (2 nodes): `dataEnvelope\(\)`, `responses\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Utils Remove Undefined`** (2 nodes): `removeUndefined.ts`, `removeUndefined\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Ai Risks`** (2 nodes): `risks.ts`, `deriveRisks\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Integration Security Integration Test`** (2 nodes): `security.integration.test.ts`, `registerAndLogin\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Src Server — Error`** (2 nodes): `startServer\(\)`, `handleError\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Domains Service — Activity`** (2 nodes): `getRecentActivity\(\)`, `resourceTitle\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Integration Socket Integration Test — Event`** (2 nodes): `waitForEvent\(\)`, `handleEvent\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Frontend Use Pulse — After`** (2 nodes): `usePulse\(\)`, `invalidateAfterApproval\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Middlewares Validate Middleware`** (2 nodes): `validate.middleware.ts`, `validate\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Frontend Workspaces API`** (2 nodes): `workspaces.api.ts`, `workspacePath\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Assistant Test TypeScript`** (1 nodes): `assistant.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Drizzle Config TypeScript`** (1 nodes): `drizzle.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Next Config TypeScript`** (1 nodes): `next.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Next Env D TypeScript`** (1 nodes): `next-env.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Vitest Config TypeScript`** (1 nodes): `vitest.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Vitest Setup TypeScript`** (1 nodes): `vitest.setup.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does \`Page\(\)\` connect \`Frontend Page — Page\` to \`Frontend Card\`, \`Frontend App — Activity\`, \`Frontend App — App \(2\)\`, \`Frontend App — App\`, \`Frontend App — ID\`, \`Frontend App — App \(3\)\`, \`Frontend App — App \(4\)\`, \`Frontend App — Login\`, \`Frontend App\`, \`Frontend App — Register\`?**
  _High betweenness centrality \(12958.991\) - this node is a cross-community bridge._
- **Why does \`apiRouter\` connect \`Domains Route — ID\` to \`Domains Route\`, \`Domains Route — Post \(2\)\`, \`Domains Route — Notification\`, \`Domains Route — Token\`, \`Domains Route — ID \(2\)\`?**
  _High betweenness centrality \(10020.739\) - this node is a cross-community bridge._
- **Why does \`app\` connect \`Domains Route\` to \`Domains Route — ID\`?**
  _High betweenness centrality \(9423.365\) - this node is a cross-community bridge._
- **What connects \`Layout\(\)\`, \`layout /app\`, \`page /app\` to the rest of the system?**
  _283 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should \`Domains Route\` be split into smaller, more focused modules?**
  _Cohesion score 0.09 across 22 entity nodes - this community may mix unrelated responsibilities._
- **Should \`Domains Service\` be split into smaller, more focused modules?**
  _Cohesion score 0.11 across 18 entity nodes - this community may mix unrelated responsibilities._
- **Should \`Domains Route — ID\` be split into smaller, more focused modules?**
  _Cohesion score 0.13 across 15 entity nodes - this community may mix unrelated responsibilities._
