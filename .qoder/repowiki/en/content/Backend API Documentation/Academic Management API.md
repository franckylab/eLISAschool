# Academic Management API

<cite>
**Referenced Files in This Document**
- [eleves.controller.ts](file://backend/src/modules/eleves/controllers/eleves.controller.ts)
- [eleves.dto.ts](file://backend/src/modules/eleves/dto/eleves.dto.ts)
- [eleve.entity.ts](file://backend/src/modules/eleves/entities/eleve.entity.ts)
- [classes.controller.ts](file://backend/src/modules/classes/controllers/classes.controller.ts)
- [niveaux.controller.ts](file://backend/src/modules/niveaux/controllers/niveaux.controller.ts)
- [matieres.controller.ts](file://backend/src/modules/matieres/controllers/matieres.controller.ts)
- [cycles.controller.ts](file://backend/src/modules/cycles/controllers/cycles.controller.ts)
- [cycles.dto.ts](file://backend/src/modules/cycles/dto/cycle.dto.ts)
- [cycles.entity.ts](file://backend/src/modules/cycles/entities/cycle.entity.ts)
- [filieres.controller.ts](file://backend/src/modules/filieres/controllers/filieres.controller.ts)
- [filieres.dto.ts](file://backend/src/modules/filieres/dto/filiere.dto.ts)
- [filieres.entity.ts](file://backend/src/modules/filieres/entities/filiere.entity.ts)
- [specialites.controller.ts](file://backend/src/modules/specialites/controllers/specialites.controller.ts)
- [specialites.dto.ts](file://backend/src/modules/specialites/dto/specialite.dto.ts)
- [specialites.entity.ts](file://backend/src/modules/specialites/entities/specialite.entity.ts)
- [competences.controller.ts](file://backend/src/modules/competences/controllers/competences.controller.ts)
- [competences.dto.ts](file://backend/src/modules/competences/dto/competence.dto.ts)
- [competences.entity.ts](file://backend/src/modules/competences/entities/competence.entity.ts)
- [annees-scolaires.controller.ts](file://backend/src/modules/annees-scolaires/controllers/annees-scolaires.controller.ts)
- [periodes.controller.ts](file://backend/src/modules/periodes/controllers/periodes.controller.ts)
- [etablissement.controller.ts](file://backend/src/modules/etablissement/controllers/etablissement.controller.ts)
- [etablissement.service.ts](file://backend/src/modules/etablissement/services/etablissement.service.ts)
- [bulletins.controller.ts](file://backend/src/modules/bulletins/controllers/bulletins.controller.ts)
- [notes.controller.ts](file://backend/src/modules/notes/controllers/notes.controller.ts)
- [notes.service.ts](file://backend/src/modules/notes/services/notes.service.ts)
- [validation-workflow.controller.ts](file://backend/src/modules/validation-workflow/controllers/validation-workflow.controller.ts)
- [validation-workflow.service.ts](file://backend/src/modules/validation-workflow/services/validation-workflow.service.ts)
- [auth.middleware.ts](file://backend/src/modules/auth/middlewares/auth.middleware.ts)
- [role.middleware.ts](file://backend/src/modules/auth/middlewares/role.middleware.ts)
- [permission.guard.ts](file://backend/src/modules/auth/guards/permission.guard.ts)
- [error.filter.ts](file://backend/src/common/filters/error.filter.ts)
- [request-logger.interceptor.ts](file://backend/src/common/interceptors/request-logger.interceptor.ts)
- [app.ts](file://backend/src/app.ts)
- [index.ts](file://backend/src/index.ts)
</cite>

## Update Summary
**Changes Made**
- Added new establishment statistical endpoints: GET /api/etablissements/stats and GET /api/etablissements/:id/stats
- Enhanced establishment management with comprehensive analytics capabilities
- Updated endpoint documentation to include new statistics endpoints
- Added new establishment statistics types and schemas

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Validation Workflow System](#validation-workflow-system)
7. [Establishment Statistics System](#establishment-statistics-system)
8. [Dependency Analysis](#dependency-analysis)
9. [Performance Considerations](#performance-considerations)
10. [Troubleshooting Guide](#troubleshooting-guide)
11. [Conclusion](#conclusion)
12. [Appendices](#appendices)

## Introduction
This document provides comprehensive API documentation for the Academic Management module of the eLISAschool platform. The module has been enhanced with new Specialities and Competences management capabilities, replacing the previous TypeCycles system, and now includes comprehensive establishment statistics functionality. It covers endpoints for students, classes, levels, subjects, cycles, academic years, periods, establishment management, specialities, competences, establishment statistics, and the integrated validation workflow system. For each endpoint, we specify HTTP methods, URL patterns, request/response schemas, business rule validations, and operational workflows such as enrollment, class assignments, subject allocations, grading periods, institutional hierarchy management, establishment analytics, and automated validation processes. The documentation also outlines data relationships between academic entities, validation rules, workflow automation, and reporting capabilities, with examples of academic workflow integrations and administrative operations.

## Project Structure
The Academic Management module is organized by domain entities under the backend/src/modules directory. Each domain includes:
- Controllers: Express routers exposing HTTP endpoints
- DTOs: Validation schemas for request/response payloads
- Entities: Data models representing academic entities
- Services: Business logic implementations
- Guards/Middlewares: Authentication and authorization enforcement

```mermaid
graph TB
subgraph "Academic Modules"
E["ElevesController<br/>Students"]
C["ClassesController<br/>Classes"]
N["NiveauxController<br/>Levels"]
M["MatieresController<br/>Subjects"]
Y["AnneesScolairesController<br/>Academic Years"]
P["PeriodesController<br/>Periods"]
X["CyclesController<br/>Cycles"]
F["FilieresController<br/>Program Streams"]
S["SpecialitesController<br/>Specialities"]
B["BulletinsController<br/>Reports"]
T["NotesController<br/>Grades"]
COMP["CompetencesController<br/>Competences"]
END["EtablissementController<br/>Establishment Stats"]
end
subgraph "Validation Workflow System"
VW["ValidationWorkflowController<br/>Validation Workflows"]
end
subgraph "Auth & Common"
AM["Auth Middleware"]
RM["Role Middleware"]
PG["Permission Guard"]
EF["Error Filter"]
RI["Request Logger Interceptor"]
end
E --> AM
E --> RM
E --> PG
E --> EF
E --> RI
C --> AM
C --> RM
C --> PG
C --> EF
C --> RI
N --> AM
N --> RM
N --> PG
N --> EF
N --> RI
M --> AM
M --> RM
M --> PG
M --> EF
M --> RI
Y --> AM
Y --> RM
Y --> PG
Y --> EF
Y --> RI
P --> AM
P --> RM
P --> PG
P --> EF
P --> RI
X --> AM
X --> RM
X --> PG
X --> EF
X --> RI
F --> AM
F --> RM
F --> PG
F --> EF
F --> RI
S --> AM
S --> RM
S --> PG
S --> EF
S --> RI
B --> AM
B --> RM
B --> PG
B --> EF
B --> RI
T --> AM
T --> RM
T --> PG
T --> EF
T --> RI
COMP --> AM
COMP --> RM
COMP --> PG
COMP --> EF
COMP --> RI
VW --> AM
VW --> RM
VW --> PG
VW --> EF
VW --> RI
END --> AM
END --> RM
END --> PG
END --> EF
END --> RI
```

**Diagram sources**
- [eleves.controller.ts:1-58](file://backend/src/modules/eleves/controllers/eleves.controller.ts#L1-L58)
- [classes.controller.ts](file://backend/src/modules/classes/controllers/classes.controller.ts)
- [niveaux.controller.ts](file://backend/src/modules/niveaux/controllers/niveaux.controller.ts)
- [matieres.controller.ts](file://backend/src/modules/matieres/controllers/matieres.controller.ts)
- [cycles.controller.ts](file://backend/src/modules/cycles/controllers/cycles.controller.ts)
- [filieres.controller.ts](file://backend/src/modules/filieres/controllers/filieres.controller.ts)
- [specialites.controller.ts](file://backend/src/modules/specialites/controllers/specialites.controller.ts)
- [competences.controller.ts](file://backend/src/modules/competences/controllers/competences.controller.ts)
- [annees-scolaires.controller.ts](file://backend/src/modules/annees-scolaires/controllers/annees-scolaires.controller.ts)
- [periodes.controller.ts](file://backend/src/modules/periodes/controllers/periodes.controller.ts)
- [etablissement.controller.ts](file://backend/src/modules/etablissement/controllers/etablissement.controller.ts)
- [bulletins.controller.ts](file://backend/src/modules/bulletins/controllers/bulletins.controller.ts)
- [notes.controller.ts](file://backend/src/modules/notes/controllers/notes.controller.ts)
- [validation-workflow.controller.ts](file://backend/src/modules/validation-workflow/controllers/validation-workflow.controller.ts)
- [auth.middleware.ts](file://backend/src/modules/auth/middlewares/auth.middleware.ts)
- [role.middleware.ts](file://backend/src/modules/auth/middlewares/role.middleware.ts)
- [permission.guard.ts](file://backend/src/modules/auth/guards/permission.guard.ts)
- [error.filter.ts](file://backend/src/common/filters/error.filter.ts)
- [request-logger.interceptor.ts](file://backend/src/common/interceptors/request-logger.interceptor.ts)

**Section sources**
- [app.ts](file://backend/src/app.ts)
- [index.ts](file://backend/src/index.ts)

## Core Components
This section documents the primary academic management endpoints and their associated schemas and validations.

### Students (Eleves)
- Base URL: `/api/eleves`
- Methods:
  - GET /: List all students with optional subsystem filter
  - POST /: Create a new student
  - PATCH /:id: Update an existing student
  - DELETE /:id: Delete a student record
- Authentication and Roles:
  - Requires authentication middleware
  - Allowed roles: ADMIN, SUPER_ADMIN, CHEF_ETABLISSEMENT, PERSONNEL for GET; ADMIN, SUPER_ADMIN, PERSONNEL for POST/PATCH; ADMIN, SUPER_ADMIN for DELETE
- Request/Response Schemas:
  - Creation and update schemas validated via Zod DTOs
  - Responses include success flag and data payload
- Business Rules:
  - Validation errors return structured error response
  - Deletion requires elevated privileges

**Section sources**
- [eleves.controller.ts:25-54](file://backend/src/modules/eleves/controllers/eleves.controller.ts#L25-L54)
- [eleves.dto.ts](file://backend/src/modules/eleves/dto/eleves.dto.ts)
- [eleve.entity.ts](file://backend/src/modules/eleves/entities/eleve.entity.ts)

### Classes (Classes)
- Base URL: `/api/classes`
- Methods:
  - GET /: List classes
  - POST /: Create a class
  - PATCH /:id: Update a class
  - DELETE /:id: Delete a class
- Authentication and Roles:
  - Requires authentication middleware
  - Allowed roles: ADMIN, SUPER_ADMIN, CHEF_ETABLISSEMENT, PERSONNEL
- Request/Response Schemas:
  - DTO validation enforced
  - Responses include success flag and data payload
- Business Rules:
  - Validation errors return structured error response

**Section sources**
- [classes.controller.ts](file://backend/src/modules/classes/controllers/classes.controller.ts)

### Levels (Niveaux)
- Base URL: `/api/niveaux`
- Methods:
  - GET /: List levels
  - POST /: Create a level
  - PATCH /:id: Update a level
  - DELETE /:id: Delete a level
- Authentication and Roles:
  - Requires authentication middleware
  - Allowed roles: ADMIN, SUPER_ADMIN, CHEF_ETABLISSEMENT, PERSONNEL
- Request/Response Schemas:
  - DTO validation enforced
  - Responses include success flag and data payload
- Business Rules:
  - Validation errors return structured error response

**Section sources**
- [niveaux.controller.ts](file://backend/src/modules/niveaux/controllers/niveaux.controller.ts)

### Subjects (Matieres)
- Base URL: `/api/matieres`
- Methods:
  - GET /: List subjects
  - POST /: Create a subject
  - PATCH /:id: Update a subject
  - DELETE /:id: Delete a subject
- Authentication and Roles:
  - Requires authentication middleware
  - Allowed roles: ADMIN, SUPER_ADMIN, CHEF_ETABLISSEMENT, PERSONNEL
- Request/Response Schemas:
  - DTO validation enforced
  - Responses include success flag and data payload
- Business Rules:
  - Validation errors return structured error response

**Section sources**
- [matieres.controller.ts](file://backend/src/modules/matieres/controllers/matieres.controller.ts)

### Cycles (Updated)
- Base URL: `/api/cycles`
- Methods:
  - GET /: List cycles with enriched fields (description, duration, diploma)
  - POST /: Create a cycle with enhanced properties
  - PATCH /:id: Update a cycle with enriched fields
  - DELETE /:id: Delete a cycle
- Authentication and Roles:
  - Requires authentication middleware
  - Allowed roles: ADMIN, SUPER_ADMIN, CHEF_ETABLISSEMENT, PERSONNEL
- Request/Response Schemas:
  - DTO validation enforced with new cycle fields
  - Responses include success flag and data payload
- Business Rules:
  - Validation errors return structured error response
  - **Updated**: Integrated competences/specialites functionality previously handled by separate types-cycles module

**Section sources**
- [cycles.controller.ts](file://backend/src/modules/cycles/controllers/cycles.controller.ts)
- [cycles.dto.ts](file://backend/src/modules/cycles/dto/cycle.dto.ts)
- [cycles.entity.ts](file://backend/src/modules/cycles/entities/cycle.entity.ts)

### Program Streams (Filieres)
- Base URL: `/api/filieres`
- Methods:
  - GET /: List program streams
  - POST /: Create a program stream
  - PATCH /:id: Update a program stream
  - DELETE /:id: Delete a program stream
- Authentication and Roles:
  - Requires authentication middleware
  - Allowed roles: ADMIN, SUPER_ADMIN, CHEF_ETABLISSEMENT, PERSONNEL
- Request/Response Schemas:
  - DTO validation enforced
  - Responses include success flag and data payload
- Business Rules:
  - Validation errors return structured error response

**Section sources**
- [filieres.controller.ts](file://backend/src/modules/filieres/controllers/filieres.controller.ts)
- [filieres.dto.ts](file://backend/src/modules/filieres/dto/filiere.dto.ts)
- [filieres.entity.ts](file://backend/src/modules/filieres/entities/filiere.entity.ts)

### Specialities (Spécialités) - New
- Base URL: `/api/specialites`
- Methods:
  - GET /: List specialities with stream filtering
  - POST /: Create a speciality
  - PATCH /:id: Update a speciality
  - DELETE /:id: Delete a speciality
- Authentication and Roles:
  - Requires authentication middleware
  - Allowed roles: ADMIN, SUPER_ADMIN, CHEF_ETABLISSEMENT, PERSONNEL
- Request/Response Schemas:
  - DTO validation enforced with speciality-specific fields
  - Responses include success flag and data payload
- Business Rules:
  - Validation errors return structured error response
  - **New**: Technical specialization management for MINESEC-compliant programs

**Section sources**
- [specialites.controller.ts](file://backend/src/modules/specialites/controllers/specialites.controller.ts)
- [specialites.dto.ts](file://backend/src/modules/specialites/dto/specialite.dto.ts)
- [specialites.entity.ts](file://backend/src/modules/specialites/entities/specialite.entity.ts)

### Competences (Updated)
- Base URL: `/api/competences`
- Methods:
  - GET /: List competences with competency framework filtering
  - POST /: Create a competence
  - PATCH /:id: Update a competence
  - DELETE /:id: Delete a competence
- Authentication and Roles:
  - Requires authentication middleware
  - Allowed roles: ADMIN, SUPER_ADMIN, CHEF_ETABLISSEMENT, PERSONNEL
- Request/Response Schemas:
  - DTO validation enforced with competence-specific fields
  - Responses include success flag and data payload
- Business Rules:
  - Validation errors return structured error response
  - **New**: Competency-based learning management aligned with APC framework

**Section sources**
- [competences.controller.ts](file://backend/src/modules/competences/controllers/competences.controller.ts)
- [competences.dto.ts](file://backend/src/modules/competences/dto/competence.dto.ts)
- [competences.entity.ts](file://backend/src/modules/competences/entities/competence.entity.ts)

### Academic Years (AnneesScolaires)
- Base URL: `/api/annees-scolaires`
- Methods:
  - GET /: List academic years
  - POST /: Create an academic year
  - PATCH /:id: Update an academic year
  - DELETE /:id: Delete an academic year
- Authentication and Roles:
  - Requires authentication middleware
  - Allowed roles: ADMIN, SUPER_ADMIN, CHEF_ETABLISSEMENT, PERSONNEL
- Request/Response Schemas:
  - DTO validation enforced
  - Responses include success flag and data payload
- Business Rules:
  - Validation errors return structured error response

**Section sources**
- [annees-scolaires.controller.ts](file://backend/src/modules/annees-scolaires/controllers/annees-scolaires.controller.ts)

### Periods (Periodes)
- Base URL: `/api/periodes`
- Methods:
  - GET /: List periods
  - POST /: Create a period
  - PATCH /:id: Update a period
  - DELETE /:id: Delete a period
- Authentication and Roles:
  - Requires authentication middleware
  - Allowed roles: ADMIN, SUPER_ADMIN, CHEF_ETABLISSEMENT, PERSONNEL
- Request/Response Schemas:
  - DTO validation enforced
  - Responses include success flag and data payload
- Business Rules:
  - Validation errors return structured error response

**Section sources**
- [periodes.controller.ts](file://backend/src/modules/periodes/controllers/periodes.controller.ts)

### Establishment (Etablissement) - Enhanced
- Base URL: `/api/etablissement`
- Methods:
  - GET /: Retrieve establishment details
  - PATCH /: Update establishment details
  - GET /stats: Retrieve global establishment statistics (SUPER_ADMIN only)
  - GET /:id/stats: Retrieve detailed establishment metrics
- Authentication and Roles:
  - Requires authentication middleware
  - Allowed roles: ADMIN, SUPER_ADMIN, CHEF_ETABLISSEMENT for basic operations; SUPER_ADMIN for statistics
- Request/Response Schemas:
  - DTO validation enforced
  - Statistics responses include comprehensive analytics data
- Business Rules:
  - Validation errors return structured error response
  - Statistics endpoints require elevated privileges
  - Global statistics require SUPER_ADMIN role

**Updated** Added comprehensive statistics endpoints for establishment analytics

**Section sources**
- [etablissement.controller.ts](file://backend/src/modules/etablissement/controllers/etablissement.controller.ts)

### Reports (Bulletins)
- Base URL: `/api/bulletins`
- Methods:
  - GET /: List reports
  - POST /: Create a report
  - PATCH /:id: Update a report
  - DELETE /:id: Delete a report
- Authentication and Roles:
  - Requires authentication middleware
  - Allowed roles: ADMIN, SUPER_ADMIN, CHEF_ETABLISSEMENT, PERSONNEL
- Request/Response Schemas:
  - DTO validation enforced
  - Responses include success flag and data payload
- Business Rules:
  - Validation errors return structured error response

**Section sources**
- [bulletins.controller.ts](file://backend/src/modules/bulletins/controllers/bulletins.controller.ts)

### Grades (Notes) - Enhanced
- Base URL: `/api/notes`
- Methods:
  - GET /: List grades
  - POST /: Create a grade (automatically creates validation workflow)
  - PATCH /:id: Update a grade (intelligent validation routing based on status changes)
  - DELETE /:id: Delete a grade
- Authentication and Roles:
  - Requires authentication middleware
  - Allowed roles: ADMIN, SUPER_ADMIN, CHEF_ETABLISSEMENT, PERSONNEL
- Request/Response Schemas:
  - DTO validation enforced
  - Responses include success flag and data payload
- Business Rules:
  - Validation errors return structured error response
  - Automatic workflow creation upon grade creation
  - Intelligent validation routing based on status changes
  - Status synchronization with validation workflow state

**Updated** Enhanced with automatic validation workflow creation and intelligent status-based routing

**Section sources**
- [notes.controller.ts](file://backend/src/modules/notes/controllers/notes.controller.ts)
- [notes.service.ts](file://backend/src/modules/notes/services/notes.service.ts)

## Architecture Overview
The Academic Management API follows a layered architecture with integrated validation workflow support, enhanced academic structure management, and comprehensive establishment statistics capabilities:
- Controllers handle HTTP requests, enforce authentication/authorization, and delegate to services
- Services encapsulate business logic and coordinate with repositories/entities
- DTOs validate request/response payloads
- Validation workflow service manages automated approval processes
- Statistics service provides comprehensive establishment analytics
- Middlewares and guards enforce authentication and role-based access
- Filters and interceptors standardize error handling and logging
- **Updated**: Integrated competences and specialities modules provide comprehensive academic framework management
- **Updated**: Statistics endpoints enable real-time establishment analytics and reporting

```mermaid
graph TB
Client["Client"]
Ctrl["Controllers"]
AuthMW["Auth Middleware"]
RoleMW["Role Middleware"]
Guard["Permission Guard"]
Service["Services"]
ValidationService["Validation Workflow Service"]
StatsService["Statistics Service"]
CompetenceService["Competence Service"]
SpecialiteService["Specialite Service"]
DTO["DTOs"]
Entity["Entities"]
Filter["Error Filter"]
Interceptor["Request Logger Interceptor"]
Client --> Ctrl
Ctrl --> AuthMW
Ctrl --> RoleMW
Ctrl --> Guard
Ctrl --> Service
Service --> ValidationService
Service --> StatsService
Service --> DTO
Service --> Entity
Service --> CompetenceService
Service --> SpecialiteService
Ctrl --> Filter
Ctrl --> Interceptor
```

**Diagram sources**
- [eleves.controller.ts:1-58](file://backend/src/modules/eleves/controllers/eleves.controller.ts#L1-L58)
- [auth.middleware.ts](file://backend/src/modules/auth/middlewares/auth.middleware.ts)
- [role.middleware.ts](file://backend/src/modules/auth/middlewares/role.middleware.ts)
- [permission.guard.ts](file://backend/src/modules/auth/guards/permission.guard.ts)
- [error.filter.ts](file://backend/src/common/filters/error.filter.ts)
- [request-logger.interceptor.ts](file://backend/src/common/interceptors/request-logger.interceptor.ts)
- [validation-workflow.service.ts](file://backend/src/modules/validation-workflow/services/validation-workflow.service.ts)
- [etablissement.service.ts](file://backend/src/modules/etablissement/services/etablissement.service.ts)
- [competences.controller.ts](file://backend/src/modules/competences/controllers/competences.controller.ts)
- [specialites.controller.ts](file://backend/src/modules/specialites/controllers/specialites.controller.ts)

## Detailed Component Analysis

### Student Enrollment Workflow
This workflow demonstrates enrollment, class assignment, and subject allocation.

```mermaid
sequenceDiagram
participant Admin as "Admin"
participant ElevesCtrl as "ElevesController"
participant ElevesSvc as "ElevesService"
participant ClassesCtrl as "ClassesController"
participant MatieresCtrl as "MatieresController"
Admin->>ElevesCtrl : POST /api/eleves
ElevesCtrl->>ElevesCtrl : validate(createEleveSchema)
ElevesCtrl->>ElevesSvc : create(dto)
ElevesSvc-->>ElevesCtrl : created student
ElevesCtrl-->>Admin : 201 Created
Admin->>ClassesCtrl : PATCH /api/classes/ : id (assign student)
ClassesCtrl->>ClassesCtrl : validate(class DTO)
ClassesCtrl-->>Admin : 200 OK
Admin->>MatieresCtrl : PATCH /api/matieres/ : id (allocate subject)
MatieresCtrl->>MatieresCtrl : validate(subject DTO)
MatieresCtrl-->>Admin : 200 OK
```

**Diagram sources**
- [eleves.controller.ts:33-39](file://backend/src/modules/eleves/controllers/eleves.controller.ts#L33-L39)
- [classes.controller.ts](file://backend/src/modules/classes/controllers/classes.controller.ts)
- [matieres.controller.ts](file://backend/src/modules/matieres/controllers/matieres.controller.ts)

### Academic Year and Period Management
Academic year and period management ensures proper scheduling and grading periods.

```mermaid
sequenceDiagram
participant Admin as "Admin"
participant AnneesCtrl as "AnneesScolairesController"
participant PeriodesCtrl as "PeriodesController"
Admin->>AnneesCtrl : POST /api/annees-scolaires
AnnieCtrl->>AnneesCtrl : validate(academic year DTO)
AnnieCtrl-->>Admin : 201 Created
Admin->>PeriodesCtrl : POST /api/periodes
PeriodesCtrl->>PeriodesCtrl : validate(period DTO)
PeriodesCtrl-->>Admin : 201 Created
```

**Diagram sources**
- [annees-scolaires.controller.ts](file://backend/src/modules/annees-scolaires/controllers/annees-scolaires.controller.ts)
- [periodes.controller.ts](file://backend/src/modules/periodes/controllers/periodes.controller.ts)

### Enhanced Academic Structure Management
The enhanced academic structure now includes competences and specialities management integrated into the cycles system.

```mermaid
sequenceDiagram
participant Admin as "Admin"
participant CyclesCtrl as "CyclesController"
participant FilieresCtrl as "FilieresController"
participant SpecialitesCtrl as "SpecialitesController"
participant CompetencesCtrl as "CompetencesController"
Admin->>CyclesCtrl : POST /api/cycles (enriched with description, duration, diploma)
CyclesCtrl->>CyclesCtrl : validate(enriched cycle DTO)
CyclesCtrl-->>Admin : 201 Created
Admin->>FilieresCtrl : POST /api/filieres
FilieresCtrl->>FilieresCtrl : validate(stream DTO)
FilieresCtrl-->>Admin : 201 Created
Admin->>SpecialitesCtrl : POST /api/specialites
SpecialitesCtrl->>SpecialitesCtrl : validate(speciality DTO)
SpecialitesCtrl-->>Admin : 201 Created
Admin->>CompetencesCtrl : POST /api/competences
CompetencesCtrl->>CompetencesCtrl : validate(competence DTO)
CompetencesCtrl-->>Admin : 201 Created
```

**Updated** Added competences and specialities management to the academic structure

**Diagram sources**
- [cycles.controller.ts](file://backend/src/modules/cycles/controllers/cycles.controller.ts)
- [filieres.controller.ts](file://backend/src/modules/filieres/controllers/filieres.controller.ts)
- [specialites.controller.ts](file://backend/src/modules/specialites/controllers/specialites.controller.ts)
- [competences.controller.ts](file://backend/src/modules/competences/controllers/competences.controller.ts)

### Establishment Hierarchy Management
Establishment-level updates manage institutional hierarchy and policies.

```mermaid
sequenceDiagram
participant Admin as "Admin"
participant EtabCtrl as "EtablissementController"
Admin->>EtabCtrl : PATCH /api/etablissement
EtabCtrl->>EtabCtrl : validate(estab DTO)
EtabCtrl-->>Admin : 200 OK
```

**Diagram sources**
- [etablissement.controller.ts](file://backend/src/modules/etablissement/controllers/etablissement.controller.ts)

### Establishment Statistics Analytics
The establishment statistics system provides comprehensive analytics for institutional performance monitoring.

```mermaid
sequenceDiagram
participant SuperAdmin as "Super Admin"
participant EtabStatsCtrl as "EtablissementStatsController"
participant EtabStatsSvc as "EtablissementStatsService"
SuperAdmin->>EtabStatsCtrl : GET /api/etablissements/stats
EtabStatsCtrl->>EtabStatsCtrl : authenticate(SUPER_ADMIN)
EtabStatsCtrl->>EtabStatsSvc : getStats()
EtabStatsSvc->>EtabStatsSvc : aggregateGlobalStats()
EtabStatsSvc-->>EtabStatsCtrl : comprehensiveStats
EtabStatsCtrl-->>SuperAdmin : 200 OK (global statistics)
SuperAdmin->>EtabStatsCtrl : GET /api/etablissements/ : id/stats
EtabStatsCtrl->>EtabStatsCtrl : authenticate(user)
EtabStatsCtrl->>EtabStatsSvc : getEtablissementStats(id)
EtabStatsSvc->>EtabStatsSvc : fetchEtablissementData(id)
EtabStatsSvc->>EtabStatsSvc : calculateMetrics()
EtabStatsSvc-->>EtabStatsCtrl : detailedStats
EtabStatsCtrl-->>SuperAdmin : 200 OK (detailed establishment metrics)
```

**Updated** Added comprehensive establishment statistics workflow

**Diagram sources**
- [etablissement.controller.ts](file://backend/src/modules/etablissement/controllers/etablissement.controller.ts)
- [etablissement.service.ts](file://backend/src/modules/etablissement/services/etablissement.service.ts)

### Enhanced Grade Validation Workflow
The enhanced notes module now integrates with validation workflows for automatic approval processes.

```mermaid
sequenceDiagram
participant Teacher as "Teacher"
participant NotesCtrl as "NotesController"
participant NotesSvc as "NotesService"
participant ValidationSvc as "ValidationWorkflowService"
participant Admin as "Administrator"
Teacher->>NotesCtrl : POST /api/notes (create grade)
NotesCtrl->>NotesSvc : create(noteDto)
NotesSvc->>ValidationSvc : createWorkflow('notes', noteId)
ValidationSvc-->>NotesSvc : workflowCreated
NotesSvc-->>NotesCtrl : gradeCreated + workflow
NotesCtrl-->>Teacher : 201 Created (BROUILLON status)
Teacher->>NotesCtrl : PATCH /api/notes/ : id (change to VALIDEE)
NotesCtrl->>NotesSvc : update(validatedDto)
NotesSvc->>ValidationSvc : findByModuleAndEntite('notes', noteId)
ValidationSvc-->>NotesSvc : workflowFound
NotesSvc->>ValidationSvc : traiterValidation(workflowId, APPROUVE)
ValidationSvc-->>NotesSvc : workflowCompleted
NotesSvc->>NotesSvc : update note status to PUBLIEE
NotesSvc-->>NotesCtrl : gradeUpdated
NotesCtrl-->>Teacher : 200 OK (PUBLIEE status)
```

**Updated** Added validation workflow integration for automatic approval processes

**Diagram sources**
- [notes.controller.ts](file://backend/src/modules/notes/controllers/notes.controller.ts)
- [notes.service.ts](file://backend/src/modules/notes/services/notes.service.ts)
- [validation-workflow.service.ts](file://backend/src/modules/validation-workflow/services/validation-workflow.service.ts)

### Validation and Error Handling Flow
Validation and error handling are centralized across controllers with enhanced workflow integration.

```mermaid
flowchart TD
Start(["Request Received"]) --> Auth["Auth Middleware"]
Auth --> Roles["Role Middleware"]
Roles --> Validate["DTO Validation"]
Validate --> Valid{"Valid?"}
Valid --> |No| Error["AppError (400 VALIDATION_ERROR)"]
Valid --> |Yes| ServiceCall["Service Operation"]
ServiceCall --> WorkflowCheck{"Workflow Required?"}
WorkflowCheck --> |Yes| WorkflowProcess["Validation Workflow Process"]
WorkflowCheck --> |No| DirectUpdate["Direct Update"]
WorkflowProcess --> StatusSync["Status Synchronization"]
DirectUpdate --> Success["Success Response"]
StatusSync --> Success
Error --> End(["End"])
Success --> End
```

**Updated** Added workflow processing step for validation-integrated operations

**Diagram sources**
- [eleves.controller.ts:17-23](file://backend/src/modules/eleves/controllers/eleves.controller.ts#L17-L23)
- [error.filter.ts](file://backend/src/common/filters/error.filter.ts)
- [notes.service.ts](file://backend/src/modules/notes/services/notes.service.ts)

## Validation Workflow System
The validation workflow system provides automated approval processes for academic data with intelligent routing and status management.

### Core Validation Workflow Endpoints
- Base URL: `/api/validation-workflows`
- Methods:
  - GET /check/:module/:entityId: Check if an entity is validated
  - PUT /config/:module: Configure validation roles for a module
  - GET /stats/:module: Get validation statistics for a module

### Automatic Workflow Creation
When creating grades (notes), the system automatically creates a validation workflow with appropriate routing based on the establishment's configuration.

### Intelligent Validation Routing
The system intelligently routes validation decisions based on:
- Module-specific validation requirements
- User role hierarchy
- Establishment configuration
- Status change patterns

### Validation Workflow Types
- Simple Validation (1 level): Basic approval processes
- Standard Validation (2 levels): Academic approvals with supervisor review
- Advanced Validation (3 levels): Critical academic decisions
- Validation with Rejection: Flexible approval process with correction capability

**Section sources**
- [validation-workflow.controller.ts](file://backend/src/modules/validation-workflow/controllers/validation-workflow.controller.ts)
- [validation-workflow.service.ts](file://backend/src/modules/validation-workflow/services/validation-workflow.service.ts)

## Establishment Statistics System
The establishment statistics system provides comprehensive analytics for institutional performance monitoring with both global and detailed metrics.

### Statistics Endpoints
- Base URL: `/api/etablissements`
- Methods:
  - GET /stats: Retrieve global establishment statistics (SUPER_ADMIN only)
  - GET /:id/stats: Retrieve detailed establishment metrics

### Global Statistics Endpoint
- **GET /api/etablissements/stats**
- **Authentication**: SUPER_ADMIN required
- **Purpose**: Provides comprehensive analytics across all establishments
- **Response**: Includes enrollment statistics, academic performance, infrastructure metrics, and administrative data
- **Business Rules**: 
  - Only accessible to users with SUPER_ADMIN role
  - Aggregates data from all establishment instances
  - Returns comprehensive statistical overview

### Detailed Statistics Endpoint
- **GET /api/etablissements/:id/stats**
- **Authentication**: Requires authentication
- **Purpose**: Provides establishment-specific metrics and analytics
- **Response**: Includes detailed enrollment data, academic performance indicators, resource utilization, and comparative metrics
- **Business Rules**:
  - Access controlled by user permissions
  - Returns establishment-specific analytics
  - Includes comparative benchmarks

### Statistics Data Categories
The establishment statistics system provides analytics across multiple domains:

#### Academic Statistics
- Student enrollment counts and distributions
- Class size metrics and capacity utilization
- Academic performance indicators
- Subject allocation statistics

#### Administrative Statistics
- Establishment type and subsystem distributions
- Infrastructure capacity metrics
- Resource allocation patterns

#### Financial Statistics
- Budget utilization and expenditure patterns
- Revenue generation metrics
- Cost allocation and efficiency indicators

#### Performance Metrics
- Academic achievement benchmarks
- Attendance and engagement indicators
- Infrastructure utilization rates

**Section sources**
- [etablissement.controller.ts](file://backend/src/modules/etablissement/controllers/etablissement.controller.ts)
- [etablissement.service.ts](file://backend/src/modules/etablissement/services/etablissement.service.ts)

## Dependency Analysis
The Academic Management module relies on shared authentication and common utilities for consistent behavior across endpoints, with enhanced integration for validation workflows, new competences/specialities management, and comprehensive establishment statistics.

```mermaid
graph TB
ElevesCtrl["ElevesController"] --> AuthMW["Auth Middleware"]
ElevesCtrl --> RoleMW["Role Middleware"]
ElevesCtrl --> Guard["Permission Guard"]
ElevesCtrl --> ErrorF["Error Filter"]
ElevesCtrl --> LoggerI["Request Logger Interceptor"]
ElevesCtrl --> ElevesDTO["Eleves DTO"]
ElevesCtrl --> EleveEntity["Eleve Entity"]
NotesCtrl["NotesController"] --> ValidationService["Validation Workflow Service"]
NotesCtrl --> NotesService["Notes Service"]
ValidationService --> WorkflowEntity["Workflow Validation Entity"]
SpecialitesCtrl["SpecialitesController"] --> SpecialitesService["Specialites Service"]
SpecialitesService --> SpecialiteEntity["Specialite Entity"]
CompetencesCtrl["CompetencesController"] --> CompetencesService["Competences Service"]
CompetencesService --> CompetenceEntity["Competence Entity"]
CyclesCtrl["CyclesController"] --> CyclesService["Cycles Service"]
CyclesService --> CycleEntity["Cycle Entity"]
EtabStatsCtrl["EtablissementStatsController"] --> EtabStatsService["EtablissementStats Service"]
EtabStatsService --> StatsEntity["Statistics Entity"]
```

**Updated** Added establishment statistics service integration for comprehensive analytics

**Diagram sources**
- [eleves.controller.ts:1-58](file://backend/src/modules/eleves/controllers/eleves.controller.ts#L1-L58)
- [notes.controller.ts](file://backend/src/modules/notes/controllers/notes.controller.ts)
- [specialites.controller.ts](file://backend/src/modules/specialites/controllers/specialites.controller.ts)
- [competences.controller.ts](file://backend/src/modules/competences/controllers/competences.controller.ts)
- [cycles.controller.ts](file://backend/src/modules/cycles/controllers/cycles.controller.ts)
- [etablissement.controller.ts](file://backend/src/modules/etablissement/controllers/etablissement.controller.ts)
- [validation-workflow.service.ts](file://backend/src/modules/validation-workflow/services/validation-workflow.service.ts)
- [auth.middleware.ts](file://backend/src/modules/auth/middlewares/auth.middleware.ts)
- [role.middleware.ts](file://backend/src/modules/auth/middlewares/role.middleware.ts)
- [permission.guard.ts](file://backend/src/modules/auth/guards/permission.guard.ts)
- [error.filter.ts](file://backend/src/common/filters/error.filter.ts)
- [request-logger.interceptor.ts](file://backend/src/common/interceptors/request-logger.interceptor.ts)
- [eleves.dto.ts](file://backend/src/modules/eleves/dto/eleves.dto.ts)
- [eleve.entity.ts](file://backend/src/modules/eleves/entities/eleve.entity.ts)

**Section sources**
- [eleves.controller.ts:1-58](file://backend/src/modules/eleves/controllers/eleves.controller.ts#L1-L58)
- [notes.service.ts](file://backend/src/modules/notes/services/notes.service.ts)
- [specialites.controller.ts](file://backend/src/modules/specialites/controllers/specialites.controller.ts)
- [competences.controller.ts](file://backend/src/modules/competences/controllers/competences.controller.ts)
- [etablissement.controller.ts](file://backend/src/modules/etablissement/controllers/etablissement.controller.ts)

## Performance Considerations
- Centralized validation reduces redundant checks and improves error consistency
- Logging interceptor enables request tracing without modifying controller logic
- Role-based access control minimizes unauthorized operations and reduces downstream failures
- DTO-driven validation prevents malformed payloads and reduces service-level error handling overhead
- **Enhanced** Validation workflow integration optimizes approval processes and reduces manual intervention
- **Enhanced** Automatic workflow creation eliminates manual setup overhead for academic data
- **Enhanced** Integrated competences and specialities modules provide unified academic framework management
- **Enhanced** Statistics service implements efficient aggregation algorithms for real-time analytics
- **Enhanced** Role-based statistics access ensures optimal security and performance

## Troubleshooting Guide
Common issues and resolutions:
- Validation errors: Ensure request payloads conform to DTO schemas; errors are returned with a structured format indicating validation failures
- Authentication failures: Verify bearer tokens and ensure the user has the required roles
- Authorization failures: Confirm the requesting user's role aligns with endpoint permissions
- Logging: Enable request logging to capture request/response metadata for debugging
- **New** Validation workflow issues: Check workflow configuration and role assignments for the specific module
- **New** Status synchronization problems: Verify that validation workflow completion triggers proper status updates
- **New** Competences/specialities integration issues: Ensure proper entity relationships and foreign key constraints
- **New** Academic structure migration problems: Verify that old types-cycles data has been properly migrated to enriched cycles
- **New** Statistics endpoint failures: Verify SUPER_ADMIN role for global stats, ensure establishment exists for detailed stats
- **New** Performance issues with statistics: Check database indexes and consider implementing caching strategies for frequently accessed metrics

**Updated** Added troubleshooting guidance for validation workflow integration, new academic modules, and establishment statistics

**Section sources**
- [error.filter.ts](file://backend/src/common/filters/error.filter.ts)
- [request-logger.interceptor.ts](file://backend/src/common/interceptors/request-logger.interceptor.ts)
- [permission.guard.ts](file://backend/src/modules/auth/guards/permission.guard.ts)
- [validation-workflow.service.ts](file://backend/src/modules/validation-workflow/services/validation-workflow.service.ts)
- [etablissement.service.ts](file://backend/src/modules/etablissement/services/etablissement.service.ts)

## Conclusion
The Academic Management API provides a robust, secure, and scalable foundation for managing educational institution data with integrated validation workflow support, comprehensive academic structure management, and advanced establishment statistics capabilities. The enhanced system now includes specialized management for competences and specialities, replacing the previous types-cycles approach with a more streamlined academic hierarchy, and provides comprehensive analytics for institutional performance monitoring. By enforcing strict validation, authentication, and authorization controls, it ensures data integrity and operational safety. The enhanced notes module now supports automatic workflow creation and intelligent validation routing, streamlining academic approval processes. The establishment statistics system enables real-time monitoring and reporting across all institutional units. The documented endpoints, schemas, validation workflows, automated approval processes, and comprehensive analytics capabilities enable administrators to efficiently manage students, classes, levels, subjects, cycles, academic years, periods, establishment hierarchies, grading operations, competences, specialities, and establishment analytics while supporting comprehensive reporting and validation capabilities.

## Appendices

### Endpoint Reference Summary
- Students: GET /api/eleves, POST /api/eleves, PATCH /api/eleves/:id, DELETE /api/eleves/:id
- Classes: GET /api/classes, POST /api/classes, PATCH /api/classes/:id, DELETE /api/classes/:id
- Levels: GET /api/niveaux, POST /api/niveaux, PATCH /api/niveaux/:id, DELETE /api/niveaux/:id
- Subjects: GET /api/matieres, POST /api/matieres, PATCH /api/matieres/:id, DELETE /api/matieres/:id
- **Updated** Cycles: GET /api/cycles, POST /api/cycles, PATCH /api/cycles/:id, DELETE /api/cycles/:id
- **Updated** Program Streams: GET /api/filieres, POST /api/filieres, PATCH /api/filieres/:id, DELETE /api/filieres/:id
- **New** Specialities: GET /api/specialites, POST /api/specialites, PATCH /api/specialites/:id, DELETE /api/specialites/:id
- **New** Competences: GET /api/competences, POST /api/competences, PATCH /api/competences/:id, DELETE /api/competences/:id
- Academic Years: GET /api/annees-scolaires, POST /api/annees-scolaires, PATCH /api/annees-scolaires/:id, DELETE /api/annees-scolaires/:id
- Periods: GET /api/periodes, POST /api/periodes, PATCH /api/periodes/:id, DELETE /api/periodes/:id
- Establishment: GET /api/etablissement, PATCH /api/etablissement, GET /api/etablissements/stats, GET /api/etablissements/:id/stats
- Reports: GET /api/bulletins, POST /api/bulletins, PATCH /api/bulletins/:id, DELETE /api/bulletins/:id
- Grades: GET /api/notes, POST /api/notes, PATCH /api/notes/:id, DELETE /api/notes/:id
- **New** Validation Workflows: GET /api/validation-workflows/check/:module/:entityId, PUT /api/validation-workflows/config/:module, GET /api/validation-workflows/stats/:module

### Academic Structure Enhancements
- **Updated** Cycles: Enriched with description, duration in years, and sanctioning diploma fields
- **New** Specialities: Technical specialization management for MINESEC-compliant programs
- **New** Competences: Competency-based learning management aligned with APC framework
- **Removed** Types-Cycles: Consolidated into enriched cycles functionality

### Establishment Statistics Enhancements
- **New** Global Statistics: Comprehensive analytics across all establishments (SUPER_ADMIN only)
- **New** Detailed Statistics: Establishment-specific metrics and performance indicators
- **New** Multi-domain Analytics: Academic, administrative, financial, and performance metrics
- **New** Real-time Monitoring: Live establishment performance tracking and reporting

### Validation Workflow Configuration
- **Automatic Creation**: Validation workflows are automatically created when grades are submitted
- **Intelligent Routing**: Status changes trigger appropriate validation decisions based on established rules
- **Status Synchronization**: Workflow completion automatically updates grade status (PUBLIEE/BROUILLON/VALIDEE)
- **Statistics Tracking**: Real-time monitoring of validation workflow performance and completion rates
- **Role-Based Configuration**: Establishment-specific validation role assignments for different academic modules