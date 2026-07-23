---
kind: dependency_management
name: npm Workspaces Monorepo with Lockfiles and Dockerized Builds
category: dependency_management
scope:
    - '**'
source_files:
    - package.json
    - backend/package.json
    - frontend/package.json
    - shared/package.json
    - backend/package-lock.json
    - frontend/package-lock.json
    - docker/Dockerfile.backend
---

The eLISAschool project uses an npm workspaces monorepo to manage dependencies across three packages: `backend` (Express/TypeScript API), `frontend` (React/Vite PWA), and `shared` (types, enums, validators). Each package declares its own dependencies in a dedicated `package.json`, while the root `package.json` orchestrates workspace scripts (`dev`, `build`, `test`, `lint`) and enforces Node ≥20 / npm ≥10 via `engines`. Version pinning is done through per-package `package-lock.json` files (lockfileVersion 3) that are committed to version control, ensuring deterministic installs. The backend additionally uses an `overrides` field to force compatible versions of `@types/express` and `@types/express-serve-static-core` across the dependency tree. No vendoring or private registry is configured — all packages resolve from the public npm registry. Docker builds (`docker/Dockerfile.backend`) install dependencies using `npm ci --omit=dev` inside multi-stage images, copying only the top-level `package.json` plus each workspace's manifest into the build context so lockfiles remain authoritative. There is no `.npmrc`, `pnpm-lock.yaml`, `yarn.lock`, or `go.mod`; Go tooling is not used.