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
    - frontend/package.json
---

The frontend uses a modern, token-driven styling architecture built on **Tailwind CSS v4** (via `@tailwindcss/vite` plugin) combined with **Radix UI primitives** for accessible, unstyled base components. The system is organized around three core layers: design tokens, utility composition, and runtime theming.

### Styling Stack
- **Tailwind CSS v4** — imported via `@import 'tailwindcss'` in `globals.css`, using the new `@theme` block to declare breakpoints, color scales, spacing, typography, and radius tokens directly in CSS rather than a separate config file.
- **Radix UI primitives** — `@radix-ui/react-*` packages provide headless, accessible building blocks (`dialog`, `select`, `dropdown-menu`, `tabs`, `tooltip`, `visually-hidden`) that are wrapped in custom `Elisa*` components under `src/components/ui/`.
- **Utility composition** — a local `cn()` helper (`src/lib/cn.ts`) composes `clsx` + `tailwind-merge` for conditional class merging; no external component library (no shadcn/ui CLI scaffolding).
- **Icons** — `lucide-react` for consistent iconography across the app.
- **Animations** — `framer-motion` for page/component transitions.

### Design Tokens & Responsive Strategy
All tokens live in `frontend/src/styles/globals.css` inside a single `@theme` block:
- **Breakpoints**: 9+ from `xxs: 100px` through `5xl: 2560px`, enabling fine-grained responsive control.
- **Color palette**: Three semantic scales following a **60-30-10 rule** — `--color-dominant-*` (green #28a745), `--color-secondary-*` (yellow #ffc107), `--color-accent-*` (blue #007bff) — plus semantic aliases (`success`, `warning`, `danger`, `info`).
- **Typography & spacing**: Fluid values via CSS `clamp()` for text sizes, spacing, padding, gaps, border-radius, and icon sizes, all exposed as CSS variables.
- **Dark mode**: Controlled by `data-theme="dark"` on `<html>` (not `prefers-color-scheme` media query); dark overrides live in `[data-theme='dark']` selectors within `@layer base`.
- **Global resets**: Box-sizing, smooth scroll, Inter font stack, custom scrollbar, focus-visible outline, and selection colors.

### Runtime Theming System
A dynamic theme engine lets users pick a dominant brand color at runtime:
- `src/lib/theme-utils.ts` provides HSL conversion utilities (`hexToHsl`, `hslToHex`) and generates full 50–950 color scales, secondary/accent palettes derived from the dominant hue, contrast detection, and `appliquerThemeCSS()` which writes computed CSS variables onto `document.documentElement`.
- `src/stores/theme.store.ts` (Zustand + `persist` middleware) owns state (`couleurDominante`, `couleurSecondaire`, `couleurAccent`, `mode`) and persists it to `localStorage`. It also syncs with the backend `/api/configuration` endpoint to load per-establishment theme settings and dynamically updates the favicon SVG based on luminance.
- `COULEURS_DOMINANTES` preset list offers nine predefined brand colors (Vert, Bleu, Rouge, Jaune, Violet, Orange, Marron, Rose, Gris).

### Component Library Conventions
Reusable UI lives in `src/components/ui/` with a barrel export (`index.ts`). Components follow these patterns:
- **Primitives over frameworks**: Every interactive primitive wraps a Radix primitive (e.g., `ElisaSelect` → `@radix-ui/react-select`, `CustomModal` → `@radix-ui/react-dialog`).
- **Class composition**: All className props go through `cn(...)` to allow callers to override or extend styles safely.
- **Token usage**: Colors, spacing, and typography reference CSS variables (`var(--color-dominante)`, `var(--text-base)`, `var(--space-md)`) rather than hardcoded Tailwind classes, enabling runtime re-theming.
- **Variant types**: Components expose typed variant props (e.g., `CardTone`, `ActionVariant`, `Tab`) instead of string magic.
- **Accessibility**: Focus management, ARIA attributes, and keyboard navigation come from Radix; global `:focus-visible` rules enforce consistent focus rings.

### What's NOT used
- No SCSS/Sass, Less, or CSS-in-JS libraries (no styled-components, Emotion).
- No third-party UI kit (no MUI, Chakra, AntD, shadcn/ui CLI-generated code).
- No separate `tailwind.config.js` — configuration is entirely in-CSS via `@theme`.
- No CSS modules or BEM naming; styling is purely utility-first.