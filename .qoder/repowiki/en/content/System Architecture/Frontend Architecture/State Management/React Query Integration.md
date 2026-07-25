# React Query Integration

<cite>
**Referenced Files in This Document**
- [frontend/src/main.tsx](file://frontend/src/main.tsx)
- [frontend/src/lib/queryClient.ts](file://frontend/src/lib/queryClient.ts)
- [frontend/src/hooks/useAuth.ts](file://frontend/src/hooks/useAuth.ts)
- [frontend/src/features/dashboard/hooks/useDashboardStats.ts](file://frontend/src/features/dashboard/hooks/useDashboardStats.ts)
- [frontend/src/features/eleves/hooks/useElevesList.ts](file://frontend/src/features/eleves/hooks/useElevesList.ts)
- [frontend/src/features/finances/hooks/useFinancesOverview.ts](file://frontend/src/features/finances/hooks/useFinancesOverview.ts)
- [frontend/src/features/organisation/hooks/query-keys.ts](file://frontend/src/features/organisation/hooks/query-keys.ts)
- [frontend/src/components/ui/ErrorBoundary.tsx](file://frontend/src/components/ui/ErrorBoundary.tsx)
- [frontend/src/components/layout/AppLayout.tsx](file://frontend/src/components/layout/AppLayout.tsx)
- [frontend/src/routes/_layout.tsx](file://frontend/src/routes/_layout.tsx)
- [frontend/package.json](file://frontend/package.json)
</cite>

## Update Summary
**Changes Made**
- Added new section on Centralized Query Keys Management
- Updated Custom Hooks for Data Fetching section to reflect improved patterns
- Enhanced Query Key Organization section with centralized management approach
- Added examples of organization-specific query key patterns

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
This document explains how React Query (TanStack Query) is integrated across the frontend to manage server state, including query client configuration, cache strategies, global options, mutations, error boundaries, loading states, custom hooks for data fetching, key organization, invalidation patterns, optimistic updates, synchronization with the server, background refetching, and pagination. It provides architecture diagrams, code-level references, and practical guidance for consistent usage across features.

**Updated** Enhanced with centralized query keys management for improved consistency and maintainability across the application.

## Project Structure
The React Query integration spans a small set of core files:
- Application bootstrap initializes the QueryClient and wraps the app with QueryClientProvider.
- A dedicated module configures the QueryClient instance with defaults such as retry behavior, stale time, and network status handling.
- Feature-specific hooks encapsulate queries and mutations, organizing keys by feature and resource.
- Global UI components provide error boundaries and layout scaffolding that interact with query state.
- Centralized query keys management ensures consistent key organization across all features.

```mermaid
graph TB
A["App Bootstrap<br/>main.tsx"] --> B["Query Client Config<br/>queryClient.ts"]
A --> C["Error Boundary<br/>ErrorBoundary.tsx"]
A --> D["App Layout<br/>AppLayout.tsx"]
D --> E["Route Shell<br/>_layout.tsx"]
E --> F["Feature Hooks<br/>useElevesList.ts / useDashboardStats.ts / useFinancesOverview.ts"]
F --> G["Centralized Query Keys<br/>query-keys.ts"]
G --> H["Server APIs"]
```

**Diagram sources**
- [frontend/src/main.tsx](file://frontend/src/main.tsx)
- [frontend/src/lib/queryClient.ts](file://frontend/src/lib/queryClient.ts)
- [frontend/src/components/ui/ErrorBoundary.tsx](file://frontend/src/components/ui/ErrorBoundary.tsx)
- [frontend/src/components/layout/AppLayout.tsx](file://frontend/src/components/layout/AppLayout.tsx)
- [frontend/src/routes/_layout.tsx](file://frontend/src/routes/_layout.tsx)
- [frontend/src/features/eleves/hooks/useElevesList.ts](file://frontend/src/features/eleves/hooks/useElevesList.ts)
- [frontend/src/features/dashboard/hooks/useDashboardStats.ts](file://frontend/src/features/dashboard/hooks/useDashboardStats.ts)
- [frontend/src/features/finances/hooks/useFinancesOverview.ts](file://frontend/src/features/finances/hooks/useFinancesOverview.ts)
- [frontend/src/features/organisation/hooks/query-keys.ts](file://frontend/src/features/organisation/hooks/query-keys.ts)

**Section sources**
- [frontend/src/main.tsx](file://frontend/src/main.tsx)
- [frontend/src/lib/queryClient.ts](file://frontend/src/lib/queryClient.ts)
- [frontend/src/components/ui/ErrorBoundary.tsx](file://frontend/src/components/ui/ErrorBoundary.tsx)
- [frontend/src/components/layout/AppLayout.tsx](file://frontend/src/components/layout/AppLayout.tsx)
- [frontend/src/routes/_layout.tsx](file://frontend/src/routes/_layout.tsx)

## Core Components
- QueryClient setup and provider initialization at application root.
- Global defaults for retries, stale times, refetch intervals, and network monitoring.
- Custom hooks per feature that centralize query keys, fetchers, and mutation logic.
- Error boundary component to catch and display query-related errors gracefully.
- Layout and route shell that ensure providers are available throughout the app.
- Centralized query keys management for consistent key organization across features.

Key responsibilities:
- Centralized configuration ensures consistent caching and refetch behavior.
- Feature hooks promote reuse, predictable key structures, and clear separation of concerns.
- Centralized query keys eliminate duplication and ensure consistency.
- Error boundaries improve resilience and user experience during failures.

**Section sources**
- [frontend/src/main.tsx](file://frontend/src/main.tsx)
- [frontend/src/lib/queryClient.ts](file://frontend/src/lib/queryClient.ts)
- [frontend/src/components/ui/ErrorBoundary.tsx](file://frontend/src/components/ui/ErrorBoundary.tsx)
- [frontend/src/components/layout/AppLayout.tsx](file://frontend/src/components/layout/AppLayout.tsx)
- [frontend/src/routes/_layout.tsx](file://frontend/src/routes/_layout.tsx)

## Architecture Overview
The following diagram shows how the app bootstraps React Query, configures the client, and uses it through feature hooks to fetch and mutate server state with centralized query key management.

```mermaid
sequenceDiagram
participant App as "App Bootstrap"
participant Provider as "QueryClientProvider"
participant Client as "QueryClient"
participant Hook as "Feature Hook"
participant Keys as "Centralized Query Keys"
participant API as "Backend API"
App->>Provider : "Initialize QueryClient and wrap app"
Provider-->>Hook : "Expose client via context"
Hook->>Keys : "Get standardized query key"
Hook->>Client : "useQuery/useMutation(key, options)"
Client->>API : "HTTP request"
API-->>Client : "Response or error"
Client-->>Hook : "Data, isLoading, isError"
Hook-->>UI : "Render state"
```

**Diagram sources**
- [frontend/src/main.tsx](file://frontend/src/main.tsx)
- [frontend/src/lib/queryClient.ts](file://frontend/src/lib/queryClient.ts)
- [frontend/src/features/eleves/hooks/useElevesList.ts](file://frontend/src/features/eleves/hooks/useElevesList.ts)
- [frontend/src/features/dashboard/hooks/useDashboardStats.ts](file://frontend/src/features/dashboard/hooks/useDashboardStats.ts)
- [frontend/src/features/finances/hooks/useFinancesOverview.ts](file://frontend/src/features/finances/hooks/useFinancesOverview.ts)
- [frontend/src/features/organisation/hooks/query-keys.ts](file://frontend/src/features/organisation/hooks/query-keys.ts)

## Detailed Component Analysis

### Query Client Configuration
Responsibilities:
- Create a single QueryClient instance with global defaults.
- Configure retry policies, stale time, refetch intervals, and network status checks.
- Export the configured client for provider initialization.

Best practices:
- Keep global defaults minimal and predictable; override per-query when needed.
- Use staleTime to avoid unnecessary refetches for stable data.
- Enable refetchOnWindowFocus and refetchOnReconnect for better UX.

```mermaid
flowchart TD
Start(["Create QueryClient"]) --> Defaults["Set global defaults<br/>retry, staleTime, refetchInterval"]
Defaults --> Network["Configure network checks<br/>refetchOnWindowFocus, refetchOnReconnect"]
Network --> Export["Export configured client"]
Export --> End(["Used by QueryClientProvider"])
```

**Diagram sources**
- [frontend/src/lib/queryClient.ts](file://frontend/src/lib/queryClient.ts)

**Section sources**
- [frontend/src/lib/queryClient.ts](file://frontend/src/lib/queryClient.ts)

### Application Bootstrap and Provider Setup
Responsibilities:
- Initialize the QueryClient and wrap the application with QueryClientProvider.
- Ensure all routes and components have access to the client context.

Considerations:
- Place provider near the root to cover all components.
- Avoid re-initializing the client on each render.

**Section sources**
- [frontend/src/main.tsx](file://frontend/src/main.tsx)
- [frontend/src/routes/_layout.tsx](file://frontend/src/routes/_layout.tsx)

### Error Boundary Integration
Responsibilities:
- Catch rendering and query-related errors.
- Provide fallback UI and recovery actions.

Integration points:
- Wrap critical sections or the entire app to prevent crashes.
- Display actionable messages and allow retry flows.

**Section sources**
- [frontend/src/components/ui/ErrorBoundary.tsx](file://frontend/src/components/ui/ErrorBoundary.tsx)

### App Layout and Route Shell
Responsibilities:
- Provide shared layout structure and ensure providers are present.
- Coordinate navigation and global UI state alongside query state.

**Section sources**
- [frontend/src/components/layout/AppLayout.tsx](file://frontend/src/components/layout/AppLayout.tsx)
- [frontend/src/routes/_layout.tsx](file://frontend/src/routes/_layout.tsx)

### Centralized Query Keys Management
**New Section**

Responsibilities:
- Define standardized query key patterns across all features.
- Provide reusable key generation functions for consistent naming.
- Organize keys by feature domain (organisation, eleves, finances, etc.).
- Ensure type safety and autocomplete support for query keys.

Benefits:
- Eliminates duplicate key definitions across hooks.
- Provides consistent key structure throughout the application.
- Enables easy searching and debugging of query operations.
- Supports automatic refetching based on key patterns.

Implementation pattern:
```typescript
// Example structure for centralized query keys
export const organisationQueryKeys = {
  all: ['organisation'] as const,
  details: () => [...organisationQueryKeys.all, 'detail'] as const,
  settings: () => [...organisationQueryKeys.all, 'settings'] as const,
  users: () => [...organisationQueryKeys.all, 'users'] as const,
}
```

**Section sources**
- [frontend/src/features/organisation/hooks/query-keys.ts](file://frontend/src/features/organisation/hooks/query-keys.ts)

### Custom Hooks for Data Fetching
Patterns:
- Organize query keys by feature and resource using centralized management.
- Encapsulate fetchers and options within hooks to keep components clean.
- Separate read-only queries from write operations (mutations).
- Leverage centralized query keys for consistency.

Examples:
- Eleves list hook for paginated or filtered lists.
- Dashboard stats hook for aggregated metrics.
- Finances overview hook for financial summaries.
- Organisation hooks using centralized query keys.

```mermaid
classDiagram
class ElevesListHook {
+key : string[]
+options : object
+fetcher() : Promise~data~
}
class DashboardStatsHook {
+key : string[]
+options : object
+fetcher() : Promise~data~
}
class FinancesOverviewHook {
+key : string[]
+options : object
+fetcher() : Promise~data~
}
class OrganisationQueryKeys {
+all : string[]
+details() : string[]
+settings() : string[]
+users() : string[]
}
ElevesListHook <.. DashboardStatsHook : "similar pattern"
ElevesListHook <.. FinancesOverviewHook : "similar pattern"
OrganisationQueryKeys <.. ElevesListHook : "centralized keys"
```

**Diagram sources**
- [frontend/src/features/eleves/hooks/useElevesList.ts](file://frontend/src/features/eleves/hooks/useElevesList.ts)
- [frontend/src/features/dashboard/hooks/useDashboardStats.ts](file://frontend/src/features/dashboard/hooks/useDashboardStats.ts)
- [frontend/src/features/finances/hooks/useFinancesOverview.ts](file://frontend/src/features/finances/hooks/useFinancesOverview.ts)
- [frontend/src/features/organisation/hooks/query-keys.ts](file://frontend/src/features/organisation/hooks/query-keys.ts)

**Section sources**
- [frontend/src/features/eleves/hooks/useElevesList.ts](file://frontend/src/features/eleves/hooks/useElevesList.ts)
- [frontend/src/features/dashboard/hooks/useDashboardStats.ts](file://frontend/src/features/dashboard/hooks/useDashboardStats.ts)
- [frontend/src/features/finances/hooks/useFinancesOverview.ts](file://frontend/src/features/finances/hooks/useFinancesOverview.ts)

### Mutation Handling Patterns
Guidelines:
- Use mutations for create/update/delete operations.
- Invalidate affected query keys after successful mutations to refresh data.
- Handle optimistic updates by temporarily updating cache while awaiting server confirmation.
- Leverage centralized query keys for consistent invalidation patterns.

Flow:
```mermaid
sequenceDiagram
participant UI as "Component"
participant Mutate as "useMutation"
participant Cache as "QueryCache"
participant Keys as "Centralized Keys"
participant API as "Backend API"
UI->>Mutate : "Trigger mutation"
Mutate->>Cache : "Optimistic update (optional)"
Mutate->>API : "Send request"
API-->>Mutate : "Success response"
Mutate->>Keys : "Get related query keys"
Mutate->>Cache : "Invalidate related keys"
Mutate-->>UI : "Update result and status"
```

**Diagram sources**
- [frontend/src/features/eleves/hooks/useElevesList.ts](file://frontend/src/features/eleves/hooks/useElevesList.ts)
- [frontend/src/features/finances/hooks/useFinancesOverview.ts](file://frontend/src/features/finances/hooks/useFinancesOverview.ts)
- [frontend/src/features/organisation/hooks/query-keys.ts](file://frontend/src/features/organisation/hooks/query-keys.ts)

**Section sources**
- [frontend/src/features/eleves/hooks/useElevesList.ts](file://frontend/src/features/eleves/hooks/useElevesList.ts)
- [frontend/src/features/finances/hooks/useFinancesOverview.ts](file://frontend/src/features/finances/hooks/useFinancesOverview.ts)

### Loading States and User Feedback
Recommendations:
- Use isLoading and isFetching flags to show spinners or skeletons.
- Differentiate between initial load and background refetches.
- Provide meaningful feedback for long-running operations.

**Section sources**
- [frontend/src/features/dashboard/hooks/useDashboardStats.ts](file://frontend/src/features/dashboard/hooks/useDashboardStats.ts)
- [frontend/src/features/eleves/hooks/useElevesList.ts](file://frontend/src/features/eleves/hooks/useElevesList.ts)

### Query Key Organization and Invalidation Strategies
Principles:
- Use arrays for keys to encode parameters and scope.
- Group keys by feature/resource and include filter/pagination variables.
- Invalidate specific keys after mutations to keep cache coherent.
- Leverage centralized query keys for consistency across the application.

Example strategy with centralized management:
- ["organisation", "users", { page, limit }]
- ["dashboard", "stats", { period }]
- ["finances", "overview", { year }]
- ["eleves", "list", { filters }]

**Updated** Enhanced with centralized query keys management for improved consistency and maintainability.

**Section sources**
- [frontend/src/features/eleves/hooks/useElevesList.ts](file://frontend/src/features/eleves/hooks/useElevesList.ts)
- [frontend/src/features/dashboard/hooks/useDashboardStats.ts](file://frontend/src/features/dashboard/hooks/useDashboardStats.ts)
- [frontend/src/features/finances/hooks/useFinancesOverview.ts](file://frontend/src/features/finances/hooks/useFinancesOverview.ts)
- [frontend/src/features/organisation/hooks/query-keys.ts](file://frontend/src/features/organisation/hooks/query-keys.ts)

### Optimistic Updates
Approach:
- Update cache immediately with expected results.
- On success, finalize changes; on failure, revert to previous state.
- Combine with invalidation to ensure consistency.
- Use centralized query keys for consistent invalidation patterns.

**Section sources**
- [frontend/src/features/eleves/hooks/useElevesList.ts](file://frontend/src/features/eleves/hooks/useElevesList.ts)
- [frontend/src/features/finances/hooks/useFinancesOverview.ts](file://frontend/src/features/finances/hooks/useFinancesOverview.ts)

### Server State Synchronization and Background Refetching
Strategies:
- Set appropriate staleTime to balance freshness and performance.
- Enable refetchOnWindowFocus and refetchOnReconnect for automatic sync.
- Use polling for frequently changing data where necessary.
- Leverage centralized query keys for consistent refetching patterns.

**Section sources**
- [frontend/src/lib/queryClient.ts](file://frontend/src/lib/queryClient.ts)
- [frontend/src/features/dashboard/hooks/useDashboardStats.ts](file://frontend/src/features/dashboard/hooks/useDashboardStats.ts)

### Pagination Patterns
Implementation tips:
- Include page and limit in query keys.
- Use infinite queries for cursor-based or offset-based pagination.
- Preload next pages on scroll or button clicks.
- Use centralized query keys for consistent pagination key structures.

**Section sources**
- [frontend/src/features/eleves/hooks/useElevesList.ts](file://frontend/src/features/eleves/hooks/useElevesList.ts)

### Authentication Integration
Guidance:
- Attach tokens to requests via an HTTP interceptor or base URL configuration.
- Invalidate auth-related queries on login/logout.
- Guard protected routes based on authentication state.
- Use centralized query keys for authentication-related operations.

**Section sources**
- [frontend/src/hooks/useAuth.ts](file://frontend/src/hooks/useAuth.ts)
- [frontend/src/routes/_layout.tsx](file://frontend/src/routes/_layout.tsx)

## Dependency Analysis
React Query dependencies are declared in the frontend package manifest. The integration relies on TanStack Query packages and standard React runtime.

```mermaid
graph TB
Pkg["package.json"] --> TQ["@tanstack/react-query"]
Pkg --> RT["react"]
Pkg --> RTD["react-dom"]
```

**Diagram sources**
- [frontend/package.json](file://frontend/package.json)

**Section sources**
- [frontend/package.json](file://frontend/package.json)

## Performance Considerations
- Prefer higher staleTime for rarely changing data to reduce network calls.
- Use selective invalidation to minimize cache churn.
- Leverage skeleton loaders instead of full-page spinners for perceived performance.
- Debounce search inputs and combine with query deduplication.
- Monitor memory usage with large datasets; consider virtualization for lists.
- Centralized query keys reduce duplicate queries and improve cache efficiency.

**Updated** Enhanced with benefits of centralized query keys for improved performance.

## Troubleshooting Guide
Common issues and resolutions:
- Stale data not refreshing: verify invalidation keys and mutation callbacks.
- Excessive refetches: adjust staleTime and refetch intervals.
- Errors not surfaced: ensure error boundary is wrapping relevant components.
- Authentication failures: check token attachment and invalidate auth queries on logout.
- Query key inconsistencies: use centralized query keys to ensure consistency.

Diagnostic steps:
- Inspect query keys and options in devtools.
- Log mutation outcomes and cache updates.
- Validate network interceptors and error mapping.
- Check centralized query key definitions for consistency.

**Updated** Added troubleshooting guidance for centralized query keys.

**Section sources**
- [frontend/src/components/ui/ErrorBoundary.tsx](file://frontend/src/components/ui/ErrorBoundary.tsx)
- [frontend/src/lib/queryClient.ts](file://frontend/src/lib/queryClient.ts)
- [frontend/src/hooks/useAuth.ts](file://frontend/src/hooks/useAuth.ts)

## Conclusion
By centralizing QueryClient configuration, organizing query keys consistently through centralized management, and encapsulating data access in feature hooks, the application achieves predictable caching, efficient refetching, and robust error handling. Mutations with invalidation and optional optimistic updates keep the UI responsive and synchronized with the server. Error boundaries and thoughtful loading states enhance reliability and user experience. The centralized query keys management ensures consistency across all features and improves maintainability.

**Updated** Enhanced conclusion to reflect the benefits of centralized query keys management.