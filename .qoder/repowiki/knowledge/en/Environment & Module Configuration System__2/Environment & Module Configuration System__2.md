---
kind: configuration_system
name: Environment & Module Configuration System
category: configuration_system
scope:
    - '**'
source_files:
    - backend/src/config/env.config.ts
    - backend/src/config/database.config.ts
    - shared/src/config/config.registry.ts
    - backend/src/modules/configuration/services/configuration.service.ts
    - backend/src/modules/configuration/services/configuration-seed.service.ts
    - docker/.env.local
    - docker/.env.cloud
    - backend/.env
    - frontend/.env.local
---

The eLISAschool platform implements a two-layer configuration system: runtime environment configuration (process-level) and application feature/module configuration (database-backed).

## Runtime Environment Configuration

**Loader**: `backend/src/config/env.config.ts` uses Zod for schema validation with `dotenv` for `.env` loading. It searches multiple paths (`../../.env`, `.env`, `__dirname/../../.env`, `backend/.env`) to locate the env file, then validates all variables against a strict schema. Missing or invalid values cause immediate process exit in production, while development mode generates secure defaults for JWT secrets and encryption keys.

**Structure**: Configuration is exported as a typed object grouped by domain:
- `app`: nodeEnv, name, version, port, URLs, CORS settings
- `database`: PostgreSQL connection parameters  
- `jwt`: secret, token lifetimes
- `encryption`: AES key
- `redis`: cache/queue connection
- `email`: SMTP settings
- `license`: license key
- `logging`: level and file path

**Database Config**: `backend/src/config/database.config.ts` builds TypeORM DataSourceOptions from env config, with different entity/migration paths for dev vs prod environments.

**Frontend Config**: `frontend/.env` and `frontend/.env.local` use Vite's `VITE_*` prefix convention for build-time variables like API URL and debug mode.

**Docker Environments**: Separate `.env.local` (development) and `.env.cloud` (production) files in `docker/` provide environment-specific defaults with auto-generation markers (`__AUTO_GENERATE__`) for secrets.

## Application Feature & Module Configuration

**Module Registry**: `shared/src/config/config.registry.ts` defines a comprehensive registry of all 30+ modules with their default settings, permissions, roles, dependencies, and UI metadata (icons, basePaths, labels). Each module has a `defaultSettings` object containing tunable parameters like `maxLoginAttempts`, `enablePush`, `defaultCurrency`, etc.

**Runtime Configuration Service**: The `backend/src/modules/configuration/` module provides database-backed configuration management through:
- `ConfigurationService`: CRUD operations for application settings
- `ConfigurationSeedService`: Seeds initial configuration from the module registry
- `ConfigurationHistoryService`: Audit trail for configuration changes
- `ConfigBackupService`: Import/export functionality for configuration snapshots
- `ConfigurationListener`: Event-driven updates when configuration changes

**Storage**: Configuration persists to PostgreSQL tables (`configuration_app`, `configuration_module`, `parametre_systeme`) with support for both app-level and module-scoped settings.

**Access Control**: Configuration endpoints are protected by RBAC guards requiring specific permissions (`config:view`, `config:edit`).

## Conventions & Rules

1. **Environment variables must be defined in `.env` files** — never hardcoded in source
2. **Use Zod schemas for validation** — any missing required variable crashes the app in production
3. **Module configurations live in the shared registry** — new modules must register their defaults there
4. **Sensitive values use `__AUTO_GENERATE__` markers** in cloud deployment configs
5. **Frontend variables require `VITE_` prefix** for build-time injection
6. **Configuration changes are audited** — all modifications tracked with user context and timestamps
7. **Multi-tenant isolation** — configuration can be scoped per establishment via tenant context