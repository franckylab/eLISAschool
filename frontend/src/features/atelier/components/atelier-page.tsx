/**
 * ==================================
 * eLISAschool - Page Atelier
 * ==================================
 */

import { motion } from 'framer-motion';
import { Users, Star, TrendingUp, Activity } from 'lucide-react';
import { useAteliers, useInscriptions, useStatistiquesAtelier } from '../hooks/use-atelier';
import { DataTable } from '@/components/ui/DataTable';

const typesAtelier: any = {
    manuel: { label: 'Manuel', color: 'blue' },
    artistique: { label: 'Artistique', color: 'purple' },
    technique: { label: 'Technique', color: 'green' },
    sportif: { label: 'Sportif', color: 'orange' },
    musical: { label: 'Musical', color: 'pink' },
    cuisine: { label: 'Cuisine', color: 'yellow' },
    autre: { label: 'Autre', color: 'gray' },
};

export function AtelierPage() {
    const { data: ateliers } = useAteliers();
    const { data: inscriptionsData } = useInscriptions();
    const { data: stats } = useStatistiquesAtelier();

    const ateliersList = ateliers || [];

    const colonnes = [
        { key: 'nom',
            pinned: 'left' as const, header: 'Nom', render: (a: any) => <span className="font-medium">{a.nom}</span> },
        { key: 'type', header: 'Type', className: 'w-28', render: (a: any) => { const t = typesAtelier[a.type] || { label: a.type, color: 'gray' }; return <span className={`px-2 py-1 rounded text-xs font-medium bg-${t.color}-100 text-${t.color}-700`}>{t.label}</span>; } },
        { key: 'responsable', header: 'Responsable', render: (a: any) => <span className="text-sm">{a.responsable ? `${a.responsable.nom} ${a.responsable.prenom}` : '-'}</span> },
        { key: 'capacite', header: 'Capacité', className: 'w-20', render: (a: any) => <span className="text-sm font-medium">{a.capacite}</span> },
        { key: 'lieu', header: 'Lieu', className: 'w-32', render: (a: any) => <span className="text-sm text-gray-600">{a.lieu || '-'}</span> },
        { key: 'tarif', header: 'Tarif', className: 'w-24', render: (a: any) => <span className="text-sm">{a.tarif ? `${a.tarif.toLocaleString('fr-FR')} FCFA` : 'Gratuit'}</span> },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Gestion des Ateliers</h1>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <Activity className="w-4 h-4" />
                    Nouvel atelier
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <motion.div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center gap-3 mb-2">
                        <Activity className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium text-blue-700">Ateliers</span>
                    </div>
                    <p className="text-3xl font-bold text-blue-800">{stats?.totalAteliers || 0}</p>
                </motion.div>

                <motion.div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center gap-3 mb-2">
                        <Users className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-medium text-green-700">Inscriptions</span>
                    </div>
                    <p className="text-3xl font-bold text-green-800">{stats?.totalInscriptions || 0}</p>
                </motion.div>

                <motion.div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
                    <div className="flex items-center gap-3 mb-2">
                        <TrendingUp className="w-5 h-5 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-700">Participation</span>
                    </div>
                    <p className="text-3xl font-bold text-yellow-800">{stats?.tauxParticipation ? `${stats.tauxParticipation.toFixed(1)}%` : '-'}</p>
                </motion.div>

                <motion.div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                    <div className="flex items-center gap-3 mb-2">
                        <Star className="w-5 h-5 text-purple-600" />
                        <span className="text-sm font-medium text-purple-700">Types</span>
                    </div>
                    <p className="text-3xl font-bold text-purple-800">{stats?.parType?.length || 0}</p>
                </motion.div>
            </div>

            {ateliersList}<DataTable
                data={ateliersList}
                columns={colonnes}
                enableReordering
                enablePinning
                enableColumnVisibility
                searchable
                searchPlaceholder="Rechercher un atelier..." />
        </div>
    );
}
