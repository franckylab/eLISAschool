# Validation Workflow System

<cite>
**Referenced Files in This Document**
- [validation-workflow.controller.ts](file://backend/src/modules/validation-workflow/controllers/validation-workflow.controller.ts)
- [validation-workflow.service.ts](file://backend/src/modules/validation-workflow/services/validation-workflow.service.ts)
- [validation-rapport.service.ts](file://backend/src/modules/validation-workflow/services/validation-rapport.service.ts)
- [workflow-validation.entity.ts](file://backend/src/modules/validation-workflow/entities/workflow-validation.entity.ts)
- [validation-workflow.dto.ts](file://backend/src/modules/validation-workflow/dto/validation-workflow.dto.ts)
- [validation-rapport.dto.ts](file://backend/src/modules/validation-workflow/dto/validation-rapport.dto.ts)
- [validation.middleware.ts](file://backend/src/modules/validation-workflow/middlewares/validation.middleware.ts)
- [index.ts](file://backend/src/modules/validation-workflow/index.ts)
- [011-validation-workflow-permissions.sql](file://backend/src/database/migrations/011-validation-workflow-permissions.sql)
- [012-validation-academique-permissions.sql](file://backend/src/database/migrations/012-validation-academique-permissions.sql)
- [013-validation-vie-scolaire-permissions.sql](file://backend/src/database/migrations/013-validation-vie-scolaire-permissions.sql)
- [014-validation-cartes-annees.sql](file://backend/src/database/migrations/014-validation-cartes-annees.sql)
- [015-validation-etablissement.sql](file://backend/src/database/migrations/015-validation-etablissement.sql)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [System Architecture](#system-architecture)
3. [Core Components](#core-components)
4. [Entity Model](#entity-model)
5. [API Endpoints](#api-endpoints)
6. [Workflow Processing Logic](#workflow-processing-logic)
7. [Permission System](#permission-system)
8. [Notification Integration](#notification-integration)
9. [Statistics and Reporting](#statistics-and-reporting)
10. [Implementation Details](#implementation-details)
11. [Troubleshooting Guide](#troubleshooting-guide)
12. [Conclusion](#conclusion)

## Introduction

The Validation Workflow System is a comprehensive multi-level approval system designed for the eLISAschool educational management platform. This system provides a flexible framework for managing approval processes across various school administrative functions, including academic records, student cards, school activities, and institutional configurations.

The system supports configurable approval chains with multiple validation levels, automated notifications, statistical reporting, and comprehensive audit trails. It integrates seamlessly with the existing RBAC (Role-Based Access Control) system and provides extensible support for different business modules within the educational institution.

## System Architecture

The Validation Workflow System follows a modular architecture pattern with clear separation of concerns:

```mermaid
graph TB
subgraph "Client Layer"
UI[Web Interface]
API[REST API Clients]
end
subgraph "Application Layer"
Controller[Validation Workflow Controller]
Middleware[Validation Middleware]
Services[Service Layer]
end
subgraph "Domain Layer"
Entities[Workflow Entities]
DTOs[Data Transfer Objects]
end
subgraph "Infrastructure Layer"
Database[(PostgreSQL Database)]
Redis[Redis Cache]
Notifications[Notification System]
end
UI --> Controller
API --> Controller
Controller --> Middleware
Controller --> Services
Services --> Entities
Services --> DTOs
Services --> Database
Services --> Redis
Services --> Notifications
Entities --> Database
```

**Diagram sources**
- [validation-workflow.controller.ts:35-97](file://backend/src/modules/validation-workflow/controllers/validation-workflow.controller.ts#L35-L97)
- [validation-workflow.service.ts:23-30](file://backend/src/modules/validation-workflow/services/validation-workflow.service.ts#L23-L30)

## Core Components

### Service Layer Architecture

The service layer implements the core business logic for workflow management:

```mermaid
classDiagram
class ValidationWorkflowService {
-workflowRepo : Repository~WorkflowValidation~
-userRepo : Repository~Utilisateur~
+createWorkflow(dto, createurId) WorkflowValidation
+traiterValidation(workflowId, dto, validateurId) WorkflowValidation
+annuler(workflowId, userId) WorkflowValidation
+findByModuleAndEntite(module, entiteId, etablissementId) WorkflowValidation
+getStatistiques(module, etablissementId) Object
+getModuleConfig(module, etablissementId) Object
}
class ValidationRapportService {
+generateRapport(workflowId) Object
+getRapportStats(module, params) Object
+exportRapport(format, params) Buffer
}
class ValidationMiddleware {
+validateWorkflowAccess(req, res, next) void
+checkValidationPermissions(req, res, next) void
}
ValidationWorkflowService --> WorkflowValidation : "manages"
ValidationRapportService --> WorkflowValidation : "generates reports"
ValidationMiddleware --> ValidationWorkflowService : "validates requests"
```

**Diagram sources**
- [validation-workflow.service.ts:23-279](file://backend/src/modules/validation-workflow/services/validation-workflow.service.ts#L23-L279)
- [validation-rapport.service.ts](file://backend/src/modules/validation-workflow/services/validation-rapport.service.ts)
- [validation.middleware.ts](file://backend/src/modules/validation-workflow/middlewares/validation.middleware.ts)

**Section sources**
- [validation-workflow.service.ts:23-279](file://backend/src/modules/validation-workflow/services/validation-workflow.service.ts#L23-L279)
- [validation-rapport.service.ts](file://backend/src/modules/validation-workflow/services/validation-rapport.service.ts)
- [validation.middleware.ts](file://backend/src/modules/validation-workflow/middlewares/validation.middleware.ts)

## Entity Model

The system uses a comprehensive entity model to represent validation workflows and their associated data:

```mermaid
erDiagram
WORKFLOW_VALIDATION {
uuid id PK
string module
string entiteId
string entiteType
integer niveauxRequis
integer niveauActuel
enum statut
jsonb configRoles
text commentaire
uuid etablissementId
jsonb historique
timestamp createdAt
timestamp updatedAt
}
VALIDATION_NIVEAU {
uuid id PK
uuid workflowId FK
integer ordre
string roleRequis
string validateurId
enum statut
text commentaire
timestamp dateValidation
jsonb documents
}
UTILISATEUR {
uuid id PK
string email UK
string nom
string prenom
string telephone
boolean isActive
}
WORKFLOW_VALIDATION ||--o{ VALIDATION_NIVEAU : "contains"
VALIDATION_NIVEAU ||--|| UTILISATEUR : "validated_by"
```

**Diagram sources**
- [workflow-validation.entity.ts](file://backend/src/modules/validation-workflow/entities/workflow-validation.entity.ts)
- [validation-workflow.service.ts:12-22](file://backend/src/modules/validation-workflow/services/validation-workflow.service.ts#L12-L22)

**Section sources**
- [workflow-validation.entity.ts](file://backend/src/modules/validation-workflow/entities/workflow-validation.entity.ts)

## API Endpoints

The system exposes a comprehensive REST API for workflow management:

### Core Workflow Operations

| Endpoint | Method | Description | Required Roles |
|----------|--------|-------------|----------------|
| `/api/validation-workflows` | POST | Create new workflow | ADMIN, SUPER_ADMIN |
| `/api/validation-workflows/:id` | GET | Get workflow details | READ access |
| `/api/validation-workflows/:id/valider` | POST | Process validation level | APPROVER access |
| `/api/validation-workflows/:id/annuler` | POST | Cancel workflow | ADMIN, SUPER_ADMIN |
| `/api/validation-workflows/stats/:module` | GET | Get module statistics | ADMIN, SUPER_ADMIN, CHEF_ETABLISSEMENT |

### Workflow Processing Flow

```mermaid
sequenceDiagram
participant Client as "Client Application"
participant Controller as "Validation Controller"
participant Service as "Validation Service"
participant DB as "Database"
participant Notify as "Notification System"
Client->>Controller : POST /api/validation-workflows
Controller->>Service : createWorkflow(dto, createurId)
Service->>DB : Save new workflow
DB-->>Service : Workflow saved
Service-->>Controller : Workflow object
Controller-->>Client : 201 Created
Client->>Controller : POST /api/validation-workflows/ : id/valider
Controller->>Service : traiterValidation(workflowId, dto, validateurId)
Service->>Service : Validate permissions
Service->>DB : Update workflow state
DB-->>Service : Workflow updated
Service->>Notify : Send notification
Notify-->>Service : Confirmation
Service-->>Controller : Updated workflow
Controller-->>Client : Success response
```

**Diagram sources**
- [validation-workflow.controller.ts:35-97](file://backend/src/modules/validation-workflow/controllers/validation-workflow.controller.ts#L35-L97)
- [validation-workflow.service.ts:136-263](file://backend/src/modules/validation-workflow/services/validation-workflow.service.ts#L136-L263)

**Section sources**
- [validation-workflow.controller.ts:35-97](file://backend/src/modules/validation-workflow/controllers/validation-workflow.controller.ts#L35-L97)

## Workflow Processing Logic

The validation workflow follows a structured multi-level approval process:

### State Management

```mermaid
stateDiagram-v2
[*] --> EN_COURS
EN_COURS --> NIVEAU_EN_ATTENTE : Approve current level
EN_COURS --> REJETEE : Reject at any level
EN_COURS --> COMPLETEE : All levels approved
NIVEAU_EN_ATTENTE --> EN_COURS : Move to next level
NIVEAU_EN_ATTENTE --> REJETEE : Reject current level
NIVEAU_EN_ATTENTE --> COMPLETEE : All levels approved
REJETEE --> [*]
COMPLETEE --> [*]
```

### Decision Processing Flow

```mermaid
flowchart TD
Start([Validation Request]) --> CheckLevel["Check Current Level"]
CheckLevel --> HasNext{"Has Next Level?"}
HasNext --> |No| FinalDecision["Final Decision"]
HasNext --> |Yes| NextLevel["Prepare Next Level"]
FinalDecision --> Decision{"Approved?"}
NextLevel --> Decision
Decision --> |Yes| UpdateWorkflow["Update Workflow State"]
Decision --> |No| RejectWorkflow["Reject Workflow"]
UpdateWorkflow --> CheckComplete{"Completed?"}
CheckComplete --> |Yes| CompleteWorkflow["Mark Complete"]
CheckComplete --> |No| NotifyNext["Notify Next Approver"]
RejectWorkflow --> NotifyReject["Send Rejection Notification"]
CompleteWorkflow --> NotifyComplete["Send Completion Notification"]
NotifyNext --> End([End])
NotifyReject --> End
NotifyComplete --> End
```

**Diagram sources**
- [validation-workflow.service.ts:161-263](file://backend/src/modules/validation-workflow/services/validation-workflow.service.ts#L161-L263)

**Section sources**
- [validation-workflow.service.ts:136-263](file://backend/src/modules/validation-workflow/services/validation-workflow.service.ts#L136-L263)

## Permission System

The system integrates with the RBAC (Role-Based Access Control) system for fine-grained permission management:

### Module-Specific Permissions

| Module | Required Permissions |
|--------|---------------------|
| Academic Validation | `validation.academique.read`, `validation.academique.write` |
| School Life Validation | `validation.vie_scolaire.read`, `validation.vie_scolaire.write` |
| Student Cards | `validation.cartes.annees.read`, `validation.cartes.annees.write` |
| Establishment Validation | `validation.etablissement.read`, `validation.etablissement.write` |

### Permission Resolution

```mermaid
flowchart LR
User[User Request] --> Module[Module Context]
Module --> Config[Load Module Config]
Config --> Roles[Get Required Roles]
Roles --> Check[Check User Permissions]
Check --> Authorized{Authorized?}
Authorized --> |Yes| Process[Process Request]
Authorized --> |No| Deny[Deny Access]
Process --> Success[Success Response]
Deny --> Error[Error Response]
```

**Diagram sources**
- [validation-workflow.service.ts:12-22](file://backend/src/modules/validation-workflow/services/validation-workflow.service.ts#L12-L22)

**Section sources**
- [validation-workflow.service.ts:12-22](file://backend/src/modules/validation-workflow/services/validation-workflow.service.ts#L12-L22)

## Notification Integration

The system provides comprehensive notification capabilities for workflow events:

### Notification Types

| Event Type | Recipients | Template |
|------------|------------|----------|
| Workflow Creation | Creator, Next Approver | `workflow.created` |
| Level Approval | Previous Approver, Next Approver | `workflow.level.approved` |
| Level Rejection | Previous Approver, Creator | `workflow.level.rejected` |
| Workflow Completion | All Participants | `workflow.completed` |
| Workflow Cancellation | All Participants | `workflow.cancelled` |

### Notification Flow

```mermaid
sequenceDiagram
participant Service as "Validation Service"
participant Template as "Template Service"
participant User as "User Service"
participant Email as "Email Provider"
participant InApp as "In-App Provider"
Service->>Template : workflowValidation(metadata, context)
Template->>User : Get recipient info
User-->>Template : User details
Template->>Email : Send email notification
Template->>InApp : Send in-app notification
Email-->>Template : Delivery confirmation
InApp-->>Template : Delivery confirmation
Template-->>Service : Notification sent
```

**Diagram sources**
- [validation-workflow.service.ts:240-260](file://backend/src/modules/validation-workflow/services/validation-workflow.service.ts#L240-L260)

**Section sources**
- [validation-workflow.service.ts:240-260](file://backend/src/modules/validation-workflow/services/validation-workflow.service.ts#L240-L260)

## Statistics and Reporting

The system provides comprehensive analytics and reporting capabilities:

### Statistical Endpoints

| Endpoint | Purpose | Data Returned |
|----------|---------|---------------|
| `GET /stats/:module` | Module-wide statistics | Approval rates, processing times, rejection reasons |
| `GET /rapports/:id` | Individual workflow report | Complete workflow history, decision timeline |
| `GET /rapports/export` | Export reports | CSV/PDF formatted reports |

### Report Generation

```mermaid
flowchart TD
Request[Report Request] --> Filter[Apply Filters]
Filter --> Aggregate[Aggregate Data]
Aggregate --> Calculate[Calculate Metrics]
Calculate --> Format[Format Output]
Format --> Export[Export Format]
Export --> Deliver[Deliver Report]
subgraph "Metrics Calculated"
ApprovalRate[Approval Rate]
AvgProcessing[Average Processing Time]
RejectionReasons[Rejection Reasons]
UserActivity[User Activity Patterns]
end
```

**Diagram sources**
- [validation-rapport.service.ts](file://backend/src/modules/validation-workflow/services/validation-rapport.service.ts)

**Section sources**
- [validation-rapport.service.ts](file://backend/src/modules/validation-workflow/services/validation-rapport.service.ts)

## Implementation Details

### Configuration Management

The system supports dynamic configuration through environment variables and database parameters:

| Configuration Parameter | Purpose | Default Value |
|------------------------|---------|---------------|
| `WORKFLOW_MAX_LEVELS` | Maximum approval levels | 5 |
| `WORKFLOW_TIMEOUT` | Workflow timeout period | 30 days |
| `NOTIFICATION_ENABLED` | Enable/disable notifications | true |
| `AUDIT_ENABLED` | Enable/disable audit logging | true |

### Data Validation

```mermaid
flowchart TD
Input[DTO Input] --> Schema[Schema Validation]
Schema --> RequiredFields{Required Fields Present?}
RequiredFields --> |No| ValidationError[Throw Validation Error]
RequiredFields --> |Yes| BusinessRules[Business Rule Validation]
BusinessRules --> Permissions{User Has Permissions?}
Permissions --> |No| PermissionError[Throw Permission Error]
Permissions --> |Yes| Success[Validation Success]
ValidationError --> End([End])
PermissionError --> End
Success --> End
```

**Diagram sources**
- [validation-workflow.dto.ts](file://backend/src/modules/validation-workflow/dto/validation-workflow.dto.ts)
- [validation-rapport.dto.ts](file://backend/src/modules/validation-workflow/dto/validation-rapport.dto.ts)

**Section sources**
- [validation-workflow.dto.ts](file://backend/src/modules/validation-workflow/dto/validation-workflow.dto.ts)
- [validation-rapport.dto.ts](file://backend/src/modules/validation-workflow/dto/validation-rapport.dto.ts)

## Troubleshooting Guide

### Common Issues and Solutions

| Issue | Symptoms | Solution |
|-------|----------|----------|
| Workflow stuck at level | Cannot approve/reject | Check user permissions for next approver role |
| Notification failures | Users not receiving emails | Verify notification provider configuration |
| Permission errors | Access denied messages | Review RBAC configuration for module permissions |
| Database connection issues | Service unavailable | Check PostgreSQL connectivity and credentials |

### Error Handling

The system implements comprehensive error handling with specific error types:

```mermaid
flowchart TD
Error[Error Occurs] --> Type{Error Type}
Type --> Validation[Validation Error]
Type --> Permission[Permission Error]
Type --> Database[Database Error]
Type --> System[System Error]
Validation --> ValidationError[Return 400 Bad Request]
Permission --> PermissionError[Return 403 Forbidden]
Database --> DatabaseError[Return 500 Internal Server Error]
System --> SystemError[Return 500 Internal Server Error]
ValidationError --> Log[Log Error Details]
PermissionError --> Log
DatabaseError --> Log
SystemError --> Log
Log --> UserMessage[Send user-friendly message]
```

**Diagram sources**
- [validation-workflow.service.ts:12-16](file://backend/src/modules/validation-workflow/services/validation-workflow.service.ts#L12-L16)

**Section sources**
- [validation-workflow.service.ts:12-16](file://backend/src/modules/validation-workflow/services/validation-workflow.service.ts#L12-L16)

## Conclusion

The Validation Workflow System provides a robust, scalable solution for managing multi-level approval processes in educational institutions. Its modular architecture, comprehensive permission system, and integrated notification capabilities make it suitable for various administrative functions within the eLISAschool platform.

Key strengths of the system include:

- **Flexibility**: Configurable approval chains adaptable to different business modules
- **Scalability**: Support for multiple concurrent workflows with efficient resource management
- **Transparency**: Comprehensive audit trails and reporting capabilities
- **Integration**: Seamless integration with existing RBAC and notification systems
- **Extensibility**: Modular design supporting future enhancements and new business modules

The system's implementation demonstrates best practices in enterprise application development, with clear separation of concerns, comprehensive error handling, and extensive documentation of its APIs and internal workings.