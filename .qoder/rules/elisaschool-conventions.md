---
trigger: always_on
---
# Conventions eLISAschool — Backend API

> **Portée** : Cette règle s'applique à tout le code backend TypeScript (Express + TypeORM).
> **Langue** : Réfléchis, dialogues et commentaires en **français**. Termes techniques (entity, controller, service, DTO, middleware, router, repository) en **anglais**.
> **Évolution** : Cette règle est **vivante** — elle peut être mise à jour automatiquement par l'IA lorsqu'un nouveau pattern émerge dans le codebase, ou manuellement par l'utilisateur selon ses besoins.

---

## 📚 Documentation — Règle Associée

**TOUJOURS** consulter et appliquer la règle de gestion documentaire : [elisaschool-docs-management.md](elisaschool-docs-management.md)

**Règles clés** :
- **TOUS** les fichiers `.md` (sauf README, QUICKSTART, CHEATSHEET) vont dans `docs/`
- **Classification** par type : analyses/, corrections, guides/, rapports/, etc.
- **Nommage** : `TYPE-SUJET-CONTEXTE.md` (KEBAB-CASE)
- **INDEX.md** : Mettre à jour après chaque session de travail
- **Jamais** de fichiers `.md` à la racine du projet, `backend/`, ou `frontend/`

---

## ⚠️ INVOCATION AUTOMATIQUE DES SKILLS — OBLIGATOIRE

**Avant toute tâche de développement ou modification**, l'IA **DOIT** invoquer proactivement le skill approprié **sans attendre que l'utilisateur le demande** :

| Tâche détectée | Skill à invoquer |
|----------------|------------------|
| Créer/modifier un module, endpoint, entité, service, controller, migration | `/elisaschool-dev` |
| Comprendre/modifier une règle métier, un calcul, un workflow, la config | `/elisaschool-business-logic` |
| Créer/modifier un composant, page, hook, formulaire frontend | `/elisaschool-frontend-dev` |
| Refactoriser, optimiser, moderniser du code frontend | `/elisaschool-frontend-refactor` |

**Règles** :
1. **TOUJOURS** invoquer le skill **avant** de coder
2. **TOUJOURS** invoquer `/elisaschool-business-logic` avant de modifier un service existant
3. **Combiner** si nécessaire (ex: module backend + frontend)
4. **Ne JAMAIS** ignorer cette section

---

## 1. Nommage

| Élément | Convention | Exemple |
|---------|-----------|---------|
| Variables, fonctions, méthodes | `camelCase` en français | `dateNaissance`, `findAll()`, `motDePasse` |
| Classes, interfaces, types, enums | `PascalCase` singulier | `Eleve`, `MembrePersonnel`, `SousSysteme` |
| Dossiers de modules | `kebab-case` pluriel | `annees-scolaires`, `utilisateurs` |
| Fichiers | `kebab-case.type.ts` | `eleves.controller.ts`, `eleve.entity.ts` |
| Tables PostgreSQL | `snake_case` pluriel | `eleves`, `annees_scolaires`, `membres_personnel` |
| Colonnes PostgreSQL | `camelCase` (géré par TypeORM) | `dateNaissance`, `utilisateurId` |
| Constantes | `UPPER_SNAKE_CASE` | `DEFAULT_ROLE_PERMISSIONS` |

---

## 2. Bannière de fichier

**Obligatoire** sur tout nouveau fichier `.ts` :

```typescript
/**
 * ==================================
 * eLISAschool - [Description courte du fichier]
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */
```

Pour les fichiers simples (`index.ts`, barrel exports), utiliser la version courte :

```typescript
/**
 * ==================================
 * eLISAschool - [Description]
 * ==================================
 */
```

---

## 3. Architecture modulaire

Chaque module feature vit dans `backend/src/modules/<module-name>/` et suit **exactement** cette structure :

```
<module>/
├── controllers/
│   ├── <module>.controller.ts    # Router Express + handlers
│   └── index.ts                  # export { xxxController } from './xxx.controller';
├── services/
│   ├── <module>.service.ts       # Logique métier + accès données
│   └── index.ts                  # export * from './xxx.service';
├── entities/
│   ├── <entity>.entity.ts        # Entités TypeORM
│   └── index.ts                  # export * from './xxx.entity';
├── dto/
│   ├── <module>.dto.ts           # Schémas Zod + types inférés
│   └── index.ts                  # export * from './xxx.dto';
└── index.ts                      # export * from './entities'; ./dto; ./services; ./controllers;
```

Modules spéciaux (auth, configuration) peuvent avoir des sous-dossiers additionnels : `guards/`, `middlewares/`, `utils/`.

---

## 4. Path aliases TypeScript

| Alias | Résolution | Usage |
|-------|-----------|-------|
| `@modules/*` | `src/modules/*` | Imports inter-modules |
| `@common/*` | `src/common/*` | Filtres, intercepteurs, utils partagés |
| `@config/*` | `src/config/*` | Configuration (env, database, swagger) |
| `@database/*` | `src/database/*` | DataSource, migrations, seeds |
| `@shared/*` | `../../shared/src/*` | Package partagé (enums, types, validators) |

**Ordre des imports** (du plus externe au plus local) :
1. Dépendances externes (`express`, `typeorm`, `zod`)
2. `@shared/*` (enums, types partagés)
3. `@config/*`, `@common/*`, `@database/*`
4. `@modules/*` (autres modules)
5. Imports relatifs (`../entities`, `./dto`)

---

## 5. Pattern Controller

```typescript
import { Router, Request, Response, NextFunction } from 'express';
import { XxxService } from '../services';
import { createXxxSchema, updateXxxSchema } from '../dto';
import { authMiddleware, requireRoles } from '@modules/auth/middlewares';
import { Role } from '@modules/auth/entities';
import { AppError } from '@common/filters/error.filter';

const router = Router();
const service = new XxxService();

// Helper de validation Zod (local au controller)
function validate(schema: any, data: unknown): any {
    const result = schema.safeParse(data);
    if (!result.success) {
        throw new AppError('Erreur de validation', 400, 'VALIDATION_ERROR');
    }
    return result.data;
}

// Routes CRUD avec auth + rôles par endpoint
router.get('/', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await service.findAll();
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

router.post('/', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(createXxxSchema, req.body);
        const created = await service.create(dto);
        res.status(201).json({ success: true, data: created });
    } catch (error) { next(error); }
});

// PATCH, DELETE... même pattern

export const xxxController = router;
export default router;
```

**Règles controller** :
- Toujours wrapper dans `try/catch` et passer l'erreur à `next(error)`
- Appliquer `authMiddleware` + `requireRoles()` **par route** (pas globalement)
- Valider le body avec `validate(schema, req.body)` pour POST/PATCH
- Retourner `201` pour POST, `200` pour GET/PATCH/DELETE

---

## 6. Pattern Service

```typescript
import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { Xxx } from '../entities';
import { CreateXxxDto, UpdateXxxDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';

export class XxxService {
    private repo: Repository<Xxx>;

    constructor() {
        this.repo = AppDataSource.getRepository(Xxx);
    }

    async create(dto: CreateXxxDto): Promise<Xxx> { /* unicité check + save + logger.info */ }
    async findAll(): Promise<Xxx[]> { /* find avec relations et order */ }
    async findOne(id: string): Promise<Xxx> { /* findOne ou throw AppError 404 */ }
    async update(id: string, dto: UpdateXxxDto): Promise<Xxx> { /* findOne + Object.assign + save */ }
    async delete(id: string): Promise<void> { /* findOne + remove + logger.info */ }
}

// Singleton exporté
export const xxxService = new XxxService();
```

**Règles service** :
- Vérifier l'unicité avant création → `AppError('...', 409, 'XXX_EXISTS')`
- Not-found → `AppError('...', 404, 'NOT_FOUND')`
- Logger les opérations critiques (`create`, `delete`) avec `logger.info()`
- Exporter un singleton en bas du fichier

---

## 7. Pattern Entity

```typescript
@Entity('nom_table_pluriel')
@Index(['champIndex'])
export class NomEntite {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 100 })
    nomChamp!: string;

    @ManyToOne(() => AutreEntite)
    @JoinColumn({ name: 'autreEntiteId' })
    autreEntite?: AutreEntite;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
```

**Règles entity** :
- PK toujours en `uuid` auto-généré
- Toujours inclure `createdAt` + `updatedAt`
- Noms de champs en **français** `camelCase`
- Déclarer les enums inline avec `enum: [...]` ou référencer un enum existant
- Ajouter `@Index` sur les colonnes fréquemment requêtées

---

## 8. Pattern DTO (Zod)

```typescript
import { z } from 'zod';

export const createXxxSchema = z.object({
    nom: z.string().min(2).max(100),
    description: z.string().optional(),
    // Contraintes avec messages en français si nécessaire
});

export const updateXxxSchema = createXxxSchema.partial().omit({ champImmutable: true });

export type CreateXxxDto = z.infer<typeof createXxxSchema>;
export type UpdateXxxDto = z.infer<typeof updateXxxSchema>;
```

**Règles DTO** :
- `createXxxSchema` = schéma complet obligatoire
- `updateXxxSchema` = `.partial().omit({ ... })` sur le create
- Inférer les types avec `z.infer<typeof schema>`
- Utiliser `z.nativeEnum()` pour les enums TypeScript
- Utiliser `z.string().uuid()` pour les IDs

---

## 9. Réponses API standardisées

**Succès** :
```typescript
// GET (liste ou unité)
res.json({ success: true, data: result });

// POST (création)
res.status(201).json({ success: true, data: created });

// PATCH (mise à jour)
res.json({ success: true, data: updated });

// DELETE (suppression)
res.json({ success: true, message: 'Ressource supprimée' });
```

**Erreur** (gérée par le `errorHandler` global) :
```json
{
    "success": false,
    "error": { "code": "ERROR_CODE", "message": "Message en français" },
    "timestamp": "2025-01-01T00:00:00.000Z",
    "path": "/api/xxx"
}
```

---

## 10. Gestion des erreurs

- Utiliser **exclusivement** `AppError` de `@common/filters/error.filter`
- Signature : `new AppError(message, statusCode, code, isOperational?, details?)`
- Codes HTTP : `400` validation, `401` auth, `403` autorisation, `404` not found, `409` conflit, `500` serveur
- Erreurs prédéfinies disponibles dans `Errors.NOT_FOUND`, `Errors.UNAUTHORIZED`, etc.
- Ne **jamais** catcher silencieusement une erreur — toujours `next(error)` ou `throw`

---

## 11. Authentification et autorisation

- **Authentification** : `authMiddleware` extrait le JWT et attache `req.utilisateur = { id, email, role, etablissementId, plane }`
- **Autorisation** : `requireRoles(Role.SUPER_ADMIN, Role.ADMIN, ...)` vérifie le rôle
- Appliquer les deux **par route** (pas de middleware global sur le router)
- Routes publiques : ne pas mettre `authMiddleware` (rares, ex: login, register)
- Rôles disponibles : `SUPER_ADMIN`, `ADMIN`, `CHEF_ETABLISSEMENT`, `ENSEIGNANT`, `PERSONNEL`, `RESPONSABLE_CANTINE`, `RESPONSABLE_TRANSPORT`, `PARENT`, `ELEVE`

### 11.1 Auth Unifiée ADR-005 (v11) — Source unique de vérité

**Architecture** : Un seul flux d'authentification pour tous les utilisateurs (tenant + plateforme). Table `utilisateurs` comme source unique.

**Flux backend (`POST /api/auth/login`) :**
1. Recherche multi-critère dans `utilisateurs` (email, matricule, pseudonyme, QR, UUID)
2. 1 seul `bcrypt.compare` (pas de fallback vers une autre table)
3. Si `mfaActif=true` → retourne `mfaToken` temporaire (5 min)
4. Si `estPlateforme && isRolePlateforme(role)` → génère aussi les tokens plateforme

**Réponse (`LoginResponseDto`) :**
```typescript
{
  // Tokens tenant (flux normal)
  accessToken?: string;
  refreshToken?: string;
  utilisateur?: {...};
  
  // MFA unifié (tenant + plateforme)
  mfaRequired?: boolean;
  mfaToken?: string;
  
  // ADR-005 : Accès plateforme détecté automatiquement
  hasPlatformAccess?: boolean;
  platformAccessToken?: string;
  platformRefreshToken?: string;
  platformRole?: string;  // ex: PLATEFORME_SUPER_ADMIN
}
```

**Comportements frontend :**
- **MFA requis** (`mfaRequired`) → redirect `/mfa-verify` (un seul flux)
- **Tenant pur** → flux normal (sélection établissement ou dashboard)
- **Tenant + Plateforme** → tokens tenant + tokens plateforme dans la même réponse

**Détection plateforme :**
- `utilisateur.estPlateforme = true` ET `isRolePlateforme(utilisateur.role)` → accès Control Plane
- Rôles plateforme : `PLATEFORME_SUPER_ADMIN`, `PLATEFORME_ADMIN`, `PLATEFORME_SUPPORT`, `PLATEFORME_BILLING`, `PLATEFORME_ANALYST`, `PLATEFORME_AUDITOR`

**JWT claims :**
- `plane: 'platform'` pour les tokens plateforme
- `plane: 'tenant'` (ou absent) pour les tokens tenant
- Un seul `JWT_SECRET` (configurable via env)

**Middlewares :**
- `platformAuthMiddleware` : vérifie JWT + `plane: 'platform'` dans les claims
- `dualCaslMiddleware` : `defineAbility()` unifié pour les deux contextes
- `scopeDiscriminationMiddleware` : discrimination automatique Control/Data Plane

**Tables supprimées (ADR-005) :** `identites`, `utilisateurs_plateforme`, `memberships`, `permissions_plateforme`, `mfa_configs`, `sessions_plateforme`

---

## 12. Enregistrement d'un nouveau module

Un module doit être enregistré à **3 endroits** :

1. **`backend/src/modules/index.ts`** — Ajouter `export * from './<module>';` dans la bonne catégorie
2. **`backend/src/app.ts`** — Importer le controller et monter : `app.use('/api/<route>', xxxController);`
3. **`shared/src/enums/modules.enum.ts`** — Ajouter l'entrée dans `ModuleName` et le mapping `MODULE_CATEGORIES`

Les entités sont **auto-découvertes** par TypeORM via le glob pattern `modules/**/entities/*.entity.ts` — aucune inscription manuelle dans `data-source.ts`.

---

## 13. Règles TypeScript strictes

- `strict: true` activé — pas de `any` implicite
- `any` autorisé uniquement pour le helper `validate(schema: any, data: unknown): any`
- Types de retour explicites sur les méthodes de service (`Promise<Entity>`)
- Utiliser `readonly` quand applicable
- Préférer `const` > `let` > jamais `var`
- Utiliser les template literals au lieu de la concaténation

---

## 14. Anti-patterns à éviter

- **NE PAS** créer de route sans `authMiddleware` sauf si explicitement publique
- **NE PAS** bypasser le `errorHandler` global avec des `res.status(500).json(...)` directs
- **NE PAS** importer directement depuis un sous-dossier d'un autre module (utiliser le barrel `@modules/xxx`)
- **NE PAS** dupliquer la logique métier dans le controller (tout va dans le service)
- **NE PAS** utiliser `express-validator` — la validation se fait **uniquement** avec Zod
- **NE PAS** créer de migration TypeORM manuelle — utiliser `migration:generate`
- **NE PAS** commit de secrets dans `.env` — toujours documenter dans `.env.example`
- **NE PAS** oublier que le frontend est ultra-responsif (100px-2560px) — structurer les API responses en conséquence (pagination, select partiel, etc.)

### 14.1 Anti-patterns sécurité & configuration (v7.1)

- **NE JAMAIS** bypasser le middleware RLS (`rls.middleware.ts`) — aucun code ne doit contourner `SET LOCAL app.current_tenant`. Le SUPER_ADMIN bypass via UUID sentinelle `00000000-0000-0000-0000-000000000000` est le seul autorisé. Les tokens plateforme (`plane='platform'`) sont REJETÉS par le middleware RLS (isolation structurelle).
- **NE JAMAIS** stocker des paramètres applicatifs dans `.env` — seuls les secrets d'infrastructure y sont autorisés (DB credentials, JWT secrets, Redis, encryption key, SMTP, providers paiement). Les paramètres runtime (nom app, langue, devise, thème, etc.) vont dans `ParametreSysteme`.
- **NE JAMAIS** modifier ou recréer `ConfigurationApp` — cette entité a été supprimée (v3.0, confirmé v7.1). `ParametreSysteme` est la source unique de vérité pour tous les paramètres runtime. Toute référence active à ConfigurationApp est une erreur (seuls les commentaires historiques et migrations anciennes sont tolérés).
- **NE JAMAIS** utiliser un cache in-memory sans TTL — chaque cache Map doit avoir un TTL (défaut : 60s pour config, 5 min pour feature flags). Vérifier `Date.now() - timestamp < CACHE_TTL` avant chaque lecture. Les caches Redis ont aussi un TTL explicite via `redisService.setJSON(key, value, ttlSec)`.
- **NE JAMAIS** désactiver un module CRITIQUE — les modules `auth`, `utilisateurs`, `configuration`, `notifications` sont toujours accessibles (bypass dans `module-active.middleware.ts`). Le service `configuration.service.ts` bloque aussi la désactivation via `categorie === 'CRITIQUE'` du catalogue DB.

---

## 15. Cohérence de la logique métier

Avant toute modification impactant la logique métier, **toujours** consulter le skill `elisaschool-business-logic` pour comprendre :

- Les **règles métier** existantes (unicité, protection suppression, workflows)
- Les **dépendances entre modules** (cascade notes → bulletins, config → tous)
- Les **paramètres de configuration** qui pilotent le comportement
- Le **multi-tenancy** (etablissementId) et son impact sur les requêtes
- Le **cache** (TTL, invalidation) et les événements (EventEmitter)

**Règle d'or** : Ne jamais modifier un service sans avoir lu le service en entier et tracé ses imports croisés.

---

## 16. Système de Backup

### Architecture

- **Storage abstraction** : Interface `IBackupStorage` extensible (DB, S3, FileSystem)
- **Services** : `ConfigBackupService` (config), `DatabaseBackupService` (DB)
- **Entities** : `BackupRecord` (métadonnées), `ParametreVersion` (historique)
- **DTOs** : 9 schémas Zod pour validation complète

### Conventions Backup

- **Nommage versions** : `v{major}.{minor}.{patch}-{scope}-{timestamp}`
- **Chiffrement** : AES-256-GCM avec IV unique (16 bytes random)
- **Checksum** : SHA-256 sur données compressées/chiffrées
- **Compression** : gzip (60-80% réduction)
- **Soft delete** : Toujours utiliser `@DeleteDateColumn()` pour récupération

### Sécurité

- Clé chiffrement dans `.env` : `BACKUP_ENCRYPTION_KEY` (>= 32 caractères)
- Jamais de clé en dur dans le code
- RBAC : ADMIN/SUPER_ADMIN pour créer/restaurer/supprimer
- Multi-tenant : Isolation stricte par `etablissement_id`

### Pattern Storage Provider

```typescript
// Interface commune
interface IBackupStorage {
    readonly name: string;
    save(data: Buffer, metadata: BackupMetadata): Promise<BackupRecord>;
    load(recordId: string): Promise<Buffer>;
    delete(recordId: string): Promise<void>;
    // ...
}

// Utilisation
const storage = new DatabaseStorageProvider();
await storage.save(buffer, metadata);
```

### Bonnes pratiques

- **Toujours** vérifier l'intégrité avant restauration
- **Toujours** chiffrer en production (`encrypt: true`)
- **Préférer** les backups différentiels pour config
- **Configurer** retentionDays selon type (30/90/180 jours)

---

## 17. Système de Validation Workflow

### Architecture

- **Service central** : `validationWorkflowService` gère les niveaux d'approbation multi-niveaux
- **Middleware** : `requireValidation()` intercepte les opérations nécessitant validation
- **Entités** : Chaque module workflow a un `enum StatutXxx` avec `EN_ATTENTE_VALIDATION` et variantes
- **Configuration** : Paramètres dynamiques `{module}.require_validation`, `{module}.validation_levels`, `{module}.validation_roles`
- **RBAC** : Permissions `validation:{module}:level{N}` attribuées aux rôles de validation
- **Dashboard** : Endpoint `/api/validation-workflow/dashboard` agrège tous les modules (15 au total)

### Conventions

- **Nommage statut** : `EN_ATTENTE_VALIDATION` (création), `EN_ATTENTE_CLOTURE` (clôture), `EN_ATTENTE_DESACTIVATION` (désactivation)
- **Type colonne** : Toujours `varchar(30)` (pas d'enum PostgreSQL natif) pour supporter l'ajout de valeurs
- **Service** : `create()` accepte `(dto, createurId?, etablissementId?)` et crée un workflow si `requireValidation` est `true`
- **Controller** : Toujours passer `req.utilisateur?.id` comme `createurId`
- **Migration** : SQL idempotente (`ON CONFLICT DO NOTHING`, `ADD COLUMN IF NOT EXISTS`, `NOT EXISTS` pour attributions)
- **Index** : Toujours indexer la colonne `statut` pour les requêtes de dashboard

### Pattern d'intégration

```typescript
// 1. Entity : ajouter enum Statut + colonne varchar
@Column({ type: 'varchar', length: 30, default: StatutXxx.ACTIF })
statut!: StatutXxx;

// 2. Service : validation conditionnelle
async create(dto: CreateXxxDto, createurId?: string, etablissementId?: string): Promise<Xxx> {
    const requireValidation = await getParamBoolean('xxx.require_validation', false);
    const xxx = this.repo.create({
        ...dto,
        statut: requireValidation ? StatutXxx.EN_ATTENTE_VALIDATION : StatutXxx.ACTIF,
    });
    await this.repo.save(xxx);
    if (requireValidation && createurId) {
        await validationWorkflowService.createWorkflow({
            module: 'xxx', entiteId: xxx.id, entiteType: 'Xxx',
            niveauxRequis: 2, etablissementId,
        }, createurId);
    }
    return xxx;
}

// 3. Controller : passer createurId
const created = await service.create(dto, req.utilisateur?.id, req.etablissementId);

// 4. Config seed : 3 paramètres
{ cle: 'xxx.require_validation', valeur: false, ... },
{ cle: 'xxx.validation_levels', valeur: 2, ... },
{ cle: 'xxx.validation_roles', valeur: JSON.stringify({ '1': 'ROLE_1', '2': 'ROLE_2' }), ... },

// 5. RBAC : permissions dans roles.enum.ts
VALIDATION_XXX_LEVEL1 = 'validation:xxx:level1',
VALIDATION_XXX_LEVEL2 = 'validation:xxx:level2',

// 6. Workflow service + middleware : ajouter au getDefaultRoles()
xxx: { '1': 'ROLE_1', '2': 'ROLE_2' },

// 7. Migration SQL : permissions + colonne statut + index
```

### Modules couverts (15)

`notes`, `bulletins`, `cantine`, `transport`, `requetes`, `classes`, `matieres`, `periodes`, `eleves`, `personnel`, `clubs`, `materiel`, `cartes`, `annees_scolaires`, `etablissement`

---

## 18. Performance et Optimisation

### 18.1 Base de données — Index et Requêtes

**Index stratégiques :**
```typescript
// ✅ TOUJOURS indexer les colonnes de filtrage et relations
@Entity('eleves')
@Index(['etablissementId'])
@Index(['classeId', 'anneeScolaireId'])  // Index composite pour requêtes combinées
@Index(['matricule'], { unique: true })   // Index unique pour unicité
export class Eleve { ... }
```

**Règles d'index :**
- Index sur **toutes les FK** (`etablissementId`, `classeId`, etc.)
- Index composites pour requêtes multi-colonnes fréquentes
- Index unique pour contraintes d'unicité (matricule, email, etc.)
- Index sur `createdAt` pour tri chronologique

**Optimisation des requêtes :**
```typescript
// ✅ SÉLECTIF — Ne charger que les relations nécessaires
const eleves = await repo.find({
    where: { etablissementId },
    relations: ['classe'],  // PAS ['classe', 'notes', 'bulletins', ...]
    select: ['id', 'nom', 'prenom', 'matricule'],  // Colonnes spécifiques
    order: { createdAt: 'DESC' },
    take: 50,  // TOUJOURS limiter
    skip: offset
});

// ❌ ÉVITER — Select * avec toutes les relations
const eleves = await repo.find({
    where: { etablissementId },
    relations: ['classe', 'notes', 'bulletins', 'utilisateur', 'parent']
});
```

### 18.2 Cache — Stratégie et Invalidation

**Pattern de cache (TTL 5 min) :**
```typescript
private cache = new Map<string, { value: any; timestamp: number }>();
private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async getParametre(cle: string, etablissementId?: string): Promise<any> {
    const cacheKey = etablissementId ? `${cle}:${etablissementId}` : cle;
    
    // 1. Vérifier cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.value;
    }
    
    // 2. Cache miss → DB
    const value = await this.repo.findOne({ where: { cle, etablissementId } });
    
    // 3. Mettre en cache
    this.cache.set(cacheKey, { value, timestamp: Date.now() });
    return value;
}

// Invalidation SÉLECTIVE après modification
invalidateCache(type?: 'app' | 'modules' | 'parametres'): void {
    if (!type || type === 'parametres') this.cache.clear();
}
```

**Règles de cache :**
- **TTL** : 5 min pour config, 1 min pour données volatiles
- **Clés composées** : `"cle:etablissementId"` pour multi-tenant
- **Invalidation** : TOUJOURS invalider après write (create/update/delete)
- **Mémoire** : In-memory Map pour petit dataset (<1000 entrées)

### 18.3 Pagination — Offset + Limit

**TOUJOURS paginer les listes :**
```typescript
// Controller
router.get('/', async (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100); // Max 100
    const offset = (page - 1) * limit;
    
    const [data, total] = await service.findPaginated({ limit, offset });
    
    res.json({
        success: true,
        data,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNext: page * limit < total,
            hasPrev: page > 1
        }
    });
});

// Service
async findPaginated({ limit, offset, where }: any) {
    return this.repo.findAndCount({
        where,
        order: { createdAt: 'DESC' },
        take: limit,
        skip: offset
    });
}
```

### 18.4 Transactions — Atomicité et Performance

**Utiliser les transactions pour les opérations multi-entités :**
```typescript
async createEleveWithUser(dto: CreateEleveDto): Promise<Eleve> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    try {
        // 1. Créer utilisateur
        const user = await queryRunner.manager.save(Utilisateur, userData);
        
        // 2. Créer élève
        const eleve = await queryRunner.manager.save(Eleve, {
            ...dto,
            utilisateurId: user.id
        });
        
        await queryRunner.commitTransaction();
        return eleve;
    } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
    } finally {
        await queryRunner.release();  // TOUJOURS libérer
    }
}
```

**Règles de transaction :**
- TOUJOURS utiliser `try/catch/finally`
- TOUJOURS `release()` dans `finally`
- ROLLBACK automatique en cas d'erreur
- Garder les transactions COURTES (<1s)

### 18.5 Anti-patterns de Performance

**❌ À ÉVITER :**
```typescript
// N+1 Query Problem
const eleves = await repo.find();
for (const eleve of eleves) {
    eleve.notes = await notesRepo.find({ where: { eleveId: eleve.id } });
}

// ✅ CORRIGER — Charger en une seule requête
const eleves = await repo.find({ relations: ['notes'] });

// ❌ Select *
const data = await repo.find();

// ✅ Colonnes spécifiques
const data = await repo.find({ select: ['id', 'nom', 'prenom'] });

// ❌ Sans limite
const all = await repo.find();

// ✅ Toujours limiter
const data = await repo.find({ take: 100 });
```

### 18.6 Monitoring — Métriques Clés

**Endpoints à monitorer :**
- Temps de réponse > 500ms (alerte)
- Taux d'erreur > 5% (critique)
- Cache hit ratio < 80% (optimiser)
- DB connections > 80% du pool (scale)

**Logs structurés :**
```typescript
logger.info('Requête exécutée', {
    endpoint: req.path,
    duration: Date.now() - startTime,
    cacheHit: false,
    etablissementId: req.etablissementId
});
```

---

## 19. Module Sondages — Système de Sondage Complet

### Architecture

Le module Sondages permet la création et la gestion de sondages avec :
- **Templates réutilisables** : Sondages prédéfinis par catégorie (satisfaction, évaluation, consultation)
- **Multi-destinataires** : Envoi individuel ou en masse (max 500 destinataires)
- **Vote sécurisé** : Unique ou multiple, anonyme ou nominatif
- **Sondages programmés** : Différation avec `dateProgrammation`
- **Sondages récurrents** : Création automatique d'occurrences (quotidien, hebdomadaire, mensuel)
- **Analyses en temps réel** : Statistiques, taux de participation, répartition des votes
- **Export multi-format** : CSV (données brutes), PDF/HTML (graphiques visuels)
- **Notifications temps réel** : WebSocket pour alertes instantanées
- **Cron jobs** : Automatisation (fermeture expirés, activation programmés, création récurrents, rappel)

### Entités TypeORM (4)

- **TemplateSondage** : Modèles prédéfinis avec question, options, paramètres, catégorie
- **Sondage** : Sondage actif avec question, statut, options, destinataires, votes, récurrence
- **SondageOption** : Options de réponse pour un sondage (texte, ordre, nombre de votes)
- **Vote** : Vote d'un utilisateur sur une option (unicité utilisateur+sondage, anonymat supporté)

### Enums

```typescript
export enum StatutSondage {
    ACTIF = 'actif',
    TERMINE = 'termine',
    BROUILLON = 'brouillon',
    PROGRAMME = 'programme',
}
```

### Services

| Service | Fichier | Rôle |
|---------|---------|------|
| **SondageService** | `sondages/services/sondage.service.ts` | CRUD sondages, votes, analyses, notifications |
| **SondagePdfService** | `sondages/services/sondage.pdf.ts` | Export PDF/HTML avec graphiques |
| **SondageWebSocketService** | `sondages/services/sondage.websocket.ts` | Broadcast temps réel via WebSocket |

### Cron Jobs (4)

| Job | Schedule | Action |
|-----|----------|--------|
| **Fermer sondages expirés** | `*/10 * * * *` (toutes les 10min) | Passer à `termine` si `dateLimite` passée |
| **Activer sondages programmés** | `*/10 * * * *` (toutes les 10min) | Passer à `actif` si `dateProgrammation` <= maintenant |
| **Créer occurrences récurrentes** | `0 1 * * *` (1h/jour) | Générer nouvelles occurrences pour sondages récurrents |
| **Rappel sondages actifs** | `0 9 * * 1-5` (9h/semaine) | Rappeler les sondages avec faible participation |

### Permissions RBAC (7)

```typescript
SONDAGES_CREATE = 'sondages:create',
SONDAGES_VOTE = 'sondages:vote',
SONDAGES_ANALYZE = 'sondages:analyze',
SONDAGES_VIEW = 'sondages:view',
SONDAGES_EDIT = 'sondages:edit',
SONDAGES_DELETE = 'sondages:delete',
SONDAGES_TEMPLATES_MANAGE = 'sondages:templates:manage',
```

### API REST (18 routes)

```bash
# Templates
GET    /api/sondages/templates                 # Lister templates
POST   /api/sondages/templates                 # Créer template (ADMIN)

# Sondages
GET    /api/sondages                           # Lister mes sondages
POST   /api/sondages                           # Créer sondage
GET    /api/sondages/:id                       # Détail sondage
PATCH  /api/sondages/:id                       # Modifier sondage
DELETE /api/sondages/:id                       # Supprimer sondage
POST   /api/sondages/:id/activer               # Activer sondage
POST   /api/sondages/:id/terminer              # Terminer sondage

# Votes
POST   /api/sondages/:id/voter                 # Voter (destinataire)
GET    /api/sondages/:id/votes                 # Lister votes (auteur)

# Analyses
GET    /api/sondages/:id/analyses              # Statistiques complètes
GET    /api/sondages/:id/analyses/export       # Export CSV/PDF
GET    /api/sondages/:id/analyses/repartition  # Répartition des votes
```

### Pattern d'Intégration

**Création de sondage avec notifications et WebSocket** :
```typescript
async createSondage(dto: CreerSondageDto, auteurId: string, etablissementId: string): Promise<Sondage> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
        // 1. Créer sondage + options (transaction)
        const sondage = this.sondageRepo.create({ ...dto, auteurId, etablissementId });
        await queryRunner.manager.save(sondage);
        
        const options = dto.options.map((opt, index) =>
            this.optionRepo.create({ ...opt, sondageId: sondage.id })
        );
        await queryRunner.manager.save(options);
        
        await queryRunner.commitTransaction();

        // 2. Notifications NON-BLOQUANTES
        if (!isScheduled) {
            try {
                await this.envoyerNotificationsSondage(sondage, dto.destinataires.utilisateur_ids);
                sondageWebSocketService.broadcastSondageActive(sondage.id, dto.destinataires.utilisateur_ids);
            } catch (error) {
                logger.warn(`[Sondage] Échec envoi notifications (non bloquant)`, error);
            }
        }

        return sondage;
    } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
    } finally {
        await queryRunner.release();
    }
}
```

### Points Clés

1. **Multi-tenancy strict** : Toutes les opérations sont filtrées par `etablissementId`
2. **Templates système** : Visibilité `systeme` avec `estTemplateSysteme = true` (non supprimables)
3. **Vote unique** : Un utilisateur ne peut voter qu'une fois par sondage (sauf `choixMultiple`)
4. **Anonymat** : Si `estAnonyme = true`, le vote ne stocke pas l'ID utilisateur visible
5. **Récurrence** : `sondageParentId` lie les occurrences au sondage parent
6. **Export** : CSV pour données brutes, PDF/HTML pour visualisation avec graphiques CSS
7. **WebSocket** : Service prêt pour Socket.IO (interface TypeScript sans dépendance externe)

### Fichiers de Référence

- **Entités** : `backend/src/modules/sondages/entities/sondage.entity.ts`
- **DTOs** : `backend/src/modules/sondages/dto/sondage.dto.ts` (9 schémas Zod)
- **Service** : `backend/src/modules/sondages/services/sondage.service.ts` (566 lignes)
- **Controller** : `backend/src/modules/sondages/controllers/sondages.controller.ts` (368 lignes, 18 routes)
- **Cron Jobs** : `backend/src/modules/sondages/cron-jobs.ts` (230 lignes, 4 tâches)
- **Export PDF** : `backend/src/modules/sondages/services/sondage.pdf.ts`
- **WebSocket** : `backend/src/modules/sondages/services/sondage.websocket.ts`
- **Migration** : `backend/database/migrations/041-module-sondages.sql` (tables + seeds)
- **Migration récurrents** : `backend/database/migrations/042-sondages-recurrents.sql`
- **Déploiement** : `scripts/deploy-sondages.sh` (script automatisé)

---

## 20. Intégration de Notifications dans les Services Métier

### Pattern d'Intégration Non-Bloquante

**Règle d'or** : Les notifications doivent TOUJOURS être non-bloquantes pour ne pas impacter la logique métier.

```typescript
// ✅ CORRECT — Try/catch autour de chaque notification
try {
    await notificationTemplates.nouvelleNote({
        destinataireId: responsableId,
        etablissementId,
        metadata: { noteId: note.id, eleveId: eleve.id },
    }, {
        eleveNom: `Élève ${eleve.id.substring(0, 8)}`,
        matiere: matiere?.nom || 'Matière',
        note: createDto.valeur,
    });
} catch (error) {
    logger.warn(`[Notes] Échec notification (non bloquant)`, error);
}
```

### Accès aux Responsables d'un Élève

L'entité `Eleve` n'a **PAS** de relation directe `responsables`. Utiliser la table de jointure :

```typescript
// ✅ CORRECT — Via table ResponsableEleve
const responsableRepo = AppDataSource.getRepository('ResponsableEleve');
const responsabilités = await responsableRepo.find({
    where: { enfantId: eleve.utilisateurId }  // ← enfantId = utilisateurId du parent
}) as any[];

for (const resp of responsabilités) {
    await notificationTemplates.xxx({
        destinataireId: resp.utilisateurId,  // ← ID du responsable
        ...
    });
}
```

### Template de Notification — Variables

**Vérifier la signature du template** avant utilisation :

```typescript
// Template définit ces variables :
async retardBus(context, variables: {
    ligne: string;      // ← PAS ligneNom
    retard: number;     // ← PAS minutesRetard
    raison?: string;
})

// ✅ Appel correct
await notificationTemplates.retardBus(context, {
    ligne: ligne.nom,
    retard: minutesRetard,
});
```

---

## 21. Bonnes Pratiques TypeScript Strictes

### Types Littéraux avec `as const`

Quand un DTO attend un type littéral (`'ASC' | 'DESC'`), TOUJOURS utiliser `as const` :

```typescript
// ❌ INCORRECT — Type: string (erreur TS2345)
sortOrder: 'DESC'

// ✅ CORRECT — Type: 'DESC' (literal type)
sortOrder: 'DESC' as const
```

### DTO Complet pour les Services Paginés

**TOUJOURS** passer un objet DTO complet aux services :

```typescript
// ❌ INCORRECT — Paramètres séparés
const result = await service.findAll(fonctionId, etablissementId);

// ✅ CORRECT — Objet DTO complet
const result = await service.findAll({
    page: 1,
    limit: 100,
    sortBy: 'createdAt',
    sortOrder: 'DESC' as const,  // ← IMPORTANT: as const
    fonctionId
}, etablissementId);
```

### Déclaration de Variables avant Utilisation

Toujours déclarer une variable avant de l'utiliser :

```typescript
// ✅ CORRECT
const cacheKey = `batch:${periodKey}:${ids.join(',')}`;  // Déclaration
const cachedData = this.batchCache.get(cacheKey);        // Utilisation

// ❌ INCORRECT — Variable utilisée avant déclaration
const cachedData = this.batchCache.get(cacheKey);  // ← cacheKey n'existe pas
const cacheKey = `batch:${periodKey}:${ids.join(',')}`;
```

### Cast Double pour Types Incompatibles

Quand TypeScript refuse un cast direct, utiliser un cast via `unknown` :

```typescript
// ❌ Refusé par TypeScript
value as Map<string, number>

// ✅ Accepté — Double cast
value as unknown as Map<string, number>
```

---

## 22. Système d'Activation des Modules (v4.0 — migration 200)

### Architecture — EntitlementService (source unique de vérité)

**Refonte SaaS — Unification Modules (migration 200)**

Le système de gating des modules est unifié autour de **EntitlementService** (`backend/src/modules/billing/services/entitlement.service.ts`).
Il remplace les 3 registres divergents (ModuleRegistryService supprimé, ModuleResolutionService cascade propre, ConfigurationService cascade propre).

**Cascade de résolution EntitlementService :**

| Priorité | Source | Description |
|----------|--------|-------------|
| 0 | Module CRITIQUE (code) | Bypass total — toujours accessible |
| 1 | Catalogue DB (`modules_catalogue`) | Module actif ? Existe ? |
| 2 | Catégorie CRITIQUE | Bypass total — toujours accessible |
| 3 | Abonnement ACTIF | Sans plan ACTIF → blocage |
| 4 | Plan (`modulesInclus`) | Le plan inclut-il le module ? |
| 5 | Override groupe (`ModulesGroupe`) | Activation/désactivation au niveau groupe |
| 6 | Supplément (`AbonnementModule`) | Add-on souscrit ? |
| 7 | Plan minimal requis | Rang du plan vs plan minimal du module |
| 8 | Catalogue défaut (`actifParDefaut`) | Dernier fallback |

**Modules critiques bypass** : `auth`, `utilisateurs`, `configuration`, `notifications`

### Conventions d'Implémentation

**1. Middleware de Protection (unifié)**

```typescript
// requireModuleActive() utilise EntitlementService (source unique)
app.use('/api/bulletins', requireModuleActive('bulletins'), bulletinsController);

// Modules critiques → EntitlementService retourne accessible: true automatiquement
```

**2. Utilisation directe dans le code**

```typescript
import { entitlementService } from '@modules/billing/services/entitlement.service';

// Check individuel
const result = await entitlementService.check(etablissementId, 'bulletins');
// result: { accessible, visible, raison, message, source, planMinimalRequis, planActuel }

// Check batch (tous les modules)
const all = await entitlementService.checkAll(etablissementId);

// Boolean rapide
const ok = await entitlementService.isAccessible(etablissementId, 'bulletins');
```

**3. configurationService.isModuleActive() — cascade unifiée**

```
Priorité 1 : ParametreSysteme scopé établissement (override)
Priorité 2 : ParametreSysteme global (fallback)
Priorité 3 : moduleResolutionService.isModuleActive() (catalogue DB + cascade)
Priorité 4 : Catalogue DB actifParDefaut (fallback global sans etablissementId)
```

**4. API REST enrichie**

`GET /api/configuration/modules/registry` retourne maintenant :
```typescript
{
    name, label, description, icon, category, actif,
    estAccessible: boolean,    // gating entitlement
    estVisible: boolean,       // visible dans le catalogue
    raisonBlocage: string,     // ABONNEMENT_INACTIF | PLAN_INSUFFICIENT | MODULE_DESACTIVE | etc.
    messageBlocage: string,    // message explicatif pour le frontend
}
```

**5. Frontend — UI gating**

- `ModulesTab.tsx` : modules non accessibles → cadenas + badge "Plan requis" + toggle grisé + CTA "Upgrader"
- `CatalogueTab.tsx` / `ModuleCard.tsx` : même logique via `estAccessible` et `raisonBlocage`
- `ModuleState` type inclut les champs entitlement

### Bonnes Pratiques

- **TOUJOURS** utiliser `entitlementService.check()` pour le gating (source unique)
- **TOUJOURS** utiliser `entitlementService.invalidate()` après modification abonnement/plan
- **JAMAIS** réintroduire de registre hardcoded (ModuleRegistryService supprimé)
- **TOUJOURS** ajouter les nouveaux modules dans `modules_catalogue` (table DB) + seed idempotent
- **VÉRIFIER** les dépendances avant d'activer un module
- **EXCLURE** les modules critiques du gating (bypass automatique)

### Sécurité

- **RBAC** : Seuls `ADMIN` et `SUPER_ADMIN` peuvent toggler les modules
- **Permission** : `config:module:toggle` requise
- **Audit** : Toutes les actions sont loguées avec utilisateur et timestamp
- **Multi-tenant** : Isolation stricte par `etablissementId`
- **Cache** : Redis TTL 60s + Pub/Sub cross-instance + in-memory fallback

### Pattern d'Intégration d'un Nouveau Module

```typescript
// 1. Ajouter dans modules_catalogue (migration SQL ou seed)
INSERT INTO modules_catalogue (code, nom, categorie, plan_minimal, dependencies, ...)

// 2. Appliquer le middleware (app.ts)
app.use('/api/mon-module', requireModuleActive('mon-module'), monModuleController);

// 3. EntitlementService résout automatiquement via le catalogue DB
```

---

## 23. Modals Frontend — Système Unifié (CustomModal)

### Architecture

Tous les modals d'eLISAschool utilisent le système unifié basé sur :
- **Hook `useModalWindow`** (`frontend/src/hooks/use-modal-window.ts`) : fournit drag, resize (8 directions), minimize, maximize
- **Composant `CustomModal`** (`frontend/src/components/modals/CustomModal.tsx`) : composant central basé sur Radix UI Dialog + useModalWindow
- **Composant `ConfirmationModal`** (`frontend/src/components/ui/ConfirmationModal.tsx`) : wrapper spécialisé pour confirmations
- **Composant `ConfirmDialog`** (`frontend/src/components/modals/ConfirmDialog.tsx`) : wrapper léger

### Règle Fondamentale

**TOUJOURS** utiliser `<CustomModal>` pour créer ou refactoriser un modal. **JAMAIS** d'overlay custom (`fixed inset-0 bg-black/50`).

### Props de CustomModal

```typescript
interface CustomModalProps {
    open: boolean;                          // État ouvert/fermé
    onOpenChange: (open: boolean) => void;  // Callback fermeture
    title?: string;                         // Titre du header
    description?: string;                   // Sous-titre
    children: ReactNode;                    // Contenu
    size?: 'sm'|'md'|'lg'|'xl'|'2xl'|'3xl'|'full';  // Taille prédéfinie
    showClose?: boolean;                    // Bouton X (défaut: true)
    closeOnOverlayClick?: boolean;          // Fermer au clic overlay (défaut: true)
    footer?: ReactNode;                     // Pied de page (boutons)
    draggable?: boolean;                    // Déplaçable (défaut: true)
    resizable?: boolean;                    // Redimensionnable (défaut: true)
    minimizable?: boolean;                  // Minimisable (défaut: true)
    maximizable?: boolean;                  // Maximisable (défaut: true)
    initialWidth?: number;                  // Largeur initiale px
    initialHeight?: number;                 // Hauteur initiale px
}
```

### Mapping Taille → Largeur

| Size | Largeur | Min-Width | Usage |
|------|---------|-----------|-------|
| `sm` | 384px | 280px | Confirmations simples |
| `md` | 448px | 320px | Formulaires courts |
| `lg` | 512px | 360px | Formulaires moyens |
| `xl` | 576px | 400px | Formulaires complexes |
| `2xl` | 672px | 400px | Modals multi-sections |
| `3xl` | 768px | 400px | Modals larges (tableaux, détails) |
| `full` | viewport-40 | 400px | Plein écran |

### Pattern Standard d'Utilisation

```tsx
// ✅ CORRECT — Modal de formulaire
<CustomModal
    open={open}
    onOpenChange={(v) => { if (!v) onClose(); }}
    title="Créer un élément"
    description="Remplissez les informations ci-dessous"
    size="2xl"
    footer={<>
        <ElisaButton variant="outline" onClick={onClose}>Annuler</ElisaButton>
        <ElisaButton variant="primary" onClick={handleSubmit} icon={<Save className="h-4 w-4" />}>
            Enregistrer
        </ElisaButton>
    </>}
>
    <form>{/* contenu */}</form>
</CustomModal>

// ✅ CORRECT — Modal de confirmation (via ConfirmationModal)
<ConfirmationModal
    isOpen={open}
    title="Confirmer la suppression"
    message="Êtes-vous sûr de vouloir supprimer cet élément ?"
    confirmLabel="Supprimer"
    variant="danger"
    onConfirm={handleDelete}
    onCancel={onClose}
/>

// ❌ INTERDIT — Overlay custom
<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
    <div className="bg-white rounded-xl">...</div>
</div>
```

### Exceptions

Les modals **spécialisés** (caméra QR scanner, video player) peuvent utiliser `CustomModal` avec `draggable={false}` et `resizable={false}` si les capacités avancées ne sont pas pertinentes.

### Fichiers de Référence

- **Hook** : `frontend/src/hooks/use-modal-window.ts` (342 lignes)
- **Composant** : `frontend/src/components/modals/CustomModal.tsx` (256 lignes)
- **Confirmation** : `frontend/src/components/ui/ConfirmationModal.tsx`
- **Barrel** : `frontend/src/components/modals/index.ts`
- **Hooks barrel** : `frontend/src/hooks/index.ts`

### Composants interdits dans les Modals

**JAMAIS** utiliser `<input type="color">` natif dans un CustomModal. Le dialogue OS est bloqué par le focus trap Radix. Utiliser **exclusivement** `ColorPicker` partagé (`components/ui/ColorPicker.tsx` v3.0) — palette 54 couleurs (12 familles), mode compact/extensible, React.memo par swatch, saisie HEX, 60fps, dark mode, responsive.

---

## 24. Consolidation des Documents

**Règle** : Avant de créer un nouveau document (règle, skill, guide, documentation), **TOUJOURS** :

1. **Vérifier l'existence** de documents traitant du même sujet
2. **Consolider** le contenu dans le document existant si pertinent
3. **Nettoyer** les fichiers redondants ou obsolètes

**Objectif** : Éviter les redondances inutiles et maintenir une documentation concise, compacte et pertinente.

### Anti-patterns

- **NE PAS** créer un nouveau fichier si le sujet existe déjà ailleurs
- **NE PAS** dupliquer des informations entre plusieurs fichiers
- **NE PAS** conserver des versions anciennes après consolidation

### Pattern de Consolidation

```bash
# 1. Chercher les documents existants sur le sujet
grep -r "sujet" .qoder/rules/ .qoder/skills/ docs/

# 2. Identifier les overlaps et redondances
# 3. Fusionner le contenu pertinent dans le fichier principal
# 4. Supprimer les fichiers dupliqués ou obsolètes
```

---

## 24. Conventions de typage et patterns transversaux

### 24.1 Parameter `req` dans les services — Toujours `Request` d'Express

**Règle** : Quand un service accepte `req` pour l'audit, TOUJOURS typer `req?: Request` (import depuis `express`).

```typescript
import { Request } from 'express';

// ✅ CORRECT
async create(dto: CreateDto, userId: string, etablissementId: string, req?: Request): Promise<Entity> {
    await auditService.log({ ... }, req);
}

// ❌ INTERDIT
async create(dto: CreateDto, userId: string, req?: any): Promise<Entity> { ... }
```

### 24.2 Anti-pattern : Mutation de DTO pour les dates

**Règle** : JAMAIS muter un DTO pour forcer un type `Date` dans un champ `string`. Construire un objet séparé.

```typescript
// ❌ INTERDIT — mute le DTO d'entrée
dto.date = new Date(dto.date) as any;
Object.assign(entity, dto);

// ✅ CORRECT — objet séparé mergé
const dateChanges = dto.date ? { date: new Date(dto.date) } : {};
Object.assign(entity, dto, dateChanges);
```

### 24.3 AuditAction — Toujours utiliser l'enum

**Règle** : JAMAIS utiliser une string literal avec `as any` pour les actions d'audit. Toujours référencer `AuditAction`.

```typescript
import { AuditAction } from '@modules/auth/entities/audit-log.entity';

// ✅ CORRECT
await auditService.log({
    action: AuditAction.TYPE_CONTRAT_CREATE,
    ...
});

// ❌ INTERDIT
await auditService.log({
    action: 'TYPE_CONTRAT_CREATE' as any,
    ...
});
```

### 24.4 Soft delete — Convention par type d'entité

**Entités transactionnelles** (opérations métier) → `@DeleteDateColumn()` :
- Personnel : `MembrePersonnel`, `ContratPersonnel`, `AffectationPoste`, `HeureCours`, `AbsencePersonnel`, `EvaluationEnseignant`, `ProgressionProgramme`, `IndisponibiliteEnseignant`
- Paie : `BulletinPaie`, `Cotisation`, `TypePrime`, `TypeRetenue`, `ElementSalaire`
- Organisation : `UniteOrganisationnelle`, `Poste`, `HierarchiePersonnel`

**Entités nomenclature** (référentiels) → PAS de soft delete (hard delete + `estSysteme` protection) :
- `EchelonStructurel`, `NiveauResponsabilite`, `ModeRemunerationEntity`, `Fonction`, `TemplateOrganisation`, `TypeContratPersonnalise`

### 24.5 Casts FindOperator — Pas de `as any` nécessaire

Quand les paramètres de `Between()`, `LessThanOrEqual()`, etc. sont déjà du type `Date`, le cast `as any` est inutile :

```typescript
// ❌ INTERDIT
Between(dateDebut, dateFin) as any

// ✅ CORRECT — les params sont déjà Date
Between(dateDebut, dateFin)
```

---

## 25. Refonte SaaS v5 — Conventions Spécifiques

### Architecture Multi-Tenant v5

- **3 plans de gestion** :
  - **Control Plane** (`_platform/`) — SUPER_ADMIN uniquement
  - **Data Plane Tenant** (`_auth/`) — Administration établissement (ADMIN, DIRECTEUR)
  - **Data Plane User** — Utilisateurs opérationnels (ENSEIGNANT, PARENT, ELEVE, COMPTABLE)

### CASL.js — Authorization Partagée

- **Source de vérité** : `shared/src/casl/abilities.ts` — `defineAbility(ctx)`
- **Types** : `AppAbility`, `Action`, `Subject`, `AbilityContext`
- **Frontend** : `frontend/src/lib/casl/index.tsx` + `AbilityProvider` dans `providers.tsx`
- **Backend** : `backend/src/casl/casl.middleware.ts` injecte `req.ability`
- **RÈGLE** : Toujours utiliser les types du `shared/` — JAMAIS de définition CASL locale

### Row-Level Security (RLS)

- **Toutes les tables** avec `etablissementId` ont RLS activé (migrations 152, 153)
- **Policy** : `"etablissementId"::text = current_setting('app.current_tenant', true)`
- **SUPER_ADMIN bypass** : UUID `00000000-0000-0000-0000-000000000000`
- **Tables exemptées** : etablissements, plans_abonnement, modules_optionnels (globales)
- **RÈGLE** : Le middleware RLS (`rls.middleware.ts`) propage le tenant via AsyncLocalStorage

### Billing Configurable — Cascade

- **Tranches** : établissement → plan → système (`TrancheConfigService`)
- **Feature Flags** : tenant override → plan flags → modules inclus → défaut false (`FeatureFlagService`)
- **Modules** : inclus (plan) + supplémentaires souscrits (`ModuleResolutionService`)
- **Quotas** : `requireQuota(resource, quantity)` middleware — erreur 429 si dépassé

### RBAC v5 — Permissions Plateforme

- **NETWORK_*** : Réservé SUPER_ADMIN (retiré de ADMIN depuis v5.1)
- **config:plateforme:*** : Réservé SUPER_ADMIN
- **config:etablissement:*** : ADMIN, DIRECTEUR
- **RÈGLE** : ADMIN ne peut PAS `manage` Monitoring, GroupeEtablissement, Module toggle

### Fichiers Clés v5

| Fichier | Rôle |
|---------|------|
| `shared/src/casl/abilities.ts` | Définitions CASL par rôle |
| `shared/src/enums/roles.enum.ts` | Permissions RBAC |
| `backend/src/common/middlewares/rls.middleware.ts` | Propagation tenant RLS |
| `backend/src/modules/billing/services/tranche-config.service.ts` | Cascade tranches |
| `backend/src/modules/billing/services/module-resolution.service.ts` | Résolution modules |
| `backend/src/modules/billing/services/feature-flags.service.ts` | Cascade feature flags |
| `backend/src/modules/monitoring/services/` | Metrics, Alerting, NoisyNeighbor |

### Documentation v5

- `docs/guides/GUIDE-SAAS-V5.md` — Architecture globale
- `docs/guides/GUIDE-CONFIGURATION-TRANCHES.md` — Configuration tranches
- `docs/guides/GUIDE-PROVIDERS.md` — Intégration providers

---

## 26. Système de Configuration — Améliorations v7.1 (Audit)

### 26.1 Suppression de ConfigurationApp (R1)

**Entity supprimée** : `ConfigurationApp` (legacy monolithique dépréciée depuis v2.0).

**Fichiers nettoyés** :
- `configuration-app.entity.ts` — SUPPRIMÉ
- `entities/index.ts` — export retiré
- `tenant-isolation.subscriber.ts` — retiré du Set `GLOBAL_ENTITIES`
- `etablissement.service.ts` — import dynamique supprimé
- `config-backup.service.ts` — repo et logique ConfigurationApp retirés
- `configuration-history.service.ts` — `restaurerConfigApp()` supprimé, case APP throw `LEGACY_NOT_SUPPORTED`

**Règle** : `ParametreSysteme` est la **source unique** de vérité pour TOUS les paramètres runtime. `CibleConfiguration.APP` est conservé dans l'enum pour l'historique d'audit mais la restauration legacy n'est pas supportée.

### 26.2 Cache Redis Pub/Sub (R2)

**Pattern** : Invalidation cross-instance du cache via Redis pub/sub.

```typescript
const PUBSUB_CHANNEL = 'config:cache:invalidate';

// Subscription dans le constructor
redisService.subscribe(PUBSUB_CHANNEL, (message) => {
    if (!type || type === 'modules') this.cache.modules.clear();
    if (!type || type === 'parametres') this.cache.parametres.clear();
});

// Publication dans invalidateCache()
redisService.publish(PUBSUB_CHANNEL, { type });
```

**Règles** :
- **TOUJOURS** publier sur le canal pub/sub après invalidation locale
- **Silencieux** en cas d'échec (mode single-instance fonctionnel sans Redis)
- **Même canal** partagé avec `moduleResolutionService` pour cohérence

### 26.3 Type ENCRYPTED pour Paramètres Sensibles (R3)

**Nouveau type** : `TypeValeurParametre.ENCRYPTED` — chiffrement AES-256-GCM automatique.

```typescript
// Enum
export enum TypeValeurParametre {
    STRING = 'STRING', NUMBER = 'NUMBER', BOOLEAN = 'BOOLEAN',
    JSON = 'JSON', ARRAY = 'ARRAY',
    ENCRYPTED = 'ENCRYPTED', // v7.1 — valeurs chiffrées
}

// Écriture — chiffrement automatique
const valeurSerialisee = typeValeur === TypeValeurParametre.ENCRYPTED
    ? encrypt(JSON.stringify(dto.valeur))
    : JSON.stringify(dto.valeur);

// Lecture — déchiffrement automatique dans parseParametreValue()
if (param.typeValeur === TypeValeurParametre.ENCRYPTED) {
    const decrypted = decrypt(param.valeur);
    return JSON.parse(decrypted);
}
```

**Usage** : Paramètres contenant des credentials, secrets, tokens, clés API.

**Migration** : `178-type-encrypted-parametres.sql` — ajoute `ENCRYPTED` à l'enum PostgreSQL.

**Règles** :
- **JAMAIS** stocker des secrets en clair dans `parametres_systeme`
- **TOUJOURS** utiliser `TypeValeurParametre.ENCRYPTED` pour les valeurs sensibles
- **TOUJOURS** utiliser `encrypt()`/`decrypt()` de `@common/utils/encryption.util`
- La clé de chiffrement vient de `ENCRYPTION_KEY` dans `.env` (min 32 chars)

### Fichiers de Référence v7.1

| Fichier | Rôle |
|---------|------|
| `backend/src/modules/configuration/entities/parametre-systeme.entity.ts` | Enum TypeValeurParametre + ENCRYPTED |
| `backend/src/modules/configuration/services/configuration.service.ts` | Service principal (cache, pub/sub, encrypt/decrypt) |
| `backend/src/modules/configuration/services/configuration-history.service.ts` | Historique (legacy non supporté) |
| `backend/src/common/utils/encryption.util.ts` | AES-256-GCM (encrypt, decrypt) |
| `backend/src/common/services/redis.service.ts` | Redis pub/sub (publish, subscribe) |
| `backend/database/migrations/178-type-encrypted-parametres.sql` | Migration enum ENCRYPTED |

### 26.4 Anti-patterns critiques (audit sécurité)

Ces 5 règles sont **non négociables** — voir aussi section 14.1 :

1. **NE JAMAIS bypasser le middleware RLS** — `rls.middleware.ts` rejette explicitement (403) si aucun contexte tenant. Tokens plateforme interdits sur routes tenant.
2. **NE JAMAIS stocker des paramètres applicatifs dans `.env`** — `.env` = secrets infrastructure uniquement. Runtime → `ParametreSysteme`.
3. **NE JAMAIS modifier/recréer `ConfigurationApp`** — supprimée v3.0. `ParametreSysteme` = source unique.
4. **NE JAMAIS utiliser un cache sans TTL** — défaut 60s (config), 5 min (feature flags). Toujours vérifier `Date.now() - timestamp < CACHE_TTL`.
5. **NE JAMAIS désactiver un module CRITIQUE** — `auth`, `utilisateurs`, `configuration`, `notifications` toujours accessibles (double protection : middleware + service).

---

## 27. Module CMS — Pages Publiques White-Label

### Architecture

Le module CMS permet à chaque établissement de gérer ses pages publiques (site vitrine white-label) :
- **7 entités** : CmsPage, CmsSection, CmsMedia, CmsTheme, CmsMenu, CmsWidget, CmsVersion
- **+1 CmsTemplate** (entité séparée) — 8 templates système
- **18 types de sections** : HERO, TEXTE, GALERIE, CARTE_INFOS, TEMOIGNAGES, CHIFFRES_CLES, EQUIPE, FORMULAIRE, CARTE, VIDEO, TELECHARGEMENTS, ACTUALITES, HORAIRES, PARTENAIRES, FAQ, APPEL_ACTION, SEPARATEUR, HTML_CUSTOM
- **API publique** sans authentification (`/api/public/e/:code/*`)
- **API admin** authentifiée (`/api/cms/*`) avec RBAC + module active check
- **Cache Redis** : TTL 300s (pages), 600s (thèmes), invalidation à chaque mutation
- **Rate limiting** : 60 req/min/IP sur routes publiques
- **RLS PostgreSQL** activé sur les 7 tables CMS
- **Versioning** : Snapshot avant chaque modification, rollback possible
- **Seed démo** : `POST /api/cms/seed-demo` — peuple l'établissement avec contenu riche (médias, actualités, équipe, témoignages). Idempotent.
- **Réinitialisation CMS** : `POST /api/cms/reinitialiser` — supprime tout le contenu CMS (pages, sections, thèmes, menus, widgets) et ré-initialise avec les données de base. Options : `conserverMedias` (défaut: true), `inclureDemo` (défaut: true). Retourne `{ pagesRecreees, sectionsRecreees, mediasCrees }`.
- **Widgets CMS** : 5 types par défaut (RESEAUX_SOCIAUX, CONTACT_RAPIDE, HORAIRES, NEWSLETTER, LIENS_UTILES). Champ données : `contenu` (JSONB, ex-`config`, migration 206).
- **Footer dynamique** : Rend tous les widgets `pied_page` actifs, grille adaptative (2→6 colonnes). Fallback statique si aucun widget.
- **Personnalisation templates** : `personnaliserSections()` remplace les textes génériques par les données réelles de l'établissement lors de l'initialisation.

### Routage Public — Convention `/e/:code`

Les pages publiques établissement utilisent le routing path-based TanStack Router :
- **Accueil** : `/e/$code` → `routes/e.$code.tsx`
- **Page interne** : `/e/$code/$slug` → `routes/e.$code.$slug.tsx`
- **Galerie** : `/e/$code/galerie` → `routes/e.$code.galerie.tsx` (masonry, lightbox, filtres)
- **Contact** : `/e/$code/contact` → `routes/e.$code.contact.tsx` (formulaire + carte OSM)
- **Inscriptions** : `/e/$code/inscriptions` → `routes/e.$code.inscriptions.tsx` (stepper 4 étapes)
- **`code`** = `codeEtablissement` (champ unique sur `Etablissement`)

### Pattern API Publique (Projection Restrictive)

```typescript
// ✅ CORRECT — Projection restrictive (colonnes publiques uniquement)
const COLONNES_PUBLIQUES = [
    'id', 'nom', 'code', 'slogan', 'description', 'logo',
    'couleurPrincipale', 'email', 'telephone', 'adresse',
];
// ❌ INTERDIT — Exposer des champs sensibles
// numeroContribuable, numeroCompteBancaire, siret, etc.
```

### Pattern Cache Redis (Singleton)

```typescript
// ✅ CORRECT — Utiliser le singleton redisService
import { redisService } from '@common/services/redis.service';
const cached = await redisService.get(cacheKey);
await redisService.set(cacheKey, data, ttlSecondes);
await redisService.del(cacheKey);

// ❌ INTERDIT — Instancier RedisService directement
import { RedisService } from ... // Non exporté
const redis = new RedisService(); // NE FONCTIONNE PAS
```

### Exception Auth API Client (Frontend)

Les routes `/api/public/*` sont exemptées d'authentification dans `api-client.ts` :
```typescript
const authRoutes = [
    '/api/auth/login', '/api/auth/register', ...
    '/api/public', // ← Routes publiques CMS (sans auth)
];
```

### Montage Routes (app.ts)

```typescript
// AVANT tenantMiddleware (routes publiques sans auth)
app.use('/api/public', publicEtablissementController);

// APRÈS tenantMiddleware (routes admin avec auth + RBAC)
app.use('/api/cms', authMiddleware, requireModuleActive('cms'), filterByEtablissement(), cmsController);
```

### Permissions RBAC CMS (18)

- **Pages** : `cms:pages:view`, `cms:pages:create`, `cms:pages:edit`, `cms:pages:delete`, `cms:pages:publish`
- **Sections** : `cms:sections:view`, `cms:sections:create`, `cms:sections:edit`, `cms:sections:delete`
- **Médias** : `cms:medias:view`, `cms:medias:upload`, `cms:medias:delete`
- **Thèmes** : `cms:themes:view`, `cms:themes:edit`
- **Menus** : `cms:menus:edit`
- **Widgets** : `cms:widgets:edit`
- **Versions** : `cms:versions:view`, `cms:versions:rollback`

### Frontend — Routes Éditeur CMS

L'éditeur CMS utilise le layout `_auth.cms.tsx` avec navigation par onglets :

| Route | Fichier | Description |
|-------|---------|-------------|
| `/cms` | `_auth.cms.index.tsx` | Dashboard (stats, pages récentes) |
| `/cms/pages` | `_auth.cms.pages.tsx` | Liste pages + filtres + création |
| `/cms/pages/:id` | `_auth.cms.pages.$id.tsx` | Éditeur 3 colonnes (palette, canvas, propriétés) |
| `/cms/medias` | `_auth.cms.medias.tsx` | Bibliothèque médias (grille/liste, upload) |
| `/cms/themes` | `_auth.cms.themes.tsx` | Gestion thèmes (cartes, customizer modal) |
| `/cms/menus` | `_auth.cms.menus.tsx` | Éditeur navigation (items par emplacement) |
| `/cms/widgets` | `_auth.cms.widgets.tsx` | CRUD widgets (4 emplacements) |
| `/cms/versions` | `_auth.cms.versions.tsx` | Timeline versions, diff, rollback |

### Frontend — Composants Partagés CMS

| Composant | Rôle |
|-----------|------|
| `CmsMediaUpload.tsx` | Upload drag & drop (progress, preview, base64) |
| `CmsSectionEditor.tsx` | Éditeur section générique (SECTION_CONFIG pour 18 types) |
| `CmsThemeCustomizer.tsx` | Personnalisation thème (presets, couleurs, typo, preview live) |
| `PublicLayout.tsx` | Layout public (dark mode, mobile hamburger, breadcrumbs, CSS vars) |
| `CmsPageRenderer.tsx` | Rendu 18 types de sections (animations, dark mode, lightbox) |
| `CmsDashboard.tsx` | Dashboard admin basique |
| `SeoHead.tsx` | Composant SEO réutilisable (title, meta, OG, Twitter Card) |
| `PublicPageSkeleton.tsx` | Skeleton loading pour pages publiques |

### Système de Templates CMS

**8 entités** : CmsPage, CmsSection, CmsMedia, CmsTheme, CmsMenu, CmsWidget, CmsVersion, **CmsTemplate**

6 templates système seedés dans la migration `184-cms-templates.sql` :
1. **ACCUEIL_CLASSIQUE** — Hero + Présentation + Chiffres clés + Cartes + CTA
2. **PAGE_CONTACT** — Hero + Formulaire + Cartes infos + Carte
3. **PAGE_GALERIE** — Hero + Galerie masonry
4. **PAGE_INSCRIPTIONS** — Hero + Étapes + Téléchargements + FAQ
5. **PAGE_ACTUALITES** — Hero + Liste actualités
6. **PAGE_VIERGE** — Hero minimal (template de base)

+2 templates ajoutés via migration `205-cms-consolidation.sql` :
7. **PAGE_A_PROPOS** — Hero + Texte + Chiffres + Équipe + Témoignages + CTA
8. **PAGE_MENTIONS_LEGALES** — Texte juridique + Téléchargements

**Service** : `cms-template.service.ts` — `findTemplates()`, `instancierTemplate()`, `appliquerThemeParDefaut()`, `initialiserCmsEtablissement()`, `reinitialiserCms()`

**Auto-initialisation** : Lors de la création d'un établissement, `initialiserCmsEtablissement()` crée :
- 1 thème par défaut (structure nested : `couleurs` + `typographie`)
- 6 pages : Accueil, À propos, Galerie, Inscriptions, Contact, Mentions légales
- 2 menus : Principal (6 items) + Pied de page (4 items) — avec `pageSlug`
- 3 widgets : Réseaux sociaux + Contact rapide + Horaires (tous en pied de page)

**Enums alignés** : `EmplacementMenu` = `principal | pied_page | lateral` (backend = frontend)

**Theme mapping** : Backend stocke `variables: { couleurs: { primaire, secondaire, accent, fond, texte, texteClair }, typographie: { titre, corps } }`. Le service `mapThemeToPublic()` gère la compatibilité legacy (flat → nested).

### Preview Mode (Pages Brouillon)

Flux de preview pour visualiser les pages non publiées :
1. **Backend** : `GET /api/cms/pages/:id/preview` → génère un token UUID (Redis, TTL 10 min)
2. **Frontend éditeur** : Bouton "Aperçu" → `window.open('/e/${code}/${slug}?preview=${token}')`
3. **Frontend public** : `e.$code.$slug.tsx` détecte `?preview=TOKEN` → appelle l'API publique avec le token
4. **Backend public** : Si `?preview=TOKEN` → valide le token Redis → retourne la page même si BROUILLON

### Cache Redis — Invalidation par Pattern

```typescript
// ✅ CORRECT — Utiliser delPattern pour les glob patterns
await redisService.delPattern(`public:${etablissementId}:*`);

// ❌ INTERDIT — Redis DEL ne supporte pas les glob
await redisService.del('public:${etabId}:*'); // NE FONCTIONNE PAS
```

### Fichiers de Référence

| Fichier | Rôle |
|---------|------|
| `backend/src/modules/cms/entities/` | 7 entités TypeORM |
| `backend/src/modules/cms/services/cms.service.ts` | CRUD admin + versioning |
| `backend/src/modules/cms/services/public-etablissement.service.ts` | API publique + cache |
| `backend/src/modules/cms/controllers/cms.controller.ts` | Routes admin (15 routes) |
| `backend/src/modules/cms/controllers/public-etablissement.controller.ts` | Routes publiques (8 routes) |
| `frontend/src/features/cms/types/cms.types.ts` | Types/enums CMS |
| `frontend/src/features/cms/hooks/use-cms-public.ts` | 7 hooks API publique |
| `frontend/src/features/cms/hooks/use-cms-admin.ts` | 18+ hooks CRUD admin |
| `frontend/src/features/cms/components/PublicLayout.tsx` | Layout public (header+footer) |
| `frontend/src/features/cms/components/CmsPageRenderer.tsx` | Rendu 18 sections |
| `frontend/src/features/cms/components/CmsDashboard.tsx` | Dashboard admin |
| `frontend/src/features/cms/components/CmsMediaUpload.tsx` | Upload média drag & drop |
| `frontend/src/features/cms/components/CmsSectionEditor.tsx` | Éditeur section générique |
| `frontend/src/features/cms/components/CmsThemeCustomizer.tsx` | Personnalisation thème |
| `frontend/src/routes/e.$code.tsx` | Route publique accueil |
| `frontend/src/routes/e.$code.$slug.tsx` | Route publique page |
| `frontend/src/routes/e.$code.galerie.tsx` | Page galerie publique |
| `frontend/src/routes/e.$code.contact.tsx` | Page contact publique |
| `frontend/src/routes/e.$code.inscriptions.tsx` | Page inscriptions publique |
| `frontend/src/routes/_auth.cms.tsx` | Layout éditeur CMS (7 onglets) |
| `frontend/src/routes/_auth.cms.index.tsx` | Dashboard CMS |
| `frontend/src/routes/_auth.cms.pages.tsx` | Liste pages + création |
| `frontend/src/routes/_auth.cms.pages.$id.tsx` | Éditeur page 3 colonnes |
| `frontend/src/routes/_auth.cms.medias.tsx` | Bibliothèque médias |
| `frontend/src/routes/_auth.cms.themes.tsx` | Gestion thèmes |
| `frontend/src/routes/_auth.cms.menus.tsx` | Éditeur navigation |
| `frontend/src/routes/_auth.cms.widgets.tsx` | Gestion widgets |
| `frontend/src/routes/_auth.cms.versions.tsx` | Historique versions |
| `frontend/src/routes/_auth.cms.templates.tsx` | Liste templates + instanciation |
| `backend/src/modules/cms/entities/cms-template.entity.ts` | Entité CmsTemplate |
| `backend/src/modules/cms/services/cms-template.service.ts` | Service templates + auto-init |
| `backend/database/migrations/184-cms-templates.sql` | Table + seed 6 templates |
| `frontend/src/features/cms/components/SeoHead.tsx` | SEO réutilisable (title, meta, OG) |
| `frontend/src/features/cms/components/PublicPageSkeleton.tsx` | Skeleton loading pages publiques |

### CMS V2 — Refonte Visuelle (v2.0)

**28 composants Puck** (18 initiaux + 10 nouveaux) dans 6 catégories :
- **Hero** : Hero, HeroVideo
- **Content** : Texte, Galerie, Video, Telechargements, Actualites, Horaires, Carousel, Timeline, Tabs, CompteursAnimes, IconeFeatures, GalerieMasonry
- **Social** : Temoignages, TemoignageCarousel, Equipe, Partenaires, PrixTab
- **Info** : CarteInfos, Carte, Faq
- **Action** : Formulaire, AppelAction, Newsletter
- **Structure** : Separateur, HtmlCustom

**Animations avancées** (`lib/animations.ts`) :
- 15 variants (fade-in, slide-*, zoom-*, flip-*, rotate, blur, scale-up, bounce, elastic)
- 7 easings (easeOut, easeIn, easeInOut, linear, spring, bounce, elastic)
- 6 hover effects (lift, glow, scale, tilt, shadow, border-glow)
- Presets : hero, card, testimonial, stats, timeline, gallery, partner, cta

**Personnalisation avancée** (`puck/shared-styles.ts`) :
- Types : ButtonStyle, TypographyStyle, BackgroundStyle, SpacingStyle, BorderStyle, ShadowStyle
- 4 presets : heroClassic, contentStandard, darkElegant, cardSoft
- Helpers CSS : typographyToCSS, backgroundToCSS, spacingToCSS, borderToCSS, shadowToCSS

**Contenu dynamique** (5 entités + API publique) :
- CmsActualite, CmsTemoignage, CmsEvenement, CmsPartenaire, CmsAbonnementNewsletter
- 7 routes publiques : actualites, temoignages, evenements, partenaires, newsletter
- DataBinding enrichi : variables `{{actualites.0.titre}}`, `{{temoignages.0.nom}}`, etc.

**Outils éditeur** :
- **SeoPanel** : Score SEO 0-100, aperçu Google, meta title/description, OG, noindex
- **ResponsivePreview** : 6 presets devices (320px→pleine largeur), zoom 25-200%
- **ExportImportPanel** : Export JSON/Puck, import drag&drop avec preview
- **Honeypot anti-spam** : Contact + Newsletter (champ `_honeypot` caché)

**Fichiers CMS V2 supplémentaires** :
| Fichier | Rôle |
|---------|------|
| `frontend/src/features/cms/lib/animations.ts` | Bibliothèque animations (363 lignes) |
| `frontend/src/features/cms/puck/shared-styles.ts` | Styles partagés + presets (379 lignes) |
| `frontend/src/features/cms/components/SeoPanel.tsx` | Panneau SEO éditeur (212 lignes) |
| `frontend/src/features/cms/components/ResponsivePreview.tsx` | Preview multi-devices (123 lignes) |
| `frontend/src/features/cms/components/ExportImportPanel.tsx` | Export/Import JSON (346 lignes) |
| `backend/src/modules/cms/entities/cms-content.entity.ts` | 5 entités contenu dynamique |
| `backend/src/modules/cms/services/cms-content.service.ts` | CRUD contenu + méthodes publiques |
| `backend/src/modules/cms/controllers/cms-content.controller.ts` | 21 routes CRUD avec RBAC |
| `backend/database/migrations/211-cms-content-entities.sql` | 5 tables + RLS + 19 permissions |

**Outils éditeur avancés (Phase 7)** :
- **StyleEditorPanel** : Accordéon 6 sections (typo, background, spacing, border, shadow, bouton), 4 presets, preview live, copie CSS
- **SectionClipboard** : Copier/coller sections entre pages, localStorage (max 10), import/export JSON
- **VisibilityEditor** : Conditions d’affichage (breakpoints responsive, rôles, dates), `evaluerVisibilite()` + `genererCSSVisibilite()`
- **AnchorNav** : Sommaire auto-généré (IntersectionObserver scroll-spy), 3 modes (sidebar/floating/top)
- **ContentMetrics** : Score qualité 0-100 (lisibilité, SEO, richesse, structure), compteur mots/caractères, recommandations
- **FocusMode** : Mode plein écran sans distractions, fond personnalisable, raccourcis F11/Échap
- **CommandPalette** : Ctrl+K, recherche fuzzy 20+ commandes, navigation clavier, insertion rapide sections

**Migration Phase 7** : `backend/database/migrations/212-cms-phase7-avance.sql`
- `cms_sections` : +`conditionsVisibilite` (jsonb), +`styleConfig` (jsonb)
- `cms_pages` : +`focusPreferences` (jsonb), +`qualiteScore` (int), +`analytics` (jsonb)

---

## 28. Maintenance et skills disponibles

Cette règle et les skills associés sont conçus pour **évoluer avec le projet** :

- **`elisaschool-dev`** — Guide de développement (créer module, endpoint, entité, **backup**, **activation modules**)
- **`elisaschool-business-logic`** — Guide complet de la logique métier (règles, flux, calculs, config, **backup**, **activation modules**)
- **`elisaschool-frontend-dev`** — Guide de développement frontend (**ultra-responsivité**, composants, hooks, intégration API)
- **`elisaschool-frontend-refactor`** — Guide de refactorisation frontend (optimisation, modernisation, **ultra-responsivité**)

**Modes de mise à jour** :
- **Automatique** : Lorsque l'IA détecte un nouveau pattern récurrent, elle propose d'ajouter/modifier une section
- **À la demande** : *« mets à jour la règle »*, *« actualise le skill business logic »*
- **Contextuelle** : Après un changement architectural significatif, mise à jour proactive
- **Revue périodique** : Tous les 10-15 modules ajoutés

> **Pour demander une mise à jour** : *« mets à jour la règle »* ou *« actualise le skill »* en précisant le changement.

---

## 29. Système de Configuration v10 — Améliorations Majeures

### 29.1 Cascade 4 Niveaux (v10)

La résolution des paramètres suit maintenant une cascade à **4 niveaux** :

```
1. Établissement (priorité maximale) — paramètre scopé à l'établissement
2. Groupe — paramètre scopé au groupe d'établissements (via GroupeEtablissementLien)
3. Global — paramètre sans etablissementId (etablissementId = NULL)
4. Défaut — valeur par défaut du système
```

**Fichier** : `backend/src/modules/configuration/services/configuration.service.ts`

```typescript
// Résolution dans getParametre()
if (etablissementId) {
    // 1. Override établissement
    const paramScope = await this.parametreRepository.findOne({ where: { cle, etablissementId } });
    if (paramScope) return this.parseParametreValue(paramScope);
    
    // 2. v10 — Override groupe
    const groupeId = await this.resoudreGroupeEtablissement(etablissementId);
    if (groupeId) {
        const paramGroupe = await this.parametreRepository.findOne({ where: { cle, groupeEtablissementId: groupeId } });
        if (paramGroupe) return this.parseParametreValue(paramGroupe);
    }
}

// 3. Fallback global
const paramGlobal = await this.parametreRepository.findOne({ where: { cle, etablissementId: IsNull() } });
```

### 29.2 Cache Unifié 3 Niveaux (v10)

Le cache suit maintenant un pattern à **3 niveaux** :

```
In-Memory (60s) → Redis (60s) → PostgreSQL
```

**Constants** :
- `CACHE_TTL = 60 * 1000` (60 secondes in-memory)
- `REDIS_CACHE_TTL = 60` (60 secondes Redis)
- `REDIS_CACHE_PREFIX = 'config:param'`

**Invalidation** :
- Invalidation locale via `invalidateCache()`
- Invalidation Redis via SCAN + DEL
- Propagation cross-instance via Redis Pub/Sub (`config:cache:invalidate`)

### 29.3 Suppression du Double Cache (v10)

Le `quickCache` local dans `config.helper.ts` a été **supprimé**. Les helpers délèguent maintenant directement au `ConfigurationService`.

**Raison** : Le double cache créait un risque de désynchronisation. Le cache du service (60s + pub/sub) est suffisant.

### 29.4 Batch Loading (v10)

Nouvelle méthode `getParametresBatch(cles: string[], etablissementId?: string)` pour charger plusieurs paramètres en une seule requête SQL.

**Usage** :
```typescript
const params = await configurationService.getParametresBatch(
    ['auth.session_duration', 'auth.max_login_attempts', 'app.nom'],
    etablissementId
);
// Retourne Map<string, any>
```

### 29.5 Validation Zod des Valeurs (v10)

Les valeurs des paramètres sont maintenant validées par des schémas Zod avant sauvegarde.

**Fichier** : `backend/src/modules/configuration/utils/param-validation.ts`

**Schémas par type** :
- `STRING` : `z.string().min(0).max(10000)`
- `NUMBER` : `z.number().finite()`
- `BOOLEAN` : `z.boolean()`
- `JSON` : `z.any()`
- `ARRAY` : `z.array(z.any())`
- `ENCRYPTED` : `z.string().min(1)`

**Schémas par clé** (exemples) :
- `auth.session_duration` : `z.number().int().min(60).max(86400)`
- `auth.password_min_length` : `z.number().int().min(6).max(128)`
- `app.version` : `z.string().regex(/^\d+\.\d+\.\d+$/)`

### 29.6 ConfigConsistencyChecker (v10)

Service de vérification de cohérence inter-cascades.

**Fichier** : `backend/src/modules/configuration/services/config-consistency.service.ts`

**Vérifications** :
- Modules désactivés avec feature flags actifs → `error`
- Feature flags orphelins (sans module associé) → `info`
- Paramètres de module manquants → `warning`

**Endpoints** :
- `GET /api/configuration/consistency-check` — Rapport global
- `GET /api/configuration/consistency-check/:etablissementId` — Rapport par établissement

### 29.7 Dashboard Cascade (v10)

Vue plateforme montrant tous les paramètres avec leur valeur effective par établissement.

**Fichier frontend** : `frontend/src/routes/platform.configuration-cascade.tsx`

**Endpoints backend** :
- `GET /api/configuration/cascade-view` — Vue globale
- `GET /api/configuration/cascade-view?etablissementId=xxx` — Vue par établissement

**Retourne pour chaque paramètre** :
- Valeur globale
- Valeur groupe (si applicable)
- Valeur établissement (override)
- Valeur effective (après cascade)
- Source de la valeur effective (`etablissement` | `groupe` | `global` | `defaut`)

### 29.8 TTL Harmonisés (v10)

Tous les caches de configuration sont maintenant harmonisés à **60 secondes** :

| Service | TTL avant | TTL après |
|---------|-----------|-----------|
| ConfigurationService | 60s | 60s ✓ |
| FeatureFlagService | 5 min | 60s ✓ |
| ModuleResolutionService | 60s | 60s ✓ |
| TrancheConfigService | N/A | N/A |

### 29.9 Fichiers de Référence v10

| Fichier | Rôle |
|---------|------|
| `backend/src/modules/configuration/services/configuration.service.ts` | Service principal (cascade 4 niveaux, cache 3 niveaux, batch) |
| `backend/src/modules/configuration/utils/config.helper.ts` | Helpers (délégation directe au service) |
| `backend/src/modules/configuration/utils/param-validation.ts` | Validation Zod des valeurs |
| `backend/src/modules/configuration/services/config-consistency.service.ts` | Vérification cohérence |
| `backend/src/modules/billing/services/feature-flags.service.ts` | Feature flags (TTL 60s) |
| `frontend/src/routes/platform.configuration-cascade.tsx` | Dashboard cascade |

---

## 30. Module Management SaaS v8 — Refonte Unification (migration 200)

### 30.1 Architecture cible

**EntitlementService** = source unique de vérité pour le gating des modules.
Remplace les 3 anciens registres (MODULE_REGISTRY, ModuleRegistryService, MODULES_GRATUITS/PREMIUM).

| Composant | Rôle |
|-----------|------|
| `entitlement.service.ts` | Source unique — check(), checkAll(), isAccessible() |
| `module-access.middleware.ts` | Wrapper v4 vers entitlementService (compatibilité) |
| `module-active.middleware.ts` | Gating par abonnement (utilise entitlementService) |
| `modules_catalogue` (DB) | Catalogue avec config JSONB (defaultSettings migrés) |

### 30.2 Cascade de résolution (9 niveaux)

1. Module CRITIQUE (code: auth, utilisateurs, configuration, notifications) → bypass total
2. Période d'essai (statut ESSAI, 14 jours) → tous modules accessibles
3. Catalogue DB → module existe + catégorie CRITIQUE
4. Abonnement ACTIF ou ESSAI
5. Plan (modulesInclus)
6. Override groupe (ModulesGroupe)
7. Supplément souscrit (AbonnementModule)
8. Plan minimal requis (rang)
9. Défaut catalogue (actifParDefaut)

### 30.3 Période d'essai automatique (14 jours)

- À la création d'un établissement → auto-création `AbonnementClient` statut=ESSAI, 14 jours
- `entitlementService.check()` : si statut=ESSAI et `periodeEssaiFin > now()` → tous modules accessibles
- Colonne `periodeEssaiFin` sur `abonnements_client`

### 30.4 Dégradation gracieuse (30 jours)

| Phase | Jours | Comportement |
|-------|-------|-------------|
| Lecture seule | J0–J15 | GET OK, POST/PUT/DELETE bloqués (403) |
| Verrouillé | J15–J30 | Tous modules bloqués + message upsell |
| Archivé | J30+ | Données archivées, modules invisibles |

Colonne `dateExpirationReelle` sur `abonnements_client` pour tracker J0.

### 30.5 Cache invalidation synchrone

- `invalidate()` : in-memory SYNCHRONE + Redis async (fire-and-forget)
- Header `X-Cache-Status: HIT|MISS|STALE` dans les réponses API
- `entitlementService.lastCacheStatus` exposé pour les controllers

### 30.6 Endpoints API

| Endpoint | Rôle |
|----------|------|
| `GET /api/billing/modules/mes-modules` | Catalogue filtré client (actifs + upgradables sans prix) |
| `GET /api/billing/modules/resolved` | Modules résolus (legacy) |
| `GET /api/billing/modules/catalogue` | Catalogue complet (legacy) |

### 30.7 Fichiers de Référence

| Fichier | Rôle |
|---------|------|
| `backend/src/modules/billing/services/entitlement.service.ts` | Source unique de vérité |
| `backend/src/common/middlewares/module-access.middleware.ts` | Middleware v4 (entitlementService) |
| `backend/src/modules/configuration/middlewares/module-active.middleware.ts` | Gating abonnement |
| `backend/src/modules/billing/entities/abonnement-client.entity.ts` | Enum ESSAI + colonnes essai/dégradation |
| `backend/src/database/seeds/system/seed-modules-catalogue.ts` | Seed 26 modules avec config JSONB |
| `backend/database/migrations/201-essai-degradation.sql` | Migration essai + dégradation |
| `frontend/src/features/modules/components/mes-modules-page.tsx` | Page Mes Modules |
| `frontend/src/features/modules/components/module-card.tsx` | Carte module réutilisable |
| `frontend/src/features/modules/hooks/use-mes-modules.ts` | Hook TanStack Query |
| `frontend/src/locales/fr/modules.json` + `en/modules.json` | i18n modules |
