# Guide de Développement Frontend - eLISAschool

## 📋 Table des Matières

1. [Architecture Générale](#architecture-générale)
2. [Structure d'un Module](#structure-dun-module)
3. [Pattern CRUD Complet](#pattern-crud-complet)
4. [Hooks TanStack Query](#hooks-tanstack-query)
5. [Composants UI Standards](#composants-ui-standards)
6. [Protection RBAC](#protection-rbac)
7. [Bonnes Pratiques](#bonnes-pratiques)
8. [Exemples de Code](#exemples-de-code)

---

## Architecture Générale

### Stack Technique
- **Framework** : React 18+ avec TypeScript strict
- **Routage** : TanStack Router (file-based routing)
- **State Management** : TanStack Query (React Query)
- **Styling** : Tailwind CSS avec variables CSS personnalisées
- **Animations** : Framer Motion
- **Icônes** : Lucide React
- **Validation** : Zod (backend) + validation client-side

### Organisation des Fichiers
```
frontend/src/
├── app/
│   └── routes/                    # Routes TanStack Router
│       ├── _auth.tsx              # Layout authentifié
│       ├── _auth.cycles.tsx       # Route module
│       └── ...
├── features/
│   ├── cycles/                    # Module feature
│   │   ├── types/
│   │   │   └── cycle.types.ts
│   │   ├── hooks/
│   │   │   └── use-cycles.ts
│   │   ├── components/
│   │   │   ├── cycles-page.tsx
│   │   │   └── cycle-form-modal.tsx
│   │   └── index.ts
│   └── ...
├── components/
│   └── ui/                        # Composants réutilisables
│       ├── DataTable.tsx
│       ├── ElisaButton.tsx
│       └── ...
└── lib/
    └── api-client.ts              # Client API configuré
```

---

## Structure d'un Module

Chaque module suit **exactement** cette structure :

```
feature/
├── types/
│   └── xxx.types.ts              # Interfaces TypeScript
├── hooks/
│   └── use-xxx.ts                # Hooks TanStack Query
├── components/
│   ├── xxx-page.tsx              # Page principale
│   └── xxx-form-modal.tsx        # Modal formulaire CRUD
└── index.ts                       # Barrel exports
```

### 1. Types (`xxx.types.ts`)

```typescript
// Entité principale
export interface Xxx {
    id: string;
    nom: string;
    code?: string;
    statut?: 'actif' | 'inactif';
    createdAt: string;
    updatedAt: string;
}

// DTO Création
export interface CreerXxxDto {
    nom: string;
    code?: string;
    statut?: string;
}

// DTO Modification
export interface ModifierXxxDto extends Partial<CreerXxxDto> {
    id: string;
}

// Filtres pour la liste
export interface XxxFiltres {
    page?: number;
    limit?: number;
    recherche?: string;
    statut?: string;
}
```

### 2. Hooks (`use-xxx.ts`)

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';
import type { Xxx, CreerXxxDto, ModifierXxxDto, XxxFiltres } from '../types/xxx.types';

const XXX_KEYS = {
    all: ['xxx'] as const,
    lists: () => [...XXX_KEYS.all, 'list'] as const,
    list: (filtres: XxxFiltres) => [...XXX_KEYS.lists(), filtres] as const,
    details: () => [...XXX_KEYS.all, 'detail'] as const,
    detail: (id: string) => [...XXX_KEYS.details(), id] as const,
};

// Hook liste avec pagination
export function useXxx(filtres: XxxFiltres = {}) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: XXX_KEYS.list(filtres),
        queryFn: async () => {
            const response = await apiClient.get<{
                data: Xxx[];
                meta: {
                    totalItems: number;
                    currentPage: number;
                    totalPages: number;
                    itemsPerPage: number;
                };
            }>('/api/xxx', { params: filtres });

            if (!response.data) {
                throw new Error('Données non disponibles');
            }

            return response.data;
        },
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
    });
}

// Hook détail
export function useXxxDetail(id: string) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: XXX_KEYS.detail(id),
        queryFn: async () => {
            const response = await apiClient.get<Xxx>(`/api/xxx/${id}`);
            if (!response.data) throw new Error('Non trouvé');
            return response.data;
        },
        enabled: !!id && isAuthenticated,
        staleTime: 10 * 60 * 1000,
    });
}

// Hook création
export function useCreerXxx() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (dto: CreerXxxDto) => {
            const response = await apiClient.post<Xxx>('/api/xxx', dto);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: XXX_KEYS.lists() });
        },
    });
}

// Hook modification
export function useModifierXxx() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...dto }: ModifierXxxDto) => {
            const response = await apiClient.patch<Xxx>(`/api/xxx/${id}`, dto);
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: XXX_KEYS.lists() });
            queryClient.invalidateQueries({ queryKey: XXX_KEYS.detail(variables.id) });
        },
    });
}

// Hook suppression
export function useSupprimerXxx() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/xxx/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: XXX_KEYS.lists() });
        },
    });
}
```

### 3. Route (`_auth.xxx.tsx`)

```typescript
import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { XxxPage } from '@/features/xxx/components/xxx-page';

export const Route = createFileRoute('/_auth/xxx')({
    beforeLoad: () => requireModulePermission('xxx'),
    component: XxxPage,
});
```

---

## Pattern CRUD Complet

### Page Principale (`xxx-page.tsx`)

```typescript
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react';
import { useXxx, useSupprimerXxx, useCreerXxx, useModifierXxx } from '../hooks/use-xxx';
import { DataTable } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { usePermissions } from '@/hooks';
import type { Xxx, XxxFiltres } from '../types/xxx.types';
import type { Column } from '@/components/ui/DataTable';

export function XxxPage() {
    const { hasPermission } = usePermissions();
    const [filtres, setFiltres] = useState<XxxFiltres>({ page: 1, limit: 20, recherche: '' });
    const [showFormModal, setShowFormModal] = useState(false);
    const [itemToEdit, setItemToEdit] = useState<Xxx | null>(null);
    const [itemToDelete, setItemToDelete] = useState<Xxx | null>(null);

    const { data, isLoading } = useXxx(filtres);
    const supprimer = useSupprimerXxx();

    // Colonnes du tableau
    const colonnes: Column<Xxx>[] = [
        {
            key: 'nom',
            header: 'Nom',
            sortable: true,
            render: (item) => <span className="font-semibold">{item.nom}</span>,
        },
        {
            key: 'statut',
            header: 'Statut',
            className: 'text-center',
            render: (item) => (
                <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                    item.statut === 'actif' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                    {item.statut === 'actif' ? 'Actif' : 'Inactif'}
                </span>
            ),
        },
        {
            key: 'actions',
            header: 'Actions',
            className: 'text-right',
            render: (item) => (
                <div className="flex justify-end gap-1">
                    {/* Voir détails */}
                    <button
                        onClick={() => {/* navigation ou modal */}}
                        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Voir détails"
                    >
                        <Eye className="h-4 w-4" />
                    </button>
                    
                    {/* Modifier */}
                    {hasPermission('xxx:edit') && (
                        <button
                            onClick={() => {
                                setItemToEdit(item);
                                setShowFormModal(true);
                            }}
                            className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                            title="Modifier"
                        >
                            <Edit className="h-4 w-4" />
                        </button>
                    )}
                    
                    {/* Supprimer */}
                    {hasPermission('xxx:delete') && (
                        <button
                            onClick={() => setItemToDelete(item)}
                            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                            title="Supprimer"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    )}
                </div>
            ),
        },
    ];

    return (
        <div className="flex flex-col gap-6 p-6">
            {/* Header */}
            <motion.div 
                className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }}
            >
                <div>
                    <h1 className="text-3xl font-bold">Xxx</h1>
                    <p className="text-sm text-gray-600">{data?.meta?.totalItems || 0} élément(s)</p>
                </div>
                {hasPermission('xxx:create') && (
                    <ElisaButton
                        variant="primary"
                        size="sm"
                        icon={<Plus className="h-4 w-4" />}
                        onClick={() => {
                            setItemToEdit(null);
                            setShowFormModal(true);
                        }}
                    >
                        Nouveau
                    </ElisaButton>
                )}
            </motion.div>

            {/* Recherche */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Rechercher..."
                    value={filtres.recherche || ''}
                    onChange={(e) => setFiltres({ ...filtres, recherche: e.target.value })}
                    className="w-full sm:w-80 pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--color-dominant-500)]"
                />
            </div>

            {/* Tableau */}
            <DataTable
                data={data?.data || []}
                columns={colonnes}
                isLoading={isLoading}
                pagination={data?.meta}
                onPageChange={(page) => setFiltres({ ...filtres, page })}
                onLimitChange={(limit) => setFiltres({ ...filtres, limit })}
            />

            {/* Modal formulaire */}
            {showFormModal && (
                <XxxFormModal
                    item={itemToEdit}
                    onClose={() => {
                        setShowFormModal(false);
                        setItemToEdit(null);
                    }}
                />
            )}

            {/* Dialog confirmation suppression */}
            {itemToDelete && (
                <ConfirmDialog
                    title="Supprimer"
                    message={`Êtes-vous sûr de vouloir supprimer "${itemToDelete.nom}" ?`}
                    onConfirm={async () => {
                        await supprimer.mutateAsync(itemToDelete.id);
                        setItemToDelete(null);
                    }}
                    onCancel={() => setItemToDelete(null)}
                />
            )}
        </div>
    );
}
```

### Modal Formulaire (`xxx-form-modal.tsx`)

```typescript
import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useCreerXxx, useModifierXxx } from '../hooks/use-xxx';
import type { Xxx } from '../types/xxx.types';

export function XxxFormModal({ item, onClose }: { item: Xxx | null; onClose: () => void }) {
    const creer = useCreerXxx();
    const modifier = useModifierXxx();
    const isEditMode = !!item;

    const [nom, setNom] = useState(item?.nom || '');
    const [code, setCode] = useState(item?.code || '');
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Auto-générer le code
    useEffect(() => {
        if (!isEditMode && nom && !code) {
            const generatedCode = nom
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')  // Supprime accents
                .replace(/[^a-z0-9]+/g, '_')      // Remplace espaces par _
                .replace(/^_|_$/g, '');           // Trim underscores
            setCode(generatedCode);
        }
    }, [nom, code, isEditMode]);

    // Validation
    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!nom.trim()) newErrors.nom = 'Le nom est requis';
        if (!code.trim()) newErrors.code = 'Le code est requis';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Soumission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        const dto = { nom, code };

        try {
            if (isEditMode && item) {
                await modifier.mutateAsync({ id: item.id, ...dto });
            } else {
                await creer.mutateAsync(dto);
            }
            onClose();
        } catch (error) {
            // Erreur déjà gérée par le hook (toast)
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-2xl font-bold">
                        {isEditMode ? 'Modifier' : 'Créer'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <AlertTriangle className="h-6 w-6" />
                    </button>
                </div>

                {/* Formulaire */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                        <input
                            type="text"
                            value={nom}
                            onChange={(e) => setNom(e.target.value)}
                            className={`w-full px-4 py-2 rounded-lg border ${errors.nom ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-[var(--color-dominant-500)]`}
                            placeholder="Nom..."
                        />
                        {errors.nom && <p className="text-red-600 text-xs mt-1">{errors.nom}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                            className={`w-full px-4 py-2 rounded-lg border ${errors.code ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-[var(--color-dominant-500)]`}
                            placeholder="code_snake_case"
                        />
                        {errors.code && <p className="text-red-600 text-xs mt-1">{errors.code}</p>}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 justify-end pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={creer.isPending || modifier.isPending}
                            className="px-4 py-2 rounded-lg bg-[var(--color-dominant-600)] text-white hover:bg-[var(--color-dominant-700)] disabled:opacity-50"
                        >
                            {creer.isPending || modifier.isPending ? 'Enregistrement...' : (isEditMode ? 'Enregistrer' : 'Créer')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
```

---

## Hooks TanStack Query

### Configuration des Keys

```typescript
const XXX_KEYS = {
    all: ['xxx'] as const,                          // ['xxx']
    lists: () => [...XXX_KEYS.all, 'list'] as const, // ['xxx', 'list']
    list: (filtres) => [...XXX_KEYS.lists(), filtres], // ['xxx', 'list', {page: 1}]
    details: () => [...XXX_KEYS.all, 'detail'] as const, // ['xxx', 'detail']
    detail: (id) => [...XXX_KEYS.details(), id],    // ['xxx', 'detail', 'uuid']
};
```

### TTL Recommandés

| Type de donnée | staleTime | gcTime |
|----------------|-----------|--------|
| Listes | 5 min | 10 min |
| Détails | 10 min | 20 min |
| Références (cycles, niveaux) | 30 min | 1 heure |
| Statistiques | 2 min | 5 min |

### Invalidation

```typescript
// Après création
onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: XXX_KEYS.lists() });
}

// Après modification
onSuccess: (_, variables) => {
    queryClient.invalidateQueries({ queryKey: XXX_KEYS.lists() });
    queryClient.invalidateQueries({ queryKey: XXX_KEYS.detail(variables.id) });
}

// Après suppression
onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: XXX_KEYS.lists() });
}
```

---

## Composants UI Standards

### Boutons d'Actions

```typescript
<div className="flex justify-end gap-1">
    {/* Voir - Bleu */}
    <button className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors">
        <Eye className="h-4 w-4" />
    </button>
    
    {/* Modifier - Gris */}
    <button className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
        <Edit className="h-4 w-4" />
    </button>
    
    {/* Supprimer - Rouge */}
    <button className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors">
        <Trash2 className="h-4 w-4" />
    </button>
    
    {/* Activer - Vert */}
    <button className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors">
        <Power className="h-4 w-4" />
    </button>
</div>
```

### Badges de Statut

```typescript
<span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
    statut === 'actif' ? 'bg-green-100 text-green-800' :
    statut === 'inactif' ? 'bg-gray-100 text-gray-800' :
    statut === 'en_attente' ? 'bg-yellow-100 text-yellow-800' :
    'bg-red-100 text-red-800'
}`}>
    {label}
</span>
```

---

## Protection RBAC

### 1. Niveau Route

```typescript
export const Route = createFileRoute('/_auth/xxx')({
    beforeLoad: () => requireModulePermission('xxx'),
    component: XxxPage,
});
```

### 2. Niveau UI

```typescript
const { hasPermission } = usePermissions();

// Affichage conditionnel
{hasPermission('xxx:create') && <BoutonCreer />}
{hasPermission('xxx:edit') && <BoutonModifier />}
{hasPermission('xxx:delete') && <BoutonSupprimer />}
```

### 3. Niveau Backend

Middleware Express sur chaque endpoint :
```typescript
router.post('/xxx', requirePermission('xxx:create'), handler);
router.patch('/xxx/:id', requirePermission('xxx:edit'), handler);
router.delete('/xxx/:id', requirePermission('xxx:delete'), handler);
```

---

## Bonnes Pratiques

### ✅ À FAIRE

1. **Toujours utiliser les types TypeScript**
2. **Valider les formulaires côté client**
3. **Gérer les états de loading et erreur**
4. **Invalider le cache après mutations**
5. **Utiliser les hooks TanStack Query**
6. **Protéger les routes et actions avec RBAC**
7. **Auto-générer les codes normalisés**
8. **Utiliser les composants UI réutilisables**
9. **Ajouter des tooltips sur les boutons**
10. **Confirmer avant suppression**

### ❌ À ÉVITER

1. **Pas de `any`** (utiliser TypeScript strict)
2. **Pas de requêtes API directes** (toujours via hooks)
3. **Pas de duplication de logique** (extraire en hooks/utils)
4. **Pas de `res.status(500)` dans le controller** (utiliser errorHandler)
5. **Pas de secrets dans le code** (utiliser .env)
6. **Pas de bypass des guards RBAC**
7. **Pas de catch silencieux d'erreurs**
8. **Pas de select * en production** (colonnes spécifiques)
9. **Pas de requêtes sans pagination**
10. **Pas d'import direct depuis sous-dossier** (utiliser barrel exports)

---

## Exemples de Code

### Recherche avec Filtrage

```typescript
const [filtres, setFiltres] = useState<XxxFiltres>({ 
    page: 1, 
    limit: 20, 
    recherche: '',
    statut: 'actif'
});

// Recherche
<input
    value={filtres.recherche || ''}
    onChange={(e) => setFiltres({ ...filtres, recherche: e.target.value })}
/>

// Filtre statut
<select
    value={filtres.statut}
    onChange={(e) => setFiltres({ ...filtres, statut: e.target.value })}
>
    <option value="">Tous</option>
    <option value="actif">Actif</option>
    <option value="inactif">Inactif</option>
</select>
```

### Auto-génération de Code

```typescript
useEffect(() => {
    if (!isEditMode && nom && !code) {
        const generatedCode = nom
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')  // Supprime accents
            .replace(/[^a-z0-9]+/g, '_')      // Espaces → underscore
            .replace(/^_|_$/g, '');           // Trim
        setCode(generatedCode);
    }
}, [nom, code, isEditMode]);
```

### Validation Email

```typescript
const validate = () => {
    const errors: Record<string, string> = {};
    
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.email = 'Email invalide';
    }
    
    setErrors(errors);
    return Object.keys(errors).length === 0;
};
```

---

## Modules Implémentés

| Module | Route | Statut |
|--------|-------|--------|
| Établissements | `/etablissements` | ✅ 100% |
| Cycles | `/cycles` | ✅ 100% |
| Niveaux | `/niveaux` | ✅ 100% |
| Classes | `/classes` | ✅ 100% |
| Années Scolaires | `/annees-scolaires` | ✅ 100% |
| Matières | `/matieres` | ✅ 100% |
| Personnel | `/personnel` | ✅ 100% |
| Rôles | `/admin/roles` | ✅ 100% |

---

## Ressources

- [Documentation TanStack Router](https://tanstack.com/router/latest)
- [Documentation TanStack Query](https://tanstack.com/query/latest)
- [Documentation Framer Motion](https://www.framer.com/motion/)
- [Documentation Lucide Icons](https://lucide.dev/)
- [Conventions eLISAschool](.qoder/rules/elisaschool-conventions.md)

---

**Dernière mise à jour** : Juin 2026  
**Version** : 1.0.0
