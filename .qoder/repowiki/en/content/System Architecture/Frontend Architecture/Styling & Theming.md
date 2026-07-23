# Styling & Theming

<cite>
**Referenced Files in This Document**
- [frontend/package.json](file://frontend/package.json)
- [frontend/vite.config.ts](file://frontend/vite.config.ts)
- [frontend/src/styles/global.css](file://frontend/src/styles/global.css)
- [frontend/src/App.tsx](file://frontend/src/App.tsx)
- [frontend/src/main.tsx](file://frontend/src/main.tsx)
- [backend/src/modules/apparence/services/backgroundRotation.service.ts](file://backend/src/modules/apparence/services/backgroundRotation.service.ts)
- [backend/src/modules/apparence/controllers/apparence.controller.ts](file://backend/src/modules/apparence/controllers/apparence.controller.ts)
- [backend/src/modules/apparence/dto/background.dto.ts](file://backend/src/modules/apparence/dto/background.dto.ts)
- [backend/src/modules/apparence/entities/background.entity.ts](file://backend/src/modules/apparence/entities/background.entity.ts)
- [backend/migrations/081-module-apparence-fonds.sql](file://backend/migrations/081-module-apparence-fonds.sql)
</cite>

## Update Summary
**Changes Made**
- Implemented comprehensive theme system with advanced dark mode support across all major UI components
- Added centralized theme context with persistent user preferences and smooth transitions
- Enhanced accessibility features including focus indicators and keyboard navigation
- Updated component styling patterns for consistent dark mode behavior
- Improved CSS variable management for better theme switching performance

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Theme-Aware Component System](#theme-aware-component-system)
7. [Advanced Theme Features](#advanced-theme-features)
8. [Dependency Analysis](#dependency-analysis)
9. [Performance Considerations](#performance-considerations)
10. [Troubleshooting Guide](#troubleshooting-guide)
11. [Conclusion](#conclusion)
12. [Appendices](#appendices)

## Introduction
This document explains the comprehensive styling system built with Tailwind CSS and custom theming across the frontend, including design tokens, color palettes, typography scales, enhanced dark mode implementation, responsive patterns, mobile-first approach, background rotation for institutions, and custom theme configuration. The system now features a complete theme architecture with centralized state management, persistent user preferences, smooth transitions without visual side effects, and improved accessibility features including focus indicators and keyboard navigation.

## Project Structure
The styling system is primarily implemented in the frontend using Tailwind CSS and a global stylesheet for base styles and theme variables. The backend provides dynamic background assets per institution via an appearance module that exposes endpoints to fetch available backgrounds and their metadata. All UI components now feature comprehensive dark mode support with theme-aware styling and centralized theme management.

```mermaid
graph TB
subgraph "Frontend Theme Architecture"
A["Tailwind Config<br/>vite.config.ts"]
B["Global Styles<br/>src/styles/global.css"]
C["App Shell<br/>src/App.tsx"]
D["Entry Point<br/>src/main.tsx"]
E["Theme Provider<br/>Centralized Context"]
F["UI Components<br/>Dark Mode Support"]
G["Theme Utilities<br/>CSS Variables & Transitions"]
H["Accessibility Layer<br/>Focus & Navigation"]
end
subgraph "Backend Background System"
I["Background Rotation Service<br/>apparence/services/backgroundRotation.service.ts"]
J["Appearance Controller<br/>apparence/controllers/apparence.controller.ts"]
K["Background DTO<br/>apparence/dto/background.dto.ts"]
L["Background Entity<br/>apparence/entities/background.entity.ts"]
M["Migration: Apparence Module<br/>migrations/081-module-apparence-fonds.sql"]
end
D --> C
C --> B
C --> A
C --> E
E --> F
E --> G
E --> H
C --> J
J --> I
I --> L
J --> K
L --> M
```

**Diagram sources**
- [frontend/vite.config.ts](file://frontend/vite.config.ts)
- [frontend/src/styles/global.css](file://frontend/src/styles/global.css)
- [frontend/src/App.tsx](file://frontend/src/App.tsx)
- [frontend/src/main.tsx](file://frontend/src/main.tsx)
- [backend/src/modules/apparence/services/backgroundRotation.service.ts](file://backend/src/modules/apparence/services/backgroundRotation.service.ts)
- [backend/src/modules/apparence/controllers/apparence.controller.ts](file://backend/src/modules/apparence/controllers/apparence.controller.ts)
- [backend/src/modules/apparence/dto/background.dto.ts](file://backend/src/modules/apparence/dto/background.dto.ts)
- [backend/src/modules/apparence/entities/background.entity.ts](file://backend/src/modules/apparence/entities/background.entity.ts)
- [backend/migrations/081-module-apparence-fonds.sql](file://backend/migrations/081-module-apparence-fonds.sql)

**Section sources**
- [frontend/package.json](file://frontend/package.json)
- [frontend/vite.config.ts](file://frontend/vite.config.ts)
- [frontend/src/styles/global.css](file://frontend/src/styles/global.css)
- [frontend/src/App.tsx](file://frontend/src/App.tsx)
- [frontend/src/main.tsx](file://frontend/src/main.tsx)
- [backend/src/modules/apparence/services/backgroundRotation.service.ts](file://backend/src/modules/apparence/services/backgroundRotation.service.ts)
- [backend/src/modules/apparence/controllers/apparence.controller.ts](file://backend/src/modules/apparence/controllers/apparence.controller.ts)
- [backend/src/modules/apparence/dto/background.dto.ts](file://backend/src/modules/apparence/dto/background.dto.ts)
- [backend/src/modules/apparence/entities/background.entity.ts](file://backend/src/modules/apparence/entities/background.entity.ts)
- [backend/migrations/081-module-apparence-fonds.sql](file://backend/migrations/081-module-apparence-fonds.sql)

## Core Components
- Tailwind CSS integration and build-time processing are configured through the Vite setup. This includes plugin registration and any Tailwind-specific options.
- Global styles define base CSS variables (design tokens), typography scale, spacing, and color tokens. These variables are consumed by Tailwind utilities and custom components.
- The application shell initializes providers and theme context if needed, ensuring consistent rendering across routes.
- **Enhanced**: Comprehensive dark mode support implemented across all UI components with theme-aware styling patterns and centralized theme management.
- The backend appearance module serves institution-specific background assets and metadata, enabling dynamic theming at runtime.
- **New**: Centralized theme context provider manages theme state, user preferences, and accessibility features.

Key responsibilities:
- Build configuration: Tailwind plugin and source paths.
- Design tokens: CSS custom properties for colors, typography, spacing, shadows, and radii.
- **Enhanced**: Dark mode: Root-level class toggling and token overrides with full component coverage and smooth transitions.
- Responsive/mobile-first: Utility-first classes and breakpoint-driven layouts.
- Background rotation: Backend API to list and select rotating backgrounds per institution.
- **New**: Centralized theme management: Persistent user preferences, system preference detection, and accessibility compliance.

**Section sources**
- [frontend/vite.config.ts](file://frontend/vite.config.ts)
- [frontend/src/styles/global.css](file://frontend/src/styles/global.css)
- [frontend/src/App.tsx](file://frontend/src/App.tsx)
- [frontend/src/main.tsx](file://frontend/src/main.tsx)
- [backend/src/modules/apparence/controllers/apparence.controller.ts](file://backend/src/modules/apparence/controllers/apparence.controller.ts)
- [backend/src/modules/apparence/services/backgroundRotation.service.ts](file://backend/src/modules/apparence/services/backgroundRotation.service.ts)
- [backend/src/modules/apparence/dto/background.dto.ts](file://backend/src/modules/apparence/dto/background.dto.ts)
- [backend/src/modules/apparence/entities/background.entity.ts](file://backend/src/modules/apparence/entities/background.entity.ts)
- [backend/migrations/081-module-apparence-fonds.sql](file://backend/migrations/081-module-apparence-fonds.sql)

## Architecture Overview
The styling architecture combines static design tokens with dynamic runtime theming and comprehensive dark mode support through a centralized theme management system:
- Static layer: Tailwind utilities and global CSS variables provide a consistent foundation.
- Dynamic layer: Institution-specific backgrounds are fetched from the backend and applied to the UI.
- **Enhanced**: Theme switching: Centralized theme context manages dark mode toggles, CSS variable values, and Tailwind's dark variant behavior across all components.
- **New**: Component-level theme awareness: Each UI component implements consistent dark mode styling patterns with proper accessibility support.
- **New**: User preference persistence: Theme settings are stored locally and synchronized across sessions.

```mermaid
sequenceDiagram
participant Client as "Browser"
participant App as "App.tsx"
participant Theme as "Centralized Theme Provider"
participant Components as "UI Components"
participant Accessibility as "Accessibility Layer"
participant API as "Appearance Controller"
participant Svc as "Background Rotation Service"
participant DB as "Background Entity + Migration"
Client->>App : Load page
App->>Theme : Initialize theme context
Theme->>Theme : Load user preferences
Theme->>Components : Provide theme state
Theme->>Accessibility : Configure accessibility features
Components->>API : GET /appearance/backgrounds
API->>Svc : Fetch active backgrounds
Svc->>DB : Query backgrounds
DB-->>Svc : Background records
Svc-->>API : DTO list
API-->>Client : JSON response
Client->>Components : Apply theme-aware styles
Components->>Components : Toggle dark mode variants
Theme->>Theme : Persist user preferences
```

**Diagram sources**
- [frontend/src/App.tsx](file://frontend/src/App.tsx)
- [backend/src/modules/apparence/controllers/apparence.controller.ts](file://backend/src/modules/apparence/controllers/apparence.controller.ts)
- [backend/src/modules/apparence/services/backgroundRotation.service.ts](file://backend/src/modules/apparence/services/backgroundRotation.service.ts)
- [backend/src/modules/apparence/entities/background.entity.ts](file://backend/src/modules/apparence/entities/background.entity.ts)
- [backend/migrations/081-module-apparence-fonds.sql](file://backend/migrations/081-module-apparence-fonds.sql)

## Detailed Component Analysis

### Tailwind Configuration and Build Pipeline
- Tailwind is integrated via the Vite configuration file. The setup registers the Tailwind plugin and defines content paths so only used utilities are included in production builds.
- Source scanning ensures all component files are analyzed for utility usage, minimizing bundle size.
- **Enhanced**: Dark mode variants are properly configured for all component classes with optimized build output.

Best practices:
- Keep Tailwind content globs precise to avoid unnecessary scans.
- Use purge-safe patterns when generating class names dynamically.
- Ensure dark mode variants are included in the build configuration.

**Section sources**
- [frontend/vite.config.ts](file://frontend/vite.config.ts)

### Global Styles and Design Tokens
- Global CSS defines CSS custom properties for colors, typography, spacing, shadows, and border radius. These tokens act as the single source of truth for visual consistency.
- Typography scale is expressed via semantic tokens (e.g., headings, body text) and mapped to Tailwind utilities or component styles.
- Color palette tokens include light and dark variants, enabling seamless theme switching.
- **Enhanced**: Comprehensive dark mode token overrides for all UI elements with smooth transition animations.

Accessibility tips:
- Ensure sufficient contrast between foreground and background tokens in both light and dark modes.
- Provide focus-visible styles for interactive elements in all themes.
- Test color combinations against WCAG guidelines for both themes.

**Section sources**
- [frontend/src/styles/global.css](file://frontend/src/styles/global.css)

### Application Shell and Theme Context
- The app shell initializes providers and manages theme state (dark mode). It composes layout and applies global classes.
- Theme context propagates tokens and preferences down the component tree.
- **Enhanced**: Theme state persistence and system preference detection with smooth transitions.

Mobile-first approach:
- Default styles target small screens; larger breakpoints enhance layouts progressively.
- Dark mode considerations apply consistently across all breakpoints.

**Section sources**
- [frontend/src/App.tsx](file://frontend/src/App.tsx)
- [frontend/src/main.tsx](file://frontend/src/main.tsx)

### Enhanced Dark Mode Implementation
- **Comprehensive**: Dark mode is now fully implemented across all UI components with consistent styling patterns and centralized theme management.
- Root-level class toggling controls theme state throughout the application.
- CSS variables override token values under the dark selector for all components.
- Tailwind's dark variant reads the presence of the dark class to apply alternate styles.
- **New**: Smooth transitions between themes without visual flicker or layout shifts.

Implementation notes:
- Persist user preference in local storage with fallback to system preference.
- Handle theme transitions smoothly without visual disruption.
- Ensure all components respect the current theme state.
- **New**: Proper accessibility support with ARIA attributes and keyboard navigation in dark mode.
- **New**: Focus indicators and high contrast mode support.

**Updated** Comprehensive dark mode support now covers all major UI components including ErrorMessage, Sidebar, CustomModal, DataTable, SearchInput, Tabs, TransfertList, TreeView, RowActions, and Breadcrumbs with centralized theme management.

**Section sources**
- [frontend/src/styles/global.css](file://frontend/src/styles/global.css)
- [frontend/src/App.tsx](file://frontend/src/App.tsx)

### Responsive Design Patterns
- Use Tailwind's responsive prefixes to adapt layouts across breakpoints.
- Prefer stacking layouts on small screens and expanding to multi-column grids on larger screens.
- Avoid fixed widths; use fluid units and container queries where appropriate.
- **Enhanced**: Dark mode responsive considerations ensure readability across all screen sizes with proper contrast ratios.

**Section sources**
- [frontend/src/styles/global.css](file://frontend/src/styles/global.css)

### Background Rotation System for Institutions
- The backend exposes endpoints to retrieve available backgrounds and metadata for the current institution.
- The service selects backgrounds based on rotation rules and returns a DTO suitable for the client.
- The entity and migration define the schema for storing background assets and their attributes.

Runtime flow:
- Frontend requests background list.
- Backend resolves active backgrounds and formats response.
- Frontend applies chosen background to the UI with theme-aware overlays.

```mermaid
flowchart TD
Start(["Request backgrounds"]) --> CallAPI["Call Appearance API"]
CallAPI --> Resolve["Resolve active backgrounds"]
Resolve --> Format["Format DTO"]
Format --> Return["Return JSON"]
Return --> Apply["Apply background in UI"]
Apply --> ThemeCheck{"Check current theme"}
ThemeCheck --> |Light| LightOverlay["Apply light overlay"]
ThemeCheck --> |Dark| DarkOverlay["Apply dark overlay"]
LightOverlay --> End(["Done"])
DarkOverlay --> End(["Done"])
```

**Diagram sources**
- [backend/src/modules/apparence/controllers/apparence.controller.ts](file://backend/src/modules/apparence/controllers/apparence.controller.ts)
- [backend/src/modules/apparence/services/backgroundRotation.service.ts](file://backend/src/modules/apparence/services/backgroundRotation.service.ts)
- [backend/src/modules/apparence/dto/background.dto.ts](file://backend/src/modules/apparence/dto/background.dto.ts)
- [backend/src/modules/apparence/entities/background.entity.ts](file://backend/src/modules/apparence/entities/background.entity.ts)
- [backend/migrations/081-module-apparence-fonds.sql](file://backend/migrations/081-module-apparence-fonds.sql)

**Section sources**
- [backend/src/modules/apparence/controllers/apparence.controller.ts](file://backend/src/modules/apparence/controllers/apparence.controller.ts)
- [backend/src/modules/apparence/services/backgroundRotation.service.ts](file://backend/src/modules/apparence/services/backgroundRotation.service.ts)
- [backend/src/modules/apparence/dto/background.dto.ts](file://backend/src/modules/apparence/dto/background.dto.ts)
- [backend/src/modules/apparence/entities/background.entity.ts](file://backend/src/modules/apparence/entities/background.entity.ts)
- [backend/migrations/081-module-apparence-fonds.sql](file://backend/migrations/081-module-apparence-fonds.sql)

### Custom Theme Configuration
- Centralize tokens in global CSS and reference them via Tailwind utilities or component styles.
- For dynamic themes, update CSS variables at runtime based on user or institution preferences.
- Maintain separate token sets for light and dark modes with consistent naming conventions.
- **Enhanced**: Theme configuration now supports component-specific overrides when necessary with centralized management.

**Section sources**
- [frontend/src/styles/global.css](file://frontend/src/styles/global.css)

### CSS-in-JS Patterns and Component Styling Best Practices
- Prefer Tailwind utilities for most styling needs to keep styles co-located and predictable.
- When dynamic styles are required, compute style objects conditionally and merge with utility classes.
- Extract reusable composition helpers to avoid duplication and ensure consistency.
- **Enhanced**: Component styling patterns now include consistent dark mode implementations with centralized theme context.

Guidelines:
- Keep inline styles minimal and reserved for truly dynamic values.
- Use semantic class names and data attributes for testability.
- Avoid deep nesting; rely on utility composition.
- **New**: Always implement dark mode variants for custom component styles.
- **New**: Test components in both light and dark modes during development.
- **New**: Use centralized theme context instead of prop drilling for theme state.

**Section sources**
- [frontend/src/styles/global.css](file://frontend/src/styles/global.css)
- [frontend/src/App.tsx](file://frontend/src/App.tsx)

### Performance Optimization for Styles
- Rely on Tailwind's build-time purging to remove unused utilities.
- Minimize large inline style objects; prefer CSS variables and utilities.
- Lazy-load heavy background images and use responsive image formats.
- Cache API responses for background lists to reduce network overhead.
- **Enhanced**: Optimize dark mode transitions to prevent layout shifts and improve perceived performance.
- **New**: Implement efficient theme switching with minimal re-renders and CSS recalculation.
- **New**: Use CSS containment for complex components to isolate theme changes.
- **New**: Debounce theme preference updates to prevent excessive localStorage writes.

**Section sources**
- [frontend/vite.config.ts](file://frontend/vite.config.ts)
- [backend/src/modules/apparence/controllers/apparence.controller.ts](file://backend/src/modules/apparence/controllers/apparence.controller.ts)

### Cross-Browser Compatibility
- Test dark mode and CSS variables across major browsers.
- Validate responsive layouts on mobile devices and tablets.
- Ensure fallbacks for older browsers if necessary.
- **Enhanced**: Verify dark mode functionality across all supported browsers and devices with proper polyfills.

**Section sources**
- [frontend/src/styles/global.css](file://frontend/src/styles/global.css)

### Accessibility Compliance in Styling
- Maintain WCAG contrast ratios for text and interactive elements in both light and dark modes.
- Provide visible focus indicators and keyboard navigation support in all themes.
- Use semantic HTML and ARIA attributes where appropriate.
- Avoid relying solely on color to convey information.
- **Enhanced**: Comprehensive accessibility testing for dark mode implementations.
- **New**: Screen reader compatibility with theme changes.
- **New**: Reduced motion support for theme transitions.
- **New**: High contrast mode support and focus management.

**Section sources**
- [frontend/src/styles/global.css](file://frontend/src/styles/global.css)

## Theme-Aware Component System

### Component Dark Mode Implementation
All major UI components now feature comprehensive dark mode support with consistent styling patterns and centralized theme management:

#### Core Components
- **ErrorMessage**: Displays error messages with appropriate contrast and visibility in both themes
- **Sidebar**: Navigation sidebar with theme-aware backgrounds, borders, and text colors
- **CustomModal**: Modal dialogs with proper backdrop handling and theme-consistent styling
- **DataTable**: Data tables with readable text, proper borders, and hover states in dark mode
- **SearchInput**: Search inputs with clear focus states and placeholder text in both themes

#### Advanced Components
- **Tabs**: Tab interfaces with proper active states and separators in dark mode
- **TransfertList**: Transfer lists with drag-and-drop indicators and selection states
- **TreeView**: Hierarchical tree views with expand/collapse indicators and node highlighting
- **RowActions**: Action buttons and menus with proper contrast and hover effects
- **Breadcrumbs**: Navigation breadcrumbs with separator visibility and link states

### Centralized Theme Management
- **Centralized theme context** provides consistent state across all components
- **Local storage persistence** maintains user preferences across sessions
- **System preference detection** on initial load with automatic theme matching
- **Smooth transitions** between themes without visual disruption or layout shifts
- **Accessibility integration** with proper ARIA labels and keyboard navigation support

### Enhanced Accessibility Features
- Proper ARIA labels and roles for theme-aware components
- Keyboard navigation support in dark mode with visible focus indicators
- Focus management and screen reader compatibility with theme changes
- High contrast mode support and reduced motion preferences
- Semantic HTML structure with proper heading hierarchy

### Theme State Flow
```mermaid
flowchart TD
UserAction["User Theme Toggle"] --> ThemeContext["Centralized Theme Context"]
ThemeContext --> LocalStorage["Persist Preferences"]
ThemeContext --> CSSVariables["Update CSS Variables"]
ThemeContext --> TailwindClass["Toggle Dark Class"]
ThemeContext --> Components["Update All Components"]
Components --> Accessibility["Accessibility Layer"]
Accessibility --> FocusIndicators["Focus Indicators"]
Accessibility --> KeyboardNav["Keyboard Navigation"]
```

**Diagram sources**
- [frontend/src/App.tsx](file://frontend/src/App.tsx)
- [frontend/src/styles/global.css](file://frontend/src/styles/global.css)

**Section sources**
- [frontend/src/styles/global.css](file://frontend/src/styles/global.css)
- [frontend/src/App.tsx](file://frontend/src/App.tsx)

## Advanced Theme Features

### Theme Persistence and User Preferences
- **Automatic preference detection**: System theme preference is detected on initial load
- **Manual override**: Users can manually switch themes with immediate effect
- **Persistent storage**: Theme preferences are saved to localStorage and restored on subsequent visits
- **Fallback handling**: Graceful fallback to system preference if user preference is unavailable

### Smooth Theme Transitions
- **CSS transitions**: Smooth color and opacity transitions between themes
- **No layout shifts**: Theme changes occur without affecting document layout
- **Optimized performance**: Minimal re-renders and CSS recalculations during theme switches
- **Progressive enhancement**: Theme transitions degrade gracefully on older browsers

### Accessibility Enhancements
- **Focus management**: Proper focus indicator styling in both light and dark modes
- **Keyboard navigation**: Full keyboard accessibility with visible focus states
- **Screen reader support**: Proper ARIA attributes and semantic markup
- **High contrast mode**: Support for system high contrast preferences
- **Reduced motion**: Respects user motion preferences for smoother experience

### Component Integration Patterns
- **Theme context consumption**: Components consume theme state through React context
- **CSS variable usage**: Components use CSS custom properties for theme-dependent values
- **Tailwind dark variants**: Consistent use of `dark:` prefix for theme-specific styles
- **Accessibility props**: Standardized accessibility attributes across components

**Section sources**
- [frontend/src/App.tsx](file://frontend/src/App.tsx)
- [frontend/src/styles/global.css](file://frontend/src/styles/global.css)

## Dependency Analysis
The styling system depends on:
- Tailwind CSS and its build pipeline for utility generation.
- Global CSS for design tokens and base styles.
- Backend appearance module for dynamic background assets.
- **Enhanced**: Centralized theme context provider for component-level theme awareness.
- **New**: Theme persistence utilities and accessibility enhancement libraries.
- **New**: CSS transition utilities and animation frameworks.

```mermaid
graph LR
Tailwind["Tailwind CSS"] --> Build["Vite Build"]
Build --> Bundle["Production Bundle"]
GlobalCSS["global.css"] --> Bundle
AppShell["App.tsx"] --> Bundle
ThemeProvider["Centralized Theme Provider"] --> Bundle
Components["UI Components<br/>Dark Mode Support"] --> Bundle
ThemeUtils["Theme Utilities<br/>Persistence & Transitions"] --> Bundle
Accessibility["Accessibility Layer<br/>Focus & Navigation"] --> Bundle
API["Appearance Controller"] --> Bundle
Svc["Background Rotation Service"] --> API
Entity["Background Entity"] --> Svc
Migration["Apparence Migration"] --> Entity
```

**Diagram sources**
- [frontend/vite.config.ts](file://frontend/vite.config.ts)
- [frontend/src/styles/global.css](file://frontend/src/styles/global.css)
- [frontend/src/App.tsx](file://frontend/src/App.tsx)
- [backend/src/modules/apparence/controllers/apparence.controller.ts](file://backend/src/modules/apparence/controllers/apparence.controller.ts)
- [backend/src/modules/apparence/services/backgroundRotation.service.ts](file://backend/src/modules/apparence/services/backgroundRotation.service.ts)
- [backend/src/modules/apparence/entities/background.entity.ts](file://backend/src/modules/apparence/entities/background.entity.ts)
- [backend/migrations/081-module-apparence-fonds.sql](file://backend/migrations/081-module-apparence-fonds.sql)

**Section sources**
- [frontend/vite.config.ts](file://frontend/vite.config.ts)
- [frontend/src/styles/global.css](file://frontend/src/styles/global.css)
- [frontend/src/App.tsx](file://frontend/src/App.tsx)
- [backend/src/modules/apparence/controllers/apparence.controller.ts](file://backend/src/modules/apparence/controllers/apparence.controller.ts)
- [backend/src/modules/apparence/services/backgroundRotation.service.ts](file://backend/src/modules/apparence/services/backgroundRotation.service.ts)
- [backend/src/modules/apparence/entities/background.entity.ts](file://backend/src/modules/apparence/entities/background.entity.ts)
- [backend/migrations/081-module-apparence-fonds.sql](file://backend/migrations/081-module-apparence-fonds.sql)

## Performance Considerations
- Keep Tailwind content paths accurate to minimize scan time and output size.
- Defer non-critical background images and use lazy loading.
- Cache background lists and metadata on the client side.
- Prefer CSS variables over frequent DOM updates for theme changes.
- Monitor bundle size and avoid importing unused libraries.
- **Enhanced**: Optimize dark mode transitions to prevent layout shifts and improve perceived performance.
- **New**: Implement efficient theme switching with minimal re-renders and CSS recalculation.
- **New**: Use CSS containment for complex components to isolate theme changes.
- **New**: Debounce theme preference updates to prevent excessive localStorage writes.
- **New**: Implement progressive loading for theme-dependent assets.

## Troubleshooting Guide
Common issues and resolutions:
- Dark mode not applying: Verify root class toggling and CSS variable overrides.
- Unused Tailwind classes: Ensure content globs include all component directories.
- Background not updating: Check API availability and CORS settings; validate DTO structure.
- Contrast problems: Audit color tokens against WCAG guidelines for both themes.
- **New**: Component dark mode inconsistencies: Check if components properly consume centralized theme context.
- **New**: Theme transition flickering: Ensure theme state is initialized before component rendering.
- **New**: Accessibility issues in dark mode: Verify contrast ratios and focus indicators.
- **New**: Theme preference not persisting: Check localStorage permissions and browser compatibility.
- **New**: Slow theme switching: Review CSS transition complexity and component re-render optimization.

**Section sources**
- [frontend/src/styles/global.css](file://frontend/src/styles/global.css)
- [frontend/vite.config.ts](file://frontend/vite.config.ts)
- [backend/src/modules/apparence/controllers/apparence.controller.ts](file://backend/src/modules/apparence/controllers/apparence.controller.ts)

## Conclusion
The styling system leverages Tailwind CSS for utility-first styling, global CSS for design tokens, and a backend appearance module for dynamic theming. With the comprehensive theme system featuring centralized state management, persistent user preferences, smooth transitions, and enhanced accessibility, the system now provides a consistent, accessible, and performant user experience in both light and dark themes. By centralizing tokens, adopting mobile-first responsive patterns, implementing theme-aware components, optimizing build pipelines, and adhering to accessibility and cross-browser best practices, the system achieves consistency, scalability, and performance while maintaining excellent user experience across all themes and devices.

## Appendices

### Appendix A: Token Reference Guidelines
- Colors: Define semantic tokens for primary, secondary, neutral, and status colors.
- Typography: Establish a type scale with line-height and letter-spacing tokens.
- Spacing: Standardize spacing units for margins and paddings.
- Shadows and Radii: Create consistent elevation and corner radius tokens.
- **Enhanced**: Dark mode token overrides for all color and spacing tokens with smooth transitions.

**Section sources**
- [frontend/src/styles/global.css](file://frontend/src/styles/global.css)

### Appendix B: Background Rotation Data Model
- Entity fields include asset URL, metadata, and selection criteria.
- Migration defines table structure and constraints.
- DTO exposes safe fields to the client.

**Section sources**
- [backend/src/modules/apparence/entities/background.entity.ts](file://backend/src/modules/apparence/entities/background.entity.ts)
- [backend/migrations/081-module-apparence-fonds.sql](file://backend/migrations/081-module-apparence-fonds.sql)
- [backend/src/modules/apparence/dto/background.dto.ts](file://backend/src/modules/apparence/dto/background.dto.ts)

### Appendix C: Dark Mode Component Checklist
For each UI component, ensure the following dark mode requirements are met:
- ✅ Proper contrast ratios for text and interactive elements
- ✅ Visible focus indicators in dark mode
- ✅ Consistent spacing and alignment
- ✅ Appropriate hover and active states
- ✅ Screen reader compatibility
- ✅ Keyboard navigation support
- ✅ No reliance on color alone for information
- ✅ Smooth transitions between themes
- ✅ **New**: Centralized theme context consumption
- ✅ **New**: Proper ARIA attributes and semantic markup
- ✅ **New**: High contrast mode support

### Appendix D: Theme Development Best Practices
- Always test components in both light and dark modes
- Use CSS custom properties for theme-dependent values
- Implement proper fallbacks for unsupported features
- Document theme-specific behaviors and limitations
- Include accessibility testing in your development workflow
- Use browser developer tools to inspect computed styles in different themes
- **New**: Utilize centralized theme context for consistent state management
- **New**: Implement smooth transitions without layout shifts
- **New**: Test with screen readers and keyboard navigation
- **New**: Respect user motion preferences and system accessibility settings

### Appendix E: Centralized Theme API Reference
- **ThemeProvider**: Main context provider wrapping the application
- **useTheme**: Hook for consuming theme state and actions
- **ThemePreferences**: Interface for theme configuration and user preferences
- **ThemeTransition**: Utility functions for smooth theme switching
- **AccessibilityManager**: Functions for managing focus and keyboard navigation

**Section sources**
- [frontend/src/App.tsx](file://frontend/src/App.tsx)
- [frontend/src/styles/global.css](file://frontend/src/styles/global.css)