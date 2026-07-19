/**
 * ==================================
 * eLISAschool - Page Absences
 * ==================================
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, Plus, Eye, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { DataTable, Column } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { useAbsences, useJustifierAbsence, useStatistiquesAbsences } from '../hooks/use-absences';
import type { Absence } from '../types/absences.types';
import { CardGrid, StatCard } from '@/components/ui';

export function AbsencesPage() {
    const { t } = useTranslation('absences');
    const [page, setPage] = useState(1);
    const limit = 20;

    const { data, isLoading, isError, error, refetch } = useAbsences({
        page,
        limit,
    });

    const { data: stats } = useStatistiquesAbsences();
    const justifier = useJustifierAbsence();

    const types: any = {
        absence: { label: 'Absence', color: 'red', icone: XCircle },
        retard: { label: 'Retard', color: 'yellow', icone: Clock },
        departure_anticipe: { label: 'Départ anticipé', color: 'orange', icone: Clock },
    };

    const statuts: any = {
        non_justifiee: { label: 'Non justifiée', color: 'red' },
        justifiee: { label: 'Justifiée', color: 'green' },
        en_attente: { label: 'En attente', color: 'yellow' },
    };

    const colonnes: Column<Absence>[] = [
        {
            key: 'type',
            header: 'Type',
            className: 'text-center w-36',
            render: (a) => {
                const type = types[a.type];
                const Icone = type?.icone || AlertCircle;
                return (
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium bg-${type?.color}-100 text-${type?.color}-800`}>
                        <Icone className="h-3 w-3" />
                        {type?.label}
                    </span>
                );
            },
        },
        {
            key: 'eleve',
            pinned: 'left' as const,
            header: 'Élève',
            sortable: true,
            render: (a) => (
                <div>
                    <p className="font-medium text-gray-900">{a.eleve?.prenom} {a.eleve?.nom}</p>
                    <p className="text-xs text-gray-500">{a.eleve?.matricule}</p>
                    {a.eleve?.classe && (
                        <p className="text-xs text-gray-400">{a.eleve.classe.code}</p>
                    )}
                </div>
            ),
        },
        {
            key: 'date',
            header: 'Date',
            className: 'w-28',
            render: (a) => (
                <span className="text-sm text-gray-700">
                    {new Date(a.dateAbsence).toLocaleDateString('fr-FR')}
                </span>
            ),
        },
        {
            key: 'motif',
            header: 'Motif',
            render: (a) => (
                <div>
                    <p className="text-sm text-gray-900 line-clamp-1">{a.motif || '-'}</p>
                    {a.justificatif && (
                        <p className="text-xs text-gray-500">Justifié</p>
                    )}
                </div>
            ),
        },
        {
            key: 'statut',
            header: 'Statut',
            className: 'text-center w-28',
            render: (a) => {
                const statut = statuts[a.statut];
                return (
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-${statut?.color}-100 text-${statut?.color}-800`}>
                        {statut?.label}
                    </span>
                );
            },
        },
        {
            key: 'signalePar',
            header: 'Signalé par',
            className: 'w-32',
            render: (a) => (
                a.signalePar ? (
                    <div>
                        <p className="text-sm font-medium">{a.signalePar.prenom} {a.signalePar.nom}</p>
                        <p className="text-xs text-gray-500">{a.signalePar.role}</p>
                    </div>
                ) : (
                    <span className="text-gray-400 text-sm">-</span>
                )
            ),
        },
        {
            key: 'actions',
            header: 'Actions',
            className: 'text-right',
            renderActions: (a) => [
                {
                    key: 'detail',
                    icon: Eye,
                    label: 'Détail',
                    onClick: () => window.alert(`Détail: ${a.eleve?.nom}`),
                    variant: 'info' as const,
                },
                {
                    key: 'justifier',
                    icon: CheckCircle,
                    label: 'Justifier',
                    onClick: () => {
                        const motif = prompt('Motif de justification:');
                        if (motif) {
                            justifier.mutateAsync({ id: a.id, dto: { motif } });
                        }
                    },
                    hidden: a.statut === 'justifiee',
                    variant: 'success' as const,
                },
            ],
        },
    ];

    if (isLoading && !data) return <PageSkeleton />;
    if (isError) return <ErrorMessage message={(error as Error)?.message} onRetry={refetch} />;

    return (
        <div className="space-y-6">
            <PageHeader
                title={t('titre')}
                description={t('description')}
                icon={Clock}
                variant="gradient"
                actions={
                    <ElisaButton
                        variant="primary"
                        size="sm"
                        leftIcon={<Plus className="h-4 w-4" />}
                        onClick={() => window.alert('Signaler absence')}
                    >
                        {t('signaler')}
                    </ElisaButton>
                }
            />

            {stats && (
                <CardGrid columns={{ default: 1, md: 4 }}>
                    <StatCard icon={XCircle} label="Total absences" value={stats.totalAbsences} tone="danger" />
                    <StatCard icon={Clock} label="Retards" value={stats.totalRetards} tone="warning" />
                    <StatCard icon={CheckCircle} label="Justifiées" value={stats.parStatut?.find(s => s.statut === 'justifiee')?.nombre || 0} tone="success" />
                    <StatCard icon={AlertCircle} label="Taux absentéisme" value={`${stats.tauxAbsentéisme?.toFixed(1) || 0}%`} tone="purple" />
                </CardGrid>
            )}

            <DataTable
                columns={colonnes}
                data={data || []}
                isLoading={isLoading}
                emptyMessage={t('aucuneDonnee')}
                pagination={{
                    page,
                    limit,
                    total: data?.meta?.totalItems || 0,
                    onPageChange: setPage,
                }}
            />
        </div>
    );
}
