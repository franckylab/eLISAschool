---
kind: dependency_management
name: npm Workspaces Monorepo with Lockfile-Driven Dependency Management
category: dependency_management
scope:
    - '**'
source_files:
    - package.json
    - package-lock.json
    - backend/package.json
    - frontend/package.json
    - shared/package.json
    - docker/Dockerfile.backend
---

The eLISAschool monorepo uses npm workspaces to manage dependencies across three packages: @elisaschool/backend (Express/TypeORM API), @elisaschool/frontend (React + TanStack SPA), and @elisaschool/shared (shared TypeScript contracts). All third-party libraries are declared in each package's package.json, with a single root package-lock.json providing deterministic resolution for the entire workspace.

System and Tooling:
- Package manager: npm >=10 (enforced via engines.node >=20.0.0, engines.npm >=10.0.0).
- Workspace orchestration: Root package.json declares workspaces [backend, frontend, shared] and exposes unified scripts (dev, build, test, lint, db:migrate, db:seed) that delegate to individual workspaces via --workspace=....
- Lockfile: A single package-lock.json at the repo root is committed and used by Docker builds (COPY package.json package-lock.json ./) to ensure reproducible installs across environments.
- Docker integration: The production docker/Dockerfile.backend copies only the lockfile plus workspace package.jsons into the image, then runs npm ci --omit=dev to install production-only deps deterministically.

Versioning Strategy:
- Dependencies use caret ranges (^x.y.z) allowing minor/patch updates while pinning major versions — no explicit version pinning per dependency.
- No private registry or vendoring strategy is configured; all packages resolve from the public npm registry. There is no .npmrc, yarn.lock, pnpm-workspace.yaml, or vendor/ directory present.
- Shared runtime code lives in @elisaschool/shared and is consumed as a local workspace dependency rather than published to a registry, keeping backend and frontend in sync without external publishing.

Cross-Cutting Conventions:
- Shared types only: @elisaschool/shared contains enums, Zod validators, and type definitions — it depends only on zod and has no runtime framework coupling.
- Engine constraints: Node >=20 / npm >=10 enforced centrally so every developer and CI environment uses compatible tooling.
- Dependency overrides: The root overrides field pins @types/express and @types/express-serve-static-core to specific versions to resolve transitive type conflicts across workspaces.
- Postinstall cleanup: A root postinstall script removes a conflicting nested @types/express-serve-static-core to avoid type duplication.

Rules for Developers:
1. Add new dependencies to the appropriate workspace package.json (backend/, frontend/, or shared/) — never at the root unless shared across all workspaces.
2. Commit the updated root package-lock.json after running npm install; do not run npm install inside a workspace subdirectory (always run from the repo root so the lockfile stays consistent).
3. Use caret ranges (^) for library versions; coordinate major-version bumps across workspaces when a shared dependency changes its contract.
4. If adding a private/internal package, publish it to a registry and reference it by name — there is no existing private registry configuration, so add an .npmrc with registry= and auth tokens before doing so.
5. Keep @elisaschool/shared free of runtime framework dependencies; it should only contain types, enums, and validation schemas consumable by both backend and frontend.