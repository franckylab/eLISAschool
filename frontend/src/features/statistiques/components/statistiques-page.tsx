/**
 * ==================================
 * eLISAschool - Page Statistiques
 * ==================================
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Users, DollarSign, AlertCircle, Download } from 'lucide-react';
import { useStatistiquesGlobales, useExporterStatistiques } from '../hooks/use-statistiques';
import { SchoolLoading } from '@/components/feedback';

export function StatistiquesPage() {
    const { data: stats, isLoading } = useStatistiquesGlobales();
    const exportMutation = useExporterStatistiques();
    const [periode, setPeriode] = useState('mois');

    if (isLoading) return <SchoolLoading message="Chargement des statistiques..." />;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-200">Statistiques Globales</h1>
                <div className="flex gap-2">
                    <select value={periode} onChange={(e) => setPeriode(e.target.value)} className="px-3 py-2 border dark:border-gray-700 rounded-lg">
                        <option value="jour">Jour</option>
                        <option value="semaine">Semaine</option>
                        <option value="mois">Mois</option>
                        <option value="annee">Année</option>
                    </select>
                    <button onClick={() => exportMutation.mutate({ format: 'pdf', type: 'globales' })} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                        <Download className="w-4 h-4" />
                        Exporter
                    </button>
                </div>
            </div>

            {/* Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center gap-3 mb-2">
                        <Users className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium text-blue-700">Total élèves</span>
                    </div>
                    <p className="text-3xl font-bold text-blue-800">{stats?.eleves?.total || 0}</p>
                    <p className="text-xs text-blue-600 mt-1">{stats?.eleves?.actifs || 0} actifs</p>
                </motion.div>

                <motion.div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center gap-3 mb-2">
                        <Users className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-medium text-green-700">Personnel</span>
                    </div>
                    <p className="text-3xl font-bold text-green-800">{stats?.personnel?.total || 0}</p>
                    <p className="text-xs text-green-600 mt-1">{stats?.personnel?.actifs || 0} actifs</p>
                </motion.div>

                <motion.div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
                    <div className="flex items-center gap-3 mb-2">
                        <DollarSign className="w-5 h-5 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-700">Bénéfice</span>
                    </div>
                    <p className="text-3xl font-bold text-yellow-800">{stats?.finances?.benefice ? `${stats.finances.benefice.toLocaleString('fr-FR')} FCFA` : '-'}</p>
                    <p className="text-xs text-yellow-600 mt-1">Recettes: {stats?.finances?.totalRecettes?.toLocaleString('fr-FR') || 0}</p>
                </motion.div>

                <motion.div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                    <div className="flex items-center gap-3 mb-2">
                        <BarChart3 className="w-5 h-5 text-purple-600" />
                        <span className="text-sm font-medium text-purple-700">Moy. générale</span>
                    </div>
                    <p className="text-3xl font-bold text-purple-800">{stats?.pedagogique?.moyenneGenerale ? `${stats.pedagogique.moyenneGenerale.toFixed(2)}/20` : '-'}</p>
                    <p className="text-xs text-purple-600 mt-1">Réussite: {stats?.pedagogique?.tauxReussite || 0}%</p>
                </motion.div>
            </div>

            {/* Vie scolaire */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-2">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Absences</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-200">{stats?.vieScolaire?.totalAbsences || 0}</p>
                </motion.div>

                <motion.div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-2">
                        <AlertCircle className="w-5 h-5 text-yellow-600" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Retards</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-200">{stats?.vieScolaire?.totalRetards || 0}</p>
                </motion.div>

                <motion.div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-2">
                        <AlertCircle className="w-5 h-5 text-orange-600" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sanctions</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-200">{stats?.vieScolaire?.totalSanctions || 0}</p>
                </motion.div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold mb-4">Répartition par classe</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {stats?.eleves?.parClasse?.slice(0, 8).map((classe, index) => (
                        <div key={index} className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{classe.classe}</p>
                            <p className="text-2xl font-bold text-blue-600">{classe.nombre}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
