/**
 * ==================================
 * eLISAschool - Page Inventaire
 * ==================================
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Package, Plus, AlertTriangle, TrendingUp, DollarSign, Trash2 } from 'lucide-react';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { useMateriels, useSupprimerMateriel, useStatistiquesInventaire } from '../hooks/use-inventaire';
import type { Materiel } from '../types/inventaire.types';

export function InventairePage() {
    const { t } = useTranslation('inventaire');
    const [page, setPage] = useState(1);
    const [recherche, setRecherche] = useState('');
    const [filtreCategorie, setFiltreCategorie] = useState('');
    const [filtreEtat, setFiltreEtat] = useState('');

    const { data, isLoading, meta } = useMateriels({ recherche: recherche || undefined, categorie: filtreCategorie || undefined, etat: filtreEtat || undefined });
    const { data: stats } = useStatistiquesInventaire();
    const supprimer = useSupprimerMateriel();

    const categories: any = {
        mobilier: { label: 'Mobilier', color: 'blue' },
        informatique: { label: 'Informatique', color: 'purple' },
        pedagogique: { label: 'Pédagogique', color: 'green' },
        entretien: { label: 'Entretien', color: 'orange' },
        autre: { label: 'Autre', color: 'gray' },
    };

    const etats: any = {
        neuf: { label: 'Neuf', color: 'green' },
        bon: { label: 'Bon', color: 'blue' },
        moyen: { label: 'Moyen', color: 'yellow' },
        use: { label: 'Usé', color: 'orange' },
        hors_service: { label: 'Hors service', color: 'red' },
    };

    const colonnes: Column<Materiel>[] = [
        { key: 'reference', header: 'Référence', className: 'w-28', render: (m) => <span className="text-sm font-mono text-gray-700">{m.reference}</span>},
        { key: 'designation', header: 'Désignation', render: (m) => (<div><p className="font-medium text-gray-900">{m.designation}</p>{m.fournisseur && <p className="text-xs text-gray-500">{m.fournisseur}</p>}</div>)},
        { key: 'categorie', header: 'Catégorie', className: 'text-center w-28', render: (m) => { const cat = categories[m.categorie]; return (<span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-${cat?.color}-100 text-${cat?.color}-800`}>{cat?.label}</span>); }},
        { key: 'quantite', header: 'Qté', className: 'text-center w-20', render: (m) => <span className="text-sm font-medium">{m.quantiteDisponible}/{m.quantite}</span>},
        { key: 'etat', header: 'État', className: 'text-center w-28', render: (m) => { const etat = etats[m.etat]; return (<span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-${etat?.color}-100 text-${etat?.color}-800`}>{etat?.label}</span>); }},
        { key: 'prix', header: 'Prix unit.', className: 'text-right w-24', render: (m) => <span className="text-sm text-gray-700">{m.prixUnitaire ? `${m.prixUnitaire.toLocaleString('fr-FR')} FCFA` : '-'}</span>},
        { key: 'actions', header: 'Actions', className: 'text-right w-20',
            renderActions: (m) => [
                { key: 'supprimer', icon: Trash2, label: 'Supprimer', onClick: () => supprimer.mutateAsync(m.id), variant: 'danger' as const },
            ],
        },
    ];

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
                <div><h1 className="text-2xl font-bold text-gray-900">{t('titre')}</h1><p className="text-sm text-gray-500 mt-1">{t('description')}</p></div>
                <ElisaButton variant="primary" size="sm" onClick={() => window.alert('Nouveau matériel')}>{t('ajouter')}</ElisaButton>
            </motion.div>

            {stats && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg p-4 border border-gray-200"><div className="flex items-center gap-3"><div className="p-2 bg-blue-100 rounded-lg"><Package className="h-5 w-5 text-blue-600" /></div><div><p className="text-xs text-gray-500">Total matériel</p><p className="text-lg font-bold text-blue-600">{stats.totalMateriel}</p></div></div></div>
                    <div className="bg-white rounded-lg p-4 border border-gray-200"><div className="flex items-center gap-3"><div className="p-2 bg-green-100 rounded-lg"><TrendingUp className="h-5 w-5 text-green-600" /></div><div><p className="text-xs text-gray-500">Valeur totale</p><p className="text-lg font-bold text-green-600">{stats.valeurTotale?.toLocaleString('fr-FR')} FCFA</p></div></div></div>
                    <div className="bg-white rounded-lg p-4 border border-gray-200"><div className="flex items-center gap-3"><div className="p-2 bg-red-100 rounded-lg"><AlertTriangle className="h-5 w-5 text-red-600" /></div><div><p className="text-xs text-gray-500">Hors service</p><p className="text-lg font-bold text-red-600">{stats.materielsHorsService}</p></div></div></div>
                    <div className="bg-white rounded-lg p-4 border border-gray-200"><div className="flex items-center gap-3"><div className="p-2 bg-purple-100 rounded-lg"><DollarSign className="h-5 w-5 text-purple-600" /></div><div><p className="text-xs text-gray-500">Catégories</p><p className="text-lg font-bold text-purple-600">{stats.parCategorie?.length || 0}</p></div></div></div>
                </motion.div>
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
                        key: 'categorie',
                        label: 'Catégorie',
                        options: [
                            { value: 'mobilier', label: 'Mobilier' },
                            { value: 'informatique', label: 'Informatique' },
                            { value: 'pedagogique', label: 'Pédagogique' },
                            { value: 'entretien', label: 'Entretien' },
                            { value: 'autre', label: 'Autre' },
                        ],
                        allOptionLabel: 'Toutes catégories',
                    },
                    {
                        key: 'etat',
                        label: 'État',
                        options: [
                            { value: 'neuf', label: 'Neuf' },
                            { value: 'bon', label: 'Bon' },
                            { value: 'moyen', label: 'Moyen' },
                            { value: 'use', label: 'Usé' },
                            { value: 'hors_service', label: 'Hors service' },
                        ],
                        allOptionLabel: 'Tous les états',
                    },
                ]}
                onSearchChange={setRecherche}
                onFilterChange={(key, valeur) => {
                    if (key === 'categorie') setFiltreCategorie(valeur);
                    if (key === 'etat') setFiltreEtat(valeur);
                }}
                disableClientSearch
                pagination={{ page, limit: 20, total: meta?.total || 0, onPageChange: setPage }}
            />
        </div>
    );
}
