/**
 * ==================================
 * eLISAschool - Cycle Form Modal
 * ==================================
 * Modal formulaire pour créer/modifier un cycle de facturation.
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
import { Loader2 } from 'lucide-react';
import type { CycleFacturation, CycleFacturationForm } from '@/features/billing/types/plan.types';

// =============================================
// Props
// =============================================

interface CycleFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    cycle: CycleFacturation | null;
}

// =============================================
// Composant
// =============================================

const CYCLE_FORM_VIDE: CycleFacturationForm = {
    code: '',
    nom: '',
    nomEn: null,
    dureeMois: 1,
    remisePourcent: 0,
    actif: true,
    ordre: 0,
};

const inputClass = 'w-full px-3 py-2 border border-[var(--color-bordure)] rounded-lg text-sm bg-[var(--color-surface)] text-[var(--color-texte)]';

export function CycleFormModal({ open, onOpenChange, cycle }: CycleFormModalProps) {
    const { t } = useTranslation('plans');
    const queryClient = useQueryClient();
    const [form, setForm] = useState<CycleFacturationForm>(() =>
        cycle ? { ...cycle } : { ...CYCLE_FORM_VIDE },
    );
    const [error, setError] = useState<string | null>(null);

    const mutation = useMutation({
        mutationFn: async (data: CycleFacturationForm) => {
            if (cycle) return apiClient.put(`/api/platform/cycles-facturation/${cycle.id}`, data);
            return apiClient.post('/api/platform/cycles-facturation', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['platform-cycles-facturation'] });
            onOpenChange(false);
        },
        onError: (err: any) => setError(err?.response?.data?.message || 'Erreur lors de l\'enregistrement'),
    });

    const update = <K extends keyof CycleFacturationForm>(key: K, value: CycleFacturationForm[K]) =>
        setForm(prev => ({ ...prev, [key]: value }));

    const handleClose = () => {
        setError(null);
        onOpenChange(false);
    };

    return (
        <CustomModal
            open={open}
            onOpenChange={handleClose}
            title={cycle ? t('cycles.modifierCycle') : t('cycles.nouveauCycle')}
            size="lg"
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
                            placeholder="MENSUEL"
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
                            placeholder="Mensuel"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-[var(--color-texte)]">
                            {t('cycles.duree')}
                        </label>
                        <input
                            type="number"
                            value={form.dureeMois}
                            onChange={e => update('dureeMois', Number(e.target.value))}
                            className={inputClass}
                            min={1}
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-[var(--color-texte)]">
                            {t('cycles.remise')} (%)
                        </label>
                        <input
                            type="number"
                            value={form.remisePourcent}
                            onChange={e => update('remisePourcent', Number(e.target.value))}
                            className={inputClass}
                            min={0}
                            max={100}
                            step={0.5}
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-[var(--color-texte)]">
                            {t('cycles.ordre')}
                        </label>
                        <input
                            type="number"
                            value={form.ordre}
                            onChange={e => update('ordre', Number(e.target.value))}
                            className={inputClass}
                            min={0}
                        />
                    </div>
                    <label className="flex items-center gap-2 pt-6 text-sm text-[var(--color-texte)]">
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
        </CustomModal>
    );
}

export default CycleFormModal;
