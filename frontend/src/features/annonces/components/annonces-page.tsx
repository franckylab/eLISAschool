/**
 * ==================================
 * eLISAschool - Page Annonces
 * ==================================
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Megaphone, Plus, Eye, Edit, Trash2, Calendar, Clock } from 'lucide-react';
import { DataTable, Column } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { useAnnonces, useSupprimerAnnonce } from '../hooks/use-annonces';
import type { Annonce } from '../types/annonce.types';

export function AnnoncesPage() {
    const { t } = useTranslation('annonces');
    const [page, setPage] = useState(1);
    const limit = 20;
    const [recherche, setRecherche] = useState('');

    const { data, isLoading } = useAnnonces({ page, limit, recherche });
    const supprimer = useSupprimerAnnonce();

    const colonnes: Column<Annonce>[] = [
        {
            key: 'titre',
            header: 'Titre',
            sortable: true,
            render: (a) => (
                <div className="flex items-center gap-2">
                    <Megaphone className="h-4 w-4 text-[var(--color-text-muted)]" />
                    <span className="font-medium">{a.titre}</span>
                </div>
            ),
        },
        {
            key: 'contenu',
            header: 'Contenu',
            render: (a) => (
                <span className="line-clamp-1 text-sm text-[var(--color-text-secondary)]">
                    {a.contenu}
                </span>
            ),
        },
        {
            key: 'priorite',
            header: 'Priorité',
            className: 'text-center',
            render: (a) => {
                const couleurs: Record<string, string> = {
                    haute: 'red',
                    moyenne: 'yellow',
                    basse: 'green',
                };
                const couleur = a.priorite ? couleurs[a.priorite] || 'gray' : 'gray';
                return (
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium bg-${couleur}-100 text-${couleur}-800`}>
                        {a.priorite || 'normale'}
                    </span>
                );
            },
        },
        {
            key: 'datePublication',
            header: 'Publication',
            sortable: true,
            render: (a) => (
                <div className="text-sm">
                    <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(a.datePublication).toLocaleDateString('fr-FR')}
                    </div>
                    {a.dateExpiration && (
                        <div className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                            <Clock className="h-3 w-3" />
                            Exp: {new Date(a.dateExpiration).toLocaleDateString('fr-FR')}
                        </div>
                    )}
                </div>
            ),
        },
        {
            key: 'statut',
            header: 'Statut',
            className: 'text-center',
            render: (a) => {
                const statut = a.estActive ? { label: 'Active', color: 'green' } : { label: 'Inactive', color: 'gray' };
                return (
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-${statut.color}-100 text-${statut.color}-800`}>
                        {statut.label}
                    </span>
                );
            },
        },
        {
            key: 'actions',
            header: 'Actions',
            className: 'text-right',
            renderActions: (a) => [
                {
                    key: 'voir',
                    icon: Eye,
                    label: 'Voir',
                    onClick: () => {/* Voir annonce */},
                },
                {
                    key: 'modifier',
                    icon: Edit,
                    label: 'Modifier',
                    onClick: () => {/* Modifier annonce */},
                },
                {
                    key: 'supprimer',
                    icon: Trash2,
                    label: 'Supprimer',
                    onClick: () => {
                        if (confirm('Supprimer cette annonce ?')) {
                            supprimer.mutateAsync(a.id);
                        }
                    },
                    variant: 'danger' as const,
                },
            ],
        },
    ];

    return (
        <div className="flex flex-col gap-6 p-6">
            <motion.div
                className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div>
                    <h1 className="text-3xl font-bold">{t('titre', { defaultValue: 'Annonces' })}</h1>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                        {data?.meta?.totalItems || 0} annonce(s)
                    </p>
                </div>
                <ElisaButton
                    variant="primary"
                    size="sm"
                    icon={<Plus className="h-4 w-4" />}
                >
                    {t('boutons.nouvelle', { defaultValue: 'Nouvelle annonce' })}
                </ElisaButton>
            </motion.div>

            <DataTable
                tableId="annonces"
                data={data?.items || []}
                columns={colonnes}
                isLoading={isLoading}
                enableReordering
                enablePinning
                enableColumnVisibility
                searchPlaceholder={t('filtres.recherche', { defaultValue: 'Rechercher...' })}
                enableRowHeight
                onSearchChange={(recherche) => {
                    setRecherche(recherche);
                    setPage(1);
                }}
                disableClientSearch
                pagination={data?.meta ? {
                    page: data.meta.currentPage,
                    limit: data.meta.itemsPerPage,
                    total: data.meta.totalItems,
                    totalPages: data.meta.totalPages,
                    hasNext: data.meta.currentPage < data.meta.totalPages,
                    hasPrev: data.meta.currentPage > 1,
                } : undefined}
                onPageChange={(newPage) => setPage(newPage)}
            />
        </div>
    );
}
