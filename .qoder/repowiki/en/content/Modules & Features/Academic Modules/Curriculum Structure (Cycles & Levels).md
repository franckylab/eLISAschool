# Curriculum Structure (Cycles & Levels)

<cite>
**Referenced Files in This Document**
- [cycle.entity.ts](file://backend/src/modules/cycles/entities/cycle.entity.ts)
- [cycle.dto.ts](file://backend/src/modules/cycles/dto/cycle.dto.ts)
- [cycles.service.ts](file://backend/src/modules/cycles/services/cycles.service.ts)
- [cycles.controller.ts](file://backend/src/modules/cycles/controllers/cycles.controller.ts)
- [niveau.entity.ts](file://backend/src/modules/niveaux/entities/niveau.entity.ts)
- [niveau.dto.ts](file://backend/src/modules/niveaux/dto/niveau.dto.ts)
- [niveaux.service.ts](file://backend/src/modules/niveaux/services/niveaux.service.ts)
- [niveaux.controller.ts](file://backend/src/modules/niveaux/controllers/niveaux.controller.ts)
- [competence.entity.ts](file://backend/src/modules/competences/entities/competence.entity.ts)
- [competence.dto.ts](file://backend/src/modules/competences/dto/competence.dto.ts)
- [competences.service.ts](file://backend/src/modules/competences/services/competences.service.ts)
- [competences.controller.ts](file://backend/src/modules/competences/controllers/competences.controller.ts)
- [specialite.entity.ts](file://backend/src/modules/specialites/entities/specialite.entity.ts)
- [specialite.dto.ts](file://backend/src/modules/specialites/dto/specialite.dto.ts)
- [specialites.service.ts](file://backend/src/modules/specialites/services/specialites.service.ts)
- [specialites.controller.ts](file://backend/src/modules/specialites/controllers/specialites.controller.ts)
- [etablissement.entity.ts](file://backend/src/modules/etablissement/entities/etablissement.entity.ts)
- [etablissement-config.entity.ts](file://backend/src/modules/etablissement/entities/etablissement-config.entity.ts)
- [matiere.entity.ts](file://backend/src/modules/matieres/entities/matiere.entity.ts)
- [matiere-niveau.entity.ts](file://backend/src/modules/matieres/entities/matiere-niveau.entity.ts)
- [affectation-matiere.entity.ts](file://backend/src/modules/matieres/entities/affectation-matiere.entity.ts)
- [classe.entity.ts](file://backend/src/modules/classes/entities/classe.entity.ts)
- [054-refonte-structure-academique-v2.sql](file://backend/database/migrations/054-refonte-structure-academique-v2.sql)
- [056-suppression-cycle-scolaire.sql](file://backend/database/migrations/056-suppression-cycle-scolaire.sql)
- [seed-specialites-competences.ts](file://backend/src/database/seeds/seed-specialites-competences.ts)
</cite>

## Update Summary
**Changes Made**
- Updated to reflect migration from string-based cycle codes to UUID-based relationships
- Eliminated legacy CycleScolaire enum dependency in favor of pure UUID foreign key relationships
- Enhanced academic structure support with proper UUID foreign key constraints
- Updated entity relationships to use UUID primary keys consistently across curriculum modules
- Revised validation rules to use UUID format instead of string codes

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Competency-Based Learning Approach](#competency-based-learning-approach)
7. [Technical Specializations](#technical-specializations)
8. [Dependency Analysis](#dependency-analysis)
9. [Performance Considerations](#performance-considerations)
10. [Troubleshooting Guide](#troubleshooting-guide)
11. [Conclusion](#conclusion)
12. [Appendices](#appendices)

## Introduction
This document explains the curriculum structure management focused on cycles and levels within a competency-based learning framework. The system has undergone a significant architectural transformation from string-based cycle codes to UUID-based relationships, eliminating the legacy CycleScolaire enum dependency and establishing proper foreign key relationships throughout the academic structure.

**Updated** The system now uses UUID-based relationships exclusively, with cycles serving as the single source of truth for educational stages, replacing the previous dual-source model that combined enum-based codes with database-stored cycle definitions.

## Project Structure
The curriculum structure spans four main modules supporting competency-based learning with UUID-based relationships:
- Cycles: Defines broad educational stages with UUID primary keys and competency attributes
- Niveaux: Defines granular levels within cycles with UUID foreign key relationships
- Competences: Manages competency-based learning objectives linked to levels and subjects
- Specialites: Handles technical specialization options within educational tracks

```mermaid
graph TB
subgraph "Cycles Module"
CY["Cycle Entity<br/>backend/src/modules/cycles/entities/cycle.entity.ts"]
D1["Cycle DTO<br/>backend/src/modules/cycles/dto/cycle.dto.ts"]
S1["Cycles Service<br/>backend/src/modules/cycles/services/cycles.service.ts"]
C1["Cycles Controller<br/>backend/src/modules/cycles/controllers/cycles.controller.ts"]
end
subgraph "Niveaux Module"
NV["Niveau Entity<br/>backend/src/modules/niveaux/entities/niveau.entity.ts"]
D2["Niveau DTO<br/>backend/src/modules/niveaux/dto/niveau.dto.ts"]
S2["Niveaux Service<br/>backend/src/modules/niveaux/services/niveaux.service.ts"]
C2["Niveaux Controller<br/>backend/src/modules/niveaux/controllers/niveaux.controller.ts"]
end
subgraph "Competences Module"
COMP["Competence Entity<br/>backend/src/modules/competences/entities/competence.entity.ts"]
D3["Competence DTO<br/>backend/src/modules/competences/dto/competence.dto.ts"]
S3["Competences Service<br/>backend/src/modules/competences/services/competences.service.ts"]
C3["Competences Controller<br/>backend/src/modules/competences/controllers/competences.controller.ts"]
end
subgraph "Specialites Module"
SPEC["Specialite Entity<br/>backend/src/modules/specialites/entities/specialite.entity.ts"]
D4["Specialite DTO<br/>backend/src/modules/specialites/dto/specialite.dto.ts"]
S4["Specialites Service<br/>backend/src/modules/specialites/services/specialites.service.ts"]
C4["Specialites Controller<br/>backend/src/modules/specialites/controllers/specialites.controller.ts"]
end
subgraph "Matières Module"
M["Matière Entity<br/>backend/src/modules/matieres/entities/matiere.entity.ts"]
MN["Matière-Niveau Entity<br/>backend/src/modules/matieres/entities/matiere-niveau.entity.ts"]
AM["Affectation-Matière Entity<br/>backend/src/modules/matieres/entities/affectation-matiere.entity.ts"]
end
subgraph "Classes Module"
CL["Classe Entity<br/>backend/src/modules/classes/entities/classe.entity.ts"]
end
CY --> NV
NV --> COMP
COMP --> MN
M --> MN
M --> AM
CL --> MN
CL --> AM
SPEC --> NV
```

**Diagram sources**
- [cycle.entity.ts:18-52](file://backend/src/modules/cycles/entities/cycle.entity.ts#L18-L52)
- [niveau.entity.ts:20-53](file://backend/src/modules/niveaux/entities/niveau.entity.ts#L20-L53)
- [competence.entity.ts:25-70](file://backend/src/modules/competences/entities/competence.entity.ts#L25-L70)
- [specialite.entity.ts:24-57](file://backend/src/modules/specialites/entities/specialite.entity.ts#L24-L57)
- [matiere.entity.ts](file://backend/src/modules/matieres/entities/matiere.entity.ts)
- [matiere-niveau.entity.ts](file://backend/src/modules/matieres/entities/matiere-niveau.entity.ts)
- [affectation-matiere.entity.ts](file://backend/src/modules/matieres/entities/affectation-matiere.entity.ts)
- [classe.entity.ts](file://backend/src/modules/classes/entities/classe.entity.ts)

**Section sources**
- [cycle.entity.ts:18-52](file://backend/src/modules/cycles/entities/cycle.entity.ts#L18-L52)
- [niveau.entity.ts:20-53](file://backend/src/modules/niveaux/entities/niveau.entity.ts#L20-L53)
- [competence.entity.ts:25-70](file://backend/src/modules/competences/entities/competence.entity.ts#L25-L70)
- [specialite.entity.ts:24-57](file://backend/src/modules/specialites/entities/specialite.entity.ts#L24-L57)
- [matiere.entity.ts](file://backend/src/modules/matieres/entities/matiere.entity.ts)
- [matiere-niveau.entity.ts](file://backend/src/modules/matieres/entities/matiere-niveau.entity.ts)
- [affectation-matiere.entity.ts](file://backend/src/modules/matieres/entities/affectation-matiere.entity.ts)
- [classe.entity.ts](file://backend/src/modules/classes/entities/classe.entity.ts)

## Core Components
- **Cycle entity**: UUID primary key with competency attributes including description, duration in years, and sanctioning diploma
- **Niveau entity**: Defines specific grade/level within cycles with UUID foreign key relationships and competency alignment
- **Competence entity**: Manages competency-based learning objectives linked to levels and subjects via UUID relationships
- **Specialite entity**: Handles technical specialization options within educational tracks using UUID foreign keys
- **Controllers**: Expose endpoints for CRUD operations with UUID-based validation
- **Services**: Encapsulate persistence logic with competency and specialization workflows using UUID relationships

**Updated** The core components now use UUID-based relationships exclusively, eliminating string-based codes and establishing proper foreign key constraints throughout the academic hierarchy.

Key capabilities:
- Define competency-based curriculum cycles with UUID primary keys
- Manage competency frameworks aligned with MINESEC standards using UUID relationships
- Support technical specializations for vocational education tracks with UUID foreign keys
- Enable competency mapping to subjects and learning outcomes through UUID associations
- Facilitate multi-track educational pathways with UUID-based validation and foreign key integrity

**Section sources**
- [cycle.entity.ts:29-39](file://backend/src/modules/cycles/entities/cycle.entity.ts#L29-L39)
- [competence.entity.ts:33-43](file://backend/src/modules/competences/entities/competence.entity.ts#L33-L43)
- [specialite.entity.ts:30-37](file://backend/src/modules/specialites/entities/specialite.entity.ts#L30-L37)
- [054-refonte-structure-academique-v2.sql:17-24](file://backend/database/migrations/054-refonte-structure-academique-v2.sql#L17-L24)
- [056-suppression-cycle-scolaire.sql:17-22](file://backend/database/migrations/056-suppression-cycle-scolaire.sql#L17-L22)

## Architecture Overview
The competency-based curriculum architecture follows a layered pattern with UUID-based relationships and enhanced foreign key integrity:
- **Entities**: Define domain models with UUID primary keys and competency attributes and relationships
- **DTOs**: Validate and sanitize request payloads with UUID validation and competency validation
- **Services**: Encapsulate business logic with competency and specialization workflows using UUID relationships
- **Controllers**: Handle HTTP requests with UUID-based access control and foreign key validation

```mermaid
sequenceDiagram
participant Client as "Client"
participant Ctrl as "Competences Controller"
participant Svc as "Competences Service"
participant Repo as "TypeORM Repository"
Client->>Ctrl : POST /competences
Ctrl->>Ctrl : Validate competency payload (UUID format)
Ctrl->>Svc : create(dto)
Svc->>Repo : findOne({ id : uuid })
Repo-->>Svc : existing?
alt exists
Svc-->>Ctrl : error (409)
else not found
Svc->>Repo : create(dto)
Repo-->>Svc : saved entity
Svc-->>Ctrl : competence
end
Ctrl-->>Client : 201 JSON
```

**Diagram sources**
- [competences.controller.ts:32-38](file://backend/src/modules/competences/controllers/competences.controller.ts#L32-L38)
- [competences.service.ts:21-31](file://backend/src/modules/competences/services/competences.service.ts#L21-L31)

**Section sources**
- [competences.controller.ts:17-23](file://backend/src/modules/competences/controllers/competences.controller.ts#L17-L23)
- [competences.service.ts:14-19](file://backend/src/modules/competences/services/competences.service.ts#L14-L19)
- [niveaux.controller.ts:17-23](file://backend/src/modules/niveaux/controllers/niveaux.controller.ts#L17-L23)
- [niveaux.service.ts:14-19](file://backend/src/modules/niveaux/services/niveaux.service.ts#L14-L19)

## Detailed Component Analysis

### Cycle Management with UUID Relationships
- **Enhanced entity fields**: UUID primary key, name, code, description, duration in years, sanctioning diploma, order, activation flag, timestamps
- **Validation**: Name length bounds, code uniqueness, description optional, duration numeric, diploma optional
- **Service logic**: Prevent duplicate cycle codes, fetch all by ascending order, update safely, delete after existence check
- **Controller endpoints**: GET /cycles, POST /cycles, PATCH /cycles/:id, DELETE /cycles/:id

**Updated** Cycles now use UUID primary keys and serve as the single source of truth, eliminating the legacy CycleScolaire enum dependency. The cyclesActifs field in establishment configuration now stores UUID arrays instead of string codes.

```mermaid
classDiagram
class Cycle {
+string id
+string nom
+string code
+string description
+number dureeAnnees
+string diplomeSanctionnant
+number ordre
+boolean actif
+date createdAt
+date updatedAt
}
class EtablissementConfig {
+string id
+string[] cyclesActifs
}
Cycle --> EtablissementConfig : "referenced by UUID"
```

**Diagram sources**
- [cycle.entity.ts:18-52](file://backend/src/modules/cycles/entities/cycle.entity.ts#L18-L52)
- [etablissement-config.entity.ts:1-50](file://backend/src/modules/etablissement/entities/etablissement-config.entity.ts#L1-L50)

**Section sources**
- [cycle.entity.ts:29-39](file://backend/src/modules/cycles/entities/cycle.entity.ts#L29-L39)
- [cycle.dto.ts:16-18](file://backend/src/modules/cycles/dto/cycle.dto.ts#L16-L18)
- [cycles.service.ts:21-31](file://backend/src/modules/cycles/services/cycles.service.ts#L21-L31)
- [cycles.controller.ts:25-38](file://backend/src/modules/cycles/controllers/cycles.controller.ts#L25-L38)
- [056-suppression-cycle-scolaire.sql:17-22](file://backend/database/migrations/056-suppression-cycle-scolaire.sql#L17-L22)

### Level Management with UUID Foreign Keys
- **Entity fields**: UUID primary key, name, optional code, cycleId foreign key (UUID), cycle relation, subsystem enum, order within cycle, activation flag, timestamps
- **Validation**: Name length bounds, optional code, cycleId required (UUID format), subsystem enum, order must be positive integer, activation defaults to true
- **Service logic**: Create, list with optional cycle filter and relations, update safely, delete after existence check
- **Controller endpoints**: GET /niveaux?cycleId=..., POST /niveaux, PATCH /niveaux/:id, DELETE /niveaux/:id

**Updated** Levels now use UUID foreign keys that reference cycle UUIDs, ensuring referential integrity and eliminating string-based code dependencies.

```mermaid
classDiagram
class Niveau {
+string id
+string nom
+string code
+string cycleId
+SousSysteme sousSysteme
+number ordre
+boolean actif
+date createdAt
+date updatedAt
+Cycle cycle
}
class Cycle {
+string id
+string nom
+string code
+string description
+number dureeAnnees
+string diplomeSanctionnant
+number ordre
+boolean actif
}
class SousSysteme {
<<enum>>
"FRANCOPHONE"
"ANGLOPHONE"
"BICULTUREL"
}
Niveau --> Cycle : "belongs to (UUID)"
Niveau --> SousSysteme : "uses"
```

**Diagram sources**
- [niveau.entity.ts:20-53](file://backend/src/modules/niveaux/entities/niveau.entity.ts#L20-L53)
- [cycle.entity.ts:18-52](file://backend/src/modules/cycles/entities/cycle.entity.ts#L18-L52)

**Section sources**
- [niveau.entity.ts:20-53](file://backend/src/modules/niveaux/entities/niveau.entity.ts#L20-L53)
- [niveau.dto.ts:10-17](file://backend/src/modules/niveaux/dto/niveau.dto.ts#L10-L17)
- [niveaux.service.ts:21-32](file://backend/src/modules/niveaux/services/niveaux.service.ts#L21-L32)
- [niveaux.controller.ts:25-39](file://backend/src/modules/niveaux/controllers/niveaux.controller.ts#L25-L39)

### Competency-Based Learning Framework
- **Entity fields**: UUID primary key, unique code, label, optional description, domain, levelId foreign key (UUID), optional subjectId, order, activation flag, timestamps
- **Validation**: Code uniqueness, label length bounds, domain required, levelId required (UUID format), order must be positive integer
- **Service logic**: Create competency definitions, link to levels and subjects, manage competency hierarchies
- **Controller endpoints**: GET /competences, GET /competences/all, GET /competences/niveau/:id, GET /competences/matiere/:id, GET /competences/:id, POST /competences, PATCH /competences/:id, DELETE /competences/:id

**New** The Competences module manages competency-based learning objectives aligned with MINESEC standards, utilizing UUID relationships for enhanced referential integrity.

```mermaid
classDiagram
class Competence {
+string id
+string code
+string libelle
+string description
+string domaine
+string niveauId
+Niveau niveau
+string matiereId
+Matiere matiere
+number ordre
+boolean actif
+date createdAt
+date updatedAt
}
class Niveau {
+string id
+string nom
+string code
+string cycleId
+SousSysteme sousSysteme
+number ordre
+boolean actif
}
class Matiere {
+string id
+string nom
+string code
+string description
+number ordre
+boolean actif
}
Competence --> Niveau : "mapped to (UUID)"
Competence --> Matiere : "optionally linked to"
```

**Diagram sources**
- [competence.entity.ts:25-70](file://backend/src/modules/competences/entities/competence.entity.ts#L25-L70)
- [niveau.entity.ts:20-53](file://backend/src/modules/niveaux/entities/niveau.entity.ts#L20-L53)
- [matiere.entity.ts](file://backend/src/modules/matieres/entities/matiere.entity.ts)

**Section sources**
- [competence.entity.ts:33-43](file://backend/src/modules/competences/entities/competence.entity.ts#L33-L43)
- [competence.dto.ts:10-17](file://backend/src/modules/competences/dto/competence.dto.ts#L10-L17)
- [competences.service.ts:21-32](file://backend/src/modules/competences/services/competences.service.ts#L21-L32)
- [competences.controller.ts:25-54](file://backend/src/modules/competences/controllers/competences.controller.ts#L25-L54)

### Technical Specializations
- **Entity fields**: UUID primary key, name, code, optional description, filiereId foreign key (UUID), order, activation flag, timestamps
- **Validation**: Name length bounds, code uniqueness, description optional, filiereId required (UUID format), order must be positive integer
- **Service logic**: Create specializations, link to technical tracks, manage specialization hierarchies
- **Controller endpoints**: GET /specialites, GET /specialites/filiere/:id, GET /specialites/:id, POST /specialites, PATCH /specialites/:id, DELETE /specialites/:id

**New** The Specialites module handles technical specialization options within vocational education tracks, using UUID foreign keys for enhanced referential integrity.

```mermaid
classDiagram
class Specialite {
+string id
+string nom
+string code
+string description
+string filiereId
+Filiere filiere
+number ordre
+boolean actif
+date createdAt
+date updatedAt
}
class Filiere {
+string id
+string nom
+string code
+string description
+number ordre
+boolean actif
}
Specialite --> Filiere : "belongs to (UUID)"
```

**Diagram sources**
- [specialite.entity.ts:24-57](file://backend/src/modules/specialites/entities/specialite.entity.ts#L24-L57)

**Section sources**
- [specialite.entity.ts:30-37](file://backend/src/modules/specialites/entities/specialite.entity.ts#L30-L37)
- [specialite.dto.ts:10-17](file://backend/src/modules/specialites/dto/specialite.dto.ts#L10-L17)
- [specialites.service.ts:21-32](file://backend/src/modules/specialites/services/specialites.service.ts#L21-L32)
- [specialites.controller.ts:25-54](file://backend/src/modules/specialites/controllers/specialites.controller.ts#L25-L54)

### Subject Offerings and Curriculum Mapping
Subject offerings are mapped to levels and competencies using UUID relationships:
- **Matière entity**: subject definition with competency alignment
- **Matière-Niveau entity**: links subjects to levels via UUID foreign keys (many-to-many)
- **Affectation-Matière entity**: assigns subjects to classrooms with teacher and period details using UUID relationships
- **Classe entity**: classroom grouping students and linking to levels and subjects via UUID associations

**Updated** Subject mappings now use UUID foreign keys throughout, ensuring referential integrity and eliminating string-based dependencies.

```mermaid
erDiagram
CYCLE ||--o{ NIVEAU : "contains"
NIVEAU ||--o{ COMPETENCE : "develops"
COMPETENCE ||--o{ MATIERE_NIVEAU : "measures"
MATIERE ||--o{ MATIERE_NIVEAU : "taught at"
MATIERE ||--o{ AFFECTATION_MATIERE : "assigned to"
CLASSE ||--o{ AFFECTATION_MATIERE : "hosts"
CLASSE ||--o{ MATIERE_NIVEAU : "learns"
SPECIALITE ||--o{ NIVEAU : "supports"
```

**Diagram sources**
- [cycle.entity.ts:18-52](file://backend/src/modules/cycles/entities/cycle.entity.ts#L18-L52)
- [niveau.entity.ts:20-53](file://backend/src/modules/niveaux/entities/niveau.entity.ts#L20-L53)
- [competence.entity.ts:25-70](file://backend/src/modules/competences/entities/competence.entity.ts#L25-L70)
- [specialite.entity.ts:24-57](file://backend/src/modules/specialites/entities/specialite.entity.ts#L24-L57)
- [matiere.entity.ts](file://backend/src/modules/matieres/entities/matiere.entity.ts)
- [matiere-niveau.entity.ts](file://backend/src/modules/matieres/entities/matiere-niveau.entity.ts)
- [affectation-matiere.entity.ts](file://backend/src/modules/matieres/entities/affectation-matiere.entity.ts)
- [classe.entity.ts](file://backend/src/modules/classes/entities/classe.entity.ts)

**Section sources**
- [matiere.entity.ts](file://backend/src/modules/matieres/entities/matiere.entity.ts)
- [matiere-niveau.entity.ts](file://backend/src/modules/matieres/entities/matiere-niveau.entity.ts)
- [affectation-matiere.entity.ts](file://backend/src/modules/matieres/entities/affectation-matiere.entity.ts)
- [classe.entity.ts](file://backend/src/modules/classes/entities/classe.entity.ts)

### Controller Endpoints for UUID-Based Curriculum
- **Cycles**:
  - GET /cycles: List all cycles ordered by ascending order
  - POST /cycles: Create a new cycle with competency attributes
  - PATCH /cycles/:id: Update a cycle
  - DELETE /cycles/:id: Delete a cycle
- **Niveaux**:
  - GET /niveaux?cycleId={uuid}: List levels filtered by cycle UUID, ordered by cycle and level order
  - POST /niveaux: Create a new level
  - PATCH /niveaux/:id: Update a level
  - DELETE /niveaux/:id: Delete a level
- **Competences**:
  - GET /competences: List all competencies with pagination
  - GET /competences/all: List all competencies without pagination
  - GET /competences/niveau/:id: List competencies by level UUID
  - GET /competences/matiere/:id: List competencies by subject UUID
  - GET /competences/:id: Get competency detail
  - POST /competences: Create a new competency (requires admin)
  - PATCH /competences/:id: Update a competency
  - DELETE /competences/:id: Delete a competency
- **Specialites**:
  - GET /specialites: List all specializations with pagination
  - GET /specialites/filiere/:id: List specializations by technical track UUID
  - GET /specialites/:id: Get specialization detail
  - POST /specialites: Create a new specialization (requires admin)
  - PATCH /specialites/:id: Update a specialization
  - DELETE /specialites/:id: Delete a specialization

**Updated** New endpoints support UUID-based relationships throughout the curriculum structure, replacing string-based codes with UUID validation and foreign key constraints.

Access control:
- Authentication middleware applied to all endpoints
- Authorization requires ADMIN or SUPER_ADMIN roles for write operations

Validation:
- Zod schemas validate UUID format and raise structured errors on failure

**Section sources**
- [cycles.controller.ts:25-53](file://backend/src/modules/cycles/controllers/cycles.controller.ts#L25-L53)
- [niveaux.controller.ts:25-54](file://backend/src/modules/niveaux/controllers/niveaux.controller.ts#L25-L54)
- [competences.controller.ts:25-103](file://backend/src/modules/competences/controllers/competences.controller.ts#L25-L103)
- [specialites.controller.ts:25-103](file://backend/src/modules/specialites/controllers/specialites.controller.ts#L25-L103)
- [cycle.dto.ts:16-18](file://backend/src/modules/cycles/dto/cycle.dto.ts#L16-L18)
- [niveau.dto.ts:10-17](file://backend/src/modules/niveaux/dto/niveau.dto.ts#L10-L17)
- [competence.dto.ts:10-17](file://backend/src/modules/competences/dto/competence.dto.ts#L10-L17)
- [specialite.dto.ts:10-17](file://backend/src/modules/specialites/dto/specialite.dto.ts#L10-L17)

### Defining UUID-Based Curriculum Structures
To define a competency-based curriculum with UUID relationships:
- Create cycles with UUID primary keys and competency attributes (description, duration, diploma) to represent educational stages
- Create levels within each cycle using UUID foreign keys with ascending order to represent grade progression
- Define competencies aligned with MINESEC standards linking to specific levels and subjects via UUID relationships
- Establish technical specializations for vocational tracks using UUID foreign keys
- Assign subsystems per level to reflect language-of-instruction policies

**Updated** The curriculum definition now emphasizes UUID-based relationships with technical specialization options, ensuring referential integrity throughout the academic hierarchy.

Example workflow:
- POST /cycles with code=PRIMAIRE, nom="Primary", description="Elementary education cycle", dureeAnnees=6, diplomeSanctionnant="CEP"
- POST /niveaux with cycleId=uuid-primary-id, nom="Grade 1", ordre=1, sousSysteme=FRANCOPHONE
- POST /competences with code=MATH_01, libelle="Solve linear equations", domaine="Mathematics", niveauId=uuid-grade1-id
- POST /specialites with code=F1_MA, nom="Automotive Maintenance", filiereId=uuid-filiere-tech-id

**Section sources**
- [cycle.dto.ts:16-18](file://backend/src/modules/cycles/dto/cycle.dto.ts#L16-L18)
- [niveau.dto.ts:10-17](file://backend/src/modules/niveaux/dto/niveau.dto.ts#L10-L17)
- [competence.dto.ts:10-17](file://backend/src/modules/competences/dto/competence.dto.ts#L10-L17)
- [specialite.dto.ts:10-17](file://backend/src/modules/specialites/dto/specialite.dto.ts#L10-L17)
- [etablissement.entity.ts:17-21](file://backend/src/modules/etablissement/entities/etablissement.entity.ts#L17-L21)

### Handling Level Transitions with UUID-Based Validation
Level transitions occur with competency validation and progress tracking using UUID relationships:
- Maintain ascending order within cycles to ensure logical progression
- Use UUID foreign keys to constrain transitions to valid levels
- Track competency mastery during transitions using UUID-based competency relationships
- Combine with classroom assignments to manage cohort movement using UUID associations
- Monitor competency gaps and remediation needs through UUID-based tracking

**Updated** Transitions now include UUID-based validation to ensure students meet learning outcomes before advancement, leveraging foreign key constraints for data integrity.

```mermaid
flowchart TD
Start(["Transition Request"]) --> Validate["Validate target level UUID exists<br/>and competency requirements"]
Validate --> Competency{"Competency Mastery?"}
Competency --> |No| GapAnalysis["Identify Competency Gaps"]
GapAnalysis --> Remediation["Plan Remediation Activities"]
Remediation --> Reassessment["Reassess Competency"]
Reassessment --> CompetencyCheck{"Competency Achieved?"}
CompetencyCheck --> |No| Hold["Hold Transition"]
CompetencyCheck --> |Yes| Assign["Assign student to new classroom<br/>linked to target level UUID"]
Competency --> |Yes| Assign
Assign --> Update["Update enrollment records<br/>and competency transcripts"]
Update --> Done(["Transition Complete"])
Hold --> Done
```

**Diagram sources**
- [niveaux.service.ts:34-38](file://backend/src/modules/niveaux/services/niveaux.service.ts#L34-L38)
- [competence.entity.ts:33-43](file://backend/src/modules/competences/entities/competence.entity.ts#L33-L43)
- [classe.entity.ts](file://backend/src/modules/classes/entities/classe.entity.ts)

**Section sources**
- [niveaux.service.ts:34-38](file://backend/src/modules/niveaux/services/niveaux.service.ts#L34-L38)
- [competence.entity.ts:33-43](file://backend/src/modules/competences/entities/competence.entity.ts#L33-L43)

### Integrating with UUID-Based Subject Offerings
Integrate curriculum levels with competency-based subjects using UUID relationships:
- Use Matière-Niveau to map subjects to levels with competency alignment via UUID foreign keys
- Use Affectation-Matière to assign subjects to classrooms and periods using UUID associations
- Use Classe to group students by level and track competency progress through UUID relationships
- Leverage competences for assessment and reporting with UUID-based competency tracking

**Updated** Integration now emphasizes UUID-based relationships in subject offerings and assessment, ensuring referential integrity throughout the academic structure.

```mermaid
sequenceDiagram
participant Admin as "Admin"
participant Ctrl as "Competences Controller"
participant Svc as "Competences Service"
participant Repo as "TypeORM Repository"
participant Subj as "Matieres Module"
Admin->>Ctrl : POST /competences
Ctrl->>Svc : create(dto)
Svc->>Repo : save(competence)
Repo-->>Svc : saved
Svc-->>Ctrl : competence
Ctrl-->>Admin : 201
Admin->>Subj : POST /matiere-niveau (link level UUID to competency-aligned subject UUID)
Admin->>Subj : POST /affectation-matiere (assign to classroom with UUID associations)
```

**Diagram sources**
- [competences.controller.ts:33-37](file://backend/src/modules/competences/controllers/competences.controller.ts#L33-L37)
- [competences.service.ts:21-26](file://backend/src/modules/competences/services/competences.service.ts#L21-L26)
- [matiere-niveau.entity.ts](file://backend/src/modules/matieres/entities/matiere-niveau.entity.ts)
- [affectation-matiere.entity.ts](file://backend/src/modules/matieres/entities/affectation-matiere.entity.ts)

**Section sources**
- [competences.controller.ts:33-37](file://backend/src/modules/competences/controllers/competences.controller.ts#L33-L37)
- [competences.service.ts:21-26](file://backend/src/modules/competences/services/competences.service.ts#L21-L26)
- [matiere-niveau.entity.ts](file://backend/src/modules/matieres/entities/matiere-niveau.entity.ts)
- [affectation-matiere.entity.ts](file://backend/src/modules/matieres/entities/affectation-matiere.entity.ts)

### Multi-Grade Classroom Scenarios and Flexible Design
- Multi-grade classrooms can be modeled by assigning multiple levels to a single classroom via UUID-based competency-aligned subject mappings
- Flexible curriculum designs can leverage subsystems (e.g., bilingual) and allow different competency development timelines through UUID-based relationships
- Technical specializations enable diverse career pathways while maintaining competency standards using UUID foreign keys
- Use competency frameworks to define major academic tracks while keeping level progression coherent through UUID-based validation

**Updated** Multi-grade scenarios now support UUID-based tracking with technical specialization options, ensuring referential integrity throughout the academic structure.

**Section sources**
- [niveau.entity.ts:39-43](file://backend/src/modules/niveaux/entities/niveau.entity.ts#L39-L43)
- [competence.entity.ts:33-43](file://backend/src/modules/competences/entities/competence.entity.ts#L33-L43)
- [specialite.entity.ts:30-37](file://backend/src/modules/specialites/entities/specialite.entity.ts#L30-L37)
- [etablissement.entity.ts:17-21](file://backend/src/modules/etablissement/entities/etablissement.entity.ts#L17-L21)

## Competency-Based Learning Approach
The system now implements a comprehensive competency-based learning framework aligned with MINESEC standards using UUID relationships:

### Core Competency Framework
- **Competency Codes**: Unique identifiers (e.g., MATH_01, SCI_02) for tracking and assessment
- **Learning Domains**: Mathematics, Sciences, Languages, History-Geography, Arts, Technology
- **Competency Alignment**: Direct mapping between competencies and educational levels via UUID relationships
- **Assessment Integration**: Competency-based evaluation replacing traditional grading systems with UUID-based tracking

### Implementation Details
- **Seed Data**: Comprehensive competency frameworks seeded from MINESEC programs with UUID relationships
- **API Integration**: Competency data accessible through RESTful endpoints with UUID validation
- **Progress Tracking**: Student competency mastery monitoring and reporting through UUID-based competency relationships
- **Curriculum Mapping**: Competencies integrated into subject offerings and learning pathways using UUID foreign keys

**New** The competency-based approach replaces traditional grade-focused assessment with competency mastery tracking, supporting personalized learning and competency validation through UUID-based relationships.

**Section sources**
- [competence.entity.ts:33-43](file://backend/src/modules/competences/entities/competence.entity.ts#L33-L43)
- [seed-specialites-competences.ts:37-120](file://backend/src/database/seeds/seed-specialites-competences.ts#L37-L120)
- [054-refonte-structure-academique-v2.sql:64-76](file://backend/database/migrations/054-refonte-structure-academique-v2.sql#L64-L76)

## Technical Specializations
The system supports technical and vocational specializations within the competency framework using UUID relationships:

### Specialization Categories
- **Engineering Technologies**: Mechanical Engineering, Electrical Engineering, Civil Engineering
- **Industrial Technologies**: Manufacturing, Metallurgy, Chemical Processing
- **Business Technologies**: Accounting, Finance, Marketing, Human Resources
- **Creative Technologies**: Graphic Design, Fine Arts, Culinary Arts
- **Hospitality Technologies**: Hotel Management, Restaurant Operations, Tourism

### Implementation Features
- **Specialization Codes**: Unique identifiers for technical programs (e.g., MA, EI, CG)
- **Curriculum Alignment**: Specializations aligned with national technical education standards using UUID foreign keys
- **Industry Partnerships**: Curriculum designed for industry certification and employment readiness through UUID-based relationships
- **Competency Integration**: Technical competencies mapped to specialization requirements using UUID associations

**New** Technical specializations provide structured pathways for vocational education with competency-based assessment and industry-aligned training programs using UUID-based foreign key relationships.

**Section sources**
- [specialite.entity.ts:30-37](file://backend/src/modules/specialites/entities/specialite.entity.ts#L30-L37)
- [seed-specialites-competences.ts:61-109](file://backend/src/database/seeds/seed-specialites-competences.ts#L61-L109)
- [054-refonte-structure-academique-v2.sql:45-57](file://backend/database/migrations/054-refonte-structure-academique-v2.sql#L45-L57)

## Dependency Analysis
- Cycles, Niveaux, and Competences share UUID-based relationships through competency alignment
- Specialites integrates with Niveaux through UUID-based technical track relationships
- Matières integrates with Niveaux and Classes through UUID-based competency-aligned mappings
- Controllers depend on Services and DTOs for validation and authorization with UUID format validation
- Services depend on repositories and centralized error handling with UUID-based foreign key constraints

**Updated** Dependencies now emphasize UUID relationships and technical specialization connections throughout the academic hierarchy.

```mermaid
graph LR
CtlC["Cycles Controller"] --> SvcC["Cycles Service"]
CtlN["Niveaux Controller"] --> SvcN["Niveaux Service"]
CtlComp["Competences Controller"] --> SvcComp["Competences Service"]
CtlSpec["Specialites Controller"] --> SvcSpec["Specialites Service"]
SvcC --> RepoC["Cycle Repository"]
SvcN --> RepoN["Niveau Repository"]
SvcComp --> RepoComp["Competence Repository"]
SvcSpec --> RepoSpec["Specialite Repository"]
SvcC --> Err["AppError"]
SvcN --> Err
SvcComp --> Err
SvcSpec --> Err
SvcC --> Log["Logger Utility"]
SvcN --> Log
SvcComp --> Log
SvcSpec --> Log
```

**Diagram sources**
- [cycles.controller.ts:7-12](file://backend/src/modules/cycles/controllers/cycles.controller.ts#L7-L12)
- [niveaux.controller.ts:7-12](file://backend/src/modules/niveaux/controllers/niveaux.controller.ts#L7-L12)
- [competences.controller.ts:7-12](file://backend/src/modules/competences/controllers/competences.controller.ts#L7-L12)
- [specialites.controller.ts:7-12](file://backend/src/modules/specialites/controllers/specialites.controller.ts#L7-L12)
- [cycles.service.ts:7-12](file://backend/src/modules/cycles/services/cycles.service.ts#L7-L12)
- [niveaux.service.ts:7-12](file://backend/src/modules/niveaux/services/niveaux.service.ts#L7-L12)
- [competences.service.ts:7-12](file://backend/src/modules/competences/services/competences.service.ts#L7-L12)
- [specialites.service.ts:7-12](file://backend/src/modules/specialites/services/specialites.service.ts#L7-L12)

**Section sources**
- [cycles.controller.ts:7-12](file://backend/src/modules/cycles/controllers/cycles.controller.ts#L7-L12)
- [niveaux.controller.ts:7-12](file://backend/src/modules/niveaux/controllers/niveaux.controller.ts#L7-L12)
- [competences.controller.ts:7-12](file://backend/src/modules/competences/controllers/competences.controller.ts#L7-L12)
- [specialites.controller.ts:7-12](file://backend/src/modules/specialites/controllers/specialites.controller.ts#L7-L12)
- [cycles.service.ts:7-12](file://backend/src/modules/cycles/services/cycles.service.ts#L7-L12)
- [niveaux.service.ts:7-12](file://backend/src/modules/niveaux/services/niveaux.service.ts#L7-L12)
- [competences.service.ts:7-12](file://backend/src/modules/competences/services/competences.service.ts#L7-L12)
- [specialites.service.ts:7-12](file://backend/src/modules/specialites/services/specialites.service.ts#L7-L12)

## Performance Considerations
- **Indexing**: Niveau entity includes indexes on cycleId UUID foreign keys and level relationships
- **Competency Indexes**: Competence entity includes composite indexes for level-UUID-subject relationships
- **Specialization Indexes**: Specialite entity includes indexes on filiereId UUID foreign keys for performance
- **Ordering**: Queries sort by cycle, level, and competency order to maintain predictable traversal
- **Relations**: Lazy loading via UUID-based relations reduces payload sizes when not needed
- **Validation**: Centralized Zod schemas validate UUID format and prevent redundant validation logic
- **Foreign Key Integrity**: UUID-based foreign keys ensure referential integrity and eliminate string-based lookup overhead

**Updated** Performance considerations now include UUID-based indexing strategies and foreign key integrity benefits.

**Section sources**
- [niveau.entity.ts:21-31](file://backend/src/modules/niveaux/entities/niveau.entity.ts#L21-L31)
- [competence.entity.ts:26-28](file://backend/src/modules/competences/entities/competence.entity.ts#L26-L28)
- [specialite.entity.ts:25](file://backend/src/modules/specialites/entities/specialite.entity.ts#L25)

## Troubleshooting Guide
Common issues and resolutions:
- **Invalid UUID format**: Creation fails with validation error; ensure UUID format for cycleId, niveauId, and other UUID fields
- **UUID not found errors**: Fetch/update/delete on non-existent entities trigger not found errors; verify UUID existence in related tables
- **Foreign key constraint violations**: Attempting to reference non-existent UUIDs causes constraint errors; ensure referenced entities exist
- **UUID duplication**: Duplicate UUIDs cause creation failures; ensure unique UUID generation for entities
- **UUID conversion issues**: Legacy string codes cause conversion errors; migrate to UUID-based relationships
- **Establishment configuration errors**: cyclesActifs field expects UUID array format; ensure proper UUID array syntax

**Updated** Troubleshooting now includes UUID-specific issues and foreign key constraint problems.

Operational logging:
- Services log creation and deletion events for auditability with UUID-based tracking
- UUID-based operations tracked for compliance monitoring and data integrity verification

**Section sources**
- [cycles.service.ts:22-25](file://backend/src/modules/cycles/services/cycles.service.ts#L22-L25)
- [competences.service.ts:39](file://backend/src/modules/competences/services/competences.service.ts#L39)
- [specialites.service.ts:36](file://backend/src/modules/specialites/services/specialites.service.ts#L36)
- [cycles.controller.ts:17-23](file://backend/src/modules/cycles/controllers/cycles.controller.ts#L17-L23)
- [competences.controller.ts:17-23](file://backend/src/modules/competences/controllers/competences.controller.ts#L17-L23)
- [specialites.controller.ts:17-23](file://backend/src/modules/specialites/controllers/specialites.controller.ts#L17-L23)

## Conclusion
The competency-based curriculum structure module provides a robust foundation for modern educational management with UUID-based relationships. The migration from string-based cycle codes to UUID-based relationships eliminates legacy dependencies, establishes proper foreign key constraints, and supports diverse educational tracks, competency-based assessment, and flexible technical pathways. The controller endpoints and service layers ensure secure, auditable, and scalable operations aligned with contemporary pedagogical standards while maintaining data integrity through UUID-based foreign key relationships.

**Updated** The system now emphasizes UUID-based relationships throughout the academic hierarchy, replacing the previous dual-source model with a single, unified UUID-based approach that ensures referential integrity and supports flexible academic structures.

## Appendices
- **Enumerations used**: None (eliminated CycleScolaire enum dependency)
- **Competency Domains**: Mathematics, Sciences, Languages, History-Geography, Arts, Technology
- **Specialization Categories**: Engineering, Industrial, Business, Creative, Hospitality technologies
- **UUID Format**: Universally Unique Identifier (UUID v4) format for all foreign key relationships

**Section sources**
- [etablissement.entity.ts:17-36](file://backend/src/modules/etablissement/entities/etablissement.entity.ts#L17-L36)
- [competence.entity.ts:42](file://backend/src/modules/competences/entities/competence.entity.ts#L42)
- [specialite.entity.ts:30-31](file://backend/src/modules/specialites/entities/specialite.entity.ts#L30-L31)
- [056-suppression-cycle-scolaire.sql:17-22](file://backend/database/migrations/056-suppression-cycle-scolaire.sql#L17-L22)