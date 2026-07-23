---
kind: configuration_system
name: Hybrid Runtime Configuration System with Environment Validation and Multi-Tenant Parameter Overrides
category: configuration_system
scope:
    - '**'
source_files:
    - backend/src/config/env.config.ts
    - backend/src/config/database.config.ts
    - backend/src/config/swagger.config.ts
    - backend/src/config/index.ts
    - shared/src/config/config.registry.ts
    - backend/src/modules/configuration/services/configuration.service.ts
    - backend/src/modules/configuration/entities/parametre-systeme.entity.ts
    - backend/src/modules/configuration/entities/configuration-app.entity.ts
    - backend/.env
    - docker/.env.local
    - docker/docker-compose.yml
---

## Overview
The eLISAschool platform implements a two-tier configuration system: **static environment configuration** (loaded at process startup) and **dynamic runtime configuration** (persisted in PostgreSQL with multi-tenant scoping). The system combines Zod schema validation, in-memory caching, event-driven invalidation, and a module registry to provide a robust, type-safe configuration layer.

## Static Environment Configuration

### Loading Strategy
Environment variables are loaded via `dotenv` with a fallback search across multiple paths (`../../.env`, `.env`, `backend/.env`) before falling back to the default location. This ensures compatibility with both Dockerized and local development setups.

### Schema Validation
All environment variables are validated against a Zod schema (`backend/src/config/env.config.ts`) that defines:
- **Application settings**: `NODE_ENV`, `APP_NAME`, `APP_VERSION`, `APP_PORT`, `APP_URL`
- **Database credentials**: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- **Security**: `JWT_SECRET` (min 32 chars), `ENCRYPTION_KEY` (exactly 32 chars)
- **Redis**: `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`
- **Email**: SMTP connection settings
- **Frontend integration**: `FRONTEND_URL`, `ALLOWED_ORIGINS`
- **Logging**: `LOG_LEVEL`, `LOG_FILE`

In development mode, missing required fields like `JWT_SECRET` and `ENCRYPTION_KEY` are auto-generated using `crypto.randomBytes()`. In production, validation failures cause immediate process exit.

### Configuration Export
Validated configuration is exported as a structured object (`envConfig`) with domain-specific namespaces (`app`, `database`, `jwt`, `encryption`, `redis`, `email`, `license`, `logging`).

## Dynamic Runtime Configuration

### Core Architecture
Runtime configuration is managed by `ConfigurationService` (`backend/src/modules/configuration/services/configuration.service.ts`) with three key entities:

1. **ParametreSysteme**: Primary storage for all dynamic parameters with multi-tenant scoping via `etablissementId` (NULL = global, UUID = establishment-specific override)
2. **ConfigurationModule**: Technical per-module configuration (custom fields, widgets, module-specific settings)
3. **HistoriqueConfiguration**: Audit trail for all configuration changes

### Multi-Tenant Resolution Order
Parameters follow a cascading resolution strategy:
1. Establishment-scoped parameter (if `etablissementId` provided)
2. Global parameter (`etablissementId = NULL`)
3. Default value from code or module registry

### Caching Layer
An in-memory cache provides performance optimization with configurable TTL:
- Module configurations: 5-minute cache
- Parameter values: 5-minute cache
- Module active status: 30-second cache with granular invalidation

Cache invalidation is triggered on any configuration change and emits events via `configurationListener` for reactive updates.

### Module Registry
A comprehensive module registry (`shared/src/config/config.registry.ts`) defines:
- Module metadata (name, label, description, icon, base path)
- Default activation state and premium requirements
- Role-based access permissions
- Dependency graphs between modules
- Default settings per module
- Category classification for UI organization

The registry supports dependency validation with cycle detection and automatic dependency activation when enabling parent modules.

### Feature Flags and Module Activation
Module activation uses a dedicated parameter pattern `modules.{moduleName}.actif` stored in `ParametreSysteme`. The system validates dependencies before activation and prevents deactivation if dependent modules are still active.

## Configuration Management APIs

### REST Endpoints
The configuration module exposes comprehensive CRUD operations:
- `/api/configuration/parametres` - Full parameter management with filtering by category/module
- `/api/configuration/modules` - Module configuration and activation controls
- `/api/configuration/historique` - Audit trail with rollback capabilities
- `/api/configuration/export` - Backup and restore functionality

### Bulk Operations
Supports bulk parameter updates, reset to defaults (per-establishment or global), and export/import of complete configuration snapshots.

## Docker and Deployment Integration

### Environment Files
- `docker/.env.local`: Development template with Docker service names (`postgres`, `redis`)
- `backend/.env`: Local development overrides
- `docker/docker-compose.yml`: Service definitions with environment variable injection and health checks

### Production Considerations
- SSL enabled for database connections in production
- Connection pooling configured differently per environment (5 dev vs 20 prod)
- Entity/migration paths adapt based on `NODE_ENV` (TypeScript sources vs compiled JavaScript)

## Conventions and Rules

### Parameter Naming
- Use dot notation for hierarchical keys (e.g., `auth.session_duration`, `modules.notes.defaultBareme`)
- Prefix module-specific parameters with the module name
- Keep establishment-scoped overrides minimal; prefer global defaults

### Security
- Never commit secrets to version control
- JWT secrets must be at least 32 characters
- Encryption keys must be exactly 32 characters (AES-256)
- Mark sensitive parameters as non-visible in admin interfaces

### Multi-Tenancy
- Always consider the establishment context when reading/writing parameters
- Use the `setParametre()` method which handles global/override logic automatically
- Test both global and establishment-scoped behavior

### Performance
- Leverage the built-in caching for frequently accessed configuration
- Use bulk operations for batch updates
- Monitor cache hit rates and adjust TTL as needed

### Migration and Backward Compatibility
- Legacy `ConfigurationApp` entity is deprecated but maintained for backward compatibility
- Migration scripts handle data transformation between configuration versions
- Version tracking enables safe upgrades across deployments