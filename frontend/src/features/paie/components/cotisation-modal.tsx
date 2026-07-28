import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CustomModal } from '@/components/modals/CustomModal';
import { SectionSeparator } from '@/components/ui/SectionSeparator';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ElisaInput } from '@/components/ui/ElisaInput';
import { ElisaSelect } from '@/components/ui/ElisaSelect';

import type { Cotisation } from '../types/paie.types';

type RetenueFormData = Omit<Cotisation, 'id' | 'actif' | 'etablissementId' | 'createdAt' | 'updatedAt'>;

interface CotisationModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (data: RetenueFormData) => Promise<void>;
    isLoading?: boolean;
    cotisation?: Cotisation | null;
}

const FORM_INIT: RetenueFormData = {
    code: '',
    nom: '',
    type: 'SALARIALE',
    tauxPatronal: 0,
    tauxSalarial: 0,
    plafond: undefined,
    description: '',
};

export function CotisationModal({ open, onOpenChange, onSave, isLoading, cotisation }: CotisationModalProps) {
    const { t } = useTranslation('paie');

    const schema = useMemo(() => z.object({
        code: z.string().min(2, t('validation.codeMin')).max(20, t('validation.codeMax')),
        nom: z.string().min(2, t('validation.nomMin')).max(100, t('validation.nomMax')),
        type: z.enum(['PATRONALE', 'SALARIALE', 'MIXTE']),
        tauxPatronal: z.number().min(0, t('validation.positif')),
        tauxSalarial: z.number().min(0, t('validation.positif')),
        plafond: z.number().optional(),
        description: z.string().optional(),
    }), [t]);

    const { register, handleSubmit, control, reset, formState: { errors } } = useForm<RetenueFormData>({
        resolver: zodResolver(schema),
        defaultValues: FORM_INIT,
    });

    if (open && cotisation) {
        reset({
            code: cotisation.code || '',
            nom: cotisation.nom || '',
            type: cotisation.type || 'SALARIALE',
            tauxPatronal: cotisation.tauxPatronal || 0,
            tauxSalarial: cotisation.tauxSalarial || 0,
            plafond: cotisation.plafond,
            description: cotisation.description || '',
        });
    } else if (open && !cotisation) {
        reset(FORM_INIT);
    }

    const onSubmit = async (data: RetenueFormData) => {
        const cleaned = {
            ...data,
            plafond: Number.isNaN(data.plafond) ? undefined : data.plafond,
        };
        await onSave(cleaned);
    };

    return (
        <CustomModal
            open={open}
            onOpenChange={onOpenChange}
            title={cotisation ? t('modifierCotisation') : t('nouvelleCotisation')}
            footer={
                <>
                    <ElisaButton variant="outline" onClick={() => onOpenChange(false)}>
                        {t('common:boutons.annuler')}
                    </ElisaButton>
                    <ElisaButton type="submit" variant="primary" isLoading={isLoading} form="cotisation-form">
                        {cotisation ? t('common:boutons.enregistrer') : t('common:boutons.creer')}
                    </ElisaButton>
                </>
            }
        >
            <form id="cotisation-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <h4 className="text-sm font-semibold text-[var(--color-text-strong)]">{t('informationsCotisation')}</h4>
                <SectionSeparator />
                <div className="grid grid-cols-2 gap-4">
                    <ElisaInput
                        label={t('code')}
                        {...register('code')}
                        error={errors.code?.message}
                        required
                    />
                    <ElisaInput
                        label={t('nom')}
                        {...register('nom')}
                        error={errors.nom?.message}
                        required
                    />
                </div>
                <Controller name="type" control={control} render={({ field }) => (
                    <ElisaSelect
                        label={t('type')}
                        value={field.value}
                        onValueChange={field.onChange}
                        options={[
                            { value: 'PATRONALE', label: 'Patronale' },
                            { value: 'SALARIALE', label: 'Salariale' },
                            { value: 'MIXTE', label: 'Mixte' },
                        ]}
                        error={errors.type?.message}
                    />
                )} />
                <div className="grid grid-cols-2 gap-4">
                    <ElisaInput
                        label={t('tauxPatronal')}
                        type="number"
                        step="0.01"
                        {...register('tauxPatronal', { valueAsNumber: true })}
                        error={errors.tauxPatronal?.message}
                    />
                    <ElisaInput
                        label={t('tauxSalarial')}
                        type="number"
                        step="0.01"
                        {...register('tauxSalarial', { valueAsNumber: true })}
                        error={errors.tauxSalarial?.message}
                    />
                </div>
                <ElisaInput
                    label={t('plafond')}
                    type="number"
                    step="0.01"
                    {...register('plafond', { valueAsNumber: true })}
                    error={errors.plafond?.message}
                />
                <ElisaInput
                    label={t('description')}
                    {...register('description')}
                    error={errors.description?.message}
                />
            </form>
        </CustomModal>
    );
}
