/**
 * ==================================
 * eLISAschool - Feature Flags Manager v2
 * ==================================
 * UI de gestion des feature flags par tenant/plateforme.
 * Permet de visualiser et override les flags pour un établissement.
 *
 * Endpoints platform : /api/platform/facturation/feature-flags/*
 * - GET  /:etablissementId — liste tous les flags d'un établissement
 * - PUT  /                 — toggle un flag (body: { etablissementId, flagName, enabled })
 *
 * v2 : ElisaToggle, ElisaSelect, ElisaInput, responsive, i18n config-params.
 *
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 */

import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useTranslation } from 'react-i18next';
import {
    ToggleLeft,
    Loader2,
    Search,
    Building2,
    CheckCircle,
    AlertCircle,
    Filter,
} from 'lucide-react';
import { toast } from 'sonner';
import { ElisaToggle } from '@/components/ui/ElisaToggle';
import { ElisaSelect } from '@/components/ui/ElisaSelect';
import { ElisaInput } from '@/components/ui/ElisaInput';
import { motion, AnimatePresence } from 'framer-motion';

// =============================================
// Types
// =============================================

interface FeatureFlag {
    name: string;
    label: string;
    enabled: boolean;
    source: 'plan' | 'tenant_override' | 'default';
    description?: string;
}

interface Etablissement {
    id: string;
    nom: string;
}

interface FeatureFlagsManagerProps {
    etablissementId?: string;
}

// =============================================
// Composant principal
// =============================================

export function FeatureFlagsManager({ etablissementId: propEtabId }: FeatureFlagsManagerProps) {
    const { t } = useTranslation(['admin', 'config-params']);
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [filterSource, setFilterSource] = useState<string>('all');
    const [selectedEtabId, setSelectedEtabId] = useState<string | undefined>(propEtabId);

    // Charger la liste des établissements (pour le sélecteur si pas de prop)
    const { data: etablissements } = useQuery<Etablissement[]>({
        queryKey: ['platform-etablissements-select'],
        queryFn: async () => {
            const res = await apiClient.get<Etablissement[]>('/api/platform/etablissements');
            return res.data ?? [];
        },
        enabled: !propEtabId,
    });

    const effectiveEtabId = propEtabId || selectedEtabId;

    // Options pour le sélecteur d'établissement
    const etablissementOptions = useMemo(() => {
        if (!etablissements) return [];
        return etablissements.map(e => ({ value: e.id, label: e.nom }));
    }, [etablissements]);

    // Options pour le filtre source
    const sourceFilterOptions = useMemo(() => [
        { value: 'all', label: t('admin:featureFlags.tous', 'Tous') },
        { value: 'plan', label: t('admin:featureFlags.plan', 'Plan') },
        { value: 'tenant_override', label: t('admin:featureFlags.override', 'Override') },
        { value: 'default', label: t('admin:featureFlags.defaut', 'Défaut') },
    ], [t]);

    // Charger les flags avec métadonnées (Migration 210 — données dynamiques)
    const { data: flags, isLoading } = useQuery<FeatureFlag[]>({
        queryKey: ['feature-flags', effectiveEtabId],
        queryFn: async () => {
            if (!effectiveEtabId) return [];
            // Utiliser l'endpoint metadata pour les labels/descriptions dynamiques
            const res = await apiClient.get<Array<{
                name: string;
                label: string;
                description: string | null;
                enabled: boolean;
                source: string;
                categorie: string;
            }>>(
                `/api/platform/facturation/feature-flags/${effectiveEtabId}/metadata`
            );
            const metadata = res.data ?? [];
            if (metadata.length > 0) {
                return metadata.map(m => ({
                    name: m.name,
                    label: m.label,
                    enabled: m.enabled,
                    source: m.source as FeatureFlag['source'],
                    description: m.description || undefined,
                }));
            }
            // Fallback : ancien endpoint si metadata indisponible
            const fallbackRes = await apiClient.get<Record<string, boolean>>(
                `/api/platform/facturation/feature-flags/${effectiveEtabId}`
            );
            const record = fallbackRes.data ?? {};
            return Object.entries(record).map(([name, enabled]) => ({
                name,
                label: humanizeFlagName(name),
                enabled,
                source: name.startsWith('module_') ? 'plan' as const : 'default' as const,
                description: getFlagDescription(name),
            }));
        },
        enabled: !!effectiveEtabId,
    });

    // Mutation toggle
    const toggleMutation = useMutation({
        mutationFn: async ({ flagName, enabled }: { flagName: string; enabled: boolean }) => {
            if (!effectiveEtabId) throw new Error('etablissementId requis');
            await apiClient.put('/api/platform/facturation/feature-flags', {
                etablissementId: effectiveEtabId,
                flagName,
                enabled,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
            toast.success(t('admin:featureFlags.toastToggleSuccess', 'Flag mis à jour'));
        },
        onError: () => {
            toast.error(t('admin:featureFlags.toastToggleError', 'Erreur lors de la mise à jour'));
        },
    });

    // Filtrage
    const filteredFlags = useMemo(() => {
        if (!flags) return [];
        return flags.filter(f => {
            const matchSearch = !search || f.label.toLowerCase().includes(search.toLowerCase()) || f.name.toLowerCase().includes(search.toLowerCase());
            const matchSource = filterSource === 'all' || f.source === filterSource;
            return matchSearch && matchSource;
        });
    }, [flags, search, filterSource]);

    // Compteurs
    const compteurs = useMemo(() => {
        if (!flags) return { total: 0, actifs: 0, inactifs: 0, overrides: 0 };
        return {
            total: flags.length,
            actifs: flags.filter(f => f.enabled).length,
            inactifs: flags.filter(f => !f.enabled).length,
            overrides: flags.filter(f => f.source === 'tenant_override').length,
        };
    }, [flags]);

    const handleEtabChange = useCallback((value: string) => {
        setSelectedEtabId(value || undefined);
    }, []);

    return (
        <div className="rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-[clamp(0.75rem,0.6rem+0.5vw,1.5rem)] space-y-[var(--space-md)]">
            {/* ═══════════════ EN-TÊTE ═══════════════ */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                    <div className="rounded-lg p-1.5" style={{ backgroundColor: 'var(--color-dominant-100)' }}>
                        <ToggleLeft className="h-[var(--icon-sm)] w-[var(--icon-sm)]" style={{ color: 'var(--color-dominant-600)' }} />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
                            {t('admin:featureFlags.titre', 'Feature Flags')}
                        </h2>
                        {effectiveEtabId && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'var(--color-dominant-100)', color: 'var(--color-dominant-600)' }}>
                                {t('admin:featureFlags.overrideTenant', 'Override tenant')}
                            </span>
                        )}
                    </div>
                </div>

                {/* Compteurs */}
                <div className="flex items-center gap-3 text-xs text-[var(--color-text-secondary)]">
                    <span><strong className="text-[var(--color-text-primary)]">{compteurs.total}</strong> total</span>
                    <span><strong className="text-[var(--color-success-600)]">{compteurs.actifs}</strong> actifs</span>
                    <span><strong className="text-[var(--color-text-muted)]">{compteurs.inactifs}</strong> inactifs</span>
                    {compteurs.overrides > 0 && (
                        <span><strong className="text-[var(--color-warning-600)]">{compteurs.overrides}</strong> overrides</span>
                    )}
                </div>
            </div>

            {/* ═══════════════ SÉLECTEUR ÉTABLISSEMENT ═══════════════ */}
            {!propEtabId && (
                <div className="max-w-xs">
                    <ElisaSelect
                        label={t('admin:featureFlags.selectionnerEtab', 'Sélectionner un établissement')}
                        options={etablissementOptions}
                        value={selectedEtabId || ''}
                        onValueChange={handleEtabChange}
                        placeholder={t('admin:featureFlags.selectionnerEtab', 'Sélectionner un établissement')}
                        searchable
                    />
                </div>
            )}

            {/* ═══════════════ FILTRES ═══════════════ */}
            {effectiveEtabId && (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="flex-1 max-w-sm">
                        <ElisaInput
                            placeholder={t('admin:featureFlags.rechercher', 'Rechercher un flag...')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            icon={<Search className="h-4 w-4" />}
                            size="sm"
                        />
                    </div>
                    <div className="w-full sm:w-40">
                        <ElisaSelect
                            options={sourceFilterOptions}
                            value={filterSource}
                            onValueChange={setFilterSource}
                            placeholder="Filtrer par source"
                            compact
                        />
                    </div>
                </div>
            )}

            {/* ═══════════════ CONTENU ═══════════════ */}
            {!effectiveEtabId ? (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                    <Building2 className="h-10 w-10 text-[var(--color-text-muted)] opacity-40" />
                    <p className="text-sm text-[var(--color-text-secondary)]">
                        {t('admin:featureFlags.selectionnerEtabMessage', 'Sélectionnez un établissement pour voir ses feature flags')}
                    </p>
                </div>
            ) : isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-5 w-5 animate-spin text-[var(--color-dominant-600)]" />
                </div>
            ) : filteredFlags.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12 text-center">
                    <Filter className="h-8 w-8 text-[var(--color-text-muted)] opacity-40" />
                    <p className="text-sm text-[var(--color-text-secondary)]">
                        {t('admin:featureFlags.aucunFlag', 'Aucun feature flag trouvé')}
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    <AnimatePresence mode="popLayout">
                        {filteredFlags.map((flag) => (
                            <motion.div
                                key={flag.name}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="flex flex-col gap-2 rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface)] p-3 sm:flex-row sm:items-center sm:justify-between"
                            >
                                {/* Info + Toggle */}
                                <div className="flex items-start gap-3">
                                    <ElisaToggle
                                        checked={flag.enabled}
                                        onCheckedChange={(checked) => {
                                            toggleMutation.mutate({ flagName: flag.name, enabled: checked });
                                        }}
                                        size="sm"
                                        disabled={toggleMutation.isPending}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            <span className="text-sm font-medium text-[var(--color-text-primary)]">
                                                {flag.label}
                                            </span>
                                            <SourceBadge source={flag.source} />
                                        </div>
                                        {flag.description && (
                                            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                                                {flag.description}
                                            </p>
                                        )}
                                        <p className="text-[10px] text-[var(--color-text-muted)] font-mono mt-0.5">
                                            {flag.name}
                                        </p>
                                    </div>
                                </div>

                                {/* Status indicator */}
                                <div className="flex items-center gap-1.5 pl-10 sm:pl-0">
                                    {flag.enabled ? (
                                        <CheckCircle className="h-4 w-4 text-[var(--color-success-500)]" />
                                    ) : (
                                        <AlertCircle className="h-4 w-4 text-[var(--color-text-muted)]" />
                                    )}
                                    <span className={`text-xs font-medium ${flag.enabled ? 'text-[var(--color-success-600)]' : 'text-[var(--color-text-muted)]'}`}>
                                        {flag.enabled ? t('config-params:active', 'Actif') : t('config-params:inactive', 'Inactif')}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}

// =============================================
// Helpers
// =============================================

/**
 * Humanize un nom de flag en label lisible.
 * Fallback — utilise les labels de feature_flag_definitions en priorité.
 */
function humanizeFlagName(name: string): string {
    return name
        .replace(/^module_/, 'Module ')
        .replace(/^feature_/, '')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Description par défaut pour les flags connus.
 * Fallback — utilise les descriptions de feature_flag_definitions en priorité.
 */
function getFlagDescription(name: string): string {
    const descriptions: Record<string, string> = {
        'module_notes': 'Module de gestion des notes et évaluations',
        'module_bulletins': 'Module de génération des bulletins scolaires',
        'module_cantine': 'Module de gestion de la cantine scolaire',
        'module_transport': 'Module de gestion du transport scolaire',
        'module_bibliotheque': 'Module de gestion de la bibliothèque',
        'module_sondages': 'Module de sondages et enquêtes',
        'module_clubs': 'Module de gestion des clubs et associations',
        'module_gamification': 'Module de gamification (points, badges, classements)',
        'module_orientation': 'Module d\'orientation scolaire',
        'feature_mfa': 'Authentification multi-facteurs',
        'feature_webauthn': 'Authentification par passkeys (WebAuthn/FIDO2)',
        'feature_dark_mode': 'Mode sombre de l\'interface',
        'feature_i18n': 'Support multilingue (internationalisation)',
        'feature_pwa': 'Progressive Web App (installation mobile)',
    };
    return descriptions[name] || '';
}

function SourceBadge({ source }: { source: string }) {
    const styles: Record<string, string> = {
        plan: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        tenant_override: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        default: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    };
    const labels: Record<string, string> = {
        plan: 'Plan',
        tenant_override: 'Override',
        default: 'Défaut',
    };

    return (
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${styles[source] || styles.default}`}>
            {labels[source] || source}
        </span>
    );
}

export default FeatureFlagsManager;
