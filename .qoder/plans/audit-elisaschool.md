# 🔍 Audit eLISAschool — Architecture, Best Practices & Multi-Établissements

## Contexte

Audit complet du projet eLISAschool pour évaluer :
1. Le respect des meilleures pratiques de développement
2. La capacité à gérer plusieurs établissements scolaires

---

## 1. Architecture Globale

**Stack** : Monorepo npm workspaces — Express.js 4.21 + TypeORM 0.3 + PostgreSQL 16 + Redis 7 + TypeScript 5.7

```
eLISAschool/
├── backend/    → API Express.js modulaire
├── shared/     → Types, enums, validators partagés
├── docker/     → Dockerfiles + nginx
└── docker-compose (dev + prod)
```

> ⚠️ **Note importante** : Ce n'est **pas** NestJS. C'est Express.js pur avec une organisation manuelle en modules.

---

## 2. Support Multi-Établissements

### 🔴 VERDICT : NON — Le système ne gère qu'un seul établissement

**Preuves dans le code :**

| Élément | Statut | Détail |
|---|---|---|
| Entité `Etablissement` relationnelle | ❌ Absente | Seule `EtablissementConfig` existe (singleton) |
| FK `etablissementId` sur entités académiques | ❌ Absente | Classes, Élèves, Notes, Bulletins n'ont aucun lien vers un établissement |
| Champ `etablissementId` sur `Utilisateur` | ⚠️ Présent mais orphelin | Pas de `@ManyToOne`, pas de contrainte FK |
| `etablissementId` dans JWT | ✅ Présent | Inclus dans le payload mais jamais utilisé pour filtrer |
| Filtrage des requêtes par établissement | ❌ Non implémenté | Aucune logique de multi-tenancy |
| `EtablissementConfig` | Singleton | `findOne({ where: {} })` → une seule config possible |

**Conclusion** : Le champ `etablissementId` sur `Utilisateur` et dans le JWT est une **préparation incomplète** pour du multi-établissements futur. Aujourd'hui, **tout le système fonctionne avec un seul établissement**.

---

## 3. Évaluation Best Practices

### ✅ Points Forts

- **Sécurité** : Helmet, CORS, rate limiting, bcrypt (cost 12), chiffrement AES-256-GCM, timing-safe comparison
- **Authentification** : JWT access + refresh tokens, rotation, révocation, blocage après N tentatives
- **RBAC** : 9 rôles, ~35 permissions granulaires, middlewares `requireRoles` + `requireAccess`
- **Audit** : `AuditLog` complet avec 25+ types d'actions, sévérité, IP, user agent
- **Validation env** : Zod schema sur toutes les variables `.env` avec validation stricte
- **Configuration dynamique** : `ParametreSysteme` en DB avec catégories et surcharge runtime
- **Docker** : Compose dev/prod séparés, health checks, volumes
- **Types partagés** : Package `shared` avec types, validators, enums réutilisés front/back
- **Indexes DB** : Index composites sur les FK principales
- **Sous-système bilingue** : FRANCOPHONE / ANGLOPHONE / BICULTUREL

### 🔴 Faiblesses Critiques

| Problème | Impact |
|---|---|
| **Aucun test** | Jest configuré mais 0 fichier de test → risque élevé de régressions |
| **Pas de DI container** | Services instanciés manuellement (`new Service()`) → couplage fort, testabilité réduite |
| **Pas de migrations DB** | `synchronize: true` en dev, aucun fichier de migration → risque de perte de données |
| **Frontend absent** | Workspace déclaré mais répertoire non présent |

### 🟡 Faiblesses Moyennes

| Problème |
|---|
| `etablissementId` orphelin (pas de FK, pas de multi-tenancy) |
| `AffectationEleve` découplé de `Eleve` (TODO commenté) |
| `InscriptionCantine`/`InscriptionTransport` lient `eleveId` vers `Utilisateur` au lieu de `Eleve` |
| SSL production : `rejectUnauthorized: false` (risque MITM) |
| Réponses API non standardisées (parfois `{success, data}`, parfois `{message}`) |
| `modules/index.ts` incomplet (ne re-exporte pas tous les modules) |
| Pas de pagination standardisée |
| Monitoring incomplet (`getRecentLogs` retourne `[]`) |

---

## 4. Modules Fonctionnels (25 modules)

| Catégorie | Modules |
|---|---|
| **Académique** | etablissement, cycles, niveaux, annees-scolaires, periodes, classes, eleves, matieres, personnel, bulletins, notes |
| **Communication** | messagerie (conversations, messages), requetes (workflow approbation) |
| **Logistique** | cantine (menus, consommations), transport (lignes, présences), materiel (inventaire, prêts) |
| **Activités** | clubs, gamification (points/badges), cartes (QR) |
| **Avancé** | orientation (RDV, fiches métiers), impressions (modèles, file async), scoring, monitoring |
| **Système** | auth, utilisateurs, configuration, notifications |

---

## 5. Recommandations Prioritaires

### Pour le multi-établissements
1. Créer une entité `Etablissement` avec ses propres relations
2. Ajouter `etablissementId` comme FK sur toutes les entités académiques
3. Implémenter un middleware de filtrage automatique (multi-tenancy)
4. Transformer `EtablissementConfig` en relation 1:1 avec `Etablissement`

### Pour les best practices
1. **Ajouter des tests** (unitaires + intégration) — priorité absolue
2. **Créer des migrations TypeORM** et désactiver `synchronize`
3. **Corriger les FK incohérentes** (cantine/transport → Eleve au lieu de Utilisateur)
4. **Standardiser les réponses API** (format `{success, data, meta}` systématique)
5. **Ajouter un DI container** (tsyringe ou inversify) pour découpler les services
6. **Corriger SSL** en production (`rejectUnauthorized: true`)

---

## Vérification

Pour valider cette analyse :
- `cd backend && npx typeorm migration:show` — vérifier l'état des migrations
- `find backend/src -name "*.spec.ts" -o -name "*.test.ts"` — confirmer l'absence de tests
- Vérifier les FK dans la DB PostgreSQL directement (`\d+ table_name`)
