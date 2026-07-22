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
    - backend/src/common/utils/api-response.util.ts
    - backend/src/common/middlewares/tenant.middleware.ts
---

The eLISAschool backend implements a centralized error handling system built around a custom `AppError` class and Express middleware, providing consistent error responses across the entire API.

## Core Architecture

**Custom Error Class**: The `AppError` class (`backend/src/common/filters/error.filter.ts`) extends Node's native `Error` and adds structured properties:
- `statusCode`: HTTP status code (defaults to 500)
- `code`: Machine-readable error code string (e.g., 'UNAUTHORIZED', 'NOT_FOUND')
- `isOperational`: Boolean flag distinguishing operational errors from programming bugs
- `details`: Optional structured data for additional context
- `message`: Human-readable error message

**Predefined Error Constants**: An `Errors` object provides reusable sentinel instances for common scenarios:
- Authentication: `UNAUTHORIZED`, `INVALID_TOKEN`
- Authorization: `FORBIDDEN`, `INSUFFICIENT_PERMISSIONS`
- Resource: `NOT_FOUND`, `USER_NOT_FOUND`
- Validation: `BAD_REQUEST`, `VALIDATION_ERROR`
- Conflict: `CONFLICT`, `DUPLICATE_ENTRY`
- Server: `INTERNAL_ERROR`, `DATABASE_ERROR`

## Global Error Middleware

The `errorHandler` middleware in `error.filter.ts` serves as the central error processing point:
- Distinguishes between `AppError` instances and generic errors
- Logs 5xx errors with full stack traces via the application logger
- Returns standardized JSON responses with `success: false`, `error.code`, `error.message`, optional `error.details`, `timestamp`, and `path`
- Includes stack traces only in development mode (`NODE_ENV === 'development'`)

**404 Handler**: A separate `notFoundHandler` catches unmatched routes and returns consistent 404 responses with the same structure.

## Usage Patterns

**Service Layer**: Business logic throws `AppError` instances with descriptive messages and appropriate codes:
```typescript
throw new AppError('Établissement requis pour créer une année scolaire', 400, 'MISSING_ETABLISSEMENT');
```

**Middleware Layer**: Cross-cutting concerns like tenant isolation throw domain-specific errors:
```typescript
throw new AppError('Établissement non trouvé dans le contexte', 404, 'ETABLISSEMENT_NOT_FOUND');
```

**Validation Utilities**: Input validation functions throw structured errors:
```typescript
throw new AppError('Erreur de validation', 400, 'VALIDATION_ERROR');
```

## Response Standardization

Successful responses follow a consistent format via helper functions in `api-response.util.ts`:
```typescript
{
  success: true,
  data?: any,
  message?: string,
  meta?: { pagination info }
}
```

## Frontend Integration

The frontend handles errors by accessing the standardized response structure:
```typescript
// Accessing error details from backend responses
error.response?.data?.error?.message
```

Toast notifications display user-friendly messages while preserving technical error codes for logging.

## Key Files
- `backend/src/common/filters/error.filter.ts` - Core error class, constants, and global handler
- `backend/src/common/filters/not-found.filter.ts` - 404 route handler
- `backend/src/app.ts` - Error middleware registration (lines 470-474)
- `backend/src/common/utils/api-response.util.ts` - Success response helpers
- `backend/src/common/middlewares/tenant.middleware.ts` - Example of business error throwing
- `backend/src/common/utils/system-guard.util.ts` - Utility error throwing patterns