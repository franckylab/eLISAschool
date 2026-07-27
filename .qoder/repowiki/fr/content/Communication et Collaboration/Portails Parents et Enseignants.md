# Portails Parents et Enseignants

<cite>
**Fichiers référencés dans ce document**
- [backend/src/modules/responsables-eleves/](file://backend/src/modules/responsables-eleves/)
- [backend/src/modules/eleves/](file://backend/src/modules/eleves/)
- [backend/src/modules/bulletins/](file://backend/src/modules/bulletins/)
- [backend/src/modules/notes/](file://backend/src/modules/notes/)
- [backend/src/modules/messagerie/](file://backend/src/modules/messagerie/)
- [backend/src/modules/suivi-eleves/](file://backend/src/modules/suivi-eleves/)
- [backend/src/modules/auth/](file://backend/src/modules/auth/)
- [backend/src/modules/rbac/](file://backend/src/modules/rbac/)
- [backend/database/migrations/052-approche-hybride-parents.sql](file://backend/database/migrations/052-approche-hybride-parents.sql)
- [backend/database/migrations/123-refonte-notes-bulletins.sql](file://backend/database/migrations/123-refonte-notes-bulletins.sql)
- [backend/database/migrations/043-module-messagerie-complete.sql](file://backend/database/migrations/043-module-messagerie-complete.sql)
- [backend/database/migrations/030-suivi-eleves.sql](file://backend/database/migrations/030-suivi-eleves.sql)
- [frontend/src/routes/](file://frontend/src/routes/)
- [frontend/src/features/](file://frontend/src/features/)
- [frontend/src/components/](file://frontend/src/components/)
- [frontend/src/hooks/](file://frontend/src/hooks/)
- [docs/guards-exemples-implémentation.ts](file://docs/guards-exemples-implémentation.ts)
- [docs/guide-implémentation-permissions.ts](file://docs/guide-implémentation-permissions.ts)
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
Ce document présente une documentation complète des portails parents et enseignants d’eLISAschool. Il détaille les rôles et permissions, les interfaces dédiées, les flux de travail académiques, ainsi que la modélisation et les relations autour de l’entité ResponsableEleve. Il inclut également des exemples d’implémentation des guards de permission, les schémas de base de données pertinents, et les composants React associés aux interfaces spécialisées. Les fonctionnalités avancées telles que les rendez-vous en ligne, les suivis personnalisés et les rapports d’activité scolaire sont explicitement couvertes.

## Structure du projet
Le codebase est organisé en modules backend par domaine (responsables-eleves, eleves, bulletins, notes, messagerie, suivi-eleves, auth, rbac), avec des migrations SQL dédiées pour chaque évolution du schéma. Le frontend expose des routes et des features frontales correspondant aux portails parents et enseignants, avec des hooks et des composants réutilisables.

```mermaid
graph TB
subgraph "Backend"
A["modules/responsables-eleves"]
B["modules/eleves"]
C["modules/bulletins"]
D["modules/notes"]
E["modules/messagerie"]
F["modules/suivi-eleves"]
G["modules/auth"]
H["modules/rbac"]
M["database/migrations"]
end
subgraph "Frontend"
R["routes/*"]
S["features/*"]
T["components/*"]
U["hooks/*"]
end
A --> B
C --> D
E --> G
F --> B
G --> H
R --> S
S --> T
S --> U
M --> A
M --> B
M --> C
M --> D
M --> E
M --> F
```

[Ce diagramme illustre la structure logique sans mappage direct à des fichiers spécifiques]

## Composants clés
- Entité ResponsableEleve : définit le lien entre un responsable légal et un ou plusieurs élèves, avec des champs additionnels et des règles d’accès.
- Portail Parents : accès aux notes, bulletins, messagerie avec enseignants, suivi personnalisé, rendez-vous en ligne et rapports d’activité scolaire.
- Portail Enseignants : saisie et validation des notes, communication avec responsables, suivi des élèves, planification de rendez-vous.
- RBAC et Auth : gestion fine des permissions et authentification multi-mode, garantissant l’isolement tenant et le contrôle d’accès par rôle.

**Section sources**
- [backend/src/modules/responsables-eleves/](file://backend/src/modules/responsables-eleves/)
- [backend/src/modules/eleves/](file://backend/src/modules/eleves/)
- [backend/src/modules/bulletins/](file://backend/src/modules/bulletins/)
- [backend/src/modules/notes/](file://backend/src/modules/notes/)
- [backend/src/modules/messagerie/](file://backend/src/modules/messagerie/)
- [backend/src/modules/suivi-eleves/](file://backend/src/modules/suivi-eleves/)
- [backend/src/modules/auth/](file://backend/src/modules/auth/)
- [backend/src/modules/rbac/](file://backend/src/modules/rbac/)

## Vue d’ensemble de l’architecture
Les portails parents et enseignants s’appuient sur un modèle RBAC strict, des services métier par module, et des endpoints REST sécurisés. Les données sont structurées via des migrations SQL qui définissent les entités et leurs relations. Le frontend utilise des routes TanStack Router et des features frontales pour exposer les interfaces adaptées aux rôles.

```mermaid
sequenceDiagram
participant Parent as "Parent (Frontend)"
participant API as "API Backend"
participant RBAC as "RBAC Service"
participant Eleves as "Service Eleves"
participant Notes as "Service Notes/Bulletins"
participant Messagerie as "Service Messagerie"
Parent->>API : "GET /parents/dashboard"
API->>RBAC : "Vérifier permission parent"
RBAC-->>API : "Autorisé"
API->>Eleves : "Lister enfants liés au parent"
Eleves-->>API : "Enfants"
API->>Notes : "Récupérer notes/bulletins enfants"
Notes-->>API : "Données scolaires"
API-->>Parent : "Dashboard consolidé"
Parent->>API : "POST /messagerie/message"
API->>RBAC : "Vérifier permission message enseignant"
RBAC-->>API : "Autorisé"
API->>Messagerie : "Créer message"
Messagerie-->>API : "Message créé"
API-->>Parent : "Confirmation"
```

**Diagram sources**
- [backend/src/modules/auth/](file://backend/src/modules/auth/)
- [backend/src/modules/rbac/](file://backend/src/modules/rbac/)
- [backend/src/modules/eleves/](file://backend/src/modules/eleves/)
- [backend/src/modules/notes/](file://backend/src/modules/notes/)
- [backend/src/modules/bulletins/](file://backend/src/modules/bulletins/)
- [backend/src/modules/messagerie/](file://backend/src/modules/messagerie/)

## Analyse détaillée des composants

### Entité ResponsableEleve et relations
ResponsableEleve lie un utilisateur responsable à un élève, permettant l’accès aux données scolaires de ses enfants. Les relations incluent :
- Responsables → Élèves (un responsable peut avoir plusieurs élèves)
- Accès aux notes et bulletins filtrés par enfant lié
- Communication avec enseignants assignés aux classes des enfants

```mermaid
erDiagram
RESPONSABLES_ELEVES {
uuid id PK
uuid responsable_id FK
uuid eleve_id FK
timestamp created_at
timestamp updated_at
}
ELEVES {
uuid id PK
string nom
string prenom
uuid classe_id FK
timestamp created_at
timestamp updated_at
}
RESPONSABLES_ELEVES ||--o{ ELEVES : "associe"
```

**Diagram sources**
- [backend/database/migrations/052-approche-hybride-parents.sql](file://backend/database/migrations/052-approche-hybride-parents.sql)
- [backend/src/modules/responsables-eleves/](file://backend/src/modules/responsables-eleves/)
- [backend/src/modules/eleves/](file://backend/src/modules/eleves/)

**Section sources**
- [backend/src/modules/responsables-eleves/](file://backend/src/modules/responsables-eleves/)
- [backend/src/modules/eleves/](file://backend/src/modules/eleves/)
- [backend/database/migrations/052-approche-hybride-parents.sql](file://backend/database/migrations/052-approche-hybride-parents.sql)

### Flux de travail académique : notes et bulletins
Les enseignants saisissent et valident les notes ; les parents consultent les notes et bulletins de leurs enfants. Le processus suit un workflow de validation et de clôture de période.

```mermaid
flowchart TD
Start(["Début"]) --> Saisie["Enseignant saisit note"]
Saisie --> Validation{"Note validée?"}
Validation --> |Non| Correction["Correction par enseignant"]
Correction --> Validation
Validation --> |Oui| Publication["Publication dans le bulletin"]
Publication --> Consultation["Parents consultent notes/bulletins"]
Consultation --> Fin(["Fin"])
```

**Diagram sources**
- [backend/src/modules/notes/](file://backend/src/modules/notes/)
- [backend/src/modules/bulletins/](file://backend/src/modules/bulletins/)
- [backend/database/migrations/123-refonte-notes-bulletins.sql](file://backend/database/migrations/123-refonte-notes-bulletins.sql)

**Section sources**
- [backend/src/modules/notes/](file://backend/src/modules/notes/)
- [backend/src/modules/bulletins/](file://backend/src/modules/bulletins/)
- [backend/database/migrations/123-refonte-notes-bulletins.sql](file://backend/database/migrations/123-refonte-notes-bulletins.sql)

### Communications avec les enseignants
La messagerie permet aux parents et enseignants d’échanger des messages sécurisés, avec contrôle d’accès par rôle et contexte d’établissement.

```mermaid
sequenceDiagram
participant Parent as "Parent"
participant API as "API Messagerie"
participant RBAC as "RBAC"
participant DB as "Base de données"
Parent->>API : "Envoyer message à enseignant"
API->>RBAC : "Vérifier permission parent→enseignant"
RBAC-->>API : "Autorisé"
API->>DB : "Enregistrer message"
DB-->>API : "OK"
API-->>Parent : "Confirmation envoi"
```

**Diagram sources**
- [backend/src/modules/messagerie/](file://backend/src/modules/messagerie/)
- [backend/database/migrations/043-module-messagerie-complete.sql](file://backend/database/migrations/043-module-messagerie-complete.sql)

**Section sources**
- [backend/src/modules/messagerie/](file://backend/src/modules/messagerie/)
- [backend/database/migrations/043-module-messagerie-complete.sql](file://backend/database/migrations/043-module-messagerie-complete.sql)

### Suivi personnalisé et rapports d’activité scolaire
Le module suivi-eleves permet de consigner des observations, objectifs et progrès par élève, accessibles aux enseignants et aux parents autorisés.

```mermaid
classDiagram
class SuiviEleve {
+uuid id
+uuid eleve_id
+string type_suivi
+text observation
+date date_suivi
+uuid auteur_id
+boolean public_visibilite
}
class Eleve {
+uuid id
+string nom
+string prenom
}
class Utilisateur {
+uuid id
+string role
}
SuiviEleve --> Eleve : "lié à"
SuiviEleve --> Utilisateur : "créé par"
```

**Diagram sources**
- [backend/src/modules/suivi-eleves/](file://backend/src/modules/suivi-eleves/)
- [backend/database/migrations/030-suivi-eleves.sql](file://backend/database/migrations/030-suivi-eleves.sql)

**Section sources**
- [backend/src/modules/suivi-eleves/](file://backend/src/modules/suivi-eleves/)
- [backend/database/migrations/030-suivi-eleves.sql](file://backend/database/migrations/030-suivi-eleves.sql)

### Rendez-vous en ligne
Les enseignants peuvent planifier des rendez-vous avec les parents, visibles dans le calendrier partagé et accessibles selon les permissions.

```mermaid
flowchart TD
Planif["Enseignant planifie RDV"] --> Confirmer{"Confirmer avec parent?"}
Confirmer --> |Oui| Notifier["Notifier parent"]
Confirmer --> |Non| EnAttente["RDV en attente"]
Notifier --> Accepter["Parent accepte/refuse"]
Accepter --> Calendrier["Mise à jour calendrier"]
EnAttente --> Calendrier
Calendrier --> Fin(["Fin"])
```

[Ce diagramme montre un flux conceptuel non mappé directement à des fichiers spécifiques]

### Exemples d’implémentation des guards de permission
Les guards vérifient les permissions avant d’exposer les routes ou les données sensibles. Ils s’appuient sur le système RBAC et le contexte utilisateur.

```mermaid
flowchart TD
Entrée["Requête entrante"] --> Extraire["Extraire JWT et rôle"]
Extraire --> VerifierPerm["Vérifier permission RBAC"]
VerifierPerm --> PermOk{"Permission OK?"}
PermOk --> |Oui| Continuer["Continuer traitement"]
PermOk --> |Non| Bloquer["Bloquer 403"]
Continuer --> Sortie["Réponse autorisée"]
Bloquer --> Sortie
```

**Section sources**
- [docs/guards-exemples-implémentation.ts](file://docs/guards-exemples-implémentation.ts)
- [docs/guide-implémentation-permissions.ts](file://docs/guide-implémentation-permissions.ts)
- [backend/src/modules/auth/](file://backend/src/modules/auth/)
- [backend/src/modules/rbac/](file://backend/src/modules/rbac/)

### Interfaces React spécialisées
Les interfaces parents et enseignants sont construites avec des routes TanStack, des features frontales, et des composants réutilisables. Les hooks gèrent l’état et les appels API.

```mermaid
graph TB
Routes["routes/*"] --> Features["features/*"]
Features --> Components["components/*"]
Features --> Hooks["hooks/*"]
Hooks --> API["Appels API Backend"]
```

[Ce diagramme illustre la structure frontend sans mappage direct à des fichiers spécifiques]

**Section sources**
- [frontend/src/routes/](file://frontend/src/routes/)
- [frontend/src/features/](file://frontend/src/features/)
- [frontend/src/components/](file://frontend/src/components/)
- [frontend/src/hooks/](file://frontend/src/hooks/)

## Analyse des dépendances
Les modules backend dépendent des migrations SQL pour la structure de données et du RBAC pour les permissions. Le frontend dépend des routes et features pour l’interface utilisateur.

```mermaid
graph TB
A["responsables-eleves"] --> B["eleves"]
C["bulletins"] --> D["notes"]
E["messagerie"] --> F["auth"]
G["suivi-eleves"] --> B
F --> H["rbac"]
I["migrations"] --> A
I --> B
I --> C
I --> D
I --> E
I --> G
```

**Diagram sources**
- [backend/src/modules/responsables-eleves/](file://backend/src/modules/responsables-eleves/)
- [backend/src/modules/eleves/](file://backend/src/modules/eleves/)
- [backend/src/modules/bulletins/](file://backend/src/modules/bulletins/)
- [backend/src/modules/notes/](file://backend/src/modules/notes/)
- [backend/src/modules/messagerie/](file://backend/src/modules/messagerie/)
- [backend/src/modules/suivi-eleves/](file://backend/src/modules/suivi-eleves/)
- [backend/src/modules/auth/](file://backend/src/modules/auth/)
- [backend/src/modules/rbac/](file://backend/src/modules/rbac/)
- [backend/database/migrations/](file://backend/database/migrations/)

**Section sources**
- [backend/src/modules/responsables-eleves/](file://backend/src/modules/responsables-eleves/)
- [backend/src/modules/eleves/](file://backend/src/modules/eleves/)
- [backend/src/modules/bulletins/](file://backend/src/modules/bulletins/)
- [backend/src/modules/notes/](file://backend/src/modules/notes/)
- [backend/src/modules/messagerie/](file://backend/src/modules/messagerie/)
- [backend/src/modules/suivi-eleves/](file://backend/src/modules/suivi-eleves/)
- [backend/src/modules/auth/](file://backend/src/modules/auth/)
- [backend/src/modules/rbac/](file://backend/src/modules/rbac/)
- [backend/database/migrations/](file://backend/database/migrations/)

## Considérations de performance
- Indexation des tables critiques (notes, bulletins, messagerie) pour accélérer les requêtes fréquentes.
- Pagination et filtrage côté serveur pour les listes d’élèves et de communications.
- Mise en cache des données statiques (bulletins clôturés) pour réduire la charge.
- Optimisation des jointures dans les requêtes liées à ResponsableEleve et Eleves.

[Pas de sources nécessaires car cette section fournit des conseils généraux]

## Guide de dépannage
- Erreurs 403 : vérifier les permissions RBAC et les guards frontend/backend.
- Problèmes d’accès aux notes/bulletins : vérifier la relation ResponsableEleve et les filtres par élève.
- Messages non envoyés : contrôler les permissions de messagerie et les états de session.
- Suivi inaccessible : valider les droits d’auteur et la visibilité publique des suivis.

**Section sources**
- [backend/src/modules/auth/](file://backend/src/modules/auth/)
- [backend/src/modules/rbac/](file://backend/src/modules/rbac/)
- [backend/src/modules/messagerie/](file://backend/src/modules/messagerie/)
- [backend/src/modules/suivi-eleves/](file://backend/src/modules/suivi-eleves/)

## Conclusion
Les portails parents et enseignants d’eLISAschool offrent un cadre robuste et sécurisé pour la gestion académique, basé sur un modèle RBAC strict, des entités bien structurées (notamment ResponsableEleve), et des interfaces React intuitives. Les fonctionnalités avancées comme les rendez-vous en ligne, les suivis personnalisés et les rapports d’activité scolaire renforcent l’expérience utilisateur et la collaboration école-famille.

[Pas de sources nécessaires car cette section résume sans analyser de fichiers spécifiques]

## Annexes
- Schémas de base de données : consulter les migrations SQL pour les détails des tables et contraintes.
- Exemples de guards : se référer aux fichiers TypeScript fournis dans docs/.
- Intégration frontend : explorer les routes et features pour adapter les interfaces aux besoins spécifiques.

**Section sources**
- [backend/database/migrations/](file://backend/database/migrations/)
- [docs/guards-exemples-implémentation.ts](file://docs/guards-exemples-implémentation.ts)
- [docs/guide-implémentation-permissions.ts](file://docs/guide-implémentation-permissions.ts)
- [frontend/src/routes/](file://frontend/src/routes/)
- [frontend/src/features/](file://frontend/src/features/)