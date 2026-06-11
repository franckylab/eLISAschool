/**
 * ==================================
 * eLISAschool - Page Santé
 * ==================================
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Heart, Plus, Search, Eye, FileText, Activity, Thermometer } from 'lucide-react';
import { DataTable, Column } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { useVisitesInfirmerie, useStatistiquesSante } from '../hooks/use-sante';
import type { VisiteInfirmerie } from '../types/sante.types';

export function SantePage() {
    const { t } = useTranslation('sante');
    const [page, setPage] = useState(1);
    const limit = 20;
    const [recherche, setRecherche] = useState('');
    const [filtreOrientation, setFiltreOrientation] = useState<string>('');

    const { data, isLoading, meta } = useVisitesInfirmerie({
        page,
        limit,
        recherche: recherche || undefined,
        orientation: filtreOrientation || undefined,
    });

    const { data: stats } = useStatistiquesSante();

    const orientations: any = {
        retour_classe: { label: 'Retour classe', color: 'green' },
        renvoi_domicile: { label: 'Renvoi domicile', color: 'orange' },
        hopital: { label: 'Hôpital', color: 'red' },
        autre: { label: 'Autre', color: 'gray' },
    };

    const colonnes: Column<VisiteInfirmerie>[] = [
        {
            key: 'eleve',
            header: 'Élève',
            sortable: true,
            render: (v) => (
                <div>
                    <p className="font-medium text-gray-900">{v.eleve?.prenom} {v.eleve?.nom}</p>
                    <p className="text-xs text-gray-500">{v.eleve?.matricule}</p>
                </div>
            ),
        },
        {
            key: 'date',
            header: 'Date',
            className: 'w-28',
            render: (v) => (
                <span className="text-sm text-gray-700">
                    {new Date(v.dateVisite).toLocaleDateString('fr-FR')}
                </span>
            ),
        },
        {
            key: 'motif',
            header: 'Motif',
            render: (v) => (
                <div>
                    <p className="text-sm font-medium text-gray-900">{v.motif}</p>
                    {v.diagnostic && <p className="text-xs text-gray-500 line-clamp-1">Diag: {v.diagnostic}</p>}
                </div>
            ),
        },
        {
            key: 'soins',
            header: 'Soins',
            className: 'w-48',
            render: (v) => (
                <p className="text-sm text-gray-700 line-clamp-2">{v.soinsProdigues || '-'}</p>
            ),
        },
        {
            key: 'orientation',
            header: 'Orientation',
            className: 'text-center w-32',
            render: (v) => {
                if (!v.orientation) return <span className="text-gray-400">-</span>;
                const orientation = orientations[v.orientation];
                return (
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-${orientation?.color}-100 text-${orientation?.color}-800`}>
                        {orientation?.label}
                    </span>
                );
            },
        },
        {
            key: 'infirmier',
            header: 'Infirmier(e)',
            className: 'w-32',
            render: (v) => (
                v.infirmier ? (
                    <p className="text-sm text-gray-700">{v.infirmier.prenom} {v.infirmier.nom}</p>
                ) : (
                    <span className="text-gray-400 text-sm">-</span>
                )
            ),
        },
        {
            key: 'actions',
            header: 'Actions',
            className: 'text-right w-20',
            render: (v) => (
                <div className="flex justify-end gap-1">
                    <ElisaButton
                        variant="outline"
                        size="sm"
                        icon={<Eye className="h-3 w-3" />}
                        onClick={() => window.alert(`Détail visite: ${v.eleve?.nom}`)}
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
                    onClick={() => window.alert('Enregistrer visite')}
                >
                    {t('enregistrer')}
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
                                <Heart className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Total visites</p>
                                <p className="text-lg font-bold text-red-600">{stats.totalVisites}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <FileText className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Dossiers médicaux</p>
                                <p className="text-lg font-bold text-blue-600">{stats.totalDossiers}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <Thermometer className="h-5 w-5 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Motif fréquent</p>
                                <p className="text-lg font-bold text-orange-600">
                                    {stats.motifsFrequents?.[0]?.motif || '-'}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <Activity className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Retour classe</p>
                                <p className="text-lg font-bold text-green-600">
                                    {stats.parOrientation?.find(o => o.orientation === 'retour_classe')?.nombre || 0}
                                </p>
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
                    value={filtreOrientation}
                    onChange={(e) => setFiltreOrientation(e.target.value)}
                    className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">Toutes orientations</option>
                    <option value="retour_classe">Retour classe</option>
                    <option value="renvoi_domicile">Renvoi domicile</option>
                    <option value="hopital">Hôpital</option>
                    <option value="autre">Autre</option>
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
