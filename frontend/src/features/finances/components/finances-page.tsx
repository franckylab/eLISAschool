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
import { LoadingState, ErrorState } from '@/components/feedback';
import { CardGrid } from '@/components/ui/CardGrid';
import { StatCard } from '@/components/ui/StatCard';
import { usePaiements, useStatistiquesFinancieres } from '../hooks/use-finances';
import type { Paiement } from '../types/finance.types';

export function FinancesPage() {
    const { t } = useTranslation('finances');
    const [page, setPage] = useState(1);
    const limit = 20;
    const [recherche, setRecherche] = useState('');

    const { data, isLoading, error } = usePaiements({
        page,
        limit,
        recherche: recherche || undefined,
    });

    const { data: stats } = useStatistiquesFinancieres();

    const refetchPaiements = () => {
        // Le refetch sera géré par react-query automatiquement
    };

    if (isLoading) {
        return (
            <div className="p-6">
                <LoadingState message="Chargement des données financières..." />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <ErrorState
                    message={error.message || "Impossible de charger les données financières"}
                    onRetry={() => window.location.reload()}
                />
            </div>
        );
    }

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
            header: 'Actions',
            className: 'text-right w-24',
            renderActions: (p) => [
                {
                    key: 'detail',
                    icon: Eye,
                    label: 'Détail paiement',
                    onClick: () => window.alert(`Détail paiement ${p.reference}`),
                    variant: 'info' as const,
                },
                {
                    key: 'recu',
                    icon: Download,
                    label: 'Télécharger reçu',
                    onClick: () => window.alert('Télécharger reçu'),
                    variant: 'success' as const,
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
                    onClick={() => window.alert('Enregistrer paiement')}
                >
                    {t('enregistrer')}
                </ElisaButton>
            </motion.div>

            {stats && (
                <CardGrid columns={{ default: 1, md: 4 }}>
                    <StatCard icon={TrendingUp} label="Total encaissé" value={`${stats.totalEncaisse.toLocaleString('fr-FR')} FCFA`} tone="success" />
                    <StatCard icon={Wallet} label="En attente" value={`${stats.montantEnAttente.toLocaleString('fr-FR')} FCFA`} tone="warning" />
                    <StatCard icon={CreditCard} label="Paiements" value={stats.totalPaiements} tone="accent" />
                    <StatCard icon={DollarSign} label="Taux collecte" value={`${stats.tauxCollecte.toFixed(1)}%`} tone="purple" />
                </CardGrid>
            )}

            <DataTable
                columns={colonnes}
                data={data?.items || []}
                isLoading={false}
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
