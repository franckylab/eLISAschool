/**
 * ==================================
 * eLISAschool - Page Finances
 * ==================================
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { DollarSign, Plus, Download, Eye, CreditCard, Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { DataTable, Column } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { usePaiements, useStatistiquesFinancieres } from '../hooks/use-finances';
import type { Paiement } from '../types/finance.types';

export function FinancesPage() {
    const { t } = useTranslation('finances');
    const [page, setPage] = useState(1);
    const limit = 20;
    const [recherche, setRecherche] = useState('');

    const { data: paiements, isLoading, meta } = usePaiements({
        page,
        limit,
        recherche: recherche || undefined,
    });

    const { data: stats } = useStatistiquesFinancieres();

    const statuts: any = {
        effectue: { label: 'Effectué', color: 'green', icone: TrendingUp },
        partiel: { label: 'Partiel', color: 'yellow', icone: Wallet },
        en_attente: { label: 'En attente', color: 'blue', icone: CreditCard },
        annule: { label: 'Annulé', color: 'red', icone: TrendingDown },
    };

    const moyensPaiement: any = {
        especes: { label: 'Espèces', color: 'green' },
        cheque: { label: 'Chèque', color: 'blue' },
        virement: { label: 'Virement', color: 'purple' },
        mobile: { label: 'Mobile', color: 'orange' },
        autre: { label: 'Autre', color: 'gray' },
    };

    const colonnes: Column<Paiement>[] = [
        {
            key: 'eleve',
            pinned: 'left' as const,
            header: 'Élève',
            sortable: true,
            render: (p) => (
                <div>
                    <p className="font-medium text-gray-900">{p.eleve?.prenom} {p.eleve?.nom}</p>
                    <p className="text-xs text-gray-500">{p.eleve?.matricule}</p>
                </div>
            ),
        },
        {
            key: 'frais',
            header: 'Frais',
            render: (p) => (
                <div>
                    <p className="text-sm font-medium">{p.frais?.libelle}</p>
                    <p className="text-xs text-gray-500">{p.frais?.code}</p>
                </div>
            ),
        },
        {
            key: 'montant',
            header: 'Montant',
            className: 'text-center w-32',
            render: (p) => (
                <span className="inline-flex items-center justify-center rounded-lg bg-green-100 px-3 py-1 text-lg font-bold text-green-800">
                    {p.montant.toLocaleString('fr-FR')} FCFA
                </span>
            ),
        },
        {
            key: 'statut',
            header: 'Statut',
            className: 'text-center w-28',
            render: (p) => {
                const statut = statuts[p.statut];
                const Icone = statut?.icone || DollarSign;
                return (
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium bg-${statut?.color}-100 text-${statut?.color}-800`}>
                        <Icone className="h-3 w-3" />
                        {statut?.label}
                    </span>
                );
            },
        },
        {
            key: 'moyen',
            header: 'Moyen',
            className: 'text-center w-24',
            render: (p) => {
                const moyen = moyensPaiement[p.moyenPaiement];
                return (
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-${moyen?.color}-100 text-${moyen?.color}-800`}>
                        {moyen?.label}
                    </span>
                );
            },
        },
        {
            key: 'date',
            header: 'Date',
            className: 'w-28',
            render: (p) => (
                <span className="text-sm text-gray-700">
                    {new Date(p.datePaiement).toLocaleDateString('fr-FR')}
                </span>
            ),
        },
        {
            key: 'reference',
            header: 'Référence',
            className: 'w-32',
            render: (p) => (
                <span className="text-xs font-mono text-gray-600">
                    {p.reference || '-'}
                </span>
            ),
        },
        {
            key: 'actions',
            pinned: 'right' as const,
            header: 'Actions',
            className: 'text-right w-24',
            render: (p) => (
                <div className="flex justify-end gap-1">
                    <ElisaButton
                        variant="outline"
                        size="sm"
                        icon={<Eye className="h-3 w-3" />}
                        onClick={() => window.alert(`Détail paiement ${p.reference}`)}
                    />
                    <ElisaButton
                        variant="outline"
                        size="sm"
                        icon={<Download className="h-3 w-3" />}
                        onClick={() => window.alert('Télécharger reçu')}
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
                    onClick={() => window.alert('Enregistrer paiement')}
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
                            <div className="p-2 bg-green-100 rounded-lg">
                                <TrendingUp className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Total encaissé</p>
                                <p className="text-lg font-bold text-green-600">{stats.totalEncaisse.toLocaleString('fr-FR')} FCFA</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-yellow-100 rounded-lg">
                                <Wallet className="h-5 w-5 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">En attente</p>
                                <p className="text-lg font-bold text-yellow-600">{stats.montantEnAttente.toLocaleString('fr-FR')} FCFA</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <CreditCard className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Paiements</p>
                                <p className="text-lg font-bold text-blue-600">{stats.totalPaiements}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <DollarSign className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Taux collecte</p>
                                <p className="text-lg font-bold text-purple-600">{stats.tauxCollecte.toFixed(1)}%</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            <DataTable
                colonnes={colonnes}
                donnees={paiements || []}
                isLoading={isLoading}
                searchPlaceholder={t('rechercher')}
                enableReordering
                enablePinning
                onSearchChange={setRecherche}
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
