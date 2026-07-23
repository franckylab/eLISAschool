---
kind: logging_system
name: Winston-based Structured Logging with HTTP Request/Response Tracing
category: logging_system
scope:
    - '**'
source_files:
    - backend/src/common/utils/logger.util.ts
    - backend/src/common/interceptors/request-logger.interceptor.ts
    - backend/src/common/filters/error.filter.ts
    - backend/src/app.ts
---

The eLISAschool backend uses a centralized Winston logger to produce structured, multi-sink log output across the Express application and its scripts. The system is built around a single shared logger instance that writes to both console (colored) and rotating file transports, with an Express interceptor providing automatic per-request lifecycle logging and a global error filter that captures all unhandled exceptions.

### Framework and sinks
- **Framework**: `winston` is the sole logging library. A custom level hierarchy (`error:0`, `warn:1`, `info:2`, `debug:3`) is defined and applied globally.
- **Transports** (all under `backend/src/common/utils/logger.util.ts`):
  - Console transport with `colorize({ all: true })` for human-readable colored output.
  - File transport `logs/error.log` at level `error`, rotated by size (5 MB) and keeping 5 files.
  - File transport `logs/combined.log` at root level, same rotation policy.
- **Format**: A single `printf` formatter emits `[YYYY-MM-DD HH:mm:ss] [LEVEL]: message` followed by any attached metadata as JSON and appends the full stack trace when present.

### Log levels and environment behavior
- Level is driven by `process.env.LOG_LEVEL` (default `'info'`).
- When `NODE_ENV === 'development'`, the logger is automatically promoted to `'debug'`.
- No separate transports are configured per environment; only the level changes.

### HTTP request/response tracing
- A dedicated Express middleware `requestLogger` (`backend/src/common/interceptors/request-logger.interceptor.ts`) is registered early in `createApp()` so every incoming request is logged with method, path, client IP, and truncated User-Agent.
- On response finish it logs status code and duration, selecting the log level based on the status: `>= 500 -> error`, `>= 400 -> warn`, otherwise `info`.

### Error handling integration
- The global `errorHandler` filter (`backend/src/common/filters/error.filter.ts`) catches all thrown errors, logs server-side failures at `error` level (including `path`, `method`, `ip`, `stack`) and client/validation issues at `warn` level, then returns a standardized `{ success: false, error: { code, message, details? }, timestamp, path }` JSON body. Stack traces are included in responses only when `NODE_ENV === 'development'`.

### Usage conventions across the codebase
- All modules import the singleton via `import { logger } from '@common/utils/logger.util'` (or the default export). It is used consistently in controllers, services, middlewares, database seeds/scripts, and CLI migration scripts.
- Common patterns observed:
  - Human-friendly emoji-prefixed messages for operational milestones (e.g., `🚀 Démarrage de la migration...`, `✅ Connexion base de données établie`).
  - Structured metadata passed as the second argument to `logger.info/warn/error` calls (e.g., `{ ip, userAgent }`, `{ path, method }`, `{ migratedCount, skippedCount }`).
  - Errors caught inside business logic call `logger.error(...)` with the raw error object or stringified message.

### Output layout
- Console lines look like: `[2026-06-21 14:30:00] [INFO]: ➡️ POST /api/auth/login { ip: "::1", userAgent: "Mozilla/..." }`
- File outputs follow the same format without color codes, one entry per line, with optional trailing JSON metadata blocks.

### Rules developers should follow
1. **Always use the shared logger** — import from `@common/utils/logger.util`; do not create ad-hoc `console.log` statements for production paths.
2. **Pick the right level** — `error` for unexpected/server failures, `warn` for expected-but-abnormal conditions (client errors, rate limits), `info` for normal operational events, `debug` for verbose diagnostics (only active in development).
3. **Attach structured metadata** — pass a plain object as the second argument to include contextual fields (`path`, `method`, `ip`, `etablissementId`, etc.) rather than embedding them in the message string.
4. **Do not log secrets** — avoid including passwords, tokens, or PII in log messages or metadata.
5. **Let the error handler centralize exception logging** — throw `AppError` instances for known failure modes; let `errorHandler` capture and log them. Only catch-and-log when you need additional context before rethrowing.
6. **Keep messages concise** — put detailed context in metadata; keep the message string short and readable.