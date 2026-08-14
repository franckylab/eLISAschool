/**
 * ==================================
 * eLISAschool - Plan Form Modal
 * ==================================
 * 
 * Modal multi-étapes pour créer/éditer un plan d'abonnement.
 * 6 étapes : Infos base → Quotas → Modules → Tranches → Feature Flags → Résumé
 * 
 * Phase P2.1 — Refonte SaaS v4
 */

import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { CustomModal } from '@/components/modals/CustomModal';
import {
    Package,
    Users,
    Puzzle,
    Layers,
    ToggleLeft,
    CheckCircle2,
    ArrowRight,
    ArrowLeft,
    Plus,
    Trash2,
    GripVertical,
    Loader2,
    AlertCircle,
} from 'lucide-react';

// =============================================
// Types
// =============================================

interface TrancheData {
    id?: string;
    minEleves: number;
    maxEleves: number | null;
    montantSupplementaire: number;
    label: string;
}

interface PlanFormData {
    nom: string;
    slug: string;
    description: string;
    prixBase: number;
    devise: string;
    maxEleves: number;
    maxUtilisateurs: number;
    maxClasses: number;
    stockageMaxGo: number;
    smsInclus: number;
    modulesInclus: string[];
    featureFlags: Record<string, boolean>;
    badge: string;
    tranches: TrancheData[];
    // Lot B v7 — Tranches hybride
    modeFacturationTranches: 'auto' | 'declarative';
    toleranceDepassement: number;
    prorataImmediat: boolean;
    blocageAuDela: boolean;
    plafondMaxEleves: number | null;
}

interface PlanFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    plan?: Partial<PlanFormData> & { id?: string };
    mode: 'create' | 'edit';
}

// =============================================
// Constants (fallback si API indisponible — Migration 210)
// =============================================

const MODULES_CATALOG_FALLBACK = [
    // Base (gratuits)
    { id: 'eleves', nom: 'Gestion Élèves', categorie: 'base' },
    { id: 'notes', nom: 'Notes & Bulletins', categorie: 'base' },
    { id: 'emploi-temps', nom: 'Emploi du Temps', categorie: 'base' },
    { id: 'cantine', nom: 'Cantine', categorie: 'base' },
    { id: 'transport', nom: 'Transport', categorie: 'base' },
    // Premium
    { id: 'gamification', nom: 'Gamification', categorie: 'premium' },
    { id: 'suivi-personnel', nom: 'Suivi Personnel', categorie: 'premium' },
    { id: 'examens', nom: 'Examens Nationaux', categorie: 'premium' },
    { id: 'orientation', nom: 'Orientation', categorie: 'premium' },
    { id: 'bibliotheque', nom: 'Bibliothèque', categorie: 'premium' },
    { id: 'comptabilite', nom: 'Comptabilité', categorie: 'premium' },
    { id: 'rh', nom: 'Ressources Humaines', categorie: 'premium' },
    // Add-on
    { id: 'sondages', nom: 'Sondages', categorie: 'addon' },
    { id: 'parking', nom: 'Parking', categorie: 'addon' },
    { id: 'diplomes', nom: 'Diplômes', categorie: 'addon' },
    { id: 'recrutement', nom: 'Recrutement', categorie: 'addon' },
];

const FEATURE_FLAGS_FALLBACK = [
    { key: 'multi_etablissement', label: 'Multi-établissement' },
    { key: 'export_pdf', label: 'Export PDF' },
    { key: 'api_rest', label: 'API REST publique' },
    { key: 'webhooks', label: 'Webhooks' },
    { key: 'sso', label: 'Single Sign-On (SSO)' },
    { key: 'white_label', label: 'White Label' },
    { key: 'backup_auto', label: 'Backup automatique' },
    { key: 'monitoring_advanced', label: 'Monitoring avancé' },
];

const DEVISES = ['XAF', 'XOF', 'EUR', 'USD'];

const STEPS = [
    { key: 'infos', label: 'Infos', icon: Package },
    { key: 'quotas', label: 'Quotas', icon: Users },
    { key: 'modules', label: 'Modules', icon: Puzzle },
    { key: 'tranches', label: 'Tranches', icon: Layers },
    { key: 'flags', label: 'Flags', icon: ToggleLeft },
    { key: 'resume', label: 'Résumé', icon: CheckCircle2 },
];

const DEFAULT_FORM: PlanFormData = {
    nom: '',
    slug: '',
    description: '',
    prixBase: 0,
    devise: 'XAF',
    maxEleves: 300,
    maxUtilisateurs: 0,
    maxClasses: 0,
    stockageMaxGo: 5,
    smsInclus: 100,
    modulesInclus: ['eleves', 'notes', 'emploi-temps'],
    featureFlags: {},
    badge: '',
    tranches: [],
    // Lot B v7 — Tranches hybride
    modeFacturationTranches: 'auto',
    toleranceDepassement: 10,
    prorataImmediat: true,
    blocageAuDela: false,
    plafondMaxEleves: null,
};

// =============================================
// Component
// =============================================

export function PlanFormModal({ open, onOpenChange, plan, mode }: PlanFormModalProps) {
    const { t } = useTranslation('admin');
    const queryClient = useQueryClient();
    const [step, setStep] = useState(0);
    const [form, setForm] = useState<PlanFormData>(() => ({
        ...DEFAULT_FORM,
        ...plan,
        tranches: plan?.tranches || [],
        modulesInclus: plan?.modulesInclus || DEFAULT_FORM.modulesInclus,
        featureFlags: plan?.featureFlags || {},
    }));
    const [error, setError] = useState<string | null>(null);

    // Données dynamiques (Migration 210 — remplacement hardcodage)
    const { data: dynamicModules } = useQuery({
        queryKey: ['modules-catalogue'],
        queryFn: async () => {
            const res = await apiClient.get<{ success: boolean; data: any[] }>('/api/platform/facturation/modules/catalogue');
            return res.data;
        },
        staleTime: 60 * 1000,
    });

    const { data: dynamicFlags } = useQuery({
        queryKey: ['feature-flag-definitions'],
        queryFn: async () => {
            const res = await apiClient.get<{ success: boolean; data: any[] }>('/api/platform/facturation/feature-flags/definitions');
            return res.data;
        },
        staleTime: 60 * 1000,
    });

    // Mapper les modules dynamiques au format du formulaire
    const modulesCatalogue = dynamicModules && dynamicModules.length > 0
        ? dynamicModules.map((m: any) => ({
            id: m.code,
            nom: m.nom,
            categorie: m.categorie,
        }))
        : MODULES_CATALOG_FALLBACK;

    // Mapper les flags dynamiques au format du formulaire
    const featureFlagsList = dynamicFlags && dynamicFlags.length > 0
        ? dynamicFlags.map((f: any) => ({
            key: f.cle,
            label: f.label,
        }))
        : FEATURE_FLAGS_FALLBACK;

    // Mutations
    const createMutation = useMutation({
        mutationFn: async (data: PlanFormData) => {
            const { tranches, ...planData } = data;
            const res = await apiClient.post<any>('/api/platform/facturation/plans', planData);
            const planId = res.data.id;
            // Créer les tranches une par une
            for (const tranche of tranches) {
                await apiClient.post(`/api/platform/facturation/plans/${planId}/tranches`, tranche);
            }
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['platform-plans'] });
            onOpenChange(false);
            resetForm();
        },
        onError: (err: any) => setError(err?.response?.data?.message || t('planForm.erreurCreation')),
    });

    const updateMutation = useMutation({
        mutationFn: async (data: PlanFormData) => {
            const { tranches, ...planData } = data;
            const res = await apiClient.put<{ success: boolean; data: any }>(`/api/platform/facturation/plans/${plan?.id}`, planData);
            // Synchroniser les tranches : supprimer toutes les existantes puis recréer
            await apiClient.delete(`/api/platform/facturation/plans/${plan?.id}/tranches`);
            for (const tranche of tranches) {
                await apiClient.post(`/api/platform/facturation/plans/${plan?.id}/tranches`, tranche);
            }
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['platform-plans'] });
            onOpenChange(false);
            resetForm();
        },
        onError: (err: any) => setError(err?.response?.data?.message || t('planForm.erreurModification')),
    });

    const isSubmitting = createMutation.isPending || updateMutation.isPending;

    const resetForm = useCallback(() => {
        setStep(0);
        setForm({ ...DEFAULT_FORM });
        setError(null);
    }, []);

    const updateField = useCallback(<K extends keyof PlanFormData>(key: K, value: PlanFormData[K]) => {
        setForm(prev => ({ ...prev, [key]: value }));
    }, []);

    // Auto-generate slug from nom
    const generateSlug = useCallback((nom: string) => {
        return nom.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }, []);

    // Tranches management
    const addTranche = useCallback(() => {
        setForm(prev => ({
            ...prev,
            tranches: [...prev.tranches, { minEleves: 0, maxEleves: null, montantSupplementaire: 0, label: '' }],
        }));
    }, []);

    const updateTranche = useCallback((index: number, field: keyof TrancheData, value: any) => {
        setForm(prev => {
            const tranches = [...prev.tranches];
            tranches[index] = { ...tranches[index], [field]: value };
            return { ...prev, tranches };
        });
    }, []);

    const removeTranche = useCallback((index: number) => {
        setForm(prev => ({
            ...prev,
            tranches: prev.tranches.filter((_, i) => i !== index),
        }));
    }, []);

    // Module toggle
    const toggleModule = useCallback((moduleId: string) => {
        setForm(prev => ({
            ...prev,
            modulesInclus: prev.modulesInclus.includes(moduleId)
                ? prev.modulesInclus.filter(m => m !== moduleId)
                : [...prev.modulesInclus, moduleId],
        }));
    }, []);

    // Feature flag toggle
    const toggleFlag = useCallback((flagKey: string) => {
        setForm(prev => ({
            ...prev,
            featureFlags: { ...prev.featureFlags, [flagKey]: !prev.featureFlags[flagKey] },
        }));
    }, []);

    // Navigation
    const canNext = useMemo(() => {
        switch (step) {
            case 0: return form.nom.trim().length > 0 && form.prixBase >= 0;
            case 1: return form.maxEleves > 0;
            case 2: return true;
            case 3: return true;
            case 4: return true;
            case 5: return true;
            default: return false;
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

    const formatPrice = (price: number, devise: string = 'XAF') => {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: devise, minimumFractionDigits: 0 }).format(price);
    };

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
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-[var(--color-surface)]"
                    placeholder={t('planForm.infos.nomPlaceholder')}
                />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">{t('planForm.infos.slug')}</label>
                <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => updateField('slug', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-background font-mono"
                    placeholder="starter, pro, enterprise"
                />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">{t('planForm.infos.description')}</label>
                <textarea
                    value={form.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-background resize-none"
                    rows={3}
                    placeholder={t('planForm.infos.descriptionPlaceholder')}
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1">{t('planForm.infos.prix')}</label>
                    <input
                        type="number"
                        value={form.prixBase}
                        onChange={(e) => updateField('prixBase', Number(e.target.value))}
                        className="w-full px-3 py-2 border rounded-lg text-sm bg-[var(--color-surface)]"
                        min={0}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">{t('planForm.infos.devise')}</label>
                    <select
                        value={form.devise}
                        onChange={(e) => updateField('devise', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm bg-[var(--color-surface)]"
                    >
                        {DEVISES.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">{t('planForm.infos.badge')}</label>
                <input
                    type="text"
                    value={form.badge}
                    onChange={(e) => updateField('badge', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-[var(--color-surface)]"
                    placeholder={t('planForm.infos.badgePlaceholder')}
                />
            </div>
        </div>
    );

    const renderStepQuotas = () => (
        <div className="space-y-4">
            <p className="text-sm text-[var(--color-texte-muted)]">{t('planForm.quotas.desc')}</p>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1">{t('planForm.quotas.maxEleves')}</label>
                    <input
                        type="number"
                        value={form.maxEleves}
                        onChange={(e) => updateField('maxEleves', Number(e.target.value))}
                        className="w-full px-3 py-2 border rounded-lg text-sm bg-[var(--color-surface)]"
                        min={1}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">{t('planForm.quotas.maxUsers')}</label>
                    <input
                        type="number"
                        value={form.maxUtilisateurs}
                        onChange={(e) => updateField('maxUtilisateurs', Number(e.target.value))}
                        className="w-full px-3 py-2 border rounded-lg text-sm bg-[var(--color-surface)]"
                        min={0}
                    />
                    <span className="text-xs text-[var(--color-texte-muted)]">{t('planForm.quotas.illimite')}</span>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">{t('planForm.quotas.maxClasses')}</label>
                    <input
                        type="number"
                        value={form.maxClasses}
                        onChange={(e) => updateField('maxClasses', Number(e.target.value))}
                        className="w-full px-3 py-2 border rounded-lg text-sm bg-[var(--color-surface)]"
                        min={0}
                    />
                    <span className="text-xs text-[var(--color-texte-muted)]">{t('planForm.quotas.illimite')}</span>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">{t('planForm.quotas.stockage')}</label>
                    <input
                        type="number"
                        value={form.stockageMaxGo}
                        onChange={(e) => updateField('stockageMaxGo', Number(e.target.value))}
                        className="w-full px-3 py-2 border rounded-lg text-sm bg-[var(--color-surface)]"
                        min={0}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">{t('planForm.quotas.sms')}</label>
                    <input
                        type="number"
                        value={form.smsInclus}
                        onChange={(e) => updateField('smsInclus', Number(e.target.value))}
                        className="w-full px-3 py-2 border rounded-lg text-sm bg-[var(--color-surface)]"
                        min={0}
                    />
                </div>
            </div>
        </div>
    );

    const renderStepModules = () => {
        const categories = [
            { key: 'base', label: t('planForm.modules.base'), color: 'text-[var(--color-success-600)]' },
            { key: 'premium', label: t('planForm.modules.premium'), color: 'text-[var(--color-info-600)]' },
            { key: 'addon', label: t('planForm.modules.addon'), color: 'text-[var(--color-accent-600)]' },
        ];

        return (
            <div className="space-y-4">
                <p className="text-sm text-[var(--color-texte-muted)]">{t('planForm.modules.desc')}</p>
                {categories.map(cat => (
                    <div key={cat.key}>
                        <h4 className={`text-sm font-semibold mb-2 ${cat.color}`}>{cat.label}</h4>
                        <div className="grid grid-cols-2 gap-2">
                            {modulesCatalogue.filter(m => m.categorie === cat.key).map(mod => {
                                const selected = form.modulesInclus.includes(mod.id);
                                return (
                                    <button
                                        key={mod.id}
                                        type="button"
                                        onClick={() => toggleModule(mod.id)}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm text-left transition-colors ${
                                            selected
                                                ? 'border-primary bg-primary/5 text-primary'
                                                : 'border-border hover:border-primary/50'
                                        }`}
                                    >
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                                            selected ? 'bg-primary border-primary' : 'border-border'
                                        }`}>
                                            {selected && <CheckCircle2 className="w-3 h-3 text-primary-foreground" />}
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

    const renderStepTranches = () => (
        <div className="space-y-6">
            {/* Lot B v7 — Mode & Règles de facturation */}
            <div className="border rounded-lg p-4 space-y-4 bg-[var(--color-surface-hover)]">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-[var(--color-info-600)]" />
                    {t('planForm.tranches.modeTitre')}
                </h4>
                <div className="grid grid-cols-2 gap-4">
                    {/* Mode de facturation */}
                    <div>
                        <label className="text-xs text-[var(--color-texte-muted)]">{t('planForm.tranches.mode')}</label>
                        <select
                            value={form.modeFacturationTranches}
                            onChange={(e) => setForm(f => ({ ...f, modeFacturationTranches: e.target.value as 'auto' | 'declarative' }))}
                            className="w-full px-2 py-1.5 border rounded text-sm bg-[var(--color-surface)]"
                        >
                            <option value="auto">{t('planForm.tranches.modeAuto')}</option>
                            <option value="declarative">{t('planForm.tranches.modeDeclaratif')}</option>
                        </select>
                        <p className="text-xs text-[var(--color-texte-muted)] mt-1">
                            {form.modeFacturationTranches === 'auto'
                                ? t('planForm.tranches.modeAutoDesc')
                                : t('planForm.tranches.modeDeclaratifDesc')}
                        </p>
                    </div>
                    {/* Plafond max élèves */}
                    <div>
                        <label className="text-xs text-[var(--color-texte-muted)]">{t('planForm.tranches.plafondMax')}</label>
                        <input
                            type="number"
                            value={form.plafondMaxEleves ?? ''}
                            onChange={(e) => setForm(f => ({ ...f, plafondMaxEleves: e.target.value ? Number(e.target.value) : null }))}
                            className="w-full px-2 py-1.5 border rounded text-sm bg-[var(--color-surface)]"
                            min={form.maxEleves}
                            placeholder="∞"
                        />
                        <p className="text-xs text-[var(--color-texte-muted)] mt-1">{t('planForm.tranches.plafondMaxDesc')}</p>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                    {/* Tolérance dépassement */}
                    <div>
                        <label className="text-xs text-[var(--color-texte-muted)]">{t('planForm.tranches.tolerance')}</label>
                        <div className="flex items-center gap-1">
                            <input
                                type="number"
                                value={form.toleranceDepassement}
                                onChange={(e) => setForm(f => ({ ...f, toleranceDepassement: Number(e.target.value) }))}
                                className="w-full px-2 py-1.5 border rounded text-sm bg-[var(--color-surface)]"
                                min={0}
                                max={100}
                            />
                            <span className="text-sm text-[var(--color-texte-muted)]">%</span>
                        </div>
                    </div>
                    {/* Prorata immédiat */}
                    <div className="flex items-center gap-2 pt-4">
                        <input
                            type="checkbox"
                            id="prorataImmediat"
                            checked={form.prorataImmediat}
                            onChange={(e) => setForm(f => ({ ...f, prorataImmediat: e.target.checked }))}
                            className="w-4 h-4 rounded border-border"
                        />
                        <label htmlFor="prorataImmediat" className="text-sm">{t('planForm.tranches.prorata')}</label>
                    </div>
                    {/* Blocage au-delà */}
                    <div className="flex items-center gap-2 pt-4">
                        <input
                            type="checkbox"
                            id="blocageAuDela"
                            checked={form.blocageAuDela}
                            onChange={(e) => setForm(f => ({ ...f, blocageAuDela: e.target.checked }))}
                            className="w-4 h-4 rounded border-border"
                        />
                        <label htmlFor="blocageAuDela" className="text-sm">{t('planForm.tranches.blocage')}</label>
                    </div>
                </div>
            </div>

            {/* Tranches de pricing */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-[var(--color-texte-muted)]">{t('planForm.tranches.desc')}</p>
                <button
                    type="button"
                    onClick={addTranche}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90"
                >
                    <Plus className="w-3.5 h-3.5" />
                    {t('planForm.tranches.ajouter')}
                </button>
            </div>

            {form.tranches.length === 0 && (
                <div className="text-center py-8 text-[var(--color-texte-muted)] text-sm border border-dashed rounded-lg">
                    {t('planForm.tranches.aucune', { max: form.maxEleves })}
                </div>
            )}

            {form.tranches.map((tranche, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3 relative">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium flex items-center gap-1">
                            <GripVertical className="w-4 h-4 text-[var(--color-texte-muted)]" />
                            {t('planForm.tranches.titre', { n: index + 1 })}
                        </span>
                        <button
                            type="button"
                            onClick={() => removeTranche(index)}
                            className="p-1 text-[var(--color-danger-500)] hover:bg-[var(--color-danger-50)] rounded"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-[var(--color-texte-muted)]">{t('planForm.tranches.elevesMin')}</label>
                            <input
                                type="number"
                                value={tranche.minEleves}
                                onChange={(e) => updateTranche(index, 'minEleves', Number(e.target.value))}
                                className="w-full px-2 py-1.5 border rounded text-sm bg-[var(--color-surface)]"
                                min={0}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-[var(--color-texte-muted)]">{t('planForm.tranches.elevesMax')}</label>
                            <input
                                type="number"
                                value={tranche.maxEleves ?? ''}
                                onChange={(e) => updateTranche(index, 'maxEleves', e.target.value ? Number(e.target.value) : null)}
                                className="w-full px-2 py-1.5 border rounded text-sm bg-[var(--color-surface)]"
                                min={0}
                                placeholder="∞"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-[var(--color-texte-muted)]">{t('planForm.tranches.montant')}</label>
                            <input
                                type="number"
                                value={tranche.montantSupplementaire}
                                onChange={(e) => updateTranche(index, 'montantSupplementaire', Number(e.target.value))}
                                className="w-full px-2 py-1.5 border rounded text-sm bg-[var(--color-surface)]"
                                min={0}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-[var(--color-texte-muted)]">{t('planForm.tranches.label')}</label>
                            <input
                                type="text"
                                value={tranche.label}
                                onChange={(e) => updateTranche(index, 'label', e.target.value)}
                                className="w-full px-2 py-1.5 border rounded text-sm bg-[var(--color-surface)]"
                                placeholder={t('planForm.tranches.labelPlaceholder')}
                            />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    const renderStepFlags = () => (
        <div className="space-y-4">
            <p className="text-sm text-[var(--color-texte-muted)]">{t('planForm.flags.desc')}</p>
            <div className="space-y-2">
                {featureFlagsList.map(flag => {
                    const enabled = form.featureFlags[flag.key] || false;
                    return (
                        <button
                            key={flag.key}
                            type="button"
                            onClick={() => toggleFlag(flag.key)}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border text-sm transition-colors ${
                                enabled ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                            }`}
                        >
                            <span>{flag.label}</span>
                            <div className={`w-10 h-6 rounded-full relative transition-colors ${enabled ? 'bg-primary' : 'bg-muted'}`}>
                                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                                    enabled ? 'translate-x-4.5' : 'translate-x-0.5'
                                }`} />
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );

    const renderStepResume = () => (
        <div className="space-y-4">
            <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{form.nom || t('planForm.resume.nouveauPlan')}</h3>
                    {form.badge && <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">{form.badge}</span>}
                </div>
                <p className="text-sm text-[var(--color-texte-muted)]">{form.description || t('planForm.resume.pasDescription')}</p>
                <div className="text-2xl font-bold">{formatPrice(form.prixBase, form.devise)}<span className="text-sm font-normal text-[var(--color-texte-muted)]">{t('planForm.resume.mois')}</span></div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="border rounded-lg p-3">
                    <span className="text-[var(--color-texte-muted)]">{t('planForm.resume.elevesMax')}</span>
                    <div className="font-semibold">{form.maxEleves}</div>
                </div>
                <div className="border rounded-lg p-3">
                    <span className="text-[var(--color-texte-muted)]">{t('planForm.resume.utilisateurs')}</span>
                    <div className="font-semibold">{form.maxUtilisateurs || t('planForm.resume.illimite')}</div>
                </div>
                <div className="border rounded-lg p-3">
                    <span className="text-[var(--color-texte-muted)]">{t('planForm.resume.classes')}</span>
                    <div className="font-semibold">{form.maxClasses || t('planForm.resume.illimite')}</div>
                </div>
                <div className="border rounded-lg p-3">
                    <span className="text-[var(--color-texte-muted)]">{t('planForm.resume.stockage')}</span>
                    <div className="font-semibold">{form.stockageMaxGo} Go</div>
                </div>
            </div>

            <div className="border rounded-lg p-3">
                <span className="text-sm text-[var(--color-texte-muted)]">{t('planForm.resume.modulesInclus', { count: form.modulesInclus.length })}</span>
                <div className="flex flex-wrap gap-1 mt-2">
                    {form.modulesInclus.map(m => {
                        const mod = modulesCatalogue.find(mc => mc.id === m);
                        return <span key={m} className="text-xs bg-secondary px-2 py-0.5 rounded">{mod?.nom || m}</span>;
                    })}
                </div>
            </div>

            {form.tranches.length > 0 && (
                <div className="border rounded-lg p-3">
                    <span className="text-sm text-[var(--color-texte-muted)]">{t('planForm.resume.tranches', { count: form.tranches.length })}</span>
                    <div className="mt-2 space-y-1">
                        {form.tranches.map((t, i) => (
                            <div key={i} className="text-xs flex justify-between">
                                <span>{t.label || `${t.minEleves + 1}–${t.maxEleves || '∞'} élèves`}</span>
                                <span className="font-mono">+{formatPrice(t.montantSupplementaire, form.devise)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {Object.values(form.featureFlags).some(v => v) && (
                <div className="border rounded-lg p-3">
                    <span className="text-sm text-[var(--color-texte-muted)]">{t('planForm.resume.flagsActifs')}</span>
                    <div className="flex flex-wrap gap-1 mt-2">
                        {featureFlagsList.filter(f => form.featureFlags[f.key]).map(f => (
                            <span key={f.key} className="text-[var(--color-info-700)] bg-[var(--color-info-100)] px-2 py-0.5 rounded" style={{ fontSize: 'clamp(0.6875rem, 0.6rem + 0.3vw, 0.75rem)' }}>{f.label}</span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    const stepRenderers = [renderStepInfos, renderStepQuotas, renderStepModules, renderStepTranches, renderStepFlags, renderStepResume];

    const footer = (
        <div className="flex items-center justify-between w-full">
            <button
                type="button"
                onClick={handlePrev}
                disabled={step === 0 || isSubmitting}
                className="flex items-center gap-1 px-4 py-2 text-sm text-[var(--color-texte-muted)] hover:text-foreground disabled:opacity-50"
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
                    className="flex items-center gap-1 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
                >
                    {t('planForm.suivant')}
                    <ArrowRight className="w-4 h-4" />
                </button>
            ) : (
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex items-center gap-1 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
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
                <div className="flex items-center gap-1">
                    {STEPS.map((s, i) => {
                        const Icon = s.icon;
                        return (
                            <button
                                key={s.key}
                                type="button"
                                onClick={() => !isSubmitting && setStep(i)}
                                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                                    i === step
                                        ? 'bg-primary text-primary-foreground font-medium'
                                        : i < step
                                            ? 'bg-primary/10 text-primary'
                                            : 'text-[var(--color-texte-muted)] hover:bg-muted'
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
