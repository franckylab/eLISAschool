# Plan d'implémentation : Dashboard Consolidé Multi-Établissements

## Contexte

eLISAschool supporte actuellement le multi-tenancy (utilisateurs multi-établissements) mais **ne permet pas la consolidation des rapports et statistiques** pour un chef d'établissement qui manage plusieurs établissements.

**Problème** : Un directeur de groupe scolaire (primaire + collège + lycée) doit consulter chaque établissement individuellement, sans vue d'ensemble consolidée.

**Solution** : Créer un système de "groupes d'établissements" avec dashboard et rapports consolidés.

---

## Architecture retenue : Entité `GroupeEtablissement`

**Choix** : Table de regroupement séparée (pas de modification de `Etablissement`)

**Justification** :
- Évite les relations circulaires
- Concept orthogonal : un groupe est logique, indépendant de la propriété
- Support co-administration et sharing flexible
- Compatible avec `utilisateur_etablissements` existant

---

## Phases d'implémentation

### PHASE 1 : Migration SQL

**Fichier** : `backend/src/database/migrations/016-groupes-etablissements.sql`

**Tables créées** :
1. `groupes_etablissements` — Métadonnées du groupe (nom, code unique, propriétaire)
2. `groupe_etablissement_liens` — Jointure groupe ↔ établissement
3. `groupe_admins` — Co-administrateurs du groupe

**Indexes stratégiques** :
- `(proprietaire_id, actif)` sur groupes
- `(groupe_id, etablissement_id)` unique sur liens
- `(groupe_id, utilisateur_id)` unique sur admins

---

### PHASE 2 : Permissions RBAC

**Fichier modifié** : `shared/src/enums/roles.enum.ts`

**Nouvelles permissions** (6) :
```typescript
GROUPES_VIEW = 'groupes:view',
GROUPES_MANAGE = 'groupes:manage',
GROUPES_DASHBOARD_CONSOLIDE = 'groupes:dashboard:consolide',
GROUPES_RAPPORTS_SCOLARITE = 'groupes:rapports:scolarite',
GROUPES_RAPPORTS_FINANCES = 'groupes:rapports:finances',
GROUPES_ETABLISSEMENTS_MANAGE = 'groupes:etablissements:manage',
```

**Assignment** : Ajouter à `CHEF_ETABLISSEMENT` et `DIRECTEUR`

---

### PHASE 3 : Module `groupes-etablissements`

#### Structure

```
backend/src/modules/groupes-etablissements/
├── index.ts
├── entities/
│   ├── groupe-etablissement.entity.ts
│   ├── groupe-etablissement-lien.entity.ts
│   └── groupe-admin.entity.ts
├── dto/
│   ├── groupe.dto.ts (Zod schemas)
│   └── lien.dto.ts
├── services/
│   ├── groupes.service.ts (CRUD + gestion liens)
│   └── consolidation.service.ts (agrégation stats)
├── controllers/
│   └── groupes.controller.ts
└── guards/
    └── groupe-access.guard.ts
```

#### 3.1 Entités TypeORM

**GroupeEtablissement** :
- PK UUID, nom, description, proprietaireId, code (unique), actif
- Relations : `OneToMany` vers liens et admins
- Index sur `(proprietaireId, actif)`

**GroupeEtablissementLien** :
- PK UUID, groupeId, etablissementId, ajoutePar, dateAjout
- Index unique `(groupeId, etablissementId)`
- FK CASCADE sur delete

**GroupeAdmin** :
- PK UUID, groupeId, utilisateurId, assignePar, dateAssignation
- Index unique `(groupeId, utilisateurId)`

#### 3.2 DTOs Zod

```typescript
createGroupeSchema = {
    nom: z.string().min(3).max(255),
    description: z.string().optional(),
    code: z.string().regex(/^[A-Z0-9_-]+$/),
    etablissementIds: z.array(z.string().uuid()).optional()
}
```

#### 3.3 GroupesService

**Méthodes clés** :
- `createGroupe(dto, utilisateurId)` — Crée groupe + liens initiaux + admin par défaut
- `getGroupesForUser(uid)` — GROUP BY WHERE proprietaireId OR admin
- `addEtablissements(groupeId, ids, ajoutePar)` — Batch insert liens
- `removeEtablissement(groupeId, etabId)` — Delete + invalider cache
- `verifyAccess(groupeId, uid)` — Check proprio OU admin
- `getEtablissementsDuGroupe(groupeId)` — Liste établissements

#### 3.4 ConsolidationService

**Méthodes clés** :

```typescript
getDashboardConsolide(groupeId):
    1. Check cache (TTL 4h)
    2. getEtablissementsDuGroupe()
    3. Promise.all([
        aggregateElevesStats(etabIds),
        aggregateNotesStats(etabIds),
        aggregateFinancesStats(etabIds)
    ])
    4. detailsParEtablissement = map(each etab → stats détaillées)
    5. Cache + return

getRapportScolariteConsolide(groupeId, dateDebut, dateFin):
    - SQL GROUP BY avec CASE WHEN pour aggregation côté DB
    - Détails par établissement inclus

getRapportFinancierConsolide(groupeId, dateDebut, dateFin):
    - SUM() GROUP BY etablissementId pour paiements et dépenses
    - Calcul taux recouvrement, bénéfice net
```

**Optimisation** :
- Requêtes parallèles `Promise.all()`
- Agrégation SQL (pas de loop JS)
- Cache TTL différencié : consolidé 4h, détaillé 2h
- `In(etabIds)` clause pour batch queries

#### 3.5 Controller

**Endpoints** :
```
GET    /api/groupes                           → Mes groupes
POST   /api/groupes                           → Créer groupe
GET    /api/groupes/:id                       → Détails groupe
PATCH  /api/groupes/:id                       → Modifier groupe
GET    /api/groupes/:id/dashboard             → Dashboard consolidé
GET    /api/groupes/:id/rapports/scolarite    → Rapport scolarité
GET    /api/groupes/:id/rapports/finances     → Rapport finances
POST   /api/groupes/:id/etablissements        → Ajouter établissement
DELETE /api/groupes/:id/etablissements/:id    → Retirer établissement
POST   /api/groupes/:id/admins                → Ajouter admin
DELETE /api/groupes/:id/admins/:uid           → Retirer admin
```

**Sécurité** :
- `authMiddleware` sur toutes les routes
- `verifyAccess()` avant chaque opération
- `requireRoles()` sur POST création
- Validation DTO Zod sur POST/PATCH

---

### PHASE 4 : Intégration application

**Fichiers modifiés** :

1. `backend/src/app.ts` :
   ```typescript
   import { groupesController } from '@modules/groupes-etablissements';
   app.use('/api/groupes', groupesController);
   ```

2. `backend/src/modules/index.ts` :
   ```typescript
   export * from './groupes-etablissements';
   ```

---

### PHASE 5 : Invalidation cache

**Principe** : Quand un établissement change, invalider le cache consolidé de TOUS les groupes contenant cet établissement.

**Implémentation** :

```typescript
// Dans scolarite.service.ts, depenses.service.ts, eleves.service.ts
import { dashboardCacheService } from '@modules/dashboard/services';

// Après write operation
await dashboardCacheService.invalidateByPattern('precalc:groupe:*');
```

**Alternative découplée** : Utiliser EventEmitter pour notifier les changements

---

### PHASE 6 : Guard d'accès

**Fichier** : `backend/src/modules/groupes-etablissements/guards/groupe-access.guard.ts`

```typescript
export function requireGroupeAccess(req, res, next):
    groupeId = req.params.id
    uid = req.utilisateur.id
    groupesService.verifyAccess(groupeId, uid)
        .then(hasAccess => hasAccess ? next() : next(403))
```

---

## Estimation effort

| Phase | Tâche | Complexité | Temps |
|-------|-------|------------|-------|
| 1 | Migration SQL | Faible | 30 min |
| 2 | Permissions RBAC | Faible | 15 min |
| 3.1 | Entités TypeORM (3 fichiers) | Moyenne | 1h |
| 3.2 | DTOs Zod (2 fichiers) | Faible | 30 min |
| 3.3 | GroupesService | Moyenne | 2h |
| 3.4 | ConsolidationService | **Haute** | 3h |
| 3.5 | Controller + routes | Moyenne | 1h30 |
| 4 | Intégration app | Faible | 15 min |
| 5 | Invalidation cache | Moyenne | 1h |
| 6 | Guard accès | Faible | 30 min |
| 7 | Tests unitaires | **Haute** | 3h |

**Total : ~13 heures**

---

## Fichiers à créer (15)

1. `backend/src/database/migrations/016-groupes-etablissements.sql`
2. `backend/src/modules/groupes-etablissements/index.ts`
3. `backend/src/modules/groupes-etablissements/entities/index.ts`
4. `backend/src/modules/groupes-etablissements/entities/groupe-etablissement.entity.ts`
5. `backend/src/modules/groupes-etablissements/entities/groupe-etablissement-lien.entity.ts`
6. `backend/src/modules/groupes-etablissements/entities/groupe-admin.entity.ts`
7. `backend/src/modules/groupes-etablissements/dto/index.ts`
8. `backend/src/modules/groupes-etablissements/dto/groupe.dto.ts`
9. `backend/src/modules/groupes-etablissements/dto/lien.dto.ts`
10. `backend/src/modules/groupes-etablissements/services/index.ts`
11. `backend/src/modules/groupes-etablissements/services/groupes.service.ts`
12. `backend/src/modules/groupes-etablissements/services/consolidation.service.ts`
13. `backend/src/modules/groupes-etablissements/controllers/index.ts`
14. `backend/src/modules/groupes-etablissements/controllers/groupes.controller.ts`
15. `backend/src/modules/groupes-etablissements/guards/groupe-access.guard.ts`

## Fichiers à modifier (5)

1. `shared/src/enums/roles.enum.ts` — 6 permissions
2. `backend/src/app.ts` — Monter controller
3. `backend/src/modules/index.ts` — Barrel export
4. `backend/src/modules/finances/services/dashboard.service.ts` — Invalidation cache
5. `backend/src/modules/eleves/services/eleves.service.ts` — Invalidation cache

---

## Stratégie de tests

### Tests unitaires

1. **`groupes.service.spec.ts`** :
   - Création groupe avec liens initiaux
   - Vérification accès (propriétaire, admin, non-autorisé)
   - Ajout/retrait établissements
   - Unicité code groupe

2. **`consolidation.service.spec.ts`** :
   - Aggregation élèves avec mocks repositories
   - Aggregation finances (paiements, dépenses)
   - Cache hit/miss
   - Détails par établissement

3. **`groupes.controller.spec.ts`** :
   - Endpoints avec authentification
   - Validation DTO (erreurs 400)
   - Accès refusé (403)
   - Succès création (201)

### Tests manuels

```bash
# 1. Créer un groupe
curl -X POST http://localhost:3000/api/groupes \
  -H "Authorization: Bearer <token>" \
  -d '{"nom":"Groupe Scolaire ABC","code":"GS-ABC","etablissementIds":["uuid1","uuid2"]}'

# 2. Dashboard consolidé
curl http://localhost:3000/api/groupes/<id>/dashboard \
  -H "Authorization: Bearer <token>"

# 3. Rapport financier
curl "http://localhost:3000/api/groupes/<id>/rapports/finances?dateDebut=2026-01-01&dateFin=2026-06-07" \
  -H "Authorization: Bearer <token>"
```

---

## Points de vigilance

### Performance
- ✅ Requêtes parallèles avec `Promise.all()`
- ✅ Agrégation SQL (pas de boucle JS)
- ✅ Index sur FK et colonnes de filtrage
- ⚠️ **Attention** : Si >50 établissements dans un groupe, paginer les détails

### Sécurité
- ✅ Vérification accès sur CHAQUE endpoint
- ✅ Pas de fuite de données entre groupes (WHERE groupeId)
- ✅ Invalidation cache après modifications
- ⚠️ **Attention** : Vérifier que `verifyAccess()` est appelé avant TOUTE opération

### Cohérence données
- ✅ Constraint UNIQUE sur `(groupeId, etablissementId)`
- ✅ CASCADE DELETE sur liens et admins
- ✅ RESTRICT DELETE sur propriétaire (empêche suppression si groupe existe)
- ⚠️ **Attention** : Gérer le cas où un établissement est supprimé (nettoyer liens orphelins)

---

## Prochaines étapes

1. **Valider ce plan** avec le user
2. **Implémenter Phase 1-2** (migration + permissions)
3. **Implémenter Phase 3** (module complet)
4. **Tests unitaires**
5. **Tests manuels end-to-end**
6. **Documentation API** (Swagger auto-généré)

---

**Statut** : ✅ Plan prêt pour implémentation
**Complexité globale** : Moyenne-Haute
**Risque** : Faible (architecture éprouvée, patterns existants)
