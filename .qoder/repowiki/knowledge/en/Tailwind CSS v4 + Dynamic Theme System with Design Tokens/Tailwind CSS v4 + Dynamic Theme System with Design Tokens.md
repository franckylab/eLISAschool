---
kind: frontend_style
name: Tailwind CSS v4 + Dynamic Theme System with Design Tokens
category: frontend_style
scope:
    - '**'
source_files:
    - frontend/src/styles/globals.css
    - frontend/src/lib/theme-utils.ts
    - frontend/src/lib/cn.ts
    - frontend/src/components/ui/ElisaButton.tsx
    - frontend/src/components/ui/card-variants.ts
    - frontend/src/components/ui/index.ts
---

The eLISAschool frontend uses a comprehensive Tailwind CSS v4 styling system built around dynamic design tokens, runtime theme switching, and a 60-30-10 color rule architecture.

Core Styling Stack
Primary framework: Tailwind CSS v4 with @tailwindcss/vite plugin, imported via @import 'tailwindcss' in the global stylesheet. No tailwind.config.js file — configuration lives entirely in CSS using the new @theme directive.
Component primitives: Radix UI primitives provide unstyled, accessible base components, while custom wrappers in src/components/ui/ add consistent styling through Class Variance Authority (CVA) and utility composition.
Utility layer: A centralized cn() helper in src/lib/cn.ts combines clsx and tailwind-merge for safe class merging across all components.

Design Token Architecture
Color system follows the 60-30-10 rule:
- Dominant (60%): Green #28a745 by default, configurable at runtime
- Secondary (30%): Yellow #ffc107, auto-generated from dominant hue (+40 degrees)
- Accent (10%): Blue #007bff, auto-generated from dominant hue (+200 degrees)
Each palette generates full 50-950 scales via HSL manipulation in src/lib/theme-utils.ts. Semantic aliases (--color-dominante, --color-texte, --color-bordure) bridge between French naming conventions and component usage.
Typography and spacing: Fluid sizing via CSS clamp() functions for responsive text (--text-*), spacing (--space-*), padding (--padding-*), icons (--icon-*), radius (--radius-*), and gaps (--gap-*). All values scale smoothly across breakpoints.
Breakpoints: Nine custom breakpoints from xxs: 100px to 5xl: 2560px defined in the @theme block, enabling granular responsive control.

Runtime Theming
Theme switching is driven by data-theme="dark" attribute on the document root, with a custom @custom-variant dark selector. The appliquerThemeCSS() function dynamically generates and applies CSS custom properties when users select brand colors through the appearance settings module.
Dark mode inverts background/surface/text variables and adjusts SVG background filters for visibility.

Component Styling Conventions
Primitive pattern: Components use CVA variants for consistent styling with base classes and variant maps.
Token consumption: Components reference CSS variables directly via var(--color-dominante) or Tailwind arbitrary value syntax bg-[var(--color-dominante)].
Responsive patterns: Heavy use of clamp() within Tailwind classes for fluid sizing, avoiding media query duplication.
Accessibility: Global focus styles via :focus-visible, semantic color roles (success/warning/danger/info), and Radix primitives ensure consistent accessibility.

Key Files
frontend/src/styles/globals.css - Central token definitions, breakpoints, dark mode, base styles
frontend/src/lib/theme-utils.ts - Color generation algorithms and runtime theme application
frontend/src/lib/cn.ts - Class merging utility
frontend/src/components/ui/ - Primitive component library with CVA-based styling
frontend/package.json - Dependencies including Tailwind v4, Radix UI, CVA, Framer Motion

Developer Guidelines
Use cn() for all className composition to prevent conflicts
Reference design tokens via CSS variables, not hardcoded colors
Prefer CVA variants over inline conditional classes
Use clamp() for fluid typography and spacing instead of breakpoint-specific rules
Follow the 60-30-10 color rule when adding new brand colors
Dark mode compatibility is automatic when using CSS variable tokens