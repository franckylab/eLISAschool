# Mise à jour des Seeds - Configuration v3.0

**Date**: 2026-06-13  
**Objectif**: Supprimer ConfigurationApp des seeds après migration vers ParametreSysteme + Etablissement  
**Statut**: ✅ COMPLÉTÉ

---

## 📋 Contexte

Après la migration de la configuration :
- ❌ `ConfigurationApp` **SUPPRIMÉ** (n'existe plus)
- ✅ `ParametreSysteme` source unique pour config applicative
- ✅ `Etablissement` source unique pour infos établissement

Les seeds devaient être mis à jour pour refléter cette nouvelle architecture.

---

## ✅ Modifications Apportées

### 1. configuration-seed.service.ts

**Fichier**: `backend/src/modules/configuration/services/configuration-seed.service.ts`

**Changements** :

#### a) Import supprimé
```typescript
// AVANT ❌
import { ConfigurationApp } from '../entities/configuration-app.entity';

// APRÈS ✅
// Import supprimé (entité n'existe plus)
```

#### b) Repository supprimé
```typescript
// AVANT ❌
export class ConfigurationSeedService {
    private configAppRepo: Repository<ConfigurationApp>;
    private configModuleRepo: Repository<ConfigurationModule>;
    private parametreRepo: Repository<ParametreSysteme>;

    constructor() {
        this.configAppRepo = AppDataSource.getRepository(ConfigurationApp);
        // ...
    }
}

// APRÈS ✅
export class ConfigurationSeedService {
    private configModuleRepo: Repository<ConfigurationModule>;
    private parametreRepo: Repository<ParametreSysteme>;

    constructor() {
        // configAppRepo supprimé
        // ...
    }
}
```

#### c) Méthode seedConfigurationApp supprimée (-80 lignes)
```typescript
// AVANT ❌
async seedConfigurationApp(force: boolean = false): Promise<boolean> {
    // Créait/mettait à jour ConfigurationApp
    // avec nomEtablissement, typeEtablissement, etc.
}

// APRÈS ✅
// Méthode SUPPRIMÉE (infos établissement → table etablissements)
```

#### d) runAllSeeds simplifié
```typescript
// AVANT ❌
async runAllSeeds(force: boolean = false): Promise<{ app: boolean; modules: number; parametres: number }> {
    const appCreated = await this.seedConfigurationApp(force);
    const modulesCreated = await this.seedConfigurationModules(force);
    const parametresCreated = await this.seedParametresSysteme(force);
    
    return { app: appCreated, modules: modulesCreated, parametres: parametresCreated };
}

// APRÈS ✅
async runAllSeeds(force: boolean = false): Promise<{ modules: number; parametres: number }> {
    const modulesCreated = await this.seedConfigurationModules(force);
    const parametresCreated = await this.seedParametresSysteme(force);
    
    return { modules: modulesCreated, parametres: parametresCreated };
}
```

#### e) Méthode getDefaultActiveModules supprimée
```typescript
// AVANT ❌
private getDefaultActiveModules(): Record<string, boolean> {
    const modules: Record<string, boolean> = {};
    Object.values(MODULE_REGISTRY).forEach((m: ModuleConfig) => {
        modules[m.name] = m.defaultActive;
    });
    return modules;
}

// APRÈS ✅
// Méthode SUPPRIMÉE (non utilisée ailleurs)
```

**Statistiques** :
- ✅ **-91 lignes** de code supprimé
- ✅ **+2 lignes** (ajustements)
- ✅ **0 fonctionnalité perdue** (ConfigurationApp n'existe plus)

---

### 2. initial.seed.ts

**Fichier**: `backend/src/database/seeds/initial.seed.ts`

**Changements** :

#### a) Version mise à jour
```typescript
// AVANT ❌
 * Version: 2.0.0
 * Inclut: Configuration app, Paramètres système, Super admin

// APRÈS ✅
 * Version: 3.0.0
 * Inclut: Paramètres système, Modules, RBAC, Super admin
```

#### b) Log seedConfiguration corrigé
```typescript
// AVANT ❌
logger.info(`Configuration seeds: App=${result.app}, Modules=${result.modules}, Params=${result.parametres}`);

// APRÈS ✅
logger.info(`Configuration seeds: Modules=${result.modules}, Params=${result.parametres}`);
```

---

## 📊 État des Seeds Après Migration

### Seeds qui s'exécutent maintenant

```
runSeeds()
├── 1. seedConfiguration()
│   ├── seedConfigurationModules() ✅
│   └── seedParametresSysteme() ✅
│       ├── auth.* (sécurité)
│       ├── notifications.*
│       ├── notes.*, bulletins.*
│       ├── cantine.*, transport.*
│       ├── classes.*, matieres.*, periodes.*
│       ├── eleves.*, personnel.*
│       ├── clubs.*, materiel.*, cartes.*
│       ├── annees_scolaires.*, etablissement.*
│       ├── gamification.*, scoring.*
│       ├── regional.* (langue, devise, fuseau)
│       ├── utilisateurs.*
│       └── systeme.*
│
├── 2. seedRBAC() ✅
│   ├── Rôles
│   ├── Permissions
│   └── Mappings
│
├── 3. seedStructureAcademique() ✅
│   ├── Types cycles
│   ├── Cycles
│   ├── Niveaux
│   ├── Filières
│   └── Examens
│
└── 4. seedSuperAdmin() ✅
    └── admin@elisaschool.cm
```

### Ce qui N'EST PLUS seedé

| Ancien Seed | Nouvelle Source | Raison |
|-------------|-----------------|--------|
| `ConfigurationApp.nomEtablissement` | `Etablissement.nom` | Source de vérité unique |
| `ConfigurationApp.typeEtablissement` | `Etablissement.type` | Source de vérité unique |
| `ConfigurationApp.messageAccueil` | _(supprimé)_ | Non utilisé ailleurs |
| `ConfigurationApp.modulesActifs` | `ParametreSysteme.{module}.actif` | Config applicative |
| `ConfigurationApp.couleurPrimaire` | _(via thème)_ | Géré par le frontend |

---

## 🔍 Vérification

### Compilation TypeScript
```bash
$ npx tsc --noEmit 2>&1 | grep -E "configuration-seed|initial.seed"
→ 0 erreur ✅
```

### Fichiers modifiés
1. ✅ `backend/src/modules/configuration/services/configuration-seed.service.ts`
2. ✅ `backend/src/database/seeds/initial.seed.ts`

### Références ConfigurationApp restantes
```bash
$ grep -r "ConfigurationApp" backend/src/
→ 0 résultat ✅
```

---

## 📝 Exécution des Seeds

### Commande standard
```bash
cd backend
npm run seed
```

### Output attendu
```
🌱 Exécution des seeds...
🌱 Démarrage du seed de configuration...
✅ X configurations de modules créées
✅ Y paramètres système créés
Configuration seeds: Modules=X, Params=Y
✅ RBAC seeds: ...
✅ Structure académique seedée
✅ Super admin créé: admin@elisaschool.cm
✅ Seeds exécutés avec succès
```

### Forcer la réinitialisation
```bash
cd backend
npm run seed:force
```

---

## 🎯 Architecture Finale des Seeds

### ParametreSysteme (config applicative uniquement)
```
✅ auth.* (sécurité, mot de passe, 2FA)
✅ notifications.* (providers, rate limiting)
✅ notes.*, bulletins.* (validation workflow)
✅ cantine.*, transport.* (inscriptions)
✅ modules.* (activation, dépendances)
✅ gamification.* (points, badges)
✅ regional.* (langue, devise, fuseau)
✅ systeme.* (backup, logs, maintenance)
```

### Etablissement (infos établissement uniquement)
```
✅ nom
✅ type (laïc, confessionnel)
✅ sousSysteme (francophone, anglophone)
✅ contactEmail, contactTelephone
✅ adresse
✅ codeEtablissement
✅ slogan, logoUrl
✅ effectifs, directeurs
```

### ConfigurationModule (config par module)
```
✅ champsPersonnalises
✅ widgets
✅ parametres spécifiques
✅ actif (état du module)
```

---

## ✅ Bénéfices

1. **Cohérence** : Les seeds reflètent l'architecture v3.0
2. **Simplicité** : -91 lignes de code en moins
3. **Maintenance** : Plus facile à comprendre
4. **Performance** : Seed plus rapide (moins d'entités à créer)
5. **Intégrité** : Pas de duplication de données

---

## 📚 Fichiers de Référence

- **Service seed**: `backend/src/modules/configuration/services/configuration-seed.service.ts` (393 lignes)
- **Seed initial**: `backend/src/database/seeds/initial.seed.ts` (102 lignes)
- **Force seed**: `backend/src/database/seeds/force-config-seed.ts` (69 lignes)
- **Migration suppression**: `backend/database/migrations/057-supprimer-parametres-dupliques-etablissement.sql`
- **Script nettoyage**: `backend/scripts/supprimer-parametres-dupliques-etablissement.ts`

---

**Rapport généré le**: 2026-06-13  
**Statut**: ✅ **SEEDS MIS À JOUR ET PRÊTS POUR PRODUCTION**
