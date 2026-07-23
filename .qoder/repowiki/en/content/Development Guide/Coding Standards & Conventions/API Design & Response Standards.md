# API Design & Response Standards

<cite>
**Referenced Files in This Document**
- [app.ts](file://backend/src/app.ts)
- [index.ts](file://backend/src/index.ts)
- [swagger.config.ts](file://backend/src/config/swagger.config.ts)
- [route-registry.ts](file://backend/src/routes/route-registry.ts)
- [pagination-guide.md](file://backend/docs/pagination-guide.md)
- [DASHBOARD-FRONTEND-INTEGRATION.md](file://backend/docs/DASHBOARD-FRONTEND-INTEGRATION.md)
- [auth-multi-etablissement.spec.ts](file://backend/test/integration/auth-multi-etablissement.spec.ts)
- [configuration-multi-tenant.spec.ts](file://backend/test/integration/configuration-multi-tenant.spec.ts)
- [pagination.util.spec.ts](file://backend/test/unit/pagination.util.spec.ts)
- [redis.service.spec.ts](file://backend/test/unit/redis.service.spec.ts)
</cite>

## Update Summary
**Changes Made**
- Updated REST Conventions section to emphasize plural naming standards for organization-related endpoints
- Enhanced Resource Naming guidelines with specific examples from organization module implementation
- Added comprehensive migration guide for backward compatibility with legacy singular endpoints
- Updated OpenAPI/Swagger documentation standards to reflect plural endpoint patterns
- Revised troubleshooting guidance to address common migration issues
- Added new section covering migration strategies and best practices

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Migration Guide](#migration-guide)
10. [Conclusion](#conclusion)
11. [Appendices](#appendices)

## Introduction
This document defines the API design and response standards for eLISAschool's backend. It establishes RESTful conventions, request/response formats, status codes, error structures, DTO patterns, validation rules, OpenAPI/Swagger documentation standards, versioning strategy, pagination, filtering, sorting, authentication headers, rate limiting responses, and security best practices. The guidance is grounded in the repository's configuration, routing, tests, and documentation artifacts.

**Updated** Recent improvements have modernized API endpoints across the organization module to follow strict RESTful plural naming conventions, ensuring consistency and predictability in resource identification. All organization-related endpoints now use plural forms (e.g., `/organizations`, `/users`) instead of singular forms, aligning with industry-standard RESTful practices.

## Project Structure
The backend follows a modular architecture with shared common utilities, module-scoped controllers/services/entities, centralized configuration (including Swagger), and a route registry that wires endpoints. Tests cover integration scenarios (authentication across establishments, multi-tenant configuration) and unit-level behavior (pagination utilities, Redis service).

```mermaid
graph TB
subgraph "Backend"
A["App Bootstrap<br/>src/app.ts"]
B["Server Entry<br/>src/index.ts"]
C["Route Registry<br/>src/routes/route-registry.ts"]
D["Swagger Config<br/>src/config/swagger.config.ts"]
E["Modules<br/>src/modules/*"]
F["Common<br/>src/common/*"]
end
subgraph "Docs"
G["Pagination Guide<br/>backend/docs/pagination-guide.md"]
H["Dashboard Integration<br/>backend/docs/DASHBOARD-FRONTEND-INTEGRATION.md"]
end
subgraph "Tests"
I["Auth Multi-Etablissement Spec<br/>test/integration/auth-multi-etablissement.spec.ts"]
J["Config Multi-Tenant Spec<br/>test/integration/configuration-multi-tenant.spec.ts"]
K["Pagination Util Spec<br/>test/unit/pagination.util.spec.ts"]
L["Redis Service Spec<br/>test/unit/redis.service.spec.ts"]
end
B --> A
A --> C
C --> E
A --> D
A --> F
E --> F
A -. references .-> G
A -. references .-> H
A -. validated by .-> I
A -. validated by .-> J
A -. validated by .-> K
A -. validated by .-> L
```

**Diagram sources**
- [app.ts](file://backend/src/app.ts)
- [index.ts](file://backend/src/index.ts)
- [swagger.config.ts](file://backend/src/config/swagger.config.ts)
- [route-registry.ts](file://backend/src/routes/route-registry.ts)
- [pagination-guide.md](file://backend/docs/pagination-guide.md)
- [DASHBOARD-FRONTEND-INTEGRATION.md](file://backend/docs/DASHBOARD-FRONTEND-INTEGRATION.md)
- [auth-multi-etablissement.spec.ts](file://backend/test/integration/auth-multi-etablissement.spec.ts)
- [configuration-multi-tenant.spec.ts](file://backend/test/integration/configuration-multi-tenant.spec.ts)
- [pagination.util.spec.ts](file://backend/test/unit/pagination.util.spec.ts)
- [redis.service.spec.ts](file://backend/test/unit/redis.service.spec.ts)

**Section sources**
- [index.ts](file://backend/src/index.ts)
- [app.ts](file://backend/src/app.ts)
- [swagger.config.ts](file://backend/src/config/swagger.config.ts)
- [route-registry.ts](file://backend/src/routes/route-registry.ts)
- [pagination-guide.md](file://backend/docs/pagination-guide.md)
- [DASHBOARD-FRONTEND-INTEGRATION.md](file://backend/docs/DASHBOARD-FRONTEND-INTEGRATION.md)
- [auth-multi-etablissement.spec.ts](file://backend/test/integration/auth-multi-etablissement.spec.ts)
- [configuration-multi-tenant.spec.ts](file://backend/test/integration/configuration-multi-tenant.spec.ts)
- [pagination.util.spec.ts](file://backend/test/unit/pagination.util.spec.ts)
- [redis.service.spec.ts](file://backend/test/unit/redis.service.spec.ts)

## Core Components
- Application bootstrap and middleware pipeline: centralizes global interceptors, filters, middlewares, and CORS/security settings.
- Route registry: aggregates module routes and applies consistent path prefixes and guards.
- Swagger/OpenAPI configuration: standardizes schema generation, examples, and metadata for all endpoints.
- Pagination utilities: provide consistent page-based pagination semantics used across modules.
- Authentication and authorization: JWT-based flows with establishment scoping and RBAC guards.

Key responsibilities:
- Enforce uniform request/response envelopes.
- Centralize error handling and validation errors.
- Provide consistent pagination, filtering, and sorting query parameters.
- Generate and serve OpenAPI specs from decorators/types.

**Section sources**
- [app.ts](file://backend/src/app.ts)
- [route-registry.ts](file://backend/src/routes/route-registry.ts)
- [swagger.config.ts](file://backend/src/config/swagger.config.ts)
- [pagination-guide.md](file://backend/docs/pagination-guide.md)
- [auth-multi-etablissement.spec.ts](file://backend/test/integration/auth-multi-etablissement.spec.ts)
- [configuration-multi-tenant.spec.ts](file://backend/test/integration/configuration-multi-tenant.spec.ts)

## Architecture Overview
The API layer sits atop domain modules and shared services. Requests flow through the app bootstrap, which configures global middleware, filters, and interceptors. Routes are registered centrally, ensuring consistent URL schemes and guard application. Responses follow a unified envelope to simplify client parsing and error handling.

```mermaid
sequenceDiagram
participant Client as "Client"
participant App as "App Bootstrap"
participant Router as "Route Registry"
participant Controller as "Module Controller"
participant Service as "Domain Service"
participant DB as "Database"
participant Cache as "Cache/Redis"
Client->>App : HTTP Request
App->>App : Global Interceptors/Filters/Middleware
App->>Router : Match Route
Router->>Controller : Invoke Handler
Controller->>Service : Business Logic
Service->>DB : Query/Write
Service->>Cache : Optional Read/Write
Service-->>Controller : Result
Controller-->>App : Normalized Response Envelope
App-->>Client : HTTP Response + Headers
```

**Diagram sources**
- [app.ts](file://backend/src/app.ts)
- [route-registry.ts](file://backend/src/routes/route-registry.ts)

## Detailed Component Analysis

### REST Conventions and Versioning
- Base paths: Use module-scoped base paths under a stable root.
- **Resource naming**: Plural nouns are mandatory for all resource endpoints. This ensures consistency and aligns with RESTful best practices. Examples include `/organizations`, `/users`, `/classes`, `/students`, etc.
- Methods:
  - GET: Retrieve resources or lists.
  - POST: Create resources.
  - PUT: Full update.
  - PATCH: Partial update.
  - DELETE: Remove resource.
- Versioning: Prefer URL versioning (e.g., /api/v1/...) for breaking changes; maintain backward compatibility within minor versions.

**Updated** All organization module endpoints now follow strict plural naming conventions. For example:
- ✅ Correct: `GET /api/v1/organizations`
- ❌ Incorrect: `GET /api/v1/organization`
- ✅ Correct: `POST /api/v1/users`
- ❌ Incorrect: `POST /api/v1/user`
- ✅ Correct: `PUT /api/v1/organizations/:id`
- ❌ Incorrect: `PUT /api/v1/organization/:id`

**Migration Notes**: Previous singular endpoint patterns have been deprecated but may still be available during transition periods with appropriate deprecation headers. Clients should migrate to plural forms as soon as possible.

**Section sources**
- [route-registry.ts](file://backend/src/routes/route-registry.ts)

### Request and Response Formats
- Content-Type: application/json for requests and responses.
- Accept-Language: Supported for localized messages when applicable.
- Response envelope:
  - data: payload object or array
  - meta: pagination and metadata
  - errors: null on success, list on failure
- Error envelope:
  - code: machine-readable error code
  - message: human-readable message
  - details: optional structured details
  - traceId: correlation identifier

**Section sources**
- [app.ts](file://backend/src/app.ts)

### Status Codes
- 200 OK: Successful GET/PATCH/PUT operations returning data.
- 201 Created: Successful POST creating a resource.
- 204 No Content: Successful DELETE without body.
- 400 Bad Request: Validation or malformed input.
- 401 Unauthorized: Missing or invalid credentials.
- 403 Forbidden: Insufficient permissions.
- 404 Not Found: Resource not found.
- 409 Conflict: Duplicate or state conflict.
- 422 Unprocessable Entity: Semantic validation failures.
- 429 Too Many Requests: Rate limit exceeded.
- 500 Internal Server Error: Unexpected server-side error.

**Section sources**
- [app.ts](file://backend/src/app.ts)

### DTO Patterns and Validation Rules
- Use explicit DTOs per endpoint for inputs and outputs.
- Apply class-validator decorators to enforce constraints (required fields, formats, ranges).
- Map DTOs to entities in services; never expose internal entities directly.
- Return normalized output DTOs to ensure stability across versions.

Validation guidelines:
- Required fields must be present and non-empty unless explicitly nullable.
- Strings should be trimmed and sanitized.
- Numeric fields must be within defined bounds.
- Enumerations must match declared values.

**Updated** Organization module DTOs now consistently use plural naming patterns in their corresponding endpoint definitions, ensuring clear separation between resource types and individual instances.

**Section sources**
- [app.ts](file://backend/src/app.ts)

### OpenAPI/Swagger Documentation Standards
- Enable OpenAPI metadata via decorators on controllers and DTOs.
- Provide summary, description, and examples for each endpoint.
- Define schemas for all request bodies and responses.
- Include security schemes and required scopes/roles.
- Serve spec at a dedicated path and link from API index.

**Updated** All organization module endpoints now reflect plural naming conventions in their OpenAPI specifications, providing accurate documentation for clients. The generated Swagger UI displays the correct plural endpoint patterns, making it easier for developers to understand the proper API usage.

**Section sources**
- [swagger.config.ts](file://backend/src/config/swagger.config.ts)

### Authentication and Authorization
- Header: Authorization: Bearer <JWT>.
- Establishment context: Establishments are scoped per request using tenant-aware guards.
- Roles/Permissions: RBAC guards enforce fine-grained access control.
- Session persistence: Login attempts and lockouts may be persisted for security.

Security notes:
- Validate token signature and expiration.
- Reject tokens from unauthorized origins.
- Enforce minimum TLS and secure cookies where applicable.

**Section sources**
- [auth-multi-etablissement.spec.ts](file://backend/test/integration/auth-multi-etablissement.spec.ts)
- [configuration-multi-tenant.spec.ts](file://backend/test/integration/configuration-multi-tenant.spec.ts)

### Pagination, Filtering, and Sorting
- Page-based pagination:
  - page: integer >= 1
  - pageSize: integer > 0
  - totalItems: number
  - totalPages: number
- Sorting:
  - sortBy: field name
  - sortOrder: asc | desc
- Filtering:
  - Use query parameters with clear names (e.g., status, search, dateFrom, dateTo).
  - Support comma-separated lists for multi-value filters.
- Consistency:
  - All list endpoints return { data, meta } with pagination metadata.

Reference implementation and guidance:
- See pagination guide and unit tests for utility behavior.

**Updated** All organization module list endpoints now consistently use plural resource names in their pagination responses, maintaining alignment with the overall RESTful naming strategy.

**Section sources**
- [pagination-guide.md](file://backend/docs/pagination-guide.md)
- [pagination.util.spec.ts](file://backend/test/unit/pagination.util.spec.ts)

### Rate Limiting and Throttling
- Global throttler configured at the application level.
- Standard rate limit response includes:
  - Retry-After header (seconds)
  - X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
  - JSON error with code RATE_LIMIT_EXCEEDED

Behavior:
- Returns 429 when limits are exceeded.
- Clients should respect Retry-After and backoff strategies.

**Section sources**
- [redis.service.spec.ts](file://backend/test/unit/redis.service.spec.ts)
- [app.ts](file://backend/src/app.ts)

### Security Best Practices
- Enforce HTTPS in production.
- Set strict CORS policies with allowed origins and methods.
- Use helmet-like headers for security (HSTS, XSS protection, etc.).
- Sanitize inputs and validate outputs.
- Avoid leaking stack traces in production responses.
- Rotate secrets and use environment-based configuration.

**Section sources**
- [app.ts](file://backend/src/app.ts)

### Dashboard and Frontend Integration Notes
- Follow documented integration patterns for dashboard widgets and metrics.
- Ensure consistent envelope usage for chart data and counters.
- Respect pagination and caching headers for performance.

**Updated** Frontend integrations with organization module endpoints should be updated to use plural resource names in their API calls. Any hardcoded references to singular endpoint patterns need to be replaced with their plural equivalents.

**Section sources**
- [DASHBOARD-FRONTEND-INTEGRATION.md](file://backend/docs/DASHBOARD-FRONTEND-INTEGRATION.md)

## Dependency Analysis
High-level dependencies between core components:

```mermaid
graph LR
Index["Server Entry<br/>index.ts"] --> App["App Bootstrap<br/>app.ts"]
App --> Router["Route Registry<br/>route-registry.ts"]
App --> Swagger["Swagger Config<br/>swagger.config.ts"]
Router --> Modules["Modules Controllers/Services"]
Modules --> Common["Common Utils/DTOs/Guards"]
App -. tests .-> AuthSpec["Auth Multi-Etabl. Spec"]
App -. tests .-> TenantSpec["Config Multi-Tenant Spec"]
App -. tests .-> PagUtil["Pagination Util Spec"]
App -. tests .-> RedisSpec["Redis Service Spec"]
```

**Diagram sources**
- [index.ts](file://backend/src/index.ts)
- [app.ts](file://backend/src/app.ts)
- [swagger.config.ts](file://backend/src/config/swagger.config.ts)
- [route-registry.ts](file://backend/src/routes/route-registry.ts)
- [auth-multi-etablissement.spec.ts](file://backend/test/integration/auth-multi-etablissement.spec.ts)
- [configuration-multi-tenant.spec.ts](file://backend/test/integration/configuration-multi-tenant.spec.ts)
- [pagination.util.spec.ts](file://backend/test/unit/pagination.util.spec.ts)
- [redis.service.spec.ts](file://backend/test/unit/redis.service.spec.ts)

**Section sources**
- [index.ts](file://backend/src/index.ts)
- [app.ts](file://backend/src/app.ts)
- [swagger.config.ts](file://backend/src/config/swagger.config.ts)
- [route-registry.ts](file://backend/src/routes/route-registry.ts)
- [auth-multi-etablissement.spec.ts](file://backend/test/integration/auth-multi-etablissement.spec.ts)
- [configuration-multi-tenant.spec.ts](file://backend/test/integration/configuration-multi-tenant.spec.ts)
- [pagination.util.spec.ts](file://backend/test/unit/pagination.util.spec.ts)
- [redis.service.spec.ts](file://backend/test/unit/redis.service.spec.ts)

## Performance Considerations
- Use pagination for all list endpoints to avoid large payloads.
- Leverage database indexes and query optimization.
- Cache read-heavy data with Redis where appropriate.
- Apply compression for JSON responses.
- Monitor slow queries and add timeouts for external calls.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- 401 Unauthorized:
  - Verify Authorization header format and token validity.
  - Check establishment context and role assignments.
- 403 Forbidden:
  - Confirm user has required permissions for the target resource.
- 404 Not Found:
  - **Updated**: If you're getting 404 errors after recent updates, verify you're using plural endpoint names (e.g., `/organizations` instead of `/organization`). Check your client code for any hardcoded singular endpoint references.
- 429 Too Many Requests:
  - Implement exponential backoff and honor Retry-After.
- Validation Errors:
  - Inspect errors.details for field-specific messages.
  - Ensure DTOs match expected shapes and constraints.

Operational checks:
- Review global filters and interceptors for unexpected transformations.
- Validate OpenAPI spec consistency with actual endpoints.
- Use correlation IDs (traceId) to trace requests across logs.

**Section sources**
- [app.ts](file://backend/src/app.ts)
- [auth-multi-etablissement.spec.ts](file://backend/test/integration/auth-multi-etablissement.spec.ts)
- [configuration-multi-tenant.spec.ts](file://backend/test/integration/configuration-multi-tenant.spec.ts)

## Migration Guide

### Understanding the Change
The eLISAschool platform has implemented RESTful API standardization by transitioning from singular to plural resource names for organization-related endpoints. This change improves consistency and aligns with industry-standard RESTful practices.

### Affected Endpoints
The following endpoint patterns have been updated:

| Old Pattern (Deprecated) | New Pattern (Recommended) | Description |
|--------------------------|---------------------------|-------------|
| `/api/v1/organization` | `/api/v1/organizations` | List all organizations |
| `/api/v1/organization/:id` | `/api/v1/organizations/:id` | Get specific organization |
| `/api/v1/user` | `/api/v1/users` | List all users |
| `/api/v1/user/:id` | `/api/v1/users/:id` | Get specific user |
| `/api/v1/class` | `/api/v1/classes` | List all classes |
| `/api/v1/class/:id` | `/api/v1/classes/:id` | Get specific class |

### Migration Steps

#### 1. Update Client Code
Replace all singular endpoint references with plural forms:

```javascript
// Before (deprecated)
const response = await fetch('/api/v1/organization');
const user = await fetch('/api/v1/user/123');

// After (recommended)
const response = await fetch('/api/v1/organizations');
const user = await fetch('/api/v1/users/123');
```

#### 2. Update Configuration Files
Check any configuration files that might contain hardcoded endpoint URLs:

```yaml
# Before
api_endpoints:
  organization_list: "/api/v1/organization"
  user_detail: "/api/v1/user/:id"

# After
api_endpoints:
  organization_list: "/api/v1/organizations"
  user_detail: "/api/v1/users/:id"
```

#### 3. Update API Documentation
Ensure any internal documentation reflects the new endpoint patterns.

#### 4. Testing Strategy
- Test all API calls with new plural endpoints
- Verify backward compatibility if legacy endpoints are still active
- Monitor for any 404 errors indicating missed endpoint updates

### Backward Compatibility
During the transition period, some legacy singular endpoints may continue to work with deprecation warnings. However, these will eventually be removed, so migration should be prioritized.

### Rollback Plan
If issues arise during migration:
1. Temporarily revert client code changes
2. Investigate specific failing endpoints
3. Address any compatibility issues
4. Re-attempt migration with fixes applied

**Section sources**
- [route-registry.ts](file://backend/src/routes/route-registry.ts)
- [swagger.config.ts](file://backend/src/config/swagger.config.ts)

## Conclusion
These standards unify how eLISAschool exposes its capabilities via APIs. By enforcing consistent envelopes, robust validation, comprehensive OpenAPI docs, and strong security posture, clients can integrate reliably and securely. Adhering to pagination, filtering, and sorting conventions ensures scalability and predictable performance.

**Updated** The recent modernization of organization module endpoints to follow strict RESTful plural naming conventions further strengthens API consistency and predictability across the entire platform. This standardization effort ensures that all future development maintains consistent API patterns, making the platform more maintainable and developer-friendly.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices

### API Versioning Strategy
- Major versions change the base path (/api/v1/, /api/v2/...).
- Minor versions add features without breaking changes.
- Deprecation notices are provided via headers and OpenAPI metadata.

**Updated** When migrating to new plural endpoint patterns, consider implementing redirect handlers for backward compatibility during transition periods.

**Section sources**
- [route-registry.ts](file://backend/src/routes/route-registry.ts)

### Example Request/Response Envelopes
- Success:
  - { data, meta, errors: null }
- Error:
  - { data: null, meta: null, errors: [{ code, message, details }] }

**Section sources**
- [app.ts](file://backend/src/app.ts)

### OpenAPI Generation Checklist
- Decorate controllers and DTOs with metadata.
- Provide examples and descriptions.
- Define security schemes and requirements.
- Publish spec and UI.

**Updated** Ensure all organization module endpoints reflect plural naming in their OpenAPI specifications. The generated Swagger documentation should automatically display the correct plural endpoint patterns.

**Section sources**
- [swagger.config.ts](file://backend/src/config/swagger.config.ts)

### Migration Checklist
**New Section**

Use this checklist to ensure complete migration to plural endpoints:

- [ ] Update all client-side API calls to use plural endpoints
- [ ] Modify configuration files containing endpoint URLs
- [ ] Update any hardcoded strings in templates or scripts
- [ ] Refresh API documentation and examples
- [ ] Test all affected functionality thoroughly
- [ ] Monitor for 404 errors in production
- [ ] Update deployment scripts if they reference old endpoints
- [ ] Notify team members about the changes
- [ ] Schedule cleanup of legacy endpoint support

### Common Migration Issues
**New Section**

**Issue**: Some endpoints still return 404 errors
**Solution**: Check for any remaining singular endpoint references in your codebase. Use grep to search for patterns like `/api/v1/organization` or `/api/v1/user`.

**Issue**: OpenAPI documentation shows mixed patterns
**Solution**: Regenerate the OpenAPI specification after updating all endpoint definitions.

**Issue**: Third-party integrations break
**Solution**: Contact third-party providers to update their configurations or implement proxy layers to handle the transition.