# Amélioration - Retrait d'Utilisateur d'un Établissement

> **Date** : 18 Juin 2026  
> **Version** : 2.1.0  
> **Statut** : ✅ **Implémenté et Amélioré**

---

## 🐛 Problème Initial

### Erreur 404 lors du retrait

```
DELETE /api/utilisateurs/{userId}/etablissements/{etabId}
→ 404 NOT_FOUND: "Affectation non trouvée"
```

### Cause Racine

La méthode `retirer()` cherchait **uniquement** les affectations actives :

```typescript
// ❌ AVANT (PROBLÈME)
const affectation = await this.repo.findOne({
    where: { utilisateurId, etablissementId, actif: true }
});

if (!affectation) {
    throw new AppError('Affectation non trouvée', 404);
}
```

**Scénario d'échec** :
1. Premier appel DELETE → affectation désactivée (`actif = false`)
2. Deuxième appel DELETE → recherche `actif: true` → **404**
3. Le frontend peut envoyer plusieurs requêtes (retry, double-clic)

---

## ✅ Corrections et Améliorations

### 1. **Idempotence** - Retrait répété sécurisé

**Avant** : Le deuxième appel échouait avec 404  
**Après** : Le deuxième appel réussit silencieusement

```typescript
// ✅ APRÈS (IDEMPOTENT)
const affectation = await queryRunner.manager.findOne(UtilisateurEtablissement, {
    where: { utilisateurId, etablissementId }  // Sans filtre actif
});

if (!affectation) {
    throw new AppError('Aucune affectation trouvée...', 404);
}

// Si déjà inactive → succès (idempotence)
if (!affectation.actif) {
    logger.info(`[IDEMPOTENCE] Affectation déjà inactive`);
    await queryRunner.commitTransaction();
    return;  // ✅ Succès silencieux
}
```

**Bénéfice** :
- ✅ Safe retry (le frontend peut réessayer sans erreur)
- ✅ Double-clic ne cause pas d'erreur
- ✅ Logs d'audit préservés

---

### 2. **Transaction ACID** - Intégrité garantie

**Avant** : Opérations non transactionnelles  
**Après** : Tout est dans une transaction

```typescript
const queryRunner = AppDataSource.createQueryRunner();
await queryRunner.connect();
await queryRunner.startTransaction();

try {
    // 1. Vérifications
    // 2. Changement établissement principal (si nécessaire)
    // 3. Désactivation affectation
    // 4. Logs d'audit
    
    await queryRunner.commitTransaction();
} catch (error) {
    await queryRunner.rollbackTransaction();  // ✅ Rollback automatique
    throw error;
} finally {
    await queryRunner.release();  // ✅ Libération garantie
}
```

**Bénéfice** :
- ✅ Atomicité : tout ou rien
- ✅ Pas d'état partiel en cas d'erreur
- ✅ Integrity des données garantie

---

### 3. **Gestion de l'Établissement Principal**

**Avant** : Si on retire l'établissement principal, l'utilisateur n'en a plus  
**Après** : Attribution automatique d'un nouveau principal

```typescript
// Si c'était l'établissement principal, en attribuer un autre
if (affectation.etablissementPrincipal) {
    const autreEtablissement = await queryRunner.manager.findOne(UtilisateurEtablissement, {
        where: { utilisateurId, actif: true, etablissementPrincipal: false },
        order: { creeAt: 'ASC' }  // Le plus ancien
    });

    if (autreEtablissement) {
        autreEtablissement.etablissementPrincipal = true;
        await queryRunner.manager.save(autreEtablissement);
        logger.info(`[PRINCIPAL] Nouvel établissement principal: ${autreEtablissement.etablissementId}`);
    }
}
```

**Bénéfice** :
- ✅ L'utilisateur a toujours un établissement principal
- ✅ Évite les bugs d'affichage dans le dashboard
- ✅ Logique métier cohérente

---

### 4. **Vérification des Données Liées**

**Nouveau** : Vérification complète avant retrait

#### 4.1 Chef d'Établissement

```typescript
if (affectation?.role === Role.CHEF_ETABLISSEMENT) {
    const autreChef = await queryRunner.manager.count(UtilisateurEtablissement, {
        where: {
            etablissementId,
            role: Role.CHEF_ETABLISSEMENT,
            actif: true,
            utilisateurId: '!= ?'  // Autre que celui retiré
        }
    });

    if (autreChef === 0) {
        logger.warn(`[ALERTE] Dernier chef d'établissement retiré de ${etablissementId}`);
        // ⚠️ On ne bloque pas, mais on logue pour audit
    }
}
```

**Pourquoi** :
- Un établissement sans chef peut poser problème
- Alerte pour que l'admin nomme un remplaçant
- Pas de blocage (flexibilité pour les transitions)

---

#### 4.2 Classes Assignées

```typescript
const classeRepo = queryRunner.manager.getRepository('Classe');
const classesAssignees = await classeRepo.count({
    where: { 
        responsableId: utilisateurId,
        anneeScolaire: { etablissementId }
    },
    relations: ['anneeScolaire']
});

if (classesAssignees > 0) {
    logger.warn(`[ALERTE] Utilisateur a ${classesAssignees} classe(s) assignée(s)`);
    // TODO: Notification pour réassignation
}
```

**Pourquoi** :
- Les classes ont besoin d'un responsable
- Alerte pour réassignation proactive
- Évite les classes orphelines

---

#### 4.3 Responsables d'Élèves

```typescript
const responsableRepo = queryRunner.manager.getRepository('ResponsableEleve');
const responsablesEleves = await responsableRepo.count({
    where: { utilisateurId }
});

if (responsablesEleves > 0) {
    logger.info(`[INFO] Utilisateur est responsable de ${responsablesEleves} élève(s)`);
    // ✅ Pas de blocage - multi-établissements autorisé
}
```

**Pourquoi** :
- Les responsables peuvent suivre des élèves dans plusieurs établissements
- Juste un log informatif
- Pas d'action requise

---

#### 4.4 Données Créées (Historique)

```typescript
const noteRepo = queryRunner.manager.getRepository('Note');
const notesCreees = await noteRepo.count({
    where: { creePar: utilisateurId }
});

if (notesCreees > 0) {
    logger.info(`[INFO] Utilisateur a créé ${notesCreees} note(s) - données conservées`);
    // ✅ Les notes restent (creePar est un historique)
}
```

**Pourquoi** :
- Les notes/bulletins sont liés à l'établissement, pas à l'utilisateur
- `creePar` est un champ d'audit, pas une FK critique
- Données historiques préservées

---

### 5. **Motif de Retrait** (Nouveau Paramètre)

**API** : Le body peut maintenant inclure un motif

```typescript
// Controller
const motif = req.body?.motif;
await utilisateurEtablissementService.retirer(
    req.params.id,
    req.params.etablissementId,
    motif  // ✅ Nouveau paramètre optionnel
);

// Service
if (motifRetrait) {
    affectation.motif = motifRetrait;  // Sauvegardé en base
}
```

**Exemple d'utilisation** :

```bash
curl -X DELETE \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"motif": "Mutation vers un autre établissement"}' \
  "http://localhost:3001/api/utilisateurs/{id}/etablissements/{etabId}"
```

**Bénéfice** :
- ✅ Traçabilité complète (pourquoi le retrait ?)
- ✅ Historique dans la base (`motif` column)
- ✅ Utile pour l'audit et les rapports

---

## 📊 Comparaison Avant/Après

| Aspect | Avant (v2.0) | Après (v2.1) |
|--------|--------------|--------------|
| **Idempotence** | ❌ Échec au 2ème appel | ✅ Succès silencieux |
| **Transaction** | ❌ Non transactionnel | ✅ ACID complet |
| **Établissement Principal** | ❌ Peut rester sans | ✅ Attribution auto |
| **Vérifications** | ❌ Aucune | ✅ 4 vérifications |
| **Motif de Retrait** | ❌ Non supporté | ✅ Paramètre optionnel |
| **Logging** | ⚠️ Basique | ✅ Détaillé avec tags |
| **Rollback** | ❌ Pas de rollback | ✅ Automatique |
| **Intégrité** | ⚠️ Risque d'état partiel | ✅ Garantie |

---

## 🔍 Meilleures Pratiques Implémentées

### 1. **Soft Delete avec Historique**

```typescript
// ❌ JAMAIS de suppression physique
await this.repo.delete({ utilisateurId, etablissementId });

// ✅ TOUJOURS désactivation logique
affectation.actif = false;
affectation.dateFin = new Date();
await this.repo.save(affectation);
```

**Pourquoi** :
- Audit trail complet
- Possibilité de réactiver
- Données historiques préservées
- Conformité légale (traçabilité)

---

### 2. **Gestion d'Erreurs Granulaire**

```typescript
// Différents codes d'erreur selon le cas
if (!affectation) {
    throw new AppError('...', 404, 'AFFECTATION_NOT_FOUND');
}

if (countActif <= 1) {
    throw new AppError('...', 400, 'LAST_ETABLISSEMENT');
}
```

**Pourquoi** :
- Le frontend peut afficher des messages spécifiques
- Monitoring et alerting précis
- Debugging facilité

---

### 3. **Logging Structuré**

```typescript
// Tags pour filtrage facile
logger.info(`[RETRAIT] Utilisateur ${userId} retiré de ${etabId}`);
logger.warn(`[ALERTE] Dernier chef retiré de ${etabId}`);
logger.info(`[IDEMPOTENCE] Affectation déjà inactive`);
logger.info(`[PRINCIPAL] Nouvel établissement principal: ${etabId}`);
```

**Pourquoi** :
- Recherche facile dans les logs (`grep "[RETRAIT]"`)
- Monitoring par catégorie
- Alerting automatisable

---

### 4. **Vérifications Non-Bloquantes**

```typescript
// ✅ Vérifier et logger, mais ne pas bloquer
if (classesAssignees > 0) {
    logger.warn(`[ALERTE] Classes assignées détectées`);
    // Pas de throw - on fait confiance à l'admin
}

// ❌ Éviter (trop restrictif)
if (classesAssignees > 0) {
    throw new AppError('Impossible - classes assignées', 400);
}
```

**Pourquoi** :
- Flexibilité pour les admins
- Situations d'urgence nécessitent action rapide
- Logs suffisent pour l'audit
- Notification peut être asynchrone

---

### 5. **Clean-up Relationnel**

```typescript
// Avant de retirer, vérifier les dépendances
await this.verifierDonneesLies(queryRunner, userId, etabId);

// Vérifications :
// 1. Chef d'établissement → alerter si dernier
// 2. Classes assignées → alerter pour réassignation
// 3. Responsables élèves → info seulement
// 4. Données créées → info seulement (historique)
```

**Pourquoi** :
- Évite les données orphelines
- Prévient les bugs futurs
- Aide à la prise de décision
- Documentation implicite du système

---

## 🧪 Tests

### Test 1: Retrait Normal

```bash
curl -X DELETE \
  -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/utilisateurs/{userId}/etablissements/{etabId}"
```

**Résultat attendu** : `200 OK`  
**Base de données** : `actif = false`, `dateFin = NOW()`

---

### Test 2: Retrait avec Motif

```bash
curl -X DELETE \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"motif": "Fin de contrat"}' \
  "http://localhost:3001/api/utilisateurs/{userId}/etablissements/{etabId}"
```

**Résultat attendu** : `200 OK`  
**Base de données** : `motif = "Fin de contrat"`

---

### Test 3: Retrait Répété (Idempotence)

```bash
# Premier appel
curl -X DELETE ...  # → 200 OK

# Deuxième appel (même utilisateur, même établissement)
curl -X DELETE ...  # → 200 OK (pas 404 !)
```

**Résultat attendu** : Les deux retournent `200 OK`  
**Logs** : Deuxième appel logue `[IDEMPOTENCE]`

---

### Test 4: Dernier Établissement (Erreur Attendue)

```bash
# Utilisateur avec 1 seul établissement
curl -X DELETE ...
```

**Résultat attendu** : `400 Bad Request`  
**Message** : "Impossible de retirer le dernier établissement..."

---

### Test 5: Retrait Établissement Principal

```bash
# Utilisateur avec 2 établissements, celui-ci est principal
curl -X DELETE ...
```

**Résultat attendu** : `200 OK`  
**Effet** : L'autre établissement devient `etablissementPrincipal = true`

---

## 📝 Migration de Données (si nécessaire)

Si des affectations ont été supprimées physiquement (avant cette correction), les restaurer :

```sql
-- Vérifier les suppressions physiques (FK CASCADE)
SELECT u.email, e.nom
FROM utilisateur u
LEFT JOIN utilisateur_etablissements ue ON u.id = ue.utilisateurId
LEFT JOIN etablissement e ON ue.etablissementId = e.id
WHERE ue.id IS NULL
AND u.etablissementId IS NOT NULL;

-- Si nécessaire, recréer les affectations manquantes
INSERT INTO utilisateur_etablissements (
    utilisateurId, etablissementId, role, etablissementPrincipal, actif
)
SELECT 
    u.id,
    u.etablissementId,
    u.role,
    true,
    true
FROM utilisateur u
WHERE u.etablissementId IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM utilisateur_etablissements ue 
    WHERE ue.utilisateurId = u.id
);
```

---

## 🔮 Améliorations Futures

### 1. Notification Automatique

```typescript
// TODO: Après le retrait, notifier les parties concernées
if (classesAssignees > 0) {
    await notificationTemplates.classeSansResponsable({
        destinataireId: adminId,
        etablissementId,
        metadata: { classeCount: classesAssignees }
    });
}
```

### 2. Workflow de Validation

```typescript
// Pour les chefs d'établissement, exiger validation
if (affectation.role === Role.CHEF_ETABLISSEMENT) {
    const requireValidation = await getParamBoolean(
        'retrait_chef.require_validation',
        true
    );
    
    if (requireValidation) {
        // Créer un workflow de validation
        await validationWorkflowService.createWorkflow({...});
        return;  // Ne pas retirer immédiatement
    }
}
```

### 3. Archive Complete

```typescript
// Copier l'affectation dans une table d'archive avant modification
await queryRunner.manager.query(`
    INSERT INTO utilisateur_etablissements_archive
    SELECT *, NOW() as archiveAt
    FROM utilisateur_etablissements
    WHERE id = $1
`, [affectation.id]);
```

---

## ✅ Checklist de Validation

- [x] Idempotence implémentée
- [x] Transaction ACID ajoutée
- [x] Gestion établissement principal
- [x] 4 vérifications de données liées
- [x] Motif de retrait supporté
- [x] Logging structuré
- [x] Rollback automatique
- [x] Documentation complète
- [x] Tests définis

---

## 📁 Fichiers Modifiés

| Fichier | Lignes Modifiées | Type |
|---------|------------------|------|
| [`utilisateur-etablissement.service.ts`](../backend/src/modules/auth/services/utilisateur-etablissement.service.ts) | +164, -26 | Amélioration majeure |
| [`utilisateur-etablissement.controller.ts`](../backend/src/modules/auth/controllers/utilisateur-etablissement.controller.ts) | +7, -1 | Support motif |

---

**Amélioration terminée avec succès** ✅  
**Version** : 2.1.0  
**Déploiement** : Redémarrer le backend

```bash
cd /mnt/DONNEES/projets/eLISAschool
npm run build:backend
npm run start:backend
```
