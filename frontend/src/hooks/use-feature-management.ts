/**
 * ==================================
 * eLISAschool - Hook useFeatureManagement
 * ==================================
 * Hook unifié pour la gestion des feature flags et modules.
 * Combine FeatureFlagService + EntitlementService avec cache TanStack Query.
 * 
 * Migration 210 — Refonte Feature Flags (R8 SDK unifié)
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

// =============================================
// Types
// =============================================

export interface FeatureFlagWithMetadata {
    name: string;
    label: string;
    description: string | null;
    categorie: string;
    type: string;
    enabled: boolean;
    source: 'plan' | 'tenant_override' | 'default' | 'definition';
    planMinimal: string | null;
    rolloutPercentage: number;
    estSysteme: boolean;
    expiresAt: string | null;
}

export interface FeatureFlagDefinition {
    id: string;
    cle: string;
    label: string;
    description: string | null;
    categorie: string;
    type: string;
    valeurDefaut: boolean;
    planMinimal: string | null;
    rolloutPercentage: number;
    segments: Array<{ champ: string; operateur: string; valeur: string }>;
    estSysteme: boolean;
    estActif: boolean;
    expiresAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface ModuleCatalogueItem {
    id: string;
    code: string;
    nom: string;
    nomEn?: string;
    description?: string;
    categorie: string;
    icone?: string;
    prixMensuel: number;
    prixAnnuel: number;
    estFacturable: boolean;
    estSouscriptible: boolean;
    actifParDefaut: boolean;
    planMinimal?: string;
    dependencies?: string[];
    ordre: number;
    estActif: boolean;
}

export interface EntitlementResult {
    accessible: boolean;
    visible: boolean;
    raison: string;
    message?: string;
    source: string;
    planMinimalRequis?: string;
    planActuel?: string;
    lectureSeule?: boolean;
}

// =============================================
// Hook principal
// =============================================

/**
 * Hook unifié pour la gestion des feature flags et modules.
 * Utilise TanStack Query pour le cache et la revalidation automatique.
 */
export function useFeatureManagement(etablissementId?: string) {
    // 1. Feature flag definitions (registre centralisé)
    const { data: definitions, isLoading: loadingDefinitions } = useQuery<FeatureFlagDefinition[]>({
        queryKey: ['feature-flag-definitions'],
        queryFn: async () => {
            const res = await apiClient.get<FeatureFlagDefinition[]>(
                '/api/platform/facturation/feature-flags/definitions'
            );
            return res.data ?? [];
        },
        staleTime: 60 * 1000, // 60s
        gcTime: 5 * 60 * 1000, // 5min
    });

    // 2. Flags avec metadata pour un établissement spécifique
    const { data: flagsWithMetadata, isLoading: loadingFlags } = useQuery<FeatureFlagWithMetadata[]>({
        queryKey: ['feature-flags-metadata', etablissementId],
        queryFn: async () => {
            if (!etablissementId) return [];
            const res = await apiClient.get<FeatureFlagWithMetadata[]>(
                `/api/platform/facturation/feature-flags/${etablissementId}/metadata`
            );
            return res.data ?? [];
        },
        enabled: !!etablissementId,
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
    });

    // 3. Catalogue modules
    const { data: modules, isLoading: loadingModules } = useQuery<ModuleCatalogueItem[]>({
        queryKey: ['modules-catalogue'],
        queryFn: async () => {
            const res = await apiClient.get<ModuleCatalogueItem[]>(
                '/api/platform/facturation/modules/catalogue'
            );
            return res.data ?? [];
        },
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
    });

    // =============================================
    // Helpers
    // =============================================

    /**
     * Vérifie si un feature flag est activé pour l'établissement.
     */
    const isEnabled = (flagName: string): boolean => {
        if (!flagsWithMetadata) return false;
        const flag = flagsWithMetadata.find((f: FeatureFlagWithMetadata) => f.name === flagName);
        return flag?.enabled ?? false;
    };

    /**
     * Vérifie si un module est accessible (nécessite un appel séparé).
     */
    const checkModuleAccess = async (moduleCode: string): Promise<EntitlementResult | null> => {
        if (!etablissementId) return null;
        try {
            const res = await apiClient.get<EntitlementResult>(
                `/api/platform/facturation/feature-flags/check-capability/${etablissementId}/${moduleCode}`
            );
            return res.data ?? null;
        } catch {
            return null;
        }
    };

    return {
        // Data
        definitions: definitions || [],
        flags: flagsWithMetadata || [],
        modules: modules || [],

        // Loading states
        isLoading: loadingDefinitions || loadingFlags || loadingModules,
        isLoadingDefinitions: loadingDefinitions,
        isLoadingFlags: loadingFlags,
        isLoadingModules: loadingModules,

        // Helpers
        isEnabled,
        checkModuleAccess,
    };
}

export default useFeatureManagement;
