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
---

The eLISAschool monorepo manages dependencies through npm workspaces, centralizing three packages — @elisaschool/backend (Nest/Express), @elisaschool/frontend (React/Vite), and @elisaschool/shared (zero-dependency domain kernel) — under a single root that orchestrates install, build, test, and Docker commands.

System and tools
- Package manager: npm (v10+) with Node.js v20+ enforced via engines in the root package.json.
- Workspace model: workspaces declared at the root; each sub-package is private and scoped under @elisaschool/*.
- Lockfile: a single root package-lock.json (lockfileVersion 3) records every resolved package across all workspaces, including integrity hashes and resolved URLs pointing to https://registry.npmjs.org.
- No vendoring or private registry: there is no .npmrc, no vendor directory, and no custom registry configured — all third-party packages are pulled from the public npm registry.

Key files
- Root package.json — workspace declaration, cross-workspace scripts (dev, build, test, lint, db:migrate, docker:*), postinstall cleanup, and overrides for transitive type conflicts.
- backend/package.json — runtime deps (express, typeorm, pg, ioredis, firebase-admin, zod, etc.) plus dev tooling (ts-node, jest, eslint, typescript).
- frontend/package.json — React 19 + TanStack Router/Query/Table, Radix UI primitives, Tailwind v4, framer-motion, zustand, zod.
- shared/package.json — minimal footprint (only zod as a runtime dep); consumed by both backend and frontend as a local workspace reference.
- Root package-lock.json — canonical lockfile used by CI and Docker builds.

Architecture and conventions
- Local inter-workspace references use the @elisaschool/* scope; because all packages are private and co-located, they resolve via the workspace link rather than npm publish.
- Shared TypeScript types/enums live in shared/src/ and are imported directly by backend and frontend modules without publishing to a registry.
- The root overrides field pins @types/express and @types/express-serve-static-core to specific versions to resolve a known conflict between NestJS/Express type packages.
- A postinstall script removes a nested duplicate of @types/express-serve-static-core inside @types/express/node_modules to avoid type duplication warnings.
- Docker Compose images (Dockerfile.backend, Dockerfile.frontend) run npm ci against the root lockfile, ensuring reproducible installs across environments.

Rules developers should follow
- Add new third-party dependencies only inside the relevant workspace's package.json (backend/, frontend/, or shared/); never edit the root dependencies.
- Keep shared free of heavy runtime libraries — it should only hold enums, shared Zod schemas, and pure TS types consumed by both sides.
- Always commit the updated root package-lock.json after npm install; do not generate per-workspace lockfiles.
- Use npm run <script> --workspace=<name> (or the root shortcuts like dev:backend) instead of invoking npm directly inside a subdirectory.
- When introducing a dependency that causes type conflicts, prefer adding an entry to the root overrides block rather than patching individual packages.
- Do not introduce a private npm registry or .npmrc unless explicitly required by security policy; the current setup relies on the public registry.