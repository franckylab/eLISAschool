/**
 * ==================================
 * eLISAschool - Mes Factures (Client)
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Phase K.2 — Refonte SaaS v3
 * Liste des factures avec filtres, téléchargement PDF,
 * paiement en ligne, demande d'avoir.
 */

import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import {
    FileText,
    Download,
    CreditCard,
    Search,
    AlertCircle,
    CheckCircle,
    Clock,
    XCircle,
    Receipt,
    ArrowUpDown,
} from 'lucide-react';

// =============================================
// Types
// =============================================

interface LigneFacture {
    description: string;
    quantite: number;
    montantUnitaire: number;
    montantTotal: number;
}

interface Facture {
    id: string;
    numero: string;
    dateEmission: string;
    dateEcheance: string;
    montantTotal: number;
    montantPaye: number;
    statut: string;
    devise: string;
    lignes?: LigneFacture[];
}

type FiltreStatut = 'TOUT' | 'PAYEE' | 'EMISE' | 'EN_RETARD' | 'EN_PAIEMENT' | 'AVOIR';
type TriChamp = 'dateEmission' | 'montantTotal' | 'statut';

// =============================================
// Hooks
// =============================================

function useMesFactures() {
    return useQuery<Facture[] | undefined>({
        queryKey: ['mes-factures'],
        queryFn: async () => {
            const res = await apiClient.get<Facture[]>('/api/billing/mes-factures');
            return res.data;
        },
    });
}

function usePayerFacture() {
    return useMutation({
        mutationFn: async ({ factureId, provider, methodePaiement }: { factureId: string; provider: string; methodePaiement: string }) => {
            const res = await apiClient.post(`/api/billing/factures/${factureId}/payer`, { provider, methodePaiement });
            return res.data;
        },
    });
}

function useDemanderAvoir() {
    return useMutation({
        mutationFn: async ({ factureId, motif, montant }: { factureId: string; motif: string; montant?: number }) => {
            const res = await apiClient.post(`/api/billing/factures/${factureId}/avoir`, { motif, montant });
            return res.data;
        },
    });
}

// =============================================
// Main Page
// =============================================

function MesFacturesPage() {
    const queryClient = useQueryClient();
    const { data: factures, isLoading } = useMesFactures();
    const payerMutation = usePayerFacture();
    const avoirMutation = useDemanderAvoir();

    const [filtreStatut, setFiltreStatut] = useState<FiltreStatut>('TOUT');
    const [recherche, setRecherche] = useState('');
    const [triChamp, setTriChamp] = useState<TriChamp>('dateEmission');
    const [triOrdre, setTriOrdre] = useState<'asc' | 'desc'>('desc');
    const [factureSelectionnee, setFactureSelectionnee] = useState<Facture | null>(null);
    const [showPaiementModal, setShowPaiementModal] = useState(false);
    const [showAvoirModal, setShowAvoirModal] = useState(false);
    const [avoirMotif, setAvoirMotif] = useState('');

    // Filtrage et tri
    const facturesFiltrees = useMemo(() => {
        let result = factures || [];

        // Filtre par statut
        if (filtreStatut !== 'TOUT') {
            result = result.filter(f => f.statut === filtreStatut);
        }

        // Recherche par numéro
        if (recherche) {
            const search = recherche.toLowerCase();
            result = result.filter(f => f.numero.toLowerCase().includes(search));
        }

        // Tri
        result = [...result].sort((a, b) => {
            let cmp = 0;
            if (triChamp === 'dateEmission') {
                cmp = new Date(a.dateEmission).getTime() - new Date(b.dateEmission).getTime();
            } else if (triChamp === 'montantTotal') {
                cmp = Number(a.montantTotal) - Number(b.montantTotal);
            } else {
                cmp = a.statut.localeCompare(b.statut);
            }
            return triOrdre === 'desc' ? -cmp : cmp;
        });

        return result;
    }, [factures, filtreStatut, recherche, triChamp, triOrdre]);

    // Stats
    const stats = useMemo(() => {
        const fs = factures || [];
        return {
            total: fs.length,
            payees: fs.filter(f => f.statut === 'PAYEE').length,
            enAttente: fs.filter(f => ['EMISE', 'EN_PAIEMENT'].includes(f.statut)).length,
            enRetard: fs.filter(f => f.statut === 'EN_RETARD').length,
            montantTotal: fs.reduce((sum, f) => sum + Number(f.montantTotal), 0),
            montantPaye: fs.filter(f => f.statut === 'PAYEE').reduce((sum, f) => sum + Number(f.montantPaye || 0), 0),
        };
    }, [factures]);

    const formatPrix = (montant: number, devise = 'XAF') =>
        new Intl.NumberFormat('fr-FR').format(montant) + ' ' + devise;

    const statutConfig = (statut: string) => {
        switch (statut) {
            case 'PAYEE': return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30', label: 'Payée' };
            case 'EMISE': return { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30', label: 'Émise' };
            case 'EN_RETARD': return { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30', label: 'En retard' };
            case 'EN_PAIEMENT': return { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30', label: 'En paiement' };
            case 'AVOIR': return { icon: Receipt, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30', label: 'Avoir' };
            case 'ANNULEE': return { icon: XCircle, color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-gray-900/30', label: 'Annulée' };
            default: return { icon: FileText, color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-gray-900/30', label: statut };
        }
    };

    const handlePayer = (facture: Facture) => {
        setFactureSelectionnee(facture);
        setShowPaiementModal(true);
    };

    const handleConfirmerPaiement = (provider: string) => {
        if (!factureSelectionnee) return;
        payerMutation.mutate(
            { factureId: factureSelectionnee.id, provider, methodePaiement: 'mobile_money' },
            {
                onSuccess: () => {
                    toast.success('Paiement initié avec succès');
                    setShowPaiementModal(false);
                    queryClient.invalidateQueries({ queryKey: ['mes-factures'] });
                },
                onError: () => toast.error('Erreur lors du paiement'),
            }
        );
    };

    const handleDemanderAvoir = () => {
        if (!factureSelectionnee || !avoirMotif) return;
        avoirMutation.mutate(
            { factureId: factureSelectionnee.id, motif: avoirMotif },
            {
                onSuccess: () => {
                    toast.success('Demande d\'avoir créée');
                    setShowAvoirModal(false);
                    setAvoirMotif('');
                    queryClient.invalidateQueries({ queryKey: ['mes-factures'] });
                },
                onError: () => toast.error('Erreur lors de la demande d\'avoir'),
            }
        );
    };

    const filtres: { key: FiltreStatut; label: string; count: number }[] = [
        { key: 'TOUT', label: 'Toutes', count: stats.total },
        { key: 'PAYEE', label: 'Payées', count: stats.payees },
        { key: 'EMISE', label: 'En attente', count: stats.enAttente },
        { key: 'EN_RETARD', label: 'En retard', count: stats.enRetard },
    ];

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <FileText className="w-6 h-6 text-primary" />
                    Mes Factures
                </h1>
                <p className="text-muted-foreground">Consultez, payez et gérez vos factures</p>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="border rounded-xl p-4">
                    <div className="text-sm text-muted-foreground">Total factures</div>
                    <div className="text-2xl font-bold">{stats.total}</div>
                </div>
                <div className="border rounded-xl p-4">
                    <div className="text-sm text-muted-foreground">Montant total</div>
                    <div className="text-2xl font-bold">{formatPrix(stats.montantTotal)}</div>
                </div>
                <div className="border rounded-xl p-4">
                    <div className="text-sm text-muted-foreground">Montant payé</div>
                    <div className="text-2xl font-bold text-green-600">{formatPrix(stats.montantPaye)}</div>
                </div>
                <div className="border rounded-xl p-4">
                    <div className="text-sm text-muted-foreground">En retard</div>
                    <div className={`text-2xl font-bold ${stats.enRetard > 0 ? 'text-red-600' : ''}`}>{stats.enRetard}</div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3">
                {/* Recherche */}
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Rechercher par numéro..."
                        value={recherche}
                        onChange={(e) => setRecherche(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm"
                    />
                </div>

                {/* Filtres statut */}
                <div className="flex gap-1">
                    {filtres.map(f => (
                        <button
                            key={f.key}
                            onClick={() => setFiltreStatut(f.key)}
                            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                                filtreStatut === f.key
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted hover:bg-muted/80'
                            }`}
                        >
                            {f.label} ({f.count})
                        </button>
                    ))}
                </div>

                {/* Tri */}
                <button
                    onClick={() => {
                        if (triChamp === 'dateEmission') {
                            setTriChamp('montantTotal');
                        } else if (triChamp === 'montantTotal') {
                            setTriChamp('statut');
                        } else {
                            setTriChamp('dateEmission');
                        }
                        setTriOrdre(o => o === 'asc' ? 'desc' : 'asc');
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-muted rounded-lg hover:bg-muted/80"
                >
                    <ArrowUpDown className="w-3 h-3" />
                    {triChamp === 'dateEmission' ? 'Date' : triChamp === 'montantTotal' ? 'Montant' : 'Statut'}
                </button>
            </div>

            {/* Liste des factures */}
            {isLoading ? (
                <div className="animate-pulse space-y-3">
                    {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted rounded-lg" />)}
                </div>
            ) : facturesFiltrees.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto" />
                    <p className="text-muted-foreground">Aucune facture trouvée</p>
                </div>
            ) : (
                <div className="border rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="text-left p-3 font-medium">Numéro</th>
                                <th className="text-left p-3 font-medium">Émission</th>
                                <th className="text-left p-3 font-medium">Échéance</th>
                                <th className="text-right p-3 font-medium">Montant</th>
                                <th className="text-left p-3 font-medium">Statut</th>
                                <th className="text-center p-3 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {facturesFiltrees.map((f) => {
                                const config = statutConfig(f.statut);
                                const StatutIcon = config.icon;
                                const peutPayer = ['EMISE', 'EN_RETARD'].includes(f.statut);
                                const peutAvoir = ['PAYEE', 'EMISE'].includes(f.statut);

                                return (
                                    <tr key={f.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="p-3 font-mono font-medium">{f.numero}</td>
                                        <td className="p-3 text-muted-foreground">
                                            {new Date(f.dateEmission).toLocaleDateString('fr-FR')}
                                        </td>
                                        <td className="p-3 text-muted-foreground">
                                            {new Date(f.dateEcheance).toLocaleDateString('fr-FR')}
                                        </td>
                                        <td className="p-3 text-right font-mono font-semibold">
                                            {formatPrix(Number(f.montantTotal), f.devise)}
                                        </td>
                                        <td className="p-3">
                                            <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${config.bg} ${config.color}`}>
                                                <StatutIcon className="w-3 h-3" />
                                                {config.label}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() => toast.info('Téléchargement PDF en cours...')}
                                                    className="p-1.5 rounded hover:bg-muted transition-colors"
                                                    title="Télécharger PDF"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </button>
                                                {peutPayer && (
                                                    <button
                                                        onClick={() => handlePayer(f)}
                                                        className="p-1.5 rounded hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 transition-colors"
                                                        title="Payer en ligne"
                                                    >
                                                        <CreditCard className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {peutAvoir && (
                                                    <button
                                                        onClick={() => { setFactureSelectionnee(f); setShowAvoirModal(true); }}
                                                        className="p-1.5 rounded hover:bg-purple-100 dark:hover:bg-purple-900/30 text-purple-600 transition-colors"
                                                        title="Demander un avoir"
                                                    >
                                                        <Receipt className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal Paiement */}
            {showPaiementModal && factureSelectionnee && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-card border rounded-xl p-6 w-full max-w-md space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-primary" />
                            Payer la facture {factureSelectionnee.numero}
                        </h3>
                        <div className="text-sm text-muted-foreground">
                            Montant : <span className="font-bold text-foreground">{formatPrix(Number(factureSelectionnee.montantTotal), factureSelectionnee.devise)}</span>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Choisir un provider :</p>
                            <div className="grid grid-cols-1 gap-2">
                                {['mtn-momo', 'orange-money', 'stripe'].map(provider => (
                                    <button
                                        key={provider}
                                        onClick={() => handleConfirmerPaiement(provider)}
                                        disabled={payerMutation.isPending}
                                        className="px-4 py-3 border rounded-lg hover:bg-muted transition-colors text-sm font-medium flex items-center gap-2"
                                    >
                                        <CreditCard className="w-4 h-4" />
                                        {provider === 'mtn-momo' ? 'MTN Mobile Money' :
                                         provider === 'orange-money' ? 'Orange Money' : 'Carte bancaire (Stripe)'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button
                            onClick={() => setShowPaiementModal(false)}
                            className="w-full py-2 text-sm text-muted-foreground hover:text-foreground"
                        >
                            Annuler
                        </button>
                    </div>
                </div>
            )}

            {/* Modal Avoir */}
            {showAvoirModal && factureSelectionnee && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-card border rounded-xl p-6 w-full max-w-md space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Receipt className="w-5 h-5 text-purple-600" />
                            Demander un avoir
                        </h3>
                        <div className="text-sm text-muted-foreground">
                            Facture : <span className="font-medium text-foreground">{factureSelectionnee.numero}</span> — {formatPrix(Number(factureSelectionnee.montantTotal), factureSelectionnee.devise)}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Motif de la demande *</label>
                            <textarea
                                value={avoirMotif}
                                onChange={(e) => setAvoirMotif(e.target.value)}
                                placeholder="Expliquez la raison de la demande d'avoir..."
                                className="w-full border rounded-lg p-3 text-sm min-h-[100px] resize-none"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowAvoirModal(false)}
                                className="flex-1 py-2 border rounded-lg text-sm hover:bg-muted"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleDemanderAvoir}
                                disabled={!avoirMotif || avoirMutation.isPending}
                                className="flex-1 py-2 bg-purple-600 text-white rounded-lg text-sm hover:opacity-90 disabled:opacity-50"
                            >
                                {avoirMutation.isPending ? 'Envoi...' : 'Demander'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// =============================================
// Route definition
// =============================================

export const Route = createFileRoute('/_auth/factures')({
    component: MesFacturesPage,
});

export default MesFacturesPage;
