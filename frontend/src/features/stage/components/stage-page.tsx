/**
 * ==================================
 * eLISAschool - Page Stage
 * ==================================
 */

import { Briefcase, Building, CheckCircle, Award } from 'lucide-react';
import { useStages, useStatistiquesStages } from '../hooks/use-stage';
import { DataTable } from '@/components/ui/DataTable';
import { SchoolLoading } from '@/components/feedback';
import { CardGrid, StatCard } from '@/components/ui';

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
        { key: 'eleve',
            pinned: 'left' as const, header: 'Élève', render: (s: any) => <span className="text-sm">{s.eleve ? `${s.eleve.nom} ${s.eleve.prenom}` : '-'}</span> },
        { key: 'entreprise', header: 'Entreprise', render: (s: any) => <span className="text-sm">{s.entreprise?.nom || '-'}</span> },
        { key: 'dates', header: 'Période', render: (s: any) => <span className="text-sm">{new Date(s.dateDebut).toLocaleDateString('fr-FR')} - {new Date(s.dateFin).toLocaleDateString('fr-FR')}</span> },
        { key: 'statut', header: 'Statut', className: 'w-28', render: (s: any) => { const st = statuts[s.statut] || { label: s.statut, color: 'gray' }; return <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${st.color}-100 text-${st.color}-700`}>{st.label}</span>; } },
        { key: 'evaluation', header: 'Note', className: 'w-20', render: (s: any) => <span className="text-sm font-bold">{s.evaluation?.note ? `${s.evaluation.note}/20` : '-'}</span> },
    ];

    if (isLoading && !stagesData) return <SchoolLoading message="Chargement des stages..." />;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Gestion des Stages</h1>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <Briefcase className="w-4 h-4" />
                    Nouveau stage
                </button>
            </div>

            <CardGrid columns={{ default: 1, md: 4 }}>
                <StatCard icon={Briefcase} label="Total stages" value={stats?.totalStages || 0} tone="accent" />
                <StatCard icon={CheckCircle} label="En cours" value={stats?.stagesEnCours || 0} tone="success" />
                <StatCard icon={Award} label="Terminés" value={stats?.stagesTermines || 0} tone="purple" />
                <StatCard icon={Building} label="Entreprises" value={stats?.entreprisesPartenaires || 0} tone="warning" />
            </CardGrid>

            <DataTable
                tableId="stages"
                data={stages}
                columns={colonnes}
                enableReordering
                enablePinning
                enableColumnVisibility
                searchable
                searchPlaceholder="Rechercher un stage..." />
        </div>
    );
}
