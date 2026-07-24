---
kind: frontend_style
name: Tailwind CSS v4 + Radix UI Design System with Dynamic Theming
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
    - frontend/src/components/ui/card-variants.ts
    - frontend/vite.config.ts
---

The eLISAschool frontend uses a modern, component-driven styling approach built on **Tailwind CSS v4** with a comprehensive design system centered around the 60-30-10 color rule and dynamic theming.

## Core Styling Stack

**Primary Framework**: Tailwind CSS v4 via `@tailwindcss/vite` plugin, configured in `vite.config.ts`. The build pipeline includes Vite PWA support for offline capabilities.

**Component Library**: Custom UI components built on **Radix UI primitives** (`@radix-ui/react-*`) for accessibility-first interactive elements (dialogs, dropdowns, selects, tabs, tooltips). Components are organized under `src/components/ui/` with a barrel export pattern.

**Utility Pattern**: A centralized `cn()` utility (`src/lib/cn.ts`) combines `clsx` and `tailwind-merge` for conditional class composition, following shadcn/ui conventions.

## Design Tokens & Theme System

**CSS Variables Architecture**: All design tokens live in `src/styles/globals.css` using Tailwind's `@theme` directive:
- **Color System**: Three-tier palette following 60-30-10 rule — dominant (green #28a745), secondary (yellow #ffc107), accent (blue #007bff)
- **Semantic Colors**: success, warning, danger, info mapped to CSS custom properties
- **Fluid Typography**: Responsive font sizes using `clamp()` for smooth scaling across breakpoints
- **Spacing System**: Fluid spacing variables (--space-xs through --space-2xl) with responsive gaps
- **Breakpoints**: Extended from 100px to 2560px (xxs → 5xl) for granular responsive control

**Dynamic Theming Engine**: Powered by Zustand store (`stores/theme.store.ts`) with runtime CSS variable manipulation:
- Runtime color generation via HSL conversions in `lib/theme-utils.ts`
- Automatic secondary/accent color derivation from dominant color
- Dark mode toggle via `data-theme` attribute on `<html>`
- Persistent theme state in localStorage with server-side configuration sync
- Dynamic favicon generation based on dominant color contrast

## Component Architecture

**Primitives**: Reusable base components (`ElisaButton`, `ElisaInput`, `ElisaSelect`, etc.) use `class-variance-authority` (cva) for variant management with consistent prop interfaces.

**Layout System**: Consistent spacing using CSS variables, fluid clamp() values, and Tailwind's spacing scale. Components follow mobile-first responsive patterns.

**Animation**: Framer Motion integrated for micro-interactions, transitions, and gesture-based animations throughout the interface.

## Responsive Strategy

**Mobile-First**: Base styles target mobile screens with progressive enhancement for larger viewports. Breakpoints extend beyond standard Tailwind defaults to accommodate various device sizes.

**Fluid Sizing**: Extensive use of `clamp()` functions ensures smooth scaling without breakpoint jumps. Icon sizes, padding, margins, and typography all respond fluidly to viewport changes.

## Accessibility & UX Patterns

**Accessibility**: Radix UI primitives provide focus management, keyboard navigation, and screen reader support. Global focus-visible styles ensure keyboard navigation is clearly indicated.

**Dark Mode**: Complete dark theme implementation with inverted color schemes, adjusted background filters for SVG backgrounds, and proper contrast ratios maintained across both modes.

**Internationalization**: French language throughout the codebase with i18next integration for future multi-language support.