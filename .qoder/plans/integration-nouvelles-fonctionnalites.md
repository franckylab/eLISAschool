# Plan d'Intégration des Nouvelles Fonctionnalités - eLISAschool

## Contexte

Ce plan décrit l'intégration de 6 grandes fonctionnalités dans eLISAschool :
1. **Authentification multi-mode** (email, pseudonyme, matricule, QR code, ID)
2. **Amélioration du module Cartes** (modèles, impression, batch, QR dynamiques)
3. **Extension de la Paie** (éléments de salaire, cotisations, calcul automatique, PDF)
4. **Suivi comportement Élèves** (incidents, observations, sanctions, félicitations)
5. **Suivi RH Personnel/Enseignants** (incidents, évaluations, formations)
6. **Module Santé complet** (fiches médicales, consultations, handicaps, allergies, vaccins)
7. **Champs d'identification additionnels** (Établissements, Élèves, Responsables, Enseignants, Personnel)

---

## Ordre de Priorité et Dépendances

```
PHASE 1 (Fondations)
  1.1 Champs identification additionnels → Bloque tout le reste
  1.2 Auth multi-mode → Dépend de 1.1

PHASE 2 (Extension modules existants)
  2.1 Module Cartes amélioré → Dépend de 1.1, 1.2
  2.2 Paie étendue → Dépend de 1.1

PHASE 3 (Nouveaux modules suivi)
  3.1 Suivi-Élèves (nouveau module)
  3.2 Suivi-Personnel (extension personnel)

PHASE 4 (Module Santé)
  4.1 Module Santé complet

PHASE 5 (Intégration transversale)
  5.1 Permissions RBAC + Seeds + Migrations
```

---

## PHASE 1.1 : Champs d'Identification Additionnels

### Fichiers à modifier

| Fichier | Modification |
|---------|-------------|
| `backend/src/modules/etablissement/entities/etablissement.entity.ts` | +13 champs |
| `backend/src/modules/etablissement/dto/etablissement.dto.ts` | DTOs update |
| `backend/src/modules/eleves/entities/eleve.entity.ts` | +13 champs |
| `backend/src/modules/eleves/dto/eleves.dto.ts` | DTOs update |
| `backend/src/modules/responsables-eleves/entities/responsable-eleve.entity.ts` | +10 champs |
| `backend/src/modules/responsables-eleves/dto/responsables-eleves.dto.ts` | DTOs update |
| `backend/src/modules/personnel/entities/personnel.entity.ts` | +10 champs |
| `backend/src/modules/personnel/dto/personnel.dto.ts` | DTOs update |

### Nouvelles migrations SQL
- `backend/database/migrations/023-etablissement-champs-additionnels.sql`
- `backend/database/migrations/024-eleve-champs-additionnels.sql`
- `backend/database/migrations/025-responsable-champs-additionnels.sql`
- `backend/database/migrations/026-personnel-champs-additionnels.sql`

### Nouveaux champs par entité

**Établissement** (13 champs) : `codeEtablissement`, `numeroContribuable`, `numeroCompteBancaire`, `siteWeb`, `facebook`, `twitter`, `heuresOuverture`, `heuresFermeture`, `effectifMax`, `effectifActuel`, `directeurNom`, `directeurAdjointNom`, `censeurNom`, `surveillantGeneralNom`

**Élève** (13 champs) : `photo`, `groupeSanguin`, `allergies` (JSON), `nomContactUrgence`, `telephoneContactUrgence`, `adresseDomicile`, `ville`, `quartier`, `ecoleProvenance`, `classeAnterieure`, `redoublement`, `boursier`, `regimeInterne`

**Responsable** (10 champs) : `profession`, `lieuTravail`, `telephoneTravail`, `emailTravail`, `adresseProfessionnelle`, `revenuMensuel`, `personneContactUrgence`, `telephoneContactUrgence`, `autorisationSortie`, `autorisationMedicale`

**Personnel** (10 champs) : `posteExact`, `service`, `responsableHierarchiqueId` (FK recursive), `competences` (JSON), `specialitePrincipale`, `anneesExperience`, `educationNiveau`, `etablissementOrigine`, `disponibilites` (JSON), `heuresMaxSemaine`, `horairesTravail` (JSON)

**Complexité** : Simple | **Estimation** : 2.5 jours

---

## PHASE 1.2 : Authentification Multi-Mode

### Fichiers à modifier

| Fichier | Modification |
|---------|-------------|
| `backend/src/modules/auth/entities/utilisateur.entity.ts` | +2 champs (`pseudonyme`, `qrCodeId`) |
| `shared/src/validators/auth.validators.ts` | `loginSchema` : `email` → `identifiant` |
| `backend/src/modules/auth/dto/auth.dto.ts` | Mettre à jour `LoginResponseDto` |
| `backend/src/modules/auth/services/auth.service.ts` | `login()` : recherche multi-critère (OR) |

### Nouvelle migration
- `backend/database/migrations/027-auth-multi-mode.sql`

### Stratégie de recherche dans AuthService.login()
```typescript
const where: any = [];
const identifiant = loginDto.identifiant.toLowerCase().trim();

if (identifiant.includes('@')) {
  where.push({ email: identifiant });
}
where.push({ matricule: identifiant });
where.push({ pseudonyme: identifiant });
where.push({ qrCodeId: identifiant });

const utilisateur = await this.utilisateurRepository.findOne({ where, select: [...] });
```

### Points d'attention
- **Breaking change frontend** : `email` → `identifiant` (supporter les deux pendant transition)
- **Pseudonyme unique** : validation dans DTO
- **QR code** : synchroniser `Utilisateur.qrCodeId` avec `Carte.numeroCarte`
- **Index** : ajouter indexes sur `pseudonyme` et `qrCodeId`

**Complexité** : Moyen | **Estimation** : 2.5 jours

---

## PHASE 2.1 : Amélioration Module Cartes

### Fichiers à créer

```
backend/src/modules/cartes/
  entities/modele-carte.entity.ts
  dto/modele-carte.dto.ts
  services/modele-carte.service.ts
  services/generation-batch.service.ts
```

### Fichiers à modifier

| Fichier | Modification |
|---------|-------------|
| `backend/src/modules/cartes/entities/carte.entity.ts` | +2 champs (`modeleCarteId`, `categorieTitulaire`) |
| `backend/src/modules/cartes/services/cartes.service.ts` | Intégrer modèles + batch |
| `backend/src/modules/cartes/controllers/cartes.controller.ts` | +endpoints batch, modèles |

### Nouvelle entité ModeleCarte
```typescript
@Entity('modeles_cartes')
class ModeleCarte {
  id: uuid
  nom: varchar(100)
  type: TypeCarte
  etablissementId: uuid
  largeur: int (85.6mm par défaut)
  hauteur: int (53.98mm par défaut)
  orientation: 'PORTRAIT' | 'PAYSAGE'
  champsAffiches: JSON ['photo', 'nom', 'prenom', 'matricule', 'classe']
  couleurPrimaire: varchar(7)
  couleurSecondaire: varchar(7)
  logoUrl: varchar(500)
  templateHtml: text
  parDefaut: boolean
  actif: boolean
}
```

### Fonctionnalités ajoutées
- CRUD modèles de cartes
- Génération batch par classe (`genererCartesClasse()`)
- QR codes dynamiques (JSON encodé)
- Intégration avec module Impressions pour PDF
- Historique cartes par utilisateur

**Complexité** : Moyen | **Estimation** : 6.5 jours

---

## PHASE 2.2 : Extension Paie (dans module Personnel)

### Fichiers à créer

```
backend/src/modules/personnel/
  entities/element-salaire.entity.ts
  entities/cotisation.entity.ts
  entities/type-prime.entity.ts
  entities/type-retenue.entity.ts
  dto/element-salaire.dto.ts
  dto/cotisation.dto.ts
  dto/type-prime.dto.ts
  dto/type-retenue.dto.ts
  services/calcul-paie.service.ts
  services/simulation-paie.service.ts
  controllers/element-salaire.controller.ts
  controllers/cotisation.controller.ts
  controllers/type-prime.controller.ts
  controllers/type-retenue.controller.ts
  controllers/simulation-paie.controller.ts
```

### Nouvelles entités

**ElementSalaire** : Composants détaillés du bulletin (gains/retenues)
**Cotisation** : CNPS, AMO, IRPP (taux patronal/salarial)
**TypePrime** : Ancienneté, rendement, transport, logement
**TypeRetenue** : Avances, prêts, sanctions

### Relation avec BulletinPaie existant
- **Garder** colonnes existantes (`salaireBase`, `primes`, `deductions`, `salaireNet`) comme agrégateurs
- **Ajouter** `@OneToMany(() => ElementSalaire)` pour le détail
- Calcul automatique : somme des `ElementSalaire` → colonnes agrégées

### Services clés
```typescript
calculerBulletin(membrePersonnelId, mois, annee): Promise<BulletinPaie>
exporterPDF(bulletinId): Promise<string>
simulerPaie(membrePersonnelId, params): Promise<SimulationResult>
```

### Points d'attention
- Précision décimale : `decimal(12,2)` uniquement
- Immutabilité : bulletin `PAYE` non modifiable
- Taux CNPS configurables en DB
- Export PDF via module Impressions

**Complexité** : Complexe | **Estimation** : 12 jours

---

## PHASE 3.1 : Module Suivi-Élèves (NOUVEAU MODULE)

### Structure complète du module

```
backend/src/modules/suivi-eleves/
  index.ts
  entities/
    incident-eleve.entity.ts
    observation-eleve.entity.ts
    sanction-eleve.entity.ts
    felicitation-eleve.entity.ts
  dto/ (4 fichiers)
  services/
    incidents.service.ts
    observations.service.ts
    sanctions.service.ts
    felicitations.service.ts
    suivi-dashboard.service.ts
  controllers/ (5 fichiers)
```

### Entités

| Entité | Description | Champs clés |
|--------|-------------|-------------|
| `IncidentEleve` | Retards, bagarres, incivilités | type, gravité, statut, temoins |
| `ObservationEleve` | Notes comportementales | type (POS/NEG), categorie, visibleParents |
| `SanctionEleve` | Avertissements, blâmes, exclusions | type, dateDebut/Fin, parentsNotifies |
| `FelicitationEleve` | Compliments, mérites | type, decernePar, visibleParents |

### Points d'attention
- FK vers `Eleve.id` (pas `Utilisateur.id`)
- Sanctions graves → workflow validation obligatoire
- `visibleParents = true` → notification automatique
- Dashboard agrégé par élève/classe/période

**Complexité** : Moyen | **Estimation** : 5 jours

---

## PHASE 3.2 : Suivi Personnel/Enseignants (extension module Personnel)

### Fichiers à créer

```
backend/src/modules/personnel/
  entities/incident-personnel.entity.ts
  entities/evaluation-periodique.entity.ts
  entities/formation-suivi.entity.ts
  dto/ (3 fichiers)
  services/ (3 fichiers)
  controllers/ (3 fichiers)
```

### Entités

| Entité | Description | Champs clés |
|--------|-------------|-------------|
| `IncidentPersonnel` | Manquements, retards, insubordination | type, gravité, sanction, statut |
| `EvaluationPeriodique` | Évaluations régulières (tout personnel) | periode, criteres (JSON), noteGlobale |
| `FormationSuivi` | Formations, certifications | type, dateDebut/Fin, certificationObtenue |

### Ce qui existe déjà et sera réutilisé
- `AbsencePersonnel` : absences/retards/maladie
- `EvaluationEnseignant` : évaluations spécifiques enseignants
- `HeureCours` : heures de cours effectuées
- `ProgressionProgramme` : suivi programmes pédagogiques

**Complexité** : Moyen | **Estimation** : 4 jours

---

## PHASE 4.1 : Module Santé (NOUVEAU MODULE)

### Structure complète du module

```
backend/src/modules/sante/
  index.ts
  entities/
    record-medical.entity.ts
    consultation-medicale.entity.ts
    incident-sante.entity.ts
    handicap.entity.ts
    allergie.entity.ts
    vaccin.entity.ts
  dto/ (6 fichiers)
  services/ (6 fichiers)
  controllers/ (6 fichiers)
  guards/
    acces-medical.guard.ts
```

### Entités

| Entité | Description | Champs clés |
|--------|-------------|-------------|
| `RecordMedical` | Fiche médicale pivot (1 par utilisateur) | utilisateurId (unique), groupeSanguin, antecedents |
| `ConsultationMedicale` | Visites médicales | date, motif, diagnostic, traitement, docteurNom |
| `IncidentSante` | Accidents, urgences | type, premiersSecours, hospitalisation, parentsNotifies |
| `Handicap` | Handicaps et aménagements | type, amenagementsRequis (JSON), niveau |
| `Allergie` | Allergies connues | allergene, type, severite, traitementUrgence |
| `Vaccin` | Historique vaccinal | nom, dateAdministration, rappelRequis, lot |

### Guard de sécurité obligatoire
```typescript
// ROLES_AUTORISES = ['SUPER_ADMIN', 'ADMIN', 'MEDECIN_SCOLAIRE', 'INFIRMIER_SCOLAIRE']
// Audit obligatoire sur chaque accès
```

### Points d'attention CRITIQUES
1. **Données sensibles** : accès restreint par middleware dédié
2. **Audit obligatoire** : chaque consultation loguée
3. **Ne pas dupliquer** `groupeSanguin`/`allergies` : `RecordMedical` = source de vérité
4. **Lien utilisateur** : `utilisateurId` unique, liens optionnels vers `Eleve` ou `MembrePersonnel`
5. **Conformité** : prévoir endpoint suppression/anonymisation

**Complexité** : Complexe | **Estimation** : 7 jours

---

## PHASE 5.1 : Permissions RBAC et Intégration

### Fichier à modifier
- `shared/src/enums/roles.enum.ts`

### Nouvelles permissions (~40 permissions)

**Cartes étendues** : `CARTES_MODELE_VIEW`, `CARTES_MODELE_MANAGE`, `CARTES_BATCH_GENERATE`, `CARTES_RENOUVELLER`

**Paie étendues** : `PAIE_ELEMENTS_VIEW`, `PAIE_ELEMENTS_MANAGE`, `PAIE_COTISATIONS_VIEW`, `PAIE_COTISATIONS_MANAGE`, `PAIE_CALCULER`, `PAIE_SIMULER`, `PAIE_EXPORT_PDF`

**Suivi élèves** : `SUIVI_ELEVES_VIEW`, `SUIVI_ELEVES_CREATE`, `SUIVI_ELEVES_EDIT`, `SUIVI_ELEVES_DELETE`, `SUIVI_ELEVES_SANCTIONNER`, `SUIVI_ELEVES_DASHBOARD`

**Suivi personnel** : `SUIVI_PERSONNEL_VIEW`, `SUIVI_PERSONNEL_CREATE`, `SUIVI_PERSONNEL_EVALUER`, `SUIVI_PERSONNEL_FORMATIONS`

**Santé** : `SANTE_VIEW`, `SANTE_CREATE`, `SANTE_EDIT`, `SANTE_DELETE`, `SANTE_CONSULTATION_CREATE`, `SANTE_INCIDENT_CREATE`, `SANTE_EXPORT`

### Enregistrement des nouveaux modules

**Dans `backend/src/modules/index.ts`** :
```typescript
export * from './suivi-eleves';
export * from './sante';
```

**Dans `shared/src/enums/modules.enum.ts`** :
```typescript
SUIVI_ELEVES = 'suivi-eleves',
SUIVI_PERSONNEL = 'suivi-personnel',
SANTE = 'sante',
```

**Dans `backend/src/app.ts`** :
```typescript
app.use('/api/suivi-eleves', requireModuleActive('suivi-eleves'), suiviElevesController);
app.use('/api/sante', requireModuleActive('sante'), santeController);
```

**Dans `shared/src/config/config.registry.ts`** : Ajouter config des 2 nouveaux modules

### Migrations et Seeds
- Migration SQL pour toutes les nouvelles tables
- Seed pour cotisations CNPS par défaut
- Seed pour types de primes/retenues
- Seed pour permissions RBAC

**Complexité** : Simple | **Estimation** : 2 jours

---

## Estimation Globale

| Phase | Tâches | Complexité | Jours |
|-------|--------|-----------|-------|
| 1.1 | Champs identification | Simple | 2.5 |
| 1.2 | Auth multi-mode | Moyen | 2.5 |
| 2.1 | Module Cartes amélioré | Moyen | 6.5 |
| 2.2 | Paie étendue | Complexe | 12 |
| 3.1 | Suivi-Élèves | Moyen | 5 |
| 3.2 | Suivi-Personnel | Moyen | 4 |
| 4.1 | Module Santé | Complexe | 7 |
| 5.1 | RBAC + Migrations + Seeds | Simple | 2 |
| **TOTAL** | | | **~41 jours** |

---

## Points d'Attention Architecturaux

### Pièges à éviter

1. **Redondances** : `groupeSanguin`/`allergies` dans Élève ET Santé → une seule source de vérité (`RecordMedical`)
2. **Relation recursive** : `responsableHierarchiqueId` dans `MembrePersonnel` → attention aux lazy loading infinis
3. **Breaking change auth** : `email` → `identifiant` → supporter les deux pendant transition
4. **Immutabilité bulletins** : bulletin `PAYE` non modifiable → middleware de validation
5. **Données santé** : guard dédié + audit obligatoire → conformité légale
6. **Performance OR queries** : indexes sur `pseudonyme`, `qrCodeId`, `matricule`
7. **Module activation** : nouveaux modules dans `requireModuleActive()`
8. **Workflow validation** : sanctions graves + éléments paie importants → `validationWorkflowService`

### Décisions architecturales recommandées

| Décision | Recommandation | Justification |
|----------|---------------|---------------|
| Source groupe sanguin | `RecordMedical` | Module dédié, accès restreint |
| QR code storage | `Utilisateur.qrCodeId` + `Carte.qrCode` | Double référence pour recherche rapide |
| Paie : colonnes agrégées | Garder + ajouter `ElementSalaire` | Compatibilité + granularité |
| FK suivi élève | `Eleve.id` (pas `Utilisateur.id`) | Plus sémantique |
| Sécurité santé | Guard dédié + audit | Données sensibles |
| Batch cartes | File d'attente via `FileImpression` | Module existe déjà |

---

## Checklist de Validation Pré-Implémentation

- [ ] Backup base de production avant migration
- [ ] Tester migrations en staging
- [ ] Nouvelles permissions dans `roles.enum.ts` ET seeds
- [ ] Tester auth multi-mode avec chaque identifiant
- [ ] Vérifier indexes post-migration
- [ ] Tester guard accès médical avec différents rôles
- [ ] Vérifier cohérence FK (`eleveId` vs `utilisateurId`)
- [ ] Documenter breaking changes frontend
- [ ] Mettre à jour Swagger/OpenAPI

---

## Fichiers Clés à Modifier/Créer (Résumé)

### Fichiers à modifier (existants)
1. `backend/src/modules/etablissement/entities/etablissement.entity.ts`
2. `backend/src/modules/eleves/entities/eleve.entity.ts`
3. `backend/src/modules/responsables-eleves/entities/responsable-eleve.entity.ts`
4. `backend/src/modules/personnel/entities/personnel.entity.ts`
5. `backend/src/modules/auth/entities/utilisateur.entity.ts`
6. `shared/src/validators/auth.validators.ts`
7. `backend/src/modules/auth/services/auth.service.ts`
8. `backend/src/modules/cartes/entities/carte.entity.ts`
9. `backend/src/modules/cartes/services/cartes.service.ts`
10. `shared/src/enums/roles.enum.ts`
11. `shared/src/enums/modules.enum.ts`
12. `shared/src/config/config.registry.ts`
13. `backend/src/modules/index.ts`
14. `backend/src/app.ts`

### Nouveaux fichiers à créer (~60 fichiers)
- 4 migrations SQL
- 6 nouvelles entités (Cartes, Paie)
- 10 nouvelles entités (Suivi-Élèves, Suivi-Personnel)
- 6 nouvelles entités (Santé)
- ~30 DTOs
- ~20 Services
- ~15 Controllers
- 1 Guard (Santé)
- 2 Seeds

---

## Comment Tester End-to-End

1. **Auth multi-mode** : Créer utilisateur avec pseudonyme, QR code → tester login avec chaque identifiant
2. **Cartes** : Créer modèle → générer batch classe → vérifier QR code → imprimer PDF
3. **Paie** : Configurer cotisations → créer primes → calculer bulletin → exporter PDF
4. **Suivi-Élèves** : Créer incident → ajouter observation → sanctionner → vérifier notification parents
5. **Suivi-Personnel** : Créer incident → évaluation périodique → ajouter formation
6. **Santé** : Créer record médical → ajouter consultation → créer allergie → tester guard accès
7. **RBAC** : Vérifier permissions avec différents rôles → tester refus accès santé pour non-autorisés
