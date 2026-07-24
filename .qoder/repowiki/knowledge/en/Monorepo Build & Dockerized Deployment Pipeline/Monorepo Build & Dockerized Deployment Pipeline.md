---
kind: build_system
name: Monorepo Build & Dockerized Deployment Pipeline
category: build_system
scope:
    - '**'
source_files:
    - package.json
    - backend/package.json
    - backend/tsconfig.json
    - docker/Dockerfile.backend
    - docker/Dockerfile.backend.dev
    - docker/docker-compose.yml
    - backend/jest.config.ts
    - backend/nodemon.json
    - scripts/README.md
---

## Build System Overview

eLISAschool uses a npm workspaces monorepo with three packages (backend, frontend, shared) orchestrated through Docker Compose for development and production deployments. The build system is centered around TypeScript compilation, TypeORM migrations, and containerized service orchestration.

### Core Build Architecture

Monorepo Structure: Root package.json defines workspaces for backend (Express + TypeORM), frontend (React + Vite), and shared types/constants. All npm scripts are proxied through the root workspace commands like npm run build --workspaces.

TypeScript Compilation: Backend compiles to CommonJS ES2022 output in backend/dist/ using strict mode with decorators enabled for TypeORM entities. Path aliases map @modules/*, @common/*, @config/*, @database/*, and @shared/* to their respective directories.

Development Workflow: Hot-reload via nodemon watches both src/ and ../shared/src/ for changes, running TypeScript directly through ts-node during development. Production builds use separate Docker images that compile TypeScript once and run compiled JavaScript.

### Containerization Strategy

Multi-stage Docker Builds: Production images use a 4-stage pipeline: base image -> dependency installation -> TypeScript compilation -> minimal runtime image. Development images mount source code volumes for live reloading while keeping node_modules cached.

Service Orchestration: Docker Compose manages PostgreSQL (port 7002), Redis (port 7003), backend API (port 7000), frontend dev server (port 7001), and pgAdmin (port 7004) as interconnected services with health checks and persistent volumes.

### Database Migration System

TypeORM Migrations: Database schema evolution uses numbered SQL migration files in backend/database/migrations/ (currently at 110+). Commands include migration:generate, migration:run, and migration:revert through TypeORM CLI. Custom shell scripts handle batch operations like deploy-all-migrations.sh and run-migration-*.sh for specific feature deployments.

Seed Data: Separate seed scripts populate initial data including RBAC roles, demo users, and module configurations through dedicated ts-node commands.

### Testing Infrastructure

Jest Configuration: Unit and integration tests use ts-jest preset with path alias mapping matching the main application. Test files follow test/**/*.spec.ts or tests/**/*.test.ts patterns with Node.js environment.

### Deployment Scripts

Feature-based Deployments: Extensive collection of shell scripts in scripts/ directory handle module-specific deployments (deploy-*.sh), database migrations, testing, and infrastructure validation. Each major feature has its own deployment script for isolated releases.

Environment Management: Multiple .env files support different environments (docker/.env.local, docker/.env.cloud, root .env). Docker Compose variants provide local development and cloud production configurations.

## Key Files and Packages

- package.json - Monorepo workspace configuration and root scripts
- backend/package.json - Backend dependencies and build/test scripts
- backend/tsconfig.json - TypeScript compilation settings with path aliases
- docker/Dockerfile.backend - Multi-stage production Docker image
- docker/Dockerfile.backend.dev - Development image with hot-reload
- docker/docker-compose.yml - Service orchestration for all components
- backend/jest.config.ts - Test runner configuration
- backend/nodemon.json - Development file watching rules
- scripts/README.md - Comprehensive script documentation

## Rules Developers Should Follow

1. Workspace Commands: Always use root-level npm run commands rather than navigating to individual packages
2. Migration Naming: New database changes require TypeORM migration generation following the existing numbering convention
3. Docker Development: Use provided compose files for consistent development environments across team members
4. Path Aliases: Import shared modules using @shared/* aliases rather than relative paths
5. Environment Variables: Configure services through .env files and Docker Compose environment variables, never hardcode secrets
6. Testing: Place test files in test/ or tests/ directories following the established naming patterns
7. Build Artifacts: Never commit dist/ directories; they should be generated during build/deployment
8. Module Isolation: Keep new features within their own module directories under backend/src/modules/