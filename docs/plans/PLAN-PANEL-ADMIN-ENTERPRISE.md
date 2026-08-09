# PLAN — Refonte Panel Admin Enterprise (SaaS v7.1)

> **Statut** : ✅ COMPLET
> **Lié à** : `AGENTS.md` — section « Refonte SaaS v7 — Panel Admin Enterprise »
> **Sources** : 4 rapports de conception (`docs/rapports/RAPPORT-*.html`), plan v7 (`docs/plans/PLAN-SAAS-V7.md`)
> **Architecture cible** : Single-DB + RLS généralisée + Partitionnement hash + CASL.js (décisions v7 conservées)

## Décisions de cadrage (grill, 2026-08-08)

| # | Question | Décision |
|---|----------|----------|
| D1 | Séquencement | **Vagues verticales incrémentales** (lot par lot, plan mis à jour dans AGENTS.md à chaque lot) |
| D2 | Ordre des vagues | **V0 fixes critiques d'abord**, puis verticales |
| D3 | Première verticale | **Monitoring & Dashboard** (Golden Signals + Health, Noisy Neighbor, Realtime WS, Alerting mgmt, Dashboard KPIs) |
| D4 | Périmètre V1 | Les 5 axes monitoring retenus (multi-sélection) |

---

## V0 — Correctifs critiques de socle (✅ COMPLET)

**Problèmes diagnostiqués (vérifiés à la main à l'ouverture) :**
1. **Pattern ApiResponse faussé** : `apiClient.get<T>()` retourne `Promise<ApiResponse<T>>` (`{success, data?: T}`). 12 appels dans les pages `platform.*` passent `T = {success, data: X}` → `res.data` typé `{success,data}`, et le monitoring fait `res.data.data` (undefined au runtime). Correctif : `apiClient.get<X>(url)` + `return res.data`.
2. **`--color-texte-muted` inexistant** — utilisé 571× (globals.css ne définit que `--color-texte*`).
3. **376 erreurs tsc frontend** (111 routes platform, 93 features/admin, 12 shared casl `@casl/ability` introuvable).
4. **Modal élaborés sans StepperModal** (composant existant jamais importé dans routes/features admin).

---

## V1 — Monitoring & Dashboard Enterprise (état : planifié)

Composants backend déjà présents (services sains) ; le travail est surtout **intégration UI + fixes runtime + wiring** :

| Sous-axe | Backend (existant) | Frontend (à faire) |
|----------|--------------------|---------------------|
| Golden Signals + Health | `metrics-collector.service.ts`, health checks distribués, agrégation 1h/24h/7d | `platform.monitoring.tsx` : connecter `res.data` correct, widgets Golden Signals (cartes p50/p95/p99, trafic, erreurs, saturation) |
| Noisy Neighbor | `noisy-neighbor.service.ts` (score 0-100, alertes w/c) + 4 endpoints | Top 10 tenants, hexagons ou liste triée, badges warning/critical |
| Realtime WebSocket | `monitoring.gateway.ts` (events temps réel) | Hook `use-realtime-monitoring`, badge live, mise à jour incrémentale |
| Alerting mgmt | `alerting.service.ts` (règles, seuils, escalate, canaux) | Page gestion règles + acquittement + historique |
| Dashboard admin | `/api/platform/stats`, `/stats/revenues`, `/stats/sante`, `/api/platform/dashboard` | `platform.dashboard.tsx` refacto - fix ApiResponse, KPIs réels (établissements, utilisateurs, MRR, activité, santé) |

## Vague — Billing Enterprise (verticale n°2)

Priorité pour toute suite : plans/tranches/abonnements/factures/paiements 100% customisables persistés en DB (poursuite du travail v7 Lot A–F). Détails dans `PLAN-SAAS-V7.md`.

## V2 — Panel Admin : Organisation, Plans, Permissions (✅ COMPLET — 2026-08-09)

**Périmètre livré** (matrice RBAC branchée sur le vrai backend + navigation plateforme complétée) :

| Sous-axe | Livrable |
|----------|----------|
| Matrice RBAC | `admin-permissions-matrix.tsx` v3.0 réécrit : **endpoints fantômes supprimés** (`/api/admin/permissions/matrix`), branchement réel : `GET /api/rbac/permissions/modules` (groupé par module), `GET /api/rbac/roles`, `GET /api/rbac/roles/:id/permissions` (load parallèle par rôle → `rolePermissions` map), sauvegarde par **delta** `PUT /api/rbac/roles/:id/permissions/batch` (`{addedPermissionIds, removedPermissionIds}`) groupée par rôle, mutations en parallèle + toasts + invalidation |
| Rôles système | Badge `Lock` + cellules non-éditables (le backend refuse `SYSTEM_ROLE_IMMUTABLE` — 400), colonnes prêtes pour `nbUtilisateurs` |
| Vues | Matrice (table) + Liste (cartes par module), filtres rôle/module/recherche, export JSON (matrice complète), StatCards (total permissions, modules, rôles, couverture moyenne %) |
| Page Permissions | `frontend/src/routes/platform.permissions.tsx` (`/platform/permissions`), icône `KeyRound`, groupe **Système** |
| Page Groupes SaaS | `frontend/src/routes/platform.groupes.tsx` (`/platform/groupes`) — expose `GroupesSaaSPage` (Lot C v7) en page standalone, icône `Network`, groupe **Gestion** |
| Typage facturation | `platform.facturation.tsx` : `ModulesTab` entièrement typé (`ModuleOptionnel`), 8 `any` → types réels, `Omit<ModuleOptionnel,'id'\|'actif'>` pour POST, `Partial<ModuleOptionnel>` pour PUT |
| i18n | +4 clés FR/EN (`navigation.groupes/permissions`, `sidebar.descGroupes/descPermissions`) + `permissions.sauvegardeReussie/sauvegardeErreur` |

**Qualité** : `npx tsc --noEmit` frontend = **0 erreur** (exit 0) ; routeTree.gen.ts régénéré (routes `/platform/groupes` + `/platform/permissions` présentes) ; 0 `any` dans les 3 fichiers touchés ; i18n FR/EN parité.

## Vague — Sécurité & Plateformes (à définir)

RLS généralisée ~40 tables, partitionnement volume, CASL.js migration complète, workflow actions critiques 2F.

---

## Conformité transverse (en vigueur pour TOUS les lots)

- i18n 100% flat FR/EN (namespace `admin`), parité stricte
- Audit dans les services, jamais dans les controllers
- Filtres dans DataTable collapsibles (pas de composants de filtre indépendants)
- Breadcrumbs via PageHeader uniquement (pas de doublon)
- Modals riches → StepperModal partagé
- `clamp()` / CSS vars / dark mode / 0 `any` / 0 couleur hardcodée
- API client : `apiClient.get<X>(url)` → `res.data` (mai `X`), singleton services backend
- tsc —0 in-scope après chaque lot (exit 0 visé)

## Rapports source (liens)

- `docs/rapports/RAPPORT-ABONNEMENTS-FACTURATION-IDEAL.html` (score 5.5/10)
- `docs/rapports/RAPPORT-PANEL-ADMINISTRATION-IDEAL.html`
- `docs/rapports/RAPPORT-SAAS-ADMIN-CLIENT-SEPARATION.html`
- `docs/rapports/RAPPORT-SAAS-SINGLE-DATABASE-ARCHITECTURE.html`
- Extraits texte : `/tmp/opencode/rapports/*.txt` (nettoyage possible une fois lu)