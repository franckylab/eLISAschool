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
│   │   ├── providers.tsx         # Providers (Query, Theme, Auth)
│   │   └── routes/               # Routes par feature
│   │       ├── __root.tsx        # Layout racine
│   │       ├── index.tsx         # Page d'accueil
│   │       ├── login.tsx         # Connexion
│   │       ├── dashboard.tsx     # Dashboard
│   │       └── ...
│   ├── components/               # Composants réutilisables
│   │   ├── ui/                   # Composants shadcn/ui étendus
│   │   ├── layout/               # Layouts (Sidebar, Header, Footer)
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
│   │   ├── use-keyboard-nav.ts
│   │   ├── use-debounce.ts
│   │   ├── use-media-query.ts
│   │   └── use-realtime.ts
│   ├── lib/                      # Utilitaires et configurations
│   │   ├── api-client.ts         # Client API (fetch/axios)
│   │   ├── query-client.ts       # TanStack Query config
│   │   ├── validators.ts         # Schémas Zod partagés
│   │   ├── pdf-generator.ts      # Génération PDF
│   │   ├── image-compressor.ts   # Compression images
│   │   └── qr-utils.ts           # Utilitaires QR code
│   ├── stores/                   # Stores Zustand globaux
│   │   ├── auth.store.ts
│   │   ├── theme.store.ts
│   │   ├── notification.store.ts
│   │   └── sidebar.store.ts
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

## 6. Système de Responsivité (9+ Niveaux)

### 6.1 Breakpoints

| Niveau | Nom | Largeur | Usage |
|--------|-----|---------|-------|
| 1 | `2xs` | 200-319px | Montres connectées, mini-écrans |
| 2 | `xs` | 320-479px | Petits téléphones |
| 3 | `sm` | 480-639px | Téléphones standards |
| 4 | `md` | 640-767px | Grandes phablettes |
| 5 | `lg` | 768-1023px | Tablettes portrait |
| 6 | `xl` | 1024-1279px | Tablettes paysage / petits laptops |
| 7 | `2xl` | 1280-1535px | Laptops standards |
| 8 | `3xl` | 1536-1919px | Desktops |
| 9 | `4xl` | 1920-2559px | Grands écrans |
| 10 | `5xl` | 2560px+ | Écrans 4K+ |

### 6.2 Tailwind Config

```typescript
// tailwind.config.ts
export default {
    theme: {
        screens: {
            '2xs': '200px',
            'xs': '320px',
            'sm': '480px',
            'md': '640px',
            'lg': '768px',
            'xl': '1024px',
            '2xl': '1280px',
            '3xl': '1536px',
            '4xl': '1920px',
            '5xl': '2560px',
        },
    },
}
```

### 6.3 Ajustements Proportionnels

**TOUS les éléments** s'ajustent proportionnellement :

```css
/* Texte : clamp() pour fluidité */
--text-xs: clamp(0.625rem, 0.58rem + 0.2vw, 0.75rem);
--text-sm: clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem);
--text-base: clamp(0.875rem, 0.8rem + 0.35vw, 1rem);
--text-lg: clamp(1rem, 0.9rem + 0.5vw, 1.125rem);
--text-xl: clamp(1.125rem, 1rem + 0.6vw, 1.25rem);
--text-2xl: clamp(1.25rem, 1.1rem + 0.8vw, 1.5rem);
--text-3xl: clamp(1.5rem, 1.2rem + 1.5vw, 1.875rem);
--text-4xl: clamp(1.875rem, 1.5rem + 2vw, 2.25rem);

/* Icônes proportionnelles */
--icon-sm: clamp(14px, 12px + 0.5vw, 16px);
--icon-md: clamp(18px, 16px + 0.5vw, 20px);
--icon-lg: clamp(22px, 20px + 0.5vw, 24px);

/* Boutons proportionnels */
--btn-height-sm: clamp(28px, 26px + 0.5vw, 32px);
--btn-height-md: clamp(34px, 32px + 0.5vw, 38px);
--btn-height-lg: clamp(40px, 38px + 0.5vw, 44px);

/* Espacements proportionnels */
--space-xs: clamp(0.25rem, 0.2rem + 0.2vw, 0.5rem);
--space-sm: clamp(0.5rem, 0.4rem + 0.3vw, 0.75rem);
--space-md: clamp(0.75rem, 0.6rem + 0.5vw, 1rem);
--space-lg: clamp(1rem, 0.8rem + 0.7vw, 1.5rem);
--space-xl: clamp(1.5rem, 1.2rem + 1vw, 2.5rem);
```

### 6.4 Hook useMediaQuery

```typescript
const breakpoint = useBreakpoint();
// Retourne: '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl'
```

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

## 29. Anti-patterns à Éviter

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

---

## 30. Checklist Nouveau Composant

- [ ] Bannière eLISAschool en en-tête
- [ ] Props typées avec interface nommée
- [ ] Utilisation de Tailwind CSS (pas de CSS custom)
- [ ] Couleurs via variables CSS (`var(--color-*)`)
- [ ] Responsive (testé sur au moins 3 breakpoints)
- [ ] Accessible (aria-labels, focus visible, contraste)
- [ ] Navigation clavier supportée
- [ ] Animation Framer Motion (hover, transition)
- [ ] Loading state (skeleton ou spinner)
- [ ] Empty state illustré
- [ ] Error state avec message clair
- [ ] Export barrel (`index.ts`)
- [ ] Nommage conventionnel respecté

---

## 31. Maintenance et Skills Disponibles

- **`elisaschool-frontend-dev`** — Guide de développement frontend (créer composant, page, feature, intégration API)
- **`elisaschool-frontend-refactor`** — Guide de refactorisation frontend (optimisation, modernisation, migration)
- **`elisaschool-dev`** — Guide de développement backend
- **`elisaschool-business-logic`** — Guide de la logique métier

> **Pour demander une mise à jour** : *« mets à jour la règle frontend »* en précisant le changement.
