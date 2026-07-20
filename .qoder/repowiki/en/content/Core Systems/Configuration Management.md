# Configuration Management

<cite>
**Referenced Files in This Document**
- [configuration/index.ts](file://backend/src/modules/configuration/index.ts)
- [configuration/entity/Configuration.entity.ts](file://backend/src/modules/configuration/entity/Configuration.entity.ts)
- [configuration/dto/CreateConfiguration.dto.ts](file://backend/src/modules/configuration/dto/CreateConfiguration.dto.ts)
- [configuration/dto/UpdateConfiguration.dto.ts](file://backend/src/modules/configuration/dto/UpdateConfiguration.dto.ts)
- [configuration/service/Configuration.service.ts](file://backend/src/modules/configuration/service/Configuration.service.ts)
- [configuration/controller/Configuration.controller.ts](file://backend/src/modules/configuration/controller/Configuration.controller.ts)
- [configuration/middleware/Configuration.middleware.ts](file://backend/src/modules/configuration/middleware/Configuration.middleware.ts)
- [database/migrations/044-preferences-globales.sql](file://backend/database/migrations/044-preferences-globales.sql)
- [database/migrations/045-preferences-role.sql](file://backend/database/migrations/045-preferences-role.sql)
- [database/migrations/046-preferences-utilisateur-et-config.sql](file://backend/database/migrations/046-preferences-utilisateur-et-config.sql)
- [database/migrations/107-cleanup-configuration-modules-actif.sql](file://backend/database/migrations/107-cleanup-configuration-modules-actif.sql)
- [scripts/run-migration.ts](file://backend/scripts/run-migration.ts)
- [scripts/verify-configuration-integrity.ts](file://backend/scripts/verify-configuration-integrity.ts)
- [docker/scripts/backup-auto.sh](file://docker/scripts/backup-auto.sh)
- [docker/scripts/restore.sh](file://docker/scripts/restore.sh)
- [test/integration/configuration-multi-tenant.spec.ts](file://backend/test/integration/configuration-multi-tenant.spec.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)
10. [Appendices](#appendices)

## Introduction
This document explains eLISAschool’s dynamic configuration management system with a focus on:
- Runtime activation and deactivation of modules by administrators
- A preference system supporting global, role-based, and tenant-specific scopes
- A validation framework and type-safe access patterns for configurations
- Creating new configurable modules, defining schemas, and implementing listeners
- Backup and restore of system configurations
- Versioning, migration strategies, and rollback procedures
- Extending the system with custom configuration types and validation rules

The goal is to provide both high-level guidance and code-level references so that developers and administrators can confidently evolve and operate the configuration system.

## Project Structure
The configuration subsystem resides under backend/src/modules/configuration and integrates with database migrations, scripts, tests, and Docker tooling for backup and restore.

```mermaid
graph TB
subgraph "Backend Module"
CIndex["modules/configuration/index.ts"]
CEntity["entity/Configuration.entity.ts"]
CDTOs["dto/*.dto.ts"]
CService["service/Configuration.service.ts"]
CController["controller/Configuration.controller.ts"]
CMiddleware["middleware/Configuration.middleware.ts"]
end
subgraph "Database Migrations"
M044["migrations/044-preferences-globales.sql"]
M045["migrations/045-preferences-role.sql"]
M046["migrations/046-preferences-utilisateur-et-config.sql"]
M107["migrations/107-cleanup-configuration-modules-actif.sql"]
end
subgraph "Scripts & Tests"
SRun["scripts/run-migration.ts"]
SVerify["scripts/verify-configuration-integrity.ts"]
TMulti["test/integration/configuration-multi-tenant.spec.ts"]
end
subgraph "Docker Tooling"
DBackup["docker/scripts/backup-auto.sh"]
DRestore["docker/scripts/restore.sh"]
end
CController --> CService
CService --> CEntity
CService --> M044
CService --> M045
CService --> M046
CService --> M107
CIndex --> CController
CIndex --> CService
CIndex --> CMiddleware
SRun --> M044
SRun --> M045
SRun --> M046
SRun --> M107
SVerify --> CService
TMulti --> CController
DBackup --> M044
DRestore --> M044
```

**Diagram sources**
- [configuration/index.ts](file://backend/src/modules/configuration/index.ts)
- [configuration/entity/Configuration.entity.ts](file://backend/src/modules/configuration/entity/Configuration.entity.ts)
- [configuration/service/Configuration.service.ts](file://backend/src/modules/configuration/service/Configuration.service.ts)
- [configuration/controller/Configuration.controller.ts](file://backend/src/modules/configuration/controller/Configuration.controller.ts)
- [configuration/middleware/Configuration.middleware.ts](file://backend/src/modules/configuration/middleware/Configuration.middleware.ts)
- [database/migrations/044-preferences-globales.sql](file://backend/database/migrations/044-preferences-globales.sql)
- [database/migrations/045-preferences-role.sql](file://backend/database/migrations/045-preferences-role.sql)
- [database/migrations/046-preferences-utilisateur-et-config.sql](file://backend/database/migrations/046-preferences-utilisateur-et-config.sql)
- [database/migrations/107-cleanup-configuration-modules-actif.sql](file://backend/database/migrations/107-cleanup-configuration-modules-actif.sql)
- [scripts/run-migration.ts](file://backend/scripts/run-migration.ts)
- [scripts/verify-configuration-integrity.ts](file://backend/scripts/verify-configuration-integrity.ts)
- [test/integration/configuration-multi-tenant.spec.ts](file://backend/test/integration/configuration-multi-tenant.spec.ts)
- [docker/scripts/backup-auto.sh](file://docker/scripts/backup-auto.sh)
- [docker/scripts/restore.sh](file://docker/scripts/restore.sh)

**Section sources**
- [configuration/index.ts](file://backend/src/modules/configuration/index.ts)
- [configuration/entity/Configuration.entity.ts](file://backend/src/modules/configuration/entity/Configuration.entity.ts)
- [configuration/service/Configuration.service.ts](file://backend/src/modules/configuration/service/Configuration.service.ts)
- [configuration/controller/Configuration.controller.ts](file://backend/src/modules/configuration/controller/Configuration.controller.ts)
- [configuration/middleware/Configuration.middleware.ts](file://backend/src/modules/configuration/middleware/Configuration.middleware.ts)
- [database/migrations/044-preferences-globales.sql](file://backend/database/migrations/044-preferences-globales.sql)
- [database/migrations/045-preferences-role.sql](file://backend/database/migrations/045-preferences-role.sql)
- [database/migrations/046-preferences-utilisateur-et-config.sql](file://backend/database/migrations/046-preferences-utilisateur-et-config.sql)
- [database/migrations/107-cleanup-configuration-modules-actif.sql](file://backend/database/migrations/107-cleanup-configuration-modules-actif.sql)
- [scripts/run-migration.ts](file://backend/scripts/run-migration.ts)
- [scripts/verify-configuration-integrity.ts](file://backend/scripts/verify-configuration-integrity.ts)
- [test/integration/configuration-multi-tenant.spec.ts](file://backend/test/integration/configuration-multi-tenant.spec.ts)
- [docker/scripts/backup-auto.sh](file://docker/scripts/backup-auto.sh)
- [docker/scripts/restore.sh](file://docker/scripts/restore.sh)

## Core Components
- Entity layer: Defines the persistent model for configuration entries and preferences.
- DTO layer: Validates input payloads for create/update operations using schema-driven validation.
- Service layer: Implements business logic for reading/writing configurations, scoping by tenant/role/user, and module activation/deactivation.
- Controller layer: Exposes REST endpoints for configuration management.
- Middleware layer: Provides request-time resolution and injection of configuration values into handlers.
- Migrations: Evolve the schema to support global, role-based, and user-scoped preferences and module flags.
- Scripts: Run migrations and verify configuration integrity.
- Docker tooling: Automate backups and restores of configuration data.

Key responsibilities:
- Type-safe access via strongly typed DTOs and entity fields
- Multi-tenant scoping (global vs tenant-specific)
- Role-based overrides
- Validation at boundaries (DTOs + service checks)
- Auditability and versioning through migrations

**Section sources**
- [configuration/entity/Configuration.entity.ts](file://backend/src/modules/configuration/entity/Configuration.entity.ts)
- [configuration/dto/CreateConfiguration.dto.ts](file://backend/src/modules/configuration/dto/CreateConfiguration.dto.ts)
- [configuration/dto/UpdateConfiguration.dto.ts](file://backend/src/modules/configuration/dto/UpdateConfiguration.dto.ts)
- [configuration/service/Configuration.service.ts](file://backend/src/modules/configuration/service/Configuration.service.ts)
- [configuration/controller/Configuration.controller.ts](file://backend/src/modules/configuration/controller/Configuration.controller.ts)
- [configuration/middleware/Configuration.middleware.ts](file://backend/src/modules/configuration/middleware/Configuration.middleware.ts)

## Architecture Overview
The configuration system follows a layered architecture with clear separation between persistence, business logic, and API exposure. It supports multi-tenant scoping and role-based overrides.

```mermaid
classDiagram
class ConfigurationEntity {
+id
+key
+value
+scope
+tenantId
+roleId
+userId
+version
+updatedAt
}
class CreateConfigurationDto {
+key
+value
+scope
+tenantId?
+roleId?
+userId?
}
class UpdateConfigurationDto {
+value
+scope?
+tenantId?
+roleId?
+userId?
}
class ConfigurationService {
+get(key, scope, tenantId, roleId, userId)
+set(createDto)
+update(id, updateDto)
+activateModule(moduleKey, tenantId)
+deactivateModule(moduleKey, tenantId)
+listByScope(scope, tenantId)
}
class ConfigurationController {
+create(req, res)
+update(req, res)
+get(req, res)
+activate(req, res)
+deactivate(req, res)
+list(req, res)
}
class ConfigurationMiddleware {
+resolveConfig(req, res, next)
}
ConfigurationController --> ConfigurationService : "calls"
ConfigurationService --> ConfigurationEntity : "persists"
ConfigurationMiddleware --> ConfigurationService : "reads"
CreateConfigurationDto <.. ConfigurationController : "validates input"
UpdateConfigurationDto <.. ConfigurationController : "validates input"
```

**Diagram sources**
- [configuration/entity/Configuration.entity.ts](file://backend/src/modules/configuration/entity/Configuration.entity.ts)
- [configuration/dto/CreateConfiguration.dto.ts](file://backend/src/modules/configuration/dto/CreateConfiguration.dto.ts)
- [configuration/dto/UpdateConfiguration.dto.ts](file://backend/src/modules/configuration/dto/UpdateConfiguration.dto.ts)
- [configuration/service/Configuration.service.ts](file://backend/src/modules/configuration/service/Configuration.service.ts)
- [configuration/controller/Configuration.controller.ts](file://backend/src/modules/configuration/controller/Configuration.controller.ts)
- [configuration/middleware/Configuration.middleware.ts](file://backend/src/modules/configuration/middleware/Configuration.middleware.ts)

## Detailed Component Analysis

### Module Activation/Deactivation Mechanism
Administrators can enable or disable features at runtime by toggling module flags stored as configuration entries scoped per tenant. The service exposes dedicated methods to activate and deactivate modules, ensuring consistent state transitions and validation.

```mermaid
sequenceDiagram
participant Admin as "Admin Client"
participant Controller as "ConfigurationController"
participant Service as "ConfigurationService"
participant DB as "Database"
Admin->>Controller : POST /config/modules/{module}/activate
Controller->>Service : activateModule(moduleKey, tenantId)
Service->>DB : Upsert configuration entry (scope=tenant, key=module flag)
DB-->>Service : persisted record
Service-->>Controller : activation result
Controller-->>Admin : 200 OK with updated state
Admin->>Controller : POST /config/modules/{module}/deactivate
Controller->>Service : deactivateModule(moduleKey, tenantId)
Service->>DB : Update configuration entry (disable flag)
DB-->>Service : persisted record
Service-->>Controller : deactivation result
Controller-->>Admin : 200 OK with updated state
```

Operational notes:
- Activation sets a boolean flag keyed by module identifier within the tenant scope.
- Deactivation clears or flips the flag.
- Changes are immediately visible to subsequent requests due to direct persistence.

**Diagram sources**
- [configuration/controller/Configuration.controller.ts](file://backend/src/modules/configuration/controller/Configuration.controller.ts)
- [configuration/service/Configuration.service.ts](file://backend/src/modules/configuration/service/Configuration.service.ts)
- [configuration/entity/Configuration.entity.ts](file://backend/src/modules/configuration/entity/Configuration.entity.ts)

**Section sources**
- [configuration/service/Configuration.service.ts](file://backend/src/modules/configuration/service/Configuration.service.ts)
- [configuration/controller/Configuration.controller.ts](file://backend/src/modules/configuration/controller/Configuration.controller.ts)
- [database/migrations/107-cleanup-configuration-modules-actif.sql](file://backend/database/migrations/107-cleanup-configuration-modules-actif.sql)

### Preference System: Global, Role-Based, Tenant-Specific
Preferences are resolved using a precedence chain:
- User-specific overrides
- Role-based overrides
- Tenant-specific defaults
- Global defaults

This allows granular control while maintaining sensible fallbacks.

```mermaid
flowchart TD
Start(["Resolve Preference"]) --> CheckUser["Check user-specific config"]
CheckUser --> UserFound{"Found?"}
UserFound --> |Yes| ReturnUser["Return user value"]
UserFound --> |No| CheckRole["Check role-based config"]
CheckRole --> RoleFound{"Found?"}
RoleFound --> |Yes| ReturnRole["Return role value"]
RoleFound --> |No| CheckTenant["Check tenant-specific config"]
CheckTenant --> TenantFound{"Found?"}
TenantFound --> |Yes| ReturnTenant["Return tenant value"]
TenantFound --> |No| ReturnGlobal["Return global default"]
ReturnUser --> End(["Done"])
ReturnRole --> End
ReturnTenant --> End
ReturnGlobal --> End
```

Implementation considerations:
- Each preference has a key and a scope indicator.
- Resolution logic queries in order of precedence and returns the first match.
- Scopes include user, role, tenant, and global.

**Diagram sources**
- [configuration/service/Configuration.service.ts](file://backend/src/modules/configuration/service/Configuration.service.ts)
- [configuration/entity/Configuration.entity.ts](file://backend/src/modules/configuration/entity/Configuration.entity.ts)

**Section sources**
- [configuration/service/Configuration.service.ts](file://backend/src/modules/configuration/service/Configuration.service.ts)
- [configuration/entity/Configuration.entity.ts](file://backend/src/modules/configuration/entity/Configuration.entity.ts)
- [database/migrations/044-preferences-globales.sql](file://backend/database/migrations/044-preferences-globales.sql)
- [database/migrations/045-preferences-role.sql](file://backend/database/migrations/045-preferences-role.sql)
- [database/migrations/046-preferences-utilisateur-et-config.sql](file://backend/database/migrations/046-preferences-utilisateur-et-config.sql)

### Configuration Validation Framework and Type-Safe Access
Validation occurs at the boundary using DTOs and service-side checks:
- DTOs define required fields, allowed enums, and constraints.
- Service methods enforce additional business rules and type safety.
- Middleware may pre-validate keys and scopes before invoking controllers.

Type-safe access patterns:
- Use strongly typed DTOs for create/update operations.
- Prefer service getters that return typed objects rather than raw strings.
- Centralize parsing and coercion in the service layer to avoid duplication.

**Section sources**
- [configuration/dto/CreateConfiguration.dto.ts](file://backend/src/modules/configuration/dto/CreateConfiguration.dto.ts)
- [configuration/dto/UpdateConfiguration.dto.ts](file://backend/src/modules/configuration/dto/UpdateConfiguration.dto.ts)
- [configuration/service/Configuration.service.ts](file://backend/src/modules/configuration/service/Configuration.service.ts)
- [configuration/middleware/Configuration.middleware.ts](file://backend/src/modules/configuration/middleware/Configuration.middleware.ts)

### Creating New Configurable Modules
To add a new configurable module:
- Define a unique module key and initial default configuration.
- Add migration if needed to seed defaults or adjust schema.
- Implement activation/deactivation endpoints in the controller and corresponding service methods.
- Register any feature flags or behaviors behind the module key.
- Write integration tests to validate behavior across tenants.

Example steps:
- Extend the controller with module-specific routes.
- Add service methods to manage module state.
- Seed initial configuration via migration or script.
- Validate with integration tests.

**Section sources**
- [configuration/controller/Configuration.controller.ts](file://backend/src/modules/configuration/controller/Configuration.controller.ts)
- [configuration/service/Configuration.service.ts](file://backend/src/modules/configuration/service/Configuration.service.ts)
- [database/migrations/107-cleanup-configuration-modules-actif.sql](file://backend/database/migrations/107-cleanup-configuration-modules-actif.sql)
- [test/integration/configuration-multi-tenant.spec.ts](file://backend/test/integration/configuration-multi-tenant.spec.ts)

### Defining Configuration Schemas
Schema definition best practices:
- Keep keys hierarchical and namespaced (e.g., module.feature).
- Use DTOs to constrain values and document expected formats.
- Store metadata such as description, default value, and allowed values alongside the configuration where appropriate.
- Enforce uniqueness per scope to prevent conflicts.

**Section sources**
- [configuration/dto/CreateConfiguration.dto.ts](file://backend/src/modules/configuration/dto/CreateConfiguration.dto.ts)
- [configuration/dto/UpdateConfiguration.dto.ts](file://backend/src/modules/configuration/dto/UpdateConfiguration.dto.ts)
- [configuration/entity/Configuration.entity.ts](file://backend/src/modules/configuration/entity/Configuration.entity.ts)

### Implementing Configuration Listeners
Listeners react to configuration changes:
- Subscribe to change events emitted by the service when a configuration is created, updated, or deleted.
- Perform side effects such as cache invalidation, re-initialization of feature flags, or notifications.
- Ensure idempotency and error handling to avoid cascading failures.

Guidelines:
- Decouple listeners from core service logic via an event bus or observer pattern.
- Log all listener invocations and outcomes for observability.
- Test listeners with mocked configuration updates.

**Section sources**
- [configuration/service/Configuration.service.ts](file://backend/src/modules/configuration/service/Configuration.service.ts)

### Backup and Restore Functionality
Automated backup and restore processes ensure configuration resilience:
- Automated backups run periodically and store snapshots of the database.
- Manual restore scripts allow administrators to roll back to known-good states.
- Backups should be retained according to retention policies and verified regularly.

Operational flow:
- Trigger automated backup via cron or orchestration.
- Verify backup integrity post-run.
- On failure, use restore script to recover from the latest valid snapshot.

**Section sources**
- [docker/scripts/backup-auto.sh](file://docker/scripts/backup-auto.sh)
- [docker/scripts/restore.sh](file://docker/scripts/restore.sh)

### Configuration Versioning, Migration Strategies, and Rollback Procedures
Versioning and migrations:
- Use numbered SQL migrations to evolve configuration schema and seed defaults.
- Maintain backward compatibility during transitions; prefer additive changes.
- Provide cleanup migrations to remove obsolete entries.

Migration strategy:
- Apply migrations in order using the provided runner script.
- Validate configuration integrity after applying migrations.
- Document breaking changes and provide upgrade guides.

Rollback procedures:
- Keep prior migration versions available for rollback.
- Use targeted rollback scripts or reverse migrations when necessary.
- Re-run verification scripts to ensure consistency.

**Section sources**
- [database/migrations/044-preferences-globales.sql](file://backend/database/migrations/044-preferences-globales.sql)
- [database/migrations/045-preferences-role.sql](file://backend/database/migrations/045-preferences-role.sql)
- [database/migrations/046-preferences-utilisateur-et-config.sql](file://backend/database/migrations/046-preferences-utilisateur-et-config.sql)
- [database/migrations/107-cleanup-configuration-modules-actif.sql](file://backend/database/migrations/107-cleanup-configuration-modules-actif.sql)
- [scripts/run-migration.ts](file://backend/scripts/run-migration.ts)
- [scripts/verify-configuration-integrity.ts](file://backend/scripts/verify-configuration-integrity.ts)

### Extending the Configuration System with Custom Types and Validation Rules
Extensibility guidelines:
- Introduce new configuration types by extending DTOs and adding validation rules.
- Implement custom validators in the service layer to enforce domain-specific constraints.
- Document new types and their usage in the API contracts.
- Add tests covering edge cases and invalid inputs.

Best practices:
- Avoid storing unstructured blobs; prefer typed structures.
- Normalize keys and scopes consistently.
- Provide default values for new configuration keys to avoid runtime errors.

**Section sources**
- [configuration/dto/CreateConfiguration.dto.ts](file://backend/src/modules/configuration/dto/CreateConfiguration.dto.ts)
- [configuration/dto/UpdateConfiguration.dto.ts](file://backend/src/modules/configuration/dto/UpdateConfiguration.dto.ts)
- [configuration/service/Configuration.service.ts](file://backend/src/modules/configuration/service/Configuration.service.ts)

## Dependency Analysis
The configuration module depends on:
- Database migrations for schema evolution and seeding
- Scripts for running migrations and verifying integrity
- Integration tests for multi-tenant behavior
- Docker tooling for operational backup and restore

```mermaid
graph LR
Controller["ConfigurationController"] --> Service["ConfigurationService"]
Service --> Entity["ConfigurationEntity"]
Service --> Migrations["Migrations (SQL)"]
Controller --> Tests["Integration Tests"]
Migrations --> Runner["Migration Runner Script"]
Migrations --> Integrity["Integrity Verification Script"]
Migrations --> Backup["Backup Script"]
Migrations --> Restore["Restore Script"]
```

**Diagram sources**
- [configuration/controller/Configuration.controller.ts](file://backend/src/modules/configuration/controller/Configuration.controller.ts)
- [configuration/service/Configuration.service.ts](file://backend/src/modules/configuration/service/Configuration.service.ts)
- [configuration/entity/Configuration.entity.ts](file://backend/src/modules/configuration/entity/Configuration.entity.ts)
- [database/migrations/044-preferences-globales.sql](file://backend/database/migrations/044-preferences-globales.sql)
- [database/migrations/045-preferences-role.sql](file://backend/database/migrations/045-preferences-role.sql)
- [database/migrations/046-preferences-utilisateur-et-config.sql](file://backend/database/migrations/046-preferences-utilisateur-et-config.sql)
- [database/migrations/107-cleanup-configuration-modules-actif.sql](file://backend/database/migrations/107-cleanup-configuration-modules-actif.sql)
- [scripts/run-migration.ts](file://backend/scripts/run-migration.ts)
- [scripts/verify-configuration-integrity.ts](file://backend/scripts/verify-configuration-integrity.ts)
- [docker/scripts/backup-auto.sh](file://docker/scripts/backup-auto.sh)
- [docker/scripts/restore.sh](file://docker/scripts/restore.sh)
- [test/integration/configuration-multi-tenant.spec.ts](file://backend/test/integration/configuration-multi-tenant.spec.ts)

**Section sources**
- [configuration/controller/Configuration.controller.ts](file://backend/src/modules/configuration/controller/Configuration.controller.ts)
- [configuration/service/Configuration.service.ts](file://backend/src/modules/configuration/service/Configuration.service.ts)
- [configuration/entity/Configuration.entity.ts](file://backend/src/modules/configuration/entity/Configuration.entity.ts)
- [database/migrations/044-preferences-globales.sql](file://backend/database/migrations/044-preferences-globales.sql)
- [database/migrations/045-preferences-role.sql](file://backend/database/migrations/045-preferences-role.sql)
- [database/migrations/046-preferences-utilisateur-et-config.sql](file://backend/database/migrations/046-preferences-utilisateur-et-config.sql)
- [database/migrations/107-cleanup-configuration-modules-actif.sql](file://backend/database/migrations/107-cleanup-configuration-modules-actif.sql)
- [scripts/run-migration.ts](file://backend/scripts/run-migration.ts)
- [scripts/verify-configuration-integrity.ts](file://backend/scripts/verify-configuration-integrity.ts)
- [docker/scripts/backup-auto.sh](file://docker/scripts/backup-auto.sh)
- [docker/scripts/restore.sh](file://docker/scripts/restore.sh)
- [test/integration/configuration-multi-tenant.spec.ts](file://backend/test/integration/configuration-multi-tenant.spec.ts)

## Performance Considerations
- Cache frequently accessed preferences at the application level to reduce database load.
- Use scoped queries to minimize result sets and avoid scanning unnecessary records.
- Batch updates for bulk configuration changes to reduce transaction overhead.
- Monitor query performance and add indexes for commonly filtered scopes (tenant, role, user).
- Validate inputs early to fail fast and avoid expensive processing.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- Missing preferences: Ensure migrations have been applied and defaults seeded.
- Validation errors: Check DTO constraints and input payloads.
- Multi-tenant isolation problems: Verify tenant scoping in queries and tests.
- Backup/restore failures: Inspect logs from Docker scripts and confirm database connectivity.

Diagnostic tools:
- Use the integrity verification script to detect inconsistencies.
- Review integration tests for expected behaviors and edge cases.
- Inspect migration history to confirm ordering and completeness.

**Section sources**
- [scripts/verify-configuration-integrity.ts](file://backend/scripts/verify-configuration-integrity.ts)
- [test/integration/configuration-multi-tenant.spec.ts](file://backend/test/integration/configuration-multi-tenant.spec.ts)
- [docker/scripts/backup-auto.sh](file://docker/scripts/backup-auto.sh)
- [docker/scripts/restore.sh](file://docker/scripts/restore.sh)

## Conclusion
The eLISAschool configuration management system provides a robust, extensible foundation for dynamic feature control and preference management. With clear scoping rules, strong validation, and comprehensive migration and backup tooling, it supports safe evolution and reliable operation across tenants and roles. Following the guidelines in this document will help teams extend the system effectively and maintain high availability and correctness.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices

### Quick Reference: Key Files
- Module index and wiring: [configuration/index.ts](file://backend/src/modules/configuration/index.ts)
- Entity model: [configuration/entity/Configuration.entity.ts](file://backend/src/modules/configuration/entity/Configuration.entity.ts)
- DTOs: [configuration/dto/CreateConfiguration.dto.ts](file://backend/src/modules/configuration/dto/CreateConfiguration.dto.ts), [configuration/dto/UpdateConfiguration.dto.ts](file://backend/src/modules/configuration/dto/UpdateConfiguration.dto.ts)
- Service logic: [configuration/service/Configuration.service.ts](file://backend/src/modules/configuration/service/Configuration.service.ts)
- API endpoints: [configuration/controller/Configuration.controller.ts](file://backend/src/modules/configuration/controller/Configuration.controller.ts)
- Request-time resolution: [configuration/middleware/Configuration.middleware.ts](file://backend/src/modules/configuration/middleware/Configuration.middleware.ts)
- Migrations: [database/migrations/044-preferences-globales.sql](file://backend/database/migrations/044-preferences-globales.sql), [database/migrations/045-preferences-role.sql](file://backend/database/migrations/045-preferences-role.sql), [database/migrations/046-preferences-utilisateur-et-config.sql](file://backend/database/migrations/046-preferences-utilisateur-et-config.sql), [database/migrations/107-cleanup-configuration-modules-actif.sql](file://backend/database/migrations/107-cleanup-configuration-modules-actif.sql)
- Scripts: [scripts/run-migration.ts](file://backend/scripts/run-migration.ts), [scripts/verify-configuration-integrity.ts](file://backend/scripts/verify-configuration-integrity.ts)
- Docker tooling: [docker/scripts/backup-auto.sh](file://docker/scripts/backup-auto.sh), [docker/scripts/restore.sh](file://docker/scripts/restore.sh)
- Tests: [test/integration/configuration-multi-tenant.spec.ts](file://backend/test/integration/configuration-multi-tenant.spec.ts)