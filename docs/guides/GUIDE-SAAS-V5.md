# Guide Architecture SaaS v5 — eLISAschool

> Version : 5.1.0 | Dernière mise à jour : 2025

## Vue d'ensemble

eLISAschool est une plateforme SaaS multi-tenant pour la gestion scolaire, déployée au Cameroun. L'architecture v5 consolide la sécurité, le billing configurable et l'observabilité.

### Architecture Multi-Tenant

```
┌─────────────────────────────────────────────────────┐
│                  Control Plane                       │
│  (_platform/) — SUPER_ADMIN uniquement              │
│  Dashboard, Établissements, Monitoring, Config      │
├─────────────────────────────────────────────────────┤
│              Data Plane Tenant                       │
│  (_auth/) — Administration établissement             │
│  ADMIN/DIRECTEUR : gestion élèves, classes, etc.    │
├─────────────────────────────────────────────────────┤
│              Data Plane User                         │
│  Utilisateurs opérationnels                          │
│  ENSEIGNANT, PARENT, ELEVE, COMPTABLE               │
└─────────────────────────────────────────────────────┘
```

### 3 Plans de Gestion

| Plan | Accès | Rôle |
|------|-------|------|
| Control Plane | `_platform/*` | SUPER_ADMIN |
| Data Plane Tenant | `_auth/*` (admin) | ADMIN, DIRECTEUR |
| Data Plane User | `_auth/*` (user) | ENSEIGNANT, PARENT, ELEVE, COMPTABLE |

---

## Stack Technique

| Couche | Technologie |
|--------|------------|
| Backend | Express.js + TypeORM + PostgreSQL 15 |
| Frontend | React 19 + TanStack Router + Tailwind CSS |
| Authorization | CASL.js (`@casl/ability`) via `shared/` |
| Isolation DB | Row-Level Security PostgreSQL |
| Cache | Redis (rate limiting, sessions) |
| WebSocket | Socket.IO (monitoring temps réel) |

---

## Sécurité

### RBAC (Role-Based Access Control)

Les permissions sont définies dans `shared/src/enums/roles.enum.ts` :

- **SUPER_ADMIN** : Toutes les permissions (plateforme + tenant)
- **ADMIN** : Gestion complète de son établissement, PAS de plateforme
- **DIRECTEUR** : Comme ADMIN sans delete Etablissement/Personnel
- **ENSEIGNANT** : Read/Write sur ses matières
- **PARENT** : Read sur les données de ses enfants
- **ELEVE** : Read sur ses propres données
- **COMPTABLE** : Read/Write sur les finances

### CASL.js (ABAC)

Les capacités CASL sont définies dans `shared/src/casl/abilities.ts` :

```typescript
import { defineAbility } from '@shared/casl/abilities';

const ability = defineAbility({
    id: user.id,
    role: user.role,
    etablissementId: user.etablissementId,
});

// Vérification
if (ability.can('manage', 'Eleve')) { /* ... */ }
```

### Row-Level Security (RLS)

Toutes les tables avec `etablissementId` ont RLS activé :

```sql
-- Politique standard
CREATE POLICY tenant_isolation ON eleves
  USING ("etablissementId"::text = current_setting('app.current_tenant', true));

-- SUPER_ADMIN bypass
CREATE POLICY super_admin_bypass ON eleves
  USING (current_setting('app.current_tenant', true) = '00000000-0000-0000-0000-000000000000');
```

**Tables exemptées** (globales) : etablissements, plans_abonnement, modules_optionnels

---

## Billing Configurable

### Cascade de Résolution — Tranches

```
1. TrancheSupplement (établissement) → priorité 1
2. TrancheEleves (plan) → priorité 2
3. Tranches système → fallback
```

### Cascade de Résolution — Feature Flags

```
1. FeatureFlagTenant (override explicite) → priorité max
2. PlanAbonnement.featureFlags → priorité 2
3. PlanAbonnement.modulesInclus → auto-activation
4. Défaut : false
```

### Cascade de Résolution — Modules

```
1. Modules inclus dans le plan (automatique)
2. Modules supplémentaires souscrits (AbonnementModule)
3. Modules désactivés par override tenant
```

### Quotas

| Resource | Vérification | Alerte |
|----------|-------------|--------|
| eleves | Avant création | 80%, 90%, 100% |
| utilisateurs | Avant création | 80%, 90%, 100% |
| stockage | Périodique | 80%, 90%, 100% |

Middleware `requireQuota('eleves', 1)` → erreur 429 si quota dépassé.

---

## Monitoring & Observabilité

### Golden Signals

- **Rate** : Requêtes HTTP/s par tenant
- **Errors** : Taux d'erreurs 5xx
- **Latency** : p50, p95, p99
- **Saturation** : CPU, mémoire, connexions DB

### Noisy Neighbor Detection

Seuils d'alerte :
- Requêtes/min : Warning 500, Critical 1000
- Latence moyenne : Warning 2s, Critical 5s
- Taux d'erreur : Warning 5%, Critical 15%
- Score de charge : Warning 80, Critical 95

### Alertes Automatiques

| Règle | Métrique | Seuil | Sévérité |
|-------|----------|-------|----------|
| high_error_rate | http_errors_5xx_total | >50/1h | WARNING |
| high_latency | http_request_duration_ms | >5s | WARNING |
| critical_latency | http_request_duration_ms | >15s | CRITICAL |
| database_slow | resource_database_percent | >90% | CRITICAL |

---

## Providers d'Intégration

### Paiement (7 providers)

| Provider | Région | Type |
|----------|--------|------|
| MTN Mobile Money | Cameroun | Mobile |
| Orange Money | Cameroun | Mobile |
| Wave | Afrique de l'Ouest | Mobile |
| Paystack | Afrique | Gateway |
| Flutterwave | Afrique | Gateway |
| Stripe | International | Gateway |
| Manuel | Global | Hors-ligne |

### Notifications

- **SMS** : Twilio, Africa's Talking
- **Email** : Resend, SendGrid

---

## Fichiers Clés

### Backend

| Fichier | Rôle |
|---------|------|
| `shared/src/casl/abilities.ts` | Définitions CASL par rôle |
| `shared/src/enums/roles.enum.ts` | Permissions RBAC |
| `backend/src/common/middlewares/rls.middleware.ts` | Propagation tenant RLS |
| `backend/src/modules/billing/services/` | TrancheConfig, ModuleResolution, FeatureFlags, Quota |
| `backend/src/modules/monitoring/services/` | Metrics, Alerting, NoisyNeighbor |
| `backend/database/migrations/152-153` | Activation RLS |
| `backend/database/migrations/155` | Partitionnement hash |
| `backend/database/migrations/156` | Billing configurable avancé |

### Frontend

| Fichier | Rôle |
|---------|------|
| `frontend/src/lib/casl/index.tsx` | CASL frontend (shared) |
| `frontend/src/app/permission-guards.ts` | Guards de route |
| `frontend/src/routes/_platform.*` | Control Plane |
| `frontend/src/routes/_auth.*` | Data Plane |
| `frontend/src/features/admin/components/ui-platform.tsx` | Composants réutilisables |

---

## Tests

| Type | Fichier | Couverture |
|------|---------|-----------|
| Unitaire | `test/unit/casl-abilities.spec.ts` | Définitions CASL par rôle |
| Unitaire | `test/unit/quota-guard.spec.ts` | Middleware quotas |
| Unitaire | `test/unit/feature-flags.spec.ts` | Cascade feature flags |
| Unitaire | `test/unit/tranche-config.spec.ts` | Cascade tranches |
| E2E | `test/e2e/billing-flow.spec.ts` | Flow billing complet |
| E2E | `test/e2e/multi-tenant-isolation-v5.spec.ts` | Isolation multi-tenant |
