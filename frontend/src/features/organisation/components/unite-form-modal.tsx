import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { Layers } from 'lucide-react';
import { ElisaInput } from '@/components/ui/ElisaInput';
import { ElisaSelect } from '@/components/ui/ElisaSelect';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth.store';
import { useCreerUnite, useModifierUnite } from '../hooks/use-organisation';
import { createUniteSchema, updateUniteSchema } from '../types/organisation.zod';
import { BaseFormModal } from './base-form-modal';
import type { UniteOrganisationnelle } from '../types/organisation.types';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    parentId?: string;
    unite?: UniteOrganisationnelle | null;
}

export function UniteFormModal({ open, onOpenChange, parentId, unite }: Props) {
    const { t } = useTranslation('organisation');
    const etablissementId = useAuthStore(s => s.etablissementId) || '';
    const isEdit = !!unite;
    const creer = useCreerUnite();
    const modifier = useModifierUnite();
    const [apiError, setApiError] = useState<string | null>(null);

    // Charger les types d'unité depuis l'API (table éditables)
    const { data: typesUniteData } = useQuery({
        queryKey: ['types-unite-organisationnelle'],
        queryFn: async () => {
            const res = await apiClient.get('/api/organisation/types-unite');
            return (res as any).data || [];
        },
    });

    // Charger les usages d'unité
    const { data: usagesUniteData } = useQuery({
        queryKey: ['usages-unite'],
        queryFn: async () => {
            const res = await apiClient.get('/api/organisation/usages-unite');
            return (res as any).data || [];
        },
    });

    // Charger les niveaux d'organisation
    const { data: niveauxOrgData } = useQuery({
        queryKey: ['niveaux-organisation'],
        queryFn: async () => {
            const res = await apiClient.get('/api/organisation/niveaux-organisation');
            return (res as any).data || [];
        },
    });

    const schema = isEdit ? updateUniteSchema : createUniteSchema;

    const { register, handleSubmit, control, formState: { errors, isSubmitting }, watch } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            nom: unite?.nom || '',
            typeUniteId: unite?.typeUniteId || '',
            usageUniteId: unite?.usageUniteId || '',
            niveauOrganisationId: unite?.niveauOrganisationId || '',
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

    const typesUniteOptions = (typesUniteData || []).map((tu: any) => ({
        value: tu.id,
        label: tu.label,
    }));

    const usagesUniteOptions = (usagesUniteData || []).map((u: any) => ({
        value: u.id,
        label: u.label,
    }));

    const niveauxOrgOptions = (niveauxOrgData || []).map((n: any) => ({
        value: n.id,
        label: `${n.label} (Niveau ${n.niveau})`,
    }));

    const onSubmit = async (data: any) => {
        setApiError(null);
        try {
            const payload = { ...data, etablissementId, parentId: parentId || unite?.parentId || undefined };
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

            <div className="grid grid-cols-3 gap-4">
                <Controller
                    name="typeUniteId"
                    control={control}
                    render={({ field }) => (
                        <ElisaSelect label={t('typeUnite')}
                            value={field.value || ''}
                            onValueChange={field.onChange}
                            options={typesUniteOptions}
                            placeholder={t('selectionner')}
                            error={errors.typeUniteId?.message as string}
                        />
                    )}
                />
                <Controller
                    name="usageUniteId"
                    control={control}
                    render={({ field }) => (
                        <ElisaSelect label={t('usageUnite')}
                            value={field.value || ''}
                            onValueChange={field.onChange}
                            options={usagesUniteOptions}
                            placeholder={t('selectionner')}
                        />
                    )}
                />
                <Controller
                    name="niveauOrganisationId"
                    control={control}
                    render={({ field }) => (
                        <ElisaSelect label={t('niveauOrganisation')}
                            value={field.value || ''}
                            onValueChange={field.onChange}
                            options={niveauxOrgOptions}
                            placeholder={t('selectionner')}
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
