/**
 * ==================================
 * eLISAschool - Page Sécurité
 * ==================================
 */

import { motion } from 'framer-motion';
import { Shield, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useIncidents, useStatistiquesSecurite } from '../hooks/use-securite';
import { DataTable } from '@/components/ui/DataTable';

const gravites: any = {
    mineure: { label: 'Mineure', color: 'yellow' },
    moderee: { label: 'Modérée', color: 'orange' },
    grave: { label: 'Grave', color: 'red' },
    critique: { label: 'Critique', color: 'purple' },
};

const statuts: any = {
    signale: { label: 'Signalé', color: 'yellow' },
    en_cours: { label: 'En cours', color: 'blue' },
    resolu: { label: 'Résolu', color: 'green' },
    archive: { label: 'Archivé', color: 'gray' },
};

export function SecuritePage() {
    const { data: incidentsData, isLoading } = useIncidents();
    const { data: stats } = useStatistiquesSecurite();

    const incidents = incidentsData?.data || [];

    const colonnes = [
        { key: 'titre', header: 'Titre', render: (i: any) => <span className="font-medium">{i.titre}</span> },
        { key: 'type', header: 'Type', className: 'w-28', render: (i: any) => <span className="text-sm capitalize">{i.type}</span> },
        { key: 'gravite', header: 'Gravité', className: 'w-24', render: (i: any) => { const g = gravites[i.gravite] || { label: i.gravite, color: 'gray' }; return <span className={`px-2 py-1 rounded text-xs font-medium bg-${g.color}-100 text-${g.color}-700`}>{g.label}</span>; } },
        { key: 'lieu', header: 'Lieu', className: 'w-32', render: (i: any) => <span className="text-sm text-gray-600">{i.lieu}</span> },
        { key: 'date', header: 'Date', className: 'w-28', render: (i: any) => <span className="text-sm">{new Date(i.dateIncident).toLocaleDateString('fr-FR')}</span> },
        { key: 'statut', header: 'Statut', className: 'w-28', render: (i: any) => { const s = statuts[i.statut] || { label: i.statut, color: 'gray' }; return <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${s.color}-100 text-${s.color}-700`}>{s.label}</span>; } },
    ];

    if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Gestion de la Sécurité</h1>
                <button className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                    <AlertTriangle className="w-4 h-4" />
                    Signaler incident
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <motion.div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center gap-3 mb-2">
                        <Shield className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium text-blue-700">Incidents</span>
                    </div>
                    <p className="text-3xl font-bold text-blue-800">{stats?.totalIncidents || 0}</p>
                </motion.div>

                <motion.div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
                    <div className="flex items-center gap-3 mb-2">
                        <Clock className="w-5 h-5 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-700">En cours</span>
                    </div>
                    <p className="text-3xl font-bold text-yellow-800">{stats?.incidentsEnCours || 0}</p>
                </motion.div>

                <motion.div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center gap-3 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-medium text-green-700">Résolus</span>
                    </div>
                    <p className="text-3xl font-bold text-green-800">{stats?.parStatut?.find((s: any) => s.statut === 'resolu')?.nombre || 0}</p>
                </motion.div>

                <motion.div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                    <div className="flex items-center gap-3 mb-2">
                        <AlertTriangle className="w-5 h-5 text-purple-600" />
                        <span className="text-sm font-medium text-purple-700">Délai moyen</span>
                    </div>
                    <p className="text-3xl font-bold text-purple-800">{stats?.delaiMoyenResolution ? `${stats.delaiMoyenResolution.toFixed(1)}h` : '-'}</p>
                </motion.div>
            </div>

            <DataTable
                data={incidents}
                columns={colonnes}
                enableReordering
                enablePinning
                enableColumnVisibility
                searchable
                searchPlaceholder="Rechercher un incident..." />
        </div>
    );
}
