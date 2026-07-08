import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit, Trash2, UserPlus, UserX, Briefcase, Search } from 'lucide-react';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { Badge } from '@/components/ui/Badge';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { usePermissions } from '@/hooks';
import { usePostes, useSupprimerPoste, useLibererPoste, useUnites } from '../hooks/use-organisation';
import { PosteFormModal } from './poste-form-modal';
import { AssignerOccupantModal } from './assigner-occupant-modal';
import type { Poste, UniteOrganisationnelle } from '../types/organisation.types';

const statutColors: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
    ACTIF: 'success',
    VACANT: 'warning',
    SUPPRIME: 'danger',
    EN_ATTENTE: 'default',
};

interface Props { organisationId: string }

export function TabPostes({ organisationId }: Props) {
    const { t } = useTranslation('organisation');
    const { hasPermission } = usePermissions();
    const { data: unites } = useUnites({ organisationId });
    const { data: postes, isLoading } = usePostes({ organisationId });
    const supprimer = useSupprimerPoste();
    const liberer = useLibererPoste();

    const statutLabels = t('statutsPoste', { returnObjects: true }) as Record<string, string>;
    const typeLabels = t('typesPoste', { returnObjects: true }) as Record<string, string>;

    const unitesList = unites || [];
    const postesList = postes || [];

    const [filtreType, setFiltreType] = useState('');
    const [filtreStatut, setFiltreStatut] = useState('');
    const [filtreUnite, setFiltreUnite] = useState('');

    const filtered = postesList.filter((p) => {
        if (filtreType && p.type !== filtreType) return false;
        if (filtreStatut && p.statut !== filtreStatut) return false;
        if (filtreUnite && p.uniteOrganisationnelleId !== filtreUnite) return false;
        return true;
    });

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editPoste, setEditPoste] = useState<Poste | null>(null);
    const [assignPoste, setAssignPoste] = useState<Poste | null>(null);
    const [deletePosteId, setDeletePosteId] = useState<string | null>(null);
    const [libererPosteId, setLibererPosteId] = useState<string | null>(null);

    const colonnes: Column<Poste>[] = [
        {
            key: 'intitule',
            header: t('colIntitule'),
            sortable: true,
            render: (p) => (
                <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{p.intitulé}</p>
                    <p className="text-xs text-gray-500 font-mono">{p.code}</p>
                </div>
            ),
        },
        {
            key: 'unite',
            header: t('colUnite'),
            render: (p) => {
                const unite = unitesList.find((u) => u.id === p.uniteOrganisationnelleId);
                return <span className="text-sm text-gray-600 dark:text-gray-400">{unite?.nom || '-'}</span>;
            },
        },
        {
            key: 'type',
            header: t('colType'),
            render: (p) => <span className="text-sm text-gray-600 dark:text-gray-400">{typeLabels[p.type] || p.type}</span>,
        },
        {
            key: 'statut',
            header: t('colStatut'),
            render: (p) => (
                <Badge variant={statutColors[p.statut] || 'default'} size="sm">
                    {statutLabels[p.statut] || p.statut}
                </Badge>
            ),
        },
        {
            key: 'occupant',
            header: t('colOccupant'),
            render: (p) => (
                p.occupantNom
                    ? <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{p.occupantNom}</span>
                    : <span className="text-sm text-gray-400 italic">{t('vacant')}</span>
            ),
        },
        {
            key: 'actions',
            header: t('colActions'),
            className: 'text-right w-48',
            renderActions: (p) => {
                const actions: any[] = [];
                if (hasPermission('organisation:edit')) {
                    if (p.statut === 'VACANT') {
                        actions.push({
                            key: 'assigner',
                            icon: UserPlus,
                            label: t('assigner'),
                            onClick: () => setAssignPoste(p),
                            variant: 'success' as const,
                        });
                    } else {
                        actions.push({
                            key: 'liberer',
                            icon: UserX,
                            label: t('liberer'),
                            onClick: () => setLibererPosteId(p.id),
                            variant: 'warning' as const,
                        });
                    }
                    actions.push({
                        key: 'modifier',
                        icon: Edit,
                        label: t('modifier'),
                        onClick: () => setEditPoste(p),
                    });
                    actions.push({
                        key: 'supprimer',
                        icon: Trash2,
                        label: t('supprimer'),
                        onClick: () => setDeletePosteId(p.id),
                        variant: 'danger' as const,
                    });
                }
                return actions;
            },
        },
    ];

    return (
        <div className="space-y-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-purple-500" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('postes')}</h3>
                        <Badge variant="default" size="sm">{t('nbrePostes', { count: filtered.length })}</Badge>
                        <Badge variant="warning" size="sm">{t('nbreVacants', { count: filtered.filter((p) => p.statut === 'VACANT').length })}</Badge>
                    </div>
                    {hasPermission('organisation:edit') && (
                        <ElisaButton variant="primary" size="sm" icon={<Plus className="h-4 w-4" />}
                            onClick={() => setShowCreateModal(true)}>
                            {t('nouveauPosteBtn')}
                        </ElisaButton>
                    )}
                </div>

                <DataTable
                    colonnes={colonnes}
                    donnees={filtered}
                    isLoading={isLoading}
                    enableReordering
                    enablePinning
                    searchPlaceholder={t('rechercherPoste')}
                    filtres={[
                        {
                            key: 'type',
                            label: t('colType'),
                            options: Object.entries(typeLabels).map(([value, label]) => ({ value, label })),
                            allOptionLabel: t('tousLesTypes'),
                        },
                        {
                            key: 'statut',
                            label: t('colStatut'),
                            options: Object.entries(statutLabels).map(([value, label]) => ({ value, label })),
                            allOptionLabel: t('tousLesStatuts'),
                        },
                        {
                            key: 'unite',
                            label: t('colUnite'),
                            options: unitesList.map((u) => ({ value: u.id, label: u.nom })),
                            allOptionLabel: t('toutesLesUnites'),
                        },
                    ]}
                    onFilterChange={(key, value) => {
                        if (key === 'type') setFiltreType(value);
                        if (key === 'statut') setFiltreStatut(value);
                        if (key === 'unite') setFiltreUnite(value);
                    }}
                />
            </div>

            <PosteFormModal
                open={showCreateModal}
                onOpenChange={setShowCreateModal}
                organisationId={organisationId}
                unites={unitesList}
            />

            {editPoste && (
                <PosteFormModal
                    open={!!editPoste}
                    onOpenChange={() => setEditPoste(null)}
                    organisationId={organisationId}
                    unites={unitesList}
                    poste={editPoste}
                />
            )}

            {assignPoste && (
                <AssignerOccupantModal
                    open={!!assignPoste}
                    onOpenChange={() => setAssignPoste(null)}
                    poste={assignPoste}
                />
            )}

            <ConfirmationModal
                isOpen={!!deletePosteId}
                onCancel={() => setDeletePosteId(null)}
                onConfirm={async () => {
                    if (deletePosteId) { await supprimer.mutateAsync(deletePosteId); setDeletePosteId(null); }
                }}
                title={t('supprimerPoste')}
                message={t('confirmerSuppressionPoste')}
                confirmLabel={t('supprimer')}
                cancelLabel={t('annuler')}
                variant="danger"
            />

            <ConfirmationModal
                isOpen={!!libererPosteId}
                onCancel={() => setLibererPosteId(null)}
                onConfirm={async () => {
                    if (libererPosteId) { await liberer.mutateAsync(libererPosteId); setLibererPosteId(null); }
                }}
                title={t('libererPosteTitre')}
                message={t('confirmerLiberer')}
                confirmLabel={t('liberer')}
                cancelLabel={t('annuler')}
                variant="warning"
            />
        </div>
    );
}
