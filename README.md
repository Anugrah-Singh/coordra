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
flowchart LR

    %% =========================================================
    %% CLIENT
    %% =========================================================

    User["👤 User / Browser"]

    subgraph Frontend["FRONTEND — Next.js"]
        direction TB

        App["Next.js App Router"]

        subgraph UI["Application UI"]
            AuthUI["Auth UI"]
            WorkspaceUI["Workspace / Project UI"]
            PulseUI["Pulse Assistant UI"]
        end

        APIClient["Frontend API Client"]
        QueryCache["TanStack Query Cache"]
        SocketClient["Socket.IO Client"]

        App --> UI
        UI --> APIClient
        WorkspaceUI --> QueryCache
        SocketClient --> QueryCache
    end


    %% =========================================================
    %% BACKEND
    %% =========================================================

    subgraph Backend["BACKEND — Node.js / Express Modular Monolith"]
        direction TB

        Server["server.ts<br/>Server Bootstrap"]

        %% -------------------------
        %% HTTP LAYER
        %% -------------------------

        subgraph HTTP["HTTP / API LAYER"]
            direction TB

            Express["Express App"]

            Security["Security Middleware<br/>Helmet · CORS · Cookies<br/>CSRF · Rate Limit · Validation"]

            AuthMW["Authentication Middleware<br/>JWT Cookie Verification"]

            RBAC["Workspace RBAC<br/>Membership + Role Check"]

            Router["API Router<br/>/api"]

            Express --> Security
            Security --> AuthMW
            AuthMW --> RBAC
            RBAC --> Router
        end


        %% -------------------------
        %% DOMAIN SERVICES
        %% -------------------------

        subgraph Domain["DOMAIN SERVICES"]
            direction LR

            Auth["Auth Service"]
            Workspace["Workspace Service"]
            Collaboration["Collaboration<br/>Members · Invites · Labels · Activity"]
            Projects["Project Service"]
            Tasks["Task Service"]
            Comments["Comment Service"]
        end


        %% -------------------------
        %% PULSE AI
        %% -------------------------

        subgraph Pulse["PULSE AI"]
            direction TB

            AssistantRoute["Assistant Routes"]

            AssistantService["Assistant Service<br/>Proposal Lifecycle"]

            Provider["AI Provider<br/>Vercel AI SDK"]

            AITools["Verified AI Tools"]

            Resolution["Name Resolution"]
            Risks["Deterministic Risk Analysis"]

            AssistantRoute --> AssistantService
            AssistantService --> Provider
            Provider --> AITools

            AITools --> Resolution
            AITools --> Risks
        end


        %% -------------------------
        %% REALTIME
        %% -------------------------

        subgraph Realtime["REALTIME"]
            direction TB

            SocketServer["Socket.IO Server"]

            SocketEvents["Workspace / User Events"]

            SocketServer --> SocketEvents
        end


        %% -------------------------
        %% PERSISTENCE
        %% -------------------------

        subgraph Persistence["PERSISTENCE"]
            direction TB

            Drizzle["Drizzle ORM"]

            PGPool["node-postgres Pool"]

            PostgreSQL[("PostgreSQL")]

            Migrations["Drizzle SQL Migrations"]

            Drizzle --> PGPool
            PGPool --> PostgreSQL
            Migrations --> PostgreSQL
        end

        %% Bootstrap
        Server --> Express
        Server --> SocketServer

        %% API → Domains
        Router --> Auth
        Router --> Workspace
        Router --> Collaboration
        Router --> Projects
        Router --> Tasks
        Router --> Comments
        Router --> AssistantRoute

        %% Domains → DB
        Auth --> Drizzle
        Workspace --> Drizzle
        Collaboration --> Drizzle
        Projects --> Drizzle
        Tasks --> Drizzle
        Comments --> Drizzle

        %% Domain events
        Tasks -->|audit + notifications| Collaboration
        Tasks -->|mutation events| SocketEvents
        Workspace -->|workspace events| SocketEvents

        %% Pulse → Domain
        AITools -->|verified workspace reads| Workspace
        AITools -->|verified project reads| Projects
        AITools -->|verified task reads| Tasks

        AITools -->|store pending proposal| AssistantService

        AssistantService -->|PENDING proposal| Drizzle

        %% Approved AI actions
        AssistantService -->|atomic task mutation| Tasks
        AssistantService -->|atomic comment mutation| Comments
        AssistantService -->|audit approval + execution| Collaboration
        AssistantService -->|realtime update| SocketEvents
    end


    %% =========================================================
    %% EXTERNAL AI
    %% =========================================================

    Groq["Groq API<br/>LLM Provider"]


    %% =========================================================
    %% CLIENT → BACKEND
    %% =========================================================

    User --> App

    AuthUI -->|HTTP + Auth Cookie| APIClient
    WorkspaceUI -->|HTTP / JSON| APIClient
    PulseUI -->|HTTP / JSON| APIClient

    APIClient -->|HTTPS / REST API| Express


    %% =========================================================
    %% REALTIME CLIENT CONNECTION
    %% =========================================================

    SocketClient -->|Socket.IO| SocketServer

    SocketServer -->|Authenticated<br/>Workspace Rooms| SocketEvents

    SocketEvents -->|Workspace / Notification Changes| SocketClient

    SocketClient -->|Invalidate Queries| QueryCache

    QueryCache -->|Refetch Authoritative State| APIClient


    %% =========================================================
    %% AI PROVIDER
    %% =========================================================

    Provider -->|LLM Generation| Groq
    Groq -->|Response + Tool Decisions| Provider


    %% =========================================================
    %% PULSE USER ACTIONS
    %% =========================================================

    PulseUI -->|Edit / Reject / Approve| APIClient
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
