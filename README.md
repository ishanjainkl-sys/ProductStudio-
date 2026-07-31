# ProductStudio

Component-first, JSON-driven website builder for design and engineering teams.

**Stack:** Turborepo monorepo · Next.js 15 · Express · Prisma · PostgreSQL · Zustand · dnd-kit

## Quick start

### Prerequisites

- Node.js 20+
- Docker (for PostgreSQL)
- npm 11+

### 1. Install

```bash
npm install
```

### 2. Start PostgreSQL

```bash
docker compose up -d
```

Postgres is exposed on **port 5433** (to avoid clashing with a local 5432 instance).

### 3. Environment

```bash
cp .env.example .env
cp .env apps/api/.env
```

### 4. Build packages, migrate & seed

```bash
npm run build
cd apps/api
npx prisma migrate dev
npm run seed
cd ../..
```

### 5. Run

```bash
npm run dev
```

- Web: http://localhost:3000  
- API: http://localhost:4000  
- Seed user: `designer@productstudio.local` / `password123`

## Monorepo layout

```
apps/
  web/          Next.js builder UI
  api/          Express + Prisma API
packages/
  shared-types/
  shared-schemas/
  component-sdk/
  component-registry/
  json-engine/
  renderer/
  export-engine/
  auth/
  ui-kit/
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start API + web via Turborepo |
| `npm run build` | Build all packages and apps |
| `npm run test` | Run unit tests |
| `npm run typecheck` | Strict TypeScript check |
| `npm run db:migrate` | Prisma migrate (api workspace) |
| `npm run db:seed` | Seed designer user |

## Architecture notes

- **JSON is the source of truth** — canvas, preview, and export all render the same `PageDocument`.
- **Shared Zod schemas** validate on client and server.
- **Auth** uses httpOnly JWT cookies (access + rotating refresh) behind Next.js rewrites (same-origin).
- **Export** produces deterministic HTML or React archives via `@productstudio/export-engine`.

## Spec alignment

Implements ProductStudio Technical & Product Specification v1.0 (Auth, Dashboard, Projects, Pages, Builder, Components, Templates, Assets, Theme, Autosave/Undo, Responsive, HTML/React Export).
