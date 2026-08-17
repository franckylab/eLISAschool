/**
 * ==================================
 * eLISAschool - Pack Form Modal
 * ==================================
 * Modal formulaire pour créer/modifier un pack de quota.
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
import type { PackQuota, PackQuotaForm } from '@/features/billing/types/plan.types';
import { RESSOURCES_PACK } from '@/features/billing/types/plan.types';

// =============================================
// Props
// =============================================

interface PackFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    pack: PackQuota | null;
}

// =============================================
// Composant
// =============================================

const FORM_VIDE: PackQuotaForm = {
    code: '',
    nom: '',
    ressource: 'eleves',
    quantite: 50,
    prix: 0,
    devise: 'XAF',
    dureeValidite: 'CYCLE_COURANT',
    description: null,
    actif: true,
    ordre: 0,
};

const inputClass = 'w-full px-3 py-2 border border-[var(--color-bordure)] rounded-lg text-sm bg-[var(--color-surface)] text-[var(--color-texte)]';

export function PackFormModal({ open, onOpenChange, pack }: PackFormModalProps) {
    const { t } = useTranslation('plans');
    const queryClient = useQueryClient();
    const [form, setForm] = useState<PackQuotaForm>(() =>
        pack ? { ...pack } : { ...FORM_VIDE },
    );
    const [error, setError] = useState<string | null>(null);

    const mutation = useMutation({
        mutationFn: async (data: PackQuotaForm) => {
            if (pack) {
                return apiClient.put(`/api/platform/packs-quota/${pack.id}`, data);
            }
            return apiClient.post('/api/platform/packs-quota', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['platform-packs-quota'] });
            onOpenChange(false);
        },
        onError: (err: any) => setError(err?.response?.data?.message || 'Erreur lors de l\'enregistrement'),
    });

    const update = <K extends keyof PackQuotaForm>(key: K, value: PackQuotaForm[K]) =>
        setForm(prev => ({ ...prev, [key]: value }));

    const handleClose = () => {
        setError(null);
        onOpenChange(false);
    };

    return (
        <CustomModal
            open={open}
            onOpenChange={handleClose}
            title={pack ? t('packs.modifier') : t('packs.nouveau')}
            size="xl"
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
                            {t('packs.code')}
                        </label>
                        <input
                            value={form.code}
                            onChange={e => update('code', e.target.value)}
                            className={inputClass}
                            placeholder="PACK_ELEVES_50"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-[var(--color-texte)]">
                            {t('packs.nom')}
                        </label>
                        <input
                            value={form.nom}
                            onChange={e => update('nom', e.target.value)}
                            className={inputClass}
                            placeholder="+50 élèves"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-[var(--color-texte)]">
                            {t('packs.ressource')}
                        </label>
                        <select
                            value={form.ressource}
                            onChange={e => update('ressource', e.target.value)}
                            className={inputClass}
                        >
                            {RESSOURCES_PACK.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-[var(--color-texte)]">
                            {t('packs.quantite')}
                        </label>
                        <input
                            type="number"
                            value={form.quantite}
                            onChange={e => update('quantite', Number(e.target.value))}
                            className={inputClass}
                            min={1}
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-[var(--color-texte)]">
                            {t('packs.prix')}
                        </label>
                        <input
                            type="number"
                            value={form.prix}
                            onChange={e => update('prix', Number(e.target.value))}
                            className={inputClass}
                            min={0}
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-[var(--color-texte)]">
                            {t('packs.devise')}
                        </label>
                        <select
                            value={form.devise}
                            onChange={e => update('devise', e.target.value)}
                            className={inputClass}
                        >
                            <option value="XAF">XAF</option>
                            <option value="XOF">XOF</option>
                            <option value="EUR">EUR</option>
                            <option value="USD">USD</option>
                        </select>
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-[var(--color-texte)]">
                            {t('packs.dureeValidite')}
                        </label>
                        <select
                            value={form.dureeValidite}
                            onChange={e => update('dureeValidite', e.target.value as PackQuotaForm['dureeValidite'])}
                            className={inputClass}
                        >
                            <option value="CYCLE_COURANT">{t('packs.cycleCourant')}</option>
                            <option value="ILLIMITE">{t('packs.illimite')}</option>
                        </select>
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-[var(--color-texte)]">
                            {t('packs.ordre')}
                        </label>
                        <input
                            type="number"
                            value={form.ordre}
                            onChange={e => update('ordre', Number(e.target.value))}
                            className={inputClass}
                            min={0}
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="mb-1 block text-sm font-medium text-[var(--color-texte)]">
                            {t('packs.descriptionLabel')}
                        </label>
                        <input
                            value={form.description ?? ''}
                            onChange={e => update('description', e.target.value || null)}
                            className={inputClass}
                        />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-[var(--color-texte)]">
                        <input
                            type="checkbox"
                            checked={form.actif}
                            onChange={e => update('actif', e.target.checked)}
                            className="h-4 w-4 rounded"
                        />
                        {t('packs.actif')}
                    </label>
                </div>
            </div>
        </CustomModal>
    );
}

export default PackFormModal;
