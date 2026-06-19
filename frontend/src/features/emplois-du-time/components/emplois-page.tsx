/**
 * ==================================
 * eLISAschool - Page Emplois du Temps
 * ==================================
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Calendar, Plus, Clock, AlertTriangle, Users, MapPin, Eye, Trash2 } from 'lucide-react';
import { DataTable, Column } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { useCreneaux, useSupprimerCreneau, useStatistiquesEmploiDuTemps, useConflitsCreneaux } from '../hooks/use-emplois';
import type { Creneau } from '../types/emplois.types';

export function EmploisDuTempsPage() {
    const { t } = useTranslation('emplois');
    const [page, setPage] = useState(1);
    const limit = 20;
    const [filtreClasse, setFiltreClasse] = useState('');
    const [filtreJour, setFiltreJour] = useState('');

    const { data, isLoading, meta } = useCreneaux({
        classeId: filtreClasse || undefined,
        jourSemaine: filtreJour || undefined,
    });

    const { data: stats } = useStatistiquesEmploiDuTemps();
    const { data: conflits } = useConflitsCreneaux();
    const supprimer = useSupprimerCreneau();

    const jours = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

    const couleursParMatiere: Record<string, string> = {
        mathematiques: 'bg-blue-100 text-blue-800 border-blue-200',
        francais: 'bg-purple-100 text-purple-800 border-purple-200',
        sciences: 'bg-green-100 text-green-800 border-green-200',
        histoire: 'bg-orange-100 text-orange-800 border-orange-200',
        anglais: 'bg-red-100 text-red-800 border-red-200',
        par_defaut: 'bg-gray-100 text-gray-800 border-gray-200',
    };

    const colonnes: Column<Creneau>[] = [
        {
            key: 'jour',
            header: 'Jour',
            className: 'text-center w-24',
            render: (c) => (
                <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800">
                    {c.jourSemaine.charAt(0).toUpperCase() + c.jourSemaine.slice(1, 3)}
                </span>
            ),
        },
        {
            key: 'horaire',
            header: 'Horaire',
            className: 'text-center w-32',
            render: (c) => (
                <div className="flex items-center gap-1 text-sm text-gray-700">
                    <Clock className="h-3 w-3" />
                    <span>{c.heureDebut} - {c.heureFin}</span>
                </div>
            ),
        },
        {
            key: 'matiere',
            header: 'Matière',
            render: (c) => (
                <div>
                    <p className="font-medium text-gray-900">{c.matiere?.nom}</p>
                    <p className="text-xs text-gray-500">{c.matiere?.code}</p>
                </div>
            ),
        },
        {
            key: 'enseignant',
            header: 'Enseignant',
            render: (c) => (
                <div className="flex items-center gap-1">
                    <Users className="h-3 w-3 text-gray-400" />
                    <span className="text-sm text-gray-700">
                        {c.enseignant?.prenom} {c.enseignant?.nom}
                    </span>
                </div>
            ),
        },
        {
            key: 'salle',
            header: 'Salle',
            className: 'w-24',
            render: (c) => (
                <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-gray-400" />
                    <span className="text-sm text-gray-700">{c.salle?.nom || '-'}</span>
                </div>
            ),
        },
        {
            key: 'actions',
            header: 'Actions',
            className: 'text-right w-20',
            renderActions: (c) => [
                {
                    key: 'voir',
                    icon: Eye,
                    label: 'Voir détails',
                    onClick: () => window.alert(`Détail: ${c.matiere?.nom}`),
                    variant: 'info' as const,
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
                    onClick={() => window.alert('Ajouter créneau')}
                >
                    {t('ajouter')}
                </ElisaButton>
            </motion.div>

            {conflits && conflits.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border border-red-200 rounded-lg p-4"
                >
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                        <div>
                            <p className="font-medium text-red-800">Conflits détectés</p>
                            <p className="text-sm text-red-700 mt-1">{conflits.length} conflit(s) d'emploi du temps identifié(s)</p>
                        </div>
                    </div>
                </motion.div>
            )}

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
                                <Calendar className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Total créneaux</p>
                                <p className="text-lg font-bold text-blue-600">{stats.totalCreneaux}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <Clock className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Heures/semaine</p>
                                <p className="text-lg font-bold text-green-600">{stats.heuresSemaines}h</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Users className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Taux occupation</p>
                                <p className="text-lg font-bold text-purple-600">{stats.tauxOccupation}%</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <AlertTriangle className="h-5 w-5 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Conflits</p>
                                <p className="text-lg font-bold text-orange-600">{conflits?.length || 0}</p>
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
                <select
                    value={filtreClasse}
                    onChange={(e) => setFiltreClasse(e.target.value)}
                    className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">Toutes les classes</option>
                    <option value="classe1">6ème A</option>
                    <option value="classe2">5ème B</option>
                    <option value="classe3">4ème C</option>
                </select>
                <select
                    value={filtreJour}
                    onChange={(e) => setFiltreJour(e.target.value)}
                    className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">Tous les jours</option>
                    {jours.map(jour => (
                        <option key={jour} value={jour}>
                            {jour.charAt(0).toUpperCase() + jour.slice(1)}
                        </option>
                    ))}
                </select>
            </motion.div>

            <DataTable
                columns={colonnes}
                data={data || []}
                isLoading={isLoading}
                enableReordering
                enablePinning
                enableColumnVisibility
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
