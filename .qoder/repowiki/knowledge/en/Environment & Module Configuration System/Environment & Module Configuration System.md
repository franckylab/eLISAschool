---
kind: configuration_system
name: Environment & Module Configuration System
category: configuration_system
scope:
    - '**'
source_files:
    - backend/src/config/env.config.ts
    - backend/src/config/database.config.ts
    - backend/src/config/index.ts
    - backend/src/config/swagger.config.ts
    - shared/src/config/config.registry.ts
    - shared/src/config/index.ts
    - docker/.env.local
    - docker/.env.cloud
    - docker/docker-compose.local.dev.yml
    - backend/.env
---

The eLISAschool monorepo implements a layered configuration system that combines runtime environment variables, Docker-based deployment profiles, and a shared module registry. The approach is split into three distinct layers:

1. Runtime Environment Configuration (Backend)
- backend/src/config/env.config.ts loads .env files via dotenv with multiple search paths, validates all keys with Zod, and exposes a typed envConfig object grouped by domain: app, database, jwt, encryption, redis, email, license, logging.
- backend/src/config/database.config.ts consumes envConfig to build TypeORM DataSourceOptions, switching entity/migration paths between src/ (dev) and dist/ (prod), enabling synchronize only in development, and adjusting pool size / SSL based on NODE_ENV.
- backend/src/config/swagger.config.ts provides a static OpenAPI spec mounted at /api/docs.

2. Deployment Profiles (Docker)
- docker/.env.local documents all local development variables (DB, Redis, SMTP, Twilio, Firebase, CORS, logging, cron flags).
- docker/.env.cloud defines production cloud settings with NODE_ENV=production, domain/SSL, backup schedule, monitoring toggles, and placeholders marked __AUTO_GENERATE__ for secrets.
- docker/docker-compose.local.dev.yml injects these env vars directly as service environment entries, overriding container defaults via ${VAR:-default} syntax. Frontend compose also generates a temporary .env.local with VITE_API_URL at startup.

3. Shared Module Registry (Runtime Feature Flags)
- shared/src/config/config.registry.ts is a TypeScript-only registry of every application module declaring label, description, icon, base path, default activation, premium flag, default roles, permissions, dependencies, and per-module defaultSettings.
- Exported helpers getModuleConfig(), getModulesByCategory(), hasModuleAccess() are consumed by both backend and frontend to drive UI navigation, permission checks, and dynamic feature enablement.
- This registry is the source of truth for which modules are available and what their built-in settings look like; runtime overrides are persisted separately in the database via the configuration module's REST API (/api/configuration).

How it all fits together
- On startup, env.config.ts loads .env, validates, produces envConfig.
- database.config.ts reads envConfig.database + envConfig.app.isProduction to wire TypeORM.
- app.ts reads envConfig.app.* for port, CORS origins, version info, and Swagger mounting.
- Services (Redis, email, etc.) import envConfig from @config/env.config.
- The shared MODULE_REGISTRY is independent of env vars — it defines what can be configured; the configuration module persists actual values per establishment.

Rules developers should follow
- Add new runtime variables in envSchema (with sensible defaults) and re-export them under the appropriate envConfig sub-object.
- Do not read process.env directly outside env.config.ts; always use the typed envConfig export.
- New modules must register themselves in shared/src/config/config.registry.ts with defaultActive, premium, dependencies, and defaultSettings so they appear in the admin UI and pass permission checks.
- Per-establishment overrides go through the /api/configuration endpoints, never by editing the registry.
- For deployment, create/update a profile in docker/.env.* and reference it via --env-file or compose environment: blocks; never hardcode secrets in code.