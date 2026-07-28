---
name: elisaschool-business-logic
description: >
  Guide complet de la logique métier eLISAschool. Utiliser ce skill pour comprendre les règles métier,
  les flux de données, les relations entre modules, et modifier la logique en toute sécurité.
  Déclencheurs : logique métier, règles métier, calcul bulletin, calcul moyenne, workflow,
  multi-tenancy, configuration, gamification, scoring, cantine, transport, requêtes, orientation.
---

# Logique Métier eLISAschool

## Quand utiliser ce skill

- Comprendre une **règle métier** existante avant de la modifier
- Ajouter ou modifier un **calcul** (moyennes, bulletins, scores)
- Implémenter un nouveau **workflow** (approbation, validation, cycle de vie)
- Comprendre les **relations** entre modules et les impacts en cascade
- Travailler sur la **configuration dynamique** et ses effets
- Modifier les **flux de données** académiques ou logistiques

## Règle de Consolidation des Documents

**Avant de créer ou modifier** une règle métier, un workflow ou une documentation :

1. **Vérifier** si le sujet existe déjà dans le codebase
2. **Consolider** dans le fichier existant si pertinent
3. **Nettoyer** les fichiers redondants ou obsolètes

**Objectif** : Documentation concise, compacte, sans redondances.

---

## Architecture des dépendances

```
ETABLISSEMENT (racine — enums partagés : SousSysteme, TypeEtablissement, CycleScolaire)
│
├── AUTH (JWT, RBAC, audit) ──────── utilisé par TOUS les modules
│   ├── Utilisateur (identité numérique)
│   ├── UtilisateurEtablissement (multi-établissements N:N)
│   ├── RoleLimitationEtablissement (limitations configurables)
│   ├── ProfilUtilisateur
│   ├── RefreshToken
│   └── AuditLog (système d'audit trail complet)
│
├── AUDIT (consultation & gestion) ─── API REST + archivage + statistiques
│   ├── AuditController (/api/audit/*)
│   ├── AuditArchivageService (archivage 30/365 jours)
│   ├── AuditInterceptor (capture automatique CRUD)
│   └── Migration 003 (audit_logs_archive)
│
├── CONFIGURATION (hub central) ──── 46+ paramètres, cache TTL 5min, EventEmitter, multi-établissement
│   ├── ConfigurationApp (@deprecated - migré vers EtablissementConfig)
│   ├── EtablissementConfig (par établissement - thème, quotas, modules, SaaS)
│   ├── ConfigurationModule (par module - widgets, champs perso)
│   ├── ParametreSysteme (clé/valeur - 8 catégories, scopage par établissement)
│   ├── HistoriqueConfiguration (audit trail complet)
│   └── **BACKUP** (sauvegarde & restore - config, DB, planification)
│       ├── ConfigBackupService (snapshots + différentiels + clonage)
│       ├── DatabaseBackupService (export TypeORM + chiffrement AES-256)
│       ├── BackupRecord (entité métadonnées + checksum SHA-256)
│       ├── ParametreVersion (historique versioning paramètres)
│       └── DatabaseStorageProvider (storage abstraction extensible)
│
├── CHAÎNE ACADÉMIQUE (flux de calcul principal)
│   ├── CYCLES (MATERNELLE, PRIMAIRE, COLLÈGE, LYCÉE)
│   │   └── NIVEAUX (par cycle + sous-système)
│   │       ├── CLASSES (Niveau + Année scolaire)
│   │       │   ├── AffectationEleve (unicité : 1 élève = 1 classe/année)
│   │       │   └── AffectationMatière (vérif : matière au programme du niveau)
│   │       └── MATIÈRES (MatièreNiveau : coefficient + crédits + barème)
│   ├── ANNÉES SCOLAIRES (YYYY-YYYY, une seule active)
│   │   └── PÉRIODES (TypePériode + poids + cloturée)
│   │       └── NOTES (workflow BROUILLON → VALIDÉE → PUBLIÉE)
│   │           └── BULLETINS (agrégation notes × coefficients programme)
│   ├── ÉLÈVES (matricule unique, OneToOne → Utilisateur)
│   │   └── ORIENTATION (profil + suggestions + RDV)
│   ├── PERSONNEL (matricule unique, OneToOne → Utilisateur)
│   └── MATIÈRES (GroupesMatières + MatiereNiveau + AffectationMatière)
│
├── SERVICES LOGISTIQUES (porte-monnaie + inventaire)
│   ├── CANTINE (menu + inscription + solde + consommation)
│   ├── TRANSPORT (ligne + inscription + présence QR)
│   └── MATÉRIEL (inventaire + prêt avec stock)
│
├── VIE ÉTUDIANTE
│   ├── CLUBS (inscription avec limite + approbation)
│   └── GAMIFICATION (points + badges + classement)
│
├── COMMUNICATION
│   ├── MESSAGERIE (conversations + messages + soft delete)
│   ├── NOTIFICATIONS (4 canaux + scheduling + bulk)
│   ├── REQUÊTES (workflow multi-niveaux d'approbation)
│   └── **SONDAGES** (templates + votes + analyses + récurrents + export PDF/CSV)
│
├── DOCUMENTS
│   ├── CARTES (5 types + QR code + expiration + renouvellement)
│   └── IMPRESSIONS (templates HTML + file d'attente + batch)
│
└── SYSTÈME
    ├── SCORING (5 indicateurs pondérés + règles événementielles)
    └── MONITORING (health check + métriques + maintenance mode)
```

---

## Domaine 10 : Performance et Optimisation

### Architecture de Performance

**Cache in-memory (ConfigurationService) :**
- TTL : 5 minutes pour config, 1 minute pour données volatiles
- Clés composées : `"cle:etablissementId"` pour isolation multi-tenant
- Invalidation sélective après modification (create/update/delete)
- Hit ratio cible : >80%

**Index de base de données :**
- Index FK sur toutes les relations (`etablissementId`, `classeId`)
- Index composites pour requêtes fréquentes (`[cle, etablissementId]`)
- Index unique pour contraintes d'unicité (`matricule`, `email`)
- Index chronologiques sur `createdAt` pour tri

### Stratégie de Pagination

**TOUJOURS paginer les listes :**
- Default : 20 résultats/page
- Maximum : 100 résultats/page
- Retourner métadonnées : `total`, `totalPages`, `hasNext`, `hasPrev`
- Utiliser `take`/`skip` TypeORM (PAS `offset`/`limit` SQL brut)

### Optimisation des Requêtes

**Règles de chargement :**
- Charger uniquement les relations nécessaires (PAS toutes les relations)
- Utiliser `select` pour colonnes spécifiques (éviter SELECT *)
- Éviter le N+1 Query Problem → utiliser `relations` dans find()
- Limiter TOUJOURS avec `take` (max 100 par requête)

**Exemple optimisé :**
```typescript
// ✅ Rapide
const eleves = await repo.find({
    where: { etablissementId },
    relations: ['classe'],  // Uniquement nécessaire
    select: ['id', 'nom', 'prenom'],
    take: 50,
    skip: offset
});

// ❌ Lent
const eleves = await repo.find({
    relations: ['classe', 'notes', 'bulletins', 'utilisateur']
});
```

### Transactions Atomiques

**Utiliser pour :**
- Opérations multi-entités (créer élève + utilisateur)
- Transferts financiers (cantine, transport)
- Workflows avec validation en plusieurs étapes

**Pattern obligatoire :**
```typescript
const queryRunner = AppDataSource.createQueryRunner();
await queryRunner.connect();
await queryRunner.startTransaction();

try {
    // Opérations
    await queryRunner.commitTransaction();
} catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
} finally {
    await queryRunner.release();  // TOUJOURS
}
```

### Monitoring et Métriques

**Indicateurs critiques :**
- Temps de réponse > 500ms → alerte
- Taux d'erreur > 5% → critique
- Cache hit ratio < 80% → optimiser requêtes
- DB connections > 80% du pool → scaler

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

## Domaine 11 : Organisation — Modèle complet (v6.0)

**`TypePersonnel` n'existe plus** (table `types_personnel` supprimée, migration 121). La catégorie statutaire est portée par **`Fonction.categorie`** :

| Axe | `Fonction.categorie` (enum varchar) | `Fonction` (`fonctions`) |
|-----|-------------------------------------|--------------------------|
| Sens | Catégorie statutaire (*quel type de rôle*) | Fonction hiérarchique (*quel rôle exercé*) |
| Valeurs | `ENSEIGNANT`, `DIRECTION`, `ADMINISTRATIF`, `TECHNIQUE`, `SERVICE`, `SANTE`, `SOCIAL`, `AUTRE` | — |
| Stockage | varchar(20) NOT NULL DEFAULT 'AUTRE' | Multi-tenant, hiérarchique (parent/enfant, `chemin`) |

### Règles métier critiques

- La **catégorie d'une personne** est **toujours dérivée** (jamais stockée) : via les fonctions des postes occupés (`affectations → poste.fonction.categorie`), fallback fonctions directes (`MembreFonction`).
- L'API personnel expose `categorie`, `estEnseignant`, `categorieSource` (champs calculés).
- Un membre est **enseignant** ⟺ il occupe un poste dont `fonction.categorie === 'ENSEIGNANT'`.
- La **catégorie attendue d'un poste** est dérivée : `poste.fonction.categorie`. Jamais stockée sur `Poste`.
- Compatibilité (`contrat.service`) : contrôle via `poste.fonction?.categorie`.
- **Aucun** rôle/permission par défaut lié à la catégorie : le RBAC passe **uniquement** par `utilisateur_etablissements` (voir Domaine 2).

### À ne pas faire

- Ne **pas** re-stocker la catégorie sur `MembrePersonnel`, `Poste` ni `HierarchiePersonnel` (dérivable → source d'incohérence).
- Ne **pas** recréer une entité/table pour la catégorie : c'est un enum applicatif (`CategorieFonction` dans shared).
- Ne **pas** ajouter de `roleIdParDefaut`/`permissionsDefaut` liés à la catégorie (contredit le RBAC contextuel).

### HierarchiePersonnel — sémantique duale (v4.1)

Une seule table `hierarchie_personnel`, **deux types de relations mutuellement exclusifs** :

| Relation | Champs | Alimentée par |
|----------|--------|---------------|
| personne→personne | `personnelId` + `superieurId` (FK → membres_personnel) | `contrat.service.autoCreerHierarchie` |
| poste→poste | `posteId` + `superieurPosteId` (FK → postes) | seeds, templates (`generation.service`), CRUD REST |

- **Interdit** : mettre un id de `Poste` dans `superieurId` (bug historique corrigé, backfill migration 122).
- Le DTO impose (personnelId+superieurId) **OU** (posteId+superieurPosteId) via `.refine()`.
- Anti-cycle : 2 CTE récursifs distincts (chaînes de personnes ET chaînes de postes).
- `typeRelation` : enum varchar `DIRECT` | `FONCTIONNEL` (la table nomenclature TypeRelationHierarchique n'existe plus).
- L'organigramme structurel est bâti sur `unites.parentId` ; les relations poste→poste sont un **overlay optionnel** (edges pointillés).

### Templates d'organisation catégorisés (v6.0 — migration 127)

**25 templates** remplaçant les 22 anciens, classés sur **5 axes** :

| Axe | Enum | Valeurs |
|-----|------|---------|
| Nature juridique | `NatureJuridique` | `PRIVE`, `PUBLIC`, `COMPLEXE_SCOLAIRE`, `CFP`, `CENTRE_FORMATION` |
| Système éducatif | `SystemeEducatif` | `FRANCOPHONE_GENERAL`, `FRANCOPHONE_TECHNIQUE`, `ANGLOPHONE`, `BILINGUE`, `SIMPLE` |
| Langue enseignement | `LangueEnseignement` | `FR`, `EN`, `BILINGUE_FR_EN` |
| Niveau enseignement | `NiveauEnseignement` (JSONB array) | `MATERNEL`, `PRIMAIRE`, `SECONDAIRE_COLLEGE`, `SECONDAIRE_LYCEE`, `FORMATION_PRO`, `FORMATION_DIVERS` |
| Complexité | `ComplexiteStructurelle` | `SIMPLE`, `STANDARD`, `AVANCE`, `COMPLEXE` |

**Règles métier** :
- **Incompatibilités** : MATERNEL+TECHNIQUE, NORMAL+PRIMAIRE, CFP+MATERNEL/PRIMAIRE, COMPLEXE+un_seul_niveau
- **Fonctions anglophone/bilingue** : 10 codes spécifiques (HEAD-TEACHER, DEPUTY-HEAD, HEAD-OF-YEAR, FORM-TUTOR, SENCO, BUSINESS-MGR, EXAMS-OFF, COORD-LING, DIR-SECTION-FR, DIR-SECTION-EN)
- **Échelons structurels étendus** : 4 nouveaux (SECTION_LINGUISTIQUE, CYCLE, FILIERE, POLE_FORMATION) → 14 total
- **Clonage** : `POST /templates/:id/cloner` crée une copie modifiable (etablissementId scopé)
- **Filtrage API** : `GET /templates?nature=&systeme=&langue=&niveaux=&complexite=&search=`
- **Combinaisons valides** : `GET /templates/combinaisons` → matrice 25 combinaisons + compteurs

**À ne pas faire** :
- Ne **pas** créer des templates sans métadonnées de catégorisation (tous les axes requis)
- Ne **pas** mélanger systèmes éducatifs dans un même template (sauf BILINGUE explicite)
- Ne **pas** utiliser `intitulé` (accent) — le champ entity est `intitule` (sans accent)

---

## Domaine 12 : RH — Contrats, Personnel, Paie (v1.0 — 2026-07)

### Règles métier consolidées (mandat grill-me RH)

- **Workflow de validation effectif** : les créations RH soumises à validation passent par `validationWorkflowService` avec **dispatch réel sur l'entité** à l'approbation finale (le statut de l'entité change, pas seulement celui du workflow).
- **Multi-occupants unifié** : la capacité d'un poste est `nombrePostes` ; les occupants sont comptés via les affectations actives (helper partagé). Ne jamais dériver l'occupation autrement.
- **Soft delete complet** : MembrePersonnel, ContratPersonnel et entités paie utilisent `@DeleteDateColumn()`. Les suppressions RH sont récupérables ; les requêtes excluent les soft-deleted par défaut.
- **Type de contrat** : chaîne dynamique adossée à `TypeContratPersonnalise` (nomenclature) — **pas d'enum figé**. Libellés frontend via helpers `labelTypeContrat()` / `labelMode()`.
- **Mode de rémunération** : FK uuid vers `ModeRemunerationEntity` (source unique, voir Domaine 11).
- **Chemin matérialisé `Fonction.chemin`** : convention unique = segments **ids**, séparateur **`.`** (`parentChemin.id`). Le seed `seed-organisation.ts` et `fonctions.service.ts` sont alignés ; le seed réaligne les chemins obsolètes (ancien format `parentId/CODE`).
- **Migration 029 (paie étendue)** : réécrite v3.0 — FK vers `bulletins_paie` (la table `bulletin_paies` n'existe pas), colonnes camelCase quotées alignées entités, unicité composite `(code, "etablissementId")` multi-tenant, seeds SQL supprimés (gérés par `seed-cotisations.ts` / `seed-types-primes.ts` par établissement). Bloc DO $$ de rattrapage pour les bases v2 snake_case.
- **RBAC personnel** : routes protégées par permissions granulaires ; les routes multi-usages utilisent `requireAnyPermission(...)` (jamais un guard unique trop large).

### À ne pas faire

- Ne **pas** réintroduire d'enum figé pour `typeContrat` (nomenclature dynamique).
- Ne **pas** insérer de seeds SQL de nomenclatures paie sans `etablissementId` (NOT NULL multi-tenant).
- Ne **pas** construire `Fonction.chemin` avec des codes ou le séparateur `/`.
- Ne **pas** hard-deleter du personnel/contrats/paie — toujours soft delete.

---

## Domaine 13 : Emploi du Temps (v1.0 — 2026-07)

### Source de vérité — Volume horaire

- **`MatiereNiveau.volumeHoraire`** (int, minutes/semaine) est la **source unique et absolue** du volume horaire d'une matière pour un niveau donné.
- `ProgrammeMatiere` ne porte **plus** de `volumeHoraire` (supprimé D1) — c'est un bridge pur entre programme et matière.
- Le frontend ne propose pas de champ volume horaire lors de l'ajout d'une matière à un programme.
- Le service ConflitDetection compare le volume planifié (somme des durées des créneaux) au `volumeHoraire` de MatiereNiveau pour détecter les dépassements.

### Entité pivot — CreneauHoraire (table `creneaux_horaires`)

Fusion de l'ancien `EmploiDuTemps` + `RepartitionHoraire` en une seule entité :

```
CreneauHoraire {
    id: uuid
    jourSemaine: int (1=lundi … 7=dimanche)
    heureDebut: time (HH:mm)
    heureFin: time (HH:mm)
    affectationMatiereId: uuid (FK → AffectationMatiere)
    salleId?: uuid (FK → Salle)
    statut: StatutCreneau (PLANIFIE | VALIDE | ANNULE)
    recurrence?: jsonb (pattern hebdomadaire, exceptions)
    commentaire?: text
    etablissementId: uuid (multi-tenant)
    createdAt, updatedAt
}
```

Relations clés :
- `affectationMatiere` → porte l'enseignant, la matière, la classeAnnee
- Via `affectationMatiere.classeAnnee` → on connaît la classe
- Via `affectationMatiere.enseignantId` → on connaît l'enseignant
- `salle` → optionnelle, vérifiée par le service conflit

### Détection de conflits — ConflitDetectionService

5 types de conflits détectés automatiquement :

| Type | Sévérité | Condition |
|------|----------|-----------|
| `CLASSE_OCCUPEE` | BLOQUANT | Même classe, même créneau horaire |
| `ENSEIGNANT_OCCUPE` | BLOQUANT | Même enseignant, même créneau horaire |
| `SALLE_OCCUPEE` | BLOQUANT | Même salle, même créneau horaire |
| `DEPASSEMENT_VOLUME` | AVERTISSEMENT | Somme créneaux > MatiereNiveau.volumeHoraire |
| `CRENEAU_NON_IMPOSABLE` | AVERTISSEMENT | Créneau placé hors plages imposables des préférences |

**Règles** :
- Les conflits BLOQUANTS empêchent la sauvegarde (400) — le frontend affiche la liste.
- Les conflits AVERTISSEMENT permettent la sauvegarde mais sont signalés à l'utilisateur.
- La vérification exclut le créneau en cours d'édition (`excludeId`).
- Le chevauchement temporel est strict : `(debutA < finB) AND (debutB < finA)`.
- Endpoint : `POST /api/emploi-du-temps/verifier-conflits` (perm `emploi-du-temps:verifier-conflits`).

### Algorithme de génération automatique

**Stratégie** : most-constrained-first (matières avec le plus de contraintes placées en premier).

```
1. Charger toutes les AffectationMatiere actives de la classe
2. Pour chaque matière, calculer le nombre de créneaux nécessaires :
   nbCreneaux = ceil(MatiereNiveau.volumeHoraire / dureeCreneauParDefaut)
3. Trier par contraintes décroissantes :
   - Enseignant avec le moins de disponibilités
   - Volume horaire le plus élevé
   - Matière obligatoire avant optionnelle
4. Pour chaque matière (triée), tenter de placer les créneaux :
   a. Itérer les plages imposables (préférences)
   b. Vérifier absence de conflit (3 types bloquants)
   c. Respecter les pauses et durées max consécutives
   d. Placer le créneau ou reporter au prochain slot libre
5. Retourner les créneaux générés + conflits non résolus
```

### Workflow des créneaux

```
PLANIFIE → VALIDE → (ANNULE)
```

- **PLANIFIE** : créneau brouillon (généré automatiquement ou créé manuellement). Modifiable, déplaçable.
- **VALIDE** : créneau confirmé. Visible dans l'emploi du temps officiel. Matérialise les `HeureCours`.
- **ANNULE** : créneau annulé (pas de hard-delete). Caché par défaut mais consultable dans l'historique.

### HeureCours — Matérialisation datée

`HeureCours` = instance concrète d'un cours à une date précise. Ancré sur `classeAnneeId` (pas `classeId`).

```
HeureCours {
    id: uuid
    date: date
    heureDebut, heureFin: time
    creneauId: uuid (FK → CreneauHoraire)
    classeAnneeId: uuid (FK → ClasseAnnee)
    affectationMatiereId?: uuid
    salleId?: uuid
    enseignantId?: uuid (MembrePersonnel.id, nullable si remplacement)
    remplacantId?: uuid
    statut: StatutHeureCours (PLANIFIE | EFFECTUE | ANNULE | REPORTE)
    commentaire?: text
    etablissementId: uuid
}
```

**Règles** :
- Généré depuis `CreneauHoraire` validé, pour chaque occurrence hebdomadaire.
- `remplacantId` = MembrePersonnel de remplacement (null = enseignant titulaire).
- Un créneau ANNULE ne génère plus de HeureCours futurs.

### Préférences (PreferenceEmploiDuTemps)

Enrichi avec :
- `pauses` : JSONB array (ex: `[{ debut: "10:00", fin: "10:15" }, { debut: "12:00", fin: "13:00" }]`)
- `creneauxImposables` : JSONB (plages horaires autorisées par jour, ex: `{ "1": [{ debut: "07:30", fin: "12:00" }, { debut: "13:00", fin: "16:00" }] }`)
- `dureeMaxConsecutive` : int (minutes, défaut 180)
- `dureeCreneauDefaut` : int (minutes, défaut 55)

### Permissions RBAC

| Permission | Usage |
|-----------|-------|
| `emploi-du-temps:view` | Voir les créneaux |
| `emploi-du-temps:create` | Créer un créneau |
| `emploi-du-temps:edit` | Modifier un créneau |
| `emploi-du-temps:delete` | Supprimer un créneau |
| `emploi-du-temps:generer` | Générer automatiquement |
| `emploi-du-temps:valider` | Passer PLANIFIE → VALIDE |
| `emploi-du-temps:verifier-conflits` | Vérifier les conflits |
| `programmes:historiser` | Créer une version de programme |

### Entités supprimées (3)

- ❌ `EmploiDuTemps` → fusionnée dans CreneauHoraire
- ❌ `RepartitionHoraire` → fusionnée dans CreneauHoraire
- ❌ `ConfigurationMatiereClasse` → champs absorbés par AffectationMatiere (`obligatoire`, `statutValidation`)

### À ne pas faire

- Ne **pas** stocker `volumeHoraire` sur ProgrammeMatiere (source unique = MatiereNiveau).
- Ne **pas** référencer `classeId` dans HeureCours (toujours `classeAnneeId`).
- Ne **pas** hard-deleter des créneaux — utiliser le statut ANNULE.
- Ne **pas** ignorer les conflits BLOQUANTS lors de la sauvegarde.
- Ne **pas** placer un créneau sans vérification des 3 types bloquants (classe + enseignant + salle).
- Ne **pas** utiliser `EmploiDuTemps` ou `RepartitionHoraire` (supprimés).

### Fichiers de référence

| Rôle | Fichier |
|------|---------|
| Entité CreneauHoraire | `backend/src/modules/emploi-du-temps/entities/creneau-horaire.entity.ts` |
| Entité HeureCours | `backend/src/modules/emploi-du-temps/entities/heure-cours.entity.ts` |
| Service EDT | `backend/src/modules/emploi-du-temps/services/emploi-du-temps.service.ts` |
| Conflits | `backend/src/modules/emploi-du-temps/services/conflit-detection.service.ts` |
| Controller | `backend/src/modules/emploi-du-temps/controllers/emploi-du-temps.controller.ts` |
| DTOs | `backend/src/modules/emploi-du-temps/dto/emploi-du-temps.dto.ts` |
| Types frontend | `frontend/src/features/emploi-du-temps/types/edt.types.ts` |
| Hooks frontend | `frontend/src/features/emploi-du-temps/hooks/use-emploi-du-temps.ts` |
| Calendrier frontend | `frontend/src/features/emploi-du-temps/components/edt-calendar.tsx` |

---

## Domaine 1 : Chaîne académique (calcul notes → bulletins)

### Flux de données complet

```
Configuration (bareme_defaut=20, require_validation=true)
        ↓
Cycles → Niveaux → MatiereNiveau (coefficient, barème, obligatoire)
        ↓
ClasseAnnee (Niveau + AnnéeScolaire) → AffectationEleve + AffectationMatiere
        ↓
Périodes (dans AnnéeScolaire, poids configurable)
        ↓
Notes (Élève × Matière × Période × ClasseAnnee)
  → standardisation sur /20 : noteSur20 = (valeur / barème) × 20
  → workflow : BROUILLON → VALIDÉE → PUBLIÉE
        ↓
Bulletins = agrégation des notes VALIDÉE + PUBLIÉE d'un élève pour une période
  → moyenneMatière : SQL agrégé (batch loader) pondéré coefficient, base 20
  → moyenneGénérale = Σ(moyenneMatière × coeffNiveau) / Σ(coefficients)
  → stats : moyenneClasse/Min/Max + rangs calculés (calculerRangs)
```

### Règles métier critiques

**Notes** (refonte 2026-07) :
- Si `notes.require_validation = true` (config), note créée en `BROUILLON`, sinon directement `VALIDÉE`
- Les notes `VALIDÉE` **et** `PUBLIÉE` comptent dans les moyennes (`In([VALIDEE, PUBLIEE])`)
- `enseignantId` référence **MembrePersonnel.id** (nullable) — résolu depuis `req.utilisateur.id` via `MembrePersonnel.utilisateurId`
- `createBulk()` (`POST /api/notes/bulk`) : renseigne `classeAnneeId`, refuse si période clôturée, vérifie que chaque élève a une `AffectationEleve` active (400 avec liste), gated par `notes.allow_bulk_entry` (403)
- `anneeScolaireId` auto-résolu depuis la période si non fourni
- `updateNoteSchema` : `eleveId/matiereId/classeAnneeId/periodeId` immuables
- `GET /api/notes` → `PaginatedResult { items, meta }` + `recherche` ILIKE
- `GET /api/notes/statistiques` (perm `notes:statistiques:view`) : moyenne, médiane, min/max, écart-type, distribution, par type/statut
- Niveaux de validation : config `notes.validation_levels` (plus de valeur codée en dur)
- SQL brut : colonnes camelCase **toujours quotées** (`"eleveId"`, `"classeAnneeId"`…) et `statut::text = ANY($n)`

**Bulletins** (refonte 2026-07) :
- **Upsert** : index unique classe `['etablissementId','eleveId','periodeId']`
- Le programme du niveau (`MatiereNiveau`) détermine matières + coefficients du bulletin
- Rangs implémentés (`calculerRangs`) ; `moyenneClasse/Min/Max` renseignées avant calcul
- Config : `bulletins.require_validation` (ancienne clé `bulletins.validation_workflow` en fallback)
- `DELETE /api/bulletins/:id` (perm `bulletins:delete`) refusé si publié (400)
- `GET /api/bulletins/:id/export` (perm `bulletins:export`) → HTML A4 imprimable (`bulletin.pdf.service.ts`, sans dépendance)
- `PATCH` avec `publie: true` exige `bulletins:publier`

**Résolution coefficient/barème** (singleton `coefficientResolverService`) :
- Import : `import { coefficientResolverService } from '@modules/matieres/services';`
- Chaîne : `AffectationMatiere.coefficient/bareme` → `ProgrammeMatiere.coefficient/bareme` → `MatiereNiveau.coefficient/bareme` → défaut `{ coefficient: 1, bareme: 20 }`
- Méthodes : `resoudreCoefficient(affectationMatiere)` / `resoudreBareme(affectationMatiere)`
- La résolution est **toujours** utilisée au lieu d'accéder directement aux champs

**Classes** :
- Si `anneeScolaireId` non fourni → récupère l'année active automatiquement
- Protection suppression : impossible de supprimer une classe avec des élèves actifs
- Unicité affectation : 1 élève = 1 classe par année (changement de classe bloqué)
- `effectifActuel` incrémenté automatiquement (+1 à chaque affectation)

**Années scolaires** :
- Une seule année `enCours` à la fois (désactive les autres automatiquement)
- Protection : impossible de supprimer l'année active
- Libellé au format `YYYY-YYYY` (regex validé)

**Périodes** :
- `poids` (float, défaut 1) pour pondération dans la moyenne annuelle
- `cloturee` verrouille la période — protection suppression

### Comment modifier un calcul

```
Pour modifier le calcul de moyenne :
1. Notes : notesService.calculerMoyenne() — standardisation /20 + pondération
2. Bulletins : bulletinsService.generer() — agrégation × coefficients programme
3. Vérifier les paramètres config : notes.bareme_defaut, notes.show_ranking
4. Tester avec des données réalistes (coefficients variés, notes sur barèmes différents)
```

---

## Domaine 2 : Authentification et sécurité

### Workflow de connexion

```
login(email, password)
  ├── Vérifier blocage (estBloque() → bloqueJusquà > now ?)
  ├── Vérifier statut (SUSPENDU → erreur, INACTIF → erreur)
  ├── Vérifier mot de passe (bcrypt compare)
  │   ├── Échec → tentativesConnexion++ → si >= max (config) → blocage auto
  │   └── Succès → reset compteur → générer tokens JWT → audit log
  └── Retourner { accessToken, refreshToken, utilisateur }
```

### Règles métier auth

- **Blocage automatique** après N tentatives (`auth.max_login_attempts`, défaut 5)
- **Durée blocage** configurable (`auth.lockout_duration`, défaut 15 min)
- **Matricule auto-généré** : `EL` + 2 derniers chiffres année + 6 chars alphanum (boucle while unicité)
- **Politique mot de passe** : majuscule + minuscule + chiffre, min 8 chars (configurable)
- **Token reset password** : expire après 1h, token sécurisé (crypto.randomBytes 32)
- **Register** : statut `EN_ATTENTE_VALIDATION` → vérification email → `ACTIF`
- **Admin create** (utilisateurs) : statut `ACTIF` directement (pas de vérification email)

### RBAC (Role-Based Access Control) - Version 3.0

**Système RBAC étendu** (implémenté en 2026-06 - Système éducatif africain) :

#### Architecture
```
RBAC v3.0
├── 67 rôles système (couvre Afrique Centrale & Ouest)
├── ~350 permissions granulaires (format: module:action)
├── Multi-rôles par utilisateur (illimité)
├── Permissions personnalisées GRANTED/DENIED
├── Cache intelligent TTL 5 minutes
├── API REST complète (20+ endpoints)
├── Backward compatibility avec enum Role
├── Multi-établissements (table UtilisateurEtablissement N:N)
└── Limitations configurables par rôle (max établissements, validation)
```

#### Entités TypeORM (7)
- **Role** : Rôles dynamiques avec héritage (parentId)
- **Permission** : Permissions granulaires (~350)
- **UtilisateurRole** : Table de jointure multi-rôles
- **UtilisateurPermission** : Overrides GRANTED/DENIED
- **PermissionAudit** : Traçabilité des changements
- **UtilisateurEtablissement** : Affectations multi-établissements (N:N)
- **RoleLimitationEtablissement** : Limitations configurables par rôle

#### Multi-Établissements (v2.0 - 2026-06)

**Architecture :**
```
Utilisateur 1:N UtilisateurEtablissement N:1 Établissement
     ↓                      ↓                      ↓
  User X    ─────►  Établissement A (principal)  ───►  Données isolées
                  ├────►  Établissement B         ───►  Données isolées
                  └────►  Établissement C         ───►  Données isolées
```

**Règles métier critiques :**
- **Élève** : 1 seul établissement (interdiction stricte multi-sites)
- **Direction** (Proviseur, Principal, Directeur) : 1 établissement (mono-site)
- **Enseignants** : 3-5 établissements (vacataires multi-sites)
- **Parents** : 10 établissements max (enfants dans différentes écoles)
- **Inspecteurs** : 40-100 établissements (contrôle régional)
- **SUPER_ADMIN / Ministre** : Illimité (999)

**Switch rapide d'établissement :**
```bash
POST /api/auth/switch-etablissement
{
  "etablissementId": "uuid-du-nouvel-etablissement"
}
# Retourne un nouveau JWT avec l'établissement actif
```

**Middleware tenant v2.0 :**
- Supporte les utilisateurs multi-établissements
- Algorithme : query param ?etablissementId= → établissement principal → fallback
- Vérification automatique des accès
- Logging de tous les switches (audit trail)

**Limitations configurables (RoleLimitationEtablissement) :**
```sql
role                | max_etablissements | peut_changer | necessite_validation
--------------------+-------------------+--------------+---------------------
SUPER_ADMIN         | 999               | true         | false
MINISTRE            | 999               | true         | false
INSPECTEUR_*        | 40-100            | true         | false
PROVISEUR           | 1                 | false        | false
ENSEIGNANT          | 5                 | true         | false
PARENT              | 10                | true         | false
ELEVE               | 1                 | false        | false
NUTRITIONNISTE      | 5                 | true         | true (validation)
```

#### Rôles système et permissions (67 rôles)

**Catégories de rôles :**

| Catégorie | Nombre | Exemples |
|-----------|--------|----------|
| Administration Nationale | 7 | MINISTRE, INSPECTEUR_GÉNÉRAL, DIRECTEUR_RÉGIONAL |
| Direction d'Établissement | 6 | PROVISEUR, PRINCIPAL, DIRECTEUR, CENSEUR |
| Enseignants | 10 | PROFESSEUR_CERTIFIÉ, INSTITUTEUR, PROFESSEUR_LANGUES |
| Orientation & Conseil | 4 | CONSEILLER_ORIENTEUR, PSYCHOLOGUE_SCOLAIRE |
| Personnel Administratif | 7 | SECRÉTAIRE_DIRECTION, COMPTABLE, BIBLIOTHÉCAIRE |
| Personnel Technique | 5 | TECHNICIEN_LABO, TECHNICIEN_INFO, CONSEILLER_TIC |
| Surveillance & Internat | 4 | SURVEILLANT_GÉNÉRAL, CPE, MAÎTRE_INTERNAT |
| Santé & Bien-être | 3 | INFIRMIER_SCOLAIRE, NUTRITIONNISTE |
| Cantine & Logistique | 3 | CUISINIER, CHAUFFEUR |
| Clubs & Activités | 3 | COORDINATEUR_CLUBS, ENTRAÎNEUR_SPORTIF |
| Spécialisé | 5 | COORDINATEUR_EXAMEN, RESPONSABLE_BOURSES |
| Rôles génériques (existants) | 9 | SUPER_ADMIN, ADMIN, ENSEIGNANT, PARENT, ÉLÈVE... |
| **TOTAL** | **67** | |

#### Permissions par module (exemples)
- **Cantine** : 9 perms (`menus:create/edit/delete`, `inscriptions:create`, `solde:recharger`, `consommations:*`)
- **Transport** : 8 perms (`lignes:*`, `inscriptions:create`, `presences:*`)
- **Élèves** : 6 perms (`view/create/edit`, `radiation`, `reinscription`, `documents:generate`)
- **Notes** : 10 perms (`view/create/edit/delete`, `bulk:create`, `import/export`, `statistiques:view`)
- **Bulletins** : 5 perms (`view/generate/edit/publier/export`)
- **Utilisateurs** : 7 perms (`manage`, `import/export`, `reset-password`, `statut:change`, etc.)

#### Scripts utilitaires
```bash
# Migration des utilisateurs existants
npm run migrate:rbac              # Réel
DRY_RUN=true npm run migrate:rbac # Simulation

# Tests du système RBAC
TEST_USER_ID=uuid npm run test:rbac
```

#### Résolution des permissions (avec cache)
```
PermissionResolverService.resolvePermissions(userId)
  1. Vérifier cache (TTL 5min)
  2. Si miss → résoudre depuis DB:
     - Récupérer rôles utilisateur (UtilisateurRole)
     - Récupérer permissions des rôles
     - Récupérer permissions customs (GRANTED/DENIED)
     - Appliquer overrides (DENIED > GRANTED)
     - Fallback vers enum Role si aucun rôle DB
  3. Stocker en cache
  4. Retourner Set<permissions>
```

#### Fichiers de référence
- `backend/src/modules/rbac/` : Module RBAC complet
- `backend/src/modules/auth/entities/utilisateur-etablissement.entity.ts` : Multi-établissements (N:N)
- `backend/src/modules/auth/entities/role-limitation-etablissement.entity.ts` : Limitations configurables
- `backend/src/modules/auth/services/utilisateur-etablissement.service.ts` : Service gestion affectations
- `backend/src/modules/auth/controllers/auth.controller.ts` : Endpoint switch-etablissement
- `backend/src/common/middlewares/tenant.middleware.ts` : Middleware tenant v2.0
- `backend/src/modules/auth/middlewares/permission.middleware.ts` : Middlewares unifiés
- `backend/src/modules/auth/services/permission-resolver.service.ts` : Résolution + cache
- `backend/src/database/seeds/rbac.seed.ts` : Seed des rôles et permissions
- `backend/src/database/migrations/002-multi-etablissements.sql` : Migration multi-établissements
- `backend/src/database/migrations/003-role-limitations-etablissements.sql` : Migration limitations
- `backend/src/database/migrations/004-roles-systeme-educatif-africain.sql` : Migration 67 rôles
- `docs/rbac-system.md` : Documentation complète (436 lignes)
- `docs/permissions-manquantes.md` : Analyse des permissions (422 lignes)
- `docs/guards-exemples-implémentation.ts` : 10 exemples d'implémentation (554 lignes)
- `ANALYSE_ROLES_EDUCATION_AFRICAINE.md` : Analyse système éducatif (327 lignes)
- `IMPLEMENTATION_EXTENSION_ROLES.md` : Documentation extension rôles (432 lignes)

### Audit Trail (Système de traçabilité complet)

**Architecture** :
```
AuditLog (entité dans auth)
├── 80+ actions définies dans AuditAction enum
├── 3 niveaux de sévérité : INFO, WARNING, CRITICAL
├── Capture : utilisateur, action, cible, IP, user agent, valeurs avant/après
└── Double journalisation : DB + Winston logs

AuditService (méthodes)
├── log() — Méthode générique
├── logLogin() — Connexions réussies/échouées
├── logPasswordChange() — Changements mot de passe
├── logEntityChange() — Modifications entités (avec sanitization)
├── logAccessDenied() — Accès refusés
├── logCRUD() — Helper générique pour CREATE/UPDATE/DELETE
└── getLogs() — Récupération avec filtres

AuditController (API REST /api/audit/*)
├── GET /logs — Liste paginée avec filtres (ADMIN)
├── GET /logs/:id — Détail d'un log (ADMIN)
├── GET /logs/me — Mes logs personnels (tous utilisateurs)
├── GET /logs/export — Export CSV/JSON (ADMIN)
└── GET /logs/statistics — Statistiques complètes (ADMIN)

AuditArchivageService
├── archiveOldLogs(30 jours) — Archive les anciens logs
├── purgeArchivedLogs(365 jours) — Purge les archives
└── getStatistics() — Statistiques agrégées

AuditInterceptor (automatique)
├── createAuditInterceptor() — Configuration flexible
├── genericAuditMiddleware() — Usage simple
└── Capture automatique POST/PUT/PATCH/DELETE
```

**Actions d'audit disponibles** (80+) :

- **Auth** : LOGIN, LOGOUT, LOGIN_FAILED, PASSWORD_CHANGE, PASSWORD_RESET, ETABLISSEMENT_SWITCH
- **Utilisateurs** : USER_CREATE/UPDATE/DELETE, SUSPEND, ACTIVATE, ROLE_CHANGE
- **Multi-établissements** : ETABLISSEMENT_ADD/REMOVE/UPDATE/PRINCIPAL_SET
- **Élèves** : ELEVE_CREATE/UPDATE/DELETE, INSCRIPTION
- **Académique** : CYCLE, NIVEAU, CLASSE, MATIERE, PERIODE, ANNEE_SCOLAIRE (CRUD + ACTIVATE)
- **Bulletins** : BULLETIN_GENERATE, BULLETIN_UPDATE
- **Cantine** : MENU_CREATE/UPDATE/DELETE, INSCRIPTION_CANTINE, SOLDE_RECHARGE, CONSOMMATION
- **Transport** : LIGNE_CREATE/UPDATE/DELETE, INSCRIPTION_TRANSPORT, PRESENCE
- **Cartes** : CARTE_CREATE/UPDATE, DESACTIVER, RENOUVELER, PERTE
- **Matériel** : MATERIEL_CREATE/UPDATE/DELETE, ASSIGN, RETURN
- **Messages** : MESSAGE_SEND, DELETE, MARK_READ
- **Clubs** : CLUB_CREATE/UPDATE/DELETE, JOIN, LEAVE
- **Gamification** : BADGE_AWARD, SCORE_UPDATE
- **Orientation** : ORIENTATION_CREATE/UPDATE/VALIDATE
- **Requêtes** : REQUETE_CREATE/EXECUTE/DELETE
- **RBAC** : ROLE_CREATE/UPDATE/DELETE/ASSIGN/REVOKE, PERMISSION_CREATE/UPDATE/DELETE
- **Config** : CONFIG_UPDATE, MODULE_ACTIVATE/DEACTIVATE
- **Sécurité** : ACCESS_DENIED, PERMISSION_CHANGE, DATA_EXPORT/IMPORT/DELETE_BULK
- **Documents** : DOCUMENT_CREATE/DELETE/PRINT/GENERATE
- **Notes** : NOTE_CREATE/UPDATE/DELETE/VALIDATE

**Modules instrumentés** (exemples) :
- ✅ Auth (login, password, access denied)
- ✅ Élèves (create, update, delete)
- ✅ Utilisateurs (create, update, delete, suspend/activate)
- ✅ Notes (create, update)
- ✅ Configuration (via historique dédié)

**Comment instrumenter un module** :
```typescript
// 1. Imports
import { Request } from 'express';
import { auditService, AuditAction } from '@modules/auth';

// 2. Dans la méthode CREATE
async create(dto: CreateDto, req?: Request): Promise<Entity> {
    const entity = await this.repo.save(dto);
    
    if (req?.utilisateur?.id) {
        await auditService.log({
            utilisateurId: req.utilisateur.id,
            action: AuditAction.ELEVE_CREATE,
            cible: 'Eleve',
            cibleId: entity.id,
            description: `Création élève: ${entity.matricule}`,
            nouvellesValeurs: dto,
            module: 'eleves',
        }, req);
    }
    
    return entity;
}

// 3. Dans le controller, passer req
router.post('/', authMiddleware, async (req, res) => {
    const entity = await service.create(req.body, req); // ← Ajouter req
    res.json({ success: true, data: entity });
});
```

**Archivage automatique** :
- Logs < 30 jours : table `audit_logs` (accès rapide)
- Logs 30-365 jours : table `audit_logs_archive` (accès modéré)
- Logs > 365 jours : export + suppression (configurable)
- Migration SQL : `003-audit-logs-archive.sql`
- Fonctions PostgreSQL : `archive_old_audit_logs()`, `purge_old_audit_archives()`

**Documentation** :
- Guide complet : `backend/docs/audit-trail.md`
- Guide d'instrumentation : `backend/AUDIT-INSTRUMENTATION-GUIDE.md`
- Récapitulatif : `IMPLEMENTATION-AUDIT-TRAIL.md`

---

## Domaine 2.5 : Système de Backup (v1.0 - 2026-06)

### Architecture Backup

```typescript
ConfigBackupService
├── createSnapshot() — Snapshot config avec versioning sémantique
├── restoreBackup() — Restauration avec validation checksum
├── cloneConfiguration() — Clonage inter-établissements
├── collectSnapshot() — Collecte données (paramètres, modules)
└── computeDiff() — Backup différentiel (JSON Patch RFC 6902)

DatabaseBackupService
├── backupEtablissement() — Export TypeORM + chiffrement AES-256-GCM
├── restoreBackup() — Restauration transactionnelle
├── verifyBackupIntegrity() — Vérification checksum SHA-256
└── exportEtablissementData() — Export tables multi-tenant

DatabaseStorageProvider
├── save() — Stockage avec compression + chiffrement
├── load() — Chargement avec validation checksum
├── delete() — Soft delete (récupération possible)
├── list() — Liste avec filtres multi-tenant
├── cleanupExpiredBackups() — Nettoyage automatique
└── getStorageUsage() — Métriques usage

BackupRecord (Entity)
├── etablissementId — Isolation multi-tenant
├── backupType — CONFIG | DATABASE | FULL
├── version — Version sémantique (v1.0.0-global-timestamp)
├── checksum — SHA-256 pour intégrité
├── compressed | encrypted — Flags compression/chiffrement
├── retentionUntil — Date expiration automatique
└── metadata — JSONB (taille, tables, options)
```

### Règles métier Backup

**Sauvegarde Configuration** :
- Snapshots incluent : `ParametreSysteme`, `EtablissementConfig`, `ConfigurationModule`
- Versionning sémantique : `v{major}.{minor}.{patch}-{scope}-{timestamp}`
- Backups différentiels : 60-80% réduction taille (JSON Patch)
- Clonage : Copie config entre établissements avec résolution conflits

**Sauvegarde Database** :
- Export tables par `etablissement_id` (15+ tables)
- Chiffrement AES-256-GCM avec IV unique par backup
- Compression gzip (60-80% réduction)
- Restauration transactionnelle (QueryRunner)

**Rétention automatique** :
- Config : 30 jours par défaut
- Database : 90 jours par défaut
- Full : 180 jours par défaut
- Nettoyage automatique via `cleanupExpiredBackups()`

**Intégrité** :
- Checksum SHA-256 calculé sur données compressées/chiffrées
- Validation automatique avant restauration
- Détection tampering via GCM authentication tag

**Multi-tenant** :
- Isolation stricte par `etablissement_id`
- Fallback global (`etablissement_id = NULL`)
- Jamais de cross-tenant access
- SUPER_ADMIN peut voir tous les établissements

**Sécurité** :
- RBAC : ADMIN/SUPER_ADMIN pour créer/restaurer/supprimer
- Authentifié pour lister/voir (scoped par établissement)
- Clé chiffrement dans `.env` (jamais en dur)
- Force restore optionnel pour conflits

### Comment utiliser le backup

```typescript
// Créer un backup config
const backup = await configBackupService.createSnapshot(etablissementId, {
    differential: true,  // Réduction 60-80%
    compress: true,
    encrypt: true,
    retentionDays: 30,
});

// Restaurer
await configBackupService.restoreBackup(backupId, false);

// Cloner vers autres établissements
await configBackupService.cloneConfiguration(
    sourceId,
    [targetId1, targetId2],
    { conflictResolution: 'merge', dryRun: false }
);

// Vérifier intégrité
const integrity = await databaseBackupService.verifyBackupIntegrity(backupId);
```

### API REST

```bash
POST   /api/backups/config                      # Backup config
POST   /api/backups/database/:id                # Backup DB
POST   /api/backups/:id/restore                 # Restaurer
POST   /api/backups/:id/verify                  # Vérifier
POST   /api/configuration/clone                 # Cloner config
GET    /api/backups/metrics/summary             # Métriques
```

### Configuration requise

```env
BACKUP_ENCRYPTION_KEY=cle-minimum-32-caracteres
```

Générer : `openssl rand -hex 32`

### Documentation
- Guide utilisateur : `BACKUP-SYSTEM-USER-GUIDE.md`
- Implémentation : `BACKUP-SYSTEM-IMPLEMENTATION-COMPLETE.md`
- README final : `BACKUP-SYSTEM-README-FINAL.md`

---

## Domaine 3 : Configuration dynamique et multi-établissement

### Architecture multi-tenant (v2.0 - 2026-06)

**Résolution avec fallback :**
```
getParametre(cle, etablissementId?)
  1. Override établissement (etablissementId = UUID)
  2. Fallback global (etablissementId = NULL)
  3. Cache in-memory (TTL 5min, clés: "cle" ou "cle:etablissementId")
```

**Index composite unique :** `(cle, etablissement_id)`
- NULL = paramètre global (tous établissements)
- UUID = override spécifique à un établissement

**EtablissementConfig (remplace ConfigurationApp @deprecated) :**
- Thème : couleurPrimaire, couleurSecondaire, couleurAccent, theme
- Régional : langueDefaut, devise, fuseauHoraire, messageAccueil
- Modules : modulesActifs (JSON)
- Quotas SaaS : maxEleves, maxUtilisateurs, maxClasses, stockageMaxMB
- Abonnement : planAbonnement, dateExpirationAbonnement

### Architecture du système de configuration

```
ConfigurationService (603 lignes — le plus gros service)
├── Cache mémoire TTL 5 min (3 niveaux : app, modules, paramètres)
├── Invalidation sélective à chaque modification
├── HistoriqueConfiguration (audit trail complet)
└── ConfigurationListener (EventEmitter — événements : CHANGE, APP_CHANGE, MODULE_CHANGE, etc.)

ConfigHelper (API publique utilisée par 12+ modules)
├── getParam<T>(clé, défaut) — avec cache rapide TTL 1 min
├── getParamNumber(), getParamBoolean(), getParamJson(), getParamArray()
├── isModuleActive(moduleName)
└── getAppConfig(), getModuleParams()
```

### Paramètres influençant le comportement métier

| Clé | Défaut | Modules impactés | Effet |
|-----|--------|-----------------|-------|
| `auth.max_login_attempts` | 5 | auth | Blocage après N tentatives |
| `auth.lockout_duration` | 15 | auth | Durée du blocage (minutes) |
| `auth.password_min_length` | 8 | auth, utilisateurs | Longueur minimale mdp |
| `notes.bareme_defaut` | 20 | notes, bulletins | Barème par défaut des notes |
| `notes.require_validation` | true | notes | Workflow BROUILLON obligatoire |
| `notes.show_ranking` | true | bulletins | Affichage du rang |
| `cantine.menu_planning_days` | 7 | cantine | Jours de planification menus |
| `cantine.allow_preorder` | true | cantine | Pré-commande autorisée |
| `cantine.max_debt` | 10000 | cantine | Dette maximale (FCFA) |
| `transport.enable_gps` | false | transport | GPS activé |
| `transport.enable_qr_checkin` | true | transport | Check-in QR obligatoire |
| `gamification.points_attendance` | 5 | gamification | Points assiduité |
| `gamification.points_good_grade` | 10 | gamification | Points bonne note |
| `gamification.enable_leaderboard` | true | gamification | Classement visible |
| `cartes.enable_qrcode` | true | cartes | Génération QR code |
| `cartes.validity_months` | 12 | cartes | Durée validité |
| `clubs.max_per_student` | 3 | clubs | Max clubs par élève |
| `clubs.require_approval` | true | clubs | Approbation inscription |
| `materiel.max_loan_days` | 30 | materiel | Durée max prêt (jours) |
| `requetes.approval_levels` | 1 | requetes | Niveaux d'approbation |
| `system.maintenance_mode` | false | monitoring | Mode maintenance |

### Comment ajouter un nouveau paramètre

```typescript
// 1. Ajouter dans configuration-seed.service.ts
await this.upsertParametre({
    cle: 'module.new_param',
    categorie: CategorieParametre.MODULE,
    module: 'nom_module',
    valeurDefaut: JSON.stringify('default_value'),
    typeValeur: 'STRING',
    modifiableRuntime: true,
    visible: true,
});

// 2. Utiliser dans le service cible
import { getParamNumber } from '@modules/configuration/utils/config.helper';
const value = getParamNumber('module.new_param', 42);
```

---

## Domaine 4 : Services logistiques

### Cantine — Porte-monnaie électronique

```
Inscription (solde=0, statut=ACTIVE)
  → rechargerSolde(montant) — min 100 FCFA
  → enregistrerConsommation(inscriptionId, menuId)
      ├── Vérifie inscription active
      ├── Vérifie solde >= montant du menu
      ├── Débite le solde
      └── Crée ConsommationCantine (paye=true si débit effectué)
```

- Solde ne peut **jamais** être négatif
- Devise depuis config (`regional.currency`, défaut XOF/FCFA)
- Menus avec allergènes, types de repas, statuts (DISPONIBLE/ÉPUISÉ/ANNULÉ/CONSOMMÉ)

### Transport — Présences QR

```
Ligne (arrêts JSON ordonnés) + Inscription (élève, arrêt montée/descente)
  → enregistrerPresence(inscriptionId, trajet, qrData?)
      ├── Si QR checkin activé (config) → vérifie données QR
      └── Crée PresenceTransport (aller/retour, heure montée)
```

### Matériel — Gestion de stock avec prêts

```
Materiel (quantité, disponible)
  → preter(materielId, emprunteurId, quantite, jours)
      ├── Vérifie disponible=true ET quantite >= demandée
      ├── Vérifie durée <= maxLoanDays (config, défaut 30j)
      ├── Décrémente quantite → si 0, disponible=false
      └── Crée PretMateriel avec dateRetourPrevue auto
  → retourner(pretId)
      ├── Vérifie non déjà retourné
      ├── Incrémente quantite
      └── disponible=true
```

---

## Domaine 5 : Requêtes — Workflow multi-niveaux

```
Création requête
  → Numéro auto : TYP-YYYY-NNNNN (ex: CONGE-2026-00001)
  → Niveaux approbation depuis config (requetes.approval_levels)
  → Statut initial : EN_ATTENTE

traiter(requeteId, decision, commentaire)
  ├── APPROUVE :
  │   ├── niveauActuel++
  │   ├── Si niveauActuel >= approvalLevels → STATUT = APPROUVÉE
  │   └── Sinon → STATUT = EN_COURS (attente niveau suivant)
  ├── REJETE → STATUT = REJETÉE (immédiat, peu importe le niveau)
  └── Historique : {approbateur, décision, date, commentaire}

annuler(requeteId, userId)
  └── Seul le demandeur peut annuler, seulement si EN_ATTENTE
```

---

## Domaine 6 : Gamification et Scoring

### Gamification

```
attribuerPoints(userId, action, points)
  → PointsUtilisateur : pointsTotal += points, calcul niveau = floor(total/100)+1
  → HistoriquePoints (action, points, description)

attribuerPointsBonneNote(userId, note, bareme)
  → Condition : (note/bareme) >= 0.80 (80%)
  → Points depuis config (gamification.points_good_grade, défaut 10)

attribuerBadge(userId, badgeId)
  → Idempotent : retourne l'existant si déjà attribué

getClassement()
  → Retourne [] si leaderboard désactivé (config)
```

### Scoring

```
ScoreEleve (5 types indicateurs : ACADÉMIQUE, COMPORTEMENT, ASSIDUITÉ, PARTICIPATION, GLOBAL)

getScoreGlobal(eleveId)
  → Moyenne pondérée configurable :
    académique 40% + comportement 25% + assiduité 25% + participation 10%

appliquerRegle(evenement, eleveId)
  → Trouve toutes les RegleScoring pour l'événement
  → Attribue les points correspondants

calculerRangs(type)
  → Tri DESC par score → rang séquentiel
```

---

## Domaine 7 : Orientation

```
ProfilOrientation (1 par élève — unicité)
  → aptitudes : objet {domaine, niveau}
  → centresInteret, motivations, filiereSouhaitee

suggestFilieres(profilId)
  → Matching mots-clés par filière :
    SCIENTIFIQUE : "math", "physique", "science"
    LITTÉRAIRE : "français", "lettre", "philo"
    TECHNIQUE : "tech", "info", "électro"
    ARTISTIQUE : "art", "musique", "dessin"
  → Score par filière, tri DESC, filtre score > 0

RdvOrientation (statuts : PLANIFIÉ, TERMINÉ, ANNULÉ)
  → Durée : 15 à 120 minutes (défaut 30)
  → annulerRdv() = raccourci vers statut ANNULÉ
```

---

## Domaine 8 : Cartes et Documents

### Cartes

```
create(carteDto)
  → Expiration = now + validityMonths (config, défaut 12)
  → Numéro unique : TYP25XXXXXX (2 chiffres année + 6 aléatoire)
  → QR code si activé (config) — format ELISA:{type}:{userId}:{timestamp}
  → Nom établissement depuis AppConfig

renouveler(carteId)
  → Expire l'ancienne (EXPIRÉE) → crée nouvelle avec mêmes params

verifier(numeroCarte)
  → Vérifie existence + statut ACTIVE + non expirée

getCartesExpirantBientot(jours=30)
  → Anticipation configurable
```

### Impressions

```
genererDocument(type, data, modeleId?)
  → Récupère modèle (spécifique ou par défaut du type)
  → Génère en-tête HTML (logo, nom, arrêté, adresse, slogan depuis AppConfig)
  → Remplace placeholders {{key}} dans le template HTML
  → Génère pied de page
  → TODO : Puppeteer pour conversion PDF

ModeleDocument : 7 types (BULLETIN, CERTIFICAT, CARTE_SCOLAIRE, ATTESTATION, RAPPORT, FORMULAIRE, AUTRE)
  → Si parDefaut=true, désactive les autres par défaut du même type
```

---

## Patterns transversaux

### Multi-tenancy (Version 2.0 - Multi-Établissements)

- `etablissementId` sur la plupart des entités (nullable = global)
- **Résolution automatique** via `tenantMiddleware` (v2.0)
- **Multi-établissements** : Table `UtilisateurEtablissement` (N:N)
- **Algorithme de sélection** :
  1. Query param `?etablissementId=` (si fourni et accessible)
  2. Établissement principal (`etablissementPrincipal = true`)
  3. Premier établissement actif (fallback)
- **Switch rapide** : `POST /api/auth/switch-etablissement`
- **Limitations par rôle** : Configurable dans `RoleLimitationEtablissement`
- Modules concernés : cantine, transport, clubs, cartes, matériel, classes, notes, bulletins, etc.
- **Non concernés** : cycles, niveaux, matières brutes (données de référence partagées)
- **Audit complet** : Tous les changements d'établissement sont journalisés

### Unicité par vérification manuelle

| Entité | Champ | Code d'erreur |
|--------|-------|--------------|
| Élève | matricule | `MATRICULE_EXISTS` (409) |
| Élève | utilisateurId | `USER_ALREADY_LINKED` (409) |
| Personnel | matricule | `MATRICULE_EXISTS` (409) |
| Personnel | utilisateurId | `USER_ALREADY_MEMBER` (409) |
| Matière | nom | `MATIERE_EXISTS` (409) |
| Cycle | code | `CYCLE_EXISTS` (409) |
| Club | nom par établissement | vérifié |
| Classe | affectation élève/année | `ALREADY_ASSIGNED` (409) |
| Carte | numeroCarte | contrainte DB unique |
| Gamification badge | code | contrainte DB unique |

### Protection suppression

| Entité | Condition | Code d'erreur |
|--------|-----------|--------------|
| Année scolaire | `enCours = true` | `CANNOT_DELETE_ACTIVE` |
| Période | `cloturee = true` | `CANNOT_DELETE_CLOSED` |
| Classe | élèves actifs affectés | `CLASS_NOT_EMPTY` |

### Workflow par statuts

| Entité | Statuts | Transitions |
|--------|---------|-------------|
| Note | BROUILLON → VALIDÉE → PUBLIÉE | Validation horodatée + validateur |
| Bulletin | publie (boolean) | false → true |
| Requête | EN_ATTENTE → EN_COURS → APPROUVÉE/REJETÉE | Multi-niveaux |
| RDV Orientation | PLANIFIÉ → TERMINÉ/ANNULÉ | annulerRdv() |
| Notification | EN_ATTENTE → ENVOYÉE → LUE/ÉCHEC | Dispatch par canal |
| Utilisateur | ACTIF/INACTIF/SUSPENDU/EN_ATTENTE_VALIDATION | changeStatut() |
| Élève | ACTIF/EXCLU/ABANDON/DIPLÔMÉ | update() |
| Cantine inscription | ACTIVE/SUSPENDUE/RÉSILIÉE | — |
| Impression file | EN_ATTENTE → EN_COURS → TERMINÉ/ÉCHEC/ANNULÉ | annulerImpression() |
| Carte | ACTIVE/INACTIVE/PERDUE/EXPIRÉE/DÉSACTIVÉE | renouveler(), signalerPerte() |

### Workflow de validation (système unifié)

**Service central** : `ValidationWorkflowService` (`backend/src/modules/auth/services/validation-workflow.service.ts`)

**Principe** : Tout module peut activer la validation multi-niveaux via 3 paramètres système :
- `{module}.require_validation` (booléen) — active/désactive
- `{module}.validation_levels` (nombre) — nombre de niveaux (1-5)
- `{module}.validation_roles` (JSON) — rôles requis par niveau `{ "1": "ADMIN", "2": "SUPER_ADMIN" }`

**Flux** :
```
create() → statut = EN_ATTENTE_VALIDATION (si requireValidation=true)
  → validationWorkflowService.createWorkflow({ module, entiteId, entiteType, niveauxRequis, etablissementId })
  → Niveaux créés avec statut EN_ATTENTE

traiterValidation(workflowId, dto: { niveauId, decision, commentaire })
  → decision: APPROUVE | REJETE
  → Si tous niveaux approuvés → callback onSuccess applique le statut final (ACTIF)
  → Si rejeté → statut REJETE, entité non activée
```

**API REST** (10 routes, `/api/validation-workflows`) :
| Route | Usage |
|-------|-------|
| `GET /` | Lister workflows (filtré par module/entiteId/etablissementId) |
| `GET /:id` | Détail d'un workflow avec ses niveaux |
| `POST /` | Créer un workflow |
| `PATCH /:id` | Modifier un workflow |
| `POST /:id/valider` | Traiter une validation (APPROUVE/REJETE) |
| `POST /:id/annuler` | Annuler un workflow en attente |
| `GET /dashboard` | Dashboard agrégé (tous modules) |
| `GET /statistiques` | Statistiques globales |
| `GET /mes-validations` | Validations assignées à l'utilisateur courant |
| `GET /:id/historique` | Historique complet des actions |

**Entités concernées** (15 modules) : notes, bulletins, cantine, transport, requetes, classes, matieres, periodes, eleves, personnel, clubs, materiel, cartes, annees_scolaires, etablissement.

**Intégration backend** :
```typescript
// 1. Entity — colonne statut varchar(30)
@Column({ type: 'varchar', length: 30, default: StatutXxx.ACTIF })
statut!: StatutXxx;

// 2. Service — création conditionnelle
async create(dto, createurId?, etablissementId?) {
    const requireValidation = await getParamBoolean('xxx.require_validation', false);
    const entity = repo.create({ ...dto, statut: requireValidation ? StatutXxx.EN_ATTENTE_VALIDATION : StatutXxx.ACTIF });
    await repo.save(entity);
    if (requireValidation && createurId) {
        await validationWorkflowService.createWorkflow({ module: 'xxx', entiteId: entity.id, ... }, createurId);
    }
    return entity;
}
```

**Règle d'or** : Le workflow dispatch réellement sur l'entité (statut appliqué). Jamais de workflow orphelin sans impact sur l'entité cible.

### Audit Trail (traçabilité)

**Service** : `AuditLogService` (`backend/src/modules/auth/services/audit-log.service.ts`)
**Entité** : `AuditLog` (table `audit_logs`) — `module`, `action` (AuditAction enum), `cibleType`, `cibleId`, `utilisateurId`, `etablissementId`, `metadata` (JSONB), `adresseIp`

**API** : `GET /api/audit/logs?cible=&cibleId=&module=&limit=&offset=`

**Actions critiques à auditer** : CREATE, UPDATE, DELETE, VALIDER, REJETER, PUBLIER, DEPUBLIER, RESTAURER, EXPORTER.

**Pattern d'intégration** :
```typescript
await auditLogService.log({
    module: 'notes', action: AuditAction.NOTE_CREATE,
    cibleType: 'Note', cibleId: note.id,
    utilisateurId: req.utilisateur.id, etablissementId,
    metadata: { eleveId: note.eleveId, matiere: note.matiereNom },
});
```

**Permissions RBAC** (migration 131) :
- `audit:view` — accès global (ADMIN, SUPER_ADMIN)
- `audit:{module}:view` — accès scopé par module (11 modules : notes, bulletins, personnel, contrats, paie, eleves, classes, matieres, periodes, emploi-du-temps, organisation)
- **Middleware dynamique** `requireAuditAccess` : `audit:view` (global) OU `audit:{module}:view` (scopé via query param `module`)

**Composants frontend partagés** :
- `AuditTimeline` (`@/components/ui/AuditTimeline`) : timeline entity-scoped (`cible` + `cibleId`), double vérification permission
- `DashboardAuditWidget` (`features/dashboard/components/`) : widget global (10 derniers logs, `audit:view` requis)

**Wiring onglet Historique** (7 pages détail) :
```tsx
// Permission gate
...(hasPermission('audit:{module}:view') || hasPermission('audit:view')
    ? [{ id: 'historique', label: t('...'), icon: History }]
    : []),

// Contenu
<AuditTimeline cible="{Entity}" cibleId={id} module="{module}" />
```

| Page | cible | module |
|------|-------|--------|
| bulletin-detail | `'Bulletin'` | `'bulletins'` |
| personnel-detail | `'MembrePersonnel'` | `'personnel'` |
| matiere-detail | `'Matiere'` | `'matieres'` |
| annee-scolaire-detail | `'AnneeScolaire'` | `'annees-scolaires'` |
| classe-detail | `'Classe'` | `'classes'` |
| note-detail | `'Note'` | `'notes'` |
| periode-detail | `'Periode'` | `'periodes'` |

### Configuration-driven (piloté par config)

- **12+ modules** lisent leurs paramètres depuis `config.helper`
- Cache multi-niveaux : ConfigurationService (5min) + ConfigHelper (1min)
- Invalidation automatique à chaque modification
- EventEmitter pour propagation des changements (ConfigurationListener)
- Paramètres non modifiables au runtime : flag `modifiableRuntime = false`

---

## Domaine 9 : Sondages — Système de Sondage Complet

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

### Flux de données

```
TemplateSondage (modèle prédéfini)
  → Créer sondage (copier depuis template ou créer from scratch)
  → Statut initial : BROUILLON | PROGRAMME | ACTIF
  → Destinataires : individu ou groupe (max 500)
  
Sondage actif
  → Voter (option unique ou multiple selon choixMultiple)
  → Vote enregistré (anonyme ou nominatif selon estAnonyme)
  → Analyses en temps réel (taux participation, répartition)
  
Sondage expiré ou terminé
  → Statut = TERMINE
  → Export CSV/PDF des résultats
  
Sondage récurrent
  → Cron job quotidien crée nouvelle occurrence
  → sondageParentId lie occurrence au parent
```

### Règles métier critiques

**Templates** :
- Templates système (`estTemplateSysteme = true`) : non supprimables, visibilità `systeme`
- Templates personnalisés : créés par ADMIN/SUPER_ADMIN, visibilità `etablissement`
- 5 templates par défaut : Satisfaction générale, Évaluation cours, Choix activité, Feedback événement, Suggestions amélioration

**Votes** :
- Unicité : 1 utilisateur = 1 vote par sondage (sauf `choixMultiple = true`)
- Anonymat : Si `estAnonyme = true`, `voterId` stocké mais non visible dans analyses
- Modification : Vote modifiable tant que sondage ACTIF
- Suppression : Impossible une fois sondage TERMINE

**Sondages récurrents** :
- `frequenceRecurrent` : 'quotidien', 'hebdomadaire', 'mensuel'
- `jourRecurrent` : Jour de la semaine (1-7) ou du mois (1-31)
- `heureRecurrent` : Heure de création automatique
- `dateFinRecurrent` : Date limite de récurrence (NULL = indéfini)
- Occurrences créées avec statut PROGRAMME

**Analyses** :
- Taux participation = (votants uniques / destinataires) × 100
- Répartition : Nombre de votes par option avec pourcentage
- Statistiques : total_votes, total_destinataires, taux_participation
- Export CSV : données brutes pour analyse externe
- Export PDF : graphique visuel avec HTML/CSS moderne

### Cron Jobs (4)

| Job | Schedule | Action |
|-----|----------|--------|
| **Fermer sondages expirés** | `*/10 * * * *` | Passer à `termine` si `dateLimite` passée |
| **Activer sondages programmés** | `*/10 * * * *` | Passer à `actif` si `dateProgrammation` <= maintenant |
| **Créer occurrences récurrentes** | `0 1 * * *` | Générer nouvelles occurrences pour sondages récurrents |
| **Rappel sondages actifs** | `0 9 * * 1-5` | Rappeler les sondages avec faible participation |

### Permissions RBAC (7)

```typescript
SONDAGES_CREATE = 'sondages:create',      // Créer sondage/template
SONDAGES_VOTE = 'sondages:vote',          // Voter à un sondage
SONDAGES_ANALYZE = 'sondages:analyze',    // Voir analyses/export
SONDAGES_VIEW = 'sondages:view',          // Voir sondages
SONDAGES_EDIT = 'sondages:edit',          // Modifier sondage
SONDAGES_DELETE = 'sondages:delete',      // Supprimer sondage
SONDAGES_TEMPLATES_MANAGE = 'sondages:templates:manage',  // Gérer templates
```

### Intégration avec Notifications

**Pattern d'envoi de notifications lors de la création** :
```typescript
// Dans sondage.service.ts - createSondage()
try {
    // 1. Transaction : créer sondage + options
    await queryRunner.commitTransaction();

    // 2. Notifications NON-BLOQUANTES
    if (!isScheduled) {
        try {
            await this.envoyerNotificationsSondage(sondage, destinataireIds);
            sondageWebSocketService.broadcastSondageActive(sondage.id, destinataireIds);
        } catch (error) {
            logger.warn(`[Sondage] Échec envoi notifications (non bloquant)`, error);
        }
    }
} catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
}
```

### Points Clés

1. **Multi-tenancy strict** : Toutes les opérations filtrées par `etablissementId`
2. **Templates système** : Visibilité `systeme` avec `estTemplateSysteme = true` (non supprimables)
3. **Vote unique** : Un utilisateur ne peut voter qu'une fois par sondage (sauf `choixMultiple`)
4. **Anonymat** : Si `estAnonyme = true`, le vote ne stocke pas l'ID utilisateur visible
5. **Récurrence** : `sondageParentId` lie les occurrences au sondage parent
6. **Export** : CSV pour données brutes, PDF/HTML pour visualisation avec graphiques CSS
7. **WebSocket** : Service prêt pour Socket.IO (interface TypeScript sans dépendance externe)
8. **Cron jobs** : Activation requise via `ENABLE_CRON_JOBS=true` dans `.env`

### Fichiers de Référence

- **Entités** : `backend/src/modules/sondages/entities/sondage.entity.ts` (299 lignes)
- **DTOs** : `backend/src/modules/sondages/dto/sondage.dto.ts` (107 lignes, 9 schémas Zod)
- **Service** : `backend/src/modules/sondages/services/sondage.service.ts` (566 lignes)
- **Controller** : `backend/src/modules/sondages/controllers/sondages.controller.ts` (368 lignes, 18 routes)
- **Cron Jobs** : `backend/src/modules/sondages/cron-jobs.ts` (230 lignes, 4 tâches)
- **Export PDF** : `backend/src/modules/sondages/services/sondage.pdf.ts`
- **WebSocket** : `backend/src/modules/sondages/services/sondage.websocket.ts` (115 lignes)
- **Migration** : `backend/database/migrations/041-module-sondages.sql` (tables + seeds)
- **Migration récurrents** : `backend/database/migrations/042-sondages-recurrents.sql`
- **Déploiement** : `scripts/deploy-sondages.sh` (script automatisé)

---

## Guide de modification de la logique métier

### Avant de modifier

1. **Identifier le domaine** concerné (académique, auth, config, logistique, etc.)
2. **Tracer les dépendances** : quels modules/services sont impactés ?
3. **Vérifier les paramètres config** qui influencent le comportement
4. **Lire le service complet** avant de toucher au code
5. **Identifier les protections** existantes (unicité, cascade, workflow)

### Règles de sécurité

```
NE PAS modifier sans comprendre :
- L'impact sur le calcul de bulletins (cascade notes → moyennes → bulletin)
- Les contraintes d'unicité (matricules, affectations)
- Les protections de suppression (année active, période clôturée)
- Le système de cache (TTL, invalidation)
- Le multi-tenancy (etablissementId)
- Les paramètres config qui pilotent le comportement

TOUJOURS vérifier :
- Les imports croisés entre modules (barrel exports)
- Les événements émis (ConfigurationListener)
- L'historique de configuration (audit trail)
- Les tests manuels après modification
```

### Ajouter une nouvelle règle métier

```typescript
// Pattern standard dans le service :
async maNouvelleOperation(id: string, dto: MonDto): Promise<Entity> {
    // 1. Récupérer l'entité (ou throw 404)
    const entity = await this.findOne(id);

    // 2. Vérifier les conditions métier
    if (entity.statut !== 'EXPECTED_STATUS') {
        throw new AppError('Message en français', 400, 'INVALID_STATUS');
    }

    // 3. Lire la config si nécessaire
    const param = getParamNumber('module.param', defaultValue);

    // 4. Appliquer la logique
    entity.champ = nouvelleValeur;
    await this.repo.save(entity);

    // 5. Logger l'opération
    logger.info(`Opération effectuée: ${id}`);

    // 6. Émettre un événement si pertinent
    // configListener.emit('module:event', { id, ... });

    return entity;
}
```

---

## Fichiers clés pour la logique métier

| Rôle | Fichier | Lignes |
|------|---------|--------|
| Cœur configuration | `backend/src/modules/configuration/services/configuration.service.ts` | 603 |
| API config (utilisé partout) | `backend/src/modules/configuration/utils/config.helper.ts` | — |
| Seed paramètres par défaut | `backend/src/modules/configuration/services/configuration-seed.service.ts` | — |
| Event listener config | `backend/src/modules/configuration/services/configuration-listener.ts` | — |
| Calcul notes | `backend/src/modules/notes/services/notes.service.ts` | 189 |
| Génération bulletins | `backend/src/modules/bulletins/services/bulletins.service.ts` | 122 |
| Affectation classes | `backend/src/modules/classes/services/classes.service.ts` | 120 |
| Programme matières | `backend/src/modules/matieres/services/matieres.service.ts` | 133 |
| Auth complète | `backend/src/modules/auth/services/auth.service.ts` | — |
| Porte-monnaie cantine | `backend/src/modules/cantine/services/cantine.service.ts` | — |
| Workflow requêtes | `backend/src/modules/requetes/services/requete.service.ts` | — |
| Scoring pondéré | `backend/src/modules/scoring/services/scoring.service.ts` | — |
| Gamification | `backend/src/modules/gamification/services/gamification.service.ts` | — |
| Orientation (suggestions) | `backend/src/modules/orientation/services/orientation.service.ts` | 171 |
| **Audit trail (entité)** | `backend/src/modules/auth/entities/audit-log.entity.ts` | 139 |
| **Audit trail (service)** | `backend/src/modules/auth/services/audit.service.ts` | 230 |
| **Audit trail (controller)** | `backend/src/modules/audit/controllers/audit.controller.ts` | 300 |
| **Audit archivage** | `backend/src/modules/audit/services/archivage.service.ts` | 149 |
| **Audit interceptor** | `backend/src/common/interceptors/audit.interceptor.ts` | 175 |
| **Migration archivage** | `backend/src/database/migrations/003-audit-logs-archive.sql` | 129 |
| **Multi-établissements (entité)** | `backend/src/modules/auth/entities/utilisateur-etablissement.entity.ts` | 105 |
| **Multi-établissements (service)** | `backend/src/modules/auth/services/utilisateur-etablissement.service.ts` | 217 |
| **Multi-établissements (controller)** | `backend/src/modules/auth/controllers/utilisateur-etablissement.controller.ts` | 244 |
| **Limitations rôles (entité)** | `backend/src/modules/auth/entities/role-limitation-etablissement.entity.ts` | 64 |
| **Middleware tenant v2.0** | `backend/src/common/middlewares/tenant.middleware.ts` | ~100 |
| **Rôles système (67)** | `shared/src/enums/roles.enum.ts` | ~200 |
| **Migration multi-établissements** | `backend/src/database/migrations/002-multi-etablissements.sql` | 130 |
| **Migration limitations** | `backend/src/database/migrations/003-role-limitations-etablissements.sql` | 76 |
| **Migration 67 rôles** | `backend/src/database/migrations/004-roles-systeme-educatif-africain.sql` | 217 |
| Enums partagés | `shared/src/enums/roles.enum.ts`, `statuts.enum.ts`, `modules.enum.ts` | — |
| Types API | `shared/src/types/api.types.ts` | — |
| Registre modules | `shared/src/config/config.registry.ts` | — |

---

## Système de Notifications Multi-Canal

### Architecture

Le système de notifications supporte **4 providers** avec routage intelligent basé sur les préférences utilisateur :

- **In-App** — Base de données (toujours actif)
- **Email** — SMTP (SendGrid, Mailgun, etc.)
- **SMS** — API SMS (Twilio, Orange, etc.)
- **Push** — Firebase/Expo (mobile)

### Composants Clés

| Composant | Fichier | Rôle |
|-----------|---------|------|
| **Provider Registry** | `notifications/services/provider-registry.service.ts` | Gère les providers actifs |
| **Notification Templates** | `notifications/services/notification-templates.service.ts` | Templates centralisés |
| **Notifications Service** | `notifications/services/notifications.service.ts` | CRUD + envoi multi-provider |
| **Cron Jobs** | `notifications/cron-jobs.ts` | Tâches automatisées |
| **Notification Entity** | `notifications/entities/notification.entity.ts` | Modèle de données |

### Templates Disponibles

**Académique** :
- `nouvelleNote` — Nouvelle note publiée
- `bulletinDisponible` — Bulletin prêt à consulter

**Vie Scolaire** :
- `rechargementCantine` — Solde cantine rechargé
- `retardBus` — Bus en retard (>5 min)
- `rappelPaiementCantine` — Rappel de paiement (cron job quotidien 8h)

### Règles Métier

1. **Non-bloquant** : Les erreurs de notification ne doivent JAMAIS bloquer la logique métier
2. **Multi-destinataire** : Un élève peut avoir plusieurs responsables → notifier tous
3. **Scope établissement** : Toutes les notifications sont isolées par `etablissementId`
4. **Priorisation** : 4 niveaux — `NORMALE`, `HAUTE`, `URGENTE`, `CRITIQUE`
5. **Cache** : TTL 5 min pour les préférences de notification

### Intégration dans les Modules Métier

**Modules intégrés** (4) :
- `notes` — Notification aux responsables lors de la création d'une note
- `bulletins` — Notification aux responsables quand bulletin généré
- `cantine` — Notification rechargement + rappels paiement (cron)
- `transport` — Notification retard bus si >5 min

**Pattern d'intégration** :
```typescript
// TOUJOURS non-bloquant
try {
    await notificationTemplates.xxx({
        destinataireId: resp.utilisateurId,
        etablissementId,
        metadata: { ... },
    }, {
        // variables du template
    });
} catch (error) {
    logger.warn(`[Module] Échec notification (non bloquant)`, error);
}
```

### Accès aux Responsables

**IMPORTANT** : L'entité `Eleve` n'a PAS de relation directe `responsables`.

Utiliser la table de jointure `ResponsableEleve` :
```typescript
const responsableRepo = AppDataSource.getRepository('ResponsableEleve');
const responsabilités = await responsableRepo.find({
    where: { enfantId: eleve.utilisateurId }  // ← FK vers utilisateur du parent
});
```

### Cron Jobs Configurés

| Job | Schedule | Action |
|-----|----------|--------|
| **Rappels cantine** | `0 8 * * *` (8h/jour) | Envoyer rappels paiement solde < seuil |
| **Nettoyage notifications** | `0 2 * * *` (2h/jour) | Supprimer notifications >30 jours |
| **Notifications programmées** | `*/5 * * * *` (toutes les 5min) | Traiter notifications planifiées |
| **Menu du jour** | `0 7 * * 1-5` (7h/semaine) | Envoyer menu cantine du jour |

**Activation** : `ENABLE_CRON_JOBS=true` dans `.env` (désactivé en dev par défaut)

### Activation des Providers

Voir `NOTIFICATION-PROVIDERS-ACTIVATION.md` pour la configuration complète :

```bash
# Email
NOTIFICATION_EMAIL_PROVIDER=smtp
NOTIFICATION_EMAIL_HOST=smtp.sendgrid.net
NOTIFICATION_EMAIL_PORT=587
NOTIFICATION_EMAIL_USER=apikey
NOTIFICATION_EMAIL_PASS=SG.xxx

# SMS
NOTIFICATION_SMS_PROVIDER=twilio
NOTIFICATION_SMS_ACCOUNT_SID=ACxxx
NOTIFICATION_SMS_AUTH_TOKEN=xxx
NOTIFICATION_SMS_FROM=+1234567890
```

---

## Domaine 14 : Coefficient, Barème, Volume horaire, Affectations (v4.0)

### Conventions fondamentales (grill-me 2026-07)

| Concept | Convention | Source de vérité |
|---------|-----------|-----------------|
| **Coefficient** | Chaîne de résolution (AffectationMatiere → ProgrammeMatiere → MatiereNiveau → défaut 1) | `coefficientResolverService` |
| **Barème** | Même chaîne que coefficient (défaut 20) | `coefficientResolverService` |
| **Volume horaire** | **Minutes/semaine** partout (jamais heures) | `MatiereNiveau.volumeHoraire` |
| **Crédits** | **SUPPRIMÉS** (système anglophone/LMD abandonné) | N/A |
| **Programme pédagogique** | **Intemporel** (pas de dateDebut/dateFin/periodeId) | `ProgrammePedagogique` |

### coefficientResolverService (singleton)

**Fichier** : `backend/src/modules/matieres/services/coefficient-resolver.service.ts`

```typescript
// Import
import { coefficientResolverService } from '@modules/matieres/services';

// Usage
const coeff = coefficientResolverService.resoudreCoefficient(affectationMatiere);
const bareme = coefficientResolverService.resoudreBareme(affectationMatiere);
```

**Chaîne de résolution** :
1. `AffectationMatiere.coefficient` / `AffectationMatiere.bareme` (override contextuel)
2. `ProgrammeMatiere.coefficient` / `ProgrammeMatiere.bareme` (programme)
3. `MatiereNiveau.coefficient` / `MatiereNiveau.bareme` (niveau)
4. Défaut : `{ coefficient: 1, bareme: 20 }`

**Règle** : JAMAIS accéder directement à `affectationMatiere.coefficient` sans passer par le resolver.

### Volume horaire — Minutes partout

- `MatiereNiveau.volumeHoraire` = **minutes par semaine** (source unique)
- `ProgrammeMatiere` : PAS de `volumeHoraire` (supprimé)
- `ConfigurationMatiereClasse` : **SUPPRIMÉE** (champs absorbés par AffectationMatiere)
- Helper `duree-utils.ts` : `minutesVersHeures()`, `heuresVersMinutes()`, `formaterDuree()`
- Frontend : toujours diviser par 60 pour l'affichage en heures

### AffectationEleve — Modèle v4.0

- **Transfert d'élève** : `transfererEleve(eleveId, nouvelleClasseAnneeId)` — désactive l'ancienne affectation + crée la nouvelle
- **Unicité** : 1 élève actif = 1 seule `AffectationEleve.actif = true` par `anneeScolaireId`
- **Multi-tenant** : `etablissementId` toujours filtré
- **Migration 129** : `transfertEleve` + index unique partiel

### Programme pédagogique — Intemporel (D4)

- `ProgrammePedagogique` : plus de `dateDebut`, `dateFin`, `periodeId`, `anneeScolaireId`
- Historisation via `ProgrammeVersion` (table `programmes_versions`)
- `ProgrammeMatiere` : bridge sans volume horaire (D1)
- `ClasseAnnee.programmeId` → `ProgrammePedagogique`

### Anti-patterns

- ❌ `affectationMatiere.coefficient` directement → ✅ `coefficientResolverService.resoudreCoefficient()`
- ❌ `volumeHoraire` en heures → ✅ toujours en minutes
- ❌ `ProgrammePedagogique.dateDebut` → ✅ n'existe plus (intemporel)
- ❌ `ConfigurationMatiereClasse` → ✅ champs sur `AffectationMatiere`
- ❌ Frontend barème hardcodé `20` dans bulletins → ✅ CORRECT (backend normalise sur 20 via SQL)

---

## Maintenance et évolution

Ce skill doit être **mis à jour** lorsque :

- Un **nouveau module métier** est ajouté (ex: paiements, examens, emploi du temps)
- Une **règle métier existante** est modifiée significativement
- Un **nouveau pattern transversal** émerge (ex: event sourcing, saga pattern)
- Les **relations entre modules** changent structurellement

### Comment mettre à jour

1. Demander : *« Mets à jour le skill business logic pour inclure [module/changement] »*
2. L'IA lira les fichiers concernés et mettra à jour les sections appropriées
3. Les modifications sont toujours communiquées à l'utilisateur

> **Ce skill est vivant** — il reflète l'état actuel de la logique métier et évolue avec le projet.
