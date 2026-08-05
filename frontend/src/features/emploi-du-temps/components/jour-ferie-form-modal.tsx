/**
 * ==================================
 * eLISAschool - Modal Formulaire Jour Férié
 * ==================================
 * Création / édition d'un jour férié
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { CustomModal } from '@/components/modals/CustomModal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { Save } from 'lucide-react';
import { useCreateJourFerie, useUpdateJourFerie, useModelesPays } from '../hooks/use-jours-feries';
import type { JourFerie } from '../types/edt.types';

/** Schéma Zod pour le formulaire (indépendant du backend) */
const jourFerieFormSchema = z.object({
    nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(150),
    estRecurrent: z.boolean().default(false),
    date: z.string().nullable().optional(),
    mois: z.number().int().min(1).max(12).nullable().optional(),
    jourMois: z.number().int().min(1).max(31).nullable().optional(),
    couleur: z.string().max(7).nullable().optional(),
    description: z.string().max(500).nullable().optional(),
    pays: z.string().length(2).nullable().optional(),
}).superRefine((data, ctx) => {
    if (data.estRecurrent && (data.mois == null || data.jourMois == null)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Un jour récurrent nécessite un mois et un jour', path: ['mois'] });
    }
    if (!data.estRecurrent && !data.date) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Un jour ponctuel nécessite une date', path: ['date'] });
    }
});

type JourFerieFormData = z.infer<typeof jourFerieFormSchema>;

/** Couleurs prédéfinies — label via i18n (joursFeries.couleurs.*) */
const COULEURS_JF = [
    { value: '#dc3545', i18nKey: 'rouge' },
    { value: '#28a745', i18nKey: 'vert' },
    { value: '#6f42c1', i18nKey: 'violet' },
    { value: '#007bff', i18nKey: 'bleu' },
    { value: '#fd7e14', i18nKey: 'orange' },
    { value: '#ffc107', i18nKey: 'jaune' },
] as const;

interface JourFerieFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    jourFerie?: JourFerie | null;
    paysDefaut?: string;
}

export function JourFerieFormModal({ open, onOpenChange, jourFerie, paysDefaut }: JourFerieFormModalProps) {
    const { t } = useTranslation('emplois');
    const creerJF = useCreateJourFerie();
    const modifierJF = useUpdateJourFerie();
    const modelesPays = useModelesPays();
    const isEdit = !!jourFerie;

    const { register, handleSubmit, reset, watch, setValue, control, formState: { errors } } = useForm<JourFerieFormData>({
        resolver: zodResolver(jourFerieFormSchema),
        defaultValues: {
            nom: '',
            estRecurrent: false,
            date: null,
            mois: null,
            jourMois: null,
            couleur: '#dc3545',
            description: null,
            pays: paysDefaut ?? 'CM',
        },
    });

    const estRecurrent = watch('estRecurrent');

    // Reset form quand le modal s'ouvre
    useEffect(() => {
        if (open) {
            if (jourFerie) {
                reset({
                    nom: jourFerie.nom,
                    estRecurrent: jourFerie.estRecurrent,
                    date: jourFerie.date ?? null,
                    mois: jourFerie.mois ?? null,
                    jourMois: jourFerie.jourMois ?? null,
                    couleur: jourFerie.couleur ?? '#dc3545',
                    description: jourFerie.description ?? null,
                    pays: jourFerie.pays ?? paysDefaut ?? 'CM',
                });
            } else {
                reset({
                    nom: '',
                    estRecurrent: false,
                    date: null,
                    mois: null,
                    jourMois: null,
                    couleur: '#dc3545',
                    description: null,
                    pays: paysDefaut ?? 'CM',
                });
            }
        }
    }, [open, jourFerie, paysDefaut, reset]);

    const onSubmit = async (data: JourFerieFormData) => {
        const payload: Record<string, any> = {
            nom: data.nom,
            estRecurrent: data.estRecurrent,
            couleur: data.couleur,
            description: data.description,
            pays: data.pays,
        };

        if (data.estRecurrent) {
            payload.mois = data.mois;
            payload.jourMois = data.jourMois;
            payload.date = null;
        } else {
            payload.date = data.date;
            payload.mois = null;
            payload.jourMois = null;
        }

        if (isEdit && jourFerie) {
            await modifierJF.mutateAsync({ id: jourFerie.id, data: payload });
        } else {
            await creerJF.mutateAsync(payload);
        }
        onOpenChange(false);
    };

    const inputClass = "w-full px-3 py-2 rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:ring-2 focus:ring-[var(--color-dominant-600)] focus:border-transparent transition-colors text-sm";
    const isPending = creerJF.isPending || modifierJF.isPending;

    return (
        <CustomModal
            open={open}
            onOpenChange={(v) => { if (!v) onOpenChange(false); }}
            title={isEdit ? t('joursFeries.modifierTitre') : t('joursFeries.ajouterTitre')}
            description={isEdit ? t('joursFeries.modifierDescription', 'Modifier les propriétés du jour férié') : t('joursFeries.ajouterDescription', 'Ajouter un nouveau jour férié au calendrier')}
            size="lg"
            footer={<>
                <ElisaButton variant="outline" onClick={() => onOpenChange(false)}>
                    {t('common:boutons.annuler', 'Annuler')}
                </ElisaButton>
                <ElisaButton
                    variant="primary"
                    onClick={handleSubmit(onSubmit)}
                    disabled={isPending}
                    icon={isPending ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Save className="h-4 w-4" />}
                >
                    {isPending ? t('common:boutons.enregistrement', 'Enregistrement...') : t('common:boutons.enregistrer', 'Enregistrer')}
                </ElisaButton>
            </>}
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Nom */}
                <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                        {t('joursFeries.nomLabel', 'Nom du jour férié')} *
                    </label>
                    <input {...register('nom')} className={inputClass} placeholder="Ex: Fête de l'Indépendance" />
                    {errors.nom && <p className="text-xs text-[var(--color-destructive)] mt-1">{errors.nom.message}</p>}
                </div>

                {/* Type : récurrent / ponctuel */}
                <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={estRecurrent}
                            onChange={(e) => {
                                setValue('estRecurrent', e.target.checked);
                                if (e.target.checked) {
                                    setValue('date', null);
                                } else {
                                    setValue('mois', null);
                                    setValue('jourMois', null);
                                }
                            }}
                            className="w-4 h-4 rounded border-[var(--color-bordure)] text-[var(--color-dominant-600)] focus:ring-[var(--color-dominant-600)]"
                        />
                        <span className="text-sm font-medium text-[var(--color-text-primary)]">
                            {t('joursFeries.recurrentLabel', 'Récurrent (tous les ans)')}
                        </span>
                    </label>
                </div>

                {/* Date ou Mois/Jour selon le type */}
                {estRecurrent ? (
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                                {t('joursFeries.moisLabel', 'Mois')} *
                            </label>
                            <Controller
                                control={control}
                                name="mois"
                                render={({ field }) => (
                                    <select
                                        value={field.value ?? ''}
                                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                                        className={inputClass}
                                    >
                                        <option value="">—</option>
                                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                            <option key={m} value={m}>{t(`joursFeries.moisNoms.${m}`)}</option>
                                        ))}
                                    </select>
                                )}
                            />
                            {errors.mois && <p className="text-xs text-[var(--color-destructive)] mt-1">{errors.mois.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                                {t('joursFeries.jourLabel', 'Jour')} *
                            </label>
                            <input
                                type="number"
                                min={1}
                                max={31}
                                {...register('jourMois', { valueAsNumber: true })}
                                className={inputClass}
                                placeholder="1-31"
                            />
                            {errors.jourMois && <p className="text-xs text-[var(--color-destructive)] mt-1">{errors.jourMois.message}</p>}
                        </div>
                    </div>
                ) : (
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                            {t('joursFeries.dateLabel', 'Date')} *
                        </label>
                        <input type="date" {...register('date')} className={inputClass} />
                        {errors.date && <p className="text-xs text-[var(--color-destructive)] mt-1">{errors.date.message}</p>}
                    </div>
                )}

                {/* Couleur */}
                <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                        {t('joursFeries.couleurLabel', 'Couleur')}
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {COULEURS_JF.map(c => (
                            <button
                                key={c.value}
                                type="button"
                                onClick={() => setValue('couleur', c.value)}
                                className={`w-8 h-8 rounded-full border-2 transition-all ${
                                    watch('couleur') === c.value
                                        ? 'border-[var(--color-text-primary)] scale-110'
                                        : 'border-transparent hover:scale-105'
                                }`}
                                style={{ backgroundColor: c.value }}
                                title={t(`joursFeries.couleurs.${c.i18nKey}`)}
                                aria-label={t(`joursFeries.couleurs.${c.i18nKey}`)}
                            />
                        ))}
                    </div>
                </div>

                {/* Pays */}
                <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                        {t('joursFeries.paysLabel', 'Pays')}
                    </label>
                    <Controller
                        control={control}
                        name="pays"
                        render={({ field }) => (
                            <select
                                value={field.value ?? ''}
                                onChange={(e) => field.onChange(e.target.value || null)}
                                className={inputClass}
                            >
                                <option value="">— {t('joursFeries.custom', 'Personnalisé')} —</option>
                                {(modelesPays.data ?? []).map(m => (
                                    <option key={m.pays} value={m.pays}>{t(`joursFeries.pays_${m.pays}`, m.pays)}</option>
                                ))}
                            </select>
                        )}
                    />
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                        {t('joursFeries.descriptionLabel', 'Description')}
                    </label>
                    <textarea
                        {...register('description')}
                        className={`${inputClass} resize-none`}
                        rows={2}
                        placeholder={t('joursFeries.descriptionPlaceholder', 'Description optionnelle...')}
                    />
                </div>
            </form>
        </CustomModal>
    );
}
