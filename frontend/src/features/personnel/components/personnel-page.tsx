/**
 * ==================================
 * eLISAschool - Page Personnel
 * ==================================
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Plus, Search } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { usePersonnel, useSupprimerPersonnel } from '../hooks/use-personnel';
import { PersonnelFormModal } from './personnel-form-modal';
import { DataTable } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { usePermissions } from '@/hooks';
import type { MembrePersonnel, PersonnelFiltres } from '../types/personnel.types';
import type { Column } from '@/components/ui/DataTable';

export function PersonnelPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    const [filtres, setFiltres] = useState<PersonnelFiltres>({ page: 1, limit: 20 });
    const [modalOpen, setModalOpen] = useState(false);
    const [membreSelected, setMembreSelected] = useState<MembrePersonnel | undefined>();
    const [modeFormulaire, setModeFormulaire] = useState<'creation' | 'edition'>('creation');
    const [membreToDelete, setMembreToDelete] = useState<MembrePersonnel | null>(null);

    const { data, isLoading, error, refetch } = usePersonnel(filtres);
    const supprimer = useSupprimerPersonnel();

    const handleCreation = () => {
        setModeFormulaire('creation');
        setMembreSelected(undefined);
        setModalOpen(true);
    };

    const handleEdition = (membre: MembrePersonnel) => {
        setModeFormulaire('edition');
        setMembreSelected(membre);
        setModalOpen(true);
    };

    const handleSuccess = () => {
        setModalOpen(false);
        setMembreSelected(undefined);
    };

    const colonnes: Column<MembrePersonnel>[] = [
        {
            key: 'matricule',
            header: 'Matricule',
            sortable: true,
            render: (p) => <span className="font-mono text-sm font-medium text-[var(--color-dominant-600)]">{p.matricule}</span>,
        },
        {
            key: 'nomComplet',
            header: t('commun.nom'),
            sortable: true,
            render: (p) => (
                <button
                    onClick={() => navigate({ to: '/personnel/$id', params: { id: p.id } })}
                    className="hover:underline cursor-pointer text-left"
                >
                    <div>
                        <p className="font-medium">{p.prenom} {p.nom}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">{p.email || p.telephone || '-'}</p>
                    </div>
                </button>
            ),
        },
        {
            key: 'poste',
            header: 'Poste',
            sortable: true,
            render: (p) => (
                <div>
                    <p className="font-medium">{p.poste}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{p.departement || '-'}</p>
                </div>
            ),
        },
        {
            key: 'typeContrat',
            header: 'Contrat',
            sortable: true,
            className: 'text-center',
            render: (p) => {
                const contrats: any = { cdi: 'CDI', cdd: 'CDD', vacataire: 'Vacataire', stage: 'Stage' };
                return <span className="rounded bg-[var(--color-secondary-100)] px-2 py-1 text-xs font-medium">{contrats[p.typeContrat]}</span>;
            },
        },
        {
            key: 'dateEntree',
            header: 'Date entrée',
            sortable: true,
            render: (p) => new Date(p.dateEntree).toLocaleDateString('fr-FR'),
        },
        {
            key: 'statut',
            header: t('commun.statut'),
            sortable: true,
            className: 'text-center',
            render: (p) => {
                const statuts: any = {
                    actif: { label: 'Actif', color: 'green' },
                    inactif: { label: 'Inactif', color: 'gray' },
                    en_conge: { label: 'En congé', color: 'blue' },
                    demission: { label: 'Démission', color: 'red' },
                };
                const s = statuts[p.statut] || statuts.actif;
                return <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium bg-${s.color}-100 text-${s.color}-800`}>{s.label}</span>;
            },
        },
        {
            key: 'actions',
            header: t('commun.actions'),
            className: 'text-right',
            render: (p) => (
                <div className="flex justify-end gap-2">
                    {hasPermission('personnel:edit') && (
                        <ElisaButton variant="ghost" size="sm" onClick={() => handleEdition(p)}>{t('boutons.modifier')}</ElisaButton>
                    )}
                    {hasPermission('personnel:delete') && (
                        <ElisaButton
                            variant="danger"
                            size="sm"
                            isLoading={supprimer.isPending}
                            onClick={() => setMembreToDelete(p)}
                        >
                            {t('boutons.supprimer')}
                        </ElisaButton>
                    )}
                </div>
            ),
        },
    ];

    // Affichage skeleton pendant le chargement
    if (isLoading) {
        return <PageSkeleton showStats showTable />;
    }

    // Affichage message d'erreur
    if (error) {
        return (
            <div className="p-6">
                <ErrorMessage
                    title="Erreur de chargement"
                    message={error.message || "Impossible de charger les données du personnel"}
                    onRetry={() => refetch()}
                    retryLabel="Réessayer"
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <motion.div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <div>
                    <h1 className="text-3xl font-bold">{t('personnel.titre', { defaultValue: 'Personnel' })}</h1>
                    <p className="text-sm text-[var(--color-text-secondary)]">{data?.pagination?.total || 0} membre(s)</p>
                </div>
                {hasPermission('personnel:create') && (
                    <ElisaButton variant="primary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={handleCreation}>{t('boutons.nouveau')}</ElisaButton>
                )}
            </motion.div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
                <input
                    type="text"
                    placeholder={t('filtres.recherche')}
                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-2 pl-10 pr-4 text-sm focus:border-[var(--color-dominant-500)] focus:outline-none focus:ring-2 focus:ring-[var(--color-dominant-500)]/20"
                    value={filtres.recherche || ''}
                    onChange={(e) => setFiltres((prev) => ({ ...prev, recherche: e.target.value, page: 1 }))}
                />
            </div>

            <DataTable
                data={data?.data || []}
                columns={colonnes}
                isLoading={isLoading}
                pagination={data?.pagination}
                onPageChange={(page) => setFiltres((prev) => ({ ...prev, page }))}
                onLimitChange={(limit) => setFiltres((prev) => ({ ...prev, limit, page: 1 }))}
            />

            {modalOpen && (
                <PersonnelFormModal
                    mode={modeFormulaire}
                    membre={membreSelected}
                    onSuccess={handleSuccess}
                    onCancel={() => setModalOpen(false)}
                />
            )}

            <ConfirmationModal
                isOpen={!!membreToDelete}
                title="Supprimer ce membre du personnel"
                message={`Êtes-vous sûr de vouloir supprimer ${membreToDelete?.prenom} ${membreToDelete?.nom} ?`}
                details="Cette action est irréversible et supprimera toutes les données associées."
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
