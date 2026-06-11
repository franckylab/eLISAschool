/**
 * ==================================
 * eLISAschool - Page Niveaux
 * ==================================
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Plus, Search } from 'lucide-react';
import { useNiveaux, useSupprimerNiveau } from '../hooks/use-niveaux';
import { DataTable } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { usePermissions } from '@/hooks';
import type { Niveau, NiveauFiltres } from '../types/niveau.types';
import type { Column } from '@/components/ui/DataTable';

export function NiveauxPage() {
    const { t } = useTranslation();
    const { hasPermission } = usePermissions();
    const [filtres, setFiltres] = useState<NiveauFiltres>({ page: 1, limit: 20 });

    const { data, isLoading } = useNiveaux(filtres);
    const supprimer = useSupprimerNiveau();

    const colonnes: Column<Niveau>[] = [
        {
            key: 'code',
            header: 'Code',
            sortable: true,
            render: (n) => (
                <span className="font-mono text-sm font-semibold text-[var(--color-dominant-600)]">{n.code}</span>
            ),
        },
        {
            key: 'nom',
            header: 'Nom',
            sortable: true,
            render: (n) => (
                <div>
                    <span className="font-medium">{n.nom}</span>
                    {n.cycle && (
                        <p className="text-xs text-[var(--color-text-muted)]">{n.cycle.nom}</p>
                    )}
                </div>
            ),
        },
        {
            key: 'ordre',
            header: 'Ordre',
            sortable: true,
            className: 'text-center',
            render: (n) => (
                <span className="inline-flex items-center justify-center rounded-full bg-[var(--color-dominant-100)] px-3 py-1 text-sm font-semibold text-[var(--color-dominant-800)]">{n.ordre}</span>
            ),
        },
        {
            key: 'statut',
            header: 'Statut',
            sortable: true,
            className: 'text-center',
            render: (n) => (
                <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${n.statut === 'actif' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {n.statut === 'actif' ? 'Actif' : 'Inactif'}
                </span>
            ),
        },
        {
            key: 'actions',
            header: 'Actions',
            className: 'text-right',
            render: (n) => (
                <div className="flex justify-end gap-2">
                    {hasPermission('niveaux:edit') && (
                        <ElisaButton variant="ghost" size="sm">Modifier</ElisaButton>
                    )}
                    {hasPermission('niveaux:delete') && (
                        <ElisaButton
                            variant="danger"
                            size="sm"
                            isLoading={supprimer.isPending}
                            onClick={() => {
                                if (confirm('Supprimer ce niveau ?')) {
                                    supprimer.mutateAsync(n.id);
                                }
                            }}
                        >
                            Supprimer
                        </ElisaButton>
                    )}
                </div>
            ),
        },
    ];

    return (
        <div className="flex flex-col gap-6 p-6">
            <motion.div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <div>
                    <h1 className="text-3xl font-bold">Niveaux</h1>
                    <p className="text-sm text-[var(--color-text-secondary)]">{data?.meta ? { page: data.meta.currentPage, limit: data.meta.itemsPerPage, total: data.meta.totalItems, totalPages: data.meta.totalPages, hasNext: data.meta.currentPage < data.meta.totalPages, hasPrev: data.meta.currentPage > 1 } : undefined?.total || 0} niveau(x)</p>
                </div>
                {hasPermission('niveaux:create') && (
                    <ElisaButton variant="primary" size="sm" icon={<Plus className="h-4 w-4" />}>
                        Nouveau niveau
                    </ElisaButton>
                )}
            </motion.div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
                <input type="text" placeholder="Rechercher..." className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-2 pl-10 pr-4 text-sm focus:border-[var(--color-dominant-500)] focus:outline-none focus:ring-2 focus:ring-[var(--color-dominant-500)]/20" value={filtres.recherche || ''} onChange={(e) => setFiltres((prev) => ({ ...prev, recherche: e.target.value, page: 1 }))} />
            </div>

            <DataTable
                data={data?.items || []}
                columns={colonnes}
                isLoading={isLoading}
                pagination={data?.meta ? { page: data.meta.currentPage, limit: data.meta.itemsPerPage, total: data.meta.totalItems, totalPages: data.meta.totalPages, hasNext: data.meta.currentPage < data.meta.totalPages, hasPrev: data.meta.currentPage > 1 } : undefined}
                onPageChange={(page) => setFiltres((prev) => ({ ...prev, page }))}
                onLimitChange={(limit) => setFiltres((prev) => ({ ...prev, limit, page: 1 }))}
            />
        </div>
    );
}
