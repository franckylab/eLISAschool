/**
 * ==================================
 * eLISAschool - Page Absences
 * ==================================
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Clock, Plus, Eye, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { DataTable, Column } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { useAbsences, useJustifierAbsence, useStatistiquesAbsences } from '../hooks/use-absences';
import type { Absence } from '../types/absences.types';

export function AbsencesPage() {
    const { t } = useTranslation('absences');
    const [page, setPage] = useState(1);
    const limit = 20;
    const [recherche, setRecherche] = useState('');
    const [filtreType, setFiltreType] = useState<string>('');
    const [filtreStatut, setFiltreStatut] = useState<string>('');

    const { data, isLoading, meta } = useAbsences({
        page,
        limit,
        recherche: recherche || undefined,
        type: filtreType || undefined,
        statut: filtreStatut || undefined,
    });

    const { data: stats } = useStatistiquesAbsences();
    const justifier = useJustifierAbsence();

    const types: any = {
        absence: { label: 'Absence', color: 'red', icone: XCircle },
        retard: { label: 'Retard', color: 'yellow', icone: Clock },
        departure_anticipe: { label: 'Départ anticipé', color: 'orange', icone: Clock },
    };

    const statuts: any = {
        non_justifiee: { label: 'Non justifiée', color: 'red' },
        justifiee: { label: 'Justifiée', color: 'green' },
        en_attente: { label: 'En attente', color: 'yellow' },
    };

    const colonnes: Column<Absence>[] = [
        {
            key: 'type',
            header: 'Type',
            className: 'text-center w-36',
            render: (a) => {
                const type = types[a.type];
                const Icone = type?.icone || AlertCircle;
                return (
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium bg-${type?.color}-100 text-${type?.color}-800`}>
                        <Icone className="h-3 w-3" />
                        {type?.label}
                    </span>
                );
            },
        },
        {
            key: 'eleve',
            pinned: 'left' as const,
            header: 'Élève',
            sortable: true,
            render: (a) => (
                <div>
                    <p className="font-medium text-gray-900">{a.eleve?.prenom} {a.eleve?.nom}</p>
                    <p className="text-xs text-gray-500">{a.eleve?.matricule}</p>
                    {a.eleve?.classe && (
                        <p className="text-xs text-gray-400">{a.eleve.classe.code}</p>
                    )}
                </div>
            ),
        },
        {
            key: 'date',
            header: 'Date',
            className: 'w-28',
            render: (a) => (
                <span className="text-sm text-gray-700">
                    {new Date(a.dateAbsence).toLocaleDateString('fr-FR')}
                </span>
            ),
        },
        {
            key: 'motif',
            header: 'Motif',
            render: (a) => (
                <div>
                    <p className="text-sm text-gray-900 line-clamp-1">{a.motif || '-'}</p>
                    {a.justificatif && (
                        <p className="text-xs text-gray-500">Justifié</p>
                    )}
                </div>
            ),
        },
        {
            key: 'statut',
            header: 'Statut',
            className: 'text-center w-28',
            render: (a) => {
                const statut = statuts[a.statut];
                return (
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-${statut?.color}-100 text-${statut?.color}-800`}>
                        {statut?.label}
                    </span>
                );
            },
        },
        {
            key: 'signalePar',
            header: 'Signalé par',
            className: 'w-32',
            render: (a) => (
                a.signalePar ? (
                    <div>
                        <p className="text-sm font-medium">{a.signalePar.prenom} {a.signalePar.nom}</p>
                        <p className="text-xs text-gray-500">{a.signalePar.role}</p>
                    </div>
                ) : (
                    <span className="text-gray-400 text-sm">-</span>
                )
            ),
        },
        {
            key: 'actions',
            pinned: 'right' as const,
            header: 'Actions',
            className: 'text-right w-32',
            render: (a) => (
                <div className="flex justify-end gap-1">
                    <ElisaButton
                        variant="outline"
                        size="sm"
                        icon={<Eye className="h-4 w-4" />}
                        onClick={() => window.alert(`Détail: ${a.eleve?.nom}`)}
                    />
                    {a.statut !== 'justifiee' && (
                        <ElisaButton
                            variant="outline"
                            size="sm"
                            icon={<CheckCircle className="h-4 w-4" />}
                            isLoading={justifier.isPending}
                            onClick={() => {
                                const motif = prompt('Motif de justification:');
                                if (motif) {
                                    justifier.mutateAsync({ id: a.id, dto: { motif } });
                                }
                            }}
                        >
                            Justifier
                        </ElisaButton>
                    )}
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t('titre')}</h1>
                    <p className="text-sm text-gray-500 mt-1">{t('description')}</p>
                </div>
                <ElisaButton
                    variant="primary"
                    size="sm"
                    icon={<Plus className="h-4 w-4" />}
                    onClick={() => window.alert('Signaler absence')}
                >
                    {t('signaler')}
                </ElisaButton>
            </motion.div>

            {stats && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-1 md:grid-cols-4 gap-4"
                >
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <XCircle className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Total absences</p>
                                <p className="text-lg font-bold text-red-600">{stats.totalAbsences}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-yellow-100 rounded-lg">
                                <Clock className="h-5 w-5 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Retards</p>
                                <p className="text-lg font-bold text-yellow-600">{stats.totalRetards}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Justifiées</p>
                                <p className="text-lg font-bold text-green-600">
                                    {stats.parStatut?.find(s => s.statut === 'justifiee')?.nombre || 0}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <AlertCircle className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Taux absentéisme</p>
                                <p className="text-lg font-bold text-purple-600">{stats.tauxAbsentéisme?.toFixed(1) || 0}%</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            <DataTable
                colonnes={colonnes}
                donnees={data || []}
                isLoading={isLoading}
                searchPlaceholder={t('rechercher')}
                enableReordering
                enablePinning
                filtres={[
                    {
                        key: 'type',
                        label: 'Type',
                        options: [
                            { value: 'absence', label: 'Absence' },
                            { value: 'retard', label: 'Retard' },
                            { value: 'departure_anticipe', label: 'Départ anticipé' },
                        ],
                        allOptionLabel: 'Tous les types',
                    },
                    {
                        key: 'statut',
                        label: 'Statut',
                        options: [
                            { value: 'non_justifiee', label: 'Non justifiée' },
                            { value: 'justifiee', label: 'Justifiée' },
                            { value: 'en_attente', label: 'En attente' },
                        ],
                        allOptionLabel: 'Tous les statuts',
                    },
                ]}
                onSearchChange={setRecherche}
                onFilterChange={(key, valeur) => {
                    if (key === 'type') setFiltreType(valeur);
                    if (key === 'statut') setFiltreStatut(valeur);
                }}
                disableClientSearch
                pagination={{
                    page,
                    limit,
                    total: meta?.total || 0,
                    onPageChange: setPage,
                }}
            />
        </div>
    );
}
