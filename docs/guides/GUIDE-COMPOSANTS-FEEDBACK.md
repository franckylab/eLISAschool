# Guide d'Utilisation - Composants de Feedback eLISAschool

**Version:** 1.0.0  
**Date:** 15 Juin 2026  
**Auteur:** franck arlos chendjou

---

## 📚 Sommaire

1. [Vue d'ensemble](#vue-densemble)
2. [Composants Disponibles](#composants-disponibles)
3. [LoadingState](#loadingstate)
4. [ErrorState](#errorstate)
5. [EmptyState](#emptystate)
6. [SmartEmptyState](#smartemptystate)
7. [Patterns Recommandés](#patterns-recommandés)
8. [Intégration avec DataTable](#intégration-avec-datatable)
9. [Exemples Concrets](#exemples-concrets)
10. [Bonnes Pratiques](#bonnes-pratiques)

---

## Vue d'ensemble

Les composants de feedback fournissent une expérience utilisateur professionnelle et cohérente pour gérer les états asynchrones dans l'application eLISAschool.

**Installation :** Tous les composants sont dans `@/components/feedback`

```typescript
import { LoadingState, ErrorState, EmptyState, SmartEmptyState } from '@/components/feedback';
```

---

## Composants Disponibles

| Composant | Usage | Lignes | Intelligent |
|-----------|-------|--------|-------------|
| **LoadingState** | État de chargement | 47 | ❌ |
| **ErrorState** | État d'erreur | 55 | ❌ |
| **EmptyState** | État vide basique | 67 | ❌ |
| **SmartEmptyState** | État vide avancé | 290 | ✅ |

---

## LoadingState

Affiche un spinner animé avec message contextuel pendant le chargement des données.

### Props

```typescript
interface LoadingStateProps {
    message?: string;    // Message affiché (défaut: "Chargement en cours...")
    size?: number;       // Taille du spinner (défaut: 8)
    className?: string;  // Classes CSS supplémentaires
}
```

### Usage Basique

```typescript
import { LoadingState } from '@/components/feedback';

function MaPage() {
    const { data, isLoading } = useQuery({
        queryKey: ['eleves'],
        queryFn: fetchEleves,
    });

    if (isLoading) {
        return (
            <div className="p-6">
                <LoadingState message="Chargement des élèves..." />
            </div>
        );
    }

    return <ElevesTable eleves={data} />;
}
```

### Usage Avancé

```typescript
// Taille personnalisée
<LoadingState 
    message="Préparation des bulletins..." 
    size={12} 
/>

// Avec classe CSS
<LoadingState 
    message="Chargement..." 
    className="min-h-[500px]" 
/>
```

### Rendu Visuel

```
┌─────────────────────────────────────┐
│                                     │
│          [Spinner animé]            │
│                                     │
│     Chargement des élèves...        │
│                                     │
└─────────────────────────────────────┘
```

---

## ErrorState

Affiche un message d'erreur avec icône et bouton de retry.

### Props

```typescript
interface ErrorStateProps {
    title?: string;          // Titre (défaut: "Une erreur est survenue")
    message: string;         // Message d'erreur (obligatoire)
    icon?: LucideIcon;       // Icône (défaut: AlertTriangle)
    onRetry?: () => void;    // Callback retry
    retryLabel?: string;     // Label bouton (défaut: "Réessayer")
    className?: string;      // Classes CSS
}
```

### Usage Basique

```typescript
import { ErrorState } from '@/components/feedback';

function MaPage() {
    const { data, error, refetch } = useQuery({
        queryKey: ['eleves'],
        queryFn: fetchEleves,
    });

    if (error) {
        return (
            <div className="p-6">
                <ErrorState
                    message={error.message || "Impossible de charger les élèves"}
                    onRetry={() => refetch()}
                />
            </div>
        );
    }

    return <ElevesTable eleves={data} />;
}
```

### Usage Avancé

```typescript
// Personnalisation complète
<ErrorState
    title="Échec de la génération"
    message="Impossible de générer les bulletins. Vérifiez que toutes les notes sont saisies."
    icon={AlertCircle}
    onRetry={() => genererBulletins()}
    retryLabel="Réessayer la génération"
/>

// Sans bouton retry
<ErrorState
    message="Accès non autorisé. Contactez l'administrateur."
/>
```

### Rendu Visuel

```
┌─────────────────────────────────────┐
│                                     │
│       [⚠️ Icône erreur]            │
│                                     │
│    Une erreur est survenue          │
│    Impossible de charger...         │
│                                     │
│       [🔄 Réessayer]                │
│                                     │
└─────────────────────────────────────┘
```

---

## EmptyState

Affiche un état vide avec icône, description et boutons d'action.

### Props

```typescript
interface EmptyStateProps {
    title: string;            // Titre (obligatoire)
    description: string;      // Description (obligatoire)
    icon?: LucideIcon;        // Icône (défaut: FolderOpen)
    actionLabel?: string;     // Label bouton action
    onAction?: () => void;    // Callback action
    onRefresh?: () => void;   // Callback refresh
    className?: string;       // Classes CSS
}
```

### Usage Basique

```typescript
import { EmptyState } from '@/components/feedback';
import { Users } from 'lucide-react';

function ElevesPage() {
    const { data, refetch } = useEleves();
    const navigate = useNavigate();

    const eleves = data?.items || [];
    
    if (eleves.length === 0) {
        return (
            <div className="p-6">
                <EmptyState
                    title="Aucun élève inscrit"
                    description="Commencez par inscrire vos premiers élèves pour gérer leur parcours scolaire"
                    icon={Users}
                    actionLabel="Inscrire un élève"
                    onAction={() => navigate({ to: '/eleves/new' })}
                    onRefresh={() => refetch()}
                />
            </div>
        );
    }

    return <ElevesTable eleves={eleves} />;
}
```

### Rendu Visuel

```
┌─────────────────────────────────────┐
│                                     │
│        [👥 Icône Users]            │
│                                     │
│     Aucun élève inscrit             │
│     Commencez par inscrire...       │
│                                     │
│  [+ Inscrire un élève]  [Actualiser]│
│                                     │
└─────────────────────────────────────┘
```

---

## SmartEmptyState ⭐

**Composant intelligent** qui détecte automatiquement :
- ✅ L'icône appropriée selon le type de ressource
- ✅ Les permissions de création
- ✅ Les messages contextuels (titre, description, label)

### Props

```typescript
interface SmartEmptyStateProps {
    ressource: string;           // Type de ressource (obligatoire)
    title?: string;              // Override titre
    description?: string;        // Override description
    actionLabel?: string;        // Override label
    onAction?: () => void;       // Callback action
    onRefresh?: () => void;      // Callback refresh
    createPermission?: string;   // Override permission
    forceAction?: boolean;       // Forcer affichage bouton
    className?: string;          // Classes CSS
}
```

### Ressources Supportées

| Ressource | Icône | Permission | Titre Auto |
|-----------|-------|------------|------------|
| `eleves` | Users | eleves:create | Aucun élève inscrit |
| `classes` | School | classes:create | Aucune classe configurée |
| `matieres` | BookOpen | matieres:create | Aucune matière configurée |
| `annees-scolaires` | Calendar | annees-scolaires:create | Aucune année scolaire |
| `personnel` | Users | personnel:create | Aucun membre du personnel |
| `finances` | DollarSign | finances:create | Aucune donnée financière |
| `notes` | ClipboardList | notes:create | Aucune note enregistrée |
| `bulletins` | FileText | bulletins:generate | Aucun bulletin généré |
| `salles` | School | salles:create | Aucune salle configurée |
| `cantine` | UtensilsCrossed | cantine:manage | Aucune inscription cantine |
| `transport` | Bus | transport:manage | Aucune inscription transport |
| ... | ... | ... | ... |

**30+ ressources supportées !**

### Usage Basique (Recommandé)

```typescript
import { SmartEmptyState } from '@/components/feedback';

function ElevesPage() {
    const { data, refetch } = useEleves();
    const navigate = useNavigate();

    const eleves = data?.items || [];
    
    if (eleves.length === 0) {
        // ✅ TOUT EST AUTOMATIQUE !
        return (
            <div className="p-6">
                <SmartEmptyState
                    ressource="eleves"
                    onAction={() => navigate({ to: '/eleves/new' })}
                    onRefresh={() => refetch()}
                />
            </div>
        );
    }

    return <ElevesTable eleves={eleves} />;
}
```

**Ce qui se passe automatiquement :**
1. ✅ Icône `Users` sélectionnée
2. ✅ Permission `eleves:create` vérifiée
3. ✅ Titre : "Aucun élève inscrit"
4. ✅ Description : "Commencez par inscrire..."
5. ✅ Label : "Inscrire un élève"
6. ✅ Bouton affiché SI utilisateur a la permission

### Usage avec Override

```typescript
<SmartEmptyState
    ressource="bulletins"
    // Override du titre
    title="Aucun bulletin disponible pour cette classe"
    // Override de la permission
    createPermission="bulletins:generate"
    // Forcer l'affichage du bouton (ignore permissions)
    forceAction={true}
    onAction={() => genererBulletins()}
/>
```

### Usage sans Permission

```typescript
// Utilisateur sans permission 'notes:create'
<SmartEmptyState
    ressource="notes"
    onAction={() => naviguer()}  // ← Bouton NE sera PAS affiché
/>
```

**Rendu sans permission :**
```
┌─────────────────────────────────────┐
│                                     │
│     [📋 Icône ClipboardList]       │
│                                     │
│    Aucune note enregistrée          │
│    Saisissez les notes des...       │
│                                     │
│       [🔄 Actualiser]               │  ← Pas de bouton "Ajouter"
│                                     │
└─────────────────────────────────────┘
```

---

## Patterns Recommandés

### Pattern 1 : Page CRUD Complète

```typescript
import { SmartEmptyState, LoadingState, ErrorState } from '@/components/feedback';

function MaPage() {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['ma-ressource'],
        queryFn: fetchData,
    });
    const navigate = useNavigate();

    // 1. État de chargement
    if (isLoading) {
        return (
            <div className="p-6">
                <LoadingState message="Chargement..." />
            </div>
        );
    }

    // 2. État d'erreur
    if (error) {
        return (
            <div className="p-6">
                <ErrorState
                    message={error.message || "Impossible de charger"}
                    onRetry={() => refetch()}
                />
            </div>
        );
    }

    // 3. État vide
    const items = data?.items || [];
    if (items.length === 0) {
        return (
            <div className="p-6">
                <SmartEmptyState
                    ressource="ma-ressource"
                    onAction={() => navigate({ to: '/ma-ressource/new' })}
                    onRefresh={() => refetch()}
                />
            </div>
        );
    }

    // 4. État normal
    return (
        <div className="p-6">
            <Header />
            <DataTable data={items} />
        </div>
    );
}
```

### Pattern 2 : Avec Vérification de Permission Manuelle

```typescript
import { EmptyState, LoadingState, ErrorState } from '@/components/feedback';
import { usePermissions } from '@/hooks';

function MaPage() {
    const { hasPermission } = usePermissions();
    const { data, isLoading, error, refetch } = useMaRessource();
    const navigate = useNavigate();

    if (isLoading) return <LoadingState message="Chargement..." />;
    if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;

    const items = data?.items || [];
    if (items.length === 0) {
        const peutCreer = hasPermission('ma-ressource:create');
        
        return (
            <EmptyState
                title="Aucun élément"
                description="Commencez par ajouter votre premier élément"
                icon={FolderOpen}
                actionLabel={peutCreer ? "Ajouter" : undefined}
                onAction={peutCreer ? () => navigate({ to: '/new' }) : undefined}
                onRefresh={() => refetch()}
            />
        );
    }

    return <DataTable data={items} />;
}
```

---

## Intégration avec DataTable

### Option 1 : EmptyState en amont (Recommandé)

```typescript
function MaPage() {
    const { data } = useQuery(...);
    const items = data?.items || [];

    // Afficher EmptyState AVANT DataTable si vide
    if (items.length === 0) {
        return <SmartEmptyState ressource="eleves" onAction={handleCreate} />;
    }

    // Sinon afficher DataTable
    return <DataTable data={items} />;
}
```

### Option 2 : EmptyMessage dans DataTable

```typescript
<DataTable
    data={items}
    columns={colonnes}
    emptyMessage="Aucun élève trouvé"  // Message simple
/>
```

**Quand utiliser chaque approche :**

| Approche | Quand utiliser | Avantages |
|----------|----------------|-----------|
| **EmptyState en amont** | Liste complètement vide | Actions, icônes, boutons |
| **emptyMessage DataTable** | Résultats de filtre vides | Simple, intégré |

---

## Exemples Concrets

### Exemple 1 : Page Élèves

```typescript
import { SmartEmptyState, LoadingState, ErrorState } from '@/components/feedback';

export function ElevesPage() {
    const { data, isLoading, error, refetch } = useEleves();
    const navigate = useNavigate();

    if (isLoading) {
        return <LoadingState message="Chargement des élèves..." />;
    }

    if (error) {
        return (
            <ErrorState
                message={error.message || "Impossible de charger les élèves"}
                onRetry={() => refetch()}
            />
        );
    }

    const eleves = data?.items || [];
    
    if (eleves.length === 0) {
        return (
            <SmartEmptyState
                ressource="eleves"
                onAction={() => navigate({ to: '/eleves/new' })}
                onRefresh={() => refetch()}
            />
        );
    }

    return <ElevesTable eleves={eleves} />;
}
```

### Exemple 2 : Page Notes (avec filtre)

```typescript
export function NotesPage() {
    const { data, isLoading, error, refetch } = useNotes(filtres);
    const navigate = useNavigate();

    if (isLoading) {
        return <LoadingState message="Chargement des notes..." />;
    }

    if (error) {
        return <ErrorState message={error.message} onRetry={() => refetch()} />;
    }

    const notes = data?.items || [];
    
    if (notes.length === 0) {
        // SmartEmptyState détecte automatiquement :
        // - Icône ClipboardList
        // - Permission notes:create
        // - Messages contextuels
        return (
            <SmartEmptyState
                ressource="notes"
                onAction={() => navigate({ to: '/notes/saisie' })}
                onRefresh={() => refetch()}
            />
        );
    }

    return <NotesTable notes={notes} />;
}
```

### Exemple 3 : Page Bulletins (permission spéciale)

```typescript
export function BulletinsPage() {
    const { data, isLoading, error, refetch } = useBulletins();

    if (isLoading) {
        return <LoadingState message="Chargement des bulletins..." />;
    }

    if (error) {
        return <ErrorState message={error.message} onRetry={() => refetch()} />;
    }

    const bulletins = data?.items || [];
    
    if (bulletins.length === 0) {
        return (
            <SmartEmptyState
                ressource="bulletins"
                // Override : permission spéciale pour générer
                createPermission="bulletins:generate"
                onAction={() => genererBulletins()}
                onRefresh={() => refetch()}
            />
        );
    }

    return <BulletinsList bulletins={bulletins} />;
}
```

---

## Bonnes Pratiques

### ✅ À FAIRE

1. **Toujours gérer les 3 états** : loading, error, empty
2. **Utiliser SmartEmptyState** pour les pages CRUD (réduit le code de 60%)
3. **Messages contextuels** : adapter le message au type de ressource
4. **Bouton retry** : toujours proposer un retry sur erreur
5. **Vérifier les permissions** : SmartEmptyState le fait automatiquement

### ❌ À ÉVITER

1. **Ne pas laisser de page blanche** sans feedback
2. **Ne pas utiliser alert()** pour les erreurs
3. **Ne pas masquer les erreurs** sans message
4. **Ne pas afficher le bouton d'action** si pas de permission
5. **Ne pas utiliser de spinners** pour les états vides

### Performance

```typescript
// ✅ CORRECT - SmartEmptyState est léger
<SmartEmptyState ressource="eleves" onAction={handleCreate} />

// ❌ INCORRECT - Recréer le composant à chaque render
const emptyState = <EmptyState title="..." description="..." icon={Users} ... />;
```

### Accessibilité

Tous les composants sont :
- ✅ Compatibles clavier (boutons focusables)
- ✅ ARIA labels automatiques
- ✅ Contraste WCAG AA respecté
- ✅ Support screen readers

---

## Migration depuis Anciens Composants

### Avant (PageSkeleton + ErrorMessage)

```typescript
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

if (isLoading) return <PageSkeleton showStats showTable />;
if (error) return <ErrorMessage title="Erreur" message={error.message} />;
```

### Après (Composants modernes)

```typescript
import { LoadingState, ErrorState } from '@/components/feedback';

if (isLoading) {
    return (
        <div className="p-6">
            <LoadingState message="Chargement..." />
        </div>
    );
}
if (error) {
    return (
        <div className="p-6">
            <ErrorState
                message={error.message}
                onRetry={() => refetch()}
            />
        </div>
    );
}
```

---

## Ressources

- **Code source :** `frontend/src/components/feedback/`
- **Exemples :** Pages élèves, classes, notes, finances, bulletins
- **Documentation complète :** `SYNTHESE-FINALE-AMELIORATIONS-UX.md`
- **Support :** Contacter l'équipe de développement

---

**Dernière mise à jour :** 15 Juin 2026  
**Version des composants :** 1.0.0  
**Mainteneur :** franck arlos chendjou
