---
kind: dependency_management
name: npm Workspaces Monorepo with Lockfiles
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

The eLISAschool project uses an npm workspaces monorepo to manage dependencies across three packages: `@elisaschool/backend` (Express/TypeORM API), `@elisaschool/frontend` (React/Vite PWA), and `@elisaschool/shared` (shared types, enums, validators). Each package declares its own `package.json` with explicit dependency versions pinned via caret ranges (`^x.y.z`) and maintains a dedicated `package-lock.json` (lockfileVersion 3) for deterministic installs. The root `package.json` orchestrates workspace scripts (`dev`, `build`, `test`, `lint`, `db:migrate`, `db:seed`) that delegate to individual workspaces using `--workspace=` flags, and enforces Node ≥20 / npm ≥10 via the `engines` field. A top-level `overrides` block forces `@types/express` and `@types/express-serve-static-core` to specific versions to resolve type conflicts between backend and frontend. There is no vendoring strategy — `node_modules` are installed per-workspace and not committed; Docker images rebuild from source. No private registry or `.npmrc` configuration was found, so all packages resolve against the public npm registry. Shared code lives in the local `shared/` workspace rather than being published as a scoped npm package, meaning cross-package imports use TypeScript path aliases (`@shared/*`) resolved at build time.