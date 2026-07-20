---
kind: configuration_system
name: Hybrid Environment + Database Configuration System
category: configuration_system
scope:
    - '**'
source_files:
    - backend/src/config/env.config.ts
    - backend/src/config/database.config.ts
    - backend/src/config/swagger.config.ts
    - backend/src/config/index.ts
    - backend/src/modules/configuration/entities/parametre-systeme.entity.ts
    - backend/src/modules/configuration/services/configuration.service.ts
    - backend/src/modules/configuration/controllers/configuration.controller.ts
    - docker/.env.local
    - docker/.env.cloud
    - backend/.env
---

The eLISAschool monorepo implements a two-layer configuration system that separates immutable runtime settings from mutable application parameters.

**1. Environment & Runtime Configuration (Static)**
- Loaded at process startup via `backend/src/config/env.config.ts` using `dotenv` with multi-path `.env` discovery (`../../.env`, `./.env`, `__dirname/../../.env`, `backend/.env`).
- All variables are validated and typed through a Zod schema (`envSchema`) covering app, database, JWT, encryption, Redis, SMTP, CORS, license, and logging domains.
- In development mode, missing secrets (`JWT_SECRET`, `ENCRYPTION_KEY`) are auto-generated and logged; in production, validation failure exits the process.
- The resolved object is exported as `envConfig` grouped by domain (`app.*`, `database.*`, `jwt.*`, etc.) and consumed by TypeORM (`database.config.ts`) and other services.
- Docker provides environment templates: `docker/.env.local` (development) and `docker/.env.cloud` (production), plus per-service overrides via Compose files.
- Backend root `.env` holds only secrets not present in Docker templates.

**2. Application Parameters (Mutable, Multi-Tenant)**
- Persisted in PostgreSQL via the `ParametreSysteme` entity (`backend/src/modules/configuration/entities/parametre-systeme.entity.ts`) with columns for key, JSON value, type, category, module scope, and establishment scoping (`etablissementId`).
- A composite unique index on `(cle, etablissementId)` enforces one override per parameter per tenant; `NULL` establishes global defaults.
- Resolution order in `ConfigurationService.getParametre`: scoped-to-establishment → global (`etablissementId IS NULL`) → default value.
- Supports categories (`SYSTEME`, `SECURITE`, `ETABLISSEMENT`, `MODULE`, `THEME`, `NOTIFICATION`, `REGIONAL`, `CUSTOM`), value types (`STRING`, `NUMBER`, `BOOLEAN`, `JSON`, `ARRAY`), runtime mutability flags, visibility, ordering, regex validation, and select options.
- Module activation state is stored as `modules.<name>.actif` parameters, with dependency resolution against `@shared/config/config.registry` and automatic cascade activation of required modules.
- In-memory cache with TTL (5 min for params, 30s for module-active flags) keyed by `${cle}:${etablissementId}` or `${module}:${tenant}`, invalidated on writes and via an event listener.

**3. API Surface**
- REST endpoints under `/api/configuration` expose CRUD for parameters, module registry inspection, toggle with impact analysis, history audit, backup/restore, export, and cache invalidation — all guarded by RBAC permissions (`canViewParams`, `canEditParams`, `canToggleModule`, …).
- Swagger spec (`swagger.config.ts`) documents these endpoints inline.

**4. Conventions & Rules**
- New environment variables must be added to the Zod schema in `env.config.ts`; omitting them causes startup failure in production.
- Mutable application settings should use `ParametreSysteme` with a descriptive `cle` (dot-namespaced, e.g. `auth.session_duration`), appropriate `typeValeur`, and `modifiableRuntime=true` if they can change without restart.
- Tenant-scoped overrides are created by passing `etablissementId`; deleting an override reverts to the global value rather than deleting the parameter.
- Module toggles go through `toggleModule` so dependency checks and reverse-dependency guards run automatically.