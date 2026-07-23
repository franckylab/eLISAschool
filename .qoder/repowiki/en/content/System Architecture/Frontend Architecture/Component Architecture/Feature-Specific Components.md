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

## Update Summary
**Changes Made**
- Added comprehensive dark mode support section for feature-specific components
- Updated component analysis to include theme-aware styling patterns
- Enhanced accessibility considerations for dark mode implementations
- Added guidelines for maintaining design system consistency across features

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Dark Mode Support](#dark-mode-support)
6. [Detailed Component Analysis](#detailed-component-analysis)
7. [Dependency Analysis](#dependency-analysis)
8. [Performance Considerations](#performance-considerations)
9. [Troubleshooting Guide](#troubleshooting-guide)
10. [Conclusion](#conclusion)

## Introduction
This document explains the feature-based architecture used across business domains (eleves, personnel, finances, etc.). Each domain owns its components, hooks, types, stores, and utilities. The frontend uses:
- React Query for data fetching and caching
- Zustand for local UI state management
- Route-based component organization with TanStack Router
- Permission guards to protect routes and actions
- Feature module loading patterns for scalability
- **Enhanced dark mode support with theme-aware styling across all feature components**

The goal is to help developers understand how features are composed, how state flows between layers, and how to test and optimize feature components effectively while maintaining consistent dark mode support.

## Project Structure
The frontend organizes code by feature under src/features/<domain>. A typical feature includes:
- components: presentational and container components with dark mode support
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
Theme["Theme Provider"]
end
subgraph "Features"
Eleves["features/eleves<br/>+ Dark Mode Support"]
Personnel["features/personnel<br/>+ Dark Mode Support"]
Finances["features/finances<br/>+ Dark Mode Support"]
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
Theme --> Eleves
Theme --> Personnel
Theme --> Finances
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

- eleves: student list/detail views, queries, types, and UI store slice with enhanced dark mode support
- personnel: staff list/detail views, queries, types, and UI store slice with enhanced dark mode support
- finances: payments and related views, queries, types, and UI store slice with enhanced dark mode support

Key responsibilities:
- Components render feature UI and consume hooks with theme-aware styling
- Hooks encapsulate React Query usage and transform server responses
- Types define request/response contracts and UI shapes
- Stores manage local UI state (filters, pagination, modals)
- **All components now support seamless dark mode transitions and maintain design system consistency**

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
- **Theme provider ensures consistent dark mode styling across all components**

```mermaid
sequenceDiagram
participant User as "User"
participant Router as "TanStack Router"
participant Guard as "PermissionGuard"
participant Theme as "Theme Provider"
participant Comp as "Feature Component"
participant Hook as "useXxx Hook"
participant Q as "React Query"
participant Store as "Zustand Store"
User->>Router : Navigate to "/eleves/ : id"
Router->>Guard : Check permissions
Guard-->>Router : Allow/Deny
Router->>Theme : Apply theme context
Theme-->>Comp : Theme values (light/dark)
Router->>Comp : Render EleveDetail
Comp->>Hook : Call useEleve(id)
Hook->>Q : query({ key, fetcher })
Q-->>Hook : data | isLoading | error
Hook-->>Comp : { data, status }
Comp->>Store : setFilter()/setModal()
Store-->>Comp : latest UI state
Comp-->>User : Rendered UI with theme-aware styling
```

**Diagram sources**
- [routes/eleves.$id.tsx](file://frontend/src/routes/eleves.$id.tsx)
- [components/guards/PermissionGuard.tsx](file://frontend/src/components/guards/PermissionGuard.tsx)
- [hooks/useAuth.ts](file://frontend/src/hooks/useAuth.ts)
- [lib/queryClient.ts](file://frontend/src/lib/queryClient.ts)
- [eleves/hooks/useEleves.ts](file://frontend/src/features/eleves/hooks/useEleves.ts)
- [eleves/store/eleves.store.ts](file://frontend/src/features/eleves/store/eleves.store.ts)

## Dark Mode Support

### Theme-Aware Component Architecture
All feature-specific components now implement comprehensive dark mode support through a unified theming system. The enhancement includes specialized components like PosteFormModal, UniteFormModal, fonction-form-modal, and nomenclature-crud-page that maintain visual consistency across light and dark themes.

### Key Dark Mode Features
- **Consistent Color Palettes**: All components use semantic color tokens that adapt to theme context
- **Smooth Transitions**: CSS transitions provide seamless switching between light and dark modes
- **Accessibility Compliance**: WCAG 2.1 AA contrast ratios maintained in both themes
- **Design System Integration**: Components follow established design tokens and spacing rules

### Implementation Patterns

#### Theme Context Usage
Components access theme values through React context or custom hooks:

```typescript
// Example pattern for theme-aware components
const { theme, colors, spacing } = useTheme();
const buttonStyle = {
  backgroundColor: colors.primary[theme],
  color: colors.text[theme],
  padding: `${spacing.md}px ${spacing.lg}px`
};
```

#### Modal Components Enhancement
Specialized modal components like PosteFormModal and UniteFormModal now include:
- Theme-aware backdrop opacity
- Consistent border and shadow effects
- Accessible focus management in both themes
- Responsive layout adjustments

#### Form Components Styling
Form elements including fonction-form-modal implement:
- Theme-aware input borders and backgrounds
- Consistent validation states across themes
- Proper label and helper text contrast
- Focus indicators visible in both modes

**Updated** Enhanced dark mode support across all feature components with theme-aware styling and design system consistency

**Section sources**
- [components/guards/PermissionGuard.tsx](file://frontend/src/components/guards/PermissionGuard.tsx)
- [hooks/useAuth.ts](file://frontend/src/hooks/useAuth.ts)

## Detailed Component Analysis

### Eleves Feature
Responsibilities:
- List and detail views for students with enhanced dark mode support
- Queries for listing and fetching a single student
- Local UI state for filters, selection, and modal visibility

Composition patterns:
- Route mounts EleveList or EleveDetail
- Components consume useEleves hooks with theme-aware styling
- UI state managed in eleves.store.ts
- **All student-related components support seamless dark mode transitions**

```mermaid
classDiagram
class EleveList {
+render()
-filters
-pagination
-theme-aware-styling
}
class EleveDetail {
+render()
-studentId
-theme-aware-styling
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
EleveList --> Theme : "theme-aware"
EleveDetail --> Theme : "theme-aware"
```

**Diagram sources**
- [eleves/components/EleveList.tsx](file://frontend/src/features/eleves/components/EleveList.tsx)
- [eleves/hooks/useEleves.ts](file://frontend/src/features/eleves/hooks/useEleves.ts)
- [eleves/types/eleve.types.ts](file://frontend/src/features/eleves/types/eleve.types.ts)
- [eleves/store/eleves.store.ts](file://frontend/src/features/eleves/store/eleves.store.ts)

Data flow example:
- Route renders EleveList with theme context
- EleveList calls useEleves.list(filters)
- React Query caches results; component subscribes to updates
- EleveList toggles filters via ElevesStore.setFilters()
- **Component automatically adapts styling based on current theme**

**Section sources**
- [eleves/components/EleveList.tsx](file://frontend/src/features/eleves/components/EleveList.tsx)
- [eleves/hooks/useEleves.ts](file://frontend/src/features/eleves/hooks/useEleves.ts)
- [eleves/types/eleve.types.ts](file://frontend/src/features/eleves/types/eleve.types.ts)
- [eleves/store/eleves.store.ts](file://frontend/src/features/eleves/store/eleves.store.ts)
- [routes/eleves.$id.tsx](file://frontend/src/routes/eleves.$id.tsx)

### Personnel Feature
Responsibilities:
- Staff directory and profile views with enhanced dark mode support
- Queries for listing and fetching a single staff member
- Local UI state for search, roles, and modals
- **All personnel components maintain visual consistency across themes**

```mermaid
flowchart TD
Start(["Route /personnel/:id"]) --> Mount["Render PersonnelDetail"]
Mount --> Fetch["usePersonnel.getById(id)"]
Fetch --> QFetch["React Query fetch"]
QFetch --> Data{"Data ready?"}
Data --> |No| Loading["Show skeleton/loader"]
Data --> |Yes| Render["Render details with theme-aware styling"]
Render --> Actions["Open edit modal"]
Actions --> StoreWrite["Update personnel.store"]
StoreWrite --> ReRender["Component re-renders with updated theme"]
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
- Payments list and summary views with enhanced dark mode support
- Queries for paginated payment lists and totals
- Local UI state for date ranges, statuses, and export flags
- **Financial data displays maintain readability in both light and dark themes**

```mermaid
sequenceDiagram
participant R as "Route /finances/payments"
participant C as "PaymentList"
participant H as "usePayments"
participant Q as "React Query"
participant S as "payments.store"
participant T as "Theme Context"
R->>C : Render PaymentList with theme
C->>H : list({ page, status, dateRange })
H->>Q : query({ key : ["payments", params] })
Q-->>H : { data, isLoading, isError }
H-->>C : { rows, meta, status }
C->>S : setStatus(status)
S-->>C : updated filter state
T-->>C : theme-aware styling
C-->>R : Rendered table with controls and theme support
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

### Specialized Modal Components
The following components have received significant dark mode enhancements:

#### PosteFormModal
- Theme-aware form fields and validation states
- Consistent header and footer styling
- Accessible modal behavior in both themes
- Smooth transition animations

#### UniteFormModal
- Enhanced input field styling for dark backgrounds
- Improved contrast for form labels and placeholders
- Consistent button states across themes
- Responsive layout adjustments

#### Fonction Form Modal
- Theme-aware dropdown and select components
- Improved checkbox and radio button styling
- Better visual hierarchy in dark mode
- Maintained accessibility standards

#### Nomenclature CRUD Page
- Enhanced table styling for dark backgrounds
- Improved pagination controls visibility
- Better search input contrast
- Consistent action button styling

**Updated** Added comprehensive dark mode support for specialized modal components including PosteFormModal, UniteFormModal, fonction-form-modal, and nomenclature-crud-page

### Permission Guards and Authentication Integration
- PermissionGuard wraps protected routes and checks user capabilities
- useAuth provides current user context and capability checks
- Routes can conditionally render or redirect based on permissions
- **All permission-related UI elements maintain proper contrast in dark mode**

```mermaid
flowchart TD
Enter["Navigate to protected route"] --> Guard["PermissionGuard"]
Guard --> HasPerm{"Has required permission?"}
HasPerm --> |Yes| Allow["Render target component with theme"]
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
- _layout.tsx defines shared chrome and guards with theme support
- Domain routes map to feature components
- Generated route tree centralizes navigation configuration
- **Layout components ensure consistent theme application across all routes**

```mermaid
graph LR
Layout["_layout.tsx<br/>+ Theme Provider"] --> ElevesRoute["eleves.$id.tsx"]
Layout --> PersonnelRoute["personnel.$id.tsx"]
Layout --> FinancesRoute["finances.payments.tsx"]
ElevesRoute --> ElevesComp["features/eleves/*<br/>+ Dark Mode"]
PersonnelRoute --> PersonnelComp["features/personnel/*<br/>+ Dark Mode"]
FinancesRoute --> FinancesComp["features/finances/*<br/>+ Dark Mode"]
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
  - **Theme provider for consistent dark mode support**
- Features are loosely coupled through typed APIs and re-exports
- **All components inherit theme context from parent providers**

```mermaid
graph TB
Eleves["features/eleves<br/>+ Dark Mode"] --> Q["lib/queryClient.ts"]
Personnel["features/personnel<br/>+ Dark Mode"] --> Q
Finances["features/finances<br/>+ Dark Mode"] --> Q
Eleves --> AppStore["stores/app.store.ts"]
Personnel --> AppStore
Finances --> AppStore
Routes["routes/*<br/>+ Theme Provider"] --> Eleves
Routes --> Personnel
Routes --> Finances
Routes --> Guard["components/guards/PermissionGuard.tsx"]
Guard --> Auth["hooks/useAuth.ts"]
Theme["Theme Provider"] --> Eleves
Theme --> Personnel
Theme --> Finances
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
- **Optimize theme switching performance by minimizing re-renders during theme changes**
- **Use CSS custom properties for theme values to enable fast theme switching without JavaScript overhead**

## Troubleshooting Guide
Common issues and strategies:
- Stale or missing data: verify React Query cache keys and invalidation triggers
- Permission denied errors: ensure PermissionGuard has correct permissions and useAuth returns expected capabilities
- Excessive re-renders: check Zustand store subscriptions and component prop stability
- Network errors: inspect React Query error states and implement retry/backoff policies
- Route not found: confirm route definitions and generated route tree consistency
- **Dark mode issues: verify theme context availability and CSS custom property usage**
- **Contrast problems: check WCAG compliance in both light and dark themes**
- **Transition glitches: ensure smooth CSS transitions between theme states**

**Section sources**
- [lib/queryClient.ts](file://frontend/src/lib/queryClient.ts)
- [components/guards/PermissionGuard.tsx](file://frontend/src/components/guards/PermissionGuard.tsx)
- [hooks/useAuth.ts](file://frontend/src/hooks/useAuth.ts)

## Conclusion
The feature-based architecture cleanly separates concerns by domain, enabling scalable growth and maintainability. By combining React Query for data, Zustand for UI state, robust routing with permission guards, and comprehensive dark mode support, each feature remains cohesive, accessible, and visually consistent across all themes. The recent enhancements to specialized components like PosteFormModal, UniteFormModal, fonction-form-modal, and nomenclature-crud-page demonstrate the commitment to maintaining high-quality user experiences in both light and dark modes. Following the composition patterns, performance tips, and accessibility guidelines outlined here will help keep the application responsive, inclusive, and easy to evolve.