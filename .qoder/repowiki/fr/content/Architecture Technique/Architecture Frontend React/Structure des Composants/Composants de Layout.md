# Composants de Layout

<cite>
**Fichiers référencés dans ce document**
- [App.tsx](file://frontend/src/App.tsx)
- [main.tsx](file://frontend/src/main.tsx)
- [routeTree.gen.ts](file://frontend/src/routeTree.gen.ts)
- [Header.tsx](file://frontend/src/components/layout/Header.tsx)
- [Sidebar.tsx](file://frontend/src/components/layout/Sidebar.tsx)
- [PageLayout.tsx](file://frontend/src/components/layout/PageLayout.tsx)
- [ResponsiveContainer.tsx](file://frontend/src/components/layout/ResponsiveContainer.tsx)
- [theme.ts](file://frontend/src/lib/theme.ts)
- [useBreakpoints.ts](file://frontend/src/hooks/useBreakpoints.ts)
- [useLoadingState.ts](file://frontend/src/hooks/useLoadingState.ts)
- [routes.ts](file://frontend/src/routes/routes.ts)
</cite>

## Table des matières
1. [Introduction](#introduction)
2. [Structure du projet](#structure-du-projet)
3. [Composants principaux](#composants-principaux)
4. [Architecture globale du layout](#architecture-globale-du-layout)
5. [Analyse détaillée des composants](#analyse-détaillée-des-composants)
6. [Système de navigation et routing](#système-de-navigation-et-routing)
7. [Design responsive et breakpoints](#design-responsive-et-breakpoints)
8. [Gestion du contenu dynamique](#gestion-du-contenu-dynamique)
9. [Création de pages personnalisées](#création-de-pages-personnalisées)
10. [Personnalisation du thème](#personnalisation-du-thème)
11. [Analyse des dépendances](#analyse-des-dépendances)
12. [Considérations de performance](#considérations-de-performance)
13. [Guide de dépannage](#guide-de-dépannage)
14. [Conclusion](#conclusion)

## Introduction

Ce document présente l'architecture et les composants de layout d'eLISAschool, centrés sur Header, Sidebar et PageLayout. Il explique le système de navigation avec TanStack Router, le design responsive, la gestion du contenu dynamique, ainsi que les bonnes pratiques pour les layouts complexes.

## Structure du projet

Le frontend est organisé en modules fonctionnels :
- Entrée de l'application et configuration du router
- Composants de layout (Header, Sidebar, PageLayout)
- Hooks utilitaires (breakpoints, chargement)
- Thème et styles globaux
- Routes et pages

```mermaid
graph TB
A["main.tsx"] --> B["App.tsx"]
B --> C["TanStack Router"]
C --> D["PageLayout.tsx"]
D --> E["Header.tsx"]
D --> F["Sidebar.tsx"]
D --> G["Contenu principal"]
H["theme.ts"] --> D
I["useBreakpoints.ts"] --> D
J["useLoadingState.ts"] --> D
```

**Diagramme sources**
- [main.tsx:1-50](file://frontend/src/main.tsx#L1-L50)
- [App.tsx:1-100](file://frontend/src/App.tsx#L1-L100)
- [PageLayout.tsx:1-150](file://frontend/src/components/layout/PageLayout.tsx#L1-L150)

**Section sources**
- [main.tsx:1-50](file://frontend/src/main.tsx#L1-L50)
- [App.tsx:1-100](file://frontend/src/App.tsx#L1-L100)

## Composants principaux

### Header
Composant d'en-tête contenant la barre de navigation principale, les informations utilisateur et les actions globales.

### Sidebar
Menu latéral avec navigation hiérarchique, accès aux modules et filtres contextuels.

### PageLayout
Composant wrapper qui orchestre Header, Sidebar et le contenu principal avec gestion du responsive.

**Section sources**
- [Header.tsx:1-200](file://frontend/src/components/layout/Header.tsx#L1-L200)
- [Sidebar.tsx:1-250](file://frontend/src/components/layout/Sidebar.tsx#L1-L250)
- [PageLayout.tsx:1-200](file://frontend/src/components/layout/PageLayout.tsx#L1-L200)

## Architecture globale du layout

L'architecture suit un pattern composite où PageLayout agit comme conteneur principal, intégrant Header et Sidebar de manière flexible.

```mermaid
classDiagram
class App {
+RouterProvider
+ThemeProvider
+LayoutWrapper
}
class PageLayout {
+header : ReactNode
+sidebar : ReactNode
+content : ReactNode
+isMobile : boolean
+toggleSidebar()
+setActiveRoute(route)
}
class Header {
+user : User
+notifications : Notification[]
+handleLogout()
+handleNotificationClick(id)
}
class Sidebar {
+menuItems : MenuItem[]
+activeRoute : string
+collapsed : boolean
+toggleCollapse()
+navigateTo(route)
}
App --> PageLayout : "utilise"
PageLayout --> Header : "contient"
PageLayout --> Sidebar : "contient"
Header --> App : "dépend"
Sidebar --> App : "dépend"
```

**Diagramme sources**
- [App.tsx:1-100](file://frontend/src/App.tsx#L1-L100)
- [PageLayout.tsx:1-200](file://frontend/src/components/layout/PageLayout.tsx#L1-L200)
- [Header.tsx:1-200](file://frontend/src/components/layout/Header.tsx#L1-L200)
- [Sidebar.tsx:1-250](file://frontend/src/components/layout/Sidebar.tsx#L1-L250)

## Analyse détaillée des composants

### PageLayout - Orchestrateur principal

PageLayout gère la disposition générale et la communication entre les composants enfants.

```mermaid
flowchart TD
Start["Montage PageLayout"] --> CheckMobile["Vérifier taille écran"]
CheckMobile --> Mobile{"Mobile?"}
Mobile --> |Oui| ShowMobileHeader["Afficher header mobile"]
Mobile --> |Non| ShowDesktopHeader["Afficher header desktop"]
ShowMobileHeader --> CheckSidebar["Vérifier état sidebar"]
ShowDesktopHeader --> CheckSidebar
CheckSidebar --> SidebarVisible{"Sidebar visible?"}
SidebarVisible --> |Oui| RenderSidebar["Rendre sidebar"]
SidebarVisible --> |Non| RenderContent["Rendre contenu uniquement"]
RenderSidebar --> RenderContent
RenderContent --> End["Composant monté"]
```

**Diagramme sources**
- [PageLayout.tsx:1-200](file://frontend/src/components/layout/PageLayout.tsx#L1-L200)

**Section sources**
- [PageLayout.tsx:1-200](file://frontend/src/components/layout/PageLayout.tsx#L1-L200)

### Header - Interface utilisateur supérieure

Le Header fournit des fonctionnalités de navigation, notifications et gestion de session.

```mermaid
sequenceDiagram
participant User as Utilisateur
participant Header as Header Component
participant Auth as Service Auth
participant Router as TanStack Router
User->>Header : Clic sur profil
Header->>Header : Ouvrir menu dropdown
User->>Header : Sélectionner "Déconnexion"
Header->>Auth : logout()
Auth-->>Header : Succès
Header->>Router : navigate('/login')
Router-->>User : Redirection vers login
```

**Diagramme sources**
- [Header.tsx:1-200](file://frontend/src/components/layout/Header.tsx#L1-L200)
- [routes.ts:1-100](file://frontend/src/routes/routes.ts#L1-L100)

**Section sources**
- [Header.tsx:1-200](file://frontend/src/components/layout/Header.tsx#L1-L200)

### Sidebar - Navigation hiérarchique

La Sidebar offre une navigation structurée par modules et permissions.

```mermaid
classDiagram
class MenuItem {
+id : string
+label : string
+path : string
+icon : string
+children : MenuItem[]
+permissions : string[]
+isVisible() : boolean
}
class Sidebar {
+menuItems : MenuItem[]
+activeRoute : string
+collapsed : boolean
+searchQuery : string
+filterMenuItems(query) : MenuItem[]
+handleRouteChange(path)
+toggleCollapse()
}
Sidebar --> MenuItem : "contient plusieurs"
```

**Diagramme sources**
- [Sidebar.tsx:1-250](file://frontend/src/components/layout/Sidebar.tsx#L1-L250)

**Section sources**
- [Sidebar.tsx:1-250](file://frontend/src/components/layout/Sidebar.tsx#L1-L250)

## Système de navigation et routing

Le système utilise TanStack Router pour une navigation déclarative et performante.

```mermaid
graph LR
A["Route Root"] --> B["Dashboard"]
A --> C["Académique"]
A --> D["Finances"]
A --> E["RH"]
A --> F["Administration"]
B --> B1["Vue d'ensemble"]
B --> B2["Statistiques"]
C --> C1["Élèves"]
C --> C2["Enseignants"]
C --> C3["Classes"]
D --> D1["Facturation"]
D --> D2["Paiements"]
D --> D3["Rapports"]
```

**Diagramme sources**
- [routeTree.gen.ts:1-200](file://frontend/src/routeTree.gen.ts#L1-L200)
- [routes.ts:1-100](file://frontend/src/routes/routes.ts#L1-L100)

**Section sources**
- [routeTree.gen.ts:1-200](file://frontend/src/routeTree.gen.ts#L1-L200)
- [routes.ts:1-100](file://frontend/src/routes/routes.ts#L1-L100)

## Design responsive et breakpoints

Le système responsive utilise des breakpoints standardisés et des hooks React pour adapter le comportement.

```mermaid
stateDiagram-v2
[*] --> Desktop
Desktop --> Tablet : window.innerWidth < 1024px
Tablet --> Mobile : window.innerWidth < 768px
Mobile --> Tablet : window.innerWidth > 768px
Tablet --> Desktop : window.innerWidth > 1024px
note right of Mobile : Sidebar caché<br/>Header compact<br/>Navigation hamburger
note right of Tablet : Sidebar réduit<br/>Grille adaptative
note right of Desktop : Sidebar complet<br/>Layout traditionnel
```

**Diagramme sources**
- [useBreakpoints.ts:1-100](file://frontend/src/hooks/useBreakpoints.ts#L1-L100)
- [ResponsiveContainer.tsx:1-150](file://frontend/src/components/layout/ResponsiveContainer.tsx#L1-L150)

**Section sources**
- [useBreakpoints.ts:1-100](file://frontend/src/hooks/useBreakpoints.ts#L1-L100)
- [ResponsiveContainer.tsx:1-150](file://frontend/src/components/layout/ResponsiveContainer.tsx#L1-L150)

## Gestion du contenu dynamique

Le chargement et le traitement du contenu sont gérés via des hooks personnalisés et des états locaux.

```mermaid
flowchart TD
LoadData["Chargement des données"] --> Loading{"Données chargées?"}
Loading --> |Non| ShowSpinner["Afficher spinner"]
Loading --> |Oui| ProcessData["Traiter les données"]
ProcessData --> Validate{"Validation OK?"}
Validate --> |Non| ShowError["Afficher erreur"]
Validate --> |Oui| RenderContent["Rendre le contenu"]
ShowSpinner --> Polling["Polling toutes les 30s"]
Polling --> Loading
ShowError --> Retry["Bouton réessayer"]
Retry --> LoadData
RenderContent --> Success["État succès"]
```

**Diagramme sources**
- [useLoadingState.ts:1-150](file://frontend/src/hooks/useLoadingState.ts#L1-L150)
- [PageLayout.tsx:1-200](file://frontend/src/components/layout/PageLayout.tsx#L1-L200)

**Section sources**
- [useLoadingState.ts:1-150](file://frontend/src/hooks/useLoadingState.ts#L1-L150)

## Création de pages personnalisées

Pour créer une nouvelle page dans eLISAschool, suivez ces étapes :

1. **Créer le composant de page**
2. **Définir la route dans le routeTree**
3. **Intégrer avec PageLayout**
4. **Ajouter au menu de navigation**

```mermaid
sequenceDiagram
participant Dev as Développeur
participant FileSys as Système de fichiers
participant Router as TanStack Router
participant UI as Interface Utilisateur
Dev->>FileSys : Créer NewPage.tsx
Dev->>FileSys : Ajouter route dans routeTree.gen.ts
FileSys-->>Dev : Fichier créé
Dev->>Router : Configurer la route
Router-->>UI : Route disponible
UI-->>Dev : Page accessible
```

**Diagramme sources**
- [routes.ts:1-100](file://frontend/src/routes/routes.ts#L1-L100)
- [routeTree.gen.ts:1-200](file://frontend/src/routeTree.gen.ts#L1-L200)

**Section sources**
- [routes.ts:1-100](file://frontend/src/routes/routes.ts#L1-L100)
- [routeTree.gen.ts:1-200](file://frontend/src/routeTree.gen.ts#L1-L200)

## Personnalisation du thème

Le système de thème permet une personnalisation complète de l'apparence.

```mermaid
classDiagram
class ThemeConfig {
+colors : ColorPalette
+typography : TypographyConfig
+spacing : SpacingConfig
+breakpoints : BreakpointConfig
+components : ComponentStyles
+applyTheme(theme) : void
+getTheme() : Theme
}
class ColorPalette {
+primary : string
+secondary : string
+success : string
+warning : string
+error : string
+background : string
+text : string
}
class TypographyConfig {
+fonts : FontConfig
+sizes : SizeConfig
+weights : WeightConfig
}
ThemeConfig --> ColorPalette : "utilise"
ThemeConfig --> TypographyConfig : "utilise"
```

**Diagramme sources**
- [theme.ts:1-200](file://frontend/src/lib/theme.ts#L1-L200)

**Section sources**
- [theme.ts:1-200](file://frontend/src/lib/theme.ts#L1-L200)

## Analyse des dépendances

Les composants de layout ont des dépendances bien définies pour une architecture modulaire.

```mermaid
graph TB
subgraph "Core Dependencies"
A["React"]
B["TanStack Router"]
C["Tailwind CSS"]
D["Recharts"]
end
subgraph "Layout Components"
E["PageLayout.tsx"]
F["Header.tsx"]
G["Sidebar.tsx"]
end
subgraph "Utilities"
H["useBreakpoints.ts"]
I["useLoadingState.ts"]
J["theme.ts"]
end
A --> E
B --> E
C --> E
D --> E
E --> F
E --> G
E --> H
E --> I
E --> J
F --> A
G --> A
```

**Diagramme sources**
- [PageLayout.tsx:1-200](file://frontend/src/components/layout/PageLayout.tsx#L1-L200)
- [Header.tsx:1-200](file://frontend/src/components/layout/Header.tsx#L1-L200)
- [Sidebar.tsx:1-250](file://frontend/src/components/layout/Sidebar.tsx#L1-L250)

**Section sources**
- [PageLayout.tsx:1-200](file://frontend/src/components/layout/PageLayout.tsx#L1-L200)
- [Header.tsx:1-200](file://frontend/src/components/layout/Header.tsx#L1-L200)
- [Sidebar.tsx:1-250](file://frontend/src/components/layout/Sidebar.tsx#L1-L250)

## Considérations de performance

Optimisations clés pour les layouts complexes :

- **Mémoïsation** : Utilisation de React.memo pour les composants statiques
- **Lazy loading** : Chargement différé des routes et composants lourds
- **Virtualisation** : Rendu virtuel pour les listes volumineuses
- **Debouncing** : Événements fréquents (scroll, resize)
- **Memoization** : useMemo et useCallback pour les calculs intensifs

## Guide de dépannage

Problèmes courants et solutions :

### Sidebar ne s'affiche pas correctement
- Vérifier les props de width et breakpoint
- Contrôler les styles Tailwind appliqués
- Valider les permissions de navigation

### Navigation ne fonctionne pas
- Vérifier la configuration du router
- Contrôler les chemins de routes
- Valider les guards d'authentification

### Problèmes de responsive
- Vérifier les media queries
- Contrôler les breakpoints personnalisés
- Tester sur différents appareils

**Section sources**
- [PageLayout.tsx:1-200](file://frontend/src/components/layout/PageLayout.tsx#L1-L200)
- [useBreakpoints.ts:1-100](file://frontend/src/hooks/useBreakpoints.ts#L1-L100)

## Conclusion

L'architecture de layout d'eLISAschool offre une base solide et extensible pour développer des interfaces utilisateur complexes. La séparation claire des responsabilités, le design responsive intégré et l'intégration avec TanStack Router permettent de créer des applications éducatives performantes et maintenables.

Les bonnes pratiques recommandées incluent :
- Structuration modulaire des composants
- Gestion centralisée du thème
- Validation rigoureuse des permissions
- Optimisation continue des performances
- Documentation exhaustive des APIs internes