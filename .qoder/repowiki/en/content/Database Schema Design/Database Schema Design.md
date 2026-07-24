# Database Schema Design

<cite>
**Referenced Files in This Document**
- [database.config.ts](file://backend/src/config/database.config.ts)
- [data-source.ts](file://backend/src/database/data-source.ts)
- [index.ts](file://backend/src/database/index.ts)
- [050-multi-tenant-v3-max-etablissements.sql](file://backend/database/migrations/050-multi-tenant-v3-max-etablissements.sql)
- [080-preferences-utilisateur-multi-tenant.sql](file://backend/database/migrations/080-preferences-utilisateur-multi-tenant.sql)
- [084-cleanup-classe-id-notes.sql](file://backend/database/migrations/084-cleanup-classe-id-notes.sql)
- [085-periode-etablissement-id.sql](file://backend/database/migrations/085-periode-etablissement-id.sql)
- [086-affectation-matiere-etablissement-id.sql](file://backend/database/migrations/086-affectation-matiere-etablissement-id.sql)
- [087-affectation-matiere-verifications.sql](file://backend/database/migrations/087-affectation-matiere-verifications.sql)
- [088-refactorisation-architecture-academique.sql](file://backend/database/migrations/088-refactorisation-architecture-academique.sql)
- [089-finalisation-architecture-academique-v2.sql](file://backend/database/migrations/089-finalisation-architecture-academique-v2.sql)
- [091-peuplement-architecture-academique.sql](file://backend/database/migrations/091-peuplement-architecture-academique.sql)
- [092-refactorisation-classeAnneeId.sql](file://backend/database/migrations/092-refactorisation-classeAnneeId.sql)
- [099-add-monitoring-params.sql](file://backend/database/migrations/099-add-monitoring-params.sql)
- [100-classes-salle-principale.sql](file://backend/database/migrations/100-classes-salle-principale.sql)
- [101-normalisation-annee-scolaire-cloture.sql](file://backend/database/migrations/101-normalisation-annee-scolaire-cloture.sql)
- [102-periodes-hierarchie.sql](file://backend/database/migrations/102-periodes-hierarchie.sql)
- [103-templates-periode-personnalisables.sql](file://backend/database/migrations/103-templates-periode-personnalisables.sql)
- [104-refonte-periodes-niveaux-configurables.sql](file://backend/database/migrations/104-refonte-periodes-niveaux-configurables.sql)
- [105-migration-templates-v5.sql](file://backend/database/migrations/105-migration-templates-v5.sql)
- [106-rename-sequence-to-evaluation.sql](file://backend/database/migrations/106-rename-sequence-to-evaluation.sql)
- [107-cleanup-configuration-modules-actif.sql](file://backend/database/migrations/107-cleanup-configuration-modules-actif.sql)
- [108-refactor-salle-principale.sql](file://backend/database/migrations/108-refactor-salle-principale.sql)
- [111-refactoring-nomenclatures.sql](file://backend/database/migrations/111-refactoring-nomenclatures.sql)
- [112-refonte-organisation-v4.sql](file://backend/database/migrations/112-refonte-organisation-v4.sql)
- [114-drop-categorie-personnel.sql](file://backend/database/migrations/114-drop-categorie-personnel.sql)
- [115-poste-fonction-id-not-null.sql](file://backend/database/migrations/115-poste-fonction-id-not-null.sql)
- [run-migration.ts](file://backend/scripts/run-migration.ts)
- [run-pending-migrations.ts](file://backend/scripts/run-pending-migrations.ts)
- [migrate-rbac-v3.sql](file://backend/database/migrations/migrate-rbac-v3.sql)
- [PERMISSIONS-GROUPES-SEED-UPDATE.md](file://backend/database/migrations/PERMISSIONS-GROUPES-SEED-UPDATE.md)
- [README-075-GROUPES.md](file://backend/database/migrations/README-075-GROUPES.md)
- [MIGRATION-076-SUCCESS.md](file://backend/database/migrations/MIGRATION-076-SUCCESS.md)
- [backup-auto.sh](file://docker/scripts/backup-auto.sh)
- [backup-manuel.sh](file://docker/scripts/backup-manuel.sh)
- [restore.sh](file://docker/scripts/restore.sh)
- [cron-backup.txt](file://docker/scripts/cron-backup.txt)
- [install-cron.sh](file://docker/scripts/install-cron.sh)
</cite>

## Update Summary
**Changes Made**
- Updated to reflect major organizational restructuring through migration 112-refonte-organisation-v4.sql with 315 lines of SQL changes
- Documented consolidation of redundant entity tables into unified EchelonStructurel table structure
- Enhanced personnel management section with new hierarchical echelon relationships
- Updated seed data management procedures to reflect extensive modifications across multiple locations
- Strengthened organizational unit hierarchy with improved data integrity constraints

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
This document provides comprehensive data model documentation for eLISAschool's database schema. It covers entity relationships, field definitions, data types, constraints, primary and foreign keys, indexes, and performance optimizations. It also documents multi-tenant isolation patterns, tenant-specific tables, validation rules, business constraints, referential integrity, lifecycle policies, archival strategies, backup procedures, migration patterns, version management, rollback strategies, seed data management, and demo data generation procedures.

The goal is to make the schema accessible to both technical and non-technical readers while providing precise references to source files and migrations.

**Updated** The schema has undergone significant restructuring with the latest organizational consolidation through migration 112-refonte-organisation-v4.sql, which introduces a unified EchelonStructurel table structure replacing redundant entity tables. This major refactoring enhances data integrity, simplifies organizational hierarchies, and improves maintainability across the entire system. Recent improvements focus on enhanced normalization patterns, consolidated organizational entities, strengthened personnel management constraints, and standardized reference data management with TYPE_ prefixed coding standards.

## Project Structure
The database schema is defined primarily through SQL migrations under backend/database/migrations and managed via TypeORM configuration and scripts. The application uses a single PostgreSQL instance with multi-tenant scoping enforced at the application layer and reinforced by schema design (e.g., etablisement_id columns). Migrations are executed using Node.js scripts that integrate with TypeORM.

```mermaid
graph TB
subgraph "Backend"
A["TypeORM DataSource<br/>data-source.ts"]
B["Database Config<br/>database.config.ts"]
C["DB Index<br/>database/index.ts"]
D["Migration Runner<br/>scripts/run-migration.ts"]
E["Pending Migrations<br/>scripts/run-pending-migrations.ts"]
end
subgraph "Major Organizational Restructuring"
R1["EchelonStructurel Consolidation<br/>112-refonte-organisation-v4.sql"]
R2["Redundant Entity Removal<br/>Unified Table Structure"]
R3["Enhanced Hierarchical Relationships<br/>Improved Data Integrity"]
R4["Seed Data Migration<br/>Extensive Modifications"]
end
subgraph "Personnel Management Enhancements"
P1["Category Cleanup<br/>114-drop-categorie-personnel.sql"]
P2["Poste Fonction Constraint<br/>115-poste-fonction-id-not-null.sql"]
P3["TemplatePoste Enhancement<br/>Optional fonctionId Field"]
P4["TYPE_ Prefixed Codes<br/>Enhanced Reference Data"]
end
subgraph "Core Migrations"
M1["Multi-Tenant v3<br/>050-multi-tenant-v3-max-etablissements.sql"]
M2["Academic Architecture Refactor<br/>088-refactorisation-architecture-academique.sql"]
M3["Finalize Academic Arch v2<br/>089-finalisation-architecture-academique-v2.sql"]
M4["Peopling Academic Arch<br/>091-peuplement-architecture-academique.sql"]
M5["Refactor ClasseAnneeId<br/>092-refactorisation-classeAnneeId.sql"]
M6["Monitoring Params<br/>099-add-monitoring-params.sql"]
M7["Classes Main Room<br/>100-classes-salle-principale.sql"]
M8["School Year Closure Normalization<br/>101-normalisation-annee-scolaire-cloture.sql"]
M9["Periods Hierarchy<br/>102-periodes-hierarchie.sql"]
M10["Customizable Period Templates<br/>103-templates-periode-personnalisables.sql"]
M11["Periods Levels Configurable<br/>104-refonte-periodes-niveaux-configurables.sql"]
M12["Templates V5 Migration<br/>105-migration-templates-v5.sql"]
M13["Rename Sequence to Evaluation<br/>106-rename-sequence-to-evaluation.sql"]
M14["Cleanup Modules Actif<br/>107-cleanup-configuration-modules-actif.sql"]
M15["Refactor Salle Principale<br/>108-refactor-salle-principale.sql"]
end
A --> B
A --> C
D --> A
E --> A
D --> M1
D --> M2
D --> M3
D --> M4
D --> M5
D --> M6
D --> M7
D --> M8
D --> M9
D --> M10
D --> M11
D --> M12
D --> M13
D --> M14
D --> M15
D --> R1
D --> R2
D --> R3
D --> R4
D --> P1
D --> P2
D --> P3
D --> P4
```

**Diagram sources**
- [data-source.ts](file://backend/src/database/data-source.ts)
- [database.config.ts](file://backend/src/config/database.config.ts)
- [index.ts](file://backend/src/database/index.ts)
- [run-migration.ts](file://backend/scripts/run-migration.ts)
- [run-pending-migrations.ts](file://backend/scripts/run-pending-migrations.ts)
- [112-refonte-organisation-v4.sql](file://backend/database/migrations/112-refonte-organisation-v4.sql)
- [114-drop-categorie-personnel.sql](file://backend/database/migrations/114-drop-categorie-personnel.sql)
- [115-poste-fonction-id-not-null.sql](file://backend/database/migrations/115-poste-fonction-id-not-null.sql)
- [050-multi-tenant-v3-max-etablissements.sql](file://backend/database/migrations/050-multi-tenant-v3-max-etablissements.sql)
- [088-refactorisation-architecture-academique.sql](file://backend/database/migrations/088-refactorisation-architecture-academique.sql)
- [089-finalisation-architecture-academique-v2.sql](file://backend/database/migrations/089-finalisation-architecture-academique-v2.sql)
- [091-peuplement-architecture-academique.sql](file://backend/database/migrations/091-peuplement-architecture-academique.sql)
- [092-refactorisation-classeAnneeId.sql](file://backend/database/migrations/092-refactorisation-classeAnneeId.sql)
- [099-add-monitoring-params.sql](file://backend/database/migrations/099-add-monitoring-params.sql)
- [100-classes-salle-principale.sql](file://backend/database/migrations/100-classes-salle-principale.sql)
- [101-normalisation-annee-scolaire-cloture.sql](file://backend/database/migrations/101-normalisation-annee-scolaire-cloture.sql)
- [102-periodes-hierarchie.sql](file://backend/database/migrations/102-periodes-hierarchie.sql)
- [103-templates-periode-personnalisables.sql](file://backend/database/migrations/103-templates-periode-personnalisables.sql)
- [104-refonte-periodes-niveaux-configurables.sql](file://backend/database/migrations/104-refonte-periodes-niveaux-configurables.sql)
- [105-migration-templates-v5.sql](file://backend/database/migrations/105-migration-templates-v5.sql)
- [106-rename-sequence-to-evaluation.sql](file://backend/database/migrations/106-rename-sequence-to-evaluation.sql)
- [107-cleanup-configuration-modules-actif.sql](file://backend/database/migrations/107-cleanup-configuration-modules-actif.sql)
- [108-refactor-salle-principale.sql](file://backend/database/migrations/108-refactor-salle-principale.sql)

**Section sources**
- [database.config.ts](file://backend/src/config/database.config.ts)
- [data-source.ts](file://backend/src/database/data-source.ts)
- [index.ts](file://backend/src/database/index.ts)
- [run-migration.ts](file://backend/scripts/run-migration.ts)
- [run-pending-migrations.ts](file://backend/scripts/run-pending-migrations.ts)

## Core Components
- Multi-tenant isolation: Tenant context is enforced via etablisement_id on core entities and preferences. Key migrations introduce or reinforce tenant-scoped columns and constraints.
- Academic architecture: Major refactors define cycles, levels, classes, subjects, evaluations, schedules, and related structures with strict referential integrity.
- Periods and school years: Hierarchical periods, customizable templates, and closure normalization ensure consistent academic calendars.
- Monitoring and configuration: Additional monitoring parameters and cleanup of module activation flags improve operational visibility and consistency.
- **Major Organizational Restructuring**: Migration 112-refonte-organisation-v4.sql consolidates redundant entity tables into unified EchelonStructurel table structure, eliminating data duplication and improving hierarchical relationships.
- **Enhanced Personnel Management**: New personnel types and hierarchical relationships provide flexible organizational structures with strengthened constraints.
- **Database-Driven Validation**: Replaced enum-based validation with truth tables for better maintainability and extensibility.
- **Reference Data Standardization**: TYPE_ prefixed codes provide clear categorization and improved consistency across all reference data systems.

Key responsibilities:
- Enforce tenant boundaries across modules (finance, personnel, academic, scheduling).
- Maintain referential integrity between academic entities (cycles, levels, classes, subjects, evaluations).
- Provide flexible period templates and hierarchical period structures.
- Support main room assignment per class and refactor associated fields.
- **Manage complex organizational hierarchies through unified EchelonStructurel table with enhanced constraint enforcement**.
- **Enable dynamic validation through database-driven truth tables**.
- **Implement enhanced normalization patterns for improved data integrity**.
- **Standardize reference data with TYPE_ prefixed coding conventions**.

**Section sources**
- [050-multi-tenant-v3-max-etablissements.sql](file://backend/database/migrations/050-multi-tenant-v3-max-etablissements.sql)
- [088-refactorisation-architecture-academique.sql](file://backend/database/migrations/088-refactorisation-architecture-academique.sql)
- [089-finalisation-architecture-academique-v2.sql](file://backend/database/migrations/089-finalisation-architecture-academique-v2.sql)
- [091-peuplement-architecture-academique.sql](file://backend/database/migrations/091-peuplement-architecture-academique.sql)
- [092-refactorisation-classeAnneeId.sql](file://backend/database/migrations/092-refactorisation-classeAnneeId.sql)
- [101-normalisation-annee-scolaire-cloture.sql](file://backend/database/migrations/101-normalisation-annee-scolaire-cloture.sql)
- [102-periodes-hierarchie.sql](file://backend/database/migrations/102-periodes-hierarchie.sql)
- [103-templates-periode-personnalisables.sql](file://backend/database/migrations/103-templates-periode-personnalisables.sql)
- [104-refonte-periodes-niveaux-configurables.sql](file://backend/database/migrations/104-refonte-periodes-niveaux-configurables.sql)
- [105-migration-templates-v5.sql](file://backend/database/migrations/105-migration-templates-v5.sql)
- [100-classes-salle-principale.sql](file://backend/database/migrations/100-classes-salle-principale.sql)
- [108-refactor-salle-principale.sql](file://backend/database/migrations/108-refactor-salle-principale.sql)
- [099-add-monitoring-params.sql](file://backend/database/migrations/099-add-monitoring-params.sql)
- [107-cleanup-configuration-modules-actif.sql](file://backend/database/migrations/107-cleanup-configuration-modules-actif.sql)
- [112-refonte-organisation-v4.sql](file://backend/database/migrations/112-refonte-organisation-v4.sql)
- [114-drop-categorie-personnel.sql](file://backend/database/migrations/114-drop-categorie-personnel.sql)
- [115-poste-fonction-id-not-null.sql](file://backend/database/migrations/115-poste-fonction-id-not-null.sql)

## Architecture Overview
The database architecture centers around a single PostgreSQL instance with multi-tenant scoping. Each tenant corresponds to an establishment (etablissement), and most domain tables include etablisement_id to enforce data isolation. Academic entities are organized hierarchically (cycles → levels → classes), with subjects and evaluations linked to these structures. Periods define academic timeframes and can be templated and configured per level. Scheduling includes rooms and main room assignments per class.

**Updated** The architecture now features a major organizational restructuring through the unified EchelonStructurel table, eliminating redundant entity tables and establishing cleaner hierarchical relationships. Enhanced personnel management with hierarchical relationships, organizational unit classifications, and strengthened constraints further improve data integrity. The recent consolidation reduces complexity while maintaining full functionality and improving query performance.

```mermaid
erDiagram
ETABLISSEMENT {
uuid id PK
string name
boolean active
timestamp created_at
timestamp updated_at
}
UTILISATEUR {
uuid id PK
uuid etablisement_id FK
string email
string role
boolean active
timestamp created_at
timestamp updated_at
}
CYCLE {
uuid id PK
uuid etablisement_id FK
string code
string label
integer order_index
boolean active
}
NIVEAU {
uuid id PK
uuid etablisement_id FK
uuid cycle_id FK
string code
string label
integer order_index
boolean active
}
CLASSE {
uuid id PK
uuid etablisement_id FK
uuid niveau_id FK
string code
string label
uuid salle_principale_id FK
boolean active
}
MATIERE {
uuid id PK
uuid etablisement_id FK
string code
string label
float coefficient
boolean active
}
EVALUATION {
uuid id PK
uuid etablisement_id FK
uuid classe_id FK
uuid matiere_id FK
date date_eval
float max_score
float weight
boolean closed
}
PERIODE {
uuid id PK
uuid etablisement_id FK
uuid periode_parent_id FK
string code
string label
date start_date
date end_date
boolean template
boolean active
}
ANNEE_SCOLAIRE {
uuid id PK
uuid etablisement_id FK
string year_label
date start_date
date end_date
boolean closed
}
SALLE {
uuid id PK
uuid etablisement_id FK
string code
string label
integer capacity
boolean active
}
ECHOLON_STRUCTUREL {
uuid id PK
uuid etablisement_id FK
uuid parent_echelon_id FK
string code
string label
string type
integer order_index
boolean active
timestamp created_at
timestamp updated_at
}
PERSONNEL_TYPE {
uuid id PK
uuid etablisement_id FK
string code
string label
string description
boolean active
}
ORGANIZATIONAL_UNIT {
uuid id PK
uuid etablisement_id FK
uuid parent_unit_id FK
string code
string label
string type
boolean active
}
TEMPLATE_POSTE {
uuid id PK
uuid etablisement_id FK
uuid fonction_id FK
string code
string label
boolean active
}
TRUTH_TABLE {
uuid id PK
uuid etablisement_id FK
string table_name
string column_name
string value
string description
boolean active
}
REFERENCE_DATA {
uuid id PK
uuid etablisement_id FK
string type_code
string display_name
boolean active
timestamp created_at
timestamp updated_at
}
UTILISATEUR ||--o{ UTILISATEUR : "role hierarchy"
ETABLISSEMENT ||--o{ UTILISATEUR : "belongs to"
ETABLISSEMENT ||--o{ CYCLE : "owns"
ETABLISSEMENT ||--o{ NIVEAU : "owns"
ETABLISSEMENT ||--o{ CLASSE : "owns"
ETABLISSEMENT ||--o{ MATIERE : "owns"
ETABLISSEMENT ||--o{ EVALUATION : "owns"
ETABLISSEMENT ||--o{ PERIODE : "owns"
ETABLISSEMENT ||--o{ ANNEE_SCOLAIRE : "owns"
ETABLISSEMENT ||--o{ SALLE : "owns"
ETABLISSEMENT ||--o{ ECHOLON_STRUCTUREL : "manages"
ETABLISSEMENT ||--o{ PERSONNEL_TYPE : "defines"
ETABLISSEMENT ||--o{ ORGANIZATIONAL_UNIT : "contains"
ETABLISSEMENT ||--o{ TEMPLATE_POSTE : "manages"
ETABLISSEMENT ||--o{ TRUTH_TABLE : "validates"
ETABLISSEMENT ||--o{ REFERENCE_DATA : "standardizes"
CYCLE ||--o{ NIVEAU : "contains"
NIVEAU ||--o{ CLASSE : "has"
CLASSE ||--o{ EVALUATION : "hosts"
MATIERE ||--o{ EVALUATION : "subject of"
PERIODE ||--o{ PERIODE : "parent-child"
CLASSE ||--|| SALLE : "main room"
ECHOLON_STRUCTUREL ||--o{ ECHOLON_STRUCTUREL : "hierarchical"
ORGANIZATIONAL_UNIT ||--o{ ORGANIZATIONAL_UNIT : "hierarchical"
TEMPLATE_POSTE ||--o| TEMPLATE_POSTE : "optional fonction link"
```

**Diagram sources**
- [050-multi-tenant-v3-max-etablissements.sql](file://backend/database/migrations/050-multi-tenant-v3-max-etablissements.sql)
- [088-refactorisation-architecture-academique.sql](file://backend/database/migrations/088-refactorisation-architecture-academique.sql)
- [089-finalisation-architecture-academique-v2.sql](file://backend/database/migrations/089-finalisation-architecture-academique-v2.sql)
- [091-peuplement-architecture-academique.sql](file://backend/database/migrations/091-peuplement-architecture-academique.sql)
- [092-refactorisation-classeAnneeId.sql](file://backend/database/migrations/092-refactorisation-classeAnneeId.sql)
- [100-classes-salle-principale.sql](file://backend/database/migrations/100-classes-salle-principale.sql)
- [101-normalisation-annee-scolaire-cloture.sql](file://backend/database/migrations/101-normalisation-annee-scolaire-cloture.sql)
- [102-periodes-hierarchie.sql](file://backend/database/migrations/102-periodes-hierarchie.sql)
- [103-templates-periode-personnalisables.sql](file://backend/database/migrations/103-templates-periode-personnalisables.sql)
- [104-refonte-periodes-niveaux-configurables.sql](file://backend/database/migrations/104-refonte-periodes-niveaux-configurables.sql)
- [105-migration-templates-v5.sql](file://backend/database/migrations/105-migration-templates-v5.sql)
- [106-rename-sequence-to-evaluation.sql](file://backend/database/migrations/106-rename-sequence-to-evaluation.sql)
- [112-refonte-organisation-v4.sql](file://backend/database/migrations/112-refonte-organisation-v4.sql)
- [114-drop-categorie-personnel.sql](file://backend/database/migrations/114-drop-categorie-personnel.sql)
- [115-poste-fonction-id-not-null.sql](file://backend/database/migrations/115-poste-fonction-id-not-null.sql)

## Detailed Component Analysis

### Multi-Tenant Isolation and Tenant-Specific Tables
- Tenant boundary enforcement: Most domain tables include etablisement_id as a foreign key referencing the establishment table. This ensures data isolation per tenant.
- Preferences and user settings: User preferences are scoped per tenant to avoid cross-tenant leakage.
- Cleanup and verification: Migrations remove invalid references and add checks to maintain referential integrity.

Key operations:
- Add etablisement_id to core tables and create foreign keys.
- Enforce unique constraints where necessary (e.g., per-tenant uniqueness).
- Validate existing data during migration execution.

**Section sources**
- [050-multi-tenant-v3-max-etablissements.sql](file://backend/database/migrations/050-multi-tenant-v3-max-etablissements.sql)
- [080-preferences-utilisateur-multi-tenant.sql](file://backend/database/migrations/080-preferences-utilisateur-multi-tenant.sql)
- [084-cleanup-classe-id-notes.sql](file://backend/database/migrations/084-cleanup-classe-id-notes.sql)
- [085-periode-etablissement-id.sql](file://backend/database/migrations/085-periode-etablissement-id.sql)
- [086-affectation-matiere-etablissement-id.sql](file://backend/database/migrations/086-affectation-matiere-etablissement-id.sql)
- [087-affectation-matiere-verifications.sql](file://backend/database/migrations/087-affectation-matiere-verifications.sql)

### Academic Architecture Entities
- Cycles, levels, classes: Hierarchical structure defines academic organization. Each entity is tenant-scoped and ordered.
- Subjects (matieres): Defined per tenant with coefficients and activity flags.
- Evaluations: Linked to classes and subjects; include scoring metadata and closure state.

Constraints and integrity:
- Foreign keys from levels to cycles, classes to levels, evaluations to classes and subjects.
- Unique constraints on codes within tenants.
- Activity flags to control availability.

**Section sources**
- [088-refactorisation-architecture-academique.sql](file://backend/database/migrations/088-refactorisation-architecture-academique.sql)
- [089-finalisation-architecture-academique-v2.sql](file://backend/database/migrations/089-finalisation-architecture-academique-v2.sql)
- [091-peuplement-architecture-academique.sql](file://backend/database/migrations/091-peuplement-architecture-academique.sql)
- [092-refactorisation-classeAnneeId.sql](file://backend/database/migrations/092-refactorisation-classeAnneeId.sql)
- [106-rename-sequence-to-evaluation.sql](file://backend/database/migrations/106-rename-sequence-to-evaluation.sql)

### Periods and School Years
- Periods: Hierarchical parent-child relationships allow nested academic periods. Template flag indicates reusable templates.
- School years: Normalized closure status ensures consistent academic calendar management.
- Customizable templates: Per-level configurations enable flexible period definitions.

Validation rules:
- Date ranges must not overlap within the same scope.
- Template periods cannot be directly used without instantiation.

**Section sources**
- [101-normalisation-annee-scolaire-cloture.sql](file://backend/database/migrations/101-normalisation-annee-scolaire-cloture.sql)
- [102-periodes-hierarchie.sql](file://backend/database/migrations/102-periodes-hierarchie.sql)
- [103-templates-periode-personnalisables.sql](file://backend/database/migrations/103-templates-periode-personnalisables.sql)
- [104-refonte-periodes-niveaux-configurables.sql](file://backend/database/migrations/104-refonte-periodes-niveaux-configurables.sql)
- [105-migration-templates-v5.sql](file://backend/database/migrations/105-migration-templates-v5.sql)

### Scheduling and Rooms
- Classes have a main room assignment to standardize scheduling defaults.
- Refactoring ensures consistent naming and constraints for main room fields.

Integrity:
- Foreign key from class to room.
- Validation to prevent assigning non-existent rooms.

**Section sources**
- [100-classes-salle-principale.sql](file://backend/database/migrations/100-classes-salle-principale.sql)
- [108-refactor-salle-principale.sql](file://backend/database/migrations/108-refactor-salle-principale.sql)

### Major Organizational Restructuring - EchelonStructurel Consolidation
**Updated** Migration 112-refonte-organisation-v4.sql represents a significant architectural improvement through the consolidation of redundant entity tables into a unified EchelonStructurel table structure. This 315-line SQL migration eliminates data duplication and establishes cleaner hierarchical relationships throughout the organizational system.

- **Unified Table Structure**: The EchelonStructurel table replaces multiple redundant entity tables, providing a single source of truth for organizational hierarchy management.
- **Hierarchical Relationships**: Enhanced parent-child relationships through echelon_structurel.parent_echelon_id foreign key enable complex organizational chart representations.
- **Data Integrity Improvements**: Consolidation eliminates duplicate entries and ensures consistent organizational data across the system.
- **Performance Optimization**: Reduced table joins and simplified queries through unified structure improve overall database performance.
- **Maintainability Enhancement**: Single table management reduces complexity in application logic and database maintenance operations.

Key benefits:
- Elimination of data redundancy and inconsistency
- Simplified query patterns and improved performance
- Enhanced scalability for complex organizational structures
- Better data integrity through centralized management
- Streamlined application logic and reduced maintenance overhead

**Section sources**
- [112-refonte-organisation-v4.sql](file://backend/database/migrations/112-refonte-organisation-v4.sql)

### Enhanced Personnel Management and Organizational Structure
**Updated** The schema now includes comprehensive personnel management capabilities with hierarchical relationships, organizational unit classifications, and strengthened constraints for improved data integrity. Recent organizational restructuring through EchelonStructurel consolidation further enhances personnel management capabilities.

- **Personnel Types**: Centralized definition of different personnel categories (teachers, administrators, support staff) with descriptive metadata and activity controls.
- **Hierarchical Relationships**: Support for complex reporting structures and organizational charts through parent-child relationships in EchelonStructurel table.
- **Organizational Units**: Flexible departmental and team structures with hierarchical nesting capabilities integrated with unified echelon system.
- **Database-Driven Truth Tables**: Replaced static enum validations with dynamic truth tables for better maintainability and extensibility.
- **Strengthened Constraints**: Recent migrations have removed deprecated personnel categories and enforced NOT NULL constraints on critical fields like poste.fonction_id.
- **TemplatePoste Enhancement**: Optional fonctionId field provides flexibility in position management while maintaining referential integrity.

Key benefits:
- Dynamic validation rules without code changes
- Flexible organizational structures that adapt to institutional needs
- Improved auditability and traceability of personnel assignments
- Enhanced scalability for growing institutions
- **Stronger data integrity through enforced constraints**
- **Improved flexibility with optional functional relationships**
- **Unified organizational hierarchy through EchelonStructurel consolidation**

**Section sources**
- [050-multi-tenant-v3-max-etablissements.sql](file://backend/database/migrations/050-multi-tenant-v3-max-etablissements.sql)
- [088-refactorisation-architecture-academique.sql](file://backend/database/migrations/088-refactorisation-architecture-academique.sql)
- [089-finalisation-architecture-academique-v2.sql](file://backend/database/migrations/089-finalisation-architecture-academique-v2.sql)
- [112-refonte-organisation-v4.sql](file://backend/database/migrations/112-refonte-organisation-v4.sql)
- [114-drop-categorie-personnel.sql](file://backend/database/migrations/114-drop-categorie-personnel.sql)
- [115-poste-fonction-id-not-null.sql](file://backend/database/migrations/115-poste-fonction-id-not-null.sql)

### Reference Data Management with TYPE_ Prefixed Codes
**New** The seeding system has been enhanced with TYPE_ prefixed codes to provide better clarity and consistency across all reference data management, complementing the organizational restructuring efforts.

- **Standardized Coding Convention**: All reference data types now use TYPE_ prefix (e.g., TYPE_TEACHER, TYPE_ADMINISTRATOR, TYPE_SUPPORT_STAFF)
- **Improved Readability**: Clear distinction between different types of reference data
- **Better Organization**: Easier identification and management of reference data categories
- **Enhanced Maintainability**: Consistent naming patterns reduce confusion and errors
- **Scalable Architecture**: Easy addition of new reference data types following established patterns

Benefits:
- Clear visual distinction between different data categories
- Reduced risk of naming conflicts
- Improved code readability and maintainability
- Better integration with frontend display logic
- Enhanced search and filtering capabilities

**Section sources**
- [112-refonte-organisation-v4.sql](file://backend/database/migrations/112-refonte-organisation-v4.sql)

### RBAC and Permissions
- Role-based access control (RBAC) migrations establish roles, permissions, and group mappings.
- Group-based permissions support scalable authorization across tenants.

Operational notes:
- Seed updates ensure baseline permissions exist.
- Migration scripts provide safe upgrades and rollbacks.

**Section sources**
- [migrate-rbac-v3.sql](file://backend/database/migrations/migrate-rbac-v3.sql)
- [PERMISSIONS-GROUPES-SEED-UPDATE.md](file://backend/database/migrations/PERMISSIONS-GROUPES-SEED-UPDATE.md)
- [README-075-GROUPES.md](file://backend/database/migrations/README-075-GROUPES.md)
- [MIGRATION-076-SUCCESS.md](file://backend/database/migrations/MIGRATION-076-SUCCESS.md)

### Monitoring and Configuration Cleanup
- Monitoring parameters added to enhance observability.
- Cleanup of module activation flags ensures consistent configuration states.

**Section sources**
- [099-add-monitoring-params.sql](file://backend/database/migrations/099-add-monitoring-params.sql)
- [107-cleanup-configuration-modules-actif.sql](file://backend/database/migrations/107-cleanup-configuration-modules-actif.sql)

## Dependency Analysis
The database schema dependencies follow a clear hierarchy with the new EchelonStructurel consolidation enhancing organizational relationships:
- Establishment is the root tenant entity.
- Academic entities depend on establishment and each other (cycles → levels → classes).
- Evaluations depend on classes and subjects.
- Periods form a tree structure with parent-child links.
- Rooms are referenced by classes for main room assignment.
- **EchelonStructurel serves as the unified foundation for organizational hierarchies, replacing multiple redundant tables**.
- **Personnel types and organizational units provide foundational reference data for HR operations with strengthened constraints**.
- **Truth tables serve as validation foundations for multiple domains**.
- **TemplatePoste entities have optional functional relationships for flexible position management**.
- **Reference data follows TYPE_ prefixed coding standards for consistency**.

```mermaid
graph TB
ETAB["ETABLISSEMENT"] --> CYC["CYCLE"]
ETAB --> NIV["NIVEAU"]
ETAB --> CLA["CLASSE"]
ETAB --> MAT["MATIERE"]
ETAB --> EVA["EVALUATION"]
ETAB --> PER["PERIODE"]
ETAB --> ANN["ANNEE_SCOLAIRE"]
ETAB --> SAL["SALLE"]
ETAB --> ECHOLON["ECHOLON_STRUCTUREL"]
ETAB --> PTYPE["PERSONNEL_TYPE"]
ETAB --> OUNIT["ORGANIZATIONAL_UNIT"]
ETAB --> TPOSTE["TEMPLATE_POSTE"]
ETAB --> TRUTH["TRUTH_TABLE"]
ETAB --> REFDATA["REFERENCE_DATA"]
CYC --> NIV
NIV --> CLA
CLA --> EVA
MAT --> EVA
PER --> PER
CLA --> SAL
ECHOLON --> ECHOLON
OUNIT --> OUNIT
PTYPE --> PTYPE
TPOSTE --> TPOSTE
REFDATA --> REFDATA
```

**Diagram sources**
- [088-refactorisation-architecture-academique.sql](file://backend/database/migrations/088-refactorisation-architecture-academique.sql)
- [089-finalisation-architecture-academique-v2.sql](file://backend/database/migrations/089-finalisation-architecture-academique-v2.sql)
- [100-classes-salle-principale.sql](file://backend/database/migrations/100-classes-salle-principale.sql)
- [102-periodes-hierarchie.sql](file://backend/database/migrations/102-periodes-hierarchie.sql)
- [112-refonte-organisation-v4.sql](file://backend/database/migrations/112-refonte-organisation-v4.sql)
- [114-drop-categorie-personnel.sql](file://backend/database/migrations/114-drop-categorie-personnel.sql)
- [115-poste-fonction-id-not-null.sql](file://backend/database/migrations/115-poste-fonction-id-not-null.sql)

**Section sources**
- [088-refactorisation-architecture-academique.sql](file://backend/database/migrations/088-refactorisation-architecture-academique.sql)
- [089-finalisation-architecture-academique-v2.sql](file://backend/database/migrations/089-finalisation-architecture-academique-v2.sql)
- [100-classes-salle-principale.sql](file://backend/database/migrations/100-classes-salle-principale.sql)
- [102-periodes-hierarchie.sql](file://backend/database/migrations/102-periodes-hierarchie.sql)
- [112-refonte-organisation-v4.sql](file://backend/database/migrations/112-refonte-organisation-v4.sql)
- [114-drop-categorie-personnel.sql](file://backend/database/migrations/114-drop-categorie-personnel.sql)
- [115-poste-fonction-id-not-null.sql](file://backend/database/migrations/115-poste-fonction-id-not-null.sql)

## Performance Considerations
- Indexes: Ensure foreign keys and frequently filtered columns (e.g., etablisement_id, codes, dates) are indexed. Review migration scripts for index creation and consider composite indexes for common query patterns.
- Query optimization: Use tenant-scoped filters to reduce result sets. Avoid full-table scans by leveraging indexes on etablisement_id and hierarchical IDs.
- Data volume management: Archive closed periods and old evaluations periodically. Normalize recurring structures to minimize duplication.
- **EchelonStructurel optimization**: The unified table structure significantly reduces join complexity and improves query performance compared to multiple redundant tables.
- **Hierarchical queries**: Use recursive CTEs for deep organizational hierarchy traversals and consider materialized views for frequently accessed hierarchy snapshots.
- **Reference data optimization**: TYPE_ prefixed codes enable more efficient filtering and grouping operations on reference data.
- **Personnel constraint optimization**: NOT NULL constraints on critical fields reduce query complexity and improve performance.
- **Consolidation benefits**: The EchelonStructurel consolidation eliminates redundant joins and reduces database load through simplified query patterns.

## Troubleshooting Guide
Common issues and resolutions:
- Referential integrity errors: Verify that all foreign keys reference valid rows. Use cleanup migrations to remove orphaned records.
- Duplicate entries: Apply unique constraints per tenant to prevent duplicates.
- Migration failures: Run pending migrations carefully and review error logs. Use rollback strategies if necessary.
- **EchelonStructurel migration issues**: When applying migration 112-refonte-organisation-v4.sql, ensure proper data migration from redundant tables to the unified structure.
- **Hierarchical relationship issues**: Verify parent-child relationships don't create circular dependencies when modifying organizational structures.
- **Constraint violations**: Ensure all required fields are properly set before applying NOT NULL constraints.
- **Reference data inconsistencies**: Verify TYPE_ prefixed codes are consistently applied across all reference data entries.

Operational steps:
- Inspect migration logs and verify dependency order.
- Validate data before applying destructive changes.
- Use backups before major migrations.
- **Test EchelonStructurel consolidation in development before production deployment**.
- **Verify hierarchical relationships after applying organizational restructuring**.
- **Validate personnel data integrity before applying constraint migrations**.
- **Audit reference data for TYPE_ prefixed code consistency**.

**Section sources**
- [084-cleanup-classe-id-notes.sql](file://backend/database/migrations/084-cleanup-classe-id-notes.sql)
- [087-affectation-matiere-verifications.sql](file://backend/database/migrations/087-affectation-matiere-verifications.sql)
- [run-migration.ts](file://backend/scripts/run-migration.ts)
- [run-pending-migrations.ts](file://backend/scripts/run-pending-migrations.ts)
- [112-refonte-organisation-v4.sql](file://backend/database/migrations/112-refonte-organisation-v4.sql)
- [114-drop-categorie-personnel.sql](file://backend/database/migrations/114-drop-categorie-personnel.sql)
- [115-poste-fonction-id-not-null.sql](file://backend/database/migrations/115-poste-fonction-id-not-null.sql)

## Conclusion
The eLISAschool database schema emphasizes multi-tenant isolation, robust academic architecture, and flexible period management. Strong referential integrity and careful migration practices ensure data consistency and scalability. Monitoring and configuration cleanup further enhance operational reliability.

**Updated** The major organizational restructuring through migration 112-refonte-organisation-v4.sql represents a significant architectural advancement, consolidating redundant entity tables into the unified EchelonStructurel table structure. This 315-line migration eliminates data duplication, improves query performance, and establishes cleaner hierarchical relationships throughout the organizational system. Combined with enhanced personnel management capabilities, strengthened constraints, database-driven validation systems, and TYPE_ prefixed reference data standardization, these changes provide greater flexibility, maintainability, and scalability for complex institutional requirements while ensuring stronger data integrity and cleaner schema design.

## Appendices

### Data Lifecycle Policies and Archival Strategies
- Closed periods and school years should be archived to reduce active dataset size.
- Evaluations marked as closed can be moved to historical tables after retention periods.
- Implement soft deletes for auditability where appropriate.
- **EchelonStructurel history**: Maintain historical records of organizational changes and echelon modifications for audit purposes.
- **Personnel history**: Maintain historical records of personnel assignments and organizational changes for audit purposes.
- **Truth table versions**: Version truth table configurations to track validation rule changes over time.
- **Reference data lifecycle**: Manage TYPE_ prefixed reference data with proper archiving and deprecation policies.
- **Personnel category cleanup**: Regularly audit and clean up unused personnel categories to maintain schema efficiency.

### Backup Procedures
Automated and manual backup processes are provided via Docker scripts. Cron jobs can schedule regular backups. Restore procedures are available for disaster recovery.

```mermaid
flowchart TD
Start(["Backup Process"]) --> CheckCron["Check Cron Schedule"]
CheckCron --> |Scheduled| AutoBackup["Run Automated Backup Script"]
CheckCron --> |Manual| ManualBackup["Run Manual Backup Script"]
AutoBackup --> StoreBackup["Store Backup File"]
ManualBackup --> StoreBackup
StoreBackup --> VerifyBackup["Verify Backup Integrity"]
VerifyBackup --> End(["Backup Complete"])
```

**Diagram sources**
- [backup-auto.sh](file://docker/scripts/backup-auto.sh)
- [backup-manuel.sh](file://docker/scripts/backup-manuel.sh)
- [cron-backup.txt](file://docker/scripts/cron-backup.txt)
- [install-cron.sh](file://docker/scripts/install-cron.sh)

**Section sources**
- [backup-auto.sh](file://docker/scripts/backup-auto.sh)
- [backup-manuel.sh](file://docker/scripts/backup-manuel.sh)
- [restore.sh](file://docker/scripts/restore.sh)
- [cron-backup.txt](file://docker/scripts/cron-backup.txt)
- [install-cron.sh](file://docker/scripts/install-cron.sh)

### Migration Patterns, Version Management, and Rollback Strategies
- Migrations are numbered and executed sequentially. Pending migrations are detected and applied automatically.
- Rollback strategies involve reversing migration effects or restoring from backups.
- Seed data updates ensure baseline configurations and permissions.
- **EchelonStructurel migration considerations**: Migration 112-refonte-organisation-v4.sql requires careful data migration from redundant tables to the unified structure.
- **Database-driven validation migrations**: Include truth table population and validation rule setup in migration sequences.
- **Hierarchical data migrations**: Handle organizational structure initialization and relationship establishment carefully.
- **Reference data migrations**: Apply TYPE_ prefixed code standardization systematically across all reference data entities.

**Section sources**
- [run-migration.ts](file://backend/scripts/run-migration.ts)
- [run-pending-migrations.ts](file://backend/scripts/run-pending-migrations.ts)
- [PERMISSIONS-GROUPES-SEED-UPDATE.md](file://backend/database/migrations/PERMISSIONS-GROUPES-SEED-UPDATE.md)
- [README-075-GROUPES.md](file://backend/database/migrations/README-075-GROUPES.md)
- [MIGRATION-076-SUCCESS.md](file://backend/database/migrations/MIGRATION-076-SUCCESS.md)
- [112-refonte-organisation-v4.sql](file://backend/database/migrations/112-refonte-organisation-v4.sql)
- [114-drop-categorie-personnel.sql](file://backend/database/migrations/114-drop-categorie-personnel.sql)
- [115-poste-fonction-id-not-null.sql](file://backend/database/migrations/115-poste-fonction-id-not-null.sql)

### Seed Data Management and Demo Data Generation
- Seed updates provide baseline permissions and groups.
- Demo data generation should respect tenant boundaries and referential integrity.
- Use migration scripts to apply seed data safely.
- **EchelonStructurel seeds**: Initialize common organizational echelons and hierarchical relationships following the unified table structure.
- **Personnel type seeds**: Initialize common personnel categories and organizational unit templates.
- **Truth table seeds**: Populate essential validation rules and reference data for system functionality.
- **Reference data seeds**: Create TYPE_ prefixed reference data entries following the new coding standard.
- **Personnel constraint seeds**: Ensure all personnel data meets NOT NULL constraints for critical fields like fonction_id.
- **Extensive seed modifications**: Multiple seed data files have been updated to support the new organizational structure and TYPE_ prefixed coding standards.

**Section sources**
- [PERMISSIONS-GROUPES-SEED-UPDATE.md](file://backend/database/migrations/PERMISSIONS-GROUPES-SEED-UPDATE.md)
- [README-075-GROUPES.md](file://backend/database/migrations/README-075-GROUPES.md)
- [112-refonte-organisation-v4.sql](file://backend/database/migrations/112-refonte-organisation-v4.sql)
- [114-drop-categorie-personnel.sql](file://backend/database/migrations/114-drop-categorie-personnel.sql)
- [115-poste-fonction-id-not-null.sql](file://backend/database/migrations/115-poste-fonction-id-not-null.sql)