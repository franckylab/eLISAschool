---
kind: frontend_style
name: Tailwind v4 + Radix UI Design System with Dynamic Theming
category: frontend_style
scope:
    - '**'
source_files:
    - frontend/src/styles/globals.css
    - frontend/src/lib/cn.ts
    - frontend/src/stores/theme.store.ts
    - frontend/src/lib/theme-utils.ts
    - frontend/src/components/ui/index.ts
    - frontend/src/components/ui/ElisaButton.tsx
    - frontend/src/components/ui/Card.tsx
---

The eLISAschool frontend uses a modern, token-driven styling approach built on Tailwind CSS v4, Radix UI primitives, and a custom component library. The system is organized around design tokens, runtime theme switching, and consistent UI patterns across the application.

## Core Styling Stack
- **Tailwind CSS v4** with `@tailwindcss/vite` plugin for build-time processing
- **Radix UI primitives** (`@radix-ui/react-*`) for accessible, unstyled base components (Dialog, Select, DropdownMenu, Tabs, Tooltip)
- **Class Variance Authority (CVA)** for variant-based component styling
- **clsx + tailwind-merge** via a centralized `cn()` utility for conditional class composition
- **Framer Motion** for micro-interactions and transitions
- **Lucide React** for consistent iconography

## Design Token Architecture
All visual tokens are defined in `frontend/src/styles/globals.css` using Tailwind's `@theme` directive:
- **Color System**: 60-30-10 rule with dominant (green #28a745), secondary (yellow #ffc107), and accent (blue #007bff) palettes, each with 50-950 scales
- **Semantic Colors**: success, warning, danger, info mapped to Bootstrap-compatible values
- **Surface/Text Tokens**: surface, background, border, text-primary/secondary/muted/strong, card variants
- **Typography Scale**: fluid clamp() values from xs to 4xl
- **Spacing System**: fluid clamp() values from xxs to 2xl
- **Border Radius**: sm, md, lg, xl with fluid sizing
- **Breakpoints**: 9 custom breakpoints (xxs: 100px → 5xl: 2560px) beyond Tailwind defaults

## Runtime Theme System
A dynamic theming engine allows real-time color customization:
- **Zustand Store** (`stores/theme.store.ts`) manages theme state with localStorage persistence
- **Theme Utilities** (`lib/theme-utils.ts`) generate color scales, derive secondary/accent colors via HSL manipulation
- **CSS Variable Injection**: `appliquerThemeCSS()` dynamically updates `--color-dominant-*`, `--color-secondary-*`, `--color-accent-*` variables
- **Dark Mode**: Controlled via `data-theme="dark"` attribute on `<html>` element, with separate token overrides
- **Auto Mode**: Respects `prefers-color-scheme` when mode is set to 'auto'
- **Favicon Generation**: Dynamic favicon creation based on dominant color luminance

## Component Library Structure
Custom components live in `components/ui/` following shadcn-like conventions:
- **Primitives**: `ElisaButton`, `ElisaInput`, `ElisaSelect`, `ElisaToggle` - styled wrappers around Radix primitives
- **Layout**: `Card`, `CardHeader`, `CardContent`, `CardFooter`, `CardSection` with motion animations
- **Data Display**: `Badge`, `StatCard`, `KpiCard`, `DataTable`
- **Forms**: `SearchInput`, `FilterPanel`, `PermissionCheckbox`, `FileUpload`
- **Navigation**: `TabsBar`, `RowActions`, `SettingsRow`
- **Utilities**: `Skeleton`, `InfoField`, `SectionSeparator`, `TextLabel`
- **Export Barrel**: Centralized re-exports via `components/ui/index.ts`

## Styling Conventions
- **Utility-First**: Components primarily use Tailwind classes with CVA for variants
- **Token Usage**: All colors, spacing, typography reference CSS variables (e.g., `bg-[var(--color-dominante)]`)
- **Responsive Design**: Mobile-first with fluid clamp() values adapting to viewport size
- **Accessibility**: Focus-visible outlines, keyboard navigation via Radix primitives, semantic HTML
- **Animation Patterns**: Consistent spring transitions, scale effects on hover/tap, fade-in card animations
- **Dark Mode Support**: Complete dark theme with inverted backgrounds, adjusted contrast ratios, SVG filter adjustments for background images

## Build & Development
- **Vite Configuration**: Uses `@tailwindcss/vite` for CSS processing
- **Global Styles**: Single entry point at `src/styles/globals.css` imported in `main.tsx`
- **No SCSS/Sass**: Pure CSS with CSS variables for maximum compatibility
- **Type Safety**: TypeScript interfaces for all component props with proper type exports