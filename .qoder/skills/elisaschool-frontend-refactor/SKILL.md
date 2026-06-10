---
name: elisaschool-frontend-refactor
description: >
  Guide de refactorisation frontend eLISAschool. Utiliser ce skill pour moderniser, optimiser,
  et restructurer le code frontend React/TypeScript. Déclencheurs : refactorisation, optimisation
  performance, modernisation composants, migration, nettoyage code, amélioration UX, design system,
  extraction chaînes, i18n, internationalisation, traduction.
---

# Refactorisation Frontend eLISAschool

## Quand utiliser ce skill

- **Moderniser** des composants existants (design, animations, accessibilité)
- **Optimiser** les performances (bundle, rendering, data fetching)
- **Restructurer** l'architecture frontend (features, shared, hooks)
- **Migrer** vers de nouvelles librairies ou patterns
- **Nettoyer** le code (types, conventions, anti-patterns)
- **Améliorer** l'expérience utilisateur (navigation clavier, fluidité)
- **Harmoniser** le design system (couleurs, espacements, typographie)
- **Internationaliser** le frontend (extraire les chaînes en dur vers i18next)

> **Prérequis** : Lire d'abord la règle `elisaschool-frontend.md` et le skill `elisaschool-frontend-dev`.

---

## Processus de Refactorisation

### Phase 1 : Audit et Diagnostic

**Avant toute modification**, effectuer un audit complet :

```bash
# 1. État de la compilation
npm run build 2>&1 | tee build-audit.log

# 2. Analyse du bundle
npx vite-bundle-visualizer

# 3. Linting et types
npx tsc --noEmit
npx eslint src/ --ext .ts,.tsx --format=stylish

# 4. Vérifier les dépendances
npm outdated
npx depcheck
```

### Checklist d'Audit

| Critère | État | Action |
|---------|------|--------|
| Compilation sans erreur | ✅/❌ | Corriger les erreurs TypeScript |
| Pas de `any` non justifiés | ✅/❌ | Remplacer par des types explicites |
| Couleurs en variables CSS | ✅/❌ | Migrer vers le thème dynamique |
| Responsive 9 breakpoints | ✅/❌ | Ajouter les breakpoints manquants |
| Navigation clavier | ✅/❌ | Implémenter useKeyboardNav |
| Animations Framer Motion | ✅/❌ | Ajouter les transitions |
| Toast Sonner (pas d'alert) | ✅/❌ | Remplacer les dialogs natifs |
| Lazy loading des routes | ✅/❌ | Ajouter React.lazy() |
| TanStack Query pour le fetch | ✅/❌ | Migrer depuis useEffect |
| Conventions de nommage | ✅/❌ | Renommer selon les standards |
| Pas de chaînes en dur (i18n) | ✅/❌ | Extraire vers fichiers de traduction |

---

## Workflow : Moderniser un Composant Existant

### Étape 1 : Analyser le composant

1. Lire le composant en entier
2. Identifier les anti-patterns
3. Lister les dépendances externes
4. Vérifier l'accessibilité
5. Vérifier le responsive

### Étape 2 : Corriger les anti-patterns courants

#### Anti-pattern : Données fetchées dans useEffect

```tsx
// ❌ AVANT
function EleveList() {
    const [eleves, setEleves] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/eleves')
            .then(r => r.json())
            .then(data => { setEleves(data.data); setLoading(false); });
    }, []);

    if (loading) return <div>Chargement...</div>;
    return <div>{/* ... */}</div>;
}

// ✅ APRÈS
function EleveList() {
    const { data, isLoading } = useEleves();  // TanStack Query

    if (isLoading) return <ListLoading />;
    return <div>{/* ... */}</div>;
}
```

#### Anti-pattern : Couleurs en dur

```tsx
// ❌ AVANT
<div className="bg-green-600 text-white">
<button style={{ backgroundColor: '#28a745' }}>

// ✅ APRÈS
<div className="bg-[var(--color-dominant-600)] text-[var(--color-dominant-contrast)]">
<button className="bg-[var(--color-dominant-600)]">
```

#### Anti-pattern : Composant trop gros (>200 lignes)

```tsx
// ❌ AVANT : Composant monolithique de 400 lignes
function ElevesPage() {
    // ... state management ...
    // ... data fetching ...
    // ... filtres ...
    // ... tableau ...
    // ... modales ...
    // ... formulaires ...
}

// ✅ APRÈS : Découpage en sous-composants
function ElevesPage() {
    return (
        <PageLayout>
            <PageHeader titre="Élèves" action={<NouvelEleveBouton />} />
            <ElevesFiltres />
            <ElevesTable />
            <EleveFormModal />
            <EleveDetailDrawer />
        </PageLayout>
    );
}
```

#### Anti-pattern : Pas de gestion d'erreur

```tsx
// ❌ AVANT
const { data } = useQuery(['eleves'], fetchEleves);
// Pas de gestion d'erreur → page blanche si API down

// ✅ APRÈS
const { data, isError, error, refetch } = useEleves();

if (isError) {
    return (
        <ErrorState
            message="Impossible de charger les élèves"
            action={<ElisaButton onClick={() => refetch()}>Réessayer</ElisaButton>}
        />
    );
}
```

#### Anti-pattern : Chaînes en dur (pas d'i18n)

```tsx
// ❌ AVANT : Textes codés en dur
function ElevesPage() {
    return (
        <div>
            <h1>Élèves</h1>
            <p>{total} élèves inscrits</p>
            <button>Nouvel élève</button>
        </div>
    );
}

// ✅ APRÈS : Traductions via i18next
import { useTranslation } from 'react-i18next';

function ElevesPage() {
    const { t } = useTranslation('eleves');
    return (
        <div>
            <h1>{t('titre')}</h1>
            <p>{t('sousTitre', { total })}</p>
            <button>{t('boutons.nouveau')}</button>
        </div>
    );
}

// ❌ AVANT : Toast en dur
toast.success('Élève créé avec succès');

// ✅ APRÈS : Toast traduit
toast.success(t('common:messages.succesEnregistrement'));

// ❌ AVANT : Messages d'erreur Zod en dur
z.string().min(2, 'Le nom doit contenir au moins 2 caractères')

// ✅ APRÈS : Messages Zod traduits
z.string().min(2, t('validation.nomMin'))
```

### Étape 3 : Ajouter les animations Framer Motion

```tsx
// ❌ AVANT : Transition brutale
<div className="page-content">
    {children}
</div>

// ✅ APRÈS : Transition fluide
<motion.div
    className="page-content"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.2, ease: 'easeInOut' }}
>
    {children}
</motion.div>
```

### Étape 4 : Ajouter la navigation clavier

```tsx
// ❌ AVANT : Pas de raccourcis clavier
<button onClick={() => setModalOuvert(true)}>Nouveau</button>

// ✅ APRÈS : Raccourcis + tooltip
<ElisaButton
    onClick={() => setModalOuvert(true)}
    raccourci="Ctrl+N"
    title="Nouvel élève (Ctrl+N)"
>
    Nouveau
</ElisaButton>

// Hook useKeyboardShortcuts dans le composant parent
useKeyboardShortcuts([
    { key: 'n', ctrl: true, action: () => setModalOuvert(true) },
    { key: 'f', ctrl: true, action: () => focusSearch() },
    { key: 'Escape', action: () => setModalOuvert(false) },
]);
```

---

## Workflow : Optimiser les Performances

### 1. Identifier les re-renders inutiles

```tsx
// Installer React DevTools Profiler
// Identifier les composants qui re-render trop souvent

// ❌ AVANT : Re-render à chaque keystroke
function Parent() {
    const [search, setSearch] = useState('');
    return (
        <div>
            <input value={search} onChange={e => setSearch(e.target.value)} />
            <ExpensiveList items={items} /> {/* Re-render à chaque keystroke */}
        </div>
    );
}

// ✅ APRÈS : Memoization + Debounce
const MemoizedExpensiveList = memo(ExpensiveList);

function Parent() {
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 200);

    const filteredItems = useMemo(
        () => items.filter(i => i.nom.toLowerCase().includes(debouncedSearch.toLowerCase())),
        [items, debouncedSearch]
    );

    return (
        <div>
            <input value={search} onChange={e => setSearch(e.target.value)} />
            <MemoizedExpensiveList items={filteredItems} />
        </div>
    );
}
```

### 2. Optimiser le bundle

```typescript
// ❌ AVANT : Import statique de tout
import { Editor } from './components/Editor';  // 200KB chargé toujours
import { Chart } from './components/Chart';      // 150KB chargé toujours

// ✅ APRÈS : Lazy loading
const Editor = lazy(() => import('./components/Editor').then(m => ({ default: m.Editor })));
const Chart = lazy(() => import('./components/Chart').then(m => ({ default: m.Chart })));

// Suspense avec skeleton
<Suspense fallback={<Skeleton className="h-64 w-full" />}>
    <Editor />
</Suspense>
```

### 3. Optimiser les images

```tsx
// ❌ AVANT
<img src="/photos/eleve.jpg" />

// ✅ APRÈS : Responsive + Lazy + WebP
<picture>
    <source srcSet="/photos/eleve.webp" type="image/webp" />
    <img
        src="/photos/eleve.jpg"
        loading="lazy"
        decoding="async"
        width={200}
        height={200}
        alt="Photo de l'élève"
        className="rounded-lg object-cover"
    />
</picture>
```

### 4. Optimiser les grandes listes (Virtualisation)

```tsx
// ❌ AVANT : Rendre 1000+ éléments
function ElevesList({ eleves }: { eleves: Eleve[] }) {
    return (
        <div>
            {eleves.map(eleve => <EleveRow key={eleve.id} eleve={eleve} />)}
        </div>
    );
}

// ✅ APRÈS : Virtualisation avec @tanstack/react-virtual
import { useVirtualizer } from '@tanstack/react-virtual';

function ElevesList({ eleves }: { eleves: Eleve[] }) {
    const parentRef = useRef<HTMLDivElement>(null);

    const virtualizer = useVirtualizer({
        count: eleves.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 64,  // Hauteur estimée par item
        overscan: 5,
    });

    return (
        <div ref={parentRef} className="h-[600px] overflow-auto">
            <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
                {virtualizer.getVirtualItems().map((virtualRow) => {
                    const eleve = eleves[virtualRow.index];
                    return (
                        <div
                            key={eleve.id}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: `${virtualRow.size}px`,
                                transform: `translateY(${virtualRow.start}px)`,
                            }}
                        >
                            <EleveRow eleve={eleve} />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
```

---

## Workflow : Migrer vers le Design System

### 1. Créer les tokens de design

```typescript
// src/lib/design-tokens.ts
export const DESIGN_TOKENS = {
    // Typographie fluide
    text: {
        xs: 'var(--text-xs)',    // ~12px
        sm: 'var(--text-sm)',    // ~14px
        base: 'var(--text-base)', // ~16px
        lg: 'var(--text-lg)',    // ~18px
        xl: 'var(--text-xl)',    // ~20px
        '2xl': 'var(--text-2xl)', // ~24px
        '3xl': 'var(--text-3xl)', // ~30px
        '4xl': 'var(--text-4xl)', // ~36px
    },

    // Espacements
    spacing: {
        xs: 'clamp(0.25rem, 0.2rem + 0.2vw, 0.5rem)',
        sm: 'clamp(0.5rem, 0.4rem + 0.3vw, 0.75rem)',
        md: 'clamp(0.75rem, 0.6rem + 0.5vw, 1rem)',
        lg: 'clamp(1rem, 0.8rem + 0.7vw, 1.5rem)',
        xl: 'clamp(1.5rem, 1.2rem + 1vw, 2.5rem)',
    },

    // Rayons de bordure
    radius: {
        sm: '0.25rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        full: '9999px',
    },

    // Ombres
    shadows: {
        sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    },

    // Transitions
    transitions: {
        rapide: '150ms ease-out',
        normale: '250ms ease-in-out',
        lente: '400ms ease-in-out',
    },
} as const;
```

### 2. Script de migration (recherche/remplacement)

```bash
# Rechercher les couleurs en dur
grep -rn "bg-green-" src/ --include="*.tsx"
grep -rn "text-blue-" src/ --include="*.tsx"
grep -rn "bg-\[#\|text-\[#\|border-\[#\|stroke-\[#\|fill-\[#\|bg-\[rgb" src/ --include="*.tsx"

# Rechercher les tailles fixes
grep -rn "text-\[1[0-9]px\]\|text-\[2[0-9]px\]" src/ --include="*.tsx"
grep -rn "w-\[[0-9]\+px\]\|h-\[[0-9]\+px\]" src/ --include="*.tsx"
```

### 3. Règles de migration

| Ancien | Nouveau |
|--------|---------|
| `bg-green-600` | `bg-[var(--color-dominant-600)]` |
| `text-gray-700` | `text-[var(--color-text-primary)]` |
| `text-gray-500` | `text-[var(--color-text-secondary)]` |
| `border-gray-200` | `border-[var(--color-border)]` |
| `bg-white` | `bg-[var(--color-surface)]` |
| `bg-gray-50` | `bg-[var(--color-surface-alt)]` |
| `bg-gray-100` | `bg-[var(--color-background)]` |
| `text-red-600` | `text-red-600` (exception: sémantique erreur) |
| `text-[14px]` | `text-[var(--text-sm)]` |
| `p-4` | `p-[var(--space-md)]` ou garder `p-4` si constant |

---

## Workflow : Restructurer l'Architecture

### Avant : Structure plate

```
src/
├── components/
│   ├── EleveList.tsx
│   ├── EleveForm.tsx
│   ├── NoteTable.tsx
│   ├── NoteForm.tsx
│   └── ... 50+ fichiers mélangés
```

### Après : Structure par features

```
src/
├── components/          # Composants réutilisables uniquement
│   ├── ui/              # Design system
│   ├── layout/          # Layouts
│   └── forms/           # Composants formulaires
├── features/            # Code métier par module
│   ├── eleves/
│   │   ├── components/  # Composants spécifiques élèves
│   │   ├── hooks/       # Hooks spécifiques élèves
│   │   ├── stores/      # State local élèves
│   │   ├── types/       # Types élèves
│   │   └── index.ts     # Barrel export
│   ├── notes/
│   ├── bulletins/
│   └── ...
├── hooks/               # Hooks partagés
├── stores/              # Stores globaux
├── lib/                 # Utilitaires
└── app/                 # Configuration app
```

### Script de migration

```bash
# 1. Créer les dossiers features
mkdir -p src/features/eleves/{components,hooks,stores,types}
mkdir -p src/features/notes/{components,hooks,stores,types}

# 2. Déplacer les fichiers spécifiques
git mv src/components/EleveList.tsx src/features/eleves/components/eleve-list.tsx
git mv src/components/EleveForm.tsx src/features/eleves/components/eleve-form.tsx

# 3. Renommer en kebab-case
# EleveList.tsx → eleve-list.tsx
# NoteTable.tsx → note-table.tsx

# 4. Créer les barrel exports
echo "export * from './components';" > src/features/eleves/index.ts
echo "export * from './eleve-list';" > src/features/eleves/components/index.ts
```

---

## Workflow : Migrer les Dialogs Natifs

### Remplacer alert/confirm/prompt

```tsx
// ❌ AVANT
if (confirm('Supprimer cet élève ?')) {
    await supprimerEleve(id);
}

// ✅ APRÈS : Hook useConfirm
const { confirmer, dialogNode } = useConfirm();

const handleSupprimer = async (id: string) => {
    const ok = await confirmer({
        titre: 'Supprimer cet élève ?',
        message: 'Cette action est irréversible. Toutes les données associées seront perdues.',
        type: 'danger',
        boutonConfirmer: 'Supprimer définitivement',
        boutonAnnuler: 'Annuler',
    });

    if (ok) {
        supprimerEleve.mutate(id);
    }
};

// Dans le JSX
return (
    <>
        {/* Contenu de la page */}
        {dialogNode}
    </>
);
```

---

## Workflow : Améliorer l'Accessibilité

### Checklist Accessibilité

```tsx
// 1. Labels explicites
// ❌
<input placeholder="Nom" />
// ✅
<label htmlFor="nom" className="sr-only">Nom de l'élève</label>
<input id="nom" placeholder="Nom" aria-label="Nom de l'élève" />

// 2. Focus visible
// ✅ Toujours visible au clavier
className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-dominant-500)]"

// 3. aria-live pour les mises à jour dynamiques
<div aria-live="polite" aria-atomic="true">
    {nombreResultats} résultats trouvés
</div>

// 4. Rôles sémantiques
<nav aria-label="Navigation principale">
<main aria-label="Contenu principal">
<aside aria-label="Barre latérale">

// 5. Contraste vérifié
// Utiliser getContrastColor() pour le texte sur fond coloré
<span style={{ color: getContrastColor(bgColor) }}>Texte lisible</span>

// 6. Skip navigation
<a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4">
    Aller au contenu principal
</a>
```

---

## Workflow : Harmoniser les Icônes

### Utiliser Lucide React de façon cohérente

```tsx
// ✅ Règles d'icônes :
// 1. Toujours utiliser Lucide React (pas de mélange Font Awesome + Lucide)
// 2. Tailles cohérentes par contexte :
//    - Inline texte : 14px (h-3.5 w-3.5)
//    - Boutons : 16px (h-4 w-4)
//    - Navigation : 20px (h-5 w-5)
//    - Hero : 24px (h-6 w-6)
//    - Feature : 32px+ (h-8 w-8)
// 3. strokeWidth cohérent : 1.5 ou 2

// Mapping icônes par module
const MODULE_ICONS = {
    eleves: 'Users',
    notes: 'FileText',
    bulletins: 'ScrollText',
    classes: 'School',
    matieres: 'BookOpen',
    cantine: 'Utensils',
    transport: 'Bus',
    notifications: 'Bell',
    messagerie: 'MessageCircle',
    configuration: 'Settings',
    sondages: 'Vote',
    gamification: 'Trophy',
    orientation: 'Compass',
    personnel: 'UserCog',
} as const;

// Composant ModuleIcon
function ModuleIcon({ module, taille = 20 }: { module: string; taille?: number }) {
    const IconComponent = icons[MODULE_ICONS[module as keyof typeof MODULE_ICONS]] || Circle;
    return <IconComponent size={taille} strokeWidth={1.5} />;
}
```

---

## Workflow : Migrer vers TanStack Query

### Remplacer useState/useEffect par useQuery

```tsx
// ❌ AVANT : Pattern manuel
function NotesPage() {
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [page, setPage] = useState(1);

    useEffect(() => {
        setLoading(true);
        fetch(`/api/notes?page=${page}`)
            .then(r => r.json())
            .then(data => {
                setNotes(data.data);
                setLoading(false);
            })
            .catch(err => {
                setError(err);
                setLoading(false);
            });
    }, [page]);

    // ...
}

// ✅ APRÈS : TanStack Query
function NotesPage() {
    const [page, setPage] = useState(1);
    const { data, isLoading, isError, refetch } = useNotes({ page });

    if (isLoading) return <ListLoading />;
    if (isError) return <ErrorState onRetry={refetch} />;

    return (
        <div>
            <NotesTable notes={data.data} />
            <Pagination
                page={page}
                totalPages={data.pagination.totalPages}
                onChange={setPage}
            />
        </div>
    );
}
```

### Remplacer les mutations manuelles

```tsx
// ❌ AVANT
const handleSave = async (note: NoteDto) => {
    try {
        setSaving(true);
        const response = await fetch('/api/notes', { method: 'POST', body: JSON.stringify(note) });
        const data = await response.json();
        setNotes(prev => [...prev, data.data]);
        toast.success('Note ajoutée');
    } catch (err) {
        toast.error('Erreur');
    } finally {
        setSaving(false);
    }
};

// ✅ APRÈS
const creerNote = useCreerNote();

const handleSave = (note: NoteDto) => {
    creerNote.mutate(note);  // Gère loading, error, success, invalidation
};
```

---

## Patterns de Refactorisation Avancés

### 1. Extraire la logique dans un hook

```tsx
// ❌ AVANT : Logique mélangée dans le composant
function EleveDetail({ id }: { id: string }) {
    const [eleve, setEleve] = useState<Eleve | null>(null);
    const [notes, setNotes] = useState<Note[]>([]);
    const [bulletins, setBulletins] = useState<Bulletin[]>([]);
    const [activeTab, setActiveTab] = useState('info');

    useEffect(() => { /* fetch eleve */ }, [id]);
    useEffect(() => { /* fetch notes */ }, [id]);
    useEffect(() => { /* fetch bulletins */ }, [id]);

    const moyenneGenerale = useMemo(() => {
        return notes.reduce((sum, n) => sum + n.valeur, 0) / notes.length;
    }, [notes]);

    // ... 300 lignes de JSX
}

// ✅ APRÈS : Hook dédié + composants séparés
function useEleveDetail(id: string) {
    const eleve = useEleve(id);
    const notes = useNotesEleve(id);
    const bulletins = useBulletinsEleve(id);

    const moyenneGenerale = useMemo(() => {
        if (!notes.data?.length) return 0;
        return notes.data.reduce((sum, n) => sum + n.valeur, 0) / notes.data.length;
    }, [notes.data]);

    return { eleve, notes, bulletins, moyenneGenerale };
}

function EleveDetail({ id }: { id: string }) {
    const { eleve, notes, bulletins, moyenneGenerale } = useEleveDetail(id);
    const [activeTab, setActiveTab] = useState('info');

    return (
        <TabLayout active={activeTab} onChange={setActiveTab}>
            <EleveInfoTab eleve={eleve.data} />
            <EleveNotesTab notes={notes.data} moyenne={moyenneGenerale} />
            <EleveBulletinsTab bulletins={bulletins.data} />
        </TabLayout>
    );
}
```

### 2. Composants composés (Compound Pattern)

```tsx
// ❌ AVANT : Composant avec trop de props
<Card
    titre="Élèves"
    sousTitre="Liste des élèves"
    action={<Button>Nouveau</Button>}
    footer={<Pagination />}
    loading={isLoading}
    empty={!eleves.length}
    emptyMessage="Aucun élève"
>
    <EleveTable />
</Card>

// ✅ APRÈS : Compound components
<Card>
    <Card.Header>
        <Card.Title>Élèves</Card.Title>
        <Card.Description>Liste des élèves</Card.Description>
        <Card.Action>
            <ElisaButton icone={<Plus />}>Nouveau</ElisaButton>
        </Card.Action>
    </Card.Header>
    <Card.Content>
        {isLoading ? <ListLoading /> : eleves.length ? <EleveTable /> : <EmptyState message="Aucun élève" />}
    </Card.Content>
    <Card.Footer>
        <Pagination />
    </Card.Footer>
</Card>
```

---

## Workflow : Migrer vers i18n (Internationalisation)

### Étape 1 : Auditer les chaînes en dur

```bash
# Rechercher les chaînes en dur dans le JSX
grep -rn ">[A-ZÀ-Ÿa-z]" src/ --include="*.tsx" | grep -v "className\|import\|//\|console"

# Rechercher les chaînes dans les attributs
grep -rn 'placeholder="[^"]*"' src/ --include="*.tsx"
grep -rn 'title="[^"]*"' src/ --include="*.tsx"
grep -rn "label=\"[^\"]*\"" src/ --include="*.tsx"

# Rechercher les messages toast en dur
grep -rn "toast\.\(success\|error\|info\|warning\)('[^']*'" src/ --include="*.tsx" --include="*.ts"

# Rechercher les messages Zod en dur
grep -rn "\.min\|\.max\|\.refine\|\.required" src/ --include="*.ts" --include="*.tsx" | grep "'"
```

### Étape 2 : Créer les fichiers de traduction

```bash
# Créer les dossiers de langue
mkdir -p src/locales/{fr,en}

# Pour chaque module, créer un fichier JSON
# src/locales/fr/eleves.json
# src/locales/en/eleves.json
```

**Structure des clés :**

```json
{
    "titre": "Élèves",
    "sousTitre": "{{total}} élèves inscrits",
    "boutons": {
        "nouveau": "Nouvel élève",
        "modifier": "Modifier",
        "supprimer": "Supprimer"
    },
    "colonnes": {
        "matricule": "Matricule",
        "nomComplet": "Nom complet",
        "classe": "Classe",
        "sexe": "Sexe"
    },
    "champs": {
        "prenom": "Prénom",
        "nom": "Nom",
        "dateNaissance": "Date de naissance",
        "sexe": "Sexe",
        "masculin": "Masculin",
        "feminin": "Féminin"
    },
    "placeholders": {
        "prenom": "Prénom de l'élève",
        "nom": "Nom de famille",
        "selectionner": "Sélectionner"
    },
    "validation": {
        "nomMin": "Le nom doit contenir au moins 2 caractères",
        "prenomMin": "Le prénom doit contenir au moins 2 caractères",
        "age": "L'âge doit être entre 3 et 25 ans",
        "sexeRequis": "Le sexe est requis",
        "classeInvalide": "Classe invalide"
    },
    "modal": {
        "titreNouveau": "Nouvel élève",
        "titreModifier": "Modifier l'élève"
    },
    "messages": {
        "creeSucces": "Élève {{prenom}} {{nom}} créé avec succès",
        "supprime": "Élève supprimé"
    }
}
```

### Étape 3 : Remplacer les chaînes par `t()`

```tsx
// ❌ AVANT
<h1>Élèves</h1>
<p>{total} élèves inscrits</p>
<button>Nouvel élève</button>

// ✅ APRÈS
const { t } = useTranslation('eleves');
<h1>{t('titre')}</h1>
<p>{t('sousTitre', { total })}</p>
<button>{t('boutons.nouveau')}</button>
```

### Étape 4 : Migrer les toasts

```tsx
// ❌ AVANT
toast.success('Élève créé avec succès');
toast.error('Erreur lors de la suppression');

// ✅ APRÈS
toast.success(t('messages.creeSucces', { prenom: data.prenom, nom: data.nom }));
toast.error(t('common:messages.erreurServeur'));
```

### Étape 5 : Migrer la validation Zod

```tsx
// ❌ AVANT
const schema = z.object({
    nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
});

// ✅ APRÈS : Schema en fonction de t()
const creerSchema = (t: (key: string) => string) => z.object({
    nom: z.string().min(2, t('validation.nomMin')),
});

// Dans le composant
const { t } = useTranslation('eleves');
const schema = useMemo(() => creerSchema(t), [t]);
```

### Étape 6 : Migrer les formats date/nombre

```tsx
// ❌ AVANT
const date = format(new Date(eleve.dateNaissance), 'dd/MM/yyyy');
const montant = `${prix} FCFA`;

// ✅ APRÈS
import { format as formatDate } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';

const DATE_LOCALES: Record<string, Locale> = { fr, en: enUS };

const date = formatDate(new Date(eleve.dateNaissance), 'dd MMMM yyyy', {
    locale: DATE_LOCALES[i18n.language] || fr,
});

const montant = new Intl.NumberFormat(i18n.language === 'en' ? 'en-US' : 'fr-FR', {
    style: 'currency',
    currency: 'XAF',
}).format(prix);
```

### Étape 7 : Valider la migration

```bash
# Vérifier la parité des clés FR/EN
node -e "
const fr = require('./src/locales/fr/eleves.json');
const en = require('./src/locales/en/eleves.json');
const getKeys = (obj, prefix='') => Object.entries(obj).flatMap(([k,v]) =>
    typeof v === 'object' ? getKeys(v, prefix+k+'.') : prefix+k);
const frKeys = getKeys(fr).sort();
const enKeys = getKeys(en).sort();
const missing = frKeys.filter(k => !enKeys.includes(k));
const extra = enKeys.filter(k => !frKeys.includes(k));
if (missing.length) console.log('Clés manquantes en EN:', missing);
if (extra.length) console.log('Clés en trop en EN:', extra);
if (!missing.length && !extra.length) console.log('✅ Parité FR/EN OK');
"

# Vérifier qu'il ne reste plus de chaînes en dur
grep -rn ">[A-ZÀ-Ÿ]" src/features/ --include="*.tsx" | grep -v "className\|import\|//\|console\|{t("
```

---

## Checklist Post-Refactorisation

### Validation

- [ ] `npm run build` compile sans erreur
- [ ] `npx tsc --noEmit` pas d'erreurs TypeScript
- [ ] `npx eslint src/` pas d'erreurs linting (warnings OK)
- [ ] Tests manuels sur les 3 breakpoints principaux (sm, lg, 3xl)
- [ ] Navigation clavier fonctionnelle sur les pages refactorisées
- [ ] Pas de régression visuelle (comparer avant/après)
- [ ] Performance : Lighthouse score > 90 (Performance, Accessibility, Best Practices)
- [ ] Bundle size : Pas d'augmentation significative

### Performance

- [ ] Temps de chargement initial < 3s (3G)
- [ ] First Contentful Paint < 1.5s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Total Blocking Time < 200ms
- [ ] Cumulative Layout Shift < 0.1

### Qualité Code

- [ ] Pas de `any` ajouté (ou justifié avec commentaire)
- [ ] Conventions de nommage respectées
- [ ] Bannière eLISAschool sur les nouveaux fichiers
- [ ] Barrel exports (`index.ts`) mis à jour
- [ ] Imports utilisant les alias (`@/`, `@shared/`)
- [ ] Pas de chaînes en dur — toutes les chaînes passent par `t()`
- [ ] Fichiers de traduction FR et EN synchronisés (même clés)
- [ ] Toasts, erreurs Zod, labels tous traduits via i18next

---

## Outils de Refactorisation

### Extensions VS Code recommandées

- **Error Lens** : Affiche les erreurs inline
- **Tailwind CSS IntelliSense** : Autocomplétion Tailwind
- **Pretty TypeScript Errors** : Erreurs TS lisibles
- **Import Cost** : Poids des imports en temps réel

### Scripts utilitaires

```bash
# Trouver les fichiers trop gros (>200 lignes)
find src -name "*.tsx" -exec wc -l {} + | sort -rn | head -20

# Trouver les composants sans barrel export
for dir in src/features/*/; do [ ! -f "$dir/index.ts" ] && echo "Missing: $dir"; done

# Trouver les imports relatifs profonds (à remplacer par alias)
grep -rn "from '\.\./\.\./\.\." src/ --include="*.tsx" --include="*.ts"

# Trouver les dépendances circulaires
npx madge --circular src/
```

---

## Maintenance et Évolution

Ce skill est un document **vivant**.

### Quand mettre à jour

- Après une refactorisation majeure réussie
- Quand un nouveau pattern d'optimisation est identifié
- Quand une nouvelle version d'une librairie apporte des changements significatifs

### Comment mettre à jour

- *« Mets à jour le skill refactor pour inclure la migration vers React 19 »*
- *« Ajoute un workflow pour migrer les formulaires vers React Hook Form »*
- *« Documente le pattern de migration CSS-in-JS vers Tailwind »*
