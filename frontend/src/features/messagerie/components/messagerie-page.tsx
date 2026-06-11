/**
 * ==================================
 * eLISAschool - Page Messagerie
 * ==================================
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Mail, MailOpen } from 'lucide-react';
import { useMessages, useSupprimerMessage } from '../hooks/use-messagerie';
import { DataTable } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { usePermissions } from '@/hooks';
import type { Message, MessageFiltres } from '../types/messagerie.types';
import type { Column } from '@/components/ui/DataTable';

export function MessageriePage() {
    const { hasPermission } = usePermissions();
    const [filtres, setFiltres] = useState<MessageFiltres>({ page: 1, limit: 20 });

    const { data, isLoading } = useMessages(filtres);
    const supprimer = useSupprimerMessage();

    const colonnes: Column<Message>[] = [
        {
            key: 'statut',
            header: '',
            className: 'text-center w-10',
            render: (m) => (
                m.estLu ? (
                    <MailOpen className="h-4 w-4 text-gray-400" />
                ) : (
                    <Mail className="h-4 w-4 text-blue-600" />
                )
            ),
        },
        {
            key: 'expediteur',
            header: 'Expéditeur',
            render: (m) => (
                <div>
                    <p className={`font-medium ${!m.estLu ? 'text-blue-600' : ''}`}>
                        {m.expediteur?.prenom} {m.expediteur?.nom}
                    </p>
                    <p className="text-xs text-gray-500">{m.expediteur?.role}</p>
                </div>
            ),
        },
        {
            key: 'sujet',
            header: 'Sujet',
            render: (m) => (
                <p className={`font-medium ${!m.estLu ? 'font-bold' : ''}`}>{m.sujet}</p>
            ),
        },
        {
            key: 'date',
            header: 'Date',
            className: 'text-right',
            render: (m) => (
                <span className="text-sm text-gray-500">
                    {new Date(m.createdAt).toLocaleDateString('fr-FR')}
                </span>
            ),
        },
        {
            key: 'actions',
            header: 'Actions',
            className: 'text-right',
            render: (m) => (
                <div className="flex justify-end gap-2">
                    <ElisaButton variant="ghost" size="sm">Lire</ElisaButton>
                    {hasPermission('messagerie:delete') && (
                        <ElisaButton
                            variant="danger"
                            size="sm"
                            isLoading={supprimer.isPending}
                            onClick={() => {
                                if (confirm('Supprimer ce message ?')) {
                                    supprimer.mutateAsync(m.id);
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
                    <h1 className="text-3xl font-bold">Messagerie</h1>
                    <p className="text-sm text-gray-600">{data?.meta ? { page: data.meta.currentPage, limit: data.meta.itemsPerPage, total: data.meta.totalItems, totalPages: data.meta.totalPages, hasNext: data.meta.currentPage < data.meta.totalPages, hasPrev: data.meta.currentPage > 1 } : undefined?.total || 0} message(s)</p>
                </div>
                {hasPermission('messagerie:create') && (
                    <ElisaButton variant="primary" size="sm" icon={<Plus className="h-4 w-4" />}>
                        Nouveau message
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
