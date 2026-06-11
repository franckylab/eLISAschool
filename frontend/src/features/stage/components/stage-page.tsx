/**
 * ==================================
 * eLISAschool - Page Stage
 * ==================================
 */

import { motion } from 'framer-motion';
import { Briefcase, Building, CheckCircle, Award, Users } from 'lucide-react';
import { useStages, useStatistiquesStages } from '../hooks/use-stage';
import { DataTable } from '@/components/ui/DataTable';

const statuts: any = {
    en_recherche: { label: 'En recherche', color: 'yellow' },
    valide: { label: 'Validé', color: 'blue' },
    en_cours: { label: 'En cours', color: 'green' },
    termine: { label: 'Terminé', color: 'gray' },
    evalue: { label: 'Évalué', color: 'purple' },
};

export function StagePage() {
    const { data: stagesData, isLoading } = useStages();
    const { data: stats } = useStatistiquesStages();

    const stages = stagesData?.data || [];

    const colonnes = [
        { key: 'titre', header: 'Titre', render: (s: any) => <span className="font-medium">{s.titre}</span> },
        { key: 'eleve', header: 'Élève', render: (s: any) => <span className="text-sm">{s.eleve ? `${s.eleve.nom} ${s.eleve.prenom}` : '-'}</span> },
        { key: 'entreprise', header: 'Entreprise', render: (s: any) => <span className="text-sm">{s.entreprise?.nom || '-'}</span> },
        { key: 'dates', header: 'Période', render: (s: any) => <span className="text-sm">{new Date(s.dateDebut).toLocaleDateString('fr-FR')} - {new Date(s.dateFin).toLocaleDateString('fr-FR')}</span> },
        { key: 'statut', header: 'Statut', className: 'w-28', render: (s: any) => { const st = statuts[s.statut] || { label: s.statut, color: 'gray' }; return <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${st.color}-100 text-${st.color}-700`}>{st.label}</span>; } },
        { key: 'evaluation', header: 'Note', className: 'w-20', render: (s: any) => <span className="text-sm font-bold">{s.evaluation?.note ? `${s.evaluation.note}/20` : '-'}</span> },
    ];

    if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Gestion des Stages</h1>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <Briefcase className="w-4 h-4" />
                    Nouveau stage
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <motion.div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center gap-3 mb-2">
                        <Briefcase className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium text-blue-700">Total stages</span>
                    </div>
                    <p className="text-3xl font-bold text-blue-800">{stats?.totalStages || 0}</p>
                </motion.div>

                <motion.div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center gap-3 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-medium text-green-700">En cours</span>
                    </div>
                    <p className="text-3xl font-bold text-green-800">{stats?.stagesEnCours || 0}</p>
                </motion.div>

                <motion.div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                    <div className="flex items-center gap-3 mb-2">
                        <Award className="w-5 h-5 text-purple-600" />
                        <span className="text-sm font-medium text-purple-700">Terminés</span>
                    </div>
                    <p className="text-3xl font-bold text-purple-800">{stats?.stagesTermines || 0}</p>
                </motion.div>

                <motion.div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
                    <div className="flex items-center gap-3 mb-2">
                        <Building className="w-5 h-5 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-700">Entreprises</span>
                    </div>
                    <p className="text-3xl font-bold text-yellow-800">{stats?.entreprisesPartenaires || 0}</p>
                </motion.div>
            </div>

            <DataTable data={stages} columns={colonnes} searchable searchPlaceholder="Rechercher un stage..." />
        </div>
    );
}
