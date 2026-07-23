---
kind: frontend_style
name: Tailwind CSS v4 + Dynamic Theme System with Design Tokens
category: frontend_style
scope:
    - '**'
source_files:
    - frontend/src/styles/globals.css
    - frontend/src/lib/theme-utils.ts
    - frontend/src/stores/theme.store.ts
    - frontend/src/lib/cn.ts
    - frontend/src/components/ui/ElisaButton.tsx
    - frontend/src/components/layout/PageLayout.tsx
    - frontend/package.json
---

The eLISAschool frontend uses a comprehensive, multi-layered styling system built around Tailwind CSS v4 with dynamic theming and design tokens. The approach combines utility-first CSS with runtime theme customization through CSS custom properties.

**Core Styling Stack:**
- **Tailwind CSS v4** with `@tailwindcss/vite` plugin for build-time processing
- **CSS Custom Properties** as the primary design token system, defined in `frontend/src/styles/globals.css`
- **class-variance-authority (CVA)** for component variant management (e.g., button variants)
- **clsx + tailwind-merge** via centralized `cn()` utility for conditional class merging
- **Framer Motion** for micro-interactions and transitions
- **Radix UI primitives** for accessible base components

**Design Token Architecture:**
The system implements a 60-30-10 color rule with three semantic color families:
- **Dominant colors (60%)**: Primary brand colors (default green #28a745) with 50-950 scale
- **Secondary colors (30%)**: Complementary palette (default yellow #ffc107) 
- **Accent colors (10%)**: Highlight colors (default blue #007bff)

All tokens are exposed as CSS variables (`--color-dominant-*`, `--color-secondary-*`, `--color-accent-*`) that can be dynamically updated at runtime via JavaScript.

**Dynamic Theming System:**
A Zustand store (`theme.store.ts`) manages theme state with persistence to localStorage. The system supports:
- **Runtime color switching** - users can change the dominant color, automatically generating secondary/accent palettes
- **Dark/light mode** - controlled via `data-theme` attribute on document root
- **Auto mode** - respects system preferences
- **Backend synchronization** - themes persist to backend configuration API
- **Dynamic favicon generation** - updates browser icon based on selected color

**Responsive Strategy:**
- **9+ breakpoints** from 100px to 2560px using Tailwind's `@theme` directive
- **Fluid typography and spacing** using CSS `clamp()` functions for smooth scaling
- **Mobile-first layout** with sidebar overlay pattern on small screens
- **Touch-friendly sizing** with minimum 44px touch targets

**Component Library Pattern:**
Custom UI components in `src/components/ui/` follow consistent patterns:
- **CVA-based variants** for props like `variant`, `size`, `fullWidth`
- **CSS variable usage** instead of hardcoded colors
- **Framer Motion animations** for hover/tap interactions
- **Accessibility-first** with proper ARIA attributes and focus management
- **Barrel exports** for clean imports

**Layout System:**
- **PageLayout component** provides consistent app shell with collapsible sidebar
- **Background system** with honeycomb pattern and rotating catalog backgrounds
- **Consistent spacing** using CSS custom properties for padding, gaps, and margins

**Key Conventions:**
- Use `cn()` utility for all className composition
- Reference colors via CSS variables (`var(--color-dominante)`) not hardcoded values
- Follow CVA pattern for component variants
- Use fluid clamp() values for responsive sizing
- Maintain dark mode compatibility with `data-theme` selector
- Keep components theme-aware through CSS custom properties rather than prop drilling