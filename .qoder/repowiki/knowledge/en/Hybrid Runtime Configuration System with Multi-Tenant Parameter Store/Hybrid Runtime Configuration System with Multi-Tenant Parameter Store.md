---
kind: configuration_system
name: Hybrid Runtime Configuration System with Multi-Tenant Parameter Store
category: configuration_system
scope:
    - '**'
source_files:
    - backend/src/config/env.config.ts
    - backend/src/config/database.config.ts
    - backend/src/config/index.ts
    - backend/src/modules/configuration/entities/parametre-systeme.entity.ts
    - backend/src/modules/configuration/services/configuration.service.ts
    - backend/src/modules/configuration/utils/config.helper.ts
    - docker/.env.local
    - docker/.env.cloud
    - docker/docker-compose.yml
    - backend/.env
---

## What system/approach is used

The eLISAschool monorepo implements a **hybrid configuration system** combining two layers:

1. **Static environment configuration** — loaded at process startup from `.env` files, validated with Zod schemas, and exposed through a typed `envConfig` object.
2. **Dynamic runtime configuration** — persisted in PostgreSQL via the `parametres_systeme` table, managed by `ConfigurationService`, with multi-tenant scoping (global vs per-establishment overrides), in-memory caching, change listeners, and audit history.

Environment variables are resolved in priority order: `../../.env` → `./.env` → `__dirname/../../.env` → `backend/.env`, falling back to generated defaults in development for JWT secrets and encryption keys. Docker Compose injects environment variables into containers using `.env.local` / `.env.cloud` templates.

## Key files and packages

- `backend/src/config/env.config.ts` — Zod-validated env loader, structured export (`app`, `database`, `jwt`, `encryption`, `redis`, `email`, `license`, `logging`).
- `backend/src/config/database.config.ts` — TypeORM `DataSourceOptions` derived from `envConfig`, with dev/prod path resolution.
- `backend/src/config/swagger.config.ts` — Static OpenAPI spec (not runtime-configurable).
- `backend/src/modules/configuration/entities/parametre-systeme.entity.ts` — `ParametreSysteme` entity storing key/value/type/category/module/scoped-to-establishment parameters.
- `backend/src/modules/configuration/services/configuration.service.ts` — Core service: CRUD on params, module activation toggles, dependency graph validation, cache invalidation, event emission, bulk operations, reset/export.
- `backend/src/modules/configuration/utils/config.helper.ts` — Thin typed helpers (`getParam`, `getParamBoolean`, `isModuleActive`, …) with a 60s quick-cache layer over the service.
- `docker/.env.local`, `docker/.env.cloud` — Environment templates for local/cloud deployments.
- `docker/docker-compose.yml` — Container env injection mapping `.env` vars to services.
- `backend/.env` — Local development secrets (JWT secret, DB password, encryption key).

## Architecture and conventions

### Two-tier model
| Layer | Source | Mutability | Scope | Example |
|---|---|---|---|---|
| Static | `.env` + Docker env vars | Process restart required | Single instance | `JWT_SECRET`, `DB_HOST`, `SMTP_*` |
| Dynamic | `parametres_systeme` table | Runtime, no restart | Global or per-establishment override | `modules.cantine.actif`, `auth.session_duration` |

### Resolution order for dynamic params
1. Establishment-scoped row (`cle + etablissementId`)
2. Global row (`cle + etablissementId IS NULL`)
3. Hardcoded default (helper `defaultValue`) or registry default

### Caching strategy
- `ConfigurationService` maintains three Maps: `modules`, `parametres`, `modulesActifs` with TTL-based validity checks (5 min for general params, 30 s for module-active flags).
- `config.helper.ts` adds an additional 60-second quick-cache for hot paths like `getParamBoolean`.
- Cache invalidation is granular (per-key or per-type) and emits events via `configurationListener`.

### Module activation as configuration
Module enable/disable is stored as a `modules.<name>.actif` parameter rather than a separate table column. Activation validates declared dependencies (with cycle detection) and auto-enables required modules; deactivation blocks if reverse-dependents are active.

### Multi-tenancy
Every dynamic param supports an optional `etablissementId`. The `setParametre` helper creates an override row only when needed, copying metadata (type, category, visibility, validation pattern, options) from the global parent. Resetting an establishment removes all its overrides, reverting to global values.

### Audit & events
All mutations go through `ConfigurationHistoryService`, recording action type, target, old/new values, and request context. A listener subsystem (`configuration-listener`) broadcasts `ConfigChangeEvent`s so other parts of the app can react (e.g., invalidate their own caches).

### Docker integration
`docker-compose.yml` maps every variable from the host `.env` file into each container's environment. Separate templates exist for local (`docker/.env.local`) and cloud (`docker/.env.cloud`) profiles, with production-mode toggles (SSL mode, pgAdmin disabled, stricter log levels).

## Rules developers should follow

1. **Never read `process.env` directly outside `env.config.ts`** — import `envConfig` from `@config/env.config` to get typed, validated values.
2. **Use `config.helper.ts` for runtime parameters** — call `getParam`, `getParamBoolean`, `isModuleActive`, etc. instead of querying the database yourself; this ensures caching and multi-tenant scoping are applied consistently.
3. **Name dynamic keys with dot notation** scoped by domain (e.g., `modules.<name>.actif`, `auth.session_duration`) so they sort naturally and group logically.
4. **Declare `modifiableRuntime: false` for secrets** — static-only settings (JWT secret, encryption key, SMTP passwords) must stay in `.env`; attempting to write them at runtime will throw `PARAM_NOT_MODIFIABLE`.
5. **When creating new parameters**, set `valeurDefaut`, `validation` regex, and `options` (for select UIs) so the admin panel can render them correctly.
6. **Prefer establishment-scoped overrides sparingly** — always create a global default first; overrides should only be used when a specific school needs different behavior.
7. **After mutating configuration via the API**, rely on the service's built-in cache invalidation and event emission — do not manually clear caches elsewhere.
8. **In Docker deployments**, keep secrets out of source control; use `.env.local` / `.env.cloud` templates and let CI inject real values at build/deploy time.