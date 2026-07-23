---
kind: build_system
name: Monorepo Build & Dockerized Deployment Pipeline
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

eLISAschool uses a **npm workspaces monorepo** with three packages (`backend`, `frontend`, `shared`) orchestrated through npm scripts, TypeScript compilation, and Docker Compose for local development and multi-stage Dockerfiles for production builds. There is no Makefile or CI pipeline in this branch — the build system is entirely npm/Docker-driven.

## Core Architecture

### Monorepo Structure (npm workspaces)
- Root `package.json` declares workspaces: `backend`, `frontend`, `shared`
- Shared package (`@elisaschool/shared`) exports types, enums, validators consumed by both frontend and backend via path aliases
- Each workspace has its own `package.json`, `tsconfig.json`, and build scripts
- Root-level scripts delegate to workspaces using `--workspace=` flags

### Backend Build Chain
- **Compiler**: TypeScript 5.7 → CommonJS output in `backend/dist/`
- **Runtime**: Node.js 20 (Alpine), Express server
- **Development**: `nodemon` + `ts-node --transpile-only` with hot reload
- **Database migrations**: TypeORM CLI (`typeorm migration:run`, `migration:generate`, `migration:revert`) configured against `src/database/data-source.ts`
- **Seeding**: Custom `ts-node` scripts under `src/database/seeds/` and `scripts/`
- **Linting**: ESLint 9 with TypeScript parser
- **Testing**: Jest 29 with ts-jest

### Frontend Build Chain
- **Bundler**: Vite 6 with React plugin, Tailwind CSS v4, TanStack Router codegen
- **PWA**: `vite-plugin-pwa` with Workbox caching strategies (NetworkFirst for API, CacheFirst for images)
- **Output**: Static assets served by Nginx in production
- **Development**: Vite dev server on port 7001 with HMR polling enabled for Docker volume mounts
- **Build**: `tsc -b && vite build` — type-check then bundle

### Docker Strategy
Two distinct Dockerfile approaches:

**Production** (`docker/Dockerfile.backend`, `docker/Dockerfile.frontend`):
- Multi-stage builds: `deps` → `builder` → `production`/`runner`
- Backend: Alpine node:20, non-root user `expressjs`, only prod dependencies via `npm ci --omit=dev`
- Frontend: Built with Node, served by `nginx:alpine` from `/usr/share/nginx/html`
- Separate compose files per environment: `docker-compose.local.dev.yml`, `docker-compose.local.prod.yml`, `docker-compose.cloud.dev.yml`, `docker-compose.cloud.prod.yml`

**Development** (`docker/docker-compose.yml`):
- Services: PostgreSQL 16 (port 7002), Redis 7 (port 7003), Backend (port 7000), Frontend (port 7001), pgAdmin (port 7004)
- Volume mounts for live code sync (`../backend:/app/backend`, `../frontend:/app`)
- Health checks on postgres and redis before starting dependent services
- Environment variables sourced from `.env` files in `docker/` directory

### Database Migration System
- SQL migrations in `backend/database/migrations/` (numbered 001–111+)
- TypeORM-managed with `data-source.ts` configuration
- Helper scripts in `backend/scripts/` for running migrations, seeds, and index fixes
- Shell wrappers in root `scripts/` for common deployment tasks (`deploy-migration-*.sh`, `run-seeds.sh`, etc.)

## Key Files

- `package.json` — Workspace orchestration, root scripts, engine constraints (Node ≥20, npm ≥10)
- `backend/package.json` — Backend build/test/lint/migrate/seed scripts
- `frontend/package.json` — Vite dev/build scripts
- `shared/package.json` — Shared package build entrypoint
- `backend/tsconfig.json` — Path aliases (`@modules/*`, `@common/*`, `@shared/*`), decorator support
- `frontend/vite.config.ts` — PWA config, route generation, chunk splitting, proxy disabled (uses `VITE_API_URL`)
- `docker/Dockerfile.backend` — Production backend image (multi-stage)
- `docker/Dockerfile.frontend` — Frontend build + Nginx serving
- `docker/docker-compose.yml` — Local dev stack with all services
- `docker/deploy.sh` — Deployment automation script
- `scripts/` — 80+ shell/JS utilities for migrations, deployments, testing, verification

## Developer Conventions

1. **Workspace commands**: Use root `npm run dev`, `npm run build`, `npm run test` instead of calling workspace scripts directly
2. **Environment variables**: All runtime config via `.env` files; never hardcode secrets
3. **Migrations**: Create new numbered SQL files in `backend/database/migrations/`; use `npm run db:migrate` to apply
4. **Docker dev**: Prefer `docker compose up -d` over direct `npm run dev` when needing full stack (DB, Redis, pgAdmin)
5. **Frontend API calls**: Use `VITE_API_URL` env var; do not configure Vite proxy (explicitly disabled due to Docker bug)
6. **Shared types**: Import from `@shared/*` alias rather than duplicating types between frontend/backend
7. **Port conventions**: Backend 7000, Frontend 7001, Postgres 7002, Redis 7003, pgAdmin 7004 — override via env vars
8. **No CI pipeline**: This branch contains no GitHub Actions/GitLab CI — deployment is manual via `docker/deploy.sh` and scripts

## Gaps & Observations

- No Makefile despite heavy shell scripting — could benefit from centralized build targets
- No CI/CD pipeline defined in this branch (no `.github/workflows/`, no `.gitlab-ci.yml`)
- Versioning is flat (`1.0.0` everywhere) — no semantic versioning automation
- Frontend build disables sourcemaps in production but backend enables them — inconsistent strategy
- `postinstall` hook removes conflicting `@types/express` versions — workaround for dependency conflict