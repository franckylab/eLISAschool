/**
 * ==================================
 * eLISAschool - Page Périodes
 * ==================================
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Plus, Calendar, Edit, Trash2 } from 'lucide-react';
import { usePeriodes, useSupprimerPeriode } from '../hooks/use-periodes';
import { DataTable } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { usePermissions } from '@/hooks';
import type { Periode, PeriodeFiltres } from '../types/periode.types';
import type { Column } from '@/components/ui/DataTable';

export function PeriodesPage() {
    useTranslation();
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
            pinned: 'left' as const,
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
            renderActions: (p) => [
                {
                    key: 'modifier',
                    icon: Edit,
                    label: 'Modifier',
                    onClick: () => {},
                    permission: 'periodes:edit',
                },
                {
                    key: 'supprimer',
                    icon: Trash2,
                    label: 'Supprimer',
                    onClick: () => supprimer.mutateAsync(p.id),
                    permission: 'periodes:delete',
                    variant: 'danger' as const,
                },
            ],
        },
    ];

    return (
        <div className="flex flex-col gap-6 p-6">
            <motion.div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <div>
                    <h1 className="text-3xl font-bold">Périodes</h1>
                    <p className="text-sm text-[var(--color-text-secondary)]">{data?.meta?.totalItems || 0} période(s)</p>
                </div>
                {hasPermission('periodes:create') && (
                    <ElisaButton variant="primary" size="sm" icon={<Plus className="h-4 w-4" />}>
                        Nouvelle période
                    </ElisaButton>
                )}
            </motion.div>

            <DataTable
                data={data?.items || []}
                columns={colonnes}
                isLoading={isLoading}
                enableReordering
                enablePinning
                enableColumnVisibility
                searchPlaceholder="Rechercher..."
                onSearchChange={(recherche) =>
                    setFiltres((prev) => ({ ...prev, recherche, page: 1 }))
                }
                disableClientSearch
                pagination={data?.meta ? { page: data.meta.currentPage, limit: data.meta.itemsPerPage, total: data.meta.totalItems, totalPages: data.meta.totalPages, hasNext: data.meta.currentPage < data.meta.totalPages, hasPrev: data.meta.currentPage > 1 } : undefined}
                onPageChange={(page) => setFiltres((prev) => ({ ...prev, page }))}
                onLimitChange={(limit) => setFiltres((prev) => ({ ...prev, limit, page: 1 }))}
            />
        </div>
    );
}
