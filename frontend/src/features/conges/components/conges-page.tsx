/**
 * ==================================
 * eLISAschool - Page Congés
 * ==================================
 */

import { motion } from 'framer-motion';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, Plus } from 'lucide-react';
import { useConges, useStatistiquesConges } from '../hooks/use-conges';
import { DataTable } from '@/components/ui/DataTable';

const typesConges: any = {
    annuel: { label: 'Annuel', color: 'blue' },
    maladie: { label: 'Maladie', color: 'red' },
    maternite: { label: 'Maternité', color: 'pink' },
    paternite: { label: 'Paternité', color: 'purple' },
    deuil: { label: 'Deuil', color: 'gray' },
    formation: { label: 'Formation', color: 'green' },
    sans_solde: { label: 'Sans solde', color: 'orange' },
    autre: { label: 'Autre', color: 'yellow' },
};

const statuts: any = {
    en_attente: { label: 'En attente', color: 'yellow', icon: AlertCircle },
    accepte: { label: 'Accepté', color: 'green', icon: CheckCircle },
    refuse: { label: 'Refusé', color: 'red', icon: XCircle },
    annule: { label: 'Annulé', color: 'gray', icon: XCircle },
};

export function CongesPage() {
    const { data: congesData, isLoading } = useConges();
    const { data: stats } = useStatistiquesConges();
    

    const conges = congesData?.data || [];

    const colonnes = [
        { key: 'demandeur', header: 'Demandeur', render: (c: any) => <span className="font-medium">{c.demandeur ? `${c.demandeur.nom} ${c.demandeur.prenom}` : '-'}</span> },
        { key: 'type', header: 'Type', className: 'w-32', render: (c: any) => { const t = typesConges[c.type] || { label: c.type, color: 'gray' }; return <span className={`px-2 py-1 rounded text-xs font-medium bg-${t.color}-100 text-${t.color}-700`}>{t.label}</span>; } },
        { key: 'dates', header: 'Période', render: (c: any) => <span className="text-sm">{new Date(c.dateDebut).toLocaleDateString('fr-FR')} - {new Date(c.dateFin).toLocaleDateString('fr-FR')} ({c.nombreJours}j)</span> },
        { key: 'motif', header: 'Motif', className: 'max-w-xs', render: (c: any) => <span className="text-sm text-gray-600 truncate">{c.motif}</span> },
        { key: 'statut', header: 'Statut', className: 'w-28', render: (c: any) => { const s = statuts[c.statut] || { label: c.statut, color: 'gray', icon: AlertCircle }; return <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${s.color}-100 text-${s.color}-700 flex items-center gap-1 w-fit`}><s.icon className="w-3 h-3" />{s.label}</span>; } },
        { key: 'actions',
            pinned: 'right' as const, header: 'Actions', className: 'w-32', render: () => <button className="text-blue-600 hover:underline text-sm">Voir détails</button> },
    ];

    if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Gestion des Congés</h1>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <Plus className="w-4 h-4" />
                    Nouvelle demande
                </button>
            </div>

            {/* Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <motion.div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
                    <div className="flex items-center gap-3 mb-2">
                        <AlertCircle className="w-5 h-5 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-700">En attente</span>
                    </div>
                    <p className="text-3xl font-bold text-yellow-800">{stats?.enAttente || 0}</p>
                </motion.div>

                <motion.div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center gap-3 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-medium text-green-700">Acceptés</span>
                    </div>
                    <p className="text-3xl font-bold text-green-800">{stats?.acceptes || 0}</p>
                </motion.div>

                <motion.div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center gap-3 mb-2">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium text-blue-700">Total demandes</span>
                    </div>
                    <p className="text-3xl font-bold text-blue-800">{stats?.totalDemandes || 0}</p>
                </motion.div>

                <motion.div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                    <div className="flex items-center gap-3 mb-2">
                        <Clock className="w-5 h-5 text-purple-600" />
                        <span className="text-sm font-medium text-purple-700">Jours total</span>
                    </div>
                    <p className="text-3xl font-bold text-purple-800">{conges.reduce((sum, c) => sum + c.nombreJours, 0)}</p>
                </motion.div>
            </div>

            <DataTable
                data={conges}
                columns={colonnes}
                enableReordering
                enablePinning
                enableColumnVisibility
                searchable
                searchPlaceholder="Rechercher un congé..." />
        </div>
    );
}
