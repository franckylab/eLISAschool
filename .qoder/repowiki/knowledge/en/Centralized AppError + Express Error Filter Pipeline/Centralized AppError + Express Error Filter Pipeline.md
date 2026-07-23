---
kind: error_handling
name: Centralized AppError + Express Error Filter Pipeline
category: error_handling
scope:
    - '**'
source_files:
    - backend/src/common/filters/error.filter.ts
    - backend/src/common/filters/not-found.filter.ts
    - backend/src/common/utils/validate-dto.util.ts
    - backend/src/common/middlewares/tenant.middleware.ts
    - backend/src/app.ts
---

The eLISAschool backend implements a centralized error-handling system built around a custom AppError class and an Express error filter, with consistent propagation through middleware chains and standardized JSON responses consumed by the React frontend.

Core types and factory constants:
- backend/src/common/filters/error.filter.ts defines AppError extends Error carrying statusCode, code, isOperational, and optional details. A prebuilt Errors object exposes sentinel instances for common cases (UNAUTHORIZED, FORBIDDEN, NOT_FOUND, BAD_REQUEST, VALIDATION_ERROR, CONFLICT, DUPLICATE_ENTRY, INTERNAL_ERROR, DATABASE_ERROR).
- The same file exports errorHandler, the global Express error middleware that distinguishes AppError from generic Error to pick status code/code/message, logs server errors via logger.error with path/method/ip/stack and client errors via logger.warn, and returns a uniform { success: false, error: { code, message, details }, timestamp, path } body; stack is included only in development.

Global wiring:
- backend/src/app.ts mounts notFoundHandler (404 route not found) then errorHandler at the very end of the middleware chain, so any unhandled exception bubbles up to this single sink.

Propagation conventions across modules:
- Controllers/services throw new AppError(message, statusCode, CODE) directly — no try/catch wrapping needed because the global filter handles it. Examples are pervasive in modules/annees-scolaires/services/annees-scolaires.service.ts, common/utils/image-processor.util.ts, common/utils/system-guard.util.ts, and common/middlewares/tenant.middleware.ts.
- When catching lower-level exceptions (e.g., DB or third-party calls), code re-throws as AppError with a domain-specific code rather than bubbling raw Error. See tenant.middleware.ts lines 128-135 where a caught error is wrapped into TENANT_RESOLUTION_ERROR.
- Validation helpers centralize Zod failures: validateDto/validateQuery in backend/src/common/utils/validate-dto.util.ts convert ZodError into a single AppError(400, 'VALIDATION_ERROR', true, { errors }) containing per-field { field, message, code } entries.

Frontend consumption pattern:
- Frontend hooks uniformly read error.response?.data?.error?.message (and occasionally .code) from Axios errors and surface them via toast.error(...). There is no dedicated API interceptor; each feature hook performs its own fallback to a French default string when the response payload is missing. This means the contract between backend errorHandler and frontend toast consumers is implicit but consistently followed.

Architecture and design decisions:
- Single source of truth for error shape lives in @common/filters/error.filter.ts; business layers never construct raw HTTP responses.
- Operational vs. unexpected errors are distinguished by the isOperational flag on AppError, allowing the logger to treat 4xx/409 as warnings and 5xx as errors.
- Multi-tenancy and auth concerns live in middlewares that translate authorization failures into AppError(403, ...) codes (ACCESS_DENIED, NO_ACTIVE_ETABLISSEMENT, NO_ETABLISSEMENT), keeping controllers free of cross-cutting logic.
- No panic/recover usage — Node.js unhandled promise rejections are left to the process default, which is acceptable given the global error filter catches synchronous throws and controller-level try/catch -> next(error) patterns used in legacy-style routes.

Rules developers should follow:
1. Always throw AppError (or one of the Errors.* sentinels) for domain/business errors; never return plain strings or throw bare Error objects.
2. Use validateDto/validateQuery for input validation instead of ad-hoc checks; they already emit VALIDATION_ERROR with structured details.errors.
3. Wrap low-level catch blocks by re-throwing as AppError with a descriptive code; do not swallow exceptions silently.
4. Do not build response objects in services/controllers — let errorHandler serialize the standard { success, error, timestamp, path } envelope.
5. On the frontend, prefer reading error.response.data.error.message (with a French fallback) when displaying toasts; avoid hard-coding different shapes per endpoint.