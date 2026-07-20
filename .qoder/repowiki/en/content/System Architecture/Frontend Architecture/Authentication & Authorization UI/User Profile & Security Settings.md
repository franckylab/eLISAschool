# User Profile & Security Settings

<cite>
**Referenced Files in This Document**
- [auth.controller.ts](file://backend/src/modules/auth/controllers/auth.controller.ts)
- [auth.service.ts](file://backend/src/modules/auth/services/auth.service.ts)
- [user.entity.ts](file://backend/src/modules/auth/entities/user.entity.ts)
- [session.entity.ts](file://backend/src/modules/auth/entities/session.entity.ts)
- [preferences.entity.ts](file://backend/src/modules/configuration/entities/preferences.entity.ts)
- [preferences.service.ts](file://backend/src/modules/configuration/services/preferences.service.ts)
- [preferences.controller.ts](file://backend/src/modules/configuration/controllers/preferences.controller.ts)
- [rbac.guard.ts](file://backend/src/common/guards/rbac.guard.ts)
- [auth.middleware.ts](file://backend/src/common/middlewares/auth.middleware.ts)
- [route-registry.ts](file://backend/src/routes/route-registry.ts)
- [profile.page.tsx](file://frontend/src/features/profile/ProfilePage.tsx)
- [password-change.page.tsx](file://frontend/src/features/security/PasswordChangePage.tsx)
- [email-verification.page.tsx](file://frontend/src/features/security/EmailVerificationPage.tsx)
- [admin-users.page.tsx](file://frontend/src/features/admin/AdminUsersPage.tsx)
- [security-settings.page.tsx](file://frontend/src/features/security/SecuritySettingsPage.tsx)
- [useAuth.hook.ts](file://frontend/src/hooks/useAuth.hook.ts)
- [api-client.ts](file://frontend/src/lib/api-client.ts)
- [feedback.component.tsx](file://frontend/src/components/ui/FeedbackComponent.tsx)
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
This document explains the user profile management and security settings features across frontend and backend layers. It covers:
- User profile editing components and data synchronization with backend APIs
- Password change workflows and validation
- Email verification processes
- Administrator user management interface including role assignment and permission configuration
- Security settings pages for session management, two-factor authentication setup, and account preferences
- Form validation strategies, error handling, and user feedback mechanisms

The goal is to provide both a high-level understanding and detailed implementation references for developers and administrators.

## Project Structure
The relevant functionality spans:
- Backend modules for authentication, sessions, preferences, RBAC guards, middleware, and route registration
- Frontend features for profile editing, password changes, email verification, admin user management, and security settings
- Shared hooks and API client utilities for state and HTTP interactions
- UI feedback components for consistent user messaging

```mermaid
graph TB
subgraph "Frontend"
FE_Profile["Profile Page<br/>profile.page.tsx"]
FE_Password["Password Change Page<br/>password-change.page.tsx"]
FE_EmailVerify["Email Verification Page<br/>email-verification.page.tsx"]
FE_AdminUsers["Admin Users Page<br/>admin-users.page.tsx"]
FE_Security["Security Settings Page<br/>security-settings.page.tsx"]
FE_Hooks["Auth Hook<br/>useAuth.hook.ts"]
FE_API["API Client<br/>api-client.ts"]
FE_Feedback["Feedback Component<br/>feedback.component.tsx"]
end
subgraph "Backend"
BE_Routes["Route Registry<br/>route-registry.ts"]
BE_Middleware["Auth Middleware<br/>auth.middleware.ts"]
BE_Guard["RBAC Guard<br/>rbac.guard.ts"]
BE_AuthCtrl["Auth Controller<br/>auth.controller.ts"]
BE_AuthSvc["Auth Service<br/>auth.service.ts"]
BE_UserEntity["User Entity<br/>user.entity.ts"]
BE_SessionEntity["Session Entity<br/>session.entity.ts"]
BE_PrefCtrl["Preferences Controller<br/>preferences.controller.ts"]
BE_PrefSvc["Preferences Service<br/>preferences.service.ts"]
BE_PrefEntity["Preferences Entity<br/>preferences.entity.ts"]
end
FE_Profile --> FE_API
FE_Password --> FE_API
FE_EmailVerify --> FE_API
FE_AdminUsers --> FE_API
FE_Security --> FE_API
FE_Profile --> FE_Hooks
FE_Password --> FE_Hooks
FE_EmailVerify --> FE_Hooks
FE_AdminUsers --> FE_Hooks
FE_Security --> FE_Hooks
FE_API --> BE_Routes
BE_Routes --> BE_Middleware
BE_Middleware --> BE_AuthCtrl
BE_Middleware --> BE_PrefCtrl
BE_AuthCtrl --> BE_AuthSvc
BE_AuthSvc --> BE_UserEntity
BE_AuthSvc --> BE_SessionEntity
BE_PrefCtrl --> BE_PrefSvc
BE_PrefSvc --> BE_PrefEntity
FE_AdminUsers --> BE_Guard
```

**Diagram sources**
- [route-registry.ts](file://backend/src/routes/route-registry.ts)
- [auth.middleware.ts](file://backend/src/common/middlewares/auth.middleware.ts)
- [rbac.guard.ts](file://backend/src/common/guards/rbac.guard.ts)
- [auth.controller.ts](file://backend/src/modules/auth/controllers/auth.controller.ts)
- [auth.service.ts](file://backend/src/modules/auth/services/auth.service.ts)
- [user.entity.ts](file://backend/src/modules/auth/entities/user.entity.ts)
- [session.entity.ts](file://backend/src/modules/auth/entities/session.entity.ts)
- [preferences.controller.ts](file://backend/src/modules/configuration/controllers/preferences.controller.ts)
- [preferences.service.ts](file://backend/src/modules/configuration/services/preferences.service.ts)
- [preferences.entity.ts](file://backend/src/modules/configuration/entities/preferences.entity.ts)
- [profile.page.tsx](file://frontend/src/features/profile/ProfilePage.tsx)
- [password-change.page.tsx](file://frontend/src/features/security/PasswordChangePage.tsx)
- [email-verification.page.tsx](file://frontend/src/features/security/EmailVerificationPage.tsx)
- [admin-users.page.tsx](file://frontend/src/features/admin/AdminUsersPage.tsx)
- [security-settings.page.tsx](file://frontend/src/features/security/SecuritySettingsPage.tsx)
- [useAuth.hook.ts](file://frontend/src/hooks/useAuth.hook.ts)
- [api-client.ts](file://frontend/src/lib/api-client.ts)
- [feedback.component.tsx](file://frontend/src/components/ui/FeedbackComponent.tsx)

**Section sources**
- [route-registry.ts](file://backend/src/routes/route-registry.ts)
- [auth.middleware.ts](file://backend/src/common/middlewares/auth.middleware.ts)
- [rbac.guard.ts](file://backend/src/common/guards/rbac.guard.ts)
- [auth.controller.ts](file://backend/src/modules/auth/controllers/auth.controller.ts)
- [auth.service.ts](file://backend/src/modules/auth/services/auth.service.ts)
- [user.entity.ts](file://backend/src/modules/auth/entities/user.entity.ts)
- [session.entity.ts](file://backend/src/modules/auth/entities/session.entity.ts)
- [preferences.controller.ts](file://backend/src/modules/configuration/controllers/preferences.controller.ts)
- [preferences.service.ts](file://backend/src/modules/configuration/services/preferences.service.ts)
- [preferences.entity.ts](file://backend/src/modules/configuration/entities/preferences.entity.ts)
- [profile.page.tsx](file://frontend/src/features/profile/ProfilePage.tsx)
- [password-change.page.tsx](file://frontend/src/features/security/PasswordChangePage.tsx)
- [email-verification.page.tsx](file://frontend/src/features/security/EmailVerificationPage.tsx)
- [admin-users.page.tsx](file://frontend/src/features/admin/AdminUsersPage.tsx)
- [security-settings.page.tsx](file://frontend/src/features/security/SecuritySettingsPage.tsx)
- [useAuth.hook.ts](file://frontend/src/hooks/useAuth.hook.ts)
- [api-client.ts](file://frontend/src/lib/api-client.ts)
- [feedback.component.tsx](file://frontend/src/components/ui/FeedbackComponent.tsx)

## Core Components
- Authentication controller and service handle login, logout, token refresh, password updates, and email verification requests. They interact with user and session entities.
- Preferences controller and service manage user account preferences (e.g., language, theme), persisted via the preferences entity.
- RBAC guard enforces role-based access control on protected routes and endpoints.
- Auth middleware validates tokens and attaches user context to requests.
- Frontend pages implement profile editing, password change, email verification, admin user management, and security settings.
- The auth hook centralizes authentication state and actions.
- The API client abstracts HTTP calls and error mapping.
- Feedback component provides consistent success/error notifications.

**Section sources**
- [auth.controller.ts](file://backend/src/modules/auth/controllers/auth.controller.ts)
- [auth.service.ts](file://backend/src/modules/auth/services/auth.service.ts)
- [user.entity.ts](file://backend/src/modules/auth/entities/user.entity.ts)
- [session.entity.ts](file://backend/src/modules/auth/entities/session.entity.ts)
- [preferences.controller.ts](file://backend/src/modules/configuration/controllers/preferences.controller.ts)
- [preferences.service.ts](file://backend/src/modules/configuration/services/preferences.service.ts)
- [preferences.entity.ts](file://backend/src/modules/configuration/entities/preferences.entity.ts)
- [rbac.guard.ts](file://backend/src/common/guards/rbac.guard.ts)
- [auth.middleware.ts](file://backend/src/common/middlewares/auth.middleware.ts)
- [profile.page.tsx](file://frontend/src/features/profile/ProfilePage.tsx)
- [password-change.page.tsx](file://frontend/src/features/security/PasswordChangePage.tsx)
- [email-verification.page.tsx](file://frontend/src/features/security/EmailVerificationPage.tsx)
- [admin-users.page.tsx](file://frontend/src/features/admin/AdminUsersPage.tsx)
- [security-settings.page.tsx](file://frontend/src/features/security/SecuritySettingsPage.tsx)
- [useAuth.hook.ts](file://frontend/src/hooks/useAuth.hook.ts)
- [api-client.ts](file://frontend/src/lib/api-client.ts)
- [feedback.component.tsx](file://frontend/src/components/ui/FeedbackComponent.tsx)

## Architecture Overview
The system follows a layered architecture:
- Frontend pages call the API client, which sends authenticated requests through the auth hook.
- Backend routes are registered centrally and protected by middleware and guards.
- Controllers delegate business logic to services, which operate on entities.
- Preferences are managed independently from authentication but share common middleware and guards.

```mermaid
sequenceDiagram
participant FE as "Frontend Pages"
participant Hook as "useAuth.hook.ts"
participant API as "api-client.ts"
participant Routes as "route-registry.ts"
participant MW as "auth.middleware.ts"
participant Guard as "rbac.guard.ts"
participant Ctrl as "Controllers"
participant Svc as "Services"
participant DB as "Entities"
FE->>Hook : "Trigger action (e.g., update profile)"
Hook->>API : "Authenticated request"
API->>Routes : "HTTP call"
Routes->>MW : "Validate token"
MW-->>Routes : "Attach user context"
Routes->>Guard : "Check permissions"
Guard-->>Routes : "Allow/Deny"
Routes->>Ctrl : "Dispatch handler"
Ctrl->>Svc : "Business logic"
Svc->>DB : "Read/Write data"
DB-->>Svc : "Result"
Svc-->>Ctrl : "Response"
Ctrl-->>API : "JSON response"
API-->>Hook : "Normalized result"
Hook-->>FE : "State update + feedback"
```

**Diagram sources**
- [route-registry.ts](file://backend/src/routes/route-registry.ts)
- [auth.middleware.ts](file://backend/src/common/middlewares/auth.middleware.ts)
- [rbac.guard.ts](file://backend/src/common/guards/rbac.guard.ts)
- [auth.controller.ts](file://backend/src/modules/auth/controllers/auth.controller.ts)
- [auth.service.ts](file://backend/src/modules/auth/services/auth.service.ts)
- [user.entity.ts](file://backend/src/modules/auth/entities/user.entity.ts)
- [session.entity.ts](file://backend/src/modules/auth/entities/session.entity.ts)
- [preferences.controller.ts](file://backend/src/modules/configuration/controllers/preferences.controller.ts)
- [preferences.service.ts](file://backend/src/modules/configuration/services/preferences.service.ts)
- [preferences.entity.ts](file://backend/src/modules/configuration/entities/preferences.entity.ts)
- [useAuth.hook.ts](file://frontend/src/hooks/useAuth.hook.ts)
- [api-client.ts](file://frontend/src/lib/api-client.ts)

## Detailed Component Analysis

### User Profile Editing
- Frontend page collects user fields, performs local validation, and submits via the API client.
- The auth hook manages current user state; upon successful update, it refreshes local state.
- Backend controller receives the update, service validates and persists changes to the user entity.
- Feedback component displays success or error messages.

```mermaid
sequenceDiagram
participant Page as "ProfilePage.tsx"
participant Hook as "useAuth.hook.ts"
participant API as "api-client.ts"
participant Ctrl as "AuthController"
participant Svc as "AuthService"
participant Entity as "UserEntity"
Page->>Page : "Validate form locally"
Page->>API : "PUT /users/me"
API->>Ctrl : "Handle update"
Ctrl->>Svc : "Update user profile"
Svc->>Entity : "Persist changes"
Entity-->>Svc : "Updated user"
Svc-->>Ctrl : "Success"
Ctrl-->>API : "200 OK"
API-->>Hook : "Normalized response"
Hook-->>Page : "Update state"
Page->>Page : "Show success feedback"
```

**Diagram sources**
- [profile.page.tsx](file://frontend/src/features/profile/ProfilePage.tsx)
- [useAuth.hook.ts](file://frontend/src/hooks/useAuth.hook.ts)
- [api-client.ts](file://frontend/src/lib/api-client.ts)
- [auth.controller.ts](file://backend/src/modules/auth/controllers/auth.controller.ts)
- [auth.service.ts](file://backend/src/modules/auth/services/auth.service.ts)
- [user.entity.ts](file://backend/src/modules/auth/entities/user.entity.ts)

**Section sources**
- [profile.page.tsx](file://frontend/src/features/profile/ProfilePage.tsx)
- [useAuth.hook.ts](file://frontend/src/hooks/useAuth.hook.ts)
- [api-client.ts](file://frontend/src/lib/api-client.ts)
- [auth.controller.ts](file://backend/src/modules/auth/controllers/auth.controller.ts)
- [auth.service.ts](file://backend/src/modules/auth/services/auth.service.ts)
- [user.entity.ts](file://backend/src/modules/auth/entities/user.entity.ts)
- [feedback.component.tsx](file://frontend/src/components/ui/FeedbackComponent.tsx)

### Password Change Workflow
- Frontend validates new password strength and confirmation match.
- Submit triggers an endpoint that verifies old password and applies the new one.
- On success, the auth hook may refresh session metadata and show feedback.

```mermaid
flowchart TD
Start(["Open Password Change Page"]) --> Validate["Local Validation<br/>Strength + Match"]
Validate --> Valid{"Valid?"}
Valid -- "No" --> ShowErrors["Display Field Errors"]
Valid -- "Yes" --> Submit["Submit via API Client"]
Submit --> Backend["Auth Controller -> Service"]
Backend --> VerifyOld["Verify Old Password"]
VerifyOld --> HashNew["Hash New Password"]
HashNew --> Persist["Persist Update"]
Persist --> Success{"Success?"}
Success -- "Yes" --> Refresh["Refresh Auth State"]
Refresh --> Notify["Show Success Feedback"]
Success -- "No" --> HandleError["Map Error + Show Feedback"]
ShowErrors --> End(["Exit"])
Notify --> End
HandleError --> End
```

**Diagram sources**
- [password-change.page.tsx](file://frontend/src/features/security/PasswordChangePage.tsx)
- [api-client.ts](file://frontend/src/lib/api-client.ts)
- [auth.controller.ts](file://backend/src/modules/auth/controllers/auth.controller.ts)
- [auth.service.ts](file://backend/src/modules/auth/services/auth.service.ts)
- [user.entity.ts](file://backend/src/modules/auth/entities/user.entity.ts)
- [feedback.component.tsx](file://frontend/src/components/ui/FeedbackComponent.tsx)

**Section sources**
- [password-change.page.tsx](file://frontend/src/features/security/PasswordChangePage.tsx)
- [api-client.ts](file://frontend/src/lib/api-client.ts)
- [auth.controller.ts](file://backend/src/modules/auth/controllers/auth.controller.ts)
- [auth.service.ts](file://backend/src/modules/auth/services/auth.service.ts)
- [user.entity.ts](file://backend/src/modules/auth/entities/user.entity.ts)
- [feedback.component.tsx](file://frontend/src/components/ui/FeedbackComponent.tsx)

### Email Verification Process
- Frontend initiates sending a verification email and handles status responses.
- Backend generates a secure token and stores verification state in the user entity.
- User clicks verification link; backend validates token and marks email as verified.

```mermaid
sequenceDiagram
participant Page as "EmailVerificationPage.tsx"
participant API as "api-client.ts"
participant Ctrl as "AuthController"
participant Svc as "AuthService"
participant Entity as "UserEntity"
Page->>API : "POST /auth/send-verification-email"
API->>Ctrl : "Send verification request"
Ctrl->>Svc : "Generate token + store pending state"
Svc->>Entity : "Update verification flags"
Entity-->>Svc : "OK"
Svc-->>Ctrl : "Email queued"
Ctrl-->>API : "202 Accepted"
API-->>Page : "Status + message"
Note over Page,API : "User clicks verification link"
Page->>API : "GET /auth/verify-email?token=..."
API->>Ctrl : "Verify token"
Ctrl->>Svc : "Validate token + mark verified"
Svc->>Entity : "Set verified flag"
Entity-->>Svc : "OK"
Svc-->>Ctrl : "Verified"
Ctrl-->>API : "200 OK"
API-->>Page : "Success feedback"
```

**Diagram sources**
- [email-verification.page.tsx](file://frontend/src/features/security/EmailVerificationPage.tsx)
- [api-client.ts](file://frontend/src/lib/api-client.ts)
- [auth.controller.ts](file://backend/src/modules/auth/controllers/auth.controller.ts)
- [auth.service.ts](file://backend/src/modules/auth/services/auth.service.ts)
- [user.entity.ts](file://backend/src/modules/auth/entities/user.entity.ts)

**Section sources**
- [email-verification.page.tsx](file://frontend/src/features/security/EmailVerificationPage.tsx)
- [api-client.ts](file://frontend/src/lib/api-client.ts)
- [auth.controller.ts](file://backend/src/modules/auth/controllers/auth.controller.ts)
- [auth.service.ts](file://backend/src/modules/auth/services/auth.service.ts)
- [user.entity.ts](file://backend/src/modules/auth/entities/user.entity.ts)

### Administrator User Management Interface
- Admin users page lists users, supports filtering and pagination.
- Role assignment and permission configuration are performed via dedicated endpoints guarded by RBAC.
- Changes are persisted and reflected immediately in the UI.

```mermaid
classDiagram
class AdminUsersPage {
+render()
+fetchUsers()
+assignRole(userId, roleId)
+configurePermissions(userId, perms)
}
class RBACGuard {
+canAccess(role, permission) bool
}
class AuthController {
+listUsers(query)
+updateUserRole(userId, roleId)
+updateUserPermissions(userId, perms)
}
class AuthService {
+findUsers(query)
+setUserRole(userId, roleId)
+setUserPermissions(userId, perms)
}
class UserEntity {
+id
+roles
+permissions
}
AdminUsersPage --> AuthController : "calls"
AuthController --> AuthService : "delegates"
AuthService --> UserEntity : "persists"
AdminUsersPage --> RBACGuard : "enforced by"
```

**Diagram sources**
- [admin-users.page.tsx](file://frontend/src/features/admin/AdminUsersPage.tsx)
- [rbac.guard.ts](file://backend/src/common/guards/rbac.guard.ts)
- [auth.controller.ts](file://backend/src/modules/auth/controllers/auth.controller.ts)
- [auth.service.ts](file://backend/src/modules/auth/services/auth.service.ts)
- [user.entity.ts](file://backend/src/modules/auth/entities/user.entity.ts)

**Section sources**
- [admin-users.page.tsx](file://frontend/src/features/admin/AdminUsersPage.tsx)
- [rbac.guard.ts](file://backend/src/common/guards/rbac.guard.ts)
- [auth.controller.ts](file://backend/src/modules/auth/controllers/auth.controller.ts)
- [auth.service.ts](file://backend/src/modules/auth/services/auth.service.ts)
- [user.entity.ts](file://backend/src/modules/auth/entities/user.entity.ts)

### Security Settings: Sessions, Two-Factor Authentication, Account Preferences
- Session management: list active sessions, revoke sessions, and view last login details.
- Two-factor authentication: enable/disable TOTP, scan QR code, verify setup code.
- Account preferences: update language, theme, notification toggles via preferences endpoints.

```mermaid
sequenceDiagram
participant Page as "SecuritySettingsPage.tsx"
participant API as "api-client.ts"
participant PrefCtrl as "PreferencesController"
participant PrefSvc as "PreferencesService"
participant PrefEntity as "PreferencesEntity"
Page->>API : "GET /preferences"
API->>PrefCtrl : "Load preferences"
PrefCtrl->>PrefSvc : "Fetch preferences"
PrefSvc->>PrefEntity : "Query"
PrefEntity-->>PrefSvc : "Preferences"
PrefSvc-->>PrefCtrl : "Preferences"
PrefCtrl-->>API : "200 OK"
API-->>Page : "Render settings"
Page->>API : "PUT /preferences"
API->>PrefCtrl : "Update preferences"
PrefCtrl->>PrefSvc : "Persist changes"
PrefSvc->>PrefEntity : "Save"
PrefEntity-->>PrefSvc : "OK"
PrefSvc-->>PrefCtrl : "Updated"
PrefCtrl-->>API : "200 OK"
API-->>Page : "Success feedback"
```

**Diagram sources**
- [security-settings.page.tsx](file://frontend/src/features/security/SecuritySettingsPage.tsx)
- [api-client.ts](file://frontend/src/lib/api-client.ts)
- [preferences.controller.ts](file://backend/src/modules/configuration/controllers/preferences.controller.ts)
- [preferences.service.ts](file://backend/src/modules/configuration/services/preferences.service.ts)
- [preferences.entity.ts](file://backend/src/modules/configuration/entities/preferences.entity.ts)

**Section sources**
- [security-settings.page.tsx](file://frontend/src/features/security/SecuritySettingsPage.tsx)
- [api-client.ts](file://frontend/src/lib/api-client.ts)
- [preferences.controller.ts](file://backend/src/modules/configuration/controllers/preferences.controller.ts)
- [preferences.service.ts](file://backend/src/modules/configuration/services/preferences.service.ts)
- [preferences.entity.ts](file://backend/src/modules/configuration/entities/preferences.entity.ts)

## Dependency Analysis
- Frontend pages depend on the API client and auth hook for state and HTTP operations.
- Backend routes are centralized and protected by middleware and guards before reaching controllers.
- Controllers rely on services for business logic and persistence via entities.
- RBAC guard ensures only authorized roles can perform sensitive operations like role assignment and permission configuration.

```mermaid
graph LR
FE_Profile["ProfilePage.tsx"] --> FE_API["api-client.ts"]
FE_Password["PasswordChangePage.tsx"] --> FE_API
FE_EmailVerify["EmailVerificationPage.tsx"] --> FE_API
FE_AdminUsers["AdminUsersPage.tsx"] --> FE_API
FE_Security["SecuritySettingsPage.tsx"] --> FE_API
FE_API --> BE_Routes["route-registry.ts"]
BE_Routes --> BE_MW["auth.middleware.ts"]
BE_Routes --> BE_Guard["rbac.guard.ts"]
BE_MW --> BE_AuthCtrl["auth.controller.ts"]
BE_MW --> BE_PrefCtrl["preferences.controller.ts"]
BE_AuthCtrl --> BE_AuthSvc["auth.service.ts"]
BE_PrefCtrl --> BE_PrefSvc["preferences.service.ts"]
BE_AuthSvc --> BE_User["user.entity.ts"]
BE_AuthSvc --> BE_Session["session.entity.ts"]
BE_PrefSvc --> BE_Pref["preferences.entity.ts"]
```

**Diagram sources**
- [profile.page.tsx](file://frontend/src/features/profile/ProfilePage.tsx)
- [password-change.page.tsx](file://frontend/src/features/security/PasswordChangePage.tsx)
- [email-verification.page.tsx](file://frontend/src/features/security/EmailVerificationPage.tsx)
- [admin-users.page.tsx](file://frontend/src/features/admin/AdminUsersPage.tsx)
- [security-settings.page.tsx](file://frontend/src/features/security/SecuritySettingsPage.tsx)
- [api-client.ts](file://frontend/src/lib/api-client.ts)
- [route-registry.ts](file://backend/src/routes/route-registry.ts)
- [auth.middleware.ts](file://backend/src/common/middlewares/auth.middleware.ts)
- [rbac.guard.ts](file://backend/src/common/guards/rbac.guard.ts)
- [auth.controller.ts](file://backend/src/modules/auth/controllers/auth.controller.ts)
- [auth.service.ts](file://backend/src/modules/auth/services/auth.service.ts)
- [user.entity.ts](file://backend/src/modules/auth/entities/user.entity.ts)
- [session.entity.ts](file://backend/src/modules/auth/entities/session.entity.ts)
- [preferences.controller.ts](file://backend/src/modules/configuration/controllers/preferences.controller.ts)
- [preferences.service.ts](file://backend/src/modules/configuration/services/preferences.service.ts)
- [preferences.entity.ts](file://backend/src/modules/configuration/entities/preferences.entity.ts)

**Section sources**
- [route-registry.ts](file://backend/src/routes/route-registry.ts)
- [auth.middleware.ts](file://backend/src/common/middlewares/auth.middleware.ts)
- [rbac.guard.ts](file://backend/src/common/guards/rbac.guard.ts)
- [auth.controller.ts](file://backend/src/modules/auth/controllers/auth.controller.ts)
- [auth.service.ts](file://backend/src/modules/auth/services/auth.service.ts)
- [user.entity.ts](file://backend/src/modules/auth/entities/user.entity.ts)
- [session.entity.ts](file://backend/src/modules/auth/entities/session.entity.ts)
- [preferences.controller.ts](file://backend/src/modules/configuration/controllers/preferences.controller.ts)
- [preferences.service.ts](file://backend/src/modules/configuration/services/preferences.service.ts)
- [preferences.entity.ts](file://backend/src/modules/configuration/entities/preferences.entity.ts)
- [profile.page.tsx](file://frontend/src/features/profile/ProfilePage.tsx)
- [password-change.page.tsx](file://frontend/src/features/security/PasswordChangePage.tsx)
- [email-verification.page.tsx](file://frontend/src/features/security/EmailVerificationPage.tsx)
- [admin-users.page.tsx](file://frontend/src/features/admin/AdminUsersPage.tsx)
- [security-settings.page.tsx](file://frontend/src/features/security/SecuritySettingsPage.tsx)
- [api-client.ts](file://frontend/src/lib/api-client.ts)

## Performance Considerations
- Minimize re-renders by batching updates in the auth hook and using optimistic UI where safe.
- Implement server-side pagination and field selection for large user lists in admin interfaces.
- Cache frequently read preferences on the client with invalidation on updates.
- Use idempotent endpoints for critical operations (e.g., password change, email verification).
- Avoid unnecessary network calls by debouncing search inputs and leveraging query parameters efficiently.

## Troubleshooting Guide
Common issues and resolutions:
- Token expiration or invalid token errors: ensure middleware correctly attaches tokens and refresh flows are implemented.
- Permission denied when assigning roles: verify RBAC guard policies and that the admin has required permissions.
- Email verification not completing: check token generation, storage, and link validity; confirm backend marks email as verified.
- Preferences not saving: validate payload structure and ensure preferences service persists changes to the entity.
- Feedback not displayed: confirm the feedback component is integrated into each page’s success/error handlers.

**Section sources**
- [auth.middleware.ts](file://backend/src/common/middlewares/auth.middleware.ts)
- [rbac.guard.ts](file://backend/src/common/guards/rbac.guard.ts)
- [auth.controller.ts](file://backend/src/modules/auth/controllers/auth.controller.ts)
- [auth.service.ts](file://backend/src/modules/auth/services/auth.service.ts)
- [preferences.controller.ts](file://backend/src/modules/configuration/controllers/preferences.controller.ts)
- [preferences.service.ts](file://backend/src/modules/configuration/services/preferences.service.ts)
- [feedback.component.tsx](file://frontend/src/components/ui/FeedbackComponent.tsx)

## Conclusion
The user profile and security settings features are implemented with clear separation of concerns:
- Frontend pages focus on UX, validation, and feedback.
- Backend routes, middleware, and guards enforce security and authorization.
- Services encapsulate business logic and persistence via entities.
This structure supports maintainability, scalability, and robust user experiences for profile editing, password changes, email verification, admin user management, and security settings.