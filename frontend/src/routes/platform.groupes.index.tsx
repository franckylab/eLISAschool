/**
 * ==================================
 * eLISAschool - Route Index Platform Groupes
 * ==================================
 * Page liste des groupes plateforme.
 * Refonte v3.0 — miroir de platform.etablissements.index.tsx :
 * PageHeader gradient, stats, Barèmes, quick chips, barre filtres,
 * DataTable avec sélection, pagination, export CSV, actions bulk.
 */

import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { DataTable } from '@/components/ui/DataTable';
import type { Column } from '@/components/ui/DataTable';
import { GroupeFormModal } from '@/features/platform/groupes/GroupeFormModal';
import { BaremesGlobauxSection } from '@/features/platform/groupes/BaremesGlobauxSection';
import type { GroupeSaaS } from '@/features/platform/groupes/types';
import { DEFAUT_PALIERS_GROUPE, initiales, nbMembres, tauxPourPaliers } from '@/features/platform/groupes/types';
import {
    Building2,
    CheckCircle2,
    AlertTriangle,
    Users,
    Plus,
    Eye,
    Edit,
    RefreshCw,
    Download,
    Filter,
    X,
    Percent,
    Network,
    ArrowUp,
    ArrowDown,
    CheckSquare,
    Square,
    Play,
    Pause,
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useConfirmation } from '@/components/ui/ConfirmationModal';
import { apiClient } from '@/lib/api-client';
import {
    useBaremesGlobal,
    useGroupesSaaS,
    useCreateGroupeSaaS,
    useUpdateGroupeSaaS,
    type GroupeSaaSListParams,
} from '@/features/platform/groupes/use-groupes-saas';

// =============================================
// Helpers locaux (comme etablissements MiniStat/QuickChip)
// =============================================

function MiniStat({ icon: Icon, label, value, color, loading }: { icon: typeof Building2; label: string; value: string | number; color: string; loading?: boolean }) {
    if (loading) {
        return (
            <div className="rounded-xl border p-[var(--space-md)] animate-pulse" style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface)' }}>
                <div className="h-3 w-20 rounded mb-2" style={{ backgroundColor: 'var(--color-bordure)' }} />
                <div className="h-6 w-12 rounded" style={{ backgroundColor: 'var(--color-bordure)' }} />
            </div>
        );
    }
    return (
        <div className="rounded-xl border p-[var(--space-md)] flex flex-col gap-1" style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface)' }}>
            <div className="flex items-center gap-1.5">
                <Icon className="h-[var(--icon-xs)] w-[var(--icon-xs)]" style={{ color }} />
                <span className="text-xs font-medium" style={{ color: 'var(--color-texte-muted)' }}>{label}</span>
            </div>
            <span className="text-lg font-bold" style={{ color: 'var(--color-texte)' }}>{value}</span>
        </div>
    );
}

function QuickChip({ label, active, onClick, count, color }: { label: string; active: boolean; onClick: () => void; count?: number | string; color?: string }) {
    return (
        <button
            onClick={onClick}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${active ? 'bg-[var(--color-dominant-600)] text-white border-[var(--color-dominant-600)]' : 'bg-[var(--color-surface)] border-[var(--color-bordure)] hover:bg-[var(--color-surface-hover)]'}`}
            style={!active && color ? { color } : undefined}
            aria-pressed={active}
        >
            {label}
            {count !== undefined && (
                <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] px-1 ${active ? 'bg-white/20 text-white' : 'bg-[var(--color-bordure)] text-[var(--color-texte-muted)]'}`}>
                    {count}
                </span>
            )}
        </button>
    );
}

function PlatformGroupesIndexPage() {
    const { t } = useTranslation('admin');
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const confirm = useConfirmation();

    const [recherche, setRecherche] = useState('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [filtreStatut, setFiltreStatut] = useState<'actif' | 'inactif' | ''>('');
    const [filtreRemise, setFiltreRemise] = useState<'avec' | 'sans' | ''>('');
    
    // Helper to convert filter values for API
    const filtreStatutApi = filtreStatut || undefined;
    const filtreRemiseApi = filtreRemise || undefined;
    const [sortBy, setSortBy] = useState<string>('nom');
    const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [modalOpen, setModalOpen] = useState(false);
    const [groupeToEdit, setGroupeToEdit] = useState<GroupeSaaS | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const params: GroupeSaaSListParams = useMemo(() => ({
        search: recherche || undefined,
        filtreStatut: filtreStatutApi,
        filtreRemise: filtreRemiseApi,
        sortBy,
        sortOrder,
        page,
        limit,
    }), [recherche, filtreStatutApi, filtreRemiseApi, sortBy, sortOrder, page, limit]);

    const { data: paginatedResult, isLoading, isFetching, isError, refetch } = useGroupesSaaS(params);
    const { data: baremesGlobal } = useBaremesGlobal();
    const paliersGlobaux = baremesGlobal?.paliers ?? DEFAUT_PALIERS_GROUPE;

    const creer = useCreateGroupeSaaS();
    const modifier = useUpdateGroupeSaaS();

    const groupesBruts = paginatedResult?.items ?? [];
    const meta = paginatedResult?.meta ?? { total: 0, page: 1, limit: 20, totalPages: 1 };

    // Stats dérivées (sur la page courante, pour affichage rapide)
    const stats = useMemo(() => {
        const total = meta.total;
        // Pour les stats globales, on fait une requête séparée ou on utilise les données de la première page
        // Ici on utilise les données de la page courante comme approximation
        const actifs = groupesBruts.filter(g => g.actif).length;
        const inactifs = groupesBruts.length - actifs;
        const totalMembres = groupesBruts.reduce((s, g) => s + nbMembres(g), 0);
        const avecRemise = groupesBruts.filter(g => g.actif && tauxPourPaliers(paliersGlobaux, nbMembres(g)) > 0).length;
        const sansRemise = actifs - avecRemise;
        return { total, actifs, inactifs, totalMembres, avecRemise, sansRemise };
    }, [groupesBruts, meta, paliersGlobaux]);

    const totalPages = meta.totalPages;
    const pageSafe = Math.min(page, totalPages);
    const donneesPage = groupesBruts;

    const handleSearchChange = useCallback((value: string) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setRecherche(value);
            setPage(1);
        }, 300);
    }, []);

    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, []);

    const handlePageChange = useCallback((p: number) => setPage(p), []);
    const handleLimitChange = useCallback((l: number) => { setLimit(l); setPage(1); }, []);
    const handleSortChange = useCallback((col: string) => { setSortBy(col); setPage(1); }, []);
    const handleSortOrderToggle = useCallback(() => {
        setSortOrder(prev => prev === 'ASC' ? 'DESC' : 'ASC');
    }, []);
    const handleResetFiltres = useCallback(() => {
        setFiltreStatut('');
        setFiltreRemise('');
        setRecherche('');
        setSortBy('nom');
        setSortOrder('ASC');
        setPage(1);
    }, []);
    const handleRefresh = useCallback(() => { refetch(); }, [refetch]);
    const handleCreate = useCallback(() => { setGroupeToEdit(null); setModalOpen(true); }, []);
    const handleEdit = useCallback((g: GroupeSaaS) => { setGroupeToEdit(g); setModalOpen(true); }, []);
    const handleModalClose = useCallback(() => { setModalOpen(false); setGroupeToEdit(null); }, []);
    const handleVoirDetail = useCallback((g: GroupeSaaS) => {
        navigate({ to: '/platform/groupes/$id', params: { id: g.id }, search: { tab: 'membres' } as never });
    }, [navigate]);

    const toggleSelect = useCallback((id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    }, []);
    // Bulk mutations
    const bulkActiver = useMutation({
        mutationFn: async (ids: string[]) => {
            await Promise.all(ids.map(id => apiClient.patch(`/api/platform/facturation/groupes/${id}`, { actif: true })));
            return { count: ids.length };
        },
        onSuccess: (data) => {
            toast.success(`${data.count} groupe(s) réactivé(s)`);
            setSelectedIds(new Set());
            queryClient.invalidateQueries({ queryKey: ['groupes-saas'] });
        },
        onError: () => toast.error('Erreur lors de la réactivation'),
    });
    const bulkDesactiver = useMutation({
        mutationFn: async (ids: string[]) => {
            await Promise.all(ids.map(id => apiClient.patch(`/api/platform/facturation/groupes/${id}`, { actif: false })));
            return { count: ids.length };
        },
        onSuccess: (data) => {
            toast.success(`${data.count} groupe(s) désactivé(s)`);
            setSelectedIds(new Set());
            queryClient.invalidateQueries({ queryKey: ['groupes-saas'] });
        },
        onError: () => toast.error('Erreur lors de la désactivation'),
    });

    const handleBulkActiver = useCallback(() => {
        if (selectedIds.size === 0) return;
        confirm.ask({
            title: t('groupes.bulk.activerTitre', 'Réactiver les groupes'),
            message: t('groupes.bulk.message', '{{count}} groupe(s) sélectionné(s)', { count: selectedIds.size }),
            details: t('groupes.bulk.reactiverDetails', 'Les groupes sélectionnés seront réactivés.'),
            variant: 'info',
            onConfirm: async () => { await bulkActiver.mutateAsync(Array.from(selectedIds)); },
        });
    }, [selectedIds, confirm, bulkActiver]);
    const handleBulkDesactiver = useCallback(() => {
        if (selectedIds.size === 0) return;
        confirm.ask({
            title: t('groupes.bulk.desactiverTitre', 'Désactiver les groupes'),
            message: t('groupes.bulk.message', '{{count}} groupe(s) sélectionné(s)', { count: selectedIds.size }),
            details: t('groupes.bulk.desactiverDetails', 'Les groupes désactivés libèrent leurs membres.'),
            variant: 'danger',
            onConfirm: async () => { await bulkDesactiver.mutateAsync(Array.from(selectedIds)); },
        });
    }, [selectedIds, confirm, bulkDesactiver]);

    const handleExportCSV = useCallback(() => {
        if (!groupesBruts.length) return;
        const headers = [
            t('groupes.export.nom', 'Nom'),
            t('groupes.export.code', 'Code'),
            t('groupes.export.description', 'Description'),
            t('groupes.export.statut', 'Statut'),
            t('groupes.export.membres', 'Membres'),
            t('groupes.export.remise', 'Remise'),
            t('groupes.export.dateCreation', 'Date création'),
        ];
        const rows = groupesBruts.map((g: GroupeSaaS) => {
            const membres = nbMembres(g);
            const remise = g.actif ? tauxPourPaliers(paliersGlobaux, membres) : 0;
            return [
                g.nom,
                g.code,
                g.description ?? '',
                g.actif ? t('groupes.statut.actif', 'Actif') : t('groupes.statut.inactif', 'Inactif'),
                String(membres),
                remise > 0 ? `-${remise}%` : '—',
                g.creeAt ? new Date(g.creeAt).toLocaleDateString(t('common.locale', 'fr-FR')) : '',
            ];
        });
        const escape = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
        const csv = [headers.join(';'), ...rows.map((r: string[]) => r.map(escape).join(';'))].join('\n');
        const bom = '\uFEFF';
        const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `groupes_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Export CSV en cours de téléchargement');
    }, [groupesBruts, paliersGlobaux]);

    // Colonnes DataTable
    const colonnes: Column<GroupeSaaS>[] = [
        {
            key: 'selection',
            header: '',
            className: 'w-8',
            render: (g) => (
                <button onClick={(e) => { e.stopPropagation(); toggleSelect(g.id); }} className="p-0.5" aria-label={`Sélectionner ${g.nom}`}>
                    {selectedIds.has(g.id)
                        ? <CheckSquare className="h-4 w-4" style={{ color: 'var(--color-dominant-600)' }} />
                        : <Square className="h-4 w-4" style={{ color: 'var(--color-texte-muted)' }} />
                    }
                </button>
            ),
        },
        {
            key: 'nom',
            pinned: 'left' as const,
            header: t('groupes.colonnes.nom', 'Groupe'),
            sortable: true,
            render: (g) => (
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[var(--color-dominant-100)] flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-[var(--color-dominant-700)]">{initiales(g.nom)}</span>
                    </div>
                    <div className="min-w-0">
                        <span className="font-semibold truncate block" style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)' }}>{g.nom}</span>
                        {g.description && <p className="text-xs truncate max-w-[220px]" style={{ color: 'var(--color-texte-muted)' }}>{g.description}</p>}
                    </div>
                </div>
            ),
        },
        {
            key: 'code',
            header: t('groupes.colonnes.code', 'Code'),
            sortable: true,
            render: (g) => (
                <code className="px-2 py-1 bg-[var(--color-surface)] border border-[var(--color-bordure)] rounded text-xs font-mono font-medium text-[var(--color-texte)]">{g.code}</code>
            ),
        },
        {
            key: 'membres',
            header: t('groupes.colonnes.membres', 'Membres'),
            sortable: true,
            className: 'text-center',
            render: (g) => (
                <span className="inline-flex items-center gap-1 text-sm font-medium" style={{ color: 'var(--color-texte)' }}>
                    <Users className="h-3.5 w-3.5" style={{ color: 'var(--color-dominant-600)' }} />
                    {nbMembres(g)}
                </span>
            ),
        },
        {
            key: 'statut',
            header: t('groupes.colonnes.statut', 'Statut'),
            sortable: true,
            className: 'text-center',
            render: (g) => (
                <span
                    className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium"
                    style={g.actif
                        ? { backgroundColor: 'var(--color-success-100)', color: 'var(--color-success-700)' }
                        : { backgroundColor: 'var(--color-surface-hover)', color: 'var(--color-texte-muted)' }}
                >
                    {g.actif ? t('groupes.statut.actif', 'Actif') : t('groupes.statut.inactif', 'Inactif')}
                </span>
            ),
        },
        {
            key: 'remise',
            header: t('groupes.colonnes.remise', 'Remise'),
            sortable: true,
            className: 'text-center',
            render: (g) => {
                const pct = g.actif ? tauxPourPaliers(paliersGlobaux, nbMembres(g)) : 0;
                if (pct === 0) return <span className="text-xs" style={{ color: 'var(--color-texte-muted)' }}>—</span>;
                return <span className="text-xs font-semibold" style={{ color: 'var(--color-success-600)' }}>-{pct}%</span>;
            },
        },
        {
            key: 'actions',
            header: '',
            className: 'text-right',
            renderActions: (g) => [
                { key: 'voir', icon: Eye, label: t('common.actions.voir', 'Voir'), onClick: () => handleVoirDetail(g), variant: 'info' as const },
                { key: 'modifier', icon: Edit, label: t('common.actions.modifier', 'Modifier'), onClick: () => handleEdit(g), variant: 'default' as const },
            ],
        },
    ];

    const hasError = isError;

    return (
        <div className="p-[var(--space-lg)] space-y-[var(--space-lg)]">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-bold text-[var(--color-texte)]" style={{ fontSize: 'clamp(1.25rem, 1.1rem + 0.5vw, 1.5rem)' }}>
                        {t('groupes.titre', 'Groupes d’établissements')}
                    </h1>
                    <p style={{ fontSize: 'clamp(0.75rem, 0.68rem + 0.25vw, 0.875rem)', color: 'var(--color-texte-muted)' }}>
                        {t('groupes.description', 'Gérez les groupes logiques et leur configuration SaaS')}
                    </p>
                </div>
                <div className="flex items-center gap-[var(--gap-sm)]">
                    <button
                        onClick={handleExportCSV}
                        className="flex items-center gap-[var(--gap-xxs)] px-[var(--space-sm)] py-[var(--space-sm)] rounded-lg transition-colors hover:opacity-80"
                        style={{ border: '1px solid var(--color-bordure)', color: 'var(--color-texte-muted)' }}
                        title={t('groupes.exporter', 'Exporter CSV')}
                    >
                        <Download className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />
                        <span className="hidden sm:inline text-sm">{t('groupes.exporter', 'CSV')}</span>
                    </button>
                    <button
                        onClick={handleRefresh}
                        className="flex items-center gap-[var(--gap-xxs)] px-[var(--space-sm)] py-[var(--space-sm)] rounded-lg transition-colors hover:opacity-80"
                        style={{ border: '1px solid var(--color-bordure)', color: 'var(--color-texte-muted)' }}
                        title={t('common.actions.rafraichir', 'Rafraîchir')}
                    >
                        <RefreshCw className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />
                    </button>
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-[var(--gap-sm)] px-[var(--space-md)] py-[var(--space-sm)] rounded-lg transition-colors"
                        style={{ backgroundColor: 'var(--color-dominant-600)', color: '#fff', fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.875rem)' }}
                    >
                        <Plus className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />
                        <span className="hidden sm:inline">{t('groupes.creer', 'Nouveau groupe')}</span>
                    </button>
                </div>
            </div>

            {/* Bannière d'erreur */}
            {hasError && (
                <div className="flex items-center gap-[var(--gap-sm)] p-[var(--space-md)] rounded-lg" style={{ backgroundColor: 'var(--color-danger-50)', border: '1px solid var(--color-danger-200)' }}>
                    <AlertTriangle className="h-[var(--icon-sm)] w-[var(--icon-sm)]" style={{ color: 'var(--color-danger-600)' }} />
                    <span className="text-sm" style={{ color: 'var(--color-danger-700)' }}>{t('groupes.erreurChargement', 'Chargement impossible')}</span>
                    <button onClick={handleRefresh} className="ml-auto text-sm font-medium underline" style={{ color: 'var(--color-danger-700)' }}>{t('groupes.reessayer', 'Réessayer')}</button>
                </div>
            )}

            {/* Stats rapides */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-[var(--gap-sm)]">
                <MiniStat icon={Network} label={t('groupes.stats.total', 'Total')} value={stats.total ?? '—'} color="var(--color-info-600)" loading={isLoading} />
                <MiniStat icon={CheckCircle2} label={t('groupes.stats.actifs', 'Actifs')} value={stats.actifs ?? '—'} color="var(--color-success-600)" loading={isLoading} />
                <MiniStat icon={Building2} label={t('groupes.stats.membres', 'Membres')} value={stats.totalMembres?.toLocaleString('fr-FR') ?? '—'} color="var(--color-dominant-600)" loading={isLoading} />
                <MiniStat icon={Percent} label={t('groupes.stats.avecRemise', 'Avec remise')} value={stats.avecRemise ?? '—'} color="var(--color-warning-600)" loading={isLoading} />
            </div>

            {/* Barèmes & plafonds globaux — unique point d'édition globale */}
            <BaremesGlobauxSection />

            {/* Quick filter chips */}
            <div className="flex flex-wrap items-center gap-[var(--gap-xs)]">
                <QuickChip label={t('groupes.filtresRapides.tous', 'Tous')} active={!filtreStatut && !filtreRemise} onClick={() => { setFiltreStatut(''); setFiltreRemise(''); setPage(1); }} count={stats.total} />
                <QuickChip label={t('groupes.filtresRapides.actifs', 'Actifs')} active={filtreStatut === 'actif'} onClick={() => { setFiltreStatut(filtreStatut === 'actif' ? '' : 'actif'); setFiltreRemise(''); setPage(1); }} count={stats.actifs} color="var(--color-success-600)" />
                <QuickChip label={t('groupes.filtresRapides.inactifs', 'Inactifs')} active={filtreStatut === 'inactif'} onClick={() => { setFiltreStatut(filtreStatut === 'inactif' ? '' : 'inactif'); setPage(1); }} count={stats.inactifs} color="var(--color-texte-muted)" />
                <QuickChip label={t('groupes.filtresRapides.avecRemise', 'Avec remise')} active={filtreRemise === 'avec'} onClick={() => { setFiltreRemise(filtreRemise === 'avec' ? '' : 'avec'); setPage(1); }} count={stats.avecRemise} color="var(--color-warning-600)" />
                <QuickChip label={t('groupes.filtresRapides.sansRemise', 'Sans remise')} active={filtreRemise === 'sans'} onClick={() => { setFiltreRemise(filtreRemise === 'sans' ? '' : 'sans'); setPage(1); }} count={stats.sansRemise} color="var(--color-texte-muted)" />
            </div>

            {/* Barre de tri — les chips ci-dessus portent les filtres */}
            <div className="flex flex-wrap items-center gap-[var(--gap-sm)]">
                <Filter className="h-[var(--icon-sm)] w-[var(--icon-sm)]" style={{ color: 'var(--color-texte-muted)' }} />
                <div className="flex items-center rounded-lg border" style={{ borderColor: 'var(--color-bordure)' }}>
                    <select
                        value={sortBy}
                        onChange={(e) => handleSortChange(e.target.value)}
                        className="rounded-l-lg border-0 px-[var(--space-sm)] py-[var(--space-xs)] text-sm focus:outline-none focus:ring-2"
                        style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-texte)', fontSize: 'clamp(0.75rem, 0.68rem + 0.25vw, 0.875rem)' }}
                        aria-label={t('groupes.tri.titre', 'Trier par')}
                    >
                        <option value="nom">{t('groupes.tri.nom', 'Nom')}</option>
                        <option value="code">{t('groupes.tri.code', 'Code')}</option>
                        <option value="membres">{t('groupes.tri.membres', 'Membres')}</option>
                        <option value="remise">{t('groupes.tri.remise', 'Remise')}</option>
                        <option value="statut">{t('groupes.tri.statut', 'Statut')}</option>
                        <option value="date">{t('groupes.tri.date', 'Date création')}</option>
                    </select>
                    <button
                        onClick={handleSortOrderToggle}
                        className="flex items-center justify-center px-[var(--space-xs)] py-[var(--space-xs)] hover:opacity-80"
                        style={{ backgroundColor: 'var(--color-surface-alt)', color: 'var(--color-texte-muted)' }}
                        title={sortOrder === 'ASC' ? t('groupes.tri.croissant', 'Croissant') : t('groupes.tri.decroissant', 'Décroissant')}
                        aria-label={sortOrder === 'ASC' ? t('groupes.tri.croissant', 'Croissant') : t('groupes.tri.decroissant', 'Décroissant')}
                    >
                        {sortOrder === 'ASC' ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
                    </button>
                </div>
                {(filtreStatut || filtreRemise) && (
                    <>
                        <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: 'var(--color-dominant-100)', color: 'var(--color-dominant-700)' }}>{t('groupes.filtres.resultats', '{{count}} résultat(s)', { count: meta.total })}</span>
                        <button onClick={handleResetFiltres} className="flex items-center gap-1 text-xs px-2 py-1 rounded-full border hover:opacity-80" style={{ borderColor: 'var(--color-bordure)', color: 'var(--color-texte-muted)' }}>
                            <X className="h-3 w-3" /> {t('groupes.filtres.effacer', 'Effacer')}
                        </button>
                    </>
                )}
            </div>

            {/* Bulk bar */}
            {selectedIds.size > 0 && (
                <div className="flex flex-wrap items-center gap-[var(--gap-sm)] p-[var(--space-sm)] rounded-lg" style={{ backgroundColor: 'var(--color-dominant-50)', border: '1px solid var(--color-dominant-200)' }}>
                    <span className="text-sm font-medium" style={{ color: 'var(--color-dominant-700)' }}>{t('groupes.bulk.selectionnes', '{{count}} sélectionné(s)', { count: selectedIds.size })}</span>
                    <div className="flex items-center gap-[var(--gap-xs)] ml-auto">
                        <button onClick={handleBulkActiver} className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border hover:opacity-80" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-success-300)', color: 'var(--color-success-700)' }}>
                            <Play className="h-3 w-3" /> {t('groupes.activer', 'Activer')}
                        </button>
                        <button onClick={handleBulkDesactiver} className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border hover:opacity-80" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-warning-300)', color: 'var(--color-warning-700)' }}>
                            <Pause className="h-3 w-3" /> {t('groupes.desactiver', 'Désactiver')}
                        </button>
                        <button onClick={() => setSelectedIds(new Set())} className="p-1 rounded hover:bg-white/50" style={{ color: 'var(--color-texte-muted)' }} aria-label={t('groupes.bulk.effacerSelection', 'Effacer la sélection')}>
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* DataTable */}
            <DataTable
                tableId="groupes-saas"
                data={donneesPage}
                columns={colonnes}
                isLoading={isLoading}
                isFetching={isFetching}
                enableReordering
                enablePinning
                enableColumnVisibility
                searchPlaceholder={t('groupes.recherche.table', 'Rechercher par nom, code ou description…')}
                onSearchChange={handleSearchChange}
                disableClientSearch
                pagination={{ page: pageSafe, limit, total: meta.total, totalPages, hasNext: pageSafe < totalPages, hasPrev: pageSafe > 1 }}
                onPageChange={handlePageChange}
                onLimitChange={handleLimitChange}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortChange={(sb, so) => { setSortBy(sb); setSortOrder(so); }}
                emptyMessage={recherche || filtreStatut || filtreRemise ? t('groupes.table.aucunResultat', 'Aucun groupe ne correspond à la recherche') : t('groupes.table.vide', 'Aucun groupe configuré')}
            />

            {/* Modal création / édition */}
            <GroupeFormModal
                open={modalOpen}
                onOpenChange={(o) => { if (!o) handleModalClose(); else setModalOpen(o); }}
                groupe={groupeToEdit}
                onSubmit={(values) => {
                    if (groupeToEdit) {
                        modifier.mutate({ id: groupeToEdit.id, values }, { onSuccess: () => handleModalClose() });
                    } else {
                        creer.mutate(values, { onSuccess: () => handleModalClose() });
                    }
                }}
                isSubmitting={creer.isPending || modifier.isPending}
            />

            {/* Modal de confirmation (bulk activer/désactiver) */}
            {confirm.ConfirmationModal}
        </div>
    );
}

export const Route = createFileRoute('/platform/groupes/')({
    component: PlatformGroupesIndexPage,
});
