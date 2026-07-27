# Ressources Humaines

<cite>
**Fichiers référencés dans ce document**
- [016-module-personnel-rh-phase1.sql](file://backend/database/migrations/016-module-personnel-rh-phase1.sql)
- [017-module-personnel-rh-phase2.sql](file://backend/database/migrations/017-module-personnel-rh-phase2.sql)
- [018-module-personnel-rh-phase3.sql](file://backend/database/migrations/018-module-personnel-rh-phase3.sql)
- [019-module-personnel-rh-phase4.sql](file://backend/database/migrations/019-module-personnel-rh-phase4.sql)
- [020-module-personnel-rh-phase5.sql](file://backend/database/migrations/020-module-personnel-rh-phase5.sql)
- [021-module-personnel-rh-permissions-attribution.sql](file://backend/database/migrations/021-module-personnel-rh-permissions-attribution.sql)
- [022-module-personnel-rh-complete.sql](file://backend/database/migrations/022-module-personnel-rh-complete.sql)
- [026-personnel-champs-additionnels.sql](file://backend/database/migrations/026-personnel-champs-additionnels.sql)
- [029-paie-etendue.sql](file://backend/database/migrations/029-paie-etendue.sql)
- [031-suivi-personnel.sql](file://backend/database/migrations/031-suivi-personnel.sql)
- [039-scoring-personnel.ts](file://backend/database/migrations/039-scoring-personnel.ts)
- [045-module-recrutement.sql](file://backend/database/migrations/045-module-recrutement.sql)
- [121-fonction-categorie-drop-type-personnel.sql](file://backend/database/migrations/121-fonction-categorie-drop-type-personnel.sql)
- [122-hierarchie-superieur-poste.sql](file://backend/database/migrations/122-hierarchie-superieur-poste.sql)
- [125-organigramme-read-tous-roles.sql](file://backend/database/migrations/125-organigramme-read-tous-roles.sql)
- [personnel.constants.ts](file://backend/src/shared/constants/personnel.constants.ts)
- [index.ts (modules)](file://backend/src/modules/index.ts)
- [route-registry.ts](file://backend/src/routes/route-registry.ts)
- [app.ts](file://backend/src/app.ts)
- [package.json](file://backend/package.json)
</cite>

## Table des matières
1. [Introduction](#introduction)
2. [Structure du projet](#structure-du-projet)
3. [Composants clés](#composants-clés)
4. [Vue d’ensemble de l’architecture](#vue-densemble-de-larchitecture)
5. [Analyse détaillée des composants](#analyse-detaillee-des-composants)
6. [Analyse des dépendances](#analyse-des-dependances)
7. [Considérations de performance](#considerations-de-performance)
8. [Guide de dépannage](#guide-de-depannage)
9. [Conclusion](#conclusion)
10. [Annexes](#annexes)

## Introduction
Ce document présente la documentation complète du module de ressources humaines d’eLISAschool, couvrant la gestion du personnel, le système de paie intégré, l’évaluation des performances avec scoring, la gestion des contrats et l’organigramme hiérarchique. Il explique les entités de personnel, les workflows de recrutement, les calculs de salaire, et les évaluations de performance. Il inclut des exemples d’endpoints API, des schémas de base de données RH, et des cas d’utilisation concrets. Les intégrations avec le module financier pour la paie, les workflows de validation, et les rapports RH sont également documentés, ainsi que les fonctionnalités avancées comme la gestion des congés, la formation et la planification des effectifs.

## Structure du projet
Le module RH est implémenté via des migrations SQL progressives et des scripts TypeScript, intégrés au sein de l’application NestJS. Les fichiers de migration définissent le schéma de la base de données pour le personnel, la paie, le recrutement, le suivi et le scoring. Les routes et modules sont enregistrés via un registre centralisé.

```mermaid
graph TB
subgraph "Backend"
APP["Application NestJS<br/>app.ts"]
ROUTES["Registre des routes<br/>route-registry.ts"]
MODULES["Modules<br/>modules/index.ts"]
DB["Base de données<br/>Migrations SQL"]
end
subgraph "Migrations RH"
M16["Personnel Phase 1"]
M17["Personnel Phase 2"]
M18["Personnel Phase 3"]
M19["Personnel Phase 4"]
M20["Personnel Phase 5"]
M21["Permissions attribution"]
M22["RH complet"]
M26["Champs additionnels personnel"]
M29["Paie étendue"]
M31["Suivi personnel"]
M39["Scoring personnel"]
M45["Recrutement"]
M121["Fonction catégorie drop type personnel"]
M122["Hiérarchie supérieur poste"]
M125["Organigramme lecture tous rôles"]
end
APP --> ROUTES
ROUTES --> MODULES
MODULES --> DB
DB --> M16
DB --> M17
DB --> M18
DB --> M19
DB --> M20
DB --> M21
DB --> M22
DB --> M26
DB --> M29
DB --> M31
DB --> M39
DB --> M45
DB --> M121
DB --> M122
DB --> M125
```

**Sources de diagramme**
- [app.ts](file://backend/src/app.ts)
- [route-registry.ts](file://backend/src/routes/route-registry.ts)
- [index.ts (modules)](file://backend/src/modules/index.ts)
- [016-module-personnel-rh-phase1.sql](file://backend/database/migrations/016-module-personnel-rh-phase1.sql)
- [017-module-personnel-rh-phase2.sql](file://backend/database/migrations/017-module-personnel-rh-phase2.sql)
- [018-module-personnel-rh-phase3.sql](file://backend/database/migrations/018-module-personnel-rh-phase3.sql)
- [019-module-personnel-rh-phase4.sql](file://backend/database/migrations/019-module-personnel-rh-phase4.sql)
- [020-module-personnel-rh-phase5.sql](file://backend/database/migrations/020-module-personnel-rh-phase5.sql)
- [021-module-personnel-rh-permissions-attribution.sql](file://backend/database/migrations/021-module-personnel-rh-permissions-attribution.sql)
- [022-module-personnel-rh-complete.sql](file://backend/database/migrations/022-module-personnel-rh-complete.sql)
- [026-personnel-champs-additionnels.sql](file://backend/database/migrations/026-personnel-champs-additionnels.sql)
- [029-paie-etendue.sql](file://backend/database/migrations/029-paie-etendue.sql)
- [031-suivi-personnel.sql](file://backend/database/migrations/031-suivi-personnel.sql)
- [039-scoring-personnel.ts](file://backend/database/migrations/039-scoring-personnel.ts)
- [045-module-recrutement.sql](file://backend/database/migrations/045-module-recrutement.sql)
- [121-fonction-categorie-drop-type-personnel.sql](file://backend/database/migrations/121-fonction-categorie-drop-type-personnel.sql)
- [122-hierarchie-superieur-poste.sql](file://backend/database/migrations/122-hierarchie-superieur-poste.sql)
- [125-organigramme-read-tous-roles.sql](file://backend/database/migrations/125-organigramme-read-tous-roles.sql)

**Sources de section**
- [package.json](file://backend/package.json)
- [app.ts](file://backend/src/app.ts)
- [route-registry.ts](file://backend/src/routes/route-registry.ts)
- [index.ts (modules)](file://backend/src/modules/index.ts)

## Composants clés
- Gestion du personnel : entités, attributs, champs additionnels, hiérarchie des postes.
- Paie intégrée : éléments de paie, calculs, liens financiers.
- Évaluation des performances : scoring, indicateurs, agrégation.
- Gestion des contrats : types, affectations, cycles.
- Organigramme hiérarchique : relations supérieur/poste, lecture multi-rôles.
- Recrutement : pipeline, candidatures, sélection.
- Suivi personnel : historique, événements, audit.
- Intégrations financières : flux de paie vers finances.
- Workflows de validation : approbations, transitions d’état.
- Rapports RH : statistiques, tableaux de bord.

**Sources de section**
- [016-module-personnel-rh-phase1.sql](file://backend/database/migrations/016-module-personnel-rh-phase1.sql)
- [017-module-personnel-rh-phase2.sql](file://backend/database/migrations/017-module-personnel-rh-phase2.sql)
- [018-module-personnel-rh-phase3.sql](file://backend/database/migrations/018-module-personnel-rh-phase3.sql)
- [019-module-personnel-rh-phase4.sql](file://backend/database/migrations/019-module-personnel-rh-phase4.sql)
- [020-module-personnel-rh-phase5.sql](file://backend/database/migrations/020-module-personnel-rh-phase5.sql)
- [022-module-personnel-rh-complete.sql](file://backend/database/migrations/022-module-personnel-rh-complete.sql)
- [026-personnel-champs-additionnels.sql](file://backend/database/migrations/026-personnel-champs-additionnels.sql)
- [029-paie-etendue.sql](file://backend/database/migrations/029-paie-etendue.sql)
- [031-suivi-personnel.sql](file://backend/database/migrations/031-suivi-personnel.sql)
- [039-scoring-personnel.ts](file://backend/database/migrations/039-scoring-personnel.ts)
- [045-module-recrutement.sql](file://backend/database/migrations/045-module-recrutement.sql)
- [122-hierarchie-superieur-poste.sql](file://backend/database/migrations/122-hierarchie-superieur-poste.sql)
- [125-organigramme-read-tous-roles.sql](file://backend/database/migrations/125-organigramme-read-tous-roles.sql)

## Vue d’ensemble de l’architecture
Le module RH s’appuie sur une architecture modulaire NestJS avec un registre de routes centralisé. Les migrations SQL construisent progressivement le schéma de la base de données. Les endpoints exposent des APIs REST pour la gestion du personnel, la paie, le recrutement et le scoring. L’intégration financière permet de générer les écritures comptables liées à la paie.

```mermaid
graph TB
Client["Client Frontend / API Consumers"]
API["API REST<br/>Routes RH"]
Service["Services RH<br/>Personnel, Paie, Recrutement, Scoring"]
Finance["Module Financier<br/>Écritures paie"]
DB["Base de données<br/>Schéma RH"]
Client --> API
API --> Service
Service --> DB
Service --> Finance
```

**Sources de diagramme**
- [route-registry.ts](file://backend/src/routes/route-registry.ts)
- [index.ts (modules)](file://backend/src/modules/index.ts)
- [029-paie-etendue.sql](file://backend/database/migrations/029-paie-etendue.sql)

## Analyse détaillée des composants

### Entités de personnel et organigramme hiérarchique
Les entités de personnel incluent les identifiants, les informations personnelles, les postes, les catégories, et les relations hiérarchiques. La hiérarchie est gérée via des références entre postes et supérieurs, permettant de construire un organigramme dynamique.

```mermaid
erDiagram
PERSONNEL {
uuid id PK
string matricule UK
string nom
string prenom
date naissance
string email
string telephone
uuid etablissement_id FK
timestamp created_at
timestamp updated_at
}
POSTE {
uuid id PK
string libelle
uuid departement_id FK
uuid superieur_id FK
timestamp created_at
timestamp updated_at
}
CATEGORIE_PERSONNEL {
uuid id PK
string code
string libelle
boolean actif
}
PERSONNEL ||--o{ POSTE : "occupe"
POSTE ||--o{ POSTE : "supérieur de"
PERSONNEL ||--o{ CATEGORIE_PERSONNEL : "catégorie"
```

**Sources de diagramme**
- [016-module-personnel-rh-phase1.sql](file://backend/database/migrations/016-module-personnel-rh-phase1.sql)
- [017-module-personnel-rh-phase2.sql](file://backend/database/migrations/017-module-personnel-rh-phase2.sql)
- [018-module-personnel-rh-phase3.sql](file://backend/database/migrations/018-module-personnel-rh-phase3.sql)
- [019-module-personnel-rh-phase4.sql](file://backend/database/migrations/019-module-personnel-rh-phase4.sql)
- [020-module-personnel-rh-phase5.sql](file://backend/database/migrations/020-module-personnel-rh-phase5.sql)
- [026-personnel-champs-additionnels.sql](file://backend/database/migrations/026-personnel-champs-additionnels.sql)
- [122-hierarchie-superieur-poste.sql](file://backend/database/migrations/122-hierarchie-superieur-poste.sql)
- [125-organigramme-read-tous-roles.sql](file://backend/database/migrations/125-organigramme-read-tous-roles.sql)

**Sources de section**
- [016-module-personnel-rh-phase1.sql](file://backend/database/migrations/016-module-personnel-rh-phase1.sql)
- [026-personnel-champs-additionnels.sql](file://backend/database/migrations/026-personnel-champs-additionnels.sql)
- [122-hierarchie-superieur-poste.sql](file://backend/database/migrations/122-hierarchie-superieur-poste.sql)
- [125-organigramme-read-tous-roles.sql](file://backend/database/migrations/125-organigramme-read-tous-roles.sql)

### Système de paie intégré
La paie intègre les éléments de rémunération, les retenues, les primes, et les calculs nets. Elle s’articule avec le module financier pour générer les écritures comptables et les flux de trésorerie.

```mermaid
sequenceDiagram
participant RH as "Service Paie"
participant FIN as "Module Financier"
participant DB as "Base de données"
RH->>DB : "Récupérer éléments de paie par période"
DB-->>RH : "Liste des éléments"
RH->>RH : "Calculer brut, retenues, net"
RH->>FIN : "Créer écriture comptable paie"
FIN-->>RH : "ID écriture"
RH->>DB : "Enregistrer bulletin de paie"
DB-->>RH : "Confirmation"
RH-->>RH : "Générer rapport paie"
```

**Sources de diagramme**
- [029-paie-etendue.sql](file://backend/database/migrations/029-paie-etendue.sql)

**Sources de section**
- [029-paie-etendue.sql](file://backend/database/migrations/029-paie-etendue.sql)

### Évaluation des performances avec scoring
Le scoring permet d’évaluer les performances du personnel via des indicateurs, des critères pondérés et des agrégations périodiques.

```mermaid
flowchart TD
Start(["Début évaluation"]) --> Collect["Collecte indicateurs"]
Collect --> Validate{"Données valides?"}
Validate --> |Non| Error["Erreur de validation"]
Validate --> |Oui| ScoreCalc["Calcul score pondéré"]
ScoreCalc --> Aggregate["Agrégation par période"]
Aggregate --> Store["Stockage résultat"]
Store --> Report["Génération rapport"]
Report --> End(["Fin"])
Error --> End
```

**Sources de diagramme**
- [039-scoring-personnel.ts](file://backend/database/migrations/039-scoring-personnel.ts)

**Sources de section**
- [039-scoring-personnel.ts](file://backend/database/migrations/039-scoring-personnel.ts)

### Gestion des contrats
Les contrats sont liés aux postes et aux catégories de personnel, avec des cycles de renouvellement et des statuts de validation.

```mermaid
classDiagram
class Contrat {
+uuid id
+uuid personnel_id
+uuid poste_id
+date debut
+date fin
+string statut
+decimal salaire_base
+decimal prime_mensuelle
+decimal retenue_mensuelle
+decimal net_a_payer
+timestamp created_at
+timestamp updated_at
}
class Personnel {
+uuid id
+string matricule
+string nom
+string prenom
}
class Poste {
+uuid id
+string libelle
+uuid departement_id
+uuid superieur_id
}
Contrat --> Personnel : "lié à"
Contrat --> Poste : "lié à"
```

**Sources de diagramme**
- [022-module-personnel-rh-complete.sql](file://backend/database/migrations/022-module-personnel-rh-complete.sql)

**Sources de section**
- [022-module-personnel-rh-complete.sql](file://backend/database/migrations/022-module-personnel-rh-complete.sql)

### Workflow de recrutement
Le recrutement couvre les candidatures, les sélections et les embauches, avec des étapes de validation et de transition d’état.

```mermaid
sequenceDiagram
participant Candidat as "Candidat"
participant Recruteur as "Service Recrutement"
participant DB as "Base de données"
Candidat->>Recruteur : "Soumettre candidature"
Recruteur->>DB : "Enregistrer candidature"
DB-->>Recruteur : "ID candidature"
Recruteur->>Recruteur : "Évaluer candidature"
Recruteur->>DB : "Mettre à jour statut"
Recruteur->>Recruteur : "Proposer embauche"
Recruteur->>DB : "Créer contrat"
DB-->>Recruteur : "Confirmation"
Recruteur-->>Candidat : "Notification décision"
```

**Sources de diagramme**
- [045-module-recrutement.sql](file://backend/database/migrations/045-module-recrutement.sql)

**Sources de section**
- [045-module-recrutement.sql](file://backend/database/migrations/045-module-recrutement.sql)

### Suivi personnel et rapports RH
Le suivi enregistre les événements, les changements d’état et les historiques pour générer des rapports RH.

```mermaid
flowchart TD
Event["Événement RH"] --> Log["Journalisation"]
Log --> Analyze["Analyse et agrégation"]
Analyze --> Report["Rapport RH"]
Report --> Dashboard["Tableau de bord"]
```

**Sources de diagramme**
- [031-suivi-personnel.sql](file://backend/database/migrations/031-suivi-personnel.sql)

**Sources de section**
- [031-suivi-personnel.sql](file://backend/database/migrations/031-suivi-personnel.sql)

### Intégrations financières pour la paie
La paie interagit avec le module financier pour créer des écritures comptables et synchroniser les flux de trésorerie.

```mermaid
sequenceDiagram
participant Paie as "Service Paie"
participant Finances as "Module Financier"
participant DB as "Base de données"
Paie->>DB : "Lire éléments de paie"
DB-->>Paie : "Données paie"
Paie->>Finances : "Créer écriture comptable"
Finances-->>Paie : "Référence écriture"
Paie->>DB : "Mettre à jour statut paie"
DB-->>Paie : "Confirmation"
```

**Sources de diagramme**
- [029-paie-etendue.sql](file://backend/database/migrations/029-paie-etendue.sql)

**Sources de section**
- [029-paie-etendue.sql](file://backend/database/migrations/029-paie-etendue.sql)

### Workflows de validation
Les workflows permettent de valider les actions RH (embauche, promotion, changement de poste) avec des approbations hiérarchiques.

```mermaid
flowchart TD
Action["Action RH"] --> Validate["Validation requise?"]
Validate --> |Non| Execute["Exécution directe"]
Validate --> |Oui| Approve["Demande d'approbation"]
Approve --> Decision{"Approuvé?"}
Decision --> |Non| Reject["Rejet"]
Decision --> |Oui| Execute
Execute --> End(["Terminé"])
Reject --> End
```

**Sources de diagramme**
- [021-module-personnel-rh-permissions-attribution.sql](file://backend/database/migrations/021-module-personnel-rh-permissions-attribution.sql)

**Sources de section**
- [021-module-personnel-rh-permissions-attribution.sql](file://backend/database/migrations/021-module-personnel-rh-permissions-attribution.sql)

### Fonctionnalités avancées : congés, formation, planification des effectifs
- Congés : gestion des demandes, validations, solde et historique.
- Formation : planifications, inscriptions, évaluations.
- Planification des effectifs : besoins, affectations, optimisation.

**Sources de section**
- [031-suivi-personnel.sql](file://backend/database/migrations/031-suivi-personnel.sql)
- [022-module-personnel-rh-complete.sql](file://backend/database/migrations/022-module-personnel-rh-complete.sql)

## Analyse des dépendances
Les modules RH dépendent des migrations SQL pour le schéma, des constantes partagées pour les enums et configurations, et du registre de routes pour l’exposition des endpoints.

```mermaid
graph TB
Personnel["Module Personnel"]
Paie["Module Paie"]
Recrutement["Module Recrutement"]
Scoring["Module Scoring"]
Constants["Constants Personnel<br/>personnel.constants.ts"]
Routes["Registre des routes<br/>route-registry.ts"]
Migrations["Migrations SQL"]
Personnel --> Constants
Paie --> Migrations
Recrutement --> Migrations
Scoring --> Migrations
Routes --> Personnel
Routes --> Paie
Routes --> Recrutement
Routes --> Scoring
```

**Sources de diagramme**
- [personnel.constants.ts](file://backend/src/shared/constants/personnel.constants.ts)
- [route-registry.ts](file://backend/src/routes/route-registry.ts)
- [016-module-personnel-rh-phase1.sql](file://backend/database/migrations/016-module-personnel-rh-phase1.sql)
- [029-paie-etendue.sql](file://backend/database/migrations/029-paie-etendue.sql)
- [045-module-recrutement.sql](file://backend/database/migrations/045-module-recrutement.sql)
- [039-scoring-personnel.ts](file://backend/database/migrations/039-scoring-personnel.ts)

**Sources de section**
- [personnel.constants.ts](file://backend/src/shared/constants/personnel.constants.ts)
- [route-registry.ts](file://backend/src/routes/route-registry.ts)

## Considérations de performance
- Indexation des tables RH pour les requêtes fréquentes (matricule, poste, département).
- Agrégations matérielisées pour les rapports RH.
- Optimisation des calculs de paie par batch.
- Cache des données hiérarchiques pour l’organigramme.

[Pas de sources nécessaires car cette section fournit des conseils généraux]

## Guide de dépannage
- Vérifier les permissions d’accès aux endpoints RH.
- Valider les données de paie avant génération des écritures financières.
- Consulter les logs de suivi personnel pour diagnostiquer les anomalies.
- Utiliser les scripts de migration pour corriger les incohérences de schéma.

**Sources de section**
- [021-module-personnel-rh-permissions-attribution.sql](file://backend/database/migrations/021-module-personnel-rh-permissions-attribution.sql)
- [031-suivi-personnel.sql](file://backend/database/migrations/031-suivi-personnel.sql)

## Conclusion
Le module RH d’eLISAschool offre une solution complète pour la gestion du personnel, la paie, le recrutement, le scoring et l’organigramme. L’intégration financière assure la cohérence comptable, tandis que les workflows de validation garantissent la conformité des processus. Les fonctionnalités avancées couvrent les besoins opérationnels modernes des établissements scolaires.

[Pas de sources nécessaires car cette section résume sans analyser de fichiers spécifiques]

## Annexes

### Exemples d’endpoints API RH
- GET /api/personnel : Liste du personnel
- POST /api/personnel : Créer un membre du personnel
- PUT /api/personnel/:id : Mettre à jour un membre
- GET /api/paie/bulletins : Bulletins de paie par période
- POST /api/recrutement/candidatures : Soumettre une candidature
- GET /api/scoring/personnel/:id : Scores de performance

**Sources de section**
- [route-registry.ts](file://backend/src/routes/route-registry.ts)
- [index.ts (modules)](file://backend/src/modules/index.ts)

### Schémas de base de données RH
Voir les sections précédentes pour les diagrammes ERD et les relations entre entités.

**Sources de section**
- [016-module-personnel-rh-phase1.sql](file://backend/database/migrations/016-module-personnel-rh-phase1.sql)
- [029-paie-etendue.sql](file://backend/database/migrations/029-paie-etendue.sql)
- [045-module-recrutement.sql](file://backend/database/migrations/045-module-recrutement.sql)
- [039-scoring-personnel.ts](file://backend/database/migrations/039-scoring-personnel.ts)

### Cas d’utilisation concrets
- Embauche d’un enseignant : recrutement → contrat → affectation poste → paie intégrée.
- Évaluation annuelle : collecte indicateurs → calcul scoring → rapport performance.
- Gestion des congés : demande → validation → mise à jour solde → historique.

**Sources de section**
- [045-module-recrutement.sql](file://backend/database/migrations/045-module-recrutement.sql)
- [022-module-personnel-rh-complete.sql](file://backend/database/migrations/022-module-personnel-rh-complete.sql)
- [031-suivi-personnel.sql](file://backend/database/migrations/031-suivi-personnel.sql)