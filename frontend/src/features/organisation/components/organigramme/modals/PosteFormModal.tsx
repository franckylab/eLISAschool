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
import { useCreerPoste, useModifierPoste } from '../../../hooks/use-postes';
import { useCategoriesPoste } from '../../../hooks/use-categories-poste';
import { useNiveauxResponsabilite } from '../../../hooks/use-niveaux-responsabilite';
import { useAuthStore } from '@/stores/auth.store';
import type { OrganigrammeNode, OrganigrammePoste } from '../../../types/organisation.types';

// Schéma de validation (messages i18n — construit dans le composant)
type PosteFormData = {
    intitule: string;
    code: string;
    categoriePosteCode: string;
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
    categoriePosteCode: '',
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
        categoriePosteCode: z.string().optional().or(z.literal('')),
        niveauResponsabiliteId: z.string().optional().or(z.literal('')),
        description: z.string().max(500).optional().or(z.literal('')),
        estSuppleant: z.boolean().default(false),
    }), [t]);
    const { data: categories } = useCategoriesPoste();
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
                categoriePosteCode: '',
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
                categoriePosteCode: data.categoriePosteCode || undefined,
                niveauResponsabiliteId: data.niveauResponsabiliteId || undefined,
                description: data.description || undefined,
                estSuppleant: data.estSuppleant,
            });
        } else {
            await creerPoste({
                ...data,
                code: data.code || undefined,
                categoriePosteCode: data.categoriePosteCode || undefined,
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
                <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className="px-4 py-2 rounded-lg text-sm font-medium border transition-colors"
                    style={{ borderColor: 'var(--color-bordure)', color: 'var(--color-text-secondary)' }}
                >
                    {t('common:boutons.annuler', 'Annuler')}
                </button>
                <button
                    type="submit"
                    form="poste-form"
                    disabled={isPending}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
                    style={{ backgroundColor: 'var(--color-dominant-600)' }}
                >
                    {isPending
                        ? t('common:boutons.enregistrement', 'Enregistrement...')
                        : mode === 'edit'
                            ? t('common:boutons.enregistrer', 'Enregistrer')
                            : t('common:boutons.creer', 'Créer')
                    }
                </button>
            </>}
        >
            <form id="poste-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Intitulé */}
                <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                        {t('organigramme.form.intitule', 'Intitulé')} *
                    </label>
                    <input
                        {...register('intitule')}
                        className="w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors focus:ring-2 focus:ring-[var(--color-dominant-400)]"
                        style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface)' }}
                        placeholder={t('organigramme.form.phIntitulePoste')}
                    />
                    {errors.intitule && <p className="text-xs mt-1 text-destructive">{errors.intitule.message}</p>}
                </div>

                {/* Code + Catégorie */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                            {t('organigramme.form.codePoste', 'Code')}
                        </label>
                        <input
                            {...register('code')}
                            className="w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors focus:ring-2 focus:ring-[var(--color-dominant-400)]"
                            style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface)' }}
                            placeholder={t('organigramme.form.phCode')}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                            {t('organigramme.form.categorie', 'Catégorie')}
                        </label>
                        <select
                            {...register('categoriePosteCode')}
                            className="w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors focus:ring-2 focus:ring-[var(--color-dominant-400)]"
                            style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface)' }}
                        >
                            <option value="">{t('organigramme.form.selectionner', 'Sélectionner...')}</option>
                            {categories?.map(c => (
                                <option key={c.id} value={c.code}>{c.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Niveau de responsabilité */}
                <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                        {t('organigramme.form.niveauResponsabilite', 'Niveau de responsabilité')}
                    </label>
                    <select
                        {...register('niveauResponsabiliteId')}
                        className="w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors focus:ring-2 focus:ring-[var(--color-dominant-400)]"
                        style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface)' }}
                    >
                        <option value="">{t('organigramme.form.selectionner', 'Sélectionner...')}</option>
                        {niveaux?.map(n => (
                            <option key={n.id} value={n.id}>{n.label}</option>
                        ))}
                    </select>
                </div>

                {/* Description */}
                <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                        {t('organigramme.form.description', 'Description')}
                    </label>
                    <textarea
                        {...register('description')}
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors focus:ring-2 focus:ring-[var(--color-dominant-400)] resize-none"
                        style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface)' }}
                        placeholder={t('organigramme.form.phDescriptionPoste')}
                    />
                </div>

                {/* Suppléant */}
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        {...register('estSuppleant')}
                        type="checkbox"
                        className="w-4 h-4 rounded border-[var(--color-bordure)]"
                    />
                    <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        {t('organigramme.form.suppleant', 'Poste de suppléant')}
                    </span>
                </label>
            </form>
        </CustomModal>
    );
}
