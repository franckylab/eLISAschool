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
    - docker/docker-compose.yml
    - docker/docker-compose.local.dev.yml
    - docker/docker-compose.cloud.prod.yml
    - docker/Dockerfile.backend
    - docker/Dockerfile.frontend
    - docker/Dockerfile.backend.dev
    - scripts/deploy-complet.sh
---

The eLISAschool project uses an npm workspaces monorepo to build and deploy a NestJS backend, React frontend, and shared TypeScript kernel. The root package.json declares three workspaces (backend, frontend, shared) and exposes unified scripts for development, building, testing, linting, database migrations/seeding, and Docker orchestration. Each workspace is independently typed with TypeScript and has its own tsc/Vite/Nest build pipeline, while the root orchestrates cross-workspace dependencies (e.g., build:backend depends on shared/dist).

Build toolchain:
- Backend: TypeScript compiled via tsc into dist/, run in dev through ts-node + nodemon (hot-reload), production entry backend/dist/index.js.
- Frontend: Vite-based React app; build runs tsc -b && vite build producing a static SPA served by Nginx in production images.
- Shared package: plain tsc emitting dist/index.{js,d.ts} consumed by both sides.

Containerization:
- Production multi-stage Dockerfiles: docker/Dockerfile.backend (Node 20 Alpine, install deps, build shared then backend, final image runs only node_modules --omit=dev plus compiled dist/), docker/Dockerfile.frontend (builds inside Node, serves dist/ via nginx:alpine).
- Development Dockerfile Dockerfile.backend.dev mounts source volumes and runs nodemon for live reload.
- Three Compose profiles cover local dev (docker-compose.local.dev.yml), generic compose (docker-compose.yml), and cloud prod (docker-compose.cloud.prod.yml) with Nginx Proxy Manager + Let's Encrypt companion. Services include PostgreSQL 16, Redis 7, pgAdmin, backend, and frontend, all health-checked and resource-limited in prod.

Database migration & seeding:
- TypeORM CLI commands (migration:run, migration:generate, migration:revert) wired to src/database/data-source.ts.
- A large set of numbered SQL migrations under backend/database/migrations/ are also executed directly by shell helpers (scripts/deploy-complet.sh, deploy-all-migrations.sh, scripts/run-migration.ts, etc.).
- Seed runners (src/database/seeds/run-seeds.ts, run-rbac-seed.ts, run-demo-seeds.ts) are invoked via npm run seed* or from deployment scripts.

Deployment automation:
- Root-level shell scripts (scripts/deploy-*.sh, scripts/deploy-complet.sh) orchestrate DB creation, sequential SQL migration execution, seed running, optional TS build, and service restarts.
- Docker Compose scripts at the root (docker:dev, docker:prod, docker:clean, etc.) provide one-command lifecycle management.
- Cloud profile composes reverse proxy, SSL, and resource constraints; local profile enables hot-reload and IP auto-detection.

Conventions developers should follow:
- Add new packages to the appropriate workspace package.json; never install at the root unless it belongs to the monorepo graph.
- When adding shared types/enums, update shared/ and rebuild it before consuming in backend/frontend.
- Database changes go as numbered SQL files in backend/database/migrations/ AND/OR TypeORM entities + typeorm migration:generate; keep both paths in sync.
- Use npm run build --workspace=<pkg> and npm run test --workspace=<pkg> instead of calling tools directly so dependency order is respected.
- For containerized builds, rely on the provided Dockerfiles and Compose profiles; do not hardcode secrets — use .env / environment variables exposed in the compose files.