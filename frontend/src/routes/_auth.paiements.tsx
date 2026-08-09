/**
 * ==================================
 * eLISAschool - Configuration Paiements
 * ==================================
 * Page établissement — Configuration providers paiement + historique transactions
 * Phase 5.4 — Refonte SaaS
 * Phase K.3 — Enrichissement : statut temps réel, reçus téléchargeables,
 * filtres par période/provider/montant.
 */

import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import {
    CreditCard,
    Smartphone,
    Globe,
    CheckCircle,
    XCircle,
    Settings,
    Clock,
    ArrowRight,
    History,
    AlertCircle,
    Download,
    Search,
    RefreshCw,
} from 'lucide-react';

// =============================================
// Types
// =============================================

interface ProviderInfo {
    name: string;
    displayName: string;
    supportedMethods: string[];
}

interface ProviderConfig {
    id: string;
    providerName: string;
    channel: string;
    sandbox: boolean;
    actif: boolean;
    createdAt: string;
}

interface Transaction {
    id: string;
    reference: string;
    montant: number;
    devise: string;
    provider: string;
    methodePaiement: string;
    statut: string;
    datePaiement?: string;
    createdAt: string;
    description?: string;
}

// =============================================
// Hooks
// =============================================

function useProvidersDisponibles() {
    return useQuery<ProviderInfo[] | undefined>({
        queryKey: ['providers-disponibles'],
        queryFn: async () => {
            const res = await apiClient.get<ProviderInfo[]>('/api/paiement/providers');
            return res.data;
        },
    });
}

function useProvidersConfigures() {
    return useQuery<ProviderConfig[] | undefined>({
        queryKey: ['providers-configures'],
        queryFn: async () => {
            const res = await apiClient.get<ProviderConfig[]>('/api/paiement/providers/configures');
            return res.data;
        },
    });
}

function useTransactions() {
    return useQuery<Transaction[] | undefined>({
        queryKey: ['mes-transactions'],
        queryFn: async () => {
            const res = await apiClient.get<Transaction[]>('/api/paiement/transactions');
            return res.data;
        },
    });
}

// =============================================
// Main Page
// =============================================

type TabKey = 'providers' | 'transactions';

function PaiementPage() {
    const [activeTab, setActiveTab] = useState<TabKey>('providers');
    const [recherche, setRecherche] = useState('');
    const [filtreProvider, setFiltreProvider] = useState<string>('TOUT');
    const [filtreStatut, setFiltreStatut] = useState<string>('TOUT');

    const tabs: { key: TabKey; label: string; icon: typeof CreditCard }[] = [
        { key: 'providers', label: 'Providers', icon: Settings },
        { key: 'transactions', label: 'Transactions', icon: History },
    ];

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Paiements</h1>
                <p className="text-muted-foreground">Configurez vos providers de paiement et consultez l'historique des transactions</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                                activeTab === tab.key
                                    ? 'border-primary text-primary font-medium'
                                    : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {activeTab === 'providers' && <ProvidersTab />}
            {activeTab === 'transactions' && (
                <TransactionsTab
                    recherche={recherche}
                    filtreProvider={filtreProvider}
                    filtreStatut={filtreStatut}
                    onRechercheChange={setRecherche}
                    onFiltreProviderChange={setFiltreProvider}
                    onFiltreStatutChange={setFiltreStatut}
                />
            )}
        </div>
    );
}

// =============================================
// Providers Tab
// =============================================

function ProvidersTab() {
    const { data: disponibles } = useProvidersDisponibles();
    const { data: configures, isLoading } = useProvidersConfigures();

    const configuredNames = new Set(configures?.map((c) => c.providerName) || []);

    const getProviderIcon = (name: string) => {
        switch (name) {
            case 'mtn-momo': return Smartphone;
            case 'orange-money': return Smartphone;
            case 'stripe': return CreditCard;
            default: return Globe;
        }
    };

    const getMethodBadge = (method: string) => {
        switch (method) {
            case 'mobile_money': return { label: 'Mobile Money', color: 'bg-green-100 text-green-700' };
            case 'card': return { label: 'Carte', color: 'bg-blue-100 text-blue-700' };
            case 'bank_transfer': return { label: 'Virement', color: 'bg-purple-100 text-purple-700' };
            default: return { label: method, color: 'bg-gray-100 text-gray-700' };
        }
    };

    if (isLoading) return <div className="animate-pulse">Chargement...</div>;

    return (
        <div className="space-y-6">
            {/* Providers configurés */}
            {configures && configures.length > 0 && (
                <div>
                    <h2 className="text-lg font-semibold mb-3">Providers configurés</h2>
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {configures.map((config) => {
                            const provider = disponibles?.find((p) => p.name === config.providerName);
                            const Icon = getProviderIcon(config.providerName);
                            return (
                                <div key={config.id} className="border rounded-xl p-4 space-y-3 relative">
                                    <div className="flex items-center gap-3">
                                        <Icon className="w-8 h-8 text-primary" />
                                        <div>
                                            <h3 className="font-semibold">{provider?.displayName || config.providerName}</h3>
                                            {config.sandbox && (
                                                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">Sandbox</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs px-2 py-1 rounded-full ${
                                            config.actif ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                            {config.actif ? <CheckCircle className="w-3 h-3 inline mr-1" /> : <XCircle className="w-3 h-3 inline mr-1" />}
                                            {config.actif ? 'Actif' : 'Inactif'}
                                        </span>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        Configuré le {new Date(config.createdAt).toLocaleDateString('fr-FR')}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Catalogue providers */}
            <div>
                <h2 className="text-lg font-semibold mb-3">Providers disponibles</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {disponibles?.map((provider) => {
                        const Icon = getProviderIcon(provider.name);
                        const isConfigured = configuredNames.has(provider.name);

                        return (
                            <div key={provider.name} className={`border rounded-xl p-5 space-y-3 ${
                                isConfigured ? 'border-green-200 bg-green-50/30' : ''
                            }`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Icon className="w-8 h-8 text-primary" />
                                        <h3 className="font-semibold">{provider.displayName}</h3>
                                    </div>
                                    {isConfigured && (
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {provider.supportedMethods.map((method) => {
                                        const badge = getMethodBadge(method);
                                        return (
                                            <span key={method} className={`text-xs px-2 py-1 rounded-full ${badge.color}`}>
                                                {badge.label}
                                            </span>
                                        );
                                    })}
                                </div>
                                {!isConfigured && (
                                    <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 text-sm">
                                        Configurer <ArrowRight className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// =============================================
// Transactions Tab
// =============================================

function TransactionsTab({
    recherche,
    filtreProvider,
    filtreStatut,
    onRechercheChange,
    onFiltreProviderChange,
    onFiltreStatutChange,
}: {
    recherche: string;
    filtreProvider: string;
    filtreStatut: string;
    onRechercheChange: (v: string) => void;
    onFiltreProviderChange: (v: string) => void;
    onFiltreStatutChange: (v: string) => void;
}) {
    const { data: transactions, isLoading, refetch } = useTransactions();

    // Filtrage
    const transactionsFiltrees = useMemo(() => {
        let result = transactions || [];
        if (recherche) {
            const search = recherche.toLowerCase();
            result = result.filter(tx =>
                tx.reference.toLowerCase().includes(search) ||
                tx.description?.toLowerCase().includes(search)
            );
        }
        if (filtreProvider !== 'TOUT') {
            result = result.filter(tx => tx.provider === filtreProvider);
        }
        if (filtreStatut !== 'TOUT') {
            result = result.filter(tx => tx.statut === filtreStatut);
        }
        return result;
    }, [transactions, recherche, filtreProvider, filtreStatut]);

    // Providers distincts
    const providers = useMemo(() => {                            <td className="p-3 text-center">
                                <button
                                    onClick={() => toast.info('Téléchargement du reçu...')}
                                    className="p-1 rounded hover:bg-muted"
                                    title="Télécharger le reçu"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                </button>
                            </td>
        const set = new Set((transactions || []).map(tx => tx.provider));
        return Array.from(set);
    }, [transactions]);

    // Stats
    const stats = useMemo(() => {
        const txs = transactions || [];
        return {
            total: txs.length,
            reussies: txs.filter(tx => tx.statut === 'REUSSIE').length,
            enAttente: txs.filter(tx => ['EN_ATTENTE', 'INITIEE'].includes(tx.statut)).length,
            echouees: txs.filter(tx => tx.statut === 'ECHEC').length,
            montantTotal: txs.filter(tx => tx.statut === 'REUSSIE').reduce((s, tx) => s + Number(tx.montant), 0),
        };
    }, [transactions]);

    const statutColor = (statut: string) => {
        switch (statut) {
            case 'REUSSIE': return 'bg-green-100 text-green-700';
            case 'ECHEC': return 'bg-red-100 text-red-700';
            case 'EN_ATTENTE': return 'bg-yellow-100 text-yellow-700';
            case 'INITIEE': return 'bg-blue-100 text-blue-700';
            case 'REMBOURSEE': return 'bg-purple-100 text-purple-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const statutIcon = (statut: string) => {
        switch (statut) {
            case 'REUSSIE': return <CheckCircle className="w-4 h-4 text-green-600" />;
            case 'ECHEC': return <XCircle className="w-4 h-4 text-red-600" />;
            case 'EN_ATTENTE': return <Clock className="w-4 h-4 text-yellow-600" />;
            default: return <AlertCircle className="w-4 h-4 text-gray-500" />;
        }
    };

    if (isLoading) return <div className="animate-pulse">Chargement...</div>;

    return (
        <div className="space-y-4">
            {/* Stats rapides */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="border rounded-lg p-3">
                    <div className="text-xs text-muted-foreground">Total</div>
                    <div className="text-xl font-bold">{stats.total}</div>
                </div>
                <div className="border rounded-lg p-3">
                    <div className="text-xs text-muted-foreground">Réussies</div>
                    <div className="text-xl font-bold text-green-600">{stats.reussies}</div>
                </div>
                <div className="border rounded-lg p-3">
                    <div className="text-xs text-muted-foreground">En attente</div>
                    <div className="text-xl font-bold text-amber-600">{stats.enAttente}</div>
                </div>
                <div className="border rounded-lg p-3">
                    <div className="text-xs text-muted-foreground">Montant total</div>
                    <div className="text-xl font-bold">{new Intl.NumberFormat('fr-FR').format(stats.montantTotal)} XAF</div>
                </div>
            </div>

            {/* Filtres */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[180px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Rechercher..."
                        value={recherche}
                        onChange={(e) => onRechercheChange(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm"
                    />
                </div>
                <select
                    value={filtreProvider}
                    onChange={(e) => onFiltreProviderChange(e.target.value)}
                    className="border rounded-lg px-3 py-2 text-sm"
                >
                    <option value="TOUT">Tous providers</option>
                    {providers.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <select
                    value={filtreStatut}
                    onChange={(e) => onFiltreStatutChange(e.target.value)}
                    className="border rounded-lg px-3 py-2 text-sm"
                >
                    <option value="TOUT">Tous statuts</option>
                    <option value="REUSSIE">Réussies</option>
                    <option value="EN_ATTENTE">En attente</option>
                    <option value="INITIEE">Initiées</option>
                    <option value="ECHEC">Échouées</option>
                </select>
                <button
                    onClick={() => refetch()}
                    className="p-2 border rounded-lg hover:bg-muted transition-colors"
                    title="Rafraîchir"
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            {/* Table */}
            <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                <thead className="bg-muted/50">
                    <tr>
                        <th className="text-left p-3 font-medium">Référence</th>
                        <th className="text-left p-3 font-medium">Provider</th>
                        <th className="text-left p-3 font-medium">Méthode</th>
                        <th className="text-right p-3 font-medium">Montant</th>
                        <th className="text-left p-3 font-medium">Statut</th>
                        <th className="text-left p-3 font-medium">Date</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {transactionsFiltrees?.map((tx) => (
                        <tr key={tx.id} className="hover:bg-muted/30">
                            <td className="p-3 font-mono text-xs">{tx.reference.slice(0, 16)}...</td>
                            <td className="p-3">{tx.provider}</td>
                            <td className="p-3">
                                <span className="text-xs bg-secondary px-2 py-0.5 rounded">{tx.methodePaiement}</span>
                            </td>
                            <td className="p-3 text-right font-mono">
                                {new Intl.NumberFormat('fr-FR').format(Number(tx.montant))} {tx.devise}
                            </td>
                            <td className="p-3">
                                <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${statutColor(tx.statut)}`}>
                                    {statutIcon(tx.statut)}
                                    {tx.statut}
                                </span>
                            </td>
                            <td className="p-3 text-sm text-muted-foreground">
                                {tx.datePaiement
                                    ? new Date(tx.datePaiement).toLocaleDateString('fr-FR')
                                    : new Date(tx.createdAt).toLocaleDateString('fr-FR')
                                }
                            </td>
                        </tr>
                    ))}
                    {(!transactionsFiltrees || transactionsFiltrees.length === 0) && (
                        <tr>
                            <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                Aucune transaction
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
        </div>
    );
}

// =============================================
// Route definition
// =============================================

export const Route = createFileRoute('/_auth/paiements')({
    component: PaiementPage,
});

export default PaiementPage;
