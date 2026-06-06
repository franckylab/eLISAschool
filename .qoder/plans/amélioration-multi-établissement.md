# 🎯 Plan d'Amélioration - Configuration Multi-Établissement eLISAschool

## Contexte

Le système de configuration actuel d'eLISAschool présente des **lacunes architecturales critiques** qui empêchent une vraie gestion multi-établissement :

1. **ConfigurationApp** est un singleton global sans `etablissementId` - impossible d'avoir des configs différentes par établissement
2. **ParametreSysteme** (63 paramètres) sont TOUS globaux - pas de personnalisation par établissement
3. **EtablissementConfig** est sous-utilisée (seulement 2 champs)
4. **Duplication de données** entre ConfigurationApp et Etablissement
5. **Pas de hiérarchie de configuration** avec fallback

Selon les meilleures pratiques SaaS (Salesforce, Stripe, Shopify), un système multi-tenant doit supporter la **personnalisation par tenant** avec une **architecture de fallback** robuste.

---

## Architecture Proposée

### Hiérarchie de Configuration Multi-Niveaux

```
┌─────────────────────────────────────────────┐
│ Niveau 1: Paramètres Globaux (defaults)     │ ← ParametreSysteme WHERE etablissementId IS NULL
└────────────────┬────────────────────────────┘
                 │ fallback (si non trouvé)
┌────────────────▼────────────────────────────┐
│ Niveau 2: Override par Établissement        │ ← ParametreSysteme WHERE etablissementId = X
└────────────────┬────────────────────────────┘
                 │ fallback (si non trouvé)
┌────────────────▼────────────────────────────┐
│ Niveau 3: Valeur par défaut hardcodée       │ ← Code source
└─────────────────────────────────────────────┘
```

**Principe clé** : `(cle, etablissementId)` unique où `NULL` = global, `UUID` = override spécifique

---

## Plan d'Implémentation en 3 Phases

### PHASE 1 : Corrections Critiques (P0 - Production)

**Objectif** : Rendre la configuration scopable par établissement SANS breaking change

#### Tâche 1.1 : Scopage de ParametreSysteme par établissement

**Fichiers à modifier :**

1. **`backend/src/modules/configuration/entities/parametre-systeme.entity.ts`**
   - Ajouter colonne `etablissementId` nullable (UUID)
   - Changer index unique : `['cle']` → `['cle', 'etablissementId']`
   - Ajouter index sur `etablissementId` seul
   - Sémantique : `NULL` = paramètre global, `UUID` = override par établissement

2. **Créer `backend/src/database/migrations/006-parametres-multi-etablissements.ts`**
   ```sql
   ALTER TABLE parametres_systeme ADD COLUMN etablissement_id UUID NULL;
   DROP INDEX idx_parametres_cle_unique;
   CREATE UNIQUE INDEX idx_parametres_cle_etablissement 
     ON parametres_systeme(cle, etablissement_id);
   CREATE INDEX idx_parametres_etablissement 
     ON parametres_systeme(etablissement_id);
   ```

3. **`backend/src/modules/configuration/services/configuration.service.ts`**
   - `getParametre(cle, etablissementId?)` : Cherche override → fallback global → default
   - `setParametre(cle, valeur, etablissementId?)` : Crée override si etablissementId fourni
   - `resetParametre(cle, etablissementId?)` : Supprime override (retour au global)
   - `getParametres(query, etablissementId?)` : Retourne scopes + globaux non-surchargeés

4. **`backend/src/modules/configuration/dto/configuration.dto.ts`**
   - Ajouter `etablissementId: z.string().uuid().optional()` aux schemas

5. **`backend/src/modules/configuration/controllers/configuration.controller.ts`**
   - Utiliser `req.etablissementId` comme contexte par défaut
   - SUPER_ADMIN peut spécifier `?etablissementId=` dans query params
   - Nouveau endpoint : `DELETE /parametres/:cle` (supprime override, pas le global)

**Complexité** : ~200 lignes de code  
**Effort** : 2-3 jours  
**Risque** : Faible (migration réversible, backward-compatible)

---

#### Tâche 1.2 : Consolidation de ConfigurationApp

**Décision de design** : **SUPPRIMER** ConfigurationApp et migrer vers entités existantes

**Justification** :
- 90% des données sont déjà dans `Etablissement` (nom, adresse, logo, etc.)
- Paramètres régionaux déjà dans `ParametreSysteme` (regional.language, etc.)
- `modulesActifs` est un doublon de `ConfigurationModule.actif`

**Fichiers à modifier :**

1. **`backend/src/modules/etablissement/entities/etablissement.entity.ts`**
   
   Enrichir `EtablissementConfig` (ajouter après `configurationBulletin`) :
   - `couleurPrimaire`, `couleurSecondaire`, `couleurAccent` (thèmes)
   - `theme` (default, dark, cameroon)
   - `langueDefaut`, `devise`, `fuseauHoraire` (régional)
   - `messageAccueil` (texte d'accueil)
   - `modulesActifs` (Record<string, boolean>)

2. **Créer `backend/src/database/migrations/007-consolider-configuration-app.ts`**
   ```
   Pour CHAQUE établissement existant :
     1. Lire ConfigurationApp (singleton)
     2. Créer/mettre à jour EtablissementConfig avec ces valeurs
     3. Créer paramètres scopes (ParametreSysteme avec etablissementId)
   Marquer ConfigurationApp comme dépréciée
   ```

3. **`backend/src/modules/configuration/entities/configuration-app.entity.ts`**
   - Ajouter commentaire `@deprecated`
   - Ajouter logs warning quand méthodes appelées

4. **`backend/src/modules/configuration/services/configuration.service.ts`**
   - `getConfigApp()` → Rediriger vers `getEtablissementConfig(etablissementId)`
   - `updateConfigApp()` → Rediriger vers `updateEtablissementConfig()`
   - Maintenir compatibilité descendante pendant 2 versions

5. **Créer `backend/src/modules/etablissement/dto/etablissement-config.dto.ts`**
   - `UpdateEtablissementConfigDto` (schema Zod)
   - `ConfigurationCompleteDto` (réponse aggrégée)

**Complexité** : ~250 lignes de code  
**Effort** : 3-4 jours  
**Risque** : Moyen (nécessite testing approfondi)

---

#### Tâche 1.3 : Tests et Validation Phase 1

- Tester fallback de résolution (override → global → default)
- Tester création/suppression d'overrides
- Tester migration ConfigurationApp → EtablissementConfig
- Tests de non-régression sur endpoints existants
- Validation multi-établissement (2+ établissements avec configs différentes)

**Effort** : 2 jours

---

### PHASE 2 : Améliorations Architecturales (P1 - Majeur)

**Objectif** : Implémenter hiérarchie de configuration et contexte riche

#### Tâche 2.1 : Helper de Résolution de Configuration

**Créer `backend/src/modules/configuration/helpers/config-resolver.helper.ts`**

Fonctions à implémenter :
```typescript
resolveParametre<T>(cle: string, etablissementId: string, defaultValue?: T): Promise<T>
resolveConfigurationComplete(etablissementId: string): Promise<ConfigurationComplete>
resolveModulesActifs(etablissementId: string): Promise<string[]>
resolveParametresModule(module: string, etablissementId: string): Promise<Map<string, any>>
```

**Logique de cache** :
- Cache in-memory avec clé : `config:etablissement:{id}:parametres`
- TTL : 5 minutes (configurable via `.env`)
- Invalidation automatique sur modification
- Interface abstraite pour swap futur vers Redis

**Complexité** : ~150 lignes  
**Effort** : 2 jours

---

#### Tâche 2.2 : Contexte Riche Multi-Tenant (Lazy Loading)

**Approche recommandée** : Helper lazy au lieu de middleware lourd

**Créer `backend/src/modules/configuration/helpers/contexte.helper.ts`** :

```typescript
interface ContexteEtablissement {
    etablissementId: string;
    etablissement: { nom, type, sousSysteme, logoUrl, slogan };
    config: EtablissementConfig;
    parametres: Map<string, any>;
    modulesActifs: string[];
    langue: string;
    devise: string;
    timezone: string;
    limits?: { maxEleves?: number; maxUtilisateurs?: number; stockageMax?: number };
}

async function getContexteEtablissement(req: Request): Promise<ContexteEtablissement>
```

**Modifier `backend/src/common/types/express.d.ts`** :
```typescript
declare global {
    namespace Express {
        interface Request {
            utilisateur?: UtilisateurAuth;
            etablissementId?: string;
            contexteEtablissement?: ContexteEtablissement; // Lazy loaded
        }
    }
}
```

**Avantages** :
- `tenantMiddleware` reste léger (seulement `etablissementId`)
- Contexte chargé uniquement quand nécessaire
- Cache sur l'objet request (pas de double chargement)

**Effort** : 1-2 jours

---

#### Tâche 2.3 : Quotas et Limits par Établissement

**Modifier `backend/src/modules/etablissement/entities/etablissement.entity.ts`**

Ajouter à `EtablissementConfig` :
- `maxEleves` (number, nullable, 0 = illimité)
- `maxUtilisateurs` (number, nullable)
- `maxClasses` (number, nullable)
- `stockageMaxMB` (number, nullable)
- `dateExpirationAbonnement` (Date, nullable)
- `planAbonnement` (string: 'gratuit', 'standard', 'premium', 'entreprise')

**Validation dans les services** :
- `ElevesService.create()` → Vérifier `maxEleves`
- `UtilisateursService.create()` → Vérifier `maxUtilisateurs`
- Utiliser `getContexteEtablissement(req)` pour accéder aux limits

**Effort** : 2 jours

---

#### Tâche 2.4 : Tests Phase 2

- Tests de résolution avec fallback complet
- Tests de cache (hit/miss/invalidation)
- Tests de quotas (création bloquée quand limite atteinte)
- Tests de contexte riche (lazy loading)

**Effort** : 2 jours

---

### PHASE 3 : Optimisations Avancées (P2 - Optionnel)

**Objectif** : Cache distribué, API avancée, validation

#### Tâche 3.1 : Cache Redis Distribué

**Prérequis** : Installer `ioredis` dans `package.json`

**Créer `backend/src/common/services/redis.service.ts`** :
```typescript
class RedisService {
    async get(key: string): Promise<string | null>
    async set(key: string, value: string, ttl?: number): Promise<void>
    async del(key: string): Promise<void>
    async publish(channel: string, message: string): Promise<void>
    async subscribe(channel: string, callback: Function): Promise<void>
}
```

**Stratégie de clés Redis** :
```
config:etablissement:{id}:parametres       → Hash de tous les paramètres
config:etablissement:{id}:config           → JSON de EtablissementConfig
config:etablissement:{id}:modules          → Set des modules actifs
config:global:parametres                   → Paramètres globaux
```

**TTL** :
- Paramètres : 15 minutes
- Config établissement : 10 minutes
- Invalidation : Pub/Sub Redis ou invalidation manuelle sur mutation

**Modifier `config-resolver.helper.ts`** : Utiliser Redis au lieu de cache in-memory

**Note** : Redis déjà configuré dans `env.config.ts` mais non instancié

**Effort** : 2-3 jours

---

#### Tâche 3.2 : API de Gestion Avancée

**Nouveaux endpoints** dans `configuration.controller.ts` :

```
GET    /api/etablissements/:id/configuration/complete
       → Config complète (établissement + config + paramètres + modules)

PATCH  /api/etablissements/:id/configuration/parametres/:cle
       → Créer/modifier override de paramètre

DELETE /api/etablissements/:id/configuration/parametres/:cle
       → Supprimer override (retour au global)

POST   /api/etablissements/:id/configuration/duplicate?sourceId=xxx
       → Dupliquer config d'un autre établissement

GET    /api/etablissements/:id/configuration/compare?withId=xxx
       → Comparer config de deux établissements (diff)

GET    /api/etablissements/:id/configuration/export
       → Export JSON de toute la config

POST   /api/etablissements/:id/configuration/import
       → Import config JSON (avec validation)
```

**Effort** : 3-4 jours

---

#### Tâche 3.3 : Validation de Cohérence

**Créer `backend/src/modules/configuration/services/config-validation.service.ts`**

Validations :
- Références croisées valides (ex: cycle actif existe dans sous-système)
- Cohérence des paramètres (ex: calculation_method='ponderee' → coefficients configurés)
- Limits respectées (quota élèves, utilisateurs)
- Audit automatique des configurations incohérentes

**Effort** : 3 jours

---

#### Tâche 3.4 : Événements de Changement

**Améliorer `backend/src/modules/configuration/services/configuration-listener.ts`**

Événements :
- `config:etablissement:updated`
- `config:parametre:override:created`
- `config:parametre:override:deleted`

Utilité : Invalidation de cache cross-process, notifications temps réel

**Effort** : 1 jour

---

## Estimation Globale

| Phase | Tâches | Complexité | Effort Total | Risque |
|-------|--------|-----------|-------------|--------|
| **P0** | 1.1 + 1.2 + 1.3 | Moyenne-Haute | **7-9 jours** | Moyen |
| **P1** | 2.1 + 2.2 + 2.3 + 2.4 | Moyenne | **7-8 jours** | Faible |
| **P2** | 3.1 + 3.2 + 3.3 + 3.4 | Haute | **9-11 jours** | Moyen |

**Total** : **23-28 jours-homme** (environ 5-6 semaines pour 1 développeur)

---

## Stratégie de Migration Backward-Compatible

### Principe : Double-écriture + Fallback de lecture

**Pour ParametreSysteme** :
1. Migration ajoute `etablissementId` nullable → **AUCUNE donnée modifiée**
2. Tous les paramètres existants ont `etablissementId = NULL` (global)
3. Nouveau code lit avec fallback : scope établissement → global → default
4. Ancien code continue de fonctionner (lit paramètres globaux)

**Pour ConfigurationApp** :
1. Phase 1 : Marquer comme déprécié, rediriger lectures vers Etablissement + EtablissementConfig
2. Copier données existantes vers nouvelles tables
3. Pendant 2 versions : les deux systèmes fonctionnent en parallèle
4. Version N+2 : Supprimer références à ConfigurationApp

**Pour le middleware** :
1. `tenantMiddleware` reste inchangé
2. `getContexteEtablissement(req)` est optionnel
3. Controllers migrés progressivement

### Rollback Plan

Chaque migration SQL inclut bloc ROLLBACK. Migrations incrémentales et testables individuellement.

---

## Réponses aux Questions de Design

### Q1 : Supprimer ConfigurationApp ou garder comme template ?
**Réponse** : **SUPPRIMER**. Garder comme template crée confusion et duplication. Si besoin de templates futurs, créer entité dédiée `TemplateConfiguration`.

### Q2 : Quels paramètres scopables par établissement ?
**Réponse** : **TOUS les paramètres**. Le modèle `NULL = global, UUID = override` est simple et élégant. Certains resteront globaux en pratique (maintenance_mode, log_level), mais le modèle le permet si besoin futur.

### Q3 : Redis maintenant ou plus tard ?
**Réponse** : **In-memory pour Phase 1-2, Redis en Phase 3**. Le cache in-memory (5 min TTL) suffit pour single-node. Redis introduit complexité opérationnelle. L'interface de cache peut être abstraite pour swap facile.

### Q4 : Migration sans downtime ?
**Réponse** :
1. Migration schema (colonne nullable) : zero impact, instantané
2. Migration données : script background, pas de lock (batchs de 100 lignes)
3. Double-écriture pendant transition
4. Feature flag `system.multi_tenant_config_enabled` pour activer/désactiver
5. Script de validation post-migration

### Q5 : Système de quotas/limits ?
**Réponse** : **Oui, en Phase 2**. Besoin SaaS standard (plans gratuit/premium/entreprise). Phase 1 serait alourdie inutilement.

---

## Fichiers à Modifier/Créer

### À Modifier (11 fichiers)

| # | Fichier | Phase | Modification |
|---|---------|-------|-------------|
| 1 | `parametre-systeme.entity.ts` | P0 | Ajouter `etablissementId`, changer index |
| 2 | `configuration.service.ts` | P0 | Logique résolution avec fallback |
| 3 | `configuration.controller.ts` | P0 | Endpoints scopés, req.etablissementId |
| 4 | `configuration.dto.ts` | P0 | Ajouter `etablissementId` aux schemas |
| 5 | `configuration-seed.service.ts` | P0 | Seed avec etablissementId |
| 6 | `config.helper.ts` | P1 | Helpers avec support etablissementId |
| 7 | `tenant.middleware.ts` | P1 | Chargement lazy contexte (ou helper) |
| 8 | `express.d.ts` | P1 | Ajouter `contexteEtablissement` |
| 9 | `etablissement.entity.ts` | P0 | Enrichir `EtablissementConfig` |
| 10 | `configuration-app.entity.ts` | P0 | Marquer déprécié |
| 11 | `config-resolver.helper.ts` | P1 | NOUVEAU - Résolution avec fallback |

### À Créer (6 fichiers)

| # | Fichier | Phase | Contenu |
|---|---------|-------|---------|
| 1 | `006-parametres-multi-etablissements.ts` | P0 | Migration scopage paramètres |
| 2 | `007-consolider-configuration-app.ts` | P0 | Migration consolidation |
| 3 | `config-resolver.helper.ts` | P1 | Résolution avec fallback |
| 4 | `etablissement-config.dto.ts` | P0 | DTOs config établissement |
| 5 | `config-validation.service.ts` | P2 | Validation cohérence |
| 6 | `redis.service.ts` | P2 | Service cache Redis |

---

## Ordre d'Exécution Recommandé

```
Semaine 1-2 (Phase 1 - Critique) :
  Jour 1-2  : Migration 006 + entity ParametreSysteme
  Jour 3-4  : ConfigurationService avec résolution fallback
  Jour 5    : Controller + DTOs
  Jour 6    : Migration 007 + enrichissement EtablissementConfig
  Jour 7-8  : Dépréciation ConfigurationApp + tests
  Jour 9    : Tests d'intégration multi-établissement

Semaine 3 (Phase 2 - Amélioration) :
  Jour 1-2  : Config resolver helper + cache
  Jour 3    : Contexte riche (lazy loading)
  Jour 4    : Quotas/limits
  Jour 5    : Tests d'intégration
  Jour 6-7  : Documentation + corrections

Semaine 4-5 (Phase 3 - Optimisation) :
  Jour 1-2  : Redis cache
  Jour 3-4  : API avancée (duplicate, compare, export/import)
  Jour 5    : Validation cohérence
  Jour 6    : Événements + documentation finale
  Jour 7    : Tests de charge + performance
```

---

## Critères de Succès

### Phase 1 (P0) :
- ✅ Tous les 63 paramètres peuvent être surchargés par établissement
- ✅ ConfigurationApp dépréciée, données migrées
- ✅ Fallback fonctionne correctement (override → global → default)
- ✅ ZERO breaking change (backward-compatible)
- ✅ Tests passent à 100%

### Phase 2 (P1) :
- ✅ Helper de résolution fonctionnel avec cache
- ✅ Contexte riche accessible via `getContexteEtablissement(req)`
- ✅ Quotas/limits implémentés et validés
- ✅ Performance acceptable (< 50ms pour résolution config)

### Phase 3 (P2) :
- ✅ Cache Redis distribué opérationnel
- ✅ API avancée complète (7 nouveaux endpoints)
- ✅ Validation de cohérence active
- ✅ Événements de changement fonctionnels

---

## Prochaines Étapes

1. **Valider ce plan** avec le team
2. **Prioriser les phases** (commencer par P0 obligatoire)
3. **Configurer environnement de test** avec 2+ établissements
4. **Commencer Phase 1, Tâche 1.1** (scopage ParametreSysteme)
5. **Tests continus** après chaque tâche

---

**Document créé** : 2025-01-19  
**Version** : 1.0  
**Statut** : ✅ Prêt pour validation  
**Complexité totale** : 23-28 jours-homme  
**Risque global** : Moyen (atténué par migrations réversibles)
