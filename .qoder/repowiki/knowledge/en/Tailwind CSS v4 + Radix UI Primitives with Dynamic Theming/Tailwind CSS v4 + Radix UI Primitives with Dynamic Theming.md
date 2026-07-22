---
kind: frontend_style
name: Tailwind CSS v4 + Radix UI Primitives with Dynamic Theming
category: frontend_style
scope:
    - '**'
source_files:
    - frontend/src/styles/globals.css
    - frontend/src/lib/cn.ts
    - frontend/src/lib/theme-utils.ts
    - frontend/src/stores/theme.store.ts
    - frontend/vite.config.ts
    - frontend/package.json
---

The frontend uses a modern, token-driven styling system built on Tailwind CSS v4 (via @tailwindcss/vite plugin) combined with Radix UI primitives for accessible, unstyled base components. Visual consistency is enforced through a centralized design-token layer and a runtime theme engine.

System and Toolchain
- CSS framework: Tailwind CSS v4 (tailwindcss@^4, @tailwindcss/vite). No separate tailwind.config.js; tokens are declared in the @theme block inside globals.css.
- Primitive component layer: @radix-ui/* (dialog, dropdown-menu, select, tabs, tooltip, visually-hidden, slot), all custom-styled via Tailwind. No prebuilt UI kit like shadcn or MUI.
- Class composition: clsx + tailwind-merge exposed as a shared cn() utility (src/lib/cn.ts) to safely merge conditional class strings.
- Icons: lucide-react.
- Animations: framer-motion for page/component transitions.
- Build: Vite 6 with React plugin, TanStack Router plugin, and PWA plugin.

Design Tokens and Responsive Strategy
All tokens live in frontend/src/styles/globals.css:
- Breakpoints: 9 custom breakpoints from xxs: 100px to 5xl: 2560px defined via @theme --breakpoint-*.
- Color palette: Three semantic scales — --color-dominant-* (green #28a745), --color-secondary-* (yellow #ffc107), --color-accent-* (blue #007bff) — following a 60-30-10 rule. Semantic aliases (success, warning, danger, info) and surface/text tokens (--color-surface, --color-background, --color-text-primary, ...) are also declared.
- Fluid spacing/typography/radius/gap: All expressed as CSS clamp() variables under :root (e.g. --text-base, --space-md, --radius-lg, --gap-xl) so everything scales smoothly across viewports.
- Dark mode: Triggered by data-theme="dark" on <html>. A @custom-variant dark (&:where([data-theme="dark"] *)) lets Tailwind's dark: prefix work against this attribute. Dark overrides sit in [data-theme='dark'] { ... } blocks.

Runtime Theme Engine
A Zustand store (src/stores/theme.store.ts) persists and applies the active theme:
- State: couleurDominante, couleurSecondaire, couleurAccent, mode (light | dark | auto).
- Palette generation: src/lib/theme-utils.ts converts a hex dominant color into full 50–950 scales, derives secondary (+40° hue) and accent (+200° hue) palettes, and writes them as CSS custom properties on document.documentElement via appliquerThemeCSS().
- Persistence: zustand/middleware with createJSONStorage(() => localStorage) under key elisaschool-theme.
- Server sync: chargerDepuisConfig() fetches /api/configuration and merges backend-provided theme values.
- Favicon: Dynamically regenerated as an inline SVG matching the dominant color.

Conventions Developers Should Follow
1. Always use cn() for conditional classes — never concatenate class strings manually.
2. Reference tokens via CSS variables, not hardcoded colors: e.g. bg-[var(--color-dominant-600)], text-[var(--color-text-primary)], border-[var(--color-border)].
3. Use fluid tokens (--text-*, --space-*, --radius-*, --gap-*) instead of fixed values to keep responsive scaling consistent.
4. Dark-mode variants must be written with Tailwind's dark: modifier (which targets data-theme="dark"); do not rely on prefers-color-scheme directly.
5. Extend the palette only through COULEURS_DOMINANTES in theme-utils.ts and let genererEchelleCouleur / genererSecondaire / genererAccent derive the rest.
6. Radix primitives are the building blocks — wrap them in feature-specific components rather than writing raw dialog/select markup.
7. Keep global styles in globals.css; avoid per-component CSS files unless absolutely necessary.