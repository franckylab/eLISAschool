---
kind: error_handling
name: Centralized AppError Filter with Standardized API Responses
category: error_handling
scope:
    - '**'
source_files:
    - backend/src/common/filters/error.filter.ts
    - backend/src/common/filters/not-found.filter.ts
    - backend/src/common/utils/validate-dto.util.ts
    - backend/src/app.ts
---

The eLISAschool backend implements a centralized error handling system built around a custom `AppError` class and Express middleware, providing consistent error propagation and standardized JSON responses across all modules.

**Core Architecture**

- **Custom Error Class**: `AppError` (in `backend/src/common/filters/error.filter.ts`) extends Node's `Error` with typed properties: `statusCode`, `code`, `isOperational`, and optional `details`. It captures stack traces via `Error.captureStackTrace`.
- **Predefined Error Constants**: The `Errors` object provides reusable instances for common cases (UNAUTHORIZED, FORBIDDEN, NOT_FOUND, VALIDATION_ERROR, DUPLICATE_ENTRY, DATABASE_ERROR, etc.), each with French messages and stable machine-readable codes.
- **Global Error Middleware**: The `errorHandler` function is registered as the last Express middleware in `app.ts` (line 474). It inspects whether an error is an `AppError` instance to determine status code, error code, and message. For non-`AppError` exceptions it defaults to 500/INTERNAL_ERROR.
- **404 Handler**: A separate `notFoundHandler` in `backend/src/common/filters/not-found.filter.ts` catches unmatched routes before the global error handler.

**Validation Integration**

- `validateDto()` and `validateQuery()` utilities (`backend/src/common/utils/validate-dto.util.ts`) wrap Zod schema validation and throw `AppError(400, 'VALIDATION_ERROR')` with structured `errors` details containing `{ field, message, code }` arrays when parsing fails.

**Propagation Pattern**

Controllers and services throughout `backend/src/modules/*` consistently:
1. Throw `new AppError(message, statusCode, CODE)` for business logic errors
2. Use try/catch blocks that forward errors via `next(error)` to the global handler
3. Avoid returning raw Error objects — only `AppError` or successful responses are produced

**Response Contract**

All errors return a uniform JSON shape:
```json
{
  "success": false,
  "error": { "code", "message", "details?", "stack?" },
  "timestamp": "ISO string",
  "path": "/api/..."
}
```
The `stack` field is included only when `NODE_ENV=development`.

**Logging Strategy**

- Status ≥ 500 → `logger.error` with full stack, IP, method, path
- Client errors (4xx) → `logger.warn` without stack

**Conventions for Developers**

- Always throw `AppError` instead of plain `Error` or throwing strings
- Choose descriptive uppercase codes (e.g., `MISSING_ETABLISSEMENT`, `CANNOT_DELETE_ACTIVE`, `INVALID_CODE_ETABLISSEMENT`) rather than generic ones
- Include `details` payloads for client-side actionable information (validation fields, duplicate keys)
- Let the global handler manage logging and response formatting — never construct JSON responses manually for error paths
- Prefer the `Errors.*` constants for standard HTTP semantics; define new constants in the same file when introducing domain-specific codes