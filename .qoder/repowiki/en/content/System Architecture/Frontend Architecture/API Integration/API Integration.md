# API Integration

<cite>
**Referenced Files in This Document**
- [frontend/src/lib/api-client.ts](file://frontend/src/lib/api-client.ts)
- [frontend/src/hooks/useAuth.ts](file://frontend/src/hooks/useAuth.ts)
- [frontend/src/features/auth/services/authService.ts](file://frontend/src/features/auth/services/authService.ts)
- [frontend/src/features/dashboard/services/dashboardService.ts](file://frontend/src/features/dashboard/services/dashboardService.ts)
- [frontend/src/features/notifications/services/notificationService.ts](file://frontend/src/features/notifications/services/notificationService.ts)
- [frontend/src/features/messagerie/services/messagingService.ts](file://frontend/src/features/messagerie/services/messagingService.ts)
- [frontend/src/features/files/services/fileService.ts](file://frontend/src/features/files/services/fileService.ts)
- [frontend/src/stores/authStore.ts](file://frontend/src/stores/authStore.ts)
- [frontend/src/config/env.config.ts](file://frontend/src/config/env.config.ts)
- [backend/src/modules/auth/controllers/auth.controller.ts](file://backend/src/modules/auth/controllers/auth.controller.ts)
- [backend/src/modules/auth/dto/login.dto.ts](file://backend/src/modules/auth/dto/login.dto.ts)
- [backend/src/modules/auth/dto/register.dto.ts](file://backend/src/modules/auth/dto/register.dto.ts)
- [backend/src/common/interceptors/error.interceptor.ts](file://backend/src/common/interceptors/error.interceptor.ts)
- [backend/src/common/interceptors/logging.interceptor.ts](file://backend/src/common/interceptors/logging.interceptor.ts)
- [backend/src/common/filters/global-exception.filter.ts](file://backend/src/common/filters/global-exception.filter.ts)
- [backend/src/routes/route-registry.ts](file://backend/src/routes/route-registry.ts)
- [backend/src/app.ts](file://backend/src/app.ts)
- [backend/package.json](file://backend/package.json)
- [frontend/package.json](file://frontend/package.json)
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
This document explains the API client integration layer used by the frontend to communicate with the backend. It covers centralized Axios configuration, authentication via interceptors, error handling and transformation, typed API methods generation from backend controllers and DTOs, retry mechanisms, offline support patterns, WebSocket integration for real-time features, file upload handling, API versioning strategies, and testing approaches including mock data management.

The goal is to provide a clear, progressive understanding for both technical and non-technical readers, with diagrams and references to specific source files.

## Project Structure
The API integration spans two main areas:
- Frontend: Centralized HTTP client, services per feature, hooks for auth state, stores for session persistence, and environment configuration.
- Backend: Controllers, DTOs, global filters and interceptors, route registry, and application bootstrap.

```mermaid
graph TB
subgraph "Frontend"
FE_API["api-client.ts"]
FE_AUTH_HOOK["useAuth.ts"]
FE_STORE["authStore.ts"]
FE_ENV["env.config.ts"]
FE_SVC_AUTH["authService.ts"]
FE_SVC_DASH["dashboardService.ts"]
FE_SVC_NOTIF["notificationService.ts"]
FE_SVC_MSG["messagingService.ts"]
FE_SVC_FILE["fileService.ts"]
end
subgraph "Backend"
BE_APP["app.ts"]
BE_ROUTES["route-registry.ts"]
BE_CTRL_AUTH["auth.controller.ts"]
BE_DTO_LOGIN["login.dto.ts"]
BE_DTO_REGISTER["register.dto.ts"]
BE_FILTER["global-exception.filter.ts"]
BE_INT_LOG["logging.interceptor.ts"]
BE_INT_ERR["error.interceptor.ts"]
end
FE_API --> FE_SVC_AUTH
FE_API --> FE_SVC_DASH
FE_API --> FE_SVC_NOTIF
FE_API --> FE_SVC_MSG
FE_API --> FE_SVC_FILE
FE_AUTH_HOOK --> FE_STORE
FE_SVC_AUTH --> FE_API
FE_SVC_DASH --> FE_API
FE_SVC_NOTIF --> FE_API
FE_SVC_MSG --> FE_API
FE_SVC_FILE --> FE_API
FE_API --> BE_ROUTES
BE_ROUTES --> BE_CTRL_AUTH
BE_CTRL_AUTH --> BE_DTO_LOGIN
BE_CTRL_AUTH --> BE_DTO_REGISTER
BE_APP --> BE_ROUTES
BE_APP --> BE_FILTER
BE_APP --> BE_INT_LOG
BE_APP --> BE_INT_ERR
```

**Diagram sources**
- [frontend/src/lib/api-client.ts](file://frontend/src/lib/api-client.ts)
- [frontend/src/hooks/useAuth.ts](file://frontend/src/hooks/useAuth.ts)
- [frontend/src/stores/authStore.ts](file://frontend/src/stores/authStore.ts)
- [frontend/src/config/env.config.ts](file://frontend/src/config/env.config.ts)
- [frontend/src/features/auth/services/authService.ts](file://frontend/src/features/auth/services/authService.ts)
- [frontend/src/features/dashboard/services/dashboardService.ts](file://frontend/src/features/dashboard/services/dashboardService.ts)
- [frontend/src/features/notifications/services/notificationService.ts](file://frontend/src/features/notifications/services/notificationService.ts)
- [frontend/src/features/messagerie/services/messagingService.ts](file://frontend/src/features/messagerie/services/messagingService.ts)
- [frontend/src/features/files/services/fileService.ts](file://frontend/src/features/files/services/fileService.ts)
- [backend/src/app.ts](file://backend/src/app.ts)
- [backend/src/routes/route-registry.ts](file://backend/src/routes/route-registry.ts)
- [backend/src/modules/auth/controllers/auth.controller.ts](file://backend/src/modules/auth/controllers/auth.controller.ts)
- [backend/src/modules/auth/dto/login.dto.ts](file://backend/src/modules/auth/dto/login.dto.ts)
- [backend/src/modules/auth/dto/dto/register.dto.ts](file://backend/src/modules/auth/dto/register.dto.ts)
- [backend/src/common/filters/global-exception.filter.ts](file://backend/src/common/filters/global-exception.filter.ts)
- [backend/src/common/interceptors/logging.interceptor.ts](file://backend/src/common/interceptors/logging.interceptor.ts)
- [backend/src/common/interceptors/error.interceptor.ts](file://backend/src/common/interceptors/error.interceptor.ts)

**Section sources**
- [frontend/src/lib/api-client.ts](file://frontend/src/lib/api-client.ts)
- [backend/src/app.ts](file://backend/src/app.ts)
- [backend/src/routes/route-registry.ts](file://backend/src/routes/route-registry.ts)

## Core Components
- Centralized HTTP client (Axios instance): Base URL, headers, timeouts, and interceptor chain for auth, logging, errors, and response normalization.
- Authentication flow: Login/logout endpoints, token storage, and automatic header injection via interceptors.
- Feature services: Typed methods that encapsulate domain-specific API calls (auth, dashboard, notifications, messaging, files).
- Global error handling: Consistent error shapes and user-facing messages.
- Real-time communication: WebSocket service for live updates.
- File uploads: Multipart/form-data handling with progress tracking.
- Versioning strategy: URL-based or header-based versioning applied at the client level.

Key responsibilities and interactions are illustrated below.

**Section sources**
- [frontend/src/lib/api-client.ts](file://frontend/src/lib/api-client.ts)
- [frontend/src/features/auth/services/authService.ts](file://frontend/src/features/auth/services/authService.ts)
- [frontend/src/features/dashboard/services/dashboardService.ts](file://frontend/src/features/dashboard/services/dashboardService.ts)
- [frontend/src/features/notifications/services/notificationService.ts](file://frontend/src/features/notifications/services/notificationService.ts)
- [frontend/src/features/messagerie/services/messagingService.ts](file://frontend/src/features/messagerie/services/messagingService.ts)
- [frontend/src/features/files/services/fileService.ts](file://frontend/src/features/files/services/fileService.ts)

## Architecture Overview
The integration follows a layered approach:
- Services call the centralized HTTP client.
- The HTTP client applies interceptors for auth, logging, and error handling.
- Backend routes map to controllers; controllers validate DTOs and return standardized responses.
- Global filters and interceptors normalize errors and logs.

```mermaid
sequenceDiagram
participant UI as "Feature Service"
participant Client as "Axios Client"
participant AuthHook as "Auth Hook/Store"
participant Routes as "Route Registry"
participant Controller as "Controller"
participant Filter as "Global Exception Filter"
UI->>Client : "HTTP request (with optional payload)"
Client->>AuthHook : "Attach auth token if present"
Client->>Routes : "Send request"
Routes->>Controller : "Dispatch to controller"
Controller-->>Routes : "Response or throw error"
alt "Error thrown"
Routes->>Filter : "Catch exception"
Filter-->>Client : "Normalized error shape"
else "Success"
Controller-->>Client : "Typed response"
end
Client-->>UI : "Transformed response or error"
```

**Diagram sources**
- [frontend/src/lib/api-client.ts](file://frontend/src/lib/api-client.ts)
- [frontend/src/hooks/useAuth.ts](file://frontend/src/hooks/useAuth.ts)
- [frontend/src/stores/authStore.ts](file://frontend/src/stores/authStore.ts)
- [backend/src/routes/route-registry.ts](file://backend/src/routes/route-registry.ts)
- [backend/src/modules/auth/controllers/auth.controller.ts](file://backend/src/modules/auth/controllers/auth.controller.ts)
- [backend/src/common/filters/global-exception.filter.ts](file://backend/src/common/filters/global-exception.filter.ts)

## Detailed Component Analysis

### Centralized HTTP Client Configuration
Responsibilities:
- Base URL and default headers.
- Interceptors for:
  - Authentication: attach tokens, refresh on 401 where applicable.
  - Logging: request/response metadata.
  - Error handling: transform backend errors into consistent shapes.
  - Response transformation: normalize payloads and unwrap data envelopes.
- Timeouts and retries for idempotent requests.

```mermaid
flowchart TD
Start(["Request Initiated"]) --> AttachHeaders["Attach Headers<br/>and Token"]
AttachHeaders --> LogReq["Log Request Metadata"]
LogReq --> Send["Send via Axios"]
Send --> Resp{"Status Code"}
Resp --> |2xx| TransformResp["Normalize Response Payload"]
Resp --> |401| HandleAuth["Handle Unauthorized<br/>Refresh/Logout"]
Resp --> |4xx/5xx| HandleErr["Map to Standard Error Shape"]
TransformResp --> ReturnOk["Return Data"]
HandleAuth --> RetryOrFail{"Retry Allowed?"}
RetryOrFail --> |Yes| Resend["Resend Request"]
RetryOrFail --> |No| ReturnAuthErr["Return Auth Error"]
HandleErr --> ReturnErr["Return Normalized Error"]
Resend --> End(["Done"])
ReturnOk --> End
ReturnAuthErr --> End
ReturnErr --> End
```

**Diagram sources**
- [frontend/src/lib/api-client.ts](file://frontend/src/lib/api-client.ts)

**Section sources**
- [frontend/src/lib/api-client.ts](file://frontend/src/lib/api-client.ts)

### Authentication Flow and Token Management
Responsibilities:
- Login endpoint returns tokens stored securely.
- Interceptors inject Authorization headers automatically.
- On 401, attempt token refresh or force logout depending on policy.
- Auth state persisted in store and consumed by hooks.

```mermaid
sequenceDiagram
participant UI as "Login Form"
participant AuthSvc as "authService.login()"
participant Client as "Axios Client"
participant Store as "authStore"
participant Hook as "useAuth"
participant Routes as "Route Registry"
participant Controller as "auth.controller"
UI->>AuthSvc : "Submit credentials"
AuthSvc->>Client : "POST /auth/login"
Client->>Routes : "Forward request"
Routes->>Controller : "Validate DTO and authenticate"
Controller-->>Client : "{ accessToken, refreshToken }"
Client-->>AuthSvc : "Response"
AuthSvc->>Store : "Persist tokens"
Store-->>Hook : "Emit auth state change"
Hook-->>UI : "Update UI and redirect"
```

**Diagram sources**
- [frontend/src/features/auth/services/authService.ts](file://frontend/src/features/auth/services/authService.ts)
- [frontend/src/stores/authStore.ts](file://frontend/src/stores/authStore.ts)
- [frontend/src/hooks/useAuth.ts](file://frontend/src/hooks/useAuth.ts)
- [backend/src/routes/route-registry.ts](file://backend/src/routes/route-registry.ts)
- [backend/src/modules/auth/controllers/auth.controller.ts](file://backend/src/modules/auth/controllers/auth.controller.ts)

**Section sources**
- [frontend/src/features/auth/services/authService.ts](file://frontend/src/features/auth/services/authService.ts)
- [frontend/src/stores/authStore.ts](file://frontend/src/stores/authStore.ts)
- [frontend/src/hooks/useAuth.ts](file://frontend/src/hooks/useAuth.ts)
- [backend/src/modules/auth/controllers/auth.controller.ts](file://backend/src/modules/auth/controllers/auth.controller.ts)

### Typed API Methods Generation from Backend DTOs
Approach:
- Backend defines DTOs for input validation and documentation.
- Frontend mirrors types/interfaces based on these DTOs to ensure type safety across the stack.
- Services expose strongly-typed methods that accept DTO-like inputs and return typed responses.

```mermaid
classDiagram
class LoginDTO {
+string email
+string password
}
class RegisterDTO {
+string email
+string password
+string fullName
}
class AuthService {
+login(credentials) Promise~UserSession~
+register(data) Promise~UserSession~
}
class DashboardService {
+getStats() Promise~DashboardStats~
}
class NotificationService {
+list(params) Promise~NotificationList~
}
class MessagingService {
+sendMessage(payload) Promise~Message~
}
class FileService {
+upload(file) Promise~FileMetadata~
}
AuthService --> LoginDTO : "uses"
AuthService --> RegisterDTO : "uses"
DashboardService --> AuthService : "requires auth"
NotificationService --> AuthService : "requires auth"
MessagingService --> AuthService : "requires auth"
FileService --> AuthService : "requires auth"
```

**Diagram sources**
- [backend/src/modules/auth/dto/login.dto.ts](file://backend/src/modules/auth/dto/login.dto.ts)
- [backend/src/modules/auth/dto/register.dto.ts](file://backend/src/modules/auth/dto/register.dto.ts)
- [frontend/src/features/auth/services/authService.ts](file://frontend/src/features/auth/services/authService.ts)
- [frontend/src/features/dashboard/services/dashboardService.ts](file://frontend/src/features/dashboard/services/dashboardService.ts)
- [frontend/src/features/notifications/services/notificationService.ts](file://frontend/src/features/notifications/services/notificationService.ts)
- [frontend/src/features/messagerie/services/messagingService.ts](file://frontend/src/features/messagerie/services/messagingService.ts)
- [frontend/src/features/files/services/fileService.ts](file://frontend/src/features/files/services/fileService.ts)

**Section sources**
- [backend/src/modules/auth/dto/login.dto.ts](file://backend/src/modules/auth/dto/login.dto.ts)
- [backend/src/modules/auth/dto/register.dto.ts](file://backend/src/modules/auth/dto/register.dto.ts)
- [frontend/src/features/auth/services/authService.ts](file://frontend/src/features/auth/services/authService.ts)
- [frontend/src/features/dashboard/services/dashboardService.ts](file://frontend/src/features/dashboard/services/dashboardService.ts)
- [frontend/src/features/notifications/services/notificationService.ts](file://frontend/src/features/notifications/services/notificationService.ts)
- [frontend/src/features/messagerie/services/messagingService.ts](file://frontend/src/features/messagerie/services/messagingService.ts)
- [frontend/src/features/files/services/fileService.ts](file://frontend/src/features/files/services/fileService.ts)

### Error Handling Strategies
- Backend:
  - Global exception filter normalizes exceptions into consistent JSON structures.
  - Interceptors log errors and enrich context.
- Frontend:
  - Axios interceptors map HTTP status codes and server messages to unified error objects.
  - User-friendly messages and actionable feedback are provided.

```mermaid
flowchart TD
BEThrow["Controller throws exception"] --> Catch["Global Exception Filter"]
Catch --> Normalize["Build standard error envelope"]
Normalize --> SendErr["Send normalized error to client"]
SendErr --> ClientIntercept["Axios error interceptor"]
ClientIntercept --> MapErr["Map to typed error object"]
MapErr --> UI["Show user message or fallback"]
```

**Diagram sources**
- [backend/src/common/filters/global-exception.filter.ts](file://backend/src/common/filters/global-exception.filter.ts)
- [backend/src/common/interceptors/error.interceptor.ts](file://backend/src/common/interceptors/error.interceptor.ts)
- [frontend/src/lib/api-client.ts](file://frontend/src/lib/api-client.ts)

**Section sources**
- [backend/src/common/filters/global-exception.filter.ts](file://backend/src/common/filters/global-exception.filter.ts)
- [backend/src/common/interceptors/error.interceptor.ts](file://backend/src/common/interceptors/error.interceptor.ts)
- [frontend/src/lib/api-client.ts](file://frontend/src/lib/api-client.ts)

### Retry Mechanisms
- Idempotent GET requests can be retried with exponential backoff.
- Non-idempotent mutations should not auto-retry unless explicitly requested.
- Retries respect circuit breaker thresholds to avoid cascading failures.

```mermaid
flowchart TD
Req["Idempotent Request"] --> Try1["Attempt #1"]
Try1 --> Ok1{"Success?"}
Ok1 --> |Yes| Done["Return result"]
Ok1 --> |No| Backoff["Exponential Backoff"]
Backoff --> TryN["Attempt #N"]
TryN --> OkN{"Success?"}
OkN --> |Yes| Done
OkN --> |No| Fail["Fail after max attempts"]
```

[No diagram sources needed since this diagram shows conceptual workflow]

**Section sources**
- [frontend/src/lib/api-client.ts](file://frontend/src/lib/api-client.ts)

### Offline Support Patterns
- Cache successful GET responses using a lightweight cache layer.
- Queue failed mutations when offline and replay when connectivity resumes.
- Provide optimistic UI updates with rollback on failure.

```mermaid
flowchart TD
Start(["App Start"]) --> CheckConn["Check Connectivity"]
CheckConn --> Online{"Online?"}
Online --> |Yes| ServeCache["Serve from cache/network"]
Online --> |No| UseLocal["Use local cache/store"]
ServeCache --> UpdateLocal["Update local cache"]
UseLocal --> SyncQueue["Sync queued mutations later"]
UpdateLocal --> End(["Ready"])
SyncQueue --> End
```

[No diagram sources needed since this diagram shows conceptual workflow]

**Section sources**
- [frontend/src/lib/api-client.ts](file://frontend/src/lib/api-client.ts)

### WebSocket Integration for Real-Time Features
- Dedicated WebSocket service manages connection lifecycle, reconnection, and event routing.
- Integrates with auth to send tokens during handshake.
- Provides typed event handlers for features like notifications and messaging.

```mermaid
sequenceDiagram
participant WS as "WebSocket Service"
participant Auth as "Auth Hook/Store"
participant Server as "WS Server"
participant UI as "Feature UI"
WS->>Auth : "Get access token"
WS->>Server : "Connect with token"
Server-->>WS : "Connected"
WS->>UI : "Subscribe to events"
Server-->>WS : "Event stream"
WS-->>UI : "Dispatch typed events"
Note over WS,Server : "Auto-reconnect on disconnect"
```

**Diagram sources**
- [frontend/src/features/messagerie/services/messagingService.ts](file://frontend/src/features/messagerie/services/messagingService.ts)
- [frontend/src/features/notifications/services/notificationService.ts](file://frontend/src/features/notifications/services/notificationService.ts)
- [frontend/src/hooks/useAuth.ts](file://frontend/src/hooks/useAuth.ts)
- [frontend/src/stores/authStore.ts](file://frontend/src/stores/authStore.ts)

**Section sources**
- [frontend/src/features/messagerie/services/messagingService.ts](file://frontend/src/features/messagerie/services/messagingService.ts)
- [frontend/src/features/notifications/services/notificationService.ts](file://frontend/src/features/notifications/services/notificationService.ts)
- [frontend/src/hooks/useAuth.ts](file://frontend/src/hooks/useAuth.ts)
- [frontend/src/stores/authStore.ts](file://frontend/src/stores/authStore.ts)

### File Upload Handling
- Uses multipart/form-data for uploads.
- Progress tracking via upload events.
- Handles large files with chunking options and cancellation.

```mermaid
flowchart TD
Select["Select File(s)"] --> BuildForm["Build FormData"]
BuildForm --> Upload["POST /files/upload"]
Upload --> Progress["Track progress events"]
Progress --> Success{"Upload success?"}
Success --> |Yes| SaveMeta["Save metadata and update UI"]
Success --> |No| RetryOrCancel["Retry or cancel"]
```

**Diagram sources**
- [frontend/src/features/files/services/fileService.ts](file://frontend/src/features/files/services/fileService.ts)
- [frontend/src/lib/api-client.ts](file://frontend/src/lib/api-client.ts)

**Section sources**
- [frontend/src/features/files/services/fileService.ts](file://frontend/src/features/files/services/fileService.ts)
- [frontend/src/lib/api-client.ts](file://frontend/src/lib/api-client.ts)

### API Versioning Strategies
- Prefer URL path versioning (e.g., /api/v1/...) for clarity and caching benefits.
- Alternatively, use Accept headers for content negotiation.
- Maintain backward compatibility by deprecating old versions gradually.

```mermaid
flowchart TD
Config["env.config.ts"] --> BaseURL["Base URL includes version"]
BaseURL --> Requests["All requests prefixed with /api/vX"]
Requests --> Router["Route Registry matches versioned paths"]
```

**Diagram sources**
- [frontend/src/config/env.config.ts](file://frontend/src/config/env.config.ts)
- [backend/src/routes/route-registry.ts](file://backend/src/routes/route-registry.ts)

**Section sources**
- [frontend/src/config/env.config.ts](file://frontend/src/config/env.config.ts)
- [backend/src/routes/route-registry.ts](file://backend/src/routes/route-registry.ts)

### Testing Strategies and Mock Data Management
- Unit tests for services: mock Axios and verify method contracts.
- Integration tests: spin up test containers for backend and run end-to-end flows.
- Mock data: define fixtures aligned with backend DTOs to keep tests deterministic.
- E2E tests: use Playwright/Cypress to exercise full flows including auth and uploads.

```mermaid
flowchart TD
Dev["Developer writes service code"] --> TestUnit["Write unit tests with mocks"]
TestUnit --> TestIntegration["Run integration tests against test DB"]
TestIntegration --> TestE2E["Run E2E tests with mocked network"]
TestE2E --> Feedback["Fix issues and iterate"]
```

[No diagram sources needed since this diagram shows conceptual workflow]

**Section sources**
- [frontend/src/features/auth/services/authService.ts](file://frontend/src/features/auth/services/authService.ts)
- [frontend/src/features/dashboard/services/dashboardService.ts](file://frontend/src/features/dashboard/services/dashboardService.ts)
- [frontend/src/features/notifications/services/notificationService.ts](file://frontend/src/features/notifications/services/notificationService.ts)
- [frontend/src/features/messagerie/services/messagingService.ts](file://frontend/src/features/messagerie/services/messagingService.ts)
- [frontend/src/features/files/services/fileService.ts](file://frontend/src/features/files/services/fileService.ts)

## Dependency Analysis
Frontend dependencies include Axios for HTTP, WebSocket libraries for real-time, and state management for auth. Backend dependencies include NestJS framework components for controllers, DTOs, filters, and interceptors.

```mermaid
graph LR
FE_Pkg["frontend/package.json"] --> Axios["axios"]
FE_Pkg --> WS["ws or socket.io-client"]
FE_Pkg --> State["state manager (e.g., zustand)"]
BE_Pkg["backend/package.json"] --> Nest["@nestjs/core"]
BE_Pkg --> Validation["@nestjs/swagger / class-validator"]
BE_Pkg --> Filters["Global Exception Filter"]
BE_Pkg --> Interceptors["Interceptors"]
```

**Diagram sources**
- [frontend/package.json](file://frontend/package.json)
- [backend/package.json](file://backend/package.json)

**Section sources**
- [frontend/package.json](file://frontend/package.json)
- [backend/package.json](file://backend/package.json)

## Performance Considerations
- Minimize payload sizes by selecting fields and pagination.
- Enable compression and caching headers where appropriate.
- Debounce search queries and paginate lists.
- Use WebSocket for high-frequency updates instead of polling.
- Implement request deduplication to avoid redundant calls.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- 401 Unauthorized: Ensure token presence and refresh logic; check CORS and cookie settings.
- Network errors: Verify base URL, proxy config, and connectivity; inspect interceptor logs.
- Validation errors: Align frontend DTOs with backend DTOs; review error shapes.
- WebSocket drops: Implement reconnection with exponential backoff; monitor heartbeat.

**Section sources**
- [frontend/src/lib/api-client.ts](file://frontend/src/lib/api-client.ts)
- [backend/src/common/filters/global-exception.filter.ts](file://backend/src/common/filters/global-exception.filter.ts)
- [backend/src/common/interceptors/logging.interceptor.ts](file://backend/src/common/interceptors/logging.interceptor.ts)

## Conclusion
The API integration layer centralizes HTTP concerns, enforces consistent error handling, and provides typed, maintainable services aligned with backend DTOs. With robust authentication, real-time capabilities, file uploads, and thoughtful versioning and testing strategies, the system remains scalable and developer-friendly.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices

### Environment Configuration
- Base URL and API version are configured centrally.
- Feature flags and timeouts are defined here.

**Section sources**
- [frontend/src/config/env.config.ts](file://frontend/src/config/env.config.ts)

### Application Bootstrap and Routing
- Backend app bootstraps middleware, filters, and interceptors.
- Route registry maps URLs to controllers.

**Section sources**
- [backend/src/app.ts](file://backend/src/app.ts)
- [backend/src/routes/route-registry.ts](file://backend/src/routes/route-registry.ts)