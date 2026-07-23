---
kind: dependency_management
name: npm Workspaces with Lockfiles and Type Overrides
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

The eLISAschool project uses npm workspaces to manage dependencies across three packages: backend (Express + TypeORM API), frontend (React + Vite PWA), and shared (types, enums, validators). The root package.json declares the workspace layout and provides unified scripts that delegate to each workspace. Each package has its own package.json and a committed package-lock.json (lockfileVersion 3), so dependency trees are deterministic per workspace rather than hoisted into a single lockfile.

Key characteristics:
- Workspace structure: Root workspaces array includes backend, frontend, shared with scoped names @elisaschool/backend, @elisaschool/frontend, @elisaschool/shared. The shared package is consumed as an internal dependency via @shared/* path aliases configured through tsconfig-paths in the backend.
- Lockfiles: Both backend/package-lock.json and frontend/package-lock.json are committed; there is no root-level lockfile. This keeps install graphs isolated per workspace.
- No vendoring or private registry: No .npmrc, no GOPRIVATE, no vendored node_modules beyond what npm installs. Dependencies resolve from the public npm registry. Docker images mount source and run npm ci inside containers using the existing lockfiles.
- TypeScript type overrides: The root package.json uses an overrides field to pin @types/express and @types/express-serve-static-core to specific versions, resolving a known conflict between Express 4.x and newer type packages. A postinstall script also removes a conflicting nested @types/express-serve-static-core under @types/express/node_modules.
- Engine constraints: Root engines enforces Node >= 20 and npm >= 10 across all workspaces.
- Shared runtime dependency: Only zod is declared as a runtime dependency in both backend and shared; the frontend pins a slightly looser ^3.24.0 while backend pins ^3.24.1. There is no explicit version alignment policy documented.

Conventions developers should follow:
- Add new third-party dependencies only inside the relevant workspace's package.json (backend/, frontend/, or shared/). Do not edit the root manifest except for workspace-wide scripts or engine/override changes.
- Always commit the resulting package-lock.json after adding/upgrading a dependency so CI gets a deterministic tree.
- Use the root scripts (npm run dev, npm run build --workspaces, etc.) instead of invoking workspace commands directly, to keep multi-package operations consistent.
- When introducing a new package that conflicts with existing types, prefer the root overrides field over patching individual @types/* versions.
- Avoid creating a global .npmrc or private registry configuration unless explicitly required by security policy — none exists today.