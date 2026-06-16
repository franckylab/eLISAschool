# Options (Specializations) Module

<cite>
**Referenced Files in This Document**
- [index.ts](file://backend/src/modules/options/index.ts)
- [inscription-option.controller.ts](file://backend/src/modules/options/controllers/inscription-option.controller.ts)
- [inscription-option.service.ts](file://backend/src/modules/options/services/inscription-option.service.ts)
- [inscription-option.dto.ts](file://backend/src/modules/options/dto/inscription-option.dto.ts)
- [inscription-option.entity.ts](file://backend/src/modules/options/entities/inscription-option.entity.ts)
- [index.ts](file://backend/src/modules/options/controllers/index.ts)
- [index.ts](file://backend/src/modules/options/services/index.ts)
- [index.ts](file://backend/src/modules/options/entities/index.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Module Architecture](#module-architecture)
3. [Core Components](#core-components)
4. [Entity Relationship Analysis](#entity-relationship-analysis)
5. [API Endpoints](#api-endpoints)
6. [Business Logic Implementation](#business-logic-implementation)
7. [Security and Permissions](#security-and-permissions)
8. [Data Validation and DTOs](#data-validation-and-dtos)
9. [Integration Points](#integration-points)
10. [Performance Considerations](#performance-considerations)
11. [Troubleshooting Guide](#troubleshooting-guide)
12. [Conclusion](#conclusion)

## Introduction

The Options (Specializations) module in the eLISAschool project is designed to manage optional subjects or specializations for students. This module provides comprehensive functionality for student enrollment in elective courses, tracking enrollment status, and managing the validation process for specializations. The module follows a clean architecture pattern with clear separation of concerns between controllers, services, DTOs, and entities.

The module specifically focuses on the `InscriptionOption` entity, which represents student enrollments in optional subjects. It supports CRUD operations with additional business logic for enrollment validation, status management, and administrative approval processes.

## Module Architecture

The Options module follows a layered architecture pattern typical of NestJS applications:

```mermaid
graph TB
subgraph "Options Module Layered Architecture"
ControllerLayer[Controllers Layer]
ServiceLayer[Services Layer]
EntityLayer[Entities Layer]
DTOLayer[DTOs Layer]
ControllerLayer --> ServiceLayer
ServiceLayer --> EntityLayer
ServiceLayer --> DTOLayer
ControllerLayer --> DTOLayer
end
subgraph "External Dependencies"
AuthMiddleware[Authentication Middleware]
RBAC[Role-Based Access Control]
Database[(Database)]
end
ControllerLayer --> AuthMiddleware
ControllerLayer --> RBAC
ServiceLayer --> Database
```

**Diagram sources**
- [index.ts:1-20](file://backend/src/modules/options/index.ts#L1-L20)
- [inscription-option.controller.ts:29-88](file://backend/src/modules/options/controllers/inscription-option.controller.ts#L29-L88)

The module is structured with separate concerns:

- **Controllers**: Handle HTTP requests and responses
- **Services**: Contain business logic and orchestrate operations
- **Entities**: Define data structures and database relationships
- **DTOs**: Handle data transfer and validation
- **Index files**: Export module functionality

**Section sources**
- [index.ts:1-20](file://backend/src/modules/options/index.ts#L1-L20)
- [index.ts:1-7](file://backend/src/modules/options/controllers/index.ts#L1-L7)
- [index.ts:1-7](file://backend/src/modules/options/services/index.ts#L1-L7)
- [index.ts:1-7](file://backend/src/modules/options/entities/index.ts#L1-L7)

## Core Components

### Entity Layer

The module defines a single primary entity: `InscriptionOption`. This entity represents the enrollment relationship between students and optional subjects.

```mermaid
classDiagram
class InscriptionOption {
+string id
+string eleveId
+string optionId
+StatutOption statut
+boolean estValidée
+string commentaire
+string dateAbandon
+Date createdAt
+Date updatedAt
}
class StatutOption {
<<enumeration>>
EN_ATTENTE
ACTIVE
ABANDONNEE
INCOMPLETE
}
InscriptionOption --> StatutOption : "uses"
```

**Diagram sources**
- [inscription-option.entity.ts](file://backend/src/modules/options/entities/inscription-option.entity.ts)

### Service Layer

The service layer implements the core business logic for managing student enrollments:

```mermaid
sequenceDiagram
participant Client as "Client Application"
participant Controller as "InscriptionOptionController"
participant Service as "InscriptionOptionService"
participant Entity as "InscriptionOption Entity"
Client->>Controller : POST /api/options/inscriptions
Controller->>Controller : validate(createInscriptionOptionSchema)
Controller->>Service : create(dto, etablissementId)
Service->>Entity : new InscriptionOption(dto)
Service->>Service : setInitialStatus()
Service->>Service : save(entity)
Service-->>Controller : InscriptionOption
Controller-->>Client : 201 Created
```

**Diagram sources**
- [inscription-option.controller.ts:54-63](file://backend/src/modules/options/controllers/inscription-option.controller.ts#L54-L63)
- [inscription-option.service.ts:120-148](file://backend/src/modules/options/services/inscription-option.service.ts#L120-L148)

**Section sources**
- [inscription-option.service.ts:120-168](file://backend/src/modules/options/services/inscription-option.service.ts#L120-L168)

### Controller Layer

The controller layer handles HTTP routing and request/response management:

```mermaid
flowchart TD
Start([HTTP Request]) --> Route{Route Type}
Route --> |GET /inscriptions| List[findAll Method]
Route --> |GET /inscriptions/:id| Detail[findOne Method]
Route --> |POST /inscriptions| Create[create Method]
Route --> |PATCH /inscriptions/:id| Update[update Method]
Route --> |DELETE /inscriptions/:id| Delete[delete Method]
List --> Auth[Authentication Check]
Detail --> Auth
Create --> Auth
Update --> Auth
Delete --> Auth
Auth --> Role{Required Role}
Role --> |Admin/Super Admin| Process[Process Request]
Role --> |Counselor| Process
Role --> |Other| Forbidden[403 Forbidden]
Process --> ServiceCall[Service Method Call]
ServiceCall --> Response[JSON Response]
Forbidden --> ErrorResponse[Error Response]
```

**Diagram sources**
- [inscription-option.controller.ts:33-84](file://backend/src/modules/options/controllers/inscription-option.controller.ts#L33-L84)

**Section sources**
- [inscription-option.controller.ts:29-88](file://backend/src/modules/options/controllers/inscription-option.controller.ts#L29-L88)

## Entity Relationship Analysis

The Options module maintains relationships with other core entities in the eLISAschool system:

```mermaid
erDiagram
INSCRIPTION_OPTION {
string id PK
string eleveId FK
string optionId FK
enum statut
boolean estValidée
string commentaire
date dateAbandon
timestamp createdAt
timestamp updatedAt
}
ELEVE {
string id PK
string nom
string prenom
date dateNaissance
string etablissementId FK
}
SPECIALITE {
string id PK
string nom
string description
string etablissementId FK
}
INSCRIPTION_OPTION ||--|| ELEVE : "student"
INSCRIPTION_OPTION ||--|| SPECIALITE : "option"
```

**Diagram sources**
- [inscription-option.entity.ts](file://backend/src/modules/options/entities/inscription-option.entity.ts)

The entity relationships support:
- Student enrollment tracking
- Specialization course management
- Status monitoring and validation
- Administrative oversight capabilities

## API Endpoints

The module exposes a RESTful API with comprehensive CRUD operations:

| Method | Endpoint | Description | Required Roles |
|--------|----------|-------------|----------------|
| GET | `/api/options/inscriptions` | List all student enrollments | Authenticated |
| GET | `/api/options/inscriptions/:id` | Get enrollment details | Authenticated |
| POST | `/api/options/inscriptions` | Create new enrollment | Admin, Super Admin, Counselor |
| PATCH | `/api/options/inscriptions/:id` | Update enrollment | Admin, Super Admin |
| DELETE | `/api/options/inscriptions/:id` | Cancel enrollment | Admin, Super Admin |

**Section sources**
- [inscription-option.controller.ts:33-84](file://backend/src/modules/options/controllers/inscription-option.controller.ts#L33-L84)

## Business Logic Implementation

### Enrollment Status Management

The service implements sophisticated status management for enrollments:

```mermaid
stateDiagram-v2
[*] --> EN_ATTENTE
EN_ATTENTE --> ACTIVE : validated
EN_ATTENTE --> ABANDONNEE : abandoned
ACTIVE --> ABANDONNEE : cancelled
ABANDONNEE --> EN_ATTENTE : re-enroll
note right of EN_ATTENTE : Initial state<br/>Waiting for validation
note right of ACTIVE : Approved<br/>Student enrolled
note right of ABANDONNEE : Student withdrew<br/>Automatically sets withdrawal date
```

**Diagram sources**
- [inscription-option.service.ts:135-168](file://backend/src/modules/options/services/inscription-option.service.ts#L135-L168)

### Validation Workflow

The module implements a two-tier validation process:

1. **Administrative Validation**: Requires role-based permissions
2. **Automatic Status Updates**: Based on enrollment actions

**Section sources**
- [inscription-option.service.ts:150-168](file://backend/src/modules/options/services/inscription-option.service.ts#L150-L168)

## Security and Permissions

### Role-Based Access Control

The module implements granular permission controls:

```mermaid
graph LR
subgraph "Permission Matrix"
subgraph "Read Operations"
AllUsers[Authenticated Users]
end
subgraph "Write Operations"
Admin[Admin]
SuperAdmin[Super Admin]
Counselor[Counselor]
end
subgraph "Restricted Operations"
AdminOnly[Admin Only]
SuperAdminOnly[Super Admin Only]
end
end
AllUsers -.->|View| ReadOps[Read Operations]
Admin -.->|Create/Update/Delete| WriteOps[Write Operations]
SuperAdmin -.->|All Operations| FullAccess[Full Access]
Counselor -.->|Create| CreateOnly[Create Only]
```

**Diagram sources**
- [inscription-option.controller.ts:54-84](file://backend/src/modules/options/controllers/inscription-option.controller.ts#L54-L84)

**Section sources**
- [inscription-option.controller.ts:54-84](file://backend/src/modules/options/controllers/inscription-option.controller.ts#L54-L84)

## Data Validation and DTOs

### DTO Structure

The module uses TypeScript DTOs for data validation and transfer:

```mermaid
classDiagram
class CreateInscriptionOptionDto {
+string eleveId
+string optionId
+string commentaire
}
class UpdateInscriptionOptionDto {
+string eleveId
+string optionId
+StatutOption statut
+boolean estValidée
+string commentaire
+string dateAbandon
}
class InscriptionOptionResponseDto {
+string id
+EleveDto eleve
+SpecialiteDto option
+StatutOption statut
+boolean estValidée
+string commentaire
+string dateAbandon
+Date createdAt
+Date updatedAt
}
CreateInscriptionOptionDto --> StatutOption : "validated"
UpdateInscriptionOptionDto --> StatutOption : "validated"
```

**Diagram sources**
- [inscription-option.dto.ts](file://backend/src/modules/options/dto/inscription-option.dto.ts)

**Section sources**
- [inscription-option.dto.ts](file://backend/src/modules/options/dto/inscription-option.dto.ts)

## Integration Points

### Module Registration

The Options module integrates seamlessly with the main application:

```mermaid
graph TB
subgraph "Application Bootstrap"
AppModule[Main AppModule]
OptionsModule[Options Module]
Routes[Route Registration]
end
subgraph "Module Exports"
Entities[Entities Export]
DTOs[DTOs Export]
Services[Services Export]
Controllers[Controllers Export]
end
AppModule --> OptionsModule
OptionsModule --> Routes
OptionsModule --> Entities
OptionsModule --> DTOs
OptionsModule --> Services
OptionsModule --> Controllers
```

**Diagram sources**
- [index.ts:8-20](file://backend/src/modules/options/index.ts#L8-L20)

### Database Integration

The module leverages TypeORM for database operations with proper entity relationships and indexing strategies.

**Section sources**
- [index.ts:1-20](file://backend/src/modules/options/index.ts#L1-L20)

## Performance Considerations

### Query Optimization

The service layer implements efficient database queries with appropriate indexing:

- **Composite Indexes**: On frequently queried fields like `eleveId` and `statut`
- **Pagination Support**: Built-in pagination for large enrollment lists
- **Lazy Loading**: Optimized entity loading to reduce memory usage

### Caching Strategies

Consider implementing caching for:
- Frequently accessed enrollment statistics
- Common query results for dashboard views
- User-specific enrollment data

## Troubleshooting Guide

### Common Issues and Solutions

**Issue**: 403 Forbidden errors when accessing enrollment endpoints
- **Cause**: Insufficient role permissions
- **Solution**: Verify user roles include Admin, Super Admin, or Counselor

**Issue**: Enrollment status not updating correctly
- **Cause**: Missing validation workflow completion
- **Solution**: Ensure both administrative validation and status updates are processed

**Issue**: Duplicate enrollment records
- **Cause**: Missing unique constraints
- **Solution**: Implement unique composite keys for `(eleveId, optionId)`

**Issue**: Performance degradation with large datasets
- **Cause**: Missing database indexes
- **Solution**: Add appropriate indexes on frequently queried fields

**Section sources**
- [inscription-option.service.ts:135-168](file://backend/src/modules/options/services/inscription-option.service.ts#L135-L168)
- [inscription-option.controller.ts:54-84](file://backend/src/modules/options/controllers/inscription-option.controller.ts#L54-L84)

## Conclusion

The Options (Specializations) module provides a robust foundation for managing student enrollments in optional subjects within the eLISAschool ecosystem. The module demonstrates excellent architectural practices with clear separation of concerns, comprehensive security controls, and well-defined business logic.

Key strengths of the implementation include:
- Clean layered architecture following NestJS best practices
- Comprehensive role-based access control
- Sophisticated enrollment status management
- Proper data validation through DTOs
- Extensible design supporting future enhancements

The module serves as a model for other specialized modules within the eLISAschool platform, providing a scalable foundation for educational institution needs.