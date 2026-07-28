import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CustomModal } from '@/components/modals/CustomModal';
import { SectionSeparator } from '@/components/ui/SectionSeparator';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ElisaInput } from '@/components/ui/ElisaInput';

import type { BulletinPaie } from '../types/paie.types';

interface BulletinFormData {
    membrePersonnelId: string;
    contratId: string;
    mois: number;
    annee: number;
    salaireBase: number;
    primes: number;
    deductions: number;
}

interface BulletinFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (data: BulletinFormData) => Promise<void>;
    isLoading?: boolean;
    bulletin?: BulletinPaie | null;
}

const FORM_INIT = {
    membrePersonnelId: '',
    contratId: '',
    mois: new Date().getMonth() + 1,
    annee: new Date().getFullYear(),
    salaireBase: 0,
    primes: 0,
    deductions: 0,
};

export function BulletinFormModal({ open, onOpenChange, onSave, isLoading, bulletin }: BulletinFormModalProps) {
    const { t } = useTranslation('paie');

    const schema = useMemo(() => z.object({
        membrePersonnelId: z.string(),
        contratId: z.string(),
        mois: z.number().int().min(1, t('validation.moisMin')).max(12, t('validation.moisMax')),
        annee: z.number().int().min(2000, t('validation.anneeMin')).max(2100, t('validation.anneeMax')),
        salaireBase: z.number().min(0, t('validation.positif')),
        primes: z.number().min(0, t('validation.positif')),
        deductions: z.number().min(0, t('validation.positif')),
    }), [t]);

    const { register, handleSubmit, reset, formState: { errors } } = useForm<BulletinFormData>({
        resolver: zodResolver(schema),
        defaultValues: FORM_INIT,
    });

    if (open && bulletin) {
        reset({
            membrePersonnelId: bulletin.membrePersonnelId || '',
            contratId: bulletin.contratId || '',
            mois: bulletin.mois || new Date().getMonth() + 1,
            annee: bulletin.annee || new Date().getFullYear(),
            salaireBase: bulletin.salaireBase || 0,
            primes: bulletin.primes || 0,
            deductions: bulletin.deductions || 0,
        });
    } else if (open && !bulletin) {
        reset(FORM_INIT);
    }

    const onSubmit = async (data: BulletinFormData) => {
        await onSave(data);
    };

    return (
        <CustomModal
            open={open}
            onOpenChange={onOpenChange}
            title={bulletin ? t('modifierBulletin') : t('nouveauBulletin')}
            footer={
                <>
                    <ElisaButton variant="outline" onClick={() => onOpenChange(false)}>
                        {t('common:boutons.annuler')}
                    </ElisaButton>
                    <ElisaButton type="submit" variant="primary" isLoading={isLoading} form="bulletin-form">
                        {bulletin ? t('common:boutons.enregistrer') : t('common:boutons.creer')}
                    </ElisaButton>
                </>
            }
        >
            <form id="bulletin-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <h4 className="text-sm font-semibold text-[var(--color-text-strong)]">{t('informationsBulletin')}</h4>
                <SectionSeparator />
                <input type="hidden" {...register('membrePersonnelId')} />
                <input type="hidden" {...register('contratId')} />
                <div className="grid grid-cols-2 gap-4">
                    <ElisaInput
                        label={t('mois')}
                        type="number"
                        min={1}
                        max={12}
                        {...register('mois', { valueAsNumber: true })}
                        error={errors.mois?.message}
                    />
                    <ElisaInput
                        label={t('annee')}
                        type="number"
                        {...register('annee', { valueAsNumber: true })}
                        error={errors.annee?.message}
                    />
                </div>
                <ElisaInput
                    label={t('salaireBase')}
                    type="number"
                    step="0.01"
                    {...register('salaireBase', { valueAsNumber: true })}
                    error={errors.salaireBase?.message}
                />
                <div className="grid grid-cols-2 gap-4">
                    <ElisaInput
                        label={t('primes')}
                        type="number"
                        step="0.01"
                        {...register('primes', { valueAsNumber: true })}
                        error={errors.primes?.message}
                    />
                    <ElisaInput
                        label={t('deductions')}
                        type="number"
                        step="0.01"
                        {...register('deductions', { valueAsNumber: true })}
                        error={errors.deductions?.message}
                    />
                </div>
            </form>
        </CustomModal>
    );
}
