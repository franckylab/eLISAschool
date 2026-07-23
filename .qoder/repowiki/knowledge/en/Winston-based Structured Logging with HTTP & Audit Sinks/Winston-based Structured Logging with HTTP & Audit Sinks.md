---
kind: logging_system
name: Winston-based Structured Logging with HTTP & Audit Sinks
category: logging_system
scope:
    - '**'
source_files:
    - backend/src/common/utils/logger.util.ts
    - backend/src/common/interceptors/request-logger.interceptor.ts
    - backend/src/common/filters/error.filter.ts
    - backend/src/common/interceptors/audit.interceptor.ts
    - backend/src/app.ts
---

## What system/approach is used
The backend uses **Winston** as the centralized logging framework. A single shared logger instance is created in `backend/src/common/utils/logger.util.ts` and exported for consumption across all modules, interceptors, services, and scripts. The frontend does not implement its own logging — it relies on the backend API responses and browser console.

## Key files and packages
- `backend/src/common/utils/logger.util.ts` — Winston configuration, transports, format, level strategy
- `backend/src/common/interceptors/request-logger.interceptor.ts` — HTTP request/response logging middleware
- `backend/src/common/filters/error.filter.ts` — Global error handler that logs errors/warnings via the shared logger
- `backend/src/common/interceptors/audit.interceptor.ts` — Automatic audit interceptor that also emits warnings/errors through the same logger
- `backend/src/app.ts` — wires `requestLogger` middleware into the Express pipeline (line 259)
- `backend/logs/` — runtime log directory containing `error.log` and `combined.log`

## Architecture and conventions
- **Single logger singleton**: All code imports `{ logger }` from `@common/utils/logger.util`; there are no per-module logger instances.
- **Log levels**: Custom numeric levels (`error:0`, `warn:1`, `info:2`, `debug:3`) with a colorized console formatter. Level defaults to `process.env.LOG_LEVEL || 'info'` and is forced to `'debug'` when `NODE_ENV === 'development'`.
- **Structured fields**: The `printf` formatter accepts arbitrary metadata objects; callers pass context as the second argument (e.g. `{ ip, userAgent }`, `{ path, method, stack }`). Metadata is JSON-stringified and appended to the message line.
- **Transports**:
  - Console (always active) with colorization.
  - File `logs/error.log` at `error` level only, rotated by size (5 MB) with 5 rolling files.
  - File `logs/combined.log` at all levels, same rotation policy.
- **HTTP request logging**: `requestLogger` middleware logs every incoming request with method/path/IP/user-agent, then logs the response on `finish`, selecting the log level based on status code (`>=500 → error`, `>=400 → warn`, else `info`).
- **Error handling**: The global `errorHandler` filter logs server-side errors (`statusCode >= 500`) with full stack traces and client-side validation/auth errors as warnings, both including `path`, `method`, `ip`.
- **Audit integration**: The audit interceptor writes operational audit records to the database but also emits `logger.warn` / `logger.error` for interceptor-level issues so they appear in the file/console sinks.
- **No distributed/remote sink**: There is no Elasticsearch, Splunk, Datadog, or cloud collector configured — logs stay local to the container/process filesystem under `backend/logs/`.

## Rules developers should follow
1. **Always import from the shared logger**: use `import { logger } from '@common/utils/logger.util'`; do not create new Winston instances or fall back to `console.log` for production paths.
2. **Use structured metadata**: pass contextual data as the second argument object (e.g. `{ etablissementId, userId, action }`) so downstream consumers can parse JSON fields.
3. **Pick the right level**: `error` for unexpected/server failures, `warn` for expected-but-notable conditions (validation failures, rate limits), `info` for normal operations, `debug` for development-only detail.
4. **Do not log secrets**: avoid attaching passwords, tokens, or PII to log metadata; the file transport persists everything unencrypted.
5. **Keep messages concise**; put detailed payloads in the metadata object rather than stringifying large bodies inline.