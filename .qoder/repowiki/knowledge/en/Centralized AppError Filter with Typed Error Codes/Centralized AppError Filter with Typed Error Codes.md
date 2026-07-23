---
kind: error_handling
name: Centralized AppError Filter with Typed Error Codes
category: error_handling
scope:
    - '**'
source_files:
    - backend/src/common/filters/error.filter.ts
    - backend/src/common/filters/not-found.filter.ts
    - backend/src/app.ts
---

The eLISAschool backend implements a centralized error handling system built around a custom `AppError` class and an Express error middleware, providing consistent HTTP responses across all modules.

**Core System**
- `AppError` class (`backend/src/common/filters/error.filter.ts`) extends `Error` with typed properties: `statusCode`, `code` (machine-readable string), `isOperational`, and optional `details`. It captures stack traces via `Error.captureStackTrace`.
- A static `Errors` registry provides pre-instantiated sentinel errors for common cases: `UNAUTHORIZED`, `INVALID_TOKEN`, `FORBIDDEN`, `INSUFFICIENT_PERMISSIONS`, `NOT_FOUND`, `USER_NOT_FOUND`, `BAD_REQUEST`, `VALIDATION_ERROR`, `CONFLICT`, `DUPLICATE_ENTRY`, `INTERNAL_ERROR`, `DATABASE_ERROR`.
- The `errorHandler` middleware inspects thrown errors — if `instanceof AppError`, it uses the error's code/status/message; otherwise defaults to 500/`INTERNAL_ERROR` with a generic message. In development, stack traces are included in the response; in production they are suppressed.
- A separate `notFoundHandler` catches unmatched routes and returns a structured 404 JSON with the same envelope shape.
- Both are registered at the bottom of `app.ts` as the final two `app.use()` calls, ensuring they catch all unhandled exceptions from mounted controllers.

**Response Envelope**
All error responses follow a uniform JSON structure:
```json
{
  "success": false,
  "error": { "code", "message", "details?", "stack?" },
  "timestamp": "...",
  "path": "/api/..."
}
```
Success responses mirror this with `success: true` and a `data` field.

**Propagation Pattern**
Controllers and services throw `new AppError(message, statusCode, CODE)` rather than returning error objects or using try/catch blocks. The single global filter is the only place that converts errors to HTTP responses. Some route handlers wrap async logic in try/catch and forward via `next(error)`, but the central filter remains the sole response formatter.

**Logging Strategy**
- Server errors (≥500) are logged at `logger.error` with path, method, IP, and full stack.
- Client errors (<500) are logged at `logger.warn` without stacks.
- This keeps operational logs clean while preserving diagnostics for real failures.

**Conventions Observed Across Modules**
- Business-rule violations use domain-specific codes like `MISSING_ETABLISSEMENT`, `CANNOT_DELETE_ACTIVE`, `ALREADY_CLOSED`, `CANNOT_CLOSE_ACTIVE`, `NOT_CLOSED` (see `annees-scolaires.service.ts`).
- Multi-tenant guardrails in `tenant.middleware.ts` throw `AppError` for invalid establishment codes, missing tenant context, and unauthorized access attempts.
- Shared utilities (`system-guard.util.ts`, `image-processor.util.ts`, `validate-dto.util.ts`) also throw `AppError`, keeping cross-cutting concerns consistent.
- Scripts and test harnesses outside the request pipeline still throw plain `Error`s — these run in non-Express contexts and are not subject to the filter.

**What Is Not Used**
- No NestJS-style `@Catch` decorators or `HttpException` classes (the project is vanilla Express).
- No `panic`/`recover` pattern (Node.js convention).
- No per-module error types — everything funnels through the shared `AppError` + `Errors` registry.