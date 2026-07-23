---
kind: configuration_system
name: Environment-Based Configuration with Zod Validation
category: configuration_system
scope:
    - '**'
source_files:
    - backend/src/config/env.config.ts
    - backend/src/config/database.config.ts
    - backend/src/config/swagger.config.ts
    - backend/src/config/index.ts
    - backend/.env
    - docker/.env.local
    - docker/.env.cloud
    - backend/src/app.ts
---

The eLISAschool backend uses a layered, environment-driven configuration system centered on .env files validated at startup with Zod schemas. The approach separates runtime process configuration from application-level settings persisted in the database (the configuration module).

### What system/approach is used
- dotenv for loading .env files, with an explicit search order across multiple candidate paths so the app can find the file regardless of how it is invoked (compiled dist/, source src/, or nested backend/).
- Zod (z.object) to validate every required variable and coerce types (e.g. Number transforms), failing fast in production and falling back to safe defaults in development.
- A single typed envConfig object exported as a structured namespace (app.*, database.*, jwt.*, encryption.*, redis.*, email.*, license.*, logging.*) consumed by all modules via the @config/env.config path alias.
- TypeORM DataSourceOptions are built from envConfig in database.config.ts, with dev/prod-specific entity/migration/subscriber paths and pool sizes.
- Swagger/OpenAPI spec lives in swagger.config.ts and is mounted under /api/docs.

### Key files and packages
- backend/src/config/env.config.ts — dotenv loader + Zod schema + typed envConfig export
- backend/src/config/database.config.ts — TypeORM DataSourceOptions derived from env config
- backend/src/config/swagger.config.ts — OpenAPI specification object
- backend/src/config/index.ts — barrel re-export of envConfig and databaseConfig
- backend/.env — local secrets (JWT secret, DB password, encryption key)
- docker/.env.local — full development template (ports, Redis, SMTP, Twilio, Firebase, logging, cron flags)
- docker/.env.cloud — production/cloud template (domain, SSL mode, auto-generated secrets placeholder, monitoring, backups)
- backend/src/app.ts — consumes envConfig for CORS origins, rate limiting, health check version, static asset paths
- backend/src/database/data-source.ts — bootstraps TypeORM using databaseConfig

### Architecture and conventions
1. Single source of truth: All process-level configuration flows through env.config.ts. Modules never read process.env directly; they import envConfig.
2. Strict validation: Every variable has a Zod rule with a default where sensible. In production any missing/invalid variable causes process.exit(1); in development the code injects generated secrets (JWT, encryption key) and logs warnings.
3. Environment templates per deployment target: docker/.env.local for Docker/local dev, docker/.env.cloud for cloud deployments. Both document every option with comments and groupings (Application, DB, JWT, Email, SMS, Push, Logging, Cron, Monitoring, Backups).
4. TypeORM path resolution: database.config.ts switches between .ts (dev) and .js (prod) globs for entities, migrations, and subscribers based on envConfig.app.isProduction.
5. CORS and security driven by env: app.ts builds the allowed-origin list from ALLOWED_ORIGINS plus FRONTEND_URL, and applies stricter rate limits on auth endpoints.
6. Runtime vs. persistent configuration: Process/runtime settings live in .env; user-editable application settings (module activation, parameters, preferences) are stored in the database via the modules/configuration module and exposed over REST. These two layers are distinct — env config boots services, while the configuration module manages feature toggles and tenant-scoped parameters.

### Rules developers should follow
- Never access process.env directly — always use envConfig.<namespace>.<key> from @config/env.config.
- Add new variables in three places: define the Zod rule with a default in env.config.ts, document it in both docker/.env.local and docker/.env.cloud, and wire it into the relevant consumer (e.g. database.config.ts, app.ts, or a service).
- Keep secrets out of source control — only docker/.env.* templates belong in the repo; real values go into the running container's environment or a secrets manager.
- Use the provided templates — copy docker/.env.local to .env for local work, and docker/.env.cloud for cloud deployments; do not edit them in place.
- For TypeORM changes, ensure entities, migrations, and subscribers glob patterns remain correct when adding new directories under modules/ or database/.
- Swagger entries for new public endpoints should be added to swagger.config.ts to keep /api/docs accurate.