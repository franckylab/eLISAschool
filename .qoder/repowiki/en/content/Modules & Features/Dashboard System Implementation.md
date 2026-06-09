# Dashboard System Implementation

<cite>
**Referenced Files in This Document**
- [dashboard.controller.ts](file://backend/src/modules/dashboard/controllers/dashboard.controller.ts)
- [widget-resolver.service.ts](file://backend/src/modules/dashboard/services/widget-resolver.service.ts)
- [data-aggregator.service.ts](file://backend/src/modules/dashboard/services/data-aggregator.service.ts)
- [dashboard-cache.service.ts](file://backend/src/modules/dashboard/services/dashboard-cache.service.ts)
- [dashboard-data.service.ts](file://backend/src/modules/dashboard/services/dashboard-data.service.ts)
- [dashboard-dataloader.service.ts](file://backend/src/modules/dashboard/services/dashboard-dataloader.service.ts)
- [dashboard-precalc.service.ts](file://backend/src/modules/dashboard/services/dashboard-precalc.service.ts)
- [dashboard-sse.service.ts](file://backend/src/modules/dashboard/services/dashboard-sse.service.ts)
- [widget-registry.ts](file://backend/src/modules/dashboard/utils/widget-registry.ts)
- [dashboard.dto.ts](file://backend/src/modules/dashboard/dtos/dashboard.dto.ts)
- [dashboard.types.ts](file://backend/src/modules/dashboard/types/dashboard.types.ts)
- [dashboard-layout.entity.ts](file://backend/src/modules/dashboard/entities/dashboard-layout.entity.ts)
- [index.ts](file://backend/src/modules/dashboard/index.ts)
- [DASHBOARD-SYSTEM.md](file://backend/docs/DASHBOARD-SYSTEM.md)
- [finances.controller.ts](file://backend/src/modules/finances/controllers/finances.controller.ts)
- [dashboard.service.ts](file://backend/src/modules/finances/services/dashboard.service.ts)
- [suivi-eleve.service.ts](file://backend/src/modules/suivi-eleves/services/suivi-eleve.service.ts)
- [ANALYSE-CONTEXTE-AFRICAIN-CAMEROUN.md](file://ANALYSE-CONTEXTE-AFRICAIN-CAMEROUN.md)
</cite>

## Update Summary
**Changes Made**
- Added comprehensive attendance monitoring capabilities with SuiviAssiduiteEleve entity featuring 100% presence indicators and trimester-specific behavioral assessments
- Integrated attendance tracking metrics including absence counts, tardiness tracking, and behavioral evaluation indicators
- Enhanced dashboard system with new attendance-focused widgets and statistical analysis capabilities
- Updated widget registry to support attendance monitoring and behavioral assessment widgets
- Integrated contextual analysis for African educational contexts with specific absence cause categorization

## Table of Contents
1. [Introduction](#introduction)
2. [System Architecture](#system-architecture)
3. [Core Components](#core-components)
4. [Widget Management System](#widget-management-system)
5. [Data Processing Pipeline](#data-processing-pipeline)
6. [Financial Dashboard Integration](#financial-dashboard-integration)
7. [Attendance Monitoring System](#attendance-monitoring-system)
8. [Performance Optimization](#performance-optimization)
9. [Security and Access Control](#security-and-access-control)
10. [API Endpoints](#api-endpoints)
11. [Database Design](#database-design)
12. [Implementation Details](#implementation-details)
13. [Troubleshooting Guide](#troubleshooting-guide)
14. [Conclusion](#conclusion)

## Introduction

The eLISAschool Dashboard System is a comprehensive, production-ready solution for creating dynamic, personalized dashboards based on user roles, permissions, and institutional context. This system provides real-time data visualization capabilities across multiple educational domains including student statistics, academic performance, facility management, administrative oversight, validation workflow management, financial dashboard integration, and **comprehensive attendance monitoring capabilities**.

The dashboard system is built with modern architectural principles emphasizing scalability, security, and maintainability. It leverages a declarative widget registry, intelligent caching mechanisms, and modular service architecture to deliver optimal performance while maintaining flexibility for future extensions.

**Updated** The system now includes comprehensive attendance monitoring capabilities with the SuiviAssiduiteEleve entity featuring 100% presence indicators and trimester-specific behavioral assessments. These capabilities provide detailed tracking of student attendance patterns, behavioral indicators, and contextual analysis tailored for African educational environments with specific absence cause categorization.

## System Architecture

The dashboard system follows a layered architecture pattern with clear separation of concerns:

```mermaid
graph TB
subgraph "Presentation Layer"
Controller[Dashboard Controller]
FinancesController[Finances Controller]
SSE[Server-Sent Events]
AttendanceController[Attendance Controller]
end
subgraph "Business Logic Layer"
WidgetResolver[Widget Resolver Service]
DataAggregator[Data Aggregator Service]
DataLoader[Data Loader Service]
Precalc[Precision Calculation Service]
FinanceDashboard[Finance Dashboard Service]
AttendanceDashboard[Attendance Dashboard Service]
end
subgraph "Data Access Layer"
Cache[Dashboard Cache Service]
DB[(Database)]
FinanceDB[(Finance Tables)]
AttendanceDB[(Attendance Tables)]
end
subgraph "External Services"
Redis[Redis Cache]
Auth[Authentication]
Validation[Validation Workflow Service]
FinanceWorkflow[Finance Workflow Service]
AttendanceWorkflow[Attendance Workflow Service]
end
Controller --> WidgetResolver
Controller --> DataAggregator
FinancesController --> FinanceDashboard
AttendanceController --> AttendanceDashboard
WidgetResolver --> Cache
DataAggregator --> Cache
FinanceDashboard --> FinanceDB
AttendanceDashboard --> AttendanceDB
WidgetResolver --> DB
DataAggregator --> DB
Cache --> Redis
WidgetResolver --> Auth
DataAggregator --> Auth
DataAggregator --> Validation
FinanceDashboard --> FinanceWorkflow
AttendanceDashboard --> AttendanceWorkflow
```

**Diagram sources**
- [dashboard.controller.ts:11-386](file://backend/src/modules/dashboard/controllers/dashboard.controller.ts#L11-L386)
- [widget-resolver.service.ts:24-283](file://backend/src/modules/dashboard/services/widget-resolver.service.ts#L24-L283)
- [data-aggregator.service.ts:19-384](file://backend/src/modules/dashboard/services/data-aggregator.service.ts#L19-L384)
- [finances.controller.ts:1-200](file://backend/src/modules/finances/controllers/finances.controller.ts#L1-L200)
- [dashboard.service.ts:1-401](file://backend/src/modules/finances/services/dashboard.service.ts#L1-L401)

The architecture implements several key design patterns:

- **Service Layer Pattern**: Each major functionality is encapsulated in dedicated services
- **Repository Pattern**: Database operations are abstracted through repositories
- **Factory Pattern**: Dynamic service instantiation for lazy loading
- **Observer Pattern**: Event-driven updates through Server-Sent Events
- **Integration Pattern**: Seamless integration between dashboard and finance modules
- **Contextual Pattern**: Specialized handling for African educational contexts

## Core Components

### Widget Registry System

The widget registry serves as the central declaration point for all available dashboard widgets. It defines widget metadata, access permissions, and data resolution strategies.

```mermaid
classDiagram
class WidgetDefinition {
+string id
+string nom
+string description
+WidgetType type
+Role[] roles
+string[] permissions
+string dataResolver
+number cacheTTL
+RefreshStrategy refreshStrategy
+boolean etablissementScope
+string module
+string icon
+number complexite
+Record~string,any~ defaultConfig
+boolean premium
}
class WidgetRegistry {
+WidgetDefinition[] WIDGET_REGISTRY
+Map~string,WidgetDefinition~ WIDGET_REGISTRY_MAP
+getWidgetById(id) WidgetDefinition
+getWidgetsByModule(module) WidgetDefinition[]
}
WidgetRegistry --> WidgetDefinition : manages
```

**Diagram sources**
- [widget-registry.ts:14-359](file://backend/src/modules/dashboard/utils/widget-registry.ts#L14-L359)
- [dashboard.types.ts:37-82](file://backend/src/modules/dashboard/types/dashboard.types.ts#L37-L82)

### Service Architecture

The system employs a micro-service-like approach within the dashboard module:

```mermaid
classDiagram
class WidgetResolverService {
-PermissionResolverService permissionResolver
-Repository layoutRepo
-Repository utilisateurRepo
+resolveWidgetsForUser(utilisateurId, etablissementId) Promise
+checkWidgetAccess(widgetId, utilisateurId) Promise~boolean~
+saveUserLayout(utilisateurId, layout, etablissementId) Promise
+resetUserLayout(utilisateurId, etablissementId) Promise
}
class DataAggregatorService {
-Map~string,any~ serviceInstances
-Map~string,number[]~ executionTimes
+getWidgetData(widgetId, context) Promise
+registerService(name, instance) void
+getPerformanceStats() Object
}
class DashboardCacheService {
-Map cache
-boolean useRedis
-number MAX_CACHE_SIZE
+get(key) Promise
+set(key, data, ttl, context) Promise
+invalidateByContext(context) void
+invalidateByPattern(pattern) void
+getStats() Object
}
WidgetResolverService --> DashboardCacheService : uses
DataAggregatorService --> DashboardCacheService : uses
DataAggregatorService --> WidgetResolverService : resolves
```

**Diagram sources**
- [widget-resolver.service.ts:24-283](file://backend/src/modules/dashboard/services/widget-resolver.service.ts#L24-L283)
- [data-aggregator.service.ts:19-384](file://backend/src/modules/dashboard/services/data-aggregator.service.ts#L19-L384)
- [dashboard-cache.service.ts:23-319](file://backend/src/modules/dashboard/services/dashboard-cache.service.ts#L23-L319)

**Section sources**
- [widget-resolver.service.ts:24-283](file://backend/src/modules/dashboard/services/widget-resolver.service.ts#L24-L283)
- [data-aggregator.service.ts:19-384](file://backend/src/modules/dashboard/services/data-aggregator.service.ts#L19-L384)
- [dashboard-cache.service.ts:23-319](file://backend/src/modules/dashboard/services/dashboard-cache.service.ts#L23-L319)

## Widget Management System

The widget management system provides comprehensive functionality for widget discovery, access control, and personalization:

### Widget Resolution Process

```mermaid
flowchart TD
Start([Widget Resolution Request]) --> ValidateUser["Validate User Context"]
ValidateUser --> LoadPermissions["Load User Permissions"]
LoadPermissions --> LoadRoles["Load User Roles"]
LoadRoles --> FilterWidgets["Filter Widgets by Roles & Permissions"]
FilterWidgets --> CheckEtablissement["Check Etablissement Scope"]
CheckEtablissement --> LoadLayout["Load User Layout"]
LoadLayout --> MergeLayout["Merge with Layout Configuration"]
MergeLayout --> SortWidgets["Sort by Display Order"]
SortWidgets --> CacheResult["Cache Resolution Result"]
CacheResult --> End([Return Widget List])
FilterWidgets --> |No Access| Error[Return Error]
CheckEtablissement --> |No Scope| Error
```

**Diagram sources**
- [widget-resolver.service.ts:38-138](file://backend/src/modules/dashboard/services/widget-resolver.service.ts#L38-L138)

### Widget Access Control

The system implements multi-layered access control:

1. **Role-Based Access Control (RBAC)**: Widgets specify authorized roles
2. **Permission-Based Access**: Widgets require specific permissions (ALL must be present)
3. **Institutional Scope**: Some widgets are restricted to specific establishments
4. **Real-time Verification**: Access checked for individual widget requests

**Section sources**
- [widget-resolver.service.ts:143-176](file://backend/src/modules/dashboard/services/widget-resolver.service.ts#L143-L176)
- [widget-registry.ts:22-337](file://backend/src/modules/dashboard/utils/widget-registry.ts#L22-L337)

## Data Processing Pipeline

The data processing pipeline handles widget data retrieval, caching, and optimization:

### Data Retrieval Flow

```mermaid
sequenceDiagram
participant Client as Client Application
participant Controller as Dashboard Controller
participant FinancesController as Finances Controller
participant AttendanceController as Attendance Controller
participant Aggregator as Data Aggregator
participant Cache as Dashboard Cache
participant DashboardService as Finance Dashboard Service
participant AttendanceService as Attendance Dashboard Service
participant Service as Data Service
participant Validation as Validation Service
participant DB as Database
Client->>Controller : GET /widget/ : id/data
Controller->>Aggregator : getWidgetData(widgetId, context)
Aggregator->>Cache : get(cacheKey)
Cache-->>Aggregator : Cache Hit/Miss
alt Cache Miss
Aggregator->>Aggregator : Resolve Service Instance
Aggregator->>Service : Execute Data Method
Aggregator->>Validation : Execute Validation Method
Validation->>DB : Query Validation Data
Service->>DB : Query Data
DB-->>Service : Return Results
DB-->>Validation : Return Validation Results
Validation-->>Aggregator : Processed Validation Data
Service-->>Aggregator : Processed Data
Aggregator->>Cache : set(cacheKey, data, ttl)
end
Aggregator-->>Controller : WidgetDataResponse
Controller-->>Client : JSON Response
Client->>FinancesController : GET /finances/dashboard/ : endpoint
FinancesController->>DashboardService : Financial Data Method
DashboardService->>DB : Query Financial Data
DB-->>DashboardService : Return Results
DashboardService-->>FinancesController : Processed Financial Data
FinancesController-->>Client : JSON Response
Client->>AttendanceController : GET /attendance/dashboard/ : endpoint
AttendanceController->>AttendanceService : Attendance Data Method
AttendanceService->>DB : Query Attendance Data
DB-->>AttendanceService : Return Results
AttendanceService-->>AttendanceController : Processed Attendance Data
AttendanceController-->>Client : JSON Response
```

**Diagram sources**
- [data-aggregator.service.ts:40-120](file://backend/src/modules/dashboard/services/data-aggregator.service.ts#L40-L120)
- [finances.controller.ts:1-200](file://backend/src/modules/finances/controllers/finances.controller.ts#L1-L200)
- [dashboard.service.ts:1-401](file://backend/src/modules/finances/services/dashboard.service.ts#L1-L401)

### Performance Optimization Features

The system implements several optimization strategies:

1. **Lazy Loading**: Services loaded only when first accessed
2. **Batch Operations**: Reduced database queries through batching
3. **Timeout Management**: 5-second timeout per widget operation
4. **Fallback Mechanisms**: Mock data when services unavailable
5. **LRU Cache**: Automatic cleanup of least-used entries
6. **Financial Data Caching**: Specialized caching for financial metrics
7. **Attendance Data Caching**: Specialized caching for attendance metrics

**Section sources**
- [data-aggregator.service.ts:125-191](file://backend/src/modules/dashboard/services/data-aggregator.service.ts#L125-L191)
- [dashboard-dataloader.service.ts:42-104](file://backend/src/modules/dashboard/services/dashboard-dataloader.service.ts#L42-L104)

## Financial Dashboard Integration

**New** The dashboard system now includes comprehensive financial dashboard integration with four distinct API endpoints that provide real-time financial insights:

### Financial Dashboard Endpoints

The system provides four specialized financial dashboard endpoints:

| Method | Endpoint | Description | Authentication | Authorization |
|--------|----------|-------------|----------------|---------------|
| `GET` | `/api/finances/dashboard/stats` | Complete financial statistics | Required | FINANCE_ADMIN, ACCOUNTANT |
| `GET` | `/api/finances/dashboard/evolution-paiements` | Payment trend evolution | Required | FINANCE_ADMIN, ACCOUNTANT |
| `GET` | `/api/finances/dashboard/top-impayes` | Top overdue students | Required | FINANCE_ADMIN, ACCOUNTANT |
| `GET` | `/api/finances/dashboard/ratio-revenus-depenses` | Income-expense ratios | Required | FINANCE_ADMIN, ACCOUNTANT |

### Financial Data Aggregation

The financial dashboard service aggregates data from multiple sources:

```mermaid
flowchart TD
FinancialRequest[Financial Dashboard Request] --> ValidateParams["Validate Request Parameters"]
ValidateParams --> LoadFinancialData["Load Financial Data"]
LoadFinancialData --> AggregateStats["Aggregate Revenue Statistics"]
LoadFinancialData --> AggregatePayments["Aggregate Payment Trends"]
LoadFinancialData --> TopOverdue["Calculate Top Overdue Students"]
LoadFinancialData --> RatioCalculation["Calculate Income-Expense Ratios"]
AggregateStats --> FormatResponse["Format Financial Response"]
AggregatePayments --> FormatResponse
TopOverdue --> FormatResponse
RatioCalculation --> FormatResponse
FormatResponse --> CacheResult["Cache Financial Results"]
CacheResult --> End([Return Financial Data])
```

**Diagram sources**
- [dashboard.service.ts:1-401](file://backend/src/modules/finances/services/dashboard.service.ts#L1-L401)

### Financial Metrics and KPIs

The financial dashboard provides comprehensive metrics:

1. **Revenue Statistics**: Total expected, paid, unpaid amounts with collection rates
2. **Payment Evolution**: Daily/monthly payment trends over configurable periods
3. **Overdue Analysis**: Top 10 students with highest outstanding balances
4. **Financial Ratios**: Income-expense ratios and annual financial health indicators

**Section sources**
- [dashboard.service.ts:1-401](file://backend/src/modules/finances/services/dashboard.service.ts#L1-L401)
- [finances.controller.ts:1-200](file://backend/src/modules/finances/controllers/finances.controller.ts#L1-L200)

## Attendance Monitoring System

**New** The dashboard system now includes comprehensive attendance monitoring capabilities with the SuiviAssiduiteEleve entity featuring 100% presence indicators and trimester-specific behavioral assessments:

### SuiviAssiduiteEleve Entity

The attendance monitoring system introduces a comprehensive entity for tracking student attendance and behavioral patterns:

```mermaid
classDiagram
class SuiviAssiduiteEleve {
+string id
+string eleveId
+string anneeScolaireId
+string periodeId
+number nombreAbsences
+number nombreAbsencesJustifiees
+number nombreAbsencesNonJustifiees
+number nombreRetards
+number nombreJoursPresence
+number nombreJoursTotal
+number tauxPresence
+boolean conformeExamen
+CausesAbsences causesAbsences
+string observations
}
class CausesAbsences {
+number maladie
+number transport
+number travail_familial
+number insécurité
+number frais_non_payes
+number autres
}
class PresenceMetrics {
+number tauxPresence
+number presenceJour
+number absenceJour
+number retardJour
}
SuiviAssiduiteEleve --> CausesAbsences : contains
SuiviAssiduiteEleve --> PresenceMetrics : calculates
```

**Diagram sources**
- [ANALYSE-CONTEXTE-AFRICAIN-CAMEROUN.md:410-463](file://ANALYSE-CONTEXTE-AFRICAIN-CAMEROUN.md#L410-L463)

### Attendance Dashboard Endpoints

The system provides specialized attendance dashboard endpoints:

| Method | Endpoint | Description | Authentication | Authorization |
|--------|----------|-------------|----------------|---------------|
| `GET` | `/api/attendance/dashboard/stats` | Complete attendance statistics | Required | ACADEMIC_ADMIN, TEACHER |
| `GET` | `/api/attendance/dashboard/trend` | Attendance trend analysis | Required | ACADEMIC_ADMIN, TEACHER |
| `GET` | `/api/attendance/dashboard/high-risk` | High-risk students analysis | Required | ACADEMIC_ADMIN, TEACHER |
| `GET` | `/api/attendance/dashboard/behavioral-assessment` | Behavioral assessment metrics | Required | ACADEMIC_ADMIN, TEACHER |

### Attendance Data Aggregation

The attendance dashboard service aggregates data from multiple sources:

```mermaid
flowchart TD
AttendanceRequest[Attendance Dashboard Request] --> ValidateParams["Validate Request Parameters"]
ValidateParams --> LoadAttendanceData["Load Attendance Data"]
LoadAttendanceData --> AggregatePresence["Aggregate Presence Statistics"]
LoadAttendanceData --> AnalyzeTrends["Analyze Attendance Trends"]
LoadAttendanceData --> RiskAssessment["Calculate Risk Scores"]
LoadAttendanceData --> BehavioralAnalysis["Analyze Behavioral Patterns"]
AggregatePresence --> FormatResponse["Format Attendance Response"]
AnalyzeTrends --> FormatResponse
RiskAssessment --> FormatResponse
BehavioralAnalysis --> FormatResponse
FormatResponse --> CacheResult["Cache Attendance Results"]
CacheResult --> End([Return Attendance Data])
```

**Diagram sources**
- [suivi-eleve.service.ts:308-322](file://backend/src/modules/suivi-eleves/services/suivi-eleve.service.ts#L308-L322)

### Attendance Metrics and KPIs

The attendance dashboard provides comprehensive metrics:

1. **Presence Statistics**: Total presence days, absence counts, tardiness tracking
2. **Trend Analysis**: Daily/weekly/monthly attendance trends over configurable periods
3. **Risk Assessment**: High-risk students based on absence patterns and behavioral indicators
4. **Behavioral Analysis**: Positive/negative behavioral indicators and gamification points
5. **Contextual Analysis**: Specific absence cause categorization for African educational contexts

**Section sources**
- [suivi-eleve.service.ts:308-322](file://backend/src/modules/suivi-eleves/services/suivi-eleve.service.ts#L308-L322)
- [ANALYSE-CONTEXTE-AFRICAIN-CAMEROUN.md:410-463](file://ANALYSE-CONTEXTE-AFRICAIN-CAMEROUN.md#L410-L463)

## Performance Optimization

The dashboard system implements comprehensive performance optimization strategies:

### Caching Strategy

```mermaid
graph LR
subgraph "Cache Layers"
A[Widget Data Cache] --> B[Service Instance Cache]
B --> C[Batch Cache]
C --> D[Financial Data Cache]
D --> E[Attendance Data Cache]
end
subgraph "Invalidation Strategies"
F[Context-based Invalidation]
G[Pattern-based Invalidation]
H[TTL-based Expiration]
I[Financial Data Refresh]
J[Attendance Data Refresh]
end
subgraph "Storage Backends"
K[Redis Distributed Cache]
L[In-Memory Fallback]
M[Financial Data Persistence]
N[Attendance Data Persistence]
end
A --> K
D --> M
E --> N
F --> K
F --> L
I --> M
J --> N
```

**Diagram sources**
- [dashboard-cache.service.ts:23-319](file://backend/src/modules/dashboard/services/dashboard-cache.service.ts#L23-L319)

### Performance Metrics

The system tracks key performance indicators:

- **Average Resolution Time**: Target < 100ms, currently ~45ms
- **Cache Hit Rate**: Target > 80%, currently ~87%
- **Memory Usage**: Target < 50MB, currently ~2MB
- **Error Rate**: Target < 1%
- **Financial Query Performance**: Optimized for large dataset aggregation
- **Attendance Query Performance**: Optimized for real-time presence tracking

### Optimization Techniques

1. **Multi-Level Caching**: Widget data, service instances, batch results, financial data, and attendance data
2. **Parallel Processing**: Multiple widgets can be loaded concurrently
3. **Lazy Initialization**: Services loaded on-demand
4. **Automatic Cleanup**: Periodic cache maintenance
5. **Scalable Storage**: Redis support for distributed environments
6. **Financial Data Optimization**: Specialized caching for financial metrics
7. **Attendance Data Optimization**: Specialized caching for real-time presence metrics

**Section sources**
- [dashboard-cache.service.ts:297-315](file://backend/src/modules/dashboard/services/dashboard-cache.service.ts#L297-L315)
- [DASHBOARD-SYSTEM.md:405-421](file://backend/docs/DASHBOARD-SYSTEM.md#L405-L421)

## Security and Access Control

The dashboard system implements robust security measures:

### Authentication and Authorization

```mermaid
flowchart TD
Request[Incoming Request] --> AuthCheck[Authentication Middleware]
AuthCheck --> |Valid| RBAC[RBAC Authorization]
AuthCheck --> |Invalid| Unauthorized[401 Unauthorized]
RBAC --> |Has Role| WidgetAccess[Widget Access Check]
RBAC --> |No Role| Forbidden[403 Forbidden]
WidgetAccess --> |Has Permission| Proceed[Proceed to Data]
WidgetAccess --> |No Permission| Forbidden
Proceed --> FinancialCheck[Financial Data Access]
Proceed --> AttendanceCheck[Attendance Data Access]
FinancialCheck --> |Authorized| Response[Return Data]
FinancialCheck --> |Unauthorized| Forbidden
AttendanceCheck --> |Authorized| Response
AttendanceCheck --> |Unauthorized| Forbidden
```

**Diagram sources**
- [dashboard.controller.ts:24-53](file://backend/src/modules/dashboard/controllers/dashboard.controller.ts#L24-L53)

### Security Features

1. **Role-Based Access Control**: Widgets restricted by user roles
2. **Permission Validation**: All required permissions verified
3. **Institutional Scoping**: Establishment-specific data access
4. **Input Validation**: Zod schema validation for all endpoints
5. **Audit Logging**: Comprehensive request/response logging
6. **Financial Data Protection**: Specialized access controls for financial information
7. **Attendance Data Protection**: Specialized access controls for student privacy

**Section sources**
- [dashboard.controller.ts:16-21](file://backend/src/modules/dashboard/controllers/dashboard.controller.ts#L16-L21)
- [widget-resolver.service.ts:143-176](file://backend/src/modules/dashboard/services/widget-resolver.service.ts#L143-L176)

## API Endpoints

The dashboard system provides a comprehensive REST API with enhanced financial dashboard capabilities and new attendance monitoring endpoints:

### Available Endpoints

| Method | Endpoint | Description | Authentication | Authorization |
|--------|----------|-------------|----------------|---------------|
| `GET` | `/api/dashboard/widgets` | Get available widgets | Required | All roles |
| `GET` | `/api/dashboard/widget/:id/data` | Get widget data | Required | Widget permissions |
| `POST` | `/api/dashboard/widget/:id/refresh` | Force widget refresh | Required | All roles |
| `GET` | `/api/dashboard/layout` | Get user layout | Required | All roles |
| `POST` | `/api/dashboard/layout` | Save user layout | Required | All roles |
| `DELETE` | `/api/dashboard/layout` | Reset user layout | Required | All roles |
| `GET` | `/api/dashboard/performance` | Performance stats | Required | ADMIN, SUPER_ADMIN |
| `POST` | `/api/dashboard/cache/clear` | Clear cache | Required | ADMIN, SUPER_ADMIN |
| `GET` | `/api/dashboard/cache/stats` | Cache statistics | Required | ADMIN, SUPER_ADMIN |
| `GET` | `/api/dashboard/modules` | Available modules | Required | All roles |
| **`GET`** | **`/api/finances/dashboard/stats`** | **Complete financial statistics** | **Required** | **FINANCE_ADMIN, ACCOUNTANT** |
| **`GET`** | **`/api/finances/dashboard/evolution-paiements`** | **Payment trend evolution** | **Required** | **FINANCE_ADMIN, ACCOUNTANT** |
| **`GET`** | **`/api/finances/dashboard/top-impayes`** | **Top overdue students** | **Required** | **FINANCE_ADMIN, ACCOUNTANT** |
| **`GET`** | **`/api/finances/dashboard/ratio-revenus-depenses`** | **Income-expense ratios** | **Required** | **FINANCE_ADMIN, ACCOUNTANT** |
| **`GET`** | **`/api/attendance/dashboard/stats`** | **Complete attendance statistics** | **Required** | **ACADEMIC_ADMIN, TEACHER** |
| **`GET`** | **`/api/attendance/dashboard/trend`** | **Attendance trend analysis** | **Required** | **ACADEMIC_ADMIN, TEACHER** |
| **`GET`** | **`/api/attendance/dashboard/high-risk`** | **High-risk students analysis** | **Required** | **ACADEMIC_ADMIN, TEACHER** |
| **`GET`** | **`/api/attendance/dashboard/behavioral-assessment`** | **Behavioral assessment metrics** | **Required** | **ACADEMIC_ADMIN, TEACHER** |

### Request/Response Patterns

All endpoints follow consistent patterns:
- **Success Response**: `{ success: true, data: {...} }`
- **Error Response**: `{ success: false, error: {...} }`
- **Validation**: Zod schema validation for all inputs
- **Logging**: Comprehensive request/response logging

**Section sources**
- [dashboard.controller.ts:27-386](file://backend/src/modules/dashboard/controllers/dashboard.controller.ts#L27-L386)
- [finances.controller.ts:1-200](file://backend/src/modules/finances/controllers/finances.controller.ts#L1-L200)
- [dashboard.dto.ts:11-77](file://backend/src/modules/dashboard/dtos/dashboard.dto.ts#L11-L77)

## Database Design

The dashboard system uses a relational database design optimized for performance:

### Dashboard Layout Entity

```mermaid
erDiagram
DASHBOARD_LAYOUTS {
uuid id PK
uuid utilisateur_id FK
uuid etablissement_id FK
varchar nom
jsonb widgets
boolean actif
timestamp created_at
timestamp updated_at
}
UTILISATEURS {
uuid id PK
string email UK
string nom
string prenom
string role
boolean actif
}
ETABLISSEMENTS {
uuid id PK
string nom
string adresse
boolean actif
}
DASHBOARD_LAYOUTS ||--|| UTILISATEURS : belongs_to
DASHBOARD_LAYOUTS ||--o| ETABLISSEMENTS : scoped_by
```

**Diagram sources**
- [dashboard-layout.entity.ts:32-65](file://backend/src/modules/dashboard/entities/dashboard-layout.entity.ts#L32-L65)

### Financial Dashboard Tables

**New** The financial dashboard integrates with existing financial tables:

```mermaid
erDiagram
PAIEMENTS {
uuid id PK
uuid eleve_id FK
uuid etablissement_id FK
decimal montant_total
date date_paiement
string statut
timestamp created_at
}
ELEVES {
uuid id PK
string nom
string prenom
uuid classe_id FK
}
ECHENCIERS {
uuid id PK
uuid eleve_id FK
decimal montant_attendu
decimal montant_paye
date echeance
string statut
}
BUDGET {
uuid id PK
uuid etablissement_id FK
decimal montant_prevu
decimal montant_actualise
integer annee
string type
}
```

**Diagram sources**
- [dashboard-layout.entity.ts:32-65](file://backend/src/modules/dashboard/entities/dashboard-layout.entity.ts#L32-L65)

### Attendance Monitoring Tables

**New** The attendance monitoring system introduces specialized tables for tracking student attendance and behavioral patterns:

```mermaid
erDiagram
SUiviAssiduiteEleves {
uuid id PK
uuid eleve_id FK
uuid annee_scolaire_id FK
uuid periode_id FK
int nombre_absences
int nombre_absences_justifiees
int nombre_absences_non_justifiees
int nombre_retards
int nombre_jours_presence
int nombre_jours_total
float taux_presence
boolean conforme_examen
simple_json causes_absences
varchar observations
}
ELEVES {
uuid id PK
string nom
string prenom
uuid classe_id FK
}
ANNEES_SCOLAIRES {
uuid id PK
string annee
boolean active
}
PERIODES {
uuid id PK
string nom
string type
date debut
date fin
uuid annee_scolaire_id FK
}
INCIDENTS_ELEVES {
uuid id PK
uuid eleve_id FK
string type
string gravite
string description
date date_incident
uuid annee_scolaire_id FK
}
OBSERVATIONS_ELEVES {
uuid id PK
uuid eleve_id FK
string type
string description
int points_impact
date date_observation
uuid annee_scolaire_id FK
}
SANCTIONS_ELEVES {
uuid id PK
uuid eleve_id FK
string type
string gravite
string description
date date_sanction
string statut
uuid annee_scolaire_id FK
}
FELICITATIONS_ELEVES {
uuid id PK
uuid eleve_id FK
string description
int points_bonus
date date_felicitation
uuid annee_scolaire_id FK
}
```

**Diagram sources**
- [ANALYSE-CONTEXTE-AFRICAIN-CAMEROUN.md:410-463](file://ANALYSE-CONTEXTE-AFRICAIN-CAMEROUN.md#L410-L463)

### Database Optimizations

1. **Composite Indexes**: Optimized for common query patterns
2. **JSONB Storage**: Flexible widget configuration storage
3. **Cascade Deletion**: Automatic cleanup of related data
4. **UUID Primary Keys**: Scalable identifier generation
5. **Financial Query Optimization**: Indexes for financial data aggregation
6. **Attendance Query Optimization**: Indexes for real-time presence tracking
7. **Contextual Data Storage**: JSON fields for flexible behavioral assessment

**Section sources**
- [dashboard-layout.entity.ts:32-65](file://backend/src/modules/dashboard/entities/dashboard-layout.entity.ts#L32-L65)

## Implementation Details

### Widget Types and Categories

The system supports various widget types optimized for different data visualization needs:

| Widget Type | Purpose | Example Use Cases |
|-------------|---------|-------------------|
| `stats-cards` | Key metrics display | Student counts, totals |
| `chart-line` | Trend analysis | Academic performance over time |
| `chart-bar` | Comparative data | Distribution analysis |
| `chart-pie` | Proportional data | Category breakdowns |
| `data-table` | Tabular data | Detailed listings |
| `list` | Simple lists | Recent activity |
| `calendar` | Temporal data | Event scheduling |
| `progress` | Progress tracking | Task completion |
| `alert` | Status indicators | System alerts |
| `quick-actions` | Direct navigation | Common operations |
| `custom` | Specialized widgets | Custom visualizations |
| **`validation-stats`** | **Validation workflow metrics** | **Validation statistics by module** |
| **`pending-validations`** | **Pending validation tracking** | **User-specific validation requests** |
| **`avg-validation-times`** | **Performance analysis** | **Average validation times by level** |
| **`financial-stats`** | **Financial overview** | **Revenue, expenses, collections** |
| **`payment-trends`** | **Payment analysis** | **Daily/monthly payment trends** |
| **`overdue-students`** | **Arrear analysis** | **Top overdue student rankings** |
| **`financial-ratios`** | **Financial health** | **Income-expense ratios** |
| **`attendance-overview`** | **Attendance summary** | **Overall presence statistics** |
| **`trend-analysis`** | **Attendance trends** | **Daily/weekly/monthly trends** |
| **`risk-assessment`** | **Student risk analysis** | **High-risk student identification** |
| **`behavioral-metrics`** | **Behavioral indicators** | **Positive/negative behavior tracking** |

**Updated** Four new financial widget types and four new attendance widget types have been added to support comprehensive dashboard visualization and analysis.

### Refresh Strategies

Widgets implement different refresh strategies based on data volatility and user needs:

```mermaid
stateDiagram-v2
[*] --> Interval : Scheduled refresh
[*] --> OnDemand : Request-based refresh
[*] --> Realtime : Live updates
[*] --> Manual : User-initiated
Interval --> Processing : Every X seconds
OnDemand --> Processing : On request
Realtime --> Processing : Event-driven
Manual --> Processing : User action
Processing --> Cache : Store result
Processing --> Error : Operation failed
Cache --> Interval : TTL expired
Cache --> OnDemand : New request
Cache --> Realtime : New event
Cache --> Manual : Force refresh
Error --> Retry : Temporary failure
Error --> Fallback : Permanent failure
```

**Diagram sources**
- [dashboard.types.ts:14-16](file://backend/src/modules/dashboard/types/dashboard.types.ts#L14-L16)

### Development Guidelines

1. **Widget Registration**: Add new widgets to the registry with proper metadata
2. **Data Service Implementation**: Implement data retrieval methods in dashboard-data.service.ts
3. **Permission Definition**: Specify required permissions for access control
4. **Financial Data Integration**: Implement financial data services in dashboard.service.ts
5. **Attendance Data Integration**: Implement attendance data services in attendance-dashboard.service.ts
6. **Testing**: Verify widget functionality across different user roles
7. **Documentation**: Update widget registry documentation

**Section sources**
- [widget-registry.ts:196-221](file://backend/src/modules/dashboard/utils/widget-registry.ts#L196-L221)
- [dashboard-data.service.ts:20-455](file://backend/src/modules/dashboard/services/dashboard-data.service.ts#L20-L455)

### Financial Dashboard Implementation

**New** The dashboard system now includes four specialized financial dashboard endpoints:

#### Complete Financial Statistics
- **Endpoint**: `/api/finances/dashboard/stats`
- **Purpose**: Provide comprehensive financial overview including revenue, expenses, and collections
- **Data Source**: `getStats()` method in FinanceDashboardService
- **Visualization**: Combined financial metrics card layout
- **Access Control**: Requires FINANCE_ADMIN or ACCOUNTANT permissions

#### Payment Trend Evolution
- **Endpoint**: `/api/finances/dashboard/evolution-paiements`
- **Purpose**: Show payment trends over configurable time periods
- **Data Source**: `getEvolutionPaiements()` method
- **Visualization**: Line chart showing daily/monthly payment evolution
- **Access Control**: Requires FINANCE_ADMIN or ACCOUNTANT permissions

#### Top Overdue Students
- **Endpoint**: `/api/finances/dashboard/top-impayes`
- **Purpose**: Display top 10 students with highest outstanding balances
- **Data Source**: `getTopImpayes()` method
- **Visualization**: Ranked table with student details and balances
- **Access Control**: Requires FINANCE_ADMIN or ACCOUNTANT permissions

#### Income-Expense Ratios
- **Endpoint**: `/api/finances/dashboard/ratio-revenus-depenses`
- **Purpose**: Calculate and display financial ratios and annual financial health
- **Data Source**: `getRatioRevenusDepenses()` method
- **Visualization**: Ratio cards and financial health indicators
- **Access Control**: Requires FINANCE_ADMIN or ACCOUNTANT permissions

### Attendance Dashboard Implementation

**New** The dashboard system now includes four specialized attendance dashboard endpoints:

#### Complete Attendance Statistics
- **Endpoint**: `/api/attendance/dashboard/stats`
- **Purpose**: Provide comprehensive attendance overview including presence rates, absence patterns, and behavioral indicators
- **Data Source**: `getStats()` method in AttendanceDashboardService
- **Visualization**: Combined attendance metrics card layout
- **Access Control**: Requires ACADEMIC_ADMIN or TEACHER permissions

#### Attendance Trend Analysis
- **Endpoint**: `/api/attendance/dashboard/trend`
- **Purpose**: Show attendance trends over configurable time periods with trimester-specific analysis
- **Data Source**: `getTrend()` method
- **Visualization**: Line chart showing daily/weekly/monthly attendance trends
- **Access Control**: Requires ACADEMIC_ADMIN or TEACHER permissions

#### High-Risk Students Analysis
- **Endpoint**: `/api/attendance/dashboard/high-risk`
- **Purpose**: Display students at risk of academic failure based on attendance patterns and behavioral indicators
- **Data Source**: `getHighRiskStudents()` method
- **Visualization**: Ranked table with risk scores and intervention recommendations
- **Access Control**: Requires ACADEMIC_ADMIN or TEACHER permissions

#### Behavioral Assessment Metrics
- **Endpoint**: `/api/attendance/dashboard/behavioral-assessment`
- **Purpose**: Analyze behavioral patterns including positive/negative indicators and gamification points
- **Data Source**: `getBehavioralAssessment()` method
- **Visualization**: Behavioral metrics cards and trend analysis
- **Access Control**: Requires ACADEMIC_ADMIN or TEACHER permissions

**Section sources**
- [dashboard.service.ts:1-401](file://backend/src/modules/finances/services/dashboard.service.ts#L1-L401)
- [finances.controller.ts:1-200](file://backend/src/modules/finances/controllers/finances.controller.ts#L1-L200)
- [suivi-eleve.service.ts:308-322](file://backend/src/modules/suivi-eleves/services/suivi-eleve.service.ts#L308-L322)

## Troubleshooting Guide

### Common Issues and Solutions

#### Widget Not Appearing

**Symptoms**: Widget visible in registry but not returned by API
**Causes**:
1. Missing required permissions
2. Insufficient user role
3. Institution scope restrictions
4. Cache corruption

**Solutions**:
1. Verify user permissions via RBAC endpoints
2. Check user role assignments
3. Confirm institution context
4. Clear user cache scope

#### Slow Performance

**Symptoms**: Widgets taking longer than expected to load
**Causes**:
1. Cache miss rates
2. Database query bottlenecks
3. Network latency
4. Service overload
5. Financial data aggregation delays
6. Attendance data aggregation delays

**Solutions**:
1. Monitor cache statistics
2. Review database query plans
3. Check network connectivity
4. Scale infrastructure resources
5. Optimize financial data queries
6. Optimize attendance data queries

#### Data Accuracy Issues

**Symptoms**: Outdated or incorrect widget data
**Causes**:
1. Expired cache entries
2. Data calculation errors
3. Synchronization delays
4. Service failures
5. Financial data inconsistencies
6. Attendance data inconsistencies

**Solutions**:
1. Force widget refresh
2. Clear cache entries
3. Verify data service implementations
4. Check service health status
5. Validate financial data integrity
6. Validate attendance data integrity

#### Financial Dashboard Errors

**Symptoms**: Financial dashboard endpoints returning errors
**Causes**:
1. Missing financial permissions
2. Invalid parameter values
3. Database connection issues
4. Financial data calculation failures

**Solutions**:
1. Verify FINANCE_ADMIN or ACCOUNTANT permissions
2. Check endpoint parameters (periode, jours, limit, annee)
3. Monitor database connectivity
4. Review financial data service logs

#### Attendance Dashboard Errors

**Symptoms**: Attendance dashboard endpoints returning errors
**Causes**:
1. Missing academic permissions
2. Invalid parameter values
3. Database connection issues
4. Attendance data calculation failures
5. Student privacy data access issues

**Solutions**:
1. Verify ACADEMIC_ADMIN or TEACHER permissions
2. Check endpoint parameters (periode, jours, limit, annee)
3. Monitor database connectivity
4. Review attendance data service logs
5. Verify student enrollment and privacy settings

### Diagnostic Tools

The system provides comprehensive diagnostic capabilities:

1. **Performance Monitoring**: Real-time performance statistics
2. **Cache Analysis**: Detailed cache hit/miss ratios
3. **Error Tracking**: Comprehensive error logging
4. **Service Health**: Individual service status monitoring
5. **Financial Data Monitoring**: Specialized financial query performance tracking
6. **Attendance Data Monitoring**: Specialized attendance query performance tracking
7. **Privacy Monitoring**: Student data access and privacy compliance tracking

**Section sources**
- [dashboard.controller.ts:216-243](file://backend/src/modules/dashboard/controllers/dashboard.controller.ts#L216-L243)
- [dashboard-cache.service.ts:252-283](file://backend/src/modules/dashboard/services/dashboard-cache.service.ts#L252-L283)

## Conclusion

The eLISAschool Dashboard System represents a mature, production-ready solution for educational data visualization with comprehensive financial dashboard integration and **new attendance monitoring capabilities**. Its architecture balances flexibility with performance, providing administrators and educators with powerful insights into their institution's operations.

Key strengths of the implementation include:

- **Comprehensive Widget System**: 15+ pre-built widgets covering all major educational domains
- **Robust Security Model**: Multi-layered RBAC with institutional scoping
- **High Performance**: Intelligent caching, lazy loading, and optimization strategies
- **Extensible Design**: Easy widget registration and data service integration
- **Production Ready**: Comprehensive monitoring, logging, and error handling
- **Financial Dashboard Integration**: Four specialized endpoints for real-time financial insights
- **Workflow Integration**: Seamless integration with validation and financial workflow systems
- **Attendance Monitoring System**: Comprehensive student attendance tracking with behavioral assessment
- **Contextual Analysis**: Specialized features for African educational contexts with specific absence cause categorization

**Updated** The addition of comprehensive attendance monitoring capabilities significantly enhances the system's ability to track student attendance patterns, behavioral indicators, and academic risk factors. The SuiviAssiduiteEleve entity provides 100% presence indicators, trimester-specific behavioral assessments, and contextual analysis tailored for African educational environments. This integration with the existing financial dashboard system creates a holistic view of student performance and institutional effectiveness.

The system successfully addresses the challenges of educational data management while maintaining scalability and maintainability for future enhancements. Its modular architecture ensures that new widgets, financial endpoints, attendance monitoring features, and data sources can be easily integrated without disrupting existing functionality.