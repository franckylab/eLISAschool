---
kind: build_system
name: Monorepo Build & Docker Orchestration
category: build_system
scope:
    - '**'
source_files:
    - package.json
    - backend/package.json
    - frontend/package.json
    - shared/package.json
    - backend/tsconfig.json
    - frontend/vite.config.ts
    - docker/Dockerfile.backend
    - docker/Dockerfile.frontend
    - docker/docker-compose.yml
    - docker/deploy.sh
---

## System Overview

eLISAschool uses an **npm workspaces monorepo** with three packages (`backend`, `frontend`, `shared`) orchestrated through **Docker Compose** for local/cloud development and production. There is no CI/CD pipeline in the repository — builds are driven by npm scripts and shell deployment scripts.

## Build Stack

- **Root orchestrator**: `package.json` defines workspaces and top-level scripts (`dev`, `build`, `test`, `db:migrate`, `docker:*`). All commands are forwarded to workspace sub-packages via `--workspace=...`.
- **Backend** (`@elisaschool/backend`): TypeScript + Express, compiled with `tsc` (ES2022, CommonJS) into `dist/`. TypeORM handles migrations (`migration:run`, `migration:generate`, `migration:revert`). Jest runs tests. Nodemon drives dev hot-reload.
- **Frontend** (`@elisaschool/frontend`): React 19 + Vite 6 + TanStack Router. Build chain is `tsc -b && vite build`. PWA generated via `vite-plugin-pwa`.
- **Shared contracts** (`@elisaschool/shared`): Pure TypeScript package of enums/types/Zod validators consumed by both backend and frontend; built independently first.

## Docker Architecture

Two-tier containerization per service:

- **Development images** use bind mounts so source changes reload without rebuilds (backend via nodemon, frontend via Vite HMR polling).
- **Production images** are multi-stage: `deps` → `builder` → `production` (backend) or `builder` → `nginx:alpine` (frontend). Only `node_modules --omit=dev` and compiled `dist/` artifacts ship.

Compose services: `postgres` (port 7002), `redis` (port 7003), `backend` (port 7000), `frontend` (port 7001), `pgadmin` (port 7004). Health checks gate startup ordering.

Environment variants are selected by compose files:
- `docker-compose.local.dev.yml` / `.local.prod.yml`
- `docker-compose.cloud.dev.yml` / `.cloud.prod.yml`

The single entrypoint `docker/deploy.sh` resolves mode (`local-dev | local-prod | cloud-dev | cloud-prod`), auto-generates secrets (JWT, DB password, Redis password, encryption key, pgAdmin password) when placeholders are detected, validates minimum secret lengths in prod, auto-detects host IP and injects CORS origins, then delegates to `docker compose -f <compose-file> up|down|restart|rebuild|status|logs`.

## Database Migrations & Seeds

- SQL migration files live under `backend/database/migrations/` (numbered `NNN-*.sql` plus a few `.ts` helpers).
- Runtime execution via TypeORM CLI: `npm run migration:run` (root alias forwards to backend).
- Seed data lives under `backend/src/database/seeds/` with dedicated scripts (`run-seeds.ts`, `run-rbac-seed.ts`, `run-demo-seeds.ts`).
- A large collection of one-shot shell scripts under `scripts/` and `backend/scripts/` deploy individual features/migrations (e.g. `deploy-messagerie-v2.1.sh`, `deploy-permissions.sh`, `run-scoring-sql-migration.sh`). These are ad-hoc, not part of a formal release pipeline.

## Conventions & Rules

- **Node/NPM versions**: root `engines` enforces `node >= 20`, `npm >= 10`.
- **Workspace-first**: never install dependencies directly at the repo root; always add to the appropriate workspace `package.json`.
- **Build order**: shared must be built before backend/frontend consume it (enforced in Dockerfile builder stage and in `frontend/vite.config.ts` alias `@shared`).
- **TypeScript paths**: backend maps `@modules/*`, `@common/*`, `@config/*`, `@database/*`, `@shared/*`; frontend maps `@` and `@shared`. Keep these aliases consistent across packages.
- **Ports are fixed**: backend 7000, frontend 7001, postgres 7002, redis 7003, pgadmin 7004 — change only via env vars in the relevant `.env.*` file.
- **Secrets**: never commit `.env.local` or `.env.cloud`; they are generated on first deploy by `deploy.sh`. Production requires JWT_SECRET ≥ 64 chars, DB_PASSWORD ≥ 16 chars, ENCRYPTION_KEY ≥ 32 chars.
- **No CI**: there is no GitHub Actions/GitLab CI configuration. The project relies on manual `./docker/deploy.sh` invocations and per-feature shell scripts for rollout.

## Key Files

- `package.json` — root workspaces & orchestration scripts
- `backend/package.json` — backend build/test/migration/seed scripts
- `frontend/package.json` — Vite/PWA build scripts
- `shared/package.json` — shared contracts package
- `backend/tsconfig.json` — TS compilation targets & path aliases
- `frontend/vite.config.ts` — Vite plugins, PWA, chunking, HMR
- `docker/Dockerfile.backend` — multi-stage production image
- `docker/Dockerfile.frontend` — build + nginx runner
- `docker/docker-compose.yml` — default compose (dev) with health checks
- `docker/deploy.sh` — environment selector, secret generation, validation, compose dispatcher
- `docker/.env.local` / `docker/.env.cloud` — environment templates with auto-generated secrets