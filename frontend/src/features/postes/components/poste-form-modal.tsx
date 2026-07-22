import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { X, Plus, Briefcase } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { BaseFormModal } from '@/features/organisation/components/base-form-modal';
import { ElisaInput } from '@/components/ui/ElisaInput';
import { ElisaSelect } from '@/components/ui/ElisaSelect';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { useCreerPoste, useModifierPoste } from '../hooks/use-postes';
import { useToutesFonctions } from '@/features/fonctions/hooks/use-fonctions';
import { createPosteSchema, updatePosteSchema } from '../types/poste.zod';
import type { Poste } from '../types/poste.types';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    poste?: Poste | null;
    onSuccess?: () => void;
}

export function PosteFormModal({ open, onOpenChange, poste, onSuccess }: Props) {
    const { t } = useTranslation('organisation');
    const isEdit = !!poste;
    const creer = useCreerPoste();
    const modifier = useModifierPoste();
    const { data: fonctions } = useToutesFonctions();
    const { data: unites } = useQuery({
        queryKey: ['unites', 'all'],
        queryFn: async () => {
            const res = await apiClient.get('/api/organisation/unites');
            return (res as any).data || [];
        },
    });
    const { data: categoriesPoste } = useQuery({
        queryKey: ['categories-poste'],
        queryFn: async () => {
            const res = await apiClient.get('/api/organisation/categories-poste');
            return (res as any).data || [];
        },
    });
    const { data: niveauxResponsabilite } = useQuery({
        queryKey: ['niveaux-responsabilite'],
        queryFn: async () => {
            const res = await apiClient.get('/api/organisation/niveaux-responsabilite');
            return (res as any).data || [];
        },
    });

    const [apiError, setApiError] = useState<string | null>(null);
    const [missionText, setMissionText] = useState('');
    const [competenceText, setCompetenceText] = useState('');

    const schema = isEdit ? updatePosteSchema : createPosteSchema;

    const { register, handleSubmit, control, formState: { errors, isSubmitting }, watch, setValue } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            intitule: poste?.intitule || '',
            description: poste?.description || '',
            code: poste?.code || '',
            categoriePosteId: poste?.categoriePosteId || '',
            niveauResponsabiliteId: poste?.niveauResponsabiliteId || '',
            fonctionId: poste?.fonctionId || '',
            uniteOrganisationnelleId: poste?.uniteOrganisationnelleId || '',
            nombrePostes: poste?.nombrePostes ?? 1,
            competencesRequises: poste?.competencesRequises || [],
            missions: poste?.missions || [],
        },
    });

    const missions = watch('missions') || [];
    const competences = watch('competencesRequises') || [];

    const fonctionOptions = (fonctions || [])
        .filter((f: any) => f.actif !== false)
        .map((f: any) => ({ value: f.id, label: `${f.nom} (${f.code})` }));

    const uniteOptions = (unites || []).map((u: any) => ({
        value: u.id,
        label: `${u.nom} (${u.code})`,
    }));

    const categorieOptions = (categoriesPoste || []).map((c: any) => ({
        value: c.id,
        label: `${c.label} (${c.code})`,
    }));

    const niveauOptions = (niveauxResponsabilite || []).map((n: any) => ({
        value: n.id,
        label: `${n.label} (Niveau ${n.niveau})`,
    }));

    const addMission = () => {
        if (missionText.trim()) {
            setValue('missions', [...missions, missionText.trim()], { shouldValidate: true });
            setMissionText('');
        }
    };

    const removeMission = (index: number) => {
        setValue('missions', missions.filter((_, i) => i !== index), { shouldValidate: true });
    };

    const addCompetence = () => {
        if (competenceText.trim()) {
            setValue('competencesRequises', [...competences, competenceText.trim()], { shouldValidate: true });
            setCompetenceText('');
        }
    };

    const removeCompetence = (index: number) => {
        setValue('competencesRequises', competences.filter((_, i) => i !== index), { shouldValidate: true });
    };

    const onFormSubmit = async (data: any) => {
        setApiError(null);
        try {
            const payload = {
                ...data,
                categoriePosteId: data.categoriePosteId || undefined,
                niveauResponsabiliteId: data.niveauResponsabiliteId || undefined,
                fonctionId: data.fonctionId || undefined,
            };
            if (isEdit && poste) {
                await modifier.mutateAsync({ id: poste.id, dto: payload });
            } else {
                payload.code = payload.code.toUpperCase();
                await creer.mutateAsync(payload);
            }
            onSuccess?.();
            onOpenChange(false);
        } catch (err: any) {
            setApiError(err?.response?.data?.message || err?.message || 'Une erreur est survenue');
        }
    };

    const intituleValide = watch('intitule')?.trim()?.length >= 2;
    const codeValide = watch('code')?.trim()?.length >= 2;
    const uniteValide = watch('uniteOrganisationnelleId');
    const canSubmit = intituleValide && codeValide && uniteValide;

    return (
        <BaseFormModal
            open={open}
            onOpenChange={onOpenChange}
            title={isEdit ? t('modifierPoste') : t('nouveauPoste')}
            icon={Briefcase}
            color="purple"
            size="lg"
            submitLabel={isEdit ? t('enregistrer') : t('creer')}
            loading={isSubmitting || creer.isPending || modifier.isPending}
            disabled={!canSubmit}
            onSubmit={handleSubmit(onFormSubmit)}
            apiError={apiError}
        >
            <div className="grid grid-cols-2 gap-4">
                <ElisaInput label={t('intitulePoste') + ' *'} {...register('intitule')}
                    placeholder="Proviseur"
                    error={errors.intitule?.message as string}
                />
                <ElisaInput label={t('code') + ' *'}
                    {...register('code')}
                    placeholder="PROVISEUR"
                    disabled={isEdit}
                    error={errors.code?.message as string}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Controller
                    name="fonctionId"
                    control={control}
                    render={({ field }) => (
                        <ElisaSelect label={t('fonction')}
                            value={field.value || ''}
                            onValueChange={field.onChange}
                            options={fonctionOptions}
                            placeholder={t('selectionner')}
                        />
                    )}
                />
                <Controller
                    name="niveauResponsabiliteId"
                    control={control}
                    render={({ field }) => (
                        <ElisaSelect label={t('niveauResponsabilite')}
                            value={field.value || ''}
                            onValueChange={field.onChange}
                            options={niveauOptions}
                            error={errors.niveauResponsabiliteId?.message as string}
                        />
                    )}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Controller
                    name="categoriePosteId"
                    control={control}
                    render={({ field }) => (
                        <ElisaSelect label={t('categoriePoste')}
                            value={field.value || ''}
                            onValueChange={field.onChange}
                            options={categorieOptions}
                            placeholder={t('selectionner')}
                        />
                    )}
                />
                <Controller
                    name="uniteOrganisationnelleId"
                    control={control}
                    render={({ field }) => (
                        <ElisaSelect label={t('unites') + ' *'}
                            value={field.value}
                            onValueChange={field.onChange}
                            options={uniteOptions}
                            placeholder={t('selectionner')}
                            error={errors.uniteOrganisationnelleId?.message as string}
                        />
                    )}
                />
            </div>

            <ElisaInput label={t('description')}
                {...register('description')}
                placeholder={t('description')}
                error={errors.description?.message as string}
            />

            <ElisaInput label={t('nombrePostes')} type="number"
                {...register('nombrePostes', { valueAsNumber: true })}
                error={errors.nombrePostes?.message as string}
            />

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('missions')}</label>
                <div className="flex gap-2 mb-2">
                    <ElisaInput value={missionText}
                        onChange={(e: any) => setMissionText(e.target.value ?? e)}
                        placeholder="Ajouter une mission"
                        onKeyDown={(e: any) => e.key === 'Enter' && addMission()}
                    />
                    <ElisaButton variant="outline" size="sm" onClick={addMission}><Plus className="h-4 w-4" /></ElisaButton>
                </div>
                <div className="flex flex-wrap gap-1">
                    {missions.map((m: string, i: number) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/30"
                            onClick={() => removeMission(i)}>
                            {m} <X className="h-3 w-3" />
                        </span>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('competencesRequises')}</label>
                <div className="flex gap-2 mb-2">
                    <ElisaInput value={competenceText}
                        onChange={(e: any) => setCompetenceText(e.target.value ?? e)}
                        placeholder="Ajouter une compétence"
                        onKeyDown={(e: any) => e.key === 'Enter' && addCompetence()}
                    />
                    <ElisaButton variant="outline" size="sm" onClick={addCompetence}><Plus className="h-4 w-4" /></ElisaButton>
                </div>
                <div className="flex flex-wrap gap-1">
                    {competences.map((c: string, i: number) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/30"
                            onClick={() => removeCompetence(i)}>
                            {c} <X className="h-3 w-3" />
                        </span>
                    ))}
                </div>
            </div>
        </BaseFormModal>
    );
}
