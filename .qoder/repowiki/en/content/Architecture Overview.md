# Architecture Overview

<cite>
**Referenced Files in This Document**
- [README.md](file://README.md)
- [package.json](file://package.json)
- [docker/docker-compose.yml](file://docker/docker-compose.yml)
- [backend/src/index.ts](file://backend/src/index.ts)
- [backend/src/app.ts](file://backend/src/app.ts)
- [backend/src/config/env.config.ts](file://backend/src/config/env.config.ts)
- [backend/src/config/database.config.ts](file://backend/src/config/database.config.ts)
- [backend/src/common/utils/logger.util.ts](file://backend/src/common/utils/logger.util.ts)
- [backend/src/modules/auth/controllers/auth.controller.ts](file://backend/src/modules/auth/controllers/auth.controller.ts)
- [shared/src/index.ts](file://shared/src/index.ts)
- [shared/src/enums/modules.enum.ts](file://shared/src/enums/modules.enum.ts)
- [shared/src/types/api.types.ts](file://shared/src/types/api.types.ts)
- [shared/src/constants/app.constants.ts](file://shared/src/constants/app.constants.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)
10. [Appendices](#appendices)

## Introduction
This document presents the architecture of eLISAschool, a Progressive Web App (PWA) designed for school administration in Sub-Saharan Africa. It describes the high-level system design, modular backend built with Express and TypeScript, shared components architecture, and the PostgreSQL-backed persistence model. It also explains the separation of concerns across frontend, backend, and shared modules, system boundaries, data flows, integration patterns, and the PWA-related constraints and capabilities implied by the current repository structure.

## Project Structure
The repository follows a monorepo layout with three primary workspaces:
- backend: Express server with TypeScript, modular controllers/services/entities, and shared configuration.
- frontend: React + Vite PWA workspace (not analyzed here).
- shared: Shared TypeScript packages for enums, constants, types, validators, and configuration.

```mermaid
graph TB
subgraph "Monorepo Root"
PKG["Root package.json<br/>workspaces: backend, frontend, shared"]
end
subgraph "Backend Workspace"
BIDX["backend/src/index.ts"]
BAPP["backend/src/app.ts"]
BENV["backend/src/config/env.config.ts"]
BDB["backend/src/config/database.config.ts"]
BLOG["backend/src/common/utils/logger.util.ts"]
BAUTH["backend/src/modules/auth/controllers/auth.controller.ts"]
end
subgraph "Shared Workspace"
SSHARED["shared/src/index.ts"]
SMODS["shared/src/enums/modules.enum.ts"]
SAPI["shared/src/types/api.types.ts"]
SCONST["shared/src/constants/app.constants.ts"]
end
subgraph "Runtime Services"
DCMP["docker/docker-compose.yml"]
PG["PostgreSQL"]
RD["Redis"]
end
PKG --> BIDX
PKG --> SSHARED
BIDX --> BAPP
BAPP --> BAUTH
BIDX --> BDB
BDB --> PG
BAPP --> BENV
BAPP --> BLOG
BAUTH --> BENV
SSHARED --> SMODS
SSHARED --> SAPI
SSHARED --> SCONST
DCMP --> PG
DCMP --> RD
```

**Diagram sources**
- [package.json:1-33](file://package.json#L1-L33)
- [backend/src/index.ts:1-62](file://backend/src/index.ts#L1-L62)
- [backend/src/app.ts:1-205](file://backend/src/app.ts#L1-L205)
- [backend/src/config/env.config.ts:1-168](file://backend/src/config/env.config.ts#L1-L168)
- [backend/src/config/database.config.ts:1-54](file://backend/src/config/database.config.ts#L1-L54)
- [backend/src/common/utils/logger.util.ts:1-91](file://backend/src/common/utils/logger.util.ts#L1-L91)
- [backend/src/modules/auth/controllers/auth.controller.ts:1-268](file://backend/src/modules/auth/controllers/auth.controller.ts#L1-L268)
- [shared/src/index.ts:1-14](file://shared/src/index.ts#L1-L14)
- [shared/src/enums/modules.enum.ts:1-107](file://shared/src/enums/modules.enum.ts#L1-L107)
- [shared/src/types/api.types.ts:1-66](file://shared/src/types/api.types.ts#L1-L66)
- [shared/src/constants/app.constants.ts:1-81](file://shared/src/constants/app.constants.ts#L1-L81)
- [docker/docker-compose.yml:1-109](file://docker/docker-compose.yml#L1-L109)

**Section sources**
- [README.md:18-27](file://README.md#L18-L27)
- [package.json:8-12](file://package.json#L8-L12)
- [docker/docker-compose.yml:8-101](file://docker/docker-compose.yml#L8-L101)

## Core Components
- Backend entrypoint initializes environment, connects to PostgreSQL via TypeORM, and starts the HTTP server.
- Express application configures security middleware (Helmet, CORS, rate limiting), request parsing, logging, and mounts modular routes.
- Environment configuration is validated using Zod and grouped by domain (app, database, JWT, encryption, Redis, email, logging).
- Database configuration is driven by environment variables and supports development vs production differences (e.g., synchronization, SSL).
- Shared workspace exports enums, constants, types, validators, and configuration for reuse across backend and frontend.

Key implementation references:
- Backend bootstrap and server lifecycle: [backend/src/index.ts:22-58](file://backend/src/index.ts#L22-L58)
- Express app creation and route mounting: [backend/src/app.ts:58-204](file://backend/src/app.ts#L58-L204)
- Environment validation and typed config: [backend/src/config/env.config.ts:68-165](file://backend/src/config/env.config.ts#L68-L165)
- Database configuration options: [backend/src/config/database.config.ts:15-51](file://backend/src/config/database.config.ts#L15-L51)
- Logger setup: [backend/src/common/utils/logger.util.ts:58-82](file://backend/src/common/utils/logger.util.ts#L58-L82)
- Shared module exports: [shared/src/index.ts:9-14](file://shared/src/index.ts#L9-L14)

**Section sources**
- [backend/src/index.ts:22-58](file://backend/src/index.ts#L22-L58)
- [backend/src/app.ts:58-204](file://backend/src/app.ts#L58-L204)
- [backend/src/config/env.config.ts:68-165](file://backend/src/config/env.config.ts#L68-L165)
- [backend/src/config/database.config.ts:15-51](file://backend/src/config/database.config.ts#L15-L51)
- [backend/src/common/utils/logger.util.ts:58-82](file://backend/src/common/utils/logger.util.ts#L58-L82)
- [shared/src/index.ts:9-14](file://shared/src/index.ts#L9-L14)

## Architecture Overview
High-level system boundaries and interactions:
- Frontend (React + Vite PWA) communicates with the backend over HTTP/HTTPS.
- Backend exposes REST-style endpoints under /api and integrates with PostgreSQL for persistence and Redis for queues/synchronization.
- Shared workspace provides type-safe contracts and constants used by both backend and frontend.

```mermaid
graph TB
FE["Frontend (React + Vite PWA)"]
API["Backend (Express)"]
DB["PostgreSQL"]
REDIS["Redis"]
SH["Shared (Enums, Types, Constants)"]
FE --> |"HTTP/HTTPS"| API
API --> |"TypeORM"| DB
API --> |"Queues/Sync"| REDIS
API --> |"Validation/Config"| SH
FE --> |"Uses Types/Constants"| SH
```

**Diagram sources**
- [README.md:29-34](file://README.md#L29-L34)
- [docker/docker-compose.yml:10-46](file://docker/docker-compose.yml#L10-L46)
- [backend/src/app.ts:150-185](file://backend/src/app.ts#L150-L185)
- [shared/src/index.ts:9-14](file://shared/src/index.ts#L9-L14)

## Detailed Component Analysis

### Backend Bootstrapping and Runtime Lifecycle
The backend initializes environment variables, establishes a database connection, creates the Express app, and starts listening on the configured port. Graceful shutdown hooks destroy the database connection on termination signals.

```mermaid
sequenceDiagram
participant Proc as "Process"
participant Boot as "bootstrap()"
participant DS as "AppDataSource"
participant App as "Express App"
participant Srv as "HTTP Server"
Proc->>Boot : start
Boot->>DS : initialize()
DS-->>Boot : connected
Boot->>App : createApp()
App-->>Boot : app instance
Boot->>Srv : listen(port)
Srv-->>Boot : ready
Proc-->>DS : SIGTERM/SIGINT
DS-->>Proc : destroyed
```

**Diagram sources**
- [backend/src/index.ts:22-58](file://backend/src/index.ts#L22-L58)
- [backend/src/app.ts:124-143](file://backend/src/app.ts#L124-L143)

**Section sources**
- [backend/src/index.ts:22-58](file://backend/src/index.ts#L22-L58)
- [backend/src/app.ts:124-143](file://backend/src/app.ts#L124-L143)

### Express App Security and Middleware Pipeline
The Express app applies security middleware (CORS, Helmet, rate limiting), compression, JSON/URL encoding parsing, request logging, and mounts modular routes. It also registers global error handlers.

```mermaid
flowchart TD
Start(["Incoming Request"]) --> Helmet["Helmet CSP/HSTS"]
Helmet --> CORS["CORS per env.frontendUrl"]
CORS --> Limiter["Rate Limit (/api)"]
Limiter --> Compress["Compression"]
Compress --> Parse["JSON/URL-Encoded (10MB)"]
Parse --> Log["Request Logger Interceptor"]
Log --> Routes{"Route Match?"}
Routes --> |Yes| Handler["Module Controller"]
Routes --> |No| NotFound["404 Not Found"]
Handler --> Error["Global Error Filter"]
NotFound --> Error
Error --> End(["Response"])
```

**Diagram sources**
- [backend/src/app.ts:65-118](file://backend/src/app.ts#L65-L118)
- [backend/src/app.ts:149-198](file://backend/src/app.ts#L149-L198)

**Section sources**
- [backend/src/app.ts:65-118](file://backend/src/app.ts#L65-L118)
- [backend/src/app.ts:149-198](file://backend/src/app.ts#L149-L198)

### Authentication Controller Flow
The authentication controller validates payloads with Zod schemas, delegates to the AuthService, and returns standardized API responses. It also enforces middleware for protected routes.

```mermaid
sequenceDiagram
participant Client as "Client"
participant Ctrl as "auth.controller"
participant Zod as "Zod Schema"
participant Svc as "AuthService"
participant DB as "TypeORM Entities"
Client->>Ctrl : POST /api/auth/login
Ctrl->>Zod : validateBody(loginSchema)
Zod-->>Ctrl : parsed DTO
Ctrl->>Svc : login(dto, ip, userAgent)
Svc->>DB : fetch/find user
DB-->>Svc : user record
Svc-->>Ctrl : tokens/session
Ctrl-->>Client : ApiResponse
```

**Diagram sources**
- [backend/src/modules/auth/controllers/auth.controller.ts:55-74](file://backend/src/modules/auth/controllers/auth.controller.ts#L55-L74)
- [backend/src/modules/auth/controllers/auth.controller.ts:39-49](file://backend/src/modules/auth/controllers/auth.controller.ts#L39-L49)

**Section sources**
- [backend/src/modules/auth/controllers/auth.controller.ts:39-49](file://backend/src/modules/auth/controllers/auth.controller.ts#L39-L49)
- [backend/src/modules/auth/controllers/auth.controller.ts:55-74](file://backend/src/modules/auth/controllers/auth.controller.ts#L55-L74)

### Environment Configuration and Validation
Environment variables are validated using Zod and exposed as a strongly typed configuration object grouped by domain. Defaults are applied in development when missing.

```mermaid
flowchart TD
Load["Load process.env"] --> Validate["Zod envSchema.parse()"]
Validate --> |Success| BuildCfg["Build envConfig domains"]
Validate --> |Failure| DevDefaults{"NODE_ENV != production?"}
DevDefaults --> |Yes| UseDefaults["Use safe defaults"]
DevDefaults --> |No| Exit["Exit process"]
BuildCfg --> Export["Export envConfig"]
```

**Diagram sources**
- [backend/src/config/env.config.ts:68-112](file://backend/src/config/env.config.ts#L68-L112)
- [backend/src/config/env.config.ts:120-165](file://backend/src/config/env.config.ts#L120-L165)

**Section sources**
- [backend/src/config/env.config.ts:68-112](file://backend/src/config/env.config.ts#L68-L112)
- [backend/src/config/env.config.ts:120-165](file://backend/src/config/env.config.ts#L120-L165)

### Database Configuration and TypeORM Options
TypeORM is configured from environment variables with development vs production differences (e.g., synchronize, SSL, logging). Entities, migrations, and subscribers are discovered via glob patterns.

```mermaid
flowchart TD
ReadEnv["Read envConfig.database"] --> BuildOpts["Build DataSourceOptions"]
BuildOpts --> Sync{"Development?"}
Sync --> |Yes| EnableSync["synchronize: true"]
Sync --> |No| DisableSync["synchronize: false"]
BuildOpts --> SSL{"Production?"}
SSL --> |Yes| AddSSL["ssl: {rejectUnauthorized:false}"]
SSL --> |No| NoSSL["ssl: false"]
BuildOpts --> Pool["poolSize based on env"]
BuildOpts --> Entities["entities: modules/*/entities"]
BuildOpts --> Migrations["migrations: database/migrations"]
BuildOpts --> Subscribers["subscribers: database/subscribers"]
```

**Diagram sources**
- [backend/src/config/database.config.ts:15-51](file://backend/src/config/database.config.ts#L15-L51)

**Section sources**
- [backend/src/config/database.config.ts:15-51](file://backend/src/config/database.config.ts#L15-L51)

### Shared Types and Contracts
The shared workspace centralizes:
- Module enumerations and categories for module taxonomy.
- Standardized API response types and pagination interfaces.
- Application constants (limits, currencies, languages).

```mermaid
classDiagram
class ModuleName {
<<enum>>
+AUTH
+UTILISATEURS
+CONFIGURATION
+...
}
class ModuleCategory {
<<enum>>
+CRITIQUES
+COMMUNICATION
+ACADEMIQUES
+LOGISTIQUES
+ACTIVITES
+DOCUMENTS
+SYSTEME
}
class ApiResponse {
+boolean success
+data?
+message?
+string timestamp
}
class PaginatedResult {
+items[]
+meta
}
class APP_INFO {
+string name
+string version
+string author
+string description
+string website
}
ModuleName --> ModuleCategory : "mapped by MODULE_CATEGORIES"
PaginatedResult --> ApiResponse : "used in responses"
```

**Diagram sources**
- [shared/src/enums/modules.enum.ts:14-106](file://shared/src/enums/modules.enum.ts#L14-L106)
- [shared/src/types/api.types.ts:12-61](file://shared/src/types/api.types.ts#L12-L61)
- [shared/src/constants/app.constants.ts:12-80](file://shared/src/constants/app.constants.ts#L12-L80)

**Section sources**
- [shared/src/enums/modules.enum.ts:14-106](file://shared/src/enums/modules.enum.ts#L14-L106)
- [shared/src/types/api.types.ts:12-61](file://shared/src/types/api.types.ts#L12-L61)
- [shared/src/constants/app.constants.ts:12-80](file://shared/src/constants/app.constants.ts#L12-L80)

## Dependency Analysis
- Backend depends on Express, TypeORM, Zod, Winston, Helmet, CORS, compression, bcrypt, pg, uuid, qrcode, jsonwebtoken, dotenv, reflect-metadata.
- Root workspace orchestrates builds/tests/linting across backend, frontend, and shared.
- Docker Compose defines services for PostgreSQL, Redis, backend, and frontend, wiring environment variables and volumes.

```mermaid
graph LR
Root["Root package.json"]
Bpkg["@elisaschool/backend package.json"]
Spkg["@elisaschool/shared package.json"]
Root --> Bpkg
Root --> Spkg
Bpkg --> Express["express"]
Bpkg --> TypeORM["typeorm"]
Bpkg --> Zod["zod"]
Bpkg --> Winston["winston"]
Bpkg --> Helmet["helmet"]
Bpkg --> Pg["pg"]
Bpkg --> JWT["jsonwebtoken"]
Bpkg --> Crypto["bcryptjs, uuid, qrcode"]
```

**Diagram sources**
- [package.json:8-12](file://package.json#L8-L12)
- [backend/package.json:23-39](file://backend/package.json#L23-L39)
- [shared/package.json:15-17](file://shared/package.json#L15-L17)

**Section sources**
- [package.json:8-12](file://package.json#L8-L12)
- [backend/package.json:23-39](file://backend/package.json#L23-L39)
- [shared/package.json:15-17](file://shared/package.json#L15-L17)

## Performance Considerations
- Compression middleware reduces payload sizes.
- Rate limiting protects against abuse.
- Connection pooling and SSL tuning in production improve throughput and reliability.
- Logging levels differ by environment to balance observability and overhead.
- Large payload limits are set for JSON/URL-encoded bodies to accommodate images and documents.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
- Health checks: Use the /api/health endpoint to verify service availability.
- Logging: Review console output and files under logs/ for error stacks and metadata.
- Environment validation: Misconfigured variables cause immediate startup failures with formatted error messages.
- Database connectivity: Ensure PostgreSQL is healthy and reachable; confirm credentials and network configuration.

**Section sources**
- [backend/src/app.ts:124-131](file://backend/src/app.ts#L124-L131)
- [backend/src/common/utils/logger.util.ts:58-82](file://backend/src/common/utils/logger.util.ts#L58-L82)
- [backend/src/config/env.config.ts:71-112](file://backend/src/config/env.config.ts#L71-L112)
- [docker/docker-compose.yml:25-29](file://docker/docker-compose.yml#L25-L29)

## Conclusion
eLISAschool employs a clean monorepo architecture with a modular Express backend, a shared package for types and constants, and a clear separation of concerns. The backend leverages environment-driven configuration, robust security middleware, and TypeORM for persistence. While the repository snapshot does not include the frontend PWA source, the documented backend and shared components provide a strong foundation for a scalable, maintainable system aligned with modern practices.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices

### System Boundaries and Integration Patterns
- Internal boundaries: backend modules encapsulate controllers/services/entities; shared provides contracts reused by backend and frontend.
- External integrations: PostgreSQL for persistence, Redis for queues/sync, SMTP for email (configurable), and QR code generation utilities.
- API surface: REST-like endpoints under /api with standardized responses and pagination.

**Section sources**
- [backend/src/app.ts:149-185](file://backend/src/app.ts#L149-L185)
- [backend/src/config/env.config.ts:151-157](file://backend/src/config/env.config.ts#L151-L157)
- [backend/src/modules/auth/controllers/auth.controller.ts:55-74](file://backend/src/modules/auth/controllers/auth.controller.ts#L55-L74)