# Frontend & PWA Implementation

<cite>
**Referenced Files in This Document**
- [package.json](file://package.json)
- [README.md](file://README.md)
- [Dockerfile.frontend](file://docker/Dockerfile.frontend)
- [shared/package.json](file://shared/package.json)
- [shared/src/types/api.types.ts](file://shared/src/types/api.types.ts)
- [shared/src/types/user.types.ts](file://shared/src/types/user.types.ts)
- [shared/src/validators/auth.validators.ts](file://shared/src/validators/auth.validators.ts)
- [shared/src/enums/modules.enum.ts](file://shared/src/enums/modules.enum.ts)
- [shared/src/enums/roles.enum.ts](file://shared/src/enums/roles.enum.ts)
- [shared/src/constants/app.constants.ts](file://shared/src/constants/app.constants.ts)
- [frontend/src/features/competences/index.ts](file://frontend/src/features/competences/index.ts)
- [frontend/src/features/specialites/index.ts](file://frontend/src/features/specialites/index.ts)
- [frontend/src/routes/_auth.competences.tsx](file://frontend/src/routes/_auth.competences.tsx)
- [frontend/src/routes/_auth.specialites.tsx](file://frontend/src/routes/_auth.specialites.tsx)
- [frontend/src/features/cycles/components/cycle-form-modal.tsx](file://frontend/src/features/cycles/components/cycle-form-modal.tsx)
- [frontend/src/features/cycles/components/cycles-page.tsx](file://frontend/src/features/cycles/components/cycles-page.tsx)
- [frontend/src/features/cycles/hooks/use-cycles.ts](file://frontend/src/features/cycles/hooks/use-cycles.ts)
- [frontend/src/features/cycles/hooks/use-tous-cycles.ts](file://frontend/src/features/cycles/hooks/use-tous-cycles.ts)
- [frontend/src/features/cycles/types/cycle.types.ts](file://frontend/src/features/cycles/types/cycle.types.ts)
</cite>

## Update Summary
**Changes Made**
- Added new Competences and Spécialités features with dedicated routing structure
- Updated routing system to include new educational framework components
- Removed deprecated types-cycles frontend components and routes
- Enhanced structure académique with specialized educational modules

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [New Educational Framework Features](#new-educational-framework-features)
7. [Dependency Analysis](#dependency-analysis)
8. [Performance Considerations](#performance-considerations)
9. [Troubleshooting Guide](#troubleshooting-guide)
10. [Conclusion](#conclusion)
11. [Appendices](#appendices)

## Introduction
This document describes the eLISAschool frontend and Progressive Web App (PWA) implementation as reflected in the repository. The project is a monorepo with workspaces for backend, frontend, and a shared library. The frontend is built with React and Vite and is configured as a PWA. The shared library centralizes types, validators, enumerations, and constants used across the backend and frontend.

Key goals:
- Document the React + Vite architecture and PWA features
- Explain shared types and validators
- Describe the theme system and responsive design patterns
- Detail UI components, state management, and backend API integration
- Cover PWA manifest configuration, caching strategies, and performance optimization
- Address cross-browser compatibility, accessibility, and mobile-first design

**Updated** Added comprehensive coverage of new competences and specialites features with updated routing structure.

## Project Structure
The repository follows a monorepo layout with three primary workspaces:
- backend: Express.js API (TypeScript)
- frontend: React + Vite PWA
- shared: Shared TypeScript library for types, validators, enums, and constants

```mermaid
graph TB
Root["Root Package (monorepo)"]
Backend["Backend Workspace"]
Frontend["Frontend Workspace"]
Shared["Shared Library Workspace"]
Root --> Backend
Root --> Frontend
Root --> Shared
```

**Diagram sources**
- [package.json:8-12](file://package.json#L8-L12)

**Section sources**
- [package.json:8-12](file://package.json#L8-L12)
- [README.md:18-27](file://README.md#L18-L27)

## Core Components
This section outlines the core building blocks leveraged by the frontend and PWA.

- Shared types and API response models
  - Standardized API response shape and pagination metadata
  - Reference: [shared/src/types/api.types.ts:12-61](file://shared/src/types/api.types.ts#L12-L61)

- User types and roles
  - User profile and role/permission enumerations
  - Reference: [shared/src/types/user.types.ts](file://shared/src/types/user.types.ts)
  - Reference: [shared/src/enums/roles.enum.ts:12-184](file://shared/src/enums/roles.enum.ts#L12-L184)

- Authentication validators
  - Zod-based schemas for login, registration, password changes, and resets
  - Reference: [shared/src/validators/auth.validators.ts:15-103](file://shared/src/validators/auth.validators.ts#L15-L103)

- Application constants and limits
  - Limits, currencies, languages, and defaults
  - Reference: [shared/src/constants/app.constants.ts:23-71](file://shared/src/constants/app.constants.ts#L23-L71)

- Module taxonomy
  - Module names and categories for feature organization
  - Reference: [shared/src/enums/modules.enum.ts:14-104](file://shared/src/enums/modules.enum.ts#L14-L104)

**Section sources**
- [shared/src/types/api.types.ts:12-61](file://shared/src/types/api.types.ts#L12-L61)
- [shared/src/types/user.types.ts](file://shared/src/types/user.types.ts)
- [shared/src/validators/auth.validators.ts:15-103](file://shared/src/validators/auth.validators.ts#L15-L103)
- [shared/src/constants/app.constants.ts:23-71](file://shared/src/constants/app.constants.ts#L23-L71)
- [shared/src/enums/modules.enum.ts:14-104](file://shared/src/enums/modules.enum.ts#L14-L104)
- [shared/src/enums/roles.enum.ts:12-184](file://shared/src/enums/roles.enum.ts#L12-L184)

## Architecture Overview
The frontend is structured as a React + Vite PWA. The monorepo's shared library provides type-safe contracts and validation logic used by both frontend and backend. The Dockerfile for the frontend builds the PWA and serves it via Nginx.

```mermaid
graph TB
subgraph "Frontend (React + Vite)"
UI["UI Components"]
State["State Management"]
API["API Client"]
SW["Service Worker"]
end
subgraph "Shared Library"
Types["Types & Interfaces"]
Validators["Validators (Zod)"]
Enums["Enums & Constants"]
end
subgraph "Backend (Express)"
Controllers["Controllers"]
Services["Services"]
DB["PostgreSQL"]
end
UI --> State
UI --> API
API --> Controllers
Controllers --> Services
Services --> DB
UI --> Types
UI --> Validators
UI --> Enums
SW --> UI
```

**Diagram sources**
- [docker/Dockerfile.frontend:17-22](file://docker/Dockerfile.frontend#L17-L22)
- [shared/src/types/api.types.ts:12-61](file://shared/src/types/api.types.ts#L12-L61)
- [shared/src/validators/auth.validators.ts:15-103](file://shared/src/validators/auth.validators.ts#L15-L103)
- [shared/src/enums/modules.enum.ts:14-104](file://shared/src/enums/modules.enum.ts#L14-L104)

## Detailed Component Analysis

### Shared Types and Validation
The shared library defines:
- API response contracts and pagination metadata
- User profile types
- Authentication schemas validated with Zod
- Enumerations for roles and module taxonomy
- Application constants (limits, currencies, languages)

```mermaid
classDiagram
class ApiResponse {
+boolean success
+T data
+string message
+string timestamp
}
class PaginatedResult {
+T[] items
+meta
}
class PaginationOptions {
+number page
+number limit
+string sortBy
+string sortOrder
}
class ApiError {
+string code
+string message
+Record~string,unknown~ details
+string stack
}
class ApiErrorResponse {
+boolean success
+ApiError error
+string timestamp
+string path
}
ApiResponse <.. PaginatedResult
ApiResponse <.. ApiErrorResponse
PaginatedResult <.. PaginationOptions
```

**Diagram sources**
- [shared/src/types/api.types.ts:12-61](file://shared/src/types/api.types.ts#L12-L61)

**Section sources**
- [shared/src/types/api.types.ts:12-61](file://shared/src/types/api.types.ts#L12-L61)
- [shared/src/validators/auth.validators.ts:15-103](file://shared/src/validators/auth.validators.ts#L15-L103)
- [shared/src/enums/roles.enum.ts:12-184](file://shared/src/enums/roles.enum.ts#L12-L184)
- [shared/src/enums/modules.enum.ts:14-104](file://shared/src/enums/modules.enum.ts#L14-L104)
- [shared/src/constants/app.constants.ts:23-71](file://shared/src/constants/app.constants.ts#L23-L71)

### Authentication Flow (Client-Side)
The client-side authentication flow uses Zod schemas for form validation and integrates with backend endpoints.

```mermaid
sequenceDiagram
participant U as "User"
participant C as "Client UI"
participant V as "Zod Validators"
participant A as "Auth API"
U->>C : "Enter credentials"
C->>V : "Validate(loginSchema)"
V-->>C : "Validation result"
C->>A : "POST /auth/login"
A-->>C : "Response (ApiResponse)"
C->>C : "Persist tokens / redirect"
```

**Diagram sources**
- [shared/src/validators/auth.validators.ts:15-25](file://shared/src/validators/auth.validators.ts#L15-L25)
- [shared/src/types/api.types.ts:12-17](file://shared/src/types/api.types.ts#L12-L17)

**Section sources**
- [shared/src/validators/auth.validators.ts:15-25](file://shared/src/validators/auth.validators.ts#L15-L25)
- [shared/src/types/api.types.ts:12-17](file://shared/src/types/api.types.ts#L12-L17)

### PWA Build and Deployment Pipeline
The frontend is built as a PWA and served via Nginx in a containerized environment.

```mermaid
flowchart TD
Start(["Build Trigger"]) --> CopyShared["Copy shared library"]
CopyShared --> InstallDeps["Install dependencies"]
InstallDeps --> BuildApp["Run build"]
BuildApp --> Serve["Serve with Nginx"]
Serve --> End(["Production Ready"])
```

**Diagram sources**
- [docker/Dockerfile.frontend:17-22](file://docker/Dockerfile.frontend#L17-L22)

**Section sources**
- [docker/Dockerfile.frontend:17-22](file://docker/Dockerfile.frontend#L17-L22)

### Theme System and Responsive Design Patterns
- Theme system: Centralized theme constants enable consistent design tokens across components.
- Responsive design: Mobile-first approach with utility-first CSS (Tailwind) ensures adaptability across screen sizes.

Note: Theme and responsive patterns are defined in the shared library constants and are consumed by UI components.

**Section sources**
- [shared/src/constants/app.constants.ts:23-71](file://shared/src/constants/app.constants.ts#L23-L71)

### State Management and Backend Integration
- State management: Centralized state stores manage user sessions, navigation, and feature flags.
- Backend integration: API client consumes standardized response types and pagination metadata.

**Section sources**
- [shared/src/types/api.types.ts:12-61](file://shared/src/types/api.types.ts#L12-L61)

## New Educational Framework Features

### Competences Feature Implementation
The competences feature provides comprehensive competence management for educational frameworks.

```mermaid
graph TB
Competences["Competences Feature"]
CompetenceForm["Competence Form Modal"]
CompetenceList["Competence List Page"]
CompetenceHooks["use-cycles Hooks"]
CompetenceTypes["Cycle Types"]
Competences --> CompetenceForm
Competences --> CompetenceList
Competences --> CompetenceHooks
Competences --> CompetenceTypes
```

**Diagram sources**
- [frontend/src/features/competences/index.ts](file://frontend/src/features/competences/index.ts)
- [frontend/src/routes/_auth.competences.tsx](file://frontend/src/routes/_auth.competences.tsx)

**Section sources**
- [frontend/src/features/competences/index.ts](file://frontend/src/features/competences/index.ts)
- [frontend/src/routes/_auth.competences.tsx](file://frontend/src/routes/_auth.competences.tsx)

### Spécialités Feature Implementation
The specialites feature manages specialized educational tracks and streams.

```mermaid
graph TB
Specialites["Spécialités Feature"]
SpecialiteForm["Specialité Form Modal"]
SpecialiteList["Specialité List Page"]
SpecialiteHooks["use-tous-cycles Hooks"]
SpecialiteTypes["Specialité Types"]
Specialites --> SpecialiteForm
Specialites --> SpecialiteList
Specialites --> SpecialiteHooks
Specialites --> SpecialiteTypes
```

**Diagram sources**
- [frontend/src/features/specialites/index.ts](file://frontend/src/features/specialites/index.ts)
- [frontend/src/routes/_auth.specialites.tsx](file://frontend/src/routes/_auth.specialites.tsx)

**Section sources**
- [frontend/src/features/specialites/index.ts](file://frontend/src/features/specialites/index.ts)
- [frontend/src/routes/_auth.specialites.tsx](file://frontend/src/routes/_auth.specialites.tsx)

### Updated Routing Structure
The routing system now includes dedicated routes for competences and specialites features.

**Section sources**
- [frontend/src/routes/_auth.competences.tsx](file://frontend/src/routes/_auth.competences.tsx)
- [frontend/src/routes/_auth.specialites.tsx](file://frontend/src/routes/_auth.specialites.tsx)

### Cycles Feature Enhancement
The cycles feature maintains its core functionality with enhanced integration with the new educational framework.

**Section sources**
- [frontend/src/features/cycles/components/cycle-form-modal.tsx](file://frontend/src/features/cycles/components/cycle-form-modal.tsx)
- [frontend/src/features/cycles/components/cycles-page.tsx](file://frontend/src/features/cycles/components/cycles-page.tsx)
- [frontend/src/features/cycles/hooks/use-cycles.ts](file://frontend/src/features/cycles/hooks/use-cycles.ts)
- [frontend/src/features/cycles/hooks/use-tous-cycles.ts](file://frontend/src/features/cycles/hooks/use-tous-cycles.ts)
- [frontend/src/features/cycles/types/cycle.types.ts](file://frontend/src/features/cycles/types/cycle.types.ts)

## Dependency Analysis
The frontend depends on the shared library for type safety and validation. The backend provides the API consumed by the frontend.

```mermaid
graph LR
Shared["@elisaschool/shared"]
Frontend["Frontend App"]
Backend["Backend API"]
Shared --> Frontend
Frontend --> Backend
```

**Diagram sources**
- [shared/package.json:2-10](file://shared/package.json#L2-L10)
- [package.json:8-12](file://package.json#L8-L12)

**Section sources**
- [shared/package.json:2-10](file://shared/package.json#L2-L10)
- [package.json:8-12](file://package.json#L8-L12)

## Performance Considerations
- Build-time optimization: Vite's development server and optimized production builds reduce bundle sizes and improve load times.
- Asset delivery: Nginx serves static assets efficiently in production.
- Caching strategies: Implement service worker caching for offline availability and faster reloads.
- Bundle splitting: Code-split routes and lazy-load heavy components to minimize initial payload.
- Image optimization: Use modern formats and responsive images to reduce bandwidth.
- Minification and tree-shaking: Enable in build pipeline to remove unused code.

## Troubleshooting Guide
- Authentication validation errors: Ensure form inputs match Zod schemas before submission.
- API response parsing: Verify ApiResponse and pagination shapes to avoid runtime errors.
- PWA installation: Confirm manifest configuration and service worker registration.
- Cross-browser compatibility: Test on supported browsers and polyfill when necessary.
- Accessibility: Validate keyboard navigation, ARIA attributes, and screen reader support.
- Educational framework issues: Verify competences and specialites routing configurations.

**Section sources**
- [shared/src/validators/auth.validators.ts:15-103](file://shared/src/validators/auth.validators.ts#L15-L103)
- [shared/src/types/api.types.ts:12-61](file://shared/src/types/api.types.ts#L12-L61)

## Conclusion
The eLISAschool frontend is architected as a React + Vite PWA with a strong emphasis on type safety and validation through a shared library. The monorepo structure enables consistent contracts across frontend and backend, while Dockerized deployment ensures reliable production delivery. By leveraging standardized types, validators, and constants, the application maintains robustness, scalability, and maintainability.

**Updated** Recent enhancements include comprehensive educational framework features with dedicated competences and specialites management, along with improved routing structure supporting advanced academic organization capabilities.

## Appendices

### PWA Manifest Configuration
- Manifest fields: Name, short_name, description, icons, start_url, display, background_color, theme_color.
- Icons: Provide multiple sizes for optimal rendering across devices.
- Service worker: Register and configure caching strategies for offline support.

### Offline Capabilities and Service Workers
- Strategies: Cache-first for static assets, network-first for API, stale-while-revalidate for dynamic data.
- Fallbacks: Define offline pages and error boundaries.
- Updates: Implement update prompts and background sync where appropriate.

### Cross-Browser Compatibility and Accessibility
- Compatibility: Test on latest Chrome, Firefox, Safari, Edge; address vendor prefixes and polyfills.
- Accessibility: Ensure semantic HTML, ARIA roles, keyboard navigation, and color contrast.

### Educational Framework Integration
- Competences Management: Comprehensive competence tracking and assessment
- Specialites Management: Specialized educational tracks and streams
- Cycles Integration: Enhanced cycle management with new educational components
- Routing Structure: Dedicated routes for educational framework features