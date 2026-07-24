/**
 * ==================================
 * eLISAschool - Modal formulaire Poste
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Modal create/edit pour un poste dans une unité organisationnelle.
 */

import { useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CustomModal } from '@/components/modals/CustomModal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { useCreerPoste, useModifierPoste } from '../../../hooks/use-postes';
import { useNiveauxResponsabilite } from '../../../hooks/use-niveaux-responsabilite';
import { useAuthStore } from '@/stores/auth.store';
import type { OrganigrammeNode, OrganigrammePoste } from '../../../types/organisation.types';

type PosteFormData = {
    intitule: string;
    code: string;
    niveauResponsabiliteId: string;
    description: string;
    estSuppleant: boolean;
};

type ModalMode = 'create' | 'edit';

interface PosteFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: ModalMode;
    unite: OrganigrammeNode | null;
    poste?: OrganigrammePoste | null;
    onSuccess?: () => void;
}

const FORM_INIT: PosteFormData = {
    intitule: '',
    code: '',
    niveauResponsabiliteId: '',
    description: '',
    estSuppleant: false,
};

export function PosteFormModal({ open, onOpenChange, mode, unite, poste, onSuccess }: PosteFormModalProps) {
    const { t } = useTranslation('organisation');
    const etablissementId = useAuthStore(s => s.etablissementId);

    const posteFormSchema = useMemo(() => z.object({
        intitule: z.string().min(2, t('organigramme.form.validationMin2')).max(150),
        code: z.string().max(20).optional().or(z.literal('')),
        niveauResponsabiliteId: z.string().optional().or(z.literal('')),
        description: z.string().max(500).optional().or(z.literal('')),
        estSuppleant: z.boolean().default(false),
    }), [t]);
    const { data: niveaux } = useNiveauxResponsabilite();
    const { mutateAsync: creerPoste, isPending: isCreating } = useCreerPoste();
    const { mutateAsync: modifierPoste, isPending: isUpdating } = useModifierPoste();

    const { register, handleSubmit, reset, formState: { errors } } = useForm<PosteFormData>({
        resolver: zodResolver(posteFormSchema),
        defaultValues: FORM_INIT,
    });

    const isPending = isCreating || isUpdating;

    useEffect(() => {
        if (!open) {
            reset(FORM_INIT);
            return;
        }
        if (mode === 'edit' && poste) {
            reset({
                intitule: poste.intitule || '',
                code: poste.code || '',
                niveauResponsabiliteId: '',
                description: '',
                estSuppleant: false,
            });
        } else {
            reset(FORM_INIT);
        }
    }, [open, mode, poste, reset]);

    const onSubmit = useCallback(async (data: PosteFormData) => {
        if (!unite || !etablissementId) return;

        if (mode === 'edit' && poste) {
            await modifierPoste({
                id: poste.id,
                intitule: data.intitule,
                code: data.code || undefined,
                niveauResponsabiliteId: data.niveauResponsabiliteId || undefined,
                description: data.description || undefined,
                estSuppleant: data.estSuppleant,
            });
        } else {
            await creerPoste({
                ...data,
                code: data.code || undefined,
                niveauResponsabiliteId: data.niveauResponsabiliteId || undefined,
                description: data.description || undefined,
                uniteOrganisationnelleId: unite.id,
                etablissementId,
            });
        }

        onOpenChange(false);
        onSuccess?.();
    }, [mode, unite, poste, etablissementId, creerPoste, modifierPoste, onOpenChange, onSuccess]);

    const title = mode === 'edit'
        ? t('organigramme.modal.modifierPoste', 'Modifier le poste')
        : t('organigramme.modal.creerPoste', 'Nouveau poste');

    const subtitle = unite
        ? t('organigramme.modal.dansUnite', 'Dans : {{nom}}', { nom: unite.nom })
        : undefined;

    return (
        <CustomModal
            open={open}
            onOpenChange={(v) => { if (!v) onOpenChange(false); }}
            title={title}
            description={subtitle}
            size="md"
            footer={<>
                <ElisaButton variant="outline" onClick={() => onOpenChange(false)}>
                    {t('common:boutons.annuler', 'Annuler')}
                </ElisaButton>
                <ElisaButton
                    variant="primary"
                    type="submit"
                    form="poste-form"
                    disabled={isPending}
                    chargement={isPending}
                >
                    {isPending
                        ? t('common:boutons.enregistrement', 'Enregistrement...')
                        : mode === 'edit'
                            ? t('common:boutons.enregistrer', 'Enregistrer')
                            : t('common:boutons.creer', 'Créer')
                    }
                </ElisaButton>
            </>}
        >
            <form id="poste-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col" style={{ gap: 'var(--space-md)' }}>
                {/* Intitulé */}
                <div>
                    <label className="block font-medium" style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.8125rem)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xxs)' }}>
                        {t('organigramme.form.intitule', 'Intitulé')} *
                    </label>
                    <input
                        {...register('intitule')}
                        className="w-full rounded-lg border text-sm outline-none transition-colors focus:ring-2 focus:ring-[var(--color-dominant-400)]"
                        style={{ padding: 'clamp(0.375rem, 0.3rem + 0.2vw, 0.5rem) clamp(0.625rem, 0.5rem + 0.3vw, 0.75rem)', borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface)' }}
                        placeholder={t('organigramme.form.phIntitulePoste')}
                    />
                    {errors.intitule && <p className="text-xs mt-1 text-destructive">{errors.intitule.message}</p>}
                </div>

                {/* Code */}
                <div>
                    <label className="block font-medium" style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.8125rem)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xxs)' }}>
                        {t('organigramme.form.codePoste', 'Code')}
                    </label>
                    <input
                        {...register('code')}
                        className="w-full rounded-lg border text-sm outline-none transition-colors focus:ring-2 focus:ring-[var(--color-dominant-400)]"
                        style={{ padding: 'clamp(0.375rem, 0.3rem + 0.2vw, 0.5rem) clamp(0.625rem, 0.5rem + 0.3vw, 0.75rem)', borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface)' }}
                        placeholder={t('organigramme.form.phCode')}
                    />
                </div>

                {/* Niveau de responsabilité */}
                <div>
                    <label className="block font-medium" style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.8125rem)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xxs)' }}>
                        {t('organigramme.form.niveauResponsabilite', 'Niveau de responsabilité')}
                    </label>
                    <select
                        {...register('niveauResponsabiliteId')}
                        className="w-full rounded-lg border text-sm outline-none transition-colors focus:ring-2 focus:ring-[var(--color-dominant-400)]"
                        style={{ padding: 'clamp(0.375rem, 0.3rem + 0.2vw, 0.5rem) clamp(0.625rem, 0.5rem + 0.3vw, 0.75rem)', borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface)' }}
                    >
                        <option value="">{t('organigramme.form.selectionner', 'Sélectionner...')}</option>
                        {niveaux?.map(n => (
                            <option key={n.id} value={n.id}>{n.label}</option>
                        ))}
                    </select>
                </div>

                {/* Description */}
                <div>
                    <label className="block font-medium" style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.8125rem)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xxs)' }}>
                        {t('organigramme.form.description', 'Description')}
                    </label>
                    <textarea
                        {...register('description')}
                        rows={2}
                        className="w-full rounded-lg border text-sm outline-none transition-colors focus:ring-2 focus:ring-[var(--color-dominant-400)] resize-none"
                        style={{ padding: 'clamp(0.375rem, 0.3rem + 0.2vw, 0.5rem) clamp(0.625rem, 0.5rem + 0.3vw, 0.75rem)', borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface)' }}
                        placeholder={t('organigramme.form.phDescriptionPoste')}
                    />
                </div>

                {/* Suppléant */}
                <label className="flex items-center cursor-pointer" style={{ gap: 'var(--gap-xs)' }}>
                    <input
                        {...register('estSuppleant')}
                        type="checkbox"
                        className="w-4 h-4 rounded border-[var(--color-bordure)]"
                    />
                    <span style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)', color: 'var(--color-text-secondary)' }}>
                        {t('organigramme.form.suppleant', 'Poste de suppléant')}
                    </span>
                </label>
            </form>
        </CustomModal>
    );
}
