/**
 * ==================================
 * eLISAschool - Page Courriers
 * ==================================
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Mail, Plus, Trash2, MailOpen, AlertCircle, Clock } from 'lucide-react';
import { DataTable, Column } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { useCourriers, useMarquerCommeLu, useSupprimerCourrier, useStatistiquesCourriers } from '../hooks/use-courriers';
import type { Courrier } from '../types/courriers.types';

export function CourriersPage() {
    const { t } = useTranslation('courriers');
    const [page, setPage] = useState(1);
    const limit = 20;
    const [recherche, setRecherche] = useState('');
    const [filtreType, setFiltreType] = useState('');
    const [filtreStatut, setFiltreStatut] = useState('');

    const { data, isLoading, meta } = useCourriers({
        recherche: recherche || undefined,
        type: filtreType || undefined,
        statut: filtreStatut || undefined,
    });

    const { data: stats } = useStatistiquesCourriers();
    const marquerLu = useMarquerCommeLu();
    const supprimer = useSupprimerCourrier();

    const types: any = {
        entrant: { label: 'Entrant', color: 'blue' },
        sortant: { label: 'Sortant', color: 'green' },
        interne: { label: 'Interne', color: 'purple' },
    };

    const statuts: any = {
        nouveau: { label: 'Nouveau', color: 'blue' },
        lu: { label: 'Lu', color: 'gray' },
        traite: { label: 'Traité', color: 'green' },
        archive: { label: 'Archivé', color: 'orange' },
    };

    const priorites: any = {
        basse: { label: 'Basse', color: 'gray' },
        normale: { label: 'Normale', color: 'blue' },
        haute: { label: 'Haute', color: 'orange' },
        urgente: { label: 'Urgente', color: 'red' },
    };

    const colonnes: Column<Courrier>[] = [
        {
            key: 'type',
            header: 'Type',
            className: 'text-center w-24',
            render: (c) => {
                const type = types[c.type];
                return (
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-${type?.color}-100 text-${type?.color}-800`}>
                        {type?.label}
                    </span>
                );
            },
        },
        {
            key: 'objet',
            header: 'Objet',
            render: (c) => (
                <div>
                    <p className="font-medium text-gray-900">{c.objet}</p>
                    {c.reference && <p className="text-xs text-gray-500">Ref: {c.reference}</p>}
                </div>
            ),
        },
        {
            key: 'priorite',
            header: 'Priorité',
            className: 'text-center w-24',
            render: (c) => {
                const priorite = priorites[c.priorite];
                return (
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-${priorite?.color}-100 text-${priorite?.color}-800`}>
                        {priorite?.label}
                    </span>
                );
            },
        },
        {
            key: 'date',
            header: 'Date',
            className: 'w-28',
            render: (c) => (
                <span className="text-sm text-gray-700">
                    {new Date(c.dateCourrier).toLocaleDateString('fr-FR')}
                </span>
            ),
        },
        {
            key: 'destinataire',
            header: 'Destinataire',
            className: 'w-40',
            render: (c) => (
                <p className="text-sm text-gray-700">{c.destinataire}</p>
            ),
        },
        {
            key: 'statut',
            header: 'Statut',
            className: 'text-center w-24',
            render: (c) => {
                const statut = statuts[c.statut];
                return (
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-${statut?.color}-100 text-${statut?.color}-800`}>
                        {statut?.label}
                    </span>
                );
            },
        },
        {
            key: 'actions',
            header: 'Actions',
            className: 'text-right',
            renderActions: (c) => [
                {
                    key: 'marquer-lu',
                    icon: MailOpen,
                    label: 'Marquer comme lu',
                    onClick: () => marquerLu.mutateAsync(c.id),
                    hidden: c.statut !== 'nouveau',
                },
                {
                    key: 'supprimer',
                    icon: Trash2,
                    label: 'Supprimer',
                    onClick: () => supprimer.mutateAsync(c.id),
                    variant: 'danger' as const,
                },
            ],
        },
    ];

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t('titre')}</h1>
                    <p className="text-sm text-gray-500 mt-1">{t('description')}</p>
                </div>
                <ElisaButton variant="primary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => window.alert('Nouveau courrier')}>
                    {t('creer')}
                </ElisaButton>
            </motion.div>

            {stats && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg"><Mail className="h-5 w-5 text-blue-600" /></div>
                            <div>
                                <p className="text-xs text-gray-500">Total courriers</p>
                                <p className="text-lg font-bold text-blue-600">{stats.totalCourriers}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100 rounded-lg"><AlertCircle className="h-5 w-5 text-orange-600" /></div>
                            <div>
                                <p className="text-xs text-gray-500">Non lus</p>
                                <p className="text-lg font-bold text-orange-600">{stats.nonLus}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg"><MailOpen className="h-5 w-5 text-green-600" /></div>
                            <div>
                                <p className="text-xs text-gray-500">Traité s</p>
                                <p className="text-lg font-bold text-green-600">{stats.parStatut?.find(s => s.statut === 'traite')?.nombre || 0}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 rounded-lg"><Clock className="h-5 w-5 text-red-600" /></div>
                            <div>
                                <p className="text-xs text-gray-500">Urgents</p>
                                <p className="text-lg font-bold text-red-600">{stats.parPriorite?.find(p => p.priorite === 'urgente')?.nombre || 0}</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}



            <DataTable
                columns={colonnes}
                data={data || []}
                isLoading={isLoading}
                enableReordering
                enableRowHeight
                enablePinning
                enableColumnVisibility
                pagination={{ page, limit, total: meta?.total || 0, onPageChange: setPage }}
                searchPlaceholder={t('rechercher')}
                onSearchChange={(valeur) => setRecherche(valeur)}
                disableClientSearch
                filtres={[
                    {
                        key: 'type',
                        label: 'Type',
                        options: [
                            { value: 'entrant', label: 'Entrant' },
                            { value: 'sortant', label: 'Sortant' },
                            { value: 'interne', label: 'Interne' },
                        ],
                    },
                    {
                        key: 'statut',
                        label: 'Statut',
                        options: [
                            { value: 'nouveau', label: 'Nouveau' },
                            { value: 'lu', label: 'Lu' },
                            { value: 'traite', label: 'Traité' },
                            { value: 'archive', label: 'Archivé' },
                        ],
                    },
                ]}
                onFilterChange={(key, valeur) => {
                    if (key === 'type') setFiltreType(valeur);
                    if (key === 'statut') setFiltreStatut(valeur);
                }}
            />
        </div>
    );
}
