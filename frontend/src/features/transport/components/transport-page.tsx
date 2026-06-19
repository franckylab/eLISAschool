/**
 * ==================================
 * eLISAschool - Page Transport
 * ==================================
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Bus, Edit, Trash2 } from 'lucide-react';
import { useInscriptionsTransport, useSupprimerLigneTransport } from '../hooks/use-transport';
import { DataTable } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { usePermissions } from '@/hooks';
import type { InscriptionTransport, InscriptionTransportFiltres } from '../types/transport.types';
import type { Column } from '@/components/ui/DataTable';

export function TransportPage() {
    const { hasPermission } = usePermissions();
    const [filtres, setFiltres] = useState<InscriptionTransportFiltres>({ page: 1, limit: 20 });

    const { data, isLoading } = useInscriptionsTransport(filtres);
    const supprimer = useSupprimerLigneTransport();

    const colonnes: Column<InscriptionTransport>[] = [
        {
            key: 'eleve',
            pinned: 'left' as const,
            header: 'Élève',
            render: (i) => (
                <div>
                    <p className="font-medium">{i.eleve?.prenom} {i.eleve?.nom}</p>
                    <p className="text-xs font-mono text-gray-500">{i.eleve?.matricule}</p>
                </div>
            ),
        },
        {
            key: 'ligne',
            header: 'Ligne',
            render: (i) => (
                <div>
                    <p className="font-medium">{i.ligne?.nom}</p>
                    <p className="text-xs text-gray-500">{i.ligne?.code}</p>
                </div>
            ),
        },
        {
            key: 'trajet',
            header: 'Trajet',
            render: (i) => (
                <div className="text-sm">
                    <p>↑ {i.pointMontee}</p>
                    <p className="text-xs text-gray-500">↓ {i.pointDescente}</p>
                </div>
            ),
        },
        {
            key: 'statut',
            header: 'Statut',
            className: 'text-center',
            render: (i) => (
                <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                    i.statut === 'actif' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                    {i.statut === 'actif' ? 'Actif' : 'Inactif'}
                </span>
            ),
        },
        {
            key: 'actions',
            header: 'Actions',
            className: 'text-right',
            renderActions: (i) => [
                {
                    key: 'modifier',
                    icon: Edit,
                    label: 'Modifier',
                    onClick: () => {/* Modifier */},
                    permission: 'transport:edit',
                },
                {
                    key: 'supprimer',
                    icon: Trash2,
                    label: 'Supprimer',
                    onClick: () => {
                        if (confirm('Supprimer cette inscription ?')) {
                            supprimer.mutateAsync(i.id);
                        }
                    },
                    permission: 'transport:delete',
                    variant: 'danger' as const,
                },
            ],
        },
    ];

    return (
        <div className="flex flex-col gap-6 p-6">
            <motion.div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-center gap-3">
                    <Bus className="h-8 w-8 text-blue-600" />
                    <div>
                        <h1 className="text-3xl font-bold">Transport</h1>
                        <p className="text-sm text-gray-600">{data?.meta?.totalItems || 0} inscription(s)</p>
                    </div>
                </div>
                {hasPermission('transport:create') && (
                    <ElisaButton variant="primary" size="sm" icon={<Plus className="h-4 w-4" />}>
                        Nouvelle inscription
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
