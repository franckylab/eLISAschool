---
kind: logging_system
name: Winston-based Structured Logging with HTTP Request Interception
category: logging_system
scope:
    - '**'
source_files:
    - backend/src/common/utils/logger.util.ts
    - backend/src/common/interceptors/request-logger.interceptor.ts
    - backend/src/app.ts
---

## What system/approach is used
The backend uses **Winston** as the centralized logging framework. A single shared logger instance (`logger`) is exported from `backend/src/common/utils/logger.util.ts` and imported across services, controllers, scripts, and middlewares. The application also includes a custom Express interceptor that automatically logs every incoming/outgoing HTTP request with timing and status codes.

## Key files and packages
- `backend/src/common/utils/logger.util.ts` — Winston configuration, transports, format, level management
- `backend/src/common/interceptors/request-logger.interceptor.ts` — HTTP request/response logging middleware
- `backend/src/app.ts` — wires `requestLogger` into the Express pipeline
- `backend/logs/error.log`, `backend/logs/combined.log` — default log file sinks
- Widely consumed in modules: `@modules/*/services/*.ts`, `@common/services/*.ts`, `scripts/*.ts`

## Architecture and conventions
- **Single logger singleton**: All code imports `logger` from `@common/utils/logger.util`; no per-module logger instances are created.
- **Log levels**: Custom numeric ordering `error(0) > warn(1) > info(2) > debug(3)`. Level is driven by `LOG_LEVEL` env var; defaults to `info`, overridden to `debug` when `NODE_ENV=development`.
- **Structured metadata**: Calls like `logger.info('message', { ip, userAgent })` attach arbitrary JSON metadata that gets serialized alongside the message.
- **Transports**:
  - Console transport with colorized output (for local/dev).
  - File transport `logs/error.log` for `error` level only.
  - File transport `logs/combined.log` for all levels.
  - Both file transports rotate at 5 MB with up to 5 rotated files.
- **HTTP request interception**: `requestLogger` middleware logs each request on entry (method, path, IP, truncated User-Agent) and on response finish with status-code-driven level selection (`>=500` → error, `>=400` → warn, else info), including duration in ms.
- **Error formatting**: `winston.format.errors({ stack: true })` ensures thrown objects include stack traces in logs.
- **Audit & tenant context**: Other interceptors/middlewares (`audit.interceptor.ts`, `tenant.middleware.ts`) also call `logger.info/warn/error`, keeping audit trails and multi-tenant resolution visible in logs.

## Rules developers should follow
- Always import the shared logger via `import { logger } from '@common/utils/logger.util';` — do not create your own Winston instance.
- Use structured metadata as the second argument: `logger.info('action', { userId, etablissementId, ... })` so downstream consumers can filter/search.
- Pick the correct level: `error` for failures, `warn` for non-fatal issues, `info` for business events, `debug` for verbose diagnostics (only effective in development).
- Do not use `console.log` / `console.error` inside module code; rely on `logger` so output goes through the configured transports.
- Keep sensitive data out of log messages or metadata (passwords, tokens, PII). If needed, redact before logging.
- For long-running operations, log start/end pairs with correlation IDs if available, so request flows can be traced across multiple service calls.