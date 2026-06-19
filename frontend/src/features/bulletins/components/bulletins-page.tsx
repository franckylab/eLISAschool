/**
 * ==================================
 * eLISAschool - Page Bulletins
 * ==================================
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Award, Trash2 } from 'lucide-react';
import { useBulletins, useSupprimerBulletin, useExporterBulletin } from '../hooks/use-bulletins';
import { DataTable } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { LoadingState, ErrorState } from '@/components/feedback';
import type { Bulletin, BulletinFiltres } from '../types/bulletin.types';
import type { Column } from '@/components/ui/DataTable';

export function BulletinsPage() {
    const [filtres, setFiltres] = useState<BulletinFiltres>({ page: 1, limit: 20 });

    const { data, isLoading, error } = useBulletins(filtres);
    const supprimer = useSupprimerBulletin();
    const exporter = useExporterBulletin();

    if (isLoading) {
        return (
            <div className="p-6">
                <LoadingState message="Chargement des bulletins..." />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <ErrorState
                    message={error.message || "Impossible de charger les bulletins"}
                    onRetry={() => window.location.reload()}
                />
            </div>
        );
    }

    const colonnes: Column<Bulletin>[] = [
        {
            key: 'eleve',
            pinned: 'left' as const,
            header: 'Élève',
            sortable: true,
            render: (b) => (
                <div>
                    <p className="font-medium">{b.eleve?.prenom} {b.eleve?.nom}</p>
                    <p className="text-xs font-mono text-[var(--color-text-muted)]">{b.eleve?.matricule}</p>
                </div>
            ),
        },
        {
            key: 'classe',
            header: 'Classe',
            sortable: true,
            render: (b) => (
                <div>
                    <p className="font-medium">{b.classe?.nom}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{b.classe?.code}</p>
                </div>
            ),
        },
        {
            key: 'periode',
            header: 'Période',
            render: (b) => (
                <span className="text-sm font-medium">{b.periode?.nom}</span>
            ),
        },
        {
            key: 'moyenne',
            header: 'Moyenne',
            sortable: true,
            className: 'text-center',
            render: (b) => (
                <div className="flex flex-col items-center gap-1">
                    <span className={`inline-flex items-center justify-center rounded-lg px-3 py-1 text-lg font-bold ${
                        b.moyenneGenerale >= 16 ? 'bg-green-100 text-green-800' :
                        b.moyenneGenerale >= 14 ? 'bg-blue-100 text-blue-800' :
                        b.moyenneGenerale >= 12 ? 'bg-indigo-100 text-indigo-800' :
                        b.moyenneGenerale >= 10 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                    }`}>
                        {b.moyenneGenerale.toFixed(2)}/20
                    </span>
                    <div className="flex items-center gap-1">
                        <Award className="h-3 w-3 text-[var(--color-text-muted)]" />
                        <span className="text-xs font-medium">Rang {b.rang}/{b.effectifClasse}</span>
                    </div>
                </div>
            ),
        },
        {
            key: 'actions',
            header: 'Actions',
            className: 'text-right',
            renderActions: (b) => [
                {
                    key: 'exporter',
                    icon: Download,
                    label: 'Exporter PDF',
                    onClick: () => exporter.mutateAsync(b.id),
                },
                {
                    key: 'supprimer',
                    icon: Trash2,
                    label: 'Supprimer',
                    onClick: () => {
                        if (confirm('Supprimer ce bulletin ?')) {
                            supprimer.mutateAsync(b.id);
                        }
                    },
                    permission: 'bulletins:delete',
                    variant: 'danger' as const,
                },
            ],
        },
    ];

    return (
        <div className="flex flex-col gap-6 p-6">
            <motion.div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <div>
                    <h1 className="text-3xl font-bold">Bulletins</h1>
                    <p className="text-sm text-[var(--color-text-secondary)]">{data?.meta?.totalItems || 0} bulletin(s)</p>
                </div>
                <div className="flex gap-2">
                    <ElisaButton variant="outline" size="sm" icon={<FileText className="h-4 w-4" />}>
                        Générer bulletins
                    </ElisaButton>
                </div>
            </motion.div>

            <DataTable
                data={data?.items || []}
                columns={colonnes}
                isLoading={false}
                searchPlaceholder="Rechercher..."
                enableReordering
                enablePinning
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
        </div>
    );
}
