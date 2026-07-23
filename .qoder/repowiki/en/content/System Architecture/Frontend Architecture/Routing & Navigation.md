# Routing & Navigation

<cite>
**Referenced Files in This Document**
- [main.tsx](file://frontend/src/main.tsx)
- [App.tsx](file://frontend/src/App.tsx)
- [routeTree.gen.ts](file://frontend/src/routeTree.gen.ts)
- [routes/__root.tsx](file://frontend/src/routes/__root.tsx)
- [routes/_authLayout.tsx](file://frontend/src/routes/_authLayout.tsx)
- [routes/_publicLayout.tsx](file://frontend/src/routes/_publicLayout.tsx)
- [hooks/useAuth.ts](file://frontend/src/hooks/useAuth.ts)
- [lib/router.ts](file://frontend/src/lib/router.ts)
</cite>

## Update Summary
**Changes Made**
- Updated route structure overview to reflect major simplification
- Removed references to nomenclature-related routes and authentication infrastructure routes
- Added documentation for new library (bibliotheque), finance (finances), and transport modules
- Updated administrative module consolidation information
- Revised route group structure to match simplified architecture

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
This document explains the routing and navigation system built with TanStack Router in the eLISAschool frontend. The system has undergone significant simplification, removing complex nomenclature-related routes and authentication infrastructure routes while adding new functional modules for library management, financial operations, and transportation services. The streamlined architecture now focuses on core educational administration features with consolidated administrative modules.

The routing system continues to use file-based routing conventions with route groups for authenticated and public areas, comprehensive guards for authentication and permissions, and optimized navigation patterns. The goal is to help developers understand the simplified route organization, enhanced security measures, and performance optimizations while providing practical guidance for extending and maintaining the system.

## Project Structure
The project uses TanStack Router's file-based routing convention under src/routes with a significantly simplified structure. Route groups are implemented via layout files prefixed with an underscore, focusing on essential authentication and public access patterns. A generated route tree is produced by the build tooling and imported at application bootstrap.

**Updated** The route structure has been streamlined by removing nomenclature-related complexity and consolidating administrative functions into focused modules.

Key structural elements:
- Root entry points initialize the router and app shell with optimized configuration
- Layouts define shared UI and guard logic for essential route groups
- Feature-specific routes organized by functional modules (library, finance, transport, administration)
- Generated route tree provides type-safe path helpers and optimized route definitions

```mermaid
graph TB
A["Application Bootstrap<br/>main.tsx"] --> B["Router Setup<br/>lib/router.ts"]
B --> C["Route Tree (Generated)<br/>routeTree.gen.ts"]
C --> D["Root Layout<br/>routes/__root.tsx"]
D --> E["Auth Group Layout<br/>routes/_authLayout.tsx"]
D --> F["Public Group Layout<br/>routes/_publicLayout.tsx"]
E --> G["Core Auth Routes<br/>routes/auth/*"]
F --> H["Public Routes<br/>routes/public/*"]
E --> I["Library Module<br/>routes/bibliotheque/*"]
E --> J["Finance Module<br/>routes/finances/*"]
E --> K["Transport Module<br/>routes/transport/*"]
E --> L["Admin Module<br/>routes/admin/*"]
```

**Diagram sources**
- [main.tsx](file://frontend/src/main.tsx)
- [lib/router.ts](file://frontend/src/lib/router.ts)
- [routeTree.gen.ts](file://frontend/src/routeTree.gen.ts)
- [routes/__root.tsx](file://frontend/src/routes/__root.tsx)
- [routes/_authLayout.tsx](file://frontend/src/routes/_authLayout.tsx)
- [routes/_publicLayout.tsx](file://frontend/src/routes/_publicLayout.tsx)

**Section sources**
- [main.tsx](file://frontend/src/main.tsx)
- [lib/router.ts](file://frontend/src/lib/router.ts)
- [routeTree.gen.ts](file://frontend/src/routeTree.gen.ts)
- [routes/__root.tsx](file://frontend/src/routes/__root.tsx)
- [routes/_authLayout.tsx](file://frontend/src/routes/_authLayout.tsx)
- [routes/_publicLayout.tsx](file://frontend/src/routes/_publicLayout.tsx)

## Core Components
- Application bootstrap: Initializes React and mounts the router with optimized configuration
- Router configuration: Configures history, default settings, and global options for improved performance
- Route tree: Auto-generated mapping of simplified file paths to route components and layouts
- Root layout: Provides top-level providers, error boundaries, and common UI chrome
- Auth group layout: Enforces authentication and permission checks for protected routes
- Public group layout: Renders unauthenticated UI and redirects based on auth state
- Auth hooks: Centralized access to current user, roles, and permissions used by guards

These components collaborate to provide secure, modular, and maintainable navigation across the simplified application structure.

**Section sources**
- [main.tsx](file://frontend/src/main.tsx)
- [lib/router.ts](file://frontend/src/lib/router.ts)
- [routeTree.gen.ts](file://frontend/src/routeTree.gen.ts)
- [routes/__root.tsx](file://frontend/src/routes/__root.tsx)
- [routes/_authLayout.tsx](file://frontend/src/routes/_authLayout.tsx)
- [routes/_publicLayout.tsx](file://frontend/src/routes/_publicLayout.tsx)
- [hooks/useAuth.ts](file://frontend/src/hooks/useAuth.ts)

## Architecture Overview
The routing architecture follows a streamlined layered approach designed for clarity and maintainability:
- Entry layer: main.tsx bootstraps the app and mounts the optimized router
- Configuration layer: lib/router.ts sets up TanStack Router with simplified history and defaults
- Definition layer: routeTree.gen.ts maps streamlined file-based routes to components
- Layout layer: __root.tsx defines root context; _authLayout.tsx and _publicLayout.tsx implement essential group behavior
- Feature layer: Organized by functional modules rather than complex hierarchical structures

```mermaid
sequenceDiagram
participant Boot as "Bootstrap<br/>main.tsx"
participant Router as "Router Config<br/>lib/router.ts"
participant Tree as "Route Tree<br/>routeTree.gen.ts"
participant Root as "Root Layout<br/>__root.tsx"
participant Auth as "Auth Layout<br/>_authLayout.tsx"
participant Pub as "Public Layout<br/>_publicLayout.tsx"
participant Module as "Feature Module<br/>library/finance/transport/admin"
Boot->>Router : Initialize optimized router with simplified config
Router->>Tree : Load streamlined route definitions
Tree-->>Boot : Provide optimized route tree to router
Boot->>Root : Render root layout
Root->>Auth : If route belongs to auth group
Root->>Pub : Else if route belongs to public group
Auth->>Module : Guard passes -> render feature module
Pub->>Page : Render public page
```

**Diagram sources**
- [main.tsx](file://frontend/src/main.tsx)
- [lib/router.ts](file://frontend/src/lib/router.ts)
- [routeTree.gen.ts](file://frontend/src/routeTree.gen.ts)
- [routes/__root.tsx](file://frontend/src/routes/__root.tsx)
- [routes/_authLayout.tsx](file://frontend/src/routes/_authLayout.tsx)
- [routes/_publicLayout.tsx](file://frontend/src/routes/_publicLayout.tsx)

## Detailed Component Analysis

### Simplified File-Based Routing and Route Groups
- Streamlined file-to-route mapping: Each file under src/routes corresponds to a route segment with reduced complexity
- Essential route groups: Layout files prefixed with underscore act as grouping containers for core functionality:
  - _authLayout.tsx applies to all authenticated routes with consolidated permission checks
  - _publicLayout.tsx applies to all public routes with simplified redirect logic
- Enhanced benefits:
  - Clear separation between authenticated and public flows with reduced overhead
  - Shared UI and guard logic per group without duplication
  - Improved maintainability through simplified structure

**Updated** The route structure has been significantly simplified by removing nomenclature-related complexity and consolidating administrative functions.

Implementation notes:
- Ensure layout files export a component that renders Outlet to display child routes
- Keep group-specific concerns centralized within corresponding layouts
- Leverage the simplified structure for faster development and maintenance

**Section sources**
- [routes/_authLayout.tsx](file://frontend/src/routes/_authLayout.tsx)
- [routes/_publicLayout.tsx](file://frontend/src/routes/_publicLayout.tsx)

### Authentication and Permission Guards
- Purpose: Protect sensitive routes and enforce role/permission requirements before rendering content
- Typical flow:
  - Check authentication state using centralized hooks
  - Validate required permissions or roles
  - Redirect to login or unauthorized page when checks fail
  - Allow navigation when checks pass

Recommended pattern:
- Implement guards within the auth group layout to centralize logic
- Use typed route params and search states for safer navigation
- Leverage simplified permission model for better performance

```mermaid
flowchart TD
Start(["Navigate to Protected Route"]) --> CheckAuth["Check Authentication State"]
CheckAuth --> IsAuth{"Authenticated?"}
IsAuth --> |No| ToLogin["Redirect to Login"]
IsAuth --> |Yes| CheckPerm["Check Required Permissions/Roles"]
CheckPerm --> HasPerm{"Has Permission?"}
HasPerm --> |No| ToDenied["Redirect to Unauthorized / Home"]
HasPerm --> |Yes| RenderPage["Render Target Page"]
ToLogin --> End(["Navigation Complete"])
ToDenied --> End
RenderPage --> End
```

**Diagram sources**
- [routes/_authLayout.tsx](file://frontend/src/routes/_authLayout.tsx)
- [hooks/useAuth.ts](file://frontend/src/hooks/useAuth.ts)

**Section sources**
- [routes/_authLayout.tsx](file://frontend/src/routes/_authLayout.tsx)
- [hooks/useAuth.ts](file://frontend/src/hooks/useAuth.ts)

### Navigation Patterns and Programmatic Navigation
- Declarative navigation: Use Link components for static links and safe transitions
- Programmatic navigation: Use navigate() from TanStack Router for conditional flows
- Best practices:
  - Prefer typed route helpers generated by the route tree for compile-time safety
  - Preserve search params when navigating to related pages
  - Avoid direct DOM manipulation; rely on router APIs
  - Leverage simplified route structure for faster navigation

Typical usage locations:
- After successful authentication, redirect to dashboard or last visited route
- In forms, navigate to confirmation or list views upon success
- Between consolidated administrative modules

**Section sources**
- [routes/auth/login.tsx](file://frontend/src/routes/auth/login.tsx)
- [routes/auth/dashboard.tsx](file://frontend/src/routes/auth/dashboard.tsx)

### Breadcrumbs System
- Concept: Build a breadcrumb trail based on the active route hierarchy
- Implementation approach:
  - Derive segments from the current route location
  - Map segments to human-readable labels and links
  - Render in the root layout or a dedicated header component

Considerations:
- Handle dynamic segments gracefully with simplified naming conventions
- Respect route metadata if available to customize labels
- Optimize for the streamlined route structure

**Section sources**
- [routes/__root.tsx](file://frontend/src/routes/__root.tsx)

### Dynamic Routing with Parameters
- Path parameters: Define dynamic segments in route files with simplified naming
- Accessing parameters: Read params from the route context provided by TanStack Router
- Validation: Use route loaders or validators to ensure parameter validity and fetch data safely

Examples of use cases:
- Resource detail pages with simplified parameter structure
- Scoped features within consolidated administrative modules
- Library, finance, and transport resource management

**Section sources**
- [routes/auth/dashboard.tsx](file://frontend/src/routes/auth/dashboard.tsx)

### Lazy Loading and Route-Based Code Splitting
- Strategy: Use lazy imports for route components to split bundles by route
- Benefits:
  - Reduced initial payload with simplified route structure
  - Faster first paint and improved interactivity
  - Optimized loading for consolidated administrative modules
- Implementation:
  - Wrap route components with lazy loading utilities
  - Provide fallback UI during loading

Guidelines:
- Keep small shared components outside route bundles
  - Preload critical routes where appropriate
  - Leverage simplified structure for better code splitting

**Section sources**
- [routes/auth/login.tsx](file://frontend/src/routes/auth/login.tsx)
- [routes/auth/dashboard.tsx](file://frontend/src/routes/auth/dashboard.tsx)

### Nested Routing Patterns
- Nested layouts: Use outlet components to compose parent and child routes
- Common patterns:
  - Dashboard with sidebar and nested feature tabs
  - Settings area with multiple sub-pages
  - Consolidated administrative module interfaces
- Advantages:
  - Reuse headers, sidebars, and guards at higher levels
  - Maintain clear hierarchical structure aligned with URLs
  - Support for simplified module organization

**Section sources**
- [routes/__root.tsx](file://frontend/src/routes/__root.tsx)
- [routes/_authLayout.tsx](file://frontend/src/routes/_authLayout.tsx)

### URL State Management and Deep Linking
- Search state: Store filters, pagination, and view preferences in URL query strings for shareability and deep linking
- Deep linking: Ensure every meaningful state is reflected in the URL so users can bookmark or share exact views
- Sync strategy:
  - On mount, read search params and hydrate local state
  - On user interactions, update search params to reflect changes

Best practices:
- Normalize and validate search params with simplified structure
- Debounce heavy updates if necessary
- Provide reset actions to clear filters
- Leverage streamlined route structure for better URL management

**Section sources**
- [routes/auth/dashboard.tsx](file://frontend/src/routes/auth/dashboard.tsx)

## Dependency Analysis
The following diagram shows key dependencies among routing-related modules in the simplified architecture:

```mermaid
graph LR
Main["main.tsx"] --> RouterCfg["lib/router.ts"]
RouterCfg --> RouteTree["routeTree.gen.ts"]
RouteTree --> Root["routes/__root.tsx"]
Root --> AuthLayout["routes/_authLayout.tsx"]
Root --> PubLayout["routes/_publicLayout.tsx"]
AuthLayout --> AuthHooks["hooks/useAuth.ts"]
PubLayout --> AuthHooks
AuthLayout --> CoreRoutes["Core Auth Routes"]
AuthLayout --> LibraryModule["Library Module"]
AuthLayout --> FinanceModule["Finance Module"]
AuthLayout --> TransportModule["Transport Module"]
AuthLayout --> AdminModule["Consolidated Admin Module"]
PubLayout --> PublicPages["Public Pages"]
```

**Diagram sources**
- [main.tsx](file://frontend/src/main.tsx)
- [lib/router.ts](file://frontend/src/lib/router.ts)
- [routeTree.gen.ts](file://frontend/src/routeTree.gen.ts)
- [routes/__root.tsx](file://frontend/src/routes/__root.tsx)
- [routes/_authLayout.tsx](file://frontend/src/routes/_authLayout.tsx)
- [routes/_publicLayout.tsx](file://frontend/src/routes/_publicLayout.tsx)
- [hooks/useAuth.ts](file://frontend/src/hooks/useAuth.ts)

**Section sources**
- [main.tsx](file://frontend/src/main.tsx)
- [lib/router.ts](file://frontend/src/lib/router.ts)
- [routeTree.gen.ts](file://frontend/src/routeTree.gen.ts)
- [routes/__root.tsx](file://frontend/src/routes/__root.tsx)
- [routes/_authLayout.tsx](file://frontend/src/routes/_authLayout.tsx)
- [routes/_publicLayout.tsx](file://frontend/src/routes/_publicLayout.tsx)
- [hooks/useAuth.ts](file://frontend/src/hooks/useAuth.ts)

## Performance Considerations
- Prefer lazy-loaded route components to minimize initial bundle size with simplified structure
- Keep layout components lightweight; defer heavy work to route loaders or effects
- Use memoization for expensive computations derived from route params or search state
- Avoid unnecessary re-renders by stabilizing props and leveraging route context efficiently
- Monitor navigation performance and consider preloading frequently accessed routes
- Leverage simplified route structure for better caching and loading performance

## Troubleshooting Guide
Common issues and resolutions:
- Infinite redirect loops:
  - Verify guard conditions and ensure they do not redirect to the same guarded route
  - Confirm that login redirects account for previously requested URLs
- Missing route components:
  - Ensure route files exist and export default components
  - Regenerate the route tree after adding new routes
- Type errors with route helpers:
  - Run the build or regeneration step to refresh route types
- Stale search state:
  - Normalize and validate search params on load
  - Provide explicit reset actions to clear filters

Operational tips:
- Log navigation events during development to trace unexpected redirects
- Use browser dev tools to inspect route matches and loaded chunks
- Monitor the simplified route structure for performance improvements

**Section sources**
- [routes/_authLayout.tsx](file://frontend/src/routes/_authLayout.tsx)
- [routes/__root.tsx](file://frontend/src/routes/__root.tsx)

## Conclusion
The eLISAschool frontend leverages TanStack Router's file-based routing to deliver a secure, scalable, and maintainable navigation system that has been significantly simplified and optimized. The major route structure simplification removes complex nomenclature-related routes and authentication infrastructure while adding focused modules for library management, financial operations, and transportation services. The consolidated administrative module structure provides better organization and maintainability.

Route groups continue to separate authenticated and public experiences effectively, while centralized guards enforce access control with improved performance. Lazy loading and nested layouts optimize performance and composition within the streamlined architecture. By adhering to the simplified patterns described here—typed navigation, robust guards, URL-driven state, and deep linking—the team can extend the application confidently and keep the user experience consistent and performant.

The simplified structure reduces complexity while maintaining all essential functionality, making it easier for developers to understand, maintain, and extend the routing system as the application evolves.