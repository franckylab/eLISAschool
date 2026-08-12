/**
 * ==================================
 * eLISAschool - Hook useParametresPlatforme
 * ==================================
 * Hook générique pour la gestion des paramètres plateforme
 * avec suivi des modifications, bulk save (PUT /parametres/bulk),
 * et reset des changements locaux.
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import type {
    ParametreSysteme,
    CategorieParametre,
    UpdateParametreBulkItem,
} from '@/features/configuration/types/configuration.types';

const PLATFORM_CONFIG_KEYS = {
    all: ['platform', 'configuration'] as const,
    params: () => [...PLATFORM_CONFIG_KEYS.all, 'params'] as const,
    paramsByCategorie: (categorie: CategorieParametre) =>
        [...PLATFORM_CONFIG_KEYS.params(), categorie] as const,
};

/**
 * Charge les paramètres d'une catégorie et permet l'édition + bulk save.
 * Si categorie est null, la query est désactivée (lazy loading).
 */
export function useParametresPlatforme(categorie: CategorieParametre | null) {
    const queryClient = useQueryClient();

    // Valeurs actuelles (éditées)
    const [editValues, setEditValues] = useState<Record<string, any>>({});
    // Valeurs originales (depuis l'API)
    const [originalValues, setOriginalValues] = useState<Record<string, any>>({});
    // Champs modifiés
    const [dirtyFields, setDirtyFields] = useState<Set<string>>(new Set());

    // Query : charger les paramètres de la catégorie (désactivée si categorie est null)
    const { data: parametres, isLoading, isError } = useQuery({
        queryKey: PLATFORM_CONFIG_KEYS.paramsByCategorie(categorie as CategorieParametre),
        queryFn: async () => {
            if (!categorie) return [];
            const response = await apiClient.get<{ success: boolean; data: ParametreSysteme[] }>(
                `/api/platform/configuration/parametres/categorie/${categorie}`
            );
            return response.data?.data ?? response.data ?? [];
        },
        enabled: !!categorie,
        staleTime: 5 * 60 * 1000,
    });

    // Synchroniser les valeurs quand les données arrivent
    useEffect(() => {
        if (parametres && parametres.length > 0) {
            const values: Record<string, any> = {};
            for (const param of parametres) {
                values[param.cle] = parseValeur(param.valeur, param.typeValeur);
            }
            setEditValues(values);
            setOriginalValues({ ...values });
            setDirtyFields(new Set());
        }
    }, [parametres]);

    // Mutation : bulk save (PUT /parametres/bulk)
    const bulkSaveMutation = useMutation({
        mutationFn: async (items: UpdateParametreBulkItem[]) => {
            const response = await apiClient.put<{ success: boolean; data: { updated: number } }>(
                '/api/platform/configuration/parametres/bulk',
                { parametres: items }
            );
            return response.data;
        },
        onSuccess: (data) => {
            toast.success(`${data?.data?.updated ?? dirtyFields.size} paramètre(s) enregistré(s)`);
            queryClient.invalidateQueries({ queryKey: PLATFORM_CONFIG_KEYS.params() });
            // Après succès, les originales deviennent les actuelles
            setOriginalValues({ ...editValues });
            setDirtyFields(new Set());
        },
        onError: () => {
            toast.error('Erreur lors de l\'enregistrement des paramètres');
        },
    });

    // Mutation : reset catégorie (reseed)
    const resetCategorieMutation = useMutation({
        mutationFn: async () => {
            await apiClient.post(
                `/api/platform/configuration/parametres/reset-categorie/${categorie}`
            );
        },
        onSuccess: () => {
            toast.success('Catégorie réinitialisée aux valeurs par défaut');
            queryClient.invalidateQueries({ queryKey: PLATFORM_CONFIG_KEYS.paramsByCategorie(categorie) });
        },
        onError: () => {
            toast.error('Erreur lors de la réinitialisation');
        },
    });

    // Mettre à jour une valeur
    const updateValue = useCallback((cle: string, valeur: any) => {
        setEditValues(prev => ({ ...prev, [cle]: valeur }));
        setDirtyFields(prev => {
            const next = new Set(prev);
            // Comparer avec l'original pour retirer du dirty si revenu à l'identique
            if (valeur === originalValues[cle]) {
                next.delete(cle);
            } else {
                next.add(cle);
            }
            return next;
        });
    }, [originalValues]);

    // Sauvegarder tous les changements (bulk)
    const saveAll = useCallback(async () => {
        if (dirtyFields.size === 0) return;

        const items: UpdateParametreBulkItem[] = Array.from(dirtyFields).map(cle => {
            const param = parametres?.find(p => p.cle === cle);
            const typeValeur = param?.typeValeur || 'STRING';
            return {
                cle,
                valeur: serializeValeur(editValues[cle], typeValeur),
            };
        });

        await bulkSaveMutation.mutateAsync(items);
    }, [dirtyFields, editValues, parametres, bulkSaveMutation]);

    // Réinitialiser les changements locaux
    const resetChanges = useCallback(() => {
        setEditValues({ ...originalValues });
        setDirtyFields(new Set());
    }, [originalValues]);

    // Réinitialiser la catégorie entière (reseed DB)
    const resetCategorie = useCallback(async () => {
        await resetCategorieMutation.mutateAsync();
    }, [resetCategorieMutation]);

    // Obtenir le paramètre complet par sa clé
    const getParametre = useCallback((cle: string): ParametreSysteme | undefined => {
        return parametres?.find(p => p.cle === cle);
    }, [parametres]);

    // Statistiques
    const modificationsCount = dirtyFields.size;
    const hasChanges = modificationsCount > 0;
    const isSaving = bulkSaveMutation.isPending;

    // Paramètres groupés par module
    const parametresByModule = useMemo(() => {
        if (!parametres) return new Map<string, ParametreSysteme[]>();
        const map = new Map<string, ParametreSysteme[]>();
        for (const param of parametres) {
            const module = param.module || '_global';
            if (!map.has(module)) map.set(module, []);
            map.get(module)!.push(param);
        }
        // Trier par ordre dans chaque module
        for (const [, params] of map) {
            params.sort((a, b) => a.ordre - b.ordre);
        }
        return map;
    }, [parametres]);

    return {
        // Données
        parametres,
        parametresByModule,
        isLoading,
        isError,
        // Valeurs
        editValues,
        originalValues,
        dirtyFields,
        // Actions
        updateValue,
        saveAll,
        resetChanges,
        resetCategorie,
        getParametre,
        // État
        hasChanges,
        modificationsCount,
        isSaving,
    };
}

/**
 * Parse la valeur string depuis la DB selon le type
 */
export function parseValeur(valeur: string, typeValeur: string): any {
    if (valeur === null || valeur === undefined) return null;

    switch (typeValeur) {
        case 'BOOLEAN':
            return valeur === 'true' || valeur === true;
        case 'NUMBER': {
            const num = Number(valeur);
            return isNaN(num) ? 0 : num;
        }
        case 'JSON':
        case 'ARRAY':
            try {
                return JSON.parse(valeur);
            } catch {
                return valeur;
            }
        case 'STRING':
        case 'ENCRYPTED':
        default:
            return valeur;
    }
}

/**
 * Sérialise une valeur pour l'envoi à l'API
 */
export function serializeValeur(valeur: any, typeValeur: string): string {
    if (valeur === null || valeur === undefined) return '';

    switch (typeValeur) {
        case 'BOOLEAN':
            return String(Boolean(valeur));
        case 'NUMBER':
            return String(Number(valeur));
        case 'JSON':
            return typeof valeur === 'string' ? valeur : JSON.stringify(valeur);
        case 'ARRAY':
            if (Array.isArray(valeur)) return JSON.stringify(valeur);
            return typeof valeur === 'string' ? valeur : JSON.stringify(valeur);
        default:
            return String(valeur);
    }
}
