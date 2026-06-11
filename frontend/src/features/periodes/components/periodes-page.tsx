/**
 * ==================================
 * eLISAschool - Page Périodes
 * ==================================
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Plus, Search, Calendar } from 'lucide-react';
import { usePeriodes, useSupprimerPeriode } from '../hooks/use-periodes';
import { DataTable } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { usePermissions } from '@/hooks';
import type { Periode, PeriodeFiltres } from '../types/periode.types';
import type { Column } from '@/components/ui/DataTable';

export function PeriodesPage() {
    const { t } = useTranslation();
    const { hasPermission } = usePermissions();
    const [filtres, setFiltres] = useState<PeriodeFiltres>({ page: 1, limit: 20 });

    const { data, isLoading } = usePeriodes(filtres);
    const supprimer = useSupprimerPeriode();

    const typesLabel: any = {
        trimestre: { label: 'Trimestre', color: 'blue' },
        semestre: { label: 'Semestre', color: 'purple' },
        module: { label: 'Module', color: 'orange' },
        autre: { label: 'Autre', color: 'gray' },
    };

    const colonnes: Column<Periode>[] = [
        {
            key: 'code',
            header: 'Code',
            sortable: true,
            render: (p) => (
                <span className="font-mono text-sm font-semibold text-[var(--color-dominant-600)]">{p.code}</span>
            ),
        },
        {
            key: 'nom',
            header: 'Nom',
            sortable: true,
            render: (p) => (
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[var(--color-text-muted)]" />
                    <span className="font-medium">{p.nom}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium bg-${typesLabel[p.type]?.color}-100 text-${typesLabel[p.type]?.color}-800`}>
                        {typesLabel[p.type]?.label}
                    </span>
                </div>
            ),
        },
        {
            key: 'periode',
            header: 'Période',
            render: (p) => (
                <div className="text-sm">
                    <p>{new Date(p.dateDebut).toLocaleDateString('fr-FR')}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">→ {new Date(p.dateFin).toLocaleDateString('fr-FR')}</p>
                </div>
            ),
        },
        {
            key: 'anneeScolaire',
            header: 'Année Scolaire',
            sortable: true,
            render: (p) => (
                <span className="text-sm font-medium">{p.anneeScolaire?.libelle || '-'}</span>
            ),
        },
        {
            key: 'actions',
            header: 'Actions',
            className: 'text-right',
            render: (p) => (
                <div className="flex justify-end gap-2">
                    {hasPermission('periodes:edit') && (
                        <ElisaButton variant="ghost" size="sm">Modifier</ElisaButton>
                    )}
                    {hasPermission('periodes:delete') && (
                        <ElisaButton
                            variant="danger"
                            size="sm"
                            isLoading={supprimer.isPending}
                            onClick={() => {
                                if (confirm('Supprimer cette période ?')) {
                                    supprimer.mutateAsync(p.id);
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
                    <h1 className="text-3xl font-bold">Périodes</h1>
                    <p className="text-sm text-[var(--color-text-secondary)]">{data?.meta ? { page: data.meta.currentPage, limit: data.meta.itemsPerPage, total: data.meta.totalItems, totalPages: data.meta.totalPages, hasNext: data.meta.currentPage < data.meta.totalPages, hasPrev: data.meta.currentPage > 1 } : undefined?.total || 0} période(s)</p>
                </div>
                {hasPermission('periodes:create') && (
                    <ElisaButton variant="primary" size="sm" icon={<Plus className="h-4 w-4" />}>
                        Nouvelle période
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
