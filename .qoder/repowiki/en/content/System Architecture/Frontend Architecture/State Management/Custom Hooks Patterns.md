# Custom Hooks Patterns

<cite>
**Referenced Files in This Document**
- [frontend/src/hooks/useAuth.ts](file://frontend/src/hooks/useAuth.ts)
- [frontend/src/hooks/usePermissions.ts](file://frontend/src/hooks/usePermissions.ts)
- [frontend/src/hooks/usePagination.ts](file://frontend/src/hooks/usePagination.ts)
- [frontend/src/hooks/useModal.ts](file://frontend/src/hooks/useModal.ts)
- [frontend/src/hooks/useQueryClient.ts](file://frontend/src/hooks/useQueryClient.ts)
- [frontend/src/stores/authStore.ts](file://frontend/src/stores/authStore.ts)
- [frontend/src/stores/uiStore.ts](file://frontend/src/stores/uiStore.ts)
- [frontend/src/lib/queryClient.ts](file://frontend/src/lib/queryClient.ts)
- [frontend/src/features/auth/login/LoginPage.tsx](file://frontend/src/features/auth/login/LoginPage.tsx)
- [frontend/src/features/dashboard/DashboardPage.tsx](file://frontend/src/features/dashboard/DashboardPage.tsx)
- [frontend/src/components/common/PaginationControls.tsx](file://frontend/src/components/common/PaginationControls.tsx)
- [frontend/src/components/common/PermissionGate.tsx](file://frontend/src/components/common/PermissionGate.tsx)
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
10. [Appendices](#appendices)

## Introduction
This document explains the custom hooks patterns used across the application, focusing on composition strategy, shared logic extraction, and reusable patterns for authentication, permissions, pagination, and UI interactions. It also covers naming conventions, parameter validation, return value structures, integration with Zustand stores and React Query, lifecycle considerations, examples for creating new hooks, testing strategies, and debugging techniques.

## Project Structure
The frontend organizes reusable logic into:
- hooks: composable functions encapsulating stateful behavior and side effects
- stores: Zustand stores for global client-side state
- lib: shared libraries (e.g., React Query configuration)
- features: domain-specific pages and components that consume hooks
- components: shared UI components that may use hooks internally

```mermaid
graph TB
subgraph "Hooks"
H_Auth["useAuth"]
H_Perms["usePermissions"]
H_Pag["usePagination"]
H_Modal["useModal"]
H_QC["useQueryClient"]
end
subgraph "Stores"
S_Auth["authStore (Zustand)"]
S_UI["uiStore (Zustand)"]
end
subgraph "Lib"
L_QC["queryClient (React Query)"]
end
subgraph "Features"
F_Login["LoginPage"]
F_Dash["DashboardPage"]
end
subgraph "Components"
C_Pag["PaginationControls"]
C_Perms["PermissionGate"]
end
H_Auth --> S_Auth
H_Perms --> S_Auth
H_Modal --> S_UI
H_Pag --> L_QC
H_QC --> L_QC
F_Login --> H_Auth
F_Dash --> H_Perms
C_Pag --> H_Pag
C_Perms --> H_Perms
```

[No sources needed since this diagram shows conceptual structure]

## Core Components
- Authentication hook: centralizes login/logout flows, token management, and user session state; integrates with auth store and React Query invalidation.
- Permissions hook: derives access decisions from current user roles/permissions; provides declarative checks and guards.
- Pagination hook: standardizes page size, offset/limit, sorting, filtering, and query key management; integrates with React Query for caching and refetching.
- Modal hook: manages modal visibility, data payload, and callbacks; integrates with UI store for consistent UX.
- Query client hook: exposes a typed React Query client instance to ensure consistent cache configuration and interceptors.

Key responsibilities:
- Encapsulate cross-cutting concerns (auth, permissions, pagination, UI state)
- Provide stable interfaces for components
- Coordinate with stores and React Query for performance and consistency

**Section sources**
- [frontend/src/hooks/useAuth.ts](file://frontend/src/hooks/useAuth.ts)
- [frontend/src/hooks/usePermissions.ts](file://frontend/src/hooks/usePermissions.ts)
- [frontend/src/hooks/usePagination.ts](file://frontend/src/hooks/usePagination.ts)
- [frontend/src/hooks/useModal.ts](file://frontend/src/hooks/hooks/useModal.ts)
- [frontend/src/hooks/useQueryClient.ts](file://frontend/src/hooks/useQueryClient.ts)
- [frontend/src/stores/authStore.ts](file://frontend/src/stores/authStore.ts)
- [frontend/src/stores/uiStore.ts](file://frontend/src/stores/uiStore.ts)
- [frontend/src/lib/queryClient.ts](file://frontend/src/lib/queryClient.ts)

## Architecture Overview
Custom hooks compose lower-level primitives (stores, React Query, utilities) and expose simple APIs to components. The architecture emphasizes:
- Separation of concerns: hooks handle logic; components render UI
- Composition over inheritance: small focused hooks combined as needed
- Single source of truth: Zustand stores for app-wide state; React Query for server state
- Predictable lifecycles: hooks subscribe/unsubscribe safely within component boundaries

```mermaid
sequenceDiagram
participant Comp as "Component"
participant AuthHook as "useAuth"
participant Store as "authStore"
participant QC as "React Query Client"
Comp->>AuthHook : call login(credentials)
AuthHook->>Store : persist session
AuthHook->>QC : invalidate queries
Store-->>Comp : notify re-render
QC-->>Comp : refetch affected queries
AuthHook-->>Comp : { success, error }
```

**Diagram sources**
- [frontend/src/hooks/useAuth.ts](file://frontend/src/hooks/useAuth.ts)
- [frontend/src/stores/authStore.ts](file://frontend/src/stores/authStore.ts)
- [frontend/src/lib/queryClient.ts](file://frontend/src/lib/queryClient.ts)

## Detailed Component Analysis

### Authentication Hook (useAuth)
Responsibilities:
- Login/logout operations
- Token refresh and persistence
- Session status and user profile access
- Integration with auth store and React Query invalidation

Composition strategy:
- Reads/writes session via auth store
- Triggers query invalidation after mutations
- Exposes methods and flags for UI control

Parameter validation:
- Validates required fields before API calls
- Normalizes inputs and returns structured results

Return value structure:
- Methods: login, logout, refreshSession
- State: isAuthenticated, isLoading, error, user
- Utilities: clearError, resetState

Integration points:
- Zustand auth store for persistent session
- React Query for cache invalidation and background updates

Lifecycle considerations:
- Safe to call within any component
- Avoids memory leaks by cleaning up listeners

Testing approach:
- Mock auth store and query client
- Assert method calls and state transitions
- Validate error handling paths

Debugging tips:
- Log method entry/exit and store updates
- Inspect React Query cache keys invalidated

**Section sources**
- [frontend/src/hooks/useAuth.ts](file://frontend/src/hooks/useAuth.ts)
- [frontend/src/stores/authStore.ts](file://frontend/src/stores/authStore.ts)
- [frontend/src/lib/queryClient.ts](file://frontend/src/lib/queryClient.ts)

#### Class-like Diagram (Conceptual)
```mermaid
classDiagram
class UseAuth {
+login(credentials) Promise~Result~
+logout() Promise~void~
+refreshSession() Promise~boolean~
+isAuthenticated boolean
+isLoading boolean
+error Error|null
+user User|null
+clearError() void
+resetState() void
}
UseAuth --> AuthStore : "reads/writes"
UseAuth --> QueryClient : "invalidates"
```

**Diagram sources**
- [frontend/src/hooks/useAuth.ts](file://frontend/src/hooks/useAuth.ts)
- [frontend/src/stores/authStore.ts](file://frontend/src/stores/authStore.ts)
- [frontend/src/lib/queryClient.ts](file://frontend/src/lib/queryClient.ts)

### Permissions Hook (usePermissions)
Responsibilities:
- Derive permission checks from current user context
- Provide granular checks (role-based or capability-based)
- Support composite rules and fallbacks

Composition strategy:
- Subscribes to auth store for user/roles
- Computes derived permissions memoized for performance
- Offers helper functions for common checks

Parameter validation:
- Ensures permission strings are non-empty
- Normalizes role names and feature identifiers

Return value structure:
- Methods: hasPermission, hasRole, canAccess
- State: permissions, roles, loading
- Utilities: resetCache, logCheck

Integration points:
- Auth store for user context
- Optional policy engine for complex rules

Lifecycle considerations:
- Recomputes only when user changes
- Safe to call frequently in render

Testing approach:
- Provide mock users and roles
- Verify derived permissions and guard outcomes

Debugging tips:
- Log permission evaluations and reasons for denial

**Section sources**
- [frontend/src/hooks/usePermissions.ts](file://frontend/src/hooks/usePermissions.ts)
- [frontend/src/stores/authStore.ts](file://frontend/src/stores/authStore.ts)

#### Sequence Diagram (Permission Check)
```mermaid
sequenceDiagram
participant Comp as "Component"
participant PermHook as "usePermissions"
participant Store as "authStore"
Comp->>PermHook : hasPermission("feature : edit")
PermHook->>Store : read user/roles
PermHook-->>Comp : true/false
```

**Diagram sources**
- [frontend/src/hooks/usePermissions.ts](file://frontend/src/hooks/usePermissions.ts)
- [frontend/src/stores/authStore.ts](file://frontend/src/stores/authStore.ts)

### Pagination Hook (usePagination)
Responsibilities:
- Manage page size, offset/limit, sorting, and filters
- Build query keys and options for React Query
- Provide navigation helpers and metadata

Composition strategy:
- Encapsulates pagination state and transforms
- Integrates with React Query for caching and refetching
- Exposes stable API for list views

Parameter validation:
- Validates numeric bounds and sorts
- Normalizes filter objects

Return value structure:
- State: page, pageSize, total, hasNext, hasPrev
- Methods: goTo, setPageSize, applyFilters, reset
- Query options: queryKey, queryOptions

Integration points:
- React Query client for data fetching and caching
- Optional URL sync for shareable links

Lifecycle considerations:
- Resets on filter changes
- Debounces rapid page changes if needed

Testing approach:
- Mock React Query responses
- Assert query keys and refetch triggers

Debugging tips:
- Inspect query keys and cache entries
- Log pagination transitions

**Section sources**
- [frontend/src/hooks/usePagination.ts](file://frontend/src/hooks/usePagination.ts)
- [frontend/src/lib/queryClient.ts](file://frontend/src/lib/queryClient.ts)

#### Flowchart (Pagination Logic)
```mermaid
flowchart TD
Start(["Function Entry"]) --> Validate["Validate Inputs<br/>page, pageSize, filters"]
Validate --> Valid{"Valid?"}
Valid --> |No| ReturnErr["Return Validation Error"]
Valid --> |Yes| BuildKeys["Build Query Keys"]
BuildKeys --> Fetch["Fetch Data via React Query"]
Fetch --> Result{"Success?"}
Result --> |No| HandleErr["Handle Error"]
Result --> |Yes| ComputeMeta["Compute Metadata<br/>total, hasNext, hasPrev"]
ComputeMeta --> ReturnRes["Return State + Methods"]
HandleErr --> ReturnRes
ReturnErr --> End(["Function Exit"])
ReturnRes --> End
```

**Diagram sources**
- [frontend/src/hooks/usePagination.ts](file://frontend/src/hooks/usePagination.ts)
- [frontend/src/lib/queryClient.ts](file://frontend/src/lib/queryClient.ts)

### Modal Hook (useModal)
Responsibilities:
- Control modal visibility and payload
- Provide open/close/toggle methods
- Integrate with UI store for global modal state

Composition strategy:
- Wraps uiStore modal slice
- Exposes imperative methods and reactive state

Parameter validation:
- Validates modal id and payload types

Return value structure:
- State: isOpen, modalId, data
- Methods: open, close, toggle, setData

Integration points:
- uiStore for centralized modal management

Lifecycle considerations:
- Cleans up listeners on unmount
- Prevents duplicate modals

Testing approach:
- Mock uiStore
- Assert open/close and payload propagation

Debugging tips:
- Log modal lifecycle events

**Section sources**
- [frontend/src/hooks/useModal.ts](file://frontend/src/hooks/useModal.ts)
- [frontend/src/stores/uiStore.ts](file://frontend/src/stores/uiStore.ts)

### Query Client Hook (useQueryClient)
Responsibilities:
- Provide typed access to React Query client
- Ensure consistent cache configuration and interceptors

Composition strategy:
- Returns configured client instance
- Optionally wraps with logging or metrics

Parameter validation:
- None (returns singleton)

Return value structure:
- Client instance with methods like invalidateQueries, getQueryData

Integration points:
- Central queryClient configuration

Lifecycle considerations:
- Singleton pattern ensures single instance

Testing approach:
- Replace client with mock for tests

Debugging tips:
- Enable query logs during development

**Section sources**
- [frontend/src/hooks/useQueryClient.ts](file://frontend/src/hooks/useQueryClient.ts)
- [frontend/src/lib/queryClient.ts](file://frontend/src/lib/queryClient.ts)

## Dependency Analysis
Custom hooks depend on:
- Zustand stores for global state
- React Query for server state and caching
- Shared utilities for validation and formatting

```mermaid
graph LR
A["useAuth"] --> B["authStore"]
A --> C["queryClient"]
D["usePermissions"] --> B
E["usePagination"] --> C
F["useModal"] --> G["uiStore"]
H["useQueryClient"] --> C
```

**Diagram sources**
- [frontend/src/hooks/useAuth.ts](file://frontend/src/hooks/useAuth.ts)
- [frontend/src/hooks/usePermissions.ts](file://frontend/src/hooks/usePermissions.ts)
- [frontend/src/hooks/usePagination.ts](file://frontend/src/hooks/usePagination.ts)
- [frontend/src/hooks/useModal.ts](file://frontend/src/hooks/useModal.ts)
- [frontend/src/hooks/useQueryClient.ts](file://frontend/src/hooks/useQueryClient.ts)
- [frontend/src/stores/authStore.ts](file://frontend/src/stores/authStore.ts)
- [frontend/src/stores/uiStore.ts](file://frontend/src/stores/uiStore.ts)
- [frontend/src/lib/queryClient.ts](file://frontend/src/lib/queryClient.ts)

**Section sources**
- [frontend/src/hooks/useAuth.ts](file://frontend/src/hooks/useAuth.ts)
- [frontend/src/hooks/usePermissions.ts](file://frontend/src/hooks/usePermissions.ts)
- [frontend/src/hooks/usePagination.ts](file://frontend/src/hooks/usePagination.ts)
- [frontend/src/hooks/useModal.ts](file://frontend/src/hooks/useModal.ts)
- [frontend/src/hooks/useQueryClient.ts](file://frontend/src/hooks/useQueryClient.ts)
- [frontend/src/stores/authStore.ts](file://frontend/src/stores/authStore.ts)
- [frontend/src/stores/uiStore.ts](file://frontend/src/stores/uiStore.ts)
- [frontend/src/lib/queryClient.ts](file://frontend/src/lib/queryClient.ts)

## Performance Considerations
- Memoize derived values in hooks to avoid unnecessary recomputation
- Prefer stable query keys and minimal invalidations
- Debounce input-driven pagination/filter changes
- Batch store updates to reduce re-renders
- Use selective subscriptions in Zustand to limit scope

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- Stale cache after mutations: ensure invalidation keys match query keys
- Permission denied unexpectedly: verify user roles and normalization
- Modal not closing: check store subscription cleanup
- Pagination jumps: validate page bounds and filter resets
- Memory leaks: confirm effect cleanup and listener removal

Diagnostic steps:
- Enable React Query devtools to inspect cache
- Add logging at hook entry/exit points
- Assert store slices for expected state transitions
- Reproduce with minimal test cases

**Section sources**
- [frontend/src/hooks/useAuth.ts](file://frontend/src/hooks/useAuth.ts)
- [frontend/src/hooks/usePermissions.ts](file://frontend/src/hooks/usePermissions.ts)
- [frontend/src/hooks/usePagination.ts](file://frontend/src/hooks/usePagination.ts)
- [frontend/src/hooks/useModal.ts](file://frontend/src/hooks/useModal.ts)
- [frontend/src/hooks/useQueryClient.ts](file://frontend/src/hooks/useQueryClient.ts)

## Conclusion
The custom hooks layer provides a cohesive, composable foundation for authentication, permissions, pagination, and UI interactions. By adhering to consistent naming, validation, and return structures, and integrating cleanly with Zustand and React Query, these hooks enable scalable, maintainable, and testable front-end logic.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices

### Naming Conventions
- Prefix all custom hooks with use
- Use descriptive verbs for actions (login, open, applyFilters)
- Keep state names aligned with their purpose (isLoading, error, user)

### Parameter Validation Guidelines
- Validate required fields early
- Normalize inputs to canonical forms
- Return structured errors with actionable messages

### Return Value Structures
- Methods: imperative actions (login, open, goTo)
- State: reactive values (isAuthenticated, isOpen, page)
- Utilities: helpers (clearError, resetState)

### Creating New Custom Hooks
Steps:
- Identify shared logic and boundaries
- Choose appropriate storage (local state, store, cache)
- Define parameters and validation
- Implement return shape consistently
- Add tests and debug logs

### Testing Hooks
Approaches:
- Render hook in isolation using testing utilities
- Mock dependencies (stores, query client)
- Assert state transitions and method calls
- Simulate async flows and errors

### Debugging Hook Behavior
Techniques:
- Instrument entry/exit points
- Log dependency changes
- Inspect React Query cache and Zustand slices
- Use browser devtools to trace re-renders

### Integration Examples
- Authentication flow in login page
- Permission gating in dashboard
- Pagination controls in list views

**Section sources**
- [frontend/src/features/auth/login/LoginPage.tsx](file://frontend/src/features/auth/login/LoginPage.tsx)
- [frontend/src/features/dashboard/DashboardPage.tsx](file://frontend/src/features/dashboard/DashboardPage.tsx)
- [frontend/src/components/common/PaginationControls.tsx](file://frontend/src/components/common/PaginationControls.tsx)
- [frontend/src/components/common/PermissionGate.tsx](file://frontend/src/components/common/PermissionGate.tsx)