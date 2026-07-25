---
kind: error_handling
name: Centralized Error Handling with AppError and Express Middleware
category: error_handling
scope:
    - '**'
source_files:
    - backend/src/common/filters/error.filter.ts
    - backend/src/common/filters/not-found.filter.ts
    - backend/src/app.ts
    - backend/src/index.ts
    - backend/src/common/middlewares/tenant.middleware.ts
    - backend/src/common/utils/api-response.util.ts
---

The eLISAschool backend implements a centralized error handling system built around a custom `AppError` class and Express middleware, providing consistent error propagation, standardized API responses, and structured logging across all modules.

## Core System Architecture

**Primary Error Type**: The `AppError` class in `backend/src/common/filters/error.filter.ts` extends the native `Error` with structured properties:
- `statusCode`: HTTP status code (401, 403, 404, 409, 500)
- `code`: Machine-readable error code (e.g., 'UNAUTHORIZED', 'FORBIDDEN', 'NOT_FOUND')
- `isOperational`: Distinguishes operational errors from programming bugs
- `details`: Optional structured error details

**Predefined Error Constants**: The `Errors` object provides singleton instances for common scenarios:
- Authentication: `UNAUTHORIZED`, `INVALID_TOKEN`
- Authorization: `FORBIDDEN`, `INSUFFICIENT_PERMISSIONS`
- Resources: `NOT_FOUND`, `USER_NOT_FOUND`
- Validation: `BAD_REQUEST`, `VALIDATION_ERROR`
- Conflicts: `CONFLICT`, `DUPLICATE_ENTRY`
- Server: `INTERNAL_ERROR`, `DATABASE_ERROR`

## Global Error Processing Pipeline

**Centralized Error Handler**: The `errorHandler` middleware in `app.ts` processes all uncaught errors through a unified pipeline:
- Detects `AppError` instances vs generic errors
- Logs appropriately (error for 5xx, warn for 4xx) with request context
- Returns standardized JSON response format with `success`, `error`, `timestamp`, and `path`
- Includes stack traces only in development (`NODE_ENV === 'development'`)

**404 Route Handler**: The `notFoundHandler` catches undefined routes with consistent error formatting.

**Application Bootstrap**: Errors during server startup are caught in `index.ts` with graceful shutdown via SIGTERM/SIGINT handlers.

## Error Propagation Patterns

**Middleware Integration**: Middlewares like `tenant.middleware.ts` throw `AppError` instances for authorization failures:
```typescript
throw new AppError('Accès non autorisé à cet établissement', 403, 'ACCESS_DENIED');
```

**Service Layer Usage**: Utilities consistently use `AppError` for business logic validation:
- `validate-dto.util.ts`: Validation failures
- `image-processor.util.ts`: File processing errors
- `system-guard.util.ts`: Entity existence checks

**Controller Pattern**: Controllers wrap async operations in try-catch blocks, passing errors to the global handler via `next(error)`.

## Response Standardization

**Success Responses**: The `api-response.util.ts` provides helper functions (`sendSuccess`, `sendMessage`, `sendCreated`, `successResponse`) ensuring consistent success response formats.

**Error Response Format**:
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Non autorisé",
    "details": {}
  },
  "timestamp": "2026-01-01T00:00:00.000Z",
  "path": "/api/resource"
}
```

## Security and Monitoring Integration

**Rate Limiting**: Built-in rate limiting with custom error responses for brute force protection on authentication endpoints.

**Structured Logging**: All errors are logged with contextual information including HTTP method, path, IP address, and stack traces for server errors.

**Development vs Production**: Stack traces and detailed debugging information are suppressed in production environments while maintaining full visibility in development.

## Conventions for Developers

1. **Always throw `AppError`** for business logic violations instead of generic `Error`
2. **Use predefined error codes** from the `Errors` object when possible
3. **Include meaningful messages** in French for user-facing errors
4. **Provide structured details** for complex validation errors
5. **Let the global handler manage responses** — never send responses directly in catch blocks
6. **Use appropriate HTTP status codes** that match the error semantics
7. **Log contextually** — let the errorHandler handle logging automatically