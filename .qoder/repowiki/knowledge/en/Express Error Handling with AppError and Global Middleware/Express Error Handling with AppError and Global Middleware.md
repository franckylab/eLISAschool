---
kind: error_handling
name: Express Error Handling with AppError and Global Middleware
category: error_handling
scope:
    - '**'
source_files:
    - backend/src/common/filters/error.filter.ts
    - backend/src/common/filters/not-found.filter.ts
    - backend/src/common/interceptors/request-logger.interceptor.ts
    - backend/src/app.ts
---

The eLISAschool backend uses a custom error handling system built on Express.js, centered around a dedicated `AppError` class and global middleware. There is no NestJS involvement — the stack is pure Express with TypeScript.

### Core System
- **Custom error class**: `AppError` (in `backend/src/common/filters/error.filter.ts`) extends `Error` and carries `statusCode`, `code`, `isOperational`, and optional `details`. It captures its own stack trace via `Error.captureStackTrace`.
- **Predefined error constants**: An `Errors` object exports singleton instances for common cases (`UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `BAD_REQUEST`, `CONFLICT`, `INTERNAL_ERROR`, `DATABASE_ERROR`, etc.), each with a French message, HTTP code, and machine-readable code string.
- **Global error handler**: The `errorHandler` function is registered as an Express error middleware at the end of `app.ts` (line 474). It inspects whether the thrown value is an `AppError`, logs server errors (≥500) with full stack and client errors (<500) as warnings, and returns a uniform JSON shape:
  ```json
  { "success": false, "error": { "code", "message", "details?" }, "timestamp", "path" }
  ```
  In development (`NODE_ENV=development`) the response also includes the raw `stack`.
- **404 handler**: `notFoundHandler` in `backend/src/common/filters/not-found.filter.ts` catches unmatched routes before the global error handler and returns the same envelope with code `NOT_FOUND`.
- **Request logging**: `requestLogger.interceptor.ts` (misnamed as interceptor but is an Express middleware) logs every request/response pair, choosing log level by status code (`info` <400, `warn` 4xx, `error` 5xx).

### Propagation Pattern
Controllers and services throw `new AppError(message, statusCode, code)` directly. Routes wrap async handlers in try/catch and forward to Express via `next(error)` so the global handler can respond uniformly. Example from `app.ts` preinscription route: `throw new AppError('Code établissement invalide', 400, 'INVALID_CODE_ETABLISSEMENT')` followed by `catch (e) { next(e); }`.

### Bootstrap & Startup Errors
`src/index.ts` wraps the entire bootstrap in a try/catch; startup failures (DB connection, Redis, permission preload) are logged and cause `process.exit(1)` rather than being turned into HTTP responses.

### Conventions Observed
- Business-layer validation and authorization checks throw `AppError` with explicit codes instead of returning error objects or using sentinel values.
- The `Errors` constant object exists but is rarely used in module code — most modules construct `AppError` inline with ad-hoc code strings (e.g., `MISSING_ETABLISSEMENT`, `CANNOT_DELETE_ACTIVE`).
- No `@Catch` decorators, no NestJS `HttpException`, no `panic/recover` equivalents — this is plain Express.
- Frontend-facing error payloads are consistent across all paths (global error handler + 404 handler), making client-side error parsing straightforward.