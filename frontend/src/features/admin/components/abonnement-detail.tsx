/**
 * ==================================
 * eLISAschool - Abonnement Detail
 * ==================================
 * 
 * Vue synthétique d'un abonnement : infos, historique paiements,
 * changements de plan, consommation, actions.
 * 
 * Phase P2.6 — Refonte SaaS v4
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import {
    CreditCard,
    FileText,
    Clock,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Pause,
    Play,
    ArrowUpCircle,
    BarChart3,
    Loader2,
    Download,
    X,
} from 'lucide-react';

// =============================================
// Types
// =============================================

interface AbonnementDetail {
    id: string;
    etablissementId: string;
    planId: string;
    statut: string;
    montantMensuel: number;
    nombreElevesActuel: number;
    dateDebut: string;
    dateFin: string;
    cycleFacturation: string;
    autoRenouvellement: boolean;
    plan?: {
        id: string;
        nom: string;
        prixBase: number;
        devise: string;
        maxEleves: number;
    };
    etablissement?: {
        id: string;
        nom: string;
        code: string;
    };
}


interface Facture {
    id: string;
    numero: string;
    montantTotal: number;
    statut: string;
    dateEmission: string;
    devise: string;
}

interface PlanDisponible {
    id: string;
    nom: string;
    prixBase: number;
    devise: string;
    maxEleves: number;
    description?: string;
}

interface AbonnementDetailProps {
    abonnementId: string;
    onClose?: () => void;
}

// =============================================
// Helpers
// =============================================

function statutColor(statut: string): string {
    switch (statut) {
        case 'ACTIF': return 'bg-[var(--color-success-100)] text-[var(--color-success-700)]';
        case 'SUSPENDU': return 'bg-[var(--color-warning-100)] text-[var(--color-warning-700)]';
        case 'EXPIRE': return 'bg-[var(--color-danger-100)] text-[var(--color-danger-700)]';
        case 'ANNULE': return 'bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]';
        case 'EN_ATTENTE': return 'bg-[var(--color-info-100)] text-[var(--color-info-700)]';
        default: return 'bg-[var(--color-surface-hover)] text-[var(--color-text-muted)]';
    }
}

function statutFactureColor(statut: string): string {
    switch (statut) {
        case 'PAYEE': return 'bg-[var(--color-success-100)] text-[var(--color-success-700)]';
        case 'EMISE': return 'bg-[var(--color-info-100)] text-[var(--color-info-700)]';
        case 'EN_RETARD': return 'bg-[var(--color-danger-100)] text-[var(--color-danger-700)]';
        case 'BROUILLON': return 'bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]';
        default: return 'bg-[var(--color-surface-hover)] text-[var(--color-text-muted)]';
    }
}

function formatMontant(montant: number, devise: string = 'XAF'): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: devise, minimumFractionDigits: 0 }).format(montant);
}

// =============================================
// Component
// =============================================

export function AbonnementDetail({ abonnementId, onClose }: AbonnementDetailProps) {
    const { t } = useTranslation('admin');
    const queryClient = useQueryClient();
    const [activeSection, setActiveSection] = useState<'info' | 'paiements' | 'factures' | 'actions'>('info');
    const [showChangerPlan, setShowChangerPlan] = useState(false);
    const [showResilier, setShowResilier] = useState(false);
    const [motifResiliation, setMotifResiliation] = useState('');

    // Fetch abonnement detail
    const { data: abo, isLoading } = useQuery<AbonnementDetail | null>({
        queryKey: ['abonnement-detail', abonnementId],
        queryFn: async () => {
            const res = await apiClient.get<AbonnementDetail[]>('/api/platform/facturation/abonnements');
            const found = (res.data ?? []).find((a) => a.id === abonnementId);
            return found ?? null;
        },
    });

    // Fetch factures
    const { data: factures } = useQuery<Facture[] | undefined>({
        queryKey: ['abonnement-factures', abonnementId],
        queryFn: async () => {
            const res = await apiClient.get<Facture[]>(
                `/api/platform/facturation/factures?abonnementId=${abonnementId}`
            );
            return res.data;
        },
    });

    // Fetch plans disponibles (pour modal changement de plan)
    const { data: plansDisponibles } = useQuery<PlanDisponible[]>({
        queryKey: ['plans-disponibles'],
        queryFn: async () => {
            const res = await apiClient.get<PlanDisponible[]>('/api/platform/facturation/plans');
            return (res.data ?? []).filter((p: any) => p.actif !== false && p.statut === 'ACTIF');
        },
    });

    // Mutations
    const suspendreMutation = useMutation({
        mutationFn: () => apiClient.put(`/api/platform/facturation/abonnements/${abonnementId}/suspendre`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['abonnement-detail'] });
            queryClient.invalidateQueries({ queryKey: ['platform-abonnements'] });
        },
    });

    const reactiverMutation = useMutation({
        mutationFn: () => apiClient.put(`/api/platform/facturation/abonnements/${abonnementId}/reactiver`, {}),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['abonnement-detail'] });
            queryClient.invalidateQueries({ queryKey: ['platform-abonnements'] });
        },
    });

    const upgradeMutation = useMutation({
        mutationFn: (nouveauPlanId: string) =>
            apiClient.put(`/api/platform/facturation/abonnements/${abonnementId}/upgrade`, { nouveauPlanId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['abonnement-detail'] });
            queryClient.invalidateQueries({ queryKey: ['platform-abonnements'] });
            setShowChangerPlan(false);
        },
    });

    const resilierMutation = useMutation({
        mutationFn: (motif: string) =>
            apiClient.put(`/api/platform/facturation/abonnements/${abonnementId}/resilier`, { motif }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['abonnement-detail'] });
            queryClient.invalidateQueries({ queryKey: ['platform-abonnements'] });
            setShowResilier(false);
            setMotifResiliation('');
        },
    });

    const handleExportPDF = async () => {
        if (!factures?.length) return;
        // Export la première facture émise/payée
        const factureExport = factures.find(f => f.statut === 'PAYEE' || f.statut === 'EMISE');
        if (!factureExport) return;

        try {
            const res = await apiClient.get<any>(
                `/api/platform/facturation/factures/${factureExport.id}/pdf-data`
            );
            // Trigger download or open in new tab
            const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `facture-${factureExport.numero}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Export PDF error:', err);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-4 animate-pulse">
                <div className="h-32 border rounded-lg bg-[var(--color-surface-hover)]" style={{ opacity: 0.3 }} />
                <div className="h-48 border rounded-lg bg-[var(--color-surface-hover)]" style={{ opacity: 0.3 }} />
            </div>
        );
    }

    if (!abo) {
        return (
            <div className="text-center py-12 text-[var(--color-texte-muted)]">
                <XCircle className="w-8 h-8 mx-auto mb-2" />
                Abonnement introuvable
            </div>
        );
    }

    const isActif = abo.statut === 'ACTIF';
    const isSuspendu = abo.statut === 'SUSPENDU';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        {abo.etablissement?.nom || abo.etablissementId.slice(0, 8)}
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statutColor(abo.statut)}`}>
                            {abo.statut}
                        </span>
                    </h3>
                    <p className="text-sm text-[var(--color-texte-muted)]">
                        Plan: {abo.plan?.nom || '-'} • {abo.cycleFacturation}
                    </p>
                </div>
                {onClose && (
                    <button onClick={onClose} className="text-sm text-[var(--color-texte-muted)] hover:text-[var(--color-texte)]">
                        {t('common:fermer', 'Fermer')}
                    </button>
                )}
            </div>

            {/* Info cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="border rounded-lg p-3 space-y-1">
                    {t('abonnement.montantMois')}
                    <div className="text-lg font-bold">{formatMontant(Number(abo.montantMensuel), abo.plan?.devise)}</div>
                </div>
                <div className="border rounded-lg p-3 space-y-1">
                    <span className="text-xs text-[var(--color-texte-muted)]">{t('abonnement.elevesActuels')}</span>
                    <div className="text-lg font-bold">{abo.nombreElevesActuel} / {abo.plan?.maxEleves || '∞'}</div>
                </div>
                <div className="border rounded-lg p-3 space-y-1">
                    <span className="text-xs text-[var(--color-texte-muted)]">{t('abonnement.debut')}</span>
                    <div className="text-sm font-medium">{new Date(abo.dateDebut).toLocaleDateString('fr-FR')}</div>
                </div>
                <div className="border rounded-lg p-3 space-y-1">
                    <span className="text-xs text-[var(--color-texte-muted)]">{t('abonnement.fin')}</span>
                    <div className="text-sm font-medium">{new Date(abo.dateFin).toLocaleDateString('fr-FR')}</div>
                    <div className="flex items-center gap-1 text-xs">
                        {abo.autoRenouvellement ? (
                            <span className="text-[var(--color-success-600)] flex items-center gap-0.5">
                                <CheckCircle2 className="w-3 h-3" /> {t('abonnement.autoRenouvellement')}
                            </span>
                        ) : (
                            <span className="text-[var(--color-text-muted)]">{t('abonnement.pasAutoRenouvellement')}</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Section tabs */}
            <div className="flex gap-1 border-b">
                {[
                    { key: 'info', label: t('abonnement.onglets.infos'), icon: BarChart3 },
                    { key: 'factures', label: t('abonnement.onglets.factures'), icon: FileText },
                    { key: 'actions', label: t('abonnement.onglets.actions'), icon: CreditCard },
                ].map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveSection(tab.key as any)}
                            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 text-sm transition-colors ${
                                activeSection === tab.key
                                    ? 'font-medium'
                                    : 'border-transparent text-[var(--color-texte-muted)] hover:text-[var(--color-texte)]'
                            }`}
                            style={activeSection === tab.key ? { borderColor: 'var(--color-dominant-600)', color: 'var(--color-dominant-600)' } : undefined}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Section content */}
            {activeSection === 'info' && (
                <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                        <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {t('abonnement.details.titre')}
                        </h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div><span className="text-[var(--color-texte-muted)]">{t('abonnement.details.id')}</span> <span className="font-mono text-xs">{abo.id}</span></div>
                            <div><span className="text-[var(--color-texte-muted)]">{t('abonnement.details.etablissementId')}</span> <span className="font-mono text-xs">{abo.etablissementId}</span></div>
                            <div><span className="text-[var(--color-texte-muted)]">{t('abonnement.details.planId')}</span> <span className="font-mono text-xs">{abo.planId}</span></div>
                            <div><span className="text-[var(--color-texte-muted)]">{t('abonnement.details.cycle')}</span> {abo.cycleFacturation}</div>
                        </div>
                    </div>
                </div>
            )}

            {activeSection === 'factures' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-[var(--color-texte-muted)]">{t('abonnement.factures.nombre', { count: factures?.length || 0 })}</span>
                        <button
                            onClick={handleExportPDF}
                            disabled={!factures?.length}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm border rounded-lg hover:bg-[var(--color-surface-hover)] disabled:opacity-50"
                        >
                            <Download className="w-4 h-4" />
                            {t('abonnement.factures.exportPdf')}
                        </button>
                    </div>
                    {factures && factures.length > 0 ? (
                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-[var(--color-surface-hover)]">
                                    <tr>
                                        <th className="text-left p-3 font-medium">{t('abonnement.factures.numero')}</th>
                                        <th className="text-left p-3 font-medium">{t('abonnement.factures.date')}</th>
                                        <th className="text-right p-3 font-medium">{t('abonnement.factures.montant')}</th>
                                        <th className="text-left p-3 font-medium">{t('abonnement.factures.statut')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {factures.map(f => (
                                        <tr key={f.id} className="hover:bg-[var(--color-surface-hover)]">
                                            <td className="p-3 font-mono">{f.numero}</td>
                                            <td className="p-3">{new Date(f.dateEmission).toLocaleDateString('fr-FR')}</td>
                                            <td className="p-3 text-right font-mono">{formatMontant(Number(f.montantTotal), f.devise)}</td>
                                            <td className="p-3">
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${statutFactureColor(f.statut)}`}>
                                                    {f.statut}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-6 text-[var(--color-texte-muted)] text-sm border border-dashed rounded-lg">
                            {t('abonnement.factures.aucune')}
                        </div>
                    )}
                </div>
            )}

            {activeSection === 'actions' && (
                <div className="space-y-4">
                    <div className="grid gap-3 md:grid-cols-2">
                        {isActif && (
                            <button
                                onClick={() => suspendreMutation.mutate()}
                                disabled={suspendreMutation.isPending}
                                className="flex items-center justify-center gap-2 p-[var(--space-md)] border border-[var(--color-warning-200)] rounded-[var(--radius-lg)] text-[var(--color-warning-700)] hover:bg-[var(--color-warning-50)] transition-colors"
                            >
                                {suspendreMutation.isPending ? <Loader2 className="h-[var(--icon-md)] w-[var(--icon-md)] animate-spin" /> : <Pause className="h-[var(--icon-md)] w-[var(--icon-md)]" />}
                                <div className="text-left">
                                    <div className="font-medium" style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.875rem)' }}>{t('abonnement.actions.suspendre')}</div>
                                    <div className="text-[var(--color-warning-600)]" style={{ fontSize: 'clamp(0.6875rem, 0.6rem + 0.3vw, 0.75rem)' }}>{t('abonnement.actions.suspendreDesc')}</div>
                                </div>
                            </button>
                        )}
                        {isSuspendu && (
                            <button
                                onClick={() => reactiverMutation.mutate()}
                                disabled={reactiverMutation.isPending}
                                className="flex items-center justify-center gap-2 p-[var(--space-md)] border border-[var(--color-success-200)] rounded-[var(--radius-lg)] text-[var(--color-success-700)] hover:bg-[var(--color-success-50)] transition-colors"
                            >
                                {reactiverMutation.isPending ? <Loader2 className="h-[var(--icon-md)] w-[var(--icon-md)] animate-spin" /> : <Play className="h-[var(--icon-md)] w-[var(--icon-md)]" />}
                                <div className="text-left">
                                    <div className="font-medium" style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.875rem)' }}>{t('abonnement.actions.reactiver')}</div>
                                    <div className="text-[var(--color-success-600)]" style={{ fontSize: 'clamp(0.6875rem, 0.6rem + 0.3vw, 0.75rem)' }}>{t('abonnement.actions.reactiverDesc')}</div>
                                </div>
                            </button>
                        )}
                        <button
                            onClick={() => setShowChangerPlan(true)}
                            disabled={!abo || abo.statut === 'ANNULE'}
                            className="flex items-center justify-center gap-2 p-[var(--space-md)] border border-[var(--color-info-200)] rounded-[var(--radius-lg)] text-[var(--color-info-700)] hover:bg-[var(--color-info-50)] transition-colors disabled:opacity-50"
                        >
                            <ArrowUpCircle className="h-[var(--icon-md)] w-[var(--icon-md)]" />
                            <div className="text-left">
                                <div className="font-medium" style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.875rem)' }}>{t('abonnement.actions.changerPlan')}</div>
                                <div className="text-[var(--color-info-600)]" style={{ fontSize: 'clamp(0.6875rem, 0.6rem + 0.3vw, 0.75rem)' }}>{t('abonnement.actions.changerPlanDesc')}</div>
                            </div>
                        </button>
                        <button
                            onClick={handleExportPDF}
                            disabled={!factures?.length}
                            className="flex items-center justify-center gap-2 p-4 border rounded-lg text-[var(--color-texte-muted)] hover:bg-[var(--color-surface-hover)] transition-colors disabled:opacity-50"
                        >
                            <Download className="h-[var(--icon-md)] w-[var(--icon-md)]" />
                            <div className="text-left">
                                <div className="font-medium" style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.875rem)' }}>{t('abonnement.actions.genererFacture')}</div>
                                <div className="text-[var(--color-text-muted)]" style={{ fontSize: 'clamp(0.6875rem, 0.6rem + 0.3vw, 0.75rem)' }}>{t('abonnement.actions.genererFactureDesc')}</div>
                            </div>
                        </button>
                    </div>

                    {/* Danger zone */}
                    <div className="border border-[var(--color-danger-200)] rounded-[var(--radius-lg)] space-y-[var(--space-sm)]" style={{ padding: 'var(--space-md)' }}>
                        <h4 className="font-semibold text-[var(--color-danger-700)] flex items-center gap-[var(--gap-xs)]" style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)' }}>
                            <AlertTriangle className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />
                            {t('abonnement.actions.zoneDanger')}
                        </h4>
                        <p className="text-[var(--color-text-muted)]" style={{ fontSize: 'clamp(0.6875rem, 0.6rem + 0.3vw, 0.75rem)' }}>
                            {t('abonnement.actions.zoneDangerDesc')}
                        </p>
                        <button
                            onClick={() => setShowResilier(true)}
                            disabled={abo?.statut === 'ANNULE' || resilierMutation.isPending}
                            className="px-[var(--space-md)] py-[var(--space-sm)] bg-[var(--color-danger-600)] text-white rounded-[var(--radius-md)] hover:bg-[var(--color-danger-700)] transition-colors disabled:opacity-50"
                            style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.875rem)' }}
                        >
                            {resilierMutation.isPending ? (
                                <Loader2 className="h-[var(--icon-md)] w-[var(--icon-md)] animate-spin inline mr-2" />
                            ) : null}
                            {t('abonnement.actions.resilier')}
                        </button>
                    </div>
                </div>
            )}
            {/* Modal Changement de plan */}
            {showChangerPlan && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowChangerPlan(false)}>
                    <div
                        className="bg-[var(--color-surface)] border border-[var(--color-bordure)] rounded-[var(--radius-xl)] shadow-2xl w-full max-w-lg mx-4"
                        style={{ maxHeight: 'clamp(300px, 80vh, 600px)' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-[var(--color-bordure)]" style={{ padding: 'var(--space-md)' }}>
                            <h3 className="font-semibold flex items-center gap-2" style={{ fontSize: 'clamp(0.9375rem, 0.85rem + 0.3vw, 1.125rem)' }}>
                                <ArrowUpCircle className="h-[var(--icon-md)] w-[var(--icon-md)] text-[var(--color-info-600)]" />
                                {t('abonnement.actions.changerPlan')}
                            </h3>
                            <button onClick={() => setShowChangerPlan(false)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
                                <X className="h-[var(--icon-md)] w-[var(--icon-md)]" />
                            </button>
                        </div>
                        {/* Body */}
                        <div className="overflow-y-auto space-y-2" style={{ padding: 'var(--space-md)' }}>
                            <p className="text-sm text-[var(--color-text-muted)] mb-3">
                                {t('abonnement.changerPlan.description')}
                            </p>
                            {plansDisponibles?.filter(p => p.id !== abo?.planId).map(plan => (
                                <button
                                    key={plan.id}
                                    onClick={() => upgradeMutation.mutate(plan.id)}
                                    disabled={upgradeMutation.isPending}
                                    className="w-full flex items-center justify-between border border-[var(--color-bordure)] rounded-[var(--radius-lg)] hover:border-[var(--color-info-400)] hover:bg-[var(--color-info-50)] transition-colors text-left"
                                    style={{ padding: 'var(--space-md)' }}
                                >
                                    <div>
                                        <div className="font-medium" style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)' }}>{plan.nom}</div>
                                        <div className="text-xs text-[var(--color-text-muted)]">
                                            {plan.maxEleves > 0 ? `${plan.maxEleves} élèves max` : 'Élèves illimités'}
                                            {plan.description ? ` — ${plan.description}` : ''}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-semibold text-[var(--color-info-700)]" style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)' }}>
                                            {formatMontant(Number(plan.prixBase), plan.devise || 'XAF')}
                                        </div>
                                        <div className="text-xs text-[var(--color-text-muted)]">/mois</div>
                                    </div>
                                </button>
                            ))}
                            {upgradeMutation.isPending && (
                                <div className="flex items-center gap-2 text-sm text-[var(--color-info-600)] justify-center py-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    {t('abonnement.changerPlan.enCours')}
                                </div>
                            )}
                            {upgradeMutation.isSuccess && (
                                <div className="flex items-center gap-2 text-sm text-[var(--color-success-600)] justify-center py-2">
                                    <CheckCircle2 className="h-4 w-4" />
                                    {t('abonnement.changerPlan.succes')}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Résiliation */}
            {showResilier && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowResilier(false)}>
                    <div
                        className="bg-[var(--color-surface)] border border-[var(--color-bordure)] rounded-[var(--radius-xl)] shadow-2xl w-full max-w-md mx-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-[var(--color-bordure)]" style={{ padding: 'var(--space-md)' }}>
                            <h3 className="font-semibold text-[var(--color-danger-700)] flex items-center gap-2" style={{ fontSize: 'clamp(0.9375rem, 0.85rem + 0.3vw, 1.125rem)' }}>
                                <AlertTriangle className="h-[var(--icon-md)] w-[var(--icon-md)]" />
                                {t('abonnement.actions.resilier')}
                            </h3>
                            <button onClick={() => setShowResilier(false)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
                                <X className="h-[var(--icon-md)] w-[var(--icon-md)]" />
                            </button>
                        </div>
                        {/* Body */}
                        <div className="space-y-4" style={{ padding: 'var(--space-md)' }}>
                            <p className="text-sm text-[var(--color-text-muted)]">
                                {t('abonnement.resilier.confirmation')}
                            </p>
                            <div className="border border-[var(--color-danger-200)] rounded-[var(--radius-md)] bg-[var(--color-danger-50)]" style={{ padding: 'var(--space-sm)' }}>
                                <p className="text-xs text-[var(--color-danger-700)]">
                                    {t('abonnement.resilier.irreversible')}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1" style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}>
                                    {t('abonnement.resilier.motif')}
                                </label>
                                <textarea
                                    value={motifResiliation}
                                    onChange={(e) => setMotifResiliation(e.target.value)}
                                    className="w-full border border-[var(--color-bordure)] rounded-[var(--radius-md)] bg-[var(--color-surface)] text-sm"
                                    style={{ padding: 'var(--space-sm)', minHeight: '80px', fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}
                                    placeholder={t('abonnement.resilier.motifPlaceholder')}
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => { setShowResilier(false); setMotifResiliation(''); }}
                                    className="px-4 py-2 text-sm border border-[var(--color-bordure)] rounded-[var(--radius-md)] hover:bg-[var(--color-surface-hover)] transition-colors"
                                >
                                    {t('common:annuler', 'Annuler')}
                                </button>
                                <button
                                    onClick={() => resilierMutation.mutate(motifResiliation)}
                                    disabled={resilierMutation.isPending}
                                    className="px-4 py-2 text-sm bg-[var(--color-danger-600)] text-white rounded-[var(--radius-md)] hover:bg-[var(--color-danger-700)] transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {resilierMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                                    {t('abonnement.actions.resilier')}
                                </button>
                            </div>
                            {resilierMutation.isSuccess && (
                                <div className="flex items-center gap-2 text-sm text-[var(--color-success-600)] justify-center py-2">
                                    <CheckCircle2 className="h-4 w-4" />
                                    {t('abonnement.resilier.succes')}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AbonnementDetail;
