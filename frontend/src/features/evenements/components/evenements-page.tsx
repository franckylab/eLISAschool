/**
 * ==================================
 * eLISAschool - Page Événements
 * ==================================
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Calendar, Plus, Search, Users, Edit, Trash2, MapPin, Clock } from 'lucide-react';
import { DataTable, Column } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { useEvenements, useSupprimerEvenement, useStatistiquesEvenements } from '../hooks/use-evenements';
import type { Evenement } from '../types/evenement.types';

export function EvenementsPage() {
    const { t } = useTranslation('evenements');
    const [page, setPage] = useState(1);
    const limit = 20;
    const [recherche, setRecherche] = useState('');
    const [filtreType, setFiltreType] = useState<string>('');
    const [filtreStatut, setFiltreStatut] = useState<string>('');

    const { data, isLoading, meta } = useEvenements({
        page,
        limit,
        recherche: recherche || undefined,
        type: filtreType || undefined,
        statut: filtreStatut || undefined,
    });

    const { data: stats } = useStatistiquesEvenements();
    const supprimer = useSupprimerEvenement();

    const types: any = {
        reunion: { label: 'Réunion', color: 'blue', icone: Users },
        formation: { label: 'Formation', color: 'purple', icone: Calendar },
        activite: { label: 'Activité', color: 'green', icone: Calendar },
        ceremonie: { label: 'Cérémonie', color: 'pink', icone: Calendar },
        examen: { label: 'Examen', color: 'red', icone: Calendar },
        vacances: { label: 'Vacances', color: 'yellow', icone: Calendar },
        autre: { label: 'Autre', color: 'gray', icone: Calendar },
    };

    const statuts: any = {
        programme: { label: 'Programmé', color: 'blue' },
        en_cours: { label: 'En cours', color: 'green' },
        termine: { label: 'Terminé', color: 'gray' },
        annule: { label: 'Annulé', color: 'red' },
    };

    const colonnes: Column<Evenement>[] = [
        {
            key: 'type',
            header: 'Type',
            className: 'text-center w-32',
            render: (e) => {
                const type = types[e.type];
                const Icone = type?.icone || Calendar;
                return (
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium bg-${type?.color}-100 text-${type?.color}-800`}>
                        <Icone className="h-3 w-3" />
                        {type?.label}
                    </span>
                );
            },
        },
        {
            key: 'titre',
            header: 'Événement',
            sortable: true,
            render: (e) => (
                <div>
                    <p className="font-medium text-gray-900">{e.titre}</p>
                    {e.description && <p className="text-xs text-gray-500 line-clamp-1">{e.description}</p>}
                </div>
            ),
        },
        {
            key: 'dates',
            header: 'Dates',
            className: 'w-40',
            render: (e) => (
                <div className="text-sm">
                    <div className="flex items-center gap-1 text-gray-700">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(e.dateDebut).toLocaleDateString('fr-FR')}</span>
                    </div>
                    {e.dateFin && (
                        <p className="text-xs text-gray-500">
                            au {new Date(e.dateFin).toLocaleDateString('fr-FR')}
                        </p>
                    )}
                </div>
            ),
        },
        {
            key: 'lieu',
            header: 'Lieu',
            className: 'w-32',
            render: (e) => (
                e.lieu ? (
                    <div className="flex items-center gap-1 text-sm text-gray-700">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{e.lieu}</span>
                    </div>
                ) : (
                    <span className="text-gray-400 text-sm">-</span>
                )
            ),
        },
        {
            key: 'participants',
            header: 'Participants',
            className: 'text-center w-24',
            render: (e) => (
                <span className="inline-flex items-center justify-center rounded-lg bg-blue-100 px-2 py-1 text-sm font-semibold text-blue-800">
                    {e.nombreParticipants || 0}
                </span>
            ),
        },
        {
            key: 'statut',
            header: 'Statut',
            className: 'text-center w-24',
            render: (e) => {
                const statut = statuts[e.statut || 'programme'];
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
                        icon={<Users className="h-3 w-3" />}
                        onClick={() => window.alert(`Participants: ${e.titre}`)}
                    />
                    <ElisaButton
                        variant="outline"
                        size="sm"
                        icon={<Edit className="h-3 w-3" />}
                        onClick={() => window.alert(`Modifier: ${e.titre}`)}
                    />
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
                    onClick={() => window.alert('Créer événement')}
                >
                    {t('creer')}
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
                                <Calendar className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Total</p>
                                <p className="text-lg font-bold text-blue-600">{stats.total}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <Clock className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">En cours</p>
                                <p className="text-lg font-bold text-green-600">{stats.enCours}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Calendar className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Programmés</p>
                                <p className="text-lg font-bold text-purple-600">{stats.programmes}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <Users className="h-5 w-5 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Participants</p>
                                <p className="text-lg font-bold text-orange-600">{stats.totalParticipants}</p>
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
                    <option value="reunion">Réunion</option>
                    <option value="formation">Formation</option>
                    <option value="activite">Activité</option>
                    <option value="ceremonie">Cérémonie</option>
                    <option value="examen">Examen</option>
                    <option value="vacances">Vacances</option>
                    <option value="autre">Autre</option>
                </select>
                <select
                    value={filtreStatut}
                    onChange={(e) => setFiltreStatut(e.target.value)}
                    className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">Tous les statuts</option>
                    <option value="programme">Programmé</option>
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
