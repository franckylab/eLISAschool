/**
 * ==================================
 * eLISAschool - Etablissement Form Modal
 * ==================================
 * 
 * Modal multi-étapes pour créer/éditer un établissement client.
 * 4 étapes : Infos → Plan → Options → Résumé
 * 
 * Phase P2.2 — Refonte SaaS v4
 */

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { CustomModal } from '@/components/modals/CustomModal';
import {
    Building2,
    Package,
    Puzzle,
    CheckCircle2,
    ArrowRight,
    ArrowLeft,
    Loader2,
    AlertCircle,
} from 'lucide-react';

// =============================================
// Types
// =============================================

interface EtablissementFormData {
    nom: string;
    code: string;
    type: string;
    adresse: string;
    telephone: string;
    email: string;
    planId: string;
    cycleFacturation: string;
    modulesAdditionnels: string[];
    featureFlagsOverride: Record<string, boolean>;
}

interface EtablissementFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    etablissement?: any;
    mode: 'create' | 'edit';
}

interface PlanOption {
    id: string;
    nom: string;
    prixBase: number;
    devise: string;
    maxEleves: number;
}

// =============================================
// Constants
// =============================================

const TYPES_ETABLISSEMENT = [
    { value: 'PRIVE', label: 'Privé' },
    { value: 'PUBLIC', label: 'Public' },
    { value: 'CONFESIONNEL', label: 'Confessionnel' },
    { value: 'INTERNATIONAL', label: 'International' },
];

const CYCLES_FACTURATION = [
    { value: 'MENSUEL', label: 'Mensuel' },
    { value: 'TRIMESTRIEL', label: 'Trimestriel' },
    { value: 'SEMESTRIEL', label: 'Semestriel' },
    { value: 'ANNUEL', label: 'Annuel' },
];

const STEPS = [
    { key: 'infos', label: 'Infos', icon: Building2 },
    { key: 'plan', label: 'Plan', icon: Package },
    { key: 'options', label: 'Options', icon: Puzzle },
    { key: 'resume', label: 'Résumé', icon: CheckCircle2 },
];

const DEFAULT_FORM: EtablissementFormData = {
    nom: '',
    code: '',
    type: 'PRIVE',
    adresse: '',
    telephone: '',
    email: '',
    planId: '',
    cycleFacturation: 'MENSUEL',
    modulesAdditionnels: [],
    featureFlagsOverride: {},
};

// =============================================
// Component
// =============================================

export function EtablissementFormModal({ open, onOpenChange, etablissement, mode }: EtablissementFormModalProps) {
    const { t } = useTranslation('admin');
    const queryClient = useQueryClient();
    const [step, setStep] = useState(0);
    const [form, setForm] = useState<EtablissementFormData>(() => ({
        ...DEFAULT_FORM,
        ...etablissement,
    }));
    const [error, setError] = useState<string | null>(null);

    // Fetch plans disponibles
    const { data: plans } = useQuery<PlanOption[] | undefined>({
        queryKey: ['platform-plans-options'],
        queryFn: async () => {
            const res = await apiClient.get<PlanOption[]>('/api/platform/facturation/plans');
            return res.data;
        },
    });

    const createMutation = useMutation({
        mutationFn: async (data: EtablissementFormData) => {
            const res = await apiClient.post<any>('/api/platform/etablissements', data);
            // Souscrire au plan si sélectionné
            if (data.planId && res.data?.id) {
                await apiClient.post('/api/platform/facturation/abonnements', {
                    etablissementId: res.data.id,
                    planId: data.planId,
                    cycleFacturation: data.cycleFacturation,
                });
            }
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['platform-etablissements-stats'] });
            queryClient.invalidateQueries({ queryKey: ['platform-abonnements'] });
            onOpenChange(false);
            resetForm();
        },
        onError: (err: any) => setError(err?.response?.data?.message || t('etablissementForm.erreurCreation')),
    });

    const isSubmitting = createMutation.isPending;

    const resetForm = useCallback(() => {
        setStep(0);
        setForm({ ...DEFAULT_FORM });
        setError(null);
    }, []);

    const updateField = useCallback(<K extends keyof EtablissementFormData>(key: K, value: EtablissementFormData[K]) => {
        setForm(prev => ({ ...prev, [key]: value }));
    }, []);

    const canNext = step === 0 ? form.nom.trim().length > 0 : true;
    const handleNext = () => { if (canNext && step < STEPS.length - 1) setStep(s => s + 1); };
    const handlePrev = () => { if (step > 0) setStep(s => s - 1); };

    const handleSubmit = () => {
        setError(null);
        createMutation.mutate(form);
    };

    const selectedPlan = plans?.find(p => p.id === form.planId);

    // =============================================
    // Step Renderers
    // =============================================

    const renderStepInfos = () => (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium mb-1">{t('etablissementForm.infos.nom')}</label>
                <input
                    type="text"
                    value={form.nom}
                    onChange={(e) => updateField('nom', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-[var(--color-surface)]"
                    placeholder={t('etablissementForm.infos.nomPlaceholder')}
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1">{t('etablissementForm.infos.code')}</label>
                    <input
                        type="text"
                        value={form.code}
                        onChange={(e) => updateField('code', e.target.value.toUpperCase())}
                        className="w-full px-3 py-2 border rounded-lg text-sm bg-[var(--color-surface)] font-mono"
                        placeholder={t('etablissementForm.infos.codePlaceholder')}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">{t('etablissementForm.infos.type')}</label>
                    <select
                        value={form.type}
                        onChange={(e) => updateField('type', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm bg-[var(--color-surface)]"
                    >
                        {TYPES_ETABLISSEMENT.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                    </select>
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">{t('etablissementForm.infos.adresse')}</label>
                <input
                    type="text"
                    value={form.adresse}
                    onChange={(e) => updateField('adresse', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-[var(--color-surface)]"
                    placeholder={t('etablissementForm.infos.adressePlaceholder')}
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1">{t('etablissementForm.infos.telephone')}</label>
                    <input
                        type="tel"
                        value={form.telephone}
                        onChange={(e) => updateField('telephone', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm bg-[var(--color-surface)]"
                        placeholder="+237 6XX XXX XXX"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">{t('etablissementForm.infos.email')}</label>
                    <input
                        type="email"
                        value={form.email}
                        onChange={(e) => updateField('email', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm bg-[var(--color-surface)]"
                        placeholder="contact@etablissement.com"
                    />
                </div>
            </div>
        </div>
    );

    const renderStepPlan = () => (
        <div className="space-y-4">
            <p className="text-sm text-[var(--color-texte-muted)]">{t('etablissementForm.plan.desc')}</p>
            <div className="grid gap-3">
                {plans?.map(plan => (
                    <button
                        key={plan.id}
                        type="button"
                        onClick={() => updateField('planId', plan.id)}
                        className={`flex items-center justify-between p-4 rounded-lg border text-left transition-colors ${
                            form.planId === plan.id
                                ? 'border-[var(--color-dominant-600)] ring-1 ring-[var(--color-dominant-600)]'
                                : 'border-[var(--color-bordure)] hover:border-[var(--color-dominant-300)]'
                        }`}
                        style={form.planId === plan.id ? { backgroundColor: 'color-mix(in srgb, var(--color-dominant-600) 5%, transparent)' } : undefined}
                    >
                        <div>
                            <div className="font-medium">{plan.nom}</div>
                            <div className="text-sm text-[var(--color-texte-muted)]">
                                {t('etablissementForm.plan.maxEleves', { max: plan.maxEleves })}
                            </div>
                        </div>
                        <div className="text-lg font-bold">
                            {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: plan.devise, minimumFractionDigits: 0 }).format(plan.prixBase)}
                            <span className="text-xs font-normal text-[var(--color-texte-muted)]">{t('etablissementForm.plan.mois')}</span>
                        </div>
                    </button>
                ))}
                {(!plans || plans.length === 0) && (
                    <div className="text-center py-8 text-[var(--color-texte-muted)] text-sm border border-dashed rounded-lg">
                        {t('etablissementForm.plan.aucun')}
                    </div>
                )}
            </div>
            {form.planId && (
                <div>
                    <label className="block text-sm font-medium mb-1">{t('etablissementForm.plan.cycle')}</label>
                    <select
                        value={form.cycleFacturation}
                        onChange={(e) => updateField('cycleFacturation', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm bg-[var(--color-surface)]"
                    >
                        {CYCLES_FACTURATION.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                </div>
            )}
        </div>
    );

    const renderStepOptions = () => (
        <div className="space-y-4">
            <p className="text-sm text-[var(--color-texte-muted)]">{t('etablissementForm.options.desc')}</p>
            <div className="border border-dashed rounded-lg p-6 text-center text-sm text-[var(--color-texte-muted)]">
                {t('etablissementForm.options.info')}
            </div>
        </div>
    );

    const renderStepResume = () => (
        <div className="space-y-4">
            <div className="border rounded-lg p-4 space-y-2">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    {form.nom || t('etablissementForm.resume.nouvelEtab')}
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-[var(--color-texte-muted)]">Code:</span> <span className="font-mono">{form.code || '-'}</span></div>
                    <div><span className="text-[var(--color-texte-muted)]">Type:</span> {TYPES_ETABLISSEMENT.find(t => t.value === form.type)?.label}</div>
                    <div><span className="text-[var(--color-texte-muted)]">Adresse:</span> {form.adresse || '-'}</div>
                    <div><span className="text-[var(--color-texte-muted)]">Téléphone:</span> {form.telephone || '-'}</div>
                    <div className="col-span-2"><span className="text-[var(--color-texte-muted)]">Email:</span> {form.email || '-'}</div>
                </div>
            </div>
            {selectedPlan && (
                <div className="border rounded-lg p-4 space-y-2">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        {t('etablissementForm.resume.abonnement')}
                    </h4>
                    <div className="text-sm">
                        <div><span className="text-[var(--color-texte-muted)]">{t('etablissementForm.resume.plan')}</span> <span className="font-medium">{selectedPlan.nom}</span></div>
                        <div><span className="text-[var(--color-texte-muted)]">{t('etablissementForm.resume.cycle')}</span> {CYCLES_FACTURATION.find(c => c.value === form.cycleFacturation)?.label}</div>
                        <div className="text-lg font-bold mt-1">
                            {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: selectedPlan.devise, minimumFractionDigits: 0 }).format(selectedPlan.prixBase)}
                            <span className="text-xs font-normal text-[var(--color-texte-muted)]">/{form.cycleFacturation === 'MENSUEL' ? t('etablissementForm.resume.mois') : t('etablissementForm.resume.periode')}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    const stepRenderers = [renderStepInfos, renderStepPlan, renderStepOptions, renderStepResume];

    const footer = (
        <div className="flex items-center justify-between w-full">
            <button
                type="button"
                onClick={handlePrev}
                disabled={step === 0 || isSubmitting}
                className="flex items-center gap-1 px-4 py-2 text-sm text-[var(--color-texte-muted)] hover:text-[var(--color-texte)] disabled:opacity-50"
            >
                <ArrowLeft className="w-4 h-4" />
                {t('etablissementForm.precedent')}
            </button>
            <span className="text-xs text-[var(--color-texte-muted)]">{t('etablissementForm.etape', { current: step + 1, total: STEPS.length })}</span>
            {step < STEPS.length - 1 ? (
                <button
                    type="button"
                    onClick={handleNext}
                    disabled={!canNext}
                    className="flex items-center gap-1 px-4 py-2 text-sm rounded-lg hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: 'var(--color-dominant-600)', color: '#fff' }}
                >
                    {t('etablissementForm.suivant')}
                    <ArrowRight className="w-4 h-4" />
                </button>
            ) : (
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex items-center gap-1 px-4 py-2 text-sm rounded-lg hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: 'var(--color-dominant-600)', color: '#fff' }}
                >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    {mode === 'create' ? t('etablissementForm.creer') : t('common:enregistrer', 'Enregistrer')}
                </button>
            )}
        </div>
    );

    return (
        <CustomModal
            open={open}
            onOpenChange={onOpenChange}
            title={mode === 'create' ? t('etablissementForm.nouveau') : t('etablissementForm.modifier', { nom: form.nom })}
            description={STEPS[step]?.label}
            size="xl"
            footer={footer}
            closeOnOverlayClick={!isSubmitting}
        >
            <div className="space-y-4">
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
                                        ? 'font-medium'
                                        : i < step
                                            ? ''
                                            : 'text-[var(--color-texte-muted)] hover:bg-[var(--color-surface-hover)]'
                                }`}
                                style={i === step ? { backgroundColor: 'var(--color-dominant-600)', color: '#fff' } : i < step ? { backgroundColor: 'color-mix(in srgb, var(--color-dominant-600) 10%, transparent)', color: 'var(--color-dominant-600)' } : undefined}
                                disabled={isSubmitting}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                {s.label}
                            </button>
                        );
                    })}
                </div>

                {stepRenderers[step]?.()}
            </div>
        </CustomModal>
    );
}

export default EtablissementFormModal;
