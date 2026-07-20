# eLISAschool — Session Context

## Objective
Uniformiser toutes les pages des modules (filières, spécialités, examens-nationaux, diplomes-eleves, competences, periodes, notes, emploi-du-temps, configuration, parametres) sur le même patron architectural que les pages utilisateurs.

## Important Details
- Patron de référence "utilisateurs" : PageHeader `variant="gradient"` + `onBack` + icône contextuelle, DataTable avec `enableReordering`/`enablePinning`/`enableColumnVisibility`/`disableClientSearch`, actions en glass container `bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-2`, ConfirmDialog pour les suppressions, i18n obligatoire, PageSkeleton/ErrorMessage pour les états.
- 10 modules uniformisés dans cette session.
- Icône examens-nationaux : `ClipboardCheck` (remplace `FileText`).
- Icône filières : `Split` (remplace `BookOpen`, sidebar `Award` → `Split`).
- Typecheck : 0 nouvelle erreur sur tous les fichiers modifiés.

## Work State
### Completed (all 10 modules)
1. **filières** — page liste + détail + modale : `variant="gradient"`, glass actions, retrait FilterPanel redondant (filtres consolidés dans DataTable), ConfirmDialog, dark mode, i18n titres de section. Icône `Split`.
2. **spécialités** — détail : PageHeader gradient + Card/InfoField + i18n. Liste : `tableId="specialites"`.
3. **examens-nationaux** — liste + détail + modale : `variant="gradient"`, glass actions, `enableReordering`/`enablePinning`/`enableColumnVisibility`/`disableClientSearch`, `onBack`, ConfirmDialog suppression, icône `ClipboardCheck`. Namespace i18n créé, locales FR/EN réécrites en flat, ns ajouté dans i18n.ts.
4. **diplomes-eleves** — 3 fichiers (liste + détail + modale) + locales FR/EN + namespace i18n créé.
5. **competences** — détail : PageHeader gradient + Card/InfoField + i18n.
6. **periodes** — liste + détail : PageHeader gradient + ConfirmDialog.
7. **notes** — liste : PageSkeleton + ErrorMessage + ConfirmDialog + DataTable `tableId`. Détail : delete button câblé avec ConfirmDialog + `useSupprimerNote`.
8. **emploi-du-temps** — PageHeader gradient + PageSkeleton + ErrorMessage + i18n.
9. **configuration** — PageHeader gradient + PageSkeleton + ErrorMessage + Cards.
10. **parametres** — i18n complète, ConfirmDialog, locales FR/EN, namespace `'parametres'` dans i18n.ts.
- **Sidebar.tsx** : `Split` pour filières, `ClipboardCheck` pour examens-nationaux.

### Active
— Aucune tâche active.

## Fond alvéole principal (nid d'abeille)
- **SVG statique généré** : `public/fonds-catalogue/nid-alveole-dark.svg` + `nid-alveole-light.svg` — 570 hexagones chacun, 1920×1080, `preserveAspectRatio="xMidYMid slice"`
- **Damier `e`/`S`** : alternance stricte `(row + col) % 2`, `e` en `#5a8a6a`/`#8a9a84`, `S` en `#6a9a7a`/`#7a8a74` (dark/light), opacité 0.45
- **Gradient global dark** : `#1a3a3a` → `#0d2b2b` (teal foncé)
- **Gradient global light** : `#f0f2ee` → `#e6eae2` (gris clair)
- **Gradient par cellule** : 12 directions (30° incréments), assignation pseudo-aléatoire via `seedRand`. Dark : `#1e4040` → `#2d5a4a`. Light : `#e8ece4` → `#dce2da`. Opacité 0.55, contour 0.5px.
- **Composant** `NidAlveoleBackground.tsx` : `fixed inset-0 -z-20`, `background-size: cover`, détecte `data-theme` via MutationObserver pour servir le SVG correspondant
- **Z-ordering** dans `PageLayout` : `-z-20` (base) → `FondRotator` `-z-10` (SVGs catalogue par-dessus, transparent si aucun fond)
- **Générateur** : `/tmp/opencode/gen-honeycomb.js` (Node, usage unique, génère les deux variantes)

### Blocked
— (none)

## Next Move
Attendre les instructions de l'utilisateur.

## Notes de conception
- `FilterPanel` retiré quand redondant avec les filtres DataTable intégrés (`enableCollapsibleFilters` + `filtres` prop).
- Toutes les modales de formulaire suivent le pattern : `CustomModal`, `FORM_INIT` constante, `SectionSeparator`, `hasUnsavedChanges`, reset à la fermeture par `useEffect`.
- Pas de glass container system-wide — uniquement dans les actions du PageHeader.
- ConfirmDialog pour toutes les suppressions (pas de `window.confirm`).
- `TextLabel` (composant réutilisable `components/ui/TextLabel.tsx`) pour les labels importants : utilise `--color-text-strong` (contrat plus élevé), `font-weight: 600`, tooltip natif `title` lors du troncage. 5 occurrences migrées (TransfertList, periode-detail-page ×2, modal-gestion-niveaux, modal-gestion-compositions).
- Hierarchie de contraste : `--color-text-strong` (near-black `#0f172a`/white `#ffffff`) > `--color-text-primary` (`#1f2937`/`#f3f4f6`) > `--color-text-secondary` (`#4b5563`/`#9ca3af`) > `--color-text-muted`.

## Fonds SVG catalogue (dark mode)
- Tous les SVGs du catalogue utilisent `stroke="currentColor"` et `fill="currentColor"` → `currentColor` se résout en `#000000` dans une image autonome.
- **Correction dark mode** : CSS variables `--fond-filter` et `--fond-opacity` dans `globals.css` :
  - Light : `--fond-filter: none; --fond-opacity: 0.3`
  - Dark  : `--fond-filter: invert(0.85) brightness(1.4); --fond-opacity: 0.7`
- **Composant `FondImage`** (`components/ui/FondImage.tsx`) réutilisable pour toute vignette/aperçu de fond. Modes `background` (FondRotator) et `img` (grille catalogue).
  - Applique `filter: var(--fond-filter)` et `opacity: var(--fond-opacity)` automatiquement.
  - Cache-bust via `?v=${Date.parse(fond.updatedAt)}` intégré.
- **FondRotator** : wrapper div avec les CSS variables, `willChange: opacity, filter`. Rendu transparent (null) en cas d'erreur/chargement/absence de fonds — plus de fallback couleur opaque pour laisser voir le nid d'abeille en dessous. Prop `fallbackColor` supprimée.
- **ApparencePage** : preview `<img>` avec `filter: var(--fond-filter)`. Grille catalogue avec miniatures SVG via `FondImage` + overlay hover "Aperçu".
