/**
 * ==================================
 * eLISAschool - Page Discipline
 * ==================================
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Plus, Search, Eye, Edit, Trash2, Shield, AlertCircle } from 'lucide-react';
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

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex gap-3"
            >
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder={t('rechercher')}
                        value={recherche}
                        onChange={(e) => setRecherche(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <select
                    value={filtreType}
                    onChange={(e) => setFiltreType(e.target.value)}
                    className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">Tous les types</option>
                    <option value="avertissement">Avertissement</option>
                    <option value="remontrance">Réprimande</option>
                    <option value="exclusion_temporaire">Exclusion temp.</option>
                    <option value="exclusion_definitive">Exclusion déf.</option>
                    <option value="conseil_discipline">Conseil discipline</option>
                    <option value="autre">Autre</option>
                </select>
                <select
                    value={filtreGravite}
                    onChange={(e) => setFiltreGravite(e.target.value)}
                    className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">Toutes gravités</option>
                    <option value="legere">Légère</option>
                    <option value="moyenne">Moyenne</option>
                    <option value="grave">Grave</option>
                    <option value="tres_grave">Très grave</option>
                </select>
            </motion.div>

            <DataTable
                colonnes={colonnes}
                donnees={data || []}
                isLoading={isLoading}
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
