/**
 * ==================================
 * eLISAschool - Platform Facturation
 * ==================================
 * Page facturation plateforme — Plans, Abonnements, Factures, Modules, Feature Flags
 * Phase 4.6 — Refonte SaaS
 * Phase v6 — Migration CSS vars + i18n complet
 */

import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@shared/types/api.types';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PlanFormModal } from '@/features/admin/components/plan-form-modal';
import { UsageMetersDashboard } from '@/features/admin/components/usage-meters-dashboard';
import { RevenusDashboard } from '@/features/admin/components/revenus-dashboard';
import { AbonnementDetail } from '@/features/admin/components/abonnement-detail';
import { ConfirmAction } from '@/features/admin/components/ui-platform';
import GroupesSaaSPage from '@/features/admin/components/groupes-saas-page';
import {
    CreditCard,
    Package,
    FileText,
    Users,
    ToggleLeft,
    Plus,
    Edit2,
    CheckCircle,
    XCircle,
    BarChart3,
    Layers,
    Trash2,
    X,
    Save,
} from 'lucide-react';

// =============================================
// Types
// =============================================

interface Plan {
    id: string;
    nom: string;
    slug: string;
    description?: string;
    prixBase: number;
    devise: string;
    maxEleves: number;
    maxUtilisateurs: number;
    maxClasses: number;
    modulesInclus: string[];
    statut: string;
    actif: boolean;
    badge?: string;
    tranches?: Tranche[];
}

interface Tranche {
    id: string;
    minEleves: number;
    maxEleves: number | null;
    montantSupplementaire: number;
    label?: string;
}

interface Abonnement {
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
    plan?: Plan;
    etablissement?: { id: string; nom: string; code: string };
}

interface Facture {
    id: string;
    numero: string;
    etablissementId: string;
    dateEmission: string;
    dateEcheance: string;
    montantTotal: number;
    montantPaye: number;
    statut: string;
    devise: string;
}

interface ModuleOptionnel {
    id: string;
    nom: string;
    slug: string;
    description?: string | null;
    prixMensuel: number;
    prixAnnuel: number;
    actif: boolean;
}

// =============================================
// Data fetching hooks
// =============================================

function usePlans() {
    return useQuery<Plan[]>({
        queryKey: ['platform-plans'],
        queryFn: async () => {
            const res = await apiClient.get<Plan[]>('/api/platform/facturation/plans');
            return res.data ?? [];
        },
    });
}

function useAbonnements() {
    return useQuery<{ data: Abonnement[]; total: number }>({
        queryKey: ['platform-abonnements'],
        queryFn: async () => {
            const res = (await apiClient.get<Abonnement[]>('/api/platform/facturation/abonnements')) as ApiResponse<Abonnement[]> & { total?: number };
            return { data: res.data ?? [], total: res.total ?? res.data?.length ?? 0 };
        },
    });
}

function useFactures() {
    return useQuery<{ data: Facture[]; total: number }>({
        queryKey: ['platform-factures'],
        queryFn: async () => {
            const res = (await apiClient.get<Facture[]>('/api/platform/facturation/factures')) as ApiResponse<Facture[]> & { total?: number };
            return { data: res.data ?? [], total: res.total ?? res.data?.length ?? 0 };
        },
    });
}

// =============================================
// Main Page
// =============================================

type TabKey = 'plans' | 'abonnements' | 'factures' | 'modules' | 'flags' | 'usage' | 'revenus' | 'groupes';

function PlatformFacturationPage() {
    const { t } = useTranslation('admin');
    const [activeTab, setActiveTab] = useState<TabKey>('plans');
    const [selectedAboId, setSelectedAboId] = useState<string | null>(null);

    const tabs: { key: TabKey; label: string; icon: typeof CreditCard }[] = [
        { key: 'plans', label: t('facturation.onglets.plans'), icon: Package },
        { key: 'abonnements', label: t('facturation.onglets.abonnements'), icon: Users },
        { key: 'factures', label: t('facturation.onglets.factures'), icon: FileText },
        { key: 'usage', label: t('facturation.onglets.usage'), icon: BarChart3 },
        { key: 'revenus', label: t('facturation.onglets.revenus'), icon: BarChart3 },
        { key: 'modules', label: t('facturation.onglets.modules'), icon: CreditCard },
        { key: 'flags', label: t('facturation.onglets.flags'), icon: ToggleLeft },
        { key: 'groupes', label: t('facturation.onglets.groupes'), icon: Layers },
    ];

    return (
        <div className="p-[var(--space-lg)] space-y-[var(--space-lg)]">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-bold text-[var(--color-texte)]" style={{ fontSize: 'clamp(1.25rem, 1.1rem + 0.5vw, 1.5rem)' }}>{t('facturation.pageTitre')}</h1>
                    <p style={{ fontSize: 'clamp(0.75rem, 0.68rem + 0.25vw, 0.875rem)', color: 'var(--color-texte-muted)' }}>{t('facturation.pageSousTitre')}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-[var(--gap-xs)] border-b border-[var(--color-bordure)]">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.key;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-[var(--gap-sm)] px-[var(--space-md)] py-[var(--space-sm)] border-b-2 transition-colors ${
                                isActive
                                    ? 'font-medium'
                                    : 'border-transparent hover:text-[var(--color-texte)]'
                            }`}
                            style={{
                                borderColor: isActive ? 'var(--color-dominant-600)' : undefined,
                                color: isActive ? 'var(--color-dominant-600)' : 'var(--color-texte-muted)',
                                fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.875rem)',
                            }}
                        >
                            <Icon className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            {activeTab === 'plans' && <PlansTab />}
            {activeTab === 'abonnements' && (
                selectedAboId ? (
                    <div className="space-y-[var(--space-md)]">
                        <button
                            onClick={() => setSelectedAboId(null)}
                            className="hover:underline"
                            style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.875rem)', color: 'var(--color-dominant-600)' }}
                        >
                            {t('facturation.abonnements.retour')}
                        </button>
                        <AbonnementDetail abonnementId={selectedAboId} onClose={() => setSelectedAboId(null)} />
                    </div>
                ) : (
                    <AbonnementsTab onSelectAbo={setSelectedAboId} />
                )
            )}
            {activeTab === 'factures' && <FacturesTab />}
            {activeTab === 'usage' && <UsageMetersDashboard />}
            {activeTab === 'revenus' && <RevenusDashboard />}
            {activeTab === 'modules' && <ModulesTab />}
            {activeTab === 'flags' && <FlagsTab />}
            {activeTab === 'groupes' && <GroupesSaaSPage />}
        </div>
    );
}

// =============================================
// Plans Tab
// =============================================

function PlansTab() {
    const { t } = useTranslation('admin');
    const { data: plans, isLoading } = usePlans();
    const [modalOpen, setModalOpen] = useState(false);
    const [editPlan, setEditPlan] = useState<Plan | undefined>(undefined);

    const formatPrice = (price: number, devise: string = 'XAF') => {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: devise, minimumFractionDigits: 0 }).format(price);
    };

    const handleEdit = (plan: Plan) => {
        setEditPlan(plan);
        setModalOpen(true);
    };

    const handleCreate = () => {
        setEditPlan(undefined);
        setModalOpen(true);
    };

    if (isLoading) return <div className="animate-pulse text-[var(--color-texte-muted)]">{t('facturation.chargement')}</div>;

    return (
        <div className="space-y-[var(--space-md)]">
            <div className="flex justify-end">
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-[var(--gap-sm)] px-[var(--space-md)] py-[var(--space-sm)] rounded-lg hover:opacity-90"
                    style={{ backgroundColor: 'var(--color-dominant-600)', color: '#fff' }}
                >
                    <Plus className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />
                    {t('facturation.plans.nouveau')}
                </button>
            </div>

            <div className="grid gap-[var(--gap-md)] md:grid-cols-2 lg:grid-cols-3">
                {plans?.map((plan) => (
                    <div key={plan.id} className="border border-[var(--color-bordure)] rounded-xl p-[var(--space-lg)] space-y-[var(--space-md)] relative bg-[var(--color-surface)]">
                        {plan.badge && (
                            <span
                                className="absolute top-3 right-3 text-xs px-2 py-1 rounded-full"
                                style={{ backgroundColor: 'color-mix(in srgb, var(--color-dominant-600) 10%, transparent)', color: 'var(--color-dominant-600)' }}
                            >
                                {plan.badge}
                            </span>
                        )}
                        <div>
                            <h3 className="font-semibold text-[var(--color-texte)]" style={{ fontSize: 'clamp(1rem, 0.9rem + 0.4vw, 1.125rem)' }}>{plan.nom}</h3>
                            <p style={{ fontSize: 'clamp(0.75rem, 0.68rem + 0.25vw, 0.875rem)' }} className="text-[var(--color-texte-muted)]">{plan.description}</p>
                        </div>
                        <div className="font-bold text-[var(--color-texte)]" style={{ fontSize: 'clamp(1.5rem, 1.2rem + 1vw, 1.875rem)' }}>
                            {formatPrice(Number(plan.prixBase), plan.devise)}
                            <span className="font-normal text-[var(--color-texte-muted)]" style={{ fontSize: 'clamp(0.75rem, 0.68rem + 0.25vw, 0.875rem)' }}>{t('facturation.plans.parMois')}</span>
                        </div>
                        <div className="space-y-[var(--space-xs)]" style={{ fontSize: 'clamp(0.75rem, 0.68rem + 0.25vw, 0.875rem)' }}>
                            <div className="flex justify-between">
                                <span className="text-[var(--color-texte-muted)]">{t('facturation.plans.elevesMax')}</span>
                                <span className="font-medium text-[var(--color-texte)]">{plan.maxEleves}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[var(--color-texte-muted)]">{t('facturation.plans.utilisateursMax')}</span>
                                <span className="font-medium text-[var(--color-texte)]">{plan.maxUtilisateurs || t('facturation.plans.illimite')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[var(--color-texte-muted)]">{t('facturation.plans.classesMax')}</span>
                                <span className="font-medium text-[var(--color-texte)]">{plan.maxClasses || t('facturation.plans.illimite')}</span>
                            </div>
                            {plan.modulesInclus?.length > 0 && (
                                <div className="pt-2 border-t border-[var(--color-bordure)]">
                                    <span className="text-[var(--color-texte-muted)]">{t('facturation.plans.modulesInclus')}</span>
                                    <div className="flex flex-wrap gap-[var(--gap-xs)] mt-1">
                                        {plan.modulesInclus.map((m) => (
                                            <span key={m} className="text-xs px-2 py-0.5 rounded bg-[var(--color-secondary-100)] text-[var(--color-texte)]">{m}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        {plan.tranches && plan.tranches.length > 0 && (
                            <div className="pt-2 border-t border-[var(--color-bordure)]">
                                <span className="text-xs text-[var(--color-texte-muted)]">{t('facturation.plans.tranchesSupp')}</span>
                                {plan.tranches.map((t) => (
                                    <div key={t.id} className="text-xs flex justify-between mt-1">
                                        <span>{t.label || `${t.minEleves + 1}-${t.maxEleves || '∞'}`}</span>
                                        <span>+{formatPrice(Number(t.montantSupplementaire))}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="flex items-center gap-[var(--gap-sm)]">
                            <span
                                className="inline-flex items-center gap-[var(--gap-xs)] text-xs px-2 py-1 rounded-full"
                                style={{
                                    backgroundColor: plan.actif ? 'var(--color-success-100)' : 'var(--color-danger-100)',
                                    color: plan.actif ? 'var(--color-success-700)' : 'var(--color-danger-700)',
                                }}
                            >
                                {plan.actif ? <CheckCircle className="h-[var(--icon-xs)] w-[var(--icon-xs)]" /> : <XCircle className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />}
                                {plan.actif ? t('facturation.plans.actif') : t('facturation.plans.inactif')}
                            </span>
                            <button
                                onClick={() => handleEdit(plan)}
                                className="ml-auto p-[var(--space-xs)] rounded-lg transition-colors hover:opacity-80"
                                style={{ color: 'var(--color-texte-muted)' }}
                                title={t('facturation.plans.modifier')}
                            >
                                <Edit2 className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal CRUD Plan */}
            <PlanFormModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                plan={editPlan ? {
                    id: editPlan.id,
                    nom: editPlan.nom,
                    slug: editPlan.slug,
                    description: editPlan.description,
                    prixBase: editPlan.prixBase,
                    devise: editPlan.devise,
                    maxEleves: editPlan.maxEleves,
                    maxUtilisateurs: editPlan.maxUtilisateurs,
                    maxClasses: editPlan.maxClasses,
                    modulesInclus: editPlan.modulesInclus,
                    badge: editPlan.badge,
                    tranches: editPlan.tranches?.map((tr) => ({ ...tr, label: tr.label ?? '' })),
                } : undefined}
                mode={editPlan ? 'edit' : 'create'}
            />
        </div>
    );
}

// =============================================
// Abonnements Tab
// =============================================

function AbonnementsTab({ onSelectAbo }: { onSelectAbo?: (id: string) => void }) {
    const { t } = useTranslation('admin');
    const { data, isLoading } = useAbonnements();

    const statutColor = (statut: string) => {
        switch (statut) {
            case 'ACTIF': return { bg: 'var(--color-success-100)', text: 'var(--color-success-700)' };
            case 'SUSPENDU': return { bg: 'var(--color-warning-100)', text: 'var(--color-warning-700)' };
            case 'EXPIRE': return { bg: 'var(--color-danger-100)', text: 'var(--color-danger-700)' };
            case 'ANNULE': return { bg: 'var(--color-surface-hover)', text: 'var(--color-texte-muted)' };
            default: return { bg: 'var(--color-info-100)', text: 'var(--color-info-700)' };
        }
    };

    if (isLoading) return <div className="animate-pulse text-[var(--color-texte-muted)]">{t('facturation.chargement')}</div>;

    return (
        <div className="space-y-[var(--space-md)]">
            <div className="flex items-center gap-[var(--gap-md)]">
                <BarChart3 className="h-[var(--icon-md)] w-[var(--icon-md)] text-[var(--color-texte-muted)]" />
                <span className="text-[var(--color-texte-muted)]" style={{ fontSize: 'clamp(0.75rem, 0.68rem + 0.25vw, 0.875rem)' }}>
                    {data?.total ?? 0} abonnement{data?.total !== 1 ? 's' : ''}
                </span>
            </div>

            <div className="border border-[var(--color-bordure)] rounded-lg overflow-hidden bg-[var(--color-surface)]">
                <table className="w-full" style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.875rem)' }}>
                    <thead>
                        <tr style={{ backgroundColor: 'var(--color-surface-hover)' }}>
                            <th className="text-left p-[var(--space-sm)] font-medium text-[var(--color-texte)]">{t('facturation.abonnements.etablissement')}</th>
                            <th className="text-left p-[var(--space-sm)] font-medium text-[var(--color-texte)]">{t('facturation.abonnements.plan')}</th>
                            <th className="text-left p-[var(--space-sm)] font-medium text-[var(--color-texte)]">{t('facturation.abonnements.statut')}</th>
                            <th className="text-right p-[var(--space-sm)] font-medium text-[var(--color-texte)]">{t('facturation.abonnements.eleves')}</th>
                            <th className="text-right p-[var(--space-sm)] font-medium text-[var(--color-texte)]">{t('facturation.abonnements.montantMois')}</th>
                            <th className="text-left p-[var(--space-sm)] font-medium text-[var(--color-texte)]">{t('facturation.abonnements.fin')}</th>
                            <th className="text-center p-[var(--space-sm)] font-medium text-[var(--color-texte)]">{t('facturation.abonnements.auto')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-bordure)]">
                        {data?.data?.map((abo) => {
                            const sc = statutColor(abo.statut);
                            return (
                                <tr
                                    key={abo.id}
                                    className="cursor-pointer transition-colors"
                                    onClick={() => onSelectAbo?.(abo.id)}
                                    style={{ backgroundColor: 'transparent' }}
                                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)')}
                                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                >
                                    <td className="p-[var(--space-sm)] font-medium text-[var(--color-texte)]">
                                        {abo.etablissement?.nom || abo.etablissementId.slice(0, 8)}
                                    </td>
                                    <td className="p-[var(--space-sm)] text-[var(--color-texte)]">{abo.plan?.nom || '-'}</td>
                                    <td className="p-[var(--space-sm)]">
                                        <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: sc.bg, color: sc.text }}>
                                            {abo.statut}
                                        </span>
                                    </td>
                                    <td className="p-[var(--space-sm)] text-right text-[var(--color-texte)]">{abo.nombreElevesActuel}</td>
                                    <td className="p-[var(--space-sm)] text-right font-mono text-[var(--color-texte)]">
                                        {new Intl.NumberFormat('fr-FR').format(Number(abo.montantMensuel))} XAF
                                    </td>
                                    <td className="p-[var(--space-sm)] text-[var(--color-texte-muted)]" style={{ fontSize: 'clamp(0.75rem, 0.68rem + 0.25vw, 0.875rem)' }}>
                                        {new Date(abo.dateFin).toLocaleDateString('fr-FR')}
                                    </td>
                                    <td className="p-[var(--space-sm)] text-center">
                                        {abo.autoRenouvellement
                                            ? <CheckCircle className="w-[var(--icon-sm)] h-[var(--icon-sm)] mx-auto" style={{ color: 'var(--color-success-600)' }} />
                                            : <XCircle className="w-[var(--icon-sm)] h-[var(--icon-sm)] mx-auto text-[var(--color-texte-muted)]" />}
                                    </td>
                                </tr>
                            );
                        })}
                        {(!data?.data || data.data.length === 0) && (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-[var(--color-texte-muted)]">
                                    {t('facturation.abonnements.aucun')}
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
// Factures Tab
// =============================================

function FacturesTab() {
    const { t } = useTranslation('admin');
    const { data, isLoading } = useFactures();

    const statutColor = (statut: string) => {
        switch (statut) {
            case 'PAYEE': return { bg: 'var(--color-success-100)', text: 'var(--color-success-700)' };
            case 'EMISE': return { bg: 'var(--color-info-100)', text: 'var(--color-info-700)' };
            case 'EN_RETARD': return { bg: 'var(--color-danger-100)', text: 'var(--color-danger-700)' };
            case 'BROUILLON': return { bg: 'var(--color-surface-hover)', text: 'var(--color-texte-muted)' };
            default: return { bg: 'var(--color-surface-hover)', text: 'var(--color-texte-muted)' };
        }
    };

    if (isLoading) return <div className="animate-pulse text-[var(--color-texte-muted)]">{t('facturation.chargement')}</div>;

    return (
        <div className="border border-[var(--color-bordure)] rounded-lg overflow-hidden bg-[var(--color-surface)]">
            <table className="w-full" style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.875rem)' }}>
                <thead>
                    <tr style={{ backgroundColor: 'var(--color-surface-hover)' }}>
                        <th className="text-left p-[var(--space-sm)] font-medium text-[var(--color-texte)]">{t('facturation.facturesPage.numero')}</th>
                        <th className="text-left p-[var(--space-sm)] font-medium text-[var(--color-texte)]">{t('facturation.facturesPage.dateEmission')}</th>
                        <th className="text-left p-[var(--space-sm)] font-medium text-[var(--color-texte)]">{t('facturation.facturesPage.echeance')}</th>
                        <th className="text-right p-[var(--space-sm)] font-medium text-[var(--color-texte)]">{t('facturation.facturesPage.montantTotal')}</th>
                        <th className="text-right p-[var(--space-sm)] font-medium text-[var(--color-texte)]">{t('facturation.facturesPage.paye')}</th>
                        <th className="text-left p-[var(--space-sm)] font-medium text-[var(--color-texte)]">{t('facturation.facturesPage.statut')}</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-bordure)]">
                    {data?.data?.map((f) => {
                        const sc = statutColor(f.statut);
                        return (
                            <tr
                                key={f.id}
                                className="transition-colors"
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)')}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                            >
                                <td className="p-[var(--space-sm)] font-mono font-medium text-[var(--color-texte)]">{f.numero}</td>
                                <td className="p-[var(--space-sm)] text-[var(--color-texte)]">{new Date(f.dateEmission).toLocaleDateString('fr-FR')}</td>
                                <td className="p-[var(--space-sm)] text-[var(--color-texte)]">{new Date(f.dateEcheance).toLocaleDateString('fr-FR')}</td>
                                <td className="p-[var(--space-sm)] text-right font-mono text-[var(--color-texte)]">
                                    {new Intl.NumberFormat('fr-FR').format(Number(f.montantTotal))} {f.devise}
                                </td>
                                <td className="p-[var(--space-sm)] text-right font-mono text-[var(--color-texte)]">
                                    {new Intl.NumberFormat('fr-FR').format(Number(f.montantPaye))} {f.devise}
                                </td>
                                <td className="p-[var(--space-sm)]">
                                    <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: sc.bg, color: sc.text }}>
                                        {f.statut}
                                    </span>
                                </td>
                            </tr>
                        );
                    })}
                    {(!data?.data || data.data.length === 0) && (
                        <tr>
                            <td colSpan={6} className="p-8 text-center text-[var(--color-texte-muted)]">
                                {t('facturation.facturesPage.aucune')}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

// =============================================
// Modules Tab
// =============================================

function ModulesTab() {
    const { t } = useTranslation('admin');
    const queryClient = useQueryClient();
    const [showForm, setShowForm] = useState(false);
    const [editModule, setEditModule] = useState<ModuleOptionnel | null>(null);
    const [form, setForm] = useState({ nom: '', slug: '', description: '', prixMensuel: 0, prixAnnuel: 0 });
    const [deleteTarget, setDeleteTarget] = useState<ModuleOptionnel | null>(null);

    const { data: modules, isLoading } = useQuery({
        queryKey: ['platform-modules-optionnels'],
        queryFn: async () => {
            const res = await apiClient.get<ModuleOptionnel[]>('/api/platform/facturation/modules');
            return res.data ?? [];
        },
    });

    const createMutation = useMutation({
        mutationFn: (data: Omit<ModuleOptionnel, 'id' | 'actif'>) => apiClient.post('/api/platform/facturation/modules', data),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['platform-modules-optionnels'] }); setShowForm(false); resetForm(); },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<ModuleOptionnel> }) => apiClient.put(`/api/platform/facturation/modules/${id}`, data),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['platform-modules-optionnels'] }); setEditModule(null); resetForm(); },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => apiClient.delete(`/api/platform/facturation/modules/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['platform-modules-optionnels'] }),
    });

    const resetForm = () => setForm({ nom: '', slug: '', description: '', prixMensuel: 0, prixAnnuel: 0 });

    const handleEdit = (mod: ModuleOptionnel) => {
        setEditModule(mod);
        setForm({ nom: mod.nom, slug: mod.slug, description: mod.description || '', prixMensuel: Number(mod.prixMensuel), prixAnnuel: Number(mod.prixAnnuel) });
        setShowForm(true);
    };

    const handleSubmit = () => {
        if (!form.nom || !form.slug) return;
        if (editModule) {
            updateMutation.mutate({ id: editModule.id, data: form });
        } else {
            createMutation.mutate(form);
        }
    };

    const handleToggleActif = (mod: ModuleOptionnel) => {
        updateMutation.mutate({ id: mod.id, data: { actif: !mod.actif } });
    };

    if (isLoading) return <div className="animate-pulse text-[var(--color-texte-muted)]">{t('facturation.chargement')}</div>;

    return (
        <div className="space-y-[var(--space-md)]">
            {/* Header + bouton nouveau */}
            <div className="flex justify-between items-center">
                <p style={{ fontSize: 'clamp(0.75rem, 0.68rem + 0.25vw, 0.875rem)', color: 'var(--color-texte-muted)' }}>{t('facturation.modulesPage.description', 'Modules disponibles pour les abonnements')}</p>
                <button
                    onClick={() => { setShowForm(v => !v); if (showForm) { resetForm(); setEditModule(null); } }}
                    className="flex items-center gap-[var(--gap-sm)] px-[var(--space-md)] py-[var(--space-sm)] rounded-lg hover:opacity-90"
                    style={{ backgroundColor: showForm ? 'var(--color-danger-600)' : 'var(--color-dominant-600)', color: '#fff' }}
                >
                    {showForm ? <X className="h-[var(--icon-sm)] w-[var(--icon-sm)]" /> : <Plus className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                    {showForm ? t('common:annuler', 'Annuler') : t('facturation.modulesPage.nouveau')}
                </button>
            </div>

            {/* Formulaire création/édition */}
            {showForm && (
                <div className="border border-[var(--color-bordure)] rounded-xl p-[var(--space-md)] space-y-[var(--space-sm)] bg-[var(--color-surface)]">
                    <h4 className="font-semibold" style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)' }}>{editModule ? t('facturation.modulesPage.modifier', 'Modifier le module') : t('facturation.modulesPage.nouveau')}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--gap-sm)]">
                        <div>
                            <label className="text-xs font-medium text-[var(--color-texte-muted)]">{t('facturation.modulesPage.nomLabel', 'Nom')}</label>
                            <input type="text" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} className="w-full mt-1 px-[var(--space-md)] py-[var(--space-xs)] border rounded-lg bg-[var(--color-surface)]" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-[var(--color-texte-muted)]">Slug</label>
                            <input type="text" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} className="w-full mt-1 px-[var(--space-md)] py-[var(--space-xs)] border rounded-lg bg-[var(--color-surface)]" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-[var(--color-texte-muted)]">{t('facturation.modulesPage.mensuel')}</label>
                            <input type="number" value={form.prixMensuel} onChange={e => setForm(f => ({ ...f, prixMensuel: Number(e.target.value) }))} className="w-full mt-1 px-[var(--space-md)] py-[var(--space-xs)] border rounded-lg bg-[var(--color-surface)]" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-[var(--color-texte-muted)]">{t('facturation.modulesPage.annuel')}</label>
                            <input type="number" value={form.prixAnnuel} onChange={e => setForm(f => ({ ...f, prixAnnuel: Number(e.target.value) }))} className="w-full mt-1 px-[var(--space-md)] py-[var(--space-xs)] border rounded-lg bg-[var(--color-surface)]" />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-[var(--color-texte-muted)]">Description</label>
                        <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full mt-1 px-[var(--space-md)] py-[var(--space-xs)] border rounded-lg bg-[var(--color-surface)]" />
                    </div>
                    <div className="flex justify-end">
                        <button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} className="flex items-center gap-[var(--gap-sm)] px-[var(--space-md)] py-[var(--space-xs)] rounded-lg hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: 'var(--color-dominant-600)', color: '#fff' }}>
                            <Save className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />
                            {editModule ? t('common:modifier', 'Modifier') : t('common:creer', 'Créer')}
                        </button>
                    </div>
                </div>
            )}

            {/* Grille des modules */}
            <div className="grid gap-[var(--gap-md)] md:grid-cols-2 lg:grid-cols-3">
                {modules?.map((mod: ModuleOptionnel) => (
                    <div key={mod.id} className="border border-[var(--color-bordure)] rounded-xl p-[var(--space-md)] space-y-[var(--space-sm)] bg-[var(--color-surface)]">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="font-semibold text-[var(--color-texte)]">{mod.nom}</h3>
                                <code className="text-xs text-[var(--color-texte-muted)]">{mod.slug}</code>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${mod.actif ? 'bg-[var(--color-success-100)] text-[var(--color-success-700)]' : 'bg-[var(--color-danger-100)] text-[var(--color-danger-700)]'}`}>
                                {mod.actif ? t('facturation.modulesPage.actif', 'Actif') : t('facturation.modulesPage.inactif', 'Inactif')}
                            </span>
                        </div>
                        {mod.description && <p className="text-[var(--color-texte-muted)]" style={{ fontSize: 'clamp(0.75rem, 0.68rem + 0.25vw, 0.875rem)' }}>{mod.description}</p>}
                        <div className="flex justify-between" style={{ fontSize: 'clamp(0.75rem, 0.68rem + 0.25vw, 0.875rem)' }}>
                            <span className="text-[var(--color-texte-muted)]">{t('facturation.modulesPage.mensuel')}</span>
                            <span className="font-mono text-[var(--color-texte)]">{Number(mod.prixMensuel).toLocaleString()} XAF</span>
                        </div>
                        <div className="flex justify-between" style={{ fontSize: 'clamp(0.75rem, 0.68rem + 0.25vw, 0.875rem)' }}>
                            <span className="text-[var(--color-texte-muted)]">{t('facturation.modulesPage.annuel')}</span>
                            <span className="font-mono text-[var(--color-texte)]">{Number(mod.prixAnnuel).toLocaleString()} XAF</span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-[var(--color-bordure)]">
                            <button onClick={() => handleToggleActif(mod)} className="text-xs px-2 py-1 rounded border hover:bg-[var(--color-surface-hover)] transition-colors" style={{ color: mod.actif ? 'var(--color-warning-600)' : 'var(--color-success-600)' }}>
                                {mod.actif ? t('facturation.modulesPage.desactiver', 'Désactiver') : t('facturation.modulesPage.activer', 'Activer')}
                            </button>
                            <div className="flex items-center gap-[var(--gap-xs)]">
                                <button onClick={() => handleEdit(mod)} className="p-1.5 rounded hover:bg-[var(--color-surface-hover)]" title={t('common:modifier', 'Modifier')}>
                                    <Edit2 className="h-[var(--icon-xs)] w-[var(--icon-xs)] text-[var(--color-texte-muted)]" />
                                </button>
                                <button
                                    onClick={() => setDeleteTarget(mod)}
                                    className="p-1.5 rounded hover:bg-[var(--color-danger-50)]"
                                    title={t('common:supprimer', 'Supprimer')}
                                >
                                    <Trash2 className="h-[var(--icon-xs)] w-[var(--icon-xs)] text-[var(--color-danger-500)]" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
                {(!modules || modules.length === 0) && (
                    <div className="col-span-full text-center text-[var(--color-texte-muted)] py-8">
                        {t('facturation.modulesPage.aucun')}
                    </div>
                )}
            </div>
            {/* Modal confirmation suppression */}
            <ConfirmAction
                open={!!deleteTarget}
                onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
                onConfirm={() => { if (deleteTarget) { deleteMutation.mutate(deleteTarget.id); setDeleteTarget(null); } }}
                title={t('facturation.modulesPage.confirmSuppressionTitre', 'Supprimer ce module ?')}
                description={t('facturation.modulesPage.confirmSuppression', 'Cette action est irréversible. Le module sera définitivement supprimé.')}
                confirmLabel={t('common:supprimer', 'Supprimer')}
                variant="danger"
                loading={deleteMutation.isPending}
            />
        </div>
    );
}

// =============================================
// Feature Flags Tab
// =============================================

function FlagsTab() {
    const { t } = useTranslation('admin');
    const queryClient = useQueryClient();
    const [etablissementId, setEtablissementId] = useState('');
    const { data: flags, isLoading, refetch } = useQuery({
        queryKey: ['platform-flags', etablissementId],
        queryFn: async () => {
            if (!etablissementId) return {};
            const res = await apiClient.get<Record<string, boolean>>(
                `/api/platform/facturation/feature-flags/${etablissementId}`
            );
            return res.data ?? {};
        },
        enabled: !!etablissementId,
    });

    const toggleMutation = useMutation({
        mutationFn: ({ flagName, enabled }: { flagName: string; enabled: boolean }) =>
            apiClient.put('/api/platform/facturation/feature-flags', { etablissementId, flagName, enabled }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['platform-flags', etablissementId] });
        },
    });

    return (
        <div className="space-y-[var(--space-md)]">
            <div className="flex gap-[var(--gap-md)] items-end">
                <div className="flex-1">
                    <label className="font-medium text-[var(--color-texte)]" style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.875rem)' }}>{t('facturation.flagsPage.etablissementId')}</label>
                    <input
                        type="text"
                        value={etablissementId}
                        onChange={(e) => setEtablissementId(e.target.value)}
                        placeholder={t('facturation.flagsPage.placeholder')}
                        className="w-full mt-1 px-[var(--space-md)] py-[var(--space-xs)] border border-[var(--color-bordure)] rounded-lg bg-[var(--color-surface)] text-[var(--color-texte)]"
                    />
                </div>
                <button
                    onClick={() => refetch()}
                    disabled={!etablissementId}
                    className="px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: 'var(--color-dominant-600)', color: '#fff' }}
                >
                    {t('facturation.flagsPage.charger')}
                </button>
            </div>

            {isLoading && <div className="animate-pulse text-[var(--color-texte-muted)]">{t('facturation.chargement')}</div>}

            {flags && Object.keys(flags).length > 0 && (
                <div className="border border-[var(--color-bordure)] rounded-lg overflow-hidden bg-[var(--color-surface)]">
                    <table className="w-full" style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.875rem)' }}>
                        <thead>
                            <tr style={{ backgroundColor: 'var(--color-surface-hover)' }}>
                                <th className="text-left p-[var(--space-sm)] font-medium text-[var(--color-texte)]">{t('facturation.flagsPage.flag')}</th>
                                <th className="text-center p-[var(--space-sm)] font-medium text-[var(--color-texte)]">{t('facturation.abonnements.statut')}</th>
                                <th className="text-right p-[var(--space-sm)] font-medium text-[var(--color-texte)]">{t('facturation.flagsPage.action', 'Action')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-bordure)]">
                            {Object.entries(flags).map(([flag, enabled]) => (
                                <tr
                                    key={flag}
                                    className="transition-colors"
                                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)')}
                                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                >
                                    <td className="p-[var(--space-sm)] font-mono text-[var(--color-texte)]" style={{ fontSize: 'clamp(0.75rem, 0.68rem + 0.25vw, 0.875rem)' }}>{flag}</td>
                                    <td className="p-[var(--space-sm)] text-center">
                                        <span
                                            className="text-xs px-2 py-1 rounded-full"
                                            style={{
                                                backgroundColor: enabled ? 'var(--color-success-100)' : 'var(--color-danger-100)',
                                                color: enabled ? 'var(--color-success-700)' : 'var(--color-danger-700)',
                                            }}
                                        >
                                            {enabled ? t('facturation.flagsPage.active') : t('facturation.flagsPage.desactive')}
                                        </span>
                                    </td>
                                    <td className="p-[var(--space-sm)] text-right">
                                        <button
                                            onClick={() => toggleMutation.mutate({ flagName: flag, enabled: !enabled })}
                                            disabled={toggleMutation.isPending}
                                            className="text-xs px-3 py-1 rounded border transition-colors hover:bg-[var(--color-surface-hover)] disabled:opacity-50"
                                            style={{ color: enabled ? 'var(--color-danger-600)' : 'var(--color-success-600)' }}
                                        >
                                            {enabled ? t('facturation.flagsPage.desactiver', 'Désactiver') : t('facturation.flagsPage.activer', 'Activer')}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {flags && Object.keys(flags).length === 0 && etablissementId && !isLoading && (
                <div className="text-center text-[var(--color-texte-muted)] py-8">
                    {t('facturation.flagsPage.aucunFlag', 'Aucun feature flag trouvé pour cet établissement')}
                </div>
            )}

            {!etablissementId && (
                <div className="text-center text-[var(--color-texte-muted)] py-8">
                    {t('facturation.flagsPage.hint')}
                </div>
            )}
        </div>
    );
}

// =============================================
// Route definition
// =============================================

export const Route = createFileRoute('/platform/facturation')({
    component: PlatformFacturationPage,
});

export default PlatformFacturationPage;
