# Backend Architecture

<cite>
**Referenced Files in This Document**
- [package.json](file://backend/package.json)
- [app.ts](file://backend/src/app.ts)
- [index.ts](file://backend/src/index.ts)
- [database.config.ts](file://backend/src/config/database.config.ts)
- [env.config.ts](file://backend/src/config/env.config.ts)
- [swagger.config.ts](file://backend/src/config/swagger.config.ts)
- [data-source.ts](file://backend/src/database/data-source.ts)
- [route-registry.ts](file://backend/src/routes/route-registry.ts)
- [eleves.module.ts](file://backend/src/modules/eleves/eleves.module.ts)
- [eleves.controller.ts](file://backend/src/modules/eleves/controllers/eleves.controller.ts)
- [eleves.service.ts](file://backend/src/modules/eleves/services/eleves.service.ts)
- [eleves.entity.ts](file://backend/src/modules/eleves/entities/eleves.entity.ts)
- [finances.module.ts](file://backend/src/modules/finances/finances.module.ts)
- [finances.controller.ts](file://backend/src/modules/finances/controllers/finances.controller.ts)
- [finances.service.ts](file://backend/src/modules/finances/services/finances.service.ts)
- [personnel.module.ts](file://backend/src/modules/personnel/personnel.module.ts)
- [personnel.controller.ts](file://backend/src/modules/personnel/controllers/personnel.controller.ts)
- [personnel.service.ts](file://backend/src/modules/personnel/services/personnel.service.ts)
- [organisation.module.ts](file://backend/src/modules/organisation/organisation.module.ts)
- [organisation.controller.ts](file://backend/src/modules/organisation/controllers/organisation.controller.ts)
- [organisation.service.ts](file://backend/src/modules/organisation/services/organisation.service.ts)
- [specialized-nomenclature.service.ts](file://backend/src/modules/organisation/services/specialized-nomenclature.service.ts)
- [auth.guard.ts](file://backend/src/common/guards/auth.guard.ts)
- [roles.guard.ts](file://backend/src/common/guards/roles.guard.ts)
- [logging.interceptor.ts](file://backend/src/common/interceptors/logging.interceptor.ts)
- [exception.filter.ts](file://backend/src/common/filters/exception.filter.ts)
- [tenant.middleware.ts](file://backend/src/common/middlewares/tenant.middleware.ts)
- [pagination.util.ts](file://backend/src/common/utils/pagination.util.ts)
- [audit.service.ts](file://backend/src/common/services/audit.service.ts)
- [110-consolidation-organisation.sql](file://backend/database/migrations/110-consolidation-organisation.sql)
</cite>

## Update Summary
**Changes Made**
- Updated architecture overview to reflect distributed configuration management pattern
- Enhanced controller layer documentation showing delegation to specialized services
- Added new section on responsibility boundaries between API and business logic layers
- Updated module patterns to emphasize cleaner interfaces and improved maintainability
- Revised service layer examples to demonstrate specialized service delegation patterns

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Distributed Configuration Management Pattern](#distributed-configuration-management-pattern)
6. [Controller Layer Delegation Architecture](#controller-layer-delegation-architecture)
7. [Detailed Component Analysis](#detailed-component-analysis)
8. [Dependency Analysis](#dependency-analysis)
9. [Performance Considerations](#performance-considerations)
10. [Troubleshooting Guide](#troubleshooting-guide)
11. [Conclusion](#conclusion)
12. [Appendices](#appendices)

## Introduction
This document explains the backend architecture built with NestJS for eLISAschool, focusing on the recent architectural evolution toward distributed configuration management and enhanced controller delegation patterns. The modular architecture pattern implements each business domain (eleves, personnel, finances, organisation) as an independent module with clear separation of concerns. The system has been significantly enhanced with a distributed configuration management approach where controllers delegate operations to specialized services, establishing cleaner interfaces between the API layer and business logic layer. This evolution improves maintainability through clear responsibility boundaries and better separation of concerns. The architecture includes Controllers, Services, Repositories, and Entities in a layered design, along with common infrastructure components such as guards, interceptors, middlewares, and utilities. It covers dependency injection patterns, event-driven communication between modules, and the enhanced configuration management system.

## Project Structure
The backend follows a feature-based organization under src/modules, with shared infrastructure under src/common and configuration under src/config. The application bootstrap wires up global middleware, guards, interceptors, filters, and Swagger documentation. Each module encapsulates its own controllers, services, entities, DTOs, and tests. Recent enhancements include the implementation of distributed configuration management patterns and controller layer adaptations that delegate operations to specialized services, establishing cleaner interfaces between API and business logic layers.

```mermaid
graph TB
subgraph "Bootstrap"
A["src/index.ts"] --> B["src/app.ts"]
end
subgraph "Configuration Management"
C["src/config/database.config.ts"]
D["src/config/env.config.ts"]
E["src/config/swagger.config.ts"]
F["Distributed Config Pattern"]
end
subgraph "Database"
G["src/database/data-source.ts"]
H["migrations/110-consolidation-organisation.sql"]
end
subgraph "Enhanced Modules"
M1["modules/eleves/*"]
M2["modules/personnel/*"]
M3["modules/finances/*"]
M4["modules/organisation/*"]
end
subgraph "Common Infrastructure"
I["common/guards/*"]
J["common/interceptors/*"]
K["common/middlewares/*"]
L["common/filters/*"]
M["common/utils/*"]
N["common/services/*"]
end
A --> B
B --> C
B --> D
B --> E
B --> F
B --> G
B --> H
B --> M1
B --> M2
B --> M3
B --> M4
B --> I
B --> J
B --> K
B --> L
B --> M
B --> N
```

**Diagram sources**
- [index.ts:1-200](file://backend/src/index.ts#L1-L200)
- [app.ts:1-200](file://backend/src/app.ts#L1-L200)
- [database.config.ts:1-200](file://backend/src/config/database.config.ts#L1-L200)
- [env.config.ts:1-200](file://backend/src/config/env.config.ts#L1-L200)
- [swagger.config.ts:1-200](file://backend/src/config/swagger.config.ts#L1-L200)
- [data-source.ts:1-200](file://backend/src/database/data-source.ts#L1-L200)
- [110-consolidation-organisation.sql:1-200](file://backend/database/migrations/110-consolidation-organisation.sql#L1-L200)
- [eleves.module.ts:1-200](file://backend/src/modules/eleves/eleves.module.ts#L1-L200)
- [personnel.module.ts:1-200](file://backend/src/modules/personnel/personnel.module.ts#L1-L200)
- [finances.module.ts:1-200](file://backend/src/modules/finances/finances.module.ts#L1-L200)
- [organisation.module.ts:1-200](file://backend/src/modules/organisation/organisation.module.ts#L1-L200)
- [auth.guard.ts:1-200](file://backend/src/common/guards/auth.guard.ts#L1-L200)
- [logging.interceptor.ts:1-200](file://backend/src/common/interceptors/logging.interceptor.ts#L1-L200)
- [tenant.middleware.ts:1-200](file://backend/src/common/middlewares/tenant.middleware.ts#L1-L200)
- [exception.filter.ts:1-200](file://backend/src/common/filters/exception.filter.ts#L1-L200)
- [pagination.util.ts:1-200](file://backend/src/common/utils/pagination.util.ts#L1-L200)
- [audit.service.ts:1-200](file://backend/src/common/services/audit.service.ts#L1-L200)

**Section sources**
- [index.ts:1-200](file://backend/src/index.ts#L1-L200)
- [app.ts:1-200](file://backend/src/app.ts#L1-L200)
- [database.config.ts:1-200](file://backend/src/config/database.config.ts#L1-L200)
- [env.config.ts:1-200](file://backend/src/config/env.config.ts#L1-L200)
- [swagger.config.ts:1-200](file://backend/src/config/swagger.config.ts#L1-L200)
- [data-source.ts:1-200](file://backend/src/database/data-source.ts#L1-L200)

## Core Components
- **Modules**: Feature boundaries that group related controllers, services, entities, DTOs, and providers. Examples include eleves, personnel, finances, and the enhanced organisation module with specialized services implementing distributed configuration patterns.
- **Controllers**: HTTP endpoints that handle request/response mapping and delegate to specialized services. Controllers now establish cleaner interfaces by delegating complex operations to dedicated business logic services.
- **Services**: Business logic layer orchestrating operations, calling repositories or TypeORM entities, and emitting events when needed. Specialized services now implement distributed configuration management patterns for better maintainability.
- **Entities**: Data models mapped to database tables via TypeORM with enhanced relational schema design.
- **Common Infrastructure**: Guards for authorization, interceptors for cross-cutting behavior, middlewares for tenant scoping, filters for exception handling, and utilities for pagination and helpers.

Key responsibilities:
- **Dependency Injection**: Nest's DI container wires modules, controllers, and services with enhanced specialization patterns supporting distributed configuration.
- **Event Bus**: Modules communicate asynchronously using Nest's EventEmitter or custom event bus with improved configuration event handling.
- **Configuration Management**: Centralized environment and database configuration with distributed patterns and enhanced migration support.

**Section sources**
- [eleves.module.ts:1-200](file://backend/src/modules/eleves/eleves.module.ts#L1-L200)
- [eleves.controller.ts:1-200](file://backend/src/modules/eleves/controllers/eleves.controller.ts#L1-L200)
- [eleves.service.ts:1-200](file://backend/src/modules/eleves/services/eleves.service.ts#L1-L200)
- [eleves.entity.ts:1-200](file://backend/src/modules/eleves/entities/eleves.entity.ts#L1-L200)
- [personnel.module.ts:1-200](file://backend/src/modules/personnel/personnel.module.ts#L1-L200)
- [personnel.controller.ts:1-200](file://backend/src/modules/personnel/controllers/personnel.controller.ts#L1-L200)
- [personnel.service.ts:1-200](file://backend/src/modules/personnel/services/personnel.service.ts#L1-L200)
- [finances.module.ts:1-200](file://backend/src/modules/finances/finances.module.ts#L1-L200)
- [finances.controller.ts:1-200](file://backend/src/modules/finances/controllers/finances.controller.ts#L1-L200)
- [finances.service.ts:1-200](file://backend/src/modules/finances/services/finances.service.ts#L1-L200)
- [organisation.module.ts:1-200](file://backend/src/modules/organisation/organisation.module.ts#L1-L200)
- [organisation.controller.ts:1-200](file://backend/src/modules/organisation/controllers/organisation.controller.ts#L1-L200)
- [organisation.service.ts:1-200](file://backend/src/modules/organisation/services/organisation.service.ts#L1-L200)
- [specialized-nomenclature.service.ts:1-200](file://backend/src/modules/organisation/services/specialized-nomenclature.service.ts#L1-L200)
- [auth.guard.ts:1-200](file://backend/src/common/guards/auth.guard.ts#L1-L200)
- [roles.guard.ts:1-200](file://backend/src/common/guards/roles.guard.ts#L1-L200)
- [logging.interceptor.ts:1-200](file://backend/src/common/interceptors/logging.interceptor.ts#L1-L200)
- [exception.filter.ts:1-200](file://backend/src/common/filters/exception.filter.ts#L1-L200)
- [tenant.middleware.ts:1-200](file://backend/src/common/middlewares/tenant.middleware.ts#L1-L200)
- [pagination.util.ts:1-200](file://backend/src/common/utils/pagination.util.ts#L1-L200)
- [audit.service.ts:1-200](file://backend/src/common/services/audit.service.ts#L1-L200)

## Architecture Overview
The system uses a layered approach within each module with enhanced distributed configuration management and controller delegation patterns:
- **Presentation Layer**: Controllers expose REST endpoints with improved organization and clear delegation to specialized services.
- **Application Layer**: Services implement use cases and orchestrate flows with distributed configuration management and specialized service delegation.
- **Domain/Data Layer**: Entities represent persistent data with enhanced relational schema design and proper foreign key relationships.
- **Cross-Cutting Concerns**: Middlewares (tenant context), Guards (authentication/authorization), Interceptors (logging, timing), Filters (global error handling).

```mermaid
classDiagram
class OrganisationModule {
+configure()
+providers
+controllers
+imports
}
class OrganisationController {
+getOrganisation()
+updateOrganisation()
+getNomenclatures()
+manageCategories()
+delegateToSpecializedServices()
}
class OrganisationService {
+findAll()
+findOne()
+create()
+update()
+remove()
+emitEvents()
+manageDistributedConfig()
}
class SpecializedNomenclatureService {
+getCategorie()
+getSousCategorie()
+getSpecialite()
+getCompetence()
+handleConfigDelegation()
}
class DistributedConfigManager {
+distributeConfig()
+validateConfig()
+syncConfig()
}
class OrganisationEntity {
+id
+nom
+sigle
+adresse
+createdAt
+updatedAt
}
OrganisationModule --> OrganisationController : "registers"
OrganisationModule --> OrganisationService : "provides"
OrganisationModule --> SpecializedNomenclatureService : "provides"
OrganisationModule --> DistributedConfigManager : "provides"
OrganisationController --> OrganisationService : "delegates"
OrganisationController --> SpecializedNomenclatureService : "delegates"
OrganisationController --> DistributedConfigManager : "delegates"
OrganisationService --> OrganisationEntity : "persists"
SpecializedNomenclatureService --> OrganisationEntity : "queries"
DistributedConfigManager --> OrganisationService : "coordinates"
```

**Diagram sources**
- [organisation.module.ts:1-200](file://backend/src/modules/organisation/organisation.module.ts#L1-L200)
- [organisation.controller.ts:1-200](file://backend/src/modules/organisation/controllers/organisation.controller.ts#L1-L200)
- [organisation.service.ts:1-200](file://backend/src/modules/organisation/services/organisation.service.ts#L1-L200)
- [specialized-nomenclature.service.ts:1-200](file://backend/src/modules/organisation/services/specialized-nomenclature.service.ts#L1-L200)
- [organisation.entity.ts:1-200](file://backend/src/modules/organisation/entities/organisation.entity.ts#L1-L200)

## Distributed Configuration Management Pattern
**New** The system has evolved to implement a distributed configuration management pattern that enhances maintainability and scalability across modules.

### Pattern Overview
- **Decentralized Configuration**: Each module manages its own configuration while maintaining consistency through shared patterns.
- **Service Delegation**: Controllers delegate configuration operations to specialized services for better separation of concerns.
- **Consistency Enforcement**: Shared validation and synchronization mechanisms ensure configuration integrity.
- **Scalability Support**: Pattern supports horizontal scaling and microservices architecture.

### Implementation Strategy
- **Configuration Services**: Dedicated services handle configuration distribution and synchronization.
- **Validation Layers**: Multiple validation points ensure data integrity across distributed systems.
- **Event-Driven Updates**: Configuration changes propagate through event buses for real-time updates.
- **Fallback Mechanisms**: Graceful degradation when configuration services are unavailable.

```mermaid
flowchart TD
Client["Client Request"] --> Controller["Controller Layer"]
Controller --> ConfigService["Distributed Config Service"]
ConfigService --> Validation["Configuration Validator"]
Validation --> Distribution["Distribution Engine"]
Distribution --> ModuleA["Module A Config"]
Distribution --> ModuleB["Module B Config"]
Distribution --> ModuleC["Module C Config"]
ModuleA --> Event["Event Bus"]
ModuleB --> Event
ModuleC --> Event
Event --> Sync["Sync Coordinator"]
Sync --> Consistency["Consistency Check"]
Consistency --> Response["Response to Client"]
```

**Diagram sources**
- [organisation.controller.ts:1-200](file://backend/src/modules/organisation/controllers/organisation.controller.ts#L1-L200)
- [organisation.service.ts:1-200](file://backend/src/modules/organisation/services/organisation.service.ts#L1-L200)
- [specialized-nomenclature.service.ts:1-200](file://backend/src/modules/organisation/services/specialized-nomenclature.service.ts#L1-L200)

**Section sources**
- [organisation.controller.ts:1-200](file://backend/src/modules/organisation/controllers/organisation.controller.ts#L1-L200)
- [organisation.service.ts:1-200](file://backend/src/modules/organisation/services/organisation.service.ts#L1-L200)
- [specialized-nomenclature.service.ts:1-200](file://backend/src/modules/organisation/services/specialized-nomenclature.service.ts#L1-L200)

## Controller Layer Delegation Architecture
**New** The controller layer has been adapted to establish cleaner interfaces between API layer and business logic layer through strategic delegation to specialized services.

### Delegation Strategy
- **Thin Controllers**: Controllers focus on HTTP concerns (validation, response formatting) while delegating business logic.
- **Specialized Services**: Complex operations are delegated to domain-specific services for better maintainability.
- **Interface Clarity**: Clear method signatures define explicit contracts between controllers and services.
- **Error Handling**: Delegated services provide consistent error handling and response patterns.

### Responsibility Boundaries
- **API Layer**: Handles request parsing, validation, authentication, and response formatting.
- **Business Logic Layer**: Contains domain rules, calculations, and coordination of operations.
- **Data Access Layer**: Manages persistence operations and data transformations.
- **Configuration Layer**: Handles distributed configuration management and synchronization.

```mermaid
sequenceDiagram
participant Client as "Client"
participant Controller as "OrganisationController"
participant ConfigService as "DistributedConfigService"
participant NomenclatureSvc as "SpecializedNomenclatureService"
participant EventBus as "EventBus"
participant DB as "Database"
Client->>Controller : "POST /organisation/config"
Controller->>Controller : "Validate & Parse Request"
Controller->>ConfigService : "delegatemanageConfig(payload)"
ConfigService->>ConfigService : "Apply Business Rules"
ConfigService->>NomenclatureSvc : "coordinateWithSpecializedService()"
NomenclatureSvc->>DB : "Update Configuration"
DB-->>NomenclatureSvc : "Success"
NomenclatureSvc->>EventBus : "emit 'config.updated'"
EventBus-->>NomenclatureSvc : "ack"
NomenclatureSvc-->>ConfigService : "Result"
ConfigService-->>Controller : "Processed Result"
Controller-->>Client : "200 OK + Response"
```

**Diagram sources**
- [organisation.controller.ts:1-200](file://backend/src/modules/organisation/controllers/organisation.controller.ts#L1-L200)
- [organisation.service.ts:1-200](file://backend/src/modules/organisation/services/organisation.service.ts#L1-L200)
- [specialized-nomenclature.service.ts:1-200](file://backend/src/modules/organisation/services/specialized-nomenclature.service.ts#L1-L200)

**Section sources**
- [organisation.controller.ts:1-200](file://backend/src/modules/organisation/controllers/organisation.controller.ts#L1-L200)
- [organisation.service.ts:1-200](file://backend/src/modules/organisation/services/organisation.service.ts#L1-L200)
- [specialized-nomenclature.service.ts:1-200](file://backend/src/modules/organisation/services/specialized-nomenclature.service.ts#L1-L200)

## Detailed Component Analysis

### Module Pattern: Organisation (Enhanced with Distributed Configuration)
**Updated** The organisation module has been significantly restructured with distributed configuration management patterns and enhanced controller delegation for better separation of concerns.

- **Module registration**: Declares controllers, specialized services, and distributed configuration managers with enhanced separation of concerns.
- **Controller**: Maps HTTP routes to specialized service methods with improved validation, response handling, and delegation patterns.
- **Service Layer**: Now includes both general organisation service and specialized nomenclature services with distributed configuration capabilities.
- **Entity**: Defines table schema with enhanced relational relationships and proper foreign key constraints.

```mermaid
sequenceDiagram
participant Client as "Client"
participant Controller as "OrganisationController"
participant OrgService as "OrganisationService"
participant NomenclatureSvc as "SpecializedNomenclatureService"
participant ConfigMgr as "DistributedConfigManager"
participant DB as "TypeORM Repository"
participant Events as "EventEmitter"
Client->>Controller : "POST /organisation/nomenclatures/categorie"
Controller->>Controller : "validate input"
Controller->>OrgService : "createWithConfig(payload)"
OrgService->>ConfigMgr : "distributeConfiguration()"
ConfigMgr->>NomenclatureSvc : "coordinateSpecializedService()"
NomenclatureSvc->>DB : "persist categorie entity"
DB-->>NomenclatureSvc : "entity created"
NomenclatureSvc->>Events : "emit 'categorie.created'"
Events-->>NomenclatureSvc : "ack"
NomenclatureSvc-->>OrgService : "created entity"
OrgService-->>Controller : "result with config status"
Controller-->>Client : "201 Created"
```

**Diagram sources**
- [organisation.controller.ts:1-200](file://backend/src/modules/organisation/controllers/organisation.controller.ts#L1-L200)
- [organisation.service.ts:1-200](file://backend/src/modules/organisation/services/organisation.service.ts#L1-L200)
- [specialized-nomenclature.service.ts:1-200](file://backend/src/modules/organisation/services/specialized-nomenclature.service.ts#L1-L200)
- [organisation.entity.ts:1-200](file://backend/src/modules/organisation/entities/organisation.entity.ts#L1-L200)

**Section sources**
- [organisation.module.ts:1-200](file://backend/src/modules/organisation/organisation.module.ts#L1-L200)
- [organisation.controller.ts:1-200](file://backend/src/modules/organisation/controllers/organisation.controller.ts#L1-L200)
- [organisation.service.ts:1-200](file://backend/src/modules/organisation/services/organisation.service.ts#L1-L200)
- [specialized-nomenclature.service.ts:1-200](file://backend/src/modules/organisation/services/specialized-nomenclature.service.ts#L1-L200)
- [organisation.entity.ts:1-200](file://backend/src/modules/organisation/entities/organisation.entity.ts#L1-L200)

### Consolidation Migration Architecture
**New** The consolidation migration system provides enhanced database schema management with proper relational entities and improved maintainability.

- **Migration Strategy**: Consolidated migrations reduce complexity and improve deployment reliability.
- **Schema Design**: Enhanced relational entities with proper foreign key relationships and constraints.
- **Data Integrity**: Improved referential integrity and cascading operations.
- **Performance Optimization**: Better indexing strategies and query optimization.

```mermaid
flowchart TD
Start(["Migration 110"]) --> Analyze["Analyze Current Schema"]
Analyze --> Identify["Identify Consolidation Opportunities"]
Identify --> Redesign["Redesign Relational Schema"]
Redesign --> Create["Create Migration Script"]
Create --> Validate["Validate Schema Changes"]
Validate --> Deploy["Deploy to Database"]
Deploy --> Verify["Verify Data Integrity"]
Verify --> Complete(["Migration Complete"])
```

**Diagram sources**
- [110-consolidation-organisation.sql:1-200](file://backend/database/migrations/110-consolidation-organisation.sql#L1-L200)

**Section sources**
- [110-consolidation-organisation.sql:1-200](file://backend/database/migrations/110-consolidation-organisation.sql#L1-L200)

### Module Pattern: Eleves
- **Module registration**: Declares controllers, services, and imports shared dependencies.
- **Controller**: Maps HTTP routes to service methods, validates inputs, and returns responses with delegation patterns.
- **Service**: Encapsulates business rules, interacts with entities/repositories, and emits domain events.
- **Entity**: Defines table schema and relationships.

```mermaid
sequenceDiagram
participant Client as "Client"
participant Controller as "ElevesController"
participant Service as "ElevesService"
participant DB as "TypeORM Repository"
participant Events as "EventEmitter"
Client->>Controller : "POST /eleves"
Controller->>Controller : "validate input"
Controller->>Service : "create(payload)"
Service->>DB : "persist entity"
DB-->>Service : "entity created"
Service->>Events : "emit 'eleve.created'"
Events-->>Service : "ack"
Service-->>Controller : "created entity"
Controller-->>Client : "201 Created"
```

**Diagram sources**
- [eleves.controller.ts:1-200](file://backend/src/modules/eleves/controllers/eleves.controller.ts#L1-L200)
- [eleves.service.ts:1-200](file://backend/src/modules/eleves/services/eleves.service.ts#L1-L200)
- [eleves.entity.ts:1-200](file://backend/src/modules/eleves/entities/eleves.entity.ts#L1-L200)

**Section sources**
- [eleves.module.ts:1-200](file://backend/src/modules/eleves/eleves.module.ts#L1-L200)
- [eleves.controller.ts:1-200](file://backend/src/modules/eleves/controllers/eleves.controller.ts#L1-L200)
- [eleves.service.ts:1-200](file://backend/src/modules/eleves/services/eleves.service.ts#L1-L200)
- [eleves.entity.ts:1-200](file://backend/src/modules/eleves/entities/eleves.entity.ts#L1-L200)

### Module Pattern: Personnel
- Similar structure to Eleves with dedicated controller and service for HR-related operations.
- Uses shared guards and interceptors for consistent security and logging.

```mermaid
flowchart TD
Start(["Request to Personnel"]) --> Auth["Auth Guard"]
Auth --> Roles["Roles Guard"]
Roles --> Controller["PersonnelController"]
Controller --> Service["PersonnelService"]
Service --> Repo["Repository/Entity"]
Repo --> Service
Service --> Controller
Controller --> End(["Response"])
```

**Diagram sources**
- [personnel.module.ts:1-200](file://backend/src/modules/personnel/personnel.module.ts#L1-L200)
- [personnel.controller.ts:1-200](file://backend/src/modules/personnel/controllers/personnel.controller.ts#L1-L200)
- [personnel.service.ts:1-200](file://backend/src/modules/personnel/services/personnel.service.ts#L1-L200)
- [auth.guard.ts:1-200](file://backend/src/common/guards/auth.guard.ts#L1-L200)
- [roles.guard.ts:1-200](file://backend/src/common/guards/roles.guard.ts#L1-L200)

**Section sources**
- [personnel.module.ts:1-200](file://backend/src/modules/personnel/personnel.module.ts#L1-L200)
- [personnel.controller.ts:1-200](file://backend/src/modules/personnel/controllers/personnel.controller.ts#L1-L200)
- [personnel.service.ts:1-200](file://backend/src/modules/personnel/services/personnel.service.ts#L1-L200)

### Module Pattern: Finances
- Handles financial operations like fees, payments, and invoices.
- Integrates with audit service for compliance and traceability.

```mermaid
sequenceDiagram
participant Client as "Client"
participant Controller as "FinancesController"
participant Service as "FinancesService"
participant Audit as "AuditService"
participant DB as "TypeORM Repository"
Client->>Controller : "POST /finances/payment"
Controller->>Service : "processPayment(data)"
Service->>DB : "persist payment"
DB-->>Service : "payment saved"
Service->>Audit : "log action"
Audit-->>Service : "logged"
Service-->>Controller : "result"
Controller-->>Client : "201 Created"
```

**Diagram sources**
- [finances.module.ts:1-200](file://backend/src/modules/finances/finances.module.ts#L1-L200)
- [finances.controller.ts:1-200](file://backend/src/modules/finances/controllers/finances.controller.ts#L1-L200)
- [finances.service.ts:1-200](file://backend/src/modules/finances/services/finances.service.ts#L1-L200)
- [audit.service.ts:1-200](file://backend/src/common/services/audit.service.ts#L1-L200)

**Section sources**
- [finances.module.ts:1-200](file://backend/src/modules/finances/finances.module.ts#L1-L200)
- [finances.controller.ts:1-200](file://backend/src/modules/finances/controllers/finances.controller.ts#L1-L200)
- [finances.service.ts:1-200](file://backend/src/modules/finances/services/finances.service.ts#L1-L200)
- [audit.service.ts:1-200](file://backend/src/common/services/audit.service.ts#L1-L200)

### Common Infrastructure

#### Guards
- Authentication guard validates tokens and attaches user context.
- Roles guard enforces permission checks based on roles or permissions.

```mermaid
flowchart TD
Req["Incoming Request"] --> AuthG["Auth Guard"]
AuthG --> RolesG["Roles Guard"]
RolesG --> Next["Next Handler"]
```

**Diagram sources**
- [auth.guard.ts:1-200](file://backend/src/common/guards/auth.guard.ts#L1-L200)
- [roles.guard.ts:1-200](file://backend/src/common/guards/roles.guard.ts#L1-L200)

**Section sources**
- [auth.guard.ts:1-200](file://backend/src/common/guards/auth.guard.ts#L1-L200)
- [roles.guard.ts:1-200](file://backend/src/common/guards/roles.guard.ts#L1-L200)

#### Interceptors
- Logging interceptor records request metadata and response times.
- Can be used for caching, transformation, or performance metrics.

```mermaid
flowchart TD
Start(["Interceptor Entry"]) --> Log["Log Request"]
Log --> Execute["Execute Handler"]
Execute --> Response["Format Response"]
Response --> End(["Interceptor Exit"])
```

**Diagram sources**
- [logging.interceptor.ts:1-200](file://backend/src/common/interceptors/logging.interceptor.ts#L1-L200)

**Section sources**
- [logging.interceptor.ts:1-200](file://backend/src/common/interceptors/logging.interceptor.ts#L1-L200)

#### Middlewares
- Tenant middleware extracts tenant context from headers or JWT and scopes queries accordingly.

```mermaid
flowchart TD
MWStart(["Tenant Middleware"]) --> Extract["Extract Tenant ID"]
Extract --> Attach["Attach to Request Context"]
Attach --> NextMW["Next Middleware/Handler"]
```

**Diagram sources**
- [tenant.middleware.ts:1-200](file://backend/src/common/middlewares/tenant.middleware.ts#L1-L200)

**Section sources**
- [tenant.middleware.ts:1-200](file://backend/src/common/middlewares/tenant.middleware.ts#L1-L200)

#### Filters
- Global exception filter normalizes error responses and logs exceptions.

```mermaid
flowchart TD
ErrStart(["Exception Thrown"]) --> Filter["Global Exception Filter"]
Filter --> Normalize["Normalize Error Payload"]
Normalize --> LogErr["Log Error"]
LogErr --> Resp["Return Standard Error Response"]
```

**Diagram sources**
- [exception.filter.ts:1-200](file://backend/src/common/filters/exception.filter.ts#L1-L200)

**Section sources**
- [exception.filter.ts:1-200](file://backend/src/common/filters/exception.filter.ts#L1-L200)

#### Utilities
- Pagination utility standardizes query parameters and response shape across modules.

```mermaid
flowchart TD
PStart(["Pagination Input"]) --> Validate["Validate Page & Size"]
Validate --> BuildQuery["Build Offset/Limit Query"]
BuildQuery --> Fetch["Fetch Data"]
Fetch --> Shape["Shape Paginated Response"]
Shape --> PEnd(["Paginated Result"])
```

**Diagram sources**
- [pagination.util.ts:1-200](file://backend/src/common/utils/pagination.util.ts#L1-L200)

**Section sources**
- [pagination.util.ts:1-200](file://backend/src/common/utils/pagination.util.ts#L1-L200)

### Configuration Management
- Environment variables are loaded and validated centrally.
- Database configuration defines connection settings and TypeORM options.
- Swagger configuration sets API documentation metadata.
- **Enhanced**: Distributed configuration management pattern supports scalable configuration distribution.

```mermaid
graph TB
Env["env.config.ts"] --> App["app.ts"]
DBConf["database.config.ts"] --> App
Swagger["swagger.config.ts"] --> App
DistConfig["Distributed Config Manager"] --> App
App --> DataSource["data-source.ts"]
```

**Diagram sources**
- [env.config.ts:1-200](file://backend/src/config/env.config.ts#L1-L200)
- [database.config.ts:1-200](file://backend/src/config/database.config.ts#L1-L200)
- [swagger.config.ts:1-200](file://backend/src/config/swagger.config.ts#L1-L200)
- [data-source.ts:1-200](file://backend/src/database/data-source.ts#L1-L200)

**Section sources**
- [env.config.ts:1-200](file://backend/src/config/env.config.ts#L1-L200)
- [database.config.ts:1-200](file://backend/src/config/database.config.ts#L1-L200)
- [swagger.config.ts:1-200](file://backend/src/config/swagger.config.ts#L1-L200)
- [data-source.ts:1-200](file://backend/src/database/data-source.ts#L1-L200)

### Dependency Injection Patterns
- Providers are registered at module level and injected into controllers and services.
- Shared services (e.g., audit) are imported by multiple modules.
- Optional lazy loading and forward references can be used for circular dependencies.
- **Enhanced**: Specialized services provide better separation of concerns and testability with distributed configuration support.

```mermaid
graph TB
ModA["ElevesModule"] --> ProvA["ElevesService"]
ModB["FinancesModule"] --> ProvB["FinancesService"]
ModC["OrganisationModule"] --> ProvC["OrganisationService"]
ModC --> ProvD["SpecializedNomenclatureService"]
ModC --> ProvE["DistributedConfigManager"]
Shared["AuditService"] --> ModA
Shared --> ModB
Shared --> ModC
CtrlA["ElevesController"] --> ProvA
CtrlB["FinancesController"] --> ProvB
CtrlC["OrganisationController"] --> ProvC
CtrlC --> ProvD
CtrlC --> ProvE
```

**Diagram sources**
- [eleves.module.ts:1-200](file://backend/src/modules/eleves/eleves.module.ts#L1-L200)
- [finances.module.ts:1-200](file://backend/src/modules/finances/finances.module.ts#L1-L200)
- [organisation.module.ts:1-200](file://backend/src/modules/organisation/organisation.module.ts#L1-L200)
- [audit.service.ts:1-200](file://backend/src/common/services/audit.service.ts#L1-L200)

**Section sources**
- [eleves.module.ts:1-200](file://backend/src/modules/eleves/eleves.module.ts#L1-L200)
- [finances.module.ts:1-200](file://backend/src/modules/finances/finances.module.ts#L1-L200)
- [organisation.module.ts:1-200](file://backend/src/modules/organisation/organisation.module.ts#L1-L200)
- [audit.service.ts:1-200](file://backend/src/common/services/audit.service.ts#L1-L200)

### Event-Driven Communication
- Modules emit domain events (e.g., eleve.created, payment.processed, categorie.created) handled by listeners in other modules.
- Use Nest's EventEmitter or a custom event bus for decoupled interactions.
- **Enhanced**: Specialized services emit more granular events for better tracking and processing with distributed configuration events.

```mermaid
sequenceDiagram
participant ModA as "SpecializedNomenclatureService"
participant ModB as "DistributedConfigManager"
participant Bus as "EventBus"
participant ModC as "NotificationsService"
participant ModD as "AuditService"
ModA->>Bus : "emit('categorie.created', payload)"
ModB->>Bus : "emit('config.distributed', payload)"
Bus-->>ModC : "dispatch('categorie.created')"
Bus-->>ModD : "dispatch('categorie.created')"
Bus-->>ModC : "dispatch('config.distributed')"
Bus-->>ModD : "dispatch('config.distributed')"
ModC->>ModC : "send notification"
ModD->>ModD : "log audit trail"
```

[No sources needed since this diagram shows conceptual workflow, not actual code structure]

## Dependency Analysis
The following diagram highlights key runtime dependencies among core files with enhanced organisation module integration and distributed configuration management.

```mermaid
graph TB
Index["src/index.ts"] --> App["src/app.ts"]
App --> ConfigEnv["src/config/env.config.ts"]
App --> ConfigDB["src/config/database.config.ts"]
App --> ConfigSwagger["src/config/swagger.config.ts"]
App --> DataSource["src/database/data-source.ts"]
App --> RouteReg["src/routes/route-registry.ts"]
App --> ElevesMod["modules/eleves/eleves.module.ts"]
App --> PersonnelMod["modules/personnel/personnel.module.ts"]
App --> FinancesMod["modules/finances/finances.module.ts"]
App --> OrganisationMod["modules/organisation/organisation.module.ts"]
App --> AuthGuard["common/guards/auth.guard.ts"]
App --> RolesGuard["common/guards/roles.guard.ts"]
App --> LoggingIntc["common/interceptors/logging.interceptor.ts"]
App --> TenantMW["common/middlewares/tenant.middleware.ts"]
App --> ExFilter["common/filters/exception.filter.ts"]
App --> PaginationUtil["common/utils/pagination.util.ts"]
App --> AuditSvc["common/services/audit.service.ts"]
OrganisationMod --> SpecializedSvc["specialized-nomenclature.service.ts"]
OrganisationMod --> DistConfig["distributed-config-manager.service.ts"]
```

**Diagram sources**
- [index.ts:1-200](file://backend/src/index.ts#L1-L200)
- [app.ts:1-200](file://backend/src/app.ts#L1-L200)
- [env.config.ts:1-200](file://backend/src/config/env.config.ts#L1-L200)
- [database.config.ts:1-200](file://backend/src/config/database.config.ts#L1-L200)
- [swagger.config.ts:1-200](file://backend/src/config/swagger.config.ts#L1-L200)
- [data-source.ts:1-200](file://backend/src/database/data-source.ts#L1-L200)
- [route-registry.ts:1-200](file://backend/src/routes/route-registry.ts#L1-L200)
- [eleves.module.ts:1-200](file://backend/src/modules/eleves/eleves.module.ts#L1-L200)
- [personnel.module.ts:1-200](file://backend/src/modules/personnel/personnel.module.ts#L1-L200)
- [finances.module.ts:1-200](file://backend/src/modules/finances/finances.module.ts#L1-L200)
- [organisation.module.ts:1-200](file://backend/src/modules/organisation/organisation.module.ts#L1-L200)
- [specialized-nomenclature.service.ts:1-200](file://backend/src/modules/organisation/services/specialized-nomenclature.service.ts#L1-L200)
- [auth.guard.ts:1-200](file://backend/src/common/guards/auth.guard.ts#L1-L200)
- [roles.guard.ts:1-200](file://backend/src/common/guards/roles.guard.ts#L1-L200)
- [logging.interceptor.ts:1-200](file://backend/src/common/interceptors/logging.interceptor.ts#L1-L200)
- [tenant.middleware.ts:1-200](file://backend/src/common/middlewares/tenant.middleware.ts#L1-L200)
- [exception.filter.ts:1-200](file://backend/src/common/filters/exception.filter.ts#L1-L200)
- [pagination.util.ts:1-200](file://backend/src/common/utils/pagination.util.ts#L1-L200)
- [audit.service.ts:1-200](file://backend/src/common/services/audit.service.ts#L1-L200)

**Section sources**
- [index.ts:1-200](file://backend/src/index.ts#L1-L200)
- [app.ts:1-200](file://backend/src/app.ts#L1-L200)
- [route-registry.ts:1-200](file://backend/src/routes/route-registry.ts#L1-L200)

## Performance Considerations
- Use pagination utilities consistently to avoid large payloads.
- Apply indexes and optimize queries at the repository/entity level with enhanced relational schema.
- Cache frequently accessed read-only data using Redis or in-memory caches.
- Enable compression and tune HTTP server settings.
- Profile critical paths with logging interceptors and metrics collectors.
- **Enhanced**: Leverage specialized services for better query optimization and reduced coupling.
- **Enhanced**: Utilize consolidation migrations for improved database performance and maintainability.
- **New**: Implement distributed configuration caching to reduce configuration lookup overhead.
- **New**: Optimize controller delegation patterns to minimize service call overhead.

## Troubleshooting Guide
- Authentication failures: Verify token validation in auth guard and ensure tenant context is attached.
- Authorization errors: Check roles guard policies and RBAC mappings.
- Global errors: Inspect exception filter output and logs for stack traces and normalized payloads.
- Tenant isolation issues: Confirm tenant middleware runs early and sets context correctly.
- Pagination anomalies: Validate page/size parameters and offset calculations.
- **New**: Organisation module issues: Check specialized service dependencies and controller routing.
- **New**: Migration problems: Review consolidation migration scripts and rollback procedures.
- **New**: Service coupling issues: Verify specialized service interfaces and dependency injection configuration.
- **New**: Distributed configuration issues: Check configuration service health and synchronization status.
- **New**: Controller delegation problems: Verify service method signatures and error handling patterns.

**Section sources**
- [auth.guard.ts:1-200](file://backend/src/common/guards/auth.guard.ts#L1-L200)
- [roles.guard.ts:1-200](file://backend/src/common/guards/roles.guard.ts#L1-L200)
- [exception.filter.ts:1-200](file://backend/src/common/filters/exception.filter.ts#L1-L200)
- [tenant.middleware.ts:1-200](file://backend/src/common/middlewares/tenant.middleware.ts#L1-L200)
- [pagination.util.ts:1-200](file://backend/src/common/utils/pagination.util.ts#L1-L200)
- [organisation.module.ts:1-200](file://backend/src/modules/organisation/organisation.module.ts#L1-L200)
- [specialized-nomenclature.service.ts:1-200](file://backend/src/modules/organisation/services/specialized-nomenclature.service.ts#L1-L200)
- [110-consolidation-organisation.sql:1-200](file://backend/database/migrations/110-consolidation-organisation.sql#L1-L200)

## Conclusion
The eLISAschool backend leverages NestJS's modular and layered architecture to deliver a scalable, maintainable system. Recent architectural evolution includes the implementation of distributed configuration management patterns and enhanced controller delegation strategies. The organisation module restructuring with specialized services replacing monolithic components, improved database schema through consolidation migrations, and better separation of concerns demonstrate the system's evolution toward cleaner interfaces between API and business logic layers. Each business domain is isolated in its own module with clear responsibilities. Shared infrastructure ensures consistent security, logging, error handling, and multi-tenancy. Configuration is centralized with distributed patterns, and dependency injection promotes testability and extensibility. Event-driven patterns enable loose coupling between modules, while utilities standardize cross-cutting behaviors like pagination. The enhanced architecture provides better maintainability, performance, and scalability for the educational institution management system through improved responsibility boundaries and specialized service delegation.

## Appendices

### Example Module Structure
- eleves:
  - eleves.module.ts
  - controllers/eleves.controller.ts
  - services/eleves.service.ts
  - entities/eleves.entity.ts
- personnel:
  - personnel.module.ts
  - controllers/personnel.controller.ts
  - services/personnel.service.ts
- finances:
  - finances.module.ts
  - controllers/finances.controller.ts
  - services/finances.service.ts
- **Enhanced** organisation:
  - organisation.module.ts
  - controllers/organisation.controller.ts
  - services/organisation.service.ts
  - services/specialized-nomenclature.service.ts
  - services/distributed-config-manager.service.ts
  - entities/organisation.entity.ts

**Section sources**
- [eleves.module.ts:1-200](file://backend/src/modules/eleves/eleves.module.ts#L1-L200)
- [eleves.controller.ts:1-200](file://backend/src/modules/eleves/controllers/eleves.controller.ts#L1-L200)
- [eleves.service.ts:1-200](file://backend/src/modules/eleves/services/eleves.service.ts#L1-L200)
- [eleves.entity.ts:1-200](file://backend/src/modules/eleves/entities/eleves.entity.ts#L1-L200)
- [personnel.module.ts:1-200](file://backend/src/modules/personnel/personnel.module.ts#L1-L200)
- [personnel.controller.ts:1-200](file://backend/src/modules/personnel/controllers/personnel.controller.ts#L1-L200)
- [personnel.service.ts:1-200](file://backend/src/modules/personnel/services/personnel.service.ts#L1-L200)
- [finances.module.ts:1-200](file://backend/src/modules/finances/finances.module.ts#L1-L200)
- [finances.controller.ts:1-200](file://backend/src/modules/finances/controllers/finances.controller.ts#L1-L200)
- [finances.service.ts:1-200](file://backend/src/modules/finances/services/finances.service.ts#L1-L200)
- [organisation.module.ts:1-200](file://backend/src/modules/organisation/organisation.module.ts#L1-L200)
- [organisation.controller.ts:1-200](file://backend/src/modules/organisation/controllers/organisation.controller.ts#L1-L200)
- [organisation.service.ts:1-200](file://backend/src/modules/organisation/services/organisation.service.ts#L1-L200)
- [specialized-nomenclature.service.ts:1-200](file://backend/src/modules/organisation/services/specialized-nomenclature.service.ts#L1-L200)
- [organisation.entity.ts:1-200](file://backend/src/modules/organisation/entities/organisation.entity.ts#L1-L200)

### Example Service Layer Implementation
- Implement use cases in services, call repositories/entities, and emit events for side effects.
- Keep controllers thin by delegating logic to services.
- **Enhanced**: Use specialized services for specific business domains to improve maintainability and testability.
- **New**: Implement distributed configuration management in specialized services for better scalability.

**Section sources**
- [eleves.service.ts:1-200](file://backend/src/modules/eleves/services/eleves.service.ts#L1-L200)
- [personnel.service.ts:1-200](file://backend/src/modules/personnel/services/personnel.service.ts#L1-L200)
- [finances.service.ts:1-200](file://backend/src/modules/finances/services/finances.service.ts#L1-L200)
- [organisation.service.ts:1-200](file://backend/src/modules/organisation/services/organisation.service.ts#L1-L200)
- [specialized-nomenclature.service.ts:1-200](file://backend/src/modules/organisation/services/specialized-nomenclature.service.ts#L1-L200)

### Cross-Cutting Concerns Handling
- Security: Guards enforce authentication and authorization.
- Observability: Interceptors log requests/responses and measure latency.
- Multi-tenancy: Middleware injects tenant context.
- Errors: Global filter normalizes error responses.
- Utilities: Pagination and helper functions standardize behavior.
- **Enhanced**: Specialized services provide better separation of concerns and improved maintainability.
- **New**: Distributed configuration services handle cross-module configuration consistency.

**Section sources**
- [auth.guard.ts:1-200](file://backend/src/common/guards/auth.guard.ts#L1-L200)
- [roles.guard.ts:1-200](file://backend/src/common/guards/roles.guard.ts#L1-L200)
- [logging.interceptor.ts:1-200](file://backend/src/common/interceptors/logging.interceptor.ts#L1-L200)
- [tenant.middleware.ts:1-200](file://backend/src/common/middlewares/tenant.middleware.ts#L1-L200)
- [exception.filter.ts:1-200](file://backend/src/common/filters/exception.filter.ts#L1-L200)
- [pagination.util.ts:1-200](file://backend/src/common/utils/pagination.util.ts#L1-L200)
- [specialized-nomenclature.service.ts:1-200](file://backend/src/modules/organisation/services/specialized-nomenclature.service.ts#L1-L200)

### Enhanced Database Schema Architecture
**New** The consolidation migration system provides improved database schema management with proper relational entities and enhanced data integrity.

- **Consolidation Strategy**: Single comprehensive migration reduces deployment complexity and improves reliability.
- **Relational Design**: Proper foreign key relationships and constraints ensure data consistency.
- **Performance Optimization**: Enhanced indexing strategies and query optimization techniques.
- **Maintainability**: Clear separation of concerns in database schema design.

```mermaid
erDiagram
ORGANISATION {
int id PK
varchar nom
varchar sigle
varchar adresse
timestamp createdAt
timestamp updatedAt
}
NOMENCLATURE_CATEGORIE {
int id PK
int organisation_id FK
varchar libelle
timestamp createdAt
timestamp updatedAt
}
NOMENCLATURE_SOUS_CATEGORIE {
int id PK
int categorie_id FK
varchar libelle
timestamp createdAt
timestamp updatedAt
}
ORGANISATION ||--o{ NOMENCLATURE_CATEGORIE : "has many"
NOMENCLATURE_CATEGORIE ||--o{ NOMENCLATURE_SOUS_CATEGORIE : "has many"
```

**Diagram sources**
- [110-consolidation-organisation.sql:1-200](file://backend/database/migrations/110-consolidation-organisation.sql#L1-L200)

**Section sources**
- [110-consolidation-organisation.sql:1-200](file://backend/database/migrations/110-consolidation-organisation.sql#L1-L200)