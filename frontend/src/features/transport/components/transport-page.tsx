/**
 * ==================================
 * eLISAschool - Page Transport
 * ==================================
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Bus } from 'lucide-react';
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
            render: (i) => (
                <div className="flex justify-end gap-2">
                    {hasPermission('transport:edit') && (
                        <ElisaButton variant="ghost" size="sm">Modifier</ElisaButton>
                    )}
                    {hasPermission('transport:delete') && (
                        <ElisaButton
                            variant="danger"
                            size="sm"
                            isLoading={supprimer.isPending}
                            onClick={() => {
                                if (confirm('Supprimer cette inscription ?')) {
                                    supprimer.mutateAsync(i.id);
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
                <div className="flex items-center gap-3">
                    <Bus className="h-8 w-8 text-blue-600" />
                    <div>
                        <h1 className="text-3xl font-bold">Transport</h1>
                        <p className="text-sm text-gray-600">{data?.meta ? { page: data.meta.currentPage, limit: data.meta.itemsPerPage, total: data.meta.totalItems, totalPages: data.meta.totalPages, hasNext: data.meta.currentPage < data.meta.totalPages, hasPrev: data.meta.currentPage > 1 } : undefined?.total || 0} inscription(s)</p>
                    </div>
                </div>
                {hasPermission('transport:create') && (
                    <ElisaButton variant="primary" size="sm" icon={<Plus className="h-4 w-4" />}>
                        Nouvelle inscription
                    </ElisaButton>
                )}
            </motion.div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Rechercher..." className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" value={filtres.recherche || ''} onChange={(e) => setFiltres((prev) => ({ ...prev, recherche: e.target.value, page: 1 }))} />
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
