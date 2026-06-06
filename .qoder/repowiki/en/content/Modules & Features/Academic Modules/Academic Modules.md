# Academic Modules

<cite>
**Referenced Files in This Document**
- [annee-scolaire.entity.ts](file://backend/src/modules/annees-scolaires/entities/annee-scolaire.entity.ts)
- [annees-scolaires.controller.ts](file://backend/src/modules/annees-scolaires/controllers/annees-scolaires.controller.ts)
- [annees-scolaires.service.ts](file://backend/src/modules/annees-scolaires/services/annees-scolaires.service.ts)
- [cycle.entity.ts](file://backend/src/modules/cycles/entities/cycle.entity.ts)
- [niveau.entity.ts](file://backend/src/modules/niveaux/entities/niveau.entity.ts)
- [matiere.entity.ts](file://backend/src/modules/matieres/entities/matiere.entity.ts)
- [affectation-matiere.entity.ts](file://backend/src/modules/matieres/entities/affectation-matiere.entity.ts)
- [matiere-niveau.entity.ts](file://backend/src/modules/matieres/entities/matiere-niveau.entity.ts)
- [classe.entity.ts](file://backend/src/modules/classes/entities/classe.entity.ts)
- [classes.controller.ts](file://backend/src/modules/classes/controllers/classes.controller.ts)
- [periode.entity.ts](file://backend/src/modules/periodes/entities/periode.entity.ts)
- [periodes.controller.ts](file://backend/src/modules/periodes/controllers/periodes.controller.ts)
- [bulletin.entity.ts](file://backend/src/modules/bulletins/entities/bulletin.entity.ts)
- [bulletins.controller.ts](file://backend/src/modules/bulletins/controllers/bulletins.controller.ts)
- [bulletins.service.ts](file://backend/src/modules/bulletins/services/bulletins.service.ts)
- [note.entity.ts](file://backend/src/modules/notes/entities/note.entity.ts)
- [notes.controller.ts](file://backend/src/modules/notes/controllers/notes.controller.ts)
- [etablissement.entity.ts](file://backend/src/modules/etablissement/entities/etablissement.entity.ts)
- [config.helper.ts](file://backend/src/modules/configuration/utils/config.helper.ts)
- [005-advanced-config-params.ts](file://backend/src/database/migrations/005-advanced-config-params.ts)
- [005-complete-config-params-100.ts](file://backend/src/database/migrations/005-complete-config-params-100.ts)
</cite>

## Update Summary
**Changes Made**
- Enhanced bulletin generation system with six new configuration parameters
- Added customizable grade calculation methods (arithmetic vs weighted)
- Implemented configurable validation thresholds for bulletin validation
- Added ranking inclusion/exclusion controls
- Integrated template selection system for bulletin PDF generation
- Updated service implementation to utilize runtime configuration parameters

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Configuration Parameters](#configuration-parameters)
7. [Dependency Analysis](#dependency-analysis)
8. [Performance Considerations](#performance-considerations)
9. [Troubleshooting Guide](#troubleshooting-guide)
10. [Conclusion](#conclusion)

## Introduction
This document describes the academic modules that implement the core educational management functionality. It covers academic year management, curriculum structure via cycles and levels, subject management with teaching assignments, class administration, academic periods, and grading systems. It also explains the hierarchical relationships among academic years, cycles, levels, subjects, and classes, and documents the enhanced bulletin generation system with customizable configuration parameters for grade calculation and template selection. Finally, it outlines entity relationships, service implementations, and controller endpoints for each academic module.

## Project Structure
The academic domain is organized by feature modules under backend/src/modules. Each module encapsulates entities, DTOs, services, and controllers for a specific aspect of education management. The modules relevant to this documentation are:
- Academic years: annees-scolaires
- Curriculum: cycles, niveaux
- Subjects and programs: matieres
- Classes: classes
- Academic periods: periodes
- Grading and reports: notes, bulletins
- Institution configuration: etablissement

```mermaid
graph TB
subgraph "Academic Management"
AYS["Academic Years<br/>annees-scolaires"]
CYC["Cycles<br/>cycles"]
NV["Levels<br/>niveaux"]
MT["Subjects & Programs<br/>matieres"]
CL["Classes<br/>classes"]
PER["Periods<br/>periodes"]
GR["Grades<br/>notes"]
BL["Reports<br/>bulletins"]
CFG["Institution Config<br/>etablissement"]
END
AYS --> PER
CYC --> NV
NV --> MT
NV --> CL
CL --> MT
MT --> GR
CL --> GR
PER --> GR
PER --> BL
GR --> BL
CFG --> AYS
CFG --> CYC
CFG --> NV
CFG --> MT
CFG --> CL
CFG --> PER
CFG --> BL
```

**Diagram sources**
- [annee-scolaire.entity.ts:15-40](file://backend/src/modules/annees-scolaires/entities/annee-scolaire.entity.ts#L15-L40)
- [cycle.entity.ts:17-39](file://backend/src/modules/cycles/entities/cycle.entity.ts#L17-L39)
- [niveau.entity.ts:20-53](file://backend/src/modules/niveaux/entities/niveau.entity.ts#L20-L53)
- [matiere.entity.ts:36-61](file://backend/src/modules/matieres/entities/matiere.entity.ts#L36-L61)
- [affectation-matiere.entity.ts:22-65](file://backend/src/modules/matieres/entities/affectation-matiere.entity.ts#L22-L65)
- [matiere-niveau.entity.ts:20-70](file://backend/src/modules/matieres/entities/matiere-niveau.entity.ts#L20-L70)
- [classe.entity.ts:21-75](file://backend/src/modules/classes/entities/classe.entity.ts#L21-L75)
- [periode.entity.ts:34-78](file://backend/src/modules/periodes/entities/periode.entity.ts#L34-L78)
- [note.entity.ts:45-141](file://backend/src/modules/notes/entities/note.entity.ts#L45-L141)
- [bulletin.entity.ts:23-92](file://backend/src/modules/bulletins/entities/bulletin.entity.ts#L23-L92)
- [etablissement.entity.ts:41-92](file://backend/src/modules/etablissement/entities/etablissement.entity.ts#L41-L92)

**Section sources**
- [annee-scolaire.entity.ts:15-40](file://backend/src/modules/annees-scolaires/entities/annee-scolaire.entity.ts#L15-L40)
- [cycle.entity.ts:17-39](file://backend/src/modules/cycles/entities/cycle.entity.ts#L17-L39)
- [niveau.entity.ts:20-53](file://backend/src/modules/niveaux/entities/niveau.entity.ts#L20-L53)
- [matiere.entity.ts:36-61](file://backend/src/modules/matieres/entities/matiere.entity.ts#L36-L61)
- [affectation-matiere.entity.ts:22-65](file://backend/src/modules/matieres/entities/affectation-matiere.entity.ts#L22-L65)
- [matiere-niveau.entity.ts:20-70](file://backend/src/modules/matieres/entities/matiere-niveau.entity.ts#L20-L70)
- [classe.entity.ts:21-75](file://backend/src/modules/classes/entities/classe.entity.ts#L21-L75)
- [periode.entity.ts:34-78](file://backend/src/modules/periodes/entities/periode.entity.ts#L34-L78)
- [note.entity.ts:45-141](file://backend/src/modules/notes/entities/note.entity.ts#L45-L141)
- [bulletin.entity.ts:23-92](file://backend/src/modules/bulletins/entities/bulletin.entity.ts#L23-L92)
- [etablissement.entity.ts:41-92](file://backend/src/modules/etablissement/entities/etablissement.entity.ts#L41-L92)

## Core Components
This section summarizes the primary components and their responsibilities across the academic modules.

- Academic Year Management
  - Entity: stores academic year label, start/end dates, current flag, and closure flag.
  - Service: handles creation, retrieval, activation/deactivation, updates, and deletion with validation and logging.
  - Controller: exposes endpoints for listing, fetching the active year, creating, updating, and deleting academic years with role-based access.

- Curriculum Structure (Cycles and Levels)
  - Cycle entity: defines school cycles (e.g., primary, middle, high school) with ordering and activity flag.
  - Level entity: defines grade levels within cycles, linked to cycle, subsystem, and ordering.

- Subject Management and Teaching Assignments
  - Subject entities: subject groups and subjects with attributes like color and activity.
  - Subject-Level program: links subjects to levels with coefficients, credits, scales, hours, and requirement flags.
  - Teaching assignment: links subjects, classes, teachers, and academic years with weekly hourly volumes.

- Class Administration
  - Class entity: represents classroom groups within a level and academic year, with tutor, room, capacity, current enrollment, and options.
  - Controller: supports listing classes filtered by level and year, CRUD operations, and student enrollment.

- Academic Periods
  - Period entity: defines period types (terms, semesters, sequences) and period instances with dates, order, weight, and closure flag.
  - Controller: manages types and periods, requiring an academic year identifier for listing periods.

- Grading System
  - Grade entity: captures evaluation type, value, scale, coefficient, comments, date, status, validator metadata, and computed normalized score.
  - Controller: supports bulk and individual grade operations, filtering, and validation.

- Enhanced Report Generation (Bulletins)
  - Bulletin entity: aggregates computed averages, class statistics, rank, global appreciation, and sanctions/encouragements.
  - Controller: generates reports per class/period and retrieves student reports, with update capabilities.
  - **Enhanced**: Now supports customizable grade calculation methods, validation thresholds, ranking inclusion, coefficient display, and template selection through runtime configuration parameters.

- Institution Configuration
  - Institution configuration entity: holds school-wide settings including subsystem, cycle availability, and report preferences.

**Section sources**
- [annees-scolaires.service.ts:14-79](file://backend/src/modules/annees-scolaires/services/annees-scolaires.service.ts#L14-L79)
- [annees-scolaires.controller.ts:25-60](file://backend/src/modules/annees-scolaires/controllers/annees-scolaires.controller.ts#L25-L60)
- [cycle.entity.ts:17-39](file://backend/src/modules/cycles/entities/cycle.entity.ts#L17-L39)
- [niveau.entity.ts:20-53](file://backend/src/modules/niveaux/entities/niveau.entity.ts#L20-L53)
- [matiere.entity.ts:36-61](file://backend/src/modules/matieres/entities/matiere.entity.ts#L36-L61)
- [matiere-niveau.entity.ts:20-70](file://backend/src/modules/matieres/entities/matiere-niveau.entity.ts#L20-L70)
- [affectation-matiere.entity.ts:22-65](file://backend/src/modules/matieres/entities/affectation-matiere.entity.ts#L22-L65)
- [classe.entity.ts:21-75](file://backend/src/modules/classes/entities/classe.entity.ts#L21-L75)
- [classes.controller.ts:25-63](file://backend/src/modules/classes/controllers/classes.controller.ts#L25-L63)
- [periode.entity.ts:34-78](file://backend/src/modules/periodes/entities/periode.entity.ts#L34-L78)
- [periodes.controller.ts:25-73](file://backend/src/modules/periodes/controllers/periodes.controller.ts#L25-L73)
- [note.entity.ts:45-141](file://backend/src/modules/notes/entities/note.entity.ts#L45-L141)
- [notes.controller.ts:25-71](file://backend/src/modules/notes/controllers/notes.controller.ts#L25-L71)
- [bulletin.entity.ts:23-92](file://backend/src/modules/bulletins/entities/bulletin.entity.ts#L23-L92)
- [bulletins.controller.ts:25-46](file://backend/src/modules/bulletins/controllers/bulletins.controller.ts#L25-L46)
- [etablissement.entity.ts:41-92](file://backend/src/modules/etablissement/entities/etablissement.entity.ts#L41-L92)

## Architecture Overview
The academic modules follow a layered architecture:
- Entities define the persistent model with relationships.
- Services encapsulate business logic and enforce rules (e.g., activating one academic year at a time).
- Controllers expose REST endpoints with authentication and role-based authorization.
- DTOs validate incoming requests using schema-based validation.
- **Enhanced**: Configuration parameters are managed through a centralized configuration system with runtime caching and validation.

```mermaid
graph TB
Client["Client"]
Auth["Auth Middleware"]
Roles["Role Guard"]
subgraph "Controllers"
C_ays["AnneesScolairesController"]
C_cls["ClassesController"]
C_per["PeriodesController"]
C_mat["MatieresController"]
C_not["NotesController"]
C_bl["BulletinsController"]
end
subgraph "Services"
S_ays["AnneesScolairesService"]
S_cls["ClassesService"]
S_per["PeriodesService"]
S_mat["MatieresService"]
S_not["NotesService"]
S_bl["BulletinsService"]
end
subgraph "Entities"
E_ys["AnneeScolaire"]
E_cls["Classe"]
E_per["Periode"]
E_mat["Matiere/MatiereNiveau/AffectationMatiere"]
E_note["Note"]
E_bul["Bulletin"]
E_cfg["EtablissementConfig"]
end
subgraph "Configuration System"
CfgHelper["Config Helper<br/>getParam, getParamBoolean,<br/>getParamNumber"]
CfgService["Configuration Service"]
CfgCache["Quick Cache<br/>60s TTL"]
end
Client --> Auth --> Roles --> C_ays
Client --> Auth --> Roles --> C_cls
Client --> Auth --> Roles --> C_per
Client --> Auth --> Roles --> C_mat
Client --> Auth --> Roles --> C_not
Client --> Auth --> Roles --> C_bl
C_ays --> S_ays --> E_ys
C_cls --> S_cls --> E_cls
C_per --> S_per --> E_per
C_mat --> S_mat --> E_mat
C_not --> S_not --> E_note
C_bl --> S_bl --> E_bul
E_cfg -. configuration .-> E_ys
E_cfg -. configuration .-> E_cls
E_cfg -. configuration .-> E_per
E_cfg -. configuration .-> E_mat
E_cfg -. configuration .-> E_note
E_cfg -. configuration .-> E_bul
S_bl --> CfgHelper
CfgHelper --> CfgService
CfgService --> CfgCache
```

**Diagram sources**
- [annees-scolaires.controller.ts:7-15](file://backend/src/modules/annees-scolaires/controllers/annees-scolaires.controller.ts#L7-L15)
- [classes.controller.ts:7-15](file://backend/src/modules/classes/controllers/classes.controller.ts#L7-L15)
- [periodes.controller.ts:7-15](file://backend/src/modules/periodes/controllers/periodes.controller.ts#L7-L15)
- [matieres.controller.ts:7-20](file://backend/src/modules/matieres/controllers/matieres.controller.ts#L7-L20)
- [notes.controller.ts:7-15](file://backend/src/modules/notes/controllers/notes.controller.ts#L7-L15)
- [bulletins.controller.ts:7-15](file://backend/src/modules/bulletins/controllers/bulletins.controller.ts#L7-L15)
- [annees-scolaires.service.ts:14-19](file://backend/src/modules/annees-scolaires/services/annees-scolaires.service.ts#L14-L19)
- [classe.entity.ts:21-75](file://backend/src/modules/classes/entities/classe.entity.ts#L21-L75)
- [periode.entity.ts:34-78](file://backend/src/modules/periodes/entities/periode.entity.ts#L34-L78)
- [matiere-niveau.entity.ts:20-70](file://backend/src/modules/matieres/entities/matiere-niveau.entity.ts#L20-L70)
- [affectation-matiere.entity.ts:22-65](file://backend/src/modules/matieres/entities/affectation-matiere.entity.ts#L22-L65)
- [note.entity.ts:45-141](file://backend/src/modules/notes/entities/note.entity.ts#L45-L141)
- [bulletin.entity.ts:23-92](file://backend/src/modules/bulletins/entities/bulletin.entity.ts#L23-L92)
- [etablissement.entity.ts:41-92](file://backend/src/modules/etablissement/entities/etablissement.entity.ts#L41-L92)
- [config.helper.ts:15-54](file://backend/src/modules/configuration/utils/config.helper.ts#L15-L54)

## Detailed Component Analysis

### Academic Year Management
- Responsibilities
  - Maintain academic year lifecycle: create, activate, update, close, and delete.
  - Ensure only one active academic year exists at a time.
  - Provide listing and retrieval of active year.

- Entities and Relationships
  - Academic year entity stores label, start/end dates, current flag, and closure flag.

- Services and Business Rules
  - Creation: sets current flag off others if newly created year is marked current.
  - Updates: toggles other years' current flag when activating a specific year.
  - Deletion: prevents deletion of active year.

- Controllers and Endpoints
  - GET /: list all academic years ordered by start date descending.
  - GET /active: fetch currently active academic year.
  - POST /: create a new academic year (admin/super admin).
  - PATCH /: update an academic year (admin/super admin).
  - DELETE /: remove an academic year (admin/super admin).

```mermaid
sequenceDiagram
participant Client as "Client"
participant Ctrl as "AnneesScolairesController"
participant Svc as "AnneesScolairesService"
participant Repo as "AnneeScolaire Repository"
Client->>Ctrl : POST / (create)
Ctrl->>Svc : create(dto)
Svc->>Repo : update(enCours=true, set false)
Svc->>Repo : save(new annee)
Repo-->>Svc : saved entity
Svc-->>Ctrl : AnneeScolaire
Ctrl-->>Client : 201 Created + data
Client->>Ctrl : PATCH / : id (update)
Ctrl->>Svc : update(id, dto)
alt dto.enCours=true and was false
Svc->>Repo : update(enCours=true, set false)
end
Svc->>Repo : save(updated)
Repo-->>Svc : saved entity
Svc-->>Ctrl : AnneeScolaire
Ctrl-->>Client : 200 OK + data
```

**Diagram sources**
- [annees-scolaires.controller.ts:39-53](file://backend/src/modules/annees-scolaires/controllers/annees-scolaires.controller.ts#L39-L53)
- [annees-scolaires.service.ts:21-67](file://backend/src/modules/annees-scolaires/services/annees-scolaires.service.ts#L21-L67)

**Section sources**
- [annee-scolaire.entity.ts:15-40](file://backend/src/modules/annees-scolaires/entities/annee-scolaire.entity.ts#L15-L40)
- [annees-scolaires.service.ts:21-76](file://backend/src/modules/annees-scolaires/services/annees-scolaires.service.ts#L21-L76)
- [annees-scolaires.controller.ts:25-60](file://backend/src/modules/annees-scolaires/controllers/annees-scolaires.controller.ts#L25-L60)

### Curriculum: Cycles and Levels
- Responsibilities
  - Define school cycles (e.g., primary, middle, high school) and levels within cycles.
  - Support ordering and activity flags for both.

- Entities and Relationships
  - Cycle entity: code, name, order, and activity.
  - Level entity: name/code, cycle linkage, subsystem, order, and activity.

```mermaid
classDiagram
class Cycle {
+string id
+string nom
+string code
+number ordre
+boolean actif
}
class Niveau {
+string id
+string nom
+string code
+string cycleId
+SousSysteme sousSysteme
+number ordre
+boolean actif
+Cycle cycle
}
Niveau --> Cycle : "belongs to"
```

**Diagram sources**
- [cycle.entity.ts:17-39](file://backend/src/modules/cycles/entities/cycle.entity.ts#L17-L39)
- [niveau.entity.ts:20-53](file://backend/src/modules/niveaux/entities/niveau.entity.ts#L20-L53)

**Section sources**
- [cycle.entity.ts:17-39](file://backend/src/modules/cycles/entities/cycle.entity.ts#L17-L39)
- [niveau.entity.ts:20-53](file://backend/src/modules/niveaux/entities/niveau.entity.ts#L20-L53)

### Subject Management and Teaching Assignments
- Responsibilities
  - Manage subject groups and subjects.
  - Define subject programs per level with coefficients/credits, scales, hours, and requirement flags.
  - Assign subjects to classes with teachers and weekly hours for a given academic year.

- Entities and Relationships
  - Subject group and subject entities.
  - Subject-level program entity linking subject to level with grouping, weights, credits, and hours.
  - Teaching assignment entity linking subject, class, teacher, academic year, and weekly hours.

```mermaid
classDiagram
class GroupeMatiere {
+string id
+string nom
+number ordre
+string description
}
class Matiere {
+string id
+string nom
+string code
+string nomAnglais
+string couleur
+boolean actif
}
class MatiereNiveau {
+string id
+string matiereId
+string niveauId
+string groupeId
+number coefficient
+number credits
+number bareme
+number volumeHoraire
+boolean obligatoire
+Matiere matiere
+Niveau niveau
+GroupeMatiere groupe
}
class AffectationMatiere {
+string id
+string matiereId
+string classeId
+string enseignantId
+string anneeScolaireId
+number volumeHoraireHebdo
+Matiere matiere
+Classe classe
+MembrePersonnel enseignant
+AnneeScolaire anneeScolaire
}
MatiereNiveau --> Matiere : "links"
MatiereNiveau --> Niveau : "links"
MatiereNiveau --> GroupeMatiere : "optional"
AffectationMatiere --> Matiere : "links"
AffectationMatiere --> Classe : "links"
AffectationMatiere --> MembrePersonnel : "links"
AffectationMatiere --> AnneeScolaire : "links"
```

**Diagram sources**
- [matiere.entity.ts:18-61](file://backend/src/modules/matieres/entities/matiere.entity.ts#L18-L61)
- [matiere-niveau.entity.ts:20-70](file://backend/src/modules/matieres/entities/matiere-niveau.entity.ts#L20-L70)
- [affectation-matiere.entity.ts:22-65](file://backend/src/modules/matieres/entities/affectation-matiere.entity.ts#L22-L65)

**Section sources**
- [matiere.entity.ts:18-61](file://backend/src/modules/matieres/entities/matiere.entity.ts#L18-L61)
- [matiere-niveau.entity.ts:20-70](file://backend/src/modules/matieres/entities/matiere-niveau.entity.ts#L20-L70)
- [affectation-matiere.entity.ts:22-65](file://backend/src/modules/matieres/entities/affectation-matiere.entity.ts#L22-L65)

### Class Administration
- Responsibilities
  - Maintain class records within a level and academic year.
  - Track tutor, room, capacity, current enrollment, and options.
  - Support CRUD operations and student enrollment.

- Entities and Relationships
  - Class entity with level and academic year linkage and optional tutor.

- Controllers and Endpoints
  - GET /: list classes optionally filtered by level and academic year.
  - POST /: create a class (admin/super admin).
  - PATCH /: update a class (admin/super admin).
  - DELETE /: delete a class (admin/super admin).
  - POST /affectations: enroll a student (admin/super admin/chef etablissement/personnel).

```mermaid
sequenceDiagram
participant Client as "Client"
participant Ctrl as "ClassesController"
participant Svc as "ClassesService"
participant Repo as "Classe Repository"
Client->>Ctrl : POST /affectations
Ctrl->>Svc : affecterEleve(dto)
Svc->>Repo : save(affectation)
Repo-->>Svc : saved
Svc-->>Ctrl : affectation
Ctrl-->>Client : 201 Created + data
```

**Diagram sources**
- [classes.controller.ts:57-63](file://backend/src/modules/classes/controllers/classes.controller.ts#L57-L63)

**Section sources**
- [classe.entity.ts:21-75](file://backend/src/modules/classes/entities/classe.entity.ts#L21-L75)
- [classes.controller.ts:25-63](file://backend/src/modules/classes/controllers/classes.controller.ts#L25-L63)

### Academic Periods
- Responsibilities
  - Define period types (e.g., trimester, semester, sequence) and period instances bound to an academic year.
  - Manage period order, weighting, and closure.

- Entities and Relationships
  - Period type entity and period entity with foreign keys to academic year and type.

- Controllers and Endpoints
  - GET /types: list period types.
  - POST /types: create a period type (admin/super admin).
  - GET /: list periods filtered by academic year.
  - POST /: create a period (admin/super admin).
  - PATCH /: update a period (admin/super admin).
  - DELETE /: delete a period (admin/super admin).

```mermaid
sequenceDiagram
participant Client as "Client"
participant Ctrl as "PeriodesController"
participant Svc as "PeriodesService"
participant Repo as "Periode Repository"
Client->>Ctrl : GET /
Ctrl->>Svc : findAll(anneeId)
Svc->>Repo : find({ anneeScolaireId })
Repo-->>Svc : periods[]
Svc-->>Ctrl : periods[]
Ctrl-->>Client : 200 OK + data
```

**Diagram sources**
- [periodes.controller.ts:42-49](file://backend/src/modules/periodes/controllers/periodes.controller.ts#L42-L49)

**Section sources**
- [periode.entity.ts:34-78](file://backend/src/modules/periodes/entities/periode.entity.ts#L34-L78)
- [periodes.controller.ts:25-73](file://backend/src/modules/periodes/controllers/periodes.controller.ts#L25-L73)

### Grading System
- Responsibilities
  - Record individual grades with evaluation type, value, scale, coefficient, comments, date, and status.
  - Normalize raw scores to a standard scale (e.g., out of 20) and support bulk operations.
  - Provide filtering and validation.

- Entities and Relationships
  - Grade entity with relationships to student, subject, class, period, academic year, and user (for auditing).

- Controllers and Endpoints
  - GET /: list grades with query filtering (authenticated).
  - GET /:id: retrieve a grade.
  - POST /: create a single grade (teacher/admin/chef etablissement).
  - POST /bulk: create multiple grades (teacher/admin/chef etablissement).
  - PATCH /:id: update a grade (teacher/admin/chef etablissement).
  - DELETE /:id: delete a grade (teacher/admin/chef etablissement).

```mermaid
flowchart TD
Start(["Grade Entry"]) --> Validate["Validate DTO"]
Validate --> CreateOrBulk{"Single or Bulk?"}
CreateOrBulk --> |Single| SaveOne["Save single grade"]
CreateOrBulk --> |Bulk| SaveBulk["Save multiple grades"]
SaveOne --> Compute["Compute normalized score"]
SaveBulk --> Compute
Compute --> Return["Return created/updated grade(s)"]
```

**Diagram sources**
- [notes.controller.ts:42-56](file://backend/src/modules/notes/controllers/notes.controller.ts#L42-L56)
- [note.entity.ts:134-140](file://backend/src/modules/notes/entities/note.entity.ts#L134-L140)

**Section sources**
- [note.entity.ts:45-141](file://backend/src/modules/notes/entities/note.entity.ts#L45-L141)
- [notes.controller.ts:25-71](file://backend/src/modules/notes/controllers/notes.controller.ts#L25-L71)

### Enhanced Report Generation (Bulletins)
- Responsibilities
  - Generate and manage student reports per period, compute averages, class statistics, and rank.
  - Store global appreciation and disciplinary actions.
  - **Enhanced**: Support customizable grade calculation methods, validation thresholds, ranking inclusion, coefficient display, and template selection through runtime configuration parameters.

- Entities and Relationships
  - Bulletin entity aggregates computed averages, class stats, rank, and global comments.
  - **Enhanced**: Supports additional fields for configuration-driven behavior including ranking inclusion, coefficient display, and template identification.

- Controllers and Endpoints
  - POST /generate: generate reports for a class/period (admin/super admin/chef etablissement).
  - GET /eleve/:eleveId: retrieve all reports for a student.
  - PATCH /:id: update a report (admin/super admin/chef etablissement).

- **Enhanced Configuration Parameters**
  - `bulletins.include_ranking`: Boolean - Include ranking/rank in generated bulletins
  - `bulletins.validation_threshold`: Number - Minimum passing grade threshold (out of 20)
  - `bulletins.calculation_method`: String - 'arithmetique' or 'ponderee' for average calculation
  - `bulletins.display_coefficients`: Boolean - Show subject coefficients on bulletins
  - `bulletins.show_appreciations`: Boolean - Include class council appreciation
  - `bulletins.template_id`: String - PDF template identifier for bulletin generation

```mermaid
sequenceDiagram
participant Client as "Client"
participant Ctrl as "BulletinsController"
participant Svc as "BulletinsService"
participant Cfg as "Config Helper"
participant Repo as "Bulletin Repository"
Client->>Ctrl : POST /generate
Ctrl->>Svc : generate(dto)
Svc->>Cfg : getBulletinsParams()
Cfg-->>Svc : {includeRanking, validationThreshold, calculationMethod, displayCoefficients, templateId}
Svc->>Svc : calculate averages using selected method
alt includeRanking = true
Svc->>Svc : compute rankings
end
Svc->>Repo : save(bulletins[])
Repo-->>Svc : saved
Svc-->>Ctrl : bulletins[]
Ctrl-->>Client : 200 OK + count + data
```

**Diagram sources**
- [bulletins.controller.ts:25-31](file://backend/src/modules/bulletins/controllers/bulletins.controller.ts#L25-L31)
- [bulletins.service.ts:30-39](file://backend/src/modules/bulletins/services/bulletins.service.ts#L30-L39)

**Section sources**
- [bulletin.entity.ts:23-92](file://backend/src/modules/bulletins/entities/bulletin.entity.ts#L23-L92)
- [bulletins.controller.ts:25-46](file://backend/src/modules/bulletins/controllers/bulletins.controller.ts#L25-L46)
- [bulletins.service.ts:30-39](file://backend/src/modules/bulletins/services/bulletins.service.ts#L30-L39)

### Academic Calendar Management, Course Scheduling, and Student Enrollment Workflows
- Academic Calendar Management
  - Academic years define the school year boundaries.
  - Periods define the calendar segments (trimesters, semesters, sequences) within an academic year.
  - Period types are institution-configured and reused across academic years.

- Course Scheduling
  - Teaching assignments link subjects, classes, and teachers for a given academic year.
  - Weekly hours can be recorded per assignment to support scheduling.

- Student Enrollment Workflow
  - Students are enrolled into classes; the class maintains current enrollment and capacity.
  - Enrollment endpoints are exposed via the classes controller.

```mermaid
flowchart TD
AY["Select Active Academic Year"] --> TP["Define Period Types"]
TP --> PD["Create Period Instances"]
PD --> SCH["Assign Subjects to Classes<br/>with Teachers and Hours"]
SCH --> ENR["Enroll Students into Classes"]
ENR --> GRADE["Record Grades per Period"]
GRADE --> REP["Generate Reports with Customizable Settings"]
```

[No sources needed since this diagram shows conceptual workflow, not actual code structure]

## Configuration Parameters
The bulletin generation system now supports six runtime configuration parameters that control various aspects of report generation:

### Bulletins Module Configuration Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `bulletins.include_ranking` | Boolean | `true` | Include ranking/rank in generated bulletins |
| `bulletins.validation_threshold` | Number | `10` | Minimum passing grade threshold (out of 20) |
| `bulletins.calculation_method` | String | `'ponderee'` | `'arithmetique'` or `'ponderee'` for average calculation |
| `bulletins.display_coefficients` | Boolean | `true` | Show subject coefficients on bulletins |
| `bulletins.show_appreciations` | Boolean | `true` | Include class council appreciation |
| `bulletins.template_id` | String | `'default'` | PDF template identifier for bulletin generation |

### Configuration Implementation Details

The configuration system uses a centralized approach with:
- **Runtime Caching**: Quick cache with 60-second TTL for frequent parameter access
- **Type Safety**: Strong typing with automatic conversion for different parameter types
- **Validation**: Built-in validation for numeric ranges and format constraints
- **Module Organization**: Parameters organized by module (bulletins, eleves, etablissement, systeme)

**Section sources**
- [config.helper.ts:15-54](file://backend/src/modules/configuration/utils/config.helper.ts#L15-L54)
- [005-advanced-config-params.ts:21-97](file://backend/src/database/migrations/005-advanced-config-params.ts#L21-L97)
- [005-complete-config-params-100.ts:52-129](file://backend/src/database/migrations/005-complete-config-params-100.ts#L52-L129)

## Dependency Analysis
This section maps dependencies among entities and services to clarify coupling and cohesion.

```mermaid
erDiagram
ANNEE_SCOLAIRE {
uuid id PK
varchar libelle UK
date dateDebut
date dateFin
boolean enCours
boolean cloturee
}
TYPES_PERIODE {
uuid id PK
varchar code UK
varchar nom
}
PERIODE {
uuid id PK
varchar nom
uuid typeId FK
uuid anneeScolaireId FK
date dateDebut
date dateFin
int ordre
float poids
boolean cloturee
}
CYCLE {
uuid id PK
varchar nom
enum code
int ordre
boolean actif
}
NIVEAU {
uuid id PK
varchar nom
varchar code
uuid cycleId FK
enum sousSysteme
int ordre
boolean actif
}
GROUPES_MATIERES {
uuid id PK
varchar nom
int ordre
text description
}
MATIERE {
uuid id PK
varchar nom UK
varchar code
varchar nomAnglais
varchar couleur
boolean actif
}
MATIERE_NIVEAU {
uuid id PK
uuid matiereId FK
uuid niveauId FK
uuid groupeId FK
float coefficient
float credits
int bareme
int volumeHoraire
boolean obligatoire
}
CLASSE {
uuid id PK
varchar nom
varchar code
uuid niveauId FK
uuid anneeScolaireId FK
uuid professeurPrincipalId FK
varchar sallePrincipale
int effectifMax
int effectifActuel
json options
boolean actif
}
AFFECTATION_MATIERE {
uuid id PK
uuid matiereId FK
uuid classeId FK
uuid enseignantId FK
uuid anneeScolaireId FK
int volumeHoraireHebdo
}
NOTE {
uuid id PK
uuid eleveId FK
uuid enseignantId FK
uuid matiereId FK
uuid classeId FK
uuid periodeId FK
uuid anneeScolaireId FK
enum typeEvaluation
varchar description
float valeur
float bareme
float coefficient
text commentaire
date dateEvaluation
enum statut
uuid validateurId
timestamp valideeAt
}
BULLETIN {
uuid id PK
uuid eleveId FK
uuid classeId FK
uuid periodeId FK
uuid anneeScolaireId FK
float moyenneGenerale
float moyenneClasse
float moyenneMin
float moyenneMax
int rang
json appreciationConseil
json sanctions
json encouragements
boolean publie
uuid etablissementId FK
string templateId
boolean afficherRangs
boolean afficherCoefficients
}
ANNEE_SCOLAIRE ||--o{ PERIODE : "contains"
TYPES_PERIODE ||--o{ PERIODE : "defines"
CYCLE ||--o{ NIVEAU : "contains"
NIVEAU ||--o{ MATIERE_NIVEAU : "has"
MATIERE ||--o{ MATIERE_NIVEAU : "taught_in"
GROUPES_MATIERES ||--o{ MATIERE_NIVEAU : "groups"
NIVEAU ||--o{ CLASSE : "forms"
MATIERE ||--o{ AFFECTATION_MATIERE : "assigned_to"
CLASSE ||--o{ AFFECTATION_MATIERE : "has"
ANNEE_SCOLAIRE ||--o{ AFFECTATION_MATIERE : "valid_for"
CLASSE ||--o{ NOTE : "assessed_in"
MATIERE ||--o{ NOTE : "graded_in"
PERIODE ||--o{ NOTE : "evaluated_in"
ANNEE_SCOLAIRE ||--o{ NOTE : "covers"
ELEVE ||--o{ NOTE : "receives"
ELEVE ||--o{ BULLETIN : "has"
CLASSE ||--o{ BULLETIN : "generates"
PERIODE ||--o{ BULLETIN : "summarizes"
ANNEE_SCOLAIRE ||--o{ BULLETIN : "covers"
ETABLISSEMENT ||--o{ BULLETIN : "creates"
```

**Diagram sources**
- [annee-scolaire.entity.ts:15-40](file://backend/src/modules/annees-scolaires/entities/annee-scolaire.entity.ts#L15-L40)
- [periode.entity.ts:19-78](file://backend/src/modules/periodes/entities/periode.entity.ts#L19-L78)
- [cycle.entity.ts:17-39](file://backend/src/modules/cycles/entities/cycle.entity.ts#L17-L39)
- [niveau.entity.ts:20-53](file://backend/src/modules/niveaux/entities/niveau.entity.ts#L20-L53)
- [matiere.entity.ts:18-61](file://backend/src/modules/matieres/entities/matiere.entity.ts#L18-L61)
- [matiere-niveau.entity.ts:20-70](file://backend/src/modules/matieres/entities/matiere-niveau.entity.ts#L20-L70)
- [classe.entity.ts:21-75](file://backend/src/modules/classes/entities/classe.entity.ts#L21-L75)
- [affectation-matiere.entity.ts:22-65](file://backend/src/modules/matieres/entities/affectation-matiere.entity.ts#L22-L65)
- [note.entity.ts:45-141](file://backend/src/modules/notes/entities/note.entity.ts#L45-L141)
- [bulletin.entity.ts:23-92](file://backend/src/modules/bulletins/entities/bulletin.entity.ts#L23-L92)

**Section sources**
- [annee-scolaire.entity.ts:15-40](file://backend/src/modules/annees-scolaires/entities/annee-scolaire.entity.ts#L15-L40)
- [periode.entity.ts:19-78](file://backend/src/modules/periodes/entities/periode.entity.ts#L19-L78)
- [cycle.entity.ts:17-39](file://backend/src/modules/cycles/entities/cycle.entity.ts#L17-L39)
- [niveau.entity.ts:20-53](file://backend/src/modules/niveaux/entities/niveau.entity.ts#L20-L53)
- [matiere.entity.ts:18-61](file://backend/src/modules/matieres/entities/matiere.entity.ts#L18-L61)
- [matiere-niveau.entity.ts:20-70](file://backend/src/modules/matieres/entities/matiere-niveau.entity.ts#L20-L70)
- [classe.entity.ts:21-75](file://backend/src/modules/classes/entities/classe.entity.ts#L21-L75)
- [affectation-matiere.entity.ts:22-65](file://backend/src/modules/matieres/entities/affectation-matiere.entity.ts#L22-L65)
- [note.entity.ts:45-141](file://backend/src/modules/notes/entities/note.entity.ts#L45-L141)
- [bulletin.entity.ts:23-92](file://backend/src/modules/bulletins/entities/bulletin.entity.ts#L23-L92)

## Performance Considerations
- Indexing
  - Entities use database indexes on frequently queried columns (e.g., niveauId, anneeScolaireId, matiereId, periodeId) to optimize joins and filters.
- Normalized Scores
  - Grade normalization to a standard scale reduces computation overhead during report generation.
- Batch Operations
  - Bulk grade creation endpoints minimize round trips for teacher input.
- Logging and Auditing
  - Services log significant operations to aid debugging and monitoring.
- **Enhanced**: Configuration Parameter Caching
  - Quick cache with 60-second TTL for frequently accessed configuration parameters reduces database load.
  - Automatic type conversion and validation improve performance and reliability.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
- Validation Errors
  - Controllers validate incoming DTOs and return structured errors with a validation error code.
- Not Found Errors
  - Services throw not found errors when requested entities are missing.
- Active Year Constraints
  - Deleting the active academic year is prevented by the service.
  - Activating a year automatically deactivates others.
- **Enhanced**: Configuration Parameter Issues
  - Invalid parameter values are automatically validated and rejected with appropriate error messages.
  - Default values are used when configuration parameters are missing or invalid.
  - Cache invalidation ensures configuration changes take effect immediately.

**Section sources**
- [annees-scolaires.controller.ts:17-23](file://backend/src/modules/annees-scolaires/controllers/annees-scolaires.controller.ts#L17-L23)
- [annees-scolaires.service.ts:47-48](file://backend/src/modules/annees-scolaires/services/annees-scolaires.service.ts#L47-L48)
- [annees-scolaires.service.ts:71-74](file://backend/src/modules/annees-scolaires/services/annees-scolaires.service.ts#L71-L74)
- [config.helper.ts:15-54](file://backend/src/modules/configuration/utils/config.helper.ts#L15-L54)

## Conclusion
The academic modules provide a cohesive, layered architecture for managing academic years, curriculum structure, subjects and programs, classes, academic periods, grades, and reports. The enhanced bulletin generation system now offers extensive customization through six runtime configuration parameters, enabling institutions to tailor grade calculation methods, validation thresholds, ranking inclusion, coefficient display, and template selection according to their specific requirements. Clear entity relationships, robust services enforcing business rules, role-based controllers, and a centralized configuration system enable secure, scalable, and flexible educational administration. The design supports institutional configuration, standardized grading, and efficient report generation aligned with the chosen subsystem while maintaining backward compatibility and extensibility.