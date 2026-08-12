/**
 * ==================================
 * eLISAschool - Route Index Platform Établissements
 * ==================================
 * Page liste des établissements plateforme.
 * Refonte SaaS v2 — avec navigation vers page détail
 */

import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { DataTable } from '@/components/ui/DataTable';
import type { Column } from '@/components/ui/DataTable';
import { EtablissementFormModal } from '@/features/admin/components/etablissement-form-modal';
import { SanteEtablissement } from '@/features/admin/components/sante-etablissement';
import type { SanteEtablissementResult, CategorieSante } from '@/features/admin/components/sante-etablissement';
import type { Etablissement } from '@/features/etablissements/types/etablissement.types';
import {
    TYPE_LABELS,
    SOUS_SYSTEME_LABELS,
    STATUT_LABELS,
    STATUT_STYLES,
    PLAN_LABELS,
} from '@/features/etablissements/types/etablissement.types';
import {
    Building2,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    Users,
    GraduationCap,
    Plus,
    MapPin,
    Phone,
    Eye,
    Edit,
    RefreshCw,
    Download,
    Filter,
    X,
    Play,
    Pause,
    CheckSquare,
    Square,
    ArrowUp,
    ArrowDown,
    Heart,
    type LucideIcon,
} from 'lucide-react';
import { useRecalculerTousSante } from '@/features/platform/hooks/use-etablissement-detail';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useConfirmation } from '@/components/ui/ConfirmationModal';

// =============================================
// Interfaces locales
// =============================================

interface EtablissementStats {
    total: number;
    actifs: number;
    suspendus: number;
    enEssai: number;
    totalEleves: number;
    totalUtilisateurs: number;
    sante: {
        sains: number;
        attention: number;
        critiques: number;
    };
    scoreMoyen: number;
    distributionPlans?: { plan: string; count: number }[];
    distributionTypes?: { type: string; count: number }[];
}

interface EtablissementFiltres {
    page: number;
    limit: number;
    recherche?: string;
    statut?: string;
    type?: string;
    plan?: string;
    sousSysteme?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}

interface EtablissementListeResponse {
    data: Etablissement[];
    meta: {
        totalItems: number;
        currentPage: number;
        totalPages: number;
        itemsPerPage: number;
    };
}

// =============================================
// Hooks
// =============================================

function useEtablissementStats() {
    return useQuery<EtablissementStats | undefined>({
        queryKey: ['platform-etablissements-stats'],
        queryFn: async () => {
            const res = await apiClient.get<EtablissementStats>('/api/platform/etablissements/stats');
            return res.data;
        },
        staleTime: 60_000,
        retry: 2,
    });
}

function useEtablissementsListe(filtres: EtablissementFiltres) {
    return useQuery<EtablissementListeResponse | undefined>({
        queryKey: ['platform-etablissements-liste', filtres],
        queryFn: async () => {
            const params: Record<string, string> = {
                page: String(filtres.page),
                limit: String(filtres.limit),
            };
            if (filtres.recherche) params.recherche = filtres.recherche;
            if (filtres.statut) params.statut = filtres.statut;
            if (filtres.type) params.type = filtres.type;
            if (filtres.plan) params.plan = filtres.plan;
            if (filtres.sousSysteme) params.sousSysteme = filtres.sousSysteme;
            if (filtres.sortBy) params.sortBy = filtres.sortBy;
            if (filtres.sortOrder) params.sortOrder = filtres.sortOrder;
            // Inclure les scores santé inline (évite un fetch séparé /sante)
            params.inclureSante = 'true';

            const res = await apiClient.get<Etablissement[]>('/api/platform/etablissements', params);
            const rawData = res.data;
            const rawMeta = res.meta;

            if (Array.isArray(rawData)) {
                return {
                    data: rawData,
                    meta: rawMeta ?? {
                        totalItems: rawData.length,
                        currentPage: filtres.page,
                        totalPages: 1,
                        itemsPerPage: filtres.limit,
                    },
                } satisfies EtablissementListeResponse;
            }

            return undefined;
        },
        staleTime: 30_000,
        retry: 2,
    });
}

function useSanteEtablissements() {
    return useQuery<SanteEtablissementResult[]>({
        queryKey: ['platform-etablissements-sante'],
        queryFn: async () => {
            const res = await apiClient.get<SanteEtablissementResult[]>('/api/platform/etablissements/sante');
            return res.data || [];
        },
        staleTime: 5 * 60_000,
        retry: 2,
    });
}

interface TendanceSante {
    etablissementId: string;
    score: number;
    tendance: 'hausse' | 'baisse' | 'stable' | null;
    diff: number | null;
}

function useTendancesSante() {
    return useQuery<TendanceSante[]>({
        queryKey: ['platform-etablissements-tendances'],
        queryFn: async () => {
            const res = await apiClient.get<TendanceSante[]>('/api/platform/etablissements/sante/tendances');
            return res.data || [];
        },
        staleTime: 5 * 60_000,
        retry: 1,
    });
}

// =============================================
// Composant principal
// =============================================

function PlatformEtablissementsIndexPage() {
    const { t } = useTranslation('admin');
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const confirm = useConfirmation();
    const [filtres, setFiltres] = useState<EtablissementFiltres>({ page: 1, limit: 20, recherche: '', sortBy: 'nom', sortOrder: 'ASC' });
    const [modalOpen, setModalOpen] = useState(false);
    const [etablissementToEdit, setEtablissementToEdit] = useState<Etablissement | null>(null);
    const [filtreSante, setFiltreSante] = useState<CategorieSante | 'tous'>('tous');
    const [filtreStatut, setFiltreStatut] = useState<string>('');
    const [filtreType, setFiltreType] = useState<string>('');
    const [filtrePlan, setFiltrePlan] = useState<string>('');
    const [filtreSousSysteme, setFiltreSousSysteme] = useState<string>('');
    const [sortBy, setSortBy] = useState<string>('nom');
    const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [rechercheLocale, setRechercheLocale] = useState('');
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const { data: stats, isLoading: statsLoading, isError: statsError, refetch: refetchStats } = useEtablissementStats();
    const { data: liste, isLoading: listeLoading, isError: listeError, refetch: refetchListe } = useEtablissementsListe(filtres);
    const { data: santeScores = [], refetch: refetchSante } = useSanteEtablissements();
    const { data: tendancesSante = [] } = useTendancesSante();
    const recalculerTousSante = useRecalculerTousSante();

    const santeMap = new Map(santeScores.map(s => [s.etablissementId, s]));
    const tendanceMap = new Map(tendancesSante.map(t => [t.etablissementId, t]));

    // Données filtrées (le tri scoreSante est maintenant géré nativement par le backend)
    const donneesFiltrees = useMemo(() => {
        return (liste?.data || []).filter(e => {
            if (filtreSante === 'tous') return true;
            const sante = santeMap.get(e.id);
            return sante?.categorie === filtreSante;
        });
    }, [liste?.data, filtreSante, santeMap]);

    const handleSearchChange = useCallback((recherche: string) => {
        setRechercheLocale(recherche);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setFiltres(prev => ({ ...prev, recherche, page: 1 }));
        }, 300);
    }, []);

    // Nettoyage du timer debounce au démontage
    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, []);

    const handlePageChange = useCallback((page: number) => {
        setFiltres(prev => ({ ...prev, page }));
    }, []);

    const handleLimitChange = useCallback((limit: number) => {
        setFiltres(prev => ({ ...prev, limit, page: 1 }));
    }, []);

    const handleModalClose = useCallback(() => {
        setModalOpen(false);
        setEtablissementToEdit(null);
    }, []);

    const handleEdit = useCallback((e: Etablissement) => {
        setEtablissementToEdit(e);
        setModalOpen(true);
    }, []);

    const handleCreate = useCallback(() => {
        setEtablissementToEdit(null);
        setModalOpen(true);
    }, []);

    const handleRefresh = useCallback(() => {
        refetchStats();
        refetchListe();
        refetchSante();
    }, [refetchStats, refetchListe, refetchSante]);

    const handleStatutChange = useCallback((statut: string) => {
        setFiltreStatut(statut);
        setFiltres(prev => ({ ...prev, statut: statut || undefined, page: 1 }));
    }, []);

    const handleTypeChange = useCallback((type: string) => {
        setFiltreType(type);
        setFiltres(prev => ({ ...prev, type: type || undefined, page: 1 }));
    }, []);

    const handlePlanChange = useCallback((plan: string) => {
        setFiltrePlan(plan);
        setFiltres(prev => ({ ...prev, plan: plan || undefined, page: 1 }));
    }, []);

    const handleSousSystemeChange = useCallback((sousSysteme: string) => {
        setFiltreSousSysteme(sousSysteme);
        setFiltres(prev => ({ ...prev, sousSysteme: sousSysteme || undefined, page: 1 }));
    }, []);

    const handleSortChange = useCallback((nouveauTri: string) => {
        setSortBy(nouveauTri);
        setFiltres(prev => ({ ...prev, sortBy: nouveauTri, page: 1 }));
    }, []);

    const handleSortOrderToggle = useCallback(() => {
        setSortOrder(prev => {
            const next = prev === 'ASC' ? 'DESC' : 'ASC';
            setFiltres(f => ({ ...f, sortOrder: next }));
            return next;
        });
    }, []);

    const handleResetFiltres = useCallback(() => {
        setFiltreStatut('');
        setFiltreType('');
        setFiltrePlan('');
        setFiltreSousSysteme('');
        setFiltreSante('tous');
        setSortBy('nom');
        setSortOrder('ASC');
        setFiltres(prev => ({ ...prev, statut: undefined, type: undefined, plan: undefined, sousSysteme: undefined, sortBy: 'nom', sortOrder: 'ASC', page: 1 }));
    }, []);

    // Mutations bulk (endpoints backend transactionnels)
    const bulkActiver = useMutation({
        mutationFn: async (ids: string[]) => {
            const res = await apiClient.post<{ data: { ids: string[]; count: number } }>('/api/platform/etablissements/bulk/activer', { ids });
            return res.data.data;
        },
        onSuccess: (data) => {
            toast.success(`${data.count} établissement(s) réactivé(s)`);
            setSelectedIds(new Set());
            queryClient.invalidateQueries({ queryKey: ['platform-etablissements-liste'] });
            queryClient.invalidateQueries({ queryKey: ['platform-etablissements-stats'] });
        },
        onError: () => toast.error('Erreur lors de la réactivation'),
    });

    const bulkDesactiver = useMutation({
        mutationFn: async (ids: string[]) => {
            const res = await apiClient.post<{ data: { ids: string[]; count: number } }>('/api/platform/etablissements/bulk/desactiver', { ids });
            return res.data.data;
        },
        onSuccess: (data) => {
            toast.success(`${data.count} établissement(s) désactivé(s)`);
            setSelectedIds(new Set());
            queryClient.invalidateQueries({ queryKey: ['platform-etablissements-liste'] });
            queryClient.invalidateQueries({ queryKey: ['platform-etablissements-stats'] });
        },
        onError: () => toast.error('Erreur lors de la désactivation'),
    });

    // Handlers sélection
    const toggleSelect = useCallback((id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    }, []);

    const toggleSelectAll = useCallback(() => {
        const allIds = donneesFiltrees.map(e => e.id);
        setSelectedIds(prev => prev.size === allIds.length ? new Set() : new Set(allIds));
    }, [donneesFiltrees]);

    const handleBulkActiver = useCallback(() => {
        if (selectedIds.size === 0) return;
        confirm.ask({
            title: 'Réactiver les établissements',
            message: `${selectedIds.size} établissement(s) sélectionné(s)`,
            details: 'Les établissements sélectionnés seront réactivés.',
            variant: 'info',
            onConfirm: () => bulkActiver.mutateAsync(Array.from(selectedIds)),
        });
    }, [selectedIds, confirm, bulkActiver]);

    const handleBulkDesactiver = useCallback(() => {
        if (selectedIds.size === 0) return;
        confirm.ask({
            title: 'Désactiver les établissements',
            message: `${selectedIds.size} établissement(s) sélectionné(s)`,
            details: 'Les utilisateurs ne pourront plus accéder à la plateforme.',
            variant: 'danger',
            onConfirm: () => bulkDesactiver.mutateAsync(Array.from(selectedIds)),
        });
    }, [selectedIds, confirm, bulkDesactiver]);

    const handleExportCSV = useCallback(() => {
        // Construire les query params avec les filtres actifs
        const params: Record<string, string> = {};
        if (filtres.recherche) params.recherche = filtres.recherche;
        if (filtres.statut) params.statut = filtres.statut;
        if (filtres.type) params.type = filtres.type;
        if (filtres.plan) params.plan = filtres.plan;
        if (filtres.sousSysteme) params.sousSysteme = filtres.sousSysteme;

        // Télécharger via l'endpoint serveur
        const queryString = new URLSearchParams(params).toString();
        const url = `/api/platform/etablissements/export${queryString ? `?${queryString}` : ''}`;
        window.open(url, '_blank');
        toast.success('Export CSV en cours de téléchargement');
    }, [filtres]);

    const handleVoirDetail = useCallback((e: Etablissement) => {
        navigate({
            to: '/platform/etablissements/$id',
            params: { id: e.id },
            search: { tab: 'identite' },
        });
    }, [navigate]);

    // Colonnes DataTable
    const allSelected = donneesFiltrees.length > 0 && selectedIds.size === donneesFiltrees.length;

    const colonnes: Column<Etablissement>[] = [
        {
            key: 'selection',
            header: '',
            className: 'w-8',
            render: (e) => (
                <button onClick={(ev) => { ev.stopPropagation(); toggleSelect(e.id); }} className="p-0.5">
                    {selectedIds.has(e.id)
                        ? <CheckSquare className="h-4 w-4" style={{ color: 'var(--color-dominant-600)' }} />
                        : <Square className="h-4 w-4" style={{ color: 'var(--color-texte-muted)' }} />
                    }
                </button>
            ),
        },
        {
            key: 'nom',
            pinned: 'left' as const,
            header: t('etablissements.colonnes.nom', 'Établissement'),
            sortable: true,
            render: (e) => (
                <div>
                    <span className="font-semibold" style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)' }}>{e.nom}</span>
                    {e.slogan && <p className="text-xs" style={{ color: 'var(--color-texte-muted)' }}>{e.slogan}</p>}
                </div>
            ),
        },
        {
            key: 'ville',
            header: t('etablissements.colonnes.ville', 'Ville'),
            sortable: true,
            render: (e) => (
                <span className="flex items-center gap-[var(--gap-xxs)] text-sm" style={{ color: 'var(--color-texte-muted)' }}>
                    <MapPin className="h-[var(--icon-xxs)] w-[var(--icon-xxs)]" />
                    {e.ville || '—'}
                </span>
            ),
        },
        {
            key: 'contactTelephone',
            header: t('etablissements.colonnes.telephone', 'Téléphone'),
            render: (e) => (
                <span className="flex items-center gap-[var(--gap-xxs)] text-sm" style={{ color: 'var(--color-texte-muted)' }}>
                    <Phone className="h-[var(--icon-xxs)] w-[var(--icon-xxs)]" />
                    {e.contactTelephone || '—'}
                </span>
            ),
        },
        {
            key: 'type',
            header: t('etablissements.colonnes.type', 'Type'),
            render: (e) => <span className="text-sm">{TYPE_LABELS[e.type || ''] || e.type || '—'}</span>,
        },
        {
            key: 'sousSysteme',
            header: t('etablissements.colonnes.systeme', 'Système'),
            render: (e) => <span className="text-sm">{SOUS_SYSTEME_LABELS[e.sousSysteme || ''] || e.sousSysteme || '—'}</span>,
        },
        {
            key: 'plan',
            header: t('etablissements.colonnes.plan', 'Plan'),
            render: (e) => {
                const plan = e.configuration?.planAbonnement;
                if (!plan) return <span className="text-xs" style={{ color: 'var(--color-texte-muted)' }}>—</span>;
                const planColors: Record<string, string> = {
                    gratuit: 'bg-gray-100 text-gray-700',
                    standard: 'bg-blue-100 text-blue-700',
                    premium: 'bg-purple-100 text-purple-700',
                    entreprise: 'bg-amber-100 text-amber-700',
                };
                return (
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${planColors[plan] || 'bg-gray-100 text-gray-700'}`}>
                        {PLAN_LABELS[plan] || plan}
                    </span>
                );
            },
        },
        {
            key: 'effectif',
            header: t('etablissements.colonnes.effectif', 'Effectif'),
            className: 'text-center',
            render: (e) => {
                if (!e.effectifActuel && !e.effectifMax) return <span className="text-xs" style={{ color: 'var(--color-texte-muted)' }}>—</span>;
                const pct = e.effectifActuel && e.effectifMax ? Math.round((e.effectifActuel / e.effectifMax) * 100) : 0;
                const color = pct > 85 ? 'var(--color-danger-600)' : pct > 60 ? 'var(--color-warning-600)' : 'var(--color-success-600)';
                return (
                    <div className="flex flex-col items-center gap-0.5">
                        <span className="text-xs font-medium" style={{ color: 'var(--color-texte)' }}>
                            {e.effectifActuel?.toLocaleString('fr-FR') ?? '—'}{e.effectifMax ? ` / ${e.effectifMax.toLocaleString('fr-FR')}` : ''}
                        </span>
                        {pct > 0 && (
                            <div className="w-full max-w-[60px] h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-bordure)' }}>
                                <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }} />
                            </div>
                        )}
                    </div>
                );
            },
        },
        {
            key: 'statut',
            header: t('etablissements.colonnes.statut', 'Statut'),
            sortable: true,
            className: 'text-center',
            render: (e) => {
                const statut = e.statut || 'INACTIF';
                return (
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${STATUT_STYLES[statut] || 'bg-gray-100 text-gray-800'}`}>
                        {STATUT_LABELS[statut] || statut}
                    </span>
                );
            },
        },
        {
            key: 'sante',
            header: t('etablissements.colonnes.sante', 'Santé'),
            className: 'text-center',
            render: (e) => {
                const sante = santeMap.get(e.id);
                if (!sante) return <span className="text-xs" style={{ color: 'var(--color-texte-muted)' }}>—</span>;
                const tendance = tendanceMap.get(e.id);
                return (
                    <div className="inline-flex flex-col items-center gap-0.5">
                        <SanteEtablissement variant="badge" score={sante.score} categorie={sante.categorie} />
                        {tendance?.tendance && (
                            <span className="inline-flex items-center gap-0.5 text-[0.6rem] font-medium" style={{
                                color: tendance.tendance === 'hausse' ? 'var(--color-success-600)'
                                    : tendance.tendance === 'baisse' ? 'var(--color-danger-600)'
                                    : 'var(--color-texte-muted)',
                            }}>
                                {tendance.tendance === 'hausse' ? <ArrowUp className="h-2.5 w-2.5" />
                                    : tendance.tendance === 'baisse' ? <ArrowDown className="h-2.5 w-2.5" />
                                    : null}
                                {tendance.diff !== null && tendance.diff !== 0 && (
                                    <span>{tendance.diff > 0 ? '+' : ''}{tendance.diff}</span>
                                )}
                            </span>
                        )}
                    </div>
                );
            },
        },
        {
            key: 'actions',
            header: '',
            className: 'text-right',
            renderActions: (e) => [
                {
                    key: 'voir',
                    icon: Eye,
                    label: t('common.actions.voir', 'Voir'),
                    onClick: () => handleVoirDetail(e),
                    variant: 'info' as const,
                },
                {
                    key: 'modifier',
                    icon: Edit,
                    label: t('common.actions.modifier', 'Modifier'),
                    onClick: () => handleEdit(e),
                    variant: 'default' as const,
                },
            ],
        },
    ];

    const hasError = statsError || listeError;

    return (
        <div className="p-[var(--space-lg)] space-y-[var(--space-lg)]">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-bold text-[var(--color-texte)]" style={{ fontSize: 'clamp(1.25rem, 1.1rem + 0.5vw, 1.5rem)' }}>
                        {t('etablissements.titre', 'Établissements')}
                    </h1>
                    <p style={{ fontSize: 'clamp(0.75rem, 0.68rem + 0.25vw, 0.875rem)', color: 'var(--color-texte-muted)' }}>
                        {t('etablissements.sousTitrePlateforme', 'Gestion des établissements clients de la plateforme')}
                    </p>
                </div>
                <div className="flex items-center gap-[var(--gap-sm)]">
                    <button
                        onClick={handleExportCSV}
                        className="flex items-center gap-[var(--gap-xxs)] px-[var(--space-sm)] py-[var(--space-sm)] rounded-lg transition-colors hover:opacity-80"
                        style={{ border: '1px solid var(--color-bordure)', color: 'var(--color-texte-muted)' }}
                        title={t('etablissements.exporter', 'Exporter CSV')}
                    >
                        <Download className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />
                        <span className="hidden sm:inline text-sm">{t('etablissements.exporter', 'CSV')}</span>
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
                        onClick={() => recalculerTousSante.mutate()}
                        disabled={recalculerTousSante.isPending}
                        className="flex items-center gap-[var(--gap-xxs)] px-[var(--space-sm)] py-[var(--space-sm)] rounded-lg transition-colors hover:opacity-80 disabled:opacity-50"
                        style={{ border: '1px solid var(--color-success-200)', color: 'var(--color-success-700)', backgroundColor: 'var(--color-success-50, #f0fdf4)' }}
                        title={t('etablissements.recalculerTousSante', 'Recalculer tous les scores de santé')}
                    >
                        <Heart className={`h-[var(--icon-sm)] w-[var(--icon-sm)] ${recalculerTousSante.isPending ? 'animate-pulse' : ''}`} />
                        <span className="hidden lg:inline text-sm">{t('etablissements.recalculerTousSante', 'Recalculer santé')}</span>
                    </button>
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-[var(--gap-sm)] px-[var(--space-md)] py-[var(--space-sm)] rounded-lg transition-colors"
                        style={{ backgroundColor: 'var(--color-dominant-600)', color: '#fff', fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.875rem)' }}
                    >
                        <Plus className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />
                        {t('etablissements.creer', 'Créer un établissement')}
                    </button>
                </div>
            </div>

            {/* Bannière d'erreur */}
            {hasError && (
                <div className="flex items-center gap-[var(--gap-sm)] p-[var(--space-md)] rounded-lg" style={{ backgroundColor: 'var(--color-danger-50)', border: '1px solid var(--color-danger-200)' }}>
                    <AlertTriangle className="h-[var(--icon-sm)] w-[var(--icon-sm)]" style={{ color: 'var(--color-danger-600)' }} />
                    <span className="text-sm" style={{ color: 'var(--color-danger-700)' }}>
                        {t('etablissements.erreurChargement', 'Erreur lors du chargement des données.')}
                    </span>
                    <button
                        onClick={handleRefresh}
                        className="ml-auto text-sm font-medium underline"
                        style={{ color: 'var(--color-danger-700)' }}
                    >
                        {t('common.actions.reessayer', 'Réessayer')}
                    </button>
                </div>
            )}

            {/* Stats rapides */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-[var(--gap-sm)]">
                <MiniStat icon={Building2} label={t('etablissements.stats.total', 'Total')} value={stats?.total ?? '—'} color="var(--color-info-600)" loading={statsLoading} />
                <MiniStat icon={CheckCircle2} label={t('etablissements.stats.actifs', 'Actifs')} value={stats?.actifs ?? '—'} color="var(--color-success-600)" loading={statsLoading} />
                <MiniStat icon={AlertTriangle} label={t('etablissements.stats.enEssai', 'En essai')} value={stats?.enEssai ?? '—'} color="var(--color-warning-600)" loading={statsLoading} />
                <MiniStat icon={XCircle} label={t('etablissements.stats.suspendus', 'Suspendus')} value={stats?.suspendus ?? '—'} color="var(--color-danger-600)" loading={statsLoading} />
                <MiniStat icon={GraduationCap} label={t('etablissements.stats.eleves', 'Élèves')} value={stats?.totalEleves?.toLocaleString('fr-FR') ?? '—'} color="var(--color-accent-600)" loading={statsLoading} />
                <MiniStat icon={Users} label={t('etablissements.stats.utilisateurs', 'Utilisateurs')} value={stats?.totalUtilisateurs?.toLocaleString('fr-FR') ?? '—'} color="var(--color-info-600)" loading={statsLoading} />
                <SanteEtablissement
                    variant="score"
                    score={stats?.scoreMoyen}
                    resume={stats?.sante ? { ...stats.sante, scoreMoyen: stats.scoreMoyen ?? 0, total: stats.total } : undefined}
                    loading={statsLoading}
                />
            </div>

            {/* Santé — barre résumé */}
            {stats?.sante && (
                <SanteEtablissement
                    variant="barre"
                    resume={{
                        sains: stats.sante.sains,
                        attention: stats.sante.attention,
                        critiques: stats.sante.critiques,
                        scoreMoyen: stats.scoreMoyen ?? 0,
                        total: stats.total,
                    }}
                />
            )}

            {/* Tendances santé — résumé compact */}
            {tendancesSante.length > 0 && (() => {
                const nbHausse = tendancesSante.filter(t => t.tendance === 'hausse').length;
                const nbBaisse = tendancesSante.filter(t => t.tendance === 'baisse').length;
                const nbStable = tendancesSante.filter(t => t.tendance === 'stable').length;
                const nbSansHist = tendancesSante.filter(t => !t.tendance).length;
                const totalT = tendancesSante.length;
                return (
                    <div className="flex flex-wrap items-center gap-[var(--gap-sm)] rounded-lg border px-[clamp(0.625rem,0.5rem+0.3vw,1rem)] py-[var(--space-sm)]"
                        style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface)' }}>
                        <span className="text-xs font-medium" style={{ color: 'var(--color-texte-muted)' }}>
                            {t('etablissements.stats.tendances', 'Tendances')} :
                        </span>
                        {nbHausse > 0 && (
                            <span className="inline-flex items-center gap-0.5 text-xs font-medium" style={{ color: 'var(--color-success-600)' }}>
                                <ArrowUp className="h-3 w-3" /> {nbHausse} {t('etablissements.colonnes.tendanceHausse', 'en hausse')}
                            </span>
                        )}
                        {nbBaisse > 0 && (
                            <span className="inline-flex items-center gap-0.5 text-xs font-medium" style={{ color: 'var(--color-danger-600)' }}>
                                <ArrowDown className="h-3 w-3" /> {nbBaisse} {t('etablissements.colonnes.tendanceBaisse', 'en baisse')}
                            </span>
                        )}
                        {nbStable > 0 && (
                            <span className="inline-flex items-center gap-0.5 text-xs font-medium" style={{ color: 'var(--color-texte-muted)' }}>
                                {nbStable} {t('etablissements.colonnes.tendanceStable', 'stables')}
                            </span>
                        )}
                        {nbSansHist > 0 && (
                            <span className="text-xs" style={{ color: 'var(--color-texte-muted)', opacity: 0.7 }}>
                                · {nbSansHist} sans historique
                            </span>
                        )}
                        {/* Mini barre de répartition */}
                        <div className="ml-auto flex items-center gap-[var(--gap-xxs)]">
                            <div className="w-[clamp(60px,10vw,120px)] h-1.5 rounded-full overflow-hidden flex" style={{ backgroundColor: 'var(--color-bordure)' }}>
                                {nbHausse > 0 && <div style={{ width: `${(nbHausse / totalT) * 100}%`, backgroundColor: 'var(--color-success-500)' }} className="h-full" />}
                                {nbStable > 0 && <div style={{ width: `${(nbStable / totalT) * 100}%`, backgroundColor: 'var(--color-texte-muted)' }} className="h-full" />}
                                {nbBaisse > 0 && <div style={{ width: `${(nbBaisse / totalT) * 100}%`, backgroundColor: 'var(--color-danger-500)' }} className="h-full" />}
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Distributions plans et types */}
            {((stats?.distributionPlans && stats.distributionPlans.length > 0) || (stats?.distributionTypes && stats.distributionTypes.length > 0)) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-[var(--gap-md)]">
                    {/* Distribution des plans */}
                    {stats?.distributionPlans && stats.distributionPlans.length > 0 && (
                        <div className="rounded-xl border p-[clamp(0.75rem,0.6rem+0.4vw,1.25rem)]" style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface)' }}>
                            <h3 className="text-xs font-semibold mb-[var(--space-sm)]" style={{ color: 'var(--color-texte)' }}>
                                {t('etablissements.stats.distributionPlans', 'Répartition par plan')}
                            </h3>
                            <div className="space-y-1.5">
                                {stats.distributionPlans.slice(0, 5).map(({ plan, count }) => {
                                    const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
                                    const label = PLAN_LABELS[plan] || plan;
                                    const colors: Record<string, string> = {
                                        gratuit: 'var(--color-texte-muted)',
                                        standard: 'var(--color-info-500)',
                                        premium: 'var(--color-accent-500)',
                                        enterprise: 'var(--color-dominant-500)',
                                    };
                                    return (
                                        <div key={plan} className="flex items-center gap-[var(--gap-xs)]">
                                            <span className="text-xs w-20 truncate capitalize" style={{ color: 'var(--color-texte-muted)' }}>{label}</span>
                                            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-bordure)' }}>
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${pct}%` }}
                                                    transition={{ duration: 0.5 }}
                                                    className="h-full rounded-full"
                                                    style={{ backgroundColor: colors[plan] || 'var(--color-dominant-500)' }}
                                                />
                                            </div>
                                            <span className="text-xs font-medium w-6 text-right" style={{ color: 'var(--color-texte)' }}>{count}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                    {/* Distribution des types */}
                    {stats?.distributionTypes && stats.distributionTypes.length > 0 && (
                        <div className="rounded-xl border p-[clamp(0.75rem,0.6rem+0.4vw,1.25rem)]" style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface)' }}>
                            <h3 className="text-xs font-semibold mb-[var(--space-sm)]" style={{ color: 'var(--color-texte)' }}>
                                {t('etablissements.stats.distributionTypes', 'Répartition par type')}
                            </h3>
                            <div className="space-y-1.5">
                                {stats.distributionTypes.slice(0, 5).map(({ type, count }) => {
                                    const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
                                    const label = TYPE_LABELS[type] || type;
                                    const typeColors: Record<string, string> = {
                                        PRIVE: 'var(--color-accent-500)',
                                        PUBLIC: 'var(--color-info-500)',
                                        MIXTE: 'var(--color-warning-500)',
                                        MATERNELLE: 'var(--color-success-500)',
                                        PRIMAIRE: 'var(--color-dominant-500)',
                                        SECONDAIRE: 'var(--color-purple-500, #a855f7)',
                                        TECHNIQUE: 'var(--color-teal-500, #14b8a6)',
                                        AUTRE: 'var(--color-texte-muted)',
                                    };
                                    return (
                                        <div key={type} className="flex items-center gap-[var(--gap-xs)]">
                                            <span className="text-xs w-20 truncate" style={{ color: 'var(--color-texte-muted)' }}>{label}</span>
                                            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-bordure)' }}>
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${pct}%` }}
                                                    transition={{ duration: 0.5 }}
                                                    className="h-full rounded-full"
                                                    style={{ backgroundColor: typeColors[type] || 'var(--color-accent-500)' }}
                                                />
                                            </div>
                                            <span className="text-xs font-medium w-6 text-right" style={{ color: 'var(--color-texte)' }}>{count}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Quick filter chips */}
            <div className="flex flex-wrap items-center gap-[var(--gap-xs)]">
                <QuickChip
                    label={t('etablissements.filtresRapides.tous', 'Tous')}
                    active={!filtreStatut && filtreSante === 'tous'}
                    onClick={() => { setFiltreStatut(''); setFiltreSante('tous'); setFiltres(prev => ({ ...prev, statut: undefined, page: 1 })); }}
                    count={stats?.total}
                />
                <QuickChip
                    label={t('etablissements.filtresRapides.actifs', 'Actifs')}
                    active={filtreStatut === 'ACTIF'}
                    onClick={() => handleStatutChange(filtreStatut === 'ACTIF' ? '' : 'ACTIF')}
                    count={stats?.actifs}
                    color="var(--color-success-600)"
                />
                <QuickChip
                    label={t('etablissements.filtresRapides.enEssai', 'En essai')}
                    active={filtreStatut === 'EN_ATTENTE_VALIDATION'}
                    onClick={() => handleStatutChange(filtreStatut === 'EN_ATTENTE_VALIDATION' ? '' : 'EN_ATTENTE_VALIDATION')}
                    count={stats?.enEssai}
                    color="var(--color-warning-600)"
                />
                <QuickChip
                    label={t('etablissements.filtresRapides.sains', 'Sains')}
                    active={filtreSante === 'sain'}
                    onClick={() => setFiltreSante(filtreSante === 'sain' ? 'tous' : 'sain')}
                    count={stats?.sante?.sains}
                    color="var(--color-success-600)"
                />
                <QuickChip
                    label={t('etablissements.filtresRapides.attention', 'Attention')}
                    active={filtreSante === 'attention'}
                    onClick={() => setFiltreSante(filtreSante === 'attention' ? 'tous' : 'attention')}
                    count={stats?.sante?.attention}
                    color="var(--color-warning-600)"
                />
                <QuickChip
                    label={t('etablissements.filtresRapides.critiques', 'Critiques')}
                    active={filtreSante === 'critique'}
                    onClick={() => setFiltreSante(filtreSante === 'critique' ? 'tous' : 'critique')}
                    count={stats?.sante?.critiques}
                    color="var(--color-danger-600)"
                />
                {/* Séparateur */}
                {stats?.distributionPlans && stats.distributionPlans.length > 0 && (
                    <span className="w-px h-5 mx-1" style={{ backgroundColor: 'var(--color-bordure)' }} />
                )}
                {/* Chips par plan */}
                {stats?.distributionPlans?.map(({ plan, count }) => {
                    const planColors: Record<string, string> = {
                        gratuit: 'var(--color-texte-muted)',
                        standard: 'var(--color-info-600)',
                        premium: 'var(--color-accent-600)',
                        enterprise: 'var(--color-warning-600)',
                    };
                    return (
                        <QuickChip
                            key={plan}
                            label={PLAN_LABELS[plan] || plan}
                            active={filtrePlan === plan}
                            onClick={() => handlePlanChange(filtrePlan === plan ? '' : plan)}
                            count={count}
                            color={planColors[plan] || 'var(--color-texte-muted)'}
                        />
                    );
                })}
            </div>

            {/* Barre de filtres */}
            <div className="flex flex-wrap items-center gap-[var(--gap-sm)]">
                <Filter className="h-[var(--icon-sm)] w-[var(--icon-sm)]" style={{ color: 'var(--color-texte-muted)' }} />
                {/* Filtre statut */}
                <select
                    value={filtreStatut}
                    onChange={(e) => handleStatutChange(e.target.value)}
                    className="rounded-lg border px-[var(--space-sm)] py-[var(--space-xs)] text-sm transition-colors focus:outline-none focus:ring-2"
                    style={{
                        borderColor: 'var(--color-bordure)',
                        backgroundColor: 'var(--color-surface)',
                        color: 'var(--color-texte)',
                        fontSize: 'clamp(0.75rem, 0.68rem + 0.25vw, 0.875rem)',
                    }}
                >
                    <option value="">{t('etablissements.filtres.tous', 'Tous les statuts')}</option>
                    <option value="ACTIF">{STATUT_LABELS.ACTIF}</option>
                    <option value="EN_ATTENTE_VALIDATION">{STATUT_LABELS.EN_ATTENTE_VALIDATION}</option>
                    <option value="EN_ATTENTE_DESACTIVATION">{STATUT_LABELS.EN_ATTENTE_DESACTIVATION}</option>
                    <option value="INACTIF">{STATUT_LABELS.INACTIF}</option>
                </select>
                {/* Filtre type */}
                <select
                    value={filtreType}
                    onChange={(e) => handleTypeChange(e.target.value)}
                    className="rounded-lg border px-[var(--space-sm)] py-[var(--space-xs)] text-sm transition-colors focus:outline-none focus:ring-2"
                    style={{
                        borderColor: 'var(--color-bordure)',
                        backgroundColor: 'var(--color-surface)',
                        color: 'var(--color-texte)',
                        fontSize: 'clamp(0.75rem, 0.68rem + 0.25vw, 0.875rem)',
                    }}
                >
                    <option value="">{t('etablissements.filtres.tous', 'Tous les types')}</option>
                    {Object.entries(TYPE_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                    ))}
                </select>
                {/* Filtre plan */}
                <select
                    value={filtrePlan}
                    onChange={(e) => handlePlanChange(e.target.value)}
                    className="rounded-lg border px-[var(--space-sm)] py-[var(--space-xs)] text-sm transition-colors focus:outline-none focus:ring-2"
                    style={{
                        borderColor: 'var(--color-bordure)',
                        backgroundColor: 'var(--color-surface)',
                        color: 'var(--color-texte)',
                        fontSize: 'clamp(0.75rem, 0.68rem + 0.25vw, 0.875rem)',
                    }}
                >
                    <option value="">{t('etablissements.filtres.tousPlans', 'Tous les plans')}</option>
                    {Object.entries(PLAN_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                    ))}
                </select>
                {/* Filtre sous-système */}
                <select
                    value={filtreSousSysteme}
                    onChange={(e) => handleSousSystemeChange(e.target.value)}
                    className="rounded-lg border px-[var(--space-sm)] py-[var(--space-xs)] text-sm transition-colors focus:outline-none focus:ring-2"
                    style={{
                        borderColor: 'var(--color-bordure)',
                        backgroundColor: 'var(--color-surface)',
                        color: 'var(--color-texte)',
                        fontSize: 'clamp(0.75rem, 0.68rem + 0.25vw, 0.875rem)',
                    }}
                >
                    <option value="">{t('etablissements.filtres.tousSystemes', 'Tous les systèmes')}</option>
                    {Object.entries(SOUS_SYSTEME_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                    ))}
                </select>
                {/* Filtre santé */}
                <select
                    value={filtreSante}
                    onChange={(e) => setFiltreSante(e.target.value as CategorieSante | 'tous')}
                    className="rounded-lg border px-[var(--space-sm)] py-[var(--space-xs)] text-sm transition-colors focus:outline-none focus:ring-2"
                    style={{
                        borderColor: 'var(--color-bordure)',
                        backgroundColor: 'var(--color-surface)',
                        color: 'var(--color-texte)',
                        fontSize: 'clamp(0.75rem, 0.68rem + 0.25vw, 0.875rem)',
                    }}
                >
                    <option value="tous">{t('etablissements.filtres.tous', 'Toutes les santés')}</option>
                    <option value="sain">{t('sante.sain', 'Sain')}</option>
                    <option value="attention">{t('sante.attention', 'Attention')}</option>
                    <option value="critique">{t('sante.critique', 'Critique')}</option>
                </select>
                {/* Tri avancé */}
                <div className="flex items-center rounded-lg border" style={{ borderColor: 'var(--color-bordure)' }}>
                    <select
                        value={sortBy}
                        onChange={(e) => handleSortChange(e.target.value)}
                        className="rounded-l-lg border-0 px-[var(--space-sm)] py-[var(--space-xs)] text-sm transition-colors focus:outline-none focus:ring-2"
                        style={{
                            backgroundColor: 'var(--color-surface)',
                            color: 'var(--color-texte)',
                            fontSize: 'clamp(0.75rem, 0.68rem + 0.25vw, 0.875rem)',
                        }}
                    >
                        <option value="nom">{t('etablissements.tri.nom', 'Nom')}</option>
                        <option value="ville">{t('etablissements.tri.ville', 'Ville')}</option>
                        <option value="createdAt">{t('etablissements.tri.date', 'Date création')}</option>
                        <option value="effectifActuel">{t('etablissements.tri.effectif', 'Effectif')}</option>
                        <option value="statut">{t('etablissements.tri.statut', 'Statut')}</option>
                        <option value="scoreSante">{t('etablissements.tri.sante', 'Score santé')}</option>
                    </select>
                    <button
                        onClick={handleSortOrderToggle}
                        className="flex items-center justify-center px-[var(--space-xs)] py-[var(--space-xs)] transition-colors hover:opacity-80"
                        style={{ backgroundColor: 'var(--color-surface-alt)', color: 'var(--color-texte-muted)' }}
                        title={sortOrder === 'ASC' ? t('tri.croissant', 'Croissant') : t('tri.decroissant', 'Décroissant')}
                    >
                        {sortOrder === 'ASC'
                            ? <ArrowUp className="h-3.5 w-3.5" />
                            : <ArrowDown className="h-3.5 w-3.5" />
                        }
                    </button>
                </div>
                {/* Compteur résultats filtrés */}
                {(filtreStatut || filtreType || filtrePlan || filtreSousSysteme || filtreSante !== 'tous') && (
                    <>
                        <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: 'var(--color-dominant-100)', color: 'var(--color-dominant-700)' }}>
                            {donneesFiltrees.length} {t('etablissements.resultats', 'résultat(s)')}
                        </span>
                        <button
                            onClick={handleResetFiltres}
                            className="inline-flex items-center gap-[var(--gap-xxs)] text-xs px-2 py-1 rounded-full transition-colors hover:opacity-80"
                            style={{ backgroundColor: 'var(--color-danger-50)', color: 'var(--color-danger-600)' }}
                            title={t('etablissements.filtres.reinitialiser', 'Réinitialiser les filtres')}
                        >
                            <X className="h-3 w-3" />
                            {t('etablissements.filtres.reinitialiser', 'Réinitialiser')}
                        </button>
                    </>
                )}
            </div>

            {/* Barre d'actions en masse */}
            {selectedIds.size > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-wrap items-center gap-[var(--gap-sm)] p-[var(--space-sm)] rounded-lg border"
                    style={{ backgroundColor: 'var(--color-dominant-50)', borderColor: 'var(--color-dominant-200)' }}
                >
                    <span className="text-sm font-medium" style={{ color: 'var(--color-dominant-700)' }}>
                        {selectedIds.size} {t('etablissements.selectionnes', 'sélectionné(s)')}
                    </span>
                    <div className="ml-auto flex items-center gap-[var(--gap-xs)]">
                        <button
                            onClick={() => setSelectedIds(new Set())}
                            className="text-xs px-2 py-1 rounded transition-colors hover:opacity-80"
                            style={{ color: 'var(--color-texte-muted)' }}
                        >
                            {t('common.actions.annuler', 'Annuler')}
                        </button>
                        <button
                            onClick={handleBulkActiver}
                            disabled={bulkActiver.isPending}
                            className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                            style={{ backgroundColor: 'var(--color-success-600)', color: '#fff' }}
                        >
                            <Play className="h-3 w-3" />
                            {t('etablissements.bulk.activer', 'Réactiver')}
                        </button>
                        <button
                            onClick={handleBulkDesactiver}
                            disabled={bulkDesactiver.isPending}
                            className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                            style={{ backgroundColor: 'var(--color-danger-600)', color: '#fff' }}
                        >
                            <Pause className="h-3 w-3" />
                            {t('etablissements.bulk.desactiver', 'Désactiver')}
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Liste paginée */}
            <DataTable
                tableId="platform-etablissements"
                data={donneesFiltrees}
                columns={colonnes}
                isLoading={listeLoading}
                enableReordering
                enablePinning
                enableColumnVisibility
                searchPlaceholder={t('etablissements.rechercher', 'Rechercher un établissement...')}
                onSearchChange={handleSearchChange}
                disableClientSearch
                onRowClick={(e) => handleVoirDetail(e)}
                pagination={liste?.meta ? {
                    page: liste.meta.currentPage,
                    limit: liste.meta.itemsPerPage,
                    total: liste.meta.totalItems,
                    totalPages: liste.meta.totalPages,
                    hasNext: liste.meta.currentPage < liste.meta.totalPages,
                    hasPrev: liste.meta.currentPage > 1,
                } : undefined}
                onPageChange={handlePageChange}
                onLimitChange={handleLimitChange}
            />

            {/* Modal création/édition */}
            <EtablissementFormModal
                open={modalOpen}
                onOpenChange={(open) => {
                    if (!open) handleModalClose();
                }}
                mode={etablissementToEdit ? 'edit' : 'create'}
                etablissement={etablissementToEdit ?? undefined}
            />
        </div>
    );
}

// =============================================
// Composant QuickChip
// =============================================

function QuickChip({
    label,
    active,
    onClick,
    count,
    color,
}: {
    label: string;
    active: boolean;
    onClick: () => void;
    count?: number;
    color?: string;
}) {
    return (
        <button
            onClick={onClick}
            className="inline-flex items-center gap-[var(--gap-xxs)] rounded-full px-[clamp(0.5rem,0.4rem+0.2vw,0.75rem)] py-[clamp(0.25rem,0.2rem+0.1vw,0.375rem)] text-xs font-medium transition-all"
            style={{
                backgroundColor: active
                    ? (color || 'var(--color-dominant-600)')
                    : 'var(--color-surface)',
                color: active
                    ? '#fff'
                    : (color || 'var(--color-texte-muted)'),
                border: `1px solid ${active ? 'transparent' : 'var(--color-bordure)'}`,
                opacity: active ? 1 : 0.85,
            }}
        >
            {label}
            {count !== undefined && (
                <span
                    className="inline-flex items-center justify-center rounded-full min-w-[1.25rem] h-5 px-1 text-[0.625rem] font-bold"
                    style={{
                        backgroundColor: active ? 'rgba(255,255,255,0.25)' : 'var(--color-surface-alt)',
                        color: active ? '#fff' : (color || 'var(--color-texte-muted)'),
                    }}
                >
                    {count}
                </span>
            )}
        </button>
    );
}

// =============================================
// Composant MiniStat
// =============================================

function MiniStat({
    icon: Icon,
    label,
    value,
    color,
    loading,
}: {
    icon: LucideIcon;
    label: string;
    value: string | number;
    color: string;
    loading?: boolean;
}) {
    return (
        <div className="rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface)] p-[var(--space-sm)] space-y-[var(--space-xs)]">
            <div className="flex items-center gap-[var(--gap-xs)]">
                <Icon className="h-[var(--icon-xs)] w-[var(--icon-xs)]" style={{ color }} />
                <span className="text-xs" style={{ color: 'var(--color-texte-muted)' }}>{label}</span>
            </div>
            <div className="font-bold" style={{ fontSize: 'clamp(1rem, 0.85rem + 0.5vw, 1.25rem)' }}>
                {loading ? (
                    <span className="inline-block w-8 h-5 rounded animate-pulse" style={{ backgroundColor: 'var(--color-bordure)' }} />
                ) : value}
            </div>
        </div>
    );
}

export const Route = createFileRoute('/platform/etablissements/')({
    component: PlatformEtablissementsIndexPage,
});

export default PlatformEtablissementsIndexPage;
