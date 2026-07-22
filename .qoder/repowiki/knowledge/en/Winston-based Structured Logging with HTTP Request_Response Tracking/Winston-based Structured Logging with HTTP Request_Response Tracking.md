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
---

The eLISAschool backend uses a centralized, structured logging system built on Winston with custom formatting, multi-sink rotation, and automatic HTTP request/response correlation.

## System Overview
- Framework: Winston (v3) with custom levels and transports
- Entry point: backend/src/common/utils/logger.util.ts — single shared logger instance exported as `logger`
- HTTP instrumentation: Dedicated Express middleware `requestLogger` in `backend/src/common/interceptors/request-logger.interceptor.ts`
- Error correlation: Global error filter `error.filter.ts` logs errors with full context (path, method, IP, stack)

## Architecture & Sinks
The logger is configured with three sinks:
- Console: stdout, all levels, colorized
- Error file: logs/error.log, error level only, 5MB x 5 files rotation
- Combined file: logs/combined.log, all levels, 5MB x 5 files rotation

Log format includes: [YYYY-MM-DD HH:mm:ss] [LEVEL]: message {metadata} \nstack

Environment-driven behavior:
- LOG_LEVEL env var controls minimum level (default: info)
- In development (NODE_ENV=development), level is auto-promoted to debug

## Conventions & Usage Patterns
1. Single source of truth — all modules import from @common/utils/logger.util; no ad-hoc console logging in production code paths
2. Structured metadata — log calls pass objects as third argument for fields like { path, method, ip, userAgent, stack }
3. HTTP lifecycle logging — the requestLogger middleware automatically logs incoming requests and outgoing responses with status-derived log levels
4. Error handling — the global errorHandler catches unhandled exceptions and logs them at error level with full stack traces; client-facing errors (4xx) are logged at warn without stacks
5. Audit & tenant context — middlewares like tenant.middleware.ts and interceptors like audit.interceptor.ts use the same logger to attach tenant/user context to logs

## Where It Is Used
- Application bootstrap (src/app.ts) registers requestLogger middleware and errorHandler
- Cross-cutting concerns: error.filter.ts, request-logger.interceptor.ts, tenant.middleware.ts, audit.interceptor.ts, cache-metrics.service.ts, redis.service.ts
- Scripts and migrations under scripts/ and database/scripts/ also import the shared logger for consistent output during data operations

## Rules for Developers
- Always import logger from @common/utils/logger.util — never use console.log in runtime code
- Attach contextual metadata as the second argument object (e.g., { etablissementId, userId, action })
- Use logger.error for server-side failures, logger.warn for client errors/validation issues, logger.info for business events, logger.debug for detailed tracing
- Keep log messages concise; put large payloads in the metadata object so they serialize cleanly into JSON
- Do not log sensitive data (passwords, tokens, PII) — the combined log file is rotated but still persisted on disk