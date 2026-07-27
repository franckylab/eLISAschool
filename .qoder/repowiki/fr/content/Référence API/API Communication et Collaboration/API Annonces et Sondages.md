# API Annonces et Sondages

<cite>
**Fichiers référencés dans ce document**
- [backend/src/modules/annonces/controllers/annonce.controller.ts](file://backend/src/modules/annonces/controllers/annonce.controller.ts)
- [backend/src/modules/annonces/services/annonce.service.ts](file://backend/src/modules/annonces/services/annonce.service.ts)
- [backend/src/modules/annonces/entities/annonce.entity.ts](file://backend/src/modules/annonces/entities/annonce.entity.ts)
- [backend/src/modules/sondages/controllers/sondage.controller.ts](file://backend/src/modules/sondages/controllers/sondage.controller.ts)
- [backend/src/modules/sondages/services/sondage.service.ts](file://backend/src/modules/sondages/services/sondage.service.ts)
- [backend/src/modules/sondages/entities/sondage.entity.ts](file://backend/src/modules/sondages/entities/sondage.entity.ts)
- [backend/src/routes/route-registry.ts](file://backend/src/routes/route-registry.ts)
- [backend/database/migrations/041-module-annonces.sql](file://backend/database/migrations/041-module-annonces.sql)
- [backend/database/migrations/041-module-sondages.sql](file://backend/database/migrations/041-module-sondages.sql)
- [backend/database/migrations/042-annonces-performance-optimization.sql](file://backend/database/migrations/042-annonces-performance-optimization.sql)
- [backend/database/migrations/042-sondages-recurrents.sql](file://backend/database/migrations/042-sondages-recurrents.sql)
</cite>

## Table des matières
1. [Introduction](#introduction)
2. [Structure du projet](#structure-du-projet)
3. [Composants clés](#composants-clés)
4. [Vue d'ensemble de l'architecture](#vue-densemble-de-larchitecture)
5. [Analyse détaillée des composants](#analyse-detaillee-des-composants)
6. [Analyse des dépendances](#analyse-des-dependances)
7. [Considérations de performance](#considerations-de-performance)
8. [Guide de dépannage](#guide-de-depannage)
9. [Conclusion](#conclusion)
10. [Annexes](#annexes)

## Introduction
Ce document présente une documentation API complète pour les modules Annonces et Sondages d'eLISAschool. Il couvre la création, la publication et la gestion des annonces avec ciblage par rôle ou département, ainsi que la modélisation des sondages (questions, réponses, résultats). Il inclut également des exemples d'intégration pour les sondages récurrents, les statistiques de participation et les exports de données, en s'appuyant sur les entités, services, contrôleurs et migrations disponibles dans le codebase.

## Structure du projet
Les fonctionnalités d'annonces et de sondages sont implémentées dans des modules dédiés :
- Module Annonces : contrôleurs, services, entités et migrations associés.
- Module Sondages : contrôleurs, services, entités et migrations associés.
- Registre des routes qui expose les endpoints via l'API REST.

```mermaid
graph TB
subgraph "Module Annonces"
A_CTRL["annonce.controller.ts"]
A_SVC["annonce.service.ts"]
A_ENT["annonce.entity.ts"]
A_MIG["041-module-annonces.sql"]
A_PERF["042-annonces-performance-optimization.sql"]
end
subgraph "Module Sondages"
S_CTRL["sondage.controller.ts"]
S_SVC["sondage.service.ts"]
S_ENT["sondage.entity.ts"]
S_MIG["041-module-sondages.sql"]
S_REC["042-sondages-recurrents.sql"]
end
ROUTE["route-registry.ts"]
ROUTE --> A_CTRL
ROUTE --> S_CTRL
A_CTRL --> A_SVC
S_CTRL --> S_SVC
A_SVC --> A_ENT
S_SVC --> S_ENT
A_ENT -. schema .-> A_MIG
S_ENT -. schema .-> S_MIG
A_ENT -. indexes .-> A_PERF
S_ENT -. recurrence .-> S_REC
```

**Sources du diagramme**
- [backend/src/modules/annonces/controllers/annonce.controller.ts](file://backend/src/modules/annonces/controllers/annonce.controller.ts)
- [backend/src/modules/annonces/services/annonce.service.ts](file://backend/src/modules/annonces/services/annonce.service.ts)
- [backend/src/modules/annonces/entities/annonce.entity.ts](file://backend/src/modules/annonces/entities/annonce.entity.ts)
- [backend/src/modules/sondages/controllers/sondage.controller.ts](file://backend/src/modules/sondages/controllers/sondage.controller.ts)
- [backend/src/modules/sondages/services/sondage.service.ts](file://backend/src/modules/sondages/services/sondage.service.ts)
- [backend/src/modules/sondages/entities/sondage.entity.ts](file://backend/src/modules/sondages/entities/sondage.entity.ts)
- [backend/src/routes/route-registry.ts](file://backend/src/routes/route-registry.ts)
- [backend/database/migrations/041-module-annonces.sql](file://backend/database/migrations/041-module-annonces.sql)
- [backend/database/migrations/042-annonces-performance-optimization.sql](file://backend/database/migrations/042-annonces-performance-optimization.sql)
- [backend/database/migrations/041-module-sondages.sql](file://backend/database/migrations/041-module-sondages.sql)
- [backend/database/migrations/042-sondages-recurrents.sql](file://backend/database/migrations/042-sondages-recurrents.sql)

**Sources de section**
- [backend/src/routes/route-registry.ts](file://backend/src/routes/route-registry.ts)

## Composants clés
- Contrôleurs : exposent les endpoints REST pour les ressources Annonces et Sondages.
- Services : implémentent la logique métier (création, publication, ciblage, planification, agrégation de résultats).
- Entités : modèles de données persistés (Annonce, Sondage, Question, Réponse, Résultat).
- Migrations : définition du schéma de base de données et optimisations/indexes.

**Sources de section**
- [backend/src/modules/annonces/controllers/annonce.controller.ts](file://backend/src/modules/annonces/controllers/annonce.controller.ts)
- [backend/src/modules/annonces/services/annonce.service.ts](file://backend/src/modules/annonces/services/annonce.service.ts)
- [backend/src/modules/annonces/entities/annonce.entity.ts](file://backend/src/modules/annonces/entities/annonce.entity.ts)
- [backend/src/modules/sondages/controllers/sondage.controller.ts](file://backend/src/modules/sondages/controllers/sondage.controller.ts)
- [backend/src/modules/sondages/services/sondage.service.ts](file://backend/src/modules/sondages/services/sondage.service.ts)
- [backend/src/modules/sondages/entities/sondage.entity.ts](file://backend/src/modules/sondages/entities/sondage.entity.ts)

## Vue d'ensemble de l'architecture
Le flux typique d'une requête API passe par le registre de routes vers un contrôleur spécifique, qui délègue au service correspondant. Le service interagit avec les entités ORM et la base de données définie par les migrations.

```mermaid
sequenceDiagram
participant Client as "Client"
participant Routes as "route-registry.ts"
participant Ctrl as "Contrôleur Annonces/Sondages"
participant Svc as "Service Annonces/Sondages"
participant DB as "Base de données (migrations)"
Client->>Routes : Requête HTTP
Routes->>Ctrl : Dispatch vers contrôleur
Ctrl->>Svc : Appel méthode métier
Svc->>DB : Lecture/Écriture via entités
DB-->>Svc : Données persistées
Svc-->>Ctrl : Résultat métier
Ctrl-->>Client : Réponse JSON
```

**Sources du diagramme**
- [backend/src/routes/route-registry.ts](file://backend/src/routes/route-registry.ts)
- [backend/src/modules/annonces/controllers/annonce.controller.ts](file://backend/src/modules/annonces/controllers/annonce.controller.ts)
- [backend/src/modules/sondages/controllers/sondage.controller.ts](file://backend/src/modules/sondages/controllers/sondage.controller.ts)
- [backend/src/modules/annonces/services/annonce.service.ts](file://backend/src/modules/annonces/services/annonce.service.ts)
- [backend/src/modules/sondages/services/sondage.service.ts](file://backend/src/modules/sondages/services/sondage.service.ts)
- [backend/database/migrations/041-module-annonces.sql](file://backend/database/migrations/041-module-annonces.sql)
- [backend/database/migrations/041-module-sondages.sql](file://backend/database/migrations/041-module-sondages.sql)

## Analyse détaillée des composants

### Endpoints Annonces
- Création d'annonce : endpoint POST pour créer une annonce avec titre, contenu, date de début/fin, statut et ciblage (rôle/département).
- Publication : endpoint PUT/PATCH pour passer une annonce à "publiée".
- Consultation : GET liste filtrable par statut, dates, cible.
- Mise à jour : PATCH modification des champs éditables.
- Suppression : DELETE suppression logique ou physique selon politique.

Ciblage par rôle ou département :
- Les cibles peuvent être exprimées comme listes de rôles et/ou départements.
- La diffusion est restreinte aux utilisateurs dont le rôle ou le département correspond aux cibles de l'annonce.

Exemple d'intégration :
- Frontend appelle POST /annonces avec payload contenant les champs nécessaires et les cibles.
- Service valide les permissions, persiste l'annonce et retourne l'objet créé.

**Sources de section**
- [backend/src/modules/annonces/controllers/annonce.controller.ts](file://backend/src/modules/annonces/controllers/annonce.controller.ts)
- [backend/src/modules/annonces/services/annonce.service.ts](file://backend/src/modules/annonces/services/annonce.service.ts)
- [backend/src/modules/annonces/entities/annonce.entity.ts](file://backend/src/modules/annonces/entities/annonce.entity.ts)
- [backend/database/migrations/041-module-annonces.sql](file://backend/database/migrations/041-module-annonces.sql)

### Endpoints Sondages
- Création de sondage : POST /sondages avec titre, description, dates, visibilité et configuration.
- Ajout de questions : POST /sondages/{id}/questions avec type (QCM, texte, échelle), options si QCM.
- Soumission de réponses : POST /sondages/{id}/reponses avec mapping questionId -> valeur.
- Consultation des résultats : GET /sondages/{id}/resultats avec agrégation par question.
- Programmation récurrente : POST /sondages/{id}/programmer pour planifier des déclenchements récurrents.

Schémas de données :
- Sondage : identifiant, titre, description, statut, dates, visibilité, métadonnées.
- Question : id, sondageId, type, libellé, options (si QCM), ordre.
- Réponse : id, sondageId, utilisateurId, questionId, valeur.
- Résultat : id, sondageId, questionId, agrégats (counts, moyennes, distributions).

Exemples d'intégration :
- Sondages récurrents : utiliser l'endpoint de programmation pour définir fréquence et fuseau horaire ; le service planifie les notifications et ouvre les sondages périodiquement.
- Statistiques de participation : GET /sondages/{id}/stats pour taux de réponse, nombre de participants, délais moyens.
- Export de données : GET /sondages/{id}/export pour télécharger CSV/JSON des réponses et résultats.

**Sources de section**
- [backend/src/modules/sondages/controllers/sondage.controller.ts](file://backend/src/modules/sondages/controllers/sondage.controller.ts)
- [backend/src/modules/sondages/services/sondage.service.ts](file://backend/src/modules/sondages/services/sondage.service.ts)
- [backend/src/modules/sondages/entities/sondage.entity.ts](file://backend/src/modules/sondages/entities/sondage.entity.ts)
- [backend/database/migrations/041-module-sondages.sql](file://backend/database/migrations/041-module-sondages.sql)
- [backend/database/migrations/042-sondages-recurrents.sql](file://backend/database/migrations/042-sondages-recurrents.sql)

### Modélisation des données (Entités)
```mermaid
classDiagram
class Annonce {
+string id
+string titre
+string contenu
+date debut
+date fin
+enum statut
+array cibles_roles
+array cibles_departements
+boolean publiee
+timestamp cree_a
+timestamp modifie_a
}
class Sondage {
+string id
+string titre
+string description
+enum statut
+date debut
+date fin
+object config
+timestamp cree_a
+timestamp modifie_a
}
class Question {
+string id
+string sondage_id
+string type
+string libelle
+array options
+number ordre
}
class Reponse {
+string id
+string sondage_id
+string utilisateur_id
+string question_id
+any valeur
+timestamp cree_a
}
class Resultat {
+string id
+string sondage_id
+string question_id
+object agrégats
+timestamp mis_a_jour_a
}
Sondage "1" --> "many" Question : "contient"
Sondage "1" --> "many" Reponse : "collecte"
Question "1" --> "many" Reponse : "répondue_par"
Sondage "1" --> "many" Resultat : "agrège"
Question "1" --> "many" Resultat : "agrège"
```

**Sources du diagramme**
- [backend/src/modules/annonces/entities/annonce.entity.ts](file://backend/src/modules/annonces/entities/annonce.entity.ts)
- [backend/src/modules/sondages/entities/sondage.entity.ts](file://backend/src/modules/sondages/entities/sondage.entity.ts)

**Sources de section**
- [backend/src/modules/annonces/entities/annonce.entity.ts](file://backend/src/modules/annonces/entities/annonce.entity.ts)
- [backend/src/modules/sondages/entities/sondage.entity.ts](file://backend/src/modules/sondages/entities/sondage.entity.ts)

### Logique de ciblage et diffusion des annonces
```mermaid
flowchart TD
Start(["Requête de lecture/liste"]) --> LoadAnnonces["Charger annonces actives"]
LoadAnnonces --> FilterByUser["Filtrer par utilisateur courant"]
FilterByUser --> CheckRoles{"Rôles de l'utilisateur correspondent?"}
CheckRoles --> |Oui| IncludeRole["Inclure annonce"]
CheckRoles --> |Non| CheckDepartments{"Départements correspondent?"}
CheckDepartments --> |Oui| IncludeDept["Inclure annonce"]
CheckDepartments --> |Non| Exclude["Exclure annonce"]
IncludeRole --> Return["Retourner liste filtrée"]
IncludeDept --> Return
Exclude --> Return
```

**Sources du diagramme**
- [backend/src/modules/annonces/services/annonce.service.ts](file://backend/src/modules/annonces/services/annonce.service.ts)
- [backend/src/modules/annonces/entities/annonce.entity.ts](file://backend/src/modules/annonces/entities/annonce.entity.ts)

**Sources de section**
- [backend/src/modules/annonces/services/annonce.service.ts](file://backend/src/modules/annonces/services/annonce.service.ts)

### Programmation des sondages récurrents
```mermaid
sequenceDiagram
participant Admin as "Administrateur"
participant Controller as "SondageController"
participant Service as "SondageService"
participant Scheduler as "Planificateur"
participant DB as "Base de données"
Admin->>Controller : POST /sondages/{id}/programmer
Controller->>Service : createRecurrence(config)
Service->>Scheduler : Enregistrer tâche récurrente
Scheduler->>DB : Créer entrées programmées
DB-->>Scheduler : Confirmations
Scheduler-->>Service : Planification validée
Service-->>Controller : Succès
Controller-->>Admin : 201 Created
```

**Sources du diagramme**
- [backend/src/modules/sondages/controllers/sondage.controller.ts](file://backend/src/modules/sondages/controllers/sondage.controller.ts)
- [backend/src/modules/sondages/services/sondage.service.ts](file://backend/src/modules/sondages/services/sondage.service.ts)
- [backend/database/migrations/042-sondages-recurrents.sql](file://backend/database/migrations/042-sondages-recurrents.sql)

**Sources de section**
- [backend/src/modules/sondages/controllers/sondage.controller.ts](file://backend/src/modules/sondages/controllers/sondage.controller.ts)
- [backend/src/modules/sondages/services/sondage.service.ts](file://backend/src/modules/sondages/services/sondage.service.ts)
- [backend/database/migrations/042-sondages-recurrents.sql](file://backend/database/migrations/042-sondages-recurrents.sql)

### Statistiques de participation et exports
- Statistiques : endpoint GET /sondages/{id}/stats renvoie taux de réponse, nombre de participants, délais moyens, distribution par question.
- Exports : endpoint GET /sondages/{id}/export permet de télécharger CSV/JSON des réponses et résultats.

```mermaid
sequenceDiagram
participant Client as "Client"
participant Ctrl as "SondageController"
participant Svc as "SondageService"
participant DB as "Base de données"
Client->>Ctrl : GET /sondages/{id}/stats
Ctrl->>Svc : computeStats(id)
Svc->>DB : Agrégations (COUNT, AVG, GROUP BY)
DB-->>Svc : Résultats agrégés
Svc-->>Ctrl : Stats objet
Ctrl-->>Client : JSON stats
Client->>Ctrl : GET /sondages/{id}/export?format=csv
Ctrl->>Svc : exportData(id, format)
Svc->>DB : Requêtes export
DB-->>Svc : Données brutes
Svc-->>Ctrl : Fichier généré
Ctrl-->>Client : Flux fichier
```

**Sources du diagramme**
- [backend/src/modules/sondages/controllers/sondage.controller.ts](file://backend/src/modules/sondages/controllers/sondage.controller.ts)
- [backend/src/modules/sondages/services/sondage.service.ts](file://backend/src/modules/sondages/services/sondage.service.ts)

**Sources de section**
- [backend/src/modules/sondages/controllers/sondage.controller.ts](file://backend/src/modules/sondages/controllers/sondage.controller.ts)
- [backend/src/modules/sondages/services/sondage.service.ts](file://backend/src/modules/sondages/services/sondage.service.ts)

### Modération et analyse des réponses
- Modération : validation des réponses, marquage de contenus inappropriés, blocage de soumissions répétitives.
- Analyse : calcul de scores, tendances, corrélations entre questions, segmentation par profil utilisateur.

```mermaid
flowchart TD
Submit["Soumission de réponse"] --> Validate["Validation du contenu"]
Validate --> Valid{"Contenu valide?"}
Valid --> |Non| Reject["Rejeter et notifier"]
Valid --> |Oui| Store["Stocker réponse"]
Store --> Analyze["Analyser et agréger"]
Analyze --> UpdateStats["Mettre à jour statistiques"]
UpdateStats --> Notify["Notifier administrateurs si nécessaire"]
Notify --> Done["Terminé"]
Reject --> Done
```

**Sources du diagramme**
- [backend/src/modules/sondages/services/sondage.service.ts](file://backend/src/modules/sondages/services/sondage.service.ts)

**Sources de section**
- [backend/src/modules/sondages/services/sondage.service.ts](file://backend/src/modules/sondages/services/sondage.service.ts)

## Analyse des dépendances
Les contrôleurs dépendent des services, qui dépendent des entités ORM. Les routes centralisent l'exposition des endpoints. Les migrations définissent le schéma et les index de performance.

```mermaid
graph TB
Routes["route-registry.ts"] --> CtrlA["annonce.controller.ts"]
Routes --> CtrlS["sondage.controller.ts"]
CtrlA --> SvcA["annonce.service.ts"]
CtrlS --> SvcS["sondage.service.ts"]
SvcA --> EntA["annonce.entity.ts"]
SvcS --> EntS["sondage.entity.ts"]
EntA --> MigA["041-module-annonces.sql"]
EntS --> MigS["041-module-sondages.sql"]
EntA --> PerfA["042-annonces-performance-optimization.sql"]
EntS --> RecS["042-sondages-recurrents.sql"]
```

**Sources du diagramme**
- [backend/src/routes/route-registry.ts](file://backend/src/routes/route-registry.ts)
- [backend/src/modules/annonces/controllers/annonce.controller.ts](file://backend/src/modules/annonces/controllers/annonce.controller.ts)
- [backend/src/modules/sondages/controllers/sondage.controller.ts](file://backend/src/modules/sondages/controllers/sondage.controller.ts)
- [backend/src/modules/annonces/services/annonce.service.ts](file://backend/src/modules/annonces/services/annonce.service.ts)
- [backend/src/modules/sondages/services/sondage.service.ts](file://backend/src/modules/sondages/services/sondage.service.ts)
- [backend/src/modules/annonces/entities/annonce.entity.ts](file://backend/src/modules/annonces/entities/annonce.entity.ts)
- [backend/src/modules/sondages/entities/sondage.entity.ts](file://backend/src/modules/sondages/entities/sondage.entity.ts)
- [backend/database/migrations/041-module-annonces.sql](file://backend/database/migrations/041-module-annonces.sql)
- [backend/database/migrations/041-module-sondages.sql](file://backend/database/migrations/041-module-sondages.sql)
- [backend/database/migrations/042-annonces-performance-optimization.sql](file://backend/database/migrations/042-annonces-performance-optimization.sql)
- [backend/database/migrations/042-sondages-recurrents.sql](file://backend/database/migrations/042-sondages-recurrents.sql)

**Sources de section**
- [backend/src/routes/route-registry.ts](file://backend/src/routes/route-registry.ts)

## Considérations de performance
- Indexation : les migrations d'optimisation ajoutent des index sur les colonnes fréquemment filtrées (statut, dates, cibles).
- Agrégations : les statistiques utilisent des requêtes groupées et des vues matérialisées si disponibles.
- Pagination : limiter les retours et utiliser des curseurs pour les grandes listes d'annonces ou de réponses.
- Cache : envisager un cache côté service pour les résultats de statistiques peu changeantes.

**Sources de section**
- [backend/database/migrations/042-annonces-performance-optimization.sql](file://backend/database/migrations/042-annonces-performance-optimization.sql)

## Guide de dépannage
- Erreurs de permission : vérifier les rôles et départements assignés à l'utilisateur et les cibles de l'annonce.
- Validation des réponses : inspecter les règles de validation et les messages d'erreur retournés par le service.
- Programmation récurrente : vérifier les tâches planifiées et les logs du planificateur.
- Performance lente : examiner les index et les requêtes SQL générées pour les agrégations.

**Sources de section**
- [backend/src/modules/annonces/services/annonce.service.ts](file://backend/src/modules/annonces/services/annonce.service.ts)
- [backend/src/modules/sondages/services/sondage.service.ts](file://backend/src/modules/sondages/services/sondage.service.ts)

## Conclusion
Les modules Annonces et Sondages offrent une API robuste pour la communication interne et la collecte d'opinions au sein de l'établissement. Grâce au ciblage précis, à la programmation récurrente et aux outils d'analyse, ils permettent une gestion efficace des communications et une prise de décision fondée sur les données.

## Annexes
- Exemples d'intégration frontend : appels HTTP vers les endpoints décrits, gestion des erreurs et mise à jour UI.
- Scripts de déploiement : commandes pour appliquer les migrations et activer les fonctionnalités.

[Section sources]
- [backend/src/modules/annonces/controllers/annonce.controller.ts](file://backend/src/modules/annonces/controllers/annonce.controller.ts)
- [backend/src/modules/sondages/controllers/sondage.controller.ts](file://backend/src/modules/sondages/controllers/sondage.controller.ts)
- [backend/src/modules/annonces/services/annonce.service.ts](file://backend/src/modules/annonces/services/annonce.service.ts)
- [backend/src/modules/sondages/services/sondage.service.ts](file://backend/src/modules/sondages/services/sondage.service.ts)
- [backend/src/modules/annonces/entities/annonce.entity.ts](file://backend/src/modules/annonces/entities/annonce.entity.ts)
- [backend/src/modules/sondages/entities/sondage.entity.ts](file://backend/src/modules/sondages/entities/sondage.entity.ts)
- [backend/src/routes/route-registry.ts](file://backend/src/routes/route-registry.ts)
- [backend/database/migrations/041-module-annonces.sql](file://backend/database/migrations/041-module-annonces.sql)
- [backend/database/migrations/041-module-sondages.sql](file://backend/database/migrations/041-module-sondages.sql)
- [backend/database/migrations/042-annonces-performance-optimization.sql](file://backend/database/migrations/042-annonces-performance-optimization.sql)
- [backend/database/migrations/042-sondages-recurrents.sql](file://backend/database/migrations/042-sondages-recurrents.sql)