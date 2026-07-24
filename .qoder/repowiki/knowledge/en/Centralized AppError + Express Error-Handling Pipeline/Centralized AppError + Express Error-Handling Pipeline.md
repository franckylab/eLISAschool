---
kind: error_handling
name: Centralized AppError + Express Error-Handling Pipeline
category: error_handling
scope:
    - '**'
source_files:
    - backend/src/common/filters/error.filter.ts
    - backend/src/common/filters/not-found.filter.ts
    - backend/src/common/interceptors/request-logger.interceptor.ts
    - backend/src/common/utils/validate-dto.util.ts
    - shared/src/types/api.types.ts
    - shared/src/helpers/system-protection.helper.ts
    - backend/src/modules/auth/middlewares/auth.middleware.ts
    - backend/src/modules/auth/middlewares/permission.middleware.ts
    - backend/src/modules/auth/middlewares/etablissement.middleware.ts
    - backend/src/app.ts
---

The eLISAschool backend implements a centralized, Express-based error handling system built around a custom `AppError` class and a global error middleware pipeline. The approach is consistent across all modules and enforces structured error responses with machine-readable codes.

**Core System**
- `AppError` class (`backend/src/common/filters/error.filter.ts`) extends `Error` with `statusCode`, `code`, `isOperational`, and optional `details` fields. It captures stack traces via `Error.captureStackTrace`.
- A pre-defined `Errors` object provides sentinel instances for common cases: `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `BAD_REQUEST`, `VALIDATION_ERROR`, `CONFLICT`, `DUPLICATE_ENTRY`, `INTERNAL_ERROR`, `DATABASE_ERROR`.
- Global `errorHandler` middleware (Express error signature `(err, req, res, next)`) inspects whether the thrown value is an `AppError` to determine status code and response shape; otherwise defaults to 500.
- A separate `notFoundHandler` catches unmatched routes and returns a standardized 404 JSON.

**Response Contract**
All errors return a uniform JSON envelope defined in `shared/src/types/api.types.ts`:
```json
{
  "success": false,
  "error": { "code": string, "message": string, "details"?: Record },
  "timestamp": string,
  "path": string
}
```
Stack traces are included only when `NODE_ENV === 'development'`.

**Propagation Pattern**
Controllers wrap async handlers in `try/catch` and forward any caught exception to `next(error)`, letting the global `errorHandler` format the response. Services throw `AppError` directly with explicit HTTP codes and domain-specific error codes (e.g., `MISSING_ETABLISSEMENT`, `NOT_FOUND`). Validation utilities (`validateDto`, `validateQuery` in `backend/src/common/utils/validate-dto.util.ts`) convert Zod parse failures into `AppError(400, 'VALIDATION_ERROR', { errors })` with field-level detail arrays.

**Middleware & Interceptors**
- `requestLogger.interceptor.ts` logs every request/response pair, using log level based on status code (info ≤399, warn 4xx, error ≥5xx).
- Auth and permission middlewares (`auth.middleware.ts`, `permission.middleware.ts`, `etablissement.middleware.ts`) throw `AppError` for authentication/authorization failures rather than returning early responses.
- Rate limiters (`express-rate-limit`) return their own JSON bodies for `TOO_MANY_REQUESTS` before reaching the error handler.

**Shared Layer Conventions**
The `shared` package throws plain `Error` objects augmented with `statusCode` and `code` properties (see `system-protection.helper.ts`), which the global error handler still recognizes because it checks `instanceof AppError` first and falls back to treating unknown errors as 500s.

**Developer Rules Observed**
1. Throw `AppError` with explicit `statusCode` and a stable `code` string — never bare `throw new Error(...)` from business logic.
2. Wrap controller body in `try/catch` and call `next(error)` so the global handler formats the response.
3. Use `validateDto` / `validateQuery` for input validation instead of ad-hoc checks.
4. Do not catch and swallow errors in services — propagate them upward.
5. Use the `Errors` sentinel constants for standard HTTP scenarios to keep codes consistent.