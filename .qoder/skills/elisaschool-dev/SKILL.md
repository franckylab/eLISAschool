---
name: elisaschool-dev
description: >
  Guide de développement backend eLISAschool. Utiliser ce skill pour créer un nouveau module,
  ajouter un endpoint, une entité, ou toute opération de développement sur l'API backend
  Express/TypeORM. Déclencheurs : nouveau module, nouvelle entité, nouvel endpoint, CRUD,
  ajout de route, création de service.
---

# Développement Backend eLISAschool

## Quand utiliser ce skill

- Créer un **nouveau module** backend complet (entité, DTO, service, controller)
- Ajouter un **endpoint** à un module existant
- Ajouter une **entité** ou une **relation** entre entités
- Effectuer toute modification structurelle sur l'API

> **Note** : Pour comprendre les règles métier, les flux de données et les calculs, utiliser le skill `/elisaschool-business-logic`.

## Prérequis

- Node.js >= 20.0.0, npm >= 10.0.0
- PostgreSQL 16 en cours d'exécution
- Redis 7 en cours d'exécution
- Le backend compile sans erreur : `npm run build:backend`

---

## Workflow complet : Créer un nouveau module

### Étape 1 : Planifier le module

Avant d'écrire du code, définir :

- **Nom du module** (kebab-case pluriel) : ex. `examens`
- **Nom de la table** (snake_case pluriel) : ex. `examens`
- **Entité principale** (PascalCase singulier) : ex. `Examen`
- **Champs de l'entité** : types, contraintes, nullable
- **Relations** avec d'autres entités existantes
- **Routes CRUD** : GET `/`, GET `/:id`, POST `/`, PATCH `/:id`, DELETE `/:id`
- **Rôles autorisés** par route (voir `shared/src/enums/roles.enum.ts`)
- **Catégorie du module** : critiques, communication, academiques, logistiques, activites, documents, systeme

### Étape 2 : Créer la structure de dossiers

```bash
# Depuis backend/src/modules/
mkdir -p examens/{controllers,services,entities,dto}
```

Arborescence attendue :
```
examens/
├── controllers/
│   ├── examens.controller.ts
│   └── index.ts
├── services/
│   ├── examens.service.ts
│   └── index.ts
├── entities/
│   ├── examen.entity.ts
│   └── index.ts
├── dto/
│   ├── examens.dto.ts
│   └── index.ts
└── index.ts
```

### Étape 3 : Définir l'entité TypeORM

**Fichier :** `entities/examen.entity.ts`

```typescript
/**
 * ==================================
 * eLISAschool - Entité Examen
 * ==================================
 * Version: 1.0.0
 * Auteur: xAI Éducation
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index
} from 'typeorm';
// Importer les entités liées depuis leurs modules
import { Matiere } from '@modules/matieres/entities/matiere.entity';

@Entity('examens')
@Index(['matiereId'])
export class Examen {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 200 })
    titre!: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'date' })
    dateExamen!: Date;

    @Column({ type: 'integer' })
    duree!: number; // Durée en minutes

    @Column({ type: 'uuid' })
    matiereId!: string;

    @ManyToOne(() => Matiere)
    @JoinColumn({ name: 'matiereId' })
    matiere?: Matiere;

    @Column({ type: 'enum', enum: ['BROUILLON', 'PLANIFIE', 'EN_COURS', 'TERMINE'], default: 'BROUILLON' })
    statut!: 'BROUILLON' | 'PLANIFIE' | 'EN_COURS' | 'TERMINE';

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
```

**Fichier :** `entities/index.ts`

```typescript
export * from './examen.entity';
```

### Étape 4 : Définir les DTOs Zod

**Fichier :** `dto/examens.dto.ts`

```typescript
/**
 * ==================================
 * eLISAschool - DTOs Examens
 * ==================================
 */

import { z } from 'zod';

export const createExamenSchema = z.object({
    titre: z.string().min(2).max(200),
    description: z.string().optional(),
    dateExamen: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    duree: z.number().int().positive(),
    matiereId: z.string().uuid(),
    statut: z.enum(['BROUILLON', 'PLANIFIE', 'EN_COURS', 'TERMINE']).default('BROUILLON'),
});

export const updateExamenSchema = createExamenSchema.partial();

export type CreateExamenDto = z.infer<typeof createExamenSchema>;
export type UpdateExamenDto = z.infer<typeof updateExamenSchema>;
```

**Fichier :** `dto/index.ts`

```typescript
export * from './examens.dto';
```

### Étape 5 : Implémenter le service

**Fichier :** `services/examens.service.ts`

```typescript
/**
 * ==================================
 * eLISAschool - Service Examens
 * ==================================
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { Examen } from '../entities';
import { CreateExamenDto, UpdateExamenDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';

export class ExamensService {
    private repo: Repository<Examen>;

    constructor() {
        this.repo = AppDataSource.getRepository(Examen);
    }

    async create(dto: CreateExamenDto): Promise<Examen> {
        // Vérifier l'unicité si nécessaire
        const existing = await this.repo.findOne({ where: { titre: dto.titre } });
        if (existing) throw new AppError('Un examen avec ce titre existe déjà', 409, 'EXAMEN_EXISTS');

        const examen = this.repo.create({
            ...dto,
            dateExamen: new Date(dto.dateExamen),
        });

        await this.repo.save(examen);
        logger.info(`Examen créé: ${examen.id} - ${dto.titre}`);
        return examen;
    }

    async findAll(): Promise<Examen[]> {
        return this.repo.find({
            relations: ['matiere'],
            order: { dateExamen: 'DESC' },
        });
    }

    async findOne(id: string): Promise<Examen> {
        const examen = await this.repo.findOne({ where: { id }, relations: ['matiere'] });
        if (!examen) throw new AppError('Examen non trouvé', 404, 'NOT_FOUND');
        return examen;
    }

    async update(id: string, dto: UpdateExamenDto): Promise<Examen> {
        const examen = await this.findOne(id);

        if (dto.dateExamen) dto.dateExamen = new Date(dto.dateExamen) as any;

        Object.assign(examen, dto);
        await this.repo.save(examen);
        return examen;
    }

    async delete(id: string): Promise<void> {
        const examen = await this.findOne(id);
        await this.repo.remove(examen);
        logger.info(`Examen supprimé: ${id}`);
    }
}

export const examensService = new ExamensService();
```

**Fichier :** `services/index.ts`

```typescript
export * from './examens.service';
```

### Étape 6 : Implémenter le controller

**Fichier :** `controllers/examens.controller.ts`

```typescript
/**
 * ==================================
 * eLISAschool - Controller Examens
 * ==================================
 */

import { Router, Request, Response, NextFunction } from 'express';
import { ExamensService } from '../services';
import { createExamenSchema, updateExamenSchema } from '../dto';
import { authMiddleware, requireRoles } from '@modules/auth/middlewares';
import { Role } from '@modules/auth/entities';
import { AppError } from '@common/filters/error.filter';

const router = Router();
const service = new ExamensService();

function validate(schema: any, data: unknown): any {
    const result = schema.safeParse(data);
    if (!result.success) {
        throw new AppError('Erreur de validation', 400, 'VALIDATION_ERROR');
    }
    return result.data;
}

router.get('/', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.CHEF_ETABLISSEMENT, Role.ENSEIGNANT), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const examens = await service.findAll();
        res.json({ success: true, data: examens });
    } catch (error) { next(error); }
});

router.get('/:id', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.CHEF_ETABLISSEMENT, Role.ENSEIGNANT), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const examen = await service.findOne(req.params.id);
        res.json({ success: true, data: examen });
    } catch (error) { next(error); }
});

router.post('/', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.CHEF_ETABLISSEMENT, Role.ENSEIGNANT), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(createExamenSchema, req.body);
        const examen = await service.create(dto);
        res.status(201).json({ success: true, data: examen });
    } catch (error) { next(error); }
});

router.patch('/:id', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.CHEF_ETABLISSEMENT, Role.ENSEIGNANT), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(updateExamenSchema, req.body);
        const examen = await service.update(req.params.id, dto);
        res.json({ success: true, data: examen });
    } catch (error) { next(error); }
});

router.delete('/:id', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await service.delete(req.params.id);
        res.json({ success: true, message: 'Examen supprimé' });
    } catch (error) { next(error); }
});

export const examensController = router;
export default router;
```

**Fichier :** `controllers/index.ts`

```typescript
export { examensController } from './examens.controller';
```

### Étape 7 : Créer le barrel export du module

**Fichier :** `examens/index.ts`

```typescript
export * from './entities';
export * from './dto';
export * from './services';
export * from './controllers';
```

### Étape 8 : Enregistrer le module (3 fichiers)

**8a. `backend/src/modules/index.ts`** — Ajouter dans la bonne catégorie :

```typescript
// Modules académiques (ou autre catégorie appropriée)
export * from './examens';
```

**8b. `backend/src/app.ts`** — Importer et monter le controller :

```typescript
// Ajouter l'import (dans la section correspondante)
import { examensController } from '@modules/examens';

// Monter la route (dans la section correspondante)
app.use('/api/examens', examensController);
```

**8c. `shared/src/enums/modules.enum.ts`** — Ajouter l'enum et le mapping :

```typescript
export enum ModuleName {
    // ... existants ...
    EXAMENS = 'examens',
}

export const MODULE_CATEGORIES: Record<ModuleName, ModuleCategory> = {
    // ... existants ...
    [ModuleName.EXAMENS]: ModuleCategory.ACADEMIQUES,
};
```

### Étape 9 : Vérifier la compilation

```bash
cd /home/franckylab/projets/eLISAschool
npm run build:backend
```

Si des erreurs TypeScript apparaissent, les corriger avant de continuer.

---

## Workflow : Ajouter un endpoint à un module existant

### Étape 1 : Identifier le besoin

- Route HTTP : `GET /api/<module>/<sous-route>`
- Rôles autorisés
- Paramètres (query, params, body)
- Réponse attendue

### Étape 2 : Ajouter la méthode au service

**Fichier :** `services/<module>.service.ts`

```typescript
async findByAnnee(anneeId: string): Promise<Entity[]> {
    return this.repo.find({
        where: { anneeId },
        relations: ['relationNecessaire'],
        order: { createdAt: 'DESC' },
    });
}
```

### Étape 3 : Ajouter la route au controller

**Fichier :** `controllers/<module>.controller.ts`

```typescript
router.get('/par-annee/:anneeId', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await service.findByAnnee(req.params.anneeId);
        res.json({ success: true, data });
    } catch (error) { next(error); }
});
```

### Étape 4 : Vérifier la compilation

```bash
npm run build:backend
```

---

## Workflow : Ajouter une relation entre entités

### Étape 1 : Déterminer le type de relation

| Relation | Usage | Exemple |
|----------|-------|---------|
| `@ManyToOne` | Plusieurs → Un (le plus courant) | Élève → Classe |
| `@OneToMany` | Un → Plusieurs (côté inverse) | Classe → Élèves |
| `@OneToOne` | Un à un | Élève → Utilisateur |
| `@ManyToMany` | Plusieurs à plusieurs | Élève ↔ Clubs |

### Étape 2 : Modifier l'entité propriétaire

```typescript
// Côté propriétaire (celui qui porte la FK)
@Column({ type: 'uuid' })
classeId!: string;

@ManyToOne(() => Classe)
@JoinColumn({ name: 'classeId' })
classe?: Classe;
```

### Étape 3 : Modifier l'entité inverse (optionnel)

```typescript
// Côté inverse (pas de FK, juste navigation)
@OneToMany(() => Eleve, eleve => eleve.classe)
eleves?: Eleve[];
```

Puis mettre à jour le DTO si la FK est requise en entrée, et ajouter la relation dans les `relations:` des `find()` du service.

---

## Checklist finale avant commit

- [ ] Tous les fichiers ont la **bannière eLISAschool**
- [ ] Les noms suivent les **conventions** (français camelCase, tables snake_case)
- [ ] Le service utilise `AppError` pour les erreurs (pas de `throw new Error()`)
- [ ] Le controller a le helper `validate()` local
- [ ] Toutes les routes ont `authMiddleware` + `requireRoles()` (sauf routes publiques)
- [ ] Les barrel exports (`index.ts`) sont présents à chaque niveau
- [ ] Le module est enregistré dans `modules/index.ts`, `app.ts`, `modules.enum.ts`
- [ ] `npm run build:backend` compile sans erreur
- [ ] Les messages d'erreur sont en **français**
- [ ] Les logs utilisent `logger.info()` / `logger.warn()` / `logger.error()`

---

## Référence rapide : Modules existants

| Module | Route API | Catégorie | Description |
|--------|-----------|-----------|-------------|
| `auth` | `/api/auth` | Critiques | Authentification JWT, login, register, refresh |
| `utilisateurs` | `/api/utilisateurs` | Critiques | Gestion des comptes utilisateurs |
| `configuration` | `/api/configuration` | Critiques | Configuration établissement, paramètres |
| `notifications` | `/api/notifications` | Communication | Notifications push et in-app |
| `notes` | `/api/notes` | Académiques | Saisie et gestion des notes |
| `messagerie` | `/api/messagerie` | Communication | Messagerie interne |
| `requetes` | `/api/requetes` | Communication | Requêtes et demandes |
| `cantine` | `/api/cantine` | Logistiques | Gestion de la cantine |
| `transport` | `/api/transport` | Logistiques | Gestion du transport scolaire |
| `materiel` | `/api/materiel` | Logistiques | Inventaire du matériel |
| `clubs` | `/api/clubs` | Activités | Clubs et activités parascolaires |
| `gamification` | `/api/gamification` | Activités | Système de récompenses et points |
| `cartes` | `/api/cartes` | Documents | Cartes scolaires (élève, personnel) |
| `orientation` | `/api/orientation` | Académiques | Orientation et conseil |
| `impressions` | `/api/impressions` | Documents | Impression de documents |
| `scoring` | `/api/scoring` | Système | Calcul de scores et moyennes |
| `monitoring` | `/api/monitoring` | Système | Monitoring et logs système |
| `audit` | `/api/audit` | Système | **Audit trail complet** (logs, export, archivage) |
| `etablissement` | `/api/etablissements` | Académiques | Informations établissement |
| `cycles` | `/api/cycles` | Académiques | Cycles d'enseignement |
| `niveaux` | `/api/niveaux` | Académiques | Niveaux scolaires |
| `annees-scolaires` | `/api/annees-scolaires` | Académiques | Années scolaires |
| `personnel` | `/api/personnel` | Académiques | Dossiers personnel |
| `classes` | `/api/classes` | Académiques | Classes et groupes |
| `matieres` | `/api/matieres` | Académiques | Matières enseignées |
| `periodes` | `/api/periodes` | Académiques | Périodes et trimestres |
| `eleves` | `/api/eleves` | Académiques | Dossiers élèves |
| `bulletins` | `/api/bulletins` | Académiques | Génération des bulletins |

---

## Fichiers modèles de référence

Ces fichiers sont les **exemples canoniques** à suivre lors du développement :

| Usage | Chemin |
|-------|--------|
| Controller simple | `backend/src/modules/eleves/controllers/eleves.controller.ts` |
| Service CRUD complet | `backend/src/modules/eleves/services/eleves.service.ts` |
| Entity avec relations | `backend/src/modules/eleves/entities/eleve.entity.ts` |
| DTOs Zod | `backend/src/modules/eleves/dto/eleves.dto.ts` |
| Barrel export module | `backend/src/modules/eleves/index.ts` |
| Composition root | `backend/src/app.ts` |
| Registre modules | `backend/src/modules/index.ts` |
| Enum modules | `shared/src/enums/modules.enum.ts` |
| Erreurs globales | `backend/src/common/filters/error.filter.ts` |
| Auth middleware | `backend/src/modules/auth/middlewares/auth.middleware.ts` |
| Rôles et permissions | `shared/src/enums/roles.enum.ts` |
| **Permission middleware** | `backend/src/modules/auth/middlewares/permission.middleware.ts` |
| **Permission resolver** | `backend/src/modules/auth/services/permission-resolver.service.ts` |
| **RBAC module** | `backend/src/modules/rbac/` |
| **RBAC seed** | `backend/src/database/seeds/rbac.seed.ts` |
| Types API partagés | `shared/src/types/api.types.ts` |
| DataSource TypeORM | `backend/src/database/data-source.ts` |
| **Audit trail (entité)** | `backend/src/modules/auth/entities/audit-log.entity.ts` |
| **Audit trail (service)** | `backend/src/modules/auth/services/audit.service.ts` |
| **Audit trail (controller)** | `backend/src/modules/audit/controllers/audit.controller.ts` |
| **Audit interceptor** | `backend/src/common/interceptors/audit.interceptor.ts` |

---

## Workflow : Instrumenter un module avec l'Audit Trail

### Étape 1 : Ajouter les imports

**Fichier :** `services/<module>.service.ts`

```typescript
import { Request } from 'express';
import { auditService, AuditAction } from '@modules/auth';
```

### Étape 2 : Instrumenter la méthode CREATE

```typescript
async create(dto: CreateDto, req?: Request): Promise<Entity> {
    // ... logique métier existante ...
    const entity = this.repo.create(dto);
    await this.repo.save(entity);
    
    // AUDIT
    if (req?.utilisateur?.id) {
        await auditService.log({
            utilisateurId: req.utilisateur.id,
            action: AuditAction.ENTITY_CREATE, // Adapter: ELEVE_CREATE, USER_CREATE, etc.
            cible: 'NomEntité',
            cibleId: entity.id,
            description: `Création entité: ${entity.identifiant}`,
            nouvellesValeurs: dto,
            module: 'nom-module',
        }, req);
    }
    
    return entity;
}
```

### Étape 3 : Instrumenter la méthode UPDATE

```typescript
async update(id: string, dto: UpdateDto, req?: Request): Promise<Entity> {
    const entity = await this.findOne(id);
    
    // Capturer les anciennes valeurs
    const anciennesValeurs = {
        champ1: entity.champ1,
        champ2: entity.champ2,
    };
    
    // ... logique de mise à jour ...
    Object.assign(entity, dto);
    await this.repo.save(entity);
    
    // AUDIT
    if (req?.utilisateur?.id) {
        await auditService.log({
            utilisateurId: req.utilisateur.id,
            action: AuditAction.ENTITY_UPDATE,
            cible: 'NomEntité',
            cibleId: entity.id,
            description: `Modification entité: ${entity.identifiant}`,
            anciennesValeurs,
            nouvellesValeurs: dto,
            module: 'nom-module',
        }, req);
    }
    
    return entity;
}
```

### Étape 4 : Instrumenter la méthode DELETE

```typescript
async delete(id: string, req?: Request): Promise<void> {
    const entity = await this.findOne(id);
    
    await this.repo.remove(entity);
    
    // AUDIT
    if (req?.utilisateur?.id) {
        await auditService.log({
            utilisateurId: req.utilisateur.id,
            action: AuditAction.ENTITY_DELETE,
            cible: 'NomEntité',
            cibleId: id,
            description: `Suppression entité: ${entity.identifiant}`,
            anciennesValeurs: { identifiant: entity.identifiant },
            module: 'nom-module',
            severity: 'WARNING' as any,
        }, req);
    }
}
```

### Étape 5 : Mettre à jour le controller

```typescript
// AVANT
router.post('/', authMiddleware, async (req, res, next) => {
    const entity = await service.create(req.body);
    res.json({ success: true, data: entity });
});

// APRÈS (passer req au service)
router.post('/', authMiddleware, async (req, res, next) => {
    const entity = await service.create(req.body, req); // ← Ajouter req
    res.json({ success: true, data: entity });
});
```

### Étape alternative : Utiliser l'interceptor automatique

```typescript
import { createAuditInterceptor } from '@common/interceptors/audit.interceptor';

const auditInterceptor = createAuditInterceptor({
    module: 'eleves',
    entityType: 'Eleve',
});

// Monter l'interceptor avant les routes
router.post('/', authMiddleware, auditInterceptor, async (req, res, next) => {
    const entity = await service.create(req.body);
    res.json({ success: true, data: entity });
});
```

### Bonnes pratiques d'audit

1. **Toujours vérifier** `req?.utilisateur?.id` avant de logger
2. **Passer l'objet `req`** à `auditService.log()` pour capturer IP et User-Agent
3. **Sanitiser** les données sensibles (automatique pour passwords, tokens)
4. **Utiliser la bonne sévérité** :
   - `INFO` : opérations normales (CREATE, UPDATE)
   - `WARNING` : suppressions, changements sensibles
   - `CRITICAL` : erreurs de sécurité
5. **Définir le `module`** correspondant au module métier
6. **Capturer anciennes ET nouvelles valeurs** pour les UPDATE

### Tester l'audit

```bash
# Consulter les logs (ADMIN requis)
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/audit/logs

# Export CSV
curl -H "Authorization: Bearer <token>" "http://localhost:3000/api/audit/logs/export?format=csv"

# Statistiques
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/audit/logs/statistics
```

**Documentation complète** : `backend/docs/audit-trail.md`  
**Guide d'instrumentation** : `backend/AUDIT-INSTRUMENTATION-GUIDE.md`

---

## Workflow : Utiliser le Système RBAC v2.0

### Présentation du système RBAC

eLISAschool dispose d'un **système RBAC avancé (v2.0)** avec :
- **~230 permissions** granulaires (format `module:action`)
- **9 rôles système** configurés
- **Multi-rôles** par utilisateur (illimité)
- **Permissions personnalisées** GRANTED/DENIED au niveau utilisateur
- **Cache intelligent** TTL 5 minutes
- **API REST complète** (20 endpoints pour gestion RBAC)
- **Backward compatibility** avec l'ancien système (enum Role)

### Étape 1 : Protéger un endpoint avec requirePermission

**Fichier :** `controllers/<module>.controller.ts`

```typescript
import { Router, Request, Response, NextFunction } from 'express';
import { 
    authMiddleware,
    requirePermission,           // NOUVEAU : guard par permission
    requireAnyPermission,        // NOUVEAU : OU logique
    requireAllPermissions        // NOUVEAU : ET logique
} from '@modules/auth/middlewares';

const router = Router();

// Toutes les routes nécessitent d'être authentifié
router.use(authMiddleware);

// ANCIENNE MÉTHODE (toujours valide)
router.get('/', requireRoles(Role.ADMIN), async (req, res) => {
    // Accès réservé au rôle ADMIN
});

// NOUVELLE MÉTHODE (recommandée)
router.post('/menus', 
    requirePermission('cantine:menus:create'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const menu = await cantineService.createMenu(req.body);
            res.status(201).json({ success: true, data: menu });
        } catch (error) { next(error); }
    }
);

// OU logique (au moins UNE permission)
router.get('/bulletins',
    requireAnyPermission(['bulletins:view', 'bulletins:edit']),
    async (req, res) => {
        // Accès si bulletins:view OU bulletins:edit
    }
);

// ET logique (TOUTES les permissions requises)
router.post('/notes/bulk',
    requireAllPermissions(['notes:create', 'notes:bulk:create']),
    async (req, res) => {
        // Accès si notes:create ET notes:bulk:create
    }
);
```

### Étape 2 : Vérifier une permission dans un service

**Fichier :** `services/<module>.service.ts`

```typescript
import { checkPermission } from '@modules/auth/middlewares';
import { AppError } from '@common/filters/error.filter';

export class CantineService {
    async createMenu(dto: any, utilisateurId: string) {
        // Vérifier la permission
        const hasPermission = await checkPermission(
            utilisateurId,
            'cantine:menus:create'
        );

        if (!hasPermission) {
            throw new AppError('Permission insuffisante', 403, 'INSUFFICIENT_PERMISSIONS');
        }

        // Créer le menu
        return this.menuRepo.save(dto);
    }
}
```

### Étape 3 : Créer un rôle personnalisé via API

```bash
POST /api/rbac/roles
Authorization: Bearer {token_admin}
Content-Type: application/json

{
  "code": "SUPERVISEUR",
  "libelle": "Superviseur Pédagogique",
  "description": "Responsable du suivi pédagogique",
  "permissionIds": ["uuid1", "uuid2", "uuid3"],
  "etablissementId": "uuid-etablissement"
}
```

### Étape 4 : Assigner un rôle à un utilisateur

```bash
POST /api/rbac/users/{userId}/roles
Authorization: Bearer {token_admin}
Content-Type: application/json

{
  "roleId": "uuid-du-role",
  "estPrincipal": true,
  "motif": "Promotion"
}
```

### Étape 5 : Ajouter une permission personnalisée (override)

```bash
POST /api/rbac/users/{userId}/permissions
Authorization: Bearer {token_admin}
Content-Type: application/json

{
  "permissionId": "uuid-permission",
  "type": "GRANTED",  // ou "DENIED" pour refuser explicitement
  "motif": "Accès temporaire pour projet spécial"
}
```

### Étape 6 : Voir les permissions effectives d'un utilisateur

```bash
GET /api/rbac/users/{userId}/permissions
Authorization: Bearer {token_admin}

# Retourne TOUTES les permissions résolues (rôles + customs)
```

### API RBAC complète (20 endpoints)

#### Rôles (8 endpoints)
```
POST   /api/rbac/roles                      # Créer rôle
GET    /api/rbac/roles                      # Lister rôles
GET    /api/rbac/roles/stats                # Statistiques
GET    /api/rbac/roles/:id                  # Détail rôle
PATCH  /api/rbac/roles/:id                  # Modifier rôle
DELETE /api/rbac/roles/:id                  # Supprimer rôle
GET    /api/rbac/roles/systeme              # Rôles système
PATCH  /api/rbac/roles/:id/permissions      # Assigner permissions
```

#### Permissions (6 endpoints)
```
POST   /api/rbac/permissions                # Créer permission
GET    /api/rbac/permissions                # Lister permissions
GET    /api/rbac/permissions/by-module      # Par module
GET    /api/rbac/permissions/:id            # Détail
PATCH  /api/rbac/permissions/:id            # Modifier
DELETE /api/rbac/permissions/:id            # Supprimer
```

#### User Roles (6 endpoints)
```
GET    /api/rbac/users/:userId/roles              # Rôles utilisateur
POST   /api/rbac/users/:userId/roles              # Assigner rôle
PATCH  /api/rbac/users/:userId/roles/:roleId      # Modifier rôle
DELETE /api/rbac/users/:userId/roles/:roleId      # Retirer rôle
GET    /api/rbac/users/:userId/permissions        # Permissions effectives
POST   /api/rbac/users/:userId/permissions        # Permission custom
```

### Permissions par module (exemples)

| Module | Permissions | Exemple |
|--------|-------------|----------|
| **Cantine** | `cantine:menus:create`, `cantine:menus:edit`, `cantine:menus:delete`, `cantine:inscriptions:create`, `cantine:solde:recharger`, `cantine:consommations:enregistrer` | 9 permissions |
| **Transport** | `transport:lignes:create`, `transport:lignes:edit`, `transport:inscriptions:create`, `transport:presences:enregistrer` | 8 permissions |
| **Élèves** | `eleves:view`, `eleves:create`, `eleves:edit`, `eleves:radiation`, `eleves:reinscription`, `eleves:documents:generate` | 6 permissions |
| **Notes** | `notes:view`, `notes:create`, `notes:edit`, `notes:bulk:create`, `notes:import`, `notes:export` | 10 permissions |
| **Bulletins** | `bulletins:view`, `bulletins:generate`, `bulletins:edit`, `bulletins:publier`, `bulletins:export` | 5 permissions |
| **Utilisateurs** | `utilisateurs:manage`, `utilisateurs:import`, `utilisateurs:export`, `utilisateurs:reset-password`, `utilisateurs:statut:change` | 7 permissions |

### Rôles système et leurs permissions

| Rôle | Code | Permissions | Description |
|------|------|-------------|-------------|
| **Super Admin** | `SUPER_ADMIN` | **TOUTES (~230)** | Accès total |
| **Admin** | `ADMIN` | **~180** | Gestion complète établissement |
| **Chef Établissement** | `CHEF_ETABLISSEMENT` | **~150** | Direction, validation, rapports |
| **Enseignant** | `ENSEIGNANT` | **~60** | Notes, bulletins, messagerie |
| **Parent** | `PARENT` | **~20** | Consultation enfant |
| **Élève** | `ELEVE` | **~15** | Consultation personnelle |
| **Personnel Admin** | `PERSONNEL_ADMINISTRATIF` | **~100** | Administratif, inscriptions |
| **Resp. Cantine** | `RESPONSABLE_CANTINE` | **~30** | Cantine uniquement |
| **Resp. Transport** | `RESPONSABLE_TRANSPORT` | **~25** | Transport uniquement |

### Migration des utilisateurs existants

```bash
# Simuler la migration (dry-run)
DRY_RUN=true npm run migrate:rbac

# Exécuter la migration réelle
npm run migrate:rbac
```

Le script va :
1. ✅ Vérifier l'état actuel de la base
2. ✅ Migrer les utilisateurs vers le multi-rôles
3. ✅ Vérifier la cohérence des données
4. ✅ Générer un rapport détaillé

### Tester le système RBAC

```bash
# Exécuter les tests
TEST_USER_ID=uuid-utilisateur npm run test:rbac
```

Les tests vérifient :
- ✅ Résolution des permissions
- ✅ Performance du cache
- ✅ Permissions spécifiques
- ✅ Fallback vers ancien système
- ✅ Multi-rôles
- ✅ Simulation des guards

### Bonnes pratiques RBAC

1. **Privilégier `requirePermission`** plutôt que `requireRoles` pour plus de granularité
2. **Utiliser `requireAnyPermission`** pour les lectures (view OU edit)
3. **Utiliser `requireAllPermissions`** pour les opérations sensibles (create + bulk)
4. **Invalider le cache** après modification des permissions : `permissionResolverService.invalidateUserCache(userId)`
5. **Logger les audits** pour traçabilité des changements de permissions
6. **Tester avec différents rôles** avant déploiement
7. **Ne pas bypasser** les guards de permission
8. **Ne pas modifier** les rôles système directement en DB

### Fichiers de référence RBAC

| Fichier | Description |
|---------|-------------|
| `docs/rbac-system.md` | Documentation complète (436 lignes) |
| `docs/permissions-manquantes.md` | Analyse des 145 permissions ajoutées (422 lignes) |
| `docs/guards-exemples-implémentation.ts` | 10 exemples complets d'implémentation (554 lignes) |
| `docs/RBAC_COMPLETION.md` | Synthèse du système (416 lignes) |
| `docs/RBAC_FINAL_SESSION.md` | Résumé de la session (473 lignes) |
| `backend/src/database/migrations/migrate-rbac.ts` | Script de migration (295 lignes) |
| `backend/src/database/migrations/test-rbac.ts` | Script de test (400 lignes) |
| `backend/src/modules/rbac/` | Module RBAC complet |
| `backend/src/modules/auth/middlewares/permission.middleware.ts` | Middleware unifié (200 lignes) |

---

## Maintenance et évolution

Ce skill, la règle associée (`elisaschool-conventions`) et le skill métier (`elisaschool-business-logic`) sont des documents **vivants** qui évoluent avec le projet.

### Quand mettre à jour automatiquement

L'IA doit **proposer** une mise à jour du skill/règle lorsque :
- Un **nouveau pattern récurrent** est détecté dans le codebase (ex: middleware personnalisé, pattern de cache, pagination)
- Un **changement architectural** significatif est effectué (ex: ajout de WebSocket, migration vers un nouveau ORM)
- Un **nouveau type de workflow** est identifié (ex: déploiement CI/CD, génération de documentation)
- Des **conventions de test** émergent et se stabilisent dans les modules existants

### Comment mettre à jour à la demande

L'utilisateur peut demander une mise à jour à tout moment avec des instructions comme :
- *« Mets à jour le skill pour inclure les tests unitaires »* — Ajoute un workflow de création de tests
- *« Ajoute le pattern de pagination dans la règle »* — Documente la convention de pagination
- *« Actualise la liste des modules existants »* — Rafraîchit le tableau de référence
- *« Ajoute un workflow pour les endpoints WebSocket »* — Ajoute un nouveau workflow au skill

### Processus de mise à jour

1. Identifier le changement à documenter
2. Lire les fichiers `.qoder/rules/elisaschool-conventions.md`, `.qoder/skills/elisaschool-dev/SKILL.md` et/ou `.qoder/skills/elisaschool-business-logic/SKILL.md`
3. Ajouter/modifier les sections concernées en respectant le style existant
4. Vérifier la cohérence avec le code réel du codebase
5. Informer l'utilisateur des modifications apportées

> **Note** : Les mises à jour ne sont jamais silencieuses — l'IA informe toujours l'utilisateur de ce qui a été ajouté, modifié ou supprimé.
