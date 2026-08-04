import { useTranslation } from 'react-i18next';
import { Wrench, Clock, CheckCircle, DollarSign } from 'lucide-react';
import { useInterventions, useStatistiquesMaintenance } from '../hooks/use-maintenance';
import { DataTable } from '@/components/ui/DataTable';
import { CardGrid } from '@/components/ui/CardGrid';
import { StatCard } from '@/components/ui/StatCard';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

const priorites: any = {
    basse: { label: 'Basse', color: 'gray' },
    moyenne: { label: 'Moyenne', color: 'blue' },
    haute: { label: 'Haute', color: 'orange' },
    urgente: { label: 'Urgente', color: 'red' },
};

const statuts: any = {
    planifiee: { label: 'Planifiée', color: 'blue' },
    en_cours: { label: 'En cours', color: 'yellow' },
    terminee: { label: 'Terminée', color: 'green' },
    annulee: { label: 'Annulée', color: 'gray' },
};

export function MaintenancePage() {
    const { t } = useTranslation('maintenance');
    const { data: interventionsData, isLoading, error } = useInterventions();
    const { data: stats } = useStatistiquesMaintenance();

    const interventions = interventionsData?.data || [];

    const colonnes = [
        { key: 'titre', header: t('titre'), render: (i: any) => <span className="font-medium">{i.titre}</span> },
        { key: 'type', header: t('type'), className: 'w-28', render: (i: any) => <span className="text-sm capitalize">{i.type}</span> },
        { key: 'priorite', header: t('priorite'), className: 'w-24', render: (i: any) => { const p = priorites[i.priorite] || { label: i.priorite, color: 'gray' }; return <span className={`px-2 py-1 rounded text-xs font-medium bg-${p.color}-100 text-${p.color}-700`}>{p.label}</span>; } },
        { key: 'technicien', header: t('technicien'), render: (i: any) => <span className="text-sm">{i.technicien ? `${i.technicien.nom} ${i.technicien.prenom}` : '-'}</span> },
        { key: 'date', header: t('date'), className: 'w-28', render: (i: any) => <span className="text-sm">{new Date(i.datePlanification).toLocaleDateString('fr-FR')}</span> },
        { key: 'statut', header: t('statut'), className: 'w-28', render: (i: any) => { const s = statuts[i.statut] || { label: i.statut, color: 'gray' }; return <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${s.color}-100 text-${s.color}-700`}>{s.label}</span>; } },
        { key: 'cout', header: t('cout'), className: 'w-24', render: (i: any) => <span className="text-sm">{i.cout ? `${i.cout.toLocaleString('fr-FR')} FCFA` : '-'}</span> },
    ];

    if (isLoading && !interventionsData) return <PageSkeleton />;
    if (error) return <ErrorMessage message={error?.message || t('uneErreurEstSurvenue')} onRetry={() => window.location.reload()} />;

    return (
        <div className="space-y-6">
            <PageHeader
                variant="gradient"
                icon={Wrench}
                title={t('gestionMaintenance')}
                subtitle={t('description')}
                actions={
                    <button className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/35 !text-white rounded-lg backdrop-blur-sm transition-all duration-150">
                        <Wrench className="w-4 h-4" />
                        {t('nouvelleIntervention')}
                    </button>
                }
            />

            <CardGrid columns={{ default: 1, md: 4 }}>
                <StatCard icon={Wrench} label={t('interventions')} value={stats?.totalInterventions || 0} tone="accent" />
                <StatCard icon={Clock} label={t('interventionsEnCours')} value={stats?.interventionsEnCours || 0} tone="warning" />
                <StatCard icon={CheckCircle} label={t('interventionsTerminees')} value={stats?.parStatut?.find((s: any) => s.statut === 'terminee')?.nombre || 0} tone="success" />
                <StatCard icon={DollarSign} label={t('coutTotal')} value={stats?.coutTotal ? `${stats.coutTotal.toLocaleString('fr-FR')} FCFA` : '-'} tone="purple" />
            </CardGrid>

            <DataTable
                tableId="maintenance-interventions"
                data={interventions}
                columns={colonnes}
                enableReordering
                enablePinning
                enableColumnVisibility
                searchable
                searchPlaceholder={t('rechercher')} />
        </div>
    );
}
