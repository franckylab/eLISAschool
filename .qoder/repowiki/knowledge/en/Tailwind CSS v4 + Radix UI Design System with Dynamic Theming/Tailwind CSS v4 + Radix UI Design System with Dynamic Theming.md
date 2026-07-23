---
kind: frontend_style
name: Tailwind CSS v4 + Radix UI Design System with Dynamic Theming
category: frontend_style
scope:
    - '**'
source_files:
    - frontend/src/styles/globals.css
    - frontend/src/lib/cn.ts
    - frontend/src/lib/theme-utils.ts
    - frontend/src/stores/theme.store.ts
    - frontend/src/components/ui/index.ts
    - frontend/src/components/ui/ElisaButton.tsx
    - frontend/package.json
---

## Frontend Style Architecture

The eLISAschool frontend uses a modern, token-driven styling approach built on Tailwind CSS v4 with a custom design system centered around the 60-30-10 color rule.

### Core Styling Stack

- CSS Framework: Tailwind CSS v4 with @tailwindcss/vite plugin for build-time processing
- Primitive Components: Radix UI primitives (@radix-ui/*) for accessible, unstyled base components (Dialog, Select, DropdownMenu, Tabs, Tooltip)
- Utility Libraries:
  - clsx + tailwind-merge via centralized cn() utility for conditional class composition
  - class-variance-authority (cva) for component variant systems
  - framer-motion for micro-interactions and transitions
  - lucide-react for consistent iconography

### Design Token System

All visual tokens are defined in frontend/src/styles/globals.css using Tailwind's new @theme directive:

- Color Palette: Three-tier system following 60-30-10 rule
  - Dominant colors (60%): Green scale --color-dominant-* (#28a745 base)
  - Secondary colors (30%): Yellow scale --color-secondary-* (#ffc107 base)
  - Accent colors (10%): Blue scale --color-accent-* (#007bff base)
- Semantic Colors: Success, warning, danger, info tokens
- Surface Tokens: Background, surface, border, text hierarchy
- Fluid Typography: CSS clamp() functions for responsive font sizes
- Fluid Spacing: Responsive spacing variables using clamp()

### Responsive Strategy

Nine breakpoints from 100px to 2560px (xxs through 5xl) provide granular control across all device sizes. The system uses fluid sizing throughout — typography, spacing, padding, borders, and icons all scale smoothly between breakpoints rather than jumping at fixed points.

### Dark Mode Implementation

Dark mode is controlled via data-theme="dark" attribute on <html> rather than media queries. A Zustand store (stores/theme.store.ts) manages theme state with persistence to localStorage, supporting three modes: light, dark, and auto (system preference). The theme can be dynamically customized per establishment through the configuration API.

### Component Architecture

Custom UI components live in src/components/ui/ and follow consistent patterns:
- Each component uses cn() for class merging
- Variants defined with cva() for prop-based styling
- All dimensions use CSS variables or clamp() for fluidity
- Accessible focus states using focus-visible pseudo-class
- Consistent animation patterns via Framer Motion

### Key Conventions

1. Never use hardcoded colors — always reference CSS variables like var(--color-dominante)
2. Use cn() utility instead of template literals for conditional classes
3. Prefer CSS variables over Tailwind arbitrary values for maintainability
4. Follow cva pattern for component variants (primary/secondary/ghost/danger)
5. Use fluid sizing with clamp() for responsive components
6. Radix UI primitives as foundation, styled with Tailwind utilities
7. Theme-aware styling via data-theme selector for dark mode support