---
name: elisaschool-frontend-dev
description: >
  Guide de développement frontend eLISAschool. Utiliser ce skill pour créer un nouveau composant,
  une nouvelle page, une nouvelle feature, ou intégrer l'API backend depuis le frontend
  React/Vite/TypeScript. Déclencheurs : nouveau composant, nouvelle page, intégration API,
  formulaire, tableau, PWA, animation, thème, i18n, traduction, internationalisation, multilingue.
---

# Développement Frontend eLISAschool

## Quand utiliser ce skill

- Créer un **nouveau composant** React réutilisable
- Créer une **nouvelle page** ou feature complète
- Intégrer l'**API backend** avec TanStack Query
- Créer des **formulaires** avancés avec validation
- Créer des **tableaux** avec tri, filtre, pagination
- Implémenter des **animations** et transitions
- Configurer le **thème** et les couleurs dynamiques
- Configurer le **système de traduction** (i18next, fichiers de langue, language switcher)
- Ajouter des fonctionnalités **PWA**, **PDF**, **QR code**, **drag & drop**
- Implémenter des **infobulles** modernes et intelligentes (auto-détection texte tronqué, positionnement dynamique)

> **Note** : Pour la logique métier et les règles backend, utiliser `/elisaschool-business-logic` et `/elisaschool-dev`.
> Pour la refactorisation, utiliser `/elisaschool-frontend-refactor`.

## Prérequis

- Node.js >= 20.0.0, npm >= 10.0.0
- Backend en cours d'exécution (`npm run dev:backend`)
- Frontend initialisé : `npm run dev:frontend`

---

## Workflow : Initialiser le Projet Frontend

### Étape 1 : Créer le projet Vite

```bash
cd /home/franckylab/projets/eLISAschool
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
```

### Étape 2 : Installer les dépendances

```bash
# UI & Styling
npm install tailwindcss @tailwindcss/vite
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-select
npm install @radix-ui/react-tabs @radix-ui/react-tooltip @radix-ui/react-slot
npm install class-variance-authority clsx tailwind-merge
npm install lucide-react

# Routing & Data
npm install @tanstack/react-router @tanstack/react-query

# State Management
npm install zustand

# Formulaires
npm install react-hook-form @hookform/resolvers zod

# Animations
npm install framer-motion

# Notifications
npm install sonner

# Dates
npm install date-fns

# Drag & Drop
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

# PDF & QR
npm install jspdf html2canvas qrcode.react

# Images
npm install browser-image-compression

# PWA
npm install -D vite-plugin-pwa

# i18n (Internationalisation)
npm install i18next react-i18next i18next-browser-languagedetector

# Éditeur de texte
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-placeholder
npm install @tiptap/extension-mention @tiptap/extension-image @tiptap/extension-table

# Utils
npm install fuse.js  # Recherche fuzzy
npm install immer    # State immutable
```

### Étape 3 : Configurer Tailwind CSS

```typescript
// src/styles/globals.css
@import 'tailwindcss';

@layer base {
    :root {
        /* Couleurs dominantes (60%) - Vert par défaut */
        --color-dominant-50: #f0fdf4;
        --color-dominant-100: #dcfce7;
        --color-dominant-200: #bbf7d0;
        --color-dominant-300: #86efac;
        --color-dominant-400: #4ade80;
        --color-dominant-500: #22c55e;
        --color-dominant-600: #16a34a;
        --color-dominant-700: #15803d;
        --color-dominant-800: #166534;
        --color-dominant-900: #14532d;
        --color-dominant-950: #052e16;

        /* Couleurs secondaires (30%) */
        --color-secondary-50: #fffbeb;
        --color-secondary-100: #fef3c7;
        --color-secondary-500: #f59e0b;
        --color-secondary-600: #d97706;
        --color-secondary-700: #b45309;

        /* Couleurs accent (10%) */
        --color-accent-50: #eff6ff;
        --color-accent-100: #dbeafe;
        --color-accent-500: #3b82f6;
        --color-accent-600: #2563eb;
        --color-accent-700: #1d4ed8;

        /* Surfaces */
        --color-surface: #ffffff;
        --color-surface-alt: #f8fafc;
        --color-background: #f1f5f9;
        --color-border: #e2e8f0;

        /* Texte */
        --color-text-primary: #0f172a;
        --color-text-secondary: #475569;
        --color-text-muted: #94a3b8;

        /* Tailles fluides */
        --text-xs: clamp(0.625rem, 0.58rem + 0.2vw, 0.75rem);
        --text-sm: clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem);
        --text-base: clamp(0.875rem, 0.8rem + 0.35vw, 1rem);
        --text-lg: clamp(1rem, 0.9rem + 0.5vw, 1.125rem);
        --text-xl: clamp(1.125rem, 1rem + 0.6vw, 1.25rem);
        --text-2xl: clamp(1.25rem, 1.1rem + 0.8vw, 1.5rem);
        --text-3xl: clamp(1.5rem, 1.2rem + 1.5vw, 1.875rem);
        --text-4xl: clamp(1.875rem, 1.5rem + 2vw, 2.25rem);
    }

    .dark {
        --color-surface: #1e293b;
        --color-surface-alt: #0f172a;
        --color-background: #020617;
        --color-border: #334155;
        --color-text-primary: #f8fafc;
        --color-text-secondary: #94a3b8;
        --color-text-muted: #64748b;
    }
}
```

### Étape 4 : Configurer Vite

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
        VitePWA({
            registerType: 'autoUpdate',
            manifest: {
                name: 'eLISAschool - Gestion Scolaire',
                short_name: 'eLISAschool',
                theme_color: '#28a745',
                display: 'standalone',
                icons: [
                    { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
                    { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
                ],
            },
        }),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@shared': path.resolve(__dirname, '../shared/src'),
        },
    },
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true,
            },
        },
    },
});
```

### Étape 5 : Configurer tsconfig

```json
{
    "compilerOptions": {
        "strict": true,
        "baseUrl": ".",
        "paths": {
            "@/*": ["./src/*"],
            "@shared/*": ["../shared/src/*"]
        }
    }
}
```

### Étape 6 : Configurer l'i18n (Internationalisation)

**6a. Fichier `src/lib/i18n.ts`** — Configuration i18next :

```typescript
/**
 * ==================================
 * eLISAschool - Configuration i18n
 * ==================================
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

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
        ns: ['common', 'eleves'],
        interpolation: { escapeValue: false },
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
        },
    });

export default i18n;
```

**6b. Fichier `src/stores/language.store.ts`** — Store Zustand :

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

**6c. Fichier `src/hooks/use-language.ts`** — Hook avec sync backend :

```typescript
import { useEffect } from 'react';
import { useLanguageStore } from '@/stores/language.store';
import { apiClient } from '@/lib/api-client';

export function useLanguage() {
    const { langue, setLangue } = useLanguageStore();

    useEffect(() => {
        // Charger la préférence utilisateur depuis le backend
        apiClient.get<{ data: { valeur: string } }>('/api/preferences/my/langue')
            .then((res) => {
                if (res.data?.valeur && res.data.valeur !== langue) {
                    setLangue(res.data.valeur as 'fr' | 'en');
                }
            })
            .catch(() => { /* Garder la langue locale */ });
    }, []);

    const changerLangue = async (nouvelleLangue: 'fr' | 'en') => {
        setLangue(nouvelleLangue);
        try {
            await apiClient.post('/api/preferences/set', { cle: 'langue', valeur: nouvelleLangue });
        } catch { /* Échec non-bloquant */ }
    };

    return { langue, changerLangue };
}
```

**6d. Fichier `src/components/layout/language-switcher.tsx`** — Composant :

```tsx
import { useLanguage } from '@/hooks/use-language';
import { motion } from 'framer-motion';

const LANGUES = [
    { code: 'fr', label: 'FR' },
    { code: 'en', label: 'EN' },
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

**6e. Fichiers de traduction initiaux** :

`src/locales/fr/common.json` :
```json
{
    "boutons": {
        "enregistrer": "Enregistrer",
        "annuler": "Annuler",
        "supprimer": "Supprimer",
        "modifier": "Modifier",
        "rechercher": "Rechercher",
        "filtrer": "Filtrer",
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
    "pagination": {
        "pageSur": "Page {{page}} sur {{total}}",
        "resultats": "{{total}} résultats"
    }
}
```

`src/locales/en/common.json` :
```json
{
    "boutons": {
        "enregistrer": "Save",
        "annuler": "Cancel",
        "supprimer": "Delete",
        "modifier": "Edit",
        "rechercher": "Search",
        "filtrer": "Filter",
        "fermer": "Close",
        "confirmer": "Confirm",
        "reessayer": "Retry"
    },
    "messages": {
        "succesEnregistrement": "Saved successfully",
        "erreurServeur": "Server error, please retry",
        "chargement": "Loading...",
        "aucuneDonnee": "No data to display",
        "sessionExpiree": "Session expired, please log in again"
    },
    "pagination": {
        "pageSur": "Page {{page}} of {{total}}",
        "resultats": "{{total}} results"
    }
}
```

**6f. Intégration dans `src/app/providers.tsx`** :

```tsx
import '@/lib/i18n';  // Side-effect : initialiser i18n avant tout
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <I18nextProvider i18n={i18n}>
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </I18nextProvider>
    );
}
```

---

## Workflow : Créer un Nouveau Composant Réutilisable

### Étape 1 : Définir le composant

**Fichier :** `src/components/ui/elisa-button.tsx`

```tsx
/**
 * ==================================
 * eLISAschool - Bouton Principal
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { ButtonHTMLAttributes, forwardRef, ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
    'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
    {
        variants: {
            variante: {
                primary: 'bg-[var(--color-dominant-600)] text-white hover:bg-[var(--color-dominant-700)] shadow-sm',
                secondary: 'bg-[var(--color-secondary-600)] text-white hover:bg-[var(--color-secondary-700)]',
                accent: 'bg-[var(--color-accent-600)] text-white hover:bg-[var(--color-accent-700)]',
                ghost: 'hover:bg-[var(--color-surface-alt)] text-[var(--color-text-primary)]',
                danger: 'bg-red-600 text-white hover:bg-red-700',
                outline: 'border border-[var(--color-border)] bg-transparent hover:bg-[var(--color-surface-alt)]',
            },
            taille: {
                xs: 'h-7 px-2 text-xs',
                sm: 'h-8 px-3 text-sm',
                md: 'h-10 px-4 text-sm',
                lg: 'h-11 px-6 text-base',
                xl: 'h-12 px-8 text-base',
            },
        },
        defaultVariants: {
            variante: 'primary',
            taille: 'md',
        },
    }
);

interface ElisaButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'>, VariantProps<typeof buttonVariants> {
    children: ReactNode;
    icone?: ReactNode;
    iconePosition?: 'left' | 'right';
    chargement?: boolean;
    fullWidth?: boolean;
    raccourci?: string;
}

const ElisaButton = forwardRef<HTMLButtonElement, ElisaButtonProps>(
    ({ className, variante, taille, children, icone, iconePosition = 'left', chargement, fullWidth, raccourci, ...props }, ref) => {
        return (
            <motion.button
                ref={ref}
                className={cn(
                    buttonVariants({ variante, taille }),
                    fullWidth && 'w-full',
                    className
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={chargement || props.disabled}
                {...(props as any)}
            >
                {chargement ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : icone && iconePosition === 'left' ? (
                    <span className="shrink-0">{icone}</span>
                ) : null}
                {children}
                {!chargement && icone && iconePosition === 'right' && (
                    <span className="shrink-0">{icone}</span>
                )}
                {raccourci && (
                    <kbd className="ml-2 hidden rounded bg-black/10 px-1.5 py-0.5 text-xs font-mono lg:inline-block">
                        {raccourci}
                    </kbd>
                )}
            </motion.button>
        );
    }
);

ElisaButton.displayName = 'ElisaButton';
export { ElisaButton, buttonVariants };
export type { ElisaButtonProps };
```

### Étape 2 : Exporter le composant

**Fichier :** `src/components/ui/index.ts`

```typescript
export * from './elisa-button';
// ... autres composants
```

---

## Workflow : Créer une Page Complète (Feature)

### Étape 1 : Structure de la feature

```bash
mkdir -p src/features/eleves/{components,hooks,stores,types}
```

### Étape 2 : Types de la feature

**Fichier :** `src/features/eleves/types/eleve.types.ts`

```typescript
/**
 * ==================================
 * eLISAschool - Types Élève
 * ==================================
 */

export interface Eleve {
    id: string;
    matricule: string;
    nom: string;
    prenom: string;
    dateNaissance: string;
    sexe: 'M' | 'F';
    classeId: string;
    etablissementId: string;
    createdAt: string;
    updatedAt: string;
    classe?: { id: string; nom: string; niveau: string };
}

export interface CreerEleveDto {
    nom: string;
    prenom: string;
    dateNaissance: string;
    sexe: 'M' | 'F';
    classeId: string;
}

export interface EleveFiltres {
    classeId?: string;
    recherche?: string;
    sexe?: 'M' | 'F';
}
```

### Étape 3 : Hook d'intégration API (TanStack Query)

**Fichier :** `src/features/eleves/hooks/use-eleves.ts`

```typescript
/**
 * ==================================
 * eLISAschool - Hook Élèves
 * ==================================
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { Eleve, CreerEleveDto, EleveFiltres } from '../types/eleve.types';
import { toast } from 'sonner';

// Clés de requête
const ELEVES_KEYS = {
    all: ['eleves'] as const,
    listes: () => [...ELEVES_KEYS.all, 'liste'] as const,
    liste: (filtres: EleveFiltres) => [...ELEVES_KEYS.listes(), filtres] as const,
    details: () => [...ELEVES_KEYS.all, 'detail'] as const,
    detail: (id: string) => [...ELEVES_KEYS.details(), id] as const,
};

// Lister les élèves (paginé)
export function useEleves(filtres: EleveFiltres = {}) {
    return useQuery({
        queryKey: ELEVES_KEYS.liste(filtres),
        queryFn: async () => {
            const response = await apiClient.get<{ data: Eleve[]; pagination: any }>('/api/eleves', filtres);
            return response.data;
        },
        staleTime: 5 * 60 * 1000, // 5 min
    });
}

// Détail d'un élève
export function useEleve(id: string) {
    return useQuery({
        queryKey: ELEVES_KEYS.detail(id),
        queryFn: async () => {
            const response = await apiClient.get<{ data: Eleve }>(`/api/eleves/${id}`);
            return response.data;
        },
        enabled: !!id,
    });
}

// Créer un élève
export function useCreerEleve() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: CreerEleveDto) => {
            const response = await apiClient.post<{ data: Eleve }>('/api/eleves', dto);
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ELEVES_KEYS.listes() });
            toast.success(`Élève ${data.prenom} ${data.nom} créé avec succès`);
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.error?.message || 'Erreur lors de la création');
        },
    });
}

// Supprimer un élève (avec optimistic update)
export function useSupprimerEleve() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/eleves/${id}`);
        },
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: ELEVES_KEYS.listes() });
            const previous = queryClient.getQueriesData({ queryKey: ELEVES_KEYS.listes() });
            queryClient.setQueriesData({ queryKey: ELEVES_KEYS.listes() }, (old: any) => ({
                ...old,
                data: old.data.filter((e: Eleve) => e.id !== id),
            }));
            return { previous };
        },
        onError: (_err, _id, context) => {
            context?.previous?.forEach(([key, data]) => queryClient.setQueryData(key as any, data));
            toast.error('Erreur lors de la suppression');
        },
        onSuccess: () => {
            toast.success('Élève supprimé');
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ELEVES_KEYS.listes() });
        },
    });
}
```

### Étape 4 : Composant de la page

**Fichier :** `src/features/eleves/components/eleves-page.tsx`

```tsx
/**
 * ==================================
 * eLISAschool - Page Élèves
 * ==================================
 */

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useEleves, useCreerEleve, useSupprimerEleve } from '../hooks/use-eleves';
import { ElisaButton } from '@/components/ui/elisa-button';
import { EleveTable } from './eleve-table';
import { EleveForm } from './eleve-form';
import { CustomModal } from '@/components/modals/custom-modal';
import { ListLoading } from '@/components/feedback/list-loading';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { Plus, Search } from 'lucide-react';
import type { EleveFiltres } from '../types/eleve.types';

export function ElevesPage() {
    const { t } = useTranslation('eleves');
    const [filtres, setFiltres] = useState<EleveFiltres>({});
    const [modalOuvert, setModalOuvert] = useState(false);

    const { data, isLoading } = useEleves(filtres);
    const creerEleve = useCreerEleve();

    // Raccourci clavier Ctrl+N pour nouveau
    useKeyboardShortcuts([
        { key: 'n', ctrl: true, action: () => setModalOuvert(true) },
    ]);

    return (
        <div className="flex flex-col gap-4 p-6">
            {/* En-tête */}
            <motion.div
                className="flex items-center justify-between"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div>
                    <h1 className="text-[var(--text-3xl)] font-bold text-[var(--color-text-primary)]">
                        {t('titre')}
                    </h1>
                    <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)]">
                        {t('sousTitre', { total: data?.pagination?.total || 0 })}
                    </p>
                </div>
                <ElisaButton
                    icone={<Plus className="h-4 w-4" />}
                    onClick={() => setModalOuvert(true)}
                    raccourci="Ctrl+N"
                >
                    {t('boutons.nouveau')}
                </ElisaButton>
            </motion.div>

            {/* Tableau */}
            <AnimatePresence mode="wait">
                {isLoading ? (
                    <ListLoading />
                ) : (
                    <EleveTable eleves={data?.data || []} filtres={filtres} onFiltresChange={setFiltres} />
                )}
            </AnimatePresence>

            {/* Modale création */}
            <CustomModal
                ouvert={modalOuvert}
                onClose={() => setModalOuvert(false)}
                titre={t('modal.titreNouveau')}
                taille="lg"
            >
                <EleveForm
                    onSubmit={async (dto) => {
                        await creerEleve.mutateAsync(dto);
                        setModalOuvert(false);
                    }}
                    chargement={creerEleve.isPending}
                />
            </CustomModal>
        </div>
    );
}
```

### Étape 5 : Enregistrer la route

**Fichier :** `src/app/routes/eleves.tsx`

```typescript
import { createFileRoute } from '@tanstack/react-router';
import { ElevesPage } from '@/features/eleves/components/eleves-page';

export const Route = createFileRoute('/eleves')({
    component: ElevesPage,
});
```

---

## Workflow : Créer un Tableau Avancé (TanStack Table)

### Étape 1 : Configuration TanStack Table

```tsx
/**
 * ==================================
 * eLISAschool - Tableau Élèves Avancé
 * ==================================
 */

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    flexRender,
    createColumnHelper,
    type SortingState,
    type ColumnFiltersState,
} from '@tanstack/react-table';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Eleve } from '../types/eleve.types';
import { useKeyboardGrid } from '@/hooks/use-keyboard-grid';

const columnHelper = createColumnHelper<Eleve>();

interface EleveTableProps {
    eleves: Eleve[];
    filtres: any;
    onFiltresChange: (filtres: any) => void;
}

export function EleveTable({ eleves }: EleveTableProps) {
    const { t } = useTranslation('eleves');
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 });

    const columns = useMemo(() => [
        columnHelper.accessor('matricule', {
            header: t('colonnes.matricule'),
            cell: (info) => <span className="font-mono text-sm">{info.getValue()}</span>,
        }),
        columnHelper.accessor(row => `${row.prenom} ${row.nom}`, {
            id: 'nomComplet',
            header: t('colonnes.nomComplet'),
            cell: (info) => <span className="font-medium">{info.getValue()}</span>,
        }),
        columnHelper.accessor('classe.nom', {
            header: t('colonnes.classe'),
            cell: (info) => <span className="rounded bg-[var(--color-dominant-100)] px-2 py-0.5 text-xs">{info.getValue()}</span>,
        }),
        columnHelper.accessor('sexe', {
            header: t('colonnes.sexe'),
            cell: (info) => info.getValue(),
        }),
        columnHelper.display({
            id: 'actions',
            header: '',
            cell: (info) => (
                <div className="flex gap-1">
                    {/* Actions */}
                </div>
            ),
        }),
    ], [t]);

    const table = useReactTable({
        data: eleves,
        columns,
        state: { sorting, columnFilters, pagination },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    return (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="border-b border-[var(--color-border)] bg-[var(--color-surface-alt)]">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <th
                                        key={header.id}
                                        className="px-4 py-3 font-medium text-[var(--color-text-secondary)] cursor-pointer select-none"
                                        onClick={header.column.getToggleSortingHandler()}
                                    >
                                        <div className="flex items-center gap-1">
                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                            {{
                                                asc: <ArrowUp className="h-3 w-3" />,
                                                desc: <ArrowDown className="h-3 w-3" />,
                                            }[header.column.getIsSorted() as string] ?? (
                                                <ArrowUpDown className="h-3 w-3 opacity-40" />
                                            )}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody>
                        <AnimatePresence>
                            {table.getRowModel().rows.map((row, index) => (
                                <motion.tr
                                    key={row.id}
                                    className="border-b border-[var(--color-border)] transition-colors hover:bg-[var(--color-dominant-50)]"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ delay: index * 0.02 }}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <td key={cell.id} className="px-4 py-3">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                </motion.tr>
                            ))}
                        </AnimatePresence>
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-[var(--color-border)] px-4 py-3">
                <p className="text-sm text-[var(--color-text-secondary)]">
                    {t('common:pagination.pageSur', { page: pagination.pageIndex + 1, total: table.getPageCount() })}
                    <span className="ml-2">({t('common:pagination.resultats', { total: eleves.length })})</span>
                </p>
                <div className="flex gap-1">
                    <button
                        className="rounded-lg p-2 hover:bg-[var(--color-surface-alt)] disabled:opacity-50"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                        className="rounded-lg p-2 hover:bg-[var(--color-surface-alt)] disabled:opacity-50"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
```

---

## Workflow : Créer un Formulaire Avancé (React Hook Form + Zod)

```tsx
/**
 * ==================================
 * eLISAschool - Formulaire Élève
 * ==================================
 */

import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ElisaButton } from '@/components/ui/elisa-button';
import { cn } from '@/lib/utils';

const creerEleveSchema = (t: (key: string) => string) => z.object({
    nom: z.string().min(2, t('validation.nomMin')).max(100, t('validation.nomMax')),
    prenom: z.string().min(2, t('validation.prenomMin')).max(100, t('validation.prenomMax')),
    dateNaissance: z.string().refine((val) => {
        const date = new Date(val);
        const age = (Date.now() - date.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
        return age >= 3 && age <= 25;
    }, t('validation.age')),
    sexe: z.enum(['M', 'F'], { required_error: t('validation.sexeRequis') }),
    classeId: z.string().uuid(t('validation.classeInvalide')),
});

type EleveFormData = z.infer<ReturnType<typeof creerEleveSchema>>;

interface EleveFormProps {
    onSubmit: (data: EleveFormData) => void | Promise<void>;
    chargement?: boolean;
    valeursInitiales?: Partial<EleveFormData>;
}

export function EleveForm({ onSubmit, chargement, valeursInitiales }: EleveFormProps) {
    const { t } = useTranslation('eleves');
    const schema = useMemo(() => creerEleveSchema(t), [t]);

    const form = useForm<EleveFormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            nom: valeursInitiales?.nom || '',
            prenom: valeursInitiales?.prenom || '',
            dateNaissance: valeursInitiales?.dateNaissance || '',
            sexe: valeursInitiales?.sexe,
            classeId: valeursInitiales?.classeId || '',
        },
    });

    const { register, handleSubmit, formState: { errors } } = form;

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Prénom */}
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-[var(--color-text-secondary)]">
                        {t('champs.prenom')} <span className="text-red-500">*</span>
                    </label>
                    <input
                        {...register('prenom')}
                        className={cn(
                            'h-10 rounded-lg border px-3 text-sm transition-colors',
                            'border-[var(--color-border)] bg-[var(--color-surface)]',
                            'focus:border-[var(--color-dominant-500)] focus:outline-none focus:ring-2 focus:ring-[var(--color-dominant-200)]',
                            errors.prenom && 'border-red-500 focus:ring-red-200'
                        )}
                        placeholder={t('placeholders.prenom')}
                        autoFocus
                    />
                    {errors.prenom && (
                        <span className="text-xs text-red-500">{errors.prenom.message}</span>
                    )}
                </div>

                {/* Nom */}
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-[var(--color-text-secondary)]">
                        {t('champs.nom')} <span className="text-red-500">*</span>
                    </label>
                    <input
                        {...register('nom')}
                        className={cn(
                            'h-10 rounded-lg border px-3 text-sm transition-colors',
                            'border-[var(--color-border)] bg-[var(--color-surface)]',
                            'focus:border-[var(--color-dominant-500)] focus:outline-none focus:ring-2 focus:ring-[var(--color-dominant-200)]',
                            errors.nom && 'border-red-500 focus:ring-red-200'
                        )}
                        placeholder={t('placeholders.nom')}
                    />
                    {errors.nom && (
                        <span className="text-xs text-red-500">{errors.nom.message}</span>
                    )}
                </div>

                {/* Date de naissance */}
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-[var(--color-text-secondary)]">
                        {t('champs.dateNaissance')} <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="date"
                        {...register('dateNaissance')}
                        className={cn(
                            'h-10 rounded-lg border px-3 text-sm',
                            'border-[var(--color-border)] bg-[var(--color-surface)]',
                            'focus:border-[var(--color-dominant-500)] focus:outline-none focus:ring-2 focus:ring-[var(--color-dominant-200)]',
                            errors.dateNaissance && 'border-red-500'
                        )}
                    />
                    {errors.dateNaissance && (
                        <span className="text-xs text-red-500">{errors.dateNaissance.message}</span>
                    )}
                </div>

                {/* Sexe */}
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-[var(--color-text-secondary)]">
                        {t('champs.sexe')} <span className="text-red-500">*</span>
                    </label>
                    <select
                        {...register('sexe')}
                        className="h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm focus:border-[var(--color-dominant-500)] focus:outline-none focus:ring-2 focus:ring-[var(--color-dominant-200)]"
                    >
                        <option value="">{t('placeholders.selectionner')}</option>
                        <option value="M">{t('champs.masculin')}</option>
                        <option value="F">{t('champs.feminin')}</option>
                    </select>
                    {errors.sexe && (
                        <span className="text-xs text-red-500">{errors.sexe.message}</span>
                    )}
                </div>
            </div>

            {/* Bouton */}
            <div className="flex justify-end gap-2 pt-4">
                <ElisaButton variante="ghost" type="button">{t('common:boutons.annuler')}</ElisaButton>
                <ElisaButton type="submit" chargement={chargement} raccourci="Ctrl+Enter">
                    {t('common:boutons.enregistrer')}
                </ElisaButton>
            </div>
        </form>
    );
}
```

---

## Workflow : Créer des Infobulles Modernes

### Principe

Les infobulles sont des **aides contextuelles intelligentes** qui apparaissent dynamiquement. Elles doivent être :
- **Modernes et épurées** : Design minimaliste avec ombre subtile et coins arrondis
- **Intelligentes** : Auto-détection du texte tronqué, positionnement dynamique
- **Non-invasives** : N'apparaître que quand nécessaire, ne pas empêcher la lisibilité
- **Accessibles** : Navigation clavier, support lecteurs d'écran

### Cas d'Usage Obligatoires

| Cas | Exemple | Type |
|-----|---------|------|
| **Texte tronqué** | Nom complet coupé dans un tableau | Auto (hook `useTruncated`) |
| **Information utile** | Détail sur un badge de statut | Manuel |
| **Explication complexe** | Terme métier (coefficient, moyenne pondérée) | Manuel |
| **Action implicite** | Bouton tri, icône configuration | Manuel |

### Étape 1 : Installer la dépendance

```bash
# Déjà inclus dans les dépendances UI
# @radix-ui/react-tooltip (installé à l'étape 2 du workflow initial)
```

### Étape 2 : Créer le hook useTruncated

**Fichier :** `src/hooks/use-truncated.ts`

```typescript
/**
 * ==================================
 * eLISAschool - Hook Détection Texte Tronqué
 * ==================================
 */

import { useState, useRef, useCallback, useEffect } from 'react';

export function useTruncated() {
    const [isTruncated, setIsTruncated] = useState(false);
    const elementRef = useRef<HTMLElement>(null);

    const checkTruncated = useCallback(() => {
        const element = elementRef.current;
        if (!element) return;

        const truncated = 
            element.scrollWidth > element.clientWidth || 
            element.scrollHeight > element.clientHeight;
        
        setIsTruncated(truncated);
    }, []);

    useEffect(() => {
        checkTruncated();
        
        // Vérifier au redimensionnement
        const observer = new ResizeObserver(checkTruncated);
        if (elementRef.current) {
            observer.observe(elementRef.current);
        }
        
        return () => observer.disconnect();
    }, [checkTruncated]);

    return { elementRef, isTruncated, checkTruncated };
}
```

### Étape 3 : Créer le composant ElisaTooltip

**Fichier :** `src/components/ui/elisa-tooltip.tsx`

```tsx
/**
 * ==================================
 * eLISAschool - Infobulle Moderne
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@radix-ui/react-tooltip';
import { cn } from '@/lib/utils';

interface ElisaTooltipProps {
    contenu: string;
    enfants: React.ReactNode;
    position?: 'top' | 'bottom' | 'left' | 'right';
    delai?: number;           // Délai avant affichage (ms, défaut: 300)
    desactivation?: boolean;  // Désactiver l'infobulle
    classe?: string;          // Classes CSS supplémentaires
}

export function ElisaTooltip({
    contenu,
    enfants,
    position = 'top',
    delai = 300,
    desactivation = false,
    classe,
}: ElisaTooltipProps) {
    if (desactivation || !contenu) {
        return <>{enfants}</>;
    }

    return (
        <TooltipProvider delayDuration={delai}>
            <Tooltip>
                <TooltipTrigger asChild>
                    {enfants}
                </TooltipTrigger>
                <TooltipContent
                    side={position}
                    sideOffset={8}
                    className={cn(
                        'max-w-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] shadow-lg',
                        'animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
                        classe
                    )}
                >
                    {contenu}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
```

### Étape 4 : Exporter le composant

**Fichier :** `src/components/ui/index.ts`

```typescript
export * from './elisa-tooltip';
// ... autres composants
```

### Étape 5 : Utiliser dans un Composant

#### Exemple 1 : Auto-détection texte tronqué

```tsx
import { ElisaTooltip } from '@/components/ui/elisa-tooltip';
import { useTruncated } from '@/hooks/use-truncated';

function CelluleNom({ texte }: { texte: string }) {
    const { elementRef, isTruncated } = useTruncated();

    return (
        <ElisaTooltip contenu={texte} desactivation={!isTruncated}>
            <span
                ref={elementRef}
                className="block max-w-[200px] truncate"
            >
                {texte}
            </span>
        </ElisaTooltip>
    );
}
```

#### Exemple 2 : Information sur icône

```tsx
import { ElisaTooltip } from '@/components/ui/elisa-tooltip';
import { Info } from 'lucide-react';

function BadgeStatut({ statut, info }: { statut: string; info: string }) {
    return (
        <div className="flex items-center gap-2">
            <Badge variant={statut === 'actif' ? 'success' : 'warning'}>
                {statut}
            </Badge>
            <ElisaTooltip contenu={info}>
                <Info className="h-4 w-4 cursor-help text-[var(--color-text-muted)]" />
            </ElisaTooltip>
        </div>
    );
}
```

#### Exemple 3 : Explication terme complexe

```tsx
import { ElisaTooltip } from '@/components/ui/elisa-tooltip';
import { useTranslation } from 'react-i18next';

function EnteteMoyenne() {
    const { t } = useTranslation('notes');
    
    return (
        <ElisaTooltip 
            contenu="La moyenne pondérée = Σ(note × coefficient) / Σ(coefficients)"
            position="right"
        >
            <span className="border-b border-dotted border-[var(--color-text-muted)] cursor-help">
                Moy. Pondérée
            </span>
        </ElisaTooltip>
    );
}
```

### Étape 6 : Ajouter les animations CSS

**Fichier :** `src/styles/animations.css`

```css
/* Animations infobulles */
@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes zoomIn {
    from { transform: scale(0.95); }
    to { transform: scale(1); }
}

@keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
}

@keyframes zoomOut {
    from { transform: scale(1); }
    to { transform: scale(0.95); }
}

.animate-in {
    animation-duration: 150ms;
    animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-in-0 {
    animation-name: fadeIn;
}

.zoom-in-95 {
    animation-name: zoomIn;
}

.data-\[state\=closed\]\:animate-out[data-state="closed"] {
    animation-duration: 100ms;
}

.data-\[state\=closed\]\:fade-out-0[data-state="closed"] {
    animation-name: fadeOut;
}

.data-\[state\=closed\]\:zoom-out-95[data-state="closed"] {
    animation-name: zoomOut;
}
```

### Design System des Infobulles

**Style épuré :**
- **Fond** : `var(--color-surface)` (surface principale)
- **Bordure** : `1px solid var(--color-border)` (subtile)
- **Ombre** : `shadow-lg` (profondeur moderne)
- **Coins** : `rounded-lg` (douceur)
- **Texte** : `text-sm` (lisibilité optimale)
- **Largeur max** : `max-w-xs` (~320px, évite les lignes trop longues)

**Animation :**
- **Apparition** : 150ms, fade + zoom (fluide mais rapide)
- **Disparition** : 100ms (plus rapide pour ne pas gêner)
- **Delay** : 300ms avant apparition (évite les apparitions intempestives)

**Positionnement intelligent :**
- Radix Tooltip repositionne automatiquement pour éviter les bords
- Par défaut : `top` (au-dessus de l'élément)
- Sur mobile : s'adapte à la taille du viewport

### Anti-patterns à Éviter

- **NE PAS** utiliser pour informations critiques (toujours visibles directement)
- **NE PAS** imbriquer les infobulles (tooltip dans tooltip)
- **NE PAS** mettre de contenu interactif (boutons, liens, formulaires)
- **NE PAS** abuser : maximum 1 infobulle par élément logique
- **NE PAS** remplacer un label de formulaire par une infobulle
- **TOUJOURS** tester sur mobile (max-width viewport)
- **TOUJOURS** vérifier l'accessibilité clavier (Tab, Échap)

---

## Workflow : Configurer le Thème Dynamique

### Store Zustand pour le thème

```typescript
/**
 * ==================================
 * eLISAschool - Store Thème
 * ==================================
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

// Fonctions de conversion colorimétrique
function hexToHsl(hex: string): [number, number, number] {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }
    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h: number, s: number, l: number): string {
    s /= 100; l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

// Générer une échelle de couleurs (50 à 950)
function genererEchelleCouleur(hex: string): Record<number, string> {
    const [h, s, l] = hexToHsl(hex);
    return {
        50:  hslToHex(h, Math.min(s, 90), 97),
        100: hslToHex(h, Math.min(s, 85), 93),
        200: hslToHex(h, Math.min(s, 80), 86),
        300: hslToHex(h, Math.min(s, 75), 77),
        400: hslToHex(h, Math.min(s, 70), 66),
        500: hslToHex(h, s, 55),
        600: hex,  // Couleur de base
        700: hslToHex(h, Math.min(s + 5, 100), Math.max(l - 10, 20)),
        800: hslToHex(h, Math.min(s + 10, 100), Math.max(l - 20, 15)),
        900: hslToHex(h, Math.min(s + 15, 100), Math.max(l - 30, 10)),
        950: hslToHex(h, Math.min(s + 20, 100), Math.max(l - 40, 5)),
    };
}

// Générer couleur secondaire (complémentaire décalée)
function genererSecondaire(hex: string): string {
    const [h, s, l] = hexToHsl(hex);
    return hslToHex((h + 40) % 360, Math.min(s + 10, 100), Math.min(l + 5, 70));
}

// Générer couleur accent (triadique)
function genererAccent(hex: string): string {
    const [h, s, l] = hexToHsl(hex);
    return hslToHex((h + 200) % 360, Math.min(s + 5, 100), Math.min(l, 60));
}

// Couleur de contraste (blanc ou noir)
function getContrastColor(hex: string): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#ffffff';
}

interface ThemeState {
    couleurDominante: string;
    couleurSecondaire: string;
    couleurAccent: string;
    mode: 'light' | 'dark';
    setCouleurDominante: (couleur: string) => void;
    setMode: (mode: 'light' | 'dark') => void;
    appliquerTheme: () => void;
    chargerDepuisBackend: (config: { couleurPrimaire: string; couleurSecondaire?: string; couleurAccent?: string }) => void;
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set, get) => ({
            couleurDominante: COULEURS_DOMINANTES.vert,
            couleurSecondaire: genererSecondaire(COULEURS_DOMINANTES.vert),
            couleurAccent: genererAccent(COULEURS_DOMINANTES.vert),
            mode: 'light',

            setCouleurDominante: (couleur: string) => {
                set({
                    couleurDominante: couleur,
                    couleurSecondaire: genererSecondaire(couleur),
                    couleurAccent: genererAccent(couleur),
                });
                get().appliquerTheme();
            },

            setMode: (mode: 'light' | 'dark') => {
                set({ mode });
                document.documentElement.classList.toggle('dark', mode === 'dark');
            },

            appliquerTheme: () => {
                const { couleurDominante, couleurSecondaire, couleurAccent } = get();
                const root = document.documentElement;

                const domEchelle = genererEchelleCouleur(couleurDominante);
                const secEchelle = genererEchelleCouleur(couleurSecondaire);
                const accEchelle = genererEchelleCouleur(couleurAccent);

                Object.entries(domEchelle).forEach(([key, val]) => {
                    root.style.setProperty(`--color-dominant-${key}`, val);
                });
                Object.entries(secEchelle).forEach(([key, val]) => {
                    root.style.setProperty(`--color-secondary-${key}`, val);
                });
                Object.entries(accEchelle).forEach(([key, val]) => {
                    root.style.setProperty(`--color-accent-${key}`, val);
                });
            },

            chargerDepuisBackend: (config) => {
                set({
                    couleurDominante: config.couleurPrimaire || COULEURS_DOMINANTES.vert,
                    couleurSecondaire: config.couleurSecondaire || genererSecondaire(config.couleurPrimaire || COULEURS_DOMINANTES.vert),
                    couleurAccent: config.couleurAccent || genererAccent(config.couleurPrimaire || COULEURS_DOMINANTES.vert),
                });
                get().appliquerTheme();
            },
        }),
        { name: 'elisaschool-theme' }
    )
);
```

---

## Workflow : Configurer le Client API

```typescript
/**
 * ==================================
 * eLISAschool - Client API
 * ==================================
 */

import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
    error?: {
        code: string;
        message: string;
    };
}

async function refreshAccessToken(): Promise<string | null> {
    try {
        const refreshToken = useAuthStore.getState().refreshToken;
        if (!refreshToken) return null;

        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
        });

        if (!response.ok) return null;

        const data = await response.json();
        useAuthStore.getState().setTokens(data.data.accessToken, data.data.refreshToken);
        return data.data.accessToken;
    } catch {
        return null;
    }
}

async function request<T>(
    method: string,
    path: string,
    body?: any,
    params?: Record<string, any>,
    retryCount = 0
): Promise<ApiResponse<T>> {
    const token = useAuthStore.getState().accessToken;

    let url = `${API_BASE_URL}${path}`;
    if (params) {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                searchParams.append(key, String(value));
            }
        });
        url += `?${searchParams.toString()}`;
    }

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    // Token expiré → refresh et retry (1 fois)
    if (response.status === 401 && retryCount < 1) {
        const newToken = await refreshAccessToken();
        if (newToken) {
            return request(method, path, body, params, retryCount + 1);
        }
        useAuthStore.getState().logout();
        throw new Error('Session expirée');
    }

    const data = await response.json();

    if (!response.ok) {
        throw {
            response: { status: response.status, data },
            message: data?.error?.message || 'Erreur serveur',
        };
    }

    return data;
}

export const apiClient = {
    get: <T>(path: string, params?: Record<string, any>) => request<T>('GET', path, undefined, params),
    post: <T>(path: string, body: any) => request<T>('POST', path, body),
    patch: <T>(path: string, body: any) => request<T>('PATCH', path, body),
    delete: <T>(path: string) => request<T>('DELETE', path),
    upload: async (path: string, file: File, onProgress?: (pct: number) => void) => {
        const formData = new FormData();
        formData.append('file', file);

        const token = useAuthStore.getState().accessToken;
        const response = await fetch(`${API_BASE_URL}${path}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
        });

        return response.json();
    },
};
```

---

## Workflow : Créer le SplashScreen (Premier Chargement)

```tsx
/**
 * ==================================
 * eLISAschool - Splash Screen
 * ==================================
 * Animation : Stylo écrivant "elisa°school" + Livre ouvert
 */

import { useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';

interface SplashScreenProps {
    onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
    const controls = useAnimation();

    useEffect(() => {
        const sequence = async () => {
            await controls.start({
                opacity: [0, 1, 1, 0],
                scale: [0.95, 1, 1, 1.05],
                transition: { duration: 3, times: [0, 0.2, 0.8, 1] },
            });
            onComplete();
        };
        sequence();
    }, [controls, onComplete]);

    return (
        <motion.div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white"
            animate={controls}
        >
            {/* Animation livre ouvert */}
            <div className="relative mb-8">
                <svg viewBox="0 0 200 160" className="h-32 w-40">
                    {/* Livre ouvert */}
                    <motion.path
                        d="M100 140 L20 120 L20 20 L100 40 Z"
                        fill="var(--color-dominant-100)"
                        stroke="var(--color-dominant-600)"
                        strokeWidth="2"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.8 }}
                    />
                    <motion.path
                        d="M100 140 L180 120 L180 20 L100 40 Z"
                        fill="var(--color-dominant-50)"
                        stroke="var(--color-dominant-600)"
                        strokeWidth="2"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    />
                    {/* Pages qui tournent */}
                    <motion.path
                        d="M100 40 Q140 30 180 20"
                        fill="none"
                        stroke="var(--color-dominant-300)"
                        strokeWidth="1"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{
                            pathLength: [0, 1, 0],
                            opacity: [0, 1, 0],
                            rotateY: [0, -30, 0],
                        }}
                        transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.5 }}
                    />
                </svg>
            </div>

            {/* Texte elisa°school */}
            <div className="relative overflow-hidden">
                <motion.h1
                    className="text-4xl font-bold tracking-tight"
                    initial={{ clipPath: 'inset(0 100% 0 0)' }}
                    animate={{ clipPath: 'inset(0 0% 0 0)' }}
                    transition={{ duration: 1.5, delay: 0.5, ease: 'easeInOut' }}
                >
                    <span className="text-[var(--color-text-primary)]">elisa</span>
                    <span className="text-[var(--color-accent-600)]">°</span>
                    <span className="text-[var(--color-text-primary)]">school</span>
                </motion.h1>
            </div>

            {/* Barre de chargement */}
            <motion.div
                className="mt-6 h-1 w-48 overflow-hidden rounded-full bg-[var(--color-border)]"
            >
                <motion.div
                    className="h-full rounded-full bg-[var(--color-dominant-600)]"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 2.5, delay: 0.5, ease: 'easeInOut' }}
                />
            </motion.div>
        </motion.div>
    );
}
```

---

## Checklist Finale avant Déploiement

- [ ] Tous les fichiers ont la **bannière eLISAschool**
- [ ] Les noms suivent les **conventions** (PascalCase composants, camelCase variables)
- [ ] Pas de `any` (sauf exceptions justifiées)
- [ ] Couleurs via **variables CSS** (pas de couleurs en dur)
- [ ] **Responsive** testé sur tous les 9 breakpoints
- [ ] **Navigation clavier** fonctionnelle
- [ ] **Animations** Framer Motion sur les interactions
- [ ] **Toast** Sonner pour les notifications (pas d'alert natif)
- [ ] **Modales personnalisées** (pas de confirm/alert natif)
- [ ] **Loading states** : Skeleton pour listes, spinner pour actions
- [ ] **Empty states** illustrés
- [ ] **Error boundaries** en place
- [ ] **Lazy loading** des routes et composants lourds
- [ ] **PWA** : manifest.json, service worker, icônes
- [ ] **Build sans erreur** : `npm run build`
- [ ] **Bundle size** vérifié (pas de dépendance inutile)
- [ ] **Accessibilité** : aria-labels, focus visible, contraste WCAG AA
- [ ] **Infobulles** : Texte tronqué auto-détecté, info complexe expliquée, positionnement intelligent
- [ ] **i18n** : Toutes les chaînes utilisent `t()` (pas de texte en dur)
- [ ] **i18n** : Messages toast, erreurs Zod, labels traduits via fichiers de langue
- [ ] **i18n** : Dates formatées avec `date-fns/locale` (fr/en)
- [ ] **i18n** : Montants/devises formatés avec `Intl.NumberFormat`

---

## Référence : Modules Backend Disponibles

| Module | Route API | Feature Frontend |
|--------|-----------|-----------------|
| `auth` | `/api/auth` | Login, Register, Reset password |
| `eleves` | `/api/eleves` | CRUD élèves, inscription |
| `notes` | `/api/notes` | Saisie notes, tableau rapide |
| `bulletins` | `/api/bulletins` | Génération, visualisation PDF |
| `configuration` | `/api/configuration` | Thème, paramètres, modules |
| `preferences` | `/api/preferences` | Langue utilisateur, préférences UI |
| `notifications` | `/api/notifications` | Centre de notifications |
| `messagerie` | `/api/messagerie` | Chat, conversations |
| `sondages` | `/api/sondages` | Sondages, votes, analyses |
| `cantine` | `/api/cantine` | Menus, inscriptions, solde |
| `transport` | `/api/transport` | Lignes, présences |

---

## Maintenance et Évolution

Ce skill est un document **vivant** qui évolue avec le projet.

### Quand mettre à jour

- Un **nouveau pattern de composant** émerge
- Une **nouvelle librairie** est adoptée
- Un **changement de design** significatif
- De **nouvelles fonctionnalités UI** sont implémentées

### Comment mettre à jour

- *« Mets à jour le skill frontend pour inclure les graphiques »*
- *« Ajoute un workflow pour les composants de saisie en tableau »*
- *« Actualise les conventions de thème »*
