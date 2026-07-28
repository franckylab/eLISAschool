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

import type { TypeRetenue } from '../types/paie.types';

type RetenueFormData = Omit<TypeRetenue, 'id' | 'etablissementId' | 'createdAt' | 'updatedAt'>;

interface RetenueModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (data: RetenueFormData) => Promise<void>;
    isLoading?: boolean;
    retenue?: TypeRetenue | null;
}

const FORM_INIT: RetenueFormData = {
    code: '',
    nom: '',
    frequence: 'PONCTUELLE',
    montantMax: undefined,
    description: '',
};

export function RetenueModal({ open, onOpenChange, onSave, isLoading, retenue }: RetenueModalProps) {
    const { t } = useTranslation('paie');

    const schema = useMemo(() => z.object({
        code: z.string().min(2, t('validation.codeMin')).max(30, t('validation.codeMax')),
        nom: z.string().min(2, t('validation.nomMin')).max(100, t('validation.nomMax')),
        frequence: z.enum(['PONCTUELLE', 'RECURRENTE']),
        montantMax: z.number().optional(),
        description: z.string().optional(),
    }), [t]);

    const { register, handleSubmit, control, reset, formState: { errors } } = useForm<RetenueFormData>({
        resolver: zodResolver(schema),
        defaultValues: FORM_INIT,
    });

    if (open && retenue) {
        reset({
            code: retenue.code || '',
            nom: retenue.nom || '',
            frequence: retenue.frequence || 'PONCTUELLE',
            montantMax: retenue.montantMax,
            description: retenue.description || '',
        });
    } else if (open && !retenue) {
        reset(FORM_INIT);
    }

    const onSubmit = async (data: RetenueFormData) => {
        const cleaned = {
            ...data,
            montantMax: Number.isNaN(data.montantMax) ? undefined : data.montantMax,
        };
        await onSave(cleaned);
    };

    return (
        <CustomModal
            open={open}
            onOpenChange={onOpenChange}
            title={retenue ? t('modifierTypeRetenue') : t('nouveauTypeRetenue')}
            footer={
                <>
                    <ElisaButton variant="outline" onClick={() => onOpenChange(false)}>
                        {t('common:boutons.annuler')}
                    </ElisaButton>
                    <ElisaButton type="submit" variant="primary" isLoading={isLoading} form="retenue-form">
                        {retenue ? t('common:boutons.enregistrer') : t('common:boutons.creer')}
                    </ElisaButton>
                </>
            }
        >
            <form id="retenue-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <h4 className="text-sm font-semibold text-[var(--color-text-strong)]">{t('informationsRetenue')}</h4>
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
                <Controller name="frequence" control={control} render={({ field }) => (
                    <ElisaSelect
                        label={t('frequence')}
                        value={field.value}
                        onValueChange={field.onChange}
                        options={[
                            { value: 'PONCTUELLE', label: t('ponctuelle') },
                            { value: 'RECURRENTE', label: t('recurrente') },
                        ]}
                        error={errors.frequence?.message}
                    />
                )} />
                <ElisaInput
                    label={t('montantMax')}
                    type="number"
                    step="0.01"
                    {...register('montantMax', { valueAsNumber: true })}
                    error={errors.montantMax?.message}
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
