import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ClipboardList, Info } from 'lucide-react';
import { BaseFormModal } from '@/features/organisation/components/base-form-modal';
import { ElisaSelect } from '@/components/ui/ElisaSelect';
import { ElisaInput } from '@/components/ui/ElisaInput';
import { useClasses } from '@/features/classes/hooks/use-classes';
import { useElevesClasse } from '@/features/classes/hooks/use-classes';
import { useMatieres } from '@/features/matieres/hooks/use-matieres';
import { usePeriodes } from '@/features/periodes/hooks/use-periodes';
import { useCreerNote, useModifierNote } from '../hooks/use-notes';
import type { Note } from '../types/note.types';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    note?: Note | null;
}

const TYPE_OPTIONS = [
    { value: 'DEVOIR', labelKey: 'composition' },
    { value: 'INTERROGATION', labelKey: 'interrogation' },
    { value: 'EXAMEN', labelKey: 'examen' },
    { value: 'PROJET', labelKey: 'projet' },
    { value: 'PARTICIPATION', labelKey: 'participation' },
    { value: 'AUTRE', labelKey: 'autre' },
];

export function NoteFormModal({ open, onOpenChange, note }: Props) {
    const { t } = useTranslation('notes');
    const isEdit = !!note;
    const creer = useCreerNote();
    const modifier = useModifierNote();
    const [apiError, setApiError] = useState<string | null>(null);
    const [classeId, setClasseId] = useState('');

    const { data: classesData } = useClasses({ limit: 100 });
    const { data: elevesData } = useElevesClasse(classeId);
    const { data: matieresData } = useMatieres({ limit: 100 });
    const { data: periodes } = usePeriodes({});

    const classes = classesData?.items || [];
    const eleves = elevesData?.eleves?.items || [];
    const matieres = matieresData?.items || [];

    const selectedClasse = classes.find((c: any) => c.id === classeId);

    const noteSchema = useMemo(() => z.object({
        eleveId: z.string().uuid(t('validationEleveRequis')),
        matiereId: z.string().uuid(t('validationMatiereRequis')),
        periodeId: z.string().uuid(t('validationPeriodeRequis')),
        typeEvaluation: z.string().default('DEVOIR'),
        valeur: z.number({ required_error: t('validationValeurRequis') }).min(0, t('validationValeurMin')),
        commentaire: z.string().optional(),
        dateEvaluation: z.string().optional(),
    }), [t]);

    const { handleSubmit, control, formState: { errors, isSubmitting }, reset, watch, setValue } = useForm({
        resolver: zodResolver(noteSchema),
        defaultValues: {
            eleveId: note?.eleveId || '',
            matiereId: note?.matiereId || '',
            periodeId: note?.periodeId || '',
            typeEvaluation: note?.typeEvaluation || 'DEVOIR',
            valeur: note?.valeur || 0,
            commentaire: note?.commentaire || '',
            dateEvaluation: note?.dateEvaluation || '',
        },
    });

    const selectedMatiereId = watch('matiereId');
    const selectedMatiere = matieres.find((m: any) => m.id === selectedMatiereId) as Record<string, any> | undefined;

    useEffect(() => {
        if (!open) {
            reset();
            setClasseId('');
            setApiError(null);
        }
    }, [open, reset]);

    const onSubmit = async (data: any) => {
        setApiError(null);
        try {
            const payload = {
                eleveId: data.eleveId,
                matiereId: data.matiereId,
                periodeId: data.periodeId,
                classeAnneeId: selectedClasse?.classeAnneeId || classeId,
                typeEvaluation: data.typeEvaluation,
                valeur: data.valeur,
                commentaire: data.commentaire || undefined,
                dateEvaluation: data.dateEvaluation || undefined,
            };
            if (isEdit && note) {
                await modifier.mutateAsync({ id: note.id, ...payload });
            } else {
                await creer.mutateAsync(payload);
            }
            onOpenChange(false);
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } }; message?: string };
            setApiError(e?.response?.data?.message || e?.message || t('erreurGenerique'));
        }
    };

    return (
        <BaseFormModal
            open={open}
            onOpenChange={onOpenChange}
            title={isEdit ? t('modifierNote') : t('nouvelleNote')}
            icon={ClipboardList}
            color="blue"
            size="md"
            submitLabel={isEdit ? t('enregistrer') : t('ajouter')}
            loading={isSubmitting}
            onSubmit={handleSubmit(onSubmit)}
            apiError={apiError}
        >
            <ElisaSelect
                label={t('classe')}
                value={classeId}
                onValueChange={(v) => { setClasseId(v); setValue('eleveId', ''); }}
                options={classes.map((c: any) => ({ value: c.id, label: c.nom }))}
                placeholder={t('selectionnerClasse')}
            />

            <Controller
                name="eleveId"
                control={control}
                render={({ field }) => (
                    <ElisaSelect
                        label={t('eleve') + ' *'}
                        value={field.value}
                        onValueChange={(v) => field.onChange(v)}
                        options={eleves.map((e: any) => ({ value: e.id, label: `${e.prenom} ${e.nom}` }))}
                        placeholder={!classeId ? t('classeObligatoire') : t('selectionnerEleve')}
                        error={errors.eleveId?.message as string}
                        disabled={!classeId}
                    />
                )}
            />

            <Controller
                name="matiereId"
                control={control}
                render={({ field }) => (
                    <ElisaSelect
                        label={t('matiere') + ' *'}
                        value={field.value}
                        onValueChange={field.onChange}
                        options={matieres.map((m: any) => ({ value: m.id, label: `${m.nom}${m.code ? ` (${m.code})` : ''}` }))}
                        placeholder={t('selectionnerMatiere')}
                        error={errors.matiereId?.message as string}
                    />
                )}
            />

            <Controller
                name="periodeId"
                control={control}
                render={({ field }) => (
                    <ElisaSelect
                        label={t('periode') + ' *'}
                        value={field.value}
                        onValueChange={field.onChange}
                        options={(periodes || []).map((p: any) => ({ value: p.id, label: p.nom }))}
                        placeholder={t('selectionnerPeriode')}
                        error={errors.periodeId?.message as string}
                    />
                )}
            />

            <Controller
                name="typeEvaluation"
                control={control}
                render={({ field }) => (
                    <ElisaSelect
                        label={t('type')}
                        value={field.value}
                        onValueChange={field.onChange}
                        options={TYPE_OPTIONS.map(o => ({ value: o.value, label: t(o.labelKey) }))}
                    />
                )}
            />

            <Controller
                name="valeur"
                control={control}
                render={({ field }) => (
                    <ElisaInput
                        label={t('valeur') + ' *'}
                        type="number"
                        min={0}
                        max={20}
                        step={0.25}
                        value={field.value}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        error={errors.valeur?.message as string}
                    />
                )}
            />

            {selectedMatiere && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
                    <Info className="h-4 w-4 text-muted-foreground shrink-0" />
                    <p className="text-xs text-muted-foreground">
                        {t('configAuto', { coefficient: selectedMatiere.coefficient || 1, bareme: 20 })}
                    </p>
                </div>
            )}

            <Controller
                name="commentaire"
                control={control}
                render={({ field }) => (
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-foreground">{t('commentaire')}</label>
                        <textarea
                            className="flex min-h-[80px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                            value={field.value || ''}
                            onChange={field.onChange}
                            placeholder={t('commentairePlaceholder')}
                        />
                    </div>
                )}
            />

            <Controller
                name="dateEvaluation"
                control={control}
                render={({ field }) => (
                    <ElisaInput
                        label={t('dateEvaluation')}
                        type="date"
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value)}
                    />
                )}
            />
        </BaseFormModal>
    );
}