# Authentification Multi-Tenant

<cite>
**Fichiers référencés dans ce document**
- [backend/src/modules/auth/middlewares/tenant.middleware.ts](file://backend/src/modules/auth/middlewares/tenant.middleware.ts)
- [backend/src/modules/auth/services/utilisateur-etablissement.service.ts](file://backend/src/modules/auth/services/utilisateur-etablissement.service.ts)
- [backend/src/modules/auth/controllers/auth.controller.ts](file://backend/src/modules/auth/controllers/auth.controller.ts)
- [backend/src/modules/auth/guards/require-permission.guard.ts](file://backend/src/modules/auth/guards/require-permission.guard.ts)
- [backend/src/modules/auth/dto/login.dto.ts](file://backend/src/modules/auth/dto/login.dto.ts)
- [backend/src/modules/auth/dto/switch-etablissement.dto.ts](file://backend/src/modules/auth/dto/switch-etablissement.dto.ts)
- [backend/src/modules/utilisateurs/entities/utilisateur.entity.ts](file://backend/src/modules/utilisateurs/entities/utilisateur.entity.ts)
- [backend/src/modules/utilisateurs/entities/utilisateur-etablissement.entity.ts](file://backend/src/modules/utilisateurs/entities/utilisateur-etablissement.entity.ts)
- [backend/database/migrations/050-multi-tenant-v3-max-etablissements.sql](file://backend/database/migrations/050-multi-tenant-v3-max-etablissements.sql)
- [backend/database/migrations/080-preferences-utilisateur-multi-tenant.sql](file://backend/database/migrations/080-preferences-utilisateur-multi-tenant.sql)
- [backend/test/integration/auth-multi-etablissement.spec.ts](file://backend/test/integration/auth-multi-etablissement.spec.ts)
- [backend/test/multi-tenant-isolation.test.ts](file://backend/test/multi-tenant-isolation.test.ts)
- [frontend/src/features/auth/components/EtablissementSelector.tsx](file://frontend/src/features/auth/components/EtablissementSelector.tsx)
- [frontend/src/hooks/useAuth.ts](file://frontend/src/hooks/useAuth.ts)
- [frontend/src/lib/api.ts](file://frontend/src/lib/api.ts)
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
Ce document décrit en détail le système d’authentification multi-tenant d’eLISAschool, avec un accent sur :
- L’isolation des données entre établissements (tenants).
- Le mécanisme de sélection d’établissement et de basculement de contexte.
- La gestion des utilisateurs avec accès multi-établissements via la relation UtilisateurEtablissement.
- Les middlewares tenant, les services associés, et les règles d’accès par établissement.
- L’intégration avec le sélecteur d’établissement frontend.
- Les contraintes de sécurité, les bonnes pratiques de performance, et les cas d’usage courants.

## Structure du projet
Le module d’authentification est organisé par fonctionnalités (controllers, services, guards, middlewares, DTOs) et s’appuie sur des entités partagées pour les utilisateurs et leurs relations avec les établissements. Les migrations définissent le schéma multi-tenant et les préférences utilisateur par tenant.

```mermaid
graph TB
subgraph "Backend - Auth"
Ctl["AuthController"]
MW["TenantMiddleware"]
Guard["RequirePermissionGuard"]
SvcUE["UtilisateurEtablissementService"]
DTOLogin["LoginDTO"]
DTOSwitch["SwitchEtablissementDTO"]
end
subgraph "Backend - Utilisateurs"
EntU["UtilisateurEntity"]
EntUE["UtilisateurEtablissementEntity"]
end
subgraph "Base de données"
DB["PostgreSQL"]
end
subgraph "Frontend"
FESel["EtablissementSelector"]
FEHook["useAuth"]
FEApi["API Client"]
end
FEApi --> Ctl
Ctl --> SvcUE
Ctl --> MW
Ctl --> Guard
SvcUE --> EntUE
SvcUE --> EntU
EntUE --> DB
EntU --> DB
FESel --> FEApi
FEHook --> FEApi
```

**Sources du diagramme**
- [backend/src/modules/auth/controllers/auth.controller.ts](file://backend/src/modules/auth/controllers/auth.controller.ts)
- [backend/src/modules/auth/middlewares/tenant.middleware.ts](file://backend/src/modules/auth/middlewares/tenant.middleware.ts)
- [backend/src/modules/auth/guards/require-permission.guard.ts](file://backend/src/modules/auth/guards/require-permission.guard.ts)
- [backend/src/modules/auth/services/utilisateur-etablissement.service.ts](file://backend/src/modules/auth/services/utilisateur-etablissement.service.ts)
- [backend/src/modules/utilisateurs/entities/utilisateur.entity.ts](file://backend/src/modules/utilisateurs/entities/utilisateur.entity.ts)
- [backend/src/modules/utilisateurs/entities/utilisateur-etablissement.entity.ts](file://backend/src/modules/utilisateurs/entities/utilisateur-etablissement.entity.ts)
- [frontend/src/features/auth/components/EtablissementSelector.tsx](file://frontend/src/features/auth/components/EtablissementSelector.tsx)
- [frontend/src/hooks/useAuth.ts](file://frontend/src/hooks/useAuth.ts)
- [frontend/src/lib/api.ts](file://frontend/src/lib/api.ts)

**Sources de section**
- [backend/src/modules/auth/controllers/auth.controller.ts](file://backend/src/modules/auth/controllers/auth.controller.ts)
- [backend/src/modules/auth/middlewares/tenant.middleware.ts](file://backend/src/modules/auth/middlewares/tenant.middleware.ts)
- [backend/src/modules/auth/guards/require-permission.guard.ts](file://backend/src/modules/auth/guards/require-permission.guard.ts)
- [backend/src/modules/auth/services/utilisateur-etablissement.service.ts](file://backend/src/modules/auth/services/utilisateur-etablissement.service.ts)
- [backend/src/modules/utilisateurs/entities/utilisateur.entity.ts](file://backend/src/modules/utilisateurs/entities/utilisateur.entity.ts)
- [backend/src/modules/utilisateurs/entities/utilisateur-etablissement.entity.ts](file://backend/src/modules/utilisateurs/entities/utilisateur-etablissement.entity.ts)
- [frontend/src/features/auth/components/EtablissementSelector.tsx](file://frontend/src/features/auth/components/EtablissementSelector.tsx)
- [frontend/src/hooks/useAuth.ts](file://frontend/src/hooks/useAuth.ts)
- [frontend/src/lib/api.ts](file://frontend/src/lib/api.ts)

## Composants clés
- UtilisateurEtablissement : relation many-to-many entre utilisateurs et établissements, permettant l’accès multi-établissement et l’attribution de rôles par établissement.
- TenantMiddleware : injecte et valide le contexte tenant (établissementId) dans la requête, applique les filtres d’isolation.
- UtilisateurEtablissementService : gère les relations utilisateur-établissement, vérifie les permissions par tenant, retourne les établissements autorisés.
- AuthController : endpoints d’authentification, connexion, et basculement d’établissement.
- RequirePermissionGuard : vérifie les permissions au niveau de l’utilisateur pour l’établissement courant.
- DTOs : LoginDTO et SwitchEtablissementDTO pour valider les entrées.
- Entités Utilisateur et UtilisateurEtablissement : modèles de base de données.
- Frontend : EtablissementSelector, useAuth, API client pour sélectionner et persister le contexte tenant.

**Sources de section**
- [backend/src/modules/utilisateurs/entities/utilisateur-etablissement.entity.ts](file://backend/src/modules/utilisateurs/entities/utilisateur-etablissement.entity.ts)
- [backend/src/modules/auth/middlewares/tenant.middleware.ts](file://backend/src/modules/auth/middlewares/tenant.middleware.ts)
- [backend/src/modules/auth/services/utilisateur-etablissement.service.ts](file://backend/src/modules/auth/services/utilisateur-etablissement.service.ts)
- [backend/src/modules/auth/controllers/auth.controller.ts](file://backend/src/modules/auth/controllers/auth.controller.ts)
- [backend/src/modules/auth/guards/require-permission.guard.ts](file://backend/src/modules/auth/guards/require-permission.guard.ts)
- [backend/src/modules/auth/dto/login.dto.ts](file://backend/src/modules/auth/dto/login.dto.ts)
- [backend/src/modules/auth/dto/switch-etablissement.dto.ts](file://backend/src/modules/auth/dto/switch-etablissement.dto.ts)
- [backend/src/modules/utilisateurs/entities/utilisateur.entity.ts](file://backend/src/modules/utilisateurs/entities/utilisateur.entity.ts)
- [frontend/src/features/auth/components/EtablissementSelector.tsx](file://frontend/src/features/auth/components/EtablissementSelector.tsx)
- [frontend/src/hooks/useAuth.ts](file://frontend/src/hooks/useAuth.ts)
- [frontend/src/lib/api.ts](file://frontend/src/lib/api.ts)

## Vue d'ensemble de l'architecture
Le flux d’authentification multi-tenant suit ces étapes :
- Connexion utilisateur via AuthController.
- Validation des identifiants et génération du token JWT incluant l’identité utilisateur.
- Sélection ou définition de l’établissement courant via le middleware tenant.
- Vérification des permissions par établissement via RequirePermissionGuard.
- Filtrage des données par établissement à chaque requête.

```mermaid
sequenceDiagram
participant FE as "Frontend"
participant API as "AuthController"
participant Svc as "UtilisateurEtablissementService"
participant MW as "TenantMiddleware"
participant GU as "RequirePermissionGuard"
participant DB as "Base de données"
FE->>API : "POST /auth/login"
API->>DB : "Vérifier identifiants"
DB-->>API : "Utilisateur trouvé"
API-->>FE : "JWT + liste établissements autorisés"
FE->>API : "GET /auth/me?etablissementId=..."
API->>MW : "Injecter contexte tenant"
MW->>DB : "Valider appartenance utilisateur -> établissement"
DB-->>MW : "OK"
API->>GU : "Vérifier permissions par tenant"
GU->>DB : "Lire permissions utilisateur-établissement"
DB-->>GU : "Permissions OK"
API-->>FE : "Données scoping par etablissementId"
```

**Sources du diagramme**
- [backend/src/modules/auth/controllers/auth.controller.ts](file://backend/src/modules/auth/controllers/auth.controller.ts)
- [backend/src/modules/auth/middlewares/tenant.middleware.ts](file://backend/src/modules/auth/middlewares/tenant.middleware.ts)
- [backend/src/modules/auth/guards/require-permission.guard.ts](file://backend/src/modules/auth/guards/require-permission.guard.ts)
- [backend/src/modules/auth/services/utilisateur-etablissement.service.ts](file://backend/src/modules/auth/services/utilisateur-etablissement.service.ts)

## Analyse détaillée des composants

### Entités et schéma multi-tenant
- Utilisateur : identité globale de l’utilisateur.
- UtilisateurEtablissement : relation liant un utilisateur à un établissement, avec rôle et permissions spécifiques au tenant.
- Migrations : ajout de champs et index pour supporter le multi-tenant, préférences utilisateur par établissement, et limites maximales d’établissements.

```mermaid
erDiagram
UTILISATEUR {
uuid id PK
string email UK
string username UK
timestamp created_at
timestamp updated_at
}
ETABLISSEMENT {
uuid id PK
string nom
string code
timestamp created_at
timestamp updated_at
}
UTILISATEUR_ETABLISSEMENT {
uuid id PK
uuid utilisateur_id FK
uuid etablissement_id FK
string role
jsonb permissions
timestamp created_at
timestamp updated_at
}
UTILISATEUR ||--o{ UTILISATEUR_ETABLISSEMENT : "a plusieurs"
ETABLISSEMENT ||--o{ UTILISATEUR_ETABLISSEMENT : "a plusieurs"
```

**Sources du diagramme**
- [backend/src/modules/utilisateurs/entities/utilisateur.entity.ts](file://backend/src/modules/utilisateurs/entities/utilisateur.entity.ts)
- [backend/src/modules/utilisateurs/entities/utilisateur-etablissement.entity.ts](file://backend/src/modules/utilisateurs/entities/utilisateur-etablissement.entity.ts)
- [backend/database/migrations/050-multi-tenant-v3-max-etablissements.sql](file://backend/database/migrations/050-multi-tenant-v3-max-etablissements.sql)
- [backend/database/migrations/080-preferences-utilisateur-multi-tenant.sql](file://backend/database/migrations/080-preferences-utilisateur-multi-tenant.sql)

**Sources de section**
- [backend/src/modules/utilisateurs/entities/utilisateur.entity.ts](file://backend/src/modules/utilisateurs/entities/utilisateur.entity.ts)
- [backend/src/modules/utilisateurs/entities/utilisateur-etablissement.entity.ts](file://backend/src/modules/utilisateurs/entities/utilisateur-etablissement.entity.ts)
- [backend/database/migrations/050-multi-tenant-v3-max-etablissements.sql](file://backend/database/migrations/050-multi-tenant-v3-max-etablissements.sql)
- [backend/database/migrations/080-preferences-utilisateur-multi-tenant.sql](file://backend/database/migrations/080-preferences-utilisateur-multi-tenant.sql)

### Middleware tenant
- Injecte l’ID d’établissement dans la requête.
- Valide que l’utilisateur authentifié a bien accès à cet établissement.
- Applique automatiquement le filtre d’isolation sur les requêtes suivantes.

```mermaid
flowchart TD
Start(["Requête reçue"]) --> CheckHeader["Extraire etablissementId de la requête"]
CheckHeader --> ValidateUser{"L'utilisateur est-il authentifié?"}
ValidateUser --> |Non| Deny["Accès refusé (401)"]
ValidateUser --> |Oui| CheckAccess{"L'utilisateur a-t-il accès à l'établissement?"}
CheckAccess --> |Non| DenyAccess["Accès refusé (403)"]
CheckAccess --> |Oui| InjectCtx["Injecter contexte tenant dans req"]
InjectCtx --> Next["Passer au contrôleur/guard suivant"]
Deny --> End(["Fin"])
DenyAccess --> End
Next --> End
```

**Sources du diagramme**
- [backend/src/modules/auth/middlewares/tenant.middleware.ts](file://backend/src/modules/auth/middlewares/tenant.middleware.ts)

**Sources de section**
- [backend/src/modules/auth/middlewares/tenant.middleware.ts](file://backend/src/modules/auth/middlewares/tenant.middleware.ts)

### Service UtilisateurEtablissement
- Gère la relation utilisateur-établissement.
- Retourne la liste des établissements autorisés pour un utilisateur.
- Vérifie les permissions par établissement.
- Supporte les préférences utilisateur par tenant.

```mermaid
classDiagram
class UtilisateurEtablissementService {
+getAutorisedEtablissements(userId) Promise~Etablissement[]~
+hasAccessToEtablissement(userId, etablissementId) Promise~boolean~
+getUserPreferencesByEtablissement(userId, etablissementId) Promise~jsonb~
+setUserDefaultEtablissement(userId, etablissementId) Promise~void~
}
class UtilisateurEntity {
+id : uuid
+email : string
+username : string
}
class UtilisateurEtablissementEntity {
+id : uuid
+utilisateur_id : uuid
+etablissement_id : uuid
+role : string
+permissions : jsonb
}
UtilisateurEtablissementService --> UtilisateurEntity : "lit"
UtilisateurEtablissementService --> UtilisateurEtablissementEntity : "lit/écrit"
```

**Sources du diagramme**
- [backend/src/modules/auth/services/utilisateur-etablissement.service.ts](file://backend/src/modules/auth/services/utilisateur-etablissement.service.ts)
- [backend/src/modules/utilisateurs/entities/utilisateur.entity.ts](file://backend/src/modules/utilisateurs/entities/utilisateur.entity.ts)
- [backend/src/modules/utilisateurs/entities/utilisateur-etablissement.entity.ts](file://backend/src/modules/utilisateurs/entities/utilisateur-etablissement.entity.ts)

**Sources de section**
- [backend/src/modules/auth/services/utilisateur-etablissement.service.ts](file://backend/src/modules/auth/services/utilisateur-etablissement.service.ts)
- [backend/src/modules/utilisateurs/entities/utilisateur.entity.ts](file://backend/src/modules/utilisateurs/entities/utilisateur.entity.ts)
- [backend/src/modules/utilisateurs/entities/utilisateur-etablissement.entity.ts](file://backend/src/modules/utilisateurs/entities/utilisateur-etablissement.entity.ts)

### Contrôleur d’authentification et DTOs
- Endpoint de connexion : valide les identifiants, retourne le JWT et la liste des établissements autorisés.
- Endpoint de changement d’établissement : met à jour le contexte tenant et persiste les préférences.
- DTOs : LoginDTO et SwitchEtablissementDTO pour valider les entrées.

```mermaid
sequenceDiagram
participant FE as "Frontend"
participant Ctl as "AuthController"
participant Svc as "UtilisateurEtablissementService"
participant DB as "Base de données"
FE->>Ctl : "POST /auth/login {email, password}"
Ctl->>DB : "Authentifier utilisateur"
DB-->>Ctl : "Utilisateur OK"
Ctl->>Svc : "getAutorisedEtablissements(userId)"
Svc-->>Ctl : "Liste établissements"
Ctl-->>FE : "{jwt, etablissements}"
FE->>Ctl : "POST /auth/switch-etablissement {etablissementId}"
Ctl->>Svc : "setUserDefaultEtablissement(userId, etablissementId)"
Svc-->>Ctl : "OK"
Ctl-->>FE : "{contexte mis à jour}"
```

**Sources du diagramme**
- [backend/src/modules/auth/controllers/auth.controller.ts](file://backend/src/modules/auth/controllers/auth.controller.ts)
- [backend/src/modules/auth/dto/login.dto.ts](file://backend/src/modules/auth/dto/login.dto.ts)
- [backend/src/modules/auth/dto/switch-etablissement.dto.ts](file://backend/src/modules/auth/dto/switch-etablissement.dto.ts)
- [backend/src/modules/auth/services/utilisateur-etablissement.service.ts](file://backend/src/modules/auth/services/utilisateur-etablissement.service.ts)

**Sources de section**
- [backend/src/modules/auth/controllers/auth.controller.ts](file://backend/src/modules/auth/controllers/auth.controller.ts)
- [backend/src/modules/auth/dto/login.dto.ts](file://backend/src/modules/auth/dto/login.dto.ts)
- [backend/src/modules/auth/dto/switch-etablissement.dto.ts](file://backend/src/modules/auth/dto/switch-etablissement.dto.ts)
- [backend/src/modules/auth/services/utilisateur-etablissement.service.ts](file://backend/src/modules/auth/services/utilisateur-etablissement.service.ts)

### Garde RequirePermission
- Vérifie que l’utilisateur possède les permissions nécessaires pour l’établissement courant.
- Bloque l’accès si les permissions sont insuffisantes.

```mermaid
flowchart TD
Start(["Entrée guard"]) --> ReadCtx["Lire userId et etablissementId"]
ReadCtx --> LoadPerms["Charger permissions utilisateur-établissement"]
LoadPerms --> CheckPerm{"Permission requise présente?"}
CheckPerm --> |Non| Deny["Accès refusé (403)"]
CheckPerm --> |Oui| Allow["Accès autorisé"]
Deny --> End(["Fin"])
Allow --> End
```

**Sources du diagramme**
- [backend/src/modules/auth/guards/require-permission.guard.ts](file://backend/src/modules/auth/guards/require-permission.guard.ts)

**Sources de section**
- [backend/src/modules/auth/guards/require-permission.guard.ts](file://backend/src/modules/auth/guards/require-permission.guard.ts)

### Intégration Frontend (Sélecteur d’établissement)
- EtablissementSelector : UI permettant à l’utilisateur de choisir son établissement.
- useAuth : hook qui expose l’état d’authentification et le contexte tenant.
- API client : appels pour login, switch d’établissement, et récupération des établissements autorisés.

```mermaid
sequenceDiagram
participant UI as "EtablissementSelector"
participant Hook as "useAuth"
participant API as "API Client"
participant BE as "AuthController"
UI->>Hook : "Demander établissements autorisés"
Hook->>API : "GET /auth/me"
API->>BE : "GET /auth/me"
BE-->>API : "Liste établissements"
API-->>Hook : "Réponse"
Hook-->>UI : "Afficher sélecteur"
UI->>Hook : "Choisir un établissement"
Hook->>API : "POST /auth/switch-etablissement"
API->>BE : "POST /auth/switch-etablissement"
BE-->>API : "Contexte mis à jour"
API-->>Hook : "Confirmation"
Hook-->>UI : "Mettre à jour l'état local"
```

**Sources du diagramme**
- [frontend/src/features/auth/components/EtablissementSelector.tsx](file://frontend/src/features/auth/components/EtablissementSelector.tsx)
- [frontend/src/hooks/useAuth.ts](file://frontend/src/hooks/useAuth.ts)
- [frontend/src/lib/api.ts](file://frontend/src/lib/api.ts)
- [backend/src/modules/auth/controllers/auth.controller.ts](file://backend/src/modules/auth/controllers/auth.controller.ts)

**Sources de section**
- [frontend/src/features/auth/components/EtablissementSelector.tsx](file://frontend/src/features/auth/components/EtablissementSelector.tsx)
- [frontend/src/hooks/useAuth.ts](file://frontend/src/hooks/useAuth.ts)
- [frontend/src/lib/api.ts](file://frontend/src/lib/api.ts)
- [backend/src/modules/auth/controllers/auth.controller.ts](file://backend/src/modules/auth/controllers/auth.controller.ts)

## Analyse des dépendances
Les composants interagissent selon les dépendances suivantes :
- AuthController dépend de UtilisateurEtablissementService et des DTOs.
- TenantMiddleware dépend de la validation de l’utilisateur et de la relation UtilisateurEtablissement.
- RequirePermissionGuard dépend de UtilisateurEtablissement pour vérifier les permissions.
- Frontend dépend de API client et du hook useAuth pour interagir avec le backend.

```mermaid
graph LR
FE["Frontend"] --> API["API Client"]
API --> Ctl["AuthController"]
Ctl --> Svc["UtilisateurEtablissementService"]
Ctl --> MW["TenantMiddleware"]
Ctl --> Guard["RequirePermissionGuard"]
Svc --> UE["UtilisateurEtablissementEntity"]
Svc --> U["UtilisateurEntity"]
UE --> DB["Base de données"]
U --> DB
```

**Sources du diagramme**
- [frontend/src/lib/api.ts](file://frontend/src/lib/api.ts)
- [backend/src/modules/auth/controllers/auth.controller.ts](file://backend/src/modules/auth/controllers/auth.controller.ts)
- [backend/src/modules/auth/services/utilisateur-etablissement.service.ts](file://backend/src/modules/auth/services/utilisateur-etablissement.service.ts)
- [backend/src/modules/auth/middlewares/tenant.middleware.ts](file://backend/src/modules/auth/middlewares/tenant.middleware.ts)
- [backend/src/modules/auth/guards/require-permission.guard.ts](file://backend/src/modules/auth/guards/require-permission.guard.ts)
- [backend/src/modules/utilisateurs/entities/utilisateur.entity.ts](file://backend/src/modules/utilisateurs/entities/utilisateur.entity.ts)
- [backend/src/modules/utilisateurs/entities/utilisateur-etablissement.entity.ts](file://backend/src/modules/utilisateurs/entities/utilisateur-etablissement.entity.ts)

**Sources de section**
- [backend/src/modules/auth/controllers/auth.controller.ts](file://backend/src/modules/auth/controllers/auth.controller.ts)
- [backend/src/modules/auth/services/utilisateur-etablissement.service.ts](file://backend/src/modules/auth/services/utilisateur-etablissement.service.ts)
- [backend/src/modules/auth/middlewares/tenant.middleware.ts](file://backend/src/modules/auth/middlewares/tenant.middleware.ts)
- [backend/src/modules/auth/guards/require-permission.guard.ts](file://backend/src/modules/auth/guards/require-permission.guard.ts)
- [backend/src/modules/utilisateurs/entities/utilisateur.entity.ts](file://backend/src/modules/utilisateurs/entities/utilisateur.entity.ts)
- [backend/src/modules/utilisateurs/entities/utilisateur-etablissement.entity.ts](file://backend/src/modules/utilisateurs/entities/utilisateur-etablissement.entity.ts)
- [frontend/src/lib/api.ts](file://frontend/src/lib/api.ts)

## Considérations de performance
- Indexation : s’assurer que les jointures UtilisateurEtablissement sont optimisées (clé étrangère et index composite si nécessaire).
- Préférences par tenant : stocker les préférences utilisateur par établissement pour éviter des calculs répétés.
- Cache : envisager un cache léger pour la liste des établissements autorisés par utilisateur.
- Limites : utiliser les migrations de limite maximale d’établissements pour contrôler la charge.

[Pas de sources nécessaires car cette section fournit des conseils généraux]

## Guide de dépannage
- Erreur 401 lors de la connexion : vérifier les identifiants et la configuration JWT.
- Erreur 403 lors de l’accès à un établissement : vérifier la relation UtilisateurEtablissement et les permissions.
- Problèmes de filtrage des données : s’assurer que le middleware tenant injecte correctement l’ID d’établissement.
- Tests d’intégration : utiliser les tests existants pour valider le comportement multi-tenant.

**Sources de section**
- [backend/test/integration/auth-multi-etablissement.spec.ts](file://backend/test/integration/auth-multi-etablissement.spec.ts)
- [backend/test/multi-tenant-isolation.test.ts](file://backend/test/multi-tenant-isolation.test.ts)

## Conclusion
Le système d’authentification multi-tenant d’eLISAschool repose sur une relation claire entre utilisateurs et établissements, un middleware tenant robuste, et des garde de permissions stricts. Cette architecture permet une isolation forte des données, une expérience utilisateur fluide pour le changement d’établissement, et une scalabilité adaptée aux environnements multi-établissements.

[Pas de sources nécessaires car cette section résume sans analyser de fichiers spécifiques]

## Annexes
- Exemples de configuration multi-tenant : définir les préférences utilisateur par établissement et les limites d’établissements.
- Règles d’accès par établissement : permissions granulaires par rôle et par tenant.
- Cas d’usage courants : administration centrale, enseignants accédant à plusieurs établissements, parents avec accès limité.

[Pas de sources nécessaires car cette section propose des exemples conceptuels]