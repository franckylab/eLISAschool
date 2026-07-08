import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2 } from 'lucide-react';
import { ElisaInput } from '@/components/ui/ElisaInput';
import { ElisaSelect } from '@/components/ui/ElisaSelect';
import { useCreerOrganisation, useModifierOrganisation } from '../hooks/use-organisation';
import { createOrganisationSchema, updateOrganisationSchema } from '../types/organisation.zod';
import { BaseFormModal } from './base-form-modal';
import type { Organisation, CreerOrganisationDto } from '../types/organisation.types';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    organisation?: Organisation | null;
}

export function OrganisationFormModal({ open, onOpenChange, organisation }: Props) {
    const { t } = useTranslation('organisation');
    const isEdit = !!organisation;
    const creer = useCreerOrganisation();
    const modifier = useModifierOrganisation();
    const [apiError, setApiError] = useState<string | null>(null);

    const schema = isEdit ? updateOrganisationSchema : createOrganisationSchema;

    const { register, handleSubmit, control, formState: { errors, isSubmitting }, watch } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            nom: organisation?.nom || '',
            description: organisation?.description || '',
            type: (organisation?.type || 'ETABLISSEMENT_SCOLAIRE') as any,
            code: organisation?.code || '',
            email: organisation?.email || '',
            telephone: organisation?.telephone || '',
            adresse: organisation?.adresse || '',
            siteWeb: organisation?.siteWeb || '',
        },
    });

    const nomValue = watch('nom');
    const nomValide = typeof nomValue === 'string' && nomValue.trim().length >= 2;

    const typeLabels = t('typeOrganisationLabel', { returnObjects: true }) as Record<string, string>;

    const onSubmit = async (data: any) => {
        setApiError(null);
        try {
            if (isEdit && organisation) {
                await modifier.mutateAsync({ id: organisation.id, ...data });
            } else {
                await creer.mutateAsync(data as CreerOrganisationDto);
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
            title={isEdit ? t('modifierOrganisation') : t('nouvelleOrganisation')}
            icon={Building2}
            color="blue"
            size="lg"
            submitLabel={isEdit ? t('enregistrer') : t('creer')}
            loading={isSubmitting}
            disabled={!nomValide}
            onSubmit={handleSubmit(onSubmit)}
            apiError={apiError}
        >
            <ElisaInput label={t('nom') + ' *'} {...register('nom')}
                placeholder={t('nom')}
                error={errors.nom?.message as string}
            />

            <div className="grid grid-cols-2 gap-4">
                <ElisaInput label={t('code')}
                    {...register('code')}
                    placeholder="ORG-001"
                    disabled={isEdit}
                    error={errors.code?.message as string}
                />
                <Controller
                    name="type"
                    control={control}
                    render={({ field }) => (
                        <ElisaSelect label={t('type')}
                            value={field.value}
                            onValueChange={field.onChange}
                            options={Object.entries(typeLabels).map(([value, label]) => ({ value, label }))}
                            error={errors.type?.message as string}
                        />
                    )}
                />
            </div>

            <ElisaInput label={t('description')}
                {...register('description')}
                placeholder={t('description')}
                error={errors.description?.message as string}
            />

            <div className="grid grid-cols-2 gap-4">
                <ElisaInput label={t('email')} type="email"
                    {...register('email')}
                    placeholder="contact@example.com"
                    error={errors.email?.message as string}
                />
                <ElisaInput label={t('telephone')}
                    {...register('telephone')}
                    placeholder="+237 690 000 000"
                    error={errors.telephone?.message as string}
                />
            </div>

            <ElisaInput label={t('adresse')}
                {...register('adresse')}
                placeholder={t('adresse')}
                error={errors.adresse?.message as string}
            />

            <ElisaInput label={t('siteWeb')}
                {...register('siteWeb')}
                placeholder="https://example.com"
                error={errors.siteWeb?.message as string}
            />
        </BaseFormModal>
    );
}
