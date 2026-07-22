Two sibling Express sub-modules share one cohesive identity/RBAC domain:
- `auth/` owns the runtime: login/register, password reset, email verification, JWT access/refresh token issuance/validation, multi-tenant establishment selection, per-user/per-role/per-establishment preferences, and audit trail emission.
- `rbac/` owns the configuration surface: CRUD APIs for roles, permissions, and user-role assignments (with inheritance).

Cross-child wiring:
- Both children reference the same TypeORM entities (`Role`, `Permission`, `UtilisateurEtablissement`, `RoleLimitationEtablissement`) declared under `auth/entities`; `rbac/services/*` operate on those entities via shared repositories, so there is no duplicated RBAC model — `auth` consumes the data layer while `rbac` exposes the management API.
- `auth/middlewares/auth.middleware.ts` and `auth/guards/permission.guard.ts` parse the JWT issued by `auth/services/token.service.ts`, attach the resolved `UtilisateurEtablissement` context, then delegate fine-grained checks to `auth/services/permission-resolver.service.ts`, which queries the RBAC entities owned by `auth/entities`.
- `auth/controllers/preferences*.controller.ts` and `auth/services/preference*.service.ts` are gated by the same permission guard, making preferences an RBAC-scoped feature rather than a standalone module.
- Audit emission is centralized in `auth/services/audit.service.ts` with helpers in `auth/utils/audit-helpers.ts`; other features (login, preference changes, role edits) call it, and `auth/cron-jobs/audit-rotation.cron.ts` archives old rows.

Startup contract: each sub-module exports an Express `Router` from its `index.ts`; the application-level bootstrap mounts `auth/index.ts` and `rbac/index.ts` under distinct URL prefixes, keeping the two concerns isolated at the HTTP boundary while sharing the database schema.