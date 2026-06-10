# Modules & Features

<cite>
**Referenced Files in This Document**
- [README.md](file://README.md)
- [backend/src/index.ts](file://backend/src/index.ts)
- [backend/src/app.ts](file://backend/src/app.ts)
- [backend/package.json](file://backend/package.json)
- [backend/src/modules/auth/index.ts](file://backend/src/modules/auth/index.ts)
- [backend/src/modules/auth/controllers/auth.controller.ts](file://backend/src/modules/auth/controllers/auth.controller.ts)
- [backend/src/modules/eleves/index.ts](file://backend/src/modules/eleves/index.ts)
- [backend/src/modules/eleves/controllers/eleves.controller.ts](file://backend/src/modules/eleves/controllers/eleves.controller.ts)
- [backend/src/modules/eleves/entities/eleve.entity.ts](file://backend/src/modules/eleves/entities/eleve.entity.ts)
- [backend/src/modules/classes/index.ts](file://backend/src/modules/classes/index.ts)
- [backend/src/modules/classes/controllers/classes.controller.ts](file://backend/src/modules/classes/controllers/classes.controller.ts)
- [backend/src/modules/matieres/index.ts](file://backend/src/modules/matieres/index.ts)
- [backend/src/modules/matieres/controllers/matieres.controller.ts](file://backend/src/modules/matieres/controllers/matieres.controller.ts)
- [backend/src/modules/notes/index.ts](file://backend/src/modules/notes/index.ts)
- [backend/src/modules/notes/controllers/notes.controller.ts](file://backend/src/modules/notes/controllers/notes.controller.ts)
- [backend/src/modules/responsables-eleves/services/parents.service.ts](file://backend/src/modules/responsables-eleves/services/parents.service.ts)
- [backend/database/migrations/052-approche-hybride-parents.sql](file://backend/database/migrations/052-approche-hybride-parents.sql)
- [backend/scripts/migrate-parents.ts](file://backend/scripts/migrate-parents.ts)
- [backend/src/modules/dashboard/controllers/dashboard.controller.ts](file://backend/src/modules/dashboard/controllers/dashboard.controller.ts)
- [backend/src/modules/dashboard/services/dashboard-cache.service.ts](file://backend/src/modules/dashboard/services/dashboard-cache.service.ts)
- [backend/src/modules/dashboard/services/dashboard-sse.service.ts](file://backend/src/modules/dashboard/services/dashboard-sse.service.ts)
- [backend/src/modules/dashboard/utils/widget-registry.ts](file://backend/src/modules/dashboard/utils/widget-registry.ts)
- [backend/src/common/services/redis.service.ts](file://backend/src/common/services/redis.service.ts)
- [backend/database/migrations/010-dashboard-layouts.sql](file://backend/database/migrations/010-dashboard-layouts.sql)
- [backend/database/migrations/010-notification-providers.sql](file://backend/database/migrations/010-notification-providers.sql)
</cite>

## Update Summary
**Changes Made**
- Added comprehensive documentation for the new Hybrid Parent Management Module
- Documented the intelligent fallback system for parent data management
- Added migration automation capabilities for converting direct parent fields to responsible parent entities
- Enhanced student management module with deprecated field documentation and migration guidance
- Updated module dependency analysis to include hybrid parent management integration
- Added performance considerations for parent data fallback scenarios

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Hybrid Parent Management Module](#hybrid-parent-management-module)
7. [Dependency Analysis](#dependency-analysis)
8. [Performance Considerations](#performance-considerations)
9. [Troubleshooting Guide](#troubleshooting-guide)
10. [Conclusion](#conclusion)
11. [Appendices](#appendices)

## Introduction
eLISAschool is a modular Progressive Web App (PWA) backend designed for advanced school administration in Sub-Saharan Africa. It provides a comprehensive set of functional modules covering academic management, student records, grading systems, class administration, subject management, administrative functions, and now an integrated Hybrid Parent Management System with intelligent fallback capabilities. The backend is built with Node.js, Express.js, TypeScript, and TypeORM, and integrates PostgreSQL with Row Level Security (RLS). Security is enforced via JWT, AES-256 encryption, and Role-Based Access Control (RBAC). The system exposes RESTful APIs organized by domain-focused modules, each with dedicated controllers, DTOs, entities, and services.

**Section sources**
- [README.md:1-39](file://README.md#L1-L39)

## Project Structure
The backend follows a modular monolith architecture with a clear separation of concerns:
- Root entry initializes environment, connects to PostgreSQL via TypeORM, and starts the Express server.
- The application composes routes from individual modules and applies shared middleware (security, logging, rate limiting).
- Each module encapsulates its own controllers, DTOs, entities, and services, exporting a consolidated index for easy consumption.
- **Enhanced**: The Hybrid Parent Management Module provides seamless integration between legacy direct parent fields and modern responsible parent entities with automatic migration capabilities.

Key structural highlights:
- Entry point: initializes database and server lifecycle.
- Application factory: configures middleware, health endpoints, and mounts module routes.
- Module composition: centralized route mounting in the application factory.
- **Enhanced**: Hybrid parent management module with intelligent fallback system and automatic migration capabilities.

```mermaid
graph TB
A["backend/src/index.ts<br/>Bootstrap server and DB"] --> B["backend/src/app.ts<br/>Express app factory"]
B --> C["Module Routes<br/>/api/auth, /api/classes, /api/matieres, /api/notes, /api/dashboard, /api/responsables-eleves"]
C --> D["Controllers<br/>auth.controller.ts, classes.controller.ts, matieres.controller.ts, notes.controller.ts, dashboard.controller.ts, responsables-eleves.controller.ts"]
D --> E["Services<br/>auth.service.ts, classes.service.ts, matieres.service.ts, notes.service.ts, dashboard services, parents.service.ts"]
E --> F["Entities<br/>TypeORM entities per module + dashboard-layout.entity.ts + responsable-eleve entities"]
G["Hybrid Parent System<br/>Intelligent fallback & migration"] --> E
```

**Diagram sources**
- [backend/src/index.ts:22-61](file://backend/src/index.ts#L22-L61)
- [backend/src/app.ts:58-204](file://backend/src/app.ts#L58-L204)
- [backend/src/common/services/redis.service.ts](file://backend/src/common/services/redis.service.ts)

**Section sources**
- [backend/src/index.ts:1-62](file://backend/src/index.ts#L1-L62)
- [backend/src/app.ts:1-205](file://backend/src/app.ts#L1-L205)

## Core Components
This section outlines the primary modules and their responsibilities, focusing on purpose, key features, data relationships, and user workflows.

- Authentication and Authorization
  - Purpose: Secure user onboarding, session management, and access control.
  - Key features: Login, registration, refresh tokens, logout, forgot/reset/change password, email verification, current user retrieval.
  - Data relationships: Users, roles, permissions, refresh tokens, audit logs.
  - User workflows: Registration -> Email verification -> Login -> Token refresh -> Protected actions -> Logout.
  - Security: JWT, bcrypt hashing, RBAC guards, request logging, rate limiting.

- Students (Eleves)
  - Purpose: Manage student profiles, enrollments, and lifecycle.
  - Key features: List students, create/update/delete student records, role-restricted access.
  - Data relationships: Student entity linked to classes, grades, and related academic records.
  - User workflows: Admin/SuperAdmin/Personnel create/update student; Chef d'Établissement views; deletion restricted to admin roles.
  - **Enhanced**: Integrated with hybrid parent management system for intelligent fallback and migration.

- Classes (Classes)
  - Purpose: Organize students into classes by level and academic year.
  - Key features: CRUD for classes, list by level/year, student enrollment/affectation.
  - Data relationships: Class entity linked to levels, academic years, and students.
  - User workflows: Admin/SuperAdmin create/update/delete classes; Personnel/Chef affect students to classes.

- Subjects (Matieres)
  - Purpose: Define subjects, groups, and curriculum mapping per level.
  - Key features: CRUD for subjects, manage subject groups, curriculum programme per level, teacher assignment.
  - Data relationships: Subject entity, grouping, level mapping, teacher affectation.
  - User workflows: Admin/SuperAdmin create subjects and groups; Chef/Admin assign teachers; retrieve programme per level.

- Grading System (Notes)
  - Purpose: Capture, compute, and manage student assessments.
  - Key features: CRUD for notes, bulk creation, query filtering, role-restricted write access.
  - Data relationships: Note entity linked to students, subjects, periods, classes.
  - User workflows: Teachers create/update/delete notes; Admin/Chef/Equipe view; bulk upload for efficiency.

**Section sources**
- [backend/src/modules/auth/controllers/auth.controller.ts:55-264](file://backend/src/modules/auth/controllers/auth.controller.ts#L55-L264)
- [backend/src/modules/eleves/controllers/eleves.controller.ts:25-54](file://backend/src/modules/eleves/controllers/eleves.controller.ts#L25-L54)
- [backend/src/modules/classes/controllers/classes.controller.ts:25-63](file://backend/src/modules/classes/controllers/classes.controller.ts#L25-L63)
- [backend/src/modules/matieres/controllers/matieres.controller.ts:30-85](file://backend/src/modules/matieres/controllers/matieres.controller.ts#L30-L85)
- [backend/src/modules/notes/controllers/notes.controller.ts:27-71](file://backend/src/modules/notes/controllers/notes.controller.ts#L27-L71)

## Architecture Overview
The system employs a layered architecture:
- Presentation Layer: Express routes per module.
- Application Layer: Controllers orchestrate requests, apply validation, enforce roles, and delegate to services.
- Domain Layer: Services encapsulate business logic and coordinate with repositories/entities.
- Data Layer: TypeORM entities and repositories persist data to PostgreSQL with RLS.

Inter-module communication:
- Controllers depend on services within the same module.
- Shared utilities (filters, interceptors, logging) are reused across modules.
- RBAC guards and middlewares enforce authorization centrally.
- **Enhanced**: Hybrid parent management module integrates with student management and provides intelligent fallback capabilities.

```mermaid
graph TB
subgraph "Presentation"
AC["auth.controller.ts"]
EC["eleves.controller.ts"]
CC["classes.controller.ts"]
MC["matieres.controller.ts"]
NC["notes.controller.ts"]
DC["dashboard.controller.ts"]
PC["parents.controller.ts"]
end
subgraph "Application"
AS["auth.service.ts"]
ES["eleves.service.ts"]
CS["classes.service.ts"]
MS["matieres.service.ts"]
NS["notes.service.ts"]
DS["dashboard services"]
PS["parents.service.ts"]
end
subgraph "Domain/Data"
AE["auth entities"]
EE["eleve entity"]
CE["classe entity"]
ME["matiere entity"]
NE["note entity"]
DE["dashboard entities"]
PE["responsable-eleve entities"]
end
subgraph "Infrastructure"
RS["Redis Service"]
SSE["Server-Sent Events"]
WR["Widget Registry"]
HP["Hybrid Parent System"]
end
AC --> AS
EC --> ES
CC --> CS
MC --> MS
NC --> NS
DC --> DS
PC --> PS
AS --> AE
ES --> EE
CS --> CE
MS --> ME
NS --> NE
DS --> DE
PS --> PE
PS --> HP
DS --> RS
DS --> SSE
DS --> WR
```

**Diagram sources**
- [backend/src/modules/auth/controllers/auth.controller.ts:34](file://backend/src/modules/auth/controllers/auth.controller.ts#L34)
- [backend/src/modules/eleves/controllers/eleves.controller.ts:15](file://backend/src/modules/eleves/controllers/eleves.controller.ts#L15)
- [backend/src/modules/classes/controllers/classes.controller.ts:15](file://backend/src/modules/classes/controllers/classes.controller.ts#L15)
- [backend/src/modules/matieres/controllers/matieres.controller.ts:20](file://backend/src/modules/matieres/controllers/matieres.controller.ts#L20)
- [backend/src/modules/notes/controllers/notes.controller.ts:15](file://backend/src/modules/notes/controllers/notes.controller.ts#L15)
- [backend/src/modules/dashboard/controllers/dashboard.controller.ts:281](file://backend/src/modules/dashboard/controllers/dashboard.controller.ts#L281)
- [backend/src/modules/responsables-eleves/services/parents.service.ts](file://backend/src/modules/responsables-eleves/services/parents.service.ts#L1)

## Detailed Component Analysis

### Authentication and Authorization Module
Purpose:
- Centralized identity and access management with secure token lifecycle and audit trails.

Key features:
- Multi-step authentication pipeline with validation, hashing, and token issuance.
- Refresh token rotation and logout mechanisms.
- Password recovery and email verification.
- Current user profile retrieval.

Data relationships:
- User entity with roles and permissions.
- Refresh token storage for session management.
- Audit logs for security events.

User workflows:
- Registration and verification.
- Login and token refresh.
- Password reset and change.
- Logout and logout-all.

```mermaid
sequenceDiagram
participant Client as "Client"
participant AuthCtrl as "auth.controller.ts"
participant AuthService as "auth.service.ts"
participant DB as "PostgreSQL"
Client->>AuthCtrl : POST /api/auth/login
AuthCtrl->>AuthService : login(credentials, ip, userAgent)
AuthService->>DB : validate user and hash check
DB-->>AuthService : user record
AuthService-->>AuthCtrl : { accessToken, refreshToken }
AuthCtrl-->>Client : { success, data }
Client->>AuthCtrl : POST /api/auth/refresh
AuthCtrl->>AuthService : refreshTokens(refreshToken, ip, userAgent)
AuthService->>DB : verify token and rotate
DB-->>AuthService : new tokens
AuthService-->>AuthCtrl : { accessToken, refreshToken }
AuthCtrl-->>Client : { success, data }
```

**Diagram sources**
- [backend/src/modules/auth/controllers/auth.controller.ts:55-120](file://backend/src/modules/auth/controllers/auth.controller.ts#L55-L120)

**Section sources**
- [backend/src/modules/auth/index.ts:9-15](file://backend/src/modules/auth/index.ts#L9-L15)
- [backend/src/modules/auth/controllers/auth.controller.ts:55-264](file://backend/src/modules/auth/controllers/auth.controller.ts#L55-L264)

### Students Module
Purpose:
- Maintain student records and support enrollment-related operations with integrated hybrid parent management.

Key features:
- List students with optional subsystem filter.
- Create, update, and delete student records.
- Role-based access controls for write operations.
- **Enhanced**: Integration with hybrid parent management system for intelligent fallback and migration.

User workflows:
- Retrieve lists for reporting/administration.
- Onboard new students with personnel/admin roles.
- Update personal or academic details.
- Archive student records with administrative privileges.
- **Enhanced**: Automatic parent data migration during student conversion.

```mermaid
flowchart TD
Start(["Request received"]) --> Validate["Validate DTO"]
Validate --> Valid{"Valid?"}
Valid --> |No| Error["Throw validation error"]
Valid --> |Yes| ServiceCall["Call ElevesService"]
ServiceCall --> Operation{"Operation type"}
Operation --> |List| ListOp["Find all with filters"]
Operation --> |Create| CreateOp["Create new student"]
Operation --> |Update| UpdateOp["Update existing student"]
Operation --> |Delete| DeleteOp["Soft/hard delete"]
ListOp --> ParentCheck["Check hybrid parent integration"]
CreateOp --> ParentCheck
UpdateOp --> ParentCheck
DeleteOp --> Done(["Return data"])
ParentCheck --> Done
Error --> Done
```

**Diagram sources**
- [backend/src/modules/eleves/controllers/eleves.controller.ts:17-39](file://backend/src/modules/eleves/controllers/eleves.controller.ts#L17-L39)

**Section sources**
- [backend/src/modules/eleves/index.ts:1-5](file://backend/src/modules/eleves/index.ts#L1-L5)
- [backend/src/modules/eleves/controllers/eleves.controller.ts:25-54](file://backend/src/modules/eleves/controllers/eleves.controller.ts#L25-L54)

### Classes Module
Purpose:
- Organize students into structured classes aligned with levels and academic years.

Key features:
- CRUD for classes.
- Filter by level and academic year.
- Student enrollment/affectation workflow.

User workflows:
- Admin/SuperAdmin create/update/delete classes.
- Personnel/Chef affect students to classes.
- Query classes for scheduling and reporting.

```mermaid
sequenceDiagram
participant Client as "Client"
participant ClassesCtrl as "classes.controller.ts"
participant ClassesSvc as "classes.service.ts"
participant DB as "PostgreSQL"
Client->>ClassesCtrl : POST /api/classes/affectations
ClassesCtrl->>ClassesSvc : affecterEleve(dto)
ClassesSvc->>DB : insert enrollment
DB-->>ClassesSvc : enrollment record
ClassesSvc-->>ClassesCtrl : enrollment data
ClassesCtrl-->>Client : { success, data }
```

**Diagram sources**
- [backend/src/modules/classes/controllers/classes.controller.ts:57-63](file://backend/src/modules/classes/controllers/classes.controller.ts#L57-L63)

**Section sources**
- [backend/src/modules/classes/index.ts:1-5](file://backend/src/modules/classes/index.ts#L1-L5)
- [backend/src/modules/classes/controllers/classes.controller.ts:25-63](file://backend/src/modules/classes/controllers/classes.controller.ts#L25-L63)

### Subjects Module
Purpose:
- Define subjects, subject groups, curriculum mapping, and teacher assignments.

Key features:
- CRUD for subjects and subject groups.
- Curriculum programme per level.
- Teacher affectation to subjects.

User workflows:
- Admin/SuperAdmin define subjects and groups.
- Chef/Admin map subjects to levels.
- Assign teachers to subjects for teaching load.

```mermaid
flowchart TD
A["Subjects Controller"] --> B["Get all subjects"]
A --> C["Create subject"]
A --> D["Get subject groups"]
A --> E["Create subject group"]
A --> F["Get programme by level"]
A --> G["Add subject to level"]
A --> H["Assign teacher to subject"]
```

**Diagram sources**
- [backend/src/modules/matieres/controllers/matieres.controller.ts:30-85](file://backend/src/modules/matieres/controllers/matieres.controller.ts#L30-L85)

**Section sources**
- [backend/src/modules/matieres/index.ts:1-5](file://backend/src/modules/matieres/index.ts#L1-L5)
- [backend/src/modules/matieres/controllers/matieres.controller.ts:30-85](file://backend/src/modules/matieres/controllers/matieres.controller.ts#L30-L85)

### Grading System Module
Purpose:
- Capture and manage assessment data with flexible querying and bulk operations.

Key features:
- CRUD for notes.
- Bulk creation endpoint for efficient data entry.
- Query filtering by various criteria.
- Role-restricted write access for teachers and administrators.

User workflows:
- Teachers enter individual or bulk grades.
- Admin/Chef/Equipe view and manage grades.
- Query and export grade data for reports.

```mermaid
sequenceDiagram
participant Client as "Client"
participant NotesCtrl as "notes.controller.ts"
participant NotesSvc as "notes.service.ts"
participant DB as "PostgreSQL"
Client->>NotesCtrl : POST /api/notes/bulk
NotesCtrl->>NotesSvc : createBulk(dto, userId)
NotesSvc->>DB : insert multiple notes
DB-->>NotesSvc : inserted rows
NotesSvc-->>NotesCtrl : count
NotesCtrl-->>Client : { success, count, message }
```

**Diagram sources**
- [backend/src/modules/notes/controllers/notes.controller.ts:50-56](file://backend/src/modules/notes/controllers/notes.controller.ts#L50-L56)

**Section sources**
- [backend/src/modules/notes/index.ts:7-11](file://backend/src/modules/notes/index.ts#L7-L11)
- [backend/src/modules/notes/controllers/notes.controller.ts:27-71](file://backend/src/modules/notes/controllers/notes.controller.ts#L27-L71)

## Hybrid Parent Management Module

**New** The Hybrid Parent Management Module provides seamless integration between legacy direct parent fields and modern responsible parent entities with intelligent fallback and automatic migration capabilities.

### Purpose
- Provide backward compatibility for existing student records with direct parent fields.
- Enable modern parent management through responsible parent entities with granular permissions.
- Support automatic migration during student conversion processes.
- Maintain data integrity and minimize disruption during system upgrades.

### Key Features
- **Intelligent Fallback System**: Automatically falls back to direct parent fields when responsible parent entities are unavailable.
- **Automatic Migration**: Converts direct parent fields to responsible parent entities during student conversion.
- **Dual Data Source Support**: Supports both legacy direct parent fields and modern responsible parent entities.
- **Granular Permissions**: Provides role-based access control for parent accounts.
- **Audit Trail Integration**: Maintains complete audit history for all parent management operations.
- **Backward Compatibility**: Ensures existing functionality continues to work without modification.

### Data Relationships
- **Legacy Direct Fields**: 15 deprecated parent-related fields in the Eleve entity.
- **Responsible Parent Entities**: Modern parent management through separate entities with user accounts.
- **Hybrid Logic**: Intelligent fallback system that prioritizes responsible parent entities with fallback to direct fields.
- **Migration Tracking**: Database views and procedures to track migration status and progress.

### User Workflows
- **Administrative Conversion**: Admin converts pre-registration records to full registration with automatic parent migration.
- **Intelligent Reading**: System automatically determines whether to use responsible parent entities or fallback to direct fields.
- **Permission Management**: Granular permissions for different parent account types (consultation, payment, etc.).
- **Multi-Parent Support**: Unlimited parent relationships per student with individual account management.

```mermaid
sequenceDiagram
participant Admin as "Administrator"
participant ElevesSvc as "ElevesService"
participant ParentsSvc as "ParentsService"
participant DB as "PostgreSQL"
Admin->>ElevesSvc : convertirPreinscriptionEnInscription()
ElevesSvc->>ParentsSvc : migrerDepuisChampsDirects()
ParentsSvc->>DB : check responsable-eleve records
DB-->>ParentsSvc : existing records
ParentsSvc->>DB : create new responsable-eleve
DB-->>ParentsSvc : created record
ParentsSvc-->>ElevesSvc : migration complete
ElevesSvc-->>Admin : conversion successful
```

**Diagram sources**
- [backend/src/modules/responsables-eleves/services/parents.service.ts](file://backend/src/modules/responsables-eleves/services/parents.service.ts)
- [backend/database/migrations/052-approche-hybride-parents.sql](file://backend/database/migrations/052-approche-hybride-parents.sql)

### Hybrid Parent System Architecture
The hybrid parent management module consists of several integrated components:

- **ParentsService**: Core service managing parent data operations with intelligent fallback logic.
- **Deprecated Field Handling**: Comprehensive documentation and migration guidance for legacy direct parent fields.
- **Migration Automation**: Scripts and procedures for automatic conversion of existing records.
- **Database Views**: SQL views for tracking migration status and parent relationship states.
- **Fallback Logic**: Intelligent decision-making system for choosing between data sources.

**Section sources**
- [backend/src/modules/responsables-eleves/services/parents.service.ts](file://backend/src/modules/responsables-eleves/services/parents.service.ts)
- [backend/src/modules/eleves/entities/eleve.entity.ts](file://backend/src/modules/eleves/entities/eleve.entity.ts)
- [backend/database/migrations/052-approche-hybride-parents.sql](file://backend/database/migrations/052-approche-hybride-parents.sql)
- [backend/scripts/migrate-parents.ts](file://backend/scripts/migrate-parents.ts)

## Dependency Analysis
Module routing and composition:
- The application factory imports and mounts controllers from all modules under /api/<module>.
- Controllers depend on services; services depend on entities and repositories.
- Shared middleware (security, logging, rate limiting) is applied globally.
- **Enhanced**: Hybrid parent management module integrates with student management and provides fallback capabilities.

```mermaid
graph LR
App["app.ts"] --> AuthCtrl["/api/auth/*"]
App --> ElevesCtrl["/api/eleves/*"]
App --> ClassesCtrl["/api/classes/*"]
App --> MatieresCtrl["/api/matieres/*"]
App --> NotesCtrl["/api/notes/*"]
App --> DashCtrl["/api/dashboard/*"]
App --> ParentsCtrl["/api/responsables-eleves/*"]
AuthCtrl --> AuthSvc["auth.service.ts"]
ElevesCtrl --> ElevesSvc["eleves.service.ts"]
ClassesCtrl --> ClassesSvc["classes.service.ts"]
MatieresCtrl --> MatieresSvc["matieres.service.ts"]
NotesCtrl --> NotesSvc["notes.service.ts"]
DashCtrl --> DashServices["dashboard services"]
ParentsCtrl --> ParentsSvc["parents.service.ts"]
DashServices --> RedisSvc["redis.service.ts"]
DashServices --> WidgetReg["widget-registry.ts"]
ParentsSvc --> ElevesEntity["eleve.entity.ts"]
```

**Diagram sources**
- [backend/src/app.ts:149-185](file://backend/src/app.ts#L149-L185)
- [backend/src/common/services/redis.service.ts](file://backend/src/common/services/redis.service.ts)

**Section sources**
- [backend/src/app.ts:149-185](file://backend/src/app.ts#L149-L185)

## Performance Considerations
- Middleware stack: Helmet, CORS, rate limiting, compression, and JSON parsing are configured early to reduce overhead and protect the server.
- Logging: Request logging interceptor helps monitor traffic and troubleshoot performance bottlenecks.
- Scalability: Modular design allows independent scaling of services and database connections; consider connection pooling and caching strategies for high-throughput endpoints.
- Validation: Zod-based DTO validation prevents malformed payloads and reduces error handling overhead.
- **Enhanced**: Hybrid parent management introduces optimized fallback mechanisms:
  - Intelligent caching for frequently accessed parent data
  - Batch processing for migration operations
  - Lazy loading for parent relationship resolution
  - Database view optimization for migration tracking
  - Minimal performance impact through efficient fallback logic

**Section sources**
- [backend/src/modules/dashboard/services/dashboard-cache.service.ts](file://backend/src/modules/dashboard/services/dashboard-cache.service.ts)
- [backend/src/modules/responsables-eleves/services/parents.service.ts](file://backend/src/modules/responsables-eleves/services/parents.service.ts)

## Troubleshooting Guide
Common areas to inspect:
- Health endpoint: Verify service availability and version metadata.
- Error handling: Global error filter and not-found handler centralize error responses.
- Logging: Request logger interceptor captures incoming requests for debugging.
- Environment configuration: Ensure environment variables are loaded and database connection parameters are correct.
- **Enhanced**: Hybrid parent management troubleshooting:
  - Migration script execution: Verify automatic migration processes are running correctly.
  - Fallback logic: Check intelligent fallback system for proper parent data resolution.
  - Deprecated field cleanup: Monitor progress of deprecated field migration.
  - Permission issues: Validate granular permissions for parent accounts.

Operational checks:
- Confirm database initialization and migrations are executed.
- Validate JWT secret and token expiration settings.
- Review RBAC guard enforcement for protected endpoints.
- **Enhanced**: Hybrid parent-specific checks:
  - Database migration status verification.
  - Fallback mechanism testing for legacy data.
  - Parent account creation and permission assignment.
  - Multi-parent relationship validation.

**Section sources**
- [backend/src/app.ts:124-143](file://backend/src/app.ts#L124-L143)
- [backend/src/app.ts:197-201](file://backend/src/app.ts#L197-L201)
- [backend/src/index.ts:25-27](file://backend/src/index.ts#L25-L27)
- [backend/database/migrations/052-approche-hybride-parents.sql](file://backend/database/migrations/052-approche-hybride-parents.sql)

## Conclusion
eLISAschool's modular backend provides a robust foundation for school administration across Sub-Saharan Africa. The architecture cleanly separates concerns, enforces security and access control, and organizes functionality into cohesive modules. The documented modules—authentication, students, classes, subjects, grading, dashboard system, and the new Hybrid Parent Management Module—cover core administrative needs with clear workflows and extensibility points. The Hybrid Parent Management Module introduces intelligent fallback capabilities, automatic migration automation, and backward compatibility that significantly enhances the platform's data management and user experience. Future enhancements can focus on expanding module coverage, implementing advanced caching strategies, optimizing bulk operations, and further enhancing the real-time dashboard experience while maintaining the seamless parent management capabilities.

## Appendices
- Technology stack: Node.js, Express.js, TypeScript, TypeORM, PostgreSQL with RLS, JWT, AES-256, RBAC, Redis, Server-Sent Events.
- Deployment: Docker Compose and development scripts are available for quick setup.
- **Enhanced**: Hybrid parent management dependencies include intelligent fallback logic, automatic migration scripts, and comprehensive database migration support.

**Section sources**
- [README.md:29-39](file://README.md#L29-L39)
- [backend/package.json:9-21](file://backend/package.json#L9-L21)
- [backend/database/migrations/010-dashboard-layouts.sql](file://backend/database/migrations/010-dashboard-layouts.sql)
- [backend/database/migrations/010/notification-providers.sql](file://backend/database/migrations/010/notification-providers.sql)
- [backend/database/migrations/052-approche-hybride-parents.sql](file://backend/database/migrations/052-approche-hybride-parents.sql)