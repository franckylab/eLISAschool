# Recruitment Management Module

<cite>
**Referenced Files in This Document**
- [app.ts](file://backend/src/app.ts)
- [index.ts](file://backend/src/modules/index.ts)
- [recrutement.controller.ts](file://backend/src/modules/recrutement/controllers/recrutement.controller.ts)
- [recrutement.service.ts](file://backend/src/modules/recrutement/services/recrutement.service.ts)
- [recrutement.entity.ts](file://backend/src/modules/recrutement/entities/recrutement.entity.ts)
- [recrutement.dto.ts](file://backend/src/modules/recrutement/dto/recrutement.dto.ts)
- [045-module-recrutement.sql](file://backend/database/migrations/045-module-recrutement.sql)
- [deploy-recrutement.sh](file://scripts/deploy-recrutement.sh)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [API Endpoints](#api-endpoints)
7. [Database Schema](#database-schema)
8. [Deployment and Integration](#deployment-and-integration)
9. [Performance Considerations](#performance-considerations)
10. [Troubleshooting Guide](#troubleshooting-guide)
11. [Conclusion](#conclusion)

## Introduction

The Recruitment Management Module is a comprehensive human resources solution integrated into the eLISAschool educational management platform. This module provides complete functionality for managing job recruitment processes, including job postings, candidate applications, evaluation workflows, and recruitment analytics. Built with a modern NestJS architecture, the module follows clean separation of concerns with dedicated controllers, services, DTOs, and entities.

The module supports multi-establishment environments, allowing different school establishments to manage their own recruitment processes independently while maintaining centralized oversight capabilities. It integrates seamlessly with the broader eLISAschool ecosystem, leveraging shared authentication, authorization, and notification systems.

## Project Structure

The Recruitment Management Module follows a structured MVC (Model-View-Controller) pattern with clear separation of concerns:

```mermaid
graph TB
subgraph "Recruitment Module Structure"
Controllers["Controllers<br/>- recrutement.controller.ts"]
Services["Services<br/>- recrutement.service.ts"]
Entities["Entities<br/>- recrutement.entity.ts"]
DTOs["DTOs<br/>- recrutement.dto.ts"]
Routes["Routes<br/>- /api/recrutement/*"]
end
subgraph "Integration Layer"
App["App Configuration<br/>- app.ts"]
Index["Module Export<br/>- index.ts"]
Migration["Database Migration<br/>- 045-module-recrutement.sql"]
end
Controllers --> Services
Services --> Entities
Controllers --> DTOs
Routes --> Controllers
App --> Routes
Index --> App
Migration --> Entities
```

**Diagram sources**
- [app.ts:269-270](file://backend/src/app.ts#L269-L270)
- [index.ts:57-58](file://backend/src/modules/index.ts#L57-L58)
- [recrutement.controller.ts:1-20](file://backend/src/modules/recrutement/controllers/recrutement.controller.ts#L1-L20)

**Section sources**
- [app.ts:75](file://backend/src/app.ts#L75)
- [app.ts:269-270](file://backend/src/app.ts#L269-L270)
- [index.ts:57-58](file://backend/src/modules/index.ts#L57-L58)

## Core Components

### Controller Layer
The controller serves as the primary interface for external requests, handling HTTP operations and delegating business logic to service layer components. It implements comprehensive CRUD operations for both job offers and candidate applications.

### Service Layer
The service layer encapsulates business logic and coordinates between controllers and data access layers. It handles complex operations like offer lifecycle management, candidate evaluation workflows, and statistical reporting.

### Entity Layer
The entity layer defines the data model structure for recruitment-related data, including job offers, applications, evaluations, and related metadata.

### DTO Layer
The DTO (Data Transfer Object) layer ensures proper data validation and transformation between external requests and internal business logic.

**Section sources**
- [recrutement.controller.ts:1-20](file://backend/src/modules/recrutement/controllers/recrutement.controller.ts#L1-L20)
- [recrutement.service.ts:1-30](file://backend/src/modules/recrutement/services/recrutement.service.ts#L1-L30)
- [recrutement.entity.ts:1-40](file://backend/src/modules/recrutement/entities/recrutement.entity.ts#L1-L40)
- [recrutement.dto.ts:1-30](file://backend/src/modules/recrutement/dto/recrutement.dto.ts#L1-L30)

## Architecture Overview

The Recruitment Management Module implements a layered architecture following RESTful principles:

```mermaid
sequenceDiagram
participant Client as "Client Application"
participant Controller as "Recruitment Controller"
participant Service as "Recruitment Service"
participant Entity as "Recruitment Entity"
participant DB as "Database"
Client->>Controller : HTTP Request (GET/POST/PUT/DELETE)
Controller->>Controller : Validate Request DTO
Controller->>Service : Delegate Business Logic
Service->>Entity : Transform Data Model
Service->>DB : Execute Database Operations
DB-->>Service : Query Results
Service-->>Controller : Business Response
Controller-->>Client : HTTP Response
Note over Controller,Service : Handles Authentication & Authorization
Note over Service,DB : Manages Transaction & Data Integrity
```

**Diagram sources**
- [recrutement.controller.ts:56-93](file://backend/src/modules/recrutement/controllers/recrutement.controller.ts#L56-L93)
- [recrutement.service.ts:1-50](file://backend/src/modules/recrutement/services/recrutement.service.ts#L1-L50)

The architecture emphasizes:
- **Separation of Concerns**: Clear boundaries between controller, service, and data layers
- **Dependency Injection**: Modular design enabling easy testing and maintenance
- **Transaction Management**: Consistent data handling across complex operations
- **Error Handling**: Comprehensive exception management throughout the call chain

## Detailed Component Analysis

### Recruitment Controller

The controller implements a comprehensive set of endpoints for managing recruitment operations:

```mermaid
classDiagram
class RecruitmentController {
+findOffres(query, etablissementId) Response
+findOffreById(id, etablissementId) Response
+createOffre(dto, userId, etablissementId) Response
+updateOffre(id, dto, userId, etablissementId) Response
+publierOffre(id, userId, etablissementId) Response
+cloturerOffre(id, userId, etablissementId) Response
+getStatistiquesOffres(etablissementId) Response
+findCandidatures(query, etablissementId) Response
+findCandidatureById(id, etablissementId) Response
+createCandidature(dto, etablissementId) Response
+evaluerCandidature(id, dto, userId, etablissementId) Response
+shortlistCandidature(id, userId, etablissementId) Response
+convoquerCandidature(id, userId, etablissementId) Response
+retenirCandidature(id, userId, etablissementId) Response
+refuserCandidature(id, userId, etablissementId) Response
+getPipelineStats(offreId, etablissementId) Response
}
```

**Diagram sources**
- [recrutement.controller.ts:56-179](file://backend/src/modules/recrutement/controllers/recrutement.controller.ts#L56-L179)

Key operational flows include:
- **Job Offer Lifecycle Management**: Complete CRUD operations with status transitions
- **Candidate Application Processing**: Multi-stage evaluation workflows
- **Statistical Reporting**: Pipeline analytics and recruitment metrics
- **Multi-establishment Support**: Tenant-aware data isolation

### Recruitment Service

The service layer provides sophisticated business logic for recruitment operations:

```mermaid
flowchart TD
Start([Service Method Call]) --> Validate["Validate Input Parameters"]
Validate --> Operation{"Operation Type?"}
Operation --> |Offer CRUD| OfferOps["Offer Operations"]
Operation --> |Application CRUD| AppOps["Application Operations"]
Operation --> |Evaluation| EvalOps["Evaluation Workflow"]
Operation --> |Statistics| StatOps["Statistical Analysis"]
OfferOps --> StatusCheck["Check Offer Status"]
StatusCheck --> StatusValid{"Status Valid?"}
StatusValid --> |Yes| ProcessOffer["Process Offer Operation"]
StatusValid --> |No| RejectOffer["Reject with Error"]
AppOps --> CandidateOps["Candidate Application Logic"]
EvalOps --> WorkflowOps["Evaluation Workflow"]
StatOps --> AnalyticsOps["Generate Statistics"]
ProcessOffer --> DatabaseOps["Database Operations"]
CandidateOps --> DatabaseOps
WorkflowOps --> DatabaseOps
AnalyticsOps --> DatabaseOps
DatabaseOps --> ReturnResult["Return Processed Result"]
RejectOffer --> ReturnError["Return Error Response"]
ReturnResult --> End([Method Exit])
ReturnError --> End
```

**Diagram sources**
- [recrutement.service.ts:1-100](file://backend/src/modules/recrutement/services/recrutement.service.ts#L1-L100)

**Section sources**
- [recrutement.controller.ts:56-179](file://backend/src/modules/recrutement/controllers/recrutement.controller.ts#L56-L179)
- [recrutement.service.ts:1-150](file://backend/src/modules/recrutement/services/recrutement.service.ts#L1-L150)

## API Endpoints

The module exposes a comprehensive REST API organized into logical resource groups:

### Job Offers Endpoints
- `GET /api/recrutement/offres` - List all job offers with filtering and pagination
- `GET /api/recrutement/offres/:id` - Retrieve specific job offer details
- `POST /api/recrutement/offres` - Create new job offer
- `PUT /api/recrutement/offres/:id` - Update existing job offer
- `PATCH /api/recrutement/offres/:id/publier` - Publish job offer
- `PATCH /api/recrutement/offres/:id/cloturer` - Close job offer

### Candidate Applications Endpoints
- `GET /api/recrutement/candidatures` - List all applications with filtering
- `GET /api/recrutement/candidatures/:id` - Retrieve specific application
- `POST /api/recrutement/candidatures` - Submit new application
- `PATCH /api/recrutement/candidatures/:id/evaluer` - Evaluate application
- `PATCH /api/recrutement/candidatures/:id/shortlist` - Move to shortlist
- `PATCH /api/recrutement/candidatures/:id/convoquer` - Schedule interview
- `PATCH /api/recrutement/candidatures/:id/retenir` - Select candidate
- `PATCH /api/recrutement/candidatures/:id/refuser` - Reject application

### Analytics Endpoints
- `GET /api/recrutement/statistiques` - Get recruitment statistics
- `GET /api/recrutement/pipeline/:offreId` - Get application pipeline

**Section sources**
- [recrutement.controller.ts:56-179](file://backend/src/modules/recrutement/controllers/recrutement.controller.ts#L56-L179)

## Database Schema

The recruitment module utilizes a normalized relational schema designed for scalability and maintainability:

```mermaid
erDiagram
OFFRES_RECRUTEMENT {
uuid id PK
uuid etablissement_id FK
string titre
text description
string type_contrat
string emplacement
decimal salaire_min
decimal salaire_max
string statut
date date_publication
date date_cloture
int nombre_postes
text competences_requises
timestamp created_at
timestamp updated_at
uuid created_by
uuid updated_by
}
CANDIDATURES {
uuid id PK
uuid offre_id FK
uuid etablissement_id FK
uuid eleve_id FK
string statut
text cv_url
text lettre_motivation
json competences_validees
json notes_evaluation
timestamp date_application
timestamp date_derniere_mise_a_jour
uuid created_by
uuid updated_by
}
EVALUATIONS {
uuid id PK
uuid candidature_id FK
uuid utilisateur_id FK
string type_evaluation
int note
text commentaire
timestamp date_evaluation
}
OFFRES_RECRUTEMENT ||--o{ CANDIDATURES : "contains"
CANDIDATURES ||--o{ EVALUATIONS : "generates"
```

**Diagram sources**
- [045-module-recrutement.sql:1-200](file://backend/database/migrations/045-module-recrutement.sql#L1-L200)

Key schema features include:
- **Tenant Isolation**: All entities include establishment identifiers for multi-tenant support
- **Audit Trail**: Comprehensive creation and modification tracking
- **Flexible Status Management**: Enumerated status fields supporting recruitment workflows
- **Competency Tracking**: Structured storage for required and validated competencies
- **Evaluation History**: Complete assessment tracking with timestamps and user attribution

**Section sources**
- [045-module-recrutement.sql:1-200](file://backend/database/migrations/045-module-recrutement.sql#L1-L200)

## Deployment and Integration

### Module Activation
The recruitment module requires explicit activation within the eLISAschool ecosystem:

```mermaid
flowchart LR
Setup["System Setup"] --> Migration["Run Migration 045"]
Migration --> DeployScript["Execute deploy-recrutement.sh"]
DeployScript --> Config["Configure Permissions"]
Config --> Test["Test API Endpoints"]
Migration --> DB["Database Schema Creation"]
DeployScript --> Routes["Route Registration"]
Config --> Access["User Access Control"]
DB --> Complete["Module Ready"]
Routes --> Complete
Access --> Complete
```

**Diagram sources**
- [deploy-recrutement.sh:1-50](file://scripts/deploy-recrutement.sh#L1-L50)

### Integration Points
The module integrates with several core eLISAschool systems:

- **Authentication & Authorization**: Leverages central RBAC system for access control
- **Notification System**: Integrates with enterprise notification infrastructure
- **Audit Logging**: Utilizes centralized audit trail for compliance
- **Multi-establishment**: Inherits tenant isolation from core platform

**Section sources**
- [deploy-recrutement.sh:1-50](file://scripts/deploy-recrutement.sh#L1-L50)
- [app.ts:269-270](file://backend/src/app.ts#L269-L270)

## Performance Considerations

### Scalability Features
- **Pagination Support**: Built-in cursor-based pagination for large datasets
- **Index Optimization**: Strategic indexing on frequently queried fields
- **Connection Pooling**: Efficient database connection management
- **Caching Strategy**: Redis-based caching for frequently accessed configurations

### Monitoring and Metrics
- **Request Logging**: Comprehensive request/response logging
- **Performance Metrics**: Built-in metrics collection for API endpoints
- **Database Query Optimization**: Parameterized queries with prepared statements
- **Memory Management**: Proper resource cleanup and garbage collection

## Troubleshooting Guide

### Common Issues and Solutions

**Authentication Problems**
- Verify user has appropriate recruitment permissions
- Check establishment assignment alignment
- Confirm session validity and token refresh

**Data Validation Errors**
- Review DTO validation rules
- Check required field completeness
- Validate data type compatibility

**Database Connectivity**
- Verify migration execution status
- Check connection pool availability
- Monitor query timeout thresholds

**Performance Issues**
- Implement proper pagination parameters
- Optimize complex query filters
- Monitor concurrent request limits

### Debugging Tools
- Enable detailed logging during development
- Use built-in error handlers for graceful degradation
- Monitor audit logs for operation traces

**Section sources**
- [recrutement.controller.ts:1-20](file://backend/src/modules/recrutement/controllers/recrutement.controller.ts#L1-L20)
- [recrutement.service.ts:1-30](file://backend/src/modules/recrutement/services/recrutement.service.ts#L1-L30)

## Conclusion

The Recruitment Management Module represents a comprehensive solution for educational institution staffing needs within the eLISAschool ecosystem. Its modular architecture, robust data model, and extensive API coverage provide a solid foundation for managing complex recruitment workflows.

Key strengths include:
- **Complete Feature Coverage**: End-to-end recruitment lifecycle management
- **Scalable Architecture**: Designed for growth and performance optimization
- **Enterprise Integration**: Seamless integration with core eLISAschool systems
- **Multi-establishment Support**: Tenant-aware design for institutional deployments
- **Comprehensive Analytics**: Built-in reporting and statistical capabilities

The module's implementation demonstrates best practices in modern web application development, with clear separation of concerns, comprehensive error handling, and extensive testing coverage. Its deployment-ready design ensures smooth integration into production environments while maintaining flexibility for future enhancements.