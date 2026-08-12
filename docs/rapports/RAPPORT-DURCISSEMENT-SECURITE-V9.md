# Rapport de Durcissement Sécurité eLISAschool v9

> **Date** : 2026-08-10
> **Score** : 7.2/10 → 9.2/10 (estimé)
> **Phases** : P0 (critique), P1 (renforcée), P2 (avancée) — **TOUTES COMPLÈTES**

---

## Résumé exécutif

Le durcissement sécurité v9 couvre 20 tâches réparties en 3 phases, touchant ~25 fichiers existants et créant ~15 nouveaux fichiers. L'objectif était de corriger 9 failles identifiées dans le rapport d'audit initial (G1-G9) et d'ajouter des fonctionnalités de sécurité avancées.

---

## Phase P0 — Corrections Critiques ✅

| Tâche | Description | Fichier(s) | Statut |
|-------|-------------|-----------|--------|
| P0.1 | G1: Fallback RLS → rejet explicite | `rls.middleware.ts` | ✅ |
| P0.2 | G2: Guards CASL sur routes backup | `platform.routes.ts` | ✅ |
| P0.3 | G3: Validation path traversal backup | `platform.routes.ts` | ✅ |
| P0.4 | Séparation ENCRYPTION_KEY ≠ JWT_SECRET | `encryption.util.ts`, `mfa.service.ts`, `env.config.ts` | ✅ |
| P0.5 | Mots de passe par défaut dans les seeds | `seed-super-admin.ts`, `seed-utilisateurs-plateforme.ts` | ✅ |
| P0.6 | G9: dualCaslMiddleware error path | `dual-casl.middleware.ts` | ✅ |

### Détails P0

- **G1** : Si aucun `etablissementId` ET rôle non privilégié → `throw AppError(403, 'NO_TENANT_CONTEXT')` au lieu de fallback silencieux
- **G2** : `requirePlatformCasl('manage', 'Backup')` sur les 4 routes backup
- **G3** : `validateBackupPath()` avec `path.resolve()` + `fs.realpath()` anti path traversal
- **P0.4** : Fallback chaîné supprimé, `ENCRYPTION_KEY` obligatoire en production, script `generate-security-keys.sh`
- **P0.5** : `getSeedPassword()` depuis `SEED_ADMIN_PASSWORD` env, fallback aléatoire, throw en production
- **G9** : `next(error)` au lieu de `next()` dans le catch du dual-casl middleware

---

## Phase P1 — Sécurité Renforcée ✅

| Tâche | Description | Fichier(s) | Statut |
|-------|-------------|-----------|--------|
| P1.1 | G4: Rate limiter Redis-based | `rate-limit.middleware.ts` | ✅ |
| P1.2 | G5: Tenant isolation strict mode | `tenant-isolation.subscriber.ts` | ✅ |
| P1.3 | G6: Vérification etablissements en base | `tenant.middleware.ts` | ✅ |
| P1.4 | Refresh Token Rotation | `token.service.ts`, `refresh-token.entity.ts` | ✅ |
| P1.5 | Audit Log Integrity Signing (HMAC) | `audit.service.ts`, `audit-log.entity.ts` | ✅ |
| P1.6 | IP Allowlist Plateforme | 3 nouveaux fichiers | ✅ |
| P1.7 | G7: CASL rules rôles plateforme en tenant | `abilities.ts` | ✅ |
| P1.8 | G8: Commentaires trompeurs | `platform.routes.ts` | ✅ |

### Détails P1

- **G4** : Redis `INCR rate:{ip}:{etablissementId}` + `EXPIRE 60`, fallback Map si Redis indisponible
- **G5** : Flag `STRICT_TENANT_ISOLATION`, throw `AppError(403)` en production au lieu d'écraser silencieusement
- **G6** : `getAffectationsFromDB()` avec cache Redis TTL 5 min, `invalidateTenantCache()`
- **P1.4** : Colonnes `familleId` + `tokenPrecedentId`, détection compromission (réutilisation → révocation famille entière)
- **P1.5** : `HMAC-SHA256(ligne_precedente_hash + payload, AUDIT_HMAC_KEY)`, `verifierIntegrite()`, chaîne blockchain-like
- **P1.6** : Entité `IpAutorisee` (IPv6), service avec cache Redis TTL 5 min, middleware sur `/api/platform/*`, fail-open
- **G7** : 5 cas ajoutés dans `defineAbility()` : ADMIN_PLATEFORME, SUPPORT, OBSERVATEUR, GESTIONNAIRE_GROUPES, FACTURATION
- **G8** : Commentaires mis à jour v9.0.0

---

## Phase P2 — Fonctionnalités Avancées ✅

| Tâche | Description | Fichier(s) | Statut |
|-------|-------------|-----------|--------|
| P2.1 | WebAuthn/Passkeys passwordless + MFA | 4 nouveaux fichiers + controller | ✅ |
| P2.2 | Remplacement console.error critiques | 5 fichiers | ✅ |
| P2.3 | CSP Headers améliorés | `app.ts` | ✅ |
| P2.4 | KeyManager en base + rotation auto | 2 nouveaux fichiers | ✅ |
| P2.5 | Tests unitaires sécurité | 5 fichiers de test | ✅ |
| P2.6 | Documentation + mise à jour | Rapport + AGENTS.md | ✅ |

### Détails P2

- **P2.1** : Entité `WebAuthnCredential`, service `WebAuthnService` (6 méthodes), 6 endpoints REST, composants frontend `WebAuthnSetup.tsx` et `WebAuthnLogin.tsx`
- **P2.2** : `console.error/log` → `logger.error/info/debug` dans 5 fichiers critiques + imports logger ajoutés
- **P2.3** : CSP : `frameSrc: none`, `objectSrc: none`, `baseUri: self`, `formAction: self`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, `X-Permitted-Cross-Domain-Policies: none`
- **P2.4** : Entité `CleCryptographique` (4 types : JWT, ENCRYPTION, MFA, AUDIT_HMAC), service `KeyManagerService` avec `getActiveKey()`, `rotateKey()`, chiffrement AES-256-GCM en base, grace period 7 jours, rotation auto 90 jours
- **P2.5** : 5 fichiers de test : `rls-middleware.spec.ts`, `refresh-token-rotation.spec.ts`, `audit-integrity.spec.ts`, `ip-allowlist.spec.ts`, `key-manager.spec.ts`

---

## Fichiers créés

| Fichier | Phase |
|---------|-------|
| `backend/scripts/generate-security-keys.sh` | P0.4 |
| `backend/src/modules/platform-auth/entities/ip-autorisee.entity.ts` | P1.6 |
| `backend/src/modules/platform-auth/services/ip-allowlist.service.ts` | P1.6 |
| `backend/src/common/middlewares/ip-allowlist.middleware.ts` | P1.6 |
| `backend/src/modules/auth/entities/webauthn-credential.entity.ts` | P2.1 |
| `backend/src/modules/auth/services/webauthn.service.ts` | P2.1 |
| `frontend/src/features/auth/components/WebAuthnSetup.tsx` | P2.1 |
| `frontend/src/features/auth/components/WebAuthnLogin.tsx` | P2.1 |
| `backend/src/modules/configuration/entities/cle-cryptographique.entity.ts` | P2.4 |
| `backend/src/modules/configuration/services/key-manager.service.ts` | P2.4 |
| `backend/test/unit/rls-middleware.spec.ts` | P2.5 |
| `backend/test/unit/refresh-token-rotation.spec.ts` | P2.5 |
| `backend/test/unit/audit-integrity.spec.ts` | P2.5 |
| `backend/test/unit/ip-allowlist.spec.ts` | P2.5 |
| `backend/test/unit/key-manager.spec.ts` | P2.5 |

---

## Variables d'environnement ajoutées

| Variable | Description | Obligatoire |
|----------|-------------|-------------|
| `AUDIT_HMAC_KEY` | Clé HMAC pour signature audit logs | Oui (production) |
| `SEED_ADMIN_PASSWORD` | Mot de passe initial des seeds | Oui (production) |
| `STRICT_TENANT_ISOLATION` | Mode strict isolation tenant (défaut true en prod) | Non |
| `MFA_SECRET_PEPPER` | Pepper pour chiffrement secrets MFA | Non |

---

## Dépendances à ajouter

| Package | Usage | Scope |
|---------|-------|-------|
| `@simplewebauthn/server` | Vérification WebAuthn côté serveur | backend |
| `@simplewebauthn/browser` | API WebAuthn côté client | frontend |

---

## Architecture sécurité v9

```
                    ┌─────────────────────────────────────┐
                    │         HTTP Request                │
                    └──────────────┬──────────────────────┘
                                   │
                    ┌──────────────▼──────────────────────┐
                    │  IP Allowlist (/api/platform/*)     │ ← P1.6
                    └──────────────┬──────────────────────┘
                                   │
                    ┌──────────────▼──────────────────────┐
                    │  Rate Limiter (Redis INCR+EXPIRE)   │ ← P1.1
                    └──────────────┬──────────────────────┘
                                   │
                    ┌──────────────▼──────────────────────┐
                    │  CSP Headers + Permissions-Policy   │ ← P2.3
                    └──────────────┬──────────────────────┘
                                   │
                    ┌──────────────▼──────────────────────┐
                    │  Auth (JWT + WebAuthn + MFA)        │ ← P2.1
                    │  Refresh Token Rotation             │ ← P1.4
                    └──────────────┬──────────────────────┘
                                   │
                    ┌──────────────▼──────────────────────┐
                    │  Dual CASL (Platform + Tenant)      │ ← P1.7, P0.6
                    └──────────────┬──────────────────────┘
                                   │
                    ┌──────────────▼──────────────────────┐
                    │  RLS Middleware (rejet explicite)    │ ← P0.1
                    │  Tenant Isolation Strict            │ ← P1.2
                    │  Vérification DB affectations       │ ← P1.3
                    └──────────────┬──────────────────────┘
                                   │
                    ┌──────────────▼──────────────────────┐
                    │  PostgreSQL RLS (40+ tables)        │
                    └──────────────┬──────────────────────┘
                                   │
                    ┌──────────────▼──────────────────────┐
                    │  Audit Log + HMAC Integrity Chain   │ ← P1.5
                    │  KeyManager (rotation auto 90j)     │ ← P2.4
                    └─────────────────────────────────────┘
```
