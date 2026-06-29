# Analyse — Tables Utilisateurs dans la Liste par Établissement

> **Date** : 18 juin 2026  
> **Contexte** : Vérification de quelle table est utilisée pour afficher la liste des utilisateurs d'un établissement dans l'onglet "Utilisateurs" de la page d'édition d'établissement.

---

## 🎯 Question Posée

> "Quelle table utilisateur est utilisée pour lister les utilisateurs des établissements ? Je pense que les utilisateurs établissement sont définis dans `utilisateur_etablissements`."

---

## ✅ Réponse Courte

**OUI, votre intuition est PARTIELLEMENT correcte, mais il y a un PROBLÈME.**

La vue frontend utilise :
1. **Table `utilisateurs`** (entity `Utilisateur`) — **PRINCIPALE**
2. **Filtre `etablissementId`** sur la colonne `utilisateurs.etablissementId` — **PROBLÉMATIQUE**
3. **Table `utilisateur_etablissements`** — **UTILISÉE UNIQUEMENT pour exclure** (assignation), PAS pour lister

**⚠️ Le problème** : Le backend filtre sur `utilisateurs.etablissementId` (colonne directe) au lieu de faire un JOIN sur `utilisateur_etablissements` (table de jointure multi-établissements).

---

## 📊 Analyse Détaillée

### 1. Flux Frontend → Backend

```
[UtilisateursTab] (etablissement-edit-page.tsx:561)
    ↓
useUtilisateurs({ etablissementId, ... }) (use-utilisateurs.ts:32)
    ↓
GET /api/utilisateurs?etablissementId=xxx&... (api-client.ts)
    ↓
utilisateurs.controller.ts:33 → findAll(query)
    ↓
utilisateurs.service.ts:120 → WHERE etablissementId = xxx
    ↓
Table `utilisateurs` (PAS `utilisateur_etablissements`)
```

### 2. Code Frontend Concerné

**Fichier** : `frontend/src/features/etablissement/components/etablissement-edit-page.tsx`

```typescript
// Ligne 561-569
const { data: utilisateursResponse, isLoading, refetch } = useUtilisateurs({ 
    etablissementId,  // ← Passé au hook
    limit,
    page: currentPage,
    recherche: searchTerm || undefined,
    role: roleFilter || undefined,
    sortBy: 'nom',
    sortOrder: 'ASC',
});
```

**Fichier** : `frontend/src/features/utilisateurs/hooks/use-utilisateurs.ts`

```typescript
// Ligne 32-58
export function useUtilisateurs(filtres: UtilisateurFiltres = {}) {
    return useQuery({
        queryKey: UTILISATEURS_KEYS.liste(filtres),
        queryFn: async () => {
            const params: Record<string, any> = {
                page: filtres.page || 1,
                limit: filtres.limit || 20,
            };

            if (filtres.etablissementId) params.etablissementId = filtres.etablissementId;
            // ...

            const response = await apiClient.getPaginated<Utilisateur>('/api/utilisateurs', params);
            return response.data;
        },
        // ...
    });
}
```

### 3. Code Backend Concerné

**Fichier** : `backend/src/modules/utilisateurs/controllers/utilisateurs.controller.ts`

```typescript
// Ligne 33-46
router.get('/', requireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.CHEF_ETABLISSEMENT), async (req, res, next) => {
    try {
        const query = validateDto(queryUtilisateursSchema, req.query);
        const result = await utilisateursService.findAll(query);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
});
```

**Fichier** : `backend/src/modules/utilisateurs/services/utilisateurs.service.ts`

```typescript
// Ligne 120-203
async findAll(query: QueryUtilisateursDto): Promise<PaginatedResult<UtilisateurResponseDto>> {
    const { page, limit, search, role, statut, etablissementId, exclureEtablissement, sortBy, sortOrder } = query;

    const where: FindOptionsWhere<Utilisateur> = {};

    // ❌ PROBLÈME : Filtre direct sur la colonne etablissementId
    if (etablissementId) {
        where.etablissementId = etablissementId;  // ← Ligne 142-144
    }

    // ✅ CORRECT : Exclusion via utilisateur_etablissements
    if (exclureEtablissement) {
        queryBuilder.andWhere(`
            u.id NOT IN (
                SELECT ue."utilisateurId" 
                FROM utilisateur_etablissements ue 
                WHERE ue."etablissementId" = :exclureEtablissement 
                AND ue.actif = true
            )
        `, { exclureEtablissement });  // ← Ligne 158-167
    }

    // Requête finale
    let queryBuilder = this.utilisateurRepository
        .createQueryBuilder('u')
        .where(where);

    // ...
}
```

### 4. Structure des Tables

#### Table `utilisateurs` (Entity `Utilisateur`)

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid | Clé primaire |
| `email` | varchar(255) | Email unique |
| `matricule` | varchar(50) | Matricule unique |
| `motDePasse` | varchar(255) | Hash bcrypt |
| `role` | enum | Rôle global (Role) |
| `statut` | enum | Statut (ACTIF, INACTIF, etc.) |
| **`etablissementId`** | **uuid** | **FK vers établissement (nullable)** |
| `createdAt` | timestamp | Date création |
| `updatedAt` | timestamp | Date modification |

**Relation** :
```typescript
@ManyToOne(() => Etablissement, { nullable: true })
@JoinColumn({ name: 'etablissementId' })
etablissement?: Etablissement;
```

#### Table `utilisateur_etablissements` (Entity `UtilisateurEtablissement`)

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid | Clé primaire |
| `utilisateurId` | uuid | FK vers utilisateurs |
| `etablissementId` | uuid | FK vers etablissements |
| `role` | enum | Rôle DANS cet établissement |
| `etablissementPrincipal` | boolean | Établissement principal |
| `actif` | boolean | Statut de l'affectation |
| `dateDebut` | timestamp | Date début affectation |
| `dateFin` | timestamp | Date fin affectation |
| `motif` | varchar(500) | Motif (retrait, affectation) |
| `creePar` | uuid | Utilisateur créateur |
| `creeAt` | timestamp | Date création |
| `majAt` | timestamp | Date modification |

**Index** :
```typescript
@Index(['utilisateurId', 'etablissementId'], { unique: true })
@Index(['utilisateurId', 'actif'])
@Index(['etablissementId', 'actif'])
```

---

## 🚨 Problèmes Identifiés

### Problème 1 : Incohérence Multi-Établissements

**Situation actuelle** :
- Le système supporte le **multi-établissements** via `utilisateur_etablissements`
- Un utilisateur peut être assigné à **plusieurs établissements** avec des **rôles différents**
- MAIS la liste des utilisateurs d'un établissement filtre sur `utilisateurs.etablissementId`

**Conséquence** :
```sql
-- ❌ Requête ACTUELLE (incorrecte)
SELECT * FROM utilisateurs WHERE etablissementId = 'xxx';

-- ✅ Requête SOUHAITÉE (correcte)
SELECT u.* 
FROM utilisateurs u
INNER JOIN utilisateur_etablissements ue ON u.id = ue.utilisateurId
WHERE ue.etablissementId = 'xxx' AND ue.actif = true;
```

**Impact** :
- Les utilisateurs multi-établissements ne sont pas tous visibles
- Seuls les utilisateurs avec `utilisateurs.etablissementId` = établissement courant sont affichés
- Les utilisateurs assignés **uniquement** via `utilisateur_etablissements` (sans etablissementId direct) **n'apparaissent pas**

### Problème 2 : Colonne `utilisateurs.etablissementId` Redondante

**Observation** :
- La colonne `utilisateurs.etablissementId` existe **EN PLUS** de `utilisateur_etablissements`
- Elle semble être un **héritage de l'ancien système mono-établissement**
- Elle n'est **PAS synchronisée** avec `utilisateur_etablissements`

**Questions** :
1. Quand un utilisateur est assigné à un établissement via `utilisateur_etablissements`, `utilisateurs.etablissementId` est-il mis à jour ?
2. Quand un utilisateur a plusieurs établissements, quelle valeur prend `utilisateurs.etablissementId` ?
3. Cette colonne est-elle toujours nécessaire ?

### Problème 3 : Rôle Affiché Incorrect

**Situation** :
- L'entité `Utilisateur` a un champ `role` (rôle global)
- L'entité `UtilisateurEtablissement` a un champ `role` (rôle DANS l'établissement)
- La liste affiche le **rôle global** (`utilisateurs.role`) au lieu du **rôle dans l'établissement**

**Exemple** :
- Utilisateur A : rôle global = `ENSEIGNANT`
- Assigné à Établissement X : rôle = `ADMIN`
- Assigné à Établissement Y : rôle = `ENSEIGNANT`
- **Affichage actuel** : "ENSEIGNANT" (rôle global) ❌
- **Affichage souhaité** : "ADMIN" (rôle dans l'établissement courant) ✅

---

## 🔍 Vérification en Base de Données

Pour vérifier l'état actuel, exécuter ces requêtes SQL :

```sql
-- 1. Compter les utilisateurs par type d'assignation
SELECT 
    'Avec etablissementId direct' as type,
    COUNT(*) as nb
FROM utilisateurs 
WHERE etablissementId IS NOT NULL

UNION ALL

SELECT 
    'Via utilisateur_etablissements (actif)',
    COUNT(DISTINCT utilisateurId)
FROM utilisateur_etablissements 
WHERE actif = true

UNION ALL

SELECT 
    'Avec les deux (incohérence potentielle)',
    COUNT(*)
FROM utilisateurs u
INNER JOIN utilisateur_etablissements ue ON u.id = ue.utilisateurId
WHERE u.etablissementId IS NOT NULL 
  AND ue.actif = true
  AND u.etablissementId != ue.etablissementId;

-- 2. Voir les utilisateurs multi-établissements
SELECT 
    u.id,
    u.email,
    u.role as role_global,
    u.etablissementId as etablissement_direct,
    COUNT(ue.id) as nb_etablissements
FROM utilisateurs u
LEFT JOIN utilisateur_etablissements ue ON u.id = ue.utilisateurId AND ue.actif = true
GROUP BY u.id, u.email, u.role, u.etablissementId
HAVING COUNT(ue.id) > 1
ORDER BY nb_etablissements DESC;

-- 3. Voir les utilisateurs avec incohérence de rôle
SELECT 
    u.id,
    u.email,
    u.role as role_global,
    ue.etablissementId,
    ue.role as role_etablissement,
    ue.etablissementPrincipal
FROM utilisateurs u
INNER JOIN utilisateur_etablissements ue ON u.id = ue.utilisateurId
WHERE u.role != ue.role
  AND ue.actif = true
LIMIT 20;
```

---

## 🛠️ Solutions Proposées

### Solution 1 : Corriger le Filtre `findAll()` (RECOMMANDÉE)

**Objectif** : Utiliser `utilisateur_etablissements` pour filtrer les utilisateurs d'un établissement.

**Fichier** : `backend/src/modules/utilisateurs/services/utilisateurs.service.ts`

```typescript
async findAll(query: QueryUtilisateursDto): Promise<PaginatedResult<UtilisateurResponseDto>> {
    const { page, limit, search, role, statut, etablissementId, exclureEtablissement, sortBy, sortOrder } = query;

    let queryBuilder = this.utilisateurRepository
        .createQueryBuilder('u')
        .innerJoin('u.utilisateurEtablissements', 'ue')  // ← JOIN obligatoire
        .where('ue.actif = :actif', { actif: true });

    // ✅ Filtre par établissement via la table de jointure
    if (etablissementId) {
        queryBuilder.andWhere('ue.etablissementId = :etablissementId', { etablissementId });
    }

    // EXCLURE les utilisateurs déjà assignés (pour assignation)
    if (exclureEtablissement) {
        queryBuilder.andWhere(`
            u.id NOT IN (
                SELECT ue2."utilisateurId" 
                FROM utilisateur_etablissements ue2 
                WHERE ue2."etablissementId" = :exclureEtablissement 
                AND ue2.actif = true
            )
        `, { exclureEtablissement });
    }

    // Filtre par rôle (dans l'établissement, pas global)
    if (role) {
        const roles = role.split(',').map(r => r.trim());
        if (roles.length === 1) {
            queryBuilder.andWhere('ue.role = :role', { role: roles[0] });
        } else {
            queryBuilder.andWhere('ue.role IN (:...roles)', { roles });
        }
    }

    // Recherche textuelle
    if (search) {
        queryBuilder.andWhere(
            '(u.email ILIKE :search OR u.matricule ILIKE :search)',
            { search: `%${search}%` }
        );
    }

    // Statut
    if (statut) {
        queryBuilder.andWhere('u.statut = :statut', { statut });
    }

    // Tri
    const allowedSortFields = ['createdAt', 'updatedAt', 'email', 'matricule'];
    const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    queryBuilder.orderBy(`u.${orderField}`, sortOrder);

    // Pagination
    const { createPaginatedResult, paginateWithQueryBuilder } = await import('@common/utils/pagination.util');
    
    const result = await paginateWithQueryBuilder(
        queryBuilder,
        page,
        limit,
        true
    );

    // Récupérer les profils ET les affectations établissement
    const items = await Promise.all(
        result.items.map(async (u) => {
            const profil = await this.profilRepository.findOne({
                where: { utilisateurId: u.id },
            });
            
            // Récupérer l'affectation pour cet établissement
            const affectation = etablissementId 
                ? await AppDataSource.getRepository('UtilisateurEtablissement').findOne({
                    where: { utilisateurId: u.id, etablissementId, actif: true }
                })
                : null;

            return this.formatUtilisateurResponse(u, profil || undefined, affectation);
        })
    );

    return createPaginatedResult(items, result.meta.totalItems, page, limit);
}
```

**Modifications nécessaires** :
1. Ajouter `innerJoin` sur `utilisateurEtablissements`
2. Filtrer par `ue.etablissementId` au lieu de `u.etablissementId`
3. Filtrer par `ue.role` (rôle dans l'établissement) au lieu de `u.role`
4. Retourner l'affectation avec le response DTO

### Solution 2 : Synchroniser `utilisateurs.etablissementId`

**Objectif** : Maintenir `utilisateurs.etablissementId` synchronisé avec `utilisateur_etablissements.etablissementPrincipal`.

**Quand assigner un utilisateur** :
```typescript
// Dans utilisateur-etablissement.service.ts
async assigner(utilisateurId: string, etablissementId: string, role: Role) {
    // ... création affectation ...

    // Synchroniser etablissementId si c'est le premier ou le principal
    if (affectation.etablissementPrincipal) {
        await this.utilisateurRepository.update(utilisateurId, {
            etablissementId: etablissementId
        });
    }
}
```

**Avantages** :
- Compatibilité ascendante avec l'ancien code
- Performance (pas de JOIN nécessaire)

**Inconvénients** :
- Redondance de données
- Risque de désynchronisation
- Ne résout pas le problème du rôle par établissement

### Solution 3 : Supprimer `utilisateurs.etablissementId` (RADICALE)

**Objectif** : Ne plus utiliser `utilisateurs.etablissementId`, uniquement `utilisateur_etablissements`.

**Étapes** :
1. Migration de données : copier `utilisateurs.etablissementId` vers `utilisateur_etablissements` si manquant
2. Supprimer la colonne `utilisateurs.etablissementId`
3. Modifier TOUS les filtres pour utiliser JOIN sur `utilisateur_etablissements`
4. Mettre à jour les DTOs pour retourner le rôle par établissement

**Risques** :
- Impact majeur sur le codebase
- Nombreux fichiers à modifier
- Tests de régression nécessaires

---

## 📋 Fichiers à Modifier (Solution 1)

### Backend (5 fichiers)

| Fichier | Modification |
|---------|-------------|
| `utilisateurs.service.ts` | Modifier `findAll()` pour utiliser JOIN |
| `utilisateurs.dto.ts` | Ajouter `etablissementId` dans le response DTO |
| `utilisateur-etablissement.service.ts` | Retourner le rôle dans les responses |
| `query-utilisateurs.dto.ts` | Valider `etablissementId` comme filtre |
| `utilisateurs.controller.ts` | Aucun changement (déjà correct) |

### Frontend (3 fichiers)

| Fichier | Modification |
|---------|-------------|
| `utilisateur.types.ts` | Ajouter `roleEtablissement` au type |
| `use-utilisateurs.ts` | Aucun changement (déjà correct) |
| `etablissement-edit-page.tsx` | Afficher `roleEtablissement` au lieu de `role` |

---

## 🎯 Recommandation

**Appliquer la Solution 1** car elle :
1. ✅ Respecte l'architecture multi-établissements
2. ✅ Affiche le bon rôle (rôle dans l'établissement)
3. ✅ Montre tous les utilisateurs assignés (pas seulement ceux avec `etablissementId` direct)
4. ✅ Est rétro-compatible (ne supprime pas de colonne)
5. ✅ Nécessite peu de modifications (principalement `findAll()`)

**Priorité** : **HAUTE** — Cette incohérence impacte directement la fonctionnalité multi-établissements.

---

## 📝 Notes Complémentaires

### Pourquoi Cette Incohérence Existe ?

1. **Historique** : Le système était initialement mono-établissement (`utilisateurs.etablissementId`)
2. **Évolution** : Le multi-établissements a été ajouté via `utilisateur_etablissements`
3. **Transition incomplète** : Le filtre `findAll()` n'a pas été migré vers le nouveau modèle

### Impact sur le Retrait d'Utilisateur

Le retrait d'utilisateur (`DELETE /api/utilisateurs/:id/etablissements/:etabId`) fonctionne correctement car il utilise :
- `utilisateur_etablissements` pour la désactivation
- Transaction ACID avec vérifications

MAIS la **liste après retrait** peut être incorrecte car elle filtre sur `utilisateurs.etablissementId` au lieu de `utilisateur_etablissements`.

### Prochaines Étapes

1. **Exécuter les requêtes SQL de vérification** (section "Vérification en Base de Données")
2. **Confirmer l'ampleur du problème** (combien d'utilisateurs concernés ?)
3. **Appliquer la Solution 1** si le problème est confirmé
4. **Tester** avec des utilisateurs mono et multi-établissements
5. **Documenter** la migration dans le changelog

---

**Conclusion** : Votre intuition était correcte — les utilisateurs d'établissement **devraient** être listés via `utilisateur_etablissements`, mais le code actuel utilise encore `utilisateurs.etablissementId` (héritage mono-établissement). Cette incohérence doit être corrigée pour que le multi-établissements fonctionne correctement.
