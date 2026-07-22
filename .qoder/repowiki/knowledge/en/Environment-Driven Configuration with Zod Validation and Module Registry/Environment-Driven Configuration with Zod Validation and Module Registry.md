---
kind: configuration_system
name: Environment-Driven Configuration with Zod Validation and Module Registry
category: configuration_system
scope:
    - '**'
source_files:
    - backend/src/config/env.config.ts
    - backend/src/config/database.config.ts
    - backend/src/config/swagger.config.ts
    - backend/src/config/index.ts
    - docker/.env.local
    - backend/.env
    - frontend/.env
    - shared/src/config/config.registry.ts
    - shared/src/config/index.ts
---

The eLISAschool monorepo uses a layered, environment-driven configuration system that combines runtime `.env` loading, schema validation, and a shared module registry. The approach is split between backend runtime configuration and shared compile-time module metadata.

**Runtime configuration (backend)**
- All process-level settings are loaded from `.env` files via `dotenv`, with a search order that prefers `backend/.env` then the project root `.env`, falling back to `process.env`. See `backend/src/config/env.config.ts`.
- A single Zod schema (`envSchema`) defines every accepted variable, its type, default, and validation rules (e.g. JWT secret ≥ 32 chars, AES key exactly 32 bytes). On parse failure in production the process exits; in development it logs warnings and fills missing values with generated defaults so the app stays bootable.
- The validated object is re-exported as a namespaced `envConfig` (`app.*`, `database.*`, `jwt.*`, `encryption.*`, `redis.*`, `email.*`, `license.*`, `logging.*`) consumed by TypeORM, Redis, Swagger, and feature toggles.
- Database-specific options live in `backend/src/config/database.config.ts`, which derives entity/migration paths from `NODE_ENV` (`.ts` in dev, `.js` in prod) and sets pool size / SSL accordingly.
- Swagger/OpenAPI spec is a plain constant in `swagger.config.ts`; it is not driven by env but documents the same `/configuration*` endpoints exposed by the `configuration` module.
- Environment files: `docker/.env.local` is the canonical template (ports, DB/Redis/SMTP/Twilio/Firebase/CORS), copied into container or local `.env` at deploy time. Backend also ships a minimal `backend/.env` for quick local runs.

**Shared module registry (compile-time config)**
- `shared/src/config/config.registry.ts` exports `MODULE_REGISTRY`: a TypeScript record keyed by `ModuleName` describing each feature module — label, icon, base route, default activation, premium flag, required roles, permissions, dependencies, and per-module `defaultSettings`. Consumers on both backend and frontend import this to drive UI navigation, permission checks, and dynamic routing.
- Helper functions (`getModuleConfig`, `getModulesByCategory`, `hasModuleAccess`) provide read-only access patterns.

**Frontend configuration**
- Frontend uses Vite's `VITE_*` env variables (`frontend/.env`). Only build-time flags like `VITE_APP_ENV` and `VITE_DEBUG` are present; API URL is configured via Vite proxy rather than an injected constant.

**Operational conventions**
- Secrets (JWT_SECRET, ENCRYPTION_KEY, SMTP_PASSWORD, REDIS_PASSWORD) must be supplied via environment; they are never committed. Docker Compose files reference `docker/.env.local`.
- Feature toggles such as `ENABLE_CRON_JOBS`, `LOG_LEVEL`, and per-module `defaultActive` flags are the primary knobs for enabling/disabling behavior without code changes.
- The `@config/*` path alias centralizes imports so modules never reach directly into `process.env`.