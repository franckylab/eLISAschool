---
kind: error_handling
name: Centralized Error Handling with AppError and Express Filters
category: error_handling
scope:
    - '**'
source_files:
    - backend/src/common/filters/error.filter.ts
    - backend/src/common/filters/not-found.filter.ts
    - backend/src/app.ts
    - backend/src/common/middlewares/tenant.middleware.ts
    - backend/src/common/interceptors/request-logger.interceptor.ts
---

The eLISAschool backend implements a centralized, consistent error handling system built around a custom `AppError` class and Express error filters. The approach follows a clear separation between business errors (thrown as `AppError`) and infrastructure errors (caught by the global handler).

**Core Architecture:**
- **Custom Error Class**: `AppError` extends Node's `Error` with standardized properties: `statusCode`, `code` (machine-readable), `isOperational` flag, and optional `details` for structured error context
- **Predefined Error Constants**: Centralized `Errors` object provides reusable sentinel errors for common scenarios (UNAUTHORIZED, FORBIDDEN, NOT_FOUND, BAD_REQUEST, VALIDATION_ERROR, CONFLICT, INTERNAL_ERROR, DATABASE_ERROR)
- **Global Error Filter**: `errorHandler` middleware in `@common/filters/error.filter.ts` catches all unhandled errors, logs them appropriately (warn for 4xx, error for 5xx), and returns standardized JSON responses
- **404 Handler**: Separate `notFoundHandler` catches undefined routes with consistent error format

**Response Format:**
All errors return a uniform structure:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": { /* optional structured data */ },
    "stack": "Only in development"
  },
  "timestamp": "ISO date",
  "path": "/api/endpoint"
}
```

**Middleware Integration:**
- Request logging via `requestLogger.interceptor.ts` tracks HTTP requests/responses with appropriate log levels based on status codes
- Multi-tenancy middleware (`tenant.middleware.ts`) throws `AppError` instances for authorization failures
- All modules consistently throw `AppError` instead of generic exceptions

**Development vs Production:**
- Development mode includes stack traces in error responses for debugging
- Production mode omits sensitive stack information while maintaining detailed server-side logging
- All 5xx errors are logged with full context (path, method, IP, stack) for monitoring

**Key Conventions:**
- Use predefined `Errors.*` constants for standard HTTP errors
- Throw `AppError` with descriptive machine-readable codes
- Never use `throw new Error()` directly in application code
- Catch database and external service errors, convert to appropriate `AppError` instances
- Global error handler is registered last in Express middleware chain