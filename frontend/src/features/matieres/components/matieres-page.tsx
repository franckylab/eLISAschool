import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Eye, Globe, BookOpen, TrendingUp, Filter } from 'lucide-react';
import { useMatieres, useSupprimerMatiere, useCreerMatiere, useModifierMatiere } from '../hooks/use-matieres';
import { MatiereFormModal } from './matiere-form-modal';
import { DataTable } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ElisaSelect } from '@/components/ui/ElisaSelect';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { PageHeader } from '@/components/layout/PageHeader';
import { useConfirmation } from '@/components/ui/ConfirmationModal';
import { usePermissions } from '@/hooks';
import type { Matiere, MatiereFiltres, CreerMatiereDto, SousSysteme } from '../types/matiere.types';
import type { Column } from '@/components/ui/DataTable';

const SOUS_SYSTEME_STYLES: Record<string, string> = {
    FRANCOPHONE: 'bg-info/10 text-info',
    ANGLOPHONE: 'bg-success/10 text-success',
    BICULTUREL: 'bg-purple/10 text-purple',
};

const STATUT_STYLES: Record<string, string> = {
    actif: 'bg-success/10 text-success',
    inactif: 'bg-muted text-muted-foreground',
};

export function MatieresPage() {
    const { t } = useTranslation('matieres');
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    const [filtres, setFiltres] = useState<MatiereFiltres>({ page: 1, limit: 50 });
    const [formOpen, setFormOpen] = useState(false);
    const [matiereToEdit, setMatiereToEdit] = useState<Matiere | null>(null);

    const { data, isLoading, isFetching, error, refetch } = useMatieres(filtres);
    const creer = useCreerMatiere();
    const modifier = useModifierMatiere();
    const supprimer = useSupprimerMatiere();
    const { ask: askDelete, ConfirmationModal: DeleteConfirmModal } = useConfirmation();

    const stats = useMemo(() => {
        const items = data?.items || [];
        const total = data?.meta?.totalItems || 0;
        const countFR = items.filter(m => m.sousSysteme === 'FRANCOPHONE').length;
        const countAN = items.filter(m => m.sousSysteme === 'ANGLOPHONE').length;
        const countCO = items.filter(m => !m.sousSysteme).length;
        const countActif = items.filter(m => m.actif).length;
        return { total, countFR, countAN, countCO, countActif };
    }, [data]);

    const handleSave = async (formData: CreerMatiereDto) => {
        if (matiereToEdit) {
            await modifier.mutateAsync({ id: matiereToEdit.id, ...formData });
        } else {
            await creer.mutateAsync(formData);
        }
        setFormOpen(false);
        setMatiereToEdit(null);
    };

    const handleEdition = (matiere: Matiere) => {
        setMatiereToEdit(matiere);
        setFormOpen(true);
    };

    const handleCreation = () => {
        setMatiereToEdit(null);
        setFormOpen(true);
    };

    const sousSystemeOptions = [
        { value: '', label: t('tousSystemes') },
        { value: 'FRANCOPHONE', label: t('francophone') },
        { value: 'ANGLOPHONE', label: t('anglophone') },
        { value: 'BICULTUREL', label: t('commun') },
    ];

    const sousSystemeLabel = (v: string | null) => {
        if (!v) return t('commun');
        const opt = sousSystemeOptions.find(o => o.value === v);
        return opt ? opt.label : v;
    };

    const colonnes: Column<Matiere>[] = [
        {
            key: 'code',
            header: t('code'),
            sortable: true,
            render: (m) => <span className="font-mono text-sm font-semibold text-[var(--color-dominant-600)]">{m.code || '-'}</span>,
        },
        {
            key: 'nom',
            pinned: 'left' as const,
            header: t('nom'),
            sortable: true,
            render: (m) => (
                <button
                    onClick={() => navigate({ to: '/matieres/$id', params: { id: m.id } })}
                    className="hover:underline cursor-pointer text-left"
                >
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: m.couleur }} />
                        <p className="font-medium">{m.nom}</p>
                        {m.nomAnglais && <span className="text-xs text-muted-foreground">({m.nomAnglais})</span>}
                    </div>
                </button>
            ),
        },
        {
            key: 'sousSysteme',
            header: t('sousSysteme'),
            sortable: false,
            className: 'text-center',
            render: (m) => (
                <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                    !m.sousSysteme ? 'bg-muted text-muted-foreground' :
                    SOUS_SYSTEME_STYLES[m.sousSysteme] || 'bg-muted text-muted-foreground'
                }`}>
                    {sousSystemeLabel(m.sousSysteme)}
                </span>
            ),
        },
        {
            key: 'actif',
            header: t('statut'),
            sortable: true,
            className: 'text-center',
            render: (m) => (
                <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${m.actif ? STATUT_STYLES.actif : STATUT_STYLES.inactif}`}>
                    {m.actif ? t('statutActif') : t('statutInactif')}
                </span>
            ),
        },
        {
            key: 'actions',
            header: t('actions'),
            className: 'text-right',
            renderActions: (m) => [
                {
                    key: 'voir',
                    icon: Eye,
                    label: t('voirDetails'),
                    onClick: () => navigate({ to: '/matieres/$id', params: { id: m.id } }),
                    variant: 'info' as const,
                },
                {
                    key: 'modifier',
                    icon: Edit,
                    label: t('modifier'),
                    onClick: () => handleEdition(m),
                    permission: 'config:edit',
                },
                {
                    key: 'supprimer',
                    icon: Trash2,
                    label: t('supprimer'),
                    onClick: () => askDelete({
                        title: t('supprimerConfirmation'),
                        message: t('supprimerConfirmationMessage', { nom: m.nom }),
                        details: t('retirerNiveauDetails'),
                        onConfirm: async () => {
                            await supprimer.mutateAsync(m.id);
                        },
                    }),
                    permission: 'config:edit',
                    variant: 'danger' as const,
                },
            ],
        },
    ];

    if (isLoading && !data) {
        return <PageSkeleton showHeader showTable />;
    }

    if (error) {
        return (
            <div className="p-6">
                <ErrorMessage
                    message={error.message || t('chargement')}
                    onRetry={() => refetch()}
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <PageHeader
                variant="gradient"
                icon={BookOpen}
                title={t('titre')}
                subtitle={t('sousTitre')}
                showBreadcrumbs
                actions={hasPermission('matieres:create') ? (
                    <ElisaButton variant="primary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={handleCreation}>
                        {t('nouvelleMatiere')}
                    </ElisaButton>
                ) : undefined}
            />

            <div className="flex flex-wrap gap-3">
                <StatCard icon={BookOpen} label={t('totalMatieres')} value={stats.total} tone="info" />
                <StatCard icon={Globe} label={t('francophone')} value={stats.countFR} tone="accent" />
                <StatCard icon={Globe} label={t('anglophone')} value={stats.countAN} tone="success" />
                <StatCard icon={Globe} label={t('commun')} value={stats.countCO} tone="muted" />
                <StatCard icon={TrendingUp} label={t('actifs')} value={stats.countActif} tone={stats.countActif > 0 ? 'success' : 'muted'} />
            </div>

            <Card>
                <CardHeader><CardTitle>{t('filtresLabel')}</CardTitle></CardHeader>
                <div className="border-b border-border mx-4 sm:mx-5" />
                <CardContent>
                    <div className="flex flex-wrap items-center gap-3">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <ElisaSelect
                            value={filtres.sousSysteme || ''}
                            onValueChange={(value) => setFiltres(prev => ({ ...prev, sousSysteme: (value || '') as SousSysteme | '', page: 1 }))}
                            options={sousSystemeOptions}
                            className="min-w-[160px]"
                        />
                        <ElisaSelect
                            value={filtres.actif === undefined ? '' : String(filtres.actif)}
                            onValueChange={(value) => setFiltres(prev => ({ ...prev, actif: value === '' ? undefined : value === 'true', page: 1 }))}
                            options={[
                                { value: '', label: t('tousStatuts') },
                                { value: 'true', label: t('statutsActif') },
                                { value: 'false', label: t('statutsInactif') },
                            ]}
                            className="min-w-[140px]"
                        />
                    </div>
                </CardContent>
            </Card>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <DataTable
                    data={data?.items || []}
                    columns={colonnes}
                    isLoading={isLoading}
                    isFetching={isFetching}
                    enableReordering
                    enablePinning
                    enableColumnVisibility
                    searchPlaceholder={t('code')}
                    onSearchChange={(recherche) =>
                        setFiltres((prev) => ({ ...prev, recherche, page: 1 }))
                    }
                    disableClientSearch
                    pagination={data?.meta ? {
                        page: data.meta.currentPage,
                        limit: data.meta.itemsPerPage,
                        total: data.meta.totalItems,
                        totalPages: data.meta.totalPages,
                        hasNext: data.meta.currentPage < data.meta.totalPages,
                        hasPrev: data.meta.currentPage > 1,
                    } : undefined}
                    onPageChange={(page) => setFiltres((prev) => ({ ...prev, page }))}
                    onLimitChange={(limit) => setFiltres((prev) => ({ ...prev, limit, page: 1 }))}
                    tableId="matieres"
                />
            </motion.div>

            {formOpen && (
                <MatiereFormModal
                    open={formOpen}
                    onOpenChange={(v) => { if (!v) { setFormOpen(false); setMatiereToEdit(null); } }}
                    matiere={matiereToEdit}
                    onSave={handleSave}
                    isLoading={creer.isPending || modifier.isPending}
                />
            )}

            {DeleteConfirmModal}
        </div>
    );
}
