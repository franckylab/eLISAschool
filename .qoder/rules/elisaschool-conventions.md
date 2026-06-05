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
 * Auteur: xAI Éducation
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

## 16. Maintenance et skills disponibles

Cette règle et les skills associés sont conçus pour **évoluer avec le projet** :

- **`elisaschool-dev`** — Guide de développement (créer module, endpoint, entité)
- **`elisaschool-business-logic`** — Guide complet de la logique métier (règles, flux, calculs, config)

**Modes de mise à jour** :
- **Automatique** : Lorsque l'IA détecte un nouveau pattern récurrent, elle propose d'ajouter/modifier une section
- **À la demande** : *« mets à jour la règle »*, *« actualise le skill business logic »*
- **Contextuelle** : Après un changement architectural significatif, mise à jour proactive
- **Revue périodique** : Tous les 10-15 modules ajoutés

> **Pour demander une mise à jour** : *« mets à jour la règle »* ou *« actualise le skill »* en précisant le changement.
