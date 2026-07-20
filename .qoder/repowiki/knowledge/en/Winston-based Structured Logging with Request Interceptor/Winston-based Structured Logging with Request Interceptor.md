---
kind: logging_system
name: Winston-based Structured Logging with Request Interceptor
category: logging_system
scope:
    - '**'
source_files:
    - backend/src/common/utils/logger.util.ts
    - backend/src/common/interceptors/request-logger.interceptor.ts
    - backend/src/app.ts
    - backend/src/index.ts
---

The eLISAschool backend uses a centralized Winston logging system that provides structured, multi-sink output for both development and production environments.

**Core Framework & Configuration**
The logging infrastructure is defined in `backend/src/common/utils/logger.util.ts` and exports a single configured Winston logger instance. The configuration includes:
- Custom log levels: error (0), warn (1), info (2), debug (3)
- Timestamped formatting with ISO-like timestamps (`YYYY-MM-DD HH:mm:ss`)
- Automatic stack trace inclusion for errors via `winston.format.errors({ stack: true })`
- JSON metadata serialization for additional context fields
- Colorized console output using ANSI colors per level

**Log Sinks & Rotation**
Three transport sinks are configured:
1. **Console**: Always active with colorized output for development visibility
2. **Error file** (`logs/error.log`): Captures only ERROR level logs with 5MB rotation, keeping 5 files
3. **Combined file** (`logs/combined.log`): Captures all log levels with same rotation policy

**Environment-Aware Behavior**
- Default log level is controlled by `LOG_LEVEL` environment variable (defaults to 'info')
- Development mode automatically switches to 'debug' level when `NODE_ENV=development`
- Production deployments can tune verbosity via `LOG_LEVEL` without code changes

**HTTP Request Logging**
A dedicated Express middleware (`backend/src/common/interceptors/request-logger.interceptor.ts`) provides automatic request/response logging:
- Logs incoming requests with method, path, client IP, and truncated User-Agent
- Automatically determines log level based on HTTP status codes (5xx→error, 4xx→warn, others→info)
- Includes response duration in milliseconds
- Uses the shared logger instance for consistent formatting

**Structured Log Format**
All logs follow a consistent structure: `[timestamp] [LEVEL]: message {metadata}` where metadata is serialized as JSON when present. This enables machine parsing and integration with log aggregation systems.

**Usage Pattern**
Modules import the logger via `@common/utils/logger.util` and use standard methods: `logger.info()`, `logger.warn()`, `logger.error()`, `logger.debug()`. The interceptor pattern ensures HTTP layer logging is automatic without manual instrumentation in controllers.