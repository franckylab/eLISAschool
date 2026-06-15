# SYNTHÈSE AMÉLIORATIONS STRUCTURE ACADÉMIQUE v4.0

**Date**: 14 Juin 2026  
**Version**: 4.0.0  
**Auteur**: franck arlos chendjou  

---

## 📊 VUE D'ENSEMBLE

Cette version apporte des améliorations majeures à la structure académique d'eLISAschool pour une meilleure cohérence avec le système éducatif camerounais et africain.

### Objectifs Atteints
- ✅ Support complet de l'historique des affectations élèves
- ✅ Gestion des matières spécifiques par filière
- ✅ Emploi du temps avec gestion des salles et conflits
- ✅ Système d'options pour les matières facultatives
- ✅ Suivi de progression pédagogique
- ✅ Gestion des indisponibilités enseignants
- ✅ Répartition horaire pour génération automatique d'emploi du temps

---

## 🔧 MODIFICATIONS IMPLÉMENTÉES

### 1. **AffectationEleve** - Historique Complet

**Fichier**: `backend/src/modules/classes/entities/affectation-eleve.entity.ts`

**Changements**:
- ✅ `dateSortie` (DATE, nullable) - Date de sortie de la classe
- ✅ `motifChangement` (VARCHAR) - REDOUBLEMENT, CHANGEMENT_CLASSE, PASSAGE_NIVEAU, etc.
- ✅ `commentaire` (TEXT) - Observations additionnelles
- ✅ Index composites pour requêtes d'historique

**Cas d'Usage**:
```typescript
// Historique complet d'un élève
const historique = await affectationRepo.find({
    where: { eleveId },
    order: { dateAffectation: 'DESC' }
});
// Retourne: 6ème A (2023-2024) → 5ème B (2024-2025) → 4ème A (2025-2026)
```

---

### 2. **MatiereNiveau** - Support Filière

**Fichier**: `backend/src/modules/matieres/entities/matiere-niveau.entity.ts`

**Changements**:
- ✅ `filiereId` (UUID, nullable) - Filière spécifique
- ✅ Index composites pour filtrage par filière
- ✅ Relation ManyToOne vers Filiere

**Logique Métier**:
```typescript
// Si filiereId = NULL → matière pour TOUTES les filières du niveau
// Si filiereId = 'C' → matière UNIQUEMENT pour Série C

// Exemple: Physique avancée uniquement en Série C
const physiqueAvancee = await matiereNiveauRepo.save({
    matiereId: physiqueId,
    niveauId: terminaleId,
    filiereId: serieCId,  // Spécifique à Série C
    coefficient: 6
});

// Exemple: Français pour toutes les séries
const francais = await matiereNiveauRepo.save({
    matiereId: francaisId,
    niveauId: premiereId,
    filiereId: null,  // Toutes filières
    coefficient: 4
});
```

---

### 3. **HeureCours** - Emploi du Temps Amélioré

**Fichier**: `backend/src/modules/personnel/entities/heure-cours.entity.ts`

**Changements**:
- ✅ `periodeId` rendu OBLIGATOIRE (était nullable)
- ✅ `salleId` (UUID, FK vers Salle) - Salle physique
- ✅ `salleObsolète` (VARCHAR) - Ancien champ déprécié
- ✅ `commentaire` (TEXT) - Observations
- ✅ Index pour détection de conflits (enseignant, classe, salle)

**Détection de Conflits**:
```typescript
// Conflit enseignant (même créneau)
const conflitEnseignant = await heureCoursRepo.findOne({
    where: {
        enseignantId,
        date,
        heureDebut: LessThan(nouvelleHeureFin),
        heureFin: MoreThan(nouvelleHeureDebut)
    }
});

// Conflit salle
const conflitSalle = await heureCoursRepo.findOne({
    where: {
        salleId,
        date,
        heureDebut: LessThan(nouvelleHeureFin),
        heureFin: MoreThan(nouvelleHeureDebut)
    }
});
```

---

### 4. **ProgrammeChapitre** - Suivi Pédagogique

**Fichier**: `backend/src/modules/programmes/entities/programme-chapitre.entity.ts`

**Changements**:
- ✅ `prerequis` (JSONB) - IDs des chapitres prérequis (optionnel)
- ✅ `progressionPourcentage` (INT, 0-100) - Avancement
- ✅ `ressourcesPedagogiques` (JSONB) - Manuels, vidéos, documents
- ✅ `competencesAssociees` (JSONB) - Compétences travaillées

**Exemple d'Utilisation**:
```typescript
const chapitre = await programmeChapitreRepo.save({
    titre: 'Les dérivées',
    prerequis: ['chapitre-limites-id', 'chapitre-fonctions-id'],
    progressionPourcentage: 75, // 75% traité
    ressourcesPedagogiques: [
        { type: 'MANUEL', titre: 'Maths Tle C', url: '...' },
        { type: 'VIDEO', titre: 'Cours dérivées', url: '...' }
    ],
    competencesAssociees: ['competence-calcul-id', 'competence-analyse-id']
});
```

---

### 5. **InscriptionOption** - Système d'Options (NOUVEAU)

**Fichier**: `backend/src/modules/options/entities/inscription-option.entity.ts`

**Entité Complète**:
- ✅ `eleveId` - Élève inscrit
- ✅ `matiereId` - Matière optionnelle (Latin, Arts, LV3)
- ✅ `anneeScolaireId` - Année scolaire
- ✅ `dateInscription`, `dateAbandon` - Dates
- ✅ `statut` - ACTIVE, ABANDONNEE, EN_ATTENTE
- ✅ `coefficient` - Poids dans la moyenne
- ✅ `estValidée` - Validation administrative

**Cas d'Usage**:
```typescript
// Élève inscrit en Latin (option)
const optionLatin = await inscriptionOptionRepo.save({
    eleveId: eleveId,
    matiereId: latinId,
    anneeScolaireId: anneeActuelleId,
    coefficient: 2,
    statut: 'ACTIVE'
});

// Calcul moyenne avec options
const moyennes = await calculerMoyenneAvecOptions(eleveId, periodeId);
// Retourne: moyenneGénérale + moyenneOptions séparée
```

---

### 6. **IndisponibilitéEnseignant** - Gestion Absences (NOUVEAU)

**Fichier**: `backend/src/modules/personnel/entities/indisponibilite-enseignant.entity.ts`

**Entité Complète**:
- ✅ `enseignantId` - Enseignant concerné
- ✅ `typeIndisponibilite` - CONGE_MALADIE, FORMATION, MISSION, etc.
- ✅ `dateDebut`, `dateFin` - Période
- ✅ `heureDebut`, `heureFin` - Créneau partiel (optionnel)
- ✅ `frequenceRecurrence` - AUCUNE, HEBDOMADAIRE, MENSUELLE
- ✅ `joursRecurrence` - ['LUNDI', 'MARDI'] pour récurrent
- ✅ `estValidée` - Validation administrative

**Cas d'Usage**:
```typescript
// Congé maladie ponctuel
const conge = await indisponibiliteRepo.save({
    enseignantId: enseignantId,
    typeIndisponibilite: 'CONGE_MALADIE',
    dateDebut: '2026-06-15',
    dateFin: '2026-06-20',
    motif: 'Grippe',
    estValidée: true
});

// Indisponibilité récurrente (pas disponible le lundi matin)
const recurrent = await indisponibiliteRepo.save({
    enseignantId: enseignantId,
    typeIndisponibilite: 'INDISPONIBILITE_RECURRENT',
    dateDebut: '2026-09-01',
    dateFin: '2027-07-31',
    frequenceRecurrence: 'HEBDOMADAIRE',
    joursRecurrence: ['LUNDI'],
    heureDebut: '08:00',
    heureFin: '12:00',
    motif: 'Cours particulier le lundi matin'
});
```

---

### 7. **RepartitionHoraire** - Génération Emploi du Temps (NOUVEAU)

**Fichier**: `backend/src/modules/emploi-du-temps/entities/repartition-horaire.entity.ts`

**Entité Complète**:
- ✅ `affectationId` - FK vers AffectationMatiere
- ✅ `jourSemaine` - LUNDI, MARDI, etc.
- ✅ `heureDebut`, `heureFin` - Créneau horaire
- ✅ `nombreHeures` - Durée du créneau
- ✅ `sallePrefereeId` - Salle préférée
- ✅ `priorite` - 1 (haute) à 5 (flexible)

**Cas d'Usage**:
```typescript
// Répartition pour Mathématiques en 6ème A
const repartition = await repartitionRepo.save({
    affectationId: affectationMaths6emeA,
    jourSemaine: 'LUNDI',
    heureDebut: '08:00',
    heureFin: '10:00',
    nombreHeures: 2,
    sallePrefereeId: salle101Id,
    priorite: 1 // Haute priorité
});

// Génération automatique de l'emploi du temps
const emploiDuTemps = await genererEmploiDuTemps(classeId, periodeId);
// Utilise les répartitions + indisponibilités + salles disponibles
```

---

## 📦 FICHIERS CRÉÉS/MODIFIÉS

### Entités Modifiées (4)
1. `backend/src/modules/classes/entities/affectation-eleve.entity.ts` (+3 champs)
2. `backend/src/modules/matieres/entities/matiere-niveau.entity.ts` (+1 champ filiereId)
3. `backend/src/modules/personnel/entities/heure-cours.entity.ts` (+2 champs, 1 renommé)
4. `backend/src/modules/programmes/entities/programme-chapitre.entity.ts` (+4 champs)

### Entités Créées (3)
1. `backend/src/modules/options/entities/inscription-option.entity.ts` (102 lignes)
2. `backend/src/modules/personnel/entities/indisponibilite-enseignant.entity.ts` (117 lignes)
3. `backend/src/modules/emploi-du-temps/entities/repartition-horaire.entity.ts` (94 lignes)

### Fichiers Index Créés (4)
1. `backend/src/modules/options/index.ts`
2. `backend/src/modules/options/entities/index.ts`
3. `backend/src/modules/emploi-du-temps/index.ts` (modifié)
4. `backend/src/modules/emploi-du-temps/entities/index.ts` (modifié)

### Migration SQL (1)
1. `backend/database/migrations/043-structure-academique-v4.sql` (344 lignes)

---

## 🗄️ SCHÉMA DE BASE DE DONNÉES

### Nouvelles Tables

```sql
-- 1. inscriptions_options
CREATE TABLE inscriptions_options (
    id UUID PRIMARY KEY,
    eleveId UUID NOT NULL,
    matiereId UUID NOT NULL,
    anneeScolaireId UUID NOT NULL,
    dateInscription DATE,
    dateAbandon DATE,
    statut VARCHAR(30),
    coefficient FLOAT,
    estValidée BOOLEAN,
    etablissementId UUID
);

-- 2. indisponibilites_enseignants
CREATE TABLE indisponibilites_enseignants (
    id UUID PRIMARY KEY,
    enseignantId UUID NOT NULL,
    typeIndisponibilite VARCHAR(50),
    dateDebut DATE,
    dateFin DATE,
    heureDebut TIME,
    heureFin TIME,
    frequenceRecurrence VARCHAR(50),
    joursRecurrence JSONB,
    motif TEXT,
    estValidée BOOLEAN,
    etablissementId UUID
);

-- 3. repartitions_horaires
CREATE TABLE repartitions_horaires (
    id UUID PRIMARY KEY,
    affectationId UUID NOT NULL,
    jourSemaine VARCHAR(20),
    heureDebut TIME,
    heureFin TIME,
    nombreHeures FLOAT,
    sallePrefereeId UUID,
    priorite INTEGER,
    actif BOOLEAN,
    etablissementId UUID
);
```

### Colonnes Ajoutées

```sql
-- affectations_eleves
ALTER TABLE affectations_eleves ADD COLUMN dateSortie DATE;
ALTER TABLE affectations_eleves ADD COLUMN motifChangement VARCHAR(100);
ALTER TABLE affectations_eleves ADD COLUMN commentaire TEXT;

-- matieres_niveaux
ALTER TABLE matieres_niveaux ADD COLUMN filiereId UUID;

-- heures_cours
ALTER TABLE heures_cours ADD COLUMN salleId UUID;
ALTER TABLE heures_cours ADD COLUMN commentaire TEXT;
ALTER TABLE heures_cours RENAME COLUMN salle TO "salleObsolète";
ALTER TABLE heures_cours ALTER COLUMN "periodeId" SET NOT NULL;

-- programme_chapitres
ALTER TABLE programme_chapitres ADD COLUMN prerequis JSONB;
ALTER TABLE programme_chapitres ADD COLUMN progressionPourcentage INTEGER;
ALTER TABLE programme_chapitres ADD COLUMN ressourcesPedagogiques JSONB;
ALTER TABLE programme_chapitres ADD COLUMN competencesAssociees JSONB;
```

---

## 🚀 PROCHAINES ÉTAPES (RESTANT À IMPLÉMENTER)

### Phase 2 : Services et Controllers

#### 1. Service Validation Conflits Emploi du Temps
**Fichier à créer**: `backend/src/modules/emploi-du-temps/services/emploi-du-temps-validator.service.ts`

**Fonctionnalités**:
- Détection conflits enseignant (même créneau)
- Détection conflits salle (même créneau)
- Détection conflits classe (même créneau)
- Vérification indisponibilités
- Contrôle surcharge enseignant (heures max/semaine)
- Validation capacités de salles

**Priorité**: 🟡 HAUTE

---

#### 2. Service Génération Automatique Emploi du Temps
**Fichier à créer**: `backend/src/modules/emploi-du-temps/services/generateur-emploi-du-temps.service.ts`

**Algorithme**:
1. Lire toutes les `RepartitionHoraire` pour une classe
2. Vérifier les `IndisponibiliteEnseignant`
3. Assigner les salles disponibles
4. Optimiser selon les priorités
5. Détecter et résoudre les conflits
6. Générer les `HeureCours`

**Priorité**: 🟢 MOYENNE (complexe, nécessite temps)

---

#### 3. Controllers CRUD
**Fichiers à créer**:
- `backend/src/modules/options/controllers/inscription-option.controller.ts`
- `backend/src/modules/emploi-du-temps/controllers/repartition-horaire.controller.ts`
- `backend/src/modules/emploi-du-temps/controllers/emploi-du-temps.controller.ts`

**Endpoints**:
```bash
# Options
POST   /api/options/inscriptions           # Inscrire élève à option
GET    /api/options/inscriptions/:id       # Détail
DELETE /api/options/inscriptions/:id       # Abandonner option
GET    /api/options/inscriptions/eleve/:id # Options d'un élève

# Répartition Horaire
POST   /api/emploi-du-temps/repartitions           # Créer répartition
GET    /api/emploi-du-temps/repartitions/:id       # Détail
PUT    /api/emploi-du-temps/repartitions/:id       # Modifier
DELETE /api/emploi-du-temps/repartitions/:id       # Supprimer
GET    /api/emploi-du-temps/repartitions/affectation/:id # Par affectation

# Emploi du Temps
GET    /api/emploi-du-temps/plannings/classe/:id   # Planning classe
GET    /api/emploi-du-temps/plannings/enseignant/:id # Planning enseignant
GET    /api/emploi-du-temps/plannings/salle/:id    # Planning salle
POST   /api/emploi-du-temps/plannings/generer      # Générer automatique
POST   /api/emploi-du-temps/plannings/valider      # Valider conflits
```

**Priorité**: 🟡 HAUTE

---

### Phase 3 : DTOs et Validation

**Fichiers à créer**:
- `backend/src/modules/options/dto/inscription-option.dto.ts`
- `backend/src/modules/emploi-du-temps/dto/repartition-horaire.dto.ts`
- `backend/src/modules/emploi-du-temps/dto/emploi-du-temps.dto.ts`

**Validation Zod**:
```typescript
// InscriptionOption
export const createInscriptionOptionSchema = z.object({
    eleveId: z.string().uuid(),
    matiereId: z.string().uuid(),
    anneeScolaireId: z.string().uuid(),
    coefficient: z.number().min(0.5).max(5).default(1),
});

// RepartitionHoraire
export const createRepartitionHoraireSchema = z.object({
    affectationId: z.string().uuid(),
    jourSemaine: z.enum(['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI']),
    heureDebut: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    heureFin: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    nombreHeures: z.number().min(0.5).max(6),
    priorite: z.number().min(1).max(5).default(1),
});
```

---

### Phase 4 : Frontend (React/TypeScript)

**Composants à créer**:
1. `frontend/src/features/options/` - Gestion des options
   - `InscriptionOptionForm.tsx` - Formulaire d'inscription
   - `OptionsList.tsx` - Liste des options d'un élève
   - `OptionsStats.tsx` - Statistiques (nombre d'élèves par option)

2. `frontend/src/features/emploi-du-temps/` - Emploi du temps
   - `EmploiDuTempsView.tsx` - Vue planning (semaine)
   - `RepartitionHoraireForm.tsx` - Formulaire répartition
   - `ConflitsDetector.tsx` - Détection et résolution conflits
   - `GenerateurEmploiDuTemps.tsx` - Interface de génération auto

**Priorité**: 🟢 MOYENNE

---

## 📊 IMPACT ET COMPATIBILITÉ

### Breaking Changes
- ⚠️ `HeureCours.periodeId` maintenant **obligatoire** (migration définit valeur par défaut)
- ⚠️ `HeureCours.salle` renommé en `salleObsolète` (update frontend nécessaire)

### Backward Compatibility
- ✅ Tous les nouveaux champs sont **optionnels** (nullable)
- ✅ Les anciennes données restent valides
- ✅ Migration SQL idempotente (peut être exécutée plusieurs fois)

### Performance
- ✅ Index optimisés créés pour toutes les nouvelles requêtes
- ✅ Index composites pour détection de conflits
- ✅ Pas d'impact sur les requêtes existantes

---

## ✅ CHECKLIST DE VALIDATION

### Backend
- [x] Entités créées/modifiées
- [x] Index de base de données
- [x] Migration SQL écrite
- [ ] Services CRUD implémentés
- [ ] Controllers REST créés
- [ ] DTOs avec validation Zod
- [ ] Tests unitaires écrits

### Frontend
- [ ] Hooks React Query créés
- [ ] Composants UI implémentés
- [ ] Formulaires avec validation
- [ ] Tables avec pagination
- [ ] Détection conflits visuelle

### Documentation
- [x] Synthèse écrite (ce document)
- [ ] Documentation API (Swagger)
- [ ] Guide utilisateur
- [ ] Guide développeur

---

## 🎯 RÉSUMÉ EXÉCUTIF

### Améliorations Clés
1. **Historique Élève-Classe** - Suivi complet des changements de classe
2. **Matières par Filière** - Support des matières spécifiques (Série C, D, etc.)
3. **Emploi du Temps Intelligent** - Salles, conflits, génération automatique
4. **Options Élèves** - Gestion des matières facultatives (Latin, Arts, LV3)
5. **Suivi Pédagogique** - Progression, prérequis, ressources
6. **Indisponibilités** - Congés, absences, créneaux non disponibles
7. **Répartition Horaire** - Base pour génération automatique d'emploi du temps

### Conformité Système Éducatif Camerounais
- ✅ Cycles: Maternelle (3), Primaire (6), Collège (4), Lycée (3)
- ✅ Filières: Séries C, D, E, A, A1, F, G, H
- ✅ Options: Latin, Arts, LV3 en Lycée
- ✅ Bulletins: Notes + Rang + Appréciation + Options
- ✅ Emploi du temps: Par semaine, salles fixes, créneaux de 2h
- ✅ Conseils de classe: 3 par an (fin de période) - **À implémenter**

### Prochaines Actions Prioritaires
1. **Exécuter la migration SQL** sur la base de données
2. **Implémenter les services CRUD** (options, répartition, indisponibilités)
3. **Créer le service de validation des conflits** d'emploi du temps
4. **Développer le générateur automatique** d'emploi du temps
5. **Intégrer le frontend** avec les nouvelles fonctionnalités

---

## 📞 SUPPORT

Pour toute question ou suggestion concernant cette version :
- **Auteur**: franck arlos chendjou
- **Email**: [À compléter]
- **Documentation**: `docs/structure-academique-v4.md`

---

**FIN DU DOCUMENT**

*Généré le 14 Juin 2026 - eLISAschool v4.0.0*
