---
trigger: always_on
---
/**
 * ==================================
 * eLISAschool - Règles Frontend
 * ==================================
 * Version: 1.0.0
 * Portée: Tout le code frontend React/TypeScript
 * Langue: Français (dialogues, commentaires), termes techniques en anglais
 */

# Conventions eLISAschool — Frontend React

> **Portée** : Tout le code frontend TypeScript (React 19 + Vite + Tailwind CSS + shadcn/ui).
> **Langue** : Réfléchis, dialogues et commentaires en **français**. Termes techniques en **anglais**.
> **Évolution** : Cette règle est **vivante** — mise à jour automatique quand un nouveau pattern émerge.

---

## 📚 Documentation — Règle Associée

**TOUJOURS** consulter et appliquer la règle de gestion documentaire : [elisaschool-docs-management.md](elisaschool-docs-management.md)

**Règles clés** :
- **TOUS** les fichiers `.md` (sauf README, QUICKSTART, CHEATSHEET) vont dans `docs/`
- **Classification** par type : analyses/, corrections/, guides/, rapports/, etc.
- **Nommage** : `TYPE-SUJET-CONTEXTE.md` (KEBAB-CASE)
- **INDEX.md** : Mettre à jour après chaque session de travail
- **Jamais** de fichiers `.md` à la racine du projet, `backend/`, ou `frontend/`

---

## ⚠️ INVOCATION AUTOMATIQUE DES SKILLS — OBLIGATOIRE

**Avant toute tâche de développement ou modification frontend**, l'IA **DOIT** invoquer proactivement le skill approprié **sans attendre que l'utilisateur le demande** :

| Tâche détectée | Skill à invoquer |
|----------------|------------------|
| Créer/modifier un composant, page, hook, formulaire, intégration API | `/elisaschool-frontend-dev` |
| Refactoriser, optimiser, moderniser, nettoyer du code frontend | `/elisaschool-frontend-refactor` |
| Comprendre/modifier une règle métier backend, un calcul, un workflow | `/elisaschool-business-logic` |
| Créer/modifier un endpoint, entité, service backend | `/elisaschool-dev` |

**Règles** :
1. **TOUJOURS** invoquer le skill **avant** de coder
2. **TOUJOURS** invoquer `/elisaschool-frontend-dev` avant de créer un nouveau composant ou page
3. **TOUJOURS** invoquer `/elisaschool-frontend-refactor` avant toute refactorisation
4. **Combiner** si nécessaire (ex: feature full-stack → `/elisaschool-dev` + `/elisaschool-frontend-dev`)
5. **Ne JAMAIS** ignorer cette section

---

## 1. Stack Technique

| Technologie | Version | Usage |
|-------------|---------|-------|
| React | 19+ | Framework UI |
| TypeScript | 5.5+ | Typage strict |
| Vite | 6+ | Build tool & dev server |
| Tailwind CSS | 4+ | Styling utility-first |
| shadcn/ui | latest | Composants UI de base |
| TanStack Query (React Query) | 5+ | Data fetching, cache, temps réel |
| TanStack Router | 1+ | Routing type-safe |
| TanStack Table | 8+ | Tableaux avancés (tri, filtre, pagination) |
| Zustand | 5+ | State management global léger |
| React Hook Form | 7+ | Formulaires performants |
| Zod | 3+ | Validation (partagé avec backend) |
| Framer Motion | 11+ | Animations et transitions |
| Sonner | 2+ | Notifications toast |
| @dnd-kit | 6+ | Drag and drop |
| date-fns | 4+ | Manipulation dates |
| jsPDF + html2canvas | latest | Génération PDF |
| qrcode.react | 4+ | QR codes |
| i18next | 24+ | Framework de traduction (noyau) |
| react-i18next | 15+ | Hook `useTranslation()` pour React |
| Lucide React | latest | Icônes |
| PWA (vite-plugin-pwa) | latest | Progressive Web App |

---

## 2. Nommage

| Élément | Convention | Exemple |
|---------|-----------|---------|
| Composants | `PascalCase` | `EleveCard`, `NoteTable` |
| Hooks personnalisés | `camelCase` préfixé `use` | `useEleves`, `useTheme` |
| Variables, fonctions | `camelCase` en français | `dateNaissance`, `chargerEleves` |
| Constantes | `UPPER_SNAKE_CASE` | `MAX_ITEMS_PER_PAGE` |
| Fichiers composants | `PascalCase.tsx` | `EleveCard.tsx` |
| Fichiers hooks | `camelCase.ts` | `useEleves.ts` |
| Fichiers utilitaires | `kebab-case.ts` | `date-utils.ts` |
| Fichiers de store | `camelCase.store.ts` | `auth.store.ts` |
| Fichiers de types | `camelCase.types.ts` | `eleve.types.ts` |
| Dossiers de features | `kebab-case` | `gestion-notes`, `bulletins` |
| CSS modules / Tailwind | Utiliser Tailwind uniquement | Pas de CSS custom sauf animation |
| Dossiers de locales | `locales/{lang}/` | `locales/fr/`, `locales/en/` |
| Fichiers de traduction | `{feature}.json` (kebab-case) | `eleves.json`, `common.json` |
| Clés de traduction | `camelCase.pointé` | `eleves.titres.liste`, `common.boutons.enregistrer` |

---

## 3. Architecture Frontend

```
frontend/
├── public/
│   ├── icons/                    # Icônes PWA
│   ├── logos/                    # Logos eLISAschool
│   │   ├── logo-complet.svg      # Icône + texte "elisa°school"
│   │   ├── logo-icon.svg         # Cercle uniquement
│   │   └── logo-text.svg         # Texte uniquement
│   ├── manifest.json             # PWA manifest
│   └── favicon.ico
├── src/
│   ├── app/                      # Configuration application
│   │   ├── App.tsx               # Composant racine
│   │   ├── router.tsx            # Configuration TanStack Router
│   │   ├── providers.tsx         # Providers (Query, Theme, Auth, i18n)
│   │   └── routes/               # Routes par feature
│   │       ├── __root.tsx        # Layout racine
│   │       ├── index.tsx         # Page d'accueil
│   │       ├── login.tsx         # Connexion
│   │       ├── dashboard.tsx     # Dashboard
│   │       └── ...
│   ├── components/               # Composants réutilisables
│   │   ├── ui/                   # Composants shadcn/ui étendus
│   │   ├── layout/               # Layouts (Sidebar, Header, Footer)
│   │   │   └── language-switcher.tsx  # Sélecteur de langue FR/EN
│   │   ├── forms/                # Composants formulaires avancés
│   │   ├── tables/               # Composants tableaux avancés
│   │   ├── feedback/             # Toast, Loading, Empty states
│   │   ├── navigation/           # Breadcrumb, Tabs, Pagination
│   │   ├── modals/               # Modales personnalisées
│   │   ├── editors/              # Éditeurs de texte avancés
│   │   ├── date-picker/          # Calendrier personnalisé
│   │   ├── dropdown/             # Listes déroulantes avancées
│   │   └── dnd/                  # Composants drag & drop
│   ├── features/                 # Features métier (par module)
│   │   ├── eleves/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── stores/
│   │   │   ├── types/
│   │   │   └── index.ts
│   │   ├── notes/
│   │   ├── bulletins/
│   │   └── ...
│   ├── hooks/                    # Hooks partagés
│   │   ├── use-auth.ts
│   │   ├── use-theme.ts
│   │   ├── use-language.ts       # Hook changement de langue + sync backend
│   │   ├── use-keyboard-nav.ts
│   │   ├── use-debounce.ts
│   │   ├── use-media-query.ts
│   │   └── use-realtime.ts
│   ├── lib/                      # Utilitaires et configurations
│   │   ├── i18n.ts               # Configuration i18next (init, détection langue)
│   │   ├── api-client.ts         # Client API (fetch/axios)
│   │   ├── query-client.ts       # TanStack Query config
│   │   ├── validators.ts         # Schémas Zod partagés
│   │   ├── pdf-generator.ts      # Génération PDF
│   │   ├── image-compressor.ts   # Compression images
│   │   ├── qr-utils.ts           # Utilitaires QR code
│   │   └── export/               # Utilitaires d'export partagés (multi-module)
│   │       ├── index.ts          # Barrel export
│   │       ├── css-var-resolver.ts   # resolveCssVar, normaliserCouleurHex
│   │       ├── dom-stabilisation.ts  # attendreStabilisationDom (MutationObserver)
│   │       └── tuiles.ts         # calculerGrilleTuiles, decouperTuile (à extraire)
│   ├── stores/                   # Stores Zustand globaux
│   │   ├── auth.store.ts
│   │   ├── theme.store.ts
│   │   ├── language.store.ts     # Store Zustand langue courante
│   │   ├── notification.store.ts
│   │   └── sidebar.store.ts
│   ├── locales/                  # Fichiers de traduction i18n
│   │   ├── fr/                   # Français (défaut)
│   │   │   ├── common.json       # Traductions partagées (boutons, messages, labels)
│   │   │   ├── eleves.json       # Module élèves
│   │   │   ├── notes.json        # Module notes
│   │   │   └── ...               # Un fichier par feature
│   │   └── en/                   # Anglais
│   │       ├── common.json
│   │       ├── eleves.json
│   │       └── ...
│   ├── styles/                   # Styles globaux
│   │   ├── globals.css           # Tailwind + variables CSS
│   │   └── animations.css        # Animations personnalisées
│   ├── types/                    # Types globaux
│   │   └── global.d.ts
│   └── main.tsx                  # Point d'entrée
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── .env
```

---

## 4. Bannière de Fichier

**Obligatoire** sur tout nouveau fichier `.ts` / `.tsx` :

```typescript
/**
 * ==================================
 * eLISAschool - [Description courte]
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */
```

---

## 5. Système de Thème et Couleurs

### 5.1 Règle des Proportions 60-30-10

| Type | Proportion | Usage | Variable CSS |
|------|-----------|-------|-------------|
| **Dominante** | 60% | Fonds, surfaces, arrière-plans | `--color-dominant-*` |
| **Secondaire** | 30% | Éléments structurels, sidebar, headers | `--color-secondary-*` |
| **Accent** | 10% | Boutons CTA, liens, badges, highlights | `--color-accent-*` |

### 5.2 Couleurs Dynamiques par Établissement

Les couleurs sont **persistées en base de données** (ConfigurationApp + EtablissementConfig) et chargées au démarrage :

```typescript
// Store Zustand
interface ThemeStore {
    couleurDominante: string;    // ex: '#28a745' (vert par défaut)
    couleurSecondaire: string;   // Calculée automatiquement
    couleurAccent: string;       // Calculée automatiquement
    mode: 'light' | 'dark';
    setCouleurDominante: (couleur: string) => void;
    genererPalette: (dominante: string) => PaletteComplete;
}
```

### 5.3 Génération Automatique de Palette

Quand un établissement choisit une couleur dominante, les couleurs secondaire et accent sont **calculées automatiquement** :

```typescript
// Couleurs dominantes disponibles
const COULEURS_DOMINANTES = {
    vert:     '#28a745',
    bleu:     '#007bff',
    rouge:    '#dc3545',
    jaune:    '#ffc107',
    violet:   '#6f42c1',
    orange:   '#fd7e14',
    marron:   '#795548',
    rose:     '#e91e63',
    gris:     '#6c757d',
} as const;

// Fonction de génération de palette
function genererPalette(dominante: string): {
    dominante: EchelleCouleur;    // 50-950 (light à dark)
    secondaire: EchelleCouleur;   // Couleur complémentaire calculée
    accent: EchelleCouleur;       // Couleur triadique calculée
}
```

### 5.4 Variables CSS Dynamiques

```css
:root {
    /* Couleurs dominantes (60%) */
    --color-dominant-50: #f0fdf4;
    --color-dominant-100: #dcfce7;
    /* ... */
    --color-dominant-600: #28a745;  /* Base */
    /* ... */
    
    /* Couleurs secondaires (30%) */
    --color-secondary-50: #fffbeb;
    /* ... */
    --color-secondary-600: #ffc107;
    
    /* Couleurs accent (10%) */
    --color-accent-50: #eff6ff;
    /* ... */
    --color-accent-600: #007bff;
}
```

### 5.5 Lisibilité et Accessibilité

- **Contraste minimum** : 4.5:1 (texte normal), 3:1 (texte large) — WCAG AA
- **Vérifier automatiquement** le contraste avec la fonction `verifierContraste()`
- **Texte sur fond coloré** : Utiliser `getContrastColor(bgColor)` → retourne blanc ou noir
- **Mode sombre** : Généré automatiquement en inversant les luminances

---

## 6. Système d'Ultra-Responsivité (11 Niveaux: 100px → 2560px)

### ⚠️ OBLIGATOIRE — TOUS les composants DOivent être ultra-responsifs

**Règle d'or** : Chaque composant UI (modal, bouton, tableau, formulaire, card) DOIT s'adapter de **100px à 2560px** sans cassure visuelle.

### 6.1 Breakpoints (11 niveaux)

| Niveau | Nom | Largeur | Usage |
|--------|-----|---------|-------|
| 0 | `xxs` | 100-199px | Montres connectées, mini-écrans |
| 1 | `2xs` | 200-319px | Très petits téléphones |
| 2 | `xs` | 320-479px | Petits téléphones |
| 3 | `sm` | 480-639px | Téléphones standards |
| 4 | `md` | 640-767px | Grandes phablettes |
| 5 | `lg` | 768-1023px | Tablettes portrait |
| 6 | `xl` | 1024-1279px | Tablettes paysage / petits laptops |
| 7 | `2xl` | 1280-1535px | Laptops standards |
| 8 | `3xl` | 1536-1919px | Desktops |
| 9 | `4xl` | 1920-2559px | Grands écrans |
| 10 | `5xl` | 2560px+ | Écrans 4K+ |

### 6.2 Configuration Tailwind (globals.css)

```css
/* Dans @theme de globals.css */
--breakpoint-xxs: 100px;
--breakpoint-2xs: 200px;
--breakpoint-xs: 320px;
--breakpoint-sm: 480px;
--breakpoint-md: 640px;
--breakpoint-lg: 768px;
--breakpoint-xl: 1024px;
--breakpoint-2xl: 1280px;
--breakpoint-3xl: 1536px;
--breakpoint-4xl: 1920px;
--breakpoint-5xl: 2560px;
```

### 6.3 Variables CSS clamp() — OBLIGATOIRES

**TOUS les éléments dimensionnels** DOIVENT utiliser `clamp()` via des variables CSS :

```css
/* Dans :root de globals.css */

/* Tailles de police fluides */
--text-xs: clamp(0.625rem, 0.58rem + 0.2vw, 0.75rem);
--text-sm: clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem);
--text-base: clamp(0.875rem, 0.8rem + 0.35vw, 1rem);
--text-lg: clamp(1rem, 0.9rem + 0.5vw, 1.125rem);
--text-xl: clamp(1.125rem, 1rem + 0.6vw, 1.25rem);

/* Espacements fluides */
--space-xxs: clamp(0.125rem, 0.1rem + 0.1vw, 0.25rem);
--space-xs: clamp(0.25rem, 0.2rem + 0.2vw, 0.5rem);
--space-sm: clamp(0.5rem, 0.4rem + 0.3vw, 0.75rem);
--space-md: clamp(0.75rem, 0.6rem + 0.5vw, 1rem);
--space-lg: clamp(1rem, 0.8rem + 0.7vw, 1.5rem);
--space-xl: clamp(1.5rem, 1.2rem + 1vw, 2.5rem);

/* Padding composants */
--padding-modal-header: clamp(0.5rem, 0.4rem + 0.3vw, 1rem);
--padding-modal-body: clamp(0.75rem, 0.6rem + 0.5vw, 1.5rem);
--padding-table-cell: clamp(0.375rem, 0.25rem + 0.4vw, 1rem);
--padding-toolbar: clamp(0.375rem, 0.25rem + 0.3vw, 0.75rem);

/* Tailles d'icônes fluides */
--icon-xxs: clamp(0.625rem, 0.5rem + 0.3vw, 0.875rem);
--icon-xs: clamp(0.75rem, 0.65rem + 0.3vw, 1rem);
--icon-sm: clamp(0.875rem, 0.75rem + 0.4vw, 1.125rem);
--icon-md: clamp(1rem, 0.85rem + 0.5vw, 1.25rem);
--icon-lg: clamp(1.125rem, 0.95rem + 0.6vw, 1.5rem);

/* Border-radius fluides */
--radius-sm: clamp(0.25rem, 0.2rem + 0.15vw, 0.375rem);
--radius-md: clamp(0.375rem, 0.3rem + 0.2vw, 0.5rem);
--radius-lg: clamp(0.5rem, 0.4rem + 0.3vw, 0.75rem);
--radius-xl: clamp(0.625rem, 0.5rem + 0.4vw, 1rem);

/* Gaps fluides */
--gap-xs: clamp(0.25rem, 0.2rem + 0.15vw, 0.5rem);
--gap-sm: clamp(0.375rem, 0.3rem + 0.2vw, 0.625rem);
--gap-md: clamp(0.5rem, 0.4rem + 0.3vw, 0.875rem);
--gap-lg: clamp(0.75rem, 0.6rem + 0.4vw, 1.25rem);
```

### 6.4 Pattern d'Utilisation clamp()

**Dans les composants** :

```tsx
// ✅ CORRECT — Utiliser variables CSS
<div className="px-[var(--padding-modal-header)] gap-[var(--gap-md)]">
  <h1 style={{ fontSize: 'clamp(1rem, 0.9rem + 0.5vw, 1.25rem)' }}>Titre</h1>
  <Icon className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />
</div>

// ❌ INTERDIT — Valeurs fixes
<div className="px-4 gap-2">
  <h1 className="text-lg">Titre</h1>
  <Icon className="h-4 w-4" />
</div>
```

### 6.5 Hooks de Détection Responsive

#### **useMediaQuery** — Détection de media queries

```typescript
import { useMediaQuery } from '@/hooks';

const estMobile = useMediaQuery('(max-width: 479px)');
const estTablette = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');

// Usage conditionnel
{estMobile ? <VueCarte /> : <VueTableau />}
```

#### **useBreakpoint** — Logique conditionnelle avancée

```typescript
import { useBreakpoint } from '@/hooks';

const bp = useBreakpoint();

// Propriétés booléennes
if (bp.isMobile) { /* < 768px */ }
if (bp.isTablet) { /* 768px - 1023px */ }
if (bp.isDesktop) { /* 1280px - 1919px */ }
if (bp.is4K) { /* >= 2560px */ }

// Méthodes
if (bp.isAtLeast('lg')) { /* >= 768px */ }
if (bp.isAtMost('md')) { /* <= 640px */ }

// Breakpoint actuel
console.log(bp.current); // 'sm', 'md', 'lg', etc.
console.log(bp.width); // largeur actuelle en px
```

### 6.6 Transformation Structurelle (Tableau → Carte)

**Sur très petits écrans (< 480px)**, transformer les tableaux en cartes verticales :

```tsx
const estPetitEcran = useMediaQuery('(max-width: 479px)');

// Vue tableau (écrans >= 480px)
{!estPetitEcran && (
  <table>...</table>
)}

// Vue carte (écrans < 480px)
{estPetitEcran && (
  <div className="flex flex-col gap-[var(--gap-sm)]">
    {data.map(item => (
      <div className="rounded-[var(--radius-lg)] border p-[clamp(0.75rem,0.6rem+0.4vw,1rem)]">
        {colonnes.map(col => (
          <div key={col.key}>
            <span className="text-xs font-medium">{col.header}</span>
            <div>{col.render(item)}</div>
          </div>
        ))}
      </div>
    ))}
  </div>
)}
```

### 6.7 Checklist Ultra-Responsivité

**Avant de valider un composant** :
- [ ] Tous les paddings utilisent `clamp()` ou `var(--padding-*)`
- [ ] Tous les gaps utilisent `var(--gap-*)`
- [ ] Toutes les tailles d'icônes utilisent `var(--icon-*)` ou `clamp()`
- [ ] Tous les font-size utilisent `clamp()` ou variables texte
- [ ] Tous les border-radius utilisent `var(--radius-*)`
- [ ] Testé visuellement sur 3 tailles minimum (320px, 768px, 1920px)
- [ ] Pas de débordement horizontal sur mobile
- [ ] Texte lisible sans zoom sur 320px
- [ ] Boutons assez grands pour le tactile (min 44x44px)

---

## 7. Navigation Clavier et Saisie Rapide

### 7.1 Principes Fondamentaux

- **Tab/Shift+Tab** : Navigation entre champs de formulaire
- **Entrée** : Valider / passer au champ suivant
- **Échap** : Fermer modale / annuler édition
- **Flèches** : Navigation dans les listes, tableaux, cellules
- **Ctrl+S** : Sauvegarder (prevent default browser)
- **Ctrl+Enter** : Valider un formulaire sans cliquer
- **Raccourcis contextuels** : Affichés dans une aide intégrée

### 7.2 Navigation Tableaux et Grilles (Cellule par Cellule)

```typescript
// Hook useKeyboardGrid
interface GridNavigationConfig {
    rows: number;
    cols: number;
    onCellEdit?: (row: number, col: number, value: string) => void;
    onCellEnter?: (row: number, col: number) => void;
    wrapAround?: boolean;      // Boucler en fin de ligne/colonne
    editOnType?: boolean;      // Entrer en mode édition en tapant
    tabNextRow?: boolean;      // Tab en fin de ligne → début ligne suivante
}

// Raccourcis grille
// Flèches : Naviguer cellule par cellule
// Tab : Cellule suivante (fin de ligne → ligne suivante)
// Shift+Tab : Cellule précédente
// Entrée : Activer édition cellule / Valider et descendre
// F2 : Activer mode édition
// Échap : Annuler édition
// Ctrl+D : Copier valeur cellule vers le bas
// Ctrl+Shift+V : Coller depuis clipboard dans plage
```

### 7.3 Saisie avec Autocomplétion

```typescript
// Composant AutoCompleteField
interface AutoCompleteProps {
    suggestions: string[] | (() => Promise<string[]>);
    minChars?: number;           // Caractères min avant suggestions (défaut: 2)
    debounceMs?: number;         // Délai debounce (défaut: 150ms)
    maxSuggestions?: number;     // Max suggestions affichées (défaut: 10)
    fuzzyMatch?: boolean;        // Recherche floue
    groupBy?: string;            // Grouper par catégorie
    renderOption?: (item: any) => ReactNode;
    onSelect: (value: string, item?: any) => void;
    keyboardNav?: boolean;       // Navigation clavier dans suggestions
}
```

### 7.4 Formulaire Rapide (FastForm)

```typescript
// Composant FastForm - Saisie optimisée
interface FastFormConfig {
    fields: FastFormField[];
    onSubmit: (data: any) => void;
    autoSave?: boolean;          // Sauvegarde auto sur blur
    autoSaveDelay?: number;      // Délai auto-save (ms)
    tabOrder?: string[];         // Ordre Tab personnalisé
    enterNext?: boolean;         // Entrée = champ suivant
    validateOnChange?: boolean;  // Validation en temps réel
}
```

---

## 8. Animations et Transitions

### 8.1 Framer Motion — Standards

```typescript
// Transitions standard
const TRANSITIONS = {
    rapide: { duration: 0.15, ease: 'easeOut' },
    normale: { duration: 0.25, ease: 'easeInOut' },
    lente: { duration: 0.4, ease: 'easeInOut' },
    spring: { type: 'spring', stiffness: 300, damping: 25 },
} as const;

// Variants réutilisables
const fadeIn = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: TRANSITIONS.normale },
    exit: { opacity: 0, transition: TRANSITIONS.rapide },
};

const slideUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: TRANSITIONS.normale },
    exit: { opacity: 0, y: -20, transition: TRANSITIONS.rapide },
};

const scaleIn = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1, transition: TRANSITIONS.spring },
    exit: { opacity: 0, scale: 0.95, transition: TRANSITIONS.rapide },
};
```

### 8.2 Effets de Survol (Hover)

```typescript
// Boutons : scale léger + ombre
whileHover={{ scale: 1.02, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
whileTap={{ scale: 0.98 }}

// Cards : élévation subtile
whileHover={{ y: -2, boxShadow: '0 8px 25px rgba(0,0,0,0.1)' }}

// Icônes : rotation légère
whileHover={{ rotate: 5, scale: 1.1 }}

// Listes : highlight progressif
whileHover={{ backgroundColor: 'var(--color-dominant-50)', x: 4 }}
```

### 8.3 Transitions de Page

```typescript
// LayoutAnimation avec AnimatePresence
<AnimatePresence mode="wait">
    <motion.div
        key={location.pathname}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2 }}
    >
        {children}
    </motion.div>
</AnimatePresence>
```

### 8.4 Skeleton Loading

```typescript
// Toujours utiliser des skeletons au lieu de spinners pour les listes
<Skeleton className="h-4 w-[250px]" />
<Skeleton className="h-4 w-[200px]" />
<Skeleton className="h-12 w-full rounded-lg" />
```

---

## 9. Notifications Toast (Sonner)

### 9.1 Configuration

```typescript
import { Toaster } from 'sonner';

<Toaster
    position="top-right"
    toastOptions={{
        duration: 4000,
        style: {
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
        },
    }}
/>
```

### 9.2 Usage Standardisé

```typescript
import { toast } from 'sonner';

// Succès
toast.success('Élève enregistré avec succès');

// Erreur
toast.error('Impossible de sauvegarder les modifications');

// Info
toast.info('Synchronisation en cours...');

// Warning
toast.warning('Certaines notes sont manquantes');

// Avec action
toast.success('Bulletin généré', {
    action: { label: 'Télécharger', onClick: () => telechargerPdf() },
});

// Chargement
const toastId = toast.loading('Envoi en cours...');
toast.success('Envoyé !', { id: toastId });

// Progression
toast.loading('Importation...', {
    description: '45/100 élèves traités',
    duration: Infinity,
});
```

---

## 10. Modales Personnalisées (Pas de Natif)

### 10.1 Règle Fondamentale

**JAMAIS** utiliser `alert()`, `confirm()`, `prompt()`. Toujours utiliser les composants personnalisés :

```typescript
// Composant ConfirmDialog
interface ConfirmDialogProps {
    ouvert: boolean;
    titre: string;
    message: string;
    type?: 'info' | 'warning' | 'danger' | 'success';
    boutonConfirmer?: string;
    boutonAnnuler?: string;
    onConfirmer: () => void;
    onAnnuler: () => void;
    chargement?: boolean;
}

// Composant CustomModal
interface CustomModalProps {
    ouvert: boolean;
    onClose: () => void;
    titre: string;
    taille?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    enfants: ReactNode;
    piedPage?: ReactNode;
    fermerClic?: boolean;       // Fermer au clic extérieur
    fermerEchap?: boolean;      // Fermer avec Échap
    fermerClavier?: boolean;    // Raccourci clavier fermeture
}
```

### 10.2 Hook useConfirm

```typescript
const { confirmer, dialogNode } = useConfirm();

// Usage
const ok = await confirmer({
    titre: 'Supprimer cet élève ?',
    message: 'Cette action est irréversible.',
    type: 'danger',
    boutonConfirmer: 'Supprimer',
});

if (ok) {
    await supprimerEleve(id);
}

// Render {dialogNode} dans le JSX
```

---

## 11. Indicateurs de Chargement

### 11.1 Splash Screen (Premier Chargement)

Animation personnalisée : **stylo écrivant "elisa°school"** + **livre ouvert changeant de page** :

```typescript
// Composant SplashScreen
const SplashScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    // Animation SVG : stylo qui écrit le nom
    // Animation SVG : livre ouvert avec pages qui tournent
    // Durée : ~2-3 secondes
    // Transition fade-out vers l'app
};
```

### 11.2 Loading Listes

Animation : **livre ouvert qui change de page** :

```typescript
// Composant ListLoading
const ListLoading: React.FC = () => {
    // Animation livre avec pages qui tournent
    // Texte : "Chargement des données..."
};
```

### 11.3 Loading Inline

```typescript
// Composant InlineSpinner
const InlineSpinner: React.FC<{ taille?: 'sm' | 'md' | 'lg'; texte?: string }> = ({ taille, texte }) => {
    // Mini animation cohérente avec le thème
};
```

### 11.4 Progress Bar

```typescript
// Composant ProgressBar — pour les opérations longues
const ProgressBar: React.FC<{ 
    progression: number;        // 0-100
    texte?: string;
    couleur?: 'dominant' | 'secondary' | 'accent';
    anime?: boolean;            // Animation stripe
}> = ({ progression, texte, couleur, anime }) => { ... };
```

---

## 12. Génération PDF

### 12.1 Architecture

```typescript
// lib/pdf-generator.ts
interface PdfOptions {
    titre: string;
    format?: 'a4' | 'a3' | 'letter';
    orientation?: 'portrait' | 'landscape';
    marges?: { top: number; right: number; bottom: number; left: number };
    enTete?: (doc: jsPDF) => void;
    piedPage?: (doc: jsPDF, pageNum: number, totalPages: number) => void;
    filigrane?: string;
    compress?: boolean;          // Compression pour taille réduite
}

// Génération depuis HTML (rendu fidèle)
async function genererPdfFromHtml(
    elementId: string,
    options: PdfOptions
): Promise<Blob>;

// Génération programmatique (pour bulletins, rapports)
async function genererBulletinPdf(
    bulletin: BulletinData,
    options: PdfOptions
): Promise<Blob>;
```

### 12.2 Optimisation

- **Compression** : Activer par défaut en production
- **Lazy loading** : Charger jsPDF uniquement quand nécessaire
- **Web Worker** : Générer les PDF volumineux dans un worker
- **Cache** : Mettre en cache les PDFs générés (TTL configurable)
- **Streaming** : Pour les gros documents, streamer au lieu de buffer

---

## 13. QR Code

### 13.1 Usage Intelligent

```typescript
// Composant ElisaQRCode
interface ElisaQRCodeProps {
    valeur: string;
    taille?: number;             // Taille en pixels
    couleur?: string;            // Couleur du QR (thème)
    logo?: boolean;              // Logo eLISAschool au centre
    telechargeable?: boolean;    // Bouton téléchargement
    niveauCorrection?: 'L' | 'M' | 'Q' | 'H';
}

// Usages :
// - Carte d'identité élève/personnel (QR → profil)
// - Vérification de documents (QR → hash vérification)
// - Présence rapide (scan QR → marquer présence)
// - Paiement cantine (QR → transaction)
// - Accès parent rapide (QR → portail parent)
```

---

## 14. Drag and Drop (@dnd-kit)

### 14.1 Configuration

```typescript
// Composant DraggableList
interface DraggableListProps<T> {
    items: T[];
    onReorder: (items: T[]) => void;
    renderItem: (item: T, isDragging: boolean) => ReactNode;
    axis?: 'x' | 'y' | 'xy';
    animation?: number;          // Durée animation (ms)
}

// Composant DragDropBoard (Kanban)
interface DragDropBoardProps<T> {
    colonnes: { id: string; titre: string; items: T[] }[];
    onMove: (itemId: string, fromCol: string, toCol: string, index: number) => void;
    renderItem: (item: T) => ReactNode;
    renderColumn?: (col: any) => ReactNode;
}
```

### 14.2 Usages

- Réorganisation de listes (matières, périodes)
- Kanban board (tâches, requêtes)
- Planning drag & drop (emploi du temps)
- Upload fichiers par drag & drop

---

## 15. Calendrier Personnalisé

### 15.1 Composant ElisaDatePicker

```typescript
interface ElisaDatePickerProps {
    valeur?: Date;
    onChange: (date: Date) => void;
    type?: 'date' | 'datetime' | 'periode' | 'mois' | 'annee';
    min?: Date;
    max?: Date;
    joursFeries?: Date[];         // Jours fériés Cameroun/Afrique
    joursOuvrables?: number[];    // Jours ouvrables (0-6)
    periodes?: PeriodeScolaire[]; // Périodes scolaires
    evenementClasse?: Evenement[]; // Événements affichés
    theme?: 'light' | 'dark';
    inline?: boolean;             // Calendrier intégré (pas popup)
    raccourcis?: boolean;         // Raccourcis (aujourd'hui, cette semaine, etc.)
    navigationClavier?: boolean;  // Navigation flèches
}
```

### 15.2 Jours Fériés et Contexte Africain

```typescript
// Jours fériés Cameroun par défaut
const JOURS_FERIES_CAMEROUN = [
    { date: '01-01', nom: 'Nouvel An' },
    { date: '11-02', nom: 'Fête de la Jeunesse' },
    { date: '05-01', nom: 'Fête du Travail' },
    { date: '05-20', nom: 'Fête Nationale' },
    { date: '12-25', nom: 'Noël' },
    // Variables : Pâques, Ascension, Pentecôte, Aïd, etc.
];
```

---

## 16. Listes Déroulantes Avancées

### 16.1 Composant SmartSelect

```typescript
interface SmartSelectProps<T> {
    options: T[];
    valeur?: T | T[];
    onChange: (valeur: T | T[]) => void;
    labelKey: keyof T;
    valueKey: keyof T;
    multiple?: boolean;
    recherche?: boolean;          // Champ de recherche intégré
    rechercheFuzzy?: boolean;     // Recherche floue
    groupBy?: keyof T;           // Grouper par catégorie
    virtualise?: boolean;         // Virtualisation pour grandes listes
    creation?: boolean;           // Permettre création de nouvelle option
    chargement?: boolean;         // État de chargement
    asyncOptions?: (query: string) => Promise<T[]>;
    renderOption?: (option: T) => ReactNode;
    renderTag?: (option: T) => ReactNode;
    placeholder?: string;
    vide?: ReactNode;             // Contenu quand pas de résultats
    maxSelections?: number;
    keyboardNav?: boolean;        // Navigation clavier complète
}
```

---

## 17. Compression d'Images

### 17.1 Utilitaire

```typescript
// lib/image-compressor.ts
interface CompressionOptions {
    maxWidth?: number;            // Largeur max (défaut: 1920)
    maxHeight?: number;           // Hauteur max (défaut: 1080)
    quality?: number;             // Qualité JPEG (0.1-1.0, défaut: 0.8)
    format?: 'jpeg' | 'webp' | 'png';
    maxSizeKB?: number;           // Taille max en KB
}

async function compresserImage(
    file: File,
    options?: CompressionOptions
): Promise<Blob>;

// Compression par lots
async function compresserImages(
    files: File[],
    options?: CompressionOptions,
    onProgress?: (index: number, total: number) => void
): Promise<Blob[]>;
```

---

## 18. PWA (Progressive Web App)

### 18.1 Configuration

```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    plugins: [
        VitePWA({
            registerType: 'autoUpdate',
            manifest: {
                name: 'eLISAschool - Gestion Scolaire',
                short_name: 'eLISAschool',
                description: 'Plateforme de gestion scolaire moderne',
                theme_color: '#28a745',
                background_color: '#ffffff',
                display: 'standalone',
                orientation: 'portrait-primary',
                start_url: '/',
                icons: [
                    { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
                    { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
                    { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
                ],
            },
            workbox: {
                runtimeCaching: [
                    { urlPattern: /^https:\/\/api\./, handler: 'NetworkFirst' },
                    { urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/, handler: 'CacheFirst' },
                ],
            },
        }),
    ],
});
```

### 18.2 Mode Hors-Ligne

- **Cache stratégique** : Pages essentielles disponibles offline
- **File d'attente** : Actions en attente synchronisées au retour réseau
- **Indicateur** : Badge visible quand offline
- **Sync automatique** : Reprise des opérations en attente

---

## 19. Logos eLISAschool

### 19.1 Types de Logos

| Type | Fichier | Usage |
|------|---------|-------|
| **Complet** | `logo-complet.svg` | Page login, header, documents officiels |
| **Icône** | `logo-icon.svg` | Favicon, sidebar compact, PWA icon, bouton |
| **Texte** | `logo-text.svg` | Quand l'icône est déjà visible |

### 19.2 Design

- **Icône** : Cercle stylisé représentant un livre ouvert + étoile
- **Texte** : "elisa°school" avec le ° en couleur accent
- **Couleurs** : Adaptées au thème de l'établissement

---

## 20. Chargement Partiel des Données

### 20.1 Infinite Scroll / Virtualisation

```typescript
// Hook useInfiniteList
const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteList(
    ['eleves'],
    (page) => api.getEleves({ page, limit: 50 }),
    { getNextPageParam: (last) => last.pagination.hasNext ? last.pagination.page + 1 : undefined }
);

// Composant VirtualList pour les grandes listes
<VirtualList
    items={eleves}
    itemHeight={64}
    renderItem={(eleve) => <EleveRow key={eleve.id} eleve={eleve} />}
    overscan={5}
/>
```

### 20.2 Partial Refresh

```typescript
// Rafraîchir uniquement les données modifiées
queryClient.invalidateQueries({ queryKey: ['eleves', eleveId] });

// Optimistic updates
queryClient.setQueryData(['eleves'], (old) =>
    old?.map(e => e.id === eleveId ? { ...e, ...updates } : e)
);
```

---

## 21. Boutons et Onglets Futuristes

### 21.1 Bouton Principal

```typescript
// Composant ElisaButton
interface ElisaButtonProps {
    variante?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger';
    taille?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    icone?: ReactNode;
    iconePosition?: 'left' | 'right';
    chargement?: boolean;
    fullWidth?: boolean;
    effet?: 'ripple' | 'glow' | 'pulse' | 'none';
    raccourci?: string;          // ex: 'Ctrl+S'
    children: ReactNode;
    onClick?: () => void;
}
```

### 21.2 Onglets

```typescript
// Composant ElisaTabs
interface ElisaTabsProps {
    onglets: { id: string; label: string; icone?: ReactNode; badge?: number }[];
    actif: string;
    onChange: (id: string) => void;
    variante?: 'underline' | 'pills' | 'enclosed' | 'floating';
    orientation?: 'horizontal' | 'vertical';
    animation?: boolean;
}
```

---

## 21.3 Composants Ultra-Responsifs de Référence

**Ces composants sont les exemples de référence** pour l'ultra-responsivité. **TOUJOURS** s'en inspirer.

### **CustomModal** — Modal ultra-responsif

**Fichier** : `frontend/src/components/modals/CustomModal.tsx`

```tsx
// ✅ Pattern de référence
<DialogPrimitive.Content
    className="fixed z-50 border border-[var(--color-bordure)] bg-[var(--color-surface)] shadow-2xl flex flex-col"
    style={{
        width: 'clamp(280px, 90vw, 672px)',
        maxHeight: 'clamp(200px, 85vh, 90vh)',
        borderRadius: 'var(--radius-xl)',
    }}
>
    {/* Header avec padding et font responsifs */}
    <div className="px-[var(--padding-modal-header)] py-[clamp(0.5rem,0.4rem+0.2vw,0.75rem)]">
        <DialogPrimitive.Title 
            style={{ fontSize: 'clamp(0.875rem, 0.8rem + 0.3vw, 1.125rem)' }}
        >
            {title}
        </DialogPrimitive.Title>
    </div>

    {/* Body */}
    <div style={{ padding: 'var(--padding-modal-body)' }}>{children}</div>

    {/* Footer avec gap responsive */}
    <div className="flex items-center justify-end gap-[var(--gap-md)]" 
         style={{ padding: 'var(--padding-modal-footer)' }}>
        {footer}
    </div>
</DialogPrimitive.Content>
```

**Points clés** :
- Largeur adaptative : `clamp(280px, 90vw, 672px)`
- Hauteur max : `clamp(200px, 85vh, 90vh)`
- Tous les paddings via variables CSS
- Tous les font-size via `clamp()`
- Icônes responsives : `h-[var(--icon-sm)] w-[var(--icon-sm)]`

### **DataTable** — Tableau avec transformation carte

**Fichier** : `frontend/src/components/ui/DataTable.tsx`

```tsx
// Détection petit écran
const estPetitEcran = useMediaQuery('(max-width: 479px)');

// Barre d'outils responsive
<div className="flex flex-wrap items-center gap-[var(--gap-sm)]" 
     style={{ padding: 'var(--padding-toolbar)' }}>
    <div style={{ minWidth: 'clamp(120px, 30vw, 384px)' }}>
        <Search className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />
        <input style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }} />
    </div>
</div>

// En-têtes responsifs
<th>
    <div style={{ padding: 'var(--padding-table-cell)' }}>
        <span style={{ fontSize: 'clamp(0.75rem, 0.65rem + 0.3vw, 0.875rem)' }}>
            {col.header}
        </span>
        <ArrowUp className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />
    </div>
</th>

// Vue conditionnelle
{!estPetitEcran && <table>/* rendu tableau */</table>}

{estPetitEcran && (
    <div className="flex flex-col gap-[var(--gap-sm)]">
        {data.map(item => (
            <div className="rounded-[var(--radius-lg)] border p-[clamp(0.75rem,0.6rem+0.4vw,1rem)]">
                {/* Chaque ligne devient une carte */}
            </div>
        ))}
    </div>
)}
```

**Points clés** :
- Double rendu : tableau >= 480px, cartes < 480px
- Barre de recherche adaptative : `clamp(120px, 30vw, 384px)`
- Tous les cells padding via `var(--padding-table-cell)`
- Pagination adaptative : boutons `clamp()`

### **ElisaButton** — Bouton ultra-responsif

**Fichier** : `frontend/src/components/ui/ElisaButton.tsx`

```tsx
// Variantes avec clamp() sur heights et paddings
const buttonVariants = cva('inline-flex items-center justify-center', {
    variants: {
        size: {
            xs: 'h-[clamp(1.5rem,1.25rem+0.5vw,1.75rem)] px-[clamp(0.375rem,0.3rem+0.2vw,0.5rem)]',
            sm: 'h-[clamp(1.75rem,1.5rem+0.5vw,2rem)] px-[clamp(0.5rem,0.4rem+0.3vw,0.75rem)]',
            md: 'h-[clamp(2rem,1.75rem+0.5vw,2.5rem)] px-[clamp(0.625rem,0.5rem+0.4vw,1rem)]',
            lg: 'h-[clamp(2.5rem,2.25rem+0.5vw,3rem)] px-[clamp(0.875rem,0.75rem+0.5vw,1.5rem)]',
            xl: 'h-[clamp(3rem,2.75rem+0.5vw,3.5rem)] px-[clamp(1.25rem,1rem+0.75vw,2rem)]',
        },
    },
});

// Icônes responsives par taille
const iconSize = {
    xs: 'clamp(0.75rem, 0.65rem + 0.3vw, 0.875rem)',
    sm: 'clamp(0.875rem, 0.75rem + 0.4vw, 1rem)',
    md: 'clamp(1rem, 0.85rem + 0.5vw, 1.125rem)',
    lg: 'clamp(1.125rem, 1rem + 0.5vw, 1.25rem)',
    xl: 'clamp(1.25rem, 1.1rem + 0.5vw, 1.5rem)',
}[size];
```

**Points clés** :
- Heights responsives par taille
- Paddings adaptatifs
- Icônes dimensionnées par `clamp()`
- Gap via `var(--gap-sm)`

### **ConfirmationModal** — Modal de confirmation

**Fichier** : `frontend/src/components/ui/ConfirmationModal.tsx`

```tsx
// Icône adaptative
<div className="rounded-[var(--radius-lg)]" style={{ padding: 'var(--space-md)' }}>
    <AlertCircle className="h-[var(--icon-lg)] w-[var(--icon-lg)]" />
</div>

// Titre et message responsifs
<h3 style={{ fontSize: 'clamp(1rem, 0.9rem + 0.4vw, 1.25rem)' }}>{title}</h3>
<p style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)' }}>{message}</p>

// Détails conditionnels
{details && (
    <div className="rounded-[var(--radius-md)]" style={{ padding: 'var(--space-md)' }}>
        <p style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}>{details}</p>
    </div>
)}
```

**Points clés** :
- Icône alerte responsive
- Textes avec `clamp()`
- Gaps et paddings via variables CSS

---

## 22. Éditeur de Texte Avancé

### 22.1 Composant RichTextEditor

```typescript
interface RichTextEditorProps {
    valeur: string;
    onChange: (html: string) => void;
    placeholder?: string;
    toolbar?: ToolbarItem[];
    minHeight?: string;
    maxHeight?: string;
    readOnly?: boolean;
    autoFocus?: boolean;
    suggestions?: boolean;       // Suggestions intelligentes
    correcteur?: boolean;        // Correcteur orthographique
    collaboration?: boolean;     // Édition collaborative
    raccourcis?: boolean;        // Raccourcis clavier (Ctrl+B, etc.)
    mentions?: boolean;          // @mentions d'utilisateurs
    emojis?: boolean;            // Sélecteur d'emojis
    images?: boolean;            // Insertion d'images
    tableaux?: boolean;          // Insertion de tableaux
    exportPdf?: boolean;         // Bouton export PDF
}
```

---

## 23. Temps Réel

### 23.1 WebSocket / SSE

```typescript
// Hook useRealtime
function useRealtime(canal: string, onMessage: (data: any) => void) {
    // Connexion WebSocket avec reconnexion automatique
    // Gestion des états : connecté, reconnecting, déconnecté
    // Buffer des messages pendant déconnexion
    // Heartbeat pour détecter les déconnexions
}

// Hook useRealtimeQuery — Combine TanStack Query + WebSocket
function useRealtimeQuery<T>(
    queryKey: string[],
    queryFn: () => Promise<T>,
    canal: string
) {
    // Fetch initial + subscribe to updates
    // Auto-invalidate query on WebSocket message
}
```

---

## 24. Composants Modifiables et Déplaçables

### 24.1 Dashboard Personnalisable

```typescript
// Composant WidgetGrid
interface WidgetGridProps {
    widgets: Widget[];
    onLayoutChange: (widgets: Widget[]) => void;
    editable?: boolean;          // Mode édition
    colonnes?: number;           // Nombre de colonnes
    tailleMinWidget?: { w: number; h: number };
}

interface Widget {
    id: string;
    type: string;
    titre: string;
    position: { x: number; y: number; w: number; h: number };
    config?: Record<string, any>;
    verrouille?: boolean;
}
```

### 24.2 Composants Redimensionnables

```typescript
// Composant ResizablePanel
interface ResizablePanelProps {
    direction?: 'horizontal' | 'vertical';
    tailleMin?: number;
    tailleMax?: number;
    tailleInitiale?: number;
    onResize?: (taille: number) => void;
    enfants: ReactNode;
}
```

---

## 25. Intégration Backend Maximum

### 25.1 Principe

**TOUJOURS** utiliser le backend quand possible :
- Configuration (couleurs, thèmes, paramètres)
- Authentification et autorisation
- Validation des données (mêmes schémas Zod partagés)
- Génération de documents côté serveur si volumineux
- Stockage des préférences utilisateur
- Notifications push

### 25.2 Client API

```typescript
// lib/api-client.ts
const apiClient = {
    async get<T>(path: string, params?: Record<string, any>): Promise<ApiResponse<T>>;
    async post<T>(path: string, body: any): Promise<ApiResponse<T>>;
    async patch<T>(path: string, body: any): Promise<ApiResponse<T>>;
    async delete<T>(path: string): Promise<ApiResponse<T>>;
    async upload(path: string, file: File, onProgress?: (pct: number) => void): Promise<ApiResponse>;
};

// Avec intercepteurs :
// - Ajout automatique du token JWT
// - Refresh token automatique
// - Gestion des erreurs 401/403
// - Retry automatique sur erreur réseau
// - Logging en développement
```

### 25.3 Schémas Zod Partagés

```typescript
// Importer les schémas depuis shared/
import { createEleveSchema, updateEleveSchema } from '@shared/validators';

// Utiliser directement dans React Hook Form
const form = useForm({
    resolver: zodResolver(createEleveSchema),
});
```

### 25.4 Synchronisation de la Langue

Le backend expose la langue par défaut et les préférences utilisateur via 3 endpoints :

```typescript
// 1. Configuration publique (non-authentifié) — langue par défaut de l'établissement
GET /api/configuration → { langueDefaut: 'fr' }

// 2. Préférence utilisateur (authentifié) — langue personnelle
GET /api/preferences/my/langue → { valeur: 'fr' }

// 3. Mise à jour de la préférence (authentifié)
POST /api/preferences/set → { cle: 'langue', valeur: 'en' }
```

**Séquence de résolution de la langue au démarrage** :
1. Appeler `GET /api/configuration` → obtenir `langueDefaut`
2. Si utilisateur connecté → appeler `GET /api/preferences/my/langue` → override
3. Sinon → vérifier `localStorage` → override
4. Fallback → `'fr'`

**À chaque changement de langue** :
1. `i18n.changeLanguage(lang)` → met à jour les traductions React
2. `document.documentElement.lang = lang` → accessibilité HTML
3. `POST /api/preferences/set` → persister côté backend (non-bloquant)
4. Zustand `persist` → sauvegarder dans localStorage

---

## 26. Page d'Accueil (Landing)

### 26.1 Structure

```typescript
// Page de présentation d'eLISAschool
const LandingPage = () => (
    <>
        <HeroSection />          // Titre + sous-titre + CTA + animation
        <FeaturesSection />      // Grille de fonctionnalités
        <ModulesSection />       // Présentation des modules
        <ScreenshotsSection />   // Captures d'écran / carrousel
        <PricingSection />       // Plans et tarifs
        <TestimonialsSection />  // Témoignages
        <ContactSection />       // Formulaire de contact
        <FooterSection />        // Liens, réseaux sociaux
    </>
);
```

---

## 27. Règles TypeScript Strictes (Frontend)

- `strict: true` — Pas de `any` implicite
- **Pas de `any`** sauf dans les callbacks génériques de librairies tierces
- **Types explicites** sur les props des composants
- **Generic components** pour les composants réutilisables `<T,>`
- **Discriminated unions** pour les variants de composants
- **`as const`** pour les configurations statiques
- **Barrel exports** (`index.ts`) par dossier de feature

---

## 28. Performance Frontend

### 28.1 Code Splitting

```typescript
// Lazy loading des routes
const Dashboard = lazy(() => import('./routes/dashboard'));
const Bulletins = lazy(() => import('./routes/bulletins'));

// Lazy loading des composants lourds
const RichTextEditor = lazy(() => import('../components/editors/RichTextEditor'));
const PdfViewer = lazy(() => import('../components/pdf/PdfViewer'));
```

### 28.2 Memoization

```typescript
// Memo les composants lourds
const MemoizedTable = memo(EleveTable, (prev, next) =>
    prev.eleves === next.eleves && prev.columns === next.columns
);

// useMemo pour les calculs coûteux
const elevesFiltres = useMemo(() =>
    eleves.filter(e => e.classeId === classeActive),
    [eleves, classeActive]
);

// useCallback pour les fonctions passées en props
const handleSauvegarder = useCallback(async () => {
    await sauvegarderNotes(formState);
}, [formState]);
```

### 28.3 Optimisation Images

- **Format WebP** par défaut avec fallback JPEG
- **Lazy loading** natif (`loading="lazy"`)
- **srcset** pour responsive images
- **Compression avant upload** (voir section 17)
- **CDN** en production pour les assets statiques

### 28.4 Bundle Optimization

- **Tree shaking** automatique avec Vite
- **Analyse bundle** : `npx vite-bundle-visualizer`
- **Chunking stratégique** : Séparer vendor, shared, features
- **Preload** des chunks critiques

---

## 29. Internationalisation (i18n)

### 29.1 Configuration i18next

**Fichier :** `src/lib/i18n.ts`

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Importer les traductions
import commonFr from '@/locales/fr/common.json';
import commonEn from '@/locales/en/common.json';
import elevesFr from '@/locales/fr/eleves.json';
import elevesEn from '@/locales/en/eleves.json';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            fr: { common: commonFr, eleves: elevesFr },
            en: { common: commonEn, eleves: elevesEn },
        },
        fallbackLng: 'fr',
        defaultNS: 'common',
        ns: ['common', 'eleves'],  // Ajouter chaque namespace de feature
        interpolation: {
            escapeValue: false,  // React gère déjà le XSS
        },
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
        },
    });

export default i18n;
```

### 29.2 Hook useTranslation — Usage Standardisé

```tsx
// Composant d'un module spécifique
import { useTranslation } from 'react-i18next';

function EleveList() {
    const { t } = useTranslation('eleves');
    return <h1>{t('titres.liste')}</h1>;
}

// Composant utilisant les traductions communes
function BoutonSauvegarder() {
    const { t } = useTranslation();  // defaultNS = 'common'
    return <button>{t('boutons.enregistrer')}</button>;
}

// Multi-namespace
function EleveForm() {
    const { t } = useTranslation(['eleves', 'common']);
    return (
        <>
            <label>{t('eleves:champs.nom')}</label>
            <button>{t('common:boutons.annuler')}</button>
        </>
    );
}
```

### 29.3 Structure des Clés de Traduction

```json
// locales/fr/eleves.json
{
    "titres": {
        "liste": "Liste des élèves",
        "detail": "Fiche élève",
        "nouveau": "Nouvel élève",
        "modifier": "Modifier l'élève"
    },
    "sousTitres": {
        "total": "{{count}} élève inscrit",
        "total_plural": "{{count}} élèves inscrits"
    },
    "boutons": {
        "ajouter": "Ajouter un élève",
        "supprimer": "Supprimer",
        "modifier": "Modifier",
        "exporter": "Exporter"
    },
    "champs": {
        "nom": "Nom",
        "prenom": "Prénom",
        "dateNaissance": "Date de naissance",
        "sexe": "Sexe",
        "classe": "Classe"
    },
    "messages": {
        "succesCreation": "Élève {{nom}} créé avec succès",
        "succesSuppression": "Élève supprimé",
        "erreurSuppression": "Erreur lors de la suppression",
        "confirmationSuppression": "Supprimer cet élève ? Cette action est irréversible."
    },
    "validation": {
        "nomRequis": "Le nom est requis",
        "ageMin": "L'âge minimum est {{age}} ans"
    },
    "colonnes": {
        "matricule": "Matricule",
        "nomComplet": "Nom complet",
        "classe": "Classe",
        "sexe": "Sexe",
        "actions": "Actions"
    }
}
```

```json
// locales/fr/common.json
{
    "boutons": {
        "enregistrer": "Enregistrer",
        "annuler": "Annuler",
        "supprimer": "Supprimer",
        "modifier": "Modifier",
        "rechercher": "Rechercher",
        "filtrer": "Filtrer",
        "exporter": "Exporter",
        "importer": "Importer",
        "fermer": "Fermer",
        "confirmer": "Confirmer",
        "reessayer": "Réessayer"
    },
    "messages": {
        "succesEnregistrement": "Enregistré avec succès",
        "erreurServeur": "Erreur serveur, veuillez réessayer",
        "chargement": "Chargement en cours...",
        "aucuneDonnee": "Aucune donnée à afficher",
        "sessionExpiree": "Session expirée, veuillez vous reconnecter"
    },
    "labels": {
        "page": "Page",
        "sur": "sur",
        "resultats": "résultats",
        "actions": "Actions",
        "statut": "Statut",
        "dateCreation": "Date de création"
    },
    "pagination": {
        "pageSur": "Page {{page}} sur {{total}}",
        "resultats": "{{total}} résultats",
        "precedent": "Précédent",
        "suivant": "Suivant"
    }
}
```

### 29.4 Language Switcher

**Fichier :** `src/components/layout/language-switcher.tsx`

```tsx
import { useLanguage } from '@/hooks/use-language';
import { motion } from 'framer-motion';

const LANGUES = [
    { code: 'fr', label: 'FR', drapeau: '🇫🇷' },
    { code: 'en', label: 'EN', drapeau: '🇬🇧' },
] as const;

export function LanguageSwitcher() {
    const { langue, changerLangue } = useLanguage();

    return (
        <div className="flex items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
            {LANGUES.map((l) => (
                <motion.button
                    key={l.code}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                        langue === l.code
                            ? 'bg-[var(--color-dominant-600)] text-white'
                            : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                    }`}
                    onClick={() => changerLangue(l.code)}
                    whileTap={{ scale: 0.95 }}
                >
                    {l.label}
                </motion.button>
            ))}
        </div>
    );
}
```

### 29.5 Store Zustand Langue

**Fichier :** `src/stores/language.store.ts`

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n from '@/lib/i18n';

type Langue = 'fr' | 'en';

interface LanguageState {
    langue: Langue;
    setLangue: (langue: Langue) => void;
}

export const useLanguageStore = create<LanguageState>()(
    persist(
        (set) => ({
            langue: 'fr',
            setLangue: (langue: Langue) => {
                i18n.changeLanguage(langue);
                document.documentElement.lang = langue;
                set({ langue });
            },
        }),
        { name: 'elisaschool-language' }
    )
);
```

### 29.6 Détection de la Langue

**Ordre de priorité** (du plus spécifique au plus général) :

1. **Préférence utilisateur** sauvegardée : `GET /api/preferences/my/langue`
2. **localStorage** : valeur persistée par le store Zustand
3. **langueDefaut** de la configuration publique : `GET /api/configuration`
4. **Fallback** : `'fr'`

**Fichier :** `src/hooks/use-language.ts`

```typescript
import { useEffect } from 'react';
import { useLanguageStore } from '@/stores/language.store';
import { apiClient } from '@/lib/api-client';

export function useLanguage() {
    const { langue, setLangue } = useLanguageStore();

    // Charger la préférence utilisateur au montage
    useEffect(() => {
        apiClient.get<{ data: { valeur: string } }>('/api/preferences/my/langue')
            .then((res) => {
                if (res.data?.valeur && res.data.valeur !== langue) {
                    setLangue(res.data.valeur as 'fr' | 'en');
                }
            })
            .catch(() => { /* Utiliser la langue locale */ });
    }, []);

    const changerLangue = async (nouvelleLangue: 'fr' | 'en') => {
        setLangue(nouvelleLangue);
        // Synchroniser avec le backend (non-bloquant)
        try {
            await apiClient.post('/api/preferences/set', { cle: 'langue', valeur: nouvelleLangue });
        } catch { /* Échec silencieux */ }
    };

    return { langue, changerLangue };
}
```

### 29.7 Formatage des Dates (date-fns + locale)

```typescript
// lib/date-utils.ts
import { format, formatDistanceToNow } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import i18n from '@/lib/i18n';

const LOCALES = { fr, en: enUS } as const;

export function formatDate(date: Date | string, formatStr: string = 'dd MMMM yyyy'): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const locale = LOCALES[i18n.language as 'fr' | 'en'] || fr;
    return format(d, formatStr, { locale });
}

export function formatDistance(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const locale = LOCALES[i18n.language as 'fr' | 'en'] || fr;
    return formatDistanceToNow(d, { addSuffix: true, locale });
}
```

### 29.8 Formatage des Nombres et Devises

```typescript
// lib/format-utils.ts
import i18n from '@/lib/i18n';

export function formatNombre(nombre: number, decimales: number = 0): string {
    return new Intl.NumberFormat(i18n.language, {
        minimumFractionDigits: decimales,
        maximumFractionDigits: decimales,
    }).format(nombre);
}

export function formatMontant(montant: number, devise: string = 'XAF'): string {
    return new Intl.NumberFormat(i18n.language, {
        style: 'currency',
        currency: devise,
        minimumFractionDigits: 0,
    }).format(montant);
}
```

### 29.9 Intégration Provider

**Fichier :** `src/app/providers.tsx`

```tsx
import '@/lib/i18n';  // Import side-effect (doit être en premier)
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <I18nextProvider i18n={i18n}>
            <QueryClientProvider client={queryClient}>
                <ThemeProvider>
                    {children}
                </ThemeProvider>
            </QueryClientProvider>
        </I18nextProvider>
    );
}
```

### 29.10 Toast et Messages Système Traduits

```tsx
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

function useMessages() {
    const { t } = useTranslation();
    return {
        succesCreation: (nom: string) => toast.success(t('messages.succesCreation', { nom })),
        erreurServeur: () => toast.error(t('messages.erreurServeur')),
        chargement: () => toast.loading(t('messages.chargement')),
    };
}
```

---

## 30. Routing, Navigation et Liens

### 30.1 Principe Fondamental

**TOUJOURS exposer correctement les routes et les liens** pour que chaque élément soit **accessible et navigable**. Un bouton ou une carte qui ne mène nulle part est une erreur UX.

### 30.2 Structure des Routes TanStack Router

```typescript
// app/routes/
// Utiliser le file-based routing de TanStack Router
// Chaque fichier .tsx dans routes/ devient une route accessible

__root.tsx              // Layout racine (Sidebar + Header + Outlet)
index.tsx               // → / (redirect vers dashboard ou landing)
dashboard.tsx           // → /dashboard
_auth/                  // Layout auth (sans sidebar)
    login.tsx           // → /login
    forgot-password.tsx // → /forgot-password
_eleves/
    index.tsx           // → /eleves (liste)
    $id.tsx             // → /eleves/:id (détail)
    new.tsx             // → /eleves/new (création)
_notes/
    index.tsx           // → /notes
    $eleveId.tsx        // → /notes/:eleveId
```

### 30.3 Navigation avec `useRouter` et `Link`

```typescript
import { Link, useRouter, useNavigate } from '@tanstack/react-router';

// ✅ LIEN STATIQUE — Utiliser <Link>
<Link to="/eleves" className="...">
    Voir les élèves
</Link>

// ✅ LIEN DYNAMIQUE — Utiliser <Link> avec params
<Link to="/eleves/$id" params={{ id: eleve.id }} className="...">
    {eleve.nom}
</Link>

// ✅ NAVIGATION PROGRAMMATIQUE — Utiliser navigate()
const navigate = useNavigate();
await navigate({ to: '/eleves/$id', params: { id: eleve.id } });

// ✅ REDIRECTION APRÈS ACTION
const router = useRouter();
await router.navigate({ to: '/dashboard', replace: true });
```

### 30.4 Règles pour les Boutons et Actions

**TOUJOURS connecter les boutons à des routes ou actions** :

```typescript
// ❌ INCORRECT — Bouton sans action
<button>Ajouter un élève</button>

// ✅ CORRECT — Bouton avec navigation
<Link to="/eleves/new">
    <button>Ajouter un élève</button>
</Link>

// ✅ CORRECT — Bouton avec onClick programmé
<button onClick={() => navigate({ to: '/eleves/new' })}>
    Ajouter un élève
</button>
```

### 30.5 Navigation dans les Tableaux et Listes

**Chaque ligne d'un tableau doit être cliquable ou avoir des actions** :

```typescript
// ✅ Ligne cliquable avec Link
function EleveRow({ eleve }: { eleve: Eleve }) {
    return (
        <tr>
            <td>
                <Link to="/eleves/$id" params={{ id: eleve.id }}
                    className="text-[var(--color-dominante)] hover:underline">
                    {eleve.nomComplet}
                </Link>
            </td>
            <td>{eleve.classe}</td>
            <td>
                <Link to="/notes/$eleveId" params={{ eleveId: eleve.id }}>
                    Voir les notes
                </Link>
            </td>
        </tr>
    );
}
```

### 30.6 Menu Latéral (Sidebar) — Liens Vers Modules

**Chaque élément du sidebar DOIT pointer vers une route valide** :

```typescript
const MENU_ITEMS = [
    { label: 'Tableau de bord', icon: LayoutDashboard, to: '/dashboard' },
    { label: 'Élèves', icon: Users, to: '/eleves' },
    { label: 'Enseignants', icon: GraduationCap, to: '/enseignants' },
    { label: 'Notes', icon: ClipboardList, to: '/notes' },
    { label: 'Bulletins', icon: FileText, to: '/bulletins' },
    { label: 'Finances', icon: CreditCard, to: '/finances' },
    // ... chaque module a sa route
];

// Dans le rendu
{MENU_ITEMS.map(item => (
    <Link
        key={item.to}
        to={item.to}
        activeProps={{ className: 'bg-[var(--color-dominante)]/10' }}
        className="flex items-center gap-3 px-4 py-2 rounded-lg"
    >
        <item.icon className="h-5 w-5" />
        <span>{item.label}</span>
    </Link>
))}
```

### 30.7 Breadcrumbs (Fil d'Ariane)

**TOUJOURS afficher le breadcrumb pour la navigation contextuelle** :

#### 30.7.1 Composant Breadcrumb Réutilisable

**Fichier :** `src/components/navigation/Breadcrumbs.tsx`

```typescript
import { useRouterState, Link } from '@tanstack/react-router';
import { ChevronRight, Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface BreadcrumbItem {
    label: string;
    href?: string;
    actif?: boolean;
}

interface BreadcrumbsProps {
    items?: BreadcrumbItem[];  // Optionnel : items personnalisés
    afficherAccueil?: boolean;  // Afficher le lien "Accueil"
}

export function Breadcrumbs({ items, afficherAccueil = true }: BreadcrumbsProps) {
    const { t } = useTranslation('common');
    const matches = useRouterState({ select: s => s.matches });

    // Si items personnalisés fournis, les utiliser
    if (items && items.length > 0) {
        return (
            <nav aria-label="Breadcrumb" className="mb-4">
                <ol className="flex items-center gap-1.5 text-sm flex-wrap">
                    {afficherAccueil && (
                        <li className="flex items-center gap-1.5">
                            <Link to="/" className="text-[var(--color-dominante)] hover:underline">
                                <Home className="h-4 w-4" />
                            </Link>
                            <ChevronRight className="h-4 w-4 text-[var(--color-texte-secondaire)]" />
                        </li>
                    )}
                    {items.map((item, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                            {i > 0 && <ChevronRight className="h-4 w-4 text-[var(--color-texte-secondaire)]" />}
                            {item.actif || !item.href ? (
                                <span className="text-[var(--color-texte)] font-medium">{item.label}</span>
                            ) : (
                                <Link to={item.href as any}
                                    className="text-[var(--color-texte-secondaire)] hover:text-[var(--color-texte)] transition-colors">
                                    {item.label}
                                </Link>
                            )}
                        </li>
                    ))}
                </ol>
            </nav>
        );
    }

    // Sinon, générer automatiquement depuis les routes TanStack Router
    return (
        <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex items-center gap-1.5 text-sm flex-wrap">
                {afficherAccueil && (
                    <li className="flex items-center gap-1.5">
                        <Link to="/" className="text-[var(--color-dominante)] hover:underline">
                            <Home className="h-4 w-4" />
                        </Link>
                        {matches.length > 0 && <ChevronRight className="h-4 w-4 text-[var(--color-texte-secondaire)]" />}
                    </li>
                )}
                {matches
                    .filter(m => m.routeId !== '__root__')  // Exclure le root
                    .map((match, i, arr) => (
                        <li key={match.id} className="flex items-center gap-1.5">
                            {i > 0 && <ChevronRight className="h-4 w-4 text-[var(--color-texte-secondaire)]" />}
                            {i === arr.length - 1 ? (
                                // Dernier élément = page active
                                <span className="text-[var(--color-texte)] font-medium">
                                    {match.routeMeta?.titre || match.routeId}
                                </span>
                            ) : (
                                <Link to={match.pathname}
                                    className="text-[var(--color-texte-secondaire)] hover:text-[var(--color-texte)] transition-colors">
                                    {match.routeMeta?.titre || match.routeId}
                                </Link>
                            )}
                        </li>
                    ))}
            </ol>
        </nav>
    );
}
```

#### 30.7.2 Hook useBreadcrumbs pour Breadcrumbs Personnalisés

**Fichier :** `src/hooks/use-breadcrumbs.ts`

```typescript
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

interface BreadcrumbItem {
    label: string;
    href?: string;
}

export function useBreadcrumbs(...items: Array<BreadcrumbItem | string>): BreadcrumbItem[] {
    const { t } = useTranslation();

    return useMemo(() => {
        return items.map(item => {
            if (typeof item === 'string') {
                return { label: t(item) };
            }
            return {
                ...item,
                label: t(item.label),
            };
        });
    }, [items, t]);
}
```

#### 30.7.3 Usage dans les Pages

```typescript
// ✅ USAGE 1 : Breadcrumb automatique (depuis les routes)
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';

function ElevesPage() {
    return (
        <div>
            <Breadcrumbs />
            <h1>Liste des élèves</h1>
            {/* ... */}
        </div>
    );
}

// ✅ USAGE 2 : Breadcrumb personnalisé avec useBreadcrumbs
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { useBreadcrumbs } from '@/hooks/use-breadcrumbs';

function EleveDetailPage() {
    const { eleve } = useEleve(id);
    const breadcrumbs = useBreadcrumbs(
        { label: 'eleves.titres.liste', href: '/eleves' },
        { label: eleve?.nomComplet || '...', actif: true },
    );

    return (
        <div>
            <Breadcrumbs items={breadcrumbs} />
            <h1>{eleve?.nomComplet}</h1>
            {/* ... */}
        </div>
    );
}

// ✅ USAGE 3 : Breadcrumb statique avec items manuels
function EleveNotesPage() {
    return (
        <div>
            <Breadcrumbs
                items={[
                    { label: 'Élèves', href: '/eleves' },
                    { label: eleve?.nomComplet, href: `/eleves/${id}` },
                    { label: 'Notes', actif: true },
                ]}
            />
            <h1>Notes de {eleve?.nomComplet}</h1>
            {/* ... */}
        </div>
    );
}
```

#### 30.7.4 Intégration dans le Layout

**Fichier :** `src/app/routes/__root.tsx` ou layout principal

```typescript
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';

function RootLayout() {
    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 p-6">
                {/* Breadcrumb affiché automatiquement sur toutes les pages */}
                <Breadcrumbs afficherAccueil />
                <Outlet />
            </main>
        </div>
    );
}
```

#### 30.7.5 Règles d'Utilisation

- **TOUJOURS** afficher le breadcrumb en haut de la page, avant le titre
- **TOUJOURS** inclure un lien vers la page d'accueil (icône Home)
- **TOUJOURS** marquer la page courante comme texte non-cliquable (actif)
- **TOUJOURS** utiliser `aria-label="Breadcrumb"` pour l'accessibilité
- **ÉVITER** les breadcrumbs trop profonds (> 5 niveaux) — reconsidérer l'architecture
- **PERSONNALISER** les labels avec `useBreadcrumbs()` pour les pages dynamiques (détail élève, etc.)

### 30.8 Gestion des Routes Inexistantes (404)

```typescript
// app/routes/__root.tsx ou fichier 404.tsx
import { NotFoundPage } from '@/features/error/NotFoundPage';

// TanStack Router gère automatiquement les routes non trouvées
// Créer un composant 404友好
function NotFoundPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <h1 className="text-6xl font-bold text-[var(--color-texte)]">404</h1>
            <p className="mt-4 text-lg text-[var(--color-texte-secondaire)]">
                Page non trouvée
            </p>
            <Link to="/dashboard" className="mt-6">
                Retour au tableau de bord
            </Link>
        </div>
    );
}
```

### 30.9 Anti-patterns de Navigation

- **NE PAS** créer de boutons sans action ni navigation
- **NE PAS** utiliser `<a href="/...">` → Utiliser `<Link to="...">` de TanStack Router
- **NE PAS** utiliser `window.location.href` → Utiliser `navigate()` ou `router.navigate()`
- **NE PAS** hardcoder les chemins dans les composants → Utiliser `to="/eleves/$id"` avec params
- **NE PAS** oublier les routes de détail (`$id.tsx`) pour les entités
- **NE PAS** créer de menus avec des liens morts ou `#`
- **NE PAS** oublier la route 404 pour les chemins invalides

---

## 31. Anti-patterns à Éviter

- **NE PAS** utiliser `alert()`, `confirm()`, `prompt()` → Composants personnalisés
- **NE PAS** utiliser de CSS inline (sauf pour les valeurs dynamiques)
- **NE PAS** créer de composants avec plus de 200 lignes → Découper
- **NE PAS** fetch des données dans `useEffect` → Utiliser TanStack Query
- **NE PAS** stocker dans localStorage des données sensibles → Session uniquement
- **NE PAS** ignorer les erreurs de compilation TypeScript
- **NE PAS** utiliser `dangerouslySetInnerHTML` sans sanitization
- **NE PAS** désactiver les règles ESLint sans justification
- **NE PAS** utiliser de librairie de date lourde → `date-fns` uniquement
- **NE PAS** créer de state global pour des données locales au composant
- **NE PAS** oublier `AbortController` pour les fetch annulables
- **NE PAS** bypasser le routeur avec `window.location` → `router.navigate()`
- **NE PAS** écrire de chaînes en français directement dans le JSX → utiliser `t('cle')`
- **NE PAS** concaténer des fragments de traduction (`t('debut') + variable + t('fin')`) → utiliser l'interpolation `t('message', { variable })`
- **NE PAS** appeler `i18n.changeLanguage()` directement dans un composant → utiliser le hook `useLanguage()` ou le store
- **NE PAS** stocker des traductions dans le state React → toujours les obtenir via `t()` pour réagir au changement de langue

---

## 31. Checklist Nouveau Composant

- [ ] Bannière eLISAschool en en-tête
- [ ] Props typées avec interface nommée
- [ ] Utilisation de Tailwind CSS (pas de CSS custom)
- [ ] Couleurs via variables CSS (`var(--color-*)`)
- [ ] **Ultra-Responsif** : Testé sur 3 breakpoints minimum (320px, 768px, 1920px)
- [ ] **Ultra-Responsif** : Tous les paddings utilisent `clamp()` ou `var(--padding-*)`
- [ ] **Ultra-Responsif** : Tous les gaps utilisent `var(--gap-*)`
- [ ] **Ultra-Responsif** : Toutes les tailles d'icônes utilisent `var(--icon-*)` ou `clamp()`
- [ ] **Ultra-Responsif** : Tous les font-size utilisent `clamp()` ou variables texte
- [ ] **Ultra-Responsif** : Tous les border-radius utilisent `var(--radius-*)`
- [ ] **Ultra-Responsif** : Pas de débordement horizontal sur mobile
- [ ] **Ultra-Responsif** : Texte lisible sans zoom sur 320px
- [ ] **Ultra-Responsif** : Boutons assez grands pour le tactile (min 44x44px)
- [ ] **Ultra-Responsif** : Transformation structurelle sur < 480px si nécessaire (tableau → carte)
- [ ] Accessible (aria-labels, focus visible, contraste)
- [ ] Navigation clavier supportée
- [ ] Animation Framer Motion (hover, transition)
- [ ] Loading state (skeleton ou spinner)
- [ ] Empty state illustré
- [ ] Error state avec message clair
- [ ] **i18n** : Toutes les chaînes visibles utilisent `t()` (aucun texte en dur)
- [ ] **i18n** : Les messages toast, labels, placeholders et erreurs sont traduits
- [ ] **i18n** : Les dates formatées utilisent le locale courant (`date-fns`)
- [ ] **i18n** : Les montants utilisent `Intl.NumberFormat` avec la langue courante
- [ ] Export barrel (`index.ts`)
- [ ] Nommage conventionnel respecté

---

## 31.9 Pattern de Page Module (aligné sur `utilisateurs`)

**Référence** : la feature `utilisateurs` est le patron de tout module de gestion. Reproduire ce pattern pour Organisation et modules similaires.

### Règles de navigation
- **JAMAIS** de sticky sub-nav interne à une page/module. La navigation latérale entre sections d'un module passe par le **sous-menu de la sidebar principale** (`components/layout/Sidebar.tsx`, `children:`).
- Chaque section = **route dédiée autonome** (`/module/section`), deep-linkable, protégée par permission.
- Layout de module = minimal : `Breadcrumbs` + `motion` + `ErrorBoundary` + `<Outlet/>`.

### Page LISTE
- `PageHeader variant="gradient"` (titre, sous-titre compteur, icône, `actions` = bouton créer gated).
- `DataTable` avec pagination **serveur** : `enableReordering/Pinning/ColumnVisibility/CollapsibleFilters`, `disableClientSearch`, `onSearchChange`, `onFilterChange`, `pagination` (mappé depuis `meta`), `onPageChange`/`onLimitChange`, `renderActions` avec `permission` + `variant`.
- Skeleton (`PageSkeleton`) au 1er chargement, `ErrorMessage` avec retry sinon.

### Page DÉTAIL
- `PageHeader variant="gradient" showBreadcrumbs onBack` + `TabsBar`/`TabsContent` (`variant="underline"`, navigation par `?tab=`), onglets typés `Tab[]` (`id/label/description/icon`).

### Page CONFIG / Nomenclatures
- Page unique + `TabsBar` ; chaque table via **UN composant générique réutilisable** (`NomenclatureCrudPage`) — pas de duplication de fichiers de tables quasi-identiques.

### Contrat de pagination
- Backend : renvoyer `PaginatedResult<T>` (`{ items, meta }`) via `@common/utils/pagination.util` (`createPaginatedResult`/`paginateWithQueryBuilder`) ; controller `res.json({ success: true, data: result })`.
- Hook front : `return response.data` (= `{ items, meta }`) ; la page mappe `meta` → prop `pagination` du `DataTable`.

### Permissions
- Toujours granulaires : `module:section:read|write|delete`. Ne jamais utiliser une permission grossière type `module:edit`.
- **Rôles consultation** (ENSEIGNANT, ELEVE, PARENT) : attribuer UNIQUEMENT la permission de la vue publique du module (ex : `organisation:organigramme:read`), jamais les autres sections. La sidebar filtre les sous-menus par permission — un rôle consultation ne voit que l'entrée autorisée.

---

## 31.10 Pattern Header Intégré avec Onglets Glass (pages immersives)

**Référence** : `OrganigrammePage.tsx` — header gradient avec onglets de mode de vue intégrés.

### Quand utiliser ce pattern
- Pages **immersives** où les onglets font partie de l'identité visuelle (modes de vue, filtres visuels).
- **NE PAS** utiliser pour les pages CRUD standard → utiliser `PageHeader variant="gradient"` + `TabsBar` classique.

### Structure
```tsx
<div className="relative overflow-hidden rounded-2xl" style={{
    background: 'linear-gradient(135deg, var(--color-dominant-600), var(--color-dominant-800))',
    padding: 'clamp(1rem, 0.8rem + 1vw, 1.5rem) clamp(1.25rem, 1rem + 1.2vw, 2rem)',
}}>
    {/* Watermark icône */}
    <div className="absolute -right-6 -top-6 pointer-events-none select-none" aria-hidden>
        <Icon className="text-white/[0.07]" style={{ width: 'clamp(8rem, 15vw, 14rem)', height: 'clamp(8rem, 15vw, 14rem)' }} />
    </div>
    {/* Breadcrumbs inversés */}
    <Breadcrumbs currentLabel={titre} inverted />
    {/* Contenu : titre + onglets */}
    <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        {/* Titre avec icône glass */}
        <div className="flex items-center gap-3">
            <div className="rounded-2xl flex items-center justify-center shrink-0"
                 style={{ width: 'clamp(2.5rem,2rem+1.5vw,3.5rem)', height: 'clamp(2.5rem,2rem+1.5vw,3.5rem)',
                          backgroundColor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}>
                <Icon className="text-white" style={{ width: 'clamp(1.25rem,1rem+0.8vw,1.75rem)' }} />
            </div>
            <div>
                <h1 className="text-white font-bold" style={{ fontSize: 'clamp(1.125rem, 1rem + 0.5vw, 1.5rem)' }}>...</h1>
                <p className="text-white/70" style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}>...</p>
            </div>
        </div>
        {/* Onglets glass (desktop) / select natif (mobile < 480px) */}
        {!isMobile ? (
            <div role="tablist" style={{
                backgroundColor: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.15)', borderRadius: 'clamp(0.5rem, 0.4rem + 0.3vw, 0.75rem)',
                padding: 'clamp(0.25rem, 0.2rem + 0.15vw, 0.375rem)',
            }}>
                {vues.map(v => (
                    <button key={v.id} role="tab" aria-selected={isActive}
                        style={{
                            backgroundColor: isActive ? 'rgba(255,255,255,0.28)' : 'transparent',
                            color: 'white', opacity: isActive ? 1 : 0.7,
                            borderRadius: 'clamp(0.375rem, 0.3rem + 0.2vw, 0.5rem)',
                        }}>
                        <Icon />{v.label}
                    </button>
                ))}
            </div>
        ) : (
            <select value={vueActive} onChange={...} style={{
                backgroundColor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
                color: 'white', border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 'clamp(0.375rem, 0.3rem + 0.2vw, 0.5rem)',
            }}>
                {vues.map(v => <option key={v.id} value={v.id} style={{ color: '#1a1a1a' }}>{v.label}</option>)}
            </select>
        )}
    </div>
</div>
```

### Règles
- **Glass-morphism** : `rgba(255,255,255,0.12)` + `backdrop-filter: blur(12px)` + bordure `rgba(255,255,255,0.15)`.
- **Mobile < 480px** : `<select>` natif stylé glass (meilleur tactile que des pills).
- **Breadcrumbs** : prop `inverted` pour texte blanc sur fond gradient.
- **Watermark** : icône du module en `text-white/[0.07]`, positionnée `-right-6 -top-6`.
- **NE PAS** utiliser `PageHeader` pour ce pattern (le prop `actions` applique `gradientActionStyle()` qui cascade sur les enfants).

---

## 31.11 Pattern ReactFlow Controls Panel (boutons d'action flottants)

**Référence** : `OrganigrammeFlowView.tsx` — boutons custom dans le panneau de contrôles ReactFlow.

### Ajout de boutons custom dans `<Controls>`
```tsx
import { Controls, ControlButton } from 'reactflow';

<Controls showInteractive={false} className="!border-[var(--color-bordure)] !bg-[var(--color-surface)]">
    {/* Boutons standard (zoom in/out/fit) */}
    {/* Boutons custom */}
    <ControlButton onClick={handleToggleFullscreen} title={t('pleinEcran')}>
        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
    </ControlButton>
    <ControlButton onClick={onToggleRelations} title={t('afficherRelations')}
        style={showRelations ? { backgroundColor: 'var(--color-dominant-600)', color: '#fff' } : undefined}>
        <Link2 className="w-4 h-4" />
    </ControlButton>
    <ControlButton onClick={onExport} title={t('exporter')}>
        <Download className="w-4 h-4" />
    </ControlButton>
</Controls>
```

### Communication Controls ↔ Toolbar (ExportDialog)
- L'`ExportDialog` vit dans le **toolbar** (pas dans le FlowView).
- Le bouton export dans les contrôles dispatche un événement custom :
  ```typescript
  window.dispatchEvent(new CustomEvent('organigramme:toolbar-command', { detail: { command: 'export' } }));
  ```
- Le toolbar écoute cet événement et ouvre le dialog.
- **Avantage** : pas de duplication de state, pas de prop drilling.

### Export — Barre de progression toujours visible
- La barre de progression est `sticky bottom-0 -mx-[var(--padding-modal-body)] mt-auto` dans le body du `CustomModal` — visible sans scroll.
- `backgroundColor: var(--color-surface)` et `border-t` pour séparer du contenu au-dessus.
- `await new Promise(resolve => setTimeout(resolve, 16))` après `onProgress?.('preparation')` dans `export.ts` pour laisser React peindre l'étape avant le travail lourd.

### Fullscreen API
```typescript
const [isFullscreen, setIsFullscreen] = useState(false);
useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
}, []);

const handleToggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen();
}, []);
```

---

## 31.12 Pattern Edge — Edges ReactFlow (organigramme)

**Références** : `edges/BaseEdge.tsx`, `lib/routing/markers.tsx`, `lib/routing/bezier-router.ts`

### Architecture v3 — Routage différencié

| Type | Routing | Stratégie | Trait | Couleur |
|------|---------|-----------|-------|---------|
| **Hiérarchie** | `getSmoothStepPath` (axial) | offset=0, voie centrale | 3px plein | `--color-dominant-500` |
| **DIRECT** | `getBezierPath` (latéral) | Côté intelligent + arc rangée | 2.5px `10 5` | `--color-secondary-500` |
| **FONCTIONNEL** | `getBezierPath` (latéral) | Côté opposé au DIRECT | 2.5px `4 5` | `--color-accent-600` |

### Flèches manuelles (pas de SVG `<marker>`)
- **NE PAS** utiliser `MarkerType.ArrowClosed` ReactFlow ni SVG `<marker>` (orient incohérent, `markerUnits` scaling parasite, vars CSS non résolues dans `<defs>`).
- **TOUJOURS** utiliser le rendu manuel via `EdgeArrow` dans `BaseEdge.tsx` :
  - `EdgeShell` prop `arrowColor?: string` — active la flèche et définit sa couleur
  - `endTangentAngle(path)` — extrait l'angle de la tangente à l'extrémité du path string (supporte `M`, `L`, `C`)
  - `EdgeArrow` — rend un `<path>` triangulaire à `(endX, endY)` avec `transform="rotate(angle)"`
  - La couleur est **exactement** celle de `stroke` (pas de CSS var, pas de `currentColor`)
- `MarkerDefs` conservé (rendu dans `<ReactFlow>` avant `<Background>`) pour compatibilité, mais **aucun edge ne l'utilise**.

### Composants partagés (`BaseEdge.tsx`)
- **`useBaseEdge(config)`** : hook — `getSmoothStepPath` pour hiérarchie (axial, offset=0).
- **`useBezierEdge(config)`** : hook — Bézier latéral pour relations, accepte `side/direction/waypoints/rowBounds`.
- **`EdgeShell`** : composant — hit-testing transparent (16px) + path visible + transitions.
- **`EdgeTooltip`** : tooltip unifié — position `above` (hiérarchie) ou `below` (badge relation).

### Routage intelligente (`lib/routing/`)
3 modes de tracé selon la disposition source/target :

1. **Même niveau** (`Math.abs(dy) < 60` en TB) → arc Bézier au-dessus de la rangée (`rowBounds.yMin - 80px`). Jamais à travers les cartes.
2. **Relation descendante** (`dy > 60` en TB, target en dessous) → **ligne droite diagonale** avec offset latéral (`SIDE_OFFSET=50`) pointant directement vers la carte cible. Propre, professionnel, sans courbe.
3. **Relation montante** (cas rare, source sous target) → courbe Bézier latérale classique.

- **`CongestionManager`** : assigne DIRECT/FONCTIONNEL de côtés opposés (jamais même côté pour même paire).
- **`computeRowBounds()`** : calcule la bounding-box d'une rangée pour le mode "même niveau".
- **`computeWaypoints()`** : pour `depthDiff >= 3`, détecte nœuds bloquants dans le corridor latéral → segments en ligne droite (pas de courbes).
- **Waypoint fallback** : chemins en lignes droites (`M... L...`), plus de Bezier — cohérent avec le mode descendant.
- **`routeViaWaypoints()`** : segments `L` (straight line) au lieu de `C` (Bezier), pour une cohérence visuelle avec le mode descendant.
- **Espacement dagre auto-adaptatif** : `relationCount` multiplie `nodesep`/`ranksep` (facteur 1.0–1.8).

### Fichiers
- `lib/routing/markers.tsx` — marqueurs SVG custom + utilitaires
- `lib/routing/bezier-router.ts` — calcul Bézier + rowBounds + waypoints v2
- `lib/routing/congestion-manager.ts` — assignation de côté intelligente
- `lib/routing/index.ts` — barrel
- `edges/BaseEdge.tsx` — hooks + composants partagés (v2.0.0)
- `edges/HierarchieEdge.types.ts` — type extrait
- `edges/HierarchieEdge.tsx` — smoothStep axial, marker custom (v6.0.0)
- `edges/RelationEdge.tsx` — Bézier latéral, marker custom (v5.0.0)
- `utils/layout.ts` — espacement auto-adaptatif (v2.0.0)
- `hooks/use-organigramme-flow.ts` — intègre toutes les briques (v2.0.0)

---

## 32. Maintenance et Skills Disponibles

- **`elisaschool-frontend-dev`** — Guide de développement frontend (créer composant, page, feature, intégration API)
- **`elisaschool-frontend-refactor`** — Guide de refactorisation frontend (optimisation, modernisation, migration)
- **`elisaschool-dev`** — Guide de développement backend
- **`elisaschool-business-logic`** — Guide de la logique métier

> **Pour demander une mise à jour** : *« mets à jour la règle frontend »* en précisant le changement.

---

## 33. Pattern Network Connection Indicator

### Architecture
- **Module** : `features/network/`
- **Store** : `stores/connection.store.ts` — Zustand (état global `{ state, details }`, méthode `checkConnection()`)
- **Hook** : `hooks/use-connection-status.ts` — polling 15s + listeners `online`/`offline`/`visibilitychange`
- **Composants** :
  - `ConnectionIndicator.tsx` — point + anneau SVG (Framer Motion), inséré dans `Header.tsx` avant `EtablissementSwitcher`
  - `ConnectionPopover.tsx` — Radix Popover avec détails permission-gated (`network:details`)
  - `ConnectionBanner.tsx` — bannière persistante après 30s d'état critique, placée dans `PageLayout.tsx` après `<Header />`

### États et visuel
| État | Anneau (réseau) | Point (serveur) | Pulse | Couleurs CSS var |
|------|:---------------:|:----------------:|:-----:|------------------|
| `connected` | Vert | Vert | — | `--color-dominant-500` |
| `degraded` | Vert | Jaune | 1.5s | `--color-warning` (point) |
| `server-down` | Vert | Rouge | 1s | `--color-danger` (point) |
| `lan-only` | Orange | Gris | 3s | `--color-warning` (anneau), `--color-text-muted` (point) |
| `offline` | Rouge | Gris | — | `--color-danger` (anneau), `--color-text-muted` (point) |

### Détection
- `navigator.onLine` + `GET /api/network/ping` (back-end : DB check + mémoire + internet probe)
- Cache Redis 30s pour internet probe côté back-end
- Fallback frontend : Cloudflare `1.1.1.1` en `no-cors` si serveur down

### Backend
- Module `backend/src/modules/network/` — `network.service.ts` + `network.controller.ts`
- `GET /api/network/ping` — public, route montée dans `app.ts` juste après `/api/health`
- Réponse : `{ status: 'ok'|'degraded'|'down', timestamp, details: { database, memory, internet }, latencyMs }`

### Règles
- **TOUJOURS** utiliser la connexion directe `fetch` (pas `apiClient`) pour le ping (indépendant du JWT)
- **TOUJOURS** faire les sons internet via le back-end (cache Redis 30s) avec fallback frontend `no-cors`
- **TOUJOURS** permissionner le popover détail (`network:details`) et la page monitoring (`network:admin`)
- **TOUJOURS** traduire les clés dans `common.json` (`network.*`)
- **NE JAMAIS** utiliser de sonde internet tierce sans fallback (CORS, adblockers, mauvaises pratiques)

---

## 34. Pattern Module Emploi du Temps (EDT)

### Architecture
- **Module** : `features/emploi-du-temps/` (page standalone `/_auth/emploi-du-temps` → `EDTStandalonePage`, guard `requireModulePermission('emploi-du-temps')`)
- **Vues** : `edt-page.tsx` (onglets Planning/Configuration), `edt-calendar` (grille semaine dnd-kit), `edt-month-view` / `edt-day-view` (vue mensuelle/journalière), `edt-liste` (liste), `edt-synthese` (KPIs), `edt-audit` (conflits), `edt-preferences`, `edt-templates`, `edt-filter-bar` (barre de contexte classe/enseignant/salle), modals `edt-creneau-modal` / `edt-generation-modal` / `edt-heures-cours-modal`
- **Heures de cours** : `features/personnel/` (`tab-heure-cours.tsx`, `heure-cours-form-modal.tsx`, `onglets/onglet-edt.tsx`, `hooks/use-heure-cours.ts`) — consommés par `personnel-detail-page.tsx` ET `edt-heures-cours-modal.tsx`

### Règles
- **TOUJOURS** utiliser la `DataTable` partagée pour les listes de créneaux (`edt-liste`) — tri/pagination/recherche via ses props ; **NE JAMAIS** réinventer une table artisanale
- **NE JAMAIS** appeler `setState` pendant le rendu (anti-pattern : clamps de pagination hors limites → `useEffect`)
- **TOUJOURS** utiliser le `StepperModal` partagé pour les modals multi-étapes (créneau, génération) ; **NE JAMAIS** implémenter de stepper maison
- **TOUJOURS** utiliser `StatCard` partagé pour les KPIs (`edt-synthese`) ; **NE JAMAIS** de KPI Card locale
- **TOUJOURS** des icônes lucide partout, y compris dans `edt-filter-bar` (jamais d'emoji)
- **TOUJOURS** CSS vars pour les couleurs (badges statut créneau : `bg-success/*`/`bg-info/*`, jamais `bg-green-*/bg-blue-*`)
- **TOUJOURS** utiliser `paletteCreneau()` (`@/lib/palette-creneau`) pour colorer les créneaux — jamais de `backgroundColor: couleur` brut. La palette génère `fondTeinte` (vue semaine/jour), `fondAssombri` (vue mois), `texteSurFond`/`texteSurTeinte` (contraste auto WCAG), `bordure`, `fondBadge`. Import : `import { paletteCreneau } from '@/lib/palette-creneau'`
- **NE JAMAIS** afficher une couleur matière sans contraste vérifié — `paletteCreneau()` garantit ≥ 3:1 (texte) et ≥ 4.5:1 (fond assombri) automatiquement
- **Ordre canon des jours** : `LUNDI..SAMEDI` (index `0=LUNDI`) — ne jamais mapper `getDay()` (0=dimanche) directement sur la semaine EDT sans décalage
- **TOUJOURS** wrapper les onglets de `personnel-detail-page.tsx` dans un `ErrorBoundary` (y compris `TabHeureCours`)
- **TOUJOURS** importer les hooks EDT/heures-cours via les barrels (`@/features/personnel`, `@/features/emploi-du-temps`), jamais par chemin direct cross-feature
- **TOUJOURS** parité i18n FR/EN (`emplois.json`, `personnel.json`) ; les clés `synthese.*`, `audit.*`, `generationHeuresCours.*` doivent exister dans les deux langues
- **Backend** : audit des créneaux/heures-cours dans les **services** (pas les controllers) — pattern uniforme avec `heure-cours.service.ts`

## 35. Convention i18n — Anti-collision clés objet/string

### Règle
**JAMAIS** nommer une clé JSON objet et une clé JSON string avec le même nom au même niveau hiérarchique. Cela crée une ambiguïté : `t('cle')` retourne un objet au lieu d'une string.

### Exemple d'anti-pattern (bug `jour`)
```json
// ❌ INTERDIT — "jour" est à la fois un objet ET utilisé comme string
{
  "jour": { "vide": "...", "precedent": "..." },
  "jours": { "lundi": "Lundi", ... }
}
// Dans le code : t('jour') → retourne l'objet, pas "Jour"
```

### Pattern correct
```json
// ✅ CORRECT — namespaces distincts
{
  "jour": { "vide": "...", "precedent": "..." },
  "jours": { "lundi": "Lundi", ... },
  "calendrier": { "jour": "Jour", "heure": "Heure", ... }
}
// Dans le code : t('calendrier.jour') → "Jour" ✅
```

### Vérification
- Avant d'ajouter une clé i18n, vérifier qu'aucune clé homonyme n'existe déjà (objet ou string)
- Pour les labels de colonnes DataTable, utiliser le namespace sémantique (`calendrier.jour`, `filtres.jour`) plutôt que la clé racine
- Les clés de pluriel (`_one`/`_other`) sont réservées sur l'objet — jamais sur une string

## 36. Composants partagés EDT / Heures de cours / Remplacements

### Emplacement
`frontend/src/components/ui/data-table/` — barrel `index.ts`.

### Composants disponibles
| Composant | Usage | Props clés |
|---|---|---|
| `ColonneEnseignant` | Avatar initiales + nom complet | `enseignant: { prenom, nom } \| undefined` |
| `ColonneMatiere` | Dot couleur + nom + code responsive | `matiere: { nom, couleur?, code? } \| undefined` |
| `ColonneClasse` | Icône GraduationCap + nom + code | `classe: { nom, code? } \| undefined` |
| `ColonneSalle` | Icône MapPin + nom/code | `salle: { nom, code? } \| undefined` |
| `BadgeStatutCreneau` | Badge statut unifié (8 états) | `statut: string, label: string, size?: 'xs' \| 'sm'` |

### Règles d'utilisation
- **OBLIGATOIRE** dans les DataTable des pages `edt-liste.tsx`, `heures-cours-page.tsx`, `remplacements-page.tsx` — jamais de renderer inline dupliqué
- **Import** via `@/components/ui/data-table` (barrel), jamais par chemin relatif direct
- **Extension** : si une nouvelle page a besoin du même pattern de cellule, utiliser ces composants ; si le style diffère, créer une variante (prop) plutôt qu'un nouveau composant

### ElisaSelect v2.1
- **Prop `searchable`** : affiche un input search dans le dropdown (filtrage live côté client)
- **Prop `compact`** : variant `h-8` / `text-xs` pour les filtres DataTable et FilterPanel
- **Prop `aria-label`** : accessibilité ARIA sur le trigger (propagée au SelectPrimitive.Trigger)
- **Dark mode** : classes `dark:` explicites sur Trigger et Content (portal)
- **Contraintes viewport** : `max-h-[min(70vh,360px)]`, `w-[--radix-select-trigger-width]`, `max-w-[calc(100vw-2rem)]`, `avoidCollisions` — empêche le débordement écran
- **Items tronqués** : `truncate` sur ItemText — les labels longs ne débordent pas
- **Scroll buttons** : gradient fade (surface→transparent) + border subtile — indicateurs visuels de débordement
- **Pattern "Tous"** : pour les filtres, prépending `{ value: '', label: 'Tous...' }` dans les options
- **Valeurs numériques** : convertir via `String(value)` à l'aller, `Number(v)` au retour
- **Controller RHF** : `field.value` → `String()`, `onValueChange` → `field.onChange(v)`
- **Utilisation** : FilterPanel, DataTable toolbar, et TOUS les modals du module EDT — aucun `<select>` natif

### Interdit
- `<select>` natif HTML dans les filtres, formulaires ou modals — toujours ElisaSelect
- Renderer inline dupliqué pour enseignant/matière/classe/salle dans les DataTable du module EDT
- Badge de statut inline avec classes conditionnelles — toujours BadgeStatutCreneau

### Toolbars — Pattern anti-chevauchement (v2.1)
- **`shrink-0`** sur TOUT segmented button group et son conteneur parent — empêche l'écrasement par les éléments flex adjacents
- **`shrink-0`** sur chaque bouton dans un segmented group avec `overflow-hidden`
- **`gap-y-[var(--gap-sm)] gap-x-[var(--gap-xs)]`** sur les toolbars `flex-wrap` — gap vertical plus grand que horizontal pour le wrapping naturel
- **ElisaSelect dans toolbar** : `w-[clamp(100px,20vw,200px)]` (largeur fluide bornée) au lieu de `min-w-[clamp(120px,25vw,240px)]` (min-width rigide qui pousse les voisins)
- **Groupes d'actions** : `shrink-0` pour qu'ils ne soient jamais compressés
- **Séparateurs** : `hidden sm:block` — masqués sur mobile pour économiser l'espace horizontal

### Segmented button groups — Standard de contraste (v2.1)
- **Fond du groupe** : `bg-[var(--color-surface-alt)] dark:bg-[var(--color-surface)]` — fond légèrement teinté pour différencier du fond principal
- **Bordure extérieure** : `border-gray-300 dark:border-[var(--color-bordure)]` — gris 300 (#d1d5db→#9ca3af) en light pour visibilité, var en dark
- **Bordure inter-boutons** : `border-l border-gray-200 dark:border-[var(--color-bordure)]/60` — séparation subtile mais visible (#e5e7eb en light)
- **Actif** : `bg-[var(--color-dominant-600)] text-white dark:bg-[var(--color-dominant-700)] shadow-sm` — rempli solide + ombre subtile (contraste max)
- **Inactif** : `text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] dark:text-[var(--color-text-secondary)]` — texte lisible en light, discret en dark
- **Séparateurs toolbar** : `bg-gray-300 dark:bg-[var(--color-bordure)]` — même couleur que les bordures extérieures
- **Cohérence** : TOUS les toggles actifs d'une page utilisent le MÊME pattern solide (`dominant-600 text-white`) — jamais de mix pastel/solide
- **Navigation pill** : `border-gray-300 dark:border-[var(--color-bordure)]` + `hover:border-[var(--color-dominant-400)]`

### Variables CSS — Alias FR obligatoires
- **`--color-secondaire`** : défini dans globals.css — light `#e5e7eb` (gray-200), dark `#334155` (slate-700). Utilisé par ElisaButton variant `secondary`.
- **`--color-dominante`**, **`--color-accent`**, **`--color-texte`**, **`--color-bordure`**, **`--color-fond`** : tous définis en light ET dark dans globals.css, surchargés au runtime par `theme-utils.ts` pour dominante/accent.
- **Vérification** : avant d'utiliser un alias FR (`--color-xxx`) dans un composant, TOUJOURS vérifier qu'il est défini dans globals.css (light + dark).
