/**
 * ==================================
 * eLISAschool - Remise Form Modal
 * ==================================
 * Formulaire de création/modification d'une remise d'abonnement.
 * Extrait de platform.remises.tsx pour cohérence avec les autres
 * modals plateforme (PackFormModal, CycleFormModal, etc.).
 *
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { CustomModal } from '@/components/modals';
import { ElisaButton } from '@/components/ui';
import { Loader2 } from 'lucide-react';

// =============================================
// Types
// =============================================

export interface Remise {
    id: string;
    code: string;
    nom: string;
    typeRemise: 'POURCENTAGE' | 'MONTANT_FIXE';
    valeur: number;
    dureeApplication: 'PREMIERE_FACTURE' | 'N_CYCLES' | 'PERMANENTE';
    nbCycles?: number | null;
    cible: 'GLOBAL' | 'PLAN' | 'TENANT' | 'CYCLE';
    cibleId?: string | null;
    cibleCycle?: string | null;
    dateDebut: string;
    dateFin?: string | null;
    maxUtilisations?: number | null;
    utilisations: number;
    cumulable: boolean;
    priorite: number;
    codeCoupon?: string | null;
    conditionElevesMin?: number | null;
    conditionAncienneteMois?: number | null;
    actif: boolean;
}

export type RemiseForm = Omit<Remise, 'id' | 'utilisations' | 'dateDebut'> & { dateDebut?: string };

const FORM_VIDE: RemiseForm = {
    code: '',
    nom: '',
    typeRemise: 'POURCENTAGE',
    valeur: 10,
    dureeApplication: 'PREMIERE_FACTURE',
    nbCycles: null,
    cible: 'GLOBAL',
    cibleId: null,
    cibleCycle: null,
    dateFin: null,
    maxUtilisations: null,
    cumulable: false,
    priorite: 0,
    codeCoupon: null,
    conditionElevesMin: null,
    conditionAncienneteMois: null,
    actif: true,
};

interface RemiseFormModalProps {
    remise: Remise | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

// =============================================
// Composant
// =============================================

export function RemiseFormModal({ remise, open, onOpenChange }: RemiseFormModalProps) {
    const { t } = useTranslation('plans');
    const queryClient = useQueryClient();
    const [form, setForm] = useState<RemiseForm>(() =>
        remise ? { ...remise } : { ...FORM_VIDE },
    );
    const [error, setError] = useState<string | null>(null);

    const mutation = useMutation({
        mutationFn: async (data: RemiseForm) => {
            if (remise) {
                return apiClient.put(`/api/platform/remises/${remise.id}`, data);
            }
            return apiClient.post('/api/platform/remises', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['platform-remises'] });
            onOpenChange(false);
            toast.success(remise ? t('remises.misAJourAvecSucces') : t('remises.creeAvecSucces'));
        },
        onError: (err: any) => setError(err?.response?.data?.message || 'Erreur lors de l\'enregistrement'),
    });

    const update = <K extends keyof RemiseForm>(key: K, value: RemiseForm[K]) =>
        setForm(prev => ({ ...prev, [key]: value }));

    const inputClass = 'w-full px-3 py-2 border border-[var(--color-bordure)] rounded-lg text-sm bg-[var(--color-surface)] text-[var(--color-texte)]';

    return (
        <CustomModal open={open} onOpenChange={onOpenChange} title={remise ? t('remises.modifier') : t('remises.nouveau')}>
            {error && (
                <div className="mb-4 rounded-lg bg-[var(--color-danger-50)] p-3 text-sm text-[var(--color-danger-700)]">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--color-texte)]">{t('remises.code')}</label>
                    <input value={form.code} onChange={e => update('code', e.target.value)} className={inputClass} placeholder="RENTREE_2025" />
                </div>
                <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--color-texte)]">{t('remises.nom')}</label>
                    <input value={form.nom} onChange={e => update('nom', e.target.value)} className={inputClass} placeholder="Remise rentrée scolaire" />
                </div>
                <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--color-texte)]">{t('remises.type.POURCENTAGE')}</label>
                    <select value={form.typeRemise} onChange={e => update('typeRemise', e.target.value as RemiseForm['typeRemise'])} className={inputClass}>
                        <option value="POURCENTAGE">{t('remises.type.POURCENTAGE')} (%)</option>
                        <option value="MONTANT_FIXE">{t('remises.type.MONTANT_FIXE')}</option>
                    </select>
                </div>
                <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--color-texte)]">
                        {t('remises.valeur')} {form.typeRemise === 'POURCENTAGE' ? '(%)' : '(FCFA)'}
                    </label>
                    <input type="number" value={form.valeur} onChange={e => update('valeur', Number(e.target.value))} className={inputClass} min={0} />
                </div>
                <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--color-texte)]">{t('remises.duree')}</label>
                    <select value={form.dureeApplication} onChange={e => update('dureeApplication', e.target.value as RemiseForm['dureeApplication'])} className={inputClass}>
                        <option value="PREMIERE_FACTURE">{t('remises.dureeApp.PREMIERE_FACTURE')}</option>
                        <option value="N_CYCLES">N cycles</option>
                        <option value="PERMANENTE">{t('remises.dureeApp.PERMANENTE')}</option>
                    </select>
                </div>
                {form.dureeApplication === 'N_CYCLES' && (
                    <div>
                        <label className="mb-1 block text-sm font-medium text-[var(--color-texte)]">{t('remises.nbCyclesLabel')}</label>
                        <input type="number" value={form.nbCycles ?? ''} onChange={e => update('nbCycles', e.target.value ? Number(e.target.value) : null)} className={inputClass} min={1} />
                    </div>
                )}
                <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--color-texte)]">{t('remises.cible')}</label>
                    <select value={form.cible} onChange={e => update('cible', e.target.value as RemiseForm['cible'])} className={inputClass}>
                        <option value="GLOBAL">{t('remises.cibles.GLOBAL')}</option>
                        <option value="PLAN">{t('remises.cibles.PLAN')}</option>
                        <option value="TENANT">{t('remises.cibles.TENANT')}</option>
                        <option value="CYCLE">{t('remises.cibles.CYCLE')}</option>
                    </select>
                </div>
                {(form.cible === 'PLAN' || form.cible === 'TENANT') && (
                    <div>
                        <label className="mb-1 block text-sm font-medium text-[var(--color-texte)]">{t('remises.idCibleLabel')}</label>
                        <input value={form.cibleId ?? ''} onChange={e => update('cibleId', e.target.value || null)} className={inputClass} />
                    </div>
                )}
                {form.cible === 'CYCLE' && (
                    <div>
                        <label className="mb-1 block text-sm font-medium text-[var(--color-texte)]">{t('remises.cycleCibleLabel')}</label>
                        <select value={form.cibleCycle ?? ''} onChange={e => update('cibleCycle', e.target.value || null)} className={inputClass}>
                            <option value="">—</option>
                            <option value="MENSUEL">Mensuel</option>
                            <option value="TRIMESTRIEL">Trimestriel</option>
                            <option value="SEMESTRIEL">Semestriel</option>
                            <option value="ANNUEL">Annuel</option>
                        </select>
                    </div>
                )}

                {/* ─── Conditions d'éligibilité ─── */}
                <div className="col-span-2 mt-2 border-t border-[var(--color-bordure)] pt-3">
                    <span className="text-xs font-semibold uppercase text-[var(--color-texte-muted)]">{t('remises.conditions.titre')}</span>
                </div>
                <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--color-texte)]">{t('remises.conditions.elevesMin')}</label>
                    <input type="number" value={form.conditionElevesMin ?? ''} onChange={e => update('conditionElevesMin', e.target.value ? Number(e.target.value) : null)} className={inputClass} min={0} placeholder="—" />
                </div>
                <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--color-texte)]">{t('remises.conditions.ancienneteMois')}</label>
                    <input type="number" value={form.conditionAncienneteMois ?? ''} onChange={e => update('conditionAncienneteMois', e.target.value ? Number(e.target.value) : null)} className={inputClass} min={0} placeholder="—" />
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--color-texte)]">{t('remises.priorite')}</label>
                    <input type="number" value={form.priorite} onChange={e => update('priorite', Number(e.target.value))} className={inputClass} />
                </div>
                <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--color-texte)]">{t('remises.maxUtilisations')}</label>
                    <input type="number" value={form.maxUtilisations ?? ''} onChange={e => update('maxUtilisations', e.target.value ? Number(e.target.value) : null)} className={inputClass} min={1} />
                </div>
                <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--color-texte)]">{t('remises.coupon')}</label>
                    <input value={form.codeCoupon ?? ''} onChange={e => update('codeCoupon', e.target.value || null)} className={inputClass} placeholder="BIENVENUE10" />
                </div>
                <div className="flex items-center gap-6 pt-6">
                    <label className="flex items-center gap-2 text-sm text-[var(--color-texte)]">
                        <input type="checkbox" checked={form.cumulable} onChange={e => update('cumulable', e.target.checked)} className="h-4 w-4 rounded" />
                        {t('remises.cumulable')}
                    </label>
                    <label className="flex items-center gap-2 text-sm text-[var(--color-texte)]">
                        <input type="checkbox" checked={form.actif} onChange={e => update('actif', e.target.checked)} className="h-4 w-4 rounded" />
                        {t('remises.actif')}
                    </label>
                </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
                <ElisaButton variant="outline" onClick={() => onOpenChange(false)}>
                    {t('commun.annuler')}
                </ElisaButton>
                <ElisaButton
                    onClick={() => mutation.mutate(form)}
                    disabled={mutation.isPending || !form.code || !form.nom}
                >
                    {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    {t('commun.enregistrer')}
                </ElisaButton>
            </div>
        </CustomModal>
    );
}

export default RemiseFormModal;
