# Plan: Système d'Activation/Désactivation des Modules

## Contexte

Le système actuel d'activation des modules dans eLISAschool présente 4 lacunes critiques:
1. **Pas de protection** - Les modules désactivés restent accessibles via leurs endpoints
2. **Stockage incohérent** - 3 systèmes coexistent (`ConfigurationApp` déprécié, `EtablissementConfig`, `ConfigurationModule`)
3. **Pas de vérification des dépendances** - On peut activer `bulletins` sans `notes`
4. **Pas de paramètres système** - Impossible d'utiliser `getParamBoolean()` pour vérifier l'état

Ce plan implémente un système robuste, multi-tenant et sécurisé.

---

## Tâche 1: Ajouter module `finances` au registre

**Fichiers:**
- `shared/src/enums/modules.enum.ts` - Ajouter `FINANCES = 'finances'`
- `shared/src/config/config.registry.ts` - Ajouter config finances

**Code:**
```typescript
// modules.enum.ts
FINANCES = 'finances',

// MODULE_CATEGORIES
[ModuleName.FINANCES]: ModuleCategory.LOGISTIQUES,

// config.registry.ts
[ModuleName.FINANCES]: {
    name: ModuleName.FINANCES,
    label: 'Finances',
    description: 'Gestion financière et paiements',
    icon: 'CreditCard',
    basePath: '/finances',
    defaultActive: false,
    premium: true,
    defaultRoles: [Role.SUPER_ADMIN, Role.ADMIN, Role.CHEF_ETABLISSEMENT],
    permissions: [Permission.FINANCES_VIEW, Permission.FINANCES_MANAGE],
    dependencies: [ModuleName.AUTH],
    defaultSettings: {
        defaultCurrency: 'XOF',
        enableOnlinePayment: false,
    },
},
```

---

## Tâche 2: Modifier `isModuleActive()` - Support multi-tenant

**Fichier:** `backend/src/modules/configuration/services/configuration.service.ts`

**Méthode actuelle (ligne 254):**
```typescript
async isModuleActive(moduleNom: string): Promise<boolean> {
    const config = await this.getConfigApp();
    return config.modulesActifs[moduleNom] ?? false;
}
```

**Nouvelle méthode:**
```typescript
async isModuleActive(moduleNom: string, etablissementId?: string): Promise<boolean> {
    // 1. Priorité: EtablissementConfig (multi-tenant)
    if (etablissementId) {
        try {
            const configRepo = AppDataSource.getRepository('EtablissementConfig');
            const config = await configRepo.findOne({ where: { etablissementId } });
            if (config?.modulesActifs && moduleNom in config.modulesActifs) {
                return config.modulesActifs[moduleNom];
            }
        } catch (error) {
            logger.warn(`Erreur lecture EtablissementConfig: ${error}`);
        }
    }

    // 2. Fallback: ConfigurationApp (legacy)
    try {
        const appConfig = await this.getConfigApp();
        if (appConfig.modulesActifs && moduleNom in appConfig.modulesActifs) {
            return appConfig.modulesActifs[moduleNom];
        }
    } catch (error) {
        logger.warn(`Erreur lecture ConfigurationApp: ${error}`);
    }

    // 3. Fallback: ConfigurationModule.actif
    try {
        const moduleConfig = await this.configModuleRepository.findOne({
            where: { moduleNom, etablissementId: etablissementId || undefined }
        });
        if (moduleConfig) {
            return moduleConfig.actif;
        }
    } catch (error) {
        logger.warn(`Erreur lecture ConfigurationModule: ${error}`);
    }

    // 4. Fallback: MODULE_REGISTRY defaultActive
    const registryConfig = MODULE_REGISTRY[moduleNom as ModuleName];
    return registryConfig?.defaultActive ?? false;
}
```

---

## Tâche 3: Modifier `toggleModule()` - Écriture multi-tenant

**Fichier:** `backend/src/modules/configuration/services/configuration.service.ts`

**Signature actuelle (ligne 223):**
```typescript
async toggleModule(moduleNom: string, actif: boolean, utilisateurId?: string, req?: Request): Promise<ConfigurationApp>
```

**Nouvelle signature:**
```typescript
async toggleModule(
    moduleNom: string,
    actif: boolean,
    etablissementId?: string,
    utilisateurId?: string,
    req?: Request
): Promise<{ success: boolean; message: string; modulesAutoActive?: string[] }> {
    const modulesAutoActivés: string[] = [];

    // 1. Vérifier les dépendances
    const verification = await this.verifierDependances(moduleNom, actif, etablissementId);
    if (!verification.valide) {
        throw new AppError(
            `Impossible d'activer le module: ${verification.erreurs.join(', ')}`,
            400,
            'DEPENDENCIES_NOT_MET'
        );
    }
    modulesAutoActivés.push(...verification.modulesAutoActivés);

    // 2. Récupérer l'ancien état
    const ancienEtat = await this.isModuleActive(moduleNom, etablissementId);

    // 3. Écrire dans EtablissementConfig (priorité) ou ConfigurationApp (fallback)
    if (etablissementId) {
        await this.toggleModuleEtablissement(moduleNom, actif, etablissementId);
    } else {
        await this.toggleModuleApp(moduleNom, actif);
    }

    // 4. Synchroniser ConfigurationModule.actif
    await this.syncConfigurationModule(moduleNom, actif, etablissementId);

    // 5. Historique
    await this.historyService.logAction({
        utilisateurId,
        action: ActionConfiguration.UPDATE,
        cible: CibleConfiguration.MODULE,
        cibleNom: moduleNom,
        description: `Module ${moduleNom} ${actif ? 'activé' : 'désactivé'}`,
        ancienneValeur: { actif: ancienEtat },
        nouvelleValeur: { actif },
        req,
    });

    // 6. Invalider cache
    this.invalidateCache('app');
    this.invalidateCache('modules');

    // 7. Événement
    this.emitChange(
        ActionConfiguration.UPDATE,
        CibleConfiguration.MODULE,
        undefined,
        moduleNom,
        { actif: ancienEtat },
        { actif },
        utilisateurId
    );

    logger.info(`Module ${moduleNom} ${actif ? 'activé' : 'désactivé'}${etablissementId ? ` (établissement: ${etablissementId})` : ''}`);

    return {
        success: true,
        message: `Module ${moduleNom} ${actif ? 'activé' : 'désactivé'}`,
        modulesAutoActive: modulesAutoActivés.length > 0 ? modulesAutoActivés : undefined,
    };
}
```

**Nouvelles méthodes privées à ajouter:**

```typescript
private async toggleModuleEtablissement(moduleNom: string, actif: boolean, etablissementId: string): Promise<void> {
    const configRepo = AppDataSource.getRepository('EtablissementConfig');
    let config = await configRepo.findOne({ where: { etablissementId } });
    
    if (!config) {
        config = configRepo.create({ etablissementId, modulesActifs: {} });
    }

    if (!config.modulesActifs) {
        config.modulesActifs = {};
    }

    config.modulesActifs[moduleNom] = actif;
    await configRepo.save(config);
}

private async toggleModuleApp(moduleNom: string, actif: boolean): Promise<void> {
    const config = await this.getConfigApp();
    config.modulesActifs[moduleNom] = actif;
    await this.configAppRepository.save(config);
}

private async syncConfigurationModule(moduleNom: string, actif: boolean, etablissementId?: string): Promise<void> {
    let config = await this.configModuleRepository.findOne({
        where: { moduleNom, etablissementId: etablissementId || undefined }
    });

    if (!config) {
        const registryConfig = MODULE_REGISTRY[moduleNom as ModuleName];
        config = this.configModuleRepository.create({
            moduleNom,
            etablissementId,
            actif,
            parametres: registryConfig?.defaultSettings || {},
        });
    } else {
        config.actif = actif;
    }

    await this.configModuleRepository.save(config);
}
```

---

## Tâche 4: Vérification des dépendances

**Fichier:** `backend/src/modules/configuration/services/configuration.service.ts`

**Nouvelles méthodes:**

```typescript
private async verifierDependances(
    moduleNom: string,
    actif: boolean,
    etablissementId?: string
): Promise<{ valide: boolean; erreurs: string[]; modulesAutoActivés: string[] }> {
    const registryConfig = MODULE_REGISTRY[moduleNom as ModuleName];
    if (!registryConfig || !registryConfig.dependencies || registryConfig.dependencies.length === 0) {
        return { valide: true, erreurs: [], modulesAutoActivés: [] };
    }

    const erreurs: string[] = [];
    const modulesAutoActivés: string[] = [];

    if (actif) {
        // Activation: vérifier que toutes les dépendances sont actives
        for (const dep of registryConfig.dependencies) {
            const estActive = await this.isModuleActive(dep, etablissementId);
            if (!estActive) {
                // Auto-activation de la dépendance
                try {
                    if (etablissementId) {
                        await this.toggleModuleEtablissement(dep, true, etablissementId);
                    } else {
                        await this.toggleModuleApp(dep, true);
                    }
                    await this.syncConfigurationModule(dep, true, etablissementId);
                    modulesAutoActivés.push(dep);
                } catch (error) {
                    const depConfig = MODULE_REGISTRY[dep];
                    erreurs.push(`Dépendance requise: ${depConfig?.label || dep} (auto-activation échouée)`);
                }
            }
        }
    } else {
        // Désactivation: vérifier les reverse dependencies
        const reverseDeps = this.getReverseDependencies(moduleNom);
        const reverseDepsActives: string[] = [];

        for (const revDep of reverseDeps) {
            const estActive = await this.isModuleActive(revDep, etablissementId);
            if (estActive) {
                const revConfig = MODULE_REGISTRY[revDep];
                reverseDepsActives.push(revConfig?.label || revDep);
            }
        }

        if (reverseDepsActives.length > 0) {
            erreurs.push(
                `Modules dépendants actifs: ${reverseDepsActives.join(', ')}. Désactivez-les d'abord ou utilisez force: true`
            );
        }
    }

    return {
        valide: erreurs.length === 0,
        erreurs,
        modulesAutoActivés,
    };
}

getReverseDependencies(moduleNom: string): ModuleName[] {
    const reverseDeps: ModuleName[] = [];
    
    for (const [name, config] of Object.entries(MODULE_REGISTRY)) {
        if (config.dependencies && config.dependencies.includes(moduleNom as ModuleName)) {
            reverseDeps.push(name as ModuleName);
        }
    }

    return reverseDeps;
}
```

---

## Tâche 5: Middleware `requireModuleActive()`

**Nouveau fichier:** `backend/src/modules/configuration/middlewares/module-active.middleware.ts`

```typescript
/**
 * ==================================
 * eLISAschool - Middleware Module Actif
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Middleware de vérification qu'un module est activé avant d'accéder à ses endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '@common/filters/error.filter';
import { configurationService } from '../services/configuration.service';
import { auditService } from '@modules/auth';

// Modules critiques toujours accessibles
const MODULES_CRITIQUES = ['auth', 'utilisateurs', 'configuration', 'notifications'];

/**
 * Middleware qui vérifie si un module est activé
 * @param moduleNom Nom du module à vérifier
 */
export function requireModuleActive(moduleNom: string) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            // Modules critiques toujours accessibles
            if (MODULES_CRITIQUES.includes(moduleNom)) {
                next();
                return;
            }

            const etablissementId = req.utilisateur?.etablissementId;
            const estActif = await configurationService.isModuleActive(moduleNom, etablissementId);

            if (!estActif) {
                await auditService.logAccessDenied(
                    req.utilisateur?.id || 'anonymous',
                    `Tentative d'accès au module désactivé: ${moduleNom}`,
                    req
                );

                throw new AppError(
                    `Le module "${moduleNom}" est désactivé. Contactez un administrateur.`,
                    403,
                    'MODULE_INACTIVE'
                );
            }

            next();
        } catch (error) {
            next(error);
        }
    };
}

export default { requireModuleActive };
```

---

## Tâche 6: Helper `requireModuleActive` dans config.helper.ts

**Fichier:** `backend/src/modules/configuration/utils/config.helper.ts`

**Ajouter à la fin:**

```typescript
/**
 * Middleware pour vérifier si un module est actif (à utiliser dans les controllers)
 */
export function requireModuleActive(moduleNom: string) {
    return async (req: Request, _res: Response, next: NextFunction) => {
        const etablissementId = req.utilisateur?.etablissementId;
        const actif = await configurationService.isModuleActive(moduleNom, etablissementId);
        
        if (!actif) {
            return next(new AppError(`Le module "${moduleNom}" est désactivé`, 403, 'MODULE_INACTIVE'));
        }
        
        next();
    };
}
```

**Modifier les exports:**
```typescript
export {
    getParam,
    getParamNumber,
    getParamBoolean,
    getParamJson,
    getParamArray,
    isModuleActive,
    getAppConfig,
    requireModuleActive,  // ← NOUVEAU
};
```

---

## Tâche 7: Endpoint `/modules/:moduleNom/dependencies`

**Fichier:** `backend/src/modules/configuration/dto/configuration.dto.ts`

**Ajouter:**

```typescript
export const moduleDependenciesSchema = z.object({
    moduleNom: z.string(),
    label: z.string(),
    dependances: z.array(z.object({
        nom: z.string(),
        label: z.string(),
        actif: z.boolean(),
        requis: z.boolean(),
    })),
    reverseDependances: z.array(z.object({
        nom: z.string(),
        label: z.string(),
        actif: z.boolean(),
    })),
    estActif: z.boolean(),
    peutEtreActive: z.boolean(),
    bloquages: z.array(z.string()),
});

export type ModuleDependenciesDto = z.infer<typeof moduleDependenciesSchema>;
```

**Fichier:** `backend/src/modules/configuration/controllers/configuration.controller.ts`

**Ajouter après la route toggle (ligne 167):**

```typescript
router.get('/modules/:moduleNom/dependencies', authMiddleware, canViewConfigModule, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const moduleNom = req.params.moduleNom;
        const etablissementId = req.utilisateur?.etablissementId;
        
        const registryConfig = MODULE_REGISTRY[moduleNom as ModuleName];
        if (!registryConfig) {
            throw new AppError(`Module "${moduleNom}" non trouvé dans le registre`, 404, 'MODULE_NOT_FOUND');
        }

        // Dépendances
        const dependances = await Promise.all(
            (registryConfig.dependencies || []).map(async (dep) => {
                const depConfig = MODULE_REGISTRY[dep];
                const actif = await configurationService.isModuleActive(dep, etablissementId);
                return {
                    nom: dep,
                    label: depConfig?.label || dep,
                    actif,
                    requis: true,
                };
            })
        );

        // Reverse dépendances
        const reverseDependances = configurationService.getReverseDependencies(moduleNom).map((revDep) => {
            const revConfig = MODULE_REGISTRY[revDep];
            return {
                nom: revDep,
                label: revConfig?.label || revDep,
                actif: false, // Sera calculé ci-dessous
            };
        });

        // Vérifier état des reverse deps
        for (const revDep of reverseDependances) {
            revDep.actif = await configurationService.isModuleActive(revDep.nom, etablissementId);
        }

        // État actuel
        const estActif = await configurationService.isModuleActive(moduleNom, etablissementId);

        // Peut être activé?
        const verification = await configurationService['verifierDependances'](moduleNom, true, etablissementId);
        const peutEtreActive = verification.valide;
        const bloquages = verification.erreurs;

        res.json({
            success: true,
            data: {
                moduleNom,
                label: registryConfig.label,
                dependances,
                reverseDependances,
                estActif,
                peutEtreActive,
                bloquages,
            }
        });
    } catch (error) { next(error); }
});
```

**Ajouter l'import en haut du controller:**
```typescript
import { MODULE_REGISTRY } from '@shared/config/config.registry';
```

---

## Tâche 8: Paramètres système `{module}.actif`

**Fichier:** `backend/src/modules/configuration/services/configuration-seed.service.ts`

**Dans `getAllDefaultParametres()`, ajouter après les paramètres existants:**

```typescript
// ============ MODULES - ÉTAT ACTIF ============
// Paramètres pour permettre getParamBoolean('{module}.actif')
...Object.entries(MODULE_REGISTRY).map(([moduleName, config], index) => ({
    cle: `${moduleName}.actif`,
    valeur: config.defaultActive,
    typeValeur: TypeValeurParametre.BOOLEAN,
    categorie: CategorieParametre.MODULE,
    module: moduleName,
    description: `Module ${config.label} actif`,
    modifiableRuntime: true,
    visible: true,
    ordre: index,
})),
```

---

## Tâche 9: Appliquer middleware dans `app.ts`

**Fichier:** `backend/src/app.ts`

**Ajouter l'import:**
```typescript
import { requireModuleActive } from '@modules/configuration/middlewares/module-active.middleware';
```

**Modifier les montages de routes (exemples):**

```typescript
// Modules critiques (SANS middleware)
app.use('/api/auth', authController);
app.use('/api/utilisateurs', requireRoles(Role.SUPER_ADMIN, Role.ADMIN), utilisateursController);
app.use('/api/configuration', configurationController);
app.use('/api/notifications', notificationsController);

// Modules académiques (AVEC middleware)
app.use('/api/notes', requireModuleActive('notes'), notesController);
app.use('/api/bulletins', requireModuleActive('bulletins'), bulletinsController);
app.use('/api/orientation', requireModuleActive('orientation'), orientationController);

// Modules logistiques
app.use('/api/cantine', requireModuleActive('cantine'), cantineController);
app.use('/api/transport', requireModuleActive('transport'), transportController);
app.use('/api/materiel', requireModuleActive('materiel'), materielController);
app.use('/api/finances', requireModuleActive('finances'), financesController);

// Modules activités
app.use('/api/clubs', requireModuleActive('clubs'), clubsController);
app.use('/api/gamification', requireModuleActive('gamification'), gamificationController);

// Modules documents
app.use('/api/cartes', requireModuleActive('cartes'), cartesController);
app.use('/api/impressions', requireModuleActive('impressions'), impressionsController);

// Modules système
app.use('/api/scoring', requireModuleActive('scoring'), scoringController);
app.use('/api/monitoring', requireModuleActive('monitoring'), monitoringController);
app.use('/api/dashboard', requireModuleActive('dashboard'), dashboardController);

// ... autres modules selon le même pattern
```

**Note:** Ne pas ajouter `requireModuleActive()` sur:
- `auth`, `utilisateurs`, `configuration`, `notifications` (critiques)
- `etablissement`, `cycles`, `niveaux`, `classes`, `periodes`, `matieres`, `eleves`, `personnel`, `messagerie`, `requetes`, `audit`, `rbac`, `validation-workflow` (structurels)

---

## Tâche 10: Migration SQL de réconciliation

**Nouveau fichier:** `backend/database/migrations/013-sync-modules-actifs.sql`

```sql
-- ==================================
-- Migration 013: Synchronisation modulesActifs
-- ==================================
-- Réconcilie ConfigurationApp.modulesActifs avec EtablissementConfig.modulesActifs
-- Date: 2026-06-07

-- Synchroniser EtablissementConfig depuis ConfigurationApp pour les établissements sans config
UPDATE etablissement_config ec
SET modules_actifs = ca.modules_actifs
FROM configuration_app ca
WHERE (ec.modules_actifs IS NULL OR ec.modules_actifs = '{}')
  AND ca.modules_actifs IS NOT NULL
  AND ca.modules_actifs != '{}';

-- Créer une config pour les établissements qui n'en ont pas
INSERT INTO etablissement_config (etablissement_id, modules_actifs, created_at, updated_at)
SELECT 
    e.id,
    ca.modules_actifs,
    NOW(),
    NOW()
FROM etablissements e
LEFT JOIN etablissement_config ec ON ec.etablissement_id = e.id
CROSS JOIN LATERAL (SELECT modules_actifs FROM configuration_app LIMIT 1) ca
WHERE ec.id IS NULL
  AND ca.modules_actifs IS NOT NULL;
```

---

## Vérification

### Tests manuels

1. **Test activation avec dépendances:**
   ```bash
   # Désactiver notes d'abord
   curl -X POST http://localhost:3000/api/configuration/modules/notes/toggle \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"actif": false}'

   # Tenter d'activer bulletins (doit auto-activer notes)
   curl -X POST http://localhost:3000/api/configuration/modules/bulletins/toggle \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"actif": true}'
   
   # Vérifier que notes est maintenant actif
   curl http://localhost:3000/api/configuration/modules/notes/dependencies \
     -H "Authorization: Bearer <token>"
   ```

2. **Test middleware:**
   ```bash
   # Désactiver gamification
   curl -X POST http://localhost:3000/api/configuration/modules/gamification/toggle \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"actif": false}'

   # Tenter d'accéder (doit retourner 403)
   curl http://localhost:3000/api/gamification \
     -H "Authorization: Bearer <token>"
   ```

3. **Test endpoint dependencies:**
   ```bash
   curl http://localhost:3000/api/configuration/modules/bulletins/dependencies \
     -H "Authorization: Bearer <token>"
   ```

4. **Test paramètre système:**
   ```typescript
   // Dans un service
   const actif = await getParamBoolean('notes.actif');
   console.log(actif); // true ou false
   ```

### Tests automatisés

Exécuter le seed:
```bash
cd backend
npm run seed
```

Vérifier en base:
```sql
SELECT cle, valeur FROM parametre_systeme WHERE cle LIKE '%.actif';
SELECT modules_actifs FROM etablissement_config WHERE etablissement_id = '<id>';
```

---

## Fichiers à créer

1. `backend/src/modules/configuration/middlewares/module-active.middleware.ts`
2. `backend/database/migrations/013-sync-modules-actifs.sql`

## Fichiers à modifier

1. `shared/src/enums/modules.enum.ts`
2. `shared/src/config/config.registry.ts`
3. `backend/src/modules/configuration/services/configuration.service.ts`
4. `backend/src/modules/configuration/controllers/configuration.controller.ts`
5. `backend/src/modules/configuration/dto/configuration.dto.ts`
6. `backend/src/modules/configuration/utils/config.helper.ts`
7. `backend/src/modules/configuration/services/configuration-seed.service.ts`
8. `backend/src/app.ts`
9. `backend/src/modules/configuration/index.ts` (export middleware)

---

## Risques & Mitigation

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Middleware bloque des routes légitimes | Élevé | Tester en dev d'abord, rollback facile (commenter dans app.ts) |
| Incohérence de données après migration | Moyen | Backup DB avant migration, script de rollback |
| Auto-activation non désirée | Faible | Loguer toutes les auto-activations, endpoint pour vérifier |
| Performance (requêtes DB supplémentaires) | Faible | Cache déjà en place, TTL 5 min |
