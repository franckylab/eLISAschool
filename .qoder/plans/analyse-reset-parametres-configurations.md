# Analyse du Système de Réinitialisation des Paramètres et Configurations - eLISAschool

## Contexte

L'utilisateur demande de vérifier si tous les paramètres, configurations, constantes, règles et autres éléments du système eLISAschool sont correctement persistés en base de données et s'il existe un mécanisme de réinitialisation vers les valeurs par défaut.

## Analyse Complète

### ✅ ÉLÉMENTS BIEN IMPLÉMENTÉS

#### 1. **Persistance des Paramètres en Base de Données**

**Entité `ParametreSysteme`** ([parametre-systeme.entity.ts](file:///home/franckylab/projets/eLISAschool/backend/src/modules/configuration/entities/parametre-systeme.entity.ts))

✅ **Tous les paramètres système sont persistés** avec les caractéristiques suivantes :
- Champ `valeur` : valeur actuelle du paramètre (stockée en JSON)
- Champ `valeurDefaut` : **valeur par défaut sauvegardée** pour restauration
- Support multi-tenant : `etablissementId` (NULL = global, UUID = override par établissement)
- Types de valeurs typés : STRING, NUMBER, BOOLEAN, JSON, ARRAY
- Catégories : SECURITE, MODULE, NOTIFICATION, SYSTEME, REGIONAL, etc.

**Seed Initial** ([configuration-seed.service.ts](file:///home/franckylab/projets/eLISAschool/backend/src/modules/configuration/services/configuration-seed.service.ts#L175-L378))

✅ **~100+ paramètres par défaut** sont définis dans le seed, couvrant :
- Sécurité (auth.session_duration, auth.max_login_attempts, etc.)
- Notifications (notifications.enable_push, etc.)
- Modules métier (notes.bareme_defaut, cantine.menu_planning_days, etc.)
- Workflows de validation (requêtes, classes, matières, périodes, etc.)
- Gamification et scoring
- Paramètres régionaux (devise, timezone, langue)
- État des modules (`{module}.actif` pour chaque module du registre)

#### 2. **Mécanisme de Réinitialisation Individuelle**

**Service** ([configuration.service.ts](file:///home/franckylab/projets/eLISAschool/backend/src/modules/configuration/services/configuration.service.ts#L836-L907))

✅ **Fonction `resetParametre()`** implémentée :
- Si `etablissementId` fourni : supprime l'override (retour au global)
- Sinon : réinitialise `valeur` vers `valeurDefaut`
- Vérifie que `valeurDefaut` existe avant réinitialisation
- Loggue l'action dans l'historique
- Invalide le cache

**Endpoint API** ([configuration.controller.ts](file:///home/franckylab/projets/eLISAschool/backend/src/modules/configuration/controllers/configuration.controller.ts#L446-L464))

✅ `POST /api/configuration/parametres/:cle/reset`
- Protégé par auth + permission `canResetParams`
- Restaure la valeur par défaut depuis `valeurDefaut`
- Historique complet avec ancienne/nouvelle valeur

#### 3. **Système de Backup et Restauration**

**Backup Configuration** ([config-backup.service.ts](file:///home/franckylab/projets/eLISAschool/backend/src/modules/configuration/services/backup/config-backup.service.ts))

✅ **Deux types de backup** :
- Backup complet : snapshot de tous les paramètres
- Backup différentiel : uniquement les changements
- Chiffrement AES-256-GCM
- Checksum SHA-256 pour intégrité
- Compression gzip

**Historique** ([configuration-history.service.ts](file:///home/franckylab/projets/eLISAschool/backend/src/modules/configuration/services/configuration-history.service.ts))

✅ **Traçabilité complète** :
- Toutes les modifications sont loguées (`CREATE`, `UPDATE`, `DELETE`, `RESET`)
- Points de sauvegarde manuels (`creerSauvegarde()`)
- Restauration depuis n'importe quel point dans le temps (`restaurer()`)
- Restauration individuelle par paramètre (`restaurerParametre()`)

**Endpoints** :
- `GET /api/configuration/historique` - Voir l'historique
- `POST /api/configuration/historique/:id/restore` - Restaurer un état
- `GET /api/configuration/sauvegardes` - Lister les sauvegardes
- `POST /api/configuration/sauvegardes` - Créer une sauvegarde
- `POST /api/configuration/sauvegardes/:id/restore` - Restaurer une sauvegarde

#### 4. **Registre des Modules**

**MODULE_REGISTRY** ([config.registry.ts](file:///home/franckylab/projets/eLISAschool/shared/src/config/config.registry.ts))

✅ **Configuration par défaut de chaque module** :
- `defaultActive` : état d'activation par défaut
- `defaultSettings` : paramètres par défaut du module
- Dépendances entre modules
- Rôles et permissions par défaut

**Synchronisation** :
- Le seed utilise `MODULE_REGISTRY` pour initialiser les configurations
- `ConfigurationModule` stocke `parametres` et `actif` en DB
- Fallback en cascade : EtablissementConfig → ConfigurationApp → ConfigurationModule → MODULE_REGISTRY

#### 5. **Configuration Application et Modules**

**ConfigurationApp** ([configuration-app.entity.ts](file:///home/franckylab/projets/eLISAschool/backend/src/modules/configuration/entities/configuration-app.entity.ts))
- ⚠️ **Dépréciée** (marquée pour suppression en v3.0)
- Contient : nom établissement, langue, devise, couleurs, modulesActifs
- **PAS de champ `valeurDefaut`** pour restauration

**ConfigurationModule** ([configuration-module.entity.ts](file:///home/franckylab/projets/eLISAschool/backend/src/modules/configuration/entities/configuration-module.entity.ts))
- Champs personnalisés, widgets, paramètres spécifiques
- Champ `actif` pour état du module
- **PAS de champ `valeurDefaut`** pour restauration

#### 6. **Seed RBAC (Rôles et Permissions)**

**RBAC Seed** ([rbac.seed.ts](file:///home/franckylab/projets/eLISAschool/backend/src/database/seeds/rbac.seed.ts))

✅ **Système complet** :
- Rôles prédéfinis (SUPER_ADMIN, ADMIN, ENSEIGNANT, etc.)
- Permissions définies dans `DEFAULT_ROLE_PERMISSIONS`
- Mapping rôle → permissions persisté en DB
- Protection des rôles système

### ❌ LACUNES IDENTIFIÉES

#### 1. **PAS de Réinitialisation Globale**

❌ **Aucune fonction `resetAllParametres()`** n'existe
- Pas d'endpoint pour réinitialiser TOUS les paramètres d'un coup
- Pas de fonction pour restaurer la configuration initiale complète
- L'utilisateur doit réinitialiser paramètre par paramètre

#### 2. **ConfigurationApp et ConfigurationModule Sans Valeurs Par Défaut Explicites**

❌ **Pas de champ `valeurDefaut`** pour :
- `ConfigurationApp.modulesActifs`
- `ConfigurationApp.couleurPrimaire`, `couleurSecondaire`, etc.
- `ConfigurationModule.parametres`
- `ConfigurationModule.champsPersonnalises`
- `ConfigurationModule.widgets`

⚠️ **Conséquence** : Impossible de restaurer ces configurations vers leurs valeurs initiales après modification

#### 3. **Pas de Réinitialisation des Overrides Multi-Tenant**

❌ **Pas de fonction `resetAllOverrides(etablissementId)`**
- Si un établissement a modifié 50 paramètres, pas de moyen de tous les réinitialiser d'un coup
- L'admin doit supprimer chaque override individuellement

#### 4. **Constantes et Règles Métier Non Persistées**

❌ **Certaines constantes ne sont pas en DB** :
- Seuils de gamification (points_felicitations, etc.) → ✅ Persistés dans ParametreSysteme
- Règles de calcul de bulletins → ⚠️ Partiellement dans ParametreSysteme
- Pondérations scoring personnel → ✅ Persistés
- **Mais** : certaines règles métier sont en dur dans le code (ex: formules de calcul)

#### 5. **Pas de Migration de Réinitialisation**

❌ **Pas de migration SQL** pour :
- Réinitialiser tous les paramètres en cas de corruption
- Recréer les valeurs par défaut manquantes
- Synchroniser MODULE_REGISTRY avec ParametreSysteme

#### 6. **Endpoint `/seed` Dangereux**

⚠️ `POST /api/configuration/seed` (ligne 532-537 du controller)
- Exécute `runAllSeeds()` qui **ne fait rien si les données existent déjà**
- Le seed vérifie `if (existing) continue;` pour chaque paramètre
- **Ne FORCE PAS la réinitialisation** vers les valeurs par défaut
- Peut donner l'impression fausse de "reset" alors que ça ne fait rien

## Recommandations d'Amélioration

### 1. **Implémenter `resetAllParametres()`**

```typescript
// Dans configuration.service.ts
async resetAllParametres(
    etablissementId?: string,
    utilisateurId?: string,
    req?: Request
): Promise<{ resetCount: number; skippedCount: number }> {
    if (etablissementId) {
        // Supprimer TOUS les overrides de cet établissement
        const overrides = await this.parametreRepository.find({
            where: { etablissementId }
        });
        await this.parametreRepository.remove(overrides);
        return { resetCount: overrides.length, skippedCount: 0 };
    } else {
        // Réinitialiser TOUS les paramètres globaux vers valeurDefaut
        const parametres = await this.parametreRepository.find({
            where: { etablissementId: IsNull() }
        });
        let resetCount = 0;
        for (const param of parametres) {
            if (param.valeurDefaut && param.valeur !== param.valeurDefaut) {
                param.valeur = param.valeurDefaut;
                await this.parametreRepository.save(param);
                resetCount++;
            }
        }
        return { resetCount, skippedCount: parametres.length - resetCount };
    }
}
```

### 2. **Ajouter un Endpoint `POST /parametres/reset-all`**

```typescript
// Dans configuration.controller.ts
router.post('/parametres/reset-all', authMiddleware, requireRoles(Role.SUPER_ADMIN), async (req, res) => {
    const { etablissementId } = req.body; // Optionnel
    const result = await configurationService.resetAllParametres(
        etablissementId,
        req.utilisateur?.id,
        req
    );
    res.json({ 
        success: true, 
        data: result,
        message: `${result.resetCount} paramètres réinitialisés` 
    });
});
```

### 3. **Ajouter `valeurDefaut` pour ConfigurationApp et ConfigurationModule**

```typescript
// Dans les entités
@Column({ type: 'simple-json', nullable: true })
valeurDefaut?: Record<string, any>;

// Dans le seed
const config = this.configAppRepo.create({
    // ... valeurs actuelles
    valeurDefaut: JSON.stringify({
        modulesActifs: this.getDefaultActiveModules(),
        couleurPrimaire: '#28a745',
        // ... etc
    })
});
```

### 4. **Créer une Migration de Réinitialisation**

```sql
-- 040-reset-default-parameters.sql
-- Réinitialise tous les paramètres vers leur valeurDefaut
UPDATE parametres_systeme 
SET valeur = valeurDefaut 
WHERE valeurDefaut IS NOT NULL 
  AND valeur != valeurDefaut
  AND etablissement_id IS NULL;

-- Supprime tous les overrides (optionnel)
DELETE FROM parametres_systeme 
WHERE etablissement_id IS NOT NULL;
```

### 5. **Forcer le Reseed avec un Flag**

```typescript
// Dans configuration-seed.service.ts
async runAllSeeds(force: boolean = false): Promise<...> {
    for (const param of defaults) {
        const existing = await this.parametreRepo.findOne({ where: { cle: param.cle } });
        
        if (existing && force) {
            // FORCER la réinitialisation
            existing.valeur = existing.valeurDefaut;
            await this.parametreRepo.save(existing);
        } else if (!existing) {
            // Créer normalement
        }
    }
}
```

### 6. **Endpoint de Reseed Forcé**

```typescript
router.post('/seed/force', authMiddleware, requireRoles(Role.SUPER_ADMIN), async (req, res) => {
    const result = await seedService.runAllSeeds(true); // force = true
    res.json({ 
        success: true, 
        data: result, 
        message: 'Seeds forcés - toutes les valeurs par défaut restaurées' 
    });
});
```

## Conclusion

### ✅ Points Forts du Système Actuel

1. **Excellente architecture** de persistance avec `ParametreSysteme`
2. **Valeurs par défaut bien définies** dans le seed (~100+ paramètres)
3. **Mécanisme de réinitialisation individuelle** fonctionnel
4. **Système de backup et historique** complet et robuste
5. **Multi-tenant bien implémenté** avec fallback en cascade
6. **Cache performant** avec invalidation appropriée

### ❌ Points Faibles Critiques

1. **PAS de réinitialisation globale** (tous les paramètres d'un coup)
2. **ConfigurationApp et ConfigurationModule** sans valeurs par défaut persistées
3. **Endpoint `/seed`** ne fait rien si les données existent déjà (pas de force reset)
4. **Pas de migration de récupération** en cas de corruption

### 🎯 Priorités d'Amélioration

1. **HAUTE** : Implémenter `resetAllParametres()` + endpoint associé
2. **HAUTE** : Ajouter flag `force` au endpoint `/seed`
3. **MOYENNE** : Persister `valeurDefaut` pour ConfigurationApp/Module
4. **MOYENNE** : Créer migration de réinitialisation
5. **FAIBLE** : Documentation de la procédure de recovery

## Fichiers Clés à Modifier

1. `/backend/src/modules/configuration/services/configuration.service.ts` - Ajouter `resetAllParametres()`
2. `/backend/src/modules/configuration/controllers/configuration.controller.ts` - Ajouter endpoint `/parametres/reset-all`
3. `/backend/src/modules/configuration/services/configuration-seed.service.ts` - Ajouter support `force`
4. `/backend/src/modules/configuration/entities/configuration-app.entity.ts` - Ajouter `valeurDefaut`
5. `/backend/src/modules/configuration/entities/configuration-module.entity.ts` - Ajouter `valeurDefaut`
6. `/backend/database/migrations/040-reset-default-parameters.sql` - Migration de recovery

## Comment Tester les Modifications

1. **Tester la réinitialisation individuelle** :
   ```bash
   curl -X POST http://localhost:3000/api/configuration/parametres/auth.session_duration/reset \
     -H "Authorization: Bearer <TOKEN>"
   ```

2. **Tester la réinitialisation globale** (après implémentation) :
   ```bash
   curl -X POST http://localhost:3000/api/configuration/parametres/reset-all \
     -H "Authorization: Bearer <TOKEN>" \
     -H "Content-Type: application/json" \
     -d '{"etablissementId": null}'
   ```

3. **Tester le seed forcé** (après implémentation) :
   ```bash
   curl -X POST http://localhost:3000/api/configuration/seed/force \
     -H "Authorization: Bearer <TOKEN>"
   ```

4. **Vérifier en base** :
   ```sql
   SELECT cle, valeur, valeurDefaut, 
          CASE WHEN valeur = valeurDefaut THEN 'OK' ELSE 'MODIFIÉ' END as statut
   FROM parametres_systeme
   WHERE etablissement_id IS NULL
   ORDER BY cle;
   ```
