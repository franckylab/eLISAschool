/**
 * ==================================
 * eLISAschool - Modal formulaire Note
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 *
 * Création / modification d'une note via CustomModal.
 * Selects dépendants (classe → élèves), validation Zod, garde-fou
 * fermeture avec modifications non enregistrées.
 */

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, Info } from 'lucide-react';
import { CustomModal } from '@/components/modals/CustomModal';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ElisaSelect } from '@/components/ui/ElisaSelect';
import { ElisaInput } from '@/components/ui/ElisaInput';
import { useClasses, useElevesClasse } from '@/features/classes/hooks/use-classes';
import { useMatieres } from '@/features/matieres/hooks/use-matieres';
import { usePeriodes } from '@/features/periodes/hooks/use-periodes';
import { useAnneeScolaireActive } from '@/features/annees-scolaires/hooks/use-annees-scolaires';
import { useCreerNote, useModifierNote } from '../hooks/use-notes';
import type { Note, TypeEvaluation } from '../types/note.types';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    note?: Note | null;
}

interface EleveOption {
    id: string;
    nom: string;
    prenom: string;
}

const TYPES_EVALUATION: TypeEvaluation[] = [
    'DEVOIR',
    'INTERROGATION',
    'EXAMEN',
    'PROJET',
    'PARTICIPATION',
    'AUTRE',
];

interface FormValues {
    classeAnneeId: string;
    eleveId: string;
    matiereId: string;
    periodeId: string;
    typeEvaluation: TypeEvaluation;
    valeur: number;
    bareme: number;
    coefficient: number;
    commentaire: string;
    dateEvaluation: string;
}

const FORM_INIT: FormValues = {
    classeAnneeId: '',
    eleveId: '',
    matiereId: '',
    periodeId: '',
    typeEvaluation: 'DEVOIR',
    valeur: 0,
    bareme: 20,
    coefficient: 1,
    commentaire: '',
    dateEvaluation: '',
};

export function NoteFormModal({ open, onOpenChange, note }: Props) {
    const { t } = useTranslation('notes');
    const isEdit = !!note;
    const creer = useCreerNote();
    const modifier = useModifierNote();
    const [apiError, setApiError] = useState<string | null>(null);
    const [classeId, setClasseId] = useState('');
    const [confirmFermeture, setConfirmFermeture] = useState(false);

    const { data: classesData } = useClasses({ limit: 100 });
    const { data: elevesData } = useElevesClasse(classeId, 1, 200);
    const { data: matieresData } = useMatieres({ limit: 100 });
    const { data: anneeActive } = useAnneeScolaireActive();
    const { data: periodes } = usePeriodes({ anneeId: anneeActive?.id || '' });

    const classes = useMemo(
        () => (classesData?.items ?? []).filter((c) => !!c.classeAnneeId),
        [classesData]
    );
    const eleves: EleveOption[] = useMemo(
        () => (elevesData?.eleves?.items ?? []).map((e) => ({
            id: String(e.id ?? ''),
            nom: String(e.nom ?? ''),
            prenom: String(e.prenom ?? ''),
        })),
        [elevesData]
    );
    const matieres = matieresData?.items ?? [];

    const noteSchema = useMemo(() => z.object({
        classeAnneeId: z.string().min(1, t('validationClasseRequise')),
        eleveId: z.string().min(1, t('validationEleveRequis')),
        matiereId: z.string().min(1, t('validationMatiereRequis')),
        periodeId: z.string().min(1, t('validationPeriodeRequis')),
        typeEvaluation: z.enum(['DEVOIR', 'INTERROGATION', 'EXAMEN', 'PROJET', 'PARTICIPATION', 'AUTRE']),
        valeur: z.number({ invalid_type_error: t('validationValeurRequis'), required_error: t('validationValeurRequis') })
            .min(0, t('validationValeurMin')),
        bareme: z.number({ invalid_type_error: t('validationBaremeRequis'), required_error: t('validationBaremeRequis') })
            .positive(t('validationBaremePositif')),
        coefficient: z.number({ invalid_type_error: t('validationCoefficientRequis'), required_error: t('validationCoefficientRequis') })
            .min(0, t('validationCoefficientMin')),
        commentaire: z.string(),
        dateEvaluation: z.string(),
    }).refine((d) => d.valeur <= d.bareme, {
        message: t('validationValeurMax'),
        path: ['valeur'],
    }), [t]);

    const {
        handleSubmit,
        control,
        formState: { errors, isSubmitting, isDirty },
        reset,
        setValue,
        watch,
    } = useForm<FormValues>({
        resolver: zodResolver(noteSchema),
        defaultValues: FORM_INIT,
    });

    const selectedMatiereId = watch('matiereId');
    const selectedMatiere = matieres.find((m) => m.id === selectedMatiereId);
    const baremeActuel = watch('bareme');
    const coefficientActuel = watch('coefficient');

    // Réinitialisation à chaque ouverture (création ou édition)
    useEffect(() => {
        if (!open) return;
        setApiError(null);
        if (note) {
            reset({
                classeAnneeId: note.classeAnneeId,
                eleveId: note.eleveId,
                matiereId: note.matiereId,
                periodeId: note.periodeId,
                typeEvaluation: note.typeEvaluation,
                valeur: note.valeur,
                bareme: note.bareme ?? 20,
                coefficient: note.coefficient ?? 1,
                commentaire: note.commentaire ?? '',
                dateEvaluation: note.dateEvaluation ? note.dateEvaluation.slice(0, 10) : '',
            });
            setClasseId(note.classeAnnee?.classe?.id ?? '');
        } else {
            reset(FORM_INIT);
            setClasseId('');
        }
    }, [open, note, reset]);

    const fermer = () => {
        setConfirmFermeture(false);
        onOpenChange(false);
    };

    const demanderFermeture = (prochainEtat: boolean) => {
        if (prochainEtat) return;
        if (isDirty && !isSubmitting) {
            setConfirmFermeture(true);
            return;
        }
        fermer();
    };

    const onSubmit = async (data: FormValues) => {
        setApiError(null);
        try {
            if (isEdit && note) {
                await modifier.mutateAsync({
                    id: note.id,
                    typeEvaluation: data.typeEvaluation,
                    valeur: data.valeur,
                    bareme: data.bareme,
                    coefficient: data.coefficient,
                    commentaire: data.commentaire || undefined,
                    dateEvaluation: data.dateEvaluation || undefined,
                });
            } else {
                await creer.mutateAsync({
                    eleveId: data.eleveId,
                    matiereId: data.matiereId,
                    periodeId: data.periodeId,
                    classeAnneeId: data.classeAnneeId,
                    typeEvaluation: data.typeEvaluation,
                    valeur: data.valeur,
                    bareme: data.bareme,
                    coefficient: data.coefficient,
                    commentaire: data.commentaire || undefined,
                    dateEvaluation: data.dateEvaluation || undefined,
                });
            }
            fermer();
        } catch (err: unknown) {
            let message = t('erreurGenerique');
            if (err instanceof Error && err.message) {
                message = err.message;
            } else if (typeof err === 'object' && err !== null && 'message' in err) {
                const m = (err as { message?: unknown }).message;
                if (typeof m === 'string' && m.length > 0) message = m;
            }
            setApiError(message);
        }
    };

    return (
        <>
            <CustomModal
                open={open}
                onOpenChange={demanderFermeture}
                title={isEdit ? t('modifierNote') : t('nouvelleNote')}
                size="lg"
                footer={
                    <div className="flex justify-end gap-[var(--gap-sm)]">
                        <ElisaButton variant="outline" size="sm" onClick={() => demanderFermeture(false)}>
                            {t('annuler')}
                        </ElisaButton>
                        <ElisaButton
                            variant="primary"
                            size="sm"
                            type="submit"
                            form="note-form"
                            isLoading={isSubmitting}
                        >
                            {isEdit ? t('enregistrer') : t('ajouter')}
                        </ElisaButton>
                    </div>
                }
            >
                <form id="note-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-[clamp(0.625rem,1.5vw,1rem)]">
                    {apiError && (
                        <div className="flex items-center gap-2 rounded-[var(--radius-lg)] border border-danger/30 bg-danger/10 p-3">
                            <AlertCircle className="h-[var(--icon-sm)] w-[var(--icon-sm)] text-danger shrink-0" />
                            <p className="text-sm text-danger">{apiError}</p>
                        </div>
                    )}

                    <Controller
                        name="classeAnneeId"
                        control={control}
                        render={({ field }) => (
                            <ElisaSelect
                                label={t('classe') + ' *'}
                                value={field.value}
                                onValueChange={(v) => {
                                    field.onChange(v);
                                    const classe = classes.find((c) => c.classeAnneeId === v);
                                    setClasseId(classe?.id ?? '');
                                    setValue('eleveId', '');
                                }}
                                options={classes.map((c) => ({ value: c.classeAnneeId as string, label: c.nom }))}
                                placeholder={t('selectionnerClasse')}
                                error={errors.classeAnneeId?.message}
                                disabled={isEdit}
                            />
                        )}
                    />

                    <Controller
                        name="eleveId"
                        control={control}
                        render={({ field }) => (
                            <ElisaSelect
                                label={t('eleve') + ' *'}
                                value={field.value}
                                onValueChange={field.onChange}
                                options={eleves.map((e) => ({ value: e.id, label: `${e.prenom} ${e.nom}` }))}
                                placeholder={!classeId ? t('classeObligatoire') : t('selectionnerEleve')}
                                error={errors.eleveId?.message}
                                disabled={isEdit || !classeId}
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
                                options={matieres.map((m) => ({ value: m.id, label: `${m.nom}${m.code ? ` (${m.code})` : ''}` }))}
                                placeholder={t('selectionnerMatiere')}
                                error={errors.matiereId?.message}
                                disabled={isEdit}
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
                                options={(periodes ?? []).map((p) => ({ value: p.id, label: p.nom }))}
                                placeholder={t('selectionnerPeriode')}
                                error={errors.periodeId?.message}
                                disabled={isEdit}
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
                                options={TYPES_EVALUATION.map((type) => ({ value: type, label: t(type.toLowerCase()) }))}
                            />
                        )}
                    />

                    <div className="grid grid-cols-1 gap-[var(--gap-sm)] min-[480px]:grid-cols-3">
                        <Controller
                            name="valeur"
                            control={control}
                            render={({ field }) => (
                                <ElisaInput
                                    label={t('valeur') + ' *'}
                                    type="number"
                                    min={0}
                                    max={baremeActuel || 20}
                                    step={0.25}
                                    value={Number.isNaN(field.value) ? '' : field.value}
                                    onChange={(e) => field.onChange(e.target.value === '' ? Number.NaN : parseFloat(e.target.value))}
                                    error={errors.valeur?.message}
                                />
                            )}
                        />
                        <Controller
                            name="bareme"
                            control={control}
                            render={({ field }) => (
                                <ElisaInput
                                    label={t('bareme')}
                                    type="number"
                                    min={1}
                                    step={1}
                                    value={Number.isNaN(field.value) ? '' : field.value}
                                    onChange={(e) => field.onChange(e.target.value === '' ? Number.NaN : parseFloat(e.target.value))}
                                    error={errors.bareme?.message}
                                />
                            )}
                        />
                        <Controller
                            name="coefficient"
                            control={control}
                            render={({ field }) => (
                                <ElisaInput
                                    label={t('coefficient')}
                                    type="number"
                                    min={0}
                                    step={0.5}
                                    value={Number.isNaN(field.value) ? '' : field.value}
                                    onChange={(e) => field.onChange(e.target.value === '' ? Number.NaN : parseFloat(e.target.value))}
                                    error={errors.coefficient?.message}
                                />
                            )}
                        />
                    </div>

                    {selectedMatiere && (
                        <div className="flex items-center gap-2 rounded-[var(--radius-lg)] border border-border bg-muted/50 p-3">
                            <Info className="h-[var(--icon-sm)] w-[var(--icon-sm)] text-muted-foreground shrink-0" />
                            <p className="text-xs text-muted-foreground">
                                {t('configAuto', { coefficient: Number.isNaN(coefficientActuel) ? 1 : coefficientActuel, bareme: baremeActuel || 20 })}
                            </p>
                        </div>
                    )}

                    <Controller
                        name="commentaire"
                        control={control}
                        render={({ field }) => (
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="note-commentaire" className="text-sm font-medium text-foreground">{t('commentaire')}</label>
                                <textarea
                                    id="note-commentaire"
                                    className="flex min-h-[80px] w-full rounded-[var(--radius-lg)] border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    value={field.value}
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
                                value={field.value}
                                onChange={(e) => field.onChange(e.target.value)}
                            />
                        )}
                    />
                </form>
            </CustomModal>

            <ConfirmDialog
                open={confirmFermeture}
                onOpenChange={setConfirmFermeture}
                onConfirm={fermer}
                title={t('modificationsNonEnregistreesTitre')}
                description={t('modificationsNonEnregistreesMessage')}
                confirmText={t('fermerSansEnregistrer')}
                cancelText={t('continuerEdition')}
                variant="warning"
            />
        </>
    );
}
