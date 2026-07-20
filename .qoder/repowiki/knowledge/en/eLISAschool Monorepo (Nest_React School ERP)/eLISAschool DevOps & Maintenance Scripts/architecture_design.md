Flat collection of executable entry points with no internal package structure; each script is self-contained and targets a single lifecycle concern. Categories (naming convention) are:
- `deploy-*.sh` — one-shot module rollouts that run a SQL migration from `backend/database/migrations/`, then `npm install` + `npm run build` + optional `docker-compose restart backend`.
- `run-migration-*.sh` / `run-*-migration.sh` — thin wrappers around `psql -f <file>` or `ts-node` seeders against the configured PostgreSQL instance.
- `test-*.sh` — curl-based smoke tests hitting `http://localhost:3001/api/*` endpoints to assert HTTP status and JSON shape.
- `verify-*.sh` / `validate-*.sh` — environment probes (Docker containers, file existence, import grep checks) returning exit code 0 on success.
- `fix-*.sh` / `fix-*.sql` — idempotent DB patches (RBAC, permissions, FKs) executed via `psql` with `PGPASSWORD`.
- `start-dev.sh` / `stop-dev.sh` / `rebuild-docker.sh` — orchestrate Docker Compose (`postgres`, `redis`) and launch Node dev servers, writing PIDs under `/tmp/elisaschool-*.pid`.
- `migrate-*.sh` / `quick-start-v2.sh` — full bootstrap combining DB creation, sequential SQL migrations, and `ts-node -r tsconfig-paths/register src/database/seeds/run-seeds.ts`.

Dependency direction is outward only: scripts depend on host tools (`bash`, `docker`, `psql`, `curl`, `pg_dump`, `createdb`, `npm`, `npx`, `ts-node`, `tsconfig-paths`) and on sibling repo directories (`backend/`, `frontend/`, `docker/`). There is no shared library; common helpers (ANSI colors, `check()`/`check_warning()`, `set -e`) are duplicated per script rather than sourced, keeping each file independently runnable.