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
| `etablissement` | `/api/etablissement` | Académiques | Informations établissement |
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
| Types API partagés | `shared/src/types/api.types.ts` |
| DataSource TypeORM | `backend/src/database/data-source.ts` |

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
