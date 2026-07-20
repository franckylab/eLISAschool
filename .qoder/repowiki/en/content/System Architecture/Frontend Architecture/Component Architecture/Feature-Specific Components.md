# Feature-Specific Components

<cite>
**Referenced Files in This Document**
- [App.tsx](file://frontend/src/App.tsx)
- [main.tsx](file://frontend/src/main.tsx)
- [routeTree.gen.ts](file://frontend/src/routeTree.gen.ts)
- [eleves/index.ts](file://frontend/src/features/eleves/index.ts)
- [eleves/components/EleveList.tsx](file://frontend/src/features/eleves/components/EleveList.tsx)
- [eleves/hooks/useEleves.ts](file://frontend/src/features/eleves/hooks/useEleves.ts)
- [eleves/types/eleve.types.ts](file://frontend/src/features/eleves/types/eleve.types.ts)
- [eleves/store/eleves.store.ts](file://frontend/src/features/eleves/store/eleves.store.ts)
- [personnel/index.ts](file://frontend/src/features/personnel/index.ts)
- [personnel/components/PersonnelList.tsx](file://frontend/src/features/personnel/components/PersonnelList.tsx)
- [personnel/hooks/usePersonnel.ts](file://frontend/src/features/personnel/hooks/usePersonnel.ts)
- [personnel/types/personnel.types.ts](file://frontend/src/features/personnel/types/personnel.types.ts)
- [personnel/store/personnel.store.ts](file://frontend/src/features/personnel/store/personnel.store.ts)
- [finances/index.ts](file://frontend/src/features/finances/index.ts)
- [finances/components/PaymentList.tsx](file://frontend/src/features/finances/components/PaymentList.tsx)
- [finances/hooks/usePayments.ts](file://frontend/src/features/finances/hooks/usePayments.ts)
- [finances/types/payment.types.ts](file://frontend/src/features/finances/types/payment.types.ts)
- [finances/store/payments.store.ts](file://frontend/src/features/finances/store/payments.store.ts)
- [routes/_layout.tsx](file://frontend/src/routes/_layout.tsx)
- [routes/eleves.$id.tsx](file://frontend/src/routes/eleves.$id.tsx)
- [routes/personnel.$id.tsx](file://frontend/src/routes/personnel.$id.tsx)
- [routes/finances.payments.tsx](file://frontend/src/routes/finances.payments.tsx)
- [components/guards/PermissionGuard.tsx](file://frontend/src/components/guards/PermissionGuard.tsx)
- [hooks/useAuth.ts](file://frontend/src/hooks/useAuth.ts)
- [lib/queryClient.ts](file://frontend/src/lib/queryClient.ts)
- [stores/app.store.ts](file://frontend/src/stores/app.store.ts)
</cite>

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

## Introduction
This document explains the feature-based architecture used across business domains (eleves, personnel, finances, etc.). Each domain owns its components, hooks, types, stores, and utilities. The frontend uses:
- React Query for data fetching and caching
- Zustand for local UI state management
- Route-based component organization with TanStack Router
- Permission guards to protect routes and actions
- Feature module loading patterns for scalability

The goal is to help developers understand how features are composed, how state flows between layers, and how to test and optimize feature components effectively.

## Project Structure
The frontend organizes code by feature under src/features/<domain>. A typical feature includes:
- components: presentational and container components
- hooks: React Query hooks and feature-specific logic
- types: TypeScript interfaces and enums
- store: Zustand slices for local UI state
- index.ts: public API re-exports for clean imports

```mermaid
graph TB
subgraph "Frontend Root"
App["App.tsx"]
Main["main.tsx"]
RTG["routeTree.gen.ts"]
end
subgraph "Features"
Eleves["features/eleves"]
Personnel["features/personnel"]
Finances["features/finances"]
end
subgraph "Shared"
Guards["components/guards/PermissionGuard.tsx"]
AuthHook["hooks/useAuth.ts"]
QueryClient["lib/queryClient.ts"]
AppStore["stores/app.store.ts"]
end
App --> RTG
Main --> App
RTG --> Eleves
RTG --> Personnel
RTG --> Finances
Eleves --> QueryClient
Personnel --> QueryClient
Finances --> QueryClient
Eleves --> AppStore
Personnel --> AppStore
Finances --> AppStore
RTG --> Guards
Guards --> AuthHook
```

**Diagram sources**
- [App.tsx](file://frontend/src/App.tsx)
- [main.tsx](file://frontend/src/main.tsx)
- [routeTree.gen.ts](file://frontend/src/routeTree.gen.ts)
- [lib/queryClient.ts](file://frontend/src/lib/queryClient.ts)
- [stores/app.store.ts](file://frontend/src/stores/app.store.ts)
- [components/guards/PermissionGuard.tsx](file://frontend/src/components/guards/PermissionGuard.tsx)
- [hooks/useAuth.ts](file://frontend/src/hooks/useAuth.ts)

**Section sources**
- [App.tsx](file://frontend/src/App.tsx)
- [main.tsx](file://frontend/src/main.tsx)
- [routeTree.gen.ts](file://frontend/src/routeTree.gen.ts)

## Core Components
Each feature exposes a small public surface via an index file that re-exports components, hooks, and types. This keeps route files and other features decoupled from internal structure.

- eleves: student list/detail views, queries, types, and UI store slice
- personnel: staff list/detail views, queries, types, and UI store slice
- finances: payments and related views, queries, types, and UI store slice

Key responsibilities:
- Components render feature UI and consume hooks
- Hooks encapsulate React Query usage and transform server responses
- Types define request/response contracts and UI shapes
- Stores manage local UI state (filters, pagination, modals)

**Section sources**
- [eleves/index.ts](file://frontend/src/features/eleves/index.ts)
- [personnel/index.ts](file://frontend/src/features/personnel/index.ts)
- [finances/index.ts](file://frontend/src/features/finances/index.ts)

## Architecture Overview
Feature architecture follows a layered pattern:
- Routes mount feature components
- Components call feature hooks
- Hooks use React Query to fetch data
- Components read/write Zustand stores for local UI state
- Permission guards wrap protected routes/actions

```mermaid
sequenceDiagram
participant User as "User"
participant Router as "TanStack Router"
participant Guard as "PermissionGuard"
participant Comp as "Feature Component"
participant Hook as "useXxx Hook"
participant Q as "React Query"
participant Store as "Zustand Store"
User->>Router : Navigate to "/eleves/ : id"
Router->>Guard : Check permissions
Guard-->>Router : Allow/Deny
Router->>Comp : Render EleveDetail
Comp->>Hook : Call useEleve(id)
Hook->>Q : query({ key, fetcher })
Q-->>Hook : data | isLoading | error
Hook-->>Comp : { data, status }
Comp->>Store : setFilter()/setModal()
Store-->>Comp : latest UI state
Comp-->>User : Rendered UI
```

**Diagram sources**
- [routes/eleves.$id.tsx](file://frontend/src/routes/eleves.$id.tsx)
- [components/guards/PermissionGuard.tsx](file://frontend/src/components/guards/PermissionGuard.tsx)
- [hooks/useAuth.ts](file://frontend/src/hooks/useAuth.ts)
- [lib/queryClient.ts](file://frontend/src/lib/queryClient.ts)
- [eleves/hooks/useEleves.ts](file://frontend/src/features/eleves/hooks/useEleves.ts)
- [eleves/store/eleves.store.ts](file://frontend/src/features/eleves/store/eleves.store.ts)

## Detailed Component Analysis

### Eleves Feature
Responsibilities:
- List and detail views for students
- Queries for listing and fetching a single student
- Local UI state for filters, selection, and modal visibility

Composition patterns:
- Route mounts EleveList or EleveDetail
- Components consume useEleves hooks
- UI state managed in eleves.store.ts

```mermaid
classDiagram
class EleveList {
+render()
-filters
-pagination
}
class EleveDetail {
+render()
-studentId
}
class UseEleves {
+list(params)
+getById(id)
+invalidate()
}
class EleveTypes {
+Eleve
+EleveFilters
}
class ElevesStore {
+filters
+selectedIds
+setFilters()
+toggleSelect()
}
EleveList --> UseEleves : "uses"
EleveDetail --> UseEleves : "uses"
EleveList --> ElevesStore : "reads/writes"
EleveDetail --> ElevesStore : "reads/writes"
EleveList --> EleveTypes : "types"
EleveDetail --> EleveTypes : "types"
```

**Diagram sources**
- [eleves/components/EleveList.tsx](file://frontend/src/features/eleves/components/EleveList.tsx)
- [eleves/hooks/useEleves.ts](file://frontend/src/features/eleves/hooks/useEleves.ts)
- [eleves/types/eleve.types.ts](file://frontend/src/features/eleves/types/eleve.types.ts)
- [eleves/store/eleves.store.ts](file://frontend/src/features/eleves/store/eleves.store.ts)

Data flow example:
- Route renders EleveList
- EleveList calls useEleves.list(filters)
- React Query caches results; component subscribes to updates
- EleveList toggles filters via ElevesStore.setFilters()

**Section sources**
- [eleves/components/EleveList.tsx](file://frontend/src/features/eleves/components/EleveList.tsx)
- [eleves/hooks/useEleves.ts](file://frontend/src/features/eleves/hooks/useEleves.ts)
- [eleves/types/eleve.types.ts](file://frontend/src/features/eleves/types/eleve.types.ts)
- [eleves/store/eleves.store.ts](file://frontend/src/features/eleves/store/eleves.store.ts)
- [routes/eleves.$id.tsx](file://frontend/src/routes/eleves.$id.tsx)

### Personnel Feature
Responsibilities:
- Staff directory and profile views
- Queries for listing and fetching a single staff member
- Local UI state for search, roles, and modals

```mermaid
flowchart TD
Start(["Route /personnel/:id"]) --> Mount["Render PersonnelDetail"]
Mount --> Fetch["usePersonnel.getById(id)"]
Fetch --> QFetch["React Query fetch"]
QFetch --> Data{"Data ready?"}
Data --> |No| Loading["Show skeleton/loader"]
Data --> |Yes| Render["Render details"]
Render --> Actions["Open edit modal"]
Actions --> StoreWrite["Update personnel.store"]
StoreWrite --> ReRender["Component re-renders"]
```

**Diagram sources**
- [personnel/components/PersonnelList.tsx](file://frontend/src/features/personnel/components/PersonnelList.tsx)
- [personnel/hooks/usePersonnel.ts](file://frontend/src/features/personnel/hooks/usePersonnel.ts)
- [personnel/types/personnel.types.ts](file://frontend/src/features/personnel/types/personnel.types.ts)
- [personnel/store/personnel.store.ts](file://frontend/src/features/personnel/store/personnel.store.ts)
- [routes/personnel.$id.tsx](file://frontend/src/routes/personnel.$id.tsx)

**Section sources**
- [personnel/components/PersonnelList.tsx](file://frontend/src/features/personnel/components/PersonnelList.tsx)
- [personnel/hooks/usePersonnel.ts](file://frontend/src/features/personnel/hooks/usePersonnel.ts)
- [personnel/types/personnel.types.ts](file://frontend/src/features/personnel/types/personnel.types.ts)
- [personnel/store/personnel.store.ts](file://frontend/src/features/personnel/store/personnel.store.ts)
- [routes/personnel.$id.tsx](file://frontend/src/routes/personnel.$id.tsx)

### Finances Feature
Responsibilities:
- Payments list and summary views
- Queries for paginated payment lists and totals
- Local UI state for date ranges, statuses, and export flags

```mermaid
sequenceDiagram
participant R as "Route /finances/payments"
participant C as "PaymentList"
participant H as "usePayments"
participant Q as "React Query"
participant S as "payments.store"
R->>C : Render PaymentList
C->>H : list({ page, status, dateRange })
H->>Q : query({ key : ["payments", params] })
Q-->>H : { data, isLoading, isError }
H-->>C : { rows, meta, status }
C->>S : setStatus(status)
S-->>C : updated filter state
C-->>R : Rendered table with controls
```

**Diagram sources**
- [finances/components/PaymentList.tsx](file://frontend/src/features/finances/components/PaymentList.tsx)
- [finances/hooks/usePayments.ts](file://frontend/src/features/finances/hooks/usePayments.ts)
- [finances/types/payment.types.ts](file://frontend/src/features/finances/types/payment.types.ts)
- [finances/store/payments.store.ts](file://frontend/src/features/finances/store/payments.store.ts)
- [routes/finances.payments.tsx](file://frontend/src/routes/finances.payments.tsx)

**Section sources**
- [finances/components/PaymentList.tsx](file://frontend/src/features/finances/components/PaymentList.tsx)
- [finances/hooks/usePayments.ts](file://frontend/src/features/finances/hooks/usePayments.ts)
- [finances/types/payment.types.ts](file://frontend/src/features/finances/types/payment.types.ts)
- [finances/store/payments.store.ts](file://frontend/src/features/finances/store/payments.store.ts)
- [routes/finances.payments.tsx](file://frontend/src/routes/finances.payments.tsx)

### Permission Guards and Authentication Integration
- PermissionGuard wraps protected routes and checks user capabilities
- useAuth provides current user context and capability checks
- Routes can conditionally render or redirect based on permissions

```mermaid
flowchart TD
Enter["Navigate to protected route"] --> Guard["PermissionGuard"]
Guard --> HasPerm{"Has required permission?"}
HasPerm --> |Yes| Allow["Render target component"]
HasPerm --> |No| Deny["Redirect to unauthorized or login"]
```

**Diagram sources**
- [components/guards/PermissionGuard.tsx](file://frontend/src/components/guards/PermissionGuard.tsx)
- [hooks/useAuth.ts](file://frontend/src/hooks/useAuth.ts)

**Section sources**
- [components/guards/PermissionGuard.tsx](file://frontend/src/components/guards/PermissionGuard.tsx)
- [hooks/useAuth.ts](file://frontend/src/hooks/useAuth.ts)

### Route-Based Organization
Routes are organized by domain and nested layout:
- _layout.tsx defines shared chrome and guards
- Domain routes map to feature components
- Generated route tree centralizes navigation configuration

```mermaid
graph LR
Layout["_layout.tsx"] --> ElevesRoute["eleves.$id.tsx"]
Layout --> PersonnelRoute["personnel.$id.tsx"]
Layout --> FinancesRoute["finances.payments.tsx"]
ElevesRoute --> ElevesComp["features/eleves/*"]
PersonnelRoute --> PersonnelComp["features/personnel/*"]
FinancesRoute --> FinancesComp["features/finances/*"]
```

**Diagram sources**
- [routes/_layout.tsx](file://frontend/src/routes/_layout.tsx)
- [routes/eleves.$id.tsx](file://frontend/src/routes/eleves.$id.tsx)
- [routes/personnel.$id.tsx](file://frontend/src/routes/personnel.$id.tsx)
- [routes/finances.payments.tsx](file://frontend/src/routes/finances.payments.tsx)

**Section sources**
- [routes/_layout.tsx](file://frontend/src/routes/_layout.tsx)
- [routes/eleves.$id.tsx](file://frontend/src/routes/eleves.$id.tsx)
- [routes/personnel.$id.tsx](file://frontend/src/routes/personnel.$id.tsx)
- [routes/finances.payments.tsx](file://frontend/src/routes/finances.payments.tsx)

## Dependency Analysis
- Features depend on shared libraries:
  - React Query client configured in lib/queryClient.ts
  - Global app store in stores/app.store.ts
  - Permission guard and auth hook for access control
- Features are loosely coupled through typed APIs and re-exports

```mermaid
graph TB
Eleves["features/eleves"] --> Q["lib/queryClient.ts"]
Personnel["features/personnel"] --> Q
Finances["features/finances"] --> Q
Eleves --> AppStore["stores/app.store.ts"]
Personnel --> AppStore
Finances --> AppStore
Routes["routes/*"] --> Eleves
Routes --> Personnel
Routes --> Finances
Routes --> Guard["components/guards/PermissionGuard.tsx"]
Guard --> Auth["hooks/useAuth.ts"]
```

**Diagram sources**
- [lib/queryClient.ts](file://frontend/src/lib/queryClient.ts)
- [stores/app.store.ts](file://frontend/src/stores/app.store.ts)
- [components/guards/PermissionGuard.tsx](file://frontend/src/components/guards/PermissionGuard.tsx)
- [hooks/useAuth.ts](file://frontend/src/hooks/useAuth.ts)
- [routes/_layout.tsx](file://frontend/src/routes/_layout.tsx)

**Section sources**
- [lib/queryClient.ts](file://frontend/src/lib/queryClient.ts)
- [stores/app.store.ts](file://frontend/src/stores/app.store.ts)
- [components/guards/PermissionGuard.tsx](file://frontend/src/components/guards/PermissionGuard.tsx)
- [hooks/useAuth.ts](file://frontend/src/hooks/useAuth.ts)

## Performance Considerations
- Prefer React Query cache keys that include all filter parameters to avoid stale data
- Use pagination and infinite queries for large lists
- Debounce input-driven filters in hooks before triggering refetches
- Keep Zustand stores minimal; only persist UI state, not full entities
- Memoize expensive computations in components using selectors or derived values
- Avoid unnecessary re-renders by splitting components and using stable references
- Leverage route-level lazy loading where appropriate to reduce initial bundle size

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and strategies:
- Stale or missing data: verify React Query cache keys and invalidation triggers
- Permission denied errors: ensure PermissionGuard has correct permissions and useAuth returns expected capabilities
- Excessive re-renders: check Zustand store subscriptions and component prop stability
- Network errors: inspect React Query error states and implement retry/backoff policies
- Route not found: confirm route definitions and generated route tree consistency

**Section sources**
- [lib/queryClient.ts](file://frontend/src/lib/queryClient.ts)
- [components/guards/PermissionGuard.tsx](file://frontend/src/components/guards/PermissionGuard.tsx)
- [hooks/useAuth.ts](file://frontend/src/hooks/useAuth.ts)

## Conclusion
The feature-based architecture cleanly separates concerns by domain, enabling scalable growth and maintainability. By combining React Query for data, Zustand for UI state, and robust routing with permission guards, each feature remains cohesive and testable. Following the composition patterns and performance tips outlined here will help keep the application responsive and easy to evolve.