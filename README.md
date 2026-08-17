# Coordra 🌟

Coordra is an AI-assisted workspace for coordinating projects, people, and priorities. It combines tenant-safe project delivery, live collaboration, and accountable actions with Pulse: a workspace-scoped assistant that answers from verified facts and prepares writes for explicit approval.

🔗 **Live Demo:** https://saas-team-workspace.vercel.app/ (wait for the backend to start on render)
<!-- 🔗 **Video Walkthrough:** [Link to a 2-minute Loom or YouTube video] -->

## 🚀 Key Features

- **Real-time Accountability:** Implemented Socket.IO workspace rooms with query invalidation to handle concurrent user interactions and ensure transactional audit history.
- **AI-Assisted Coordination (Pulse):** Integrated an approval-gated AI assistant that summarizes deterministic risk conditions and prepares editable task updates without executing autonomous mutations.
- **Contextual Workspaces:** Built seamless project management tools, including Kanban tasks, due dates, assignee management, and refresh-safe deep links where work actually happens.
- **Secure Authentication & Permissions:** Engineered a robust backend-enforced 5-level Role-Based Access Control (RBAC) system for secure workspace membership and tenant isolation.

## 🛠️ Tech Stack & Architecture

**Frontend**

- **Framework:** Next.js
- **Styling:** Tailwind CSS

**Backend**

- **Runtime Environment:** Node.js (v24.18+)
- **Framework:** Express.js
- **Database:** PostgreSQL (via Drizzle ORM)
- **AI Provider:** Groq (via Vercel AI SDK)

**System Workflow Diagram**

```mermaid
flowchart TD

    User["User / Browser"]

    subgraph Frontend["Next.js Frontend"]
        App["Next.js App Router"]
        AuthUI["Auth UI / AuthProvider"]
        WorkspaceUI["Workspace / Project UI"]
        PulseUI["Pulse Assistant UI"]
        QueryCache["TanStack Query Cache"]
        APIClient["Frontend API Client"]
        SocketClient["Socket.IO Client"]
    end

    subgraph Backend["Node.js Backend - Express Modular Monolith"]
        Server["server.ts<br/>HTTP server bootstrap"]

        subgraph HttpLayer["HTTP / API Layer"]
            Express["Express app"]
            Security["Security Middleware<br/>Helmet / CORS / Cookies / CSRF<br/>Rate Limit / Validation"]
            AuthMW["Authentication Middleware<br/>JWT cookie verification"]
            RBAC["Workspace RBAC<br/>membership + role check"]
            APIRouter["API Router<br/>/api"]
        end

        subgraph Domains["Domain Services"]
            Auth["Auth Service"]
            Workspace["Workspace Service"]
            Collaboration["Members / Invites / Labels / Activity"]
            Projects["Project Service"]
            Tasks["Task Service"]
            Comments["Comment Service"]
        end

        subgraph Pulse["Pulse AI"]
            AssistantRoute["Assistant Routes"]
            AssistantService["Assistant Service<br/>proposal lifecycle"]
            AITools["Verified AI Tools"]
            Resolution["Name Resolution"]
            Risks["Deterministic Risk Analysis"]
            Provider["AI Provider<br/>Vercel AI SDK"]
        end

        subgraph Realtime["Realtime"]
            SocketServer["Socket.IO Server"]
            SocketEvents["Workspace / User Events"]
        end

        subgraph Persistence["Persistence"]
            Drizzle["Drizzle ORM"]
            PGPool["node-postgres Pool"]
            PostgreSQL[("PostgreSQL")]
            Migrations["Drizzle SQL Migrations"]
        end
    end

    Groq["Groq API<br/>LLM Provider"]

    User --> App
    App --> AuthUI
    App --> WorkspaceUI
    App --> PulseUI

    AuthUI -->|HTTP / JSON + auth cookie| APIClient
    WorkspaceUI -->|HTTP / JSON| APIClient
    PulseUI -->|HTTP / JSON| APIClient

    APIClient -->|HTTPS / REST-style API| Express

    Server -->|creates| Express
    Server -->|attaches to| SocketServer

    Express --> Security
    Security --> AuthMW
    AuthMW --> RBAC
    RBAC --> APIRouter

    APIRouter --> Auth
    APIRouter --> Workspace
    APIRouter --> Collaboration
    APIRouter --> Projects
    APIRouter --> Tasks
    APIRouter --> Comments
    APIRouter --> AssistantRoute

    Auth --> Drizzle
    Workspace --> Drizzle
    Collaboration --> Drizzle
    Projects --> Drizzle
    Tasks --> Drizzle
    Comments --> Drizzle

    Tasks -->|audit + notifications| Collaboration
    Tasks -->|workspace mutation events| SocketEvents
    Workspace -->|workspace events| SocketEvents

    Drizzle --> PGPool
    PGPool --> PostgreSQL
    Migrations --> PostgreSQL

    SocketClient -->|Socket.IO| SocketServer
    SocketServer -->|authenticated workspace rooms| SocketEvents
    SocketEvents -->|workspace changed / notifications changed| SocketClient
    SocketClient -->|invalidate queries| QueryCache
    QueryCache -->|refetch authoritative state| APIClient

    AssistantRoute --> AssistantService
    AssistantService --> Provider
    Provider --> AITools
    AITools --> Resolution
    AITools --> Risks

    AITools -->|verified workspace reads| Workspace
    AITools -->|verified project/task reads| Projects
    AITools -->|verified task reads| Tasks
    AITools -->|store pending proposal| AssistantService

    Provider -->|LLM generation| Groq
    Groq -->|response / tool decisions| Provider

    AssistantService -->|PENDING proposal| Drizzle

    PulseUI -->|edit / reject / approve| APIClient
    APIRouter --> AssistantRoute

    AssistantRoute -->|approve proposal| AssistantService
    AssistantService -->|atomic approved mutation| Tasks
    AssistantService -->|atomic approved comment| Comments
    AssistantService -->|audit approval + execution| Collaboration
    AssistantService -->|emit realtime update| SocketEvents
```

## 🧠 Technical Challenges & Key Learnings

💡 _Note for Reviewers: This section highlights my engineering mindset, problem-solving methodologies, and ability to overcome technical roadblocks during development._

**Challenge 1: Safe AI Mutations in a Multi-Tenant Environment**

- **The Problem:** Allowing an AI model to directly execute mutations on a database introduces severe security and data integrity risks, especially when dealing with tenant-isolated data.
- **The Solution:** I designed an approval-gated architecture where the AI generates a 15-minute `PENDING` proposal instead of directly executing writes. The approval process is model-free, atomically validating identity and roles before executing the command and emitting a live event.

**Challenge 2: Preventing LLM Hallucinations on Domain Data**

- **The Problem:** The AI could easily invent UUIDs or expose sensitive data from other tenants if given raw database access.
- **The Solution:** I implemented workspace-scoped service results. Tool inputs omit workspace IDs entirely, and projects/tasks are resolved by name against strictly verified workspace data. Risk severity is computed deterministically in TypeScript, leaving the model only responsible for summarizing safe conditions.

## 📦 Getting Started & Local Setup

**Prerequisites**
Make sure you have the following installed on your machine:

- Node.js (v24.18+)
- npm (v9.x or higher)
- A running instance of PostgreSQL 17 (or a Neon URL)

**Installation & Environment Configuration**
Clone the repository to your local machine:

```bash
git clone https://github.com/yourusername/coordra.git
cd coordra
```

Install the necessary dependencies for both the client and server:

```bash
# Install backend dependencies
npm ci

# Install frontend dependencies
npm --prefix frontend ci
```

Create a `.env` file in the root directory and frontend directory:

```bash
cp .env.example .env
cp frontend/.env.example frontend/.env
```

**Running the Application**
To launch the development server locally:

```bash
# Setup the database and seed it
npm run db:migrate
DEMO_SEED_CONFIRM=coordra-demo DEMO_SEED_PASSWORD='<12+ characters>' npm run db:seed:demo

# Run the backend
npm run dev
```

In another terminal, run the frontend:

```bash
npm run frontend:dev
```

The web app will be available at `http://localhost:3000`, the API at `http://localhost:8000`, and Swagger docs at `http://localhost:8000/api-docs`.

## 🔮 Future Improvements & Roadmap

- Implement a distributed rate-limit store to support horizontally scaled APIs.
- Add streaming presentation for Pulse AI responses.
- Integrate Redis for robust, distributed server-side caching.
- Expand deterministic read tools for the assistant.
