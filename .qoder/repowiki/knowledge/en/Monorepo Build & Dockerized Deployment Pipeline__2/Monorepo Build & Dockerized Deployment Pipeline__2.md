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
    - shared/tsconfig.json
    - frontend/vite.config.ts
    - backend/jest.config.ts
    - docker/Dockerfile.backend
    - docker/Dockerfile.backend.dev
    - docker/Dockerfile.frontend
    - docker/docker-compose.yml
    - docker/deploy.sh
    - VERSION
---

eLISAschool uses an npm workspaces monorepo with three packages — @elisaschool/backend (Express/TypeScript), @elisaschool/frontend (React/Vite/PWA), and @elisaschool/shared (shared enums, Zod validators, API types) — orchestrated from a root package.json. There is no Makefile or CI pipeline; the build system is entirely npm + Docker Compose driven.

Build toolchain
- TypeScript compilation via per-package tsconfig.json; backend and shared emit CommonJS to ./dist, frontend emits ES modules through Vite.
- Backend dev server: nodemon --exec ts-node with tsconfig-paths for @modules/*, @common/*, @database/*, @shared/* aliases.
- Frontend dev server: Vite on port 7001 with HMR polling enabled for Docker bind mounts; PWA generated via vite-plugin-pwa with manual chunking (react-vendor, query-vendor, router-vendor, ui-vendor).
- Shared package built first (npm run build --workspace=shared) then backend (--workspace=backend) in Docker multi-stage builds.

Workspace scripts (root)
- npm run dev launches both backend and frontend concurrently.
- npm run build / build:backend / build:frontend delegate to each workspace.
- npm test runs Jest across workspaces; backend tests live under backend/test/** and backend/tests/**.
- Database ops: npm run db:migrate (typeorm migration:run -d src/database/data-source.ts) and npm run db:seed (ts-node ... src/database/seeds/run-seeds.ts).

Dockerization
- docker/Dockerfile.backend: multi-stage (deps -> builder -> production node:20-alpine); production image runs as non-root user expressjs, exposes port 7000, copies only backend/dist and shared/dist.
- docker/Dockerfile.backend.dev: single-stage image with all deps installed plus source copied for volume-mounted hot reload.
- docker/Dockerfile.frontend: builds inside Node, serves static dist/ via nginx:alpine on port 80.
- docker/docker-compose.yml defines four services: postgres:16-alpine (port 7002), redis:7-alpine (port 7003, AOF + password), backend (dev image, nodemon, depends on health checks), frontend (Vite dev server, depends on backend), plus optional pgadmin4 (port 7004). All share a bridge network elisaschool_network.
- Additional compose variants exist for local/cloud dev/prod (docker-compose.local.dev.yml, .local.prod.yml, .cloud.dev.yml, .cloud.prod.yml).

Deployment orchestration
- docker/deploy.sh is the single entry point supporting modes local-dev | local-prod | cloud-dev | cloud-prod and actions up | down | restart | rebuild | status | logs. It auto-generates secrets (DB_PASSWORD, JWT_SECRET, REDIS_PASSWORD, ENCRYPTION_KEY, PGADMIN_PASSWORD) when placeholders are detected, validates minimum secret lengths in prod mode, auto-detects host IP and injects CORS origins, and performs basic connectivity probes after startup.
- Environment files: docker/.env.local and docker/.env.cloud drive configuration; ports are parameterized via APP_PORT, FRONTEND_PORT, DB_PORT, REDIS_PORT, PGADMIN_PORT.

Versioning
- A plain-text VERSION file at repo root holds the current version string (1.0.0); individual workspace package.json files also declare "version": "1.0.0" but there is no automated version bumping script.

Conventions developers should follow
- Add new dependencies to the appropriate workspace package.json; never install at the root.
- Use npm run <script> --workspace=<pkg> or the root shortcuts (dev, build, test) instead of invoking tools directly.
- Keep database migrations under backend/src/database/migrations/ and run them via npm run db:migrate; do not edit compiled dist/ artifacts.
- When adding environment variables, document them in the relevant .env.* file and ensure the compose service passes them through.
- For production images, rely on the provided multi-stage Dockerfiles — do not add dev-only dependencies to the final stage.