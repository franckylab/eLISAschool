# Plan: Refonte Architecture Configuration & Multi-Tenant eLISAschool

## Contexte

L'architecture actuelle de configuration et de multi-tenancy présente plusieurs incohérences critiques:

1. **Double source de vérité**: `ConfigurationApp` (dépréciée) coexiste avec `ParametreSysteme` et `EtablissementConfig`
2. **Flow login incohérent**: L'établissement principal n'est pas automatiquement sélectionné lors de la connexion
3. **Helper config non-contextuel**: `getParam()` ignore les overrides par établissement
4. **Redondances massives**: 4 niveaux de fallback dans `isModuleActive()` avec champs dupliqués sur 3 entités

## Objectifs

1. **Source unique de vérité** pour les configurations et paramètres
2. **Authentification multi-tenant cohérente** avec sélection automatique d'établissement
3. **Suppression complète** de `ConfigurationApp` et nettoyage des redondances
4. **Performance améliorée** (+50% sur `isModuleActive()`)

---

## Task 1: Migration Données ConfigurationApp → ParametreSysteme

### Fichiers à modifier
- `backend/database/migrations/XXX-migration-config-app-to-parametres.ts` (NOUVEAU)
- `backend/src/modules/configuration/services/configuration-seed.service.ts`

### Actions
1. Créer une migration TypeScript qui:
   - Lit l'unique enregistrement de `configuration_app`
   - Mappe chaque champ vers un paramètre global dans `parametres_systeme` (etablissementId = NULL)
   - Préserve les valeurs dans `valeurDefaut` pour référence
   - Exemple de mapping:
     ```
     nomEtablissement → 'app.nom_etablissement' (STRING)
     langueDefaut → 'app.langue_defaut' (STRING)
     devise → 'app.devise' (STRING)
     modulesActifs → 'app.modules_actifs' (JSON)
     couleurPrimaire → 'app.couleur_primaire' (STRING)
     etc.
     ```

2. Mettre à jour le seed pour créer directement dans `parametres_systeme` au lieu de `configuration_app`

3. Script de vérification post-migration:
   ```bash
   # Vérifier que tous les paramètres sont migrés
   SELECT COUNT(*) FROM parametres_systeme WHERE etablissementId IS NULL;
   ```

### Critères de succès
- ✅ Tous les champs de `ConfigurationApp` migrés vers `ParametreSysteme`
- ✅ Aucune perte de données
- ✅ Tests de lecture/écriture fonctionnels

---

## Task 2: Suppression ConfigurationApp du Code

### Fichiers à modifier
- `backend/src/modules/configuration/entities/configuration-app.entity.ts` → SUPPRIMER
- `backend/src/modules/configuration/entities/index.ts` → Retirer l'export
- `backend/src/modules/configuration/services/configuration.service.ts` → Lignes 18, 42, 55, 73, 100-152, 325-328, 480-491, 1081, 1100-1115
- `backend/src/modules/configuration/services/configuration-history.service.ts` → Lignes 15, 41, 46
- `backend/src/modules/configuration/services/backup/config-backup.service.ts` → Lignes 23, 26
- `backend/src/modules/configuration/services/configuration-seed.service.ts` → Lignes 13, 40, 45, 57, 74+
- `backend/src/modules/configuration/utils/config.helper.ts` → Lignes 82-84 (`getAppConfig()`)

### Actions
1. **Supprimer l'entité** `configuration-app.entity.ts`

2. **Réécrire `configuration.service.ts`**:
   - Supprimer `getConfigApp()` et `updateConfigApp()`
   - Remplacer `toggleModuleApp()` par `toggleModuleGlobal()` utilisant `ParametreSysteme`
   - Simplifier `isModuleActive()` de 4 à 2 niveaux:
     ```typescript
     async isModuleActive(moduleNom: string, etablissementId?: string): Promise<boolean> {
       // Niveau 1: Override par établissement
       if (etablissementId) {
         const param = await this.getParametre(`modules.${moduleNom}`, etablissementId);
         if (param !== null) return param;
       }
       
       // Niveau 2: Valeur globale (ou registry par défaut)
       const globalParam = await this.getParametre<boolean>(`modules.${moduleNom}`);
       if (globalParam !== null) return globalParam;
       
       // Niveau 3: Registry defaultActive
       return MODULE_REGISTRY[moduleNom]?.defaultActive ?? false;
     }
     ```
   - Supprimer `toggleModuleApp()`, remplacer par écriture dans `ParametreSysteme`
   - Supprimer `activerLicence()` (migrer vers paramètres)

3. **Nettoyer `config.helper.ts`**:
   - Supprimer `getAppConfig()`
   - Remplacer par `getGlobalParams()` qui lit `ParametreSysteme`

4. **Mettre à jour les services de backup**:
   - Remplacer lecture de `ConfigurationApp` par export de `ParametreSysteme` globaux

5. **Mettre à jour configuration-history.service.ts**:
   - Remplacer `configAppRepo` par `parametreRepository`

### Critères de succès
- ✅ Aucune référence à `ConfigurationApp` dans le code
- ✅ Compilation TypeScript sans erreurs
- ✅ Tests unitaires passent

---

## Task 3: Simplification EtablissementConfig

### Fichiers à modifier
- `backend/src/modules/etablissement/entities/etablissement-config.entity.ts`
- `backend/src/modules/etablissement/dto/etablissement-config.dto.ts`
- `backend/src/modules/etablissement/services/etablissement.service.ts`

### Actions
**Réduire `EtablissementConfig` aux champs STRICTEMENT nécessaires**:

**À SUPPRIMER** (déjà dans ParametreSysteme):
- `couleurPrimaire`, `couleurSecondaire`, `couleurAccent`, `theme` → migrer vers `ParametreSysteme` scopé
- `langueDefaut`, `devise`, `fuseauHoraire`, `messageAccueil` → migrer vers `ParametreSysteme` scopé

**À CONSERVER** (spécifiques établissement/SaaS):
- `cyclesActifs` (spécifique à l'établissement)
- `configurationBulletin` (spécifique)
- `modulesActifs` (conserver pour compatibilité temporaire, puis migrer vers ParametreSysteme)
- `maxEleves`, `maxUtilisateurs`, `maxClasses`, `stockageMaxMB` (quotas SaaS)
- `dateExpirationAbonnement`, `planAbonnement` (SaaS)

**Nouvelle structure**:
```typescript
@Entity('etablissement_config')
export class EtablissementConfig {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    etablissementId!: string;

    @OneToOne('Etablissement', 'configuration')
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement;

    // Cycles actifs (spécifique établissement)
    @Column({ type: 'simple-array', default: '' })
    cyclesActifs!: string[];

    // Configuration bulletin (spécifique)
    @Column({ type: 'simple-json', nullable: true })
    configurationBulletin?: { style?: string; couleurPrimaire?: string; ... };

    // Quotas SaaS
    @Column({ type: 'int', nullable: true })
    maxEleves?: number;

    @Column({ type: 'int', nullable: true })
    maxUtilisateurs?: number;

    @Column({ type: 'int', nullable: true })
    maxClasses?: number;

    @Column({ type: 'int', nullable: true })
    stockageMaxMB?: number;

    // Abonnement
    @Column({ type: 'timestamp', nullable: true })
    dateExpirationAbonnement?: Date;

    @Column({ type: 'varchar', length: 50, default: 'gratuit' })
    planAbonnement?: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
```

**Migration des champs supprimés**:
Créer un script qui:
1. Pour chaque `EtablissementConfig` existant
2. Lit `couleurPrimaire`, `langueDefaut`, etc.
3. Crée des overrides dans `ParametreSysteme` avec `etablissementId` = UUID de l'établissement
4. Supprime les champs de `EtablissementConfig`

### Critères de succès
- ✅ `EtablissementConfig` ne contient QUE des champs SaaS/spécifiques
- ✅ Données migrées vers `ParametreSysteme` avec scopage établissement
- ✅ API de mise à jour de config établissement fonctionnelle

---

## Task 4: Correction Flow Authentification Multi-Tenant

### Fichiers à modifier
- `backend/src/modules/auth/services/auth.service.ts` (lignes 86-232, 327-373)
- `backend/src/modules/auth/controllers/auth.controller.ts` (lignes 255-329)
- `backend/src/modules/auth/dto/auth.dto.ts` (ajouter champ `etablissementId` optionnel dans LoginDto)

### Actions

#### 4.1 Corriger le Login

**Problème actuel** (auth.service.ts ligne 200):
```typescript
// ❌ INCORRECT - utilise la colonne nullable qui peut être NULL
etablissementId: utilisateur.etablissementId,
```

**Solution**:
```typescript
// ✅ CORRECT - Détecter l'établissement principal automatiquement
async login(loginDto: LoginDto, adresseIp?: string, userAgent?: string, req?: any): Promise<LoginResponseDto> {
    // ... validation existante ...

    // Charger les établissements de l'utilisateur
    const utilisateurEtablissements = await this.utilisateurEtablissementRepo.find({
        where: { utilisateurId: utilisateur.id, actif: true },
        order: { etablissementPrincipal: 'DESC', creeAt: 'ASC' }
    });

    // Déterminer l'établissement actif
    let etablissementActifId: string | undefined;
    
    if (utilisateurEtablissements.length > 0) {
        // Priorité 1: Établissement principal
        const principal = utilisateurEtablissements.find(ue => ue.etablissementPrincipal);
        if (principal) {
            etablissementActifId = principal.etablissementId;
        } else {
            // Priorité 2: Premier établissement actif
            etablissementActifId = utilisateurEtablissements[0].etablissementId;
        }
    } else {
        // Fallback legacy: colonne etablissementId
        etablissementActifId = utilisateur.etablissementId;
    }

    // Résolution des permissions
    const resolvedPermissions = await permissionResolverService.resolvePermissions(utilisateur.id);
    const userRoles = await permissionResolverService.getUserRoles(utilisateur.id);

    // Construire le payload JWT
    const payload: JwtPayload = {
        sub: utilisateur.id,
        email: utilisateur.email,
        role: utilisateur.role,
        roles: userRoles.map(r => r.code),
        permissions: Array.from(resolvedPermissions),
        etablissementId: etablissementActifId, // ✅ TOUJOURS défini si l'utilisateur a des affectations
        etablissements: utilisateurEtablissements.map(ue => ({
            etablissementId: ue.etablissementId,
            role: ue.role,
            etablissementPrincipal: ue.etablissementPrincipal,
            actif: ue.actif
        })),
    };

    // ... génération tokens ...

    return {
        accessToken,
        refreshToken,
        expiresIn,
        utilisateur: {
            id: utilisateur.id,
            email: utilisateur.email,
            matricule: utilisateur.matricule,
            role: utilisateur.role,
            nom: profil?.nom || '',
            prenom: profil?.prenom || '',
            etablissementActif: etablissementActifId, // ✅ Informer le frontend
            etablissements: payload.etablissements, // ✅ Liste complète
        },
    };
}
```

#### 4.2 Corriger Refresh Token

**Problème**: `refreshTokens()` ne recharge pas les établissements (JWT peut devenir obsolète)

**Solution**:
```typescript
async refreshTokens(refreshToken: string, adresseIp?: string, userAgent?: string) {
    // ... validation existante ...

    // ✅ RECHARGER les établissements (peut avoir changé)
    const utilisateurEtablissements = await this.utilisateurEtablissementRepo.find({
        where: { utilisateurId: utilisateur.id, actif: true },
        order: { etablissementPrincipal: 'DESC', creeAt: 'ASC' }
    });

    // ... reconstruire payload avec établissements à jour ...
}
```

#### 4.3 Ajouter Endpoint de Sélection d'Établissement

L'endpoint `/api/auth/switch-etablissement` existe déjà (auth.controller.ts lignes 255-329) mais peut être amélioré:

```typescript
// Ajouter dans la réponse:
res.status(200).json({
    success: true,
    message: 'Établissement actif changé avec succès',
    data: {
        accessToken: newAccessToken,
        etablissementActif: {
            id: etablissementId,
            role: etablissementData.role,
            nom: etablissement.nom, // ✅ Ajouter le nom
        },
        etablissements: utilisateur.etablissements, // ✅ Liste complète mise à jour
    },
});
```

### Critères de succès
- ✅ Login retourne TOUJOURS un `etablissementId` valide (sauf SUPER_ADMIN sans affectation)
- ✅ Refresh token recharge les établissements
- ✅ Switch établissement retourne le nom de l'établissement
- ✅ Tests de connexion multi-établissements passent

---

## Task 5: Helper Config Contextuel

### Fichiers à modifier
- `backend/src/modules/configuration/utils/config.helper.ts` (lignes 24-37, 75-77)
- `backend/src/common/middlewares/tenant.middleware.ts` (ajouter `req.configContext`)

### Actions

#### 5.1 Rendre `getParam()` contextuel

**Problème actuel** (config.helper.ts ligne 30):
```typescript
// ❌ Ne passe JAMAIS etablissementId
const value = await configurationService.getParametre<T>(cle);
```

**Solution**:
```typescript
/**
 * Récupère un paramètre avec contexte d'établissement
 * 
 * @param cle Clé du paramètre
 * @param options Options de contexte
 * @param options.etablissementId ID de l'établissement (optionnel)
 * @param options.defaultValue Valeur par défaut si paramètre non trouvé
 */
export async function getParam<T = string>(
    cle: string, 
    options?: { etablissementId?: string; defaultValue?: T }
): Promise<T> {
    const { etablissementId, defaultValue } = options || {};
    const cacheKey = etablissementId ? `${cle}:${etablissementId}` : cle;

    const cached = quickCache.get(cacheKey);
    if (cached && Date.now() < cached.expiry) {
        return cached.value as T;
    }

    // ✅ PASSER etablissementId au service
    const value = await configurationService.getParametre<T>(cle, etablissementId);
    if (value !== null) {
        quickCache.set(cacheKey, { value, expiry: Date.now() + QUICK_CACHE_TTL });
        return value;
    }

    return defaultValue as T;
}

/**
 * Récupère un paramètre depuis le contexte de la requête
 * Utilise automatiquement req.etablissementId
 */
export async function getParamFromRequest<T = string>(
    cle: string,
    req: Request,
    defaultValue?: T
): Promise<T> {
    return getParam<T>(cle, {
        etablissementId: req.etablissementId,
        defaultValue
    });
}
```

#### 5.2 Attacher le contexte de config dans le middleware

Dans `tenant.middleware.ts`, après avoir défini `req.etablissementId`:

```typescript
// Attacher le contexte de configuration
req.configContext = {
    etablissementId: req.etablissementId,
    isSuperAdmin: userRole === Role.SUPER_ADMIN,
};
```

Ajouter à l'interface `Request` dans un fichier de types:
```typescript
declare global {
    namespace Express {
        interface Request {
            etablissementId?: string;
            configContext?: {
                etablissementId?: string;
                isSuperAdmin: boolean;
            };
        }
    }
}
```

#### 5.3 Mise à jour des appels existants

**Pattern à suivre dans les services**:

```typescript
// ❌ AVANT - Ignore le contexte
const maxLoginAttempts = await getParamNumber('auth.max_login_attempts', 5);

// ✅ APRÈS - Utilise le contexte de la requête
const maxLoginAttempts = await getParamFromRequest('auth.max_login_attempts', req, 5);

// OU si on a juste etablissementId:
const maxLoginAttempts = await getParamNumber('auth.max_login_attempts', {
    etablissementId,
    defaultValue: 5
});
```

**Note**: Cette mise à jour sera progressive. Les anciens appels continueront de fonctionner (récupèrent les valeurs globales), mais les nouveaux appels utiliseront le contexte.

### Critères de succès
- ✅ `getParam()` accepte `etablissementId` optionnel
- ✅ Helpers `getParamFromRequest()` disponibles
- ✅ Tests de lecture de paramètres scopés par établissement
- ✅ Documentation des patterns d'utilisation

---

## Task 6: Nettoyage ConfigurationModule (Optionnel)

### Fichiers à modifier
- `backend/src/modules/configuration/entities/configuration-module.entity.ts`
- `backend/src/modules/configuration/services/configuration.service.ts`

### Analyse

`ConfigurationModule` sert à stocker:
- `champsPersonnalises` (configuration des champs custom par module)
- `widgets` (configuration des widgets)
- `parametres` (paramètres spécifiques au module)
- `actif` (état actif/inactif)

**Problème**: Redondance avec `ParametreSysteme` pour les paramètres.

**Recommandation**:
- **Conserver** `champsPersonnalises` et `widgets` (config technique complexe)
- **Supprimer** `parametres` et `actif` → migrer vers `ParametreSysteme`
- **Nouvelle structure**:
  ```typescript
  @Entity('configuration_modules')
  export class ConfigurationModule {
      @PrimaryGeneratedColumn('uuid')
      id!: string;

      @Column({ type: 'varchar', length: 100 })
      moduleNom!: string;

      @Column({ type: 'uuid', nullable: true })
      etablissementId?: string;

      // Configuration technique (conserver)
      @Column({ type: 'simple-json', default: '[]' })
      champsPersonnalises!: Array<{ nom: string; type: string; obligatoire: boolean }>;

      @Column({ type: 'simple-json', default: '[]' })
      widgets!: Array<{ id: string; position: string; visible: boolean }>;

      // ❌ SUPPRIMER: parametres → ParametreSysteme
      // ❌ SUPPRIMER: actif → ParametreSysteme (modules.{nom}.actif)

      @CreateDateColumn()
      createdAt!: Date;

      @UpdateDateColumn()
      updatedAt!: Date;
  }
  ```

**Cette task est OPTIONNELLE** et peut être réalisée dans un second temps.

---

## Task 7: Tests et Validation

### Fichiers à créer
- `backend/test/integration/configuration-multi-tenant.spec.ts`
- `backend/test/integration/auth-multi-etablissement.spec.ts`

### Tests à implémenter

#### 7.1 Tests Configuration Multi-Tenant

```typescript
describe('Configuration Multi-Tenant', () => {
    it('doit lire le paramètre global si aucun override', async () => {
        const value = await configService.getParametre('auth.max_login_attempts');
        expect(value).toBe(5);
    });

    it('doit lire l\'override établissement si existant', async () => {
        await configService.setParametre('auth.max_login_attempts', 10, etablissementId);
        const value = await configService.getParametre('auth.max_login_attempts', etablissementId);
        expect(value).toBe(10);
    });

    it('doit fallback vers global si override supprimé', async () => {
        await configService.resetParametre('auth.max_login_attempts', etablissementId);
        const value = await configService.getParametre('auth.max_login_attempts', etablissementId);
        expect(value).toBe(5); // Valeur globale
    });

    it('isModuleActive doit vérifier établissement puis global', async () => {
        await configService.toggleModule('notes', false, etablissementId);
        const isActive = await configService.isModuleActive('notes', etablissementId);
        expect(isActive).toBe(false);
    });
});
```

#### 7.2 Tests Authentification Multi-Établissement

```typescript
describe('Auth Multi-Établissement', () => {
    it('doit sélectionner l\'établissement principal au login', async () => {
        const result = await authService.login({ email: 'admin@ecole.fr', motDePasse: '...' });
        expect(result.utilisateur.etablissementActif).toBeDefined();
        expect(result.utilisateur.etablissements.length).toBeGreaterThan(1);
    });

    it('doit fallback sur le premier établissement si pas de principal', async () => {
        // Retirer le flag principal
        await utilisateurEtablissementService.definirPrincipal(userId, etablissementId);
        // ... tester login ...
    });

    it('doit recharger les établissements au refresh token', async () => {
        const refreshResult = await authService.refreshTokens(refreshToken);
        const payload = tokenService.verifyAccessToken(refreshResult.accessToken);
        expect(payload.etablissements).toBeDefined();
    });

    it('switch établissement doit retourner un nouveau JWT valide', async () => {
        const switchResult = await authController.switchEtablissement(req, res);
        expect(switchResult.data.accessToken).toBeDefined();
        const payload = tokenService.verifyAccessToken(switchResult.data.accessToken);
        expect(payload.etablissementId).toBe(nouvelEtablissementId);
    });
});
```

### Critères de succès
- ✅ 100% des tests passent
- ✅ Coverage > 80% sur les services modifiés
- ✅ Tests de performance sur `isModuleActive()` (< 50ms)

---

## Task 8: Documentation et Migration Guide

### Fichiers à créer
- `backend/docs/MIGRATION-CONFIGURATION-V3.md`
- `backend/scripts/migrate-config-app-to-parametres.ts`
- `backend/scripts/migrate-etablissement-config-to-parametres.ts`

### Contenu

#### 8.1 Guide de Migration

Documenter:
1. **Prérequis**: Backup de la base de données
2. **Exécution des migrations**:
   ```bash
   # Migration ConfigurationApp → ParametreSysteme
   npm run migrate-config-app

   # Migration EtablissementConfig → ParametreSysteme
   npm run migrate-etablissement-config

   # Vérification
   npm run verify-migration
   ```
3. **Rollback** en cas de problème
4. **Validation post-migration**

#### 8.2 Guide d'Utilisation pour Développeurs

Documenter les nouveaux patterns:

```typescript
// ✅ Pattern recommandé dans les controllers
router.get('/config', authMiddleware, async (req, res) => {
    const maxLogin = await getParamFromRequest('auth.max_login_attempts', req, 5);
    res.json({ maxLoginAttempts: maxLogin });
});

// ✅ Pattern recommandé dans les services
async createEleve(dto: CreateEleveDto, etablissementId: string) {
    const maxEleves = await getParam<number>('etablissement.max_eleves', {
        etablissementId,
        defaultValue: 1000
    });
    // ...
}
```

#### 8.3 Scripts de Migration

**`migrate-config-app-to-parametres.ts`**:
```typescript
import { AppDataSource } from '@database/data-source';
import { ConfigurationApp } from '@modules/configuration/entities/configuration-app.entity';
import { ParametreSysteme, CategorieParametre, TypeValeurParametre } from '@modules/configuration/entities/parametre-systeme.entity';

async migrate() {
    const configRepo = AppDataSource.getRepository(ConfigurationApp);
    const paramRepo = AppDataSource.getRepository(ParametreSysteme);

    const configApp = await configRepo.findOne({ where: {} });
    if (!configApp) {
        console.log('Aucune ConfigurationApp à migrer');
        return;
    }

    const mapping = {
        nomEtablissement: { cle: 'app.nom_etablissement', type: TypeValeurParametre.STRING },
        langueDefaut: { cle: 'app.langue_defaut', type: TypeValeurParametre.STRING },
        devise: { cle: 'app.devise', type: TypeValeurParametre.STRING },
        // ... autres mappings ...
    };

    for (const [field, { cle, type }] of Object.entries(mapping)) {
        const value = configApp[field];
        if (value !== undefined && value !== null) {
            const param = paramRepo.create({
                cle,
                valeur: JSON.stringify(value),
                typeValeur: type,
                categorie: CategorieParametre.SYSTEME,
                valeurDefaut: JSON.stringify(value),
                etablissementId: null,
            });
            await paramRepo.save(param);
            console.log(`✅ Migré: ${field} → ${cle}`);
        }
    }

    console.log('Migration terminée!');
}

migrate().catch(console.error);
```

---

## Plan d'Exécution

### Phase 1: Préparation (1 jour)
- [ ] Backup complet de la base de données
- [ ] Environnement de staging
- [ ] Création des scripts de migration

### Phase 2: Migration des Données (1-2 jours)
- [ ] Task 1: Migration ConfigurationApp → ParametreSysteme
- [ ] Task 3: Migration champs EtablissementConfig → ParametreSysteme
- [ ] Vérification des données migrées

### Phase 3: Nettoyage du Code (3-4 jours)
- [ ] Task 2: Suppression ConfigurationApp
- [ ] Task 4: Correction flow authentification
- [ ] Task 5: Helper config contextuel
- [ ] Task 6 (optionnel): Nettoyage ConfigurationModule

### Phase 4: Tests (2-3 jours)
- [ ] Task 7: Tests intégration
- [ ] Tests de performance
- [ ] Tests de régression

### Phase 5: Déploiement (1 jour)
- [ ] Déploiement en staging
- [ ] Validation manuelle
- [ ] Déploiement en production
- [ ] Monitoring post-déploiement

**Durée estimée totale**: 8-11 jours

---

## Risques et Atténuation

| Risque | Impact | Probabilité | Atténuation |
|--------|--------|-------------|-------------|
| Perte de données pendant migration | 🔴 Critique | 🟡 Moyenne | Backup complet + tests de rollback |
| Rupture de compatibilité API | 🟠 Haut | 🟡 Moyenne | Versionner l'API, maintenir compatibilité temporaire |
| Performance dégradée | 🟠 Haut | 🟢 Basse | Tests de charge avant déploiement |
| Bugs multi-tenant non détectés | 🔴 Critique | 🟡 Moyenne | Tests exhaustifs + monitoring |

---

## Métriques de Succès

- ✅ **Complexité du code**: -40% (lignes de code supprimées)
- ✅ **Performance `isModuleActive()`**: +50% (de 150ms à <75ms)
- ✅ **Bugs multi-tenant**: -70% (issues fermées)
- ✅ **Maintenance future**: -60% (temps de compréhension du code)
- ✅ **Tests coverage**: > 80% sur les services modifiés
- ✅ **Zero downtime** pendant la migration

---

## Fichiers Critiques à Modifier

### Core (10 fichiers)
1. `backend/src/modules/configuration/entities/configuration-app.entity.ts` → SUPPRIMER
2. `backend/src/modules/configuration/entities/parametre-systeme.entity.ts` → MODIFIER
3. `backend/src/modules/configuration/entities/etablissement-config.entity.ts` → MODIFIER
4. `backend/src/modules/configuration/services/configuration.service.ts` → MODIFIER
5. `backend/src/modules/configuration/utils/config.helper.ts` → MODIFIER
6. `backend/src/modules/auth/services/auth.service.ts` → MODIFIER
7. `backend/src/modules/auth/controllers/auth.controller.ts` → MODIFIER
8. `backend/src/common/middlewares/tenant.middleware.ts` → MODIFIER
9. `backend/src/app.ts` → VÉRIFIER (pas de changements majeurs)
10. `backend/src/modules/etablissement/services/etablissement.service.ts` → MODIFIER

### Migrations (3 fichiers nouveaux)
11. `backend/database/migrations/XXX-migration-config-app-to-parametres.ts`
12. `backend/database/migrations/XXX-migration-etablissement-config-cleanup.ts`
13. `backend/database/migrations/XXX-add-valeur-defaut-parametres.ts`

### Tests (2 fichiers nouveaux)
14. `backend/test/integration/configuration-multi-tenant.spec.ts`
15. `backend/test/integration/auth-multi-etablissement.spec.ts`

### Scripts (2 fichiers nouveaux)
16. `backend/scripts/migrate-config-app-to-parametres.ts`
17. `backend/scripts/migrate-etablissement-config-to-parametres.ts`

---

## Prochaines Étapes

1. **Valider ce plan** avec l'utilisateur
2. **Commencer par Task 1** (migration des données) - c'est le plus sûr car non-destructif
3. **Exécuter en staging** d'abord
4. **Valider chaque task** avant de passer à la suivante
5. **Déployer en production** uniquement après validation complète des tests
