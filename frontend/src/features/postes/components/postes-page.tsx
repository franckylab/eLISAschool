import { useState, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Plus, Edit, Trash2, Eye, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { usePermissions, useDocumentTitle } from '@/hooks';
import { usePostes, useSupprimerPoste } from '../hooks/use-postes';
import { PosteFormModal } from './poste-form-modal';
import { PosteCapaciteIndicator } from './PosteCapaciteIndicator';
import { STATUT_POSTE_OPTIONS } from '../types/poste.zod';
import type { Poste } from '../types/poste.types';

const statutColors: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
    ACTIF: 'success',
    VACANT: 'warning',
    SUPPRIME: 'danger',
    EN_ATTENTE: 'default',
};

const statutLabels: Record<string, string> = {
    ACTIF: 'Actif',
    VACANT: 'Vacant',
    SUPPRIME: 'Supprimé',
    EN_ATTENTE: 'En attente',
};

export function PostesPage() {
    const { t } = useTranslation('organisation');
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    useDocumentTitle('eLISAschool | Postes');
    const [filtres, setFiltres] = useState<{ typePersonnelId?: string; statut?: string }>({});
    const { data, isLoading, isError, refetch } = usePostes({ limit: 50, ...filtres } as any);
    const supprimer = useSupprimerPoste();
    const postes = data?.data || [];

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editPoste, setEditPoste] = useState<Poste | null>(null);
    const [deletePosteId, setDeletePosteId] = useState<string | null>(null);


    const colonnes: Column<Poste>[] = useMemo(() => [
        {
            key: 'intitule',
            header: t('intitulePoste'),
            sortable: true,
            render: (p) => (
                <div className="cursor-pointer" onClick={() => navigate({ to: '/organisation/postes/$id', params: { id: p.id } })}>
                    <p className="font-medium text-foreground">{p.intitulé}</p>
                    <p className="text-xs text-muted-foreground font-mono">{p.code}</p>
                </div>
            ),
        },
        {
            key: 'fonction',
            header: t('fonction'),
            render: (p) => (
                <span className="text-sm text-muted-foreground">{p.fonction?.nom || '-'}</span>
            ),
        },
        {
            key: 'unite',
            header: t('unites'),
            render: (p) => (
                <span className="text-sm text-muted-foreground">{p.uniteOrganisationnelle?.nom || '-'}</span>
            ),
        },
        {
            key: 'typePersonnel',
            header: t('type'),
            render: (p) => (
                <span className="text-sm text-muted-foreground">{p.typePersonnel?.nom || p.typePersonnelId || '-'}</span>
            ),
        },
        {
            key: 'statut',
            header: t('statut'),
            render: (p) => (
                <Badge variant={statutColors[p.statut] || 'default'} size="sm">
                    {statutLabels[p.statut] || p.statut}
                </Badge>
            ),
        },
        {
            key: 'capacite',
            header: 'Capacité',
            render: (p) => (
                <PosteCapaciteIndicator occupantsCount={p.occupantsCount} nombrePostes={p.nombrePostes} size="sm" />
            ),
        },
        {
            key: 'actions',
            header: 'Actions',
            className: 'text-right w-48',
            renderActions: (p) => {
                const actions: any[] = [];
                actions.push({
                    key: 'voir',
                    icon: Eye,
                    label: 'Voir',
                    onClick: () => navigate({ to: '/organisation/postes/$id', params: { id: p.id } }),
                });
                if (hasPermission('postes:edit')) {
                    actions.push({
                        key: 'modifier', icon: Edit, label: t('modifier'),
                        onClick: () => setEditPoste(p),
                    });
                    if (hasPermission('postes:delete')) {
                        actions.push({
                            key: 'supprimer', icon: Trash2, label: t('supprimer'),
                            onClick: () => setDeletePosteId(p.id), variant: 'danger' as const,
                        });
                    }
                }
                return actions;
            },
        },
    ], [navigate, hasPermission, t]);

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <AlertCircle className="h-12 w-12 text-destructive" />
                <p className="text-lg font-medium text-destructive">Erreur de chargement</p>
                <ElisaButton variant="outline" onClick={() => refetch()}>Réessayer</ElisaButton>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">{t('postes')}</h1>
                    <p className="text-sm text-muted-foreground">{t('description')}</p>
                </div>
                {hasPermission('postes:create') && (
                    <ElisaButton variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setShowCreateModal(true)}>
                        {t('nouveauPosteBtn')}
                    </ElisaButton>
                )}
            </div>

            <div className="bg-card rounded-xl shadow-sm border border-border">
                <DataTable
                    columns={colonnes}
                    data={postes}
                    isLoading={isLoading}
                    tableId="postes-list"
                    searchPlaceholder={t('rechercherPoste')}
                    filtres={[
                        {
                            key: 'statut', label: t('statut'),
                            options: STATUT_POSTE_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
                            allOptionLabel: t('tousLesStatuts'),
                        },
                    ]}
                    onFilterChange={(key, value) => {
                        setFiltres((prev) => ({ ...prev, [key]: value || undefined }));
                    }}
                />
            </div>

            <PosteFormModal open={showCreateModal} onOpenChange={setShowCreateModal} />

            {editPoste && (
                <PosteFormModal open={!!editPoste} onOpenChange={() => setEditPoste(null)} poste={editPoste} />
            )}

            <ConfirmDialog
                open={!!deletePosteId}
                onOpenChange={(open) => { if (!open) setDeletePosteId(null); }}
                title={t('supprimerPoste')}
                description={t('confirmerSuppressionPoste')}
                confirmText={t('supprimer')}
                variant="danger"
                onConfirm={async () => {
                    if (deletePosteId) { await supprimer.mutateAsync(deletePosteId); setDeletePosteId(null); }
                }}
                isLoading={supprimer.isPending}
            />

        </div>
    );
}
