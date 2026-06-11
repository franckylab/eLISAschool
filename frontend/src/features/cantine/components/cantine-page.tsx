/**
 * ==================================
 * eLISAschool - Page Cantine
 * ==================================
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, UtensilsCrossed } from 'lucide-react';
import { useInscriptionsCantine, useSupprimerInscriptionCantine } from '../hooks/use-cantine';
import { DataTable } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { usePermissions } from '@/hooks';
import type { InscriptionCantine, InscriptionCantineFiltres } from '../types/cantine.types';
import type { Column } from '@/components/ui/DataTable';

export function CantinePage() {
    const { hasPermission } = usePermissions();
    const [filtres, setFiltres] = useState<InscriptionCantineFiltres>({ page: 1, limit: 20 });

    const { data, isLoading } = useInscriptionsCantine(filtres);
    const supprimer = useSupprimerInscriptionCantine();

    const typesInscription: any = {
        quotidien: 'Quotidien',
        hebdomadaire: 'Hebdomadaire',
        mensuel: 'Mensuel',
        trimestriel: 'Trimestriel',
        annuel: 'Annuel',
    };

    const colonnes: Column<InscriptionCantine>[] = [
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
            key: 'typeInscription',
            header: 'Type',
            className: 'text-center',
            render: (i) => (
                <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-800">
                    {typesInscription[i.typeInscription]}
                </span>
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
                    {hasPermission('cantine:edit') && (
                        <ElisaButton variant="ghost" size="sm">Modifier</ElisaButton>
                    )}
                    {hasPermission('cantine:delete') && (
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
                    <UtensilsCrossed className="h-8 w-8 text-orange-600" />
                    <div>
                        <h1 className="text-3xl font-bold">Cantine</h1>
                        <p className="text-sm text-gray-600">{data?.meta?.totalItems || 0} inscription(s)</p>
                    </div>
                </div>
                {hasPermission('cantine:create') && (
                    <ElisaButton variant="primary" size="sm" icon={<Plus className="h-4 w-4" />}>
                        Nouvelle inscription
                    </ElisaButton>
                )}
            </motion.div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Rechercher un élève..." className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20" value={filtres.recherche || ''} onChange={(e) => setFiltres((prev) => ({ ...prev, recherche: e.target.value, page: 1 }))} />
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
                onPageChange={(page) => setFiltres((prev) => ({ ...prev, page }))}
                onLimitChange={(limit) => setFiltres((prev) => ({ ...prev, limit, page: 1 }))}
            />
        </div>
    );
}
