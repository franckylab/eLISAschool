/**
 * ==================================
 * eLISAschool - Onglet Hiérarchie (relations hiérarchiques)
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 *
 * Liste des relations hiérarchiques (personne→personne et poste→poste)
 * avec libellés lisibles, filtres segmentés et actions CRUD.
 */

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit, Trash2, User, Briefcase, Network, ArrowUpRight, Link2, RefreshCw } from 'lucide-react';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/layout/PageHeader';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { usePermissions, useDocumentTitle } from '@/hooks';
import { useHierarchies, useSupprimerHierarchie } from '../hooks/use-organisation';
import { HierarchieFormModal } from './hierarchie-form-modal';
import { libelleExtremite, estRelationPoste, uniteRelation } from './hierarchie-libelles';
import type { HierarchiePersonnel, StatutRelation } from '../types/organisation.types';

type FiltreHierarchie = 'tous' | 'personnes' | 'postes' | 'DIRECT' | 'FONCTIONNEL';

const STATUT_VARIANT: Record<StatutRelation, 'success' | 'warning' | 'secondary'> = {
    ACTIVE: 'success',
    PLANIFIEE: 'warning',
    HISTORIQUE: 'secondary',
};

function CelluleExtremite({ h, cote }: { h: HierarchiePersonnel; cote: 'subordonne' | 'superieur' }) {
    const ext = libelleExtremite(h, cote);
    const Icone = ext.type === 'poste' ? Briefcase : User;
    return (
        <div className="flex items-center" style={{ gap: 'var(--gap-sm)' }}>
            <Icone className="shrink-0 text-[var(--color-text-muted)]" style={{ width: 'var(--icon-sm)', height: 'var(--icon-sm)' }} aria-hidden />
            <div className="flex flex-col min-w-0">
                <span className="font-medium text-foreground truncate">{ext.label}</span>
                {ext.sousLabel && (
                    <span className="text-xs text-[var(--color-text-muted)] truncate">{ext.sousLabel}</span>
                )}
            </div>
        </div>
    );
}

export function TabHierarchie() {
    const { t } = useTranslation('organisation');
    const { hasPermission } = usePermissions();
    useDocumentTitle('eLISAschool | Hiérarchie');
    const { data: hierarchies, isLoading, isError, refetch } = useHierarchies();
    const supprimer = useSupprimerHierarchie();

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editHierarchie, setEditHierarchie] = useState<HierarchiePersonnel | null>(null);
    const [deleteHierarchieId, setDeleteHierarchieId] = useState<string | null>(null);
    const [filtre, setFiltre] = useState<FiltreHierarchie>('tous');

    const FILTRES: Array<{ value: FiltreHierarchie; label: string }> = [
        { value: 'tous', label: t('filtreTous') },
        { value: 'personnes', label: t('filtrePersonnes') },
        { value: 'postes', label: t('filtrePostes') },
        { value: 'DIRECT', label: t('typeRelation_DIRECT') },
        { value: 'FONCTIONNEL', label: t('typeRelation_FONCTIONNEL') },
    ];

    const donnees = useMemo(() => {
        const liste = hierarchies || [];
        if (filtre === 'personnes') return liste.filter((h) => !estRelationPoste(h));
        if (filtre === 'postes') return liste.filter(estRelationPoste);
        if (filtre === 'DIRECT' || filtre === 'FONCTIONNEL') return liste.filter((h) => h.typeRelation === filtre);
        return liste;
    }, [hierarchies, filtre]);

    const colonnes: Column<HierarchiePersonnel>[] = [
        { key: 'subordonne', header: t('colSubordonne'), render: (h) => <CelluleExtremite h={h} cote="subordonne" /> },
        { key: 'superieur', header: t('colSuperieur'), render: (h) => <CelluleExtremite h={h} cote="superieur" /> },
        {
            key: 'typeRelation',
            header: t('colTypeRelation'),
            render: (h) => h.typeRelation === 'FONCTIONNEL' ? (
                <Badge variant="outline" size="sm" className="border-dashed" icon={<Link2 style={{ width: 'var(--icon-xs)', height: 'var(--icon-xs)' }} aria-hidden />}>
                    {t('typeRelation_FONCTIONNEL')}
                </Badge>
            ) : (
                <Badge variant="default" size="sm" className="bg-primary/10" icon={<ArrowUpRight style={{ width: 'var(--icon-xs)', height: 'var(--icon-xs)' }} aria-hidden />}>
                    {t('typeRelation_DIRECT')}
                </Badge>
            ),
        },
        {
            key: 'unite',
            header: t('colUnite'),
            render: (h) => uniteRelation(h)
                ? <span className="text-sm text-foreground truncate">{uniteRelation(h)}</span>
                : <span className="text-sm text-[var(--color-text-muted)]">—</span>,
        },
        {
            key: 'statut',
            header: t('colStatut'),
            render: (h) => (
                <Badge variant={STATUT_VARIANT[h.statut] || 'secondary'} size="sm">
                    {t(`statutRelation_${h.statut}`)}
                </Badge>
            ),
        },
        {
            key: 'actions',
            header: t('colActions'),
            className: 'text-right w-24',
            renderActions: (h) => [
                { key: 'modifier', icon: Edit, label: t('modifier'), onClick: () => setEditHierarchie(h), permission: 'organisation:hierarchie:write', variant: 'warning' as const },
                { key: 'supprimer', icon: Trash2, label: t('supprimer'), onClick: () => setDeleteHierarchieId(h.id), permission: 'organisation:hierarchie:delete', variant: 'danger' as const },
            ],
        },
    ];

    return (
        <div className="flex flex-col" style={{ gap: 'var(--gap-lg)', padding: 'var(--space-lg)' }}>
            <PageHeader
                title={t('hierarchie')}
                subtitle={t('relationsHierarchiques')}
                icon={Network}
                variant="gradient"
                actions={hasPermission('organisation:hierarchie:write') ? (
                    <ElisaButton variant="primary" size="sm" icon={<Plus style={{ width: 'var(--icon-sm)', height: 'var(--icon-sm)' }} aria-hidden />}
                        onClick={() => setShowCreateModal(true)}>
                        {t('nouvelleRelationBtn')}
                    </ElisaButton>
                ) : undefined}
            />

            <div role="group" aria-label={t('colTypeRelation')} className="flex flex-wrap items-center" style={{ gap: 'var(--gap-sm)' }}>
                {FILTRES.map((f) => (
                    <button
                        key={f.value}
                        type="button"
                        aria-pressed={filtre === f.value}
                        onClick={() => setFiltre(f.value)}
                        className={`rounded-full border px-3 text-sm transition-colors min-h-[44px] ${filtre === f.value
                            ? 'border-transparent bg-[var(--color-dominant-600)] text-white'
                            : 'border-[var(--color-bordure)] bg-transparent text-[var(--color-text-muted)] hover:bg-[var(--color-dominant-50)] hover:text-[var(--color-dominant-600)]'}`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {isError ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card text-center" style={{ gap: 'var(--gap-md)', padding: 'var(--space-xl)' }}>
                    <p className="text-sm text-destructive">{t('erreurChargement')}</p>
                    <ElisaButton variant="secondary" size="sm" icon={<RefreshCw style={{ width: 'var(--icon-sm)', height: 'var(--icon-sm)' }} aria-hidden />} onClick={() => refetch()}>
                        {t('reessayer')}
                    </ElisaButton>
                </div>
            ) : (
                <DataTable
                    tableId="hierarchie-table"
                    columns={colonnes}
                    data={donnees}
                    isLoading={isLoading}
                    emptyMessage={t('aucuneHierarchie')}
                />
            )}

            {showCreateModal && (
                <HierarchieFormModal open={showCreateModal} onOpenChange={setShowCreateModal} />
            )}

            {editHierarchie && (
                <HierarchieFormModal open={!!editHierarchie} onOpenChange={() => setEditHierarchie(null)} hierarchie={editHierarchie} />
            )}

            <ConfirmationModal
                isOpen={!!deleteHierarchieId}
                onCancel={() => setDeleteHierarchieId(null)}
                onConfirm={async () => {
                    if (deleteHierarchieId) {
                        await supprimer.mutateAsync(deleteHierarchieId);
                        setDeleteHierarchieId(null);
                    }
                }}
                title={t('supprimerRelation')}
                message={t('confirmerSuppressionRelation')}
                confirmLabel={t('supprimer')}
                cancelLabel={t('annuler')}
                variant="danger"
            />
        </div>
    );
}
