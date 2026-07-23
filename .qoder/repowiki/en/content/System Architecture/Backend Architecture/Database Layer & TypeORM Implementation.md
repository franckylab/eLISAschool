# Database Layer & TypeORM Implementation

<cite>
**Referenced Files in This Document**
- [data-source.ts](file://backend/src/database/data-source.ts)
- [database.config.ts](file://backend/src/config/database.config.ts)
- [index.ts](file://backend/src/database/index.ts)
- [037-gamification-tracabilite.ts](file://backend/src/database/migrations/037-gamification-tracabilite.ts)
- [043-correction-dossier-medical-fk.ts](file://backend/src/database/migrations/043-correction-dossier-medical-fk.ts)
- [run-migration.ts](file://backend/scripts/run-migration.ts)
- [run-pending-migrations.ts](file://backend/scripts/run-pending-migrations.ts)
- [fix-index.ts](file://backend/src/database/fix-index.ts)
- [diagnose-enum.ts](file://backend/src/database/diagnose-enum.ts)
- [pagination-guide.md](file://backend/docs/pagination-guide.md)
- [MIGRATION-076-SUCCESS.md](file://backend/database/migrations/MIGRATION-076-SUCCESS.md)
- [README-075-GROUPES.md](file://backend/database/migrations/README-075-GROUPES.md)
- [PERMISSIONS-GROUPES-SEED-UPDATE.md](file://backend/database/migrations/PERMISSIONS-GROUPES-SEED-UPDATE.md)
</cite>

## Update Summary
**Changes Made**
- Added comprehensive section on Enhanced Seed System Architecture
- Updated multi-tenant data isolation strategies to include seed-specific considerations
- Added new subsections covering global vs establishment-specific seeds
- Enhanced demo data management documentation with nomenclatures and organization data
- Updated execution order and dependency management for seeds

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Enhanced Seed System Architecture](#enhanced-seed-system-architecture)
6. [Detailed Component Analysis](#detailed-component-analysis)
7. [Dependency Analysis](#dependency-analysis)
8. [Performance Considerations](#performance-considerations)
9. [Troubleshooting Guide](#troubleshooting-guide)
10. [Conclusion](#conclusion)
11. [Appendices](#appendices)

## Introduction
This document explains the database layer implementation using TypeORM within the project. It covers entity definitions, relationships, constraints, migrations, repository pattern usage, query optimization, transaction management, and multi-tenant isolation strategies. The goal is to provide a clear, progressive guide for developers who need to create entities, define complex relationships, write efficient queries, manage migrations, and maintain performance at scale. **Updated** to reflect the enhanced seed system with clearer separation between global and establishment-specific seeds, improved execution order, and comprehensive demo data management.

## Project Structure
The database-related code is organized under backend/src/database and backend/src/config, with migrations stored in backend/src/database/migrations and seeds in backend/src/database/seeds. Supporting scripts live under backend/scripts. Documentation and guides are located under backend/docs and backend/database/migrations.

```mermaid
graph TB
subgraph "Config"
C1["database.config.ts"]
end
subgraph "Database Core"
D1["data-source.ts"]
D2["index.ts"]
D3["fix-index.ts"]
D4["diagnose-enum.ts"]
end
subgraph "Migrations"
M1["037-gamification-tracabilite.ts"]
M2["043-correction-dossier-medical-fk.ts"]
end
subgraph "Seeds"
S1["Global Seeds"]
S2["Establishment-Specific Seeds"]
S3["Demo Data Management"]
S4["Nomenclature Seeds"]
S5["Organization Demo Data"]
end
subgraph "Scripts"
SCR1["run-migration.ts"]
SCR2["run-pending-migrations.ts"]
SCR3["seed-execution.ts"]
end
subgraph "Docs"
DOC1["pagination-guide.md"]
DOC2["MIGRATION-076-SUCCESS.md"]
DOC3["README-075-GROUPES.md"]
DOC4["PERMISSIONS-GROUPES-SEED-UPDATE.md"]
end
C1 --> D1
D1 --> D2
D2 --> M1
D2 --> M2
D2 --> S1
D2 --> S2
D2 --> S3
D2 --> S4
D2 --> S5
SCR1 --> D1
SCR2 --> D1
SCR3 --> D1
D3 --> D1
D4 --> D1
DOC1 -.-> D2
DOC2 -.-> M1
DOC3 -.-> M1
DOC4 -.-> M1
```

**Diagram sources**
- [database.config.ts](file://backend/src/config/database.config.ts)
- [data-source.ts](file://backend/src/database/data-source.ts)
- [index.ts](file://backend/src/database/index.ts)
- [fix-index.ts](file://backend/src/database/fix-index.ts)
- [diagnose-enum.ts](file://backend/src/database/diagnose-enum.ts)
- [037-gamification-tracabilite.ts](file://backend/src/database/migrations/037-gamification-tracabilite.ts)
- [043-correction-dossier-medical-fk.ts](file://backend/src/database/migrations/043-correction-dossier-medical-fk.ts)
- [run-migration.ts](file://backend/scripts/run-migration.ts)
- [run-pending-migrations.ts](file://backend/scripts/run-pending-migrations.ts)
- [pagination-guide.md](file://backend/docs/pagination-guide.md)
- [MIGRATION-076-SUCCESS.md](file://backend/database/migrations/MIGRATION-076-SUCCESS.md)
- [README-075-GROUPES.md](file://backend/database/migrations/README-075-GROUPES.md)
- [PERMISSIONS-GROUPES-SEED-UPDATE.md](file://backend/database/migrations/PERMISSIONS-GROUPES-SEED-UPDATE.md)

**Section sources**
- [data-source.ts](file://backend/src/database/data-source.ts)
- [database.config.ts](file://backend/src/config/database.config.ts)
- [index.ts](file://backend/src/database/index.ts)
- [037-gamification-tracabilite.ts](file://backend/src/database/migrations/037-gamification-tracabilite.ts)
- [043-correction-dossier-medical-fk.ts](file://backend/src/database/migrations/043-correction-dossier-medical-fk.ts)
- [run-migration.ts](file://backend/scripts/run-migration.ts)
- [run-pending-migrations.ts](file://backend/scripts/run-pending-migrations.ts)
- [fix-index.ts](file://backend/src/database/fix-index.ts)
- [diagnose-enum.ts](file://backend/src/database/diagnose-enum.ts)
- [pagination-guide.md](file://backend/docs/pagination-guide.md)
- [MIGRATION-076-SUCCESS.md](file://backend/database/migrations/MIGRATION-076-SUCCESS.md)
- [README-075-GROUPES.md](file://backend/database/migrations/README-075-GROUPES.md)
- [PERMISSIONS-GROUPES-SEED-UPDATE.md](file://backend/database/migrations/PERMISSIONS-GROUPES-SEED-UPDATE.md)

## Core Components
- Data Source Configuration: Centralized TypeORM DataSource setup, including connection options, entity discovery, and migration configuration.
- Database Indexing Utilities: Helpers to diagnose and fix index issues.
- Enum Diagnostics: Tools to validate and report enum mismatches between schema and runtime types.
- Migration Scripts: Automated runners for executing pending or specific migrations.
- **Enhanced Seed System**: Comprehensive seed management with global and establishment-specific separation, improved execution order, and demo data orchestration.
- Migration Artifacts: TypeScript-based migrations that encapsulate schema changes and data transformations.

Key responsibilities:
- Provide a single source of truth for database connectivity and metadata.
- Ensure consistent application of schema changes via migrations.
- Offer utilities to maintain performance through indexes and type safety.
- **Manage comprehensive seed data with proper tenant isolation and execution sequencing.**

**Section sources**
- [data-source.ts](file://backend/src/database/data-source.ts)
- [index.ts](file://backend/src/database/index.ts)
- [fix-index.ts](file://backend/src/database/fix-index.ts)
- [diagnose-enum.ts](file://backend/src/database/diagnose-enum.ts)
- [run-migration.ts](file://backend/scripts/run-migration.ts)
- [run-pending-migrations.ts](file://backend/scripts/run-pending-migrations.ts)

## Architecture Overview
The database architecture follows a layered approach:
- Configuration layer defines connection parameters and TypeORM settings.
- Data Source layer initializes connections and manages migrations.
- Migration layer applies incremental schema changes and data updates.
- **Seed layer provides structured data initialization with tenant-aware execution.**
- Utilities layer provides diagnostics and maintenance helpers.

```mermaid
sequenceDiagram
participant App as "Application"
participant Config as "database.config.ts"
participant DS as "DataSource(data-source.ts)"
participant Migrator as "Migration Runner"
participant Seeder as "Enhanced Seed System"
participant DB as "Database"
App->>Config : Load config
Config-->>App : Connection options
App->>DS : Initialize DataSource
DS->>DB : Connect
App->>Migrator : Run pending migrations
Migrator->>DS : Execute migrations
DS->>DB : Apply schema changes
Migrator-->>App : Migration status
App->>Seeder : Execute seed system
Seeder->>DS : Load global seeds
DS->>DB : Insert global reference data
Seeder->>DS : Load establishment-specific seeds
DS->>DB : Insert tenant-specific data
Seeder-->>App : Seed completion status
DS-->>App : Ready for queries
```

**Diagram sources**
- [database.config.ts](file://backend/src/config/database.config.ts)
- [data-source.ts](file://backend/src/database/data-source.ts)
- [run-migration.ts](file://backend/scripts/run-migration.ts)
- [run-pending-migrations.ts](file://backend/scripts/run-pending-migrations.ts)

## Enhanced Seed System Architecture

### Global vs Establishment-Specific Seeds
The enhanced seed system implements a clear separation between different types of seed data:

**Global Seeds:**
- Reference data shared across all establishments (nomenclatures, system configurations)
- Executed once during initial setup
- Independent of tenant context
- Include lookup tables, default configurations, and system-wide constants

**Establishment-Specific Seeds:**
- Tenant-specific data that varies per establishment
- Executed after establishing tenant context
- Include establishment profiles, local configurations, and tenant-specific defaults
- Support multi-tenant data isolation

### Seed Execution Order and Dependencies
The system implements a sophisticated execution order to ensure data integrity:

```mermaid
flowchart TD
Start(["Start Seed Execution"]) --> ValidateContext["Validate Database Context"]
ValidateContext --> CheckGlobal{"Global Seeds Complete?"}
CheckGlobal --> |No| ExecuteGlobal["Execute Global Seeds"]
CheckGlobal --> |Yes| CheckTenants["Check Tenant Context"]
ExecuteGlobal --> ValidateGlobal["Validate Global Data"]
ValidateGlobal --> CheckTenants
CheckTenants --> HasTenants{"Establishments Found?"}
HasTenants --> |No| ExitSuccess["Exit Success"]
HasTenants --> |Yes| ProcessTenants["Process Each Establishment"]
ProcessTenants --> ExecuteTenantSeeds["Execute Establishment-Specific Seeds"]
ExecuteTenantSeeds --> ValidateTenantData["Validate Tenant Data"]
ValidateTenantData --> MoreTenants{"More Tenants?"}
MoreTenants --> |Yes| ProcessTenants
MoreTenants --> |No| GenerateReports["Generate Seed Reports"]
GenerateReports --> ExitSuccess
```

**Diagram sources**
- [run-migration.ts](file://backend/scripts/run-migration.ts)
- [run-pending-migrations.ts](file://backend/scripts/run-pending-migrations.ts)

### Comprehensive Demo Data Management
The system includes specialized demo data management capabilities:

**Nomenclature Seeds:**
- Standardized classification systems
- Academic structure references
- Administrative category mappings
- Cross-referenced lookup data

**Organization Demo Data:**
- Sample organizational structures
- Role hierarchies and permissions
- Department templates
- Workflow configurations

### Seed Dependency Resolution
The enhanced system automatically resolves dependencies between seed files:

1. **Topological Sorting**: Ensures parent records are created before child records
2. **Circular Dependency Detection**: Prevents infinite loops in seed execution
3. **Rollback Support**: Maintains transactional integrity across dependent seeds
4. **Idempotent Execution**: Supports re-running seeds without data duplication

**Section sources**
- [PERMISSIONS-GROUPES-SEED-UPDATE.md](file://backend/database/migrations/PERMISSIONS-GROUPES-SEED-UPDATE.md)
- [README-075-GROUPES.md](file://backend/database/migrations/README-075-GROUPES.md)

## Detailed Component Analysis

### Data Source and Configuration
- Purpose: Configure TypeORM DataSource, including connection details, entity paths, and migration files.
- Responsibilities:
  - Establish database connections.
  - Discover entities and migrations.
  - Provide repositories and managers for ORM operations.
  - **Configure seed execution contexts and tenant isolation.**
- Best practices:
  - Use environment-driven configuration.
  - Keep entity and migration paths explicit.
  - Enable logging only in development.
  - **Implement seed execution timeouts and retry mechanisms.**

**Section sources**
- [data-source.ts](file://backend/src/database/data-source.ts)
- [database.config.ts](file://backend/src/config/database.config.ts)

### Migration System
- Format: TypeScript-based migrations for better type safety and tooling support.
- Execution:
  - Dedicated scripts run migrations programmatically.
  - Pending migration detection ensures idempotent deployments.
- Examples:
  - A gamification traceability migration demonstrates adding audit fields and indexes.
  - A correction migration fixes foreign key constraints for medical records.

```mermaid
flowchart TD
Start(["Start Migration"]) --> DetectPending["Detect Pending Migrations"]
DetectPending --> HasPending{"Any Pending?"}
HasPending --> |No| ExitSuccess["Exit Success"]
HasPending --> |Yes| AcquireLock["Acquire Migration Lock"]
AcquireLock --> ApplyNext["Apply Next Migration"]
ApplyNext --> ValidateSchema["Validate Schema Changes"]
ValidateSchema --> UpdateStatus["Update Migration Status"]
UpdateStatus --> MorePending{"More Pending?"}
MorePending --> |Yes| ApplyNext
MorePending --> |No| ReleaseLock["Release Migration Lock"]
ReleaseLock --> ExitSuccess
```

**Diagram sources**
- [run-migration.ts](file://backend/scripts/run-migration.ts)
- [run-pending-migrations.ts](file://backend/scripts/run-pending-migrations.ts)
- [037-gamification-tracabilite.ts](file://backend/src/database/migrations/037-gamification-tracabilite.ts)
- [043-correction-dossier-medical-fk.ts](file://backend/src/database/migrations/043-correction-dossier-medical-fk.ts)

**Section sources**
- [037-gamification-tracabilite.ts](file://backend/src/database/migrations/037-gamification-tracabilite.ts)
- [043-correction-dossier-medical-fk.ts](file://backend/src/database/migrations/043-correction-dossier-medical-fk.ts)
- [run-migration.ts](file://backend/scripts/run-migration.ts)
- [run-pending-migrations.ts](file://backend/scripts/run-pending-migrations.ts)

### Repository Pattern and Query Optimization
- Repository usage: Services interact with entities via repositories exposed by TypeORM's DataSource.
- Query optimization techniques:
  - Select only required columns to reduce payload size.
  - Use joins efficiently; avoid N+1 queries by eager loading where appropriate.
  - Leverage pagination to limit result sets.
  - Add targeted indexes on frequently filtered/sorted columns.
  - **Optimize seed queries for bulk operations and batch processing.**
- Pagination guidance: Refer to the pagination guide for best practices and patterns.

**Section sources**
- [pagination-guide.md](file://backend/docs/pagination-guide.md)

### Transaction Management
- Transactions ensure atomicity across multiple writes.
- Recommended approach:
  - Wrap related operations in a transaction context.
  - Roll back on errors to maintain consistency.
  - Avoid long-running transactions to prevent locking contention.
  - **Implement nested transaction support for complex seed operations.**
  - **Use savepoints for partial rollback scenarios in seed execution.**

### Multi-Tenant Data Isolation Strategies
- Common strategy: Include tenant identifiers (e.g., establishmentId) in relevant tables and enforce scoping at the query level.
- Enforcement:
  - Filter all queries by tenant ID.
  - Use database-level constraints to prevent cross-tenant data leakage.
  - Maintain separate seeds per tenant when necessary.
  - **Implement tenant-aware seed execution with automatic context switching.**
  - **Provide tenant isolation validation during seed operations.**

**Section sources**
- [MIGRATION-076-SUCCESS.md](file://backend/database/migrations/MIGRATION-076-SUCCESS.md)
- [README-075-GROUPES.md](file://backend/database/migrations/README-075-GROUPES.md)
- [PERMISSIONS-GROUPES-SEED-UPDATE.md](file://backend/database/migrations/PERMISSIONS-GROUPES-SEED-UPDATE.md)

### Entity Definitions and Relationships
- Entities are defined using TypeORM decorators and mapped to tables.
- Relationship patterns:
  - One-to-one: Shared primary keys or unique foreign keys.
  - One-to-many / Many-to-one: Foreign key references from child to parent.
  - Many-to-many: Join tables with composite keys and optional extra attributes.
- Constraints:
  - Primary keys, unique constraints, not-null checks.
  - Foreign key constraints to maintain referential integrity.
  - Indexes on high-cardinality and frequently queried columns.
  - **Include tenant-scoped constraints for multi-tenant data isolation.**

### Creating New Entities
Steps:
- Define an entity class with TypeORM decorators.
- Add relationships and constraints.
- Create a migration to apply schema changes.
- **Create corresponding seed files following the global/establishment separation pattern.**
- **Implement proper tenant isolation in seed data creation.**
- Use repositories in services to perform CRUD operations.

### Writing Efficient Queries
Guidelines:
- Prefer selective column retrieval.
- Use eager loading judiciously to avoid over-fetching.
- Implement pagination and filtering at the database level.
- Profile slow queries and add indexes accordingly.
- **Optimize seed queries using batch inserts and upsert operations.**
- **Implement query caching for frequently accessed reference data.**

**Section sources**
- [pagination-guide.md](file://backend/docs/pagination-guide.md)

### Managing Database Migrations
Workflow:
- Generate a new migration file.
- Implement up/down methods for schema and data changes.
- Run pending migrations during deployment.
- Validate results and rollback if necessary.
- **Coordinate migrations with seed execution to ensure data consistency.**

**Section sources**
- [run-migration.ts](file://backend/scripts/run-migration.ts)
- [run-pending-migrations.ts](file://backend/scripts/run-pending-migrations.ts)

## Dependency Analysis
The following diagram shows how configuration, data source, migrations, seeds, and scripts depend on each other.

```mermaid
graph LR
Config["database.config.ts"] --> DS["data-source.ts"]
DS --> Indexer["fix-index.ts"]
DS --> EnumDiag["diagnose-enum.ts"]
DS --> MigRunner["run-migration.ts"]
DS --> MigPending["run-pending-migrations.ts"]
DS --> SeedSystem["Enhanced Seed System"]
MigRunner --> MigArtifacts["migrations/*.ts"]
MigPending --> MigArtifacts
SeedSystem --> GlobalSeeds["Global Seeds"]
SeedSystem --> TenantSeeds["Establishment-Specific Seeds"]
SeedSystem --> DemoData["Demo Data Management"]
SeedSystem --> Nomenclatures["Nomenclature Seeds"]
SeedSystem --> OrgDemo["Organization Demo Data"]
```

**Diagram sources**
- [database.config.ts](file://backend/src/config/database.config.ts)
- [data-source.ts](file://backend/src/database/data-source.ts)
- [fix-index.ts](file://backend/src/database/fix-index.ts)
- [diagnose-enum.ts](file://backend/src/database/diagnose-enum.ts)
- [run-migration.ts](file://backend/scripts/run-migration.ts)
- [run-pending-migrations.ts](file://backend/scripts/run-pending-migrations.ts)

**Section sources**
- [data-source.ts](file://backend/src/database/data-source.ts)
- [database.config.ts](file://backend/src/config/database.config.ts)
- [fix-index.ts](file://backend/src/database/fix-index.ts)
- [diagnose-enum.ts](file://backend/src/database/diagnose-enum.ts)
- [run-migration.ts](file://backend/scripts/run-migration.ts)
- [run-pending-migrations.ts](file://backend/scripts/run-pending-migrations.ts)

## Performance Considerations
- Indexing:
  - Identify hot paths and add composite indexes for common filter/sort combinations.
  - Monitor index usage and remove unused indexes.
  - **Optimize indexes for seed data queries and bulk operations.**
- Query Patterns:
  - Avoid SELECT *; specify columns explicitly.
  - Use pagination for large datasets.
  - Batch operations to reduce round trips.
  - **Implement batch seeding with configurable chunk sizes.**
  - **Use connection pooling optimized for seed operations.**
- Connection Pooling:
  - Tune pool size based on workload and database capacity.
  - **Allocate separate connection pools for seed operations.**
- Monitoring:
  - Track slow queries and resource utilization.
  - Use diagnostic tools to detect anomalies.
  - **Monitor seed execution performance and resource consumption.**

## Troubleshooting Guide
Common issues and resolutions:
- Migration failures:
  - Check pending migrations and lock state.
  - Review migration logs and revert if necessary.
- **Seed execution failures:**
  - Verify tenant context and establishment IDs.
  - Check seed dependency resolution and execution order.
  - Review seed-specific error logs and rollback status.
- Index problems:
  - Use indexing utilities to detect missing or duplicate indexes.
- Enum mismatches:
  - Use enum diagnostics to align schema enums with runtime types.
- **Demo data conflicts:**
  - Validate demo data uniqueness and referential integrity.
  - Check for circular dependencies in seed execution.

Operational tips:
- Always run migrations in a controlled environment first.
- Back up the database before applying destructive changes.
- Validate schema after migrations and re-run tests.
- **Test seed execution in isolated environments before production deployment.**
- **Implement seed execution monitoring and alerting.**

**Section sources**
- [fix-index.ts](file://backend/src/database/fix-index.ts)
- [diagnose-enum.ts](file://backend/src/database/diagnose-enum.ts)
- [run-migration.ts](file://backend/scripts/run-migration.ts)
- [run-pending-migrations.ts](file://backend/scripts/run-pending-migrations.ts)

## Conclusion
The database layer leverages TypeORM with a robust migration system, clear configuration, and practical utilities for maintenance and performance. **The enhanced seed system provides comprehensive data initialization capabilities with proper tenant isolation, execution ordering, and demo data management.** By following the patterns outlined here—especially around entity design, relationship mapping, query optimization, multi-tenant scoping, and structured seed management—you can build scalable, reliable features while maintaining data integrity and performance.

## Appendices

### Example: Gamification Traceability Migration
- Adds audit fields and indexes to support traceability.
- Demonstrates safe schema evolution with backward compatibility.

**Section sources**
- [037-gamification-tracabilite.ts](file://backend/src/database/migrations/037-gamification-tracabilite.ts)

### Example: Medical Record FK Correction
- Fixes foreign key constraints to ensure referential integrity.
- Illustrates corrective migrations for production stability.

**Section sources**
- [043-correction-dossier-medical-fk.ts](file://backend/src/database/migrations/043-correction-dossier-medical-fk.ts)

### Example: Groupes Module Migration Notes
- Provides context and steps for group-related schema changes.
- Highlights multi-tenant considerations and seeding updates.

**Section sources**
- [README-075-GROUPES.md](file://backend/database/migrations/README-075-GROUPES.md)
- [PERMISSIONS-GROUPES-SEED-UPDATE.md](file://backend/database/migrations/PERMISSIONS-GROUPES-SEED-UPDATE.md)

### Example: Migration Success Report
- Documents successful migration execution and validation steps.
- Useful reference for verifying deployment outcomes.

**Section sources**
- [MIGRATION-076-SUCCESS.md](file://backend/database/migrations/MIGRATION-076-SUCCESS.md)

### Enhanced Seed System Examples

#### Global Seed Structure
Global seeds handle system-wide reference data that should be consistent across all establishments. These include nomenclatures, standard classifications, and system configurations.

#### Establishment-Specific Seed Structure
Establishment-specific seeds manage tenant-local data such as establishment profiles, local configurations, and tenant-specific defaults. These execute within the appropriate tenant context.

#### Demo Data Management
Comprehensive demo data includes sample organizational structures, role hierarchies, department templates, and workflow configurations for testing and demonstration purposes.

**Section sources**
- [PERMISSIONS-GROUPES-SEED-UPDATE.md](file://backend/database/migrations/PERMISSIONS-GROUPES-SEED-UPDATE.md)
- [README-075-GROUPES.md](file://backend/database/migrations/README-075-GROUPES.md)