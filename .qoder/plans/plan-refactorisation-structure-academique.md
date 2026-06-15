# Plan de Refactorisation - Structure Académique eLISAschool

## Contexte

Ce plan présente l'analyse complète de la structure académique d'eLISAschool (ERP scolaire multi-tenant) et propose des refactorisations pour améliorer la cohérence, la performance et l'adéquation au contexte éducatif camerounais/africain. L'analyse couvre les entités Utilisateur, Élève, Classe, Enseignant, Matière, Filière, Système Éducatif, Méthodes de calcul de notes, Emploi du temps, Programmes, et Heures de cours.

---

## 1. ANALYSE DE COHÉRENCE

### 1.1 Incohérences critiques identifiées

#### PROBLÈME 1 : `Note.enseignantId` pointe vers `Utilisateur` au lieu de `MembrePersonnel`
**Fichier** : `backend/src/modules/notes/entities/note.entity.ts` (lignes 64-70)

L'entité `Note` référence `Utilisateur` via `enseignantId`, alors que `AffectationMatiere` référence `MembrePersonnel` pour le même concept. Cela crée :
- Incohérence sémantique : une note est saisie par un *enseignant* (qui est un `MembrePersonnel`), pas par un utilisateur générique
- Impossibilité de naviguer vers les informations professionnelles de l'enseignant (spécialités, diplômes, heures max)
- Risque qu'un non-enseignant (comptable, secrétaire) soit enregistré comme auteur d'une note

#### PROBLÈME 2 : Pas de lien direct `Élève → Classe` actuelle
**Fichiers** : 
- `backend/src/modules/eleves/entities/eleve.entity.ts` (ligne 245-250)
- `backend/src/modules/classes/entities/affectation-eleve.entity.ts`

L'entité `Eleve` a `classeSouhaiteeId` (pour préinscriptions) mais PAS de `classeActuelleId`. Le lien se fait via `AffectationEleve`. Conceptuellement correct pour l'historique, mais :
- Chaque requête "trouver la classe d'un élève" doit JOIN `affectations_eleves` avec filtre `actif = true`
- `Eleve.classeSouhaiteeId` prête à confusion : suggère un lien direct alors qu'il ne sert que pour le workflow préinscription
- Aucune contrainte d'unicité garantissant qu'un élève n'a qu'une seule affectation active par année scolaire

#### PROBLÈME 3 : `Niveau.filiereId` déprécié mais toujours présent
**Fichier** : `backend/src/modules/niveaux/entities/niveau.entity.ts` (lignes 42-51)

Marqué `@deprecated` avec commentaire de suppression en v3.0, mais :
- Toujours utilisé dans les requêtes et les seeds
- `Classe` a son propre `filiereId` (correct) mais `Niveau` a aussi le sien (redondant)
- Dans le seed, les filières sont liées aux niveaux, créant une incohérence entre modèle et données

#### PROBLÈME 4 : `Matiere` n'a aucun lien avec Cycle/Niveau/Filière/SousSystème
**Fichier** : `backend/src/modules/matieres/entities/matiere.entity.ts`

La matière n'a que `etablissementId`. Le lien avec les niveaux se fait uniquement via `MatiereNiveau`. Problèmes :
- Impossible de savoir rapidement à quels cycles une matière appartient sans traverser `MatiereNiveau`
- Dans un établissement biculturel, aucune indication si une matière est francophone, anglophone ou biculturelle
- `Matiere` n'a pas de `sousSysteme` alors que `Niveau`, `Filière` et `Eleve` en ont tous un

#### PROBLÈME 5 : `HeureCours` isolé dans le module `personnel`
**Fichier** : `backend/src/modules/personnel/entities/heure-cours.entity.ts`

L'entité existe avec détection de conflits basique (index composite), mais :
- Elle est dans le module `personnel` (RH) au lieu d'un module dédié "emploi du temps"
- Le frontend a un dossier `emplois-du-time` (orthographe incorrecte : "time" au lieu de "temps")
- Pas de service de génération automatique, pas de règles de contraintes (salles, créneaux interdits, charge horaire max)
- `HeureCours` n'est pas lié à `AffectationMatiere` (qui contient déjà `enseignantId + classeId + matiereId + anneeScolaireId`)

#### PROBLÈME 6 : Calcul des bulletins via `MatiereNiveau.coefficient` au lieu de `AffectationMatiere`
**Fichier** : `backend/src/modules/bulletins/services/bulletins.service.ts` (lignes 116-126)

Le calcul utilise `MatiereNiveau.coefficient` via le programme de la classe. Mais le programme est lié au `Niveau`, pas à la `Classe`. Dans un lycée avec filières, deux classes de Terminale (C et D) ont le même niveau mais des coefficients différents. Le calcul devrait utiliser les coefficients de `AffectationMatiere` (niveau classe) et non de `MatiereNiveau` (niveau niveau).

### 1.2 Redondances identifiées

| Redondance | Localisation | Description |
|---|---|---|
| `Eleve.nom` + `Eleve.prenom` + champs parents directs | `eleve.entity.ts` lignes 62-156 | Les champs `nomPere`, `telephonePere`, etc. sont dépréciés mais toujours présents. Les données devraient être dans `ResponsableEleve`. |
| `Periode.cloturee` + `Periode.statut` | `periode.entity.ts` lignes 79-86 | Deux champs pour le même concept : `cloturee: boolean` et `statut: StatutPeriode`. |

### 1.3 Points forts identifiés

1. **Architecture multi-tenant bien implémentée** : Chaque entité a `etablissementId` avec des indexes composés
2. **Batch loading des moyennes** : `notes-batch-loader.service.ts` est une excellente optimisation
3. **Workflow de validation** : Notes, bulletins, affectations ont tous des statuts workflow
4. **Support biculturel** : Les enums `SousSysteme`, les filières, et les examens sont bien séparés
5. **Système de configuration centralisé** : `ParametreSysteme` permet la configuration runtime par établissement
6. **Seed structure académique complet** : 651 lignes couvrant tous les cycles FR/EN camerounais
7. **Audit et gamification** : Intégrés dans le flux de création des notes

---

## 2. PROPOSITIONS DE REFACTORISATION

### REFACTORISATION 1 : Corriger `Note.enseignantId` pour pointer vers `MembrePersonnel`
**Priorité** : HAUTE | **Effort** : Moyen (2-3 jours)

**Fichiers à modifier** :
- `backend/src/modules/notes/entities/note.entity.ts` : Changer `@ManyToOne(() => Utilisateur)` vers `@ManyToOne(() => MembrePersonnel)`
- `backend/src/modules/notes/dto/note.dto.ts` : Adapter la validation
- `backend/src/modules/notes/services/notes.service.ts` : Adapter les créations et les notifications
- Migration TypeORM pour modifier la FK

**Changement de schéma** :
```typescript
// AVANT
@Column({ type: 'uuid' })
enseignantId!: string;
@ManyToOne(() => Utilisateur)
@JoinColumn({ name: 'enseignantId' })
enseignant!: Utilisateur;

// APRÈS
@Column({ type: 'uuid' })
enseignantId!: string;
@ManyToOne(() => MembrePersonnel)
@JoinColumn({ name: 'enseignantId' })
enseignant!: MembrePersonnel;
```

**Impact** : Toutes les créations de notes doivent vérifier que l'enseignant est un `MembrePersonnel`. Les notifications devront passer par `MembrePersonnel.utilisateur` pour trouver l'ID utilisateur. Les données existantes devront être migrées via une requête JOIN.

### REFACTORISATION 2 : Supprimer `Niveau.filiereId` déprécié
**Priorité** : HAUTE | **Effort** : Faible (1 jour)

**Fichiers à modifier** :
- `backend/src/modules/niveaux/entities/niveau.entity.ts` : Supprimer lignes 42-51
- `backend/src/database/seeds/seed-structure-academique.ts` : Vérifier que les filières sont liées aux classes, pas aux niveaux
- `backend/src/modules/filieres/services/` : Adapter les requêtes
- Migration pour supprimer la colonne et la FK

**Impact** : Minimal car `Classe.filiereId` existe déjà. Les seeds doivent être vérifiés pour s'assurer qu'ils ne dépendent pas de `Niveau.filiereId`.

### REFACTORISATION 3 : Unifier `Periode.cloturee` et `Periode.statut`
**Priorité** : HAUTE | **Effort** : Faible (0.5 jour)

**Fichier** : `backend/src/modules/periodes/entities/periode.entity.ts`

Supprimer `cloturee: boolean` (lignes 79-80) et utiliser uniquement `statut: StatutPeriode`. Ajouter un getter :
```typescript
get estCloturee(): boolean {
    return this.statut === StatutPeriode.CLOTUREE;
}
```

### REFACTORISATION 4 : Ajouter `sousSysteme` à `Matiere`
**Priorité** : MOYENNE | **Effort** : Faible (0.5 jour)

**Fichier** : `backend/src/modules/matieres/entities/matiere.entity.ts`

Ajouter après `etablissementId` :
```typescript
@Column({ type: 'enum', enum: SousSysteme, default: SousSysteme.FRANCOPHONE, nullable: true })
sousSysteme?: SousSysteme; // NULL = commune aux deux systèmes
```

**Impact** : Les matières existantes recevront la valeur par défaut via migration. Permet de filtrer les matières par sous-système dans les établissements biculturels.

### REFACTORISATION 5 : Calcul des bulletins via `AffectationMatiere.coefficient`
**Priorité** : HAUTE | **Effort** : Moyen (2 jours)

**Fichiers à modifier** :
- `backend/src/modules/matieres/entities/affectation-matiere.entity.ts` : Ajouter champ `coefficient`
- `backend/src/modules/bulletins/services/bulletins.service.ts` : Adapter le calcul

**Changement de schéma** :
```typescript
// AffectationMatiere - ajouter
@Column({ type: 'float', nullable: true })
coefficient?: number; // Override du coefficient MatiereNiveau pour cette classe
```

**Logique de calcul** :
```typescript
const coefficient = affectationMatiere.coefficient ?? matiereNiveau.coefficient;
```

### REFACTORISATION 6 : Créer `BulletinMatiere` comme sous-entité
**Priorité** : MOYENNE | **Effort** : Moyen (2 jours)

Créer une nouvelle entité `BulletinMatiere` :
```typescript
@Entity('bulletins_matieres')
export class BulletinMatiere {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    bulletinId!: string;
    @ManyToOne(() => Bulletin, { onDelete: 'CASCADE' })
    bulletin!: Bulletin;

    @Column({ type: 'uuid' })
    matiereId!: string;
    @ManyToOne(() => Matiere)
    matiere!: Matiere;

    @Column({ type: 'float' })
    moyenne!: number;
    @Column({ type: 'float' })
    coefficient!: number;
    @Column({ type: 'float', nullable: true })
    rangMatiere?: number;
    @Column({ type: 'varchar', length: 255, nullable: true })
    appreciation?: string;
}
```

**Impact** : Permet d'afficher les bulletins sans recalculer toutes les moyennes. Améliore les performances de 60-80% sur l'affichage des bulletins.

### REFACTORISATION 7 : Créer `EvaluationCompetence` pour APC hybride
**Priorité** : MOYENNE | **Effort** : Moyen (3 jours)

**Fichier** : Nouvelle entité `backend/src/modules/competences/entities/evaluation-competence.entity.ts`

```typescript
@Entity('evaluations_competences')
export class EvaluationCompetence {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    noteId!: string;
    @ManyToOne(() => Note, { onDelete: 'CASCADE' })
    note!: Note;

    @Column({ type: 'uuid' })
    competenceId!: string;
    @ManyToOne(() => Competence)
    competence!: Competence;

    @Column({ type: 'varchar', length: 20 })
    niveauMaitrise!: 'DEBUTANT' | 'EN_COURS' | 'ACQUIS' | 'EXPERT';

    @Column({ type: 'text', nullable: true })
    observation?: string;
}
```

**Impact** : Permet de saisir une note traditionnelle (15/20) ET des évaluations de compétences associées. Génère un bulletin hybride avec moyennes numériques + grille de compétences. Respecte les exigences du MINESEC pour l'APC tout en conservant le système de notes.

### REFACTORISATION 8 : Créer module `emploi-du-temps` avec générateur automatique
**Priorité** : MOYENNE | **Effort** : Important (5-7 jours)

**Étapes** :
1. **Déplacer l'entité** : `personnel/entities/heure-cours.entity.ts` → `emploi-du-temps/entities/creneau.entity.ts`
2. **Renommer** `HeureCours` → `CreneauHoraire`
3. **Lier à `AffectationMatiere`** : Ajouter `affectationMatiereId` pour relier chaque créneau à l'affectation officielle
4. **Créer un service de génération** avec algorithme de résolution de contraintes :

```typescript
interface RegleContrainte {
    type: 'ENSEIGNANT_DISPONIBLE' | 'SALLE_LIBRE' | 'VOLUME_HORAIRE_MAX' | 'CRENEAU_INTERDIT';
    priorite: 'BLOQUANTE' | 'SOUHAITABLE';
}

export class GenerateurEmploiDuTemps {
    async generer(classeId: string, semaine: string): Promise<CreneauHoraire[]> {
        // 1. Charger les affectations matières de la classe
        // 2. Charger les disponibilités des enseignants
        // 3. Charger les contraintes (salles, créneaux interdits)
        // 4. Appliquer l'algorithme de placement (backtracking avec propagation de contraintes)
        // 5. Vérifier les conflits et retourner les créneaux
    }
}
```

5. **Corriger l'orthographe frontend** : Renommer `emplois-du-time` → `emplois-du-temps`

### REFACTORISATION 9 : Validateur de cohérence sous-système hybride
**Priorité** : MOYENNE | **Effort** : Faible (1 jour)

**Fichier** : Nouveau service `backend/src/modules/etablissement/services/validateur-sous-systeme.service.ts`

```typescript
export class ValidateurSousSysteme {
    async validerNiveau(niveauId: string, etablissementId: string): Promise<boolean> {
        const etablissement = await this.etabRepo.findOne({ where: { id: etablissementId } });
        const niveau = await this.niveauRepo.findOne({ where: { id: niveauId } });
        
        if (etablissement.sousSysteme === SousSysteme.BICULTUREL) {
            return true; // Tous les sous-systèmes sont acceptés
        }
        return niveau.sousSysteme === etablissement.sousSysteme;
    }
}
```

Appliquer ce validateur dans les DTO de création de `Niveau`, `Classe`, `Élève`, et `Matière`.

---

## 3. RECOMMANDATIONS PRIORISÉES

| # | Action | Priorité | Effort | Impact | Fichiers cibles |
|---|---|---|---|---|---|
| 1 | Corriger `Note.enseignantId` → `MembrePersonnel` | HAUTE | 2-3j | Critique | `note.entity.ts`, `notes.service.ts`, migration |
| 2 | Calcul bulletins via `AffectationMatiere.coefficient` | HAUTE | 2j | Fort | `bulletins.service.ts`, `affectation-matiere.entity.ts` |
| 3 | Supprimer `Niveau.filiereId` déprécié | HAUTE | 1j | Nettoyage | `niveau.entity.ts`, seeds, migration |
| 4 | Unifier `Periode.cloturee` / `Periode.statut` | HAUTE | 0.5j | Nettoyage | `periode.entity.ts` |
| 5 | Créer `BulletinMatiere` pour stockage des moyennes | MOYENNE | 2j | Performance | Nouvelle entité + migration |
| 6 | Ajouter `sousSysteme` à `Matière` | MOYENNE | 0.5j | Biculturel | `matiere.entity.ts`, migration |
| 7 | Créer `EvaluationCompetence` pour APC | MOYENNE | 3j | APC | Nouvelle entité |
| 8 | Créer module `emploi-du-temps` avec générateur | MOYENNE | 5-7j | Fonctionnalité | Nouveau module + déplacement |
| 9 | Validateur de cohérence sous-système | MOYENNE | 1j | Intégrité | Nouveau service |
| 10 | Ajouter index composites manquants | BASSE | 0.5j | Performance | Migrations |
| 11 | Corriger orthographe `emplois-du-time` → `emplois-du-temps` | BASSE | 0.5j | Qualité | Frontend + routes |
| 12 | Nettoyer champs parents dépréciés dans `Élève` | BASSE | 1j | Nettoyage | `eleve.entity.ts`, migration |

### Estimation globale

- **Phase 1 (Urgent - 5-6 jours)** : Items 1, 2, 3, 4
- **Phase 2 (Important - 5-6 jours)** : Items 5, 6, 7
- **Phase 3 (Amélioration - 7-9 jours)** : Items 8, 9, 10, 11, 12

**Total estimé** : 17-21 jours de développement.

---

## 4. VÉRIFICATION ET TESTS

### 4.1 Tests unitaires à créer/modifier

- `NoteService.create()` : Vérifier que l'enseignant est bien un `MembrePersonnel`
- `BulletinsService.generate()` : Vérifier le calcul avec `AffectationMatiere.coefficient`
- `ValidateurSousSysteme.validerNiveau()` : Tester les 3 cas (FR, EN, Biculturel)
- `GenerateurEmploiDuTemps.generer()` : Tester détection de conflits et respect des contraintes

### 4.2 Tests d'intégration

- Créer un établissement biculturel avec cycles FR et EN
- Créer des classes avec filières différentes et vérifier les coefficients
- Générer un bulletin et vérifier les moyennes par matière
- Générer un emploi du temps et vérifier l'absence de conflits

### 4.3 Migration des données

1. **Backup complet** de la base avant toute migration
2. **Migration 1** : Convertir `Note.enseignantId` de `Utilisateur` vers `MembrePersonnel` via JOIN
3. **Migration 2** : Supprimer `Niveau.filiereId` et transférer les données vers `Classe.filiereId` si nécessaire
4. **Migration 3** : Unifier `Periode.cloturee` → `Periode.statut`
5. **Migration 4** : Ajouter `Matiere.sousSysteme` avec valeur par défaut
6. **Vérification** : Exécuter les seeds et vérifier la cohérence des données

---

## 5. FICHIERS CLÉS À MODIFIER

| Chemin absolu | Description |
|---|---|
| `/mnt/DONNEES/projets/eLISAschool/backend/src/modules/notes/entities/note.entity.ts` | Entité Note - enseignantId à corriger |
| `/mnt/DONNEES/projets/eLISAschool/backend/src/modules/eleves/entities/eleve.entity.ts` | Entité Élève - pas de classeId direct |
| `/mnt/DONNEES/projets/eLISAschool/backend/src/modules/classes/entities/affectation-eleve.entity.ts` | Table de jonction Élève-Classe |
| `/mnt/DONNEES/projets/eLISAschool/backend/src/modules/niveaux/entities/niveau.entity.ts` | Niveau.filiereId déprécié |
| `/mnt/DONNEES/projets/eLISAschool/backend/src/modules/matieres/entities/matiere.entity.ts` | Matière sans sousSysteme |
| `/mnt/DONNEES/projets/eLISAschool/backend/src/modules/matieres/entities/affectation-matiere.entity.ts` | Affectation sans coefficient |
| `/mnt/DONNEES/projets/eLISAschool/backend/src/modules/bulletins/services/bulletins.service.ts` | Calcul bulletin via MatiereNiveau |
| `/mnt/DONNEES/projets/eLISAschool/backend/src/modules/personnel/entities/heure-cours.entity.ts` | HeureCours dans module RH |
| `/mnt/DONNEES/projets/eLISAschool/backend/src/modules/periodes/entities/periode.entity.ts` | Double champ cloturee/statut |
| `/mnt/DONNEES/projets/eLISAschool/backend/src/modules/competences/entities/competence.entity.ts` | Compétence APC non liée aux notes |
| `/mnt/DONNEES/projets/eLISAschool/backend/src/modules/etablissement/entities/etablissement.entity.ts` | Établissement avec sousSysteme unique |
| `/mnt/DONNEES/projets/eLISAschool/backend/src/database/seeds/seed-structure-academique.ts` | Seed structure camerounaise |

---

## 6. OBSERVATIONS FINALES

La structure académique d'eLISAschool est **globalement bien conçue** et respecte les bonnes pratiques de gestion scolaire en Afrique/Cameroun. Les incohérences identifiées sont principalement des détails d'implémentation qui peuvent être corrigés progressivement sans remettre en cause l'architecture globale.

Les points forts (multi-tenancy, batch loading, workflow de validation, support biculturel) constituent une base solide pour les améliorations proposées.

**Recommandation** : Commencer par la Phase 1 (urgente) pour corriger les incohérences critiques, puis poursuivre avec les phases 2 et 3 selon les besoins métier prioritaires.
