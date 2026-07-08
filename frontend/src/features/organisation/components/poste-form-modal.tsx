import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Briefcase, X, Plus } from 'lucide-react';
import { ElisaInput } from '@/components/ui/ElisaInput';
import { ElisaSelect } from '@/components/ui/ElisaSelect';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { useCreerPoste, useModifierPoste } from '../hooks/use-organisation';
import { createPosteSchema, updatePosteSchema } from '../types/organisation.zod';
import { BaseFormModal } from './base-form-modal';
import type { Poste, UniteOrganisationnelle, TypePoste, NiveauResponsabilite } from '../types/organisation.types';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    organisationId: string;
    unites: UniteOrganisationnelle[];
    poste?: Poste | null;
}

export function PosteFormModal({ open, onOpenChange, organisationId, unites, poste }: Props) {
    const { t } = useTranslation('organisation');
    const isEdit = !!poste;
    const creer = useCreerPoste();
    const modifier = useModifierPoste();
    const [apiError, setApiError] = useState<string | null>(null);
    const [missionText, setMissionText] = useState('');
    const [competenceText, setCompetenceText] = useState('');

    const schema = isEdit ? updatePosteSchema : createPosteSchema;

    const { register, handleSubmit, control, formState: { errors, isSubmitting }, watch, setValue } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            intitulé: poste?.intitulé || '',
            code: poste?.code || '',
            type: (poste?.type || 'ADMINISTRATIF') as TypePoste,
            niveauResponsabilite: (poste?.niveauResponsabilite || 'EXECUTANT') as NiveauResponsabilite,
            uniteOrganisationnelleId: poste?.uniteOrganisationnelleId || '',
            description: poste?.description || '',
            nombrePostes: poste?.nombrePostes ?? 1,
            missions: poste?.missions || [],
            competencesRequises: poste?.competencesRequises || [],
        },
    });

    const intituleValue = watch('intitulé');
    const codeValue = watch('code');
    const uniteValue = watch('uniteOrganisationnelleId');
    const missions = watch('missions') || [];
    const competences = watch('competencesRequises') || [];
    const intituleValide = typeof intituleValue === 'string' && intituleValue.trim().length >= 2;
    const codeValide = typeof codeValue === 'string' && codeValue.trim().length >= 2;

    const typesPoste = Object.entries(t('typesPoste', { returnObjects: true }) as Record<string, string>)
        .map(([value, label]) => ({ value: value as TypePoste, label }));

    const niveaux = Object.entries(t('niveauxResponsabilite', { returnObjects: true }) as Record<string, string>)
        .map(([value, label]) => ({ value: value as NiveauResponsabilite, label }));

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

    const onSubmit = async (data: any) => {
        setApiError(null);
        try {
            if (isEdit && poste) {
                await modifier.mutateAsync({ id: poste.id, ...data });
            } else {
                await creer.mutateAsync(data);
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
            title={isEdit ? t('modifierPoste') : t('nouveauPoste')}
            icon={Briefcase}
            color="purple"
            size="lg"
            submitLabel={isEdit ? t('enregistrer') : t('creer')}
            loading={isSubmitting}
            disabled={!intituleValide || !codeValide || !uniteValue}
            onSubmit={handleSubmit(onSubmit)}
            apiError={apiError}
        >
            <div className="grid grid-cols-2 gap-4">
                <ElisaInput label={t('intitulePoste') + ' *'} {...register('intitulé')}
                    placeholder="Proviseur"
                    error={errors.intitulé?.message as string}
                />
                <ElisaInput label={t('code') + ' *'}
                    {...register('code')}
                    placeholder="PROVISEUR"
                    disabled={isEdit}
                    error={errors.code?.message as string}
                />
            </div>

            <Controller
                name="uniteOrganisationnelleId"
                control={control}
                render={({ field }) => (
                    <ElisaSelect label={t('unites') + ' *'}
                        value={field.value}
                        onValueChange={field.onChange}
                        options={unites.map((u) => ({ value: u.id, label: `${u.nom} (${u.code})` }))}
                        placeholder={t('selectionner')}
                        error={errors.uniteOrganisationnelleId?.message as string}
                    />
                )}
            />

            <div className="grid grid-cols-2 gap-4">
                <Controller
                    name="type"
                    control={control}
                    render={({ field }) => (
                        <ElisaSelect label={t('type')}
                            value={field.value}
                            onValueChange={field.onChange}
                            options={typesPoste}
                            error={errors.type?.message as string}
                        />
                    )}
                />
                <Controller
                    name="niveauResponsabilite"
                    control={control}
                    render={({ field }) => (
                        <ElisaSelect label={t('niveauResponsabilite')}
                            value={field.value}
                            onValueChange={field.onChange}
                            options={niveaux}
                            error={errors.niveauResponsabilite?.message as string}
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
                <ElisaInput label={t('nombrePostes')} type="number"
                    {...register('nombrePostes', { valueAsNumber: true })}
                    error={errors.nombrePostes?.message as string}
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('missions')}</label>
                <div className="flex gap-2 mb-2">
                    <ElisaInput value={missionText}
                        onChange={(e: any) => setMissionText(e.target.value ?? e)}
                        placeholder={t('missions')}
                        onKeyDown={(e: any) => e.key === 'Enter' && addMission()}
                    />
                    <ElisaButton variant="outline" size="sm" onClick={addMission}><Plus className="h-4 w-4" /></ElisaButton>
                </div>
                <div className="flex flex-wrap gap-1">
                    {missions.map((m, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs"
                            onClick={() => removeMission(i)}>
                            {m} <X className="h-3 w-3 cursor-pointer" />
                        </span>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('competencesRequises')}</label>
                <div className="flex gap-2 mb-2">
                    <ElisaInput value={competenceText}
                        onChange={(e: any) => setCompetenceText(e.target.value ?? e)}
                        placeholder={t('competences')}
                        onKeyDown={(e: any) => e.key === 'Enter' && addCompetence()}
                    />
                    <ElisaButton variant="outline" size="sm" onClick={addCompetence}><Plus className="h-4 w-4" /></ElisaButton>
                </div>
                <div className="flex flex-wrap gap-1">
                    {competences.map((c, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs"
                            onClick={() => removeCompetence(i)}>
                            {c} <X className="h-3 w-3 cursor-pointer" />
                        </span>
                    ))}
                </div>
            </div>
        </BaseFormModal>
    );
}
