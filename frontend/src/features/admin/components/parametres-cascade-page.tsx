/**
 * ==================================
 * eLISAschool — Page Paramètres Cascade
 * ==================================
 * Version: 1.0.0
 *
 * Interface cascade multi-niveaux :
 *   Système → Global → Groupe → Établissement
 *
 * - Liste des paramètres groupés par module
 * - Vue 4 colonnes avec toggles par niveau
 * - Propagation, historique, rollback
 * - Détection incohérences
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/lib/api-client';
import {
    Layers,
    ChevronRight,
    ChevronDown,
    Globe,
    Building2,
    Network,
    Monitor,
    AlertTriangle,
    History,
    RotateCcw,
    ArrowDownToLine,
    Search,
    Filter,
    Save,
    X,
    CheckCircle2,
    AlertCircle,
    Undo2,
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface ParametreCascadeItem {
    cle: string;
    description?: string;
    module?: string;
    categorie?: string;
    propageable: boolean;
    nbOverrides: number;
    hasGlobal: boolean;
}

interface CascadeNiveau {
    niveau: 'systeme' | 'global' | 'groupe' | 'etablissement';
    label: string;
    valeur: any;
    source: string;
    hasOverride: boolean;
    parametreId?: string;
    scopeId?: string;
}

interface CascadeResult {
    cle: string;
    description?: string;
    module?: string;
    categorie?: string;
    typeValeur?: string;
    propageable: boolean;
    niveaux: CascadeNiveau[];
    valeurResolue: any;
    niveauResolu: string;
}

interface Incoherence {
    cle: string;
    type: string;
    description: string;
    etablissementId?: string;
    groupeId?: string;
}

interface HistoriqueEntry {
    id: string;
    parametreId: string;
    version: number;
    ancienneValeur: any;
    nouvelleValeur: any;
    modifiedByName: string;
    createdAt: string;
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export function ParametresCascadePage() {
    const { t } = useTranslation('admin');
    const queryClient = useQueryClient();
    const [selectedCle, setSelectedCle] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [moduleFilter, setModuleFilter] = useState('');
    const [showHistory, setShowHistory] = useState(false);
    const [editValues, setEditValues] = useState<Record<string, string>>({});

    // Liste des paramètres
    const { data: parametres, isLoading: isLoadingListe } = useQuery<ParametreCascadeItem[]>({
        queryKey: ['cascade-parametres', moduleFilter, searchQuery],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (moduleFilter) params.set('module', moduleFilter);
            if (searchQuery) params.set('search', searchQuery);
            const res = await apiClient.get<ParametreCascadeItem[]>(
                `/api/platform/parametres/cascade?${params.toString()}`
            );
            return res.data ?? [];
        },
    });

    // Cascade détaillée
    const { data: cascade, isLoading: isLoadingCascade } = useQuery<CascadeResult>({
        queryKey: ['cascade-detail', selectedCle],
        queryFn: async () => {
            const res = await apiClient.get<CascadeResult>(
                `/api/platform/parametres/cascade/${selectedCle}`
            );
            return res.data!;
        },
        enabled: !!selectedCle,
    });

    // Incohérences
    const { data: incoherences } = useQuery<{ total: number; incoherences: Incoherence[] }>({
        queryKey: ['cascade-incoherences'],
        queryFn: async () => {
            const res = await apiClient.get<{ total: number; incoherences: Incoherence[] }>(
                '/api/platform/parametres/cascade/incoherences'
            );
            return res.data!;
        },
    });

    // Historique
    const { data: historique } = useQuery<HistoriqueEntry[]>({
        queryKey: ['cascade-historique', selectedCle],
        queryFn: async () => {
            const res = await apiClient.get<HistoriqueEntry[]>(
                `/api/platform/parametres/cascade/${selectedCle}/historique`
            );
            return res.data ?? [];
        },
        enabled: !!selectedCle && showHistory,
    });

    // Mutations
    const updateGlobalMutation = useMutation({
        mutationFn: async ({ cle, valeur }: { cle: string; valeur: any }) => {
            await apiClient.put(`/api/platform/parametres/cascade/${cle}/global`, { valeur });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cascade-detail'] });
            queryClient.invalidateQueries({ queryKey: ['cascade-parametres'] });
        },
    });

    const updateOverrideEtabMutation = useMutation({
        mutationFn: async ({ cle, etabId, valeur }: { cle: string; etabId: string; valeur: any }) => {
            await apiClient.put(`/api/platform/parametres/cascade/${cle}/etablissement/${etabId}`, { valeur });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cascade-detail'] });
            queryClient.invalidateQueries({ queryKey: ['cascade-parametres'] });
        },
    });

    const resetOverrideMutation = useMutation({
        mutationFn: async ({ cle, etabId }: { cle: string; etabId: string }) => {
            await apiClient.delete(`/api/platform/parametres/cascade/${cle}/etablissement/${etabId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cascade-detail'] });
            queryClient.invalidateQueries({ queryKey: ['cascade-parametres'] });
        },
    });

    const rollbackMutation = useMutation({
        mutationFn: async ({ cle, versionId }: { cle: string; versionId: string }) => {
            await apiClient.post(`/api/platform/parametres/cascade/${cle}/rollback/${versionId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cascade-detail'] });
            queryClient.invalidateQueries({ queryKey: ['cascade-historique'] });
        },
    });

    // Modules uniques pour le filtre
    const modules = [...new Set(parametres?.map(p => p.module).filter(Boolean))] as string[];

    // Grouper par module
    const grouped = parametres?.reduce<Record<string, ParametreCascadeItem[]>>((acc, p) => {
        const mod = p.module || 'general';
        if (!acc[mod]) acc[mod] = [];
        acc[mod].push(p);
        return acc;
    }, {}) || {};

    const NIVEAU_ICONS = {
        systeme: Monitor,
        global: Globe,
        groupe: Network,
        etablissement: Building2,
    };

    const NIVEAU_COLORS: Record<string, string> = {
        systeme: 'var(--color-texte-muted)',
        global: 'var(--color-info-600)',
        groupe: 'var(--color-warning-600)',
        etablissement: 'var(--color-success-600)',
    };

    return (
        <div className="p-[var(--space-lg)] space-y-[var(--space-lg)]">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-[var(--gap-sm)]">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-warning-100)' }}>
                        <Layers className="h-[var(--icon-md)] w-[var(--icon-md)]" style={{ color: 'var(--color-warning-600)' }} />
                    </div>
                    <div>
                        <h1 className="font-bold text-[var(--color-texte)]" style={{ fontSize: 'clamp(1.25rem, 1.1rem + 0.5vw, 1.5rem)' }}>
                            {t('parametresCascade.titre', 'Paramètres cascade')}
                        </h1>
                        <p style={{ fontSize: 'clamp(0.75rem, 0.68rem + 0.25vw, 0.875rem)', color: 'var(--color-texte-muted)' }}>
                            {t('parametresCascade.sousTitre', 'Système → Global → Groupe → Établissement')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Alerte incohérences */}
            {incoherences && incoherences.total > 0 && (
                <div className="flex items-center gap-[var(--gap-sm)] p-[var(--space-md)] rounded-lg border"
                    style={{ backgroundColor: 'var(--color-warning-50)', borderColor: 'var(--color-warning-300)' }}>
                    <AlertTriangle className="h-[var(--icon-sm)] w-[var(--icon-sm)] flex-shrink-0" style={{ color: 'var(--color-warning-600)' }} />
                    <span style={{ color: 'var(--color-warning-800)', fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.875rem)' }}>
                        {t('parametresCascade.incoherencesDetectees', '{{count}} incohérence(s) détectée(s)', { count: incoherences.total })}
                    </span>
                </div>
            )}

            {/* Toolbar */}
            <div className="flex items-center gap-[var(--gap-sm)] flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-[var(--icon-sm)] w-[var(--icon-sm)]" style={{ color: 'var(--color-texte-muted)' }} />
                    <input
                        type="text"
                        placeholder={t('parametresCascade.rechercher', 'Rechercher un paramètre...')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-3 py-[var(--space-sm)] border border-[var(--color-bordure)] rounded-lg bg-[var(--color-surface)] text-[var(--color-texte)]"
                        style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.875rem)' }}
                    />
                </div>
                <select
                    value={moduleFilter}
                    onChange={(e) => setModuleFilter(e.target.value)}
                    className="px-[var(--space-md)] py-[var(--space-sm)] border border-[var(--color-bordure)] rounded-lg bg-[var(--color-surface)] text-[var(--color-texte)]"
                    style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.875rem)' }}
                >
                    <option value="">{t('parametresCascade.tousModules', 'Tous les modules')}</option>
                    {modules.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
            </div>

            {/* Layout 2 colonnes : Liste + Détail cascade */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-[var(--space-lg)]">
                {/* Colonne gauche : Liste des paramètres */}
                <div className="lg:col-span-1 rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] overflow-hidden">
                    <div className="p-[var(--space-md)] border-b border-[var(--color-bordure)]" style={{ backgroundColor: 'var(--color-surface-hover)' }}>
                        <h2 className="font-semibold text-[var(--color-texte)]" style={{ fontSize: 'clamp(0.875rem, 0.8rem + 0.25vw, 1rem)' }}>
                            {t('parametresCascade.listeParametres', 'Paramètres')}
                            {parametres && <span className="ml-2 text-[var(--color-texte-muted)] font-normal">({parametres.length})</span>}
                        </h2>
                    </div>
                    <div className="max-h-[600px] overflow-y-auto divide-y divide-[var(--color-bordure)]">
                        {isLoadingListe ? (
                            <div className="p-8 text-center text-[var(--color-texte-muted)]">
                                {t('parametresCascade.chargement', 'Chargement...')}
                            </div>
                        ) : Object.entries(grouped).map(([mod, items]) => (
                            <div key={mod}>
                                <div className="px-[var(--space-md)] py-[var(--space-xs)] font-semibold text-[var(--color-texte-muted)] uppercase tracking-wider"
                                    style={{ fontSize: 'clamp(0.6875rem, 0.62rem + 0.2vw, 0.75rem)', backgroundColor: 'var(--color-surface-hover)' }}>
                                    {mod}
                                </div>
                                {items.map((p) => (
                                    <button
                                        key={p.cle}
                                        onClick={() => { setSelectedCle(p.cle); setShowHistory(false); }}
                                        className={`w-full text-left px-[var(--space-md)] py-[var(--space-sm)] transition-colors hover:bg-[var(--color-surface-hover)] ${
                                            selectedCle === p.cle ? 'bg-[var(--color-dominant-50)] border-l-2' : ''
                                        }`}
                                        style={{ borderColor: selectedCle === p.cle ? 'var(--color-dominant-600)' : 'transparent', fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.875rem)' }}
                                    >
                                        <div className="flex items-center justify-between">
                                            <code className="font-mono font-medium text-[var(--color-texte)] truncate">{p.cle}</code>
                                            <div className="flex items-center gap-[var(--gap-xs)]">
                                                {p.nbOverrides > 0 && (
                                                    <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'var(--color-info-100)', color: 'var(--color-info-700)' }}>
                                                        {p.nbOverrides}
                                                    </span>
                                                )}
                                                <ChevronRight className="h-3 w-3" style={{ color: 'var(--color-texte-muted)' }} />
                                            </div>
                                        </div>
                                        {p.description && (
                                            <p className="text-[var(--color-texte-muted)] truncate mt-0.5" style={{ fontSize: 'clamp(0.6875rem, 0.62rem + 0.2vw, 0.75rem)' }}>
                                                {p.description}
                                            </p>
                                        )}
                                    </button>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Colonne droite : Détail cascade */}
                <div className="lg:col-span-2 space-y-[var(--space-md)]">
                    {!selectedCle ? (
                        <div className="rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-12 text-center">
                            <Layers className="h-[var(--icon-xl)] w-[var(--icon-xl)] mx-auto mb-[var(--space-md)]" style={{ color: 'var(--color-texte-muted)' }} />
                            <p style={{ color: 'var(--color-texte-muted)', fontSize: 'clamp(0.875rem, 0.8rem + 0.25vw, 1rem)' }}>
                                {t('parametresCascade.selectionnerParametre', 'Sélectionnez un paramètre pour voir sa cascade')}
                            </p>
                        </div>
                    ) : isLoadingCascade ? (
                        <div className="rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-12 text-center text-[var(--color-texte-muted)]">
                            {t('parametresCascade.chargement', 'Chargement...')}
                        </div>
                    ) : cascade ? (
                        <>
                            {/* Toggle historique */}
                            <div className="flex items-center gap-[var(--gap-sm)]">
                                <button
                                    onClick={() => setShowHistory(!showHistory)}
                                    className={`flex items-center gap-[var(--gap-xs)] px-[var(--space-md)] py-[var(--space-sm)] rounded-lg font-medium transition-colors ${
                                        showHistory ? '' : 'border border-[var(--color-bordure)] hover:bg-[var(--color-surface-hover)]'
                                    }`}
                                    style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.875rem)', ...(showHistory
                                        ? { backgroundColor: 'var(--color-dominant-600)', color: '#fff' }
                                        : { color: 'var(--color-texte)' }
                                    ) }}
                                >
                                    <History className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />
                                    {t('parametresCascade.historique', 'Historique')}
                                </button>
                            </div>

                            {showHistory ? (
                                /* Historique timeline */
                                <div className="rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)]">
                                    <div className="p-[var(--space-md)] border-b border-[var(--color-bordure)]">
                                        <h3 className="font-semibold text-[var(--color-texte)]">
                                            {t('parametresCascade.timelineModifications', 'Timeline des modifications')} — <code className="font-mono">{cascade.cle}</code>
                                        </h3>
                                    </div>
                                    <div className="divide-y divide-[var(--color-bordure)]">
                                        {!historique?.length ? (
                                            <div className="p-8 text-center text-[var(--color-texte-muted)]">
                                                {t('parametresCascade.aucunHistorique', 'Aucune modification enregistrée')}
                                            </div>
                                        ) : (
                                            historique.map((entry) => (
                                                <div key={entry.id} className="p-[var(--space-md)] flex items-center justify-between gap-[var(--gap-md)]">
                                                    <div className="flex items-center gap-[var(--gap-sm)]">
                                                        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-info-100)' }}>
                                                            <span className="text-xs font-bold" style={{ color: 'var(--color-info-600)' }}>v{entry.version}</span>
                                                        </div>
                                                        <div>
                                                            <p className="text-[var(--color-texte)]" style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.875rem)' }}>
                                                                {entry.modifiedByName}
                                                            </p>
                                                            <p className="text-[var(--color-texte-muted)]" style={{ fontSize: 'clamp(0.6875rem, 0.62rem + 0.2vw, 0.75rem)' }}>
                                                                {new Date(entry.createdAt).toLocaleString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-[var(--gap-sm)]">
                                                        <div className="text-right" style={{ fontSize: 'clamp(0.6875rem, 0.62rem + 0.2vw, 0.75rem)' }}>
                                                            <span style={{ color: 'var(--color-danger-600)' }}>{JSON.stringify(entry.ancienneValeur)?.substring(0, 30)}</span>
                                                            <span className="mx-1">→</span>
                                                            <span style={{ color: 'var(--color-success-600)' }}>{JSON.stringify(entry.nouvelleValeur)?.substring(0, 30)}</span>
                                                        </div>
                                                        <button
                                                            onClick={() => rollbackMutation.mutate({ cle: cascade.cle, versionId: entry.id })}
                                                            disabled={rollbackMutation.isPending}
                                                            className="p-1.5 rounded-md border border-[var(--color-bordure)] hover:bg-[var(--color-surface-hover)] transition-colors disabled:opacity-50"
                                                            title={t('parametresCascade.restaurerVersion', 'Restaurer cette version')}
                                                        >
                                                            <Undo2 className="h-3.5 w-3.5" style={{ color: 'var(--color-texte-muted)' }} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            ) : (
                                /* Vue cascade 4 niveaux */
                                <>
                                    {/* Valeur résolue */}
                                    <div className="rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-[var(--space-md)]">
                                        <div className="flex items-center justify-between mb-[var(--space-sm)]">
                                            <h3 className="font-semibold text-[var(--color-texte)]" style={{ fontSize: 'clamp(0.875rem, 0.8rem + 0.25vw, 1rem)' }}>
                                                {t('parametresCascade.valeurEffective', 'Valeur effective')}
                                            </h3>
                                            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{
                                                backgroundColor: 'var(--color-success-100)',
                                                color: 'var(--color-success-700)',
                                            }}>
                                                {t(`parametresCascade.niveau_${cascade.niveauResolu}`, cascade.niveauResolu)}
                                            </span>
                                        </div>
                                        <code className="block p-[var(--space-sm)] rounded-md font-mono text-sm" style={{ backgroundColor: 'var(--color-surface-hover)', color: 'var(--color-texte)' }}>
                                            {JSON.stringify(cascade.valeurResolue, null, 2)}
                                        </code>
                                        {cascade.description && (
                                            <p className="mt-[var(--space-xs)] text-[var(--color-texte-muted)]" style={{ fontSize: 'clamp(0.75rem, 0.68rem + 0.25vw, 0.875rem)' }}>
                                                {cascade.description}
                                            </p>
                                        )}
                                    </div>

                                    {/* 4 niveaux */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-[var(--space-md)]">
                                        {cascade.niveaux.map((niveau) => {
                                            const Icon = NIVEAU_ICONS[niveau.niveau] || Globe;
                                            const color = NIVEAU_COLORS[niveau.niveau] || 'var(--color-texte-muted)';
                                            const isEditing = editValues[`${niveau.niveau}-${niveau.scopeId || 'global'}`] !== undefined;

                                            return (
                                                <div key={`${niveau.niveau}-${niveau.scopeId || 'global'}`} className="rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] overflow-hidden">
                                                    <div className="p-[var(--space-sm)] border-b border-[var(--color-bordure)] flex items-center gap-[var(--gap-xs)]" style={{ backgroundColor: 'var(--color-surface-hover)' }}>
                                                        <Icon className="h-4 w-4" style={{ color }} />
                                                        <span className="font-semibold text-[var(--color-texte)]" style={{ fontSize: 'clamp(0.75rem, 0.68rem + 0.25vw, 0.875rem)' }}>
                                                            {niveau.label}
                                                        </span>
                                                        {niveau.hasOverride && (
                                                            <span className="ml-auto text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--color-warning-100)', color: 'var(--color-warning-700)' }}>
                                                                Override
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="p-[var(--space-sm)]">
                                                        <p className="text-[var(--color-texte-muted)] mb-[var(--space-xs)]" style={{ fontSize: 'clamp(0.625rem, 0.56rem + 0.2vw, 0.6875rem)' }}>
                                                            {niveau.source}
                                                        </p>
                                                        {isEditing ? (
                                                            <div className="space-y-[var(--space-xs)]">
                                                                <textarea
                                                                    value={editValues[`${niveau.niveau}-${niveau.scopeId || 'global'}`]}
                                                                    onChange={(e) => setEditValues({ ...editValues, [`${niveau.niveau}-${niveau.scopeId || 'global'}`]: e.target.value })}
                                                                    className="w-full px-2 py-1 border border-[var(--color-bordure)] rounded font-mono text-xs bg-[var(--color-surface)] text-[var(--color-texte)]"
                                                                    rows={3}
                                                                />
                                                                <div className="flex gap-[var(--gap-xs)]">
                                                                    <button
                                                                        onClick={() => {
                                                                            try {
                                                                                const parsed = JSON.parse(editValues[`${niveau.niveau}-${niveau.scopeId || 'global'}`]);
                                                                                if (niveau.niveau === 'global') {
                                                                                    updateGlobalMutation.mutate({ cle: cascade.cle, valeur: parsed });
                                                                                } else if (niveau.scopeId) {
                                                                                    updateOverrideEtabMutation.mutate({ cle: cascade.cle, etabId: niveau.scopeId, valeur: parsed });
                                                                                }
                                                                                setEditValues({ ...editValues, [`${niveau.niveau}-${niveau.scopeId || 'global'}`]: undefined });
                                                                            } catch { /* ignore */ }
                                                                        }}
                                                                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded text-xs text-white"
                                                                        style={{ backgroundColor: 'var(--color-dominant-600)' }}
                                                                    >
                                                                        <Save className="h-3 w-3" />
                                                                        {t('common.sauver', 'Sauver')}
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setEditValues({ ...editValues, [`${niveau.niveau}-${niveau.scopeId || 'global'}`]: undefined })}
                                                                        className="px-2 py-1 rounded text-xs border border-[var(--color-bordure)]"
                                                                    >
                                                                        <X className="h-3 w-3" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div>
                                                                <code className="block p-2 rounded font-mono text-xs break-all" style={{ backgroundColor: 'var(--color-surface-hover)', color: 'var(--color-texte)', fontSize: 'clamp(0.6875rem, 0.62rem + 0.2vw, 0.75rem)' }}>
                                                                    {niveau.valeur !== null && niveau.valeur !== undefined
                                                                        ? JSON.stringify(niveau.valeur, null, 2)
                                                                        : '—'}
                                                                </code>
                                                                {niveau.niveau === 'global' && cascade.propageable && (
                                                                    <button
                                                                        onClick={() => {
                                                                            const key = `${niveau.niveau}-${niveau.scopeId || 'global'}`;
                                                                            setEditValues({ ...editValues, [key]: JSON.stringify(niveau.valeur, null, 2) });
                                                                        }}
                                                                        className="mt-[var(--space-xs)] w-full flex items-center justify-center gap-1 px-2 py-1 rounded text-xs border border-[var(--color-bordure)] hover:bg-[var(--color-surface-hover)] transition-colors"
                                                                        style={{ color: 'var(--color-texte-muted)', fontSize: 'clamp(0.6875rem, 0.62rem + 0.2vw, 0.75rem)' }}
                                                                    >
                                                                        <Edit className="h-3 w-3" />
                                                                        {t('parametresCascade.modifier', 'Modifier')}
                                                                    </button>
                                                                )}
                                                                {niveau.niveau === 'etablissement' && niveau.hasOverride && niveau.scopeId && (
                                                                    <button
                                                                        onClick={() => resetOverrideMutation.mutate({ cle: cascade.cle, etabId: niveau.scopeId! })}
                                                                        disabled={resetOverrideMutation.isPending}
                                                                        className="mt-[var(--space-xs)] w-full flex items-center justify-center gap-1 px-2 py-1 rounded text-xs border border-[var(--color-bordure)] hover:bg-[var(--color-surface-hover)] transition-colors disabled:opacity-50"
                                                                        style={{ color: 'var(--color-danger-600)', fontSize: 'clamp(0.6875rem, 0.62rem + 0.2vw, 0.75rem)' }}
                                                                    >
                                                                        <RotateCcw className="h-3 w-3" />
                                                                        {t('parametresCascade.resetOverride', 'Réinitialiser')}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

// Icône Edit importée conditionnellement
function Edit(props: React.SVGProps<SVGSVGElement> & { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
    );
}

export default ParametresCascadePage;
