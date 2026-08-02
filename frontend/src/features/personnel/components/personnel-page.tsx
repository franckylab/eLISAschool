/**
 * ==================================
 * eLISAschool - Page Personnel
 * ==================================
 */

import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Plus, Edit, Trash2, Eye, Users } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { usePersonnel, useSupprimerPersonnel } from '../hooks/use-personnel';
import { CATEGORIES_FONCTION, getCategorieColors, type CategorieFonction } from '@/lib/categorie-fonction';
import { PersonnelFormModal } from './personnel-form-modal';
import { DataTable } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { SchoolLoading, ErrorState } from '@/components/feedback';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { usePermissions } from '@/hooks';
import type { MembrePersonnel, PersonnelFiltres } from '../types/personnel.types';
import type { Column } from '@/components/ui/DataTable';
import { formatDate } from '@/lib/date-utils';

const STATUT_CLASSES: Record<string, string> = {
    ACTIF: 'bg-success/10 text-success',
    EN_ATTENTE_VALIDATION: 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]',
    INACTIF: 'bg-muted text-muted-foreground',
    CONGE: 'bg-primary/10 text-primary',
    DEMISSION: 'bg-destructive/10 text-destructive',
};

export function PersonnelPage() {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    const [filtres, setFiltres] = useState<PersonnelFiltres>({ page: 1, limit: 20 });
    const [modalOpen, setModalOpen] = useState(false);
    const [membreSelected, setMembreSelected] = useState<MembrePersonnel | undefined>();
    const [modeFormulaire, setModeFormulaire] = useState<'creation' | 'edition'>('creation');
    const [modalKey, setModalKey] = useState(0);
    const [membreToDelete, setMembreToDelete] = useState<MembrePersonnel | null>(null);

    const { data, isLoading, isFetching, error, refetch } = usePersonnel(filtres);
    const supprimer = useSupprimerPersonnel();

    const handleCreation = () => {
        setModeFormulaire('creation');
        setMembreSelected(undefined);
        setModalKey(k => k + 1);
        setModalOpen(true);
    };

    const handleEdition = (membre: MembrePersonnel) => {
        setModeFormulaire('edition');
        setMembreSelected(membre);
        setModalKey(k => k + 1);
        setModalOpen(true);
    };

    const handleSuccess = () => {
        setModalOpen(false);
        setMembreSelected(undefined);
    };

    const colonnes: Column<MembrePersonnel>[] = [
        {
            key: 'matricule',
            header: t('personnel:matricule'),
            sortable: true,
            render: (p) => <span className="font-mono text-sm font-medium text-[var(--color-dominant-600)]">{p.matricule}</span>,
        },
        {
            key: 'nomComplet',
            header: t('commun.nom'),
            sortable: true,
            render: (p) => {
                const prenom = p.utilisateur?.profil?.prenom ?? '';
                const nom = p.utilisateur?.profil?.nom ?? '';
                const email = p.utilisateur?.email ?? '';
                const tel = p.utilisateur?.profil?.telephone ?? '';
                return (
                    <button
                        onClick={() => navigate({ to: '/personnel/$id', params: { id: p.id } })}
                        className="hover:underline cursor-pointer text-left"
                    >
                        <div>
                            <p className="font-medium">{prenom} {nom}</p>
                            <p className="text-xs text-[var(--color-text-muted)]">{email || tel || '-'}</p>
                        </div>
                    </button>
                );
            },
        },
        {
            key: 'categorie',
            header: t('personnel.categorie', { defaultValue: 'Catégorie' }),
            className: 'text-center',
            render: (p) => {
                if (!p.categorie) return <span className="text-xs text-muted-foreground">-</span>;
                const colors = getCategorieColors(p.categorie);
                return (
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium ${colors.bg} ${colors.text}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
                        {t(`personnel.categorie_${p.categorie}`, { defaultValue: p.categorie })}
                    </span>
                );
            },
        },
        {
            key: 'dateEntree',
            header: t('personnel:dateEntree'),
            sortable: true,
            render: (p) => {
                const d = p.dateEmbauche;
                return d ? formatDate(d) : '-';
            },
        },
        {
            key: 'statut',
            header: t('commun.statut'),
            sortable: true,
            className: 'text-center',
            render: (p) => {
                const statutKey = (p.statut || 'ACTIF').toUpperCase().replace('EN_CONGE', 'CONGE');
                const classes = STATUT_CLASSES[statutKey] ?? STATUT_CLASSES.ACTIF;
                return (
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${classes}`}>
                        {t(`personnel:statut_${statutKey}`, { defaultValue: statutKey })}
                    </span>
                );
            },
        },
        {
            key: 'actions',
            header: t('commun.actions'),
            className: 'text-right',
            renderActions: (p) => [
                {
                    key: 'voir',
                    icon: Eye,
                    label: t('boutons.voir'),
                    onClick: () => navigate({ to: '/personnel/$id', params: { id: p.id } }),
                    variant: 'info' as const,
                },
                {
                    key: 'modifier',
                    icon: Edit,
                    label: t('boutons.modifier'),
                    onClick: () => handleEdition(p),
                    permission: 'personnel:edit',
                },
                {
                    key: 'supprimer',
                    icon: Trash2,
                    label: t('boutons.supprimer'),
                    onClick: () => setMembreToDelete(p),
                    permission: 'personnel:delete',
                    variant: 'danger' as const,
                },
            ],
        },
    ];

    // Affichage loading uniquement au premier chargement
    if (isLoading && !data) {
        return (
            <div className="p-6">
                <SchoolLoading message={t('personnel:chargementListe')} />
            </div>
        );
    }

    // Affichage message d'erreur
    if (error) {
        return (
            <div className="p-6">
                <ErrorState
                    message={error.message || t('personnel:erreurChargement')}
                    onRetry={() => refetch()}
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <PageHeader
                title={t('personnel.titre', { defaultValue: 'Personnel' })}
                subtitle={t('personnel:membres', { count: data?.meta?.totalItems || 0 })}
                icon={Users}
                variant="gradient"
                actions={hasPermission('personnel:create') ? (
                    <ElisaButton variant="primary" size="sm" icon={<Plus className="h-4 w-4" />}
                        onClick={handleCreation}>{t('boutons.nouveau')}</ElisaButton>
                ) : undefined}
            />

            {/* Filtre par catégorie de fonction */}
            <div className="flex items-center gap-3">
                <div className="relative w-64">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <select
                        value={filtres.categorie || ''}
                        onChange={(e) => setFiltres((prev) => ({ ...prev, categorie: (e.target.value || undefined) as CategorieFonction | undefined, page: 1 }))}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-input rounded-lg bg-background text-foreground appearance-none cursor-pointer focus:ring-2 focus:ring-primary focus:border-primary"
                    >
                        <option value="">{t('personnel.toutesCategories', { defaultValue: 'Toutes les catégories' })}</option>
                        {CATEGORIES_FONCTION.map((c) => (
                            <option key={c} value={c}>{t(`personnel.categorie_${c}`, { defaultValue: c })}</option>
                        ))}
                    </select>
                </div>
            </div>

            <DataTable
                tableId="personnel"
                data={data?.items || []}
                columns={colonnes}
                isLoading={isLoading}
                isFetching={isFetching}
                enableReordering
                enablePinning
                enableColumnVisibility
                searchPlaceholder={t('filtres.recherche')}
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
            />

            {modalOpen && (
                <PersonnelFormModal
                    key={modalKey}
                    mode={modeFormulaire}
                    membre={membreSelected}
                    onSuccess={handleSuccess}
                    onCancel={() => setModalOpen(false)}
                />
            )}

            <ConfirmationModal
                isOpen={!!membreToDelete}
                title={t('personnel:detail.confirmSuppressionTitre')}
                message={t('personnel:detail.confirmSuppressionMessage', { nom: `${membreToDelete?.utilisateur?.profil?.prenom ?? ''} ${membreToDelete?.utilisateur?.profil?.nom ?? ''}`.trim() })}
                details={t('personnel:confirmSuppressionDetails')}
                variant="danger"
                onConfirm={async () => {
                    if (membreToDelete) {
                        await supprimer.mutateAsync(membreToDelete.id);
                        setMembreToDelete(null);
                    }
                }}
                onCancel={() => setMembreToDelete(null)}
                isLoading={supprimer.isPending}
            />
        </div>
    );
}
