# BHRM Teams — Enterprise Task-Centric Execution Platform

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | 20+ |
| npm | 10+ |
| PostgreSQL | 15+ (local installation) |

---

## Local Development Setup

### 1. Create the database

Open `psql` and run:

```sql
CREATE DATABASE bhrm_teams;
```

### 2. Configure environment

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/bhrm_teams"
JWT_SECRET=your-strong-random-secret-here
```

### 3. Install dependencies

```bash
cd backend
npm install --legacy-peer-deps
```

### 4. Run migrations & seed

```bash
# First time — creates all tables and seeds a demo admin
npm run db:setup

# Or separately:
npx prisma migrate dev --name init
npm run prisma:seed
```

### 5. Start the API

```bash
npm run start:dev
```

| Endpoint | URL |
|---|---|
| API | http://localhost:3000/api/v1 |
| Swagger | http://localhost:3000/api/docs |
| Health | http://localhost:3000/api/v1/health |

---

## Default credentials (after seed)

| Role  | Email           | Password    |
|-------|-----------------|-------------|
| Admin | admin@demo.com  | Admin1234!  |
| Staff | staff@demo.com  | Staff1234!  |

The seed also creates a demo company, project, active sprint, and one task assigned to the staff user so you can explore the full app right away.

---

## npm scripts (backend/)

| Command | Description |
|---|---|
| `npm run start:dev` | Dev server with hot-reload |
| `npm run build` | Compile TypeScript to `dist/` |
| `npx prisma migrate dev --name <name>` | Create and apply a new migration |
| `npx prisma generate` | Regenerate Prisma client after schema changes |
| `npm run prisma:studio` | Open Prisma Studio at localhost:5555 |
| `npm run prisma:seed` | Seed demo admin + company |
| `npm run prisma:reset` | Wipe DB and re-migrate (dev only) |

---

## Project Structure

```
BHRM Teams/
├── backend/                  # NestJS API
│   ├── prisma/
│   │   ├── schema.prisma     # Single source of truth for DB schema
│   │   ├── migrations/       # Prisma migration history
│   │   └── seed.ts           # Demo data seed
│   ├── src/
│   │   ├── app.module.ts
│   │   ├── main.ts
│   │   ├── common/
│   │   │   ├── decorators/   # @CurrentUser, @Public, @Roles
│   │   │   ├── enums/        # TaskStatus (+ transition map), Role
│   │   │   ├── filters/      # GlobalExceptionFilter
│   │   │   ├── guards/       # JWT, Roles, TaskAccess, CompanyOwner
│   │   │   ├── interfaces/   # JwtPayload
│   │   │   └── utils/        # pagination, slippage, slug, token
│   │   ├── config/           # app / database / jwt namespaces
│   │   ├── prisma/           # PrismaModule + PrismaService (global)
│   │   └── modules/
│   │       ├── auth/         # signup, login, accept-invite
│   │       ├── users/        # profile + password
│   │       ├── company/      # company CRUD
│   │       ├── staff/        # invite / suspend / activate
│   │       ├── projects/     # project CRUD + archive
│   │       ├── sprints/      # sprint lifecycle (draft→active→completed)
│   │       ├── tasks/        # full task lifecycle + sub-tasks
│   │       ├── steps/        # checklist steps with check/uncheck
│   │       ├── attachments/  # local file upload + download stream
│   │       ├── notes/        # notes with full version history
│   │       ├── comments/     # comments, replies, emoji reactions
│   │       ├── dashboard/    # admin + staff dashboards
│   │       └── health/       # GET /health (public, no JWT)
│   ├── uploads/              # local file storage (gitignored)
│   └── .env.example
├── frontend/                 # NextJS (Phase 9)
├── openapi/                  # Generated OpenAPI spec (Phase 9)
└── README.md
```

---

## Architecture & Workflow

```
Business Requirements
        ↓
Database Schema  (Prisma)
        ↓
OpenAPI Specification
        ↓
API Inventory
        ↓
Backend Implementation  ← current
        ↓
Generated API Client  (openapi-typescript-codegen)
        ↓
Frontend Screens  (Next.js + TanStack Query + Zustand)
```

---

## Deployment (MVP)

| Layer | Provider |
|---|---|
| Frontend | Vercel |
| Backend | Railway / Render / DigitalOcean VPS |
| Database | Neon / Supabase / Railway PostgreSQL |

Set `DATABASE_URL` to the hosted PostgreSQL connection string. No other changes required.
