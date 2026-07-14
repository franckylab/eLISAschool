/**
 * ==================================
 * eLISAschool - Page Examens
 * ==================================
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FileText, Plus, Eye, Trash2, Calendar, Award, TrendingUp } from 'lucide-react';
import { DataTable, Column } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { useExamens, useSupprimerExamen, useStatistiquesExamens } from '../hooks/use-examens';
import type { Examen } from '../types/examens.types';
import { CardGrid, StatCard } from '@/components/ui';

export function ExamensPage() {
    const { t } = useTranslation('examens');
    const [page, setPage] = useState(1);
    const limit = 20;
    const [recherche, setRecherche] = useState('');
    const [filtreType, setFiltreType] = useState('');
    const [filtreStatut, setFiltreStatut] = useState('');

    const { data, isLoading, meta } = useExamens({
        recherche: recherche || undefined,
        type: filtreType || undefined,
        statut: filtreStatut || undefined,
    });

    const { data: stats } = useStatistiquesExamens();
    const supprimer = useSupprimerExamen();

    const types: any = {
        examen: { label: 'Examen', color: 'blue' },
        interrogation: { label: 'Interrogation', color: 'purple' },
        composition: { label: 'Composition', color: 'green' },
        concours: { label: 'Concours', color: 'orange' },
        autre: { label: 'Autre', color: 'gray' },
    };

    const statuts: any = {
        planifie: { label: 'Planifié', color: 'blue' },
        en_cours: { label: 'En cours', color: 'green' },
        termine: { label: 'Terminé', color: 'gray' },
        annule: { label: 'Annulé', color: 'red' },
    };

    const colonnes: Column<Examen>[] = [
        {
            key: 'type',
            header: 'Type',
            className: 'text-center w-32',
            render: (e) => {
                const type = types[e.type];
                return (
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-${type?.color}-100 text-${type?.color}-800`}>
                        {type?.label}
                    </span>
                );
            },
        },
        {
            key: 'titre',
            header: 'Titre',
            render: (e) => (
                <div>
                    <p className="font-medium text-gray-900">{e.titre}</p>
                    <p className="text-xs text-gray-500">{e.matiere?.nom} - {e.matiere?.code}</p>
                </div>
            ),
        },
        {
            key: 'date',
            header: 'Date',
            className: 'w-32',
            render: (e) => (
                <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-gray-400" />
                    <div>
                        <p className="text-sm text-gray-700">
                            {new Date(e.dateExamen).toLocaleDateString('fr-FR')}
                        </p>
                        <p className="text-xs text-gray-500">{e.heureDebut} - {e.heureFin}</p>
                    </div>
                </div>
            ),
        },
        {
            key: 'classe',
            header: 'Classe',
            className: 'w-24',
            render: (e) => (
                <p className="text-sm text-gray-700">{e.classe?.code || '-'}</p>
            ),
        },
        {
            key: 'coefficient',
            header: 'Coef.',
            className: 'text-center w-16',
            render: (e) => (
                <span className="text-sm font-medium text-gray-900">{e.coefficient}</span>
            ),
        },
        {
            key: 'statut',
            header: 'Statut',
            className: 'text-center w-24',
            render: (e) => {
                const statut = statuts[e.statut];
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
            renderActions: (e) => [
                {
                    key: 'resultats',
                    icon: Eye,
                    label: 'Résultats',
                    onClick: () => window.alert(`Résultats: ${e.titre}`),
                    variant: 'info' as const,
                },
                {
                    key: 'supprimer',
                    icon: Trash2,
                    label: 'Supprimer',
                    onClick: () => supprimer.mutateAsync(e.id),
                    variant: 'danger' as const,
                },
            ],
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
                    onClick={() => window.alert('Planifier examen')}
                >
                    {t('planifier')}
                </ElisaButton>
            </motion.div>

            {stats && (
                <CardGrid columns={{ default: 1, md: 4 }}>
                    <StatCard icon={FileText} label="Total examens" value={stats.totalExamens} tone="accent" />
                    <StatCard icon={Award} label="Moyenne générale" value={`${stats.moyenneGenerale?.toFixed(2) || '-'}/20`} tone="success" />
                    <StatCard icon={TrendingUp} label="Taux de réussite" value={`${stats.tauxReussite?.toFixed(1) || 0}%`} tone="purple" />
                    <StatCard icon={Calendar} label="Types" value={stats.parType?.length || 0} tone="orange" />
                </CardGrid>
            )}

            <DataTable
                colonnes={colonnes}
                donnees={data || []}
                isLoading={isLoading}
                enableReordering
                enablePinning
                enableColumnVisibility
                searchPlaceholder={t('rechercher')}
                filtres={[
                    {
                        key: 'type',
                        label: 'Type',
                        options: [
                            { value: 'examen', label: 'Examen' },
                            { value: 'interrogation', label: 'Interrogation' },
                            { value: 'composition', label: 'Composition' },
                            { value: 'concours', label: 'Concours' },
                            { value: 'autre', label: 'Autre' },
                        ],
                        allOptionLabel: 'Tous les types',
                    },
                    {
                        key: 'statut',
                        label: 'Statut',
                        options: [
                            { value: 'planifie', label: 'Planifié' },
                            { value: 'en_cours', label: 'En cours' },
                            { value: 'termine', label: 'Terminé' },
                            { value: 'annule', label: 'Annulé' },
                        ],
                        allOptionLabel: 'Tous les statuts',
                    },
                ]}
                onSearchChange={setRecherche}
                onFilterChange={(key, valeur) => {
                    if (key === 'type') setFiltreType(valeur);
                    if (key === 'statut') setFiltreStatut(valeur);
                }}
                disableClientSearch
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
