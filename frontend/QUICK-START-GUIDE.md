# 🚀 Guide de Développement Rapide des Modules

## Template pour Créer un Nouveau Module

Ce guide vous permet de créer rapidement les 40 modules restants en suivant le pattern du module Élèves.

---

## 📋 Étapes de Création

### Étape 1 : Créer la Structure

```bash
# Remplacer <module> par le nom du module (ex: classes, personnel, matieres)
mkdir -p src/features/<module>/{components,hooks,types}
```

### Étape 2 : Créer les Types

**Fichier :** `src/features/<module>/types/<module>.types.ts`

```typescript
/**
 * ==================================
 * eLISAschool - Types <Module>
 * ==================================
 */

export interface <Module>Entity {
    id: string;
    // Ajouter les champs spécifiques
    createdAt: string;
    updatedAt: string;
}

export interface Creer<Module>Dto {
    // Champs requis pour la création
}

export interface Modifier<Module>Dto extends Partial<Creer<Module>Dto> {
    id: string;
}

export interface <Module>Filtres {
    recherche?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    // Ajouter les filtres spécifiques
}
```

### Étape 3 : Créer les Hooks

**Fichier :** `src/features/<module>/hooks/use-<module>.ts`

```typescript
/**
 * ==================================
 * eLISAschool - Hook <Module>
 * ==================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { <Module>Entity, Creer<Module>Dto, Modifier<Module>Dto, <Module>Filtres } from '../types/<module>.types';
import { toast } from 'sonner';

const <MODULE>_KEYS = {
    all: ['<module>'] as const,
    listes: () => [...<MODULE>_KEYS.all, 'liste'] as const,
    liste: (filtres: <Module>Filtres) => [...<MODULE>_KEYS.listes(), filtres] as const,
    details: () => [...<MODULE>_KEYS.all, 'detail'] as const,
    detail: (id: string) => [...<MODULE>_KEYS.details(), id] as const,
};

// QUERIES
export function use<Modules>(filtres: <Module>Filtres = {}) {
    return useQuery({
        queryKey: <MODULE>_KEYS.liste(filtres),
        queryFn: async () => {
            const response = await apiClient.getPaginated<<Module>Entity>('/api/<module>', {
                page: filtres.page || 1,
                limit: filtres.limit || 20,
                sortBy: filtres.sortBy,
                sortOrder: filtres.sortOrder,
                ...filtres,
            });
            return response.data;
        },
        staleTime: 5 * 60 * 1000,
    });
}

export function use<Module>(id: string) {
    return useQuery({
        queryKey: <MODULE>_KEYS.detail(id),
        queryFn: async () => {
            const response = await apiClient.get<{ data: <Module>Entity }>(`/api/<module>/${id}`);
            return response.data;
        },
        enabled: !!id,
    });
}

// MUTATIONS
export function useCreer<Module>() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (dto: Creer<Module>Dto) => {
            const response = await apiClient.post<{ data: <Module>Entity }>(`/api/<module>`, dto);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: <MODULE>_KEYS.listes() });
            toast.success('Créé avec succès');
        },
        onError: (error: any) => toast.error(error?.message || 'Erreur'),
    });
}

export function useModifier<Module>() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (dto: Modifier<Module>Dto) => {
            const { id, ...data } = dto;
            const response = await apiClient.patch<{ data: <Module>Entity }>(`/api/<module>/${id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: <MODULE>_KEYS.listes() });
            toast.success('Modifié avec succès');
        },
        onError: (error: any) => toast.error(error?.message || 'Erreur'),
    });
}

export function useSupprimer<Module>() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/<module>/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: <MODULE>_KEYS.listes() });
            toast.success('Supprimé avec succès');
        },
        onError: (error: any) => toast.error(error?.message || 'Erreur'),
    });
}
```

### Étape 4 : Créer le Composant Page

**Fichier :** `src/features/<module>/components/<module>-page.tsx`

```typescript
/**
 * ==================================
 * eLISAschool - Page <Module>
 * ==================================
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Plus, Search } from 'lucide-react';
import { use<Modules>, useSupprimer<Module> } from '../hooks/use-<module>';
import { DataTable } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { usePermissions } from '@/hooks';
import type { <Module>Entity, <Module>Filtres } from '../types/<module>.types';
import type { Column } from '@/components/ui/DataTable';

export function <Module>Page() {
    const { t } = useTranslation();
    const { hasPermission } = usePermissions();
    const [filtres, setFiltres] = useState<<Module>Filtres>({ page: 1, limit: 20 });

    const { data, isLoading } = use<Modules>(filtres);
    const supprimer = useSupprimer<Module>();

    const colonnes: Column<<Module>Entity>[] = [
        {
            key: 'id',
            header: 'ID',
            sortable: true,
        },
        // Ajouter les colonnes spécifiques
        {
            key: 'actions',
            header: t('commun.actions'),
            render: (item) => (
                <div className="flex gap-2">
                    {hasPermission('<module>:edit') && (
                        <ElisaButton variante="ghost" taille="xs">
                            {t('boutons.modifier')}
                        </ElisaButton>
                    )}
                    {hasPermission('<module>:delete') && (
                        <ElisaButton
                            variante="danger"
                            taille="xs"
                            onClick={() => supprimer.mutateAsync(item.id)}
                        >
                            {t('boutons.supprimer')}
                        </ElisaButton>
                    )}
                </div>
            ),
        },
    ];

    return (
        <div className="flex flex-col gap-6 p-6">
            <motion.div
                className="flex justify-between"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div>
                    <h1 className="text-3xl font-bold">{t('<module>.titre', { defaultValue: '<Module>' })}</h1>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                        {data?.pagination?.total || 0} élément(s)
                    </p>
                </div>
                {hasPermission('<module>:create') && (
                    <ElisaButton
                        variante="primary"
                        taille="sm"
                        icone={<Plus className="h-4 w-4" />}
                    >
                        {t('boutons.nouveau')}
                    </ElisaButton>
                )}
            </motion.div>

            <DataTable
                data={data?.data || []}
                columns={colonnes}
                isLoading={isLoading}
                pagination={data?.pagination}
                onPageChange={(page) => setFiltres((prev) => ({ ...prev, page }))}
                onLimitChange={(limit) => setFiltres((prev) => ({ ...prev, limit, page: 1 }))}
            />
        </div>
    );
}
```

### Étape 5 : Créer la Route

**Fichier :** `src/app/routes/_auth.<module>.tsx`

```typescript
/**
 * ==================================
 * eLISAschool - Route <Module>
 * ==================================
 */

import { createFileRoute } from '@tanstack/react-router';
import { <Module>Page } from '@/features/<module>/components/<module>-page';

export const Route = createFileRoute('/_auth/<module>')({
    component: <Module>Page,
});
```

### Étape 6 : Créer le Barrel Export

**Fichier :** `src/features/<module>/index.ts`

```typescript
/**
 * ==================================
 * eLISAschool - Module <Module>
 * ==================================
 */

export * from './types/<module>.types';
export * from './hooks/use-<module>';
export { <Module>Page } from './components/<module>-page';
```

---

## 🎯 Checklist par Module

Pour chaque module, cocher :

- [ ] Structure de dossiers créée
- [ ] Types TypeScript définis
- [ ] Hooks TanStack Query créés (3 queries minimum + 3 mutations)
- [ ] Composant page implémenté
- [ ] Route TanStack Router configurée
- [ ] Barrel export créé
- [ ] Fichiers de traduction FR/EN ajoutés
- [ ] Permissions RBAC vérifiées
- [ ] Test manuel effectué

---

## 📝 Modules Prioritaires à Créer

### Priorité 1 - Critiques (à faire maintenant)

1. **classes** - Essentiel pour les élèves
2. **personnel** - Similaire à élèves
3. **matieres** - Simple
4. **annees-scolaires** - Configuration
5. **notes** - Complexe (relations)
6. **bulletins** - Génération PDF
7. **utilisateurs** - RBAC avancé
8. **periodes** - Configuration

### Priorité 2 - Importants

9. finances
10. cantine
11. transport
12. messagerie
13. annonces
14. notifications
15. etablissement
16. organisation

---

## 💡 Astuces

### 1. Copier-Coller Intelligent

```bash
# Dupliquer le module élèves comme template
cp -r src/features/eleves src/features/classes

# Remplacer tous les "eleve" par "classe"
find src/features/classes -type f -exec sed -i 's/eleve/classe/g' {} +
find src/features/classes -type f -exec sed -i 's/Eleve/Classe/g' {} +
find src/features/classes -type f -exec sed -i 's/ELEVE/CLASSE/g' {} +

# Renommer les fichiers
mv src/features/classes/hooks/use-eleves.ts src/features/classes/hooks/use-classes.ts
mv src/features/classes/types/eleve.types.ts src/features/classes/types/classe.types.ts
mv src/features/classes/components/eleves-page.tsx src/features/classes/components/classes-page.tsx
```

### 2. Générer les Routes

Après avoir créé toutes les routes :

```bash
cd frontend
npx @tanstack/router-cli generate
```

### 3. Vérifier les Types

```bash
npx tsc --noEmit
```

---

## 🔧 Scripts Utiles

### Générer un Module Automatiquement

Créer un script `scripts/generate-module.sh` :

```bash
#!/bin/bash

MODULE=$1

if [ -z "$MODULE" ]; then
    echo "Usage: ./generate-module.sh <module-name>"
    exit 1
fi

echo "🚀 Génération du module: $MODULE"

# Créer la structure
mkdir -p src/features/$MODULE/{components,hooks,types}

# Copier les templates
# ... (voir template ci-dessus)

echo "✅ Module $MODULE généré !"
```

---

## 📊 Progression

Suivre l'avancement dans `DEVELOPMENT-STATUS.md`

---

**Dernière mise à jour** : 11 Juin 2025  
**Auteur** : franck arlos chendjou
