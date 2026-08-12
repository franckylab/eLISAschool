/**
 * ==================================
 * eLISAschool - Dashboard Configuration Cascade v10
 * ==================================
 * Version: 10.0.0
 * Auteur: franck arlos chendjou
 * 
 * Vue plateforme montrant tous les paramètres avec leur valeur effective
 * par établissement, les incohérences détectées, et un éditeur inline.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { 
    Settings, 
    Database, 
    AlertTriangle, 
    CheckCircle2, 
    XCircle, 
    ChevronDown, 
    ChevronRight,
    RefreshCw,
    Filter,
    Search,
    Globe,
    Building2,
    Users,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { motion, AnimatePresence } from 'framer-motion';

export const Route = createFileRoute('/platform/configuration-cascade')({
    component: ConfigurationCascadePage,
});

interface CascadeViewItem {
    cle: string;
    categorie: string;
    module?: string;
    description?: string;
    typeValeur: string;
    valeurGlobale: any;
    valeurGroupe?: any;
    valeurEtablissement?: any;
    valeurEffective: any;
    source: 'etablissement' | 'groupe' | 'global' | 'defaut';
    modifiableRuntime: boolean;
    nbOverridesEtablissement?: number;
    nbOverridesGroupe?: number;
}

interface ConsistencyIssue {
    type: string;
    severity: 'error' | 'warning' | 'info';
    message: string;
    key: string;
    currentValue?: any;
    expectedValue?: any;
    etablissementId?: string | null;
}

function ConfigurationCascadePage() {
    const [selectedEtablissement, setSelectedEtablissement] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategorie, setFilterCategorie] = useState<string>('');
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

    // Fetch cascade view
    const { data: cascadeData, isLoading: isLoadingCascade, refetch: refetchCascade } = useQuery({
        queryKey: ['configuration-cascade', selectedEtablissement],
        queryFn: async () => {
            const params = selectedEtablissement ? `?etablissementId=${selectedEtablissement}` : '';
            const response = await apiClient.get(`/api/configuration/cascade-view${params}`);
            return response.data.data as CascadeViewItem[];
        },
    });

    // Fetch consistency check
    const { data: consistencyData, isLoading: isLoadingConsistency } = useQuery({
        queryKey: ['configuration-consistency'],
        queryFn: async () => {
            const response = await apiClient.get('/api/configuration/consistency-check');
            return response.data.data as {
                totalIssues: number;
                bySeverity: { errors: number; warnings: number; infos: number };
                issues: ConsistencyIssue[];
                status: 'healthy' | 'degraded' | 'critical';
            };
        },
    });

    // Fetch établissements list
    const { data: etablissements } = useQuery({
        queryKey: ['etablissements-list'],
        queryFn: async () => {
            const response = await apiClient.get('/api/etablissements?limit=100');
            return response.data.data as { id: string; nom: string }[];
        },
    });

    // Filter items
    const filteredItems = cascadeData?.filter(item => {
        const matchSearch = !searchQuery || 
            item.cle.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchCategorie = !filterCategorie || item.categorie === filterCategorie;
        return matchSearch && matchCategorie;
    }) ?? [];

    // Group by category
    const itemsByCategory = filteredItems.reduce((acc, item) => {
        const cat = item.categorie || 'AUTRE';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
    }, {} as Record<string, CascadeViewItem[]>);

    const toggleExpand = (cle: string) => {
        setExpandedItems(prev => {
            const next = new Set(prev);
            if (next.has(cle)) {
                next.delete(cle);
            } else {
                next.add(cle);
            }
            return next;
        });
    };

    const getSourceColor = (source: string) => {
        switch (source) {
            case 'etablissement': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'groupe': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
            case 'global': return 'bg-green-500/20 text-green-400 border-green-500/30';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'error': return <XCircle className="w-4 h-4 text-red-400" />;
            case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
            default: return <CheckCircle2 className="w-4 h-4 text-green-400" />;
        }
    };

    return (
        <div className="min-h-screen bg-[var(--color-background)] p-6">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 rounded-xl bg-[var(--color-dominant-600)]/10">
                        <Settings className="w-8 h-8 text-[var(--color-dominant-600)]" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
                            Configuration Cascade
                        </h1>
                        <p className="text-[var(--color-text-secondary)]">
                            Visualisation en cascade des paramètres par établissement
                        </p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-[var(--color-surface)] rounded-xl p-4 border border-[var(--color-border)]">
                        <div className="flex items-center gap-3">
                            <Database className="w-10 h-10 text-blue-500" />
                            <div>
                                <p className="text-2xl font-bold">{cascadeData?.length ?? 0}</p>
                                <p className="text-sm text-[var(--color-text-secondary)]">Paramètres</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-[var(--color-surface)] rounded-xl p-4 border border-[var(--color-border)]">
                        <div className="flex items-center gap-3">
                            <Globe className="w-10 h-10 text-green-500" />
                            <div>
                                <p className="text-2xl font-bold">
                                    {cascadeData?.filter(i => i.source === 'global').length ?? 0}
                                </p>
                                <p className="text-sm text-[var(--color-text-secondary)]">Globaux</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-[var(--color-surface)] rounded-xl p-4 border border-[var(--color-border)]">
                        <div className="flex items-center gap-3">
                            <Building2 className="w-10 h-10 text-blue-500" />
                            <div>
                                <p className="text-2xl font-bold">
                                    {cascadeData?.filter(i => i.source === 'etablissement').length ?? 0}
                                </p>
                                <p className="text-sm text-[var(--color-text-secondary)]">Overrides</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-[var(--color-surface)] rounded-xl p-4 border border-[var(--color-border)]">
                        <div className="flex items-center gap-3">
                            {consistencyData?.status === 'healthy' ? (
                                <CheckCircle2 className="w-10 h-10 text-green-500" />
                            ) : (
                                <AlertTriangle className="w-10 h-10 text-yellow-500" />
                            )}
                            <div>
                                <p className="text-2xl font-bold">{consistencyData?.totalIssues ?? 0}</p>
                                <p className="text-sm text-[var(--color-text-secondary)]">Incohérences</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-[var(--color-surface)] rounded-xl p-4 border border-[var(--color-border)] mb-6">
                <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                            <input
                                type="text"
                                placeholder="Rechercher un paramètre..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-lg bg-[var(--color-surface-alt)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
                            />
                        </div>
                    </div>
                    <select
                        value={filterCategorie}
                        onChange={(e) => setFilterCategorie(e.target.value)}
                        className="px-4 py-2 rounded-lg bg-[var(--color-surface-alt)] border border-[var(--color-border)] text-[var(--color-text-primary)]"
                    >
                        <option value="">Toutes les catégories</option>
                        <option value="SYSTEME">Système</option>
                        <option value="SECURITE">Sécurité</option>
                        <option value="MODULE">Module</option>
                        <option value="NOTIFICATION">Notification</option>
                        <option value="REGIONAL">Régional</option>
                        <option value="CUSTOM">Custom</option>
                    </select>
                    <select
                        value={selectedEtablissement ?? ''}
                        onChange={(e) => setSelectedEtablissement(e.target.value || null)}
                        className="px-4 py-2 rounded-lg bg-[var(--color-surface-alt)] border border-[var(--color-border)] text-[var(--color-text-primary)]"
                    >
                        <option value="">Vue globale</option>
                        {etablissements?.map(etab => (
                            <option key={etab.id} value={etab.id}>{etab.nom}</option>
                        ))}
                    </select>
                    <button
                        onClick={() => refetchCascade()}
                        className="px-4 py-2 rounded-lg bg-[var(--color-dominant-600)] text-white hover:bg-[var(--color-dominant-700)] flex items-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Actualiser
                    </button>
                </div>
            </div>

            {/* Consistency Issues */}
            {consistencyData && consistencyData.totalIssues > 0 && (
                <div className="bg-[var(--color-surface)] rounded-xl p-4 border border-yellow-500/30 mb-6">
                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-yellow-500" />
                        Incohérences détectées ({consistencyData.totalIssues})
                    </h3>
                    <div className="space-y-2">
                        {consistencyData.issues.slice(0, 5).map((issue, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-[var(--color-surface-alt)]">
                                {getSeverityIcon(issue.severity)}
                                <div className="flex-1">
                                    <p className="text-sm text-[var(--color-text-primary)]">{issue.message}</p>
                                    <p className="text-xs text-[var(--color-text-muted)] mt-1">
                                        Clé: {issue.key}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {consistencyData.issues.length > 5 && (
                            <p className="text-sm text-[var(--color-text-secondary)] text-center mt-2">
                                + {consistencyData.issues.length - 5} autres incohérences
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Parameters List */}
            <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
                {isLoadingCascade ? (
                    <div className="p-8 text-center">
                        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[var(--color-dominant-600)]" />
                        <p className="mt-4 text-[var(--color-text-secondary)]">Chargement...</p>
                    </div>
                ) : (
                    <div className="divide-y divide-[var(--color-border)]">
                        {Object.entries(itemsByCategory).map(([categorie, items]) => (
                            <div key={categorie}>
                                <div className="px-4 py-3 bg-[var(--color-surface-alt)] font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                                    <Filter className="w-4 h-4" />
                                    {categorie}
                                    <span className="ml-auto text-sm text-[var(--color-text-muted)]">
                                        {items.length} paramètres
                                    </span>
                                </div>
                                <div className="divide-y divide-[var(--color-border)]">
                                    {items.map((item) => (
                                        <div key={item.cle} className="px-4 py-3">
                                            <div 
                                                className="flex items-center gap-3 cursor-pointer"
                                                onClick={() => toggleExpand(item.cle)}
                                            >
                                                {expandedItems.has(item.cle) ? (
                                                    <ChevronDown className="w-4 h-4 text-[var(--color-text-muted)]" />
                                                ) : (
                                                    <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)]" />
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-mono text-sm text-[var(--color-text-primary)] truncate">
                                                        {item.cle}
                                                    </p>
                                                    {item.description && (
                                                        <p className="text-xs text-[var(--color-text-secondary)] truncate">
                                                            {item.description}
                                                        </p>
                                                    )}
                                                </div>
                                                <span className={`px-2 py-1 rounded text-xs border ${getSourceColor(item.source)}`}>
                                                    {item.source}
                                                </span>
                                                <code className="text-sm text-[var(--color-text-primary)] bg-[var(--color-surface-alt)] px-2 py-1 rounded">
                                                    {typeof item.valeurEffective === 'boolean' 
                                                        ? (item.valeurEffective ? 'true' : 'false')
                                                        : String(item.valeurEffective ?? 'null').slice(0, 30)}
                                                </code>
                                            </div>
                                            <AnimatePresence>
                                                {expandedItems.has(item.cle) && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="mt-3 pl-7 space-y-2"
                                                    >
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                            <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <Globe className="w-4 h-4 text-green-500" />
                                                                    <span className="text-xs font-medium text-green-600">Global</span>
                                                                </div>
                                                                <code className="text-xs text-[var(--color-text-primary)]">
                                                                    {JSON.stringify(item.valeurGlobale)?.slice(0, 50) ?? 'null'}
                                                                </code>
                                                            </div>
                                                            <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/20">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <Users className="w-4 h-4 text-purple-500" />
                                                                    <span className="text-xs font-medium text-purple-600">Groupe</span>
                                                                </div>
                                                                <code className="text-xs text-[var(--color-text-primary)]">
                                                                    {item.valeurGroupe !== undefined 
                                                                        ? JSON.stringify(item.valeurGroupe)?.slice(0, 50) 
                                                                        : 'non défini'}
                                                                </code>
                                                            </div>
                                                            <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <Building2 className="w-4 h-4 text-blue-500" />
                                                                    <span className="text-xs font-medium text-blue-600">Établissement</span>
                                                                </div>
                                                                <code className="text-xs text-[var(--color-text-primary)]">
                                                                    {item.valeurEtablissement !== undefined
                                                                        ? JSON.stringify(item.valeurEtablissement)?.slice(0, 50)
                                                                        : 'non défini'}
                                                                </code>
                                                            </div>
                                                        </div>
                                                        {item.nbOverridesEtablissement !== undefined && (
                                                            <p className="text-xs text-[var(--color-text-muted)]">
                                                                {item.nbOverridesEtablissement} override(s) établissement, 
                                                                {' '}{item.nbOverridesGroupe ?? 0} override(s) groupe
                                                            </p>
                                                        )}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ConfigurationCascadePage;
