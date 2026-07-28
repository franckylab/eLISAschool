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

import type { TypePrime } from '../types/paie.types';

type PrimeFormData = Omit<TypePrime, 'id' | 'actif' | 'etablissementId' | 'createdAt' | 'updatedAt'>;

interface PrimeModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (data: PrimeFormData) => Promise<void>;
    isLoading?: boolean;
    prime?: TypePrime | null;
}

const FORM_INIT: PrimeFormData = {
    code: '',
    nom: '',
    typeCalcul: 'FIXE',
    valeur: 0,
    description: '',
};

export function PrimeModal({ open, onOpenChange, onSave, isLoading, prime }: PrimeModalProps) {
    const { t } = useTranslation('paie');

    const schema = useMemo(() => z.object({
        code: z.string().min(2, t('validation.codeMin')).max(30, t('validation.codeMax')),
        nom: z.string().min(2, t('validation.nomMin')).max(100, t('validation.nomMax')),
        typeCalcul: z.enum(['FIXE', 'POURCENTAGE', 'VARIABLE']),
        valeur: z.number().min(0, t('validation.positif')),
        description: z.string().optional(),
    }), [t]);

    const { register, handleSubmit, control, reset, formState: { errors } } = useForm<PrimeFormData>({
        resolver: zodResolver(schema),
        defaultValues: FORM_INIT,
    });

    if (open && prime) {
        reset({
            code: prime.code || '',
            nom: prime.nom || '',
            typeCalcul: prime.typeCalcul || 'FIXE',
            valeur: prime.valeur || 0,
            description: prime.description || '',
        });
    } else if (open && !prime) {
        reset(FORM_INIT);
    }

    const onSubmit = async (data: PrimeFormData) => {
        await onSave(data);
    };

    return (
        <CustomModal
            open={open}
            onOpenChange={onOpenChange}
            title={prime ? t('modifierTypePrime') : t('nouveauTypePrime')}
            footer={
                <>
                    <ElisaButton variant="outline" onClick={() => onOpenChange(false)}>
                        {t('common:boutons.annuler')}
                    </ElisaButton>
                    <ElisaButton type="submit" variant="primary" isLoading={isLoading} form="prime-form">
                        {prime ? t('common:boutons.enregistrer') : t('common:boutons.creer')}
                    </ElisaButton>
                </>
            }
        >
            <form id="prime-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <h4 className="text-sm font-semibold text-[var(--color-text-strong)]">{t('informationsPrime')}</h4>
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
                <Controller name="typeCalcul" control={control} render={({ field }) => (
                    <ElisaSelect
                        label={t('typeCalcul')}
                        value={field.value}
                        onValueChange={field.onChange}
                        options={[
                            { value: 'FIXE', label: t('fixe') },
                            { value: 'POURCENTAGE', label: t('pourcentage') },
                            { value: 'VARIABLE', label: t('variable') },
                        ]}
                        error={errors.typeCalcul?.message}
                    />
                )} />
                <ElisaInput
                    label={t('valeur')}
                    type="number"
                    step="0.01"
                    {...register('valeur', { valueAsNumber: true })}
                    error={errors.valeur?.message}
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
