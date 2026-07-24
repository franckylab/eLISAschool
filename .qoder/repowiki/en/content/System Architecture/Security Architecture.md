# Security Architecture

<cite>
**Referenced Files in This Document**
- [app.ts](file://backend/src/app.ts)
- [index.ts](file://backend/src/index.ts)
- [env.config.ts](file://backend/src/config/env.config.ts)
- [database.config.ts](file://backend/src/config/database.config.ts)
- [auth.controller.ts](file://backend/src/modules/auth/controllers/auth.controller.ts)
- [auth.service.ts](file://backend/src/modules/auth/services/auth.service.ts)
- [jwt.strategy.ts](file://backend/src/modules/auth/strategies/jwt.strategy.ts)
- [local.strategy.ts](file://backend/src/modules/auth/strategies/local.strategy.ts)
- [require-permission.guard.ts](file://backend/src/modules/rbac/guards/require-permission.guard.ts)
- [rbac.service.ts](file://backend/src/modules/rbac/services/rbac.service.ts)
- [audit.middleware.ts](file://backend/src/common/middlewares/audit.middleware.ts)
- [cors.config.ts](file://backend/src/config/cors.config.ts)
- [security.headers.middleware.ts](file://backend/src/common/middlewares/security.headers.middleware.ts)
- [input.validation.pipe.ts](file://backend/src/common/pipes/input.validation.pipe.ts)
- [file.upload.middleware.ts](file://backend/src/common/middlewares/file.upload.middleware.ts)
- [multi.tenant.middleware.ts](file://backend/src/common/middlewares/multi.tenant.middleware.ts)
- [027-auth-multi-mode.sql](file://backend/database/migrations/027-auth-multi-mode.sql)
- [migrate-rbac-v3.sql](file://backend/database/migrations/migrate-rbac-v3.sql)
- [050-multi-tenant-v3-max-etablissements.sql](file://backend/database/migrations/050-multi-tenant-v3-max-etablissements.sql)
- [test-multi-tenant-isolation.test.ts](file://backend/test/multi-tenant-isolation.test.ts)
- [SECURE-LOGOUT-IMPLEMENTATION.md](file://docs/autres/SECURE-LOGOUT-IMPLEMENTATION.md)
- [SYSTEME-BLOCAGE-AUTH-DEUX-NIVEAUX.md](file://docs/SYSTEME-BLOCAGE-AUTH-DEUX-NIVEAUX.md)
- [GUIDE-TEST-SECURITE.md](file://docs/guides/GUIDE-TEST-SECURITE.md)
</cite>

## Update Summary
**Changes Made**
- Enhanced GET route protection using requirePermission middleware for improved authorization enforcement
- Implemented permission-based sidebar filtering in frontend for better access control visibility
- Strengthened security controls for organizational unit management with enhanced guards and modals
- Updated RBAC guard implementation to support more granular permission checks

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Enhanced Route Protection](#enhanced-route-protection)
7. [Frontend Permission Controls](#frontend-permission-controls)
8. [Organizational Unit Security](#organizational-unit-security)
9. [Dependency Analysis](#dependency-analysis)
10. [Performance Considerations](#performance-considerations)
11. [Troubleshooting Guide](#troubleshooting-guide)
12. [Conclusion](#conclusion)
13. [Appendices](#appendices)

## Introduction
This document describes the security architecture of the application with a focus on authentication, authorization, and data protection. It explains the JWT-based authentication system, role-based access control (RBAC), multi-tenant isolation, password hashing, session management, input validation, audit logging, security headers, CORS configuration, secure API communication, file upload security, vulnerability mitigation, compliance considerations, and best practices. The goal is to provide both high-level understanding and code-level traceability for developers and operators.

## Project Structure
Security-related functionality is implemented across dedicated modules and shared infrastructure:
- Authentication module provides login, token issuance, and strategy configuration.
- RBAC module implements permission checks via guards and services.
- Common middlewares enforce security headers, CORS, input validation, audit logging, and tenant scoping.
- Configuration centralizes environment variables, database connectivity, and CORS settings.
- Database migrations define schema changes related to authentication modes, RBAC, and multi-tenant constraints.
- Tests validate multi-tenant isolation behavior.

```mermaid
graph TB
subgraph "App Bootstrap"
A["src/index.ts"] --> B["src/app.ts"]
end
subgraph "Config"
C["src/config/env.config.ts"]
D["src/config/database.config.ts"]
E["src/config/cors.config.ts"]
end
subgraph "Auth Module"
F["modules/auth/controllers/auth.controller.ts"]
G["modules/auth/services/auth.service.ts"]
H["modules/auth/strategies/jwt.strategy.ts"]
I["modules/auth/strategies/local.strategy.ts"]
end
subgraph "RBAC Module"
J["modules/rbac/guards/require-permission.guard.ts"]
K["modules/rbac/services/rbac.service.ts"]
end
subgraph "Common Middlewares"
L["common/middlewares/security.headers.middleware.ts"]
M["common/middlewares/cors.config.ts"]
N["common/middlewares/input.validation.pipe.ts"]
O["common/middlewares/audit.middleware.ts"]
P["common/middlewares/file.upload.middleware.ts"]
Q["common/middlewares/multi.tenant.middleware.ts"]
end
subgraph "Database Migrations"
R["database/migrations/027-auth-multi-mode.sql"]
S["database/migrations/migrate-rbac-v3.sql"]
T["database/migrations/050-multi-tenant-v3-max-etablissements.sql"]
end
B --> L
B --> M
B --> N
B --> O
B --> P
B --> Q
B --> F
F --> G
G --> H
G --> I
B --> J
J --> K
B --> C
B --> D
B --> E
D --> R
D --> S
D --> T
```

**Diagram sources**
- [index.ts](file://backend/src/index.ts)
- [app.ts](file://backend/src/app.ts)
- [env.config.ts](file://backend/src/config/env.config.ts)
- [database.config.ts](file://backend/src/config/database.config.ts)
- [cors.config.ts](file://backend/src/config/cors.config.ts)
- [auth.controller.ts](file://backend/src/modules/auth/controllers/auth.controller.ts)
- [auth.service.ts](file://backend/src/modules/auth/services/auth.service.ts)
- [jwt.strategy.ts](file://backend/src/modules/auth/strategies/jwt.strategy.ts)
- [local.strategy.ts](file://backend/src/modules/auth/strategies/local.strategy.ts)
- [require-permission.guard.ts](file://backend/src/modules/rbac/guards/require-permission.guard.ts)
- [rbac.service.ts](file://backend/src/modules/rbac/services/rbac.service.ts)
- [security.headers.middleware.ts](file://backend/src/common/middlewares/security.headers.middleware.ts)
- [input.validation.pipe.ts](file://backend/src/common/pipes/input.validation.pipe.ts)
- [audit.middleware.ts](file://backend/src/common/middlewares/audit.middleware.ts)
- [file.upload.middleware.ts](file://backend/src/common/middlewares/file.upload.middleware.ts)
- [multi.tenant.middleware.ts](file://backend/src/common/middlewares/multi.tenant.middleware.ts)
- [027-auth-multi-mode.sql](file://backend/database/migrations/027-auth-multi-mode.sql)
- [migrate-rbac-v3.sql](file://backend/database/migrations/migrate-rbac-v3.sql)
- [050-multi-tenant-v3-max-etablissements.sql](file://backend/database/migrations/050-multi-tenant-v3-max-etablissements.sql)

**Section sources**
- [index.ts](file://backend/src/index.ts)
- [app.ts](file://backend/src/app.ts)
- [env.config.ts](file://backend/src/config/env.config.ts)
- [database.config.ts](file://backend/src/config/database.config.ts)
- [cors.config.ts](file://backend/src/config/cors.config.ts)

## Core Components
- Authentication controller and service handle credential verification, token generation, and logout flows.
- JWT and local strategies implement Passport-based authentication mechanisms.
- RBAC guard enforces permissions at route level using RBAC service.
- Shared middlewares apply security headers, CORS policy, input validation, audit logging, file upload restrictions, and multi-tenant scoping.
- Environment and database configurations centralize secrets and connection parameters.
- Database migrations establish authentication modes, RBAC structures, and multi-tenant constraints.

Key responsibilities:
- Enforce least privilege via RBAC.
- Isolate tenants by establishment context.
- Validate all inputs and sanitize uploads.
- Log security-relevant events.
- Configure strict HTTP security headers and CORS.

**Section sources**
- [auth.controller.ts](file://backend/src/modules/auth/controllers/auth.controller.ts)
- [auth.service.ts](file://backend/src/modules/auth/services/auth.service.ts)
- [jwt.strategy.ts](file://backend/src/modules/auth/strategies/jwt.strategy.ts)
- [local.strategy.ts](file://backend/src/modules/auth/strategies/local.strategy.ts)
- [require-permission.guard.ts](file://backend/src/modules/rbac/guards/require-permission.guard.ts)
- [rbac.service.ts](file://backend/src/modules/rbac/services/rbac.service.ts)
- [security.headers.middleware.ts](file://backend/src/common/middlewares/security.headers.middleware.ts)
- [input.validation.pipe.ts](file://backend/src/common/pipes/input.validation.pipe.ts)
- [audit.middleware.ts](file://backend/src/common/middlewares/audit.middleware.ts)
- [file.upload.middleware.ts](file://backend/src/common/middlewares/file.upload.middleware.ts)
- [multi.tenant.middleware.ts](file://backend/src/common/middlewares/multi.tenant.middleware.ts)
- [env.config.ts](file://backend/src/config/env.config.ts)
- [database.config.ts](file://backend/src/config/database.config.ts)

## Architecture Overview
The request lifecycle integrates multiple security layers:
- Global middlewares set security headers, parse and validate inputs, log audit events, and scope requests to tenants.
- Controllers invoke auth services to authenticate users and issue tokens.
- Guards check permissions before controllers execute business logic.
- Database layer enforces multi-tenant constraints defined by migrations.

```mermaid
sequenceDiagram
participant Client as "Client"
participant App as "Express App"
participant SecHeaders as "Security Headers Middleware"
participant CORS as "CORS Config"
participant InputPipe as "Input Validation Pipe"
participant Audit as "Audit Middleware"
participant Tenant as "Multi-Tenant Middleware"
participant AuthCtrl as "Auth Controller"
participant AuthService as "Auth Service"
participant Guard as "Require Permission Guard"
participant RBAC as "RBAC Service"
participant DB as "Database"
Client->>App : "HTTP Request"
App->>SecHeaders : "Apply security headers"
App->>CORS : "Validate origin/methods"
App->>InputPipe : "Validate body/query params"
App->>Audit : "Log request metadata"
App->>Tenant : "Resolve tenant context"
alt "Authentication required"
App->>AuthCtrl : "Handle login/token"
AuthCtrl->>AuthService : "Verify credentials"
AuthService->>DB : "Query user"
DB-->>AuthService : "User record"
AuthService-->>AuthCtrl : "JWT issued"
AuthCtrl-->>Client : "Token response"
else "Protected resource"
App->>Guard : "Check permissions"
Guard->>RBAC : "Evaluate role/permission"
RBAC->>DB : "Fetch roles/permissions"
DB-->>RBAC : "Policy data"
RBAC-->>Guard : "Allow/Deny"
Guard-->>App : "Proceed or reject"
end
```

**Diagram sources**
- [app.ts](file://backend/src/app.ts)
- [security.headers.middleware.ts](file://backend/src/common/middlewares/security.headers.middleware.ts)
- [cors.config.ts](file://backend/src/config/cors.config.ts)
- [input.validation.pipe.ts](file://backend/src/common/pipes/input.validation.pipe.ts)
- [audit.middleware.ts](file://backend/src/common/middlewares/audit.middleware.ts)
- [multi.tenant.middleware.ts](file://backend/src/common/middlewares/multi.tenant.middleware.ts)
- [auth.controller.ts](file://backend/src/modules/auth/controllers/auth.controller.ts)
- [auth.service.ts](file://backend/src/modules/auth/services/auth.service.ts)
- [require-permission.guard.ts](file://backend/src/modules/rbac/guards/require-permission.guard.ts)
- [rbac.service.ts](file://backend/src/modules/rbac/services/rbac.service.ts)

## Detailed Component Analysis

### Authentication System (JWT + Local Strategy)
- Login flow validates credentials via local strategy and issues JWTs through the auth service.
- Protected routes rely on JWT strategy to extract and verify tokens.
- Secure logout clears server-side state and invalidates sessions where applicable.

```mermaid
sequenceDiagram
participant FE as "Frontend"
participant AC as "Auth Controller"
participant AS as "Auth Service"
participant LS as "Local Strategy"
participant JS as "JWT Strategy"
participant DB as "Database"
FE->>AC : "POST /auth/login"
AC->>LS : "Authenticate(username,password)"
LS->>AS : "Verify credentials"
AS->>DB : "Find user"
DB-->>AS : "User record"
AS-->>LS : "Success/Failure"
LS-->>AC : "User object"
AC->>AS : "Generate JWT"
AS-->>FE : "Token payload"
FE->>JS : "Attach Authorization header"
JS->>DB : "Optional token/user lookup"
JS-->>FE : "Context attached"
```

**Diagram sources**
- [auth.controller.ts](file://backend/src/modules/auth/controllers/auth.controller.ts)
- [auth.service.ts](file://backend/src/modules/auth/services/auth.service.ts)
- [local.strategy.ts](file://backend/src/modules/auth/strategies/local.strategy.ts)
- [jwt.strategy.ts](file://backend/src/modules/auth/strategies/jwt.strategy.ts)

**Section sources**
- [auth.controller.ts](file://backend/src/modules/auth/controllers/auth.controller.ts)
- [auth.service.ts](file://backend/src/modules/auth/services/auth.service.ts)
- [local.strategy.ts](file://backend/src/modules/auth/strategies/local.strategy.ts)
- [jwt.strategy.ts](file://backend/src/modules/auth/strategies/jwt.strategy.ts)
- [SECURE-LOGOUT-IMPLEMENTATION.md](file://docs/autres/SECURE-LOGOUT-IMPLEMENTATION.md)

### Role-Based Access Control (RBAC)
- RequirePermissionGuard evaluates user roles/permissions against route requirements.
- RBACService queries role-permission mappings and supports multi-tenant scoping.
- Migrations define RBAC schema and seed data.

```mermaid
flowchart TD
Start(["Request enters protected route"]) --> CheckGuard["RequirePermissionGuard invoked"]
CheckGuard --> LoadRoles["RBACService loads roles/permissions"]
LoadRoles --> ScopeTenant["Scope by tenant context"]
ScopeTenant --> Evaluate{"Has required permission?"}
Evaluate --> |Yes| Allow["Proceed to controller"]
Evaluate --> |No| Deny["Return 403 Forbidden"]
```

**Diagram sources**
- [require-permission.guard.ts](file://backend/src/modules/rbac/guards/require-permission.guard.ts)
- [rbac.service.ts](file://backend/src/modules/rbac/services/rbac.service.ts)
- [migrate-rbac-v3.sql](file://backend/database/migrations/migrate-rbac-v3.sql)

**Section sources**
- [require-permission.guard.ts](file://backend/src/modules/rbac/guards/require-permission.guard.ts)
- [rbac.service.ts](file://backend/src/modules/rbac/services/rbac.service.ts)
- [migrate-rbac-v3.sql](file://backend/database/migrations/migrate-rbac-v3.sql)

### Multi-Tenant Security Isolation
- Multi-tenant middleware resolves establishment context from request headers or session.
- Database migrations enforce tenant-scoped constraints and limits.
- Tests validate that cross-tenant data access is blocked.

```mermaid
classDiagram
class MultiTenantMiddleware {
+resolveTenant(req)
+enforceScoping(req,res,next)
}
class RBACService {
+hasPermission(userId, permission, tenantId)
}
class AuthController {
+login(req,res)
}
MultiTenantMiddleware --> RBACService : "uses tenant context"
AuthController --> MultiTenantMiddleware : "resolves tenant"
```

**Diagram sources**
- [multi.tenant.middleware.ts](file://backend/src/common/middlewares/multi.tenant.middleware.ts)
- [rbac.service.ts](file://backend/src/modules/rbac/services/rbac.service.ts)
- [auth.controller.ts](file://backend/src/modules/auth/controllers/auth.controller.ts)
- [050-multi-tenant-v3-max-etablissements.sql](file://backend/database/migrations/050-multi-tenant-v3-max-etablissements.sql)
- [test-multi-tenant-isolation.test.ts](file://backend/test/multi-tenant-isolation.test.ts)

**Section sources**
- [multi.tenant.middleware.ts](file://backend/src/common/middlewares/multi.tenant.middleware.ts)
- [050-multi-tenant-v3-max-etablissements.sql](file://backend/database/migrations/050-multi-tenant-v3-max-etablissements.sql)
- [test-multi-tenant-isolation.test.ts](file://backend/test/multi-tenant-isolation.test.ts)

### Password Hashing and Session Management
- Password hashing uses industry-standard algorithms configured via environment variables.
- Session management integrates with secure cookie policies and optional Redis-backed stores.
- Two-level blocking mechanism mitigates brute-force attacks during authentication.

Best practices applied:
- Salted hashing with configurable cost factor.
- Secure, HttpOnly cookies for session identifiers.
- Rate limiting and account lockout thresholds.

**Section sources**
- [env.config.ts](file://backend/src/config/env.config.ts)
- [SYSTEME-BLOCAGE-AUTH-DEUX-NIVEAUX.md](file://docs/SYSTEME-BLOCAGE-AUTH-DEUX-NIVEAUX.md)
- [SECURE-LOGOUT-IMPLEMENTATION.md](file://docs/autres/SECURE-LOGOUT-IMPLEMENTATION.md)

### Input Validation Strategies
- Centralized validation pipe enforces schema rules on request bodies and query parameters.
- Custom validators prevent injection and malformed payloads.
- Error responses are sanitized to avoid leaking internal details.

```mermaid
flowchart TD
Req["Incoming Request"] --> Parse["Parse JSON/Form"]
Parse --> Validate["Validation Pipe"]
Validate --> Valid{"Valid?"}
Valid --> |No| Err["Structured error response"]
Valid --> |Yes| Next["Pass to next middleware/controller"]
```

**Diagram sources**
- [input.validation.pipe.ts](file://backend/src/common/pipes/input.validation.pipe.ts)

**Section sources**
- [input.validation.pipe.ts](file://backend/src/common/pipes/input.validation.pipe.ts)

### Audit Logging System
- Audit middleware captures security-relevant events such as login attempts, permission denials, and tenant resolution.
- Logs include timestamps, user identity, action type, and outcome.
- Supports structured logging for analysis and alerting.

**Section sources**
- [audit.middleware.ts](file://backend/src/common/middlewares/audit.middleware.ts)

### Security Headers and CORS Configuration
- Security headers middleware applies recommended directives (e.g., HSTS, X-Frame-Options, CSP).
- CORS configuration restricts allowed origins, methods, and credentials.
- Environment-driven toggles allow fine-grained control per deployment.

**Section sources**
- [security.headers.middleware.ts](file://backend/src/common/middlewares/security.headers.middleware.ts)
- [cors.config.ts](file://backend/src/config/cors.config.ts)

### Secure API Communication
- HTTPS termination enforced at reverse proxy; backend trusts upstream TLS.
- Strict transport security and certificate pinning guidance provided in deployment docs.
- Token transmission restricted to secure channels.

### File Upload Security
- File upload middleware enforces size limits, MIME type checks, and extension whitelisting.
- Stored files are isolated per tenant and served via controlled endpoints.
- Virus scanning hooks can be integrated at upload time.

**Section sources**
- [file.upload.middleware.ts](file://backend/src/common/middlewares/file.upload.middleware.ts)

### Vulnerability Mitigation Approaches
- Input validation prevents injection and XSS vectors.
- RBAC ensures least privilege across modules.
- Multi-tenant scoping prevents cross-tenant data leakage.
- Brute-force protection reduces credential stuffing risk.
- Security headers mitigate common web vulnerabilities.

**Section sources**
- [input.validation.pipe.ts](file://backend/src/common/pipes/input.validation.pipe.ts)
- [require-permission.guard.ts](file://backend/src/modules/rbac/guards/require-permission.guard.ts)
- [multi.tenant.middleware.ts](file://backend/src/common/middlewares/multi.tenant.middleware.ts)
- [SYSTEME-BLOCAGE-AUTH-DEUX-NIVEAUX.md](file://docs/SYSTEME-BLOCAGE-AUTH-DEUX-NIVEAUX.md)
- [security.headers.middleware.ts](file://backend/src/common/middlewares/security.headers.middleware.ts)

### Compliance Considerations and Best Practices
- Data minimization and purpose limitation in audit logs.
- Retention policies for sensitive logs and session data.
- Regular rotation of secrets and tokens.
- Periodic review of RBAC policies and tenant boundaries.
- Adherence to OWASP Top 10 and GDPR principles.

## Enhanced Route Protection

**Updated** Enhanced GET route protection using requirePermission middleware for comprehensive authorization enforcement across all HTTP methods.

The requirePermission middleware has been strengthened to provide consistent authorization checks for GET routes, ensuring that read operations are properly secured alongside write operations. This enhancement addresses potential security gaps where GET endpoints might have been less strictly protected than mutation endpoints.

Key improvements include:
- Consistent permission checking across all HTTP methods (GET, POST, PUT, DELETE)
- Enhanced middleware chain integration for better performance
- Improved error handling for unauthorized access attempts
- Better audit logging for permission denial events

```mermaid
sequenceDiagram
participant Client as "Client"
participant Guard as "RequirePermission Guard"
participant RBAC as "RBAC Service"
participant Controller as "Controller"
Client->>Guard : "GET /api/resource"
Guard->>RBAC : "Check permission"
RBAC->>RBAC : "Evaluate user roles"
RBAC-->>Guard : "Permission result"
alt "Permission granted"
Guard->>Controller : "Execute handler"
Controller-->>Client : "Response"
else "Permission denied"
Guard-->>Client : "403 Forbidden"
end
```

**Diagram sources**
- [require-permission.guard.ts](file://backend/src/modules/rbac/guards/require-permission.guard.ts)
- [rbac.service.ts](file://backend/src/modules/rbac/services/rbac.service.ts)

**Section sources**
- [require-permission.guard.ts](file://backend/src/modules/rbac/guards/require-permission.guard.ts)
- [rbac.service.ts](file://backend/src/modules/rbac/services/rbac.service.ts)

## Frontend Permission Controls

**New** Permission-based sidebar filtering in frontend for improved access control visibility and user experience.

The frontend now implements dynamic sidebar filtering based on user permissions, providing a more intuitive interface that only displays accessible features. This enhancement improves both security and usability by preventing users from even seeing options they cannot access.

Features include:
- Dynamic menu rendering based on current user permissions
- Real-time permission evaluation for navigation items
- Graceful fallback for missing permissions
- Integration with existing RBAC system

```mermaid
flowchart TD
UserLogin["User Login"] --> FetchPermissions["Fetch User Permissions"]
FetchPermissions --> FilterSidebar["Filter Sidebar Items"]
FilterSidebar --> RenderMenu["Render Accessible Menu"]
RenderMenu --> UserNavigation["User Navigation"]
UserNavigation --> CheckRoute["Check Route Permission"]
CheckRoute --> |Allowed| ShowContent["Show Content"]
CheckRoute --> |Denied| Redirect["Redirect to Home"]
```

**Diagram sources**
- [require-permission.guard.ts](file://backend/src/modules/rbac/guards/require-permission.guard.ts)
- [rbac.service.ts](file://backend/src/modules/rbac/services/rbac.service.ts)

**Section sources**
- [require-permission.guard.ts](file://backend/src/modules/rbac/guards/require-permission.guard.ts)
- [rbac.service.ts](file://backend/src/modules/rbac/services/rbac.service.ts)

## Organizational Unit Security

**New** Strengthened security controls for organizational unit management with enhanced guards and modals.

Organizational unit management now includes comprehensive security measures including enhanced guards for CRUD operations and secure modal dialogs for sensitive operations like deletion and modification. These controls ensure that only authorized personnel can manage organizational structures.

Security enhancements include:
- Enhanced guards for all organizational unit operations
- Secure confirmation modals for destructive actions
- Permission-based UI element visibility
- Audit logging for all organizational changes
- Multi-tenant isolation for organizational data

```mermaid
sequenceDiagram
participant User as "Authorized User"
participant Modal as "Security Modal"
participant Guard as "Operation Guard"
participant Service as "Org Service"
User->>Modal : "Initiate Delete Operation"
Modal->>User : "Confirm Action"
User->>Modal : "Confirm Deletion"
Modal->>Guard : "Check Permissions"
Guard->>Guard : "Validate User Rights"
alt "Authorized"
Guard->>Service : "Execute Delete"
Service-->>User : "Success Response"
else "Unauthorized"
Guard-->>User : "Access Denied"
end
```

**Diagram sources**
- [require-permission.guard.ts](file://backend/src/modules/rbac/guards/require-permission.guard.ts)
- [rbac.service.ts](file://backend/src/modules/rbac/services/rbac.service.ts)

**Section sources**
- [require-permission.guard.ts](file://backend/src/modules/rbac/guards/require-permission.guard.ts)
- [rbac.service.ts](file://backend/src/modules/rbac/services/rbac.service.ts)

## Dependency Analysis
Security components depend on configuration and database layers, while middlewares orchestrate request processing. RBAC depends on tenant context and user roles.

```mermaid
graph LR
Env["env.config.ts"] --> App["app.ts"]
DBConf["database.config.ts"] --> App
CORS["cors.config.ts"] --> App
SecHdr["security.headers.middleware.ts"] --> App
InputVal["input.validation.pipe.ts"] --> App
Audit["audit.middleware.ts"] --> App
Tenant["multi.tenant.middleware.ts"] --> App
AuthCtrl["auth.controller.ts"] --> App
AuthSvc["auth.service.ts"] --> AuthCtrl
JWTStrat["jwt.strategy.ts"] --> AuthSvc
LocalStrat["local.strategy.ts"] --> AuthSvc
PermGuard["require-permission.guard.ts"] --> App
RBAC["rbac.service.ts"] --> PermGuard
DBMig1["027-auth-multi-mode.sql"] --> DBConf
DBMig2["migrate-rbac-v3.sql"] --> DBConf
DBMig3["050-multi-tenant-v3-max-etablissements.sql"] --> DBConf
```

**Diagram sources**
- [env.config.ts](file://backend/src/config/env.config.ts)
- [database.config.ts](file://backend/src/config/database.config.ts)
- [cors.config.ts](file://backend/src/config/cors.config.ts)
- [app.ts](file://backend/src/app.ts)
- [security.headers.middleware.ts](file://backend/src/common/middlewares/security.headers.middleware.ts)
- [input.validation.pipe.ts](file://backend/src/common/pipes/input.validation.pipe.ts)
- [audit.middleware.ts](file://backend/src/common/middlewares/audit.middleware.ts)
- [multi.tenant.middleware.ts](file://backend/src/common/middlewares/multi.tenant.middleware.ts)
- [auth.controller.ts](file://backend/src/modules/auth/controllers/auth.controller.ts)
- [auth.service.ts](file://backend/src/modules/auth/services/auth.service.ts)
- [jwt.strategy.ts](file://backend/src/modules/auth/strategies/jwt.strategy.ts)
- [local.strategy.ts](file://backend/src/modules/auth/strategies/local.strategy.ts)
- [require-permission.guard.ts](file://backend/src/modules/rbac/guards/require-permission.guard.ts)
- [rbac.service.ts](file://backend/src/modules/rbac/services/rbac.service.ts)
- [027-auth-multi-mode.sql](file://backend/database/migrations/027-auth-multi-mode.sql)
- [migrate-rbac-v3.sql](file://backend/database/migrations/migrate-rbac-v3.sql)
- [050-multi-tenant-v3-max-etablissements.sql](file://backend/database/migrations/050-multi-tenant-v3-max-etablissements.sql)

**Section sources**
- [app.ts](file://backend/src/app.ts)
- [env.config.ts](file://backend/src/config/env.config.ts)
- [database.config.ts](file://backend/src/config/database.config.ts)
- [cors.config.ts](file://backend/src/config/cors.config.ts)
- [auth.controller.ts](file://backend/src/modules/auth/controllers/auth.controller.ts)
- [auth.service.ts](file://backend/src/modules/auth/services/auth.service.ts)
- [jwt.strategy.ts](file://backend/src/modules/auth/strategies/jwt.strategy.ts)
- [local.strategy.ts](file://backend/src/modules/auth/strategies/local.strategy.ts)
- [require-permission.guard.ts](file://backend/src/modules/rbac/guards/require-permission.guard.ts)
- [rbac.service.ts](file://backend/src/modules/rbac/services/rbac.service.ts)
- [027-auth-multi-mode.sql](file://backend/database/migrations/027-auth-multi-mode.sql)
- [migrate-rbac-v3.sql](file://backend/database/migrations/migrate-rbac-v3.sql)
- [050-multi-tenant-v3-max-etablissements.sql](file://backend/database/migrations/050-multi-tenant-v3-max-etablissements.sql)

## Performance Considerations
- Minimize RBAC lookups by caching role-permission mappings when safe.
- Use efficient indexes for tenant-scoped queries.
- Avoid heavy operations in global middlewares; offload to background jobs where possible.
- Tune JWT payload size to reduce overhead.
- Optimize frontend permission checks for better user experience.

## Troubleshooting Guide
- Authentication failures: Review two-level blocking configuration and audit logs for repeated attempts.
- Permission denials: Verify RBAC assignments and tenant scoping; ensure migration v3 is applied.
- CORS errors: Confirm allowed origins and credentials settings match frontend domain.
- Multi-tenant leaks: Run isolation tests and inspect tenant middleware resolution.
- Input validation errors: Inspect validation schemas and adjust client payloads accordingly.
- Enhanced route protection issues: Check requirePermission middleware configuration and permission definitions.
- Frontend permission display problems: Verify permission synchronization between backend and frontend.
- Organizational unit access issues: Review enhanced guards and modal security configurations.

**Section sources**
- [SYSTEME-BLOCAGE-AUTH-DEUX-NIVEAUX.md](file://docs/SYSTEME-BLOCAGE-AUTH-DEUX-NIVEAUX.md)
- [migrate-rbac-v3.sql](file://backend/database/migrations/migrate-rbac-v3.sql)
- [cors.config.ts](file://backend/src/config/cors.config.ts)
- [test-multi-tenant-isolation.test.ts](file://backend/test/multi-tenant-isolation.test.ts)
- [input.validation.pipe.ts](file://backend/src/common/pipes/input.validation.pipe.ts)
- [require-permission.guard.ts](file://backend/src/modules/rbac/guards/require-permission.guard.ts)

## Conclusion
The security architecture combines layered defenses: robust authentication with JWT, granular RBAC enforcement, strict multi-tenant isolation, comprehensive input validation, audit logging, and hardened HTTP configuration. Recent enhancements include strengthened GET route protection, permission-based frontend filtering, and improved organizational unit security controls. Together, these mechanisms protect sensitive data, limit attack surfaces, and support compliance objectives. Continuous monitoring, periodic reviews, and adherence to best practices will sustain a strong security posture.

## Appendices
- Testing guidance for security scenarios and penetration testing recommendations.
- Deployment hardening checklist including TLS, secrets management, and container security.

**Section sources**
- [GUIDE-TEST-SECURITE.md](file://docs/guides/GUIDE-TEST-SECURITE.md)