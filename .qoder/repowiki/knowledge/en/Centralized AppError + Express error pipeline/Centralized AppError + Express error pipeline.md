---
kind: error_handling
name: Centralized AppError + Express error pipeline
category: error_handling
scope:
    - '**'
source_files:
    - backend/src/common/filters/error.filter.ts
    - backend/src/common/filters/not-found.filter.ts
    - backend/src/common/filters/index.ts
    - backend/src/app.ts
    - backend/src/common/interceptors/request-logger.interceptor.ts
    - backend/src/common/utils/validate-dto.util.ts
    - backend/src/common/utils/system-guard.util.ts
---

The backend uses a single, centralized error-handling system built around a custom `AppError` class and an Express error middleware pipeline. There is no use of NestJS-style `HttpException`, `@nestjs/common` exceptions, or `panic/recover`; errors are propagated as thrown objects and caught by the global handler.

### Core types and sentinel constants
- `AppError` (`backend/src/common/filters/error.filter.ts`) extends `Error` and carries `statusCode`, `code`, `isOperational`, and optional `details`. It captures its own stack via `Error.captureStackTrace`.
- A pre-defined `Errors` object exports common sentinel instances (e.g. `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR`, `DUPLICATE_ENTRY`, `DATABASE_ERROR`) so callers can reuse stable error codes instead of constructing ad-hoc messages.
- Validation utilities (`validateDto`, `validateQuery` in `@common/utils/validate-dto.util.ts`) wrap Zod `safeParse` and throw `AppError(400, 'VALIDATION_ERROR', { errors: [...] })`, centralizing client-validation failure responses.
- Guard helpers like `assertNotSystem` (`system-guard.util.ts`) throw domain-specific `AppError`s with explicit codes such as `SYSTEM_ENTITY_PROTECTED`.

### Global error pipeline
- `errorHandler` (`error.filter.ts`) is registered last in `app.ts` as the Express error middleware. It:
  - Distinguishes `AppError` from generic `Error` to pick status code and code string.
  - Logs at `error` level for 5xx and `warn` for 4xx via the shared `logger`, including path, method, IP, and stack (stack only when `NODE_ENV=development`).
  - Returns a uniform JSON shape `{ success: false, error: { code, message, details? }, timestamp, path }`.
- `notFoundHandler` (`not-found.filter.ts`) is mounted just before the error handler to turn unmatched routes into a consistent 404 response using the same envelope.
- `requestLogger` interceptor logs every request/response pair and chooses log level based on the final HTTP status, giving visibility into both successful and failing flows.

### Propagation pattern across modules
- Controllers wrap async handlers in `try/catch` and forward any caught value to `next(error)`, letting the global `errorHandler` format it.
- Services and utilities throw `AppError` directly (with appropriate 4xx/5xx codes and semantic `code` strings). The controller layer never swallows these; it delegates formatting to the pipeline.
- Example usage is widespread: tenant middleware throws `INVALID_CODE_ETABLISSEMENT`, business services throw `MISSING_ETABLISSEMENT`, `CANNOT_DELETE_ACTIVE`, `ALREADY_CLOSED`, etc., and validation utilities throw `VALIDATION_ERROR` with structured field-level details.

### Conventions developers should follow
1. **Always throw `AppError`** (or one of the `Errors.*` sentinels) for expected business/validation failures — include a human-readable `message`, a numeric `statusCode`, and a stable uppercase `code`.
2. **Attach structured `details`** when useful (e.g. Zod validation arrays), but keep secrets out of `details` since they may be serialized in development.
3. **Let controllers delegate to `next(error)`** — do not build JSON responses inside controllers; rely on the global handler for consistent envelopes.
4. **Use guard helpers** (`assertNotSystem`, `validateDto`, `validateQuery`) rather than inline checks to keep error semantics uniform.
5. **Avoid `throw new Error(...)`** in application code paths that reach the API surface; reserve bare `Error` for truly unexpected crashes, which will still be caught by the global handler but will get a generic `INTERNAL_ERROR` code.