/**
 * ==================================
 * eLISAschool - Page Examens
 * ==================================
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FileText, Plus, Search, Eye, Edit, Trash2, Calendar, Award, TrendingUp } from 'lucide-react';
import { DataTable, Column } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { useExamens, useSupprimerExamen, useStatistiquesExamens } from '../hooks/use-examens';
import type { Examen } from '../types/examens.types';

export function ExamensPage() {
    const { t } = useTranslation('examens');
    const [page, setPage] = useState(1);
    const limit = 20;
    const [recherche, setRecherche] = useState('');
    const [filtreType, setFiltreType] = useState('');
    const [filtreStatut, setFiltreStatut] = useState('');

    const { data, isLoading, meta } = useExamens({
        recherche: recherche || undefined,
        type: filtreType || undefined,
        statut: filtreStatut || undefined,
    });

    const { data: stats } = useStatistiquesExamens();
    const supprimer = useSupprimerExamen();

    const types: any = {
        examen: { label: 'Examen', color: 'blue' },
        interrogation: { label: 'Interrogation', color: 'purple' },
        composition: { label: 'Composition', color: 'green' },
        concours: { label: 'Concours', color: 'orange' },
        autre: { label: 'Autre', color: 'gray' },
    };

    const statuts: any = {
        planifie: { label: 'Planifié', color: 'blue' },
        en_cours: { label: 'En cours', color: 'green' },
        termine: { label: 'Terminé', color: 'gray' },
        annule: { label: 'Annulé', color: 'red' },
    };

    const colonnes: Column<Examen>[] = [
        {
            key: 'type',
            header: 'Type',
            className: 'text-center w-32',
            render: (e) => {
                const type = types[e.type];
                return (
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-${type?.color}-100 text-${type?.color}-800`}>
                        {type?.label}
                    </span>
                );
            },
        },
        {
            key: 'titre',
            header: 'Titre',
            render: (e) => (
                <div>
                    <p className="font-medium text-gray-900">{e.titre}</p>
                    <p className="text-xs text-gray-500">{e.matiere?.nom} - {e.matiere?.code}</p>
                </div>
            ),
        },
        {
            key: 'date',
            header: 'Date',
            className: 'w-32',
            render: (e) => (
                <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-gray-400" />
                    <div>
                        <p className="text-sm text-gray-700">
                            {new Date(e.dateExamen).toLocaleDateString('fr-FR')}
                        </p>
                        <p className="text-xs text-gray-500">{e.heureDebut} - {e.heureFin}</p>
                    </div>
                </div>
            ),
        },
        {
            key: 'classe',
            header: 'Classe',
            className: 'w-24',
            render: (e) => (
                <p className="text-sm text-gray-700">{e.classe?.code || '-'}</p>
            ),
        },
        {
            key: 'coefficient',
            header: 'Coef.',
            className: 'text-center w-16',
            render: (e) => (
                <span className="text-sm font-medium text-gray-900">{e.coefficient}</span>
            ),
        },
        {
            key: 'statut',
            header: 'Statut',
            className: 'text-center w-24',
            render: (e) => {
                const statut = statuts[e.statut];
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
            className: 'text-right w-32',
            render: (e) => (
                <div className="flex justify-end gap-1">
                    <ElisaButton
                        variant="outline"
                        size="sm"
                        icon={<Eye className="h-3 w-3" />}
                        onClick={() => window.alert(`Résultats: ${e.titre}`)}
                    >
                        Résultats
                    </ElisaButton>
                    <ElisaButton
                        variant="danger"
                        size="sm"
                        icon={<Trash2 className="h-3 w-3" />}
                        isLoading={supprimer.isPending}
                        onClick={() => supprimer.mutateAsync(e.id)}
                    />
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
                    onClick={() => window.alert('Planifier examen')}
                >
                    {t('planifier')}
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
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <FileText className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Total examens</p>
                                <p className="text-lg font-bold text-blue-600">{stats.totalExamens}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <Award className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Moyenne générale</p>
                                <p className="text-lg font-bold text-green-600">{stats.moyenneGenerale?.toFixed(2) || '-'}/20</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <TrendingUp className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Taux de réussite</p>
                                <p className="text-lg font-bold text-purple-600">{stats.tauxReussite?.toFixed(1) || 0}%</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <Calendar className="h-5 w-5 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Types</p>
                                <p className="text-lg font-bold text-orange-600">{stats.parType?.length || 0}</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex gap-3"
            >
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder={t('rechercher')}
                        value={recherche}
                        onChange={(e) => setRecherche(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <select
                    value={filtreType}
                    onChange={(e) => setFiltreType(e.target.value)}
                    className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">Tous les types</option>
                    <option value="examen">Examen</option>
                    <option value="interrogation">Interrogation</option>
                    <option value="composition">Composition</option>
                    <option value="concours">Concours</option>
                    <option value="autre">Autre</option>
                </select>
                <select
                    value={filtreStatut}
                    onChange={(e) => setFiltreStatut(e.target.value)}
                    className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">Tous les statuts</option>
                    <option value="planifie">Planifié</option>
                    <option value="en_cours">En cours</option>
                    <option value="termine">Terminé</option>
                    <option value="annule">Annulé</option>
                </select>
            </motion.div>

            <DataTable
                colonnes={colonnes}
                donnees={data || []}
                isLoading={isLoading}
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
