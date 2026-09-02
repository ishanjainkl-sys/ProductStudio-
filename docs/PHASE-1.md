# Phase 1 — Project Setup (Week 1)

Phase 1 establishes the Turborepo monorepo, core packages, database layer, and shared tooling.

## Status: Complete

Run the verifier anytime:

```bash
npm run verify:phase1
```

## Tech stack

| Layer | Choice |
|-------|--------|
| Frontend | Next.js 15 + TypeScript |
| Backend | Express.js + TypeScript |
| Database | PostgreSQL (Docker) |
| ORM | Prisma (root `prisma/`) |
| State | Zustand |
| Drag & drop | @dnd-kit/core + @dnd-kit/sortable |
| Validation | Zod |
| Monorepo | Turborepo + npm workspaces |

## Monorepo layout

```
productstudio/
├── apps/
│   ├── web/                 # Next.js builder UI
│   └── api/                 # Express + Prisma client
├── packages/
│   ├── shared-types/        # Core TypeScript types & IDs
│   ├── component-sdk/       # ComponentDefinition contract
│   ├── component-registry/  # Built-in components
│   ├── json-engine/         # PageDocument tree operations
│   └── renderer/            # React page renderer
├── prisma/                  # Schema, migrations, seed
├── tooling/                 # Shared tsconfig & eslint (DX)
├── turbo.json
└── docker-compose.yml
```

Additional packages (`shared-schemas`, `auth`, `export-engine`, `ui-kit`) were added in later phases but do not change the Phase 1 foundation.

## Dependencies (installed)

```bash
# API
npm install prisma @prisma/client zod -w @productstudio/api

# Web
npm install zustand @dnd-kit/core @dnd-kit/sortable -w @productstudio/web

# Root (Prisma CLI for migrations)
npm install -D prisma
```

## Setup checklist

- [x] Turborepo monorepo with `apps/*` and `packages/*` workspaces
- [x] Next.js web app with TypeScript strict mode
- [x] Express API with TypeScript strict mode
- [x] PostgreSQL via `docker compose up -d` (port **5433**)
- [x] Prisma schema at **`prisma/schema.prisma`** (root)
- [x] Shared packages: `shared-types`, `component-sdk`, `component-registry`, `json-engine`, `renderer`
- [x] Zustand store in web app
- [x] dnd-kit wired in builder shell
- [x] Zod schemas in API and `@productstudio/shared-schemas`
- [x] Root scripts: `dev`, `build`, `typecheck`, `db:migrate`, `db:seed`, `verify:phase1`

## Quick start

```bash
npm install
cp .env.example .env
cp .env apps/api/.env
docker compose up -d
npm run db:migrate
npm run db:seed
npm run build
npm run verify:phase1
npm run dev
```

- Web: http://localhost:3000
- API: http://localhost:4000
- Seed user: `designer@productstudio.local` / `password123`

## Next phase

Phase 2 covers authentication, dashboard, and project CRUD (already implemented in this repo).
