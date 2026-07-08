import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Layers } from 'lucide-react';
import { ElisaInput } from '@/components/ui/ElisaInput';
import { ElisaSelect } from '@/components/ui/ElisaSelect';
import { useCreerUnite, useModifierUnite } from '../hooks/use-organisation';
import { createUniteSchema, updateUniteSchema } from '../types/organisation.zod';
import { BaseFormModal } from './base-form-modal';
import type { UniteOrganisationnelle, TypeUnite } from '../types/organisation.types';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    organisationId: string;
    parentId?: string;
    unite?: UniteOrganisationnelle | null;
}

export function UniteFormModal({ open, onOpenChange, organisationId, parentId, unite }: Props) {
    const { t } = useTranslation('organisation');
    const isEdit = !!unite;
    const creer = useCreerUnite();
    const modifier = useModifierUnite();
    const [apiError, setApiError] = useState<string | null>(null);

    const schema = isEdit ? updateUniteSchema : createUniteSchema;

    const { register, handleSubmit, control, formState: { errors, isSubmitting }, watch } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            nom: unite?.nom || '',
            type: (unite?.type || 'SERVICE') as TypeUnite,
            code: unite?.code || '',
            description: unite?.description || '',
            ordre: unite?.ordre ?? 0,
            responsableNom: unite?.responsableNom || '',
            localisation: unite?.localisation || '',
            telephone: unite?.telephone || '',
            email: unite?.email || '',
        },
    });

    const nomValue = watch('nom');
    const codeValue = watch('code');
    const nomValide = typeof nomValue === 'string' && nomValue.trim().length >= 2;
    const codeValide = typeof codeValue === 'string' && codeValue.trim().length >= 2;

    const typesUnite = Object.entries(t('typesUnite', { returnObjects: true }) as Record<string, string>)
        .map(([value, label]) => ({ value: value as TypeUnite, label }));

    const onSubmit = async (data: any) => {
        setApiError(null);
        try {
            const payload = { ...data, organisationId, parentId: parentId || unite?.parentId || undefined };
            if (isEdit && unite) {
                const { code: _, ...updateData } = payload;
                await modifier.mutateAsync({ id: unite.id, ...updateData });
            } else {
                await creer.mutateAsync(payload);
            }
            onOpenChange(false);
        } catch (err: any) {
            setApiError(err?.response?.data?.message || err?.message || 'Une erreur est survenue');
        }
    };

    return (
        <BaseFormModal
            open={open}
            onOpenChange={onOpenChange}
            title={isEdit ? t('modifierUnite') : t('nouvelleUnite')}
            icon={Layers}
            color="indigo"
            size="lg"
            submitLabel={isEdit ? t('enregistrer') : t('creer')}
            loading={isSubmitting}
            disabled={!nomValide || !codeValide}
            onSubmit={handleSubmit(onSubmit)}
            apiError={apiError}
        >
            <div className="grid grid-cols-2 gap-4">
                <ElisaInput label={t('nom') + ' *'} {...register('nom')}
                    placeholder={t('nom')}
                    error={errors.nom?.message as string}
                />
                <ElisaInput label={t('code') + ' *'}
                    {...register('code')}
                    placeholder="DEP-FR"
                    disabled={isEdit}
                    error={errors.code?.message as string}
                />
            </div>

            <Controller
                name="type"
                control={control}
                render={({ field }) => (
                    <ElisaSelect label={t('typeUnite')}
                        value={field.value}
                        onValueChange={field.onChange}
                        options={typesUnite}
                        error={errors.type?.message as string}
                    />
                )}
            />

            <ElisaInput label={t('description')}
                {...register('description')}
                placeholder={t('description')}
                error={errors.description?.message as string}
            />

            <div className="grid grid-cols-2 gap-4">
                <ElisaInput label={t('responsable')}
                    {...register('responsableNom')}
                    placeholder={t('responsable')}
                    error={errors.responsableNom?.message as string}
                />
                <ElisaInput label={t('ordre')} type="number"
                    {...register('ordre', { valueAsNumber: true })}
                    error={errors.ordre?.message as string}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <ElisaInput label={t('localisation')}
                    {...register('localisation')}
                    placeholder={t('localisation')}
                    error={errors.localisation?.message as string}
                />
                <ElisaInput label={t('telephone')}
                    {...register('telephone')}
                    placeholder="+237 690 000 000"
                    error={errors.telephone?.message as string}
                />
            </div>

            <ElisaInput label={t('email')} type="email"
                {...register('email')}
                placeholder="unite@example.com"
                error={errors.email?.message as string}
            />
        </BaseFormModal>
    );
}
