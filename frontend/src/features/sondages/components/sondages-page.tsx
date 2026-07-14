/**
 * ==================================
 * eLISAschool - Page Sondages
 * ==================================
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { BarChart3, Plus, Eye, Trash2, Download, Users, CheckCircle } from 'lucide-react';
import { DataTable, Column } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { useSondages, useSupprimerSondage, useExporterSondage } from '../hooks/use-sondages';
import type { Sondage } from '../types/sondage.types';

export function SondagesPage() {
    const { t } = useTranslation('sondages');
    const [page, setPage] = useState(1);
    const limit = 20;
    const [recherche, setRecherche] = useState('');
    const [filtreCategorie, setFiltreCategorie] = useState<string>('');
    const [filtreStatut, setFiltreStatut] = useState<string>('');

    const { data, isLoading, meta } = useSondages({
        page,
        limit,
        recherche: recherche || undefined,
        categorie: filtreCategorie || undefined,
        statut: filtreStatut || undefined,
    });

    const supprimer = useSupprimerSondage();
    const exporter = useExporterSondage();

    const categories: any = {
        satisfaction: { label: 'Satisfaction', color: 'green' },
        evaluation: { label: 'Évaluation', color: 'blue' },
        consultation: { label: 'Consultation', color: 'purple' },
        feedback: { label: 'Feedback', color: 'orange' },
        autre: { label: 'Autre', color: 'gray' },
    };

    const statuts: any = {
        brouillon: { label: 'Brouillon', color: 'gray' },
        actif: { label: 'Actif', color: 'green' },
        termine: { label: 'Terminé', color: 'blue' },
        archive: { label: 'Archivé', color: 'purple' },
    };

    const types: any = {
        unique: { label: 'Choix unique', color: 'blue' },
        multiple: { label: 'Choix multiple', color: 'purple' },
        note: { label: 'Note', color: 'yellow' },
        texte: { label: 'Texte libre', color: 'orange' },
    };

    const colonnes: Column<Sondage>[] = [
        {
            key: 'categorie',
            header: 'Catégorie',
            className: 'text-center w-32',
            render: (s) => {
                const cat = categories[s.categorie];
                return (
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-${cat?.color}-100 text-${cat?.color}-800`}>
                        {cat?.label}
                    </span>
                );
            },
        },
        {
            key: 'question',
            header: 'Sondage',
            sortable: true,
            render: (s) => (
                <div>
                    <p className="font-medium text-gray-900 dark:text-gray-200">{s.titre}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{s.question}</p>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-1.5 py-0.5 rounded bg-${types[s.type]?.color}-100 text-${types[s.type]?.color}-800`}>
                            {types[s.type]?.label}
                        </span>
                        {s.estAnonyme && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                                Anonyme
                            </span>
                        )}
                    </div>
                </div>
            ),
        },
        {
            key: 'dates',
            header: 'Période',
            className: 'w-40',
            render: (s) => (
                <div className="text-sm">
                    <p className="text-gray-700 dark:text-gray-400">
                        {s.dateDebut ? new Date(s.dateDebut).toLocaleDateString('fr-FR') : 'Non défini'}
                    </p>
                    {s.dateFin && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            au {new Date(s.dateFin).toLocaleDateString('fr-FR')}
                        </p>
                    )}
                </div>
            ),
        },
        {
            key: 'votes',
            header: 'Votes',
            className: 'text-center w-20',
            render: (s) => (
                <div className="flex items-center justify-center gap-1">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-bold text-gray-900 dark:text-gray-200">{s.totalVotes || 0}</span>
                </div>
            ),
        },
        {
            key: 'statut',
            header: 'Statut',
            className: 'text-center w-24',
            render: (s) => {
                const statut = statuts[s.statut || 'brouillon'];
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
            className: 'text-right',
            renderActions: (s) => [
                {
                    key: 'resultats',
                    icon: Eye,
                    label: 'Résultats',
                    onClick: () => window.alert(`Résultats: ${s.titre}`),
                },
                {
                    key: 'analyses',
                    icon: BarChart3,
                    label: 'Analyses',
                    onClick: () => window.alert(`Analyses: ${s.titre}`),
                },
                {
                    key: 'exporter',
                    icon: Download,
                    label: 'Exporter CSV',
                    onClick: () => exporter.mutateAsync({ sondageId: s.id, format: 'csv' }),
                },
                {
                    key: 'supprimer',
                    icon: Trash2,
                    label: 'Supprimer',
                    onClick: () => supprimer.mutateAsync(s.id),
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
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-200">{t('titre')}</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('description')}</p>
                </div>
                <ElisaButton
                    variant="primary"
                    size="sm"
                    icon={<Plus className="h-4 w-4" />}
                    onClick={() => window.alert('Créer sondage')}
                >
                    {t('creer')}
                </ElisaButton>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200"
            >
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                        <BarChart3 className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-200">Créez et analysez vos sondages</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            Posez vos questions, collectez les avis de la communauté éducative et exportez les résultats en CSV ou PDF.
                        </p>
                        <div className="flex gap-3 mt-3">
                            <span className="inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded-full">
                                <Users className="h-3 w-3" />
                                Vote anonyme disponible
                            </span>
                            <span className="inline-flex items-center gap-1 text-xs text-purple-700 bg-purple-100 px-2 py-1 rounded-full">
                                <Download className="h-3 w-3" />
                                Export multi-format
                            </span>
                        </div>
                    </div>
                </div>
            </motion.div>



            <DataTable
                colonnes={colonnes}
                donnees={data || []}
                isLoading={isLoading}
                enableReordering
                enableRowHeight
                enablePinning
                enableColumnVisibility
                searchPlaceholder={t('rechercher')}
                onSearchChange={(valeur) => setRecherche(valeur)}
                disableClientSearch
                filtres={[
                    {
                        key: 'categorie',
                        label: 'Catégorie',
                        options: [
                            { value: 'satisfaction', label: 'Satisfaction' },
                            { value: 'evaluation', label: 'Évaluation' },
                            { value: 'consultation', label: 'Consultation' },
                            { value: 'feedback', label: 'Feedback' },
                            { value: 'autre', label: 'Autre' },
                        ],
                    },
                    {
                        key: 'statut',
                        label: 'Statut',
                        options: [
                            { value: 'brouillon', label: 'Brouillon' },
                            { value: 'actif', label: 'Actif' },
                            { value: 'termine', label: 'Terminé' },
                            { value: 'archive', label: 'Archivé' },
                        ],
                    },
                ]}
                onFilterChange={(key, valeur) => {
                    if (key === 'categorie') setFiltreCategorie(valeur);
                    if (key === 'statut') setFiltreStatut(valeur);
                }}
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
