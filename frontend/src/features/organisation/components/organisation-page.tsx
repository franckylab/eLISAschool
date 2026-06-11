/**
 * ==================================
 * eLISAschool - Page Organisation
 * ==================================
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Users, Plus, Search, UserPlus, Edit, Trash2, Building2, UserCheck } from 'lucide-react';
import { DataTable, Column } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { useGroupes, useSupprimerGroupe, useCreerGroupe } from '../hooks/use-organisation';
import type { GroupeEtablissement } from '../types/organisation.types';

export function OrganisationPage() {
    const { t } = useTranslation('organisation');
    const [page, setPage] = useState(1);
    const limit = 20;
    const [recherche, setRecherche] = useState('');
    const [filtreType, setFiltreType] = useState<string>('');

    const { data, isLoading, meta } = useGroupes({
        page,
        limit,
        recherche: recherche || undefined,
        type: filtreType || undefined,
    });

    const supprimer = useSupprimerGroupe();
    const creer = useCreerGroupe();

    const types: any = {
        pedagogique: { label: 'Pédagogique', color: 'blue', icone: Building2 },
        administratif: { label: 'Administratif', color: 'purple', icone: UserCheck },
        activite: { label: 'Activité', color: 'green', icone: Users },
        autre: { label: 'Autre', color: 'gray', icone: Users },
    };

    const colonnes: Column<GroupeEtablissement>[] = [
        {
            key: 'type',
            header: 'Type',
            className: 'text-center w-32',
            render: (g) => {
                const type = types[g.type];
                const Icone = type?.icone || Users;
                return (
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium bg-${type?.color}-100 text-${type?.color}-800`}>
                        <Icone className="h-3 w-3" />
                        {type?.label}
                    </span>
                );
            },
        },
        {
            key: 'info',
            header: 'Groupe',
            sortable: true,
            render: (g) => (
                <div>
                    <p className="font-medium text-gray-900">{g.nom}</p>
                    <p className="text-xs text-gray-500">Code: {g.code}</p>
                    {g.description && <p className="text-xs text-gray-400 line-clamp-1">{g.description}</p>}
                </div>
            ),
        },
        {
            key: 'responsable',
            header: 'Responsable',
            render: (g) => (
                g.responsable ? (
                    <div>
                        <p className="text-sm font-medium">{g.responsable.prenom} {g.responsable.nom}</p>
                    </div>
                ) : (
                    <span className="text-gray-400 text-sm">Non assigné</span>
                )
            ),
        },
        {
            key: 'membres',
            header: 'Membres',
            className: 'text-center w-20',
            render: (g) => (
                <span className="inline-flex items-center justify-center rounded-lg bg-gray-100 px-2 py-1 text-sm font-semibold text-gray-700">
                    {g.nombreMembres || 0}
                </span>
            ),
        },
        {
            key: 'statut',
            header: 'Statut',
            className: 'text-center w-20',
            render: (g) => (
                <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${g.statut === 'actif' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {g.statut === 'actif' ? 'Actif' : 'Inactif'}
                </span>
            ),
        },
        {
            key: 'actions',
            header: 'Actions',
            className: 'text-right w-40',
            render: (g) => (
                <div className="flex justify-end gap-1">
                    <ElisaButton
                        variant="outline"
                        size="sm"
                        icon={<UserPlus className="h-3 w-3" />}
                        onClick={() => window.alert(`Ajouter membre: ${g.nom}`)}
                    >
                        Membre
                    </ElisaButton>
                    <ElisaButton
                        variant="outline"
                        size="sm"
                        icon={<Edit className="h-3 w-3" />}
                        onClick={() => window.alert(`Modifier: ${g.nom}`)}
                    />
                    <ElisaButton
                        variant="danger"
                        size="sm"
                        icon={<Trash2 className="h-3 w-3" />}
                        isLoading={supprimer.isPending}
                        onClick={() => supprimer.mutateAsync(g.id)}
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
                    onClick={() => window.alert('Créer groupe')}
                >
                    {t('creer')}
                </ElisaButton>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
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
                    <option value="pedagogique">Pédagogique</option>
                    <option value="administratif">Administratif</option>
                    <option value="activite">Activité</option>
                    <option value="autre">Autre</option>
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
