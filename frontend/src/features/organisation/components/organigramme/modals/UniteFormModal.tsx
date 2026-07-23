import { useEffect, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CustomModal } from '@/components/modals/CustomModal';
import { useCreerUnite, useModifierUnite } from '../../../hooks/use-unites';
import { useUsagesUnite } from '../../../hooks/use-usages-unite';
import { useNiveauxOrganisation } from '../../../hooks/use-niveaux-organisation';
import { useAuthStore } from '@/stores/auth.store';
import { PersonnelSearchField } from '../../personnel-search-field';
import type { PersonnelSearchResult } from '../../personnel-search-field';

interface UniteFormTarget {
    id: string;
    nom: string;
    code?: string;
    description?: string;
    usageUniteId?: string;
    niveauOrganisationId?: string;
    parentId?: string;
    responsableNom?: string;
    responsableId?: string;
    localisation?: string;
}

type UniteFormData = {
    nom: string;
    code: string;
    description: string;
    usageUniteId: string;
    niveauOrganisationId: string;
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
    usageUniteId: '',
    niveauOrganisationId: '',
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
        usageUniteId: z.string().uuid().optional().or(z.literal('')),
        niveauOrganisationId: z.string().uuid().optional().or(z.literal('')),
        parentId: z.string().uuid().optional().or(z.literal('')),
        responsableNom: z.string().max(100).optional().or(z.literal('')),
        localisation: z.string().max(200).optional().or(z.literal('')),
    }), [t]);
    const { data: usages } = useUsagesUnite();
    const { data: niveaux } = useNiveauxOrganisation();
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
                usageUniteId: unite.usageUniteId || '',
                niveauOrganisationId: unite.niveauOrganisationId || '',
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
            usageUniteId: data.usageUniteId || undefined,
            niveauOrganisationId: data.niveauOrganisationId || undefined,
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
                    form="unite-form"
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
            <form id="unite-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Nom + Code */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                            {t('organigramme.form.nom', 'Nom')} *
                        </label>
                        <input
                            {...register('nom')}
                            className="w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors focus:ring-2 focus:ring-[var(--color-dominant-400)]"
                            style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface)' }}
                            placeholder={t('organigramme.form.phNomUnite')}
                        />
                        {errors.nom && <p className="text-xs mt-1 text-destructive">{errors.nom.message}</p>}
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                            {t('organigramme.form.code', 'Code')} *
                        </label>
                        <input
                            {...register('code')}
                            className="w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors focus:ring-2 focus:ring-[var(--color-dominant-400)]"
                            style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface)' }}
                            placeholder={t('organigramme.form.phCode')}
                        />
                        {errors.code && <p className="text-xs mt-1 text-destructive">{errors.code.message}</p>}
                    </div>
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
                        placeholder={t('organigramme.form.phDescriptionUnite')}
                    />
                </div>

                {/* Usage + Niveau */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                            {t('organigramme.form.usage', 'Usage')}
                        </label>
                        <select
                            {...register('usageUniteId')}
                            className="w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors focus:ring-2 focus:ring-[var(--color-dominant-400)]"
                            style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface)' }}
                        >
                            <option value="">{t('organigramme.form.selectionner', 'Sélectionner...')}</option>
                            {usages?.map(u => (
                                <option key={u.id} value={u.id}>{u.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                            {t('organigramme.form.niveau', 'Niveau')}
                        </label>
                        <select
                            {...register('niveauOrganisationId')}
                            className="w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors focus:ring-2 focus:ring-[var(--color-dominant-400)]"
                            style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface)' }}
                        >
                            <option value="">{t('organigramme.form.selectionner', 'Sélectionner...')}</option>
                            {niveaux?.map(n => (
                                <option key={n.id} value={n.id}>{n.label} (N{n.niveau})</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Responsable + Localisation */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                            {t('organigramme.form.responsable', 'Responsable')}
                        </label>
                        <PersonnelSearchField
                            value={responsable}
                            onChange={handleResponsableChange}
                            placeholder={t('organigramme.form.phResponsable')}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                            {t('organigramme.form.localisation', 'Localisation')}
                        </label>
                        <input
                            {...register('localisation')}
                            className="w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors focus:ring-2 focus:ring-[var(--color-dominant-400)]"
                            style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface)' }}
                            placeholder={t('organigramme.form.phLocalisation')}
                        />
                    </div>
                </div>
            </form>
        </CustomModal>
    );
}
