# Plan d'Amélioration - Structure Académique eLISAschool

## Contexte

Analyse approfondie de la structure académique (cycles, niveaux, filières, classes) d'eLISAschool pour le système éducatif camerounais biculturel (francophone + anglophone). L'objectif est de corriger les incohérences, éliminer les redondances, et ajouter des champs pertinents pour le contexte africain, tout en restant simple et professionnel.

## Problèmes Identifiés

### P0 - CRITIQUE : Redondance CycleScolaire vs Cycle

**Deux représentations du même concept :**
- `CycleScolaire` enum : MATERNELLE, PRIMAIRE, COLLEGE, LYCEE (dans `EtablissementConfig.cyclesActifs`)
- `Cycle.code` colonne : MATERNELLE, PRIMAIRE, SECONDAIRE_1, SECONDAIRE_2 (entité Cycle)

**Incohérence** : COLLEGE/LYCEE ≠ SECONDAIRE_1/SECONDAIRE_2 → le filtrage par cycle est cassé.

**Solution** : Renommer les codes Cycle pour correspondre à CycleScolaire :
- `SECONDAIRE_1` → `COLLEGE`
- `SECONDAIRE_2` → `LYCEE`

Nécessite une migration SQL pour mettre à jour les données existantes.

### P1 - HAUT : Filiere.sousSysteme en varchar au lieu de enum

- `Filiere.sousSysteme` : `varchar(20)` avec valeurs 'FRANCOPHONE', 'ANGLOPHONE'
- `Niveau.sousSysteme` : `enum SousSysteme` ✅
- `Etablissement.sousSysteme` : `enum SousSysteme` ✅

**Solution** : Convertir `Filiere.sousSysteme` en `enum SousSysteme` (même chose pour `ExamenNational.sousSysteme`).

### P1 - HAUT : Niveau.filiereId mal placé

**Problème conceptuel** : Une filière (C, D, F1, etc.) s'applique à une **classe**, pas à un niveau.

Exemple : "Terminale" est un niveau. "Terminale C" est une classe = Niveau (Terminale) + Filière (C).

**État actuel** :
```
Cycle → Niveau (filiereId nullable) → Classe
```

**Modèle correct** :
```
Cycle → Niveau → Classe (filiereId nullable)
```

**Solution** : 
1. Déprécier `Niveau.filiereId` (le garder pour rétrocompatibilité)
2. Ajouter `Classe.filiereId` (nullable)
3. Mettre à jour le frontend et les services

### P2 - MOYEN : Primaire anglophone incomplet

- Francophone : CI, CP, CE1, CE2, CM1, CM2 (6 niveaux) ✅
- Anglophone : Std 1-5 (5 niveaux) ❌ **Manque Standard 6**

**Solution** : Ajouter `Standard 6` (code: STD6, estClasseExamen: true) et examen FSLC.

### P2 - MOYEN : Classe.options en JSON non structuré

```typescript
@Column({ type: 'simple-json', nullable: true })
options?: string[]; // BILINGUE, ARTISTIQUE... ← Trop vague
```

**Solution** : Remplacer par des enums structurés + champs explicites.

---

## Modifications Proposées

### 1. Backend - Entités

#### 1.1 Cycle (`backend/src/modules/cycles/entities/cycle.entity.ts`)

**Changements** :
- Renommer `code` : `SECONDAIRE_1` → `COLLEGE`, `SECONDAIRE_2` → `LYCEE`
- Via migration SQL

#### 1.2 Filiere (`backend/src/modules/filieres/entities/filiere.entity.ts`)

**Changements** :
```typescript
// AVANT
@Column({ type: 'varchar', length: 20, default: 'FRANCOPHONE', name: 'soussysteme' })
sousSysteme!: string;

// APRÈS
@Column({ type: 'enum', enum: SousSysteme, default: SousSysteme.FRANCOPHONE, name: 'soussysteme' })
sousSysteme!: SousSysteme;
```

#### 1.3 Classe (`backend/src/modules/classes/entities/classe.entity.ts`)

**Changements** :

```typescript
// NOUVEAUX ENUMS (dans un fichier shared ou local)
export enum TypeClasse {
    NORMALE = 'NORMALE',
    BILINGUE = 'BILINGUE',
    RENFORCEE = 'RENFORCEE',
    INTERNATIONALE = 'INTERNATIONALE',
}

export enum CreneauHoraire {
    MATIN = 'MATIN',
    APRES_MIDI = 'APRES_MIDI',
    JOURNEE_COMPLETE = 'JOURNEE_COMPLETE',
}

// NOUVEAUX CHAMPS DANS CLASSE
@Column({ type: 'uuid', nullable: true })
filiereId?: string;

@ManyToOne(() => Filiere, { nullable: true })
@JoinColumn({ name: 'filiereId' })
filiere?: Filiere;

@Column({ type: 'enum', enum: TypeClasse, default: TypeClasse.NORMALE })
typeClasse!: TypeClasse;

@Column({ type: 'enum', enum: CreneauHoraire, default: CreneauHoraire.MATIN })
creneauHoraire!: CreneauHoraire;

@Column({ type: 'text', nullable: true })
description?: string;

// Index
@Index(['filiereId'])
@Index(['typeClasse'])
```

**Suppression** : Retirer `options?: string[]` (remplacé par les enums structurés).

#### 1.4 Niveau (`backend/src/modules/niveaux/entities/niveau.entity.ts`)

**Changements** :
- Ajouter commentaire `@deprecated` sur `filiereId`
- Ne pas supprimer pour rétrocompatibilité

```typescript
/**
 * @deprecated Utiliser Classe.filiereId à la place.
 * Une filière s'applique à une classe, pas à un niveau.
 * Ce champ sera supprimé dans la version 3.0.
 */
@Column({ type: 'uuid', nullable: true })
filiereId?: string;
```

### 2. Backend - DTOs

#### 2.1 Classe DTO (`backend/src/modules/classes/dto/classes.dto.ts`)

```typescript
import { TypeClasse, CreneauHoraire } from '../entities/classe.entity';

export const createClasseSchema = z.object({
    nom: z.string().min(2).max(100),
    code: z.string().min(2).max(50).optional(),
    niveauId: z.string().uuid(),
    anneeScolaireId: z.string().uuid().optional(),
    filiereId: z.string().uuid().nullable().optional(),
    professeurPrincipalId: z.string().uuid().nullable().optional(),
    sallePrincipale: z.string().max(100).optional(),
    effectifMax: z.number().int().positive().default(50),
    typeClasse: z.nativeEnum(TypeClasse).default(TypeClasse.NORMALE),
    creneauHoraire: z.nativeEnum(CreneauHoraire).default(CreneauHoraire.MATIN),
    description: z.string().optional(),
    actif: z.boolean().default(true),
});

export const updateClasseSchema = createClasseSchema.partial();

export type CreateClasseDto = z.infer<typeof createClasseSchema>;
export type UpdateClasseDto = z.infer<typeof updateClasseSchema>;
```

### 3. Backend - Migration SQL

**Fichier** : `backend/database/migrations/055-structure-academique-améliorations.sql`

```sql
-- ==================================
-- Migration 055: Améliorations Structure Académique
-- ==================================
-- Date: 2026-06-13
-- Objectif: Harmoniser cycles, ajouter champs classe, corriger filières

BEGIN;

-- 1. Renommer codes Cycle
UPDATE cycles SET code = 'COLLEGE' WHERE code = 'SECONDAIRE_1';
UPDATE cycles SET code = 'LYCEE' WHERE code = 'SECONDAIRE_2';

-- 2. Convertir filieres.soussysteme en enum
-- Vérifier qu'il n'y a que des valeurs valides
UPDATE filieres SET soussysteme = 'FRANCOPHONE' 
WHERE soussysteme NOT IN ('FRANCOPHONE', 'ANGLOPHONE', 'BICULTUREL');

ALTER TABLE filieres 
    ALTER COLUMN soussysteme TYPE VARCHAR(20),
    ALTER COLUMN soussysteme SET DEFAULT 'FRANCOPHONE';
-- Note: TypeORM gérera la conversion enum au prochain sync/migration

-- 3. Ajouter filiereId à classes
ALTER TABLE classes ADD COLUMN IF NOT EXISTS "filiereId" UUID;
ALTER TABLE classes ADD CONSTRAINT "FK_classes_filieres" 
    FOREIGN KEY ("filiereId") REFERENCES filieres(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS "IDX_classes_filiereId" ON classes("filiereId");

-- 4. Ajouter typeClasse à classes
ALTER TABLE classes ADD COLUMN IF NOT EXISTS "typeClasse" VARCHAR(20) DEFAULT 'NORMALE';
CREATE INDEX IF NOT EXISTS "IDX_classes_typeClasse" ON classes("typeClasse");

-- 5. Ajouter creneauHoraire à classes
ALTER TABLE classes ADD COLUMN IF NOT EXISTS "creneauHoraire" VARCHAR(20) DEFAULT 'MATIN';

-- 6. Ajouter description à classes
ALTER TABLE classes ADD COLUMN IF NOT EXISTS "description" TEXT;

COMMIT;
```

### 4. Backend - Seed Classes

**Fichier** : `backend/src/database/seeds/seed-classes-par-defaut.ts` (NOUVEAU)

```typescript
/**
 * Seed de classes par défaut pour un établissement biculturel
 * À exécuter après le seed de la structure académique
 */

import { AppDataSource } from '@database/data-source';
import { Classe } from '@modules/classes/entities';
import { Niveau, Filiere } from '@modules/niveaux/entities';
import { AnneeScolaire } from '@modules/annees-scolaires/entities';
import { TypeClasse, CreneauHoraire } from '@modules/classes/entities/classe.entity';
import { logger } from '@common/utils/logger.util';

export async function seedClassesParDefaut(etablissementId: string): Promise<void> {
    logger.info('🏫 Seed des classes par défaut...');

    const classeRepo = AppDataSource.getRepository(Classe);
    const niveauRepo = AppDataSource.getRepository(Niveau);
    const filiereRepo = AppDataSource.getRepository(Filiere);
    const anneeRepo = AppDataSource.getRepository(AnneeScolaire);

    // Récupérer l'année scolaire active
    const anneeActive = await anneeRepo.findOne({ where: { enCours: true, etablissementId } });
    if (!anneeActive) {
        logger.warn('⚠️ Aucune année scolaire active, seed classes ignoré');
        return;
    }

    // Récupérer tous les niveaux et filières
    const niveaux = await niveauRepo.find();
    const filieres = await filiereRepo.find();

    const classesData: Array<{
        niveauCode: string;
        sousSysteme: string;
        sections: string[];
        filiereCode?: string;
        typeClasse?: TypeClasse;
        effectifMax?: number;
    }> = [
        // === MATERNELLE FRANCOPHONE ===
        { niveauCode: 'PS', sousSysteme: 'FRANCOPHONE', sections: ['A', 'B'], effectifMax: 30 },
        { niveauCode: 'MS', sousSysteme: 'FRANCOPHONE', sections: ['A', 'B'], effectifMax: 30 },
        { niveauCode: 'GS', sousSysteme: 'FRANCOPHONE', sections: ['A', 'B'], effectifMax: 30 },

        // === PRIMAIRE FRANCOPHONE ===
        { niveauCode: 'CI', sousSysteme: 'FRANCOPHONE', sections: ['A', 'B'], effectifMax: 45 },
        { niveauCode: 'CP', sousSysteme: 'FRANCOPHONE', sections: ['A', 'B', 'C'], effectifMax: 45 },
        { niveauCode: 'CE1', sousSysteme: 'FRANCOPHONE', sections: ['A', 'B', 'C'], effectifMax: 45 },
        { niveauCode: 'CE2', sousSysteme: 'FRANCOPHONE', sections: ['A', 'B', 'C'], effectifMax: 45 },
        { niveauCode: 'CM1', sousSysteme: 'FRANCOPHONE', sections: ['A', 'B'], effectifMax: 45 },
        { niveauCode: 'CM2', sousSysteme: 'FRANCOPHONE', sections: ['A', 'B'], effectifMax: 45 },

        // === COLLÈGE FRANCOPHONE ===
        { niveauCode: '6EME', sousSysteme: 'FRANCOPHONE', sections: ['A', 'B', 'C'], effectifMax: 45 },
        { niveauCode: '5EME', sousSysteme: 'FRANCOPHONE', sections: ['A', 'B', 'C'], effectifMax: 45 },
        { niveauCode: '4EME', sousSysteme: 'FRANCOPHONE', sections: ['A', 'B'], effectifMax: 45 },
        { niveauCode: '3EME', sousSysteme: 'FRANCOPHONE', sections: ['A', 'B'], effectifMax: 45 },

        // === LYCÉE FRANCOPHONE (avec filières) ===
        { niveauCode: 'SECONDE', sousSysteme: 'FRANCOPHONE', sections: ['A'], filiereCode: 'C', effectifMax: 40 },
        { niveauCode: 'SECONDE', sousSysteme: 'FRANCOPHONE', sections: ['A'], filiereCode: 'D', effectifMax: 40 },
        { niveauCode: 'SECONDE', sousSysteme: 'FRANCOPHONE', sections: ['A'], filiereCode: 'A', effectifMax: 40 },
        { niveauCode: 'PREMIERE', sousSysteme: 'FRANCOPHONE', sections: ['A'], filiereCode: 'C', effectifMax: 40 },
        { niveauCode: 'PREMIERE', sousSysteme: 'FRANCOPHONE', sections: ['A'], filiereCode: 'D', effectifMax: 40 },
        { niveauCode: 'PREMIERE', sousSysteme: 'FRANCOPHONE', sections: ['A'], filiereCode: 'A', effectifMax: 40 },
        { niveauCode: 'PREMIERE', sousSysteme: 'FRANCOPHONE', sections: ['A'], filiereCode: 'G2', effectifMax: 40 },
        { niveauCode: 'TERMINALE', sousSysteme: 'FRANCOPHONE', sections: ['A'], filiereCode: 'C', effectifMax: 40 },
        { niveauCode: 'TERMINALE', sousSysteme: 'FRANCOPHONE', sections: ['A'], filiereCode: 'D', effectifMax: 40 },
        { niveauCode: 'TERMINALE', sousSysteme: 'FRANCOPHONE', sections: ['A'], filiereCode: 'A', effectifMax: 40 },
        { niveauCode: 'TERMINALE', sousSysteme: 'FRANCOPHONE', sections: ['A'], filiereCode: 'G2', effectifMax: 40 },

        // === MATERNELLE ANGLOPHONE ===
        { niveauCode: 'NURSERY1', sousSysteme: 'ANGLOPHONE', sections: ['A'], effectifMax: 25 },
        { niveauCode: 'NURSERY2', sousSysteme: 'ANGLOPHONE', sections: ['A'], effectifMax: 25 },

        // === PRIMAIRE ANGLOPHONE ===
        { niveauCode: 'STD1', sousSysteme: 'ANGLOPHONE', sections: ['A', 'B'], effectifMax: 40 },
        { niveauCode: 'STD2', sousSysteme: 'ANGLOPHONE', sections: ['A', 'B'], effectifMax: 40 },
        { niveauCode: 'STD3', sousSysteme: 'ANGLOPHONE', sections: ['A', 'B'], effectifMax: 40 },
        { niveauCode: 'STD4', sousSysteme: 'ANGLOPHONE', sections: ['A', 'B'], effectifMax: 40 },
        { niveauCode: 'STD5', sousSysteme: 'ANGLOPHONE', sections: ['A'], effectifMax: 40 },

        // === COLLÈGE ANGLOPHONE ===
        { niveauCode: 'FORM1', sousSysteme: 'ANGLOPHONE', sections: ['A', 'B'], effectifMax: 40 },
        { niveauCode: 'FORM2', sousSysteme: 'ANGLOPHONE', sections: ['A', 'B'], effectifMax: 40 },
        { niveauCode: 'FORM3', sousSysteme: 'ANGLOPHONE', sections: ['A', 'B'], effectifMax: 40 },
        { niveauCode: 'FORM4', sousSysteme: 'ANGLOPHONE', sections: ['A'], effectifMax: 40 },
        { niveauCode: 'FORM5', sousSysteme: 'ANGLOPHONE', sections: ['A'], effectifMax: 40 },

        // === LYCÉE ANGLOPHONE ===
        { niveauCode: 'LOWER6', sousSysteme: 'ANGLOPHONE', sections: ['A'], typeClasse: TypeClasse.NORMALE, effectifMax: 35 },
        { niveauCode: 'UPPER6', sousSysteme: 'ANGLOPHONE', sections: ['A'], typeClasse: TypeClasse.NORMALE, effectifMax: 35 },
    ];

    let classesCount = 0;

    for (const template of classesData) {
        const niveau = niveaux.find(n => 
            n.code === template.niveauCode && n.sousSysteme === template.sousSysteme
        );
        if (!niveau) {
            logger.warn(`  ⚠️ Niveau ${template.niveauCode} (${template.sousSysteme}) non trouvé`);
            continue;
        }

        // Trouver la filière si applicable
        let filiereId: string | null = null;
        if (template.filiereCode) {
            const filiere = filieres.find(f => f.code === template.filiereCode);
            if (filiere) {
                filiereId = filiere.id;
            } else {
                logger.warn(`  ⚠️ Filière ${template.filiereCode} non trouvée`);
            }
        }

        // Créer les sections
        for (const section of template.sections) {
            const nom = `${niveau.nom} ${section}${filiereId ? ` (${template.filiereCode})` : ''}`;
            const code = `${niveau.code}_${section}${template.filiereCode ? `_${template.filiereCode}` : ''}`;

            const existing = await classeRepo.findOne({ 
                where: { code, anneeScolaireId: anneeActive.id, etablissementId } 
            });

            if (!existing) {
                const classe = classeRepo.create({
                    nom,
                    code,
                    niveauId: niveau.id,
                    filiereId,
                    anneeScolaireId: anneeActive.id,
                    etablissementId,
                    typeClasse: template.typeClasse || TypeClasse.NORMALE,
                    creneauHoraire: CreneauHoraire.MATIN,
                    effectifMax: template.effectifMax || 45,
                    effectifActuel: 0,
                    actif: true,
                });
                await classeRepo.save(classe);
                classesCount++;
            }
        }
    }

    logger.info(`  ✓ ${classesCount} classes créées`);
}
```

### 5. Frontend - Types

#### 5.1 Classe Types (`frontend/src/features/classes/types/classe.types.ts`)

```typescript
export enum TypeClasse {
    NORMALE = 'NORMALE',
    BILINGUE = 'BILINGUE',
    RENFORCEE = 'RENFORCEE',
    INTERNATIONALE = 'INTERNATIONALE',
}

export enum CreneauHoraire {
    MATIN = 'MATIN',
    APRES_MIDI = 'APRES_MIDI',
    JOURNEE_COMPLETE = 'JOURNEE_COMPLETE',
}

export interface Classe {
    id: string;
    nom: string;
    code: string;
    niveauId: string;
    niveau: {
        id: string;
        nom: string;
        code: string;
        sousSysteme: string;
    };
    filiereId?: string;
    filiere?: {
        id: string;
        nom: string;
        code: string;
    };
    anneeScolaireId: string;
    professeurPrincipalId?: string;
    professeurPrincipal?: {
        id: string;
        nom: string;
        prenom: string;
    };
    sallePrincipale?: string;
    effectifMax: number;
    effectifActuel: number;
    typeClasse: TypeClasse;
    creneauHoraire: CreneauHoraire;
    description?: string;
    actif: boolean;
    etablissementId: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreerClasseDto {
    nom: string;
    code?: string;
    niveauId: string;
    filiereId?: string | null;
    anneeScolaireId?: string;
    professeurPrincipalId?: string | null;
    sallePrincipale?: string;
    effectifMax?: number;
    typeClasse?: TypeClasse;
    creneauHoraire?: CreneauHoraire;
    description?: string;
}

export interface ModifierClasseDto extends Partial<CreerClasseDto> {
    id: string;
}
```

### 6. Frontend - Formulaire Classe

#### 6.1 Classe Form Modal (`frontend/src/features/classes/components/classe-form-modal.tsx`)

**Ajouts** :
- Select pour `typeClasse` (Normale, Bilingue, Renforcée, Internationale)
- Select pour `creneauHoraire` (Matin, Après-midi, Journée complète)
- Select pour `filiereId` (affiché uniquement pour niveaux du 2nd cycle)
- Textarea pour `description`
- Affichage conditionnel selon le sous-système

---

## Plan d'Exécution

### Phase 1 : Backend - Corrections Critiques (P0-P1)

1. **Migration SQL** : Renommer cycles, ajouter colonnes classes
2. **Entités** : Mettre à jour `Classe`, `Filiere`, `Niveau`
3. **DTOs** : Mettre à jour schémas Zod
4. **Services** : Adapter `ClassesService`
5. **Test** : Vérifier compilation et endpoints

### Phase 2 : Backend - Seed et Données

6. **Seed classes** : Créer `seed-classes-par-defaut.ts`
7. **Seed anglophone** : Ajouter Standard 6 + FSLC
8. **Test** : Exécuter seeds et vérifier données

### Phase 3 : Frontend - Types et Formulaire

9. **Types** : Mettre à jour `classe.types.ts`
10. **Formulaire** : Ajouter nouveaux champs dans `classe-form-modal.tsx`
11. **Page liste** : Afficher typeClasse et creneauHoraire
12. **Test** : Vérifier CRUD complet

### Phase 4 : Vérification et Documentation

13. **Test intégration** : Créer/modifier/supprimer classes
14. **Vérification** : Cohérence données, absence redondances
15. **Documentation** : Mettre à jour les guides si nécessaire

---

## Fichiers à Modifier

### Backend
| Fichier | Action | Priorité |
|---------|--------|----------|
| `backend/database/migrations/055-structure-academique-améliorations.sql` | **CRÉER** | P0 |
| `backend/src/modules/classes/entities/classe.entity.ts` | MODIFIER | P0 |
| `backend/src/modules/filieres/entities/filiere.entity.ts` | MODIFIER | P1 |
| `backend/src/modules/niveaux/entities/niveau.entity.ts` | MODIFIER (commentaire) | P1 |
| `backend/src/modules/classes/dto/classes.dto.ts` | MODIFIER | P0 |
| `backend/src/modules/classes/services/classes.service.ts` | ADAPTER | P1 |
| `backend/src/database/seeds/seed-classes-par-defaut.ts` | **CRÉER** | P2 |
| `backend/src/database/seeds/seed-structure-academique.ts` | MODIFIER | P2 |
| `backend/src/database/migrations/056-seed-classes-par-defaut.sql` | **CRÉER** | P2 |

### Frontend
| Fichier | Action | Priorité |
|---------|--------|----------|
| `frontend/src/features/classes/types/classe.types.ts` | MODIFIER | P1 |
| `frontend/src/features/classes/components/classe-form-modal.tsx` | MODIFIER | P1 |
| `frontend/src/features/classes/components/classes-page.tsx` | MODIFIER | P2 |
| `frontend/src/features/classes/components/classe-detail-page.tsx` | MODIFIER | P2 |

---

## Vérification

### Backend
```bash
# 1. Compiler
cd backend && npm run build

# 2. Exécuter migration
PGPASSWORD=xxx psql -h localhost -p 5432 -U postgres -d elisaschool -f backend/database/migrations/055-structure-academique-améliorations.sql

# 3. Exécuter seeds
npm run seed:structure-academique
npm run seed:classes-par-defaut

# 4. Tester endpoints
curl -H "Authorization: Bearer TOKEN" http://localhost:7000/api/classes
```

### Frontend
```bash
# 1. Compiler
cd frontend && npm run build

# 2. Démarrer dev
npm run dev

# 3. Tester CRUD classes via interface
# - Créer classe avec filière
# - Modifier typeClasse et creneauHoraire
# - Vérifier affichage liste et détail
```

---

## Questions Ouvertes

1. **Filières anglophones** : Le système anglophone n'a pas de "séries" comme le francophone. Les élèves choisissent des combinainations de sujets au A-Level. Faut-il créer des filières anglophones simplifiées (Science, Arts) ou gérer différemment ?

2. **CycleScolaire utilisé ailleurs ?** : L'enum `CycleScolaire` est-il utilisé dans d'autres logiques métier que `EtablissementConfig.cyclesActifs` ? Si oui, le mapping doit être adapté.

3. **Template de classes personnalisable** : L'utilisateur a demandé un "template personnalisable". Faut-il créer un endpoint API pour générer des classes à partir d'un template, ou le seed suffit-il ?

4. **Multi-sections automatiques** : Faut-il ajouter une logique pour créer automatiquement les sections (A, B, C) lors de la création d'une classe, ou laisser l'admin le faire manuellement ?
