# Matériel et Inventaire

<cite>
**Fichiers référencés dans ce document**
- [backend/src/modules/materiel/index.ts](file://backend/src/modules/materiel/index.ts)
- [backend/src/modules/materiel/controllers/materiel.controller.ts](file://backend/src/modules/materiel/controllers/materiel.controller.ts)
- [backend/src/modules/materiel/services/materiel.service.ts](file://backend/src/modules/materiel/services/materiel.service.ts)
- [backend/src/modules/materiel/entities/materiel.entity.ts](file://backend/src/modules/materiel/entities/materiel.entity.ts)
- [backend/src/modules/materiel/dto/materiel.dto.ts](file://backend/src/modules/materiel/dto/materiel.dto.ts)
- [backend/database/migrations/010-module-finances.sql](file://backend/database/migrations/010-module-finances.sql)
- [backend/database/migrations/013-module-finances-phase1-granularite.sql](file://backend/database/migrations/013-module-finances-phase1-granularite.sql)
- [backend/database/migrations/014-module-finances-phase2-section.sql](file://backend/database/migrations/014-module-finances-phase2-section.sql)
- [backend/database/migrations/013-sync-modules-actifs.sql](file://backend/database/migrations/013-sync-modules-actifs.sql)
- [backend/src/routes/route-registry.ts](file://backend/src/routes/route-registry.ts)
- [backend/src/app.ts](file://backend/src/app.ts)
</cite>

## Table des matières
1. [Introduction](#introduction)
2. [Structure du projet](#structure-du-projet)
3. [Composants clés](#composants-clés)
4. [Vue d'ensemble de l'architecture](#vue-densemble-de-larchitecture)
5. [Analyse détaillée des composants](#analyse-detailee-des-composants)
6. [Analyse des dépendances](#analyse-des-dependances)
7. [Considérations de performance](#considerations-de-performance)
8. [Guide de dépannage](#guide-de-depannage)
9. [Conclusion](#conclusion)
10. [Annexes](#annexes)

## Introduction
Ce document présente la documentation complète du module Matériel et Inventaire d'eLISAschool. Il couvre la gestion des catégories de matériel, les fiches inventaire, les mouvements de stock, la localisation des équipements, ainsi que les workflows de demande, prêt, retour, maintenance et mise au rebut. Il détaille également les alertes de stock minimum, les inventaires périodiques, les rapports d'utilisation, l’amortissement du matériel, la valorisation patrimoniale et l’intégration avec la comptabilité. L’objectif est de fournir une vision claire pour les utilisateurs non techniques comme pour les développeurs.

## Structure du projet
Le module Matériel et Inventaire s’appuie sur une architecture modulaire standardisée :
- Un point d’entrée de module qui expose les routes et services.
- Des contrôleurs REST pour exposer les endpoints.
- Des services encapsulant la logique métier (demande, prêt, retour, maintenance, amortissement).
- Des entités TypeORM définissant le schéma de données.
- Des DTOs pour la validation et le transfert de données.
- Des migrations SQL pour la structure de base de données et l’intégration financière.
- Une inscription des routes dans le registre global et l’initialisation de l’application.

```mermaid
graph TB
subgraph "Module Materiel"
MIndex["index.ts"]
MCtl["materiel.controller.ts"]
MSvc["materiel.service.ts"]
MEnt["materiel.entity.ts"]
MDto["materiel.dto.ts"]
end
subgraph "Application Backend"
App["app.ts"]
Routes["route-registry.ts"]
end
subgraph "Base de données"
Fin1["010-module-finances.sql"]
Fin2["013-module-finances-phase1-granularite.sql"]
Fin3["014-module-finances-phase2-section.sql"]
Sync["013-sync-modules-actifs.sql"]
end
MIndex --> MCtl
MCtl --> MSvc
MSvc --> MEnt
MCtl --> MDto
App --> Routes
Routes --> MIndex
MSvc --> Fin1
MSvc --> Fin2
MSvc --> Fin3
MSvc --> Sync
```

**Sources du diagramme**
- [backend/src/modules/materiel/index.ts](file://backend/src/modules/materiel/index.ts)
- [backend/src/modules/materiel/controllers/materiel.controller.ts](file://backend/src/modules/materiel/controllers/materiel.controller.ts)
- [backend/src/modules/materiel/services/materiel.service.ts](file://backend/src/modules/materiel/services/materiel.service.ts)
- [backend/src/modules/materiel/entities/materiel.entity.ts](file://backend/src/modules/materiel/entities/materiel.entity.ts)
- [backend/src/modules/materiel/dto/materiel.dto.ts](file://backend/src/modules/materiel/dto/materiel.dto.ts)
- [backend/src/routes/route-registry.ts](file://backend/src/routes/route-registry.ts)
- [backend/src/app.ts](file://backend/src/app.ts)
- [backend/database/migrations/010-module-finances.sql](file://backend/database/migrations/010-module-finances.sql)
- [backend/database/migrations/013-module-finances-phase1-granularite.sql](file://backend/database/migrations/013-module-finances-phase1-granularite.sql)
- [backend/database/migrations/014-module-finances-phase2-section.sql](file://backend/database/migrations/014-module-finances-phase2-section.sql)
- [backend/database/migrations/013-sync-modules-actifs.sql](file://backend/database/migrations/013-sync-modules-actifs.sql)

**Sources de section**
- [backend/src/modules/materiel/index.ts](file://backend/src/modules/materiel/index.ts)
- [backend/src/routes/route-registry.ts](file://backend/src/routes/route-registry.ts)
- [backend/src/app.ts](file://backend/src/app.ts)

## Composants clés
- Contrôleurs: exposent les opérations CRUD et les flux métier (demande, prêt, retour, maintenance, mise au rebut).
- Services: implémentent la logique métier, la gestion des mouvements de stock, les alertes de seuils, l’amortissement et les rapports.
- Entités: définissent les modèles de données (catégories, fiches inventaire, mouvements, localisations, états).
- DTOs: valident les payloads entrants et formatent les réponses.
- Migrations: assurent la cohérence du schéma et l’intégration avec le module finances (amortissement, sections, granularité).

**Sources de section**
- [backend/src/modules/materiel/controllers/materiel.controller.ts](file://backend/src/modules/materiel/controllers/materiel.controller.ts)
- [backend/src/modules/materiel/services/materiel.service.ts](file://backend/src/modules/materiel/services/materiel.service.ts)
- [backend/src/modules/materiel/entities/materiel.entity.ts](file://backend/src/modules/materiel/entities/materiel.entity.ts)
- [backend/src/modules/materiel/dto/materiel.dto.ts](file://backend/src/modules/materiel/dto/materiel.dto.ts)

## Vue d'ensemble de l'architecture
Le module suit un pattern MVC classique couplé à des services métier et des entités persistantes. Les routes sont enregistrées via le registre global et initialisées dans l’application principale. La persistance repose sur des migrations SQL qui garantissent la structure et l’intégration financière.

```mermaid
sequenceDiagram
participant Client as "Client"
participant App as "Application"
participant Routes as "Registre des routes"
participant Controller as "Contrôleur Matériel"
participant Service as "Service Matériel"
participant DB as "Base de données"
Client->>App : "Requête HTTP"
App->>Routes : "Aiguillage vers route materiel"
Routes->>Controller : "Dispatch requête"
Controller->>Service : "Appel méthode métier"
Service->>DB : "Opération CRUD / Mouvement"
DB-->>Service : "Résultat"
Service-->>Controller : "Réponse métier"
Controller-->>Client : "Réponse HTTP"
```

**Sources du diagramme**
- [backend/src/app.ts](file://backend/src/app.ts)
- [backend/src/routes/route-registry.ts](file://backend/src/routes/route-registry.ts)
- [backend/src/modules/materiel/controllers/materiel.controller.ts](file://backend/src/modules/materiel/controllers/materiel.controller.ts)
- [backend/src/modules/materiel/services/materiel.service.ts](file://backend/src/modules/materiel/services/materiel.service.ts)

## Analyse détaillée des composants

### Gestion des catégories de matériel
Les catégories permettent de classifier le matériel (pédagogique, sportif, technique, administratif, etc.). Elles facilitent le filtrage, les rapports et la valorisation patrimoniale par famille.

```mermaid
classDiagram
class CategorieMateriel {
+string id
+string nom
+string code
+boolean actif
+date createdAt
+date updatedAt
+getEquipements() Equipement[]
}
class Equipement {
+string id
+string reference
+string designation
+CategorieMateriel categorie
+string localisation
+number quantite
+number seuilMinimum
+string statut
+date dateAcquisition
+number valeurAcquisition
+number valeurResiduelle
+number tauxAmortissement
+date dateDernierInventaire
+getMouvements() Mouvement[]
+getHistoriqueMaintenance() Maintenance[]
}
class Mouvement {
+string id
+Equipement equipement
+string type
+number quantite
+string motif
+string utilisateurId
+date dateMouvement
}
CategorieMateriel <|-- Equipement : "appartient à"
Equipement --> Mouvement : "génère"
```

**Sources du diagramme**
- [backend/src/modules/materiel/entities/materiel.entity.ts](file://backend/src/modules/materiel/entities/materiel.entity.ts)

**Sources de section**
- [backend/src/modules/materiel/entities/materiel.entity.ts](file://backend/src/modules/materiel/entities/materiel.entity.ts)
- [backend/src/modules/materiel/dto/materiel.dto.ts](file://backend/src/modules/materiel/dto/materiel.dto.ts)

### Fiches inventaire et localisation
Chaque fiche inventaire décrit un équipement avec sa référence, sa désignation, sa catégorie, sa localisation, ses quantités, son statut, sa date d’acquisition et sa valeur. La localisation peut être un lieu physique ou un service.

```mermaid
flowchart TD
Start(["Création fiche inventaire"]) --> DefineRef["Définir référence unique"]
DefineRef --> SetDesignation["Définir désignation"]
SetDesignation --> AssignCategory["Assigner catégorie"]
AssignCategory --> SetLocation["Définir localisation"]
SetLocation --> SetQty["Définir quantité initiale"]
SetQty --> SetThreshold["Définir seuil minimum"]
SetThreshold --> SetStatus["Définir statut (disponible, en prêt, en maintenance, hors service)"]
SetStatus --> RecordAcquisition["Enregistrer date et valeur d'acquisition"]
RecordAcquisition --> End(["Fiche validée"])
```

**Sources du diagramme**
- [backend/src/modules/materiel/entities/materiel.entity.ts](file://backend/src/modules/materiel/entities/materiel.entity.ts)
- [backend/src/modules/materiel/dto/materiel.dto.ts](file://backend/src/modules/materiel/dto/materiel.dto.ts)

**Sources de section**
- [backend/src/modules/materiel/entities/materiel.entity.ts](file://backend/src/modules/materiel/entities/materiel.entity.ts)
- [backend/src/modules/materiel/dto/materiel.dto.ts](file://backend/src/modules/materiel/dto/materiel.dto.ts)

### Mouvements de stock
Les mouvements de stock incluent les entrées, sorties, transferts, prêts et retours. Chaque mouvement est tracé avec un type, une quantité, un motif et l’utilisateur responsable.

```mermaid
sequenceDiagram
participant User as "Utilisateur"
participant Controller as "Contrôleur"
participant Service as "Service"
participant DB as "Base de données"
User->>Controller : "POST /mouvements (type=pret)"
Controller->>Service : "createMouvement(data)"
Service->>Service : "Valider disponibilité"
Service->>DB : "Insérer mouvement et mettre à jour stock"
DB-->>Service : "Confirmation"
Service-->>Controller : "Mouvement créé"
Controller-->>User : "Réponse 201"
```

**Sources du diagramme**
- [backend/src/modules/materiel/controllers/materiel.controller.ts](file://backend/src/modules/materiel/controllers/materiel.controller.ts)
- [backend/src/modules/materiel/services/materiel.service.ts](file://backend/src/modules/materiel/services/materiel.service.ts)
- [backend/src/modules/materiel/entities/materiel.entity.ts](file://backend/src/modules/materiel/entities/materiel.entity.ts)

**Sources de section**
- [backend/src/modules/materiel/controllers/materiel.controller.ts](file://backend/src/modules/materiel/controllers/materiel.controller.ts)
- [backend/src/modules/materiel/services/materiel.service.ts](file://backend/src/modules/materiel/services/materiel.service.ts)
- [backend/src/modules/materiel/entities/materiel.entity.ts](file://backend/src/modules/materiel/entities/materiel.entity.ts)

### Workflow de demande, prêt, retour
La demande est initiée par un utilisateur, validée par un responsable, puis transformée en prêt. Le retour met à jour le statut et la localisation.

```mermaid
stateDiagram-v2
[*] --> EnAttente
EnAttente --> Approuvee : "Validation responsable"
EnAttente --> Rejetee : "Refus"
Approuvee --> EnPret : "Prêt enregistré"
EnPret --> Retourne : "Retour effectué"
EnPret --> EnMaintenance : "Panne détectée"
EnMaintenance --> EnPret : "Maintenance terminée"
EnPret --> HorsService : "Déclassement"
Rejetee --> [*]
Retourne --> [*]
EnMaintenance --> [*]
HorsService --> [*]
```

**Sources du diagramme**
- [backend/src/modules/materiel/services/materiel.service.ts](file://backend/src/modules/materiel/services/materiel.service.ts)
- [backend/src/modules/materiel/entities/materiel.entity.ts](file://backend/src/modules/materiel/entities/materiel.entity.ts)

**Sources de section**
- [backend/src/modules/materiel/services/materiel.service.ts](file://backend/src/modules/materiel/services/materiel.service.ts)
- [backend/src/modules/materiel/entities/materiel.entity.ts](file://backend/src/modules/materiel/entities/materiel.entity.ts)

### Maintenance et mise au rebut
La maintenance permet de planifier et tracer les interventions. La mise au rebut déclasse l’équipement et met fin à son suivi opérationnel.

```mermaid
flowchart TD
Start(["Demande de maintenance"]) --> Planifier["Planifier intervention"]
Planifier --> Executer["Exécuter intervention"]
Executer --> Evaluer{"État réparé ?"}
Evaluer --> |Oui| RemettreEnService["Remettre en service"]
Evaluer --> |Non| Declasser["Mettre au rebut"]
Declasser --> Archiver["Archiver fiche inventaire"]
RemettreEnService --> End(["Fin"])
Archiver --> End
```

**Sources du diagramme**
- [backend/src/modules/materiel/services/materiel.service.ts](file://backend/src/modules/materiel/services/materiel.service.ts)
- [backend/src/modules/materiel/entities/materiel.entity.ts](file://backend/src/modules/materiel/entities/materiel.entity.ts)

**Sources de section**
- [backend/src/modules/materiel/services/materiel.service.ts](file://backend/src/modules/materiel/services/materiel.service.ts)
- [backend/src/modules/materiel/entities/materiel.entity.ts](file://backend/src/modules/materiel/entities/materiel.entity.ts)

### Alertes de stock minimum
Le système surveille les niveaux de stock et émet des alertes lorsque la quantité descend sous le seuil minimum configuré.

```mermaid
flowchart TD
Check["Vérification périodique"] --> Compare["Comparer quantité vs seuil minimum"]
Compare --> Below{"Quantité < Seuil ?"}
Below --> |Oui| Alert["Émettre alerte (email/notification)"]
Below --> |Non| NoAction["Aucune action"]
Alert --> Log["Journaliser alerte"]
NoAction --> End(["Fin"])
Log --> End
```

**Sources du diagramme**
- [backend/src/modules/materiel/services/materiel.service.ts](file://backend/src/modules/materiel/services/materiel.service.ts)
- [backend/src/modules/materiel/entities/materiel.entity.ts](file://backend/src/modules/materiel/entities/materiel.entity.ts)

**Sources de section**
- [backend/src/modules/materiel/services/materiel.service.ts](file://backend/src/modules/materiel/services/materiel.service.ts)
- [backend/src/modules/materiel/entities/materiel.entity.ts](file://backend/src/modules/materiel/entities/materiel.entity.ts)

### Inventaires périodiques et rapports d'utilisation
Des inventaires réguliers permettent de vérifier la conformité physique et de mettre à jour les valeurs résiduelles. Les rapports d’utilisation agrègent les mouvements et l’état des équipements.

```mermaid
sequenceDiagram
participant Admin as "Administrateur"
participant Controller as "Contrôleur"
participant Service as "Service"
participant DB as "Base de données"
Admin->>Controller : "Lancer inventaire"
Controller->>Service : "generateInventoryReport()"
Service->>DB : "Agrégation mouvements et états"
DB-->>Service : "Données consolidées"
Service-->>Controller : "Rapport généré"
Controller-->>Admin : "Téléchargement PDF/CSV"
```

**Sources du diagramme**
- [backend/src/modules/materiel/controllers/materiel.controller.ts](file://backend/src/modules/materiel/controllers/materiel.controller.ts)
- [backend/src/modules/materiel/services/materiel.service.ts](file://backend/src/modules/materiel/services/materiel.service.ts)

**Sources de section**
- [backend/src/modules/materiel/controllers/materiel.controller.ts](file://backend/src/modules/materiel/controllers/materiel.controller.ts)
- [backend/src/modules/materiel/services/materiel.service.ts](file://backend/src/modules/materiel/services/materiel.service.ts)

### Amortissement et valorisation patrimoniale
L’amortissement calcule la perte de valeur du matériel au fil du temps. La valorisation patrimoniale intègre ces données financières pour le bilan.

```mermaid
flowchart TD
Start(["Acquisition"]) --> RecordValue["Enregistrer valeur d'acquisition"]
RecordValue --> SetRate["Définir taux d'amortissement"]
SetRate --> PeriodicCalc["Calcul périodique (mensuel/annuel)"]
PeriodicCalc --> UpdateResidual["Mettre à jour valeur résiduelle"]
UpdateResidual --> Report["Intégrer rapport financier"]
Report --> End(["Valorisation mise à jour"])
```

**Sources du diagramme**
- [backend/src/modules/materiel/entities/materiel.entity.ts](file://backend/src/modules/materiel/entities/materiel.entity.ts)
- [backend/database/migrations/010-module-finances.sql](file://backend/database/migrations/010-module-finances.sql)
- [backend/database/migrations/013-module-finances-phase1-granularite.sql](file://backend/database/migrations/013-module-finances-phase1-granularite.sql)
- [backend/database/migrations/014-module-finances-phase2-section.sql](file://backend/database/migrations/014-module-finances-phase2-section.sql)

**Sources de section**
- [backend/src/modules/materiel/entities/materiel.entity.ts](file://backend/src/modules/materiel/entities/materiel.entity.ts)
- [backend/database/migrations/010-module-finances.sql](file://backend/database/migrations/010-module-finances.sql)
- [backend/database/migrations/013-module-finances-phase1-granularite.sql](file://backend/database/migrations/013-module-finances-phase1-granularite.sql)
- [backend/database/migrations/014-module-finances-phase2-section.sql](file://backend/database/migrations/014-module-finances-phase2-section.sql)

### Intégration avec la comptabilité
Les mouvements de matériel peuvent être liés aux écritures comptables grâce aux migrations financières. La granularité et les sections permettent de segmenter les charges et immobilisations.

```mermaid
graph LR
Materiel["Module Matériel"] --> Finances["Module Finances"]
Finances --> Comptabilite["Comptabilité"]
Materiel --> Migrations["Migrations financières"]
Migrations --> Finances
```

**Sources du diagramme**
- [backend/database/migrations/010-module-finances.sql](file://backend/database/migrations/010-module-finances.sql)
- [backend/database/migrations/013-module-finances-phase1-granularite.sql](file://backend/database/migrations/013-module-finances-phase1-granularite.sql)
- [backend/database/migrations/014-module-finances-phase2-section.sql](file://backend/database/migrations/014-module-finances-phase2-section.sql)
- [backend/database/migrations/013-sync-modules-actifs.sql](file://backend/database/migrations/013-sync-modules-actifs.sql)

**Sources de section**
- [backend/database/migrations/010-module-finances.sql](file://backend/database/migrations/010-module-finances.sql)
- [backend/database/migrations/013-module-finances-phase1-granularite.sql](file://backend/database/migrations/013-module-finances-phase1-granularite.sql)
- [backend/database/migrations/014-module-finances-phase2-section.sql](file://backend/database/migrations/014-module-finances-phase2-section.sql)
- [backend/database/migrations/013-sync-modules-actifs.sql](file://backend/database/migrations/013-sync-modules-actifs.sql)

## Analyse des dépendances
Le module Matériel dépend des entités et DTOs internes, des services métier, et des migrations financières. Les routes sont enregistrées globalement et l’application initialise le module.

```mermaid
graph TB
Index["materiel/index.ts"] --> Controller["materiel.controller.ts"]
Controller --> Service["materiel.service.ts"]
Service --> Entity["materiel.entity.ts"]
Controller --> Dto["materiel.dto.ts"]
App["app.ts"] --> Routes["route-registry.ts"]
Routes --> Index
```

**Sources du diagramme**
- [backend/src/modules/materiel/index.ts](file://backend/src/modules/materiel/index.ts)
- [backend/src/modules/materiel/controllers/materiel.controller.ts](file://backend/src/modules/materiel/controllers/materiel.controller.ts)
- [backend/src/modules/materiel/services/materiel.service.ts](file://backend/src/modules/materiel/services/materiel.service.ts)
- [backend/src/modules/materiel/entities/materiel.entity.ts](file://backend/src/modules/materiel/entities/materiel.entity.ts)
- [backend/src/modules/materiel/dto/materiel.dto.ts](file://backend/src/modules/materiel/dto/materiel.dto.ts)
- [backend/src/routes/route-registry.ts](file://backend/src/routes/route-registry.ts)
- [backend/src/app.ts](file://backend/src/app.ts)

**Sources de section**
- [backend/src/modules/materiel/index.ts](file://backend/src/modules/materiel/index.ts)
- [backend/src/routes/route-registry.ts](file://backend/src/routes/route-registry.ts)
- [backend/src/app.ts](file://backend/src/app.ts)

## Considérations de performance
- Indexation des colonnes critiques (référence, catégorie, localisation, statut) pour accélérer les recherches et les rapports.
- Pagination des listes d’équipements et des mouvements pour limiter la charge mémoire.
- Agrégation des données de rapports en requêtes optimisées plutôt qu’en traitements côté application.
- Mise en cache des configurations de seuils et des catégories fréquemment consultées.

[Pas de sources nécessaires car cette section fournit des conseils généraux]

## Guide de dépannage
- Vérifier les logs d’erreurs lors des mouvements de stock pour identifier les violations de contraintes (quantité négative, état invalide).
- Confirmer la présence des migrations financières appliquées pour garantir la cohérence comptable.
- Valider les permissions RBAC pour les actions sensibles (mise au rebut, modification de valeur d’acquisition).
- Utiliser les rapports d’inventaire pour détecter les écarts physiques et corriger les fiches inventaire.

**Sources de section**
- [backend/src/modules/materiel/services/materiel.service.ts](file://backend/src/modules/materiel/services/materiel.service.ts)
- [backend/database/migrations/010-module-finances.sql](file://backend/database/migrations/010-module-finances.sql)
- [backend/database/migrations/013-module-finances-phase1-granularite.sql](file://backend/database/migrations/013-module-finances-phase1-granularite.sql)
- [backend/database/migrations/014-module-finances-phase2-section.sql](file://backend/database/migrations/014-module-finances-phase2-section.sql)

## Conclusion
Le module Matériel et Inventaire d’eLISAschool offre une gestion complète du cycle de vie du matériel, depuis l’acquisition jusqu’à la mise au rebut, en passant par les demandes, prêts, retours et maintenance. Il intègre alertes de stock, inventaires périodiques, rapports d’utilisation, amortissement et valorisation patrimoniale, tout en assurant une intégration robuste avec la comptabilité via des migrations financières. Cette documentation vise à faciliter l’usage et l’extension du module par les équipes techniques et les responsables patrimoniaux.

[Pas de sources nécessaires car cette section résume sans analyser de fichiers spécifiques]

## Annexes
- Exemples de classification du matériel pédagogique, sportif et technique basés sur les catégories configurables.
- Procédures recommandées pour la tenue des inventaires et la traçabilité des mouvements.
- Bonnes pratiques pour la configuration des seuils minimum et la planification des alertes.

[Pas de sources nécessaires car cette section propose des recommandations générales]