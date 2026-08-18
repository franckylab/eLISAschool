/**
 * ==================================
 * eLISAschool - PromotionFormModal v5.0
 * ==================================
 *
 * Modal de création/édition d'une promotion ou d'un bundle.
 * Formulaire multi-sections : identité, scope, conditions,
 * automatisation (auto-promo + planification), paliers volume.
 *
 * v5.0 — Scope QUOTA, paliers volume, auto-promotions, planification.
 *
 * Version: 5.0.0
 * Auteur: franck arlos chendjou
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, Package, Layers, Plus, Trash2 } from 'lucide-react';
import { CustomModal } from '@/components/modals/CustomModal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import {
    type Promotion,
    type BundlePromotion,
    type PalierVolume,
    ScopePromotion,
    TypePromotion,
    TypeAutoPromotion,
    DureeApplicationPromotion,
    TypeRemiseBundle,
    SCOPE_LABELS,
    TYPE_LABELS,
    DUREE_LABELS,
    AUTO_PROMO_LABELS,
    QUOTA_RESSOURCES,
} from '@/features/billing/types/promotion.types';
import { useCreatePromotion, useUpdatePromotion, useCreateBundle, useUpdateBundle, useBundles } from '../hooks/use-promotions';
import { usePlans, usePacks } from '../hooks/use-billing';
import { useModuleRegistry } from '@/features/configuration/hooks/use-configuration';
import { FormInput, FormSelect, FormCheckbox, FormMultiSelect } from './billing-form-fields';

// =============================================
// TYPES
// =============================================

interface PromotionFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Promotion existante (mode édition) ou undefined (mode création) */
    promotion?: Promotion | null;
    /** Mode bundle */
    modeBundle?: boolean;
    /** Bundle existant (mode édition) */
    bundle?: BundlePromotion | null;
}

interface CreatePromotionPayload {
    code: string;
    nom: string;
    typePromotion: TypePromotion;
    scope: ScopePromotion;
    cibleId: string | null;
    cibleRessource: string | null;
    valeur: number;
    dureeApplication: DureeApplicationPromotion;
    cumulable: boolean;
    priorite: number;
    codeCoupon: string | null;
    maxUtilisations: number | null;
    dateDebut: string;
    dateFin: string | null;
    actif: boolean;
    conditions: Record<string, number>;
    config?: {
        paliersVolume?: PalierVolume[];
        quotaRessource?: string;
        typeAutomatique?: TypeAutoPromotion;
        declencheur?: Record<string, unknown>;
        noteInterne?: string;
    };
    estProgrammee?: boolean;
    dateProgrammation?: string | null;
}

interface CreateBundlePayload {
    code: string;
    nom: string;
    description?: string;
    packIds: string[];
    typeRemise: TypeRemiseBundle;
    valeur: number;
    codeCoupon: string | null;
    dateDebut: string;
    dateFin: string | null;
    maxUtilisations: number | null;
    actif: boolean;
    priorite: number;
}

type TabMode = 'promotion' | 'bundle';

// =============================================
// COMPOSANT PRINCIPAL
// =============================================

export function PromotionFormModal({ open, onOpenChange, promotion, modeBundle, bundle }: PromotionFormModalProps) {
    const { t } = useTranslation('promotions');
    const [tab, setTab] = useState<TabMode>(modeBundle || bundle ? 'bundle' : 'promotion');

    useEffect(() => {
        if (open) setTab(modeBundle || bundle ? 'bundle' : 'promotion');
    }, [open, modeBundle, bundle]);

    const isEditPromotion = !!promotion;
    const isEditBundle = !!bundle;
    const isBundle = tab === 'bundle' || modeBundle || !!bundle;

    return (
        <CustomModal
            open={open}
            onOpenChange={onOpenChange}
            title={
                <div className="flex items-center gap-2">
                    <div className="flex rounded-lg bg-[var(--color-surface-hover)] p-0.5">
                        <button
                            onClick={() => setTab('promotion')}
                            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                                tab === 'promotion'
                                    ? 'bg-[var(--color-dominant-600)] text-white'
                                    : 'text-[var(--color-texte-muted)] hover:text-[var(--color-texte)]'
                            }`}
                        >
                            <Layers className="h-3.5 w-3.5" />
                            {t('form.ongletPromotion')}
                        </button>
                        <button
                            onClick={() => setTab('bundle')}
                            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                                tab === 'bundle'
                                    ? 'bg-[var(--color-dominant-600)] text-white'
                                    : 'text-[var(--color-texte-muted)] hover:text-[var(--color-texte)]'
                            }`}
                        >
                            <Package className="h-3.5 w-3.5" />
                            {t('form.ongletBundle')}
                        </button>
                    </div>
                </div>
            }
            size="2xl"
            draggable={false}
            resizable={false}
        >
            {tab === 'promotion' ? (
                <PromotionForm
                    promotion={promotion}
                    onSuccess={() => onOpenChange(false)}
                    onCancel={() => onOpenChange(false)}
                />
            ) : (
                <BundleForm
                    bundle={bundle}
                    onSuccess={() => onOpenChange(false)}
                    onCancel={() => onOpenChange(false)}
                />
            )}
        </CustomModal>
    );
}

// =============================================
// FORMULAIRE PROMOTION
// =============================================

function PromotionForm({ promotion, onSuccess, onCancel }: {
    promotion?: Promotion | null;
    onSuccess: () => void;
    onCancel: () => void;
}) {
    const { t } = useTranslation('promotions');
    const createMutation = useCreatePromotion();
    const updateMutation = useUpdatePromotion();
    const isEdit = !!promotion;

    // Sources de données pour le sélecteur de cible (remplace les UUIDs bruts)
    const { data: plans = [] } = usePlans();
    const { data: packs = [] } = usePacks();
    const { data: bundles = [] } = useBundles();
    const { data: moduleStates = [] } = useModuleRegistry();

    const [form, setForm] = useState({
        code: promotion?.code ?? '',
        nom: promotion?.nom ?? '',
        typePromotion: promotion?.typePromotion ?? TypePromotion.POURCENTAGE,
        scope: promotion?.scope ?? ScopePromotion.PLAN,
        cibleId: promotion?.cibleId ?? '',
        cibleRessource: promotion?.cibleRessource ?? '',
        valeur: promotion?.valeur ?? 0,
        dureeApplication: promotion?.dureeApplication ?? DureeApplicationPromotion.PREMIERE_FACTURE,
        cumulable: promotion?.cumulable ?? false,
        priorite: promotion?.priorite ?? 0,
        codeCoupon: promotion?.codeCoupon ?? '',
        maxUtilisations: promotion?.maxUtilisations ?? null as number | null,
        dateDebut: promotion?.dateDebut?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
        dateFin: promotion?.dateFin?.slice(0, 10) ?? '',
        actif: promotion?.actif ?? true,
        nombreElevesMin: promotion?.conditions?.nombreElevesMin ?? null as number | null,
        ancienneteMois: promotion?.conditions?.ancienneteMois ?? null as number | null,
        nbCycles: promotion?.conditions?.nbCycles ?? null as number | null,
        dureeGratuiteMois: promotion?.conditions?.dureeGratuiteMois ?? null as number | null,
        // v5 — Automatisation & Planification
        typeAutomatique: promotion?.config?.typeAutomatique ?? TypeAutoPromotion.MANUELLE,
        estProgrammee: promotion?.estProgrammee ?? false,
        dateProgrammation: promotion?.dateProgrammation?.slice(0, 16) ?? '',
        // v5 — Paliers & Quota
        quotaRessource: promotion?.config?.quotaRessource ?? '',
        paliersVolume: promotion?.config?.paliersVolume ?? [] as PalierVolume[],
    });

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        const conditions: Record<string, number> = {};
        if (form.nombreElevesMin) conditions.nombreElevesMin = form.nombreElevesMin;
        if (form.ancienneteMois) conditions.ancienneteMois = form.ancienneteMois;
        if (form.nbCycles) conditions.nbCycles = form.nbCycles;
        if (form.dureeGratuiteMois) conditions.dureeGratuiteMois = form.dureeGratuiteMois;

        // v5 — Config (paliers, quota, auto-promo)
        const config: CreatePromotionPayload['config'] = {};
        if (form.paliersVolume.length > 0) config.paliersVolume = form.paliersVolume;
        if (form.quotaRessource) config.quotaRessource = form.quotaRessource;
        if (form.typeAutomatique !== TypeAutoPromotion.MANUELLE) config.typeAutomatique = form.typeAutomatique;

        const payload: CreatePromotionPayload = {
            code: form.code,
            nom: form.nom,
            typePromotion: form.typePromotion,
            scope: form.scope,
            cibleId: form.cibleId || null,
            cibleRessource: form.cibleRessource || null,
            valeur: form.valeur,
            dureeApplication: form.dureeApplication,
            cumulable: form.cumulable,
            priorite: form.priorite,
            codeCoupon: form.codeCoupon || null,
            maxUtilisations: form.maxUtilisations,
            dateDebut: form.dateDebut,
            dateFin: form.dateFin || null,
            actif: form.estProgrammee ? false : form.actif,
            conditions,
            ...(Object.keys(config).length > 0 ? { config } : {}),
            estProgrammee: form.estProgrammee,
            dateProgrammation: form.dateProgrammation || null,
        };

        try {
            if (isEdit && promotion) {
                await updateMutation.mutateAsync({ id: promotion.id, data: payload });
            } else {
                await createMutation.mutateAsync(payload);
            }
            onSuccess();
        } catch {
            // Erreur gérée par le mutation
        }
    }, [form, isEdit, promotion, createMutation, updateMutation, onSuccess]);

    const isLoading = createMutation.isPending || updateMutation.isPending;

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* Identité */}
            <fieldset className="space-y-3">
                <legend className="text-sm font-semibold text-[var(--color-texte)]">{t('form.sectionIdentite')}</legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormInput label={t('form.codeUnique')} value={form.code} onChange={(v) => setForm(f => ({ ...f, code: v }))} disabled={isEdit} placeholder="PLAN-RENTREE-30" required />
                    <FormInput label={t('form.nom')} value={form.nom} onChange={(v) => setForm(f => ({ ...f, nom: v }))} placeholder="Promotion rentrée -30%" required />
                </div>
            </fieldset>

            {/* Scope & Type */}
            <fieldset className="space-y-3">
                <legend className="text-sm font-semibold text-[var(--color-texte)]">{t('form.sectionScopeType')}</legend>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <FormSelect
                        label={t('form.scope')}
                        value={form.scope}
                        onChange={(v) => setForm(f => ({ ...f, scope: v as ScopePromotion }))}
                        options={Object.entries(SCOPE_LABELS).map(([k, l]) => ({ value: k, label: l }))}
                    />
                    <FormSelect
                        label={t('form.type')}
                        value={form.typePromotion}
                        onChange={(v) => setForm(f => ({ ...f, typePromotion: v as TypePromotion }))}
                        options={Object.entries(TYPE_LABELS).map(([k, l]) => ({ value: k, label: l }))}
                    />
                    <FormInput
                        label={form.typePromotion === TypePromotion.POURCENTAGE ? t('form.valeurPourcent') : t('form.valeurMontant')}
                        type="number"
                        value={String(form.valeur)}
                        onChange={(v) => setForm(f => ({ ...f, valeur: Number(v) }))}
                        min={0}
                        max={form.typePromotion === TypePromotion.POURCENTAGE ? 100 : undefined}
                        required
                    />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormSelect
                        label={t('form.dureeApplication')}
                        value={form.dureeApplication}
                        onChange={(v) => setForm(f => ({ ...f, dureeApplication: v as DureeApplicationPromotion }))}
                        options={Object.entries(DUREE_LABELS).map(([k, l]) => ({ value: k, label: l }))}
                    />
                    <FormInput
                        label={`${t('form.codeCoupon')} (${t('form.optionnel')})`}
                        value={form.codeCoupon}
                        onChange={(v) => setForm(f => ({ ...f, codeCoupon: v }))}
                        placeholder={t('form.codeCouponPlaceholder')}
                    />
                </div>

                {/* Sélecteur de cible — remplace la saisie UUID par une liste à choix */}
                {form.scope !== ScopePromotion.QUOTA && (
                    <FormSelect
                        label={
                            form.scope === ScopePromotion.PLAN ? t('form.ciblePlan') :
                            form.scope === ScopePromotion.PACK ? t('form.ciblePack') :
                            form.scope === ScopePromotion.MODULE ? t('form.cibleModule') :
                            t('form.cibleBundle')
                        }
                        value={form.cibleId}
                        onChange={(v) => setForm(f => ({ ...f, cibleId: v }))}
                        options={
                            form.scope === ScopePromotion.PLAN
                                ? plans.map(p => ({ value: p.id, label: `${p.nom} — ${p.prixBase}${p.devise}/mois` }))
                                : form.scope === ScopePromotion.PACK
                                ? packs.map(p => ({ value: p.id, label: `${p.nom} (${p.quantite} ${p.ressource})` }))
                                : form.scope === ScopePromotion.MODULE
                                ? moduleStates.map(ms => ({ value: ms.entry.name, label: ms.entry.label || ms.entry.name }))
                                : bundles.map(b => ({ value: b.id, label: `${b.nom} — ${b.code}` }))
                        }
                        hint={t('form.cibleHint')}
                    />
                )}
            </fieldset>

            {/* Conditions */}
            <fieldset className="space-y-3">
                <legend className="text-sm font-semibold text-[var(--color-texte)]">{t('form.sectionConditions')}</legend>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <FormInput label={t('conditions.nombreElevesMin')} type="number" value={form.nombreElevesMin ? String(form.nombreElevesMin) : ''} onChange={(v) => setForm(f => ({ ...f, nombreElevesMin: v ? Number(v) : null }))} placeholder="500" />
                    <FormInput label={t('conditions.ancienneteMois')} type="number" value={form.ancienneteMois ? String(form.ancienneteMois) : ''} onChange={(v) => setForm(f => ({ ...f, ancienneteMois: v ? Number(v) : null }))} placeholder="12" />
                    <FormInput label={t('conditions.nbCycles')} type="number" value={form.nbCycles ? String(form.nbCycles) : ''} onChange={(v) => setForm(f => ({ ...f, nbCycles: v ? Number(v) : null }))} placeholder="3" />
                    <FormInput label={t('conditions.dureeGratuiteMois')} type="number" value={form.dureeGratuiteMois ? String(form.dureeGratuiteMois) : ''} onChange={(v) => setForm(f => ({ ...f, dureeGratuiteMois: v ? Number(v) : null }))} placeholder="3" />
                </div>
            </fieldset>

            {/* v5 — Quota resource (visible si scope=QUOTA) */}
            {form.scope === ScopePromotion.QUOTA && (
                <fieldset className="space-y-3">
                    <legend className="text-sm font-semibold text-[var(--color-texte)]">{t('form.quotaRessource')}</legend>
                    <FormSelect
                        label={t('form.quotaRessource')}
                        value={form.quotaRessource}
                        onChange={(v) => setForm(f => ({ ...f, quotaRessource: v }))}
                        options={QUOTA_RESSOURCES.map(r => ({ value: r.value, label: r.label }))}
                    />
                </fieldset>
            )}

            {/* v5 — Automatisation & Planification */}
            <fieldset className="space-y-3">
                <legend className="text-sm font-semibold text-[var(--color-texte)]">{t('form.sectionAutomatisation')}</legend>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <FormSelect
                        label={t('form.typeAutomatique')}
                        value={form.typeAutomatique}
                        onChange={(v) => setForm(f => ({ ...f, typeAutomatique: v as TypeAutoPromotion }))}
                        options={Object.entries(AUTO_PROMO_LABELS).map(([k, l]) => ({ value: k, label: l }))}
                    />
                    <FormInput
                        label={t('form.dateProgrammation')}
                        type="datetime-local"
                        value={form.dateProgrammation}
                        onChange={(v) => setForm(f => ({ ...f, dateProgrammation: v }))}
                    />
                    <div className="flex items-end pb-1">
                        <FormCheckbox
                            label={t('form.estProgrammee')}
                            checked={form.estProgrammee}
                            onChange={(v) => setForm(f => ({ ...f, estProgrammee: v }))}
                        />
                    </div>
                </div>
            </fieldset>

            {/* v5 — Paliers de volume */}
            <fieldset className="space-y-3">
                <legend className="text-sm font-semibold text-[var(--color-texte)]">{t('form.sectionPaliers')}</legend>
                {form.paliersVolume.length === 0 && (
                    <p className="text-xs text-[var(--color-texte-muted)] italic">{t('form.aucunPalier')}</p>
                )}
                <div className="overflow-x-auto -mx-1 px-1">
                    {form.paliersVolume.map((palier, idx) => (
                        <div key={idx} className="flex items-end gap-2 min-w-[400px] mb-2">
                        <div className="flex-1">
                            <label className="block text-xs font-medium text-[var(--color-texte-muted)] mb-1">{t('form.palierMin')}</label>
                            <input
                                type="number"
                                value={String(palier.min)}
                                onChange={(e) => {
                                    const updated = [...form.paliersVolume];
                                    updated[idx] = { ...updated[idx], min: Number(e.target.value) };
                                    setForm(f => ({ ...f, paliersVolume: updated }));
                                }}
                                className="w-full rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface-hover)] px-3 py-2 text-sm text-[var(--color-texte)] focus:border-[var(--color-dominant-600)] focus:outline-none focus:ring-1 focus:ring-[var(--color-dominant-600)]"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs font-medium text-[var(--color-texte-muted)] mb-1">{t('form.palierMax')}</label>
                            <input
                                type="number"
                                value={palier.max !== null ? String(palier.max) : ''}
                                onChange={(e) => {
                                    const updated = [...form.paliersVolume];
                                    updated[idx] = { ...updated[idx], max: e.target.value ? Number(e.target.value) : null };
                                    setForm(f => ({ ...f, paliersVolume: updated }));
                                }}
                                className="w-full rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface-hover)] px-3 py-2 text-sm text-[var(--color-texte)] focus:border-[var(--color-dominant-600)] focus:outline-none focus:ring-1 focus:ring-[var(--color-dominant-600)]"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs font-medium text-[var(--color-texte-muted)] mb-1">{t('form.palierValeur')}</label>
                            <input
                                type="number"
                                value={String(palier.valeur)}
                                onChange={(e) => {
                                    const updated = [...form.paliersVolume];
                                    updated[idx] = { ...updated[idx], valeur: Number(e.target.value) };
                                    setForm(f => ({ ...f, paliersVolume: updated }));
                                }}
                                className="w-full rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface-hover)] px-3 py-2 text-sm text-[var(--color-texte)] focus:border-[var(--color-dominant-600)] focus:outline-none focus:ring-1 focus:ring-[var(--color-dominant-600)]"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                const updated = form.paliersVolume.filter((_, i) => i !== idx);
                                setForm(f => ({ ...f, paliersVolume: updated }));
                            }}
                            className="rounded-lg p-2 text-[var(--color-danger-500)] hover:bg-[var(--color-danger-50)] transition-colors"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                ))}
                </div>
                <ElisaButton
                    variant="ghost"
                    size="sm"
                    onClick={() => setForm(f => ({ ...f, paliersVolume: [...f.paliersVolume, { min: 0, max: null, valeur: 0 }] }))}
                    icon={<Plus className="h-3.5 w-3.5" />}
                >
                    {t('form.ajouterPalier')}
                </ElisaButton>
            </fieldset>

            {/* Période & Options */}
            <fieldset className="space-y-3">
                <legend className="text-sm font-semibold text-[var(--color-texte)]">{t('form.sectionPeriode')}</legend>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <FormInput label={t('form.dateDebut')} type="date" value={form.dateDebut} onChange={(v) => setForm(f => ({ ...f, dateDebut: v }))} required />
                    <FormInput label={`${t('form.dateFin')} (${t('form.optionnel')})`} type="date" value={form.dateFin} onChange={(v) => setForm(f => ({ ...f, dateFin: v }))} />
                    <FormInput label={t('form.maxUtilisations')} type="number" value={form.maxUtilisations ? String(form.maxUtilisations) : ''} onChange={(v) => setForm(f => ({ ...f, maxUtilisations: v ? Number(v) : null }))} placeholder={t('form.infini')} />
                </div>
                <div className="flex flex-wrap items-center gap-4 pt-2">
                    <FormCheckbox label={t('form.cumulable')} checked={form.cumulable} onChange={(v) => setForm(f => ({ ...f, cumulable: v }))} />
                    <FormCheckbox label={t('form.actif')} checked={form.actif} onChange={(v) => setForm(f => ({ ...f, actif: v }))} />
                    <FormInput label={t('form.priorite')} type="number" value={String(form.priorite)} onChange={(v) => setForm(f => ({ ...f, priorite: Number(v) }))} min={0} />
                </div>
            </fieldset>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-bordure)]">
                <ElisaButton variant="ghost" onClick={onCancel}>{t('form.annuler')}</ElisaButton>
                <ElisaButton
                    type="submit"
                    disabled={isLoading}
                    icon={<Save className="h-4 w-4" />}
                >
                    {isLoading ? t('form.enCours') : isEdit ? t('form.modifier') : t('form.creer')}
                </ElisaButton>
            </div>
        </form>
    );
}

// =============================================
// FORMULAIRE BUNDLE
// =============================================

function BundleForm({ bundle, onSuccess, onCancel }: {
    bundle?: BundlePromotion | null;
    onSuccess: () => void;
    onCancel: () => void;
}) {
    const { t } = useTranslation('promotions');
    const createMutation = useCreateBundle();
    const updateMutation = useUpdateBundle();
    const isEdit = !!bundle;

    // Source de données pour le sélecteur de packs (remplace les UUIDs bruts)
    const { data: packs = [] } = usePacks();

    const [form, setForm] = useState({
        code: bundle?.code ?? '',
        nom: bundle?.nom ?? '',
        description: bundle?.description ?? '',
        typeRemise: bundle?.typeRemise ?? TypeRemiseBundle.POURCENTAGE,
        valeur: bundle?.valeur ?? 0,
        codeCoupon: bundle?.codeCoupon ?? '',
        dateDebut: bundle?.dateDebut?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
        dateFin: bundle?.dateFin?.slice(0, 10) ?? '',
        maxUtilisations: bundle?.maxUtilisations ?? null as number | null,
        actif: bundle?.actif ?? true,
        priorite: bundle?.priorite ?? 0,
        packIds: bundle?.packIds ?? [] as string[],
    });

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (form.packIds.length < 2) return;

        const payload: CreateBundlePayload = {
            code: form.code,
            nom: form.nom,
            description: form.description || undefined,
            packIds: form.packIds,
            typeRemise: form.typeRemise,
            valeur: form.valeur,
            codeCoupon: form.codeCoupon || null,
            dateDebut: form.dateDebut,
            dateFin: form.dateFin || null,
            maxUtilisations: form.maxUtilisations,
            actif: form.actif,
            priorite: form.priorite,
        };

        try {
            if (isEdit && bundle) {
                await updateMutation.mutateAsync({ id: bundle.id, data: payload });
            } else {
                await createMutation.mutateAsync(payload);
            }
            onSuccess();
        } catch {
            // Erreur gérée par le mutation
        }
    }, [form, isEdit, bundle, createMutation, updateMutation, onSuccess]);

    const isLoading = createMutation.isPending || updateMutation.isPending;

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* Identité bundle */}
            <fieldset className="space-y-3">
                <legend className="text-sm font-semibold text-[var(--color-texte)]">{t('form.sectionBundleIdentite')}</legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormInput label={t('form.codeUnique')} value={form.code} onChange={(v) => setForm(f => ({ ...f, code: v }))} disabled={isEdit} placeholder="BUNDLE-STOCK-SMS" required />
                    <FormInput label={t('form.nom')} value={form.nom} onChange={(v) => setForm(f => ({ ...f, nom: v }))} placeholder="Pack Éducatif Complet" required />
                </div>
                <div>
                    <label className="block text-xs font-medium text-[var(--color-texte-muted)] mb-1">{t('form.description')}</label>
                    <textarea
                        value={form.description}
                        onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                        rows={2}
                        className="w-full rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface-hover)] px-3 py-2 text-sm text-[var(--color-texte)] placeholder-[var(--color-texte-muted)] focus:border-[var(--color-dominant-600)] focus:outline-none focus:ring-1 focus:ring-[var(--color-dominant-600)]"
                        placeholder={t('form.descriptionPlaceholder')}
                    />
                </div>
            </fieldset>

            {/* Remise & Packs */}
            <fieldset className="space-y-3">
                <legend className="text-sm font-semibold text-[var(--color-texte)]">{t('form.sectionRemisePacks')}</legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormSelect
                        label={t('form.typeRemise')}
                        value={form.typeRemise}
                        onChange={(v) => setForm(f => ({ ...f, typeRemise: v as TypeRemiseBundle }))}
                        options={[{ value: 'POURCENTAGE', label: t('types.POURCENTAGE') }, { value: 'MONTANT_FIXE', label: t('types.MONTANT_FIXE') }]}
                    />
                    <FormInput
                        label={form.typeRemise === 'POURCENTAGE' ? t('form.valeurPourcent') : t('form.valeurMontant')}
                        type="number"
                        value={String(form.valeur)}
                        onChange={(v) => setForm(f => ({ ...f, valeur: Number(v) }))}
                        min={0}
                        required
                    />
                </div>
                <div>
                    <FormMultiSelect
                        label={t('form.packIdsLabel')}
                        values={form.packIds}
                        onChange={(v) => setForm(f => ({ ...f, packIds: v }))}
                        options={packs.map(p => ({ value: p.id, label: p.nom, description: `${p.quantite} ${p.ressource} — ${p.prix}${p.devise}` }))}
                        placeholder={t('form.packIdsPlaceholder')}
                        required
                        showToggleAll
                    />
                </div>
            </fieldset>

            {/* Période */}
            <fieldset className="space-y-3">
                <legend className="text-sm font-semibold text-[var(--color-texte)]">{t('form.sectionPeriodeBundle')}</legend>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <FormInput label={t('form.dateDebut')} type="date" value={form.dateDebut} onChange={(v) => setForm(f => ({ ...f, dateDebut: v }))} required />
                    <FormInput label={`${t('form.dateFin')} (${t('form.optionnel')})`} type="date" value={form.dateFin} onChange={(v) => setForm(f => ({ ...f, dateFin: v }))} />
                    <FormInput label={t('form.maxUtilisations')} type="number" value={form.maxUtilisations ? String(form.maxUtilisations) : ''} onChange={(v) => setForm(f => ({ ...f, maxUtilisations: v ? Number(v) : null }))} placeholder={t('form.infini')} />
                </div>
                <div className="flex items-center gap-4 pt-2">
                    <FormCheckbox label={t('form.actif')} checked={form.actif} onChange={(v) => setForm(f => ({ ...f, actif: v }))} />
                </div>
            </fieldset>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-bordure)]">
                <ElisaButton variant="ghost" onClick={onCancel}>{t('form.annuler')}</ElisaButton>
                <ElisaButton
                    type="submit"
                    disabled={isLoading}
                    icon={<Save className="h-4 w-4" />}
                >
                    {isLoading ? t('form.enCours') : isEdit ? t('form.modifier') : t('form.creerBundle')}
                </ElisaButton>
            </div>
        </form>
    );
}

// Composants FormInput, FormSelect, FormCheckbox importés depuis billing-form-fields.tsx
