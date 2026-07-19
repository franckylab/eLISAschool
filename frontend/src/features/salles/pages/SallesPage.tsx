import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Eye, Building2, CheckCircle, Users, BarChart3 } from 'lucide-react';
import { useSalles, useSupprimerSalle, useStatistiquesSalles } from '../hooks/use-salles';
import { TypeSalle, StatutSalle, FiltresSalles, Salle } from '../types/salle.types';
import { SalleFormModal } from '../components/SalleFormModal';
import { DataTable } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { StatCard } from '@/components/ui/StatCard';
import { CardGrid } from '@/components/ui/CardGrid';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { usePermissions } from '@/hooks';
import type { Column } from '@/components/ui/DataTable';

const STATUT_BADGE: Record<StatutSalle, { bg: string; text: string; icon: React.ElementType }> = {
    [StatutSalle.DISPONIBLE]: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-300', icon: CheckCircle },
    [StatutSalle.EN_MAINTENANCE]: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-300', icon: BarChart3 },
    [StatutSalle.INDISPONIBLE]: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-300', icon: BarChart3 },
};

const TYPE_OPTIONS = Object.values(TypeSalle).map((v) => ({ value: v, label: `salles:${v.toLowerCase()}` }));
const STATUT_OPTIONS = Object.values(StatutSalle).map((v) => ({ value: v, label: `salles:${v.toLowerCase()}` }));

export function SallesPage() {
    const { t } = useTranslation('salles');
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();

    const [filtres, setFiltres] = useState<FiltresSalles>({
        page: 1,
        limit: 20,
        search: '',
    });
    const [showFormModal, setShowFormModal] = useState(false);
    const [salleToEdit, setSalleToEdit] = useState<Salle | null>(null);
    const [salleToDelete, setSalleToDelete] = useState<Salle | null>(null);

    const { data, isLoading, isFetching, error, refetch } = useSalles(filtres);
    const { data: stats, isLoading: statsLoading } = useStatistiquesSalles();
    const supprimer = useSupprimerSalle();

    const salles = data?.data || [];
    const pagination = data?.pagination;

    const colonnes: Column<Salle>[] = [
        {
            key: 'nom',
            pinned: 'left' as const,
            header: t('colonneSalle'),
            sortable: true,
            render: (s) => (
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                        <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <div className="font-semibold text-[var(--color-texte)]">{s.nom}</div>
                        {s.code && <div className="text-xs text-[var(--color-texte-muted)] font-mono">{s.code}</div>}
                    </div>
                </div>
            ),
        },
        {
            key: 'typeSalle',
            header: t('colonneType'),
            render: (s) => (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-[var(--color-bg-tertiaire)] text-[var(--color-texte)]">
                    {t(s.typeSalle.toLowerCase())}
                </span>
            ),
        },
        {
            key: 'capacite',
            header: t('colonneCapacite'),
            sortable: true,
            render: (s) => (
                <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-[var(--color-texte-muted)]" />
                    <span className="text-sm text-[var(--color-texte)] font-medium">{t('nPlaces', { count: s.capacite })}</span>
                </div>
            ),
        },
        {
            key: 'localisation',
            header: t('colonneLocalisation'),
            className: 'hidden lg:table-cell',
            render: (s) => s.localisation ? (
                <div className="flex items-center gap-2 text-sm text-[var(--color-texte-secondaire)]">
                    <Building2 className="h-4 w-4 text-[var(--color-texte-muted)]" />
                    <span>{s.localisation}</span>
                </div>
            ) : <span className="text-[var(--color-texte-muted)] text-sm">-</span>,
        },
        {
            key: 'statut',
            header: t('colonneStatut'),
            render: (s) => {
                const displayStatut = !s.disponible ? StatutSalle.INDISPONIBLE : s.statut;
                const config = STATUT_BADGE[displayStatut];
                const Icon = config.icon;
                return (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                        <Icon className="h-3.5 w-3.5" />
                        {t(displayStatut.toLowerCase())}
                    </span>
                );
            },
        },
        {
            key: 'actions',
            header: t('colonneActions'),
            className: 'text-right',
            renderActions: (s) => [
                {
                    key: 'voir',
                    icon: Eye,
                    label: t('voirDetails'),
                    onClick: () => navigate({ to: '/salles/$salleId', params: { salleId: s.id } }),
                    variant: 'info' as const,
                },
                ...(hasPermission('config:edit') ? [
                    {
                        key: 'modifier',
                        icon: Edit,
                        label: t('modifier'),
                        onClick: () => { setSalleToEdit(s); setShowFormModal(true); },
                    },
                    {
                        key: 'supprimer',
                        icon: Trash2,
                        label: t('supprimer'),
                        onClick: () => setSalleToDelete(s),
                        variant: 'danger' as const,
                    },
                ] : []),
            ],
        },
    ];

    if (isLoading && salles.length === 0) {
        return <PageSkeleton showStats showTable />;
    }

    if (error) {
        return (
            <div className="p-6">
                <ErrorMessage
                    title={t('chargement')}
                    message={error.message}
                    onRetry={() => refetch()}
                    retryLabel={t('reessayer', { ns: 'common' })}
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <PageHeader
                title={t('gestionSalles')}
                subtitle={t('sallesCount', { count: pagination?.total || 0 })}
                icon={Building2}
                variant="gradient"
                actions={hasPermission('config:edit') ? (
                    <ElisaButton
                        variant="primary"
                        size="sm"
                        icon={<Plus className="h-4 w-4" />}
                        onClick={() => { setSalleToEdit(null); setShowFormModal(true); }}
                    >
                        {t('nouvelleSalle')}
                    </ElisaButton>
                ) : undefined}
            />

            {stats && (
                <CardGrid columns={{ default: 1, sm: 2, lg: 4, xl: 4 }}>
                    <StatCard
                        icon={Building2}
                        label={t('totalSalles')}
                        value={stats.total ?? 0}
                        tone="accent"
                        delay={0}
                        loading={statsLoading}
                    />
                    <StatCard
                        icon={CheckCircle}
                        label={t('disponibles')}
                        value={stats.disponibles ?? 0}
                        tone="success"
                        delay={0.05}
                        loading={statsLoading}
                    />
                    <StatCard
                        icon={Users}
                        label={t('capaciteTotale')}
                        value={(stats.capaciteTotale ?? 0).toLocaleString()}
                        tone="orange"
                        delay={0.1}
                        loading={statsLoading}
                    />
                    <StatCard
                        icon={BarChart3}
                        label={t('tauxOccupationLabel')}
                        value={stats.total && stats.total > 0
                            ? `${Math.round(((stats.total - stats.disponibles) / stats.total) * 100)}%`
                            : '0%'}
                        tone="purple"
                        delay={0.15}
                        loading={statsLoading}
                    />
                </CardGrid>
            )}

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <DataTable
                    tableId="salles"
                    data={salles}
                    columns={colonnes}
                    isLoading={isLoading}
                    isFetching={isFetching}
                    enableReordering
                    enablePinning
                    enableColumnVisibility
                    enableCollapsibleFilters
                    filtres={[
                        {
                            key: 'typeSalle',
                            label: t('colonneType'),
                            options: TYPE_OPTIONS,
                            allOptionLabel: t('tousTypes'),
                        },
                        {
                            key: 'statut',
                            label: t('colonneStatut'),
                            options: STATUT_OPTIONS,
                            allOptionLabel: t('tousStatuts'),
                        },
                    ]}
                    searchPlaceholder={t('rechercherPar')}
                    onSearchChange={(search) => setFiltres((prev) => ({ ...prev, search, page: 1 }))}
                    onFilterChange={(key, value) => {
                        setFiltres((prev) => {
                            const next = { ...prev, page: 1 };
                            if (key === 'typeSalle') next.typeSalle = value as TypeSalle | undefined;
                            if (key === 'statut') next.statut = value as StatutSalle | undefined;
                            return next;
                        });
                    }}
                    onClearFilters={() => setFiltres((prev) => ({ ...prev, typeSalle: undefined, statut: undefined, page: 1 }))}
                    disableClientSearch
                    pagination={pagination ? {
                        page: pagination.page,
                        limit: pagination.limit,
                        total: pagination.total,
                        totalPages: pagination.totalPages,
                        hasNext: pagination.hasNext,
                        hasPrev: pagination.hasPrev,
                    } : undefined}
                    onPageChange={(page) => setFiltres((prev) => ({ ...prev, page }))}
                    onLimitChange={(limit) => setFiltres((prev) => ({ ...prev, limit, page: 1 }))}
                />
            </motion.div>

            {showFormModal && (
                <SalleFormModal
                    open={showFormModal}
                    onOpenChange={(open) => {
                        if (!open) { setShowFormModal(false); setSalleToEdit(null); }
                    }}
                    salleId={salleToEdit?.id}
                />
            )}

            {salleToDelete && (
                <ConfirmDialog
                    open={!!salleToDelete}
                    onOpenChange={(open) => { if (!open) setSalleToDelete(null); }}
                    title={t('confirmerSuppression')}
                    description={t('messageSuppression', { nom: salleToDelete.nom })}
                    confirmText={t('supprimer')}
                    variant="danger"
                    onConfirm={async () => {
                        await supprimer.mutateAsync(salleToDelete.id);
                        setSalleToDelete(null);
                    }}
                    isLoading={supprimer.isPending}
                />
            )}
        </div>
    );
}
