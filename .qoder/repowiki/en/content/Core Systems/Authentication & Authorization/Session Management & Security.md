# Session Management & Security

<cite>
**Referenced Files in This Document**
- [app.ts](file://backend/src/app.ts)
- [index.ts](file://backend/src/index.ts)
- [route-registry.ts](file://backend/src/routes/route-registry.ts)
- [env.config.ts](file://backend/src/config/env.config.ts)
- [database.config.ts](file://backend/src/config/database.config.ts)
- [auth.controller.ts](file://backend/src/modules/auth/controllers/auth.controller.ts)
- [auth.service.ts](file://backend/src/modules/auth/services/auth.service.ts)
- [jwt.strategy.ts](file://backend/src/modules/auth/strategies/jwt.strategy.ts)
- [refresh-token.service.ts](file://backend/src/modules/auth/services/refresh-token.service.ts)
- [session-manager.service.ts](file://backend/src/modules/auth/services/session-manager.service.ts)
- [lockout.service.ts](file://backend/src/modules/auth/services/lockout.service.ts)
- [ip-blocker.middleware.ts](file://backend/src/common/middlewares/ip-blocker.middleware.ts)
- [audit-trail.service.ts](file://backend/src/modules/audit/services/audit-trail.service.ts)
- [login-attempts.repository.ts](file://backend/src/modules/auth/repositories/login-attempts.repository.ts)
- [security-events.entity.ts](file://backend/src/modules/auth/entities/security-events.entity.ts)
- [csrf-protection.middleware.ts](file://backend/src/common/middlewares/csrf-protection.middleware.ts)
- [xss-prevention.middleware.ts](file://backend/src/common/middlewares/xss-prevention.middleware.ts)
- [rate-limit.middleware.ts](file://backend/src/common/middlewares/rate-limit.middleware.ts)
- [027-auth-multi-mode.sql](file://backend/database/migrations/027-auth-multi-mode.sql)
- [IMPLEMENTATION-SESSION-RESUME-FINAL.md](file://docs/implementations/IMPLEMENTATION-SESSION-RESUME-FINAL.md)
- [SYSTEME-BLOCAGE-AUTH-DEUX-NIVEAUX.md](file://docs/SYSTEME-BLOCAGE-AUTH-DEUX-NIVEAUX.md)
- [GUIDE-TEST-SECURITE.md](file://docs/guides/GUIDE-TEST-SECURITE.md)
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
This document explains eLISAschool’s session management and security features with a focus on:
- JWT-based sessions, refresh token rotation, and concurrent session control
- Account lockout mechanism with configurable thresholds, IP-based blocking, and progressive security measures
- Audit trail integration for security events, login attempt tracking, and suspicious activity detection
- Practical configuration examples, custom lockout rules, and monitoring metrics
- Session cleanup procedures, token expiration handling, and production best practices
- Web security considerations including CSRF protection and XSS prevention

The goal is to provide both high-level understanding and actionable guidance for developers and operators deploying secure, resilient authentication flows.

## Project Structure
Security-related functionality is implemented across dedicated modules and shared middleware:
- Authentication module (controllers, services, strategies, repositories, entities)
- Shared middlewares (IP blocker, CSRF, XSS, rate limiting)
- Configuration (environment variables, database settings)
- Route registry (applies guards and middlewares)
- Audit module (security event logging)
- Database migrations (schema changes for auth modes and related tables)

```mermaid
graph TB
subgraph "App Bootstrap"
A["app.ts"]
B["index.ts"]
C["routes/route-registry.ts"]
end
subgraph "Auth Module"
AC["controllers/auth.controller.ts"]
AS["services/auth.service.ts"]
JS["strategies/jwt.strategy.ts"]
RTS["services/refresh-token.service.ts"]
SMS["services/session-manager.service.ts"]
LKS["services/lockout.service.ts"]
LAR["repositories/login-attempts.repository.ts"]
SE["entities/security-events.entity.ts"]
end
subgraph "Shared Middlewares"
IPB["middlewares/ip-blocker.middleware.ts"]
CSRF["middlewares/csrf-protection.middleware.ts"]
XSS["middlewares/xss-prevention.middleware.ts"]
RL["middlewares/rate-limit.middleware.ts"]
end
subgraph "Audit Module"
ATS["services/audit-trail.service.ts"]
end
subgraph "Config"
ENV["config/env.config.ts"]
DB["config/database.config.ts"]
end
A --> C
B --> A
C --> AC
AC --> AS
AS --> JS
AS --> RTS
AS --> SMS
AS --> LKS
LKS --> LAR
AS --> ATS
IPB --> AC
CSRF --> AC
XSS --> AC
RL --> AC
ENV --> A
DB --> A
```

**Diagram sources**
- [app.ts](file://backend/src/app.ts)
- [index.ts](file://backend/src/index.ts)
- [route-registry.ts](file://backend/src/routes/route-registry.ts)
- [auth.controller.ts](file://backend/src/modules/auth/controllers/auth.controller.ts)
- [auth.service.ts](file://backend/src/modules/auth/services/auth.service.ts)
- [jwt.strategy.ts](file://backend/src/modules/auth/strategies/jwt.strategy.ts)
- [refresh-token.service.ts](file://backend/src/modules/auth/services/refresh-token.service.ts)
- [session-manager.service.ts](file://backend/src/modules/auth/services/session-manager.service.ts)
- [lockout.service.ts](file://backend/src/modules/auth/services/lockout.service.ts)
- [ip-blocker.middleware.ts](file://backend/src/common/middlewares/ip-blocker.middleware.ts)
- [csrf-protection.middleware.ts](file://backend/src/common/middlewares/csrf-protection.middleware.ts)
- [xss-prevention.middleware.ts](file://backend/src/common/middlewares/xss-prevention.middleware.ts)
- [rate-limit.middleware.ts](file://backend/src/common/middlewares/rate-limit.middleware.ts)
- [audit-trail.service.ts](file://backend/src/modules/audit/services/audit-trail.service.ts)
- [env.config.ts](file://backend/src/config/env.config.ts)
- [database.config.ts](file://backend/src/config/database.config.ts)

**Section sources**
- [app.ts](file://backend/src/app.ts)
- [index.ts](file://backend/src/index.ts)
- [route-registry.ts](file://backend/src/routes/route-registry.ts)
- [env.config.ts](file://backend/src/config/env.config.ts)
- [database.config.ts](file://backend/src/config/database.config.ts)

## Core Components
- JWT Strategy: Validates access tokens, extracts claims, and enforces session context.
- Auth Service: Orchestrates login, logout, token issuance, refresh token rotation, and lockout checks.
- Refresh Token Service: Manages rotation, revocation, and storage of refresh tokens.
- Session Manager: Tracks active sessions per user, enforces concurrency limits, and handles cleanup.
- Lockout Service: Applies progressive lockouts based on failed attempts, integrates with IP blocking.
- IP Blocker Middleware: Blocks requests from IPs exceeding thresholds or flagged by policy.
- CSRF Protection Middleware: Enforces CSRF tokens for state-changing operations.
- XSS Prevention Middleware: Sanitizes inputs and sets safe headers.
- Rate Limit Middleware: Throttles endpoints to mitigate brute-force attacks.
- Audit Trail Service: Persists security events for compliance and analysis.
- Login Attempts Repository: Stores and queries login attempt history.
- Security Events Entity: Defines schema for audit records.

Key responsibilities and interactions are detailed in the architecture and component sections below.

**Section sources**
- [jwt.strategy.ts](file://backend/src/modules/auth/strategies/jwt.strategy.ts)
- [auth.service.ts](file://backend/src/modules/auth/services/auth.service.ts)
- [refresh-token.service.ts](file://backend/src/modules/auth/services/refresh-token.service.ts)
- [session-manager.service.ts](file://backend/src/modules/auth/services/session-manager.service.ts)
- [lockout.service.ts](file://backend/src/modules/auth/services/lockout.service.ts)
- [ip-blocker.middleware.ts](file://backend/src/common/middlewares/ip-blocker.middleware.ts)
- [csrf-protection.middleware.ts](file://backend/src/common/middlewares/csrf-protection.middleware.ts)
- [xss-prevention.middleware.ts](file://backend/src/common/middlewares/xss-prevention.middleware.ts)
- [rate-limit.middleware.ts](file://backend/src/common/middlewares/rate-limit.middleware.ts)
- [audit-trail.service.ts](file://backend/src/modules/audit/services/audit-trail.service.ts)
- [login-attempts.repository.ts](file://backend/src/modules/auth/repositories/login-attempts.repository.ts)
- [security-events.entity.ts](file://backend/src/modules/auth/entities/security-events.entity.ts)

## Architecture Overview
The authentication flow combines JWT access tokens with rotating refresh tokens, enforced by session controls and progressive lockout policies. Requests traverse shared middlewares for IP blocking, CSRF validation, XSS hardening, and rate limiting before reaching controllers and services.

```mermaid
sequenceDiagram
participant Client as "Client"
participant API as "Auth Controller"
participant Svc as "Auth Service"
participant RT as "Refresh Token Service"
participant SM as "Session Manager"
participant LK as "Lockout Service"
participant AT as "Audit Trail Service"
participant DB as "Database"
Client->>API : "POST /auth/login"
API->>LK : "Check lockout (user/IP)"
LK-->>API : "Allowed/Denied"
API->>Svc : "Authenticate credentials"
Svc->>DB : "Validate user"
DB-->>Svc : "User record"
Svc->>SM : "Create/validate session"
SM-->>Svc : "Session ID"
Svc->>RT : "Issue access + refresh tokens"
RT-->>Svc : "Tokens"
Svc->>AT : "Log successful login"
AT-->>Svc : "Persisted"
Svc-->>API : "Login response"
API-->>Client : "{accessToken, refreshToken}"
Note over Client,API : "Subsequent requests use accessToken<br/>Refresh flow rotates refreshToken"
```

**Diagram sources**
- [auth.controller.ts](file://backend/src/modules/auth/controllers/auth.controller.ts)
- [auth.service.ts](file://backend/src/modules/auth/services/auth.service.ts)
- [refresh-token.service.ts](file://backend/src/modules/auth/services/refresh-token.service.ts)
- [session-manager.service.ts](file://backend/src/modules/auth/services/session-manager.service.ts)
- [lockout.service.ts](file://backend/src/modules/auth/services/lockout.service.ts)
- [audit-trail.service.ts](file://backend/src/modules/audit/services/audit-trail.service.ts)

## Detailed Component Analysis

### JWT Session Handling
- Access tokens carry minimal claims and short lifetimes; refresh tokens rotate on each use.
- The strategy validates tokens and attaches user context to the request.
- Session IDs are bound to tokens to support concurrent session control and revocation.

```mermaid
classDiagram
class JwtStrategy {
+validate(token) UserContext
}
class AuthService {
+login(credentials) AuthResult
+logout(sessionId) void
+refresh(refreshToken) Tokens
}
class RefreshTokenService {
+issue(userId, sessionId) Tokens
+rotate(oldRefreshToken) Tokens
+revoke(refreshToken) void
}
class SessionManager {
+createSession(userId, metadata) string
+invalidateSession(sessionId) void
+getActiveSessions(userId) Session[]
}
JwtStrategy --> AuthService : "used by"
AuthService --> RefreshTokenService : "issues/rotates"
AuthService --> SessionManager : "tracks sessions"
```

**Diagram sources**
- [jwt.strategy.ts](file://backend/src/modules/auth/strategies/jwt.strategy.ts)
- [auth.service.ts](file://backend/src/modules/auth/services/auth.service.ts)
- [refresh-token.service.ts](file://backend/src/modules/auth/services/refresh-token.service.ts)
- [session-manager.service.ts](file://backend/src/modules/auth/services/session-manager.service.ts)

**Section sources**
- [jwt.strategy.ts](file://backend/src/modules/auth/strategies/jwt.strategy.ts)
- [auth.service.ts](file://backend/src/modules/auth/services/auth.service.ts)
- [refresh-token.service.ts](file://backend/src/modules/auth/services/refresh-token.service.ts)
- [session-manager.service.ts](file://backend/src/modules/auth/services/session-manager.service.ts)

### Refresh Token Rotation
- On each refresh, the old refresh token is revoked and a new one issued.
- Rotation ensures that compromised tokens cannot be reused indefinitely.
- Rotation failures trigger forced logout and require re-authentication.

```mermaid
flowchart TD
Start(["Refresh Request"]) --> Validate["Validate refreshToken"]
Validate --> Valid{"Valid?"}
Valid --> |No| Deny["Deny and log security event"]
Valid --> |Yes| Revoke["Revoke old refreshToken"]
Revoke --> Issue["Issue new accessToken + refreshToken"]
Issue --> Log["Log rotation event"]
Log --> End(["Return new tokens"])
Deny --> End
```

**Diagram sources**
- [refresh-token.service.ts](file://backend/src/modules/auth/services/refresh-token.service.ts)
- [audit-trail.service.ts](file://backend/src/modules/audit/services/audit-trail.service.ts)

**Section sources**
- [refresh-token.service.ts](file://backend/src/modules/auth/services/refresh-token.service.ts)
- [audit-trail.service.ts](file://backend/src/modules/audit/services/audit-trail.service.ts)

### Concurrent Session Management
- Each authenticated client receives a unique session identifier.
- Policies can limit the number of concurrent sessions per user.
- Administrators can revoke specific sessions or force logout all sessions.

```mermaid
sequenceDiagram
participant Admin as "Admin UI"
participant API as "Auth Controller"
participant SM as "Session Manager"
participant AT as "Audit Trail Service"
Admin->>API : "GET /sessions?userId=..."
API->>SM : "List active sessions"
SM-->>API : "Sessions[]"
API-->>Admin : "Sessions list"
Admin->>API : "DELETE /sessions/{sessionId}"
API->>SM : "Invalidate session"
SM-->>API : "OK"
API->>AT : "Log session revocation"
AT-->>API : "Persisted"
API-->>Admin : "Success"
```

**Diagram sources**
- [auth.controller.ts](file://backend/src/modules/auth/controllers/auth.controller.ts)
- [session-manager.service.ts](file://backend/src/modules/auth/services/session-manager.service.ts)
- [audit-trail.service.ts](file://backend/src/modules/audit/services/audit-trail.service.ts)

**Section sources**
- [auth.controller.ts](file://backend/src/modules/auth/controllers/auth.controller.ts)
- [session-manager.service.ts](file://backend/src/modules/auth/services/session-manager.service.ts)
- [audit-trail.service.ts](file://backend/src/modules/audit/services/audit-trail.service.ts)

### Account Lockout Mechanism
- Progressive lockout thresholds based on failed login attempts.
- Lockout applies per user and optionally per IP to mitigate distributed attacks.
- Integrates with audit trail and login attempts repository for visibility.

```mermaid
flowchart TD
Entry(["Login Attempt"]) --> CheckIP["Check IP blocklist"]
CheckIP --> BlockedIP{"IP blocked?"}
BlockedIP --> |Yes| RejectIP["Reject and log"]
BlockedIP --> |No| CheckUser["Check user lockout status"]
CheckUser --> Locked{"User locked?"}
Locked --> |Yes| RejectUser["Reject and log"]
Locked --> |No| Authenticate["Authenticate credentials"]
Authenticate --> Success{"Success?"}
Success --> |Yes| ResetAttempts["Reset failed attempts"]
ResetAttempts --> Allow["Allow login"]
Success --> |No| Increment["Increment failed attempts"]
Increment --> Threshold{"Exceeds threshold?"}
Threshold --> |Yes| ApplyLock["Apply lockout (time-based)"]
Threshold --> |No| Continue["Continue normal flow"]
ApplyLock --> Log["Log lockout event"]
Continue --> Log
Log --> Exit(["End"])
RejectIP --> Exit
RejectUser --> Exit
```

**Diagram sources**
- [lockout.service.ts](file://backend/src/modules/auth/services/lockout.service.ts)
- [ip-blocker.middleware.ts](file://backend/src/common/middlewares/ip-blocker.middleware.ts)
- [login-attempts.repository.ts](file://backend/src/modules/auth/repositories/login-attempts.repository.ts)
- [audit-trail.service.ts](file://backend/src/modules/audit/services/audit-trail.service.ts)

**Section sources**
- [lockout.service.ts](file://backend/src/modules/auth/services/lockout.service.ts)
- [ip-blocker.middleware.ts](file://backend/src/common/middlewares/ip-blocker.middleware.ts)
- [login-attempts.repository.ts](file://backend/src/modules/auth/repositories/login-attempts.repository.ts)
- [audit-trail.service.ts](file://backend/src/modules/audit/services/audit-trail.service.ts)

### IP-Based Blocking and Progressive Security
- IP addresses can be temporarily or permanently blocked based on policy.
- Progressive measures include escalating delays and stricter thresholds under attack conditions.
- Integration with rate limiting provides defense-in-depth against brute-force and credential stuffing.

```mermaid
classDiagram
class IpBlockerMiddleware {
+block(ip, reason) void
+isBlocked(ip) bool
+unblock(ip) void
}
class RateLimitMiddleware {
+throttle(key, windowMs, maxRequests) void
}
class LockoutService {
+applyPolicy(user, ip) LockoutDecision
}
IpBlockerMiddleware --> LockoutService : "delegates decisions"
RateLimitMiddleware --> IpBlockerMiddleware : "cooperates"
```

**Diagram sources**
- [ip-blocker.middleware.ts](file://backend/src/common/middlewares/ip-blocker.middleware.ts)
- [rate-limit.middleware.ts](file://backend/src/common/middlewares/rate-limit.middleware.ts)
- [lockout.service.ts](file://backend/src/modules/auth/services/lockout.service.ts)

**Section sources**
- [ip-blocker.middleware.ts](file://backend/src/common/middlewares/ip-blocker.middleware.ts)
- [rate-limit.middleware.ts](file://backend/src/common/middlewares/rate-limit.middleware.ts)
- [lockout.service.ts](file://backend/src/modules/auth/services/lockout.service.ts)

### Audit Trail Integration
- All security-relevant events are logged: login success/failure, lockouts, token rotations, session revocations, IP blocks.
- Logs are queryable for compliance and incident response.
- Suspicious activity detection leverages aggregated counts and thresholds.

```mermaid
sequenceDiagram
participant Svc as "Auth/Lockout Services"
participant Repo as "Login Attempts Repository"
participant Audit as "Audit Trail Service"
participant DB as "Database"
Svc->>Repo : "Record login attempt"
Repo->>DB : "Insert attempt"
Svc->>Audit : "Log security event"
Audit->>DB : "Insert event"
DB-->>Svc : "Acknowledged"
```

**Diagram sources**
- [login-attempts.repository.ts](file://backend/src/modules/auth/repositories/login-attempts.repository.ts)
- [audit-trail.service.ts](file://backend/src/modules/audit/services/audit-trail.service.ts)
- [security-events.entity.ts](file://backend/src/modules/auth/entities/security-events.entity.ts)

**Section sources**
- [login-attempts.repository.ts](file://backend/src/modules/auth/repositories/login-attempts.repository.ts)
- [audit-trail.service.ts](file://backend/src/modules/audit/services/audit-trail.service.ts)
- [security-events.entity.ts](file://backend/src/modules/auth/entities/security-events.entity.ts)

### Web Security Considerations
- CSRF Protection: Enforce origin checks and CSRF tokens for state-changing endpoints.
- XSS Prevention: Sanitize inputs, set Content-Security-Policy, and enforce safe headers.
- Rate Limiting: Protect sensitive endpoints from abuse.
- Secure Headers: Implement HSTS, X-Frame-Options, and other hardening headers via middleware.

```mermaid
flowchart TD
Req["Incoming Request"] --> CSRF["CSRF Validation"]
CSRF --> XSS["XSS Hardening"]
XSS --> RL["Rate Limiting"]
RL --> Next["Controller/Service"]
```

**Diagram sources**
- [csrf-protection.middleware.ts](file://backend/src/common/middlewares/csrf-protection.middleware.ts)
- [xss-prevention.middleware.ts](file://backend/src/common/middlewares/xss-prevention.middleware.ts)
- [rate-limit.middleware.ts](file://backend/src/common/middlewares/rate-limit.middleware.ts)

**Section sources**
- [csrf-protection.middleware.ts](file://backend/src/common/middlewares/csrf-protection.middleware.ts)
- [xss-prevention.middleware.ts](file://backend/src/common/middlewares/xss-prevention.middleware.ts)
- [rate-limit.middleware.ts](file://backend/src/common/middlewares/rate-limit.middleware.ts)

## Dependency Analysis
The following diagram shows key dependencies among core components:

```mermaid
graph LR
AC["auth.controller.ts"] --> AS["auth.service.ts"]
AS --> JS["jwt.strategy.ts"]
AS --> RTS["refresh-token.service.ts"]
AS --> SMS["session-manager.service.ts"]
AS --> LKS["lockout.service.ts"]
LKS --> LAR["login-attempts.repository.ts"]
AS --> ATS["audit-trail.service.ts"]
AC --> IPB["ip-blocker.middleware.ts"]
AC --> CSRF["csrf-protection.middleware.ts"]
AC --> XSS["xss-prevention.middleware.ts"]
AC --> RL["rate-limit.middleware.ts"]
```

**Diagram sources**
- [auth.controller.ts](file://backend/src/modules/auth/controllers/auth.controller.ts)
- [auth.service.ts](file://backend/src/modules/auth/services/auth.service.ts)
- [jwt.strategy.ts](file://backend/src/modules/auth/strategies/jwt.strategy.ts)
- [refresh-token.service.ts](file://backend/src/modules/auth/services/refresh-token.service.ts)
- [session-manager.service.ts](file://backend/src/modules/auth/services/session-manager.service.ts)
- [lockout.service.ts](file://backend/src/modules/auth/services/lockout.service.ts)
- [login-attempts.repository.ts](file://backend/src/modules/auth/repositories/login-attempts.repository.ts)
- [audit-trail.service.ts](file://backend/src/modules/audit/services/audit-trail.service.ts)
- [ip-blocker.middleware.ts](file://backend/src/common/middlewares/ip-blocker.middleware.ts)
- [csrf-protection.middleware.ts](file://backend/src/common/middlewares/csrf-protection.middleware.ts)
- [xss-prevention.middleware.ts](file://backend/src/common/middlewares/xss-prevention.middleware.ts)
- [rate-limit.middleware.ts](file://backend/src/common/middlewares/rate-limit.middleware.ts)

**Section sources**
- [auth.controller.ts](file://backend/src/modules/auth/controllers/auth.controller.ts)
- [auth.service.ts](file://backend/src/modules/auth/services/auth.service.ts)
- [jwt.strategy.ts](file://backend/src/modules/auth/strategies/jwt.strategy.ts)
- [refresh-token.service.ts](file://backend/src/modules/auth/services/refresh-token.service.ts)
- [session-manager.service.ts](file://backend/src/modules/auth/services/session-manager.service.ts)
- [lockout.service.ts](file://backend/src/modules/auth/services/lockout.service.ts)
- [login-attempts.repository.ts](file://backend/src/modules/auth/repositories/login-attempts.repository.ts)
- [audit-trail.service.ts](file://backend/src/modules/audit/services/audit-trail.service.ts)
- [ip-blocker.middleware.ts](file://backend/src/common/middlewares/ip-blocker.middleware.ts)
- [csrf-protection.middleware.ts](file://backend/src/common/middlewares/csrf-protection.middleware.ts)
- [xss-prevention.middleware.ts](file://backend/src/common/middlewares/xss-prevention.middleware.ts)
- [rate-limit.middleware.ts](file://backend/src/common/middlewares/rate-limit.middleware.ts)

## Performance Considerations
- Keep access tokens small and short-lived; rely on refresh tokens for long sessions.
- Use efficient indexing on login attempts and security events tables to support fast lookups.
- Cache lockout and IP block states in memory where appropriate, with persistence fallback.
- Batch audit writes when possible to reduce database overhead during high-volume events.
- Tune rate limiting windows and thresholds to balance security and usability.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- Invalid token errors: Verify JWT secret configuration and token expiry settings.
- Refresh failures: Ensure rotation logic revokes old tokens and persists new ones atomically.
- Unexpected lockouts: Review lockout thresholds and reset counters after successful logins.
- IP false positives: Inspect IP blocklist and adjust policies for trusted networks.
- Audit gaps: Confirm audit service is initialized and writing to the database.

Operational references:
- Security testing guide and implementation summaries provide practical steps for validating behavior.

**Section sources**
- [env.config.ts](file://backend/src/config/env.config.ts)
- [database.config.ts](file://backend/src/config/database.config.ts)
- [IMPLEMENTATION-SESSION-RESUME-FINAL.md](file://docs/implementations/IMPLEMENTATION-SESSION-RESUME-FINAL.md)
- [SYSTEME-BLOCAGE-AUTH-DEUX-NIVEAUX.md](file://docs/SYSTEME-BLOCAGE-AUTH-DEUX-NIVEAUX.md)
- [GUIDE-TEST-SECURITE.md](file://docs/guides/GUIDE-TEST-SECURITE.md)

## Conclusion
eLISAschool implements a robust, layered security model combining JWT sessions, rotating refresh tokens, concurrent session control, progressive lockouts, IP blocking, and comprehensive auditing. By configuring thresholds, enabling CSRF/XSS protections, and monitoring security metrics, teams can deploy a secure, resilient authentication system suitable for production environments.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices

### Configuration Examples
- Environment variables for JWT secrets, token lifetimes, lockout thresholds, and IP block durations.
- Database connection parameters for storing sessions, attempts, and audit logs.

**Section sources**
- [env.config.ts](file://backend/src/config/env.config.ts)
- [database.config.ts](file://backend/src/config/database.config.ts)

### Schema Notes
- Migration introducing multi-mode authentication and related structures.

**Section sources**
- [027-auth-multi-mode.sql](file://backend/database/migrations/027-auth-multi-mode.sql)

### Implementation References
- Session implementation summary and two-level auth blocking system documentation.
- Security testing guide for validating lockout, IP blocking, and audit trails.

**Section sources**
- [IMPLEMENTATION-SESSION-RESUME-FINAL.md](file://docs/implementations/IMPLEMENTATION-SESSION-RESUME-FINAL.md)
- [SYSTEME-BLOCAGE-AUTH-DEUX-NIVEAUX.md](file://docs/SYSTEME-BLOCAGE-AUTH-DEUX-NIVEAUX.md)
- [GUIDE-TEST-SECURITE.md](file://docs/guides/GUIDE-TEST-SECURITE.md)