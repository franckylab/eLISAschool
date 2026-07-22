---
kind: logging_system
name: Winston-based Structured Logging with Centralized Sinks
category: logging_system
scope:
    - '**'
source_files:
    - backend/src/common/utils/logger.util.ts
    - backend/src/common/interceptors/request-logger.interceptor.ts
    - backend/src/common/filters/error.filter.ts
    - backend/package.json
---

The eLISAschool backend uses **Winston** as its logging framework, configured through a single centralized utility and consumed consistently across the application via a shared logger instance.

## System Overview
- **Framework**: Winston v3.17.0 (`winston` dependency in `backend/package.json`)
- **Configuration**: Single source of truth in `backend/src/common/utils/logger.util.ts`
- **Transport Strategy**: Three sinks — colored console output, rolling error-only file logs, and combined rolling file logs
- **Log Levels**: Custom severity ordering: `error(0) > warn(1) > info(2) > debug(3)`
- **Structured Fields**: All log entries include timestamp, level, message, optional metadata JSON, and stack traces for errors

## Architecture & Conventions

### Logger Factory (`logger.util.ts`)
- Exposes both named `logger` and default export for flexible imports
- Level is controlled by `LOG_LEVEL` env var (defaults to `'info'`) and auto-promoted to `'debug'` when `NODE_ENV=development`
- Console transport uses colorized output; file transports use plain text with timestamps
- File rotation: 5MB max size, 5 rotated files per sink

### HTTP Request Logging (`request-logger.interceptor.ts`)
- Express interceptor that logs every incoming request with method, path, IP, and user agent
- On response finish, logs status code and duration, selecting log level based on status: `error` for ≥500, `warn` for ≥400, `info` otherwise
- Provides automatic request/response correlation without manual instrumentation

### Global Error Handling (`error.filter.ts`)
- Central `AppError` class with structured fields: `statusCode`, `code`, `isOperational`, `details`
- Predefined error constants (`Errors.UNAUTHORIZED`, `Errors.NOT_FOUND`, etc.) ensure consistent error codes
- `errorHandler` middleware logs server errors with full stack traces and client errors as warnings, always including `path`, `method`, `ip`
- Development responses include stack traces; production omits them

### Usage Patterns Across Modules
- Import pattern: `import { logger } from '@common/utils/logger.util'` (via tsconfig path alias)
- Common call sites: controllers, services, database scripts, seeders, migration runners, Redis/cache utilities
- Typical usage: `logger.info('message', { contextualFields })` or `logger.error('message', { stack: error.stack })`

## Log Output Structure
Each log line follows this format:
```
[YYYY-MM-DD HH:mm:ss] [LEVEL]: message {json_metadata}
```
Stack traces are appended inline for error-level entries.

## Sinks & Routing
| Sink | Transport | Level | Rotation | Path |
|------|-----------|-------|----------|------|
| Console | Console | Configurable | None | stdout |
| Errors | File | `error` only | 5MB × 5 files | `logs/error.log` |
| Combined | File | All levels | 5MB × 5 files | `logs/combined.log` |

## Rules for Developers
1. **Always import from the shared logger** — never use `console.log` in application code
2. **Use structured metadata** — pass objects as the second argument to attach context (user IDs, tenant IDs, operation names)
3. **Choose appropriate levels** — `error` for failures, `warn` for recoverable issues, `info` for operational events, `debug` for verbose tracing
4. **Never log secrets** — avoid including passwords, tokens, or PII in log messages or metadata
5. **Let the global error handler do its job** — throw `AppError` instances instead of manually logging in catch blocks where possible
6. **Use emoji-free messages in production** — many current log messages contain emojis (🚀, ✅, ❌) which may not render correctly in all log aggregators