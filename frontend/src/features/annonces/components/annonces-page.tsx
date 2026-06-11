/**
 * ==================================
 * eLISAschool - Page Annonces
 * ==================================
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Megaphone, Plus, Search, Eye, Edit, Trash2, Calendar, Clock } from 'lucide-react';
import { DataTable, Column } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { useAnnonces, useSupprimerAnnonce, useCreerAnnonce } from '../hooks/use-annonces';
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
            render: (a) => (
                <div className="flex justify-end gap-2">
                    <ElisaButton variant="ghost" size="sm" icon={<Eye className="h-4 w-4" />}>
                        Voir
                    </ElisaButton>
                    <ElisaButton variant="ghost" size="sm" icon={<Edit className="h-4 w-4" />}>
                        Modifier
                    </ElisaButton>
                    <ElisaButton
                        variant="danger"
                        size="sm"
                        icon={<Trash2 className="h-4 w-4" />}
                        isLoading={supprimer.isPending}
                        onClick={() => {
                            if (confirm('Supprimer cette annonce ?')) {
                                supprimer.mutateAsync(a.id);
                            }
                        }}
                    />
                </div>
            ),
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

            <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
                <input
                    type="text"
                    placeholder={t('filtres.recherche', { defaultValue: 'Rechercher...' })}
                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-2 pl-10 pr-4 text-sm focus:border-[var(--color-dominant-500)] focus:outline-none focus:ring-2 focus:ring-[var(--color-dominant-500)]/20"
                    value={recherche}
                    onChange={(e) => {
                        setRecherche(e.target.value);
                        setPage(1);
                    }}
                />
            </div>

            <DataTable
                data={data?.items || []}
                columns={colonnes}
                isLoading={isLoading}
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
