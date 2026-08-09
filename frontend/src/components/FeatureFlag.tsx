/**
 * ==================================
 * eLISAschool - Composant FeatureFlag
 * ==================================
 * Rendu conditionnel basé sur les feature flags et le plan d'abonnement.
 * Masque/affiche des éléments UI selon les flags actifs et le plan.
 * 
 * Phase 4.4 / 6.5 — Refonte SaaS
 * Phase C.4 — Refonte SaaS v2 (plan-based flags, premium gating)
 * 
 * @example
 * <FeatureFlag flag="module_transport">
 *     <Link to="/transport">Transport</Link>
 * </FeatureFlag>
 * 
 * <FeatureFlag flag="white_label" plan="ENTERPRISE">
 *     <LogoCustom />
 * </FeatureFlag>
 */

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { type ReactNode } from 'react';
import { useAuthStore } from '@/stores/auth.store';

/** Flags disponibles par plan */
const PLAN_FEATURES: Record<string, string[]> = {
    GRATUIT: ['export_pdf'],
    STARTER: ['export_pdf', 'api_access'],
    PROFESSIONAL: ['export_pdf', 'api_access', 'multi_etablissements', 'sondages'],
    ENTERPRISE: ['export_pdf', 'api_access', 'multi_etablissements', 'white_label', 'sondages', 'advanced_analytics'],
};

interface FeatureFlagProps {
    flag: string;
    children: ReactNode;
    fallback?: ReactNode;
    /** Plan minimum requis (optionnel) */
    plan?: 'GRATUIT' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
}

/**
 * Hook pour vérifier un feature flag côté client.
 */
export function useFeatureFlag(flag: string): boolean {
    const utilisateur = useAuthStore((s) => s.utilisateur);

    const { data: flags } = useQuery<Record<string, boolean> | undefined>({
        queryKey: ['feature-flags'],
        queryFn: async () => {
            const res = await apiClient.get<Record<string, boolean>>('/api/billing/feature-flags');
            return res.data;
        },
        staleTime: 5 * 60 * 1000, // 5 min cache
        enabled: !!utilisateur,
    });

    if (!flags) return false;
    return flags[flag] === true;
}

/**
 * Hook pour vérifier si le plan courant inclut un flag.
 */
export function usePlanFeature(flag: string): { enabled: boolean; planName: string | null } {
    const utilisateur = useAuthStore((s) => s.utilisateur);

    const { data: abonnement } = useQuery<{ planNom: string } | undefined>({
        queryKey: ['current-abonnement'],
        queryFn: async () => {
            const res = await apiClient.get<{ planNom: string }>('/api/billing/abonnement');
            return res.data;
        },
        staleTime: 5 * 60 * 1000,
        enabled: !!utilisateur,
    });

    const planName = abonnement?.planNom || null;
    const planFeatures = planName ? PLAN_FEATURES[planName] || [] : [];

    return {
        enabled: planFeatures.includes(flag),
        planName,
    };
}

/**
 * Composant de rendu conditionnel basé sur un feature flag.
 * Supporte la vérification par plan d'abonnement.
 */
export function FeatureFlag({ flag, children, fallback, plan }: FeatureFlagProps) {
    const isFlagEnabled = useFeatureFlag(flag);
    const planFeature = usePlanFeature(flag);

    // Si un plan minimum est spécifié, vérifier le plan
    if (plan) {
        if (!planFeature.enabled) {
            return fallback ? <>{fallback}</> : null;
        }
    }

    // Sinon, vérifier le flag standard
    if (isFlagEnabled) {
        return <>{children}</>;
    }

    return fallback ? <>{fallback}</> : null;
}

/**
 * Composant PremiumGate — affiche un CTA upgrade si le module est premium.
 */
export function PremiumGate({
    module: moduleNom,
    children,
    upgradeMessage = 'Cette fonctionnalité nécessite un abonnement premium.',
}: {
    module: string;
    children: ReactNode;
    upgradeMessage?: string;
}) {
    const { enabled } = usePlanFeature(`module_${moduleNom}`);

    if (!enabled) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-primary/20 rounded-lg">
                <div className="text-4xl mb-4">🔒</div>
                <h3 className="text-lg font-semibold mb-2">Fonctionnalité Premium</h3>
                <p className="text-sm text-muted-foreground mb-4">{upgradeMessage}</p>
                <a
                    href="/mon-abonnement"
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                    Upgrader mon abonnement
                </a>
            </div>
        );
    }

    return <>{children}</>;
}

export default FeatureFlag;
