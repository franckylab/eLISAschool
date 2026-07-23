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
    - docker/docker-compose.yml
    - docker/Dockerfile.backend
    - docker/Dockerfile.backend.dev
    - docker/Dockerfile.frontend
---

The project uses an npm workspaces monorepo to build and orchestrate three packages — backend (Express + TypeORM), frontend (React + Vite PWA), and shared (TypeScript types/enums) — with Docker Compose providing the runtime environment (PostgreSQL, Redis, pgAdmin). There is no Makefile or CI pipeline in this branch; build and deployment are driven by npm scripts and Dockerfiles.

Workspace layout and top-level scripts:
- Root package.json declares workspaces [backend, frontend, shared] and exposes unified commands: npm run dev (parallel backend+frontend), npm run build, npm run test, npm run lint, plus db:migrate / db:seed forwarding to the backend workspace. A postinstall hook removes a conflicting @types/express-serve-static-core.
- Engine constraints require Node >=20 and npm >=10.

Backend build chain:
- TypeScript compilation via tsc (build script is tsc || true); output goes to dist/ with CommonJS modules, ES2022 target, strict mode, decorators enabled, source maps and declaration files emitted. Path aliases map @modules/*, @common/*, @config/*, @database/*, @shared/* to src/... and the sibling shared/src.
- Development runs through nodemon + ts-node --transpile-only so no pre-build step is needed locally.
- Database migrations are managed by TypeORM CLI (migration:run, migration:generate, migration:revert) against src/database/data-source.ts; seeds are executed via dedicated ts-node scripts under src/database/seeds/.
- Tests use Jest (jest.config.ts) with unit/integration suites under test/.

Frontend build chain:
- Built with Vite 6 + React plugin + Tailwind v4 + TanStack Router codegen (routeTree.gen.ts). The build command first runs tsc -b then vite build; production bundles are split into manual chunks (react-vendor, query-vendor, router-vendor, ui-vendor) and served from dist/.
- PWA support is provided by vite-plugin-pwa with Workbox caching rules for /api/* and static images; PWA dev registration is disabled to avoid message violations.
- HMR uses polling (usePolling: true, interval 100ms) to work inside Docker bind mounts.

Shared package:
- Pure TypeScript library built with tsc; published as main: dist/index.js with types: dist/index.d.ts. Both backend and frontend import it via path aliases rather than npm linking.

Docker image construction:
- Development backend (docker/Dockerfile.backend.dev): single-stage node:20-alpine that installs all dependencies (including dev) and runs nodemon; source is mounted via volumes for hot-reload.
- Production backend (docker/Dockerfile.backend): multi-stage — deps stage installs everything, builder stage runs npm run build --workspace=shared && npm run build --workspace=backend, and the final production stage copies only --omit=dev node_modules plus the compiled dist/ trees, running as a non-root expressjs user.
- Frontend (docker/Dockerfile.frontend): multi-stage building the Vite app and serving the static dist/ from nginx:alpine using docker/nginx.conf.
- Compose (docker/docker-compose.yml): defines services postgres (port 7002), redis (port 7003), backend (port 7000, depends on healthy postgres/redis), frontend (port 7001, proxies to backend via VITE_API_URL), and pgadmin (port 7004). Environment variables are sourced from .env files; healthchecks gate startup order.

Environment configuration:
- Backend env vars cover DB, Redis, JWT secret, encryption key, SMTP/Twilio/Firebase credentials, CORS origins, and frontend URL. Frontend reads VITE_API_URL at build time. Separate compose variants exist for local/cloud and dev/prod (docker-compose.local.dev.yml, docker-compose.cloud.prod.yml, etc.).

Conventions developers should follow:
- Add new workspace packages under the root workspaces array and expose matching npm scripts at the root level.
- Keep backend builds deterministic: prefer tsc over transpile-only in production; rely on the multi-stage Dockerfile which already builds shared before backend.
- Do not remove the || true from the backend build script until all TS errors are fixed — it currently allows the build to pass even when tsc fails.
- When adding new environment variables, document them in docker/docker-compose.yml and provide defaults via ${VAR:-default} syntax.
- Use the existing path aliases (@shared/*, @modules/*, ...) instead of relative imports across the monorepo to keep builds stable.
- Frontend route changes must go through TanStack Router's file-based generator; do not edit routeTree.gen.ts manually.