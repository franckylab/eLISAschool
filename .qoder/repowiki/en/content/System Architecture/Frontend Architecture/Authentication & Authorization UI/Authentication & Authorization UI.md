# Authentication & Authorization UI

<cite>
**Referenced Files in This Document**
- [App.tsx](file://frontend/src/App.tsx)
- [main.tsx](file://frontend/src/main.tsx)
- [routeTree.gen.ts](file://frontend/src/routeTree.gen.ts)
- [routes/login.tsx](file://frontend/src/routes/login.tsx)
- [routes/institution-selection.tsx](file://frontend/src/routes/institution-selection.tsx)
- [routes/profile.tsx](file://frontend/src/routes/profile.tsx)
- [components/auth/RequirePermission.tsx](file://frontend/src/components/auth/RequirePermission.tsx)
- [components/auth/PermissionGate.tsx](file://frontend/src/components/auth/PermissionGate.tsx)
- [hooks/useAuth.ts](file://frontend/src/hooks/useAuth.ts)
- [hooks/usePermissions.ts](file://frontend/src/hooks/usePermissions.ts)
- [stores/sessionStore.ts](file://frontend/src/stores/sessionStore.ts)
- [locales/en/auth.json](file://frontend/src/locales/en/auth.json)
- [locales/fr/auth.json](file://frontend/src/locales/fr/auth.json)
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
This document explains the authentication and authorization user interface components, focusing on:
- Login flow and multi-tenant institution selection
- Session management UI patterns
- Permission-based UI rendering with RequirePermission and PermissionGate
- Role-based access control visualization and permission matrix
- User profile management, password change workflows, and security settings interfaces
- Accessibility considerations and internationalization support for authentication flows

The goal is to provide a clear, code-mapped understanding of how users authenticate, select their active tenant (institution), manage sessions, and interact with permission-driven UI elements.

## Project Structure
Authentication and authorization UI spans routes, shared auth components, hooks, stores, and localization resources. The following diagram shows the high-level structure relevant to this documentation.

```mermaid
graph TB
subgraph "Frontend"
A["App.tsx"] --> B["Route Tree<br/>routeTree.gen.ts"]
B --> C["Login Route<br/>routes/login.tsx"]
B --> D["Institution Selection<br/>routes/institution-selection.tsx"]
B --> E["Profile Route<br/>routes/profile.tsx"]
C --> F["useAuth Hook<br/>hooks/useAuth.ts"]
D --> F
E --> F
F --> G["Session Store<br/>stores/sessionStore.ts"]
H["RequirePermission<br/>components/auth/RequirePermission.tsx"] --> I["usePermissions Hook<br/>hooks/usePermissions.ts"]
J["PermissionGate<br/>components/auth/PermissionGate.tsx"] --> I
K["i18n Resources<br/>locales/en/auth.json<br/>locales/fr/auth.json"] --> C
K --> D
K --> E
end
```

**Diagram sources**
- [App.tsx](file://frontend/src/App.tsx)
- [routeTree.gen.ts](file://frontend/src/routeTree.gen.ts)
- [routes/login.tsx](file://frontend/src/routes/login.tsx)
- [routes/institution-selection.tsx](file://frontend/src/routes/institution-selection.tsx)
- [routes/profile.tsx](file://frontend/src/routes/profile.tsx)
- [hooks/useAuth.ts](file://frontend/src/hooks/useAuth.ts)
- [hooks/usePermissions.ts](file://frontend/src/hooks/usePermissions.ts)
- [stores/sessionStore.ts](file://frontend/src/stores/sessionStore.ts)
- [locales/en/auth.json](file://frontend/src/locales/en/auth.json)
- [locales/fr/auth.json](file://frontend/src/locales/fr/auth.json)

**Section sources**
- [App.tsx](file://frontend/src/App.tsx)
- [main.tsx](file://frontend/src/main.tsx)
- [routeTree.gen.ts](file://frontend/src/routeTree.gen.ts)

## Core Components
- RequirePermission: Renders children only when the current user has the specified permission(s). It integrates with usePermissions and can short-circuit rendering to improve performance.
- PermissionGate: A higher-order or wrapper component that conditionally renders content based on permissions, often used to gate entire sections or pages.
- useAuth: Central hook providing login state, session context, logout actions, and tenant switching helpers.
- usePermissions: Hook that resolves effective permissions for the current user and selected institution, including role-derived permissions.
- Session Store: Persistent store managing token lifecycle, active institution, and user context across the app.

These components work together to enforce RBAC at the UI layer, ensuring consistent behavior between backend authorization and frontend visibility.

**Section sources**
- [components/auth/RequirePermission.tsx](file://frontend/src/components/auth/RequirePermission.tsx)
- [components/auth/PermissionGate.tsx](file://frontend/src/components/auth/PermissionGate.tsx)
- [hooks/useAuth.ts](file://frontend/src/hooks/useAuth.ts)
- [hooks/usePermissions.ts](file://frontend/src/hooks/usePermissions.ts)
- [stores/sessionStore.ts](file://frontend/src/stores/sessionStore.ts)

## Architecture Overview
The authentication and authorization UI architecture follows a layered approach:
- Routes orchestrate user flows (login, institution selection, profile).
- Hooks encapsulate business logic (auth state, permissions).
- Stores persist session data and active tenant.
- Permission components enforce UI-level access control.
- i18n resources ensure localized messages for all flows.

```mermaid
sequenceDiagram
participant U as "User"
participant R as "Login Route"
participant A as "useAuth Hook"
participant S as "Session Store"
participant P as "usePermissions Hook"
participant RP as "RequirePermission"
participant PG as "PermissionGate"
U->>R : "Submit credentials"
R->>A : "authenticate(credentials)"
A->>S : "persist tokens + user context"
S-->>A : "session updated"
A-->>R : "success"
R->>P : "load permissions for institution"
P-->>R : "effective permissions"
R->>RP : "render protected content"
RP->>P : "check permission"
P-->>RP : "allowed/denied"
RP-->>U : "content visible or hidden"
R->>PG : "wrap section with PermissionGate"
PG->>P : "evaluate permissions"
P-->>PG : "result"
PG-->>U : "conditional render"
```

**Diagram sources**
- [routes/login.tsx](file://frontend/src/routes/login.tsx)
- [hooks/useAuth.ts](file://frontend/src/hooks/useAuth.ts)
- [stores/sessionStore.ts](file://frontend/src/stores/sessionStore.ts)
- [hooks/usePermissions.ts](file://frontend/src/hooks/usePermissions.ts)
- [components/auth/RequirePermission.tsx](file://frontend/src/components/auth/RequirePermission.tsx)
- [components/auth/PermissionGate.tsx](file://frontend/src/components/auth/PermissionGate.tsx)

## Detailed Component Analysis

### Login Flow
- Entry point: Login route handles credential submission, error display, and redirection.
- Auth hook: useAuth performs authentication, updates session store, and exposes logout/reset methods.
- Permissions: After successful login, permissions are loaded for the default or previously selected institution.
- Redirection: Based on permissions and institutional context, the user is directed to the appropriate dashboard or institution selection.

```mermaid
flowchart TD
Start(["Login Page"]) --> Input["Enter username/email and password"]
Input --> Submit["Submit credentials"]
Submit --> Validate["Validate inputs"]
Validate --> CallAuth["Call useAuth.authenticate()"]
CallAuth --> Persist["Persist tokens and user context in session store"]
Persist --> LoadPerms["Load permissions for institution"]
LoadPerms --> Decision{"Has required permissions?"}
Decision --> |Yes| Redirect["Redirect to dashboard or next step"]
Decision --> |No| ShowError["Show access denied message"]
ShowError --> End(["Stay on login"])
Redirect --> End
```

**Diagram sources**
- [routes/login.tsx](file://frontend/src/routes/login.tsx)
- [hooks/useAuth.ts](file://frontend/src/hooks/useAuth.ts)
- [stores/sessionStore.ts](file://frontend/src/stores/sessionStore.ts)
- [hooks/usePermissions.ts](file://frontend/src/hooks/usePermissions.ts)

**Section sources**
- [routes/login.tsx](file://frontend/src/routes/login.tsx)
- [hooks/useAuth.ts](file://frontend/src/hooks/useAuth.ts)
- [stores/sessionStore.ts](file://frontend/src/stores/sessionStore.ts)
- [hooks/usePermissions.ts](file://frontend/src/hooks/usePermissions.ts)

### Multi-Tenant Institution Selection
- Purpose: Allow users with access to multiple institutions to choose the active tenant.
- Flow: After login, if multiple institutions are available, the institution selection route prompts the user.
- State: Active institution ID is stored in the session store and influences permission resolution.
- UX: Clear labels, keyboard navigation, and accessible form controls.

```mermaid
sequenceDiagram
participant U as "User"
participant IS as "Institution Selection Route"
participant A as "useAuth Hook"
participant SS as "Session Store"
participant P as "usePermissions Hook"
U->>IS : "Select institution"
IS->>SS : "Set active institution"
SS-->>IS : "updated"
IS->>P : "Reload permissions for selected institution"
P-->>IS : "permissions resolved"
IS-->>U : "Proceed to dashboard"
```

**Diagram sources**
- [routes/institution-selection.tsx](file://frontend/src/routes/institution-selection.tsx)
- [hooks/useAuth.ts](file://frontend/src/hooks/useAuth.ts)
- [stores/sessionStore.ts](file://frontend/src/stores/sessionStore.ts)
- [hooks/usePermissions.ts](file://frontend/src/hooks/usePermissions.ts)

**Section sources**
- [routes/institution-selection.tsx](file://frontend/src/routes/institution-selection.tsx)
- [stores/sessionStore.ts](file://frontend/src/stores/sessionStore.ts)
- [hooks/usePermissions.ts](file://frontend/src/hooks/usePermissions.ts)

### Session Management UI Patterns
- Token persistence: Secure storage of tokens via session store.
- Auto-refresh: Refresh tokens before expiration; handle refresh failures gracefully.
- Logout: Clear tokens, reset user context, and redirect to login.
- Idle detection: Optional idle timeout prompting re-authentication.
- Tenant-aware sessions: Ensure active institution persists across sessions.

```mermaid
flowchart TD
Init(["App Start"]) --> CheckToken["Check token validity"]
CheckToken --> Valid{"Valid?"}
Valid --> |Yes| LoadContext["Load user context + permissions"]
Valid --> |No| RedirectToLogin["Redirect to login"]
LoadContext --> Monitor["Monitor token expiry"]
Monitor --> Expired{"Expired?"}
Expired --> |Yes| Refresh["Attempt token refresh"]
Refresh --> RefreshOK{"Refresh success?"}
RefreshOK --> |Yes| Continue["Continue session"]
RefreshOK --> |No| ForceLogout["Force logout and redirect"]
Expired --> |No| Continue
Continue --> End(["Active Session"])
ForceLogout --> End
```

**Diagram sources**
- [stores/sessionStore.ts](file://frontend/src/stores/sessionStore.ts)
- [hooks/useAuth.ts](file://frontend/src/hooks/useAuth.ts)

**Section sources**
- [stores/sessionStore.ts](file://frontend/src/stores/sessionStore.ts)
- [hooks/useAuth.ts](file://frontend/src/hooks/useAuth.ts)

### Permission-Based UI Rendering: RequirePermission and PermissionGate
- RequirePermission:
  - Evaluates one or more permissions.
  - Renders children if allowed; otherwise, renders fallback or nothing.
  - Integrates with usePermissions for efficient checks.
- PermissionGate:
  - Wraps larger sections or pages.
  - Can show loading states while permissions resolve.
  - Supports custom deny handlers and redirects.

```mermaid
classDiagram
class RequirePermission {
+props.permissions
+props.fallback
+render(children)
}
class PermissionGate {
+props.permissions
+props.onDenied
+render(children)
}
class usePermissions {
+hasPermission(permission)
+hasAny(permissions)
+hasAll(permissions)
}
RequirePermission --> usePermissions : "uses"
PermissionGate --> usePermissions : "uses"
```

**Diagram sources**
- [components/auth/RequirePermission.tsx](file://frontend/src/components/auth/RequirePermission.tsx)
- [components/auth/PermissionGate.tsx](file://frontend/src/components/auth/PermissionGate.tsx)
- [hooks/usePermissions.ts](file://frontend/src/hooks/usePermissions.ts)

**Section sources**
- [components/auth/RequirePermission.tsx](file://frontend/src/components/auth/RequirePermission.tsx)
- [components/auth/PermissionGate.tsx](file://frontend/src/components/auth/PermissionGate.tsx)
- [hooks/usePermissions.ts](file://frontend/src/hooks/usePermissions.ts)

### Role-Based Access Control Visualization and Permission Matrix
- Role overview: Display roles assigned to the current user within the active institution.
- Permission matrix: Tabular view mapping features/actions to granted permissions.
- Filtering: Filter by module, feature, or action type.
- Export: Optionally export permission matrix for auditing.

```mermaid
flowchart TD
Open(["Open RBAC View"]) --> FetchRoles["Fetch user roles for institution"]
FetchRoles --> BuildMatrix["Build permission matrix from roles"]
BuildMatrix --> RenderTable["Render table with filters"]
RenderTable --> Interact{"User interacts"}
Interact --> Filter["Apply filters"]
Interact --> Export["Export matrix"]
Filter --> RenderTable
Export --> Done(["Done"])
```

[No sources needed since this diagram shows conceptual workflow, not actual code structure]

### User Profile Management, Password Change, and Security Settings
- Profile route: Displays and edits user details, preferences, and notifications.
- Password change: Validates old password, enforces complexity rules, confirms new password, and updates securely.
- Security settings: Manage two-factor authentication, trusted devices, and session timeouts.
- Feedback: Provide clear success/error messages and accessibility hints.

```mermaid
sequenceDiagram
participant U as "User"
participant PR as "Profile Route"
participant A as "useAuth Hook"
participant SS as "Session Store"
U->>PR : "Update profile/password"
PR->>A : "submit changes"
A->>SS : "update user context"
SS-->>A : "context updated"
A-->>PR : "success feedback"
PR-->>U : "show confirmation"
```

**Diagram sources**
- [routes/profile.tsx](file://frontend/src/routes/profile.tsx)
- [hooks/useAuth.ts](file://frontend/src/hooks/useAuth.ts)
- [stores/sessionStore.ts](file://frontend/src/stores/sessionStore.ts)

**Section sources**
- [routes/profile.tsx](file://frontend/src/routes/profile.tsx)
- [hooks/useAuth.ts](file://frontend/src/hooks/useAuth.ts)
- [stores/sessionStore.ts](file://frontend/src/stores/sessionStore.ts)

### Accessibility Considerations
- Keyboard navigation: All interactive elements must be reachable via keyboard.
- Focus management: Move focus appropriately after login, errors, and redirects.
- ARIA attributes: Use aria-live regions for dynamic messages (errors, success).
- Color contrast: Ensure sufficient contrast for text and indicators.
- Screen readers: Provide descriptive labels and instructions for forms and modals.

[No sources needed since this section provides general guidance]

### Internationalization Support
- Localization files: English and French resources for authentication-related strings.
- Dynamic language switching: Update UI text without reloading the page.
- Pluralization and formatting: Handle plural forms and date/time formats per locale.
- Error messages: Localize validation and system errors consistently.

```mermaid
graph TB
LEn["locales/en/auth.json"] --> UIEN["UI Text EN"]
LFo["locales/fr/auth.json"] --> UIFo["UI Text FR"]
UIEN --> Routes["Routes & Components"]
UIFo --> Routes
```

**Diagram sources**
- [locales/en/auth.json](file://frontend/src/locales/en/auth.json)
- [locales/fr/auth.json](file://frontend/src/locales/fr/auth.json)

**Section sources**
- [locales/en/auth.json](file://frontend/src/locales/en/auth.json)
- [locales/fr/auth.json](file://frontend/src/locales/fr/auth.json)

## Dependency Analysis
The following diagram maps key dependencies among authentication and authorization UI components.

```mermaid
graph TB
App["App.tsx"] --> RT["routeTree.gen.ts"]
RT --> Login["routes/login.tsx"]
RT --> InstSel["routes/institution-selection.tsx"]
RT --> Profile["routes/profile.tsx"]
Login --> UseAuth["hooks/useAuth.ts"]
InstSel --> UseAuth
Profile --> UseAuth
UseAuth --> Session["stores/sessionStore.ts"]
ReqPerm["components/auth/RequirePermission.tsx"] --> UsePerms["hooks/usePermissions.ts"]
PermGate["components/auth/PermissionGate.tsx"] --> UsePerms
UsePerms --> Session
```

**Diagram sources**
- [App.tsx](file://frontend/src/App.tsx)
- [routeTree.gen.ts](file://frontend/src/routeTree.gen.ts)
- [routes/login.tsx](file://frontend/src/routes/login.tsx)
- [routes/institution-selection.tsx](file://frontend/src/routes/institution-selection.tsx)
- [routes/profile.tsx](file://frontend/src/routes/profile.tsx)
- [hooks/useAuth.ts](file://frontend/src/hooks/useAuth.ts)
- [hooks/usePermissions.ts](file://frontend/src/hooks/usePermissions.ts)
- [stores/sessionStore.ts](file://frontend/src/stores/sessionStore.ts)
- [components/auth/RequirePermission.tsx](file://frontend/src/components/auth/RequirePermission.tsx)
- [components/auth/PermissionGate.tsx](file://frontend/src/components/auth/PermissionGate.tsx)

**Section sources**
- [App.tsx](file://frontend/src/App.tsx)
- [routeTree.gen.ts](file://frontend/src/routeTree.gen.ts)
- [hooks/useAuth.ts](file://frontend/src/hooks/useAuth.ts)
- [hooks/usePermissions.ts](file://frontend/src/hooks/usePermissions.ts)
- [stores/sessionStore.ts](file://frontend/src/stores/sessionStore.ts)
- [components/auth/RequirePermission.tsx](file://frontend/src/components/auth/RequirePermission.tsx)
- [components/auth/PermissionGate.tsx](file://frontend/src/components/auth/PermissionGate.tsx)

## Performance Considerations
- Minimize re-renders: Memoize permission checks and avoid unnecessary recalculations.
- Lazy load protected routes: Defer heavy components until permissions are resolved.
- Batch permission requests: Consolidate API calls where possible.
- Debounce input: For search/filter in permission matrices, debounce to reduce processing.
- Cache results: Cache resolved permissions per institution to avoid repeated computations.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- Login fails due to invalid credentials: Verify inputs, check network connectivity, and inspect error messages.
- Permission denied after login: Confirm active institution and role assignments; reload permissions.
- Session expired unexpectedly: Check token refresh logic and server time synchronization.
- Locale not applied: Ensure correct locale file exists and is imported; verify language switcher state.

**Section sources**
- [hooks/useAuth.ts](file://frontend/src/hooks/useAuth.ts)
- [hooks/usePermissions.ts](file://frontend/src/hooks/usePermissions.ts)
- [stores/sessionStore.ts](file://frontend/src/stores/sessionStore.ts)

## Conclusion
The authentication and authorization UI is built around robust hooks and components that enforce RBAC consistently. The login and institution selection flows integrate seamlessly with session management and permission resolution. RequirePermission and PermissionGate provide flexible mechanisms for conditional rendering, while profile and security settings offer comprehensive user control. Accessibility and internationalization ensure inclusive and globally usable experiences.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices
- Best practices:
  - Always wrap sensitive UI with RequirePermission or PermissionGate.
  - Keep session store minimal and focused on auth state.
  - Localize all user-facing strings and error messages.
  - Test multi-tenant scenarios thoroughly.

[No sources needed since this section provides general guidance]