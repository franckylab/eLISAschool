import { useTranslation } from 'react-i18next';
import { Clock, CheckCircle, XCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { usePointages, useStatistiquesPointages } from '../hooks/use-pointages';
import { DataTable } from '@/components/ui/DataTable';
import { CardGrid } from '@/components/ui/CardGrid';
import { StatCard } from '@/components/ui/StatCard';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

const statuts: any = {
    present: { label: 'Présent', color: 'green', icon: CheckCircle },
    absent: { label: 'Absent', color: 'red', icon: XCircle },
    retard: { label: 'Retard', color: 'yellow', icon: AlertCircle },
    absence_justifiee: { label: 'Abs. justifiée', color: 'blue', icon: AlertCircle },
};

export function PointagesPage() {
    const { t } = useTranslation('pointages');
    const { data: pointagesData, isLoading, error } = usePointages();
    const { data: stats } = useStatistiquesPointages();

    const pointages = pointagesData?.data || [];

    const colonnes = [
        { key: 'personnel', header: t('personnel'), render: (p: any) => <span className="font-medium">{p.personnel ? `${p.personnel.nom} ${p.personnel.prenom}` : '-'}</span> },
        { key: 'date', header: t('date'), className: 'w-28', render: (p: any) => <span className="text-sm">{new Date(p.date).toLocaleDateString('fr-FR')}</span> },
        { key: 'arrivee', header: t('arrivee'), className: 'w-24', render: (p: any) => <span className="text-sm">{p.heureArrivee || '-'}</span> },
        { key: 'depart', header: t('depart'), className: 'w-24', render: (p: any) => <span className="text-sm">{p.heureDepart || '-'}</span> },
        { key: 'heures', header: t('heures'), className: 'w-20', render: (p: any) => <span className="text-sm font-medium">{p.heuresTravaillees}h</span> },
        { key: 'statut', header: t('statut'), className: 'w-32', render: (p: any) => { const s = statuts[p.statut] || { label: p.statut, color: 'gray', icon: AlertCircle }; return <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${s.color}-100 text-${s.color}-700 flex items-center gap-1 w-fit`}><s.icon className="w-3 h-3" />{s.label}</span>; } },
    ];

    if (isLoading && !pointagesData) return <PageSkeleton />;
    if (error) return <ErrorMessage message={error?.message || t('uneErreurEstSurvenue')} onRetry={() => window.location.reload()} />;

    return (
        <div className="space-y-6">
            <PageHeader
                variant="gradient"
                icon={Clock}
                title={t('titre')}
                subtitle={t('description')}
                actions={
                    <button className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/35 !text-white rounded-lg backdrop-blur-sm transition-all duration-150">
                        <Clock className="w-4 h-4" />
                        {t('nouveau')}
                    </button>
                }
            />

            <CardGrid columns={{ default: 1, md: 4 }}>
                <StatCard icon={CheckCircle} label={t('presents')} value={stats?.presents || 0} tone="success" />
                <StatCard icon={AlertCircle} label={t('retards')} value={stats?.retards || 0} tone="warning" />
                <StatCard icon={TrendingUp} label={t('tauxPresence')} value={stats?.tauxPresence ? `${stats.tauxPresence.toFixed(1)}%` : '-'} tone="accent" />
                <StatCard icon={Clock} label={t('moyenneHeures')} value={stats?.moyenneHeures ? `${stats.moyenneHeures.toFixed(1)}h` : '-'} tone="purple" />
            </CardGrid>

            <DataTable
                tableId="pointages"
                data={pointages}
                columns={colonnes}
                enableReordering
                enablePinning
                enableColumnVisibility
                searchable
                searchPlaceholder={t('rechercher')} />
        </div>
    );
}
