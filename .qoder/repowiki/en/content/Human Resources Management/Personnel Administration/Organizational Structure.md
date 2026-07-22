# Organizational Structure

<cite>
**Referenced Files in This Document**
- [044-module-organisation.sql](file://backend/database/migrations/044-module-organisation.sql)
- [045-organisation-optimisations.sql](file://backend/database/migrations/045-organisation-optimisations.sql)
- [046-organisation-performance-avancee.sql](file://backend/database/migrations/046-organisation-performance-avancee.sql)
- [109-refonte-organisation.sql](file://backend/database/migrations/109-refonte-organisation.sql)
- [110-consolidation-organisation.sql](file://backend/database/migrations/110-consolidation-organisation.sql)
- [organisation.controller.ts](file://backend/src/modules/organisation/controllers/organisation.controller.ts)
- [organisation.service.ts](file://backend/src/modules/organisation/services/organisation.service.ts)
- [nomenclature.service.ts](file://backend/src/modules/organisation/services/nomenclature.service.ts)
- [rbac.guard.ts](file://backend/src/modules/rbac/guards/rbac.guard.ts)
- [rbac.service.ts](file://backend/src/modules/rbac/services/rbac.service.ts)
- [personnel.constants.ts](file://backend/src/shared/constants/personnel.constants.ts)
</cite>

## Update Summary
**Changes Made**
- Updated architecture overview to reflect consolidation of 'postes' and 'fonctions' modules into unified 'organisation' module
- Added new service architecture with enhanced nomenclature management capabilities
- Updated data model references to include consolidation migrations (109-refonte-organisation.sql, 110-consolidation-organisation.sql)
- Streamlined component analysis to focus on the new unified organisation module structure
- Updated dependency analysis to reflect simplified consolidated architecture
- Enhanced frontend interface documentation for interactive organizational charts

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
This document explains the organizational structure sub-feature for an educational institution following a major architectural refactoring. The system has been consolidated from separate 'postes' and 'fonctions' modules into a unified 'organisation' module with enhanced service architecture, improved nomenclature management, and better frontend integration for interactive organizational charts. It covers how to define organizational units, establish reporting relationships, manage position hierarchies, and link these structures to access control permissions through streamlined APIs and optimized services.

## Project Structure
The organizational structure is now implemented as a unified backend module with consolidated functionality and enhanced service architecture:
- Database schema and indexes are defined in migration files under the database/migrations directory, including the latest consolidation migrations.
- Business logic and API endpoints are organized within the unified organisation module with specialized services.
- Access control integrates with the RBAC module to enforce permissions based on roles and permissions.
- Enhanced nomenclature management provides standardized terminology across the organization.

```mermaid
graph TB
subgraph "Database"
DB["PostgreSQL"]
end
subgraph "Unified Organisation Module"
OrgCtrl["Organisation Controller"]
OrgSvc["Organisation Service"]
NomenclatureSvc["Nomenclature Service"]
RbacGuard["RBAC Guard"]
RbacSvc["RBAC Service"]
end
subgraph "Routing"
Router["Route Registry"]
end
Router --> OrgCtrl
OrgCtrl --> OrgSvc
OrgCtrl --> NomenclatureSvc
OrgSvc --> DB
NomenclatureSvc --> DB
OrgCtrl --> RbacGuard
RbacGuard --> RbacSvc
```

**Diagram sources**
- [organisation.controller.ts](file://backend/src/modules/organisation/controllers/organisation.controller.ts)
- [organisation.service.ts](file://backend/src/modules/organisation/services/organisation.service.ts)
- [nomenclature.service.ts](file://backend/src/modules/organisation/services/nomenclature.service.ts)
- [rbac.guard.ts](file://backend/src/modules/rbac/guards/rbac.guard.ts)
- [rbac.service.ts](file://backend/src/modules/rbac/services/rbac.service.ts)

**Section sources**
- [044-module-organisation.sql](file://backend/database/migrations/044-module-organisation.sql)
- [045-organisation-optimisations.sql](file://backend/database/migrations/045-organisation-optimisations.sql)
- [046-organisation-performance-avancee.sql](file://backend/database/migrations/046-organisation-performance-avancee.sql)
- [109-refonte-organisation.sql](file://backend/database/migrations/109-refonte-organisation.sql)
- [110-consolidation-organisation.sql](file://backend/database/migrations/110-consolidation-organisation.sql)

## Core Components
- Unified function and position management: Consolidated job functions and positions within the organisation module through streamlined controllers and services.
- Enhanced nomenclature management: Standardized terminology and definitions across organizational units with centralized management.
- Interactive organizational charts: Build department trees and position hierarchies with real-time visualization capabilities.
- Advanced reporting and analytics: Generate comprehensive organizational reports with performance optimizations.
- Access control integration: Restrict operations based on RBAC roles and permissions with enhanced guard mechanisms.

Key implementation references:
- Unified organisation management: [organisation.controller.ts](file://backend/src/modules/organisation/controllers/organisation.controller.ts), [organisation.service.ts](file://backend/src/modules/organisation/services/organisation.service.ts)
- Nomenclature management: [nomenclature.service.ts](file://backend/src/modules/organisation/services/nomenclature.service.ts)
- RBAC enforcement: [rbac.guard.ts](file://backend/src/modules/rbac/guards/rbac.guard.ts), [rbac.service.ts](file://backend/src/modules/rbac/services/rbac.service.ts)
- Shared constants for personnel-related enums: [personnel.constants.ts](file://backend/src/shared/constants/personnel.constants.ts)

**Section sources**
- [organisation.controller.ts](file://backend/src/modules/organisation/controllers/organisation.controller.ts)
- [organisation.service.ts](file://backend/src/modules/organisation/services/organisation.service.ts)
- [nomenclature.service.ts](file://backend/src/modules/organisation/services/nomenclature.service.ts)
- [rbac.guard.ts](file://backend/src/modules/rbac/guards/rbac.guard.ts)
- [rbac.service.ts](file://backend/src/modules/rbac/services/rbac.service.ts)
- [personnel.constants.ts](file://backend/src/shared/constants/personnel.constants.ts)

## Architecture Overview
The system follows a streamlined unified architecture after major refactoring with consolidated modules:
- Controllers handle HTTP requests with consolidated functionality and simplified routing patterns.
- Services encapsulate business logic with optimized data access patterns and enhanced nomenclature support.
- Database migrations define entities and relationships with enhanced performance and data integrity.
- RBAC guard intercepts requests to enforce permissions with improved efficiency and scoping.

```mermaid
sequenceDiagram
participant Client as "Client"
participant Router as "Route Registry"
participant Ctrl as "Organisation Controller"
participant Guard as "RBAC Guard"
participant Svc as "Organisation Service"
param Svc as "Nomenclature Service"
participant DB as "Database"
Client->>Router : "HTTP request"
Router->>Ctrl : "Dispatch endpoint"
Ctrl->>Guard : "Check permission"
Guard-->>Ctrl : "Allow/Deny"
Ctrl->>Svc : "Invoke business logic"
Ctrl->>param Svc : "Access nomenclature"
Svc->>DB : "Query/Update"
param Svc->>DB : "Manage terminology"
DB-->>Svc : "Data"
DB-->>param Svc : "Terminology"
Svc-->>Ctrl : "Result"
param Svc-->>Ctrl : "Nomenclature data"
Ctrl-->>Client : "Response"
```

**Diagram sources**
- [rbac.guard.ts](file://backend/src/modules/rbac/guards/rbac.guard.ts)
- [rbac.service.ts](file://backend/src/modules/rbac/services/rbac.service.ts)
- [organisation.controller.ts](file://backend/src/modules/organisation/controllers/organisation.controller.ts)
- [organisation.service.ts](file://backend/src/modules/organisation/services/organisation.service.ts)
- [nomenclature.service.ts](file://backend/src/modules/organisation/services/nomenclature.service.ts)

## Detailed Component Analysis

### Unified Organisation Management
- Purpose: Consolidates former 'postes' and 'fonctions' functionality into a single cohesive module through streamlined controllers and services.
- Key operations:
  - Create/update/delete organizational units via optimized endpoints.
  - Manage position hierarchies and reporting relationships through consolidated services.
  - Handle function-to-position associations with enhanced validation.
  - Query organizational structures with improved performance.
- Example workflows:
  - Creating a complete organizational unit with associated positions and functions.
  - Managing complex reporting chains with cycle detection.
  - Reassigning staff across departments efficiently.

```mermaid
classDiagram
class OrganisationUnit {
+id
+code
+label
+description
+parentId
+isActive
}
class Position {
+id
+code
+title
+functionId
+reportToPositionId
+isActive
}
class Function {
+id
+code
+label
+description
+isActive
}
OrganisationUnit <|--o Position : "contains"
Function <|--o{ Position : "assigned via functionId"
```

**Diagram sources**
- [organisation.controller.ts](file://backend/src/modules/organisation/controllers/organisation.controller.ts)
- [organisation.service.ts](file://backend/src/modules/organisation/services/organisation.service.ts)

**Section sources**
- [organisation.controller.ts](file://backend/src/modules/organisation/controllers/organisation.controller.ts)
- [organisation.service.ts](file://backend/src/modules/organisation/services/organisation.service.ts)

### Enhanced Nomenclature Management
- Purpose: Provides centralized management of organizational terminology and standardized definitions across all modules.
- Key operations:
  - Define and manage standardized terms for positions, departments, and functions.
  - Support multilingual terminology with automatic translation management.
  - Enforce consistency across organizational units and positions.
  - Provide autocomplete and validation for standardized terms.
- Example workflows:
  - Creating standardized position titles across multiple departments.
  - Managing department naming conventions and abbreviations.
  - Ensuring consistent terminology in reports and communications.

```mermaid
flowchart TD
A["Define Term"] --> B["Add Translations"]
B --> C["Validate Consistency"]
C --> D["Apply Across Organization"]
D --> E["Monitor Usage"]
E --> F["Update as Needed"]
F --> C
```

[No sources needed since this diagram shows conceptual workflow, not actual code structure]

**Section sources**
- [nomenclature.service.ts](file://backend/src/modules/organisation/services/nomenclature.service.ts)

### Interactive Organizational Charts
- Capabilities:
  - Build dynamic department trees using parent-child relationships through optimized services.
  - Create position hierarchies with real-time reporting line updates.
  - Generate interactive visualizations with drag-and-drop reorganization.
  - Export organizational structures in multiple formats (PDF, PNG, SVG).
- Typical outputs:
  - Real-time hierarchical views with expandable nodes.
  - Annotated charts showing staff assignments and vacancies.
  - Comparative views for organizational restructuring planning.

```mermaid
flowchart TD
A["Load Organization Data"] --> B["Build Department Tree"]
C["Load Position Hierarchy"] --> D["Create Reporting Chains"]
E["Fetch Staff Assignments"] --> F["Generate Visual Elements"]
B --> G["Render Interactive Chart"]
D --> G
F --> G
G --> H["Support Drag & Drop"]
G --> I["Enable Zoom & Pan"]
G --> J["Export Multiple Formats"]
```

[No sources needed since this diagram shows conceptual workflow, not actual code structure]

### Access Control Integration
- Enforcement points:
  - RBAC guard validates permissions before controller actions execute with improved efficiency.
  - Permissions may be scoped by establishment context and organizational unit.
  - Role-based visibility affects which organizational structures are accessible.
- Practical implications:
  - Only authorized users can create/edit organizational units and positions.
  - Hierarchical permissions allow managers to access subordinate units.
  - Audit trails track all organizational changes with user attribution.

```mermaid
sequenceDiagram
participant User as "User"
participant Guard as "RBAC Guard"
param Svc as "Nomenclature Service"
participant Svc as "Organisation Service"
User->>Guard : "Request with token"
Guard->>Guard : "Resolve role/permissions"
alt Allowed
Guard->>Svc : "Call organisation method"
Guard->>param Svc : "Access nomenclature"
Svc-->>User : "Authorized response"
param Svc-->>User : "Terminology data"
else Denied
Guard-->>User : "403 Forbidden"
end
```

**Diagram sources**
- [rbac.guard.ts](file://backend/src/modules/rbac/guards/rbac.guard.ts)
- [rbac.service.ts](file://backend/src/modules/rbac/services/rbac.service.ts)
- [organisation.service.ts](file://backend/src/modules/organisation/services/organisation.service.ts)
- [nomenclature.service.ts](file://backend/src/modules/organisation/services/nomenclature.service.ts)

**Section sources**
- [rbac.guard.ts](file://backend/src/modules/rbac/guards/rbac.guard.ts)
- [rbac.service.ts](file://backend/src/modules/rbac/services/rbac.service.ts)
- [organisation.service.ts](file://backend/src/modules/organisation/services/organisation.service.ts)
- [nomenclature.service.ts](file://backend/src/modules/organisation/services/nomenclature.service.ts)

## Dependency Analysis
- Module coupling:
  - Unified controller depends on specialized services for business logic with simplified dependencies.
  - Services depend on database entities and indexes with optimized queries.
  - RBAC guard depends on RBAC service for permission checks with enhanced performance.
  - Nomenclature service provides shared terminology across organisational components.
- External dependencies:
  - PostgreSQL for persistence with enhanced indexing strategies.
  - Central route registry for endpoint registration.
  - Frontend charting libraries for interactive visualizations.

```mermaid
graph LR
Route["Route Registry"] --> OrgCtrl["Organisation Controller"]
OrgCtrl --> OrgSvc["Organisation Service"]
OrgCtrl --> NomenclatureSvc["Nomenclature Service"]
OrgSvc --> DB["PostgreSQL"]
NomenclatureSvc --> DB
OrgCtrl --> RbacGuard["RBAC Guard"]
RbacGuard --> RbacSvc["RBAC Service"]
```

**Diagram sources**
- [organisation.controller.ts](file://backend/src/modules/organisation/controllers/organisation.controller.ts)
- [organisation.service.ts](file://backend/src/modules/organisation/services/organisation.service.ts)
- [nomenclature.service.ts](file://backend/src/modules/organisation/services/nomenclature.service.ts)
- [rbac.guard.ts](file://backend/src/modules/rbac/guards/rbac.guard.ts)
- [rbac.service.ts](file://backend/src/modules/rbac/services/rbac.service.ts)

**Section sources**
- [044-module-organisation.sql](file://backend/database/migrations/044-module-organisation.sql)
- [045-organisation-optimisations.sql](file://backend/database/migrations/045-organisation-optimisations.sql)
- [046-organisation-performance-avancee.sql](file://backend/database/migrations/046-organisation-performance-avancee.sql)
- [109-refonte-organisation.sql](file://backend/database/migrations/109-refonte-organisation.sql)
- [110-consolidation-organisation.sql](file://backend/database/migrations/110-consolidation-organisation.sql)

## Performance Considerations
- Index usage:
  - Ensure indexes exist on foreign keys and frequently queried columns (e.g., parent_id, function_id, report_to_position_id).
  - Leverage composite indexes for common filter combinations with optimized query patterns.
  - Utilize full-text search indexes for nomenclature lookups.
- Query patterns:
  - Use recursive or iterative approaches carefully for deep hierarchies through streamlined services.
  - Implement pagination for large organizational structures and avoid loading entire trees when unnecessary.
  - Cache frequently accessed nomenclature data to reduce database load.
- Caching:
  - Cache static configuration like functions, positions, and active organizational units where appropriate.
  - Implement cache invalidation strategies for real-time organizational updates.
- Concurrency:
  - Apply optimistic concurrency controls for critical updates (e.g., reassignments, structural changes) with enhanced validation.
  - Use database transactions for complex multi-step organizational modifications.

## Troubleshooting Guide
Common issues and resolutions:
- Permission denied errors:
  - Verify user roles and permissions via RBAC guard/service with improved error handling.
  - Confirm establishment scoping aligns with the requested organizational resource.
- Circular reporting:
  - Prevent cycles in reporting relationships during assignment validation with enhanced checks.
  - Validate hierarchical integrity when creating or modifying organizational structures.
- Duplicate codes/names:
  - Enforce uniqueness constraints at the database level and validate in services.
  - Check nomenclature conflicts when standardizing terminology.
- Performance regressions:
  - Check missing indexes and heavy queries; add targeted indexes with monitoring.
  - Monitor nomenclature lookup performance and optimize caching strategies.
- Data integrity:
  - Validate referential integrity when deleting organizational units or positions with children.
  - Ensure nomenclature consistency across all organizational references.
- Migration issues:
  - Verify successful execution of consolidation migrations (109-refonte-organisation.sql, 110-consolidation-organisation.sql).
  - Check data integrity after module consolidation and resolve any orphaned records.

**Section sources**
- [rbac.guard.ts](file://backend/src/modules/rbac/guards/rbac.guard.ts)
- [rbac.service.ts](file://backend/src/modules/rbac/services/rbac.service.ts)
- [organisation.service.ts](file://backend/src/modules/organisation/services/organisation.service.ts)
- [nomenclature.service.ts](file://backend/src/modules/organisation/services/nomenclature.service.ts)
- [044-module-organisation.sql](file://backend/database/migrations/044-module-organisation.sql)
- [045-organisation-optimisations.sql](file://backend/database/migrations/045-organisation-optimisations.sql)
- [046-organisation-performance-avancee.sql](file://backend/database/migrations/046-organisation-performance-avancee.sql)
- [109-refonte-organisation.sql](file://backend/database/migrations/109-refonte-organisation.sql)
- [110-consolidation-organisation.sql](file://backend/database/migrations/110-consolidation-organisation.sql)

## Conclusion
The organizational structure sub-feature provides a robust foundation for modeling functions and positions with clear reporting lines and strong access control. Following the major architectural refactoring that consolidated separate modules into a unified organisation module with enhanced service architecture, institutions can maintain accurate organizational charts, manage changes efficiently, and ensure secure, role-based access to sensitive HR data through streamlined interfaces with improved nomenclature management and interactive visualization capabilities.

## Appendices

### Practical Examples

- Creating an organizational chart:
  - Define top-level departments using the unified organisation module.
  - Add sub-departments by setting parent relationships through consolidated controllers.
  - Build position hierarchies by assigning reporting managers with enhanced validation.
  - Combine both views to produce comprehensive org charts via optimized endpoints.

- Assigning staff to positions:
  - Select a valid position linked to a standardized function.
  - Validate availability and conflicts before assignment through enhanced services.
  - Record the assignment and update reporting lines as needed.
  - Ensure nomenclature consistency across all related entries.

- Defining function responsibilities:
  - Create functions with descriptive labels and descriptions using standardized terminology.
  - Link functions to relevant positions through streamlined APIs.
  - Periodically review and update functions to reflect evolving roles while maintaining consistency.

- Managing departmental structures:
  - Re-parent departments to reflect restructuring with proper validation.
  - Archive inactive units rather than deleting to preserve historical data.
  - Use aggregated reports to monitor staffing ratios and coverage across the organization.

- Handling organizational changes:
  - Plan reassignments with change windows and proper notification systems.
  - Audit trails should capture who made changes and when with detailed context.
  - Communicate updates through notifications or dashboards with impact assessments.
  - Leverage interactive charts to visualize proposed changes before implementation.

- Managing organizational terminology:
  - Establish standardized position titles and department names through nomenclature management.
  - Maintain multilingual support for international educational institutions.
  - Enforce consistency across all organizational documents and communications.
  - Track terminology usage and identify outdated or conflicting terms.