---
kind: logging_system
name: Winston-based Structured Logging with HTTP Request/Response Tracking
category: logging_system
scope:
    - '**'
source_files:
    - backend/src/common/utils/logger.util.ts
    - backend/src/common/interceptors/request-logger.interceptor.ts
    - backend/src/common/filters/error.filter.ts
    - backend/src/app.ts
    - backend/src/common/utils/index.ts
---

The eLISAschool backend uses a centralized, structured logging system built on Winston, configured once and consumed globally across the application. There is no ad-hoc console.log usage in runtime code — all production logging flows through a single logger instance.

### Framework and configuration
- Logger singleton: backend/src/common/utils/logger.util.ts creates one Winston logger with custom levels (error, warn, info, debug) and a printf format that emits [timestamp] [LEVEL]: message {metadata} lines.
- Transports (three sinks):
  - Console with colorized output for local development.
  - logs/error.log — error-level only, rotated at 5 MB x 5 files.
  - logs/combined.log — all levels, same rotation policy.
- Level strategy: LOG_LEVEL env var controls global threshold; overridden to debug when NODE_ENV=development.

### Cross-cutting log sources
- HTTP request/response tracking: backend/src/common/interceptors/request-logger.interceptor.ts logs every incoming request (method, path, IP, truncated User-Agent) and, on response finish, logs the status with an adaptive level (error >= 500, warn >= 400, info otherwise), including duration in ms. This interceptor is registered globally in app.ts before any route mounting.
- Global error handling: backend/src/common/filters/error.filter.ts catches all unhandled errors via Express's error middleware, logs server-side errors as error (with stack trace) and client/validation errors as warn, then returns a standardized JSON error envelope.
- Module & script usage: The shared @common/utils/index.ts re-exports logger, so controllers, services, middlewares, database seeds, and migration scripts import it uniformly from @common/utils/logger.util.

### Structured fields convention
Log entries carry contextual metadata as JSON objects rather than string interpolation:
- Request context: ip, userAgent, path, method, statusCode, duration.
- Error context: code, stack, details.
- Business operations (e.g., migrations, seeding) include step-by-step progress messages plus counts.

### Environment-driven behavior
- LOG_LEVEL: Global Winston threshold (default info).
- NODE_ENV=development: Forces debug level and includes stack traces in API error responses.

### Where to look
- Logger definition & transports: backend/src/common/utils/logger.util.ts
- HTTP request/response logger: backend/src/common/interceptors/request-logger.interceptor.ts
- Global error handler (logs + standardized response): backend/src/common/filters/error.filter.ts
- App bootstrap (where interceptors are mounted): backend/src/app.ts
- Re-export entrypoint used by modules: backend/src/common/utils/index.ts

### Rules developers should follow
1. Never use console.log in runtime code — import logger from @common/utils/logger.util (or via @common/utils).
2. Use structured metadata — pass contextual data as the second argument object, not interpolated into the message string.
3. Pick the right level — error for server failures, warn for client/validation issues, info for normal business events, debug for verbose tracing.
4. Do not log secrets — avoid attaching tokens, passwords, or full payloads to log metadata.
5. Rely on the global interceptors — do not duplicate per-request timing/status logging inside controllers; the requestLogger interceptor already covers this.