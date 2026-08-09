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

## Règle de Consolidation des Documents

**Avant de créer un nouveau fichier** (module, migration, script, guide) :

1. **Vérifier** si le sujet existe déjà dans le codebase
2. **Consolider** dans le fichier existant si pertinent
3. **Nettoyer** les fichiers redondants ou obsolètes

**Objectif** : Documentation concise, compacte, sans redondances.

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
 * Auteur: franck arlos chendjou
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

### Pattern : nomenclature liée + type dérivé

Quand une entité a besoin d'un « type attendu » qui existe déjà comme nomenclature ailleurs, **ne pas dupliquer la FK** : la porter sur une nomenclature intermédiaire et **dériver** par jointure.

- Exemple de référence : la catégorie statutaire d'un `Poste` n'est **pas** stockée sur `Poste`. Elle est portée par `Fonction.categorie` (enum varchar `CategorieFonction`, v5.0 — l'entité `TypePersonnel` a été supprimée) et dérivée via `poste.fonction.categorie`.
- Une FK vers une nomenclature **globale** (sans `etablissementId`) depuis une entité **multi-tenant** est valide (`onDelete: 'SET NULL'`).
- Charger la chaîne dans le service : `relations: ['fonction']`, puis exposer un label dérivé (`categorieLabel`) plutôt qu'une valeur brute.
- Ne jamais ajouter de champs « par défaut » qui court-circuitent une source de vérité (ex. pas de `roleIdParDefaut` sur un type : le RBAC passe par `utilisateur_etablissements`).

---

## Workflow : Développer avec le multi-établissement (v2.0)

### Règle 1 : Scopage automatique par établissement

**Toutes les entités métier doivent avoir :**
```typescript
@Column({ type: 'uuid' })
etablissementId!: string;

@Index()
etablissementId!: string;
```

### Règle 2 : ParametreSysteme - Source unique de vérité (v3.0+)

**Architecture** : Un seul système de configuration avec scopage établissement.

```typescript
// ✅ Lecture avec contexte établissement
const valeur = await getParam('app.langue_defaut', {
    etablissementId: req.etablissementId,  // Scopé
    defaultValue: 'fr'                      // Fallback
});

// ✅ Résolution en cascade :
// 1. Override établissement (si existe)
// 2. Paramètre global (si existe)
// 3. valeurDefaut (si définie)
// 4. defaultValue du helper
```

**Helper contextuel** :
```typescript
// Dans controller/service
import { getParamFromRequest } from '@modules/configuration/utils/config.helper';

const theme = await getParamFromRequest('app.theme', req, 'default');
```

**Modules** :
```typescript
// Activation/désactivation
await configurationService.toggleModule('bulletins', true, etablissementId);
const isActive = await configurationService.isModuleActive('bulletins', etablissementId);
```

**⚠️ ConfigurationApp SUPPRIMÉ** : Utiliser exclusivement `ParametreSysteme`.

### Règle 3 : Éviter les références circulaires

**Problème :** Deux entités dans le même fichier qui se référencent mutuellement
**Solution :** Séparer dans des fichiers distincts

```typescript
// ❌ Incorrect (même fichier)
@Entity('a')
class A { @OneToOne(() => B) b?: B; }
@Entity('b')
class B { @OneToOne(() => A) a?: A; }

// ✅ Correct (fichiers séparés)
// a.entity.ts
@Entity('a')
class A { @OneToOne('B', 'a') b?: B; }

// b.entity.ts
@Entity('b')
class B { @OneToOne(() => A, a => a.b) a?: A; }
```

### Règle 4 : TypeORM et les valeurs NULL

**Toujours utiliser `IsNull()` pour les conditions WHERE avec NULL :**
```typescript
import { IsNull } from 'typeorm';

// ❌ Incorrect
where: { etablissementId: null }

// ✅ Correct
where: { etablissementId: IsNull() }
```

### Règle 5 : Migrations PostgreSQL

**Pour les contraintes UNIQUE sur colonnes existantes :**
```sql
-- ❌ Ne pas utiliser DROP INDEX sur une contrainte
DROP INDEX IF EXISTS "UQ_xxx";

-- ✅ Utiliser DROP CONSTRAINT
ALTER TABLE table DROP CONSTRAINT IF EXISTS "UQ_xxx";
```

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
| `backups` | `/api/backups` | Critiques | **Backup & restore** (config, DB, monitoring) |
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
| `sondages` | `/api/sondages` | Communication | **Sondages et votes** (templates, analyses, récurrents, export) |
| `personnel/heures-cours` | `/api/personnel/heures-cours` | Académiques | Heures de cours (instances datées depuis EDT) |
| `personnel/remplacements` | `/api/personnel/heures-cours/remplacements` | Académiques | Remplacements d'enseignants (workflow validation) |

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
| **Multi-établissements (entité)** | `backend/src/modules/auth/entities/utilisateur-etablissement.entity.ts` |
| **Multi-établissements (service)** | `backend/src/modules/auth/services/utilisateur-etablissement.service.ts` |
| **Limitations rôles (entité)** | `backend/src/modules/auth/entities/role-limitation-etablissement.entity.ts` |
| **Middleware tenant v2.0** | `backend/src/common/middlewares/tenant.middleware.ts` |
| **Configuration multi-établissement** | `backend/src/modules/configuration/services/configuration.service.ts` |
| **EtablissementConfig (entité)** | `backend/src/modules/etablissement/entities/etablissement-config.entity.ts` |
| **Migration scopage** | `backend/src/database/migrations/006-parametres-multi-etablissements.ts` |
| **Migration consolidation** | `backend/src/database/migrations/007-consolider-configuration-app.ts` |
| **RBAC module** | `backend/src/modules/rbac/` |
| **RBAC seed** | `backend/src/database/seeds/rbac.seed.ts` |
| **Migration multi-établissements** | `backend/src/database/migrations/002-multi-etablissements.sql` |
| **Migration 67 rôles** | `backend/src/database/migrations/004-roles-systeme-educatif-africain.sql` |
| Types API partagés | `shared/src/types/api.types.ts` |
| DataSource TypeORM | `backend/src/database/data-source.ts` |
| **Audit trail (entité)** | `backend/src/modules/auth/entities/audit-log.entity.ts` |
| **Audit trail (service)** | `backend/src/modules/auth/services/audit.service.ts` |
| **Audit trail (controller)** | `backend/src/modules/audit/controllers/audit.controller.ts` |
| **Audit interceptor** | `backend/src/common/interceptors/audit.interceptor.ts` |
| **RemplacementHeureCours (entité)** | `backend/src/modules/personnel/entities/remplacement-heure-cours.entity.ts` |
| **RemplacementHeureCours (DTOs)** | `backend/src/modules/personnel/dto/remplacement-heure-cours.dto.ts` |
| **RemplacementHeureCours (service)** | `backend/src/modules/personnel/services/remplacement-heure-cours.service.ts` |
| **RemplacementHeureCours (controller)** | `backend/src/modules/personnel/controllers/remplacement-heure-cours.controller.ts` |
| **Migration remplacements** | `backend/database/migrations/148-remplacement-heure-cours.sql` |
| **Hooks remplacements** | `frontend/src/features/personnel/hooks/use-remplacement-heure-cours.ts` |

---

## Workflow : Ajouter un workflow de remplacement (pattern RemplacementHeureCours)

### Contexte

Le pattern RemplacementHeureCours illustre comment ajouter une entité avec workflow de validation (demande → validation → exécution) intégrée au `validationWorkflowService` existant.

### Étapes réalisées

1. **Entité** : `RemplacementHeureCours` avec enum `StatutRemplacement` (EN_ATTENTE, VALIDEE, REJETEE, EXECUTEE, ANNULEE)
2. **Migration SQL** : CREATE TABLE + index + seed permissions RBAC + seed paramètres validation workflow
3. **DTOs Zod** : `creerRemplacementSchema`, `validerRemplacementSchema`, `rejeterRemplacementSchema`, `queryRemplacementSchema`
4. **Service** : 6 méthodes (create, valider, rejeter, annuler, findAll, getStatistiques) + intégration validationWorkflowService + auditService
5. **Controller** : 6 routes REST montées AVANT le controller heures-cours pour éviter les conflits `:id`
6. **Permissions RBAC** : 4 nouvelles permissions granulaires dans `roles.enum.ts` + attribution par rôle
7. **Frontend** : 8 hooks TanStack Query + 2 pages (globale + dédiée) + StepperModal 3 étapes
8. **i18n** : ~99 clés FR + EN

### Pattern à réutiliser

Pour tout nouveau workflow de remplacement/approbation :
- Créer l'entité avec enum de statut + FK vers l'entité cible
- Intégrer `validationWorkflowService` pour la chaîne de validation
- Monter le controller remplacements AVANT le controller principal (éviter conflits de routes Express)
- Permissions granulaires : `:view`, `:demand`, `:validate`
- Seed paramètres workflow : `require_validation`, `validation_levels`, `validation_roles`

---

## Workflow : Développer un Module de Sondages

### Contexte

Le module Sondages a été implémenté avec des fonctionnalités avancées :
- Templates réutilisables avec catégories
- Votes anonymes ou nominatifs
- Sondages programmés et récurrents
- Analyses en temps réel avec export CSV/PDF
- Notifications et WebSocket temps réel
- Cron jobs pour automatisation

### Étape 1 : Créer les entités

**Fichier :** `entities/sondage.entity.ts`

```typescript
// 4 entités requises
@Entity('templates_sondage')
export class TemplateSondage { ... }  // Templates prédéfinis

@Entity('sondages')
@Index(['etablissementId'])
@Index(['auteurId'])
@Index(['statut'])
export class Sondage {
    @Column({ type: 'varchar', length: 20, default: StatutSondage.ACTIF })
    statut!: StatutSondage;

    @Column({ type: 'boolean', default: false })
    estAnonyme!: boolean;

    @Column({ type: 'boolean', default: false })
    choixMultiple!: boolean;

    // Récurrence
    @Column({ type: 'boolean', default: false })
    estRecurrent!: boolean;

    @Column({ type: 'varchar', length: 20, nullable: true })
    frequenceRecurrent?: string;  // 'quotidien', 'hebdomadaire', 'mensuel'
}

@Entity('sondages_options')
export class SondageOption { ... }  // Options de vote

@Entity('sondages_votes')
@Index(['sondageId', 'voterId'], { unique: true })  // Unicité vote
export class Vote { ... }  // Votes des utilisateurs
```

### Étape 2 : Créer les DTOs Zod

**Fichier :** `dto/sondage.dto.ts`

```typescript
// 9 schémas requis
export const creerSondageSchema = z.object({
    question: z.string().min(5).max(2000),
    options: z.array(z.object({
        texte: z.string().min(1),
        ordre: z.number().optional(),
    })).min(2).max(20),
    parametres: z.object({
        estAnonyme: z.boolean().optional(),
        choixMultiple: z.boolean().optional(),
        dureeLimite: z.string().optional(),
    }).optional(),
    destinataires: z.object({
        mode: z.enum(['individuel', 'conversation_groupe']),
        utilisateur_ids: z.array(z.string().uuid()).min(1).max(500),
    }),
    date_envoi: z.string().datetime().optional(),
    creer_conversation: z.boolean().default(false),
    template_id: z.string().uuid().optional(),
});

export const voterSchema = z.object({
    option_ids: z.array(z.string().uuid()).min(1),
});

// ... 7 autres schémas pour templates, analyses, export, etc.
```

### Étape 3 : Implémenter le service avec transactions

**Fichier :** `services/sondage.service.ts`

```typescript
async createSondage(dto: CreerSondageDto, auteurId: string, etablissementId: string): Promise<Sondage> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
        // 1. Créer sondage
        const sondage = this.sondageRepo.create({
            ...dto,
            auteurId,
            etablissementId,
            statut: dto.date_envoi ? StatutSondage.PROGRAMME : StatutSondage.ACTIF,
        });
        await queryRunner.manager.save(sondage);

        // 2. Créer options
        const options = dto.options.map((opt, index) =>
            this.optionRepo.create({
                ...opt,
                ordre: opt.ordre || index,
                sondageId: sondage.id,
            })
        );
        await queryRunner.manager.save(options);

        await queryRunner.commitTransaction();

        // 3. Notifications NON-BLOQUANTES
        if (!isScheduled) {
            try {
                await this.envoyerNotificationsSondage(sondage, dto.destinataires.utilisateur_ids);
                sondageWebSocketService.broadcastSondageActive(sondage.id, dto.destinataires.utilisateur_ids);
            } catch (error) {
                logger.warn(`[Sondage] Échec notifications (non bloquant)`, error);
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

// Méthode de vote avec vérification unicité
async voter(sondageId: string, optionIds: string[], voterId: string): Promise<Vote[]> {
    const sondage = await this.findOne(sondageId, voterId, etablissementId);
    
    // Vérifier si déjà voté
    const existingVote = await this.voteRepo.findOne({
        where: { sondageId, voterId },
    });
    if (existingVote && !sondage.choixMultiple) {
        throw new AppError('Vous avez déjà voté à ce sondage', 409, 'DEJA_VOTE');
    }

    // Créer votes
    const votes = optionIds.map(optionId =>
        this.voteRepo.create({ sondageId, optionId, voterId })
    );
    return this.voteRepo.save(votes);
}
```

### Étape 4 : Implémenter le controller avec 18 routes

**Fichier :** `controllers/sondages.controller.ts`

```typescript
// Routes principales
router.get('/', authMiddleware, async (req, res) => { ... });
router.post('/', authMiddleware, async (req, res) => { ... });
router.get('/:id', authMiddleware, async (req, res) => { ... });
router.patch('/:id', authMiddleware, async (req, res) => { ... });
router.delete('/:id', authMiddleware, async (req, res) => { ... });

// Activation/Terminaison
router.post('/:id/activer', authMiddleware, async (req, res) => { ... });
router.post('/:id/terminer', authMiddleware, async (req, res) => { ... });

// Votes
router.post('/:id/voter', authMiddleware, async (req, res) => { ... });
router.get('/:id/votes', authMiddleware, async (req, res) => { ... });

// Analyses
router.get('/:id/analyses', authMiddleware, async (req, res) => { ... });
router.get('/:id/analyses/export', authMiddleware, async (req, res) => {
    const format = req.query.format as string;
    
    if (format === 'csv') {
        // Générer CSV
        let csv = 'Option,Nombre de votes,Pourcentage\n';
        repartition.forEach((item: any) => {
            csv += `${item.option_texte},${item.nombre_votes},${item.pourcentage.toFixed(2)}%\n`;
        });
        res.setHeader('Content-Type', 'text/csv');
        res.send(csv);
    } else if (format === 'pdf') {
        // Générer PDF/HTML
        const pdfHtml = sondagePdfService.genererPdf(analyses);
        res.setHeader('Content-Type', 'text/html');
        res.send(pdfHtml);
    }
});

// Templates
router.get('/templates', authMiddleware, async (req, res) => { ... });
router.post('/templates', authMiddleware, requireRoles(Role.ADMIN), async (req, res) => { ... });
```

### Étape 5 : Créer les cron jobs

**Fichier :** `cron-jobs.ts`

```typescript
// 4 tâches planifiées
const jobs = [
    // Fermer sondages expirés (toutes les 10min)
    cron.schedule('*/10 * * * *', async () => {
        const sondagesActifs = await sondageRepo.find({
            where: { statut: StatutSondage.ACTIF },
        });
        
        for (const sondage of sondagesActifs) {
            if (sondage.dateLimite && sondage.dateLimite <= new Date()) {
                sondage.statut = StatutSondage.TERMINE;
                await sondageRepo.save(sondage);
            }
        }
    }),

    // Activer sondages programmés (toutes les 10min)
    cron.schedule('*/10 * * * *', async () => { ... }),

    // Créer occurrences récurrentes (1h/jour)
    cron.schedule('0 1 * * *', async () => { ... }),

    // Rappel sondages actifs (9h/semaine)
    cron.schedule('0 9 * * 1-5', async () => { ... }),
];
```

### Étape 6 : Créer les migrations SQL

**Fichier :** `database/migrations/041-module-sondages.sql`

```sql
-- Tables principales
CREATE TABLE IF NOT EXISTS templates_sondage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom VARCHAR(200) NOT NULL,
    question TEXT NOT NULL,
    options JSONB NOT NULL,
    parametres JSONB,
    categorie VARCHAR(50),
    visibilite VARCHAR(20) DEFAULT 'etablissement',
    est_template_systeme BOOLEAN DEFAULT false,
    etablissement_id UUID REFERENCES etablissements(id)
);

CREATE TABLE IF NOT EXISTS sondages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    statut VARCHAR(20) DEFAULT 'actif',
    est_anonyme BOOLEAN DEFAULT false,
    choix_multiple BOOLEAN DEFAULT false,
    date_limite TIMESTAMP,
    date_programmation TIMESTAMP,
    auteur_id UUID NOT NULL REFERENCES utilisateurs(id),
    etablissement_id UUID NOT NULL REFERENCES etablissements(id)
);

CREATE TABLE IF NOT EXISTS sondages_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    texte TEXT NOT NULL,
    ordre INTEGER DEFAULT 0,
    sondage_id UUID NOT NULL REFERENCES sondages(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sondages_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sondage_id UUID NOT NULL REFERENCES sondages(id) ON DELETE CASCADE,
    option_id UUID NOT NULL REFERENCES sondages_options(id) ON DELETE CASCADE,
    voter_id UUID REFERENCES utilisateurs(id),  -- NULL si anonyme
    UNIQUE(sondage_id, voter_id)  -- Unicité vote
);

-- Index
CREATE INDEX IF NOT EXISTS idx_sondages_etablissement ON sondages(etablissement_id);
CREATE INDEX IF NOT EXISTS idx_sondages_statut ON sondages(statut);
CREATE INDEX IF NOT EXISTS idx_sondages_votes_sondage ON sondages_votes(sondage_id);

-- Seeds : Templates par défaut
INSERT INTO templates_sondage (nom, question, options, categorie, visibilite, est_template_systeme)
VALUES 
    ('Satisfaction générale', 'Quel est votre niveau de satisfaction global ?',
     '[{"texte": "Très satisfait"}, {"texte": "Satisfait"}, {"texte": "Moyen"}, {"texte": "Pas satisfait"}]'::jsonb,
     'satisfaction', 'systeme', true);
```

### Étape 7 : Ajouter les permissions RBAC

**Fichier :** `shared/src/enums/roles.enum.ts`

```typescript
export enum Permission {
    // ... existantes ...
    SONDAGES_CREATE = 'sondages:create',
    SONDAGES_VOTE = 'sondages:vote',
    SONDAGES_ANALYZE = 'sondages:analyze',
    SONDAGES_VIEW = 'sondages:view',
    SONDAGES_EDIT = 'sondages:edit',
    SONDAGES_DELETE = 'sondages:delete',
    SONDAGES_TEMPLATES_MANAGE = 'sondages:templates:manage',
}
```

### Étape 8 : Enregistrer le module

**Fichier :** `shared/src/config/config.registry.ts`

```typescript
[ModuleName.SONDAGES]: {
    name: ModuleName.SONDAGES,
    label: 'Sondages',
    description: 'Création et gestion de sondages',
    icon: 'CircleHelp',
    basePath: '/sondages',
    defaultActive: true,
    premium: false,
    defaultRoles: Object.values(Role),
    permissions: [
        Permission.SONDAGES_CREATE,
        Permission.SONDAGES_VOTE,
        Permission.SONDAGES_ANALYZE,
    ],
    dependencies: [ModuleName.AUTH, ModuleName.NOTIFICATIONS],
    defaultSettings: {
        maxDestinataires: 500,
        maxOptions: 20,
        dureeParDefaut: '7j',
        allowAnonymous: true,
        allowMultipleChoice: true,
    },
},
```

### Bonnes pratiques Sondages

1. **TOUJOURS** utiliser des transactions pour créer sondage + options
2. **TOUJOURS** rendre les notifications non-bloquantes (try/catch)
3. **TOUJOURS** filtrer par `etablissementId` pour le multi-tenancy
4. **VÉRIFIER** l'unicité des votes avant d'enregistrer
5. **LOGGER** les échecs de notification avec `logger.warn()`
6. **UTILISER** WebSocket pour notifications temps réel (prêt pour Socket.IO)
7. **CONFIGURER** les cron jobs avec fuseau horaire Africa/Douala
8. **EXPORTER** en CSV pour données brutes, PDF pour visualisation

### Fichiers de Référence

Voir la section complète dans `.qoder/rules/elisaschool-conventions.md` → "19. Module Sondages"

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

## Workflow : Utiliser le Système RBAC v3.0

### Présentation du système RBAC

eLISAschool dispose d'un **système RBAC étendu (v3.0)** avec :
- **~350 permissions** granulaires (format `module:action`)
- **67 rôles système** (couvre Afrique Centrale & Ouest)
- **Multi-rôles** par utilisateur (illimité)
- **Multi-établissements** : Table UtilisateurEtablissement (N:N)
- **Limitations configurables** par rôle (max établissements, validation)
- **Permissions personnalisées** GRANTED/DENIED au niveau utilisateur
- **Cache intelligent** TTL 5 minutes
- **API REST complète** (20+ endpoints pour gestion RBAC)
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
| **Super Admin** | `SUPER_ADMIN` | **TOUTES (~350)** | Accès total, multi-sites illimité |
| **Admin** | `ADMIN` | **~180** | Gestion complète établissement |
| **Chef Établissement** | `CHEF_ETABLISSEMENT` | **~150** | Direction, validation, rapports |
| **Enseignant** | `ENSEIGNANT` | **~60** | Notes, bulletins, messagerie |
| **Parent** | `PARENT` | **~20** | Consultation enfant |
| **Élève** | `ELEVE` | **~15** | Consultation personnelle |
| **Personnel Admin** | `PERSONNEL_ADMINISTRATIF` | **~100** | Administratif, inscriptions |
| **Resp. Cantine** | `RESPONSABLE_CANTINE` | **~30** | Cantine uniquement |
| **Resp. Transport** | `RESPONSABLE_TRANSPORT` | **~25** | Transport uniquement |

> **Note :** Le système dispose maintenant de **67 rôles** couvrant l'ensemble du système éducatif africain (MINISTRE, INSPECTEUR_GÉNÉRAL, PROVISEUR, PRINCIPAL, DIRECTEUR, PROFESSEUR_CERTIFIÉ, etc.). Voir `shared/src/enums/roles.enum.ts` pour la liste complète.

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

## Workflow : Utiliser le Système de Backup (v1.0)

### Présentation

eLISAschool dispose d'un **système de backup production-grade** avec :
- **Sauvegarde configuration** : Snapshots avec versioning sémantique + backups différentiels
- **Sauvegarde database** : Par établissement avec chiffrement AES-256-GCM
- **Storage abstraction** : Interface extensible (DB, S3, FileSystem)
- **Planification** : Cron scheduling + file d'attente avec retry
- **API REST complète** : 15+ endpoints pour gestion backups
- **Monitoring** : Métriques temps réel + usage stockage
- **Clonage inter-établissements** : Avec résolution de conflits

### Étape 1 : Créer un backup configuration

```typescript
import { configBackupService } from '@modules/configuration/services/backup/config-backup.service';

// Snapshot complet
const backup = await configBackupService.createSnapshot('uuid-etablissement', {
    differential: false,
    compress: true,
    encrypt: true,
    retentionDays: 30,
});

// Snapshot différentiel (60-80% plus petit)
const diffBackup = await configBackupService.createSnapshot('uuid', {
    differential: true,
    compress: true,
});
```

### Étape 2 : Créer un backup database

```typescript
import { databaseBackupService } from '@modules/configuration/services/backup/database-backup.service';

const backup = await databaseBackupService.backupEtablissement('uuid-etablissement', {
    compress: true,
    encrypt: true,
    retentionDays: 90,
});
```

### Étape 3 : Restaurer un backup

```typescript
// Config
await configBackupService.restoreBackup('uuid-backup', false);

// Database
await databaseBackupService.restoreBackup('uuid-backup', false);
```

### Étape 4 : Cloner une configuration

```typescript
const results = await configBackupService.cloneConfiguration(
    'source-uuid',
    ['target1-uuid', 'target2-uuid'],
    {
        includeModules: true,
        includeParametres: true,
        conflictResolution: 'merge',
        dryRun: false,
    }
);
```

### Étape 5 : Vérifier l'intégrité

```typescript
const integrity = await databaseBackupService.verifyBackupIntegrity('backup-id');
if (!integrity.valid) {
    console.error('Backup corrompu:', integrity.error);
}
```

### API REST (15+ endpoints)

```bash
# Créer backup config
POST   /api/backups/config

# Créer backup database
POST   /api/backups/database/:etablissementId

# Lister backups
GET    /api/backups?backupType=config&limit=10

# Restaurer
POST   /api/backups/:id/restore

# Vérifier intégrité
POST   /api/backups/:id/verify

# Cloner configuration
POST   /api/configuration/clone

# Métriques
GET    /api/backups/metrics/summary
GET    /api/backups/metrics/:etablissementId
GET    /api/backups/storage-usage
```

### Bonnes pratiques backup

1. **Toujours chiffrer en production** (`encrypt: true`)
2. **Utiliser backups différentiels** pour config (`differential: true`)
3. **Vérifier intégrité** avant restauration (`verifyBackupIntegrity()`)
4. **Configurer BACKUP_ENCRYPTION_KEY** dans `.env` (>= 32 caractères)
5. **Fréquence recommandée** : Config quotidien (30j), DB quotidien (90j)
6. **Tester restaurations** régulièrement sur environnement de test

### Configuration requise

```env
# .env
BACKUP_ENCRYPTION_KEY=votre-cle-secrete-d-au-moins-32-caracteres
```

Générer une clé :
```bash
openssl rand -hex 32
```

### Fichiers de référence Backup

| Fichier | Description |
|---------|-------------|
| `backup.controller.ts` | Controller API REST (466 lignes) |
| `config-backup.service.ts` | Service backup config (604 lignes) |
| `database-backup.service.ts` | Service backup DB (319 lignes) |
| `database-storage.provider.ts` | Provider stockage DB (284 lignes) |
| `backup-record.entity.ts` | Entité métadonnées (177 lignes) |
| `backup.dto.ts` | 9 schémas Zod validation (151 lignes) |
| `008-backup-system-v2.ts` | Migration backup_records |
| `009-backup-schedules-jobs.ts` | Migration planification |
| `BACKUP-SYSTEM-USER-GUIDE.md` | Guide utilisateur complet |
| `BACKUP-SYSTEM-README-FINAL.md` | Documentation technique |

---

## Workflow : Optimiser les Performances

### Règle 1 : Index de base de données

**TOUJOURS créer des index pour :**
- Colonnes de filtrage (`etablissementId`, `statut`, etc.)
- Relations FK (`classeId`, `matiereId`, etc.)
- Contraintes d'unicité (`email`, `matricule`)
- Tri fréquent (`createdAt`)

```typescript
@Entity('eleves')
@Index(['etablissementId'])
@Index(['classeId', 'anneeScolaireId'])  // Composite
@Index(['matricule'], { unique: true })
export class Eleve { ... }
```

### Règle 2 : Requêtes optimisées

```typescript
// ✅ SÉLECTIF
repo.find({
    where: { etablissementId },
    relations: ['classe'],  // Uniquement nécessaire
    select: ['id', 'nom', 'prenom'],  // Colonnes spécifiques
    take: 50,  // TOUJOURS limiter
    skip: offset
});

// ❌ ÉVITER
repo.find({
    relations: ['classe', 'notes', 'bulletins', 'utilisateur']  // Trop de relations
});
```

### Règle 3 : Cache in-memory

```typescript
private cache = new Map<string, any>();
private readonly CACHE_TTL = 5 * 60 * 1000; // 5 min

async getConfig(cle: string) {
    const cached = this.cache.get(cle);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.value;
    }
    
    const value = await this.repo.findOne({ where: { cle } });
    this.cache.set(cle, { value, timestamp: Date.now() });
    return value;
}

// Invalidation après modification
invalidateCache(): void {
    this.cache.clear();
}
```

### Règle 4 : Pagination obligatoire

```typescript
// Controller
const page = parseInt(req.query.page as string) || 1;
const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
const [data, total] = await service.findPaginated({ page, limit });

res.json({
    success: true,
    data,
    pagination: {
        page, limit, total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total
    }
});
```

### Règle 5 : Transactions atomiques

```typescript
const queryRunner = AppDataSource.createQueryRunner();
await queryRunner.connect();
await queryRunner.startTransaction();

try {
    await queryRunner.manager.save(Entity1, data1);
    await queryRunner.manager.save(Entity2, data2);
    await queryRunner.commitTransaction();
} catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
} finally {
    await queryRunner.release();  // TOUJOURS
}
```

### Anti-patterns critiques

**❌ N+1 Query Problem :**
```typescript
// ❌ Lent (N+1 requêtes)
const eleves = await repo.find();
for (const e of eleves) {
    e.notes = await notesRepo.find({ where: { eleveId: e.id } });
}

// ✅ Rapide (1 requête)
const eleves = await repo.find({ relations: ['notes'] });
```

**❌ Sans limite :**
```typescript
// ❌ Memory leak potentiel
const all = await repo.find();

// ✅ Contrôlé
const data = await repo.find({ take: 100 });
```

---

## Intégration de Notifications dans un Service Métier

### Quand utiliser ce workflow

- Ajouter des notifications lors de la création/mise à jour d'une entité
- Notifier les responsables/parents d'un événement (nouvelle note, bulletin disponible, etc.)
- Envoyer des rappels automatiques (paiement cantine, retard bus, etc.)

### Pattern d'Intégration Standardisé

**Étape 1** : Importer le service de templates

```typescript
import { notificationTemplates } from '@modules/notifications/services/notification-templates.service';
import { logger } from '@common/utils/logger.util';
```

**Étape 2** : Ajouter la notification dans la méthode du service (TOUJOURS non-bloquant)

```typescript
async create(dto: CreateNoteDto, enseignantId: string, etablissementId?: string): Promise<Note> {
    // 1. Logique métier principale
    const note = this.repo.create({ ...dto });
    await this.repo.save(note);
    
    // 2. Récupérer les données nécessaires
    const eleve = await eleveRepo.findOne({ 
        where: { id: dto.eleveId },
        relations: ['utilisateur']
    });
    
    if (eleve) {
        // 3. Trouver les responsables via table de jointure
        const responsableRepo = AppDataSource.getRepository('ResponsableEleve');
        const responsabilités = await responsableRepo.find({
            where: { enfantId: eleve.utilisateurId }
        }) as any[];
        
        // 4. Notifier chaque responsable (NON-BLOQUANT)
        for (const resp of responsabilités) {
            try {
                await notificationTemplates.nouvelleNote({
                    destinataireId: resp.utilisateurId,
                    etablissementId,
                    metadata: { noteId: note.id, eleveId: eleve.id },
                }, {
                    eleveNom: `Élève ${eleve.id.substring(0, 8)}`,
                    matiere: matiere?.nom || 'Matière',
                    note: dto.valeur,
                    bareme: dto.bareme || 20,
                });
            } catch (error) {
                logger.warn(`[Notes] Échec notification (non bloquant)`, error);
            }
        }
    }
    
    return note;
}
```

### Points Clés

1. **TOUJOURS** utiliser `try/catch` autour des notifications
2. **JAMAIS** laisser une erreur de notification bloquer la logique métier
3. Utiliser `logger.warn()` pour tracker les échecs de notification
4. Accéder aux responsables via `ResponsableEleve` (PAS via relation `eleve.responsables`)
5. Vérifier la signature du template avant utilisation (variables attendues)

### Templates Disponibles

Consulter `notification-templates.service.ts` pour la liste complète :
- `nouvelleNote` — Nouvelle note publiée
- `bulletinDisponible` — Bulletin prêt
- `rechargementCantine` — Solde rechargé
- `retardBus` — Bus en retard
- `rappelPaiementCantine` — Rappel de paiement (cron job)

---

## Système d'Activation des Modules

### Contexte

eLISAschool supporte l'activation et la désactivation dynamique des modules fonctionnels. Chaque module peut être activé/désactivé par établissement (multi-tenant) avec vérification des dépendances et protection par middleware.

### Architecture

**Trois niveaux de stockage des modules actifs** (résolution en cascade) :
1. `EtablissementConfig.modulesActifs` (priorité, multi-tenant)
2. `ConfigurationApp.modulesActifs` (fallback legacy)
3. `ConfigurationModule.actif` (config détaillée par module)
4. `MODULE_REGISTRY[module].defaultActive` (fallback par défaut)

### Workflow : Activer/Désactiver un Module

**Endpoint API :**
```typescript
POST /api/configuration/modules/:moduleNom/toggle
Body: { "actif": true | false }
```

**Service :**
```typescript
import { configurationService } from '@modules/configuration';

const result = await configurationService.toggleModule(
    'bulletins',           // moduleNom
    true,                  // actif
    etablissementId,       // optionnel (multi-tenant)
    utilisateurId,         // pour l'historique
    req                    // pour l'audit
);

// Retour: { success: true, message: '...', modulesAutoActive?: ['notes'] }
```

### Vérification des Dépendances

Le système vérifie **automatiquement** les dépendances lors de l'activation/désactivation :

**Activation :**
- Si le module a des dépendances inactives → auto-activation des dépendances
- Retourne la liste des modules auto-activés dans `modulesAutoActive`

**Désactivation :**
- Si d'autres modules actifs dépendent de celui-ci → **blocage** avec erreur 400
- Message explicite listant les modules dépendants à désactiver d'abord

**Exemple :**
```typescript
// bulletins dépend de notes
// Si notes est inactif et qu'on active bulletins :
// → notes est automatiquement activé
// → result.modulesAutoActive = ['notes']

// Si on désactive notes alors que bulletins est actif :
// → Erreur 400: "Modules dépendants actifs: Bulletins. Désactivez-les d'abord"
```

### Middleware de Protection

**TOUJOURS** appliquer le middleware `requireModuleActive()` sur les routes des modules optionnels :

```typescript
import { requireModuleActive } from '@modules/configuration/middlewares/module-active.middleware';

// Dans app.ts ou le router du module
app.use('/api/bulletins', requireModuleActive('bulletins'), bulletinsController);
app.use('/api/gamification', requireModuleActive('gamification'), gamificationController);
```

**Comportement du middleware :**
- Vérifie `isModuleActive(moduleNom, etablissementId)`
- Si module inactif → retourne `403 MODULE_INACTIVE`
- Logue la tentative dans l'audit trail
- **Exempte** les modules critiques : `auth`, `utilisateurs`, `configuration`, `notifications`

### Helper : Vérifier si un Module est Actif

```typescript
import { isModuleActive, getParamBoolean } from '@modules/configuration/utils/config.helper';

// Méthode 1: Via le service (recommandé)
const actif = await isModuleActive('bulletins', etablissementId);

// Méthode 2: Via les paramètres système
const actif = await getParamBoolean('bulletins.actif');
```

### Endpoint : Voir les Dépendances d'un Module

```typescript
GET /api/configuration/modules/:moduleNom/dependencies

// Réponse :
{
  "success": true,
  "data": {
    "moduleNom": "bulletins",
    "label": "Bulletins",
    "dependances": [
      { "nom": "notes", "label": "Notes", "actif": true, "requis": true }
    ],
    "reverseDependances": [
      { "nom": "orientation", "label": "Orientation", "actif": false }
    ],
    "estActif": true,
    "peutEtreActive": true,
    "bloquages": []
  }
}
```

### Ajouter un Module au Registre

**1. Ajouter à l'enum `ModuleName`** (`shared/src/enums/modules.enum.ts`) :
```typescript
export enum ModuleName {
  // ...
  MON_MODULE = 'mon_module',
}

export const MODULE_CATEGORIES: Record<ModuleName, ModuleCategory> = {
  // ...
  [ModuleName.MON_MODULE]: ModuleCategory.SYSTEME,
};
```

**2. Ajouter les permissions** (`shared/src/enums/roles.enum.ts`) :
```typescript
export enum Permission {
  // ...
  MON_MODULE_VIEW = 'mon_module:view',
  MON_MODULE_MANAGE = 'mon_module:manage',
}
```

**3. Configurer dans le registre** (`shared/src/config/config.registry.ts`) :
```typescript
[ModuleName.MON_MODULE]: {
    name: ModuleName.MON_MODULE,
    label: 'Mon Module',
    description: 'Description du module',
    icon: 'IconName',
    basePath: '/mon-module',
    defaultActive: false,  // false = désactivé par défaut
    premium: false,
    defaultRoles: [Role.SUPER_ADMIN, Role.ADMIN],
    permissions: [Permission.MON_MODULE_VIEW, Permission.MON_MODULE_MANAGE],
    dependencies: [ModuleName.AUTH],  // Modules requis
    defaultSettings: {
        // Paramètres par défaut du module
    },
},
```

**4. Appliquer le middleware dans `app.ts`** :
```typescript
app.use('/api/mon-module', requireModuleActive('mon-module'), monModuleController);
```

### Points Clés

1. **TOUJOURS** utiliser `EtablissementConfig` pour le multi-tenant (pas `ConfigurationApp`)
2. **TOUJOURS** passer `etablissementId` à `isModuleActive()` et `toggleModule()`
3. **TOUJOURS** appliquer `requireModuleActive()` sur les routes des modules optionnels
4. **VÉRIFIER** les dépendances avant d'activer un module (auto-activation ou erreur)
5. **LOGUER** toutes les activations/désactivations (fait automatiquement par le service)
6. **PARAMÈTRES SYSTÈME** : Chaque module a un paramètre `{module}.actif` créé par le seed

### Fichiers de Référence

- Middleware : `backend/src/modules/configuration/middlewares/module-active.middleware.ts`
- Service : `backend/src/modules/configuration/services/configuration.service.ts`
  - `toggleModule()`, `isModuleActive()`, `verifierDependances()`, `getReverseDependencies()`
- Registre : `shared/src/config/config.registry.ts`
- Helper : `backend/src/modules/configuration/utils/config.helper.ts`
- Migration : `backend/database/migrations/013-sync-modules-actifs.sql`

---

## Système de Permissions RBAC

### Architecture Permissions

**Backend** : ~230 permissions définies dans `shared/src/enums/roles.enum.ts`
- Format : `module:entite:action` (ex: `eleves:create`, `notes:bulk:import`)
- Résolution : `PermissionResolverService` avec cache triple niveau (Redis + In-memory + Global)
- Injection : Permissions incluses dans JWT et retournées par `GET /api/auth/me`

**Frontend** : Contrôle d'accès en 4 niveaux
1. **Route Guards** : `RequirePermission` protège les routes
2. **UI Controls** : `PermissionGate` contrôle l'affichage des éléments
3. **Backend Guards** : `requirePermission()` middleware protège les API
4. **Service Logic** : Vérifications métier dans les services

### Hooks Frontend Disponibles

```typescript
import { useModulePermissions, useCanAccess, useCanViewTab } from '@/hooks';

// Accès complet à un module
const { canAccess, canCreate, canEdit, canDelete, canExport } = useModulePermissions('eleves');

// Vérifier accès route
const canAccess = useCanAccess('finances');

// Vérifier accès onglet
const canViewMedical = useCanViewTab('eleves', 'medical');
```

### Composants Frontend Disponibles

```tsx
import { PermissionGate, RequirePermission, PermissionButton } from '@/components/permissions';

// Protection de route
<RequirePermission module="eleves">
    <ElevesPage />
</RequirePermission>

// Contrôle conditionnel UI
<PermissionGate permission="eleves:create">
    <Button>Nouvel élève</Button>
</PermissionGate>

// Bouton avec permission + tooltip
<PermissionButton permission="eleves:delete" disabledMessage="Suppression non autorisée">
    <Button variant="danger">Supprimer</Button>
</PermissionButton>
```

### Backend : Protéger une Route

```typescript
import { requirePermission } from '@modules/auth/guards/permission.guard';
import { Permission } from '@shared/enums/roles.enum';

router.post('/', 
    authMiddleware, 
    requirePermission(Permission.ELEVES_CREATE),
    async (req, res, next) => { /* ... */ }
);
```

### Conventions de Nommage

- **Module** : lowercase singulier (`eleves`, `notes`, `finances`)
- **Entité** : lowercase pluriel (`paiements`, `bulletins`)
- **Action** : lowercase infinitif (`view`, `create`, `edit`, `delete`, `manage`, `export`, `import`)
- **Séparateur** : deux-points `:` uniquement
- ✅ `eleves:create`, `notes:bulk:import`, `finances:paiements:validate`

### Fichiers de Référence

- **Enum** : `shared/src/enums/roles.enum.ts` (~230 permissions)
- **Resolver** : `backend/src/modules/auth/services/permission-resolver.service.ts`
- **Guards** : `backend/src/modules/auth/guards/permission.guard.ts`
- **Frontend Hooks** : `frontend/src/hooks/use-permissions-advanced.ts` (7 hooks)
- **Frontend Components** : `frontend/src/components/permissions/` (6 composants)
- **Documentation** : `docs/CONVENTIONS-PERMISSIONS.md`, `docs/GUIDE-PERMISSIONS-FRONTEND.md`

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

---

## Module Plateforme (Control Plane) — Panel Admin v7

### Architecture

Le panel d'administration plateforme (Control Plane) gère la plateforme SaaS dans son ensemble :

```
Module Plateforme
├── platform-users/          — CRUD utilisateurs plateforme (6 rôles + scope)
├── platform-roles/          — Role Builder (rôles personnalisés)
├── configuration/           — Paramètres cascade 4 niveaux
└── billing/                 — Facturation, plans, abonnements (existant)
```

### Rôles plateforme (6 rôles)

```typescript
// shared/src/enums/roles.enum.ts
SUPER_ADMIN                    // Accès total, non supprimable
ADMINISTRATION_PLATEFORME      // Gestion quotidienne
SECURITE_PLATEFORME            // Sécurité, RBAC, audit
SUPPORT_PLATEFORME             // Support technique
COMMERCIAL_PLATEFORME          // Commercial, plans, revenus
MONITORING_PLATEFORME          // Monitoring, alertes, metrics
```

### Permissions plateforme

| Permission | Scope |
|-----------|-------|
| `platform:administration:*` | CRUD établissements, facturation, modules, config |
| `platform:securite:*` | RBAC, audit, MFA, users plateforme |
| `platform:support:*` | Monitoring, providers, debugging |
| `platform:commercial:*` | Plans, tarifs, offres, revenus |
| `platform:monitoring:*` | Dashboards, alertes, metrics (read-only) |
| `platform:roles:manage` | SUPER_ADMIN uniquement (Role Builder) |

### Endpoints plateforme (préfixe `/api/platform/`)

```
# Utilisateurs plateforme (à implémenter — Phase V2)
GET    /api/platform/utilisateurs              — Liste paginée (filtres: rôle, MFA, statut)
POST   /api/platform/utilisateurs              — Créer compte plateforme
PATCH  /api/platform/utilisateurs/:id          — Modifier (rôle, scope, statut)
DELETE /api/platform/utilisateurs/:id          — Désactiver (soft delete)

# Role Builder (à implémenter — Phase V2)
GET    /api/platform/roles                     — Liste rôles (défaut + custom)
POST   /api/platform/roles                     — Créer rôle personnalisé
PATCH  /api/platform/roles/:id                 — Modifier permissions

# Cascade paramètres (à implémenter — Phase V3)
GET    /api/platform/parametres/cascade/:cle   — Cascade complète (4 niveaux)
PUT    /api/platform/parametres/cascade/:cle/global — Modifier valeur globale
POST   /api/platform/parametres/cascade/:cle/propager — Appliquer global à tous
```

### Règles de sécurité

- MFA obligatoire (grace period 24h)
- Protection dernier SUPER_ADMIN (non supprimable/rétrogradable)
- Limite 3 sessions simultanées
- Audit trail automatique sur toutes les actions
- Scope par groupe d'établissements (`groupeEtablissementIds` uuid[])

### Documentation de référence
- ADR-001 : `docs/architectures/ADR-001-restructuration-sidebar-plateforme.md`
- ADR-002 : `docs/architectures/ADR-002-roles-plateforme.md`
- ADR-003 : `docs/architectures/ADR-003-parametres-multi-niveaux.md`
- ADR-004 : `docs/architectures/ADR-004-auth0-internalise-dual-plane.md`
- Glossaire : `docs/guides/GLOSSAIRE-PLATEFORME-ADMIN.md`
- Glossaire Identité : `docs/guides/GLOSSAIRE-IDENTITE-PLATEFORME.md`

## Auth Dual-Plane (Modèle C — Auth0 Internalisé)

### Architecture Identité

Le Modèle C sépare l'authentification de l'autorisation via 4 tables :

```
identites                    — Source unique de vérité (email, password hash, MFA, statut)
├── utilisateurs_plateforme  — Admins plateforme (FK → identites, OneToOne)
├── memberships              — Pivot identité × contexte (PLATEFORME | ETABLISSEMENT)
└── permissions_plateforme   — Registre ~40 permissions granulaires
```

### Modules backend dual-plane

```
platform-auth/        — Login (bcrypt + memberships → JWT scopé), logout, getMe
platform-sessions/    — CRUD sessions, limite LRU 3, révocation
identites/            — Entité Identite (entités TypeORM)
utilisateurs-plateforme/ — Entité UtilisateurPlateforme
memberships/          — Entité Membership (pivot)
permissions-plateforme/ — Entité PermissionPlateforme
```

### JWT scopé + Middleware discrimination

```typescript
// JWT payload
{ sub: identiteId, email, platform: { role } | null, tenant: { etablissementId, role } | null }

// Middleware scope-discrimination.ts
// Si route /api/platform/ → vérifier jwt.platform !== null → definePlatformAbility()
// Sinon → vérifier jwt.tenant !== null → defineAbility() (tenant)
```

### Endpoints auth & sessions plateforme

```
POST /api/platform/auth/login     — Login plateforme (public)
POST /api/platform/auth/logout    — Logout (auth requis)
GET  /api/platform/auth/me        — Profil utilisateur + memberships
GET  /api/platform/sessions       — Liste sessions actives
DELETE /api/platform/sessions/:id — Révoquer session
DELETE /api/platform/sessions/all — Révoquer toutes sessions
```

### CASL Dual

```typescript
// shared/src/casl/platform-abilities.ts
definePlatformAbility(ctx: { identiteId, role }) → PlatformAppAbility
// 6 switch cases : SUPER_ADMIN, ADMIN_PLATEFORME, SUPPORT, BILLING_MANAGER, ANALYST, AUDITOR

// Subjects plateforme : PlatformUser, PlatformRole, Etablissement, Facturation, Monitoring, Audit, Session, etc.
```
