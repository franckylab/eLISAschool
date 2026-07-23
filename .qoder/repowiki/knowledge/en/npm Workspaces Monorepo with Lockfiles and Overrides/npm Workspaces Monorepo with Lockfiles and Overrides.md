---
kind: dependency_management
name: npm Workspaces Monorepo with Lockfiles and Overrides
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
---

The eLISAschool project uses npm workspaces to manage a multi-package monorepo consisting of three sibling packages: backend (Express + TypeORM API), frontend (React + Vite SPA), and shared (TypeScript domain primitives consumed by both). All dependency management is centralized through npm rather than pnpm or yarn, despite occasional documentation references to pnpm.

System overview
- Package manager: npm (v10+, enforced via engines.node >= 20.0.0 / engines.npm >= 10.0.0).
- Workspace layout: root package.json declares workspaces [backend, frontend, shared]. Each workspace has its own package.json, node_modules/, and lockfile.
- Lockfiles: package-lock.json exists at the repo root and in each workspace (backend/package-lock.json, frontend/package-lock.json, docker/backend/package-lock.json, docker/shared/node_modules/package-lock.json). The root lockfile pins the transitive tree for all workspaces; workspace-level lockfiles pin per-package resolution trees.
- No vendoring: node_modules/ directories are present locally but gitignored; dependencies are resolved from the public npm registry at install time. No vendor/ or offline cache strategy is configured.

Shared package coupling
The @elisaschool/shared package is a local workspace dependency referenced by both backend and frontend via their package.json files (e.g., "@elisaschool/shared": "^1.0.0"). This lets both sides import shared enums, constants, Zod validators, and API types without publishing to a registry. The shared package itself only depends on zod and TypeScript dev tooling.

Versioning strategy
- Dependencies use caret ranges (^x.y.z) allowing minor/patch upgrades within major version boundaries — no strict pinning in package.json.
- Deterministic installs are achieved via the generated package-lock.json files.
- A top-level overrides block forces specific versions of @types/express and @types/express-serve-static-core to resolve a known type conflict between them.

Dev-time tooling & scripts
Root-level scripts delegate to workspaces:
- npm run dev starts backend and frontend concurrently via --workspace=....
- npm run build, test, lint propagate across all workspaces.
- Database commands (db:migrate, db:seed) forward into the backend workspace's TypeORM/Nest CLI scripts.

Docker Compose builds separate images for backend/frontend, each installing dependencies inside the container using the workspace lockfiles.

Rules developers should follow
1. Install from the repo root — run npm install at the monorepo root so workspaces link together; do not run npm install inside a single workspace directory.
2. Declare new dependencies in the correct workspace — runtime deps go in backend/package.json or frontend/package.json; shared code goes in shared/package.json. Do not add cross-workspace runtime deps.
3. Commit lockfiles — keep package-lock.json (root and per-workspace) under version control to guarantee reproducible installs across CI and Docker builds.
4. Use caret ranges (^x.y.z) for third-party libraries; avoid exact pins unless required by an override.
5. Resolve conflicts via overrides — if a peer/type mismatch arises, add an entry to the root overrides block rather than patching node_modules.
6. Do not vendor — rely on npm's registry resolution; there is no private registry or proxy configured in this branch.