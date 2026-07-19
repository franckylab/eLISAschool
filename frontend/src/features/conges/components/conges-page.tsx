import { useTranslation } from 'react-i18next';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, Plus, Eye } from 'lucide-react';
import { useConges, useStatistiquesConges } from '../hooks/use-conges';
import { DataTable } from '@/components/ui/DataTable';
import { CardGrid, StatCard } from '@/components/ui';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

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
    const { t } = useTranslation('conges');
    const { data: congesData, isLoading, error } = useConges();
    const { data: stats } = useStatistiquesConges();

    const conges = congesData?.data || [];

    const colonnes = [
        { key: 'demandeur', header: t('demandeur'), render: (c: any) => <span className="font-medium">{c.demandeur ? `${c.demandeur.nom} ${c.demandeur.prenom}` : '-'}</span> },
        { key: 'type', header: t('type'), className: 'w-32', render: (c: any) => { const t2 = typesConges[c.type] || { label: c.type, color: 'gray' }; return <span className={`px-2 py-1 rounded text-xs font-medium bg-${t2.color}-100 text-${t2.color}-700`}>{t2.label}</span>; } },
        { key: 'dates', header: t('periode'), render: (c: any) => <span className="text-sm">{new Date(c.dateDebut).toLocaleDateString('fr-FR')} - {new Date(c.dateFin).toLocaleDateString('fr-FR')} ({c.nombreJours}j)</span> },
        { key: 'motif', header: t('motif'), className: 'max-w-xs', render: (c: any) => <span className="text-sm text-gray-600 truncate">{c.motif}</span> },
        { key: 'statut', header: t('statut'), className: 'w-28', render: (c: any) => { const s = statuts[c.statut] || { label: c.statut, color: 'gray', icon: AlertCircle }; return <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${s.color}-100 text-${s.color}-700 flex items-center gap-1 w-fit`}><s.icon className="w-3 h-3" />{s.label}</span>; } },
        { key: 'actions',
            header: t('actions'), className: 'text-right',
            renderActions: (_c: any) => [
                { key: 'voir', icon: Eye, label: t('voirDetails'), onClick: () => {/* Voir détails */}, variant: 'info' as const },
            ],
        },
    ];

    if (isLoading && !congesData) return <PageSkeleton />;
    if (error) return <ErrorMessage message={error?.message || t('uneErreurEstSurvenue')} onRetry={() => window.location.reload()} />;

    return (
        <div className="space-y-6">
            <PageHeader
                variant="gradient"
                icon={Calendar}
                title={t('titre')}
                subtitle={t('description')}
                actions={
                    <button className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/35 !text-white rounded-lg backdrop-blur-sm transition-all duration-150">
                        <Plus className="w-4 h-4" />
                        {t('nouveau')}
                    </button>
                }
            />

            <CardGrid columns={{ default: 1, md: 4 }}>
                <StatCard icon={AlertCircle} label={t('enAttente')} value={stats?.enAttente || 0} tone="warning" />
                <StatCard icon={CheckCircle} label={t('acceptes')} value={stats?.acceptes || 0} tone="success" />
                <StatCard icon={Calendar} label={t('totalDemandes')} value={stats?.totalDemandes || 0} tone="accent" />
                <StatCard icon={Clock} label={t('joursTotal')} value={conges.reduce((sum, c) => sum + c.nombreJours, 0)} tone="purple" />
            </CardGrid>

            <DataTable
                tableId="conges"
                data={conges}
                columns={colonnes}
                enableReordering
                enablePinning
                enableColumnVisibility
                searchable
                searchPlaceholder={t('rechercher')} />
        </div>
    );
}
