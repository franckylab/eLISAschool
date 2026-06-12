/**
 * ==================================
 * eLISAschool - Page Discipline
 * ==================================
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Plus, Eye, Edit, Trash2, Shield, AlertCircle } from 'lucide-react';
import { DataTable, Column } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { useSanctions, useSupprimerSanction, useAmnistierSanction, useStatistiquesDiscipline } from '../hooks/use-discipline';
import type { Sanction } from '../types/discipline.types';

export function DisciplinePage() {
    const { t } = useTranslation('discipline');
    const [page, setPage] = useState(1);
    const limit = 20;
    const [recherche, setRecherche] = useState('');
    const [filtreType, setFiltreType] = useState<string>('');
    const [filtreGravite, setFiltreGravite] = useState<string>('');

    const { data, isLoading, meta } = useSanctions({
        page,
        limit,
        recherche: recherche || undefined,
        type: filtreType || undefined,
        gravite: filtreGravite || undefined,
    });

    const { data: stats } = useStatistiquesDiscipline();
    const supprimer = useSupprimerSanction();
    const amnistier = useAmnistierSanction();

    const types: any = {
        avertissement: { label: 'Avertissement', color: 'yellow', icone: AlertCircle },
        remontrance: { label: 'Réprimande', color: 'orange', icone: AlertTriangle },
        exclusion_temporaire: { label: 'Exclusion temp.', color: 'red', icone: Shield },
        exclusion_definitive: { label: 'Exclusion déf.', color: 'red', icone: Shield },
        conseil_discipline: { label: 'Conseil discipline', color: 'purple', icone: Shield },
        autre: { label: 'Autre', color: 'gray', icone: AlertTriangle },
    };

    const gravites: any = {
        legere: { label: 'Légère', color: 'yellow' },
        moyenne: { label: 'Moyenne', color: 'orange' },
        grave: { label: 'Grave', color: 'red' },
        tres_grave: { label: 'Très grave', color: 'red' },
    };

    const statuts: any = {
        active: { label: 'Active', color: 'red' },
        amnistiee: { label: 'Amnistiée', color: 'green' },
        archivee: { label: 'Archivée', color: 'gray' },
    };

    const colonnes: Column<Sanction>[] = [
        {
            key: 'type',
            header: 'Type',
            className: 'text-center w-36',
            render: (s) => {
                const type = types[s.type];
                const Icone = type?.icone || AlertTriangle;
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
            render: (s) => (
                <div>
                    <p className="font-medium text-gray-900">{s.eleve?.prenom} {s.eleve?.nom}</p>
                    <p className="text-xs text-gray-500">{s.eleve?.matricule}</p>
                    {s.eleve?.classe && (
                        <p className="text-xs text-gray-400">{s.eleve.classe.code}</p>
                    )}
                </div>
            ),
        },
        {
            key: 'gravite',
            header: 'Gravité',
            className: 'text-center w-24',
            render: (s) => {
                const gravite = gravites[s.gravite];
                return (
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-${gravite?.color}-100 text-${gravite?.color}-800`}>
                        {gravite?.label}
                    </span>
                );
            },
        },
        {
            key: 'motif',
            header: 'Motif',
            render: (s) => (
                <div>
                    <p className="text-sm font-medium text-gray-900">{s.motif}</p>
                    {s.description && <p className="text-xs text-gray-500 line-clamp-1">{s.description}</p>}
                </div>
            ),
        },
        {
            key: 'date',
            header: 'Date',
            className: 'w-28',
            render: (s) => (
                <span className="text-sm text-gray-700">
                    {new Date(s.dateSanction).toLocaleDateString('fr-FR')}
                </span>
            ),
        },
        {
            key: 'statut',
            header: 'Statut',
            className: 'text-center w-24',
            render: (s) => {
                const statut = statuts[s.statut || 'active'];
                return (
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-${statut?.color}-100 text-${statut?.color}-800`}>
                        {statut?.label}
                    </span>
                );
            },
        },
        {
            key: 'actions',
            pinned: 'right' as const,
            header: 'Actions',
            className: 'text-right w-40',
            render: (s) => (
                <div className="flex justify-end gap-1">
                    <ElisaButton
                        variant="outline"
                        size="sm"
                        icon={<Eye className="h-3 w-3" />}
                        onClick={() => window.alert(`Détail: ${s.eleve?.nom}`)}
                    />
                    {s.statut === 'active' && (
                        <ElisaButton
                            variant="outline"
                            size="sm"
                            icon={<Shield className="h-3 w-3" />}
                            isLoading={amnistier.isPending}
                            onClick={() => amnistier.mutateAsync(s.id)}
                        >
                            Amnistier
                        </ElisaButton>
                    )}
                    <ElisaButton
                        variant="danger"
                        size="sm"
                        icon={<Trash2 className="h-3 w-3" />}
                        isLoading={supprimer.isPending}
                        onClick={() => supprimer.mutateAsync(s.id)}
                    />
                </div>
            ),
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
                    onClick={() => window.alert('Enregistrer sanction')}
                >
                    {t('enregistrer')}
                </ElisaButton>
            </motion.div>

            {stats && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-1 md:grid-cols-4 gap-4"
                >
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <AlertTriangle className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Total sanctions</p>
                                <p className="text-lg font-bold text-red-600">{stats.totalSanctions}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <AlertCircle className="h-5 w-5 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Graves</p>
                                <p className="text-lg font-bold text-orange-600">
                                    {stats.parGravite?.find(g => g.gravite === 'grave' || g.gravite === 'tres_grave')?.nombre || 0}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <Shield className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Amnistiées</p>
                                <p className="text-lg font-bold text-green-600">
                                    {stats.parStatut?.find(s => s.statut === 'amnistiee')?.nombre || 0}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <AlertTriangle className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Types</p>
                                <p className="text-lg font-bold text-blue-600">{stats.parType?.length || 0}</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            <DataTable
                data={data?.items || []}
                columns={colonnes}
                isLoading={isLoading}
                enableReordering
                enableRowHeight
                enablePinning
                enableColumnVisibility
                searchPlaceholder={t('rechercher')}
                filtres={[
                    {
                        key: 'type',
                        label: 'Type',
                        options: [
                            { value: 'avertissement', label: 'Avertissement' },
                            { value: 'remontrance', label: 'Réprimande' },
                            { value: 'exclusion_temporaire', label: 'Exclusion temp.' },
                            { value: 'exclusion_definitive', label: 'Exclusion déf.' },
                            { value: 'conseil_discipline', label: 'Conseil discipline' },
                            { value: 'autre', label: 'Autre' },
                        ],
                        allOptionLabel: 'Tous les types',
                    },
                    {
                        key: 'gravite',
                        label: 'Gravité',
                        options: [
                            { value: 'leger', label: 'Léger' },
                            { value: 'moyen', label: 'Moyen' },
                            { value: 'grave', label: 'Grave' },
                            { value: 'tres_grave', label: 'Très grave' },
                        ],
                        allOptionLabel: 'Toutes gravités',
                    },
                ]}
                onSearchChange={setRecherche}
                onFilterChange={(key, valeur) => {
                    if (key === 'type') setFiltreType(valeur);
                    if (key === 'gravite') setFiltreGravite(valeur);
                }}
                disableClientSearch
                pagination={data?.meta ? {
                    page,
                    limit,
                    total: data.meta.total,
                    totalPages: data.meta.totalPages,
                } : undefined}
            />
        </div>
    );
}
