/**
 * ==================================
 * eLISAschool - Feature Flag Definition Form
 * ==================================
 * Modal CRUD pour créer/modifier une définition de feature flag.
 * 
 * Migration 210 — Refonte Feature Flags
 */

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/lib/api-client';
import { CustomModal } from '@/components/modals/CustomModal';
import { Loader2, Save } from 'lucide-react';

// =============================================
// Types
// =============================================

interface FeatureFlagDefinition {
    id: string;
    cle: string;
    label: string;
    description: string | null;
    categorie: string;
    type: string;
    valeurDefaut: boolean;
    planMinimal: string | null;
    rolloutPercentage: number;
    segments: Array<{ champ: string; operateur: string; valeur: string }>;
    estSysteme: boolean;
    estActif: boolean;
    expiresAt: string | null;
}

interface Props {
    definition: FeatureFlagDefinition | null;
    onClose: () => void;
    onSuccess: () => void;
}

const CATEGORIES = [
    { value: 'general', label: 'Général' },
    { value: 'billing', label: 'Facturation' },
    { value: 'integration', label: 'Intégration' },
    { value: 'security', label: 'Sécurité' },
    { value: 'ux', label: 'UX' },
    { value: 'pedagogie', label: 'Pédagogie' },
];

const TYPES = [
    { value: 'release', label: 'Release' },
    { value: 'ops', label: 'Ops' },
    { value: 'experiment', label: 'Expérimentation' },
    { value: 'permission', label: 'Permission' },
];

const PLANS = [
    { value: '', label: '— Aucun —' },
    { value: 'gratuit', label: 'Gratuit' },
    { value: 'starter', label: 'Starter' },
    { value: 'standard', label: 'Standard' },
    { value: 'pro', label: 'Pro' },
    { value: 'enterprise', label: 'Enterprise' },
];

// =============================================
// Component
// =============================================

export function FeatureFlagDefinitionForm({ definition, onClose, onSuccess }: Props) {
    const { t } = useTranslation('admin');
    const isEdit = !!definition;

    const [form, setForm] = useState({
        cle: definition?.cle || '',
        label: definition?.label || '',
        description: definition?.description || '',
        categorie: definition?.categorie || 'general',
        type: definition?.type || 'release',
        valeurDefaut: definition?.valeurDefaut || false,
        planMinimal: definition?.planMinimal || '',
        rolloutPercentage: definition?.rolloutPercentage ?? 100,
        estSysteme: definition?.estSysteme || false,
        expiresAt: definition?.expiresAt ? definition.expiresAt.split('T')[0] : '',
    });

    const [error, setError] = useState<string | null>(null);

    const mutation = useMutation({
        mutationFn: async (data: typeof form) => {
            if (isEdit) {
                const res = await apiClient.patch(`/api/platform/facturation/feature-flags/definitions/${definition!.id}`, {
                    label: data.label,
                    description: data.description || undefined,
                    categorie: data.categorie,
                    type: data.type,
                    valeurDefaut: data.valeurDefaut,
                    planMinimal: data.planMinimal || undefined,
                    rolloutPercentage: data.rolloutPercentage,
                    estActif: definition!.estActif,
                    expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString() : undefined,
                });
                return res.data;
            } else {
                const res = await apiClient.post('/api/platform/facturation/feature-flags/definitions', {
                    cle: data.cle,
                    label: data.label,
                    description: data.description || undefined,
                    categorie: data.categorie,
                    type: data.type,
                    valeurDefaut: data.valeurDefaut,
                    planMinimal: data.planMinimal || undefined,
                    rolloutPercentage: data.rolloutPercentage,
                    estSysteme: data.estSysteme,
                    expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString() : undefined,
                });
                return res.data;
            }
        },
        onSuccess: () => {
            onSuccess();
        },
        onError: (err: any) => {
            setError(err.message || t('common.error', 'Une erreur est survenue'));
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.cle || !form.label) {
            setError(t('featureFlags.form.requiredFields', 'Clé et label requis'));
            return;
        }
        mutation.mutate(form);
    };

    const updateField = (field: string, value: any) => {
        setForm(prev => ({ ...prev, [field]: value }));
        setError(null);
    };

    return (
        <CustomModal
            open={true}
            onOpenChange={onClose}
            title={isEdit ? t('featureFlags.form.editTitle', 'Modifier le flag') : t('featureFlags.form.createTitle', 'Nouveau feature flag')}
            size="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                    <div className="p-3 rounded-lg bg-[var(--color-danger-50)] border border-[var(--color-danger-200)] text-sm text-[var(--color-danger-700)]">
                        {error}
                    </div>
                )}

                {/* Clé + Label */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('featureFlags.form.cle', 'Clé')} *</label>
                        <input
                            type="text"
                            value={form.cle}
                            onChange={e => updateField('cle', e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg text-sm bg-[var(--color-surface)]"
                            placeholder="ex: multi_etablissement"
                            disabled={isEdit}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('featureFlags.form.label', 'Label')} *</label>
                        <input
                            type="text"
                            value={form.label}
                            onChange={e => updateField('label', e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg text-sm bg-[var(--color-surface)]"
                            placeholder="ex: Multi-établissement"
                            required
                        />
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium mb-1">{t('featureFlags.form.description', 'Description')}</label>
                    <textarea
                        value={form.description}
                        onChange={e => updateField('description', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm bg-[var(--color-surface)]"
                        rows={2}
                        placeholder={t('featureFlags.form.descriptionPlaceholder', 'Description du flag...')}
                    />
                </div>

                {/* Catégorie + Type */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('featureFlags.form.categorie', 'Catégorie')}</label>
                        <select
                            value={form.categorie}
                            onChange={e => updateField('categorie', e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg text-sm bg-[var(--color-surface)]"
                        >
                            {CATEGORIES.map(c => (
                                <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('featureFlags.form.type', 'Type')}</label>
                        <select
                            value={form.type}
                            onChange={e => updateField('type', e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg text-sm bg-[var(--color-surface)]"
                        >
                            {TYPES.map(tp => (
                                <option key={tp.value} value={tp.value}>{tp.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Plan minimal + Rollout */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('featureFlags.form.planMinimal', 'Plan minimal')}</label>
                        <select
                            value={form.planMinimal}
                            onChange={e => updateField('planMinimal', e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg text-sm bg-[var(--color-surface)]"
                        >
                            {PLANS.map(p => (
                                <option key={p.value} value={p.value}>{p.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            {t('featureFlags.form.rollout', 'Rollout')} ({form.rolloutPercentage}%)
                        </label>
                        <input
                            type="range"
                            min={0}
                            max={100}
                            step={5}
                            value={form.rolloutPercentage}
                            onChange={e => updateField('rolloutPercentage', parseInt(e.target.value, 10))}
                            className="w-full mt-2"
                        />
                    </div>
                </div>

                {/* Valeur défaut + Expiration */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={form.valeurDefaut}
                                onChange={e => updateField('valeurDefaut', e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-10 h-6 bg-muted peer-checked:bg-[var(--color-primary-600)] rounded-full peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-transform" />
                        </label>
                        <span className="text-sm">{t('featureFlags.form.valeurDefaut', 'Valeur par défaut activée')}</span>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('featureFlags.form.expiresAt', 'Expiration')}</label>
                        <input
                            type="date"
                            value={form.expiresAt}
                            onChange={e => updateField('expiresAt', e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg text-sm bg-[var(--color-surface)]"
                        />
                    </div>
                </div>

                {/* Système (only for create) */}
                {!isEdit && (
                    <div className="flex items-center gap-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={form.estSysteme}
                                onChange={e => updateField('estSysteme', e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-10 h-6 bg-muted peer-checked:bg-[var(--color-warning-600)] rounded-full peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-transform" />
                        </label>
                        <span className="text-sm">{t('featureFlags.form.estSysteme', 'Flag système (non supprimable)')}</span>
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm border rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors"
                    >
                        {t('common.cancel', 'Annuler')}
                    </button>
                    <button
                        type="submit"
                        disabled={mutation.isPending}
                        className="flex items-center gap-2 px-4 py-2 text-sm bg-[var(--color-primary-600)] text-white rounded-lg hover:bg-[var(--color-primary-700)] disabled:opacity-50 transition-colors"
                    >
                        {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {isEdit ? t('common.save', 'Enregistrer') : t('common.create', 'Créer')}
                    </button>
                </div>
            </form>
        </CustomModal>
    );
}
