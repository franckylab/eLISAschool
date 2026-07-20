Routes are declared via TanStack Router's file-based convention under `src/routes/`:
- `_auth.tsx` is the authenticated layout root; every child route under it inherits its `beforeLoad: authGuard()` plus a shared `PageLayout`, session-expiry listener, and global Etablissement selection modal.
- Public pages (`login`, `forgot-password`, `reset-password`, `verify-email`) sit at the routes root without the `_auth` prefix.
- Feature modules are split into two styles: flat per-file routes (e.g. `_auth.eleves.tsx`, `_auth.admin.roles.tsx`) for simple features, and grouped subdirectories with a `route.tsx` entry plus sibling feature files (e.g. `(authenticated)/parametres/structure-academique/`) for nested sections.
- Module-level permission guards are applied inside each route's `beforeLoad` or component, gated by the same `@/app/route-guards` module referenced from `_auth.tsx`.
- `- _auth.*.tsx` files act as route placeholders to silence TanStack Router warnings while keeping related routes co-located.

i18n lives in `src/locales/{fr,en}/`, one JSON file per domain feature (e.g. `eleves.json`, `notes.json`, `utilisateurs.json`). The filename-to-feature mapping mirrors the route naming so that any route can import its corresponding locale pack through the shared i18n runtime used elsewhere in the app.