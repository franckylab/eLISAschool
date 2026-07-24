/**
 * ==================================
 * eLISAschool - Modal formulaire unité organisationnelle
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Formulaire création/édition d'unité : nom, code, échelon, responsable, localisation.
 * Basé sur CustomModal + react-hook-form + zod.
 */

import { useEffect, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CustomModal } from '@/components/modals/CustomModal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { useCreerUnite, useModifierUnite } from '../../../hooks/use-unites';
import { useEchelonsStructurels } from '../../../hooks/use-echelons-structurels';
import { useAuthStore } from '@/stores/auth.store';
import { PersonnelSearchField } from '../../personnel-search-field';
import type { PersonnelSearchResult } from '../../personnel-search-field';

interface UniteFormTarget {
    id: string;
    nom: string;
    code?: string;
    description?: string;
    echelonStructurelId?: string;
    parentId?: string;
    responsableNom?: string;
    responsableId?: string;
    localisation?: string;
}

type UniteFormData = {
    nom: string;
    code: string;
    description: string;
    echelonStructurelId: string;
    parentId: string;
    responsableNom: string;
    localisation: string;
};

type ModalMode = 'create' | 'edit';

interface UniteFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode?: ModalMode;
    unite?: UniteFormTarget | null;
    parentUnite?: { id: string; nom: string } | null;
    parentId?: string;
    onSuccess?: () => void;
}

const FORM_INIT: UniteFormData = {
    nom: '',
    code: '',
    description: '',
    echelonStructurelId: '',
    parentId: '',
    responsableNom: '',
    localisation: '',
};

export function UniteFormModal({ open, onOpenChange, mode, unite, parentUnite, parentId, onSuccess }: UniteFormModalProps) {
    const { t } = useTranslation('organisation');
    const etablissementId = useAuthStore(s => s.etablissementId);
    const [responsable, setResponsable] = useState<PersonnelSearchResult | null>(null);

    const uniteFormSchema = useMemo(() => z.object({
        nom: z.string().min(2, t('organigramme.form.validationMin2')).max(150),
        code: z.string().min(1, t('organigramme.form.validationRequis')).max(20),
        description: z.string().max(500).optional().or(z.literal('')),
        echelonStructurelId: z.string().uuid().optional().or(z.literal('')),
        parentId: z.string().uuid().optional().or(z.literal('')),
        responsableNom: z.string().max(100).optional().or(z.literal('')),
        localisation: z.string().max(200).optional().or(z.literal('')),
    }), [t]);
    const { data: echelons } = useEchelonsStructurels();
    const { mutateAsync: creerUnite, isPending: isCreating } = useCreerUnite();
    const { mutateAsync: modifierUnite, isPending: isUpdating } = useModifierUnite();

    const effectiveMode: ModalMode = mode ?? (unite ? 'edit' : 'create');
    const effectiveParentId = parentUnite?.id ?? parentId;

    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<UniteFormData>({
        resolver: zodResolver(uniteFormSchema),
        defaultValues: FORM_INIT,
    });

    const isPending = isCreating || isUpdating;

    useEffect(() => {
        if (!open) {
            reset(FORM_INIT);
            setResponsable(null);
            return;
        }
        if (effectiveMode === 'edit' && unite) {
            reset({
                nom: unite.nom || '',
                code: unite.code || '',
                description: unite.description || '',
                echelonStructurelId: unite.echelonStructurelId || '',
                parentId: unite.parentId || '',
                responsableNom: unite.responsableNom || '',
                localisation: unite.localisation || '',
            });
            if (unite.responsableId && unite.responsableNom) {
                setResponsable({
                    id: unite.responsableId,
                    nom: unite.responsableNom.split(' ').slice(1).join(' ') || unite.responsableNom,
                    prenom: unite.responsableNom.split(' ')[0] || '',
                });
            }
        } else if (effectiveMode === 'create') {
            reset({
                ...FORM_INIT,
                parentId: effectiveParentId || '',
            });
            setResponsable(null);
        }
    }, [open, effectiveMode, unite, effectiveParentId, reset]);

    const handleResponsableChange = useCallback((p: PersonnelSearchResult | null) => {
        setResponsable(p);
        setValue('responsableNom', p ? `${p.prenom} ${p.nom}` : '');
    }, [setValue]);

    const onSubmit = useCallback(async (data: UniteFormData) => {
        if (!etablissementId) return;

        const dto = {
            ...data,
            etablissementId,
            echelonStructurelId: data.echelonStructurelId || undefined,
            parentId: data.parentId || undefined,
            description: data.description || undefined,
            responsableNom: data.responsableNom || undefined,
            responsableId: responsable?.id || undefined,
            localisation: data.localisation || undefined,
        };

        if (effectiveMode === 'edit' && unite) {
            await modifierUnite({ id: unite.id, ...dto });
        } else {
            await creerUnite(dto);
        }

        onOpenChange(false);
        onSuccess?.();
    }, [effectiveMode, unite, responsable, etablissementId, creerUnite, modifierUnite, onOpenChange, onSuccess]);

    const title = effectiveMode === 'edit'
        ? t('organigramme.modal.modifierUnite', 'Modifier l\'unité')
        : t('organigramme.modal.creerUnite', 'Nouvelle unité');

    const subtitle = effectiveMode === 'create' && parentUnite
        ? t('organigramme.modal.parent', 'Parent : {{nom}}', { nom: parentUnite.nom })
        : undefined;

    return (
        <CustomModal
            open={open}
            onOpenChange={(v) => { if (!v) onOpenChange(false); }}
            title={title}
            description={subtitle}
            size="lg"
            footer={<>
                <ElisaButton variant="outline" onClick={() => onOpenChange(false)}>
                    {t('common:boutons.annuler', 'Annuler')}
                </ElisaButton>
                <ElisaButton
                    variant="primary"
                    type="submit"
                    form="unite-form"
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
            <form id="unite-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col" style={{ gap: 'var(--space-md)' }}>
                {/* Nom + Code */}
                <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 'var(--gap-sm)' }}>
                    <div>
                        <label className="block font-medium" style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.8125rem)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xxs)' }}>
                            {t('organigramme.form.nom', 'Nom')} *
                        </label>
                        <input
                            {...register('nom')}
                            className="w-full rounded-lg border text-sm outline-none transition-colors focus:ring-2 focus:ring-[var(--color-dominant-400)]"
                            style={{ padding: 'clamp(0.375rem, 0.3rem + 0.2vw, 0.5rem) clamp(0.625rem, 0.5rem + 0.3vw, 0.75rem)', borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface)' }}
                            placeholder={t('organigramme.form.phNomUnite')}
                        />
                        {errors.nom && <p className="text-xs mt-1 text-destructive">{errors.nom.message}</p>}
                    </div>
                    <div>
                        <label className="block font-medium" style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.8125rem)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xxs)' }}>
                            {t('organigramme.form.code', 'Code')} *
                        </label>
                        <input
                            {...register('code')}
                            className="w-full rounded-lg border text-sm outline-none transition-colors focus:ring-2 focus:ring-[var(--color-dominant-400)]"
                            style={{ padding: 'clamp(0.375rem, 0.3rem + 0.2vw, 0.5rem) clamp(0.625rem, 0.5rem + 0.3vw, 0.75rem)', borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface)' }}
                            placeholder={t('organigramme.form.phCode')}
                        />
                        {errors.code && <p className="text-xs mt-1 text-destructive">{errors.code.message}</p>}
                    </div>
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
                        placeholder={t('organigramme.form.phDescriptionUnite')}
                    />
                </div>

                {/* Échelon structurel */}
                <div>
                    <label className="block font-medium" style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.8125rem)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xxs)' }}>
                        {t('organigramme.form.echelon', 'Échelon structurel')}
                    </label>
                    <select
                        {...register('echelonStructurelId')}
                        className="w-full rounded-lg border text-sm outline-none transition-colors focus:ring-2 focus:ring-[var(--color-dominant-400)]"
                        style={{ padding: 'clamp(0.375rem, 0.3rem + 0.2vw, 0.5rem) clamp(0.625rem, 0.5rem + 0.3vw, 0.75rem)', borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface)' }}
                    >
                        <option value="">{t('organigramme.form.selectionner', 'Sélectionner...')}</option>
                        {echelons?.map(e => (
                            <option key={e.id} value={e.id}>{e.label} ({e.code})</option>
                        ))}
                    </select>
                </div>

                {/* Responsable + Localisation */}
                <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 'var(--gap-sm)' }}>
                    <div>
                        <label className="block font-medium" style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.8125rem)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xxs)' }}>
                            {t('organigramme.form.responsable', 'Responsable')}
                        </label>
                        <PersonnelSearchField
                            value={responsable}
                            onChange={handleResponsableChange}
                            placeholder={t('organigramme.form.phResponsable')}
                        />
                    </div>
                    <div>
                        <label className="block font-medium" style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.8125rem)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xxs)' }}>
                            {t('organigramme.form.localisation', 'Localisation')}
                        </label>
                        <input
                            {...register('localisation')}
                            className="w-full rounded-lg border text-sm outline-none transition-colors focus:ring-2 focus:ring-[var(--color-dominant-400)]"
                            style={{ padding: 'clamp(0.375rem, 0.3rem + 0.2vw, 0.5rem) clamp(0.625rem, 0.5rem + 0.3vw, 0.75rem)', borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface)' }}
                            placeholder={t('organigramme.form.phLocalisation')}
                        />
                    </div>
                </div>
            </form>
        </CustomModal>
    );
}
