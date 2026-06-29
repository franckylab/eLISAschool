# Correction — Erreur de Contrainte FK lors de la Suppression d'Utilisateur

> **Date** : 18 juin 2026  
> **Statut** : ✅ **COMPLÉTÉ**  
> **Erreur** : `update or delete on table "utilisateurs" violates foreign key constraint on table "audit_logs"`

---

## 🎯 Problème

### Erreur Rencontrée

```
QueryFailedError: update or delete on table "utilisateurs" violates foreign key constraint 
"FK_9097c44566a3c1fc5cd5b4132c1" on table "audit_logs"
```

### Cause Racine

La table `audit_logs` a une relation `ManyToOne` vers `utilisateurs` :

```typescript
// audit-log.entity.ts
@ManyToOne(() => Utilisateur, { nullable: true })
@JoinColumn({ name: 'utilisateurId' })
utilisateur?: Utilisateur;
```

**Problème** : L'absence d'option `onDelete: 'SET NULL'` ou `onDelete: 'CASCADE'` signifie que PostgreSQL utilise le comportement par défaut `RESTRICT`, qui **empêche la suppression** d'un utilisateur tant qu'il existe des logs d'audit associés.

### Pourquoi C'est un Problème Métier

1. **Audit obligatoire** : Toutes les actions utilisateur sont loguées pour traçabilité
2. **Données historiques** : Les logs d'audit doivent être préservés même après suppression d'un utilisateur
3. **Conformité** : La suppression physique violerait les exigences de traçabilité

---

## ✅ Solution Implémentée

### Stratégie : Soft Delete (Suppression Logique)

Au lieu de supprimer physiquement l'utilisateur (`DELETE FROM utilisateurs`), nous :

1. ✅ Désactivons toutes les affectations établissement
2. ✅ Changeons le statut à `INACTIF` (soft delete)
3. ✅ Invalider les tokens de session
4. ✅ Supprimons le profil (données personnelles RGPD)
5. ✅ **Préservons les audit_logs** (traçabilité)

### Code Modifié

**Fichier** : `backend/src/modules/utilisateurs/services/utilisateurs.service.ts`

#### AVANT ❌ (Hard Delete)

```typescript
async remove(id: string): Promise<void> {
    const utilisateur = await this.utilisateurRepository.findOne({
        where: { id },
    });

    if (!utilisateur) {
        throw new AppError('Utilisateur non trouvé', 404, 'USER_NOT_FOUND');
    }

    await this.utilisateurRepository.remove(utilisateur);  // ← DELETE physique
    // ← Échoue car audit_logs référencent cet utilisateur

    logger.info(`Utilisateur supprimé: ${utilisateur.email}`);
}
```

#### APRÈS ✅ (Soft Delete avec Transaction)

```typescript
async remove(id: string): Promise<void> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
        const utilisateur = await queryRunner.manager.findOne(Utilisateur, {
            where: { id },
        });

        if (!utilisateur) {
            throw new AppError('Utilisateur non trouvé', 404, 'USER_NOT_FOUND');
        }

        // VÉRIFICATION : Empêcher la suppression du dernier SUPER_ADMIN
        if (utilisateur.role === Role.SUPER_ADMIN) {
            const superAdminCount = await queryRunner.manager.count(Utilisateur, {
                where: { role: Role.SUPER_ADMIN, statut: StatutUtilisateur.ACTIF }
            });
            
            if (superAdminCount <= 1) {
                throw new AppError(
                    'Impossible de supprimer le dernier Super Admin',
                    400,
                    'LAST_SUPER_ADMIN'
                );
            }
        }

        // ÉTAPE 1 : Désactiver toutes les affectations établissement
        await queryRunner.manager.query(
            `UPDATE utilisateur_etablissements 
             SET actif = false, dateFin = NOW() 
             WHERE "utilisateurId" = $1 AND actif = true`,
            [id]
        );

        // ÉTAPE 2 : Soft delete via changement de statut
        utilisateur.statut = StatutUtilisateur.INACTIF;
        await queryRunner.manager.save(utilisateur);

        // ÉTAPE 3 : Invalider les tokens de session (refresh tokens)
        await queryRunner.manager.query(
            `DELETE FROM refresh_tokens WHERE "utilisateurId" = $1`,
            [id]
        );

        // ÉTAPE 4 : Supprimer le profil (données personnelles RGPD)
        await queryRunner.manager.query(
            `DELETE FROM profils_utilisateurs WHERE "utilisateurId" = $1`,
            [id]
        );

        // NOTE : Les audit_logs sont préservés pour traçabilité
        // utilisateurId reste dans les logs mais l'utilisateur est marqué INACTIF

        await queryRunner.commitTransaction();

        logger.info(`Utilisateur supprimé (soft delete): ${utilisateur.email} (${id})`);
    } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
    } finally {
        await queryRunner.release();
    }
}
```

---

## 📊 Impact de la Correction

### Avant ❌ (Hard Delete)

| Action | Résultat |
|--------|----------|
| `DELETE /api/utilisateurs/:id` | ❌ **Erreur 500** - Contrainte FK violée |
| Utilisateur avec audit_logs | ❌ **Impossible à supprimer** |
| Historique d'audit | ❌ Perdu si suppression réussie |

### Après ✅ (Soft Delete)

| Action | Résultat |
|--------|----------|
| `DELETE /api/utilisateurs/:id` | ✅ **Succès 200** - Soft delete |
| Utilisateur avec audit_logs | ✅ **Supprimable** (statut → INACTIF) |
| Historique d'audit | ✅ **Préservé** (utilisateurId toujours valide) |
| Affectations établissement | ✅ **Désactivées** (actif → false) |
| Tokens de session | ✅ **Invalidés** (supprimés) |
| Profil utilisateur | ✅ **Supprimé** (RGPD) |

---

## 🔍 Détails des Étapes

### Étape 1 : Désactiver les Affectations

```sql
UPDATE utilisateur_etablissements 
SET actif = false, dateFin = NOW() 
WHERE "utilisateurId" = $1 AND actif = true
```

**Pourquoi** : 
- L'utilisateur ne peut plus accéder à aucun établissement
- L'historique des affectations est préservé (soft delete)
- Le champ `dateFin` permet de tracer quand le retrait a eu lieu

### Étape 2 : Soft Delete via Statut

```typescript
utilisateur.statut = StatutUtilisateur.INACTIF;
await queryRunner.manager.save(utilisateur);
```

**Pourquoi** :
- L'utilisateur reste en base (pour les audit_logs)
- Le statut `INACTIF` empêche la connexion
- Les rapports et historiques restent cohérents

### Étape 3 : Invalider les Tokens

```sql
DELETE FROM refresh_tokens WHERE "utilisateurId" = $1
```

**Pourquoi** :
- Déconnexion forcée immédiate
- Empêche la reconnexion avec un token existant
- Sécurité renforcée

### Étape 4 : Supprimer le Profil

```sql
DELETE FROM profils_utilisateurs WHERE "utilisateurId" = $1
```

**Pourquoi** :
- Conformité RGPD (données personnelles)
- Les informations sensibles sont supprimées
- L'utilisateur existe toujours mais sans profil

### Étape 5 : Préserver les Audit Logs

```typescript
// NOTE : Les audit_logs sont préservés pour traçabilité
// utilisateurId reste dans les logs mais l'utilisateur est marqué INACTIF
```

**Pourquoi** :
- Traçabilité des actions passées
- Conformité légale (audit trail)
- La FK `audit_logs.utilisateurId` reste valide

---

## 🛡️ Vérifications de Sécurité

### Protection du Dernier SUPER_ADMIN

```typescript
if (utilisateur.role === Role.SUPER_ADMIN) {
    const superAdminCount = await queryRunner.manager.count(Utilisateur, {
        where: { role: Role.SUPER_ADMIN, statut: StatutUtilisateur.ACTIF }
    });
    
    if (superAdminCount <= 1) {
        throw new AppError(
            'Impossible de supprimer le dernier Super Admin',
            400,
            'LAST_SUPER_ADMIN'
        );
    }
}
```

**Pourquoi** :
- Empêche de se retrouver sans administrateur
- Protection contre les erreurs accidentelles
- Nécessite au moins 1 SUPER_ADMIN actif

### Transaction ACID

```typescript
const queryRunner = AppDataSource.createQueryRunner();
await queryRunner.connect();
await queryRunner.startTransaction();

try {
    // ... opérations ...
    await queryRunner.commitTransaction();
} catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
} finally {
    await queryRunner.release();
}
```

**Pourquoi** :
- Atomicité : toutes les opérations réussissent ou aucune
- Rollback automatique en cas d'erreur
- Intégrité des données garantie

---

## 🧪 Scénarios de Test

### Test 1 : Suppression d'un Utilisateur Standard

1. Créer un utilisateur avec rôle `ENSEIGNANT`
2. Assigner à un établissement
3. Effectuer des actions (créer une note, etc.) → génère des audit_logs
4. Supprimer l'utilisateur : `DELETE /api/utilisateurs/:id`
5. **Rés attendu** :
   - ✅ Retour 200 avec succès
   - ✅ `utilisateurs.statut` = `INACTIF`
   - ✅ `utilisateur_etablissements.actif` = `false`
   - ✅ `audit_logs` toujours présents
   - ✅ `profils_utilisateurs` supprimé
   - ✅ `refresh_tokens` supprimé

### Test 2 : Suppression du Dernier SUPER_ADMIN

1. Identifier le dernier SUPER_ADMIN actif
2. Tenter de le supprimer : `DELETE /api/utilisateurs/:id`
3. **Rés attendu** :
   - ❌ Erreur 400 avec code `LAST_SUPER_ADMIN`
   - ❌ Message : "Impossible de supprimer le dernier Super Admin"
   - ❌ Utilisateur toujours actif

### Test 3 : Tentative de Connexion après Suppression

1. Supprimer un utilisateur
2. Tenter de se connecter avec ses identifiants
3. **Rés attendu** :
   - ❌ Erreur 401 ou 403 (statut INACTIF)
   - ❌ Accès refusé

### Test 4 : Vérification de l'Historique d'Audit

1. Supprimer un utilisateur
2. Vérifier les logs d'audit : `SELECT * FROM audit_logs WHERE "utilisateurId" = :id`
3. **Rés attendu** :
   - ✅ Logs toujours présents
   - ✅ `utilisateurId` toujours valide (FK intacte)
   - ✅ Actions passées toujours traçables

---

## 📋 Requêtes SQL Utiles

### Vérifier le Statut d'un Utilisateur

```sql
SELECT id, email, role, statut, "createdAt", "updatedAt"
FROM utilisateurs
WHERE id = '087ac6e4-29a2-4376-92e7-ebcd6650f270';
```

### Vérifier les Affectations

```sql
SELECT ue.*, e.nom as etablissement_nom
FROM utilisateur_etablissements ue
LEFT JOIN etablissements e ON ue."etablissementId" = e.id
WHERE ue."utilisateurId" = '087ac6e4-29a2-4376-92e7-ebcd6650f270'
ORDER BY ue."createdAt" DESC;
```

### Vérifier les Logs d'Audit

```sql
SELECT al.*, u.email as utilisateur_email
FROM audit_logs al
LEFT JOIN utilisateurs u ON al."utilisateurId" = u.id
WHERE al."utilisateurId" = '087ac6e4-29a2-4376-92e7-ebcd6650f270'
ORDER BY al."createdAt" DESC
LIMIT 20;
```

### Compter les SUPER_ADMIN Actifs

```sql
SELECT COUNT(*) as nb_super_admins
FROM utilisateurs
WHERE role = 'SUPER_ADMIN' AND statut = 'ACTIF';
```

---

## 🔧 Alternatives Considérées

### Alternative 1 : Ajouter `onDelete: 'SET NULL'` sur audit_logs

```typescript
@ManyToOne(() => Utilisateur, { nullable: true, onDelete: 'SET NULL' })
@JoinColumn({ name: 'utilisateurId' })
utilisateur?: Utilisateur;
```

**Pourquoi pas choisi** :
- ❌ Perd la traçabilité (utilisateurId = NULL dans les logs)
- ❌ Nécessite une migration de base de données
- ❌ Ne résout pas les autres FK (notes, bulletins, etc.)

### Alternative 2 : Ajouter `onDelete: 'CASCADE'` sur audit_logs

```typescript
@ManyToOne(() => Utilisateur, { onDelete: 'CASCADE' })
@JoinColumn({ name: 'utilisateurId' })
utilisateur?: Utilisateur;
```

**Pourquoi pas choisi** :
- ❌ Supprime l'historique d'audit (illégal dans certains pays)
- ❌ Violation de conformité
- ❌ Perte de traçabilité

### Alternative 3 : Soft Delete avec `@DeleteDateColumn`

```typescript
@DeleteDateColumn()
supprimeLe?: Date;
```

**Pourquoi pas choisi** :
- ❌ Plus complexe à gérer dans les requêtes
- ❌ Nécessite de modifier tous les `find()` pour inclure `withDeleted`
- ❌ Moins explicite que le champ `statut`

**Notre choix** : Soft delete via `statut = INACTIF` est plus simple et explicite.

---

## ✅ Checklist de Validation

- [x] Méthode `remove()` modifiée pour soft delete
- [x] Transaction ACID implémentée
- [x] Désactivation des affectations établissement
- [x] Changement de statut à INACTIF
- [x] Invalidation des refresh tokens
- [x] Suppression du profil (RGPD)
- [x] Préservation des audit_logs
- [x] Protection du dernier SUPER_ADMIN
- [x] Logs appropriés ajoutés
- [x] Gestion d'erreurs avec rollback

---

## 📚 Fichiers Modifiés

| Fichier | Lignes Modifiées | Type |
|---------|------------------|------|
| `backend/src/modules/utilisateurs/services/utilisateurs.service.ts` | +67, -11 | Service |

**Total** : 1 fichier, ~56 lignes nettes modifiées

---

## 🚀 Prochaines Étapes (Optionnelles)

1. **Frontend** : Mettre à jour le message de confirmation de suppression
2. **Frontend** : Afficher un badge "Inactif" sur les utilisateurs supprimés
3. **API** : Ajouter un endpoint `POST /api/utilisateurs/:id/restaurer` pour annuler la suppression
4. **API** : Ajouter un filtre `statut=INACTIF` dans la liste des utilisateurs
5. **Documentation** : Mettre à jour la documentation API pour refléter le soft delete

---

**Conclusion** : L'erreur de contrainte FK est maintenant corrigée. La suppression d'un utilisateur utilise le soft delete, préserve l'historique d'audit, et garantit l'intégrité des données avec une transaction ACID.
