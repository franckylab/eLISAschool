/**
 * ==================================
 * eLISAschool - Strategie Form Modal
 * ==================================
 * Modal formulaire pour créer/modifier une stratégie d'expiration.
 * Wrapper dans CustomModal (règle §23 — pas d'overlay custom).
 *
 * Refonte v4.3
 *
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { CustomModal } from '@/components/modals';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import type {
    StrategieExpiration,
    StrategieExpirationForm,
    PhaseExpiration,
    ComportementPhase,
} from '@/features/billing/types/plan.types';
import { PHASE_VALUES } from '@/features/billing/types/plan.types';

// =============================================
// Props
// =============================================

interface StrategieFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    strategie: StrategieExpiration | null;
}

// =============================================
// Composant
// =============================================

const STRATEGIE_FORM_VIDE: StrategieExpirationForm = {
    code: '',
    nom: '',
    phases: [{ nom: 'grace', jours: 15, comportement: 'READ_ONLY' }],
    planSlug: null,
    estDefaut: false,
    actif: true,
};

const inputClass = 'w-full px-3 py-2 border border-[var(--color-bordure)] rounded-lg text-sm bg-[var(--color-surface)] text-[var(--color-texte)]';

export function StrategieFormModal({ open, onOpenChange, strategie }: StrategieFormModalProps) {
    const { t } = useTranslation('plans');
    const queryClient = useQueryClient();
    const [form, setForm] = useState<StrategieExpirationForm>(() =>
        strategie
            ? { ...strategie, phases: strategie.phases?.length ? [...strategie.phases] : [...STRATEGIE_FORM_VIDE.phases] }
            : { ...STRATEGIE_FORM_VIDE },
    );
    const [error, setError] = useState<string | null>(null);

    const mutation = useMutation({
        mutationFn: async (data: StrategieExpirationForm) => {
            if (strategie) return apiClient.put(`/api/platform/strategies-expiration/${strategie.id}`, data);
            return apiClient.post('/api/platform/strategies-expiration', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['platform-strategies-expiration'] });
            onOpenChange(false);
        },
        onError: (err: any) => setError(err?.response?.data?.message || 'Erreur lors de l\'enregistrement'),
    });

    const update = <K extends keyof StrategieExpirationForm>(key: K, value: StrategieExpirationForm[K]) =>
        setForm(prev => ({ ...prev, [key]: value }));

    const updatePhase = (index: number, field: keyof PhaseExpiration, value: PhaseExpiration[keyof PhaseExpiration]) => {
        setForm(prev => {
            const phases = [...prev.phases];
            phases[index] = { ...phases[index], [field]: value } as PhaseExpiration;
            return { ...prev, phases };
        });
    };

    const addPhase = () => {
        update('phases', [...form.phases, { nom: `phase_${form.phases.length + 1}`, jours: 15, comportement: 'LOCKED' as ComportementPhase }]);
    };

    const removePhase = (index: number) => {
        update('phases', form.phases.filter((_, i) => i !== index));
    };

    const handleClose = () => {
        setError(null);
        onOpenChange(false);
    };

    return (
        <CustomModal
            open={open}
            onOpenChange={handleClose}
            title={strategie ? t('cycles.modifierStrategie') : t('cycles.nouvelleStrategie')}
            size="2xl"
            draggable={false}
            resizable={false}
            minimizable={false}
            maximizable={false}
            footer={
                <div className="flex justify-end gap-3">
                    <button
                        onClick={handleClose}
                        className="rounded-lg border border-[var(--color-bordure)] px-4 py-2 text-sm text-[var(--color-texte)] hover:bg-[var(--color-surface-hover)]"
                    >
                        {t('commun.annuler')}
                    </button>
                    <button
                        onClick={() => mutation.mutate(form)}
                        disabled={mutation.isPending || !form.code || !form.nom}
                        className="flex items-center gap-2 rounded-lg bg-[var(--color-dominante)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                    >
                        {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                        {t('commun.enregistrer')}
                    </button>
                </div>
            }
        >
            <div className="space-y-4">
                {error && (
                    <div className="rounded-lg bg-[var(--color-danger-50)] p-3 text-sm text-[var(--color-danger-700)]">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-[var(--color-texte)]">
                            {t('cycles.code')}
                        </label>
                        <input
                            value={form.code}
                            onChange={e => update('code', e.target.value)}
                            className={inputClass}
                            placeholder="standard"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-[var(--color-texte)]">
                            {t('cycles.nom')}
                        </label>
                        <input
                            value={form.nom}
                            onChange={e => update('nom', e.target.value)}
                            className={inputClass}
                            placeholder="Stratégie standard"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-[var(--color-texte)]">
                            {t('cycles.planConcerne')}
                        </label>
                        <input
                            value={form.planSlug ?? ''}
                            onChange={e => update('planSlug', e.target.value || null)}
                            className={inputClass}
                            placeholder="decouverte"
                        />
                    </div>
                    <div className="flex items-center gap-6 pt-6">
                        <label className="flex items-center gap-2 text-sm text-[var(--color-texte)]">
                            <input
                                type="checkbox"
                                checked={form.estDefaut}
                                onChange={e => update('estDefaut', e.target.checked)}
                                className="h-4 w-4 rounded"
                            />
                            {t('cycles.parDefaut')}
                        </label>
                        <label className="flex items-center gap-2 text-sm text-[var(--color-texte)]">
                            <input
                                type="checkbox"
                                checked={form.actif}
                                onChange={e => update('actif', e.target.checked)}
                                className="h-4 w-4 rounded"
                            />
                            {t('cycles.actif')}
                        </label>
                    </div>
                </div>

                {/* Phases ordonnées */}
                <div className="mt-5">
                    <div className="mb-2 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-[var(--color-texte)]">
                            {t('cycles.phases')}
                        </h3>
                        <button
                            onClick={addPhase}
                            className="flex items-center gap-1 rounded-lg bg-[var(--color-dominante)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            {t('cycles.ajouterPhase')}
                        </button>
                    </div>
                    <div className="space-y-2">
                        {form.phases.map((phase, index) => (
                            <div key={index} className="flex items-center gap-2 rounded-lg border border-[var(--color-bordure)] p-3">
                                <span className="text-xs font-bold text-[var(--color-texte-secondaire)]">{index + 1}.</span>
                                <input
                                    value={phase.nom}
                                    onChange={e => updatePhase(index, 'nom', e.target.value)}
                                    className={cn(inputClass, 'flex-1')}
                                    placeholder={t('cycles.nomPhase')}
                                />
                                <input
                                    type="number"
                                    value={phase.jours ?? ''}
                                    onChange={e => updatePhase(index, 'jours', e.target.value ? Number(e.target.value) : null)}
                                    className={cn(inputClass, 'w-24')}
                                    placeholder="∞"
                                    min={1}
                                />
                                <select
                                    value={phase.comportement}
                                    onChange={e => updatePhase(index, 'comportement', e.target.value as ComportementPhase)}
                                    className={cn(inputClass, 'w-40')}
                                >
                                    {PHASE_VALUES.map(c => (
                                        <option key={c} value={c}>{t(`cycles.phase.${c}` as any)}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={() => removePhase(index)}
                                    className="rounded p-1.5 text-[var(--color-danger-500)] hover:bg-[var(--color-danger-50)]"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                    <p className="mt-2 text-xs text-[var(--color-texte-secondaire)]">
                        {t('cycles.joursVide')}
                    </p>
                </div>
            </div>
        </CustomModal>
    );
}

export default StrategieFormModal;
