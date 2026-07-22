A single private npm package (`@elisaschool/shared`, `private: true`) built with plain `tsc` that re-exports a flat barrel from `src/index.ts`. Internal layering is strictly by concern:
- `enums/` — domain enumerations (`roles.enum`, `statuts.enum`, `modules.enum`) plus an `index.ts` barrel.
- `types/` — runtime-free TypeScript interfaces (`api.types`, `user.types`) for cross-process contracts.
- `validators/` — Zod schemas (`auth.validators.ts`) whose inferred TS types are also exported so consumers get compile-time + runtime validation from one source of truth.
- `constants/` — app-wide literals (`app.constants`, `themes.constants`).
- `config/config.registry.ts` — the central `MODULE_REGISTRY` mapping every `ModuleName` to a `ModuleConfig` (label, icon, basePath, defaultRoles, permissions, dependencies, defaultSettings) together with helpers `getModuleConfig`, `getModulesByCategory`, `hasModuleAccess`; this is the single source of truth for RBAC defaults and feature flags across the app.
- `helpers/system-protection.helper.ts` — pure guard functions (`assertNotSystem`, `assertNotImmutable`) that throw errors tagged with `statusCode`/`code` to prevent deletion of system-seeded entities.

Dependency direction is one-way: helpers/constants/enums/types have no intra-module deps; validators depend on constants; config depends on enums. No runtime framework is imported — only `zod` as a dependency, making the package consumable in Node and browser bundles alike.