import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Plus, Trash2, ArrowUpRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DataTable } from '@/components/ui/DataTable';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { CardGrid } from '@/components/ui/CardGrid';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { usePermissions } from '@/hooks';
import { ElisaButton } from '@/components/ui/ElisaButton';
import type { Column } from '@/components/ui/DataTable';
import type { ProgrammePedagogique } from '../types/programme.types';
import {
    useProgrammes,
    useCreerProgramme,
    useModifierProgramme,
    useSupprimerProgramme,
} from '../hooks/use-programmes';
import { ProgrammeFormModal } from './programme-form-modal';
import { BookOpen, Layers, Clock, CheckCircle, XCircle } from 'lucide-react';
import { formatVolumeMinutesToHours } from '@/lib/format-utils';

export function ProgrammesPage() {
    const { t } = useTranslation('programmes');
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [limit] = useState(20);
    const [recherche, setRecherche] = useState('');
    const [showFormModal, setShowFormModal] = useState(false);
    const [programmeToEdit, setProgrammeToEdit] = useState<ProgrammePedagogique | null>(null);
    const [programmeToDelete, setProgrammeToDelete] = useState<ProgrammePedagogique | null>(null);

    const { hasPermission } = usePermissions();
    const { data, isLoading, isError, error, refetch } = useProgrammes({
        page,
        limit,
        search: recherche || undefined,
    });

    const creer = useCreerProgramme();
    const modifier = useModifierProgramme();
    const supprimer = useSupprimerProgramme();

    const programmes = data?.items || [];
    const meta = data?.meta;
    const total = meta?.totalItems || 0;
    const actifs = programmes.filter((p) => p.actif).length;

    

    const colonnes: Column<ProgrammePedagogique>[] = [
        {
            key: 'nom',
            header: t('nom'),
            sortable: true,
            render: (p) => (
                <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-[var(--color-dominante)]" />
                    <span className="font-semibold">{p.nom}</span>
                </div>
            ),
        },
        {
            key: 'code',
            header: t('code'),
            render: (p) => (
                <code className="px-2 py-1 bg-muted rounded text-xs font-mono">
                    {p.code}
                </code>
            ),
        },
        {
            key: 'cycle',
            header: t('cycle'),
            render: (p) => (
                <div className="flex items-center gap-1">
                    <Layers className="h-3 w-3 text-[var(--color-texte-secondaire)]" />
                    <span className="text-sm">{p.cycle?.nom || '-'}</span>
                </div>
            ),
        },
        {
            key: 'nbMatieres',
            header: t('matieres'),
            render: (p) => (
                <span className="text-sm font-mono">{p.matieres?.length || 0}</span>
            ),
        },
        {
            key: 'volumeHoraire',
            header: t('volumeHoraire'),
            render: (p) => (
                <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-[var(--color-texte-secondaire)]" />
                    <span className="text-sm font-medium">{formatVolumeMinutesToHours(p.volumeMinutesCalcule ?? 0)}</span>
                </div>
            ),
        },
        {
            key: 'actif',
            header: t('statut'),
            render: (p) => (
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    p.actif
                        ? 'bg-success/10 text-success'
                        : 'bg-muted text-muted-foreground'
                }`}>
                    {p.actif ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    {p.actif ? t('actif') : t('inactif')}
                </span>
            ),
        },
        {
            key: 'actions',
            header: '',
            className: 'text-right',
            renderActions: (p) => [
                {
                    key: 'voir',
                    icon: ArrowUpRight,
                    label: t('voirDetails'),
                    onClick: () => navigate({ to: `/programmes/${p.id}` }),
                    variant: 'info' as const,
                },
                {
                    key: 'supprimer',
                    icon: Trash2,
                    label: t('supprimer'),
                    onClick: () => setProgrammeToDelete(p),
                    permission: 'programmes:config:write',
                    variant: 'danger' as const,
                },
            ],
        },
    ];

    const handleDelete = async () => {
        if (!programmeToDelete) return;
        try {
            await supprimer.mutateAsync(programmeToDelete.id);
            setProgrammeToDelete(null);
        } catch (err) {
            console.error('Erreur suppression programme:', err);
        }
    };

    if (isLoading && !data) return <PageSkeleton />;
    if (isError) return <ErrorMessage message={(error as Error)?.message} onRetry={refetch} />;

    return (
        <div className="space-y-6">
            <PageHeader
                title={t('titre')}
                description={t('description', 'Gérer les programmes pédagogiques')}
                icon={BookOpen}
                variant="gradient"
                actions={
                    hasPermission('programmes:config:write') ? (
                        <ElisaButton
                            variant="primary"
                            size="md"
                            onClick={() => {
                                setProgrammeToEdit(null);
                                setShowFormModal(true);
                            }}
                            leftIcon={<Plus className="h-4 w-4" />}
                        >
                            {t('nouveauProgramme')}
                        </ElisaButton>
                    ) : undefined
                }
            />

            <CardGrid>
                <StatCard label={t('totalProgrammes', 'Total Programmes')} value={total} icon={BookOpen} tone="dominant" />
                <StatCard label={t('actifs')} value={actifs} icon={CheckCircle} tone="success" />
                <StatCard label={t('inactifs', 'Inactifs')} value={total - actifs} icon={XCircle} tone="muted" />
                <StatCard label={t('volumeHoraire')} value={formatVolumeMinutesToHours(programmes.reduce((s, p) => s + (p.volumeMinutesCalcule ?? 0), 0))} icon={Clock} tone="info" />
            </CardGrid>

            <DataTable
                columns={colonnes}
                data={programmes}
                isLoading={isLoading}
                tableId="programmes"
                onSearchChange={(search) => setRecherche(search)}
                pagination={{
                    page,
                    limit,
                    total,
                    totalPages: meta?.totalPages || 1,
                    onPageChange: setPage,
                }}
                emptyMessage={t('aucunProgramme')}
            />

            <ProgrammeFormModal
                open={showFormModal}
                programme={programmeToEdit}
                onClose={() => {
                    setShowFormModal(false);
                    setProgrammeToEdit(null);
                }}
                onSubmit={async (dto) => {
                    if (programmeToEdit) {
                        await modifier.mutateAsync({ id: programmeToEdit.id, ...dto });
                    } else {
                        await creer.mutateAsync(dto);
                    }
                }}
            />

            <ConfirmDialog
                open={!!programmeToDelete}
                onOpenChange={(open) => { if (!open) setProgrammeToDelete(null); }}
                onConfirm={handleDelete}
                title={t('supprimer')}
                description={t('confirmerSuppression') + (programmeToDelete ? ` "${programmeToDelete.nom}"` : '')}
                confirmText={t('supprimer')}
                variant="danger"
                isLoading={supprimer.isPending}
            />
        </div>
    );
}
