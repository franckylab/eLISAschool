/**
 * ==================================
 * eLISAschool - Plan Form Modal (Refonte v3)
 * ==================================
 *
 * Modal multi-étapes pour créer/éditer un plan d'abonnement.
 * 7 étapes : Infos → Tarification → Quotas → Modules → Fonctionnalités → Cycles & Essai → Résumé
 *
 * Refonte v3 (migration 213) :
 *   - Plans pilotés par JSONB (tarification / quotas / entitlements / cyclesAutorises / essai)
 *   - Fin des tranches d'élèves → formule prix/élève + franchise
 *   - Classification modules binaire GRATUIT | PAYANT
 *
 * Version: 3.0.0
 * Auteur: franck arlos chendjou
 */

import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { CustomModal } from '@/components/modals/CustomModal';
import { ElisaButton } from '@/components/ui';
import {
    Package,
    Users,
    Puzzle,
    ToggleLeft,
    CheckCircle2,
    ArrowRight,
    ArrowLeft,
    Plus,
    Trash2,
    CalendarClock,
    Loader2,
    AlertCircle,
} from 'lucide-react';
import { formatPrix } from '@/features/billing/types/plan.types';

// =============================================
// Types (plan v3 piloté par JSONB)
// =============================================

interface PalierTarification {
    seuilEleves: number;
    prixParEleve: number;
}

interface TarificationData {
    prixBase: number;
    prixParEleve: number;
    elevesInclusGratuits: number;
    paliers: PalierTarification[];
}

interface EssaiData {
    autorise: boolean;
    dureeJours: number;
}

interface PlanFormData {
    nom: string;
    slug: string;
    description: string;
    prixBase: number;
    devise: string;
    rang: number;
    estParDefaut: boolean;
    visiblePubliquement: boolean;
    badge: string;
    tarification: TarificationData;
    quotas: Record<string, number>;
    entitlements: { modules: string[]; fonctionnalites: string[] };
    cyclesAutorises: string[];
    essai: EssaiData;
}

interface PlanFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    plan?: Partial<PlanFormData> & { id?: string };
    mode: 'create' | 'edit';
}

// =============================================
// Constants
// =============================================

const DEVISES = ['XAF', 'XOF', 'EUR', 'USD'];

/** Ressources de quota standard (clés JSONB `quotas`) */
const RESSOURCES_QUOTA: Array<{ cle: string; labelKey: string; defaut: string }> = [
    { cle: 'eleves', labelKey: 'planForm.quotas.eleves', defaut: 'Élèves' },
    { cle: 'utilisateurs', labelKey: 'planForm.quotas.utilisateurs', defaut: 'Utilisateurs' },
    { cle: 'classes', labelKey: 'planForm.quotas.classes', defaut: 'Classes' },
    { cle: 'stockageGo', labelKey: 'planForm.quotas.stockage', defaut: 'Stockage (Go)' },
    { cle: 'sms', labelKey: 'planForm.quotas.sms', defaut: 'SMS / mois' },
];

/** Cycles de facturation proposés (valeurs migration 213) */
const CYCLES = ['MENSUEL', 'TRIMESTRIEL', 'SEMESTRIEL', 'ANNUEL'];

const STEPS = [
    { key: 'infos', label: 'Infos', icon: Package },
    { key: 'tarification', label: 'Tarification', icon: ArrowRight },
    { key: 'quotas', label: 'Quotas', icon: Users },
    { key: 'modules', label: 'Modules', icon: Puzzle },
    { key: 'fonctionnalites', label: 'Fonctionnalités', icon: ToggleLeft },
    { key: 'cycles', label: 'Cycles & Essai', icon: CalendarClock },
    { key: 'resume', label: 'Résumé', icon: CheckCircle2 },
];

const DEFAULT_FORM: PlanFormData = {
    nom: '',
    slug: '',
    description: '',
    prixBase: 0,
    devise: 'XAF',
    rang: 0,
    estParDefaut: false,
    visiblePubliquement: true,
    badge: '',
    tarification: { prixBase: 0, prixParEleve: 0, elevesInclusGratuits: 0, paliers: [] },
    quotas: { eleves: 300, utilisateurs: 0, classes: 0, stockageGo: 5, sms: 100 },
    entitlements: { modules: ['eleves', 'notes', 'emploi-temps'], fonctionnalites: [] },
    cyclesAutorises: ['MENSUEL', 'ANNUEL'],
    essai: { autorise: false, dureeJours: 14 },
};

/** Normalise un plan reçu de l'API (ou prop) en PlanFormData */
function normaliserPlan(plan?: Partial<PlanFormData> & { id?: string }): PlanFormData {
    if (!plan) return { ...DEFAULT_FORM };
    return {
        ...DEFAULT_FORM,
        ...plan,
        tarification: {
            ...DEFAULT_FORM.tarification,
            ...(plan.tarification ?? {}),
            paliers: plan.tarification?.paliers ?? [],
        },
        quotas: { ...(plan.quotas ?? DEFAULT_FORM.quotas) },
        entitlements: {
            modules: plan.entitlements?.modules ?? DEFAULT_FORM.entitlements.modules,
            fonctionnalites: plan.entitlements?.fonctionnalites ?? [],
        },
        cyclesAutorises: plan.cyclesAutorises ?? DEFAULT_FORM.cyclesAutorises,
        essai: { ...DEFAULT_FORM.essai, ...(plan.essai ?? {}) },
    };
}

// =============================================
// Component
// =============================================

export function PlanFormModal({ open, onOpenChange, plan, mode }: PlanFormModalProps) {
    const { t } = useTranslation('admin');
    const queryClient = useQueryClient();
    const [step, setStep] = useState(0);
    const [form, setForm] = useState<PlanFormData>(() => normaliserPlan(plan));
    const [error, setError] = useState<string | null>(null);

    // Données dynamiques (catalogue modules + définitions fonctionnalités)
    const { data: dynamicModules } = useQuery({
        queryKey: ['modules-catalogue'],
        queryFn: async () => {
            const res = await apiClient.get<{ success: boolean; data: any[] }>('/api/platform/facturation/modules/catalogue');
            return res.data?.data ?? [];
        },
        staleTime: 60 * 1000,
    });

    const { data: dynamicFlags } = useQuery({
        queryKey: ['feature-flag-definitions'],
        queryFn: async () => {
            const res = await apiClient.get<{ success: boolean; data: any[] }>('/api/platform/facturation/feature-flags/definitions');
            return res.data?.data ?? [];
        },
        staleTime: 60 * 1000,
    });

    const modulesCatalogue = useMemo(
        () => (dynamicModules ?? []).map((m: any) => ({ id: m.code, nom: m.nom, categorie: m.categorie })),
        [dynamicModules],
    );

    const fonctionnalitesList = useMemo(
        () => (dynamicFlags ?? []).map((f: any) => ({ key: f.cle, label: f.label })),
        [dynamicFlags],
    );

    // Mutations (endpoint plateforme v3 — payload JSONB complet)
    const createMutation = useMutation({
        mutationFn: async (data: PlanFormData) => {
            const payload = { ...data, tarification: { ...data.tarification, prixBase: data.prixBase } };
            const res = await apiClient.post<{ success: boolean; data: any }>('/api/platform/facturation/plans', payload);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['platform-plans'] });
            queryClient.invalidateQueries({ queryKey: ['plans-tarifs'] });
            onOpenChange(false);
            resetForm();
        },
        onError: (err: any) => setError(err?.response?.data?.message || t('planForm.erreurCreation')),
    });

    const updateMutation = useMutation({
        mutationFn: async (data: PlanFormData) => {
            const payload = { ...data, tarification: { ...data.tarification, prixBase: data.prixBase } };
            const res = await apiClient.put<{ success: boolean; data: any }>(`/api/platform/facturation/plans/${plan?.id}`, payload);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['platform-plans'] });
            queryClient.invalidateQueries({ queryKey: ['plans-tarifs'] });
            onOpenChange(false);
            resetForm();
        },
        onError: (err: any) => setError(err?.response?.data?.message || t('planForm.erreurModification')),
    });

    const isSubmitting = createMutation.isPending || updateMutation.isPending;

    const resetForm = useCallback(() => {
        setStep(0);
        setForm(normaliserPlan());
        setError(null);
    }, []);

    const updateField = useCallback(<K extends keyof PlanFormData>(key: K, value: PlanFormData[K]) => {
        setForm(prev => ({ ...prev, [key]: value }));
    }, []);

    const updateTarification = useCallback(<K extends keyof TarificationData>(key: K, value: TarificationData[K]) => {
        setForm(prev => ({ ...prev, tarification: { ...prev.tarification, [key]: value } }));
    }, []);

    const updateQuota = useCallback((cle: string, valeur: number) => {
        setForm(prev => ({ ...prev, quotas: { ...prev.quotas, [cle]: valeur } }));
    }, []);

    const updateEssai = useCallback(<K extends keyof EssaiData>(key: K, value: EssaiData[K]) => {
        setForm(prev => ({ ...prev, essai: { ...prev.essai, [key]: value } }));
    }, []);

    // Auto-generate slug from nom
    const generateSlug = useCallback((nom: string) => {
        return nom.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }, []);

    // Paliers de tarification
    const addPalier = useCallback(() => {
        setForm(prev => ({
            ...prev,
            tarification: {
                ...prev.tarification,
                paliers: [...prev.tarification.paliers, { seuilEleves: 0, prixParEleve: 0 }],
            },
        }));
    }, []);

    const updatePalier = useCallback((index: number, field: keyof PalierTarification, value: number) => {
        setForm(prev => {
            const paliers = [...prev.tarification.paliers];
            paliers[index] = { ...paliers[index], [field]: value };
            return { ...prev, tarification: { ...prev.tarification, paliers } };
        });
    }, []);

    const removePalier = useCallback((index: number) => {
        setForm(prev => ({
            ...prev,
            tarification: { ...prev.tarification, paliers: prev.tarification.paliers.filter((_, i) => i !== index) },
        }));
    }, []);

    // Module toggle
    const toggleModule = useCallback((moduleId: string) => {
        setForm(prev => {
            const modules = prev.entitlements.modules.includes(moduleId)
                ? prev.entitlements.modules.filter(m => m !== moduleId)
                : [...prev.entitlements.modules, moduleId];
            return { ...prev, entitlements: { ...prev.entitlements, modules } };
        });
    }, []);

    // Fonctionnalité toggle
    const toggleFonctionnalite = useCallback((flagKey: string) => {
        setForm(prev => {
            const fonctionnalites = prev.entitlements.fonctionnalites.includes(flagKey)
                ? prev.entitlements.fonctionnalites.filter(f => f !== flagKey)
                : [...prev.entitlements.fonctionnalites, flagKey];
            return { ...prev, entitlements: { ...prev.entitlements, fonctionnalites } };
        });
    }, []);

    // Cycle toggle
    const toggleCycle = useCallback((cycle: string) => {
        setForm(prev => ({
            ...prev,
            cyclesAutorises: prev.cyclesAutorises.includes(cycle)
                ? prev.cyclesAutorises.filter(c => c !== cycle)
                : [...prev.cyclesAutorises, cycle],
        }));
    }, []);

    // Navigation
    const canNext = useMemo(() => {
        switch (step) {
            case 0: return form.nom.trim().length > 0 && form.slug.trim().length > 0 && form.prixBase >= 0;
            case 1: return form.tarification.prixBase >= 0 && form.tarification.prixParEleve >= 0;
            default: return true;
        }
    }, [step, form]);

    const handleNext = () => { if (canNext && step < STEPS.length - 1) setStep(s => s + 1); };
    const handlePrev = () => { if (step > 0) setStep(s => s - 1); };

    const handleSubmit = () => {
        setError(null);
        if (mode === 'create') {
            createMutation.mutate(form);
        } else {
            updateMutation.mutate(form);
        }
    };

    const formatPrice = (price: number, devise: string = 'XAF') => formatPrix(price, devise);

    const formatQuota = (v: number) => (v === 0 ? t('planForm.resume.illimite', 'Illimité') : v.toLocaleString('fr-FR'));

    const inputClass = 'w-full px-3 py-2 border rounded-lg text-sm bg-[var(--color-surface)]';

    // =============================================
    // Step Renderers
    // =============================================

    const renderStepInfos = () => (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium mb-1">{t('planForm.infos.nom')}</label>
                <input
                    type="text"
                    value={form.nom}
                    onChange={(e) => {
                        updateField('nom', e.target.value);
                        if (mode === 'create') updateField('slug', generateSlug(e.target.value));
                    }}
                    className={inputClass}
                    placeholder={t('planForm.infos.nomPlaceholder')}
                />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">{t('planForm.infos.slug')}</label>
                <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => updateField('slug', e.target.value)}
                    className={`${inputClass} font-mono`}
                    placeholder="starter, pro, enterprise"
                />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">{t('planForm.infos.description')}</label>
                <textarea
                    value={form.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    className={`${inputClass} resize-none`}
                    rows={3}
                    placeholder={t('planForm.infos.descriptionPlaceholder')}
                />
            </div>
            <div className="grid grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1">{t('planForm.infos.prix')}</label>
                    <input
                        type="number"
                        value={form.prixBase}
                        onChange={(e) => {
                            const v = Number(e.target.value);
                            updateField('prixBase', v);
                            updateTarification('prixBase', v);
                        }}
                        className={inputClass}
                        min={0}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">{t('planForm.infos.devise')}</label>
                    <select
                        value={form.devise}
                        onChange={(e) => updateField('devise', e.target.value)}
                        className={inputClass}
                    >
                        {DEVISES.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">{t('planForm.infos.rang', 'Rang (ordre)')}</label>
                    <input
                        type="number"
                        value={form.rang}
                        onChange={(e) => updateField('rang', Number(e.target.value))}
                        className={inputClass}
                        min={0}
                    />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">{t('planForm.infos.badge')}</label>
                <input
                    type="text"
                    value={form.badge}
                    onChange={(e) => updateField('badge', e.target.value)}
                    className={inputClass}
                    placeholder={t('planForm.infos.badgePlaceholder')}
                />
            </div>
            <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        checked={form.estParDefaut}
                        onChange={(e) => updateField('estParDefaut', e.target.checked)}
                        className="w-4 h-4 rounded"
                    />
                    {t('planForm.infos.estParDefaut', 'Plan par défaut')}
                </label>
                <label className="flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        checked={form.visiblePubliquement}
                        onChange={(e) => updateField('visiblePubliquement', e.target.checked)}
                        className="w-4 h-4 rounded"
                    />
                    {t('planForm.infos.visiblePubliquement', 'Visible publiquement')}
                </label>
            </div>
        </div>
    );

    const renderStepTarification = () => (
        <div className="space-y-5">
            <p className="text-sm text-[var(--color-texte-muted)]">
                {t('planForm.tarification.desc', 'Formule v3 : (prixBase + max(0, nbÉlèves − franchise) × prixParÉlève) × coefficient cycle.')}
            </p>
            <div className="grid grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1">{t('planForm.tarification.prixBase', 'Prix de base (mensuel)')}</label>
                    <input
                        type="number"
                        value={form.tarification.prixBase}
                        onChange={(e) => {
                            const v = Number(e.target.value);
                            updateTarification('prixBase', v);
                            updateField('prixBase', v);
                        }}
                        className={inputClass}
                        min={0}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">{t('planForm.tarification.prixParEleve', 'Prix par élève supplémentaire')}</label>
                    <input
                        type="number"
                        value={form.tarification.prixParEleve}
                        onChange={(e) => updateTarification('prixParEleve', Number(e.target.value))}
                        className={inputClass}
                        min={0}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">{t('planForm.tarification.franchise', 'Élèves inclus (franchise)')}</label>
                    <input
                        type="number"
                        value={form.tarification.elevesInclusGratuits}
                        onChange={(e) => updateTarification('elevesInclusGratuits', Number(e.target.value))}
                        className={inputClass}
                        min={0}
                    />
                </div>
            </div>

            {/* Paliers dégressifs optionnels */}
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">{t('planForm.tarification.paliers', 'Paliers de prix (optionnel)')}</h4>
                <button
                    type="button"
                    onClick={addPalier}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-[var(--color-dominante)] text-white rounded-lg hover:opacity-90"
                >
                    <Plus className="w-3.5 h-3.5" />
                    {t('planForm.tarification.ajouterPalier', 'Ajouter un palier')}
                </button>
            </div>
            {form.tarification.paliers.length === 0 && (
                <div className="text-center py-6 text-[var(--color-texte-muted)] text-sm border border-dashed rounded-lg">
                    {t('planForm.tarification.aucunPalier', 'Aucun palier — prix par élève constant au-delà de la franchise.')}
                </div>
            )}
            {form.tarification.paliers.map((palier, index) => (
                <div key={index} className="border rounded-lg p-3 flex items-end gap-3">
                    <div className="flex-1">
                        <label className="text-xs text-[var(--color-texte-muted)]">{t('planForm.tarification.seuilEleves', 'À partir de (élèves)')}</label>
                        <input
                            type="number"
                            value={palier.seuilEleves}
                            onChange={(e) => updatePalier(index, 'seuilEleves', Number(e.target.value))}
                            className={inputClass}
                            min={0}
                        />
                    </div>
                    <div className="flex-1">
                        <label className="text-xs text-[var(--color-texte-muted)]">{t('planForm.tarification.prixPalier', 'Prix par élève')}</label>
                        <input
                            type="number"
                            value={palier.prixParEleve}
                            onChange={(e) => updatePalier(index, 'prixParEleve', Number(e.target.value))}
                            className={inputClass}
                            min={0}
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => removePalier(index)}
                        className="p-2 text-[var(--color-danger-500)] hover:bg-[var(--color-danger-50)] rounded"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            ))}
        </div>
    );

    const renderStepQuotas = () => (
        <div className="space-y-4">
            <p className="text-sm text-[var(--color-texte-muted)]">
                {t('planForm.quotas.descV3', 'Quotas libres stockés en JSONB. 0 = illimité.')}
            </p>
            <div className="grid grid-cols-2 gap-4">
                {RESSOURCES_QUOTA.map(({ cle, labelKey, defaut }) => (
                    <div key={cle}>
                        <label className="block text-sm font-medium mb-1">{t(labelKey, defaut)}</label>
                        <input
                            type="number"
                            value={form.quotas[cle] ?? 0}
                            onChange={(e) => updateQuota(cle, Number(e.target.value))}
                            className={inputClass}
                            min={0}
                        />
                        <span className="text-xs text-[var(--color-texte-muted)]">{t('planForm.quotas.illimite')}</span>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderStepModules = () => {
        const categories = [
            { key: 'GRATUIT', label: t('planForm.modules.gratuit', 'Modules gratuits'), color: 'text-[var(--color-success-600)]' },
            { key: 'PAYANT', label: t('planForm.modules.payant', 'Modules payants'), color: 'text-[var(--color-info-600)]' },
        ];

        return (
            <div className="space-y-4">
                <p className="text-sm text-[var(--color-texte-muted)]">{t('planForm.modules.desc')}</p>
                {categories.map(cat => (
                    <div key={cat.key}>
                        <h4 className={`text-sm font-semibold mb-2 ${cat.color}`}>{cat.label}</h4>
                        <div className="grid grid-cols-2 gap-2">
                            {modulesCatalogue.filter(m => m.categorie === cat.key).map(mod => {
                                const selected = form.entitlements.modules.includes(mod.id);
                                return (
                                    <button
                                        key={mod.id}
                                        type="button"
                                        onClick={() => toggleModule(mod.id)}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm text-left transition-colors ${
                                            selected
                                                ? 'border-[var(--color-dominante)] bg-[var(--color-dominante)]/5 text-[var(--color-dominante)]'
                                                : 'border-[var(--color-bordure)] hover:border-[var(--color-dominante)]/50'
                                        }`}
                                    >
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                                            selected ? 'bg-[var(--color-dominante)] border-[var(--color-dominante)]' : 'border-[var(--color-bordure)]'
                                        }`}>
                                            {selected && <CheckCircle2 className="w-3 h-3 text-white" />}
                                        </div>
                                        {mod.nom}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderStepFonctionnalites = () => (
        <div className="space-y-4">
            <p className="text-sm text-[var(--color-texte-muted)]">
                {t('planForm.fonctionnalites.desc', 'Fonctionnalités (feature flags) incluses dans ce plan.')}
            </p>
            <div className="space-y-2">
                {fonctionnalitesList.map(flag => {
                    const enabled = form.entitlements.fonctionnalites.includes(flag.key);
                    return (
                        <button
                            key={flag.key}
                            type="button"
                            onClick={() => toggleFonctionnalite(flag.key)}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border text-sm transition-colors ${
                                enabled ? 'border-[var(--color-dominante)] bg-[var(--color-dominante)]/5' : 'border-[var(--color-bordure)] hover:border-[var(--color-dominante)]/30'
                            }`}
                        >
                            <span>{flag.label}</span>
                            <div className={`w-10 h-6 rounded-full relative transition-colors ${enabled ? 'bg-[var(--color-dominante)]' : 'bg-[var(--color-surface-hover)]'}`}>
                                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                                    enabled ? 'translate-x-4.5' : 'translate-x-0.5'
                                }`} />
                            </div>
                        </button>
                    );
                })}
                {fonctionnalitesList.length === 0 && (
                    <div className="text-center py-6 text-[var(--color-texte-muted)] text-sm border border-dashed rounded-lg">
                        {t('planForm.fonctionnalites.aucune', 'Aucune fonctionnalité définie.')}
                    </div>
                )}
            </div>
        </div>
    );

    const renderStepCycles = () => (
        <div className="space-y-6">
            {/* Cycles autorisés */}
            <div>
                <h4 className="text-sm font-semibold mb-2">{t('planForm.cycles.titre', 'Cycles de facturation autorisés')}</h4>
                <p className="text-sm text-[var(--color-texte-muted)] mb-3">
                    {t('planForm.cycles.desc', 'Remises standard : trimestriel −5 %, semestriel −7,5 %, annuel −10 %.')}
                </p>
                <div className="grid grid-cols-2 gap-2">
                    {CYCLES.map(cycle => {
                        const selected = form.cyclesAutorises.includes(cycle);
                        return (
                            <button
                                key={cycle}
                                type="button"
                                onClick={() => toggleCycle(cycle)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                                    selected
                                        ? 'border-[var(--color-dominante)] bg-[var(--color-dominante)]/5 text-[var(--color-dominante)]'
                                        : 'border-[var(--color-bordure)] hover:border-[var(--color-dominante)]/50'
                                }`}
                            >
                                <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                                    selected ? 'bg-[var(--color-dominante)] border-[var(--color-dominante)]' : 'border-[var(--color-bordure)]'
                                }`}>
                                    {selected && <CheckCircle2 className="w-3 h-3 text-white" />}
                                </div>
                                {cycle.charAt(0) + cycle.slice(1).toLowerCase()}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Essai gratuit */}
            <div className="border rounded-lg p-4 space-y-3 bg-[var(--color-surface-hover)]">
                <label className="flex items-center gap-2 text-sm font-medium">
                    <input
                        type="checkbox"
                        checked={form.essai.autorise}
                        onChange={(e) => updateEssai('autorise', e.target.checked)}
                        className="w-4 h-4 rounded"
                    />
                    {t('planForm.essai.titre', 'Essai gratuit autorisé')}
                </label>
                {form.essai.autorise && (
                    <div className="w-40">
                        <label className="block text-xs text-[var(--color-texte-muted)] mb-1">
                            {t('planForm.essai.duree', 'Durée (jours)')}
                        </label>
                        <input
                            type="number"
                            value={form.essai.dureeJours}
                            onChange={(e) => updateEssai('dureeJours', Number(e.target.value))}
                            className={inputClass}
                            min={1}
                        />
                    </div>
                )}
            </div>
        </div>
    );

    const renderStepResume = () => (
        <div className="space-y-4">
            <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{form.nom || t('planForm.resume.nouveauPlan')}</h3>
                    <div className="flex items-center gap-2">
                        {form.estParDefaut && <span className="text-xs bg-[var(--color-dominante)]/10 text-[var(--color-dominante)] px-2 py-1 rounded-full">{t('planForm.resume.parDefaut', 'Par défaut')}</span>}
                        {form.badge && <span className="text-xs bg-[var(--color-dominante)]/10 text-[var(--color-dominante)] px-2 py-1 rounded-full">{form.badge}</span>}
                    </div>
                </div>
                <p className="text-sm text-[var(--color-texte-muted)]">{form.description || t('planForm.resume.pasDescription')}</p>
                <div className="text-2xl font-bold">{formatPrice(form.prixBase, form.devise)}<span className="text-sm font-normal text-[var(--color-texte-muted)]">{t('planForm.resume.mois')}</span></div>
            </div>

            {/* Tarification */}
            <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="border rounded-lg p-3">
                    <span className="text-[var(--color-texte-muted)]">{t('planForm.tarification.prixParEleve', 'Prix par élève sup.')}</span>
                    <div className="font-semibold">{formatPrice(form.tarification.prixParEleve, form.devise)}</div>
                </div>
                <div className="border rounded-lg p-3">
                    <span className="text-[var(--color-texte-muted)]">{t('planForm.tarification.franchise', 'Franchise élèves')}</span>
                    <div className="font-semibold">{form.tarification.elevesInclusGratuits}</div>
                </div>
                <div className="border rounded-lg p-3">
                    <span className="text-[var(--color-texte-muted)]">{t('planForm.tarification.paliers', 'Paliers')}</span>
                    <div className="font-semibold">{form.tarification.paliers.length}</div>
                </div>
            </div>

            {/* Quotas */}
            <div className="grid grid-cols-2 gap-3 text-sm">
                {RESSOURCES_QUOTA.map(({ cle, labelKey, defaut }) => (
                    <div key={cle} className="border rounded-lg p-3">
                        <span className="text-[var(--color-texte-muted)]">{t(labelKey, defaut)}</span>
                        <div className="font-semibold">{formatQuota(form.quotas[cle] ?? 0)}</div>
                    </div>
                ))}
            </div>

            {/* Modules inclus */}
            <div className="border rounded-lg p-3">
                <span className="text-sm text-[var(--color-texte-muted)]">{t('planForm.resume.modulesInclus', { count: form.entitlements.modules.length })}</span>
                <div className="flex flex-wrap gap-1 mt-2">
                    {form.entitlements.modules.map(m => {
                        const mod = modulesCatalogue.find(mc => mc.id === m);
                        return <span key={m} className="text-xs bg-[var(--color-surface-hover)] px-2 py-0.5 rounded text-[var(--color-texte)]">{mod?.nom || m}</span>;
                    })}
                </div>
            </div>

            {/* Fonctionnalités incluses */}
            {form.entitlements.fonctionnalites.length > 0 && (
                <div className="border rounded-lg p-3">
                    <span className="text-sm text-[var(--color-texte-muted)]">
                        {t('planForm.resume.fonctionnalitesIncluses', { count: form.entitlements.fonctionnalites.length, defaultValue: '{{count}} fonctionnalités incluses' })}
                    </span>
                    <div className="flex flex-wrap gap-1 mt-2">
                        {form.entitlements.fonctionnalites.map(f => {
                            const flag = fonctionnalitesList.find(fl => fl.key === f);
                            return (
                                <span key={f} className="text-[var(--color-info-700)] bg-[var(--color-info-100)] px-2 py-0.5 rounded" style={{ fontSize: 'clamp(0.6875rem, 0.6rem + 0.3vw, 0.75rem)' }}>
                                    {flag?.label || f}
                                </span>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Cycles & essai */}
            <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="border rounded-lg p-3">
                    <span className="text-[var(--color-texte-muted)]">{t('planForm.cycles.titre', 'Cycles autorisés')}</span>
                    <div className="font-semibold">
                        {form.cyclesAutorises.map(c => c.charAt(0) + c.slice(1).toLowerCase()).join(', ') || '—'}
                    </div>
                </div>
                <div className="border rounded-lg p-3">
                    <span className="text-[var(--color-texte-muted)]">{t('planForm.essai.titre', 'Essai gratuit')}</span>
                    <div className="font-semibold">
                        {form.essai.autorise ? `${form.essai.dureeJours} jours` : t('common:non', 'Non')}
                    </div>
                </div>
            </div>
        </div>
    );

    const stepRenderers = [
        renderStepInfos,
        renderStepTarification,
        renderStepQuotas,
        renderStepModules,
        renderStepFonctionnalites,
        renderStepCycles,
        renderStepResume,
    ];

    const footer = (
        <div className="flex items-center justify-between w-full">
            <button
                type="button"
                onClick={handlePrev}
                disabled={step === 0 || isSubmitting}
                className="flex items-center gap-1 px-4 py-2 text-sm text-[var(--color-texte-muted)] hover:text-[var(--color-texte)] disabled:opacity-50"
            >
                <ArrowLeft className="w-4 h-4" />
                {t('planForm.precedent')}
            </button>
            <span className="text-xs text-[var(--color-texte-muted)]">{t('planForm.etape', { current: step + 1, total: STEPS.length })}</span>
            {step < STEPS.length - 1 ? (
                <button
                    type="button"
                    onClick={handleNext}
                    disabled={!canNext}
                    className="flex items-center gap-1 px-4 py-2 text-sm bg-[var(--color-dominante)] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                >
                    {t('planForm.suivant')}
                    <ArrowRight className="w-4 h-4" />
                </button>
            ) : (
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex items-center gap-1 px-4 py-2 text-sm bg-[var(--color-dominante)] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    {mode === 'create' ? t('planForm.creer') : t('common:enregistrer', 'Enregistrer')}
                </button>
            )}
        </div>
    );

    return (
        <CustomModal
            open={open}
            onOpenChange={onOpenChange}
            title={mode === 'create' ? t('planForm.nouveau') : t('planForm.modifier', { nom: form.nom })}
            description={STEPS[step]?.label}
            size="2xl"
            footer={footer}
            closeOnOverlayClick={!isSubmitting}
        >
            <div className="space-y-4">
                {/* Error */}
                {error && (
                    <div className="flex items-center gap-2 p-3 bg-[var(--color-danger-50)] text-[var(--color-danger-700)] rounded-[var(--radius-lg)]" style={{ fontSize: 'clamp(0.75rem, 0.65rem + 0.3vw, 0.875rem)' }}>
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {error}
                    </div>
                )}

                {/* Stepper */}
                <div className="flex items-center gap-1 flex-wrap">
                    {STEPS.map((s, i) => {
                        const Icon = s.icon;
                        return (
                            <button
                                key={s.key}
                                type="button"
                                onClick={() => !isSubmitting && setStep(i)}
                                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                                    i === step
                                        ? 'bg-[var(--color-dominante)] text-white font-medium'
                                        : i < step
                                            ? 'bg-[var(--color-dominante)]/10 text-[var(--color-dominante)]'
                                            : 'text-[var(--color-texte-muted)] hover:bg-[var(--color-surface-hover)]'
                                }`}
                                disabled={isSubmitting}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">{s.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Step Content */}
                {stepRenderers[step]?.()}
            </div>
        </CustomModal>
    );
}

export default PlanFormModal;
