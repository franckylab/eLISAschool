---
kind: error_handling
name: Centralized AppError + Express Error Filter with Frontend Code Mapping
category: error_handling
scope:
    - '**'
source_files:
    - backend/src/common/filters/error.filter.ts
    - backend/src/common/filters/not-found.filter.ts
    - backend/src/app.ts
    - backend/src/common/middlewares/tenant.middleware.ts
    - frontend/src/features/auth/LoginPage.tsx
---

The eLISAschool monorepo implements a centralized, code-driven error handling strategy built around a custom `AppError` class and an Express-level error filter. The system is designed to propagate structured errors from NestJS controllers/services up through the Express pipeline, where they are normalized into a consistent JSON response shape consumed by the React frontend.

**Core error type and factory**
- `backend/src/common/filters/error.filter.ts` defines `class AppError extends Error` with fields `statusCode`, `code`, `isOperational`, and optional `details`. It also exports a static `Errors` object of prebuilt sentinel instances (UNAUTHORIZED, FORBIDDEN, NOT_FOUND, BAD_REQUEST, VALIDATION_ERROR, CONFLICT, DUPLICATE_ENTRY, INTERNAL_ERROR, DATABASE_ERROR).
- Controllers, services, and middlewares throughout `backend/src/modules/*` throw `new AppError(message, statusCode, code)` rather than using Nest's built-in `HttpException` classes — this pattern is visible across dozens of modules (e.g., `annees-scolaires.service.ts`, `annonces.controller.ts`, `tenant.middleware.ts`).

**Global error propagation**
- `app.ts` mounts `notFoundHandler` and `errorHandler` as the last two Express middleware, so any unhandled `throw new AppError(...)` or caught exception bubbles to these handlers.
- `errorHandler` inspects `instanceof AppError` to decide status/code/message, logs 5xx errors with stack via `@common/utils/logger.logger`, attaches `stack` only in development (`NODE_ENV === 'development'`), and always returns `{ success: false, error: { code, message, details? }, timestamp, path }`.
- `not-found.filter.ts` handles unmatched routes with the same envelope shape and code `'NOT_FOUND'`.

**Middleware integration**
- `backend/src/common/middlewares/tenant.middleware.ts` throws `AppError` for multi-tenant access violations (`ACCESS_DENIED`, `NO_ACTIVE_ETABLISSEMENT`, `NO_ETABLISSEMENT`) and re-throws caught `AppError` instances unchanged, letting the global filter handle them.
- Public route wiring in `app.ts` (e.g., `/api/eleves/preinscription`) uses try/catch → `next(error)` to forward thrown `AppError`s into the same pipeline.

**Frontend consumption**
- The React SPA reads the backend error contract directly: `LoginPage.tsx` maps `err.code` values like `INVALID_CREDENTIALS`, `ACCOUNT_LOCKED`, `ACCOUNT_SUSPENDED`, `NO_ETABLISSEMENT`, `VALIDATION_ERROR`, `MISSING_IDENTIFIER`, `TOO_MANY_REQUESTS` to localized user messages and UI state (lock timers, remaining attempts). This shows the frontend expects the backend to return the `error.code` field inside the `{ success: false, error: {...} }` envelope.
- Other feature components follow the same catch-and-display pattern, typically falling back to generic HTTP-status-based messages when no specific code matches.

**Conventions developers should follow**
1. Throw `AppError` (or reuse `Errors.XXX`) instead of raw `Error` or Nest `HttpException` — this ensures every business/validation/authorization failure carries a stable machine-readable `code`.
2. Always pass a meaningful `code` string (e.g., `MISSING_ETABLISSEMENT`, `CANNOT_DELETE_ACTIVE`, `ALREADY_CLOSED`) that the frontend can branch on; avoid ad-hoc strings.
3. Use `details?: Record<string, unknown>` to carry structured context (remaining attempts, lock expiry) rather than embedding it in `message`.
4. In middlewares/controllers, wrap async blocks in try/catch and re-throw `AppError` for expected failures; let unexpected exceptions bubble to `errorHandler`.
5. Do not swallow errors silently — if you must catch, log and convert to `AppError` before re-throwing so the global filter still produces a uniform response.