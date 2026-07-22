# Database Migrations & Version Control

<cite>
**Referenced Files in This Document**
- [backend/database/migrations/037-gamification-tracabilite.ts](file://backend/database/migrations/037-gamification-tracabilite.ts)
- [backend/database/migrations/043-correction-dossier-medical-fk.ts](file://backend/database/migrations/043-correction-dossier-medical-fk.ts)
- [backend/database/migrations/090-correction-migration-088-camelcase.sql](file://backend/database/migrations/090-correction-migration-088-camelcase.sql)
- [backend/database/migrations/050-multi-tenant-v3-max-etablissements.sql](file://backend/database/migrations/050-multi-tenant-v3-max-etablissements.sql)
- [backend/database/migrations/058-multi-tenant-structure-academique.sql](file://backend/database/migrations/058-multi-tenant-structure-academique.sql)
- [backend/database/migrations/080-preferences-utilisateur-multi-tenant.sql](file://backend/database/migrations/080-preferences-utilisateur-multi-tenant.sql)
- [backend/database/migrations/086-affectation-matiere-etablissement-id.sql](file://backend/database/migrations/086-affectation-matiere-etablissement-id.sql)
- [backend/database/migrations/105-migration-templates-v5.sql](file://backend/database/migrations/105-migration-templates-v5.sql)
- [backend/database/migrations/109-refonte-organisation.sql](file://backend/database/migrations/109-refonte-organisation.sql)
- [backend/scripts/run-migration.ts](file://backend/scripts/run-migration.ts)
- [backend/scripts/run-pending-migrations.ts](file://backend/scripts/run-pending-migrations.ts)
- [backend/deploy-all-migrations.sh](file://backend/deploy-all-migrations.sh)
- [backend/deploy-v31-complete.sh](file://backend/deploy-v31-complete.sh)
- [scripts/deploy-migrations-phases.sh](file://scripts/deploy-migrations-phases.sh)
- [scripts/test-migrations-v2.sh](file://scripts/test-migrations-v2.sh)
- [backend/src/config/database.config.ts](file://backend/src/config/database.config.ts)
- [backend/src/config/env.config.ts](file://backend/src/config/env.config.ts)
- [backend/src/database/data-source.ts](file://backend/src/database/data-source.ts)
- [backend/src/database/index.ts](file://backend/src/database/index.ts)
- [backend/docs/pagination-migration-status.ts](file://backend/docs/pagination-migration-status.ts)
- [backend/database/MIGRATION-076-SUCCESS.md](file://backend/database/MIGRATION-076-SUCCESS.md)
- [backend/database/PERMISSIONS-GROUPES-SEED-UPDATE.md](file://backend/database/PERMISSIONS-GROUPES-SEED-UPDATE.md)
- [backend/database/README-075-GROUPES.md](file://backend/database/README-075-GROUPES.md)
</cite>

## Update Summary
**Changes Made**
- Added comprehensive coverage of migration 109-refonte-organisation.sql as a major organizational data model refactoring
- Updated architecture overview to include large-scale schema transformation patterns
- Enhanced multi-tenant integration section with new organizational scoping examples
- Added new section on major refactoring migrations and their deployment considerations
- Updated common migration patterns to include complex data transformation scenarios

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
This document explains the database migration system used by the project, focusing on TypeORM-based migrations and SQL scripts. It covers file structure, naming conventions, execution order, lifecycle from creation to deployment, rollback procedures, conflict resolution, automation scripts, environment-specific configuration, testing strategies, common patterns (schema changes, data transformations, seed updates), best practices, error handling, debugging techniques, and multi-tenant considerations. The system now supports major organizational data model refactoring with comprehensive data transformations for improved scalability and performance.

## Project Structure
Migrations are organized under backend/database/migrations and include both TypeScript files (TypeORM-style) and SQL files. Automation and deployment scripts live under backend/scripts and backend root, with additional orchestration scripts at the repository root. Configuration for the database connection and TypeORM DataSource is located under backend/src/config and backend/src/database.

```mermaid
graph TB
subgraph "Backend"
A["src/config/database.config.ts"]
B["src/config/env.config.ts"]
C["src/database/data-source.ts"]
D["src/database/index.ts"]
E["database/migrations/*.ts"]
F["database/migrations/*.sql"]
G["scripts/run-migration.ts"]
H["scripts/run-pending-migrations.ts"]
I["deploy-all-migrations.sh"]
J["deploy-v31-complete.sh"]
K["109-refonte-organisation.sql<br/>Major org refactoring"]
end
A --> C
B --> C
C --> D
D --> E
D --> F
D --> K
G --> C
H --> C
I --> G
J --> G
```

**Diagram sources**
- [backend/src/config/database.config.ts](file://backend/src/config/database.config.ts)
- [backend/src/config/env.config.ts](file://backend/src/config/env.config.ts)
- [backend/src/database/data-source.ts](file://backend/src/database/data-source.ts)
- [backend/src/database/index.ts](file://backend/src/database/index.ts)
- [backend/scripts/run-migration.ts](file://backend/scripts/run-migration.ts)
- [backend/scripts/run-pending-migrations.ts](file://backend/scripts/run-pending-migrations.ts)
- [backend/deploy-all-migrations.sh](file://backend/deploy-all-migrations.sh)
- [backend/deploy-v31-complete.sh](file://backend/deploy-v31-complete.sh)
- [backend/database/migrations/109-refonte-organisation.sql](file://backend/database/migrations/109-refonte-organisation.sql)

**Section sources**
- [backend/src/config/database.config.ts](file://backend/src/config/database.config.ts)
- [backend/src/config/env.config.ts](file://backend/src/config/env.config.ts)
- [backend/src/database/data-source.ts](file://backend/src/database/data-source.ts)
- [backend/src/database/index.ts](file://backend/src/database/index.ts)
- [backend/scripts/run-migration.ts](file://backend/scripts/run-migration.ts)
- [backend/scripts/run-pending-migrations.ts](file://backend/scripts/run-pending-migrations.ts)
- [backend/deploy-all-migrations.sh](file://backend/deploy-all-migrations.sh)
- [backend/deploy-v31-complete.sh](file://backend/deploy-v31-complete.sh)

## Core Components
- Migration files:
  - TypeScript migrations (TypeORM style) for complex logic or programmatic operations.
  - SQL migrations for direct schema and data changes, including major refactoring migrations.
- Execution scripts:
  - Node-based runners for executing specific or pending migrations.
  - Shell scripts for batch deployments and environment-specific runs.
- Configuration:
  - Environment variables and TypeORM DataSource settings that determine which migrations run and how they connect to the database.

Key responsibilities:
- Define versioned changes to schema and data.
- Provide idempotent and reversible operations where possible.
- Integrate with multi-tenant constraints and tenant-scoped data.
- Support major architectural refactoring with comprehensive data transformations.

**Updated** Added support for major organizational data model refactoring with migration 109-refonte-organisation.sql

**Section sources**
- [backend/database/migrations/037-gamification-tracabilite.ts](file://backend/database/migrations/037-gamification-tracabilite.ts)
- [backend/database/migrations/043-correction-dossier-medical-fk.ts](file://backend/database/migrations/043-correction-dossier-medical-fk.ts)
- [backend/database/migrations/090-correction-migration-088-camelcase.sql](file://backend/database/migrations/090-correction-migration-088-camelcase.sql)
- [backend/database/migrations/050-multi-tenant-v3-max-etablissements.sql](file://backend/database/migrations/050-multi-tenant-v3-max-etablissements.sql)
- [backend/database/migrations/058-multi-tenant-structure-academique.sql](file://backend/database/migrations/058-multi-tenant-structure-academique.sql)
- [backend/database/migrations/080-preferences-utilisateur-multi-tenant.sql](file://backend/database/migrations/080-preferences-utilisateur-multi-tenant.sql)
- [backend/database/migrations/086-affectation-matiere-etablissement-id.sql](file://backend/database/migrations/086-affectation-matiere-etablissement-id.sql)
- [backend/database/migrations/105-migration-templates-v5.sql](file://backend/database/migrations/105-migration-templates-v5.sql)
- [backend/database/migrations/109-refonte-organisation.sql](file://backend/database/migrations/109-refonte-organisation.sql)
- [backend/scripts/run-migration.ts](file://backend/scripts/run-migration.ts)
- [backend/scripts/run-pending-migrations.ts](file://backend/scripts/run-pending-migrations.ts)
- [backend/deploy-all-migrations.sh](file://backend/deploy-all-migrations.sh)
- [backend/deploy-v31-complete.sh](file://backend/deploy-v31-complete.sh)
- [backend/src/config/database.config.ts](file://backend/src/config/database.config.ts)
- [backend/src/config/env.config.ts](file://backend/src/config/env.config.ts)
- [backend/src/database/data-source.ts](file://backend/src/database/data-source.ts)
- [backend/src/database/index.ts](file://backend/src/database/index.ts)

## Architecture Overview
The migration subsystem integrates with TypeORM via a configured DataSource. Scripts invoke TypeORM CLI or custom runners to execute migrations in order. Deployment scripts wrap these commands for consistent environments. The system now supports major architectural refactoring migrations that can transform entire data models while maintaining data integrity.

```mermaid
sequenceDiagram
participant Dev as "Developer"
participant Script as "run-migration.ts / run-pending-migrations.ts"
participant DS as "DataSource (data-source.ts)"
participant DB as "Database"
participant Deploy as "deploy-all-migrations.sh / deploy-v31-complete.sh"
participant Refactor as "109-refonte-organisation.sql"
Dev->>Script : "Run migration(s)"
Script->>DS : "Initialize with env config"
DS->>DB : "Connect"
Script->>DB : "Execute pending migrations in order"
DB-->>Script : "Migration results"
Script-->>Dev : "Status and logs"
Note over Script,DB : Major refactoring migrations like 109-refonte-organisation.sql<br/>perform comprehensive data transformations
Dev->>Deploy : "Trigger full deployment"
Deploy->>Script : "Invoke runner(s)"
Script->>DB : "Apply all pending migrations"
DB-->>Deploy : "Completion status"
```

**Diagram sources**
- [backend/scripts/run-migration.ts](file://backend/scripts/run-migration.ts)
- [backend/scripts/run-pending-migrations.ts](file://backend/scripts/run-pending-migrations.ts)
- [backend/src/database/data-source.ts](file://backend/src/database/data-source.ts)
- [backend/deploy-all-migrations.sh](file://backend/deploy-all-migrations.sh)
- [backend/deploy-v31-complete.sh](file://backend/deploy-v31-complete.sh)
- [backend/database/migrations/109-refonte-organisation.sql](file://backend/database/migrations/109-refonte-organisation.sql)

## Detailed Component Analysis

### Migration File Structure and Naming Conventions
- Location: backend/database/migrations
- Formats:
  - TypeScript (.ts): Programmatic migrations using TypeORM APIs.
  - SQL (.sql): Direct SQL statements for schema and data changes, including major refactoring migrations.
- Naming:
  - Numeric prefix followed by descriptive name (e.g., 037-gamification-tracabilite.ts).
  - Order determined by numeric prefix; later numbers execute after earlier ones.
  - Major refactoring migrations use descriptive names indicating their scope (e.g., 109-refonte-organisation.sql).
- Examples:
  - TypeScript: [037-gamification-tracabilite.ts](file://backend/database/migrations/037-gamification-tracabilite.ts), [043-correction-dossier-medical-fk.ts](file://backend/database/migrations/043-correction-dossier-medical-fk.ts)
  - SQL: [090-correction-migration-088-camelcase.sql](file://backend/database/migrations/090-correction-migration-088-camelcase.sql), [105-migration-templates-v5.sql](file://backend/database/migrations/105-migration-templates-v5.sql), [109-refonte-organisation.sql](file://backend/database/migrations/109-refonte-organisation.sql)

Best practices:
- Keep each migration focused on a single change set.
- Use clear, descriptive names that indicate the scope and purpose.
- Ensure idempotency where feasible (e.g., conditional DDL/DML).
- For major refactoring migrations, include comprehensive data validation and rollback procedures.

**Updated** Added reference to major refactoring migration pattern with 109-refonte-organisation.sql

**Section sources**
- [backend/database/migrations/037-gamification-tracabilite.ts](file://backend/database/migrations/037-gamification-tracabilite.ts)
- [backend/database/migrations/043-correction-dossier-medical-fk.ts](file://backend/database/migrations/043-correction-dossier-medical-fk.ts)
- [backend/database/migrations/090-correction-migration-088-camelcase.sql](file://backend/database/migrations/090-correction-migration-088-camelcase.sql)
- [backend/database/migrations/105-migration-templates-v5.sql](file://backend/database/migrations/105-migration-templates-v5.sql)
- [backend/database/migrations/109-refonte-organisation.sql](file://backend/database/migrations/109-refonte-organisation.sql)

### Execution Order and Lifecycle
- Order: Determined by numeric prefixes; lower numbers run first.
- Lifecycle:
  - Creation: Add a new .ts or .sql file with an incremented number.
  - Local development: Run targeted or pending migrations via scripts.
  - Testing: Validate against test databases using dedicated scripts.
  - Deployment: Use deployment scripts to apply all pending migrations consistently.
  - Rollback: Create a corrective migration if needed; avoid destructive rollbacks in production unless carefully planned.
  - Major refactoring: Special handling for large-scale schema transformations with comprehensive data validation.

```mermaid
flowchart TD
Start(["Start"]) --> Create["Create migration file<br/>with unique numeric prefix"]
Create --> TestLocal["Test locally with runner scripts"]
TestLocal --> Review{"Review passes?"}
Review --> |No| Iterate["Fix issues and retest"]
Review --> |Yes| Stage["Stage for deployment"]
Stage --> Deploy["Run deployment script"]
Deploy --> Verify["Verify schema and data"]
Verify --> End(["Complete"])
Iterate --> Create
```

[No sources needed since this diagram shows conceptual workflow, not actual code structure]

**Section sources**
- [backend/scripts/run-migration.ts](file://backend/scripts/run-migration.ts)
- [backend/scripts/run-pending-migrations.ts](file://backend/scripts/run-pending-migrations.ts)
- [backend/deploy-all-migrations.sh](file://backend/deploy-all-migrations.sh)
- [backend/deploy-v31-complete.sh](file://backend/deploy-v31-complete.sh)

### Automated Migration Scripts
- Node-based runners:
  - run-migration.ts: Executes specific or selected migrations.
  - run-pending-migrations.ts: Applies all pending migrations based on current state.
- Shell orchestrators:
  - deploy-all-migrations.sh: Applies all migrations in a controlled manner.
  - deploy-v31-complete.sh: Deploys a complete set for a specific version.
  - scripts/deploy-migrations-phases.sh: Phased deployment across groups.
  - scripts/test-migrations-v2.sh: Validates migrations in test scenarios.

Usage guidance:
- Prefer pending migrations during development to ensure forward-only progression.
- Use targeted runners when fixing a specific migration or running a subset.
- Wrap deployment scripts with pre/post checks (backup, validation).
- For major refactoring migrations like 109-refonte-organisation.sql, ensure extended validation periods and monitoring.

**Updated** Added guidance for handling major refactoring migrations in deployment workflows

**Section sources**
- [backend/scripts/run-migration.ts](file://backend/scripts/run-migration.ts)
- [backend/scripts/run-pending-migrations.ts](file://backend/scripts/run-pending-migrations.ts)
- [backend/deploy-all-migrations.sh](file://backend/deploy-all-migrations.sh)
- [backend/deploy-v31-complete.sh](file://backend/deploy-v31-complete.sh)
- [scripts/deploy-migrations-phases.sh](file://scripts/deploy-migrations-phases.sh)
- [scripts/test-migrations-v2.sh](file://scripts/test-migrations-v2.sh)

### Environment-Specific Configurations
- Configuration sources:
  - database.config.ts: Centralized database options.
  - env.config.ts: Environment variable loading and defaults.
  - data-source.ts: TypeORM DataSource initialization.
  - index.ts: Aggregation and export of database-related modules.
- Typical concerns:
  - Connection strings per environment.
  - Logging levels for migrations.
  - Feature flags controlling migration behavior.
  - Extended timeout configurations for major refactoring migrations.

Recommendations:
- Keep sensitive values out of source control.
- Validate required environment variables before running migrations.
- Use separate configs for dev, staging, and production.
- Configure extended timeouts and resource limits for large-scale refactoring migrations.

**Updated** Added consideration for extended timeout configurations for major refactoring migrations

**Section sources**
- [backend/src/config/database.config.ts](file://backend/src/config/database.config.ts)
- [backend/src/config/env.config.ts](file://backend/src/config/env.config.ts)
- [backend/src/database/data-source.ts](file://backend/src/database/data-source.ts)
- [backend/src/database/index.ts](file://backend/src/database/index.ts)

### Multi-Tenant Integration and Tenant-Specific Data
- Tenant scoping examples:
  - Adding tenant identifiers to tables and indexes.
  - Enforcing tenant isolation through constraints and queries.
  - Updating preferences and configurations scoped to tenants.
  - Organizational data restructuring with tenant-aware transformations.
- Representative migrations:
  - [050-multi-tenant-v3-max-etablissements.sql](file://backend/database/migrations/050-multi-tenant-v3-max-etablissements.sql)
  - [058-multi-tenant-structure-academique.sql](file://backend/database/migrations/058-multi-tenant-structure-academique.sql)
  - [080-preferences-utilisateur-multi-tenant.sql](file://backend/database/migrations/080-preferences-utilisateur-multi-tenant.sql)
  - [086-affectation-matiere-etablissement-id.sql](file://backend/database/migrations/086-affectation-matiere-etablissement-id.sql)
  - [109-refonte-organisation.sql](file://backend/database/migrations/109-refonte-organisation.sql) - Major organizational refactoring with tenant-aware data transformations

Guidelines:
- Always include tenant context in DML operations.
- Add appropriate indexes for tenant-scoped queries.
- Validate existing data for tenant consistency during migrations.
- For major refactoring migrations, ensure tenant data integrity across all organizational structures.

**Updated** Added reference to major organizational refactoring migration with tenant-aware transformations

**Section sources**
- [backend/database/migrations/050-multi-tenant-v3-max-etablissements.sql](file://backend/database/migrations/050-multi-tenant-v3-max-etablissements.sql)
- [backend/database/migrations/058-multi-tenant-structure-academique.sql](file://backend/database/migrations/058-multi-tenant-structure-academique.sql)
- [backend/database/migrations/080-preferences-utilisateur-multi-tenant.sql](file://backend/database/migrations/080-preferences-utilisateur-multi-tenant.sql)
- [backend/database/migrations/086-affectation-matiere-etablissement-id.sql](file://backend/database/migrations/086-affectation-matiere-etablissement-id.sql)
- [backend/database/migrations/109-refonte-organisation.sql](file://backend/database/migrations/109-refonte-organisation.sql)

### Common Migration Patterns
- Schema changes:
  - Add/drop columns, indexes, constraints.
  - Rename entities safely with backward-compatible steps.
  - Example path: [090-correction-migration-088-camelcase.sql](file://backend/database/migrations/090-correction-migration-088-camelcase.sql)
- Data transformations:
  - Backfill missing fields, normalize values, fix inconsistencies.
  - Use transactions to maintain integrity.
  - Example paths:
    - [037-gamification-tracabilite.ts](file://backend/database/migrations/037-gamification-tracabilite.ts)
    - [043-correction-dossier-medical-fk.ts](file://backend/database/migrations/043-correction-dossier-medical-fk.ts)
- Seed data updates:
  - Populate reference data, permissions, templates.
  - Example paths:
    - [105-migration-templates-v5.sql](file://backend/database/migrations/105-migration-templates-v5.sql)
    - [PERMISSIONS-GROUPES-SEED-UPDATE.md](file://backend/database/PERMISSIONS-GROUPES-SEED-UPDATE.md)
- Major refactoring patterns:
  - Comprehensive organizational data model restructuring.
  - Scalability and performance optimization through schema redesign.
  - Complex data transformations with validation and rollback procedures.
  - Example: [109-refonte-organisation.sql](file://backend/database/migrations/109-refonte-organisation.sql)

**Updated** Added new category for major refactoring patterns with example from migration 109

**Section sources**
- [backend/database/migrations/090-correction-migration-088-camelcase.sql](file://backend/database/migrations/090-correction-migration-088-camelcase.sql)
- [backend/database/migrations/037-gamification-tracabilite.ts](file://backend/database/migrations/037-gamification-tracabilite.ts)
- [backend/database/migrations/043-correction-dossier-medical-fk.ts](file://backend/database/migrations/043-correction-dossier-medical-fk.ts)
- [backend/database/migrations/105-migration-templates-v5.sql](file://backend/database/migrations/105-migration-templates-v5.sql)
- [backend/database/migrations/109-refonte-organisation.sql](file://backend/database/migrations/109-refonte-organisation.sql)
- [backend/database/PERMISSIONS-GROUPES-SEED-UPDATE.md](file://backend/database/PERMISSIONS-GROUPES-SEED-UPDATE.md)

### Major Refactoring Migrations
Major refactoring migrations represent significant architectural changes that require special handling and validation procedures. These migrations typically involve:

- **Comprehensive Schema Restructuring**: Complete redesign of core data models for improved scalability and performance.
- **Complex Data Transformations**: Large-scale data manipulation with validation, cleanup, and integrity checks.
- **Extended Execution Time**: Longer-running operations requiring adjusted timeout configurations.
- **Enhanced Monitoring**: Detailed logging and progress tracking for long-running operations.
- **Rollback Procedures**: Comprehensive rollback strategies to handle partial failures.

**Example: Migration 109-refonte-organisation.sql**
This migration implements major organizational data model refactoring for better scalability and performance. It includes:
- Complete restructuring of organization schema
- Comprehensive data transformations with validation
- Performance optimizations through schema redesign
- Tenant-aware data transformations for multi-tenant environments

**Deployment Considerations:**
- Extended maintenance windows required
- Enhanced monitoring and alerting during execution
- Post-deployment validation procedures
- Rollback preparation and testing

**Section sources**
- [backend/database/migrations/109-refonte-organisation.sql](file://backend/database/migrations/109-refonte-organisation.sql)

### Rollback Procedures and Conflict Resolution
- Forward-only strategy:
  - Prefer creating corrective migrations rather than reversing previous ones.
  - Document intent and impact clearly.
- Conflict resolution:
  - If two branches introduce conflicting migrations, coordinate numbering and merge strategy.
  - Use targeted runners to validate partial sets during merges.
- Safety measures:
  - Backup before applying migrations in production.
  - Run tests post-migration to verify integrity.
- Major refactoring rollback:
  - Prepare comprehensive rollback procedures for large-scale changes.
  - Test rollback scenarios in staging environments.
  - Maintain detailed rollback documentation and automated rollback scripts.

Operational references:
- Targeted execution: [run-migration.ts](file://backend/scripts/run-migration.ts)
- Pending execution: [run-pending-migrations.ts](file://backend/scripts/run-pending-migrations.ts)
- Deployment wrappers: [deploy-all-migrations.sh](file://backend/deploy-all-migrations.sh), [deploy-v31-complete.sh](file://backend/deploy-v31-complete.sh)

**Updated** Added specific guidance for major refactoring migration rollback procedures

**Section sources**
- [backend/scripts/run-migration.ts](file://backend/scripts/run-migration.ts)
- [backend/scripts/run-pending-migrations.ts](file://backend/scripts/run-pending-migrations.ts)
- [backend/deploy-all-migrations.sh](file://backend/deploy-all-migrations.sh)
- [backend/deploy-v31-complete.sh](file://backend/deploy-v31-complete.sh)

### Testing Strategies
- Validation scripts:
  - [test-migrations-v2.sh](file://scripts/test-migrations-v2.sh)
- Status tracking:
  - [pagination-migration-status.ts](file://backend/docs/pagination-migration-status.ts)
- Post-deployment verification:
  - Use targeted runners to assert expected schema and data states.
  - Combine with integration tests to validate business logic.
- Major refactoring testing:
  - Extended validation suites for large-scale data transformations.
  - Performance benchmarking before and after refactoring.
  - Multi-tenant data integrity validation.
  - Rollback procedure testing in staging environments.

**Updated** Added specific testing strategies for major refactoring migrations

**Section sources**
- [scripts/test-migrations-v2.sh](file://scripts/test-migrations-v2.sh)
- [backend/docs/pagination-migration-status.ts](file://backend/docs/pagination-migration-status.ts)

### Best Practices
- Idempotency:
  - Guard DDL/DML with existence checks.
- Transactions:
  - Wrap multi-step migrations to ensure atomicity.
- Indexing:
  - Add indexes for tenant-scoped queries and performance-sensitive filters.
- Documentation:
  - Include README notes for complex migrations.
  - Example paths:
    - [MIGRATION-076-SUCCESS.md](file://backend/database/MIGRATION-076-SUCCESS.md)
    - [README-075-GROUPES.md](file://backend/database/README-075-GROUPES.md)
- Major refactoring best practices:
  - Break down large refactoring into smaller, manageable steps when possible.
  - Implement comprehensive data validation and integrity checks.
  - Provide detailed migration documentation including impact analysis.
  - Establish clear rollback procedures and test them thoroughly.
  - Monitor performance metrics before and after refactoring.

**Updated** Added best practices specifically for major refactoring migrations

**Section sources**
- [backend/database/MIGRATION-076-SUCCESS.md](file://backend/database/MIGRATION-076-SUCCESS.md)
- [backend/database/README-075-GROUPES.md](file://backend/database/README-075-GROUPES.md)

## Dependency Analysis
The migration system depends on configuration and DataSource initialization. Scripts orchestrate execution and integrate with deployment pipelines. Major refactoring migrations may have additional dependencies on extended timeout configurations and enhanced monitoring systems.

```mermaid
graph LR
Env["env.config.ts"] --> DS["data-source.ts"]
DBConf["database.config.ts"] --> DS
DS --> RunnerA["run-migration.ts"]
DS --> RunnerB["run-pending-migrations.ts"]
RunnerA --> MigrationsTS["migrations/*.ts"]
RunnerA --> MigrationsSQL["migrations/*.sql"]
RunnerA --> RefactorMig["109-refonte-organisation.sql"]
RunnerB --> MigrationsTS
RunnerB --> MigrationsSQL
RunnerB --> RefactorMig
DeployAll["deploy-all-migrations.sh"] --> RunnerA
DeployV31["deploy-v31-complete.sh"] --> RunnerA
```

**Diagram sources**
- [backend/src/config/env.config.ts](file://backend/src/config/env.config.ts)
- [backend/src/config/database.config.ts](file://backend/src/config/database.config.ts)
- [backend/src/database/data-source.ts](file://backend/src/database/data-source.ts)
- [backend/scripts/run-migration.ts](file://backend/scripts/run-migration.ts)
- [backend/scripts/run-pending-migrations.ts](file://backend/scripts/run-pending-migrations.ts)
- [backend/deploy-all-migrations.sh](file://backend/deploy-all-migrations.sh)
- [backend/deploy-v31-complete.sh](file://backend/deploy-v31-complete.sh)
- [backend/database/migrations/109-refonte-organisation.sql](file://backend/database/migrations/109-refonte-organisation.sql)

**Section sources**
- [backend/src/config/env.config.ts](file://backend/src/config/env.config.ts)
- [backend/src/config/database.config.ts](file://backend/src/config/database.config.ts)
- [backend/src/database/data-source.ts](file://backend/src/database/data-source.ts)
- [backend/scripts/run-migration.ts](file://backend/scripts/run-migration.ts)
- [backend/scripts/run-pending-migrations.ts](file://backend/scripts/run-pending-migrations.ts)
- [backend/deploy-all-migrations.sh](file://backend/deploy-all-migrations.sh)
- [backend/deploy-v31-complete.sh](file://backend/deploy-v31-complete.sh)

## Performance Considerations
- Batch operations:
  - Process large datasets in chunks to avoid long-running transactions.
- Index management:
  - Add indexes judiciously; consider rebuild strategies for large tables.
- Monitoring:
  - Log migration durations and failures for observability.
- Tenant queries:
  - Ensure tenant-scoped queries leverage proper indexes to minimize overhead.
- Major refactoring performance:
  - Optimize data transformation queries for large datasets.
  - Implement progress tracking and checkpoint mechanisms.
  - Consider parallel processing for independent data transformations.
  - Monitor memory usage and implement garbage collection strategies.
  - Plan for extended execution times and resource allocation.

**Updated** Added specific performance considerations for major refactoring migrations

## Troubleshooting Guide
Common issues and remedies:
- Migration conflicts:
  - Use targeted runners to isolate problematic migrations.
  - Coordinate numbering and merge strategies.
- Missing environment variables:
  - Validate env.config.ts inputs before running migrations.
- Data integrity errors:
  - Inspect transaction boundaries and constraint violations.
  - Re-run with detailed logging enabled.
- Multi-tenant anomalies:
  - Verify tenant IDs exist and constraints are enforced.
  - Check indexes for tenant-scoped queries.
- Major refactoring issues:
  - Monitor execution time and resource utilization.
  - Check for data consistency across transformed records.
  - Validate tenant data integrity after organizational restructuring.
  - Review extended timeout configurations for long-running operations.

Operational references:
- Runners: [run-migration.ts](file://backend/scripts/run-migration.ts), [run-pending-migrations.ts](file://backend/scripts/run-pending-migrations.ts)
- Deployment: [deploy-all-migrations.sh](file://backend/deploy-all-migrations.sh), [deploy-v31-complete.sh](file://backend/deploy-v31-complete.sh)
- Config: [database.config.ts](file://backend/src/config/database.config.ts), [env.config.ts](file://backend/src/config/env.config.ts), [data-source.ts](file://backend/src/database/data-source.ts)

**Updated** Added troubleshooting guidance for major refactoring migrations

**Section sources**
- [backend/scripts/run-migration.ts](file://backend/scripts/run-migration.ts)
- [backend/scripts/run-pending-migrations.ts](file://backend/scripts/run-pending-migrations.ts)
- [backend/deploy-all-migrations.sh](file://backend/deploy-all-migrations.sh)
- [backend/deploy-v31-complete.sh](file://backend/deploy-v31-complete.sh)
- [backend/src/config/database.config.ts](file://backend/src/config/database.config.ts)
- [backend/src/config/env.config.ts](file://backend/src/config/env.config.ts)
- [backend/src/database/data-source.ts](file://backend/src/database/data-source.ts)

## Conclusion
The migration system combines TypeORM-based TypeScript migrations and SQL scripts, orchestrated by Node and shell scripts. Clear naming, forward-only evolution, robust testing, and careful multi-tenant scoping ensure reliable deployments. The system now supports major architectural refactoring migrations like 109-refonte-organisation.sql that can transform entire data models while maintaining data integrity. Adopt best practices around idempotency, transactions, indexing, and documentation to maintain a healthy evolution of the database schema and data, including specialized procedures for large-scale refactoring operations.

## Appendices

### Quick Reference: Key Paths
- TypeScript migrations: [backend/database/migrations/*.ts](file://backend/database/migrations/037-gamification-tracabilite.ts)
- SQL migrations: [backend/database/migrations/*.sql](file://backend/database/migrations/090-correction-migration-088-camelcase.sql)
- Major refactoring migrations: [backend/database/migrations/109-refonte-organisation.sql](file://backend/database/migrations/109-refonte-organisation.sql)
- Runners: [backend/scripts/run-migration.ts](file://backend/scripts/run-migration.ts), [backend/scripts/run-pending-migrations.ts](file://backend/scripts/run-pending-migrations.ts)
- Deployment: [backend/deploy-all-migrations.sh](file://backend/deploy-all-migrations.sh), [backend/deploy-v31-complete.sh](file://backend/deploy-v31-complete.sh)
- Config: [backend/src/config/database.config.ts](file://backend/src/config/database.config.ts), [backend/src/config/env.config.ts](file://backend/src/config/env.config.ts), [backend/src/database/data-source.ts](file://backend/src/database/data-source.ts)

**Updated** Added reference to major refactoring migration file

**Section sources**
- [backend/database/migrations/037-gamification-tracabilite.ts](file://backend/database/migrations/037-gamification-tracabilite.ts)
- [backend/database/migrations/090-correction-migration-088-camelcase.sql](file://backend/database/migrations/090-correction-migration-088-camelcase.sql)
- [backend/database/migrations/109-refonte-organisation.sql](file://backend/database/migrations/109-refonte-organisation.sql)
- [backend/scripts/run-migration.ts](file://backend/scripts/run-migration.ts)
- [backend/scripts/run-pending-migrations.ts](file://backend/scripts/run-pending-migrations.ts)
- [backend/deploy-all-migrations.sh](file://backend/deploy-all-migrations.sh)
- [backend/deploy-v31-complete.sh](file://backend/deploy-v31-complete.sh)
- [backend/src/config/database.config.ts](file://backend/src/config/database.config.ts)
- [backend/src/config/env.config.ts](file://backend/src/config/env.config.ts)
- [backend/src/database/data-source.ts](file://backend/src/database/data-source.ts)