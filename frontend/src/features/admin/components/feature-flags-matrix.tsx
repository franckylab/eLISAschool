/**
 * ==================================
 * eLISAschool - Feature Flags Matrix
 * ==================================
 * Matrice Établissements × Flags avec toggle rapide.
 * 
 * Migration 210 — Refonte Feature Flags (R4)
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/lib/api-client';
import { Search, Loader2, Building2 } from 'lucide-react';

// =============================================
// Types
// =============================================

interface FlagMetadata {
    name: string;
    label: string;
    description: string | null;
    categorie: string;
    type: string;
    enabled: boolean;
    source: string;
    planMinimal: string | null;
    rolloutPercentage: number;
    estSysteme: boolean;
    expiresAt: string | null;
}

interface Etablissement {
    id: string;
    nom: string;
    planSlug?: string;
}

// =============================================
// Component
// =============================================

export function FeatureFlagsMatrix() {
    const { t } = useTranslation('admin');
    const queryClient = useQueryClient();
    const [searchEtab, setSearchEtab] = useState('');
    const [filterCategorie, setFilterCategorie] = useState<string>('');
    const [selectedEtabs, setSelectedEtabs] = useState<Set<string>>(new Set());

    // Charger les définitions
    const { data: definitions = [] } = useQuery<any[]>({
        queryKey: ['feature-flag-definitions'],
        queryFn: async () => {
            const res = await apiClient.get<any[]>(
                '/api/platform/facturation/feature-flags/definitions'
            );
            return res.data ?? [];
        },
        staleTime: 30 * 1000,
    });

    // Charger les établissements
    const { data: etablissements = [], isLoading: loadingEtabs } = useQuery<Etablissement[]>({
        queryKey: ['platform-etablissements-simple'],
        queryFn: async () => {
            const res = await apiClient.get<any[]>(
                '/api/platform/facturation/etablissements'
            );
            return (res.data ?? []).map((e: any) => ({
                id: e.id,
                nom: e.nom || e.nomCommercial || 'Établissement',
                planSlug: e.abonnement?.plan?.slug,
            }));
        },
        staleTime: 60 * 1000,
    });

    // Filtrer les flags par catégorie
    const filteredDefs = filterCategorie
        ? definitions.filter((d: any) => d.categorie === filterCategorie)
        : definitions;

    // Filtrer les établissements par recherche
    const filteredEtabs = searchEtab
        ? etablissements.filter(e => e.nom.toLowerCase().includes(searchEtab.toLowerCase()))
        : etablissements;

    // Toggle flag pour un établissement
    const toggleMutation = useMutation({
        mutationFn: async ({ etablissementId, flagName, enabled }: { etablissementId: string; flagName: string; enabled: boolean }) => {
            await apiClient.put('/api/platform/facturation/feature-flags', {
                etablissementId,
                flagName,
                enabled,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['feature-flags-metadata'] });
        },
    });

    const categories = [...new Set(definitions.map((d: any) => d.categorie as string))];

    // Source badge
    const sourceBadge = (source: string) => {
        const colors: Record<string, string> = {
            plan: 'bg-[var(--color-primary-100)] text-[var(--color-primary-700)]',
            tenant_override: 'bg-[var(--color-accent-100)] text-[var(--color-accent-700)]',
            default: 'bg-[var(--color-surface-hover)] text-[var(--color-texte-muted)]',
            definition: 'bg-[var(--color-info-100)] text-[var(--color-info-700)]',
        };
        return colors[source] || colors.default;
    };

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-texte-muted)]" />
                    <input
                        type="text"
                        value={searchEtab}
                        onChange={e => setSearchEtab(e.target.value)}
                        placeholder={t('featureFlags.matrix.searchEtab', 'Rechercher un établissement...')}
                        className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm bg-[var(--color-surface)]"
                    />
                </div>
                <select
                    value={filterCategorie}
                    onChange={e => setFilterCategorie(e.target.value)}
                    className="px-3 py-2 border rounded-lg text-sm bg-[var(--color-surface)]"
                >
                    <option value="">{t('featureFlags.matrix.allCategories', 'Toutes catégories')}</option>
                    {categories.map((c: string) => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>

                {selectedEtabs.size > 0 && (
                    <span className="text-xs text-[var(--color-texte-muted)]">
                        {selectedEtabs.size} {t('featureFlags.matrix.selected', 'sélectionné(s)')}
                    </span>
                )}
            </div>

            {/* Matrix */}
            {loadingEtabs ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary-600)]" />
                </div>
            ) : (
                <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-[var(--color-surface-hover)]">
                                <th className="sticky left-0 bg-[var(--color-surface-hover)] px-3 py-2 text-left font-medium min-w-[200px] z-10">
                                    <div className="flex items-center gap-2">
                                        <Building2 className="w-4 h-4" />
                                        {t('featureFlags.matrix.etablissement', 'Établissement')}
                                    </div>
                                </th>
                                {filteredDefs.map((def: any) => (
                                    <th key={def.cle} className="px-2 py-2 text-center font-medium min-w-[80px]" title={def.label}>
                                        <div className="text-xs truncate max-w-[100px]">{def.label}</div>
                                        <div className={`text-[10px] mt-0.5 inline-block px-1 rounded ${sourceBadge('definition')}`}>
                                            {def.rolloutPercentage}%
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEtabs.map(etab => (
                                <EtablissementRow
                                    key={etab.id}
                                    etablissement={etab}
                                    flags={filteredDefs}
                                    isSelected={selectedEtabs.has(etab.id)}
                                    onToggleSelect={() => {
                                        const next = new Set(selectedEtabs);
                                        if (next.has(etab.id)) next.delete(etab.id);
                                        else next.add(etab.id);
                                        setSelectedEtabs(next);
                                    }}
                                    onToggleFlag={(flagName, enabled) => {
                                        toggleMutation.mutate({ etablissementId: etab.id, flagName, enabled });
                                    }}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// =============================================
// Row component
// =============================================

function EtablissementRow({
    etablissement,
    flags,
    isSelected,
    onToggleSelect,
    onToggleFlag,
}: {
    etablissement: Etablissement;
    flags: any[];
    isSelected: boolean;
    onToggleSelect: () => void;
    onToggleFlag: (flagName: string, enabled: boolean) => void;
}) {
    const [flagValues, setFlagValues] = useState<Record<string, boolean>>({});
    const [loaded, setLoaded] = useState(false);

    // Charger les flags de l'établissement au premier rendu
    const { data: metadata = [] } = useQuery<FlagMetadata[]>({
        queryKey: ['feature-flags-metadata', etablissement.id],
        queryFn: async () => {
            const res = await apiClient.get<FlagMetadata[]>(
                `/api/platform/facturation/feature-flags/${etablissement.id}/metadata`
            );
            return res.data ?? [];
        },
        staleTime: 30 * 1000,
    });

    // Mettre à jour les valeurs quand les metadata sont chargées
    if (metadata.length > 0 && !loaded) {
        const values: Record<string, boolean> = {};
        for (const m of metadata) {
            values[m.name] = m.enabled;
        }
        setFlagValues(values);
        setLoaded(true);
    }

    const handleToggle = (flagName: string) => {
        const newValue = !flagValues[flagName];
        setFlagValues(prev => ({ ...prev, [flagName]: newValue }));
        onToggleFlag(flagName, newValue);
    };

    return (
        <tr className={`border-t hover:bg-[var(--color-surface-hover)] transition-colors ${isSelected ? 'bg-[var(--color-primary-50)]' : ''}`}>
            <td className="sticky left-0 bg-[var(--color-surface)] px-3 py-2 z-10">
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={onToggleSelect}
                        className="w-3.5 h-3.5 rounded"
                    />
                    <span className="text-sm truncate max-w-[180px]" title={etablissement.nom}>
                        {etablissement.nom}
                    </span>
                    {etablissement.planSlug && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-[var(--color-surface-hover)] rounded">
                            {etablissement.planSlug}
                        </span>
                    )}
                </div>
            </td>
            {flags.map((def: any) => {
                const enabled = flagValues[def.cle] ?? def.valeurDefaut;
                return (
                    <td key={def.cle} className="px-2 py-2 text-center">
                        <button
                            type="button"
                            onClick={() => handleToggle(def.cle)}
                            className={`inline-flex items-center justify-center w-8 h-5 rounded-full transition-colors ${
                                enabled ? 'bg-[var(--color-primary-600)]' : 'bg-[var(--color-muted)]'
                            }`}
                            title={`${def.label}: ${enabled ? 'ON' : 'OFF'}`}
                        >
                            <div className={`w-3.5 h-3.5 rounded-full bg-white shadow transition-transform ${
                                enabled ? 'translate-x-2' : 'translate-x-0.5'
                            }`} />
                        </button>
                    </td>
                );
            })}
        </tr>
    );
}
