/**
 * ==================================
 * eLISAschool - Mon Abonnement (Client)
 * ==================================
 * Page établissement — abonnement actuel, factures, quotas, feature flags.
 * Phase 4.7 — Refonte SaaS
 * Phase K.1 — Enrichissement : upgrade/downgrade, graphique consommation,
 * historique des plans, simulateur intégré.
 */

import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useState } from 'react';
import { toast } from 'sonner';
import {
    CreditCard,
    FileText,
    BarChart3,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Download,
    Calendar,
    Users,
    Package,
    ArrowUpCircle,
    History,
    Sparkles,
} from 'lucide-react';
import { PlanSimulator } from '@/features/billing/components/plan-simulator';

// =============================================
// Types
// =============================================

interface Quota {
    typeQuota: string;
    utilisationActuelle: number;
    limiteMax: number;
    alerte80pourcent: boolean;
    bloquer: boolean;
}

interface Plan {
    id: string;
    nom: string;
    slug: string;
    prixBase: number;
    devise: string;
    maxEleves: number;
    modulesInclus: string[];
    badge?: string;
}

interface Abonnement {
    id: string;
    statut: string;
    montantMensuel: number;
    nombreElevesActuel: number;
    dateDebut: string;
    dateFin: string;
    cycleFacturation: string;
    autoRenouvellement: boolean;
    prochaineFacturation?: string;
    plan?: Plan;
    quotas?: Quota[];
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
}

// =============================================
// Hooks
// =============================================

function useMonAbonnement() {
    return useQuery<Abonnement | null | undefined>({
        queryKey: ['mon-abonnement'],
        queryFn: async () => {
            const res = await apiClient.get<Abonnement | null>('/api/billing/mon-abonnement');
            return res.data;
        },
    });
}

function useMesFactures() {
    return useQuery<Facture[] | undefined>({
        queryKey: ['mes-factures'],
        queryFn: async () => {
            const res = await apiClient.get<Facture[]>('/api/billing/mes-factures');
            return res.data;
        },
    });
}

function useFeatureFlags() {
    return useQuery<Record<string, boolean> | undefined>({
        queryKey: ['mes-feature-flags'],
        queryFn: async () => {
            const res = await apiClient.get<Record<string, boolean>>('/api/billing/feature-flags');
            return res.data;
        },
    });
}

// =============================================
// Main Page
// =============================================

type TabKey = 'abonnement' | 'factures' | 'quotas' | 'modules' | 'simulateur' | 'historique';

function MonAbonnementPage() {
    const [activeTab, setActiveTab] = useState<TabKey>('abonnement');

    const tabs: { key: TabKey; label: string; icon: typeof CreditCard }[] = [
        { key: 'abonnement', label: 'Mon abonnement', icon: Package },
        { key: 'factures', label: 'Factures', icon: FileText },
        { key: 'quotas', label: 'Quotas', icon: BarChart3 },
        { key: 'modules', label: 'Modules actifs', icon: CheckCircle },
        { key: 'simulateur', label: 'Simulateur', icon: Sparkles },
        { key: 'historique', label: 'Historique', icon: History },
    ];

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Mon Abonnement</h1>
                <p className="text-muted-foreground">Gérez votre abonnement, consultez vos factures et suivez vos quotas</p>
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

            {activeTab === 'abonnement' && <AbonnementTab />}
            {activeTab === 'factures' && <FacturesTab />}
            {activeTab === 'quotas' && <QuotasTab />}
            {activeTab === 'modules' && <ModulesTab />}
            {activeTab === 'simulateur' && <SimulateurTab />}
            {activeTab === 'historique' && <HistoriqueTab />}
        </div>
    );
}

// =============================================
// Abonnement Tab
// =============================================

function AbonnementTab() {
    const queryClient = useQueryClient();
    const { data: abonnement, isLoading } = useMonAbonnement();
    const { data: plansDisponibles } = useQuery<Plan[] | undefined>({
        queryKey: ['plans-catalogue'],
        queryFn: async () => {
            const res = await apiClient.get<Plan[]>('/api/billing/plans');
            return res.data;
        },
    });

    const upgradeMutation = useMutation({
        mutationFn: async (nouveauPlanId: string) => {
            const res = await apiClient.patch('/api/billing/abonnement/upgrade', { nouveauPlanId });
            return res.data;
        },
    });

    const handleUpgrade = (planId: string) => {
        upgradeMutation.mutate(planId, {
            onSuccess: () => {
                toast.success('Plan mis à jour avec succès');
                queryClient.invalidateQueries({ queryKey: ['mon-abonnement'] });
            },
            onError: () => toast.error('Erreur lors du changement de plan'),
        });
    };

    if (isLoading) return <div className="animate-pulse">Chargement...</div>;

    if (!abonnement) {
        return (
            <div className="text-center py-12 space-y-4">
                <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto" />
                <h2 className="text-lg font-semibold">Aucun abonnement actif</h2>
                <p className="text-muted-foreground">
                    Contactez l'administrateur de la plateforme pour souscrire un abonnement.
                </p>
            </div>
        );
    }

    const formatPrice = (price: number) => new Intl.NumberFormat('fr-FR').format(price);
    const joursRestants = Math.max(0, Math.ceil((new Date(abonnement.dateFin).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

    return (
        <div className="space-y-6">
            {/* Plan actuel */}
            <div className="border rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Package className="w-8 h-8 text-primary" />
                        <div>
                            <h2 className="text-xl font-bold">{abonnement.plan?.nom || 'Plan'}</h2>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                                abonnement.statut === 'ACTIF' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                                {abonnement.statut}
                            </span>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold">{formatPrice(Number(abonnement.montantMensuel))} XAF</div>
                        <div className="text-sm text-muted-foreground">/mois</div>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                    <div>
                        <div className="text-sm text-muted-foreground">Cycle</div>
                        <div className="font-medium">{abonnement.cycleFacturation === 'MENSUEL' ? 'Mensuel' : 'Annuel'}</div>
                    </div>
                    <div>
                        <div className="text-sm text-muted-foreground">Début</div>
                        <div className="font-medium">{new Date(abonnement.dateDebut).toLocaleDateString('fr-FR')}</div>
                    </div>
                    <div>
                        <div className="text-sm text-muted-foreground">Fin</div>
                        <div className="font-medium">{new Date(abonnement.dateFin).toLocaleDateString('fr-FR')}</div>
                    </div>
                    <div>
                        <div className="text-sm text-muted-foreground">Jours restants</div>
                        <div className={`font-medium ${joursRestants < 7 ? 'text-red-600' : ''}`}>
                            {joursRestants} jour{joursRestants !== 1 ? 's' : ''}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                    <span className="text-sm text-muted-foreground">Auto-renouvellement:</span>
                    {abonnement.autoRenouvellement ? (
                        <span className="flex items-center gap-1 text-green-600 text-sm">
                            <CheckCircle className="w-4 h-4" /> Activé
                        </span>
                    ) : (
                        <span className="flex items-center gap-1 text-gray-500 text-sm">
                            <XCircle className="w-4 h-4" /> Désactivé
                        </span>
                    )}
                </div>

                {abonnement.prochaineFacturation && (
                    <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Prochaine facturation:</span>
                        <span className="font-medium">{new Date(abonnement.prochaineFacturation).toLocaleDateString('fr-FR')}</span>
                    </div>
                )}
            </div>

            {/* Élèves */}
            <div className="border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                    <Users className="w-5 h-5 text-muted-foreground" />
                    <h3 className="font-semibold">Élèves inscrits</h3>
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">{abonnement.nombreElevesActuel}</span>
                    <span className="text-muted-foreground">/ {abonnement.plan?.maxEleves ?? '∞'} max</span>
                </div>
                {abonnement.plan && (
                    <div className="mt-2">
                        <div className="w-full bg-muted rounded-full h-2">
                            <div
                                className={`h-2 rounded-full ${
                                    abonnement.nombreElevesActuel / abonnement.plan.maxEleves > 0.8 ? 'bg-red-500' : 'bg-primary'
                                }`}
                                style={{ width: `${Math.min(100, (abonnement.nombreElevesActuel / abonnement.plan.maxEleves) * 100)}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Upgrade / Downgrade */}
            {plansDisponibles && plansDisponibles.length > 0 && (
                <div className="border rounded-xl p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <ArrowUpCircle className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold">Changer de plan</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {plansDisponibles
                            .filter(p => p.id !== abonnement.plan?.id)
                            .slice(0, 3)
                            .map(plan => (
                                <div key={plan.id} className="border rounded-lg p-4 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium">{plan.nom}</span>
                                        {plan.badge && (
                                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{plan.badge}</span>
                                        )}
                                    </div>
                                    <div className="text-lg font-bold">
                                        {new Intl.NumberFormat('fr-FR').format(plan.prixBase)} {plan.devise}/mois
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        Jusqu'à {plan.maxEleves} élèves
                                    </div>
                                    <button
                                        onClick={() => handleUpgrade(plan.id)}
                                        disabled={upgradeMutation.isPending}
                                        className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                                            plan.prixBase > (abonnement.plan?.prixBase || 0)
                                                ? 'bg-primary text-primary-foreground hover:opacity-90'
                                                : 'bg-muted hover:bg-muted/80'
                                        }`}
                                    >
                                        {plan.prixBase > (abonnement.plan?.prixBase || 0) ? 'Upgrader' : 'Downgrader'}
                                    </button>
                                </div>
                            ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// =============================================
// Factures Tab
// =============================================

function FacturesTab() {
    const { data: factures, isLoading } = useMesFactures();

    if (isLoading) return <div className="animate-pulse">Chargement...</div>;

    return (
        <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
                <thead className="bg-muted/50">
                    <tr>
                        <th className="text-left p-3 font-medium">Numéro</th>
                        <th className="text-left p-3 font-medium">Émission</th>
                        <th className="text-left p-3 font-medium">Échéance</th>
                        <th className="text-right p-3 font-medium">Montant</th>
                        <th className="text-left p-3 font-medium">Statut</th>
                        <th className="text-center p-3 font-medium">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {factures?.map((f) => (
                        <tr key={f.id} className="hover:bg-muted/30">
                            <td className="p-3 font-mono font-medium">{f.numero}</td>
                            <td className="p-3">{new Date(f.dateEmission).toLocaleDateString('fr-FR')}</td>
                            <td className="p-3">{new Date(f.dateEcheance).toLocaleDateString('fr-FR')}</td>
                            <td className="p-3 text-right font-mono">
                                {new Intl.NumberFormat('fr-FR').format(Number(f.montantTotal))} {f.devise}
                            </td>
                            <td className="p-3">
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                    f.statut === 'PAYEE' ? 'bg-green-100 text-green-700' :
                                    f.statut === 'EN_RETARD' ? 'bg-red-100 text-red-700' :
                                    'bg-blue-100 text-blue-700'
                                }`}>
                                    {f.statut}
                                </span>
                            </td>
                            <td className="p-3 text-center">
                                <button className="text-primary hover:underline text-sm flex items-center gap-1 mx-auto">
                                    <Download className="w-3 h-3" /> PDF
                                </button>
                            </td>
                        </tr>
                    ))}
                    {(!factures || factures.length === 0) && (
                        <tr>
                            <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                Aucune facture
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

// =============================================
// Quotas Tab
// =============================================

function QuotasTab() {
    const { data: abonnement } = useMonAbonnement();
    const quotas = abonnement?.quotas || [];

    if (quotas.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                Aucune information de quota disponible
            </div>
        );
    }

    const quotaLabels: Record<string, string> = {
        eleves: 'Élèves',
        utilisateurs: 'Utilisateurs',
        classes: 'Classes',
        stockage_go: 'Stockage (Go)',
        sms_mensuel: 'SMS / mois',
    };

    return (
        <div className="space-y-4">
            {quotas.map((q) => {
                const pourcentage = q.limiteMax > 0 ? (q.utilisationActuelle / q.limiteMax) * 100 : 0;
                const label = quotaLabels[q.typeQuota] || q.typeQuota;

                return (
                    <div key={q.typeQuota} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="font-medium">{label}</span>
                            <span className="text-sm text-muted-foreground">
                                {q.utilisationActuelle} / {q.limiteMax || '∞'}
                            </span>
                        </div>
                        {q.limiteMax > 0 && (
                            <>
                                <div className="w-full bg-muted rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full ${
                                            pourcentage >= 100 ? 'bg-red-500' :
                                            pourcentage >= 80 ? 'bg-yellow-500' :
                                            'bg-green-500'
                                        }`}
                                        style={{ width: `${Math.min(100, pourcentage)}%` }}
                                    />
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="text-muted-foreground">{pourcentage.toFixed(0)}%</span>
                                    {q.alerte80pourcent && (
                                        <span className="flex items-center gap-1 text-yellow-600">
                                            <AlertTriangle className="w-3 h-3" /> Alerte 80%
                                        </span>
                                    )}
                                    {q.bloquer && (
                                        <span className="flex items-center gap-1 text-red-600">
                                            <XCircle className="w-3 h-3" /> Bloqué
                                        </span>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// =============================================
// Modules Tab
// =============================================

// =============================================
// Simulateur Tab — Phase K.1
// =============================================

function SimulateurTab() {
    return <PlanSimulator />;
}

// =============================================
// Historique Tab — Phase K.1
// =============================================

interface HistoriqueEntry {
    id: string;
    planNom: string;
    statut: string;
    montantMensuel: number;
    dateDebut: string;
    dateFin: string;
    createdAt: string;
}

function HistoriqueTab() {
    const { data: historique, isLoading } = useQuery<HistoriqueEntry[] | undefined>({
        queryKey: ['historique-plans'],
        queryFn: async () => {
            const res = await apiClient.get<HistoriqueEntry[]>('/api/billing/historique-plans');
            return res.data;
        },
    });

    if (isLoading) return <div className="animate-pulse">Chargement...</div>;

    return (
        <div className="space-y-4">
            {!historique || historique.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                    <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    Aucun historique de plan
                </div>
            ) : (
                <div className="border rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="text-left p-3 font-medium">Plan</th>
                                <th className="text-left p-3 font-medium">Période</th>
                                <th className="text-right p-3 font-medium">Montant</th>
                                <th className="text-left p-3 font-medium">Statut</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {historique.map((entry) => (
                                <tr key={entry.id} className="hover:bg-muted/30">
                                    <td className="p-3 font-medium">{entry.planNom}</td>
                                    <td className="p-3 text-muted-foreground">
                                        {new Date(entry.dateDebut).toLocaleDateString('fr-FR')}
                                        {' → '}
                                        {entry.dateFin ? new Date(entry.dateFin).toLocaleDateString('fr-FR') : 'En cours'}
                                    </td>
                                    <td className="p-3 text-right font-mono">
                                        {new Intl.NumberFormat('fr-FR').format(Number(entry.montantMensuel))} XAF/mois
                                    </td>
                                    <td className="p-3">
                                        <span className={`text-xs px-2 py-1 rounded-full ${
                                            entry.statut === 'ACTIF' ? 'bg-green-100 text-green-700' :
                                            entry.statut === 'SUSPENDU' ? 'bg-red-100 text-red-700' :
                                            'bg-gray-100 text-gray-700'
                                        }`}>
                                            {entry.statut}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// =============================================
// Modules Tab
// =============================================

function ModulesTab() {
    const { data: flags, isLoading } = useFeatureFlags();

    if (isLoading) return <div className="animate-pulse">Chargement...</div>;

    const moduleFlags = flags ? Object.entries(flags).filter(([k]) => k.startsWith('module_')) : [];

    return (
        <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {moduleFlags.map(([flag, enabled]) => {
                    const moduleName = flag.replace('module_', '').replace(/_/g, ' ');
                    return (
                        <div key={flag} className={`border rounded-lg p-4 flex items-center justify-between ${
                            enabled ? 'border-green-200 bg-green-50/50' : 'border-gray-200 opacity-60'
                        }`}>
                            <span className="font-medium capitalize">{moduleName}</span>
                            {enabled ? (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                                <XCircle className="w-5 h-5 text-gray-400" />
                            )}
                        </div>
                    );
                })}
                {moduleFlags.length === 0 && (
                    <div className="col-span-full text-center text-muted-foreground py-8">
                        Aucun module actif
                    </div>
                )}
            </div>
        </div>
    );
}

// =============================================
// Route definition
// =============================================

export const Route = createFileRoute('/_auth/mon-abonnement')({
    component: MonAbonnementPage,
});

export default MonAbonnementPage;
