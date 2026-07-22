---
kind: build_system
name: Monorepo Build & Dockerized Deployment Pipeline
category: build_system
scope:
    - '**'
source_files:
    - package.json
    - backend/package.json
    - frontend/package.json
    - shared/package.json
    - docker/Dockerfile.backend
    - docker/Dockerfile.backend.dev
    - docker/Dockerfile.frontend
    - docker/docker-compose.yml
    - backend/tsconfig.json
    - frontend/vite.config.ts
    - backend/jest.config.ts
    - scripts/README.md
---

## Build System Overview

eLISAschool uses a npm workspaces monorepo with three packages (backend, frontend, shared) orchestrated through npm scripts, TypeScript compilation, and Docker containerization. There is no CI/CD pipeline configuration — the build system is developer-focused with local-first tooling.

### Core Technologies
- Package Manager: npm workspaces (Node >=20, npm >=10)
- Backend: Express.js + TypeScript compiled to CommonJS via tsc
- Frontend: React 19 + Vite 6 with TanStack Router code generation
- Shared Library: TypeScript package for cross-cutting types/enums/validators
- Containerization: Multi-stage Docker builds with separate dev/prod images
- Database Migrations: TypeORM CLI migrations executed at runtime
- Testing: Jest (backend) with ts-jest preset

### Monorepo Structure
The root package.json defines workspaces and top-level scripts that delegate to individual packages:
- root/package.json: workspace orchestration, docker compose commands
- backend/package.json: Express API, TypeORM, tests, migrations
- frontend/package.json: Vite build, PWA, TanStack Router
- shared/package.json: Shared types, enums, validators (published as @elisaschool/shared)

### Build Commands
- npm run build: Builds all workspaces in dependency order
- npm run dev: Starts both backend (nodemon) and frontend (Vite) concurrently
- npm run db:migrate: Runs TypeORM migrations against PostgreSQL
- npm run test: Executes Jest tests across workspaces
- npm run docker:dev / docker:prod: Spins up full stack via docker-compose

### Docker Architecture
Two distinct Dockerfiles per service:
Development (Dockerfile.backend.dev): Installs all dependencies including dev tools, mounts source volumes with nodemon hot-reload, runs on port 7000.
Production (Dockerfile.backend): Multi-stage build - deps stage installs production-only deps, builder stage compiles TypeScript, final production stage copies only compiled artifacts and production dependencies. Frontend builds static assets served by Nginx.

Docker Compose orchestrates four services: PostgreSQL (port 7002), Redis (port 7003), Backend API (port 7000), Frontend dev server (port 7001), plus pgAdmin (port 7004). All services use health checks and named volumes for persistence.

### TypeScript Configuration
Backend uses path aliases (@modules/*, @common/*, @config/*, @database/*, @shared/*) mapped to relative paths. Output goes to ./dist with source maps and declaration files enabled. Frontend uses Vite's alias resolution (@ -> src, @shared -> ../shared/src).

### Database Migration System
TypeORM migrations are versioned numerically (001-111+) in backend/database/migrations/. Migrations can be SQL or TypeScript files. The system supports generation, execution, reversion, and custom seed runners for RBAC, demo data, and feature-specific seeds.

### Testing Strategy
Jest is configured with ts-jest preset, Node environment, and module path mapping matching the backend's tsconfig aliases. Tests live in backend/test/ organized by type (unit, integration, services). No frontend testing framework is configured.

### Development Workflow
The project provides extensive shell scripts in scripts/ for common operations: development lifecycle management (start-dev.sh, stop-dev.sh), deployment automation (deploy-*.sh), database operations (creer-base-de-donnees.sh, supprimer-base-de-donnees.sh), and verification utilities (verify-setup.sh, verify-modules.sh). These scripts handle process management, environment validation, and service orchestration outside of Docker.

### Key Conventions
- All packages follow semantic versioning starting at 1.0.0
- Environment variables are managed through .env files with sensible defaults in docker-compose
- Port assignments are standardized: 7000 (API), 7001 (Frontend), 7002 (PostgreSQL), 7003 (Redis), 7004 (pgAdmin)
- Source code organization follows feature-based modules under src/modules/ with consistent controller/service/repository patterns
- Shared types prevent duplication between frontend and backend contracts