---
trigger: always_on
---
# Conventions eLISAschool — Backend API

> **Portée** : Cette règle s'applique à tout le code backend TypeScript (Express + TypeORM).
> **Langue** : Réfléchis, dialogues et commentaires en **français**. Termes techniques (entity, controller, service, DTO, middleware, router, repository) en **anglais**.
> **Évolution** : Cette règle est **vivante** — elle peut être mise à jour automatiquement par l'IA lorsqu'un nouveau pattern émerge dans le codebase, ou manuellement par l'utilisateur selon ses besoins.

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

- **Authentification** : `authMiddleware` extrait le JWT et attache `req.utilisateur = { id, email, role, etablissementId }`
- **Autorisation** : `requireRoles(Role.SUPER_ADMIN, Role.ADMIN, ...)` vérifie le rôle
- Appliquer les deux **par route** (pas de middleware global sur le router)
- Routes publiques : ne pas mettre `authMiddleware` (rares, ex: login, register)
- Rôles disponibles : `SUPER_ADMIN`, `ADMIN`, `CHEF_ETABLISSEMENT`, `ENSEIGNANT`, `PERSONNEL`, `RESPONSABLE_CANTINE`, `RESPONSABLE_TRANSPORT`, `PARENT`, `ELEVE`

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
const result = await service.findAll(typeId, etablissementId);

// ✅ CORRECT — Objet DTO complet
const result = await service.findAll({
    page: 1,
    limit: 100,
    sortBy: 'createdAt',
    sortOrder: 'DESC' as const,  // ← IMPORTANT: as const
    typePersonnelId: typeId
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

## 22. Système d'Activation des Modules

### Architecture

Le système d'activation/désactivation des modules repose sur **trois niveaux de stockage** avec résolution en cascade :

| Niveau | Entité | Usage | Priorité |
|--------|--------|-------|----------|
| 1 | `EtablissementConfig.modulesActifs` | Multi-tenant (recommandé) | **Priorité 1** |
| 2 | `ConfigurationApp.modulesActifs` | Legacy (déprécié) | Fallback |
| 3 | `ConfigurationModule.actif` | Config détaillée par module | Fallback |
| 4 | `MODULE_REGISTRY.defaultActive` | Valeur par défaut | Dernier fallback |

### Conventions d'Implémentation

**1. Middleware de Protection**

```typescript
// TOUJOURS appliquer sur les modules optionnels
app.use('/api/bulletins', requireModuleActive('bulletins'), bulletinsController);

// JAMAIS sur les modules critiques
app.use('/api/auth', authController);  // Pas de middleware
```

**Modules critiques exemptés** : `auth`, `utilisateurs`, `configuration`, `notifications`

**2. Signature des Méthodes de Service**

```typescript
// toggleModule() — TOUJOURS passer etablissementId
async toggleModule(
    moduleNom: string,
    actif: boolean,
    etablissementId?: string,  // ← Multi-tenant
    utilisateurId?: string,    // ← Historique
    req?: Request              // ← Audit
)

// isModuleActive() — TOUJOURS passer etablissementId
async isModuleActive(moduleNom: string, etablissementId?: string): Promise<boolean>
```

**3. Vérification des Dépendances**

- **Activation** : Auto-active les dépendances manquantes
- **Désactivation** : Bloque si modules dépendants actifs (erreur 400)
- **TOUJOURS** retourner la liste des modules auto-activés dans `modulesAutoActive`

**4. Paramètres Système**

Chaque module a un paramètre `{module}.actif` créé par le seed :
```typescript
// Utilisable dans n'importe quel service
const actif = await getParamBoolean('notes.actif');
```

### Bonnes Pratiques

- **TOUJOURS** utiliser `EtablissementConfig` pour le multi-tenant
- **TOUJOURS** invalider le cache après modification (`this.invalidateCache()`)
- **TOUJOURS** logger dans l'historique (`this.historyService.logAction()`)
- **JAMAIS** bypasser le middleware de protection
- **VÉRIFIER** les dépendances avant d'activer un module
- **EXCLURE** les modules critiques de la vérification

### Sécurité

- **RBAC** : Seuls `ADMIN` et `SUPER_ADMIN` peuvent toggler les modules
- **Permission** : `config:module:toggle` requise
- **Audit** : Toutes les actions sont loguées avec utilisateur et timestamp
- **Multi-tenant** : Isolation stricte par `etablissementId`

### Pattern d'Intégration d'un Nouveau Module

```typescript
// 1. Ajouter au registre (shared/src/config/config.registry.ts)
[ModuleName.MON_MODULE]: {
    name: ModuleName.MON_MODULE,
    label: 'Mon Module',
    defaultActive: false,
    dependencies: [ModuleName.AUTH],
    // ...
}

// 2. Appliquer le middleware (app.ts)
app.use('/api/mon-module', requireModuleActive('mon-module'), monModuleController);

// 3. Le seed crée automatiquement le paramètre 'mon_module.actif'
```

---

## 21. Maintenance et skills disponibles

Cette règle et les skills associés sont conçus pour **évoluer avec le projet** :

- **`elisaschool-dev`** — Guide de développement (créer module, endpoint, entité, **backup**, **activation modules**)
- **`elisaschool-business-logic`** — Guide complet de la logique métier (règles, flux, calculs, config, **backup**, **activation modules**)

**Modes de mise à jour** :
- **Automatique** : Lorsque l'IA détecte un nouveau pattern récurrent, elle propose d'ajouter/modifier une section
- **À la demande** : *« mets à jour la règle »*, *« actualise le skill business logic »*
- **Contextuelle** : Après un changement architectural significatif, mise à jour proactive
- **Revue périodique** : Tous les 10-15 modules ajoutés

> **Pour demander une mise à jour** : *« mets à jour la règle »* ou *« actualise le skill »* en précisant le changement.
