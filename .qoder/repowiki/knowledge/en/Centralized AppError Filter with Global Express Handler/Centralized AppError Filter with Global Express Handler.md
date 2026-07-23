---
kind: error_handling
name: Centralized AppError Filter with Global Express Handler
category: error_handling
scope:
    - '**'
source_files:
    - backend/src/common/filters/error.filter.ts
    - backend/src/common/filters/not-found.filter.ts
    - backend/src/common/filters/index.ts
    - backend/src/app.ts
---

The backend uses a centralized error handling system built around a custom `AppError` class and a global Express error middleware, complemented by a dedicated 404 handler.

**Core types and factory**
- `AppError` (in `backend/src/common/filters/error.filter.ts`) extends `Error` and carries `statusCode`, `code`, `isOperational`, and optional `details`. It captures its own stack via `Error.captureStackTrace`.
- A prebuilt `Errors` object exposes sentinel instances for common cases: `UNAUTHORIZED`, `INVALID_TOKEN`, `FORBIDDEN`, `INSUFFICIENT_PERMISSIONS`, `NOT_FOUND`, `USER_NOT_FOUND`, `BAD_REQUEST`, `VALIDATION_ERROR`, `CONFLICT`, `DUPLICATE_ENTRY`, `INTERNAL_ERROR`, `DATABASE_ERROR`.
- The module re-exports `errorHandler`, `AppError`, `Errors` from `@common/filters/index.ts`.

**Global Express wiring**
- `app.ts` registers the handlers at the bottom of the pipeline:
  - `app.use(notFoundHandler)` — returns `{ success: false, error: { code: 'NOT_FOUND', message }, timestamp, path }` for unmatched routes.
  - `app.use(errorHandler)` — the final `(err, req, res, next)` Express middleware.

**Global error handler behavior (`errorHandler`)**
- Distinguishes `AppError` vs plain `Error`; maps to status codes 4xx/5xx accordingly.
- Logs 5xx as `logger.error` (with `path`, `method`, `ip`, `stack`) and 4xx as `logger.warn`.
- Always responds with a uniform JSON shape:
  ```json
  {
    "success": false,
    "error": { "code", "message", "details?", "stack?" },
    "timestamp": ISO string,
    "path": req.path
  }
  ```
- Includes `stack` only when `NODE_ENV === 'development'`.

**Usage patterns across modules**
- Business logic throws `new AppError(message, statusCode, code)` (e.g. tenant middleware, image processor, system guards, service classes like `annees-scolaires.service.ts`).
- Some catch blocks swallow errors without rethrowing an `AppError` (notably `redis.service.ts`, `cache-metrics.controller.ts`, `audit.interceptor.ts`), which means unhandled exceptions bubble up to the global handler as generic 500s.
- No TypeORM-specific filter was found; database errors are not mapped to domain codes and will surface as `INTERNAL_ERROR` / `DATABASE_ERROR` only if explicitly wrapped in `AppError`.

**Conventions developers should follow**
1. Throw `AppError` (or reuse a sentinel from `Errors`) for all expected business failures; never return raw `Error` or `throw` strings.
2. Use stable machine-readable `code` values (e.g. `MISSING_ETABLISSEMENT`, `CANNOT_DELETE_ACTIVE`) so clients can branch on them.
3. Wrap third-party / DB calls in try/catch and convert to `AppError` rather than letting them propagate as generic 500s.
4. Do not send responses inside controllers/services — let the global `errorHandler` format the response consistently.