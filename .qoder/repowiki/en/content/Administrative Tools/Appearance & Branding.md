# Appearance & Branding

<cite>
**Referenced Files in This Document**
- [081-module-apparence-fonds.sql](file://backend/database/migrations/081-module-apparence-fonds.sql)
- [050-etablissements-couleurs.sql](file://backend/database/migrations/050-etablissements-couleurs.sql)
- [apparence.controller.ts](file://backend/src/modules/apparence/controllers/apparence.controller.ts)
- [apparence.service.ts](file://backend/src/modules/apparence/services/apparence.service.ts)
- [apparence.entity.ts](file://backend/src/modules/apparence/entities/apparence.entity.ts)
- [apparence.module.ts](file://backend/src/modules/apparence/apparence.module.ts)
- [route-registry.ts](file://backend/src/routes/route-registry.ts)
- [App.tsx](file://frontend/src/App.tsx)
- [theme-provider.tsx](file://frontend/src/components/ui/theme-provider.tsx)
- [background-rotator.tsx](file://frontend/src/features/apparence/background-rotator.tsx)
- [logo-manager.tsx](file://frontend/src/features/apparence/logo-manager.tsx)
- [brand-settings.tsx](file://frontend/src/features/apparence/brand-settings.tsx)
- [css-variables.css](file://frontend/src/styles/css-variables.css)
- [responsive-mixins.scss](file://frontend/src/styles/responsive-mixins.scss)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)
10. [Appendices](#appendices)

## Introduction
This document explains eLISAschool’s appearance and branding customization system. It covers theme management (color schemes, typography, layout variations), background image rotation, logo management, institutional branding, per-institution settings, global configuration, responsive design adaptations, CSS variables, component styling overrides, mobile-responsive patterns, theme inheritance and fallbacks, and accessibility compliance.

## Project Structure
The appearance and branding feature spans backend modules for persistence and API, frontend components for UI and runtime theming, and stylesheets for CSS variables and responsive utilities.

```mermaid
graph TB
subgraph "Backend"
A["apparence.controller.ts"]
B["apparence.service.ts"]
C["apparence.entity.ts"]
D["apparence.module.ts"]
E["route-registry.ts"]
F["081-module-apparence-fonds.sql"]
G["050-etablissements-couleurs.sql"]
end
subgraph "Frontend"
H["App.tsx"]
I["theme-provider.tsx"]
J["background-rotator.tsx"]
K["logo-manager.tsx"]
L["brand-settings.tsx"]
M["css-variables.css"]
N["responsive-mixins.scss"]
end
A --> B
B --> C
D --> A
E --> A
F --> C
G --> C
H --> I
I --> J
I --> K
I --> L
I --> M
I --> N
```

**Diagram sources**
- [apparence.controller.ts](file://backend/src/modules/apparence/controllers/apparence.controller.ts)
- [apparence.service.ts](file://backend/src/modules/apparence/services/apparence.service.ts)
- [apparence.entity.ts](file://backend/src/modules/apparence/entities/apparence.entity.ts)
- [apparence.module.ts](file://backend/src/modules/apparence/apparence.module.ts)
- [route-registry.ts](file://backend/src/routes/route-registry.ts)
- [081-module-apparence-fonds.sql](file://backend/database/migrations/081-module-apparence-fonds.sql)
- [050-etablissements-couleurs.sql](file://backend/database/migrations/050-etablissements-couleurs.sql)
- [App.tsx](file://frontend/src/App.tsx)
- [theme-provider.tsx](file://frontend/src/components/ui/theme-provider.tsx)
- [background-rotator.tsx](file://frontend/src/features/apparence/background-rotator.tsx)
- [logo-manager.tsx](file://frontend/src/features/apparence/logo-manager.tsx)
- [brand-settings.tsx](file://frontend/src/features/apparence/brand-settings.tsx)
- [css-variables.css](file://frontend/src/styles/css-variables.css)
- [responsive-mixins.scss](file://frontend/src/styles/responsive-mixins.scss)

**Section sources**
- [apparence.controller.ts](file://backend/src/modules/apparence/controllers/apparence.controller.ts)
- [apparence.service.ts](file://backend/src/modules/apparence/services/apparence.service.ts)
- [apparence.entity.ts](file://backend/src/modules/apparence/entities/apparence.entity.ts)
- [apparence.module.ts](file://backend/src/modules/apparence/apparence.module.ts)
- [route-registry.ts](file://backend/src/routes/route-registry.ts)
- [081-module-apparence-fonds.sql](file://backend/database/migrations/081-module-apparence-fonds.sql)
- [050-etablissements-couleurs.sql](file://backend/database/migrations/050-etablissements-couleurs.sql)
- [App.tsx](file://frontend/src/App.tsx)
- [theme-provider.tsx](file://frontend/src/components/ui/theme-provider.tsx)
- [background-rotator.tsx](file://frontend/src/features/apparence/background-rotator.tsx)
- [logo-manager.tsx](file://frontend/src/features/apparence/logo-manager.tsx)
- [brand-settings.tsx](file://frontend/src/features/apparence/brand-settings.tsx)
- [css-variables.css](file://frontend/src/styles/css-variables.css)
- [responsive-mixins.scss](file://frontend/src/styles/responsive-mixins.scss)

## Core Components
- Theme provider: Supplies theme tokens (colors, typography, spacing) via context and applies CSS variables to the DOM.
- Background rotator: Fetches institution-specific backgrounds and rotates them with safe transitions and performance controls.
- Logo manager: Uploads, previews, and persists logos per institution; provides fallbacks when assets are missing.
- Brand settings: UI for configuring colors, fonts, layouts, and other appearance preferences at global or per-institution scope.
- Backend apparence module: Exposes endpoints to read/write theme and brand data, backed by entities and migrations.

Key responsibilities:
- Centralized token application through CSS variables.
- Per-institution scoping with global defaults.
- Asset handling for logos and backgrounds.
- Responsive behavior driven by mixins and media queries.

**Section sources**
- [theme-provider.tsx](file://frontend/src/components/ui/theme-provider.tsx)
- [background-rotator.tsx](file://frontend/src/features/apparence/background-rotator.tsx)
- [logo-manager.tsx](file://frontend/src/features/apparence/logo-manager.tsx)
- [brand-settings.tsx](file://frontend/src/features/apparence/brand-settings.tsx)
- [apparence.controller.ts](file://backend/src/modules/apparence/controllers/apparence.controller.ts)
- [apparence.service.ts](file://backend/src/modules/apparence/services/apparence.service.ts)
- [apparence.entity.ts](file://backend/src/modules/apparence/entities/apparence.entity.ts)

## Architecture Overview
The system follows a layered architecture:
- Frontend theme provider injects tokens into CSS variables.
- Feature components consume tokens and manage assets.
- Backend controller/service layer persists configurations and assets metadata.
- Database schema stores color schemes, typography, layout flags, and background sets per institution.

```mermaid
sequenceDiagram
participant Admin as "Admin UI"
participant FE as "Theme Provider"
participant BE as "Apparence Controller"
participant Svc as "Apparence Service"
participant DB as "Database"
Admin->>FE : Open Brand Settings
FE->>BE : GET /api/apparence/config?etablissementId=...
BE->>Svc : fetchConfig(etablissementId)
Svc->>DB : query themes/colors/fonts/layouts
DB-->>Svc : config payload
Svc-->>BE : resolved config (institution + global fallbacks)
BE-->>FE : JSON config
FE->>FE : Apply CSS variables and state
FE->>FE : Initialize background rotator and logo manager
```

**Diagram sources**
- [apparence.controller.ts](file://backend/src/modules/apparence/controllers/apparence.controller.ts)
- [apparence.service.ts](file://backend/src/modules/apparence/services/apparence.service.ts)
- [apparence.entity.ts](file://backend/src/modules/apparence/entities/apparence.entity.ts)
- [theme-provider.tsx](file://frontend/src/components/ui/theme-provider.tsx)
- [background-rotator.tsx](file://frontend/src/features/apparence/background-rotator.tsx)
- [logo-manager.tsx](file://frontend/src/features/apparence/logo-manager.tsx)

## Detailed Component Analysis

### Theme Provider and CSS Variables
- Applies theme tokens to CSS custom properties on the root element.
- Supports light/dark modes and per-institution overrides.
- Provides hooks for components to subscribe to theme changes.

```mermaid
flowchart TD
Start(["Initialize Theme Provider"]) --> LoadGlobal["Load Global Defaults"]
LoadGlobal --> LoadInstitution["Load Institution Overrides"]
LoadInstitution --> Merge["Merge Tokens<br/>Global + Institution"]
Merge --> ApplyVars["Apply CSS Variables to Root"]
ApplyVars --> HydrateUI["Hydrate UI Components"]
HydrateUI --> End(["Ready"])
```

**Diagram sources**
- [theme-provider.tsx](file://frontend/src/components/ui/theme-provider.tsx)
- [css-variables.css](file://frontend/src/styles/css-variables.css)

**Section sources**
- [theme-provider.tsx](file://frontend/src/components/ui/theme-provider.tsx)
- [css-variables.css](file://frontend/src/styles/css-variables.css)

### Background Image Rotation System
- Fetches a list of backgrounds for the current institution.
- Rotates images with fade transitions and respects user motion preferences.
- Implements lazy loading and caching strategies to reduce bandwidth.

```mermaid
sequenceDiagram
participant Rotator as "Background Rotator"
participant FE as "Theme Provider"
participant BE as "Apparence Controller"
participant Svc as "Apparence Service"
participant DB as "Database"
Rotator->>FE : Request active backgrounds
FE->>BE : GET /api/apparence/backgrounds?etablissementId=...
BE->>Svc : getBackgrounds(etablissementId)
Svc->>DB : select backgrounds where active=true
DB-->>Svc : list of assets
Svc-->>BE : ordered list
BE-->>FE : JSON array
FE-->>Rotator : asset URLs and intervals
Rotator->>Rotator : Rotate with fade transition
```

**Diagram sources**
- [background-rotator.tsx](file://frontend/src/features/apparence/background-rotator.tsx)
- [apparence.controller.ts](file://backend/src/modules/apparence/controllers/apparence.controller.ts)
- [apparence.service.ts](file://backend/src/modules/apparence/services/apparence.service.ts)
- [081-module-apparence-fonds.sql](file://backend/database/migrations/081-module-apparence-fonds.sql)

**Section sources**
- [background-rotator.tsx](file://frontend/src/features/apparence/background-rotator.tsx)
- [081-module-apparence-fonds.sql](file://backend/database/migrations/081-module-apparence-fonds.sql)

### Logo Management
- Uploads logos per institution with validation and preview.
- Persists metadata and serves optimized variants.
- Falls back to default logo when none is configured.

```mermaid
flowchart TD
U["Upload Logo"] --> Validate["Validate File Type/Size"]
Validate --> Store["Store Asset Metadata"]
Store --> Preview["Generate Preview URL"]
Preview --> Persist["Persist to Institution Config"]
Persist --> Render["Render Logo in Header"]
Render --> Fallback{"Logo Exists?"}
Fallback --> |No| UseDefault["Use Default Logo"]
Fallback --> |Yes| ShowUploaded["Show Uploaded Logo"]
```

**Diagram sources**
- [logo-manager.tsx](file://frontend/src/features/apparence/logo-manager.tsx)
- [apparence.controller.ts](file://backend/src/modules/apparence/controllers/apparence.controller.ts)
- [apparence.service.ts](file://backend/src/modules/apparence/services/apparence.service.ts)

**Section sources**
- [logo-manager.tsx](file://frontend/src/features/apparence/logo-manager.tsx)

### Institutional Branding and Per-Institution Settings
- Stores color schemes, typography, and layout flags per institution.
- Merges with global defaults to produce final theme.
- Uses database fields introduced by migrations for colors and backgrounds.

```mermaid
erDiagram
ETABLISSEMENT {
uuid id PK
string name
jsonb appearance_config
}
THEME_GLOBAL {
uuid id PK
jsonb colors
jsonb typography
jsonb layout_flags
}
BACKGROUND_SET {
uuid id PK
uuid etablissement_id FK
jsonb assets
boolean active
}
ETABLISSEMENT ||--o{ BACKGROUND_SET : "has many"
ETABLISSEMENT }o--|| THEME_GLOBAL : "inherits from"
```

**Diagram sources**
- [050-etablissements-couleurs.sql](file://backend/database/migrations/050-etablissements-couleurs.sql)
- [081-module-apparence-fonds.sql](file://backend/database/migrations/081-module-apparence-fonds.sql)
- [apparence.entity.ts](file://backend/src/modules/apparence/entities/apparence.entity.ts)

**Section sources**
- [050-etablissements-couleurs.sql](file://backend/database/migrations/050-etablissements-couleurs.sql)
- [081-module-apparence-fonds.sql](file://backend/database/migrations/081-module-apparence-fonds.sql)
- [apparence.entity.ts](file://backend/src/modules/apparence/entities/apparence.entity.ts)

### Brand Settings UI
- Presents controls for colors, fonts, layout toggles, and background selection.
- Validates inputs and persists changes via API.
- Reflects immediate updates using theme provider.

```mermaid
sequenceDiagram
participant User as "User"
participant UI as "Brand Settings"
participant FE as "Theme Provider"
participant BE as "Apparence Controller"
participant Svc as "Apparence Service"
participant DB as "Database"
User->>UI : Update color/font/layout
UI->>UI : Validate inputs
UI->>BE : PATCH /api/apparence/config
BE->>Svc : updateConfig(data, etablissementId)
Svc->>DB : upsert appearance_config
DB-->>Svc : success
Svc-->>BE : updated config
BE-->>UI : 200 OK
UI->>FE : Dispatch theme update
FE->>FE : Apply new CSS variables
```

**Diagram sources**
- [brand-settings.tsx](file://frontend/src/features/apparence/brand-settings.tsx)
- [apparence.controller.ts](file://backend/src/modules/apparence/controllers/apparence.controller.ts)
- [apparence.service.ts](file://backend/src/modules/apparence/services/apparence.service.ts)
- [theme-provider.tsx](file://frontend/src/components/ui/theme-provider.tsx)

**Section sources**
- [brand-settings.tsx](file://frontend/src/features/apparence/brand-settings.tsx)
- [apparence.controller.ts](file://backend/src/modules/apparence/controllers/apparence.controller.ts)
- [apparence.service.ts](file://backend/src/modules/apparence/services/apparence.service.ts)
- [theme-provider.tsx](file://frontend/src/components/ui/theme-provider.tsx)

### Responsive Design Adaptations
- Mixins provide consistent breakpoints and fluid sizing.
- Components adapt layout and typography based on screen size.
- Backgrounds and logos scale appropriately across devices.

```mermaid
flowchart TD
Breakpoints["Define Breakpoints"] --> FluidSizes["Compute Fluid Sizes"]
FluidSizes --> LayoutRules["Apply Layout Rules"]
LayoutRules --> MediaQueries["Generate Media Queries"]
MediaQueries --> Components["Components Consume Tokens"]
Components --> MobileFirst["Mobile-First Rendering"]
```

**Diagram sources**
- [responsive-mixins.scss](file://frontend/src/styles/responsive-mixins.scss)
- [theme-provider.tsx](file://frontend/src/components/ui/theme-provider.tsx)

**Section sources**
- [responsive-mixins.scss](file://frontend/src/styles/responsive-mixins.scss)

## Dependency Analysis
- Controllers depend on services for business logic and data access.
- Services depend on entities and database schema defined by migrations.
- Frontend components depend on theme provider and styles.
- Route registry wires controllers to HTTP endpoints.

```mermaid
graph LR
RC["route-registry.ts"] --> AC["apparence.controller.ts"]
AC --> AS["apparence.service.ts"]
AS --> AE["apparence.entity.ts"]
AE --> M1["050-etablissements-couleurs.sql"]
AE --> M2["081-module-apparence-fonds.sql"]
TP["theme-provider.tsx"] --> BR["background-rotator.tsx"]
TP --> LM["logo-manager.tsx"]
TP --> BS["brand-settings.tsx"]
TP --> CV["css-variables.css"]
TP --> RM["responsive-mixins.scss"]
```

**Diagram sources**
- [route-registry.ts](file://backend/src/routes/route-registry.ts)
- [apparence.controller.ts](file://backend/src/modules/apparence/controllers/apparence.controller.ts)
- [apparence.service.ts](file://backend/src/modules/apparence/services/apparence.service.ts)
- [apparence.entity.ts](file://backend/src/modules/apparence/entities/apparence.entity.ts)
- [050-etablissements-couleurs.sql](file://backend/database/migrations/050-etablissements-couleurs.sql)
- [081-module-apparence-fonds.sql](file://backend/database/migrations/081-module-apparence-fonds.sql)
- [theme-provider.tsx](file://frontend/src/components/ui/theme-provider.tsx)
- [background-rotator.tsx](file://frontend/src/features/apparence/background-rotator.tsx)
- [logo-manager.tsx](file://frontend/src/features/apparence/logo-manager.tsx)
- [brand-settings.tsx](file://frontend/src/features/apparence/brand-settings.tsx)
- [css-variables.css](file://frontend/src/styles/css-variables.css)
- [responsive-mixins.scss](file://frontend/src/styles/responsive-mixins.scss)

**Section sources**
- [route-registry.ts](file://backend/src/routes/route-registry.ts)
- [apparence.controller.ts](file://backend/src/modules/apparence/controllers/apparence.controller.ts)
- [apparence.service.ts](file://backend/src/modules/apparence/services/apparence.service.ts)
- [apparence.entity.ts](file://backend/src/modules/apparence/entities/apparence.entity.ts)
- [050-etablissements-couleurs.sql](file://backend/database/migrations/050-etablissements-couleurs.sql)
- [081-module-apparence-fonds.sql](file://backend/database/migrations/081-module-apparence-fonds.sql)
- [theme-provider.tsx](file://frontend/src/components/ui/theme-provider.tsx)
- [background-rotator.tsx](file://frontend/src/features/apparence/background-rotator.tsx)
- [logo-manager.tsx](file://frontend/src/features/apparence/logo-manager.tsx)
- [brand-settings.tsx](file://frontend/src/features/apparence/brand-settings.tsx)
- [css-variables.css](file://frontend/src/styles/css-variables.css)
- [responsive-mixins.scss](file://frontend/src/styles/responsive-mixins.scss)

## Performance Considerations
- Prefer CSS variables over inline styles to minimize reflows.
- Lazy-load background images and use appropriate sizes.
- Debounce theme updates during rapid configuration changes.
- Cache theme payloads client-side with short TTLs.
- Optimize logo uploads with compression and multiple resolutions.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- Missing institution colors: Ensure migration 050 has been applied and that appearance_config contains required keys.
- Backgrounds not rotating: Verify active flag in backgrounds table and network responses from the controller.
- Logo not displaying: Check upload validation results and fallback logic in the logo manager.
- Theme not applying: Confirm CSS variables are set on the root element and no overriding styles exist.

**Section sources**
- [050-etablissements-couleurs.sql](file://backend/database/migrations/050-etablissements-couleurs.sql)
- [081-module-apparence-fonds.sql](file://backend/database/migrations/081-module-apparence-fonds.sql)
- [apparence.controller.ts](file://backend/src/modules/apparence/controllers/apparence.controller.ts)
- [logo-manager.tsx](file://frontend/src/features/apparence/logo-manager.tsx)
- [theme-provider.tsx](file://frontend/src/components/ui/theme-provider.tsx)

## Conclusion
eLISAschool’s appearance and branding system provides a robust, multi-tenant theming solution. It centralizes tokens via CSS variables, supports per-institution overrides, manages assets efficiently, and adapts responsively. The layered backend ensures reliable persistence and resolution of global and institutional configurations.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices

### Practical Examples

- Creating a custom theme:
  - Define color tokens and typography in the brand settings UI.
  - Save configuration; the theme provider applies CSS variables immediately.
  - Reference tokens in components via CSS variables.

- Uploading brand assets:
  - Use the logo manager to upload institution logos.
  - Validate file types and sizes; preview before saving.
  - Assets persist with metadata and serve optimized variants.

- Configuring appearance preferences:
  - Adjust layout flags and background sets per institution.
  - Verify changes via API responses and UI hydration.

- Accessibility compliance:
  - Ensure sufficient contrast ratios for all color combinations.
  - Respect reduced motion preferences in background rotation.
  - Provide keyboard-accessible controls in brand settings.

[No sources needed since this section provides general guidance]