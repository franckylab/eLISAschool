/**
 * ==================================
 * eLISAschool - StepperModal Création Demande Remplacement
 * ==================================
 * 3 étapes : Sélection cours → Remplaçant + motif → Récapitulatif
 * Version: 2.0.0 — cours pré-sélectionné, skip étape 1, recherche remplaçant
 * Auteur: franck arlos chendjou
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarClock, UserCheck, FileCheck } from 'lucide-react';
import { StepperModal } from '@/components/modals/StepperModal';
import type { StepperStep } from '@/components/modals/StepperModal';
import { useHeureCoursList } from '../hooks/use-heure-cours';
import type { HeureCours } from '../hooks/use-heure-cours';
import { useEnseignantOptions } from '@/features/emploi-du-temps/hooks/use-emploi-du-temps';
import { useCreerRemplacement } from '../hooks/use-remplacement-heure-cours';
import { Badge } from '@/components/ui';
import { ElisaSelect } from '@/components/ui/ElisaSelect';

interface RemplacementStepperModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Cours pré-sélectionné (skip étape 1 si fourni) */
    coursPreselectionne?: HeureCours | null;
}

export function RemplacementStepperModal({ open, onOpenChange, coursPreselectionne }: RemplacementStepperModalProps) {
    const { t, i18n } = useTranslation('emplois');
    const locale = i18n.language || 'fr';

    // ─── État du formulaire ──────────────────────────────
    const [coursSelectionne, setCoursSelectionne] = useState<HeureCours | null>(coursPreselectionne ?? null);
    const [remplacantId, setRemplacantId] = useState('');
    const [motif, setMotif] = useState('');

    // ─── Hooks données ───────────────────────────────────
    const { data: coursPlanifie } = useHeureCoursList({ statutEffectue: 'PLANIFIE', limit: 100 });
    const { data: enseignantOptions = [] } = useEnseignantOptions();
    const creerRemplacement = useCreerRemplacement();

    // ─── Sync cours pré-sélectionné ──────────────────────
    useEffect(() => {
        if (coursPreselectionne) {
            setCoursSelectionne(coursPreselectionne);
        }
    }, [coursPreselectionne]);

    // ─── Cours disponibles (PLANIFIE uniquement) ─────────
    const coursDisponibles = useMemo(() => {
        return (coursPlanifie?.items ?? []).filter(c => c.statutEffectue === 'PLANIFIE');
    }, [coursPlanifie?.items]);

    // ─── Réinitialiser à la fermeture ────────────────────
    const handleClose = useCallback(() => {
        setCoursSelectionne(coursPreselectionne ?? null);
        setRemplacantId('');
        setMotif('');
        onOpenChange(false);
    }, [onOpenChange, coursPreselectionne]);

    // ─── Soumission ──────────────────────────────────────
    const handleSubmit = useCallback(async () => {
        if (!coursSelectionne || !remplacantId || !motif) return;
        await creerRemplacement.mutateAsync({
            heureCoursId: coursSelectionne.id,
            motif,
            remplacantId,
        });
        handleClose();
    }, [coursSelectionne, remplacantId, motif, creerRemplacement, handleClose]);

    // ─── Étapes ──────────────────────────────────────────
    const skipEtape1 = !!coursPreselectionne;

    const steps: StepperStep[] = useMemo(() => {
        const etapes: StepperStep[] = [];

        // Étape 1 : Sélection cours (skip si pré-sélectionné)
        if (!skipEtape1) {
            etapes.push({
                id: 'selection-cours',
                label: t('remplacements.stepper.etape1Titre'),
                icon: CalendarClock,
                validate: () => !!coursSelectionne,
                validateError: t('remplacements.stepper.selectionnerCours'),
                content: (
                    <div className="flex flex-col gap-[var(--gap-sm)]">
                        <p style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }} className="text-[var(--color-text-secondary)]">
                            {t('remplacements.stepper.etape1Description')}
                        </p>
                        {coursDisponibles.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-[var(--space-xl)] text-center">
                                <CalendarClock className="h-[clamp(2rem,4vw,3rem)] w-[clamp(2rem,4vw,3rem)] text-[var(--color-text-muted)] mb-[var(--space-sm)]" />
                                <p className="font-semibold text-[var(--color-text-primary)]">
                                    {t('remplacements.stepper.aucunCours')}
                                </p>
                                <p style={{ fontSize: 'clamp(0.6875rem, 0.6rem + 0.2vw, 0.8125rem)' }} className="text-[var(--color-text-secondary)]">
                                    {t('remplacements.stepper.aucunCoursDescription')}
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-[var(--gap-xs)] max-h-[400px] overflow-y-auto rounded-[var(--radius-md)] border border-[var(--color-bordure)] p-[var(--space-xs)]">
                                {coursDisponibles.map((cours) => (
                                    <button
                                        key={cours.id}
                                        type="button"
                                        onClick={() => setCoursSelectionne(cours)}
                                        className={`flex items-center gap-[var(--gap-sm)] rounded-[var(--radius-md)] border p-[var(--space-sm)] text-left transition-colors hover:bg-[var(--color-surface-hover)] ${
                                            coursSelectionne?.id === cours.id
                                                ? 'border-[var(--color-dominant-600)] bg-[var(--color-dominant-50)] dark:bg-[var(--color-dominant-900)]/20'
                                                : 'border-[var(--color-bordure)]'
                                        }`}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1">
                                                <span className="font-semibold text-[var(--color-text-primary)] truncate" style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)' }}>
                                                    {cours.matiere?.nom ?? '—'}
                                                </span>
                                                <Badge variant="outline" size="xs">
                                                    {cours.typeCreneau}
                                                </Badge>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-x-[var(--gap-sm)] gap-y-0 text-[var(--color-text-secondary)]" style={{ fontSize: 'clamp(0.6875rem, 0.6rem + 0.2vw, 0.8125rem)' }}>
                                                <span>
                                                    {new Date(cours.date).toLocaleDateString(locale, { weekday: 'short', day: '2-digit', month: 'short' })}
                                                </span>
                                                <span>{cours.heureDebut} – {cours.heureFin}</span>
                                                <span>{cours.classeAnnee?.classe?.nom ?? '—'}</span>
                                                {cours.salle && <span>{cours.salle.nom}</span>}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ),
            });
        }

        // Étape 2 : Remplaçant + motif
        etapes.push({
            id: 'remplacant-motif',
            label: t('remplacements.stepper.etape2Titre'),
            icon: UserCheck,
            validate: () => !!remplacantId && motif.trim().length > 0,
            validateError: t('remplacements.stepper.choisirRemplacant'),
            content: (
                <div className="flex flex-col gap-[var(--gap-md)]">
                    <p style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }} className="text-[var(--color-text-secondary)]">
                        {t('remplacements.stepper.etape2Description')}
                    </p>

                    {/* Sélection remplaçant avec recherche */}
                    <div className="flex flex-col gap-[var(--gap-xs)]">
                        <ElisaSelect
                            options={enseignantOptions}
                            value={remplacantId}
                            onValueChange={setRemplacantId}
                            searchable
                            placeholder={t('remplacements.stepper.choisirRemplacant')}
                            label={t('remplacements.stepper.choisirRemplacant')}
                            required
                        />
                    </div>

                    {/* Motif */}
                    <div className="flex flex-col gap-[var(--gap-xs)]">
                        <label style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }} className="font-medium text-[var(--color-text-primary)]">
                            {t('remplacements.stepper.motifLabel')}
                        </label>
                        <textarea
                            value={motif}
                            onChange={(e) => setMotif(e.target.value)}
                            placeholder={t('remplacements.stepper.motifPlaceholder')}
                            rows={3}
                            className="w-full rounded-[var(--radius-md)] border border-[var(--color-bordure)] bg-[var(--color-surface)] px-[var(--space-sm)] py-[var(--space-xs)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-dominant-600)] focus:outline-none focus:ring-2 focus:ring-[var(--color-dominant-600)]/20 resize-none"
                            style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}
                        />
                    </div>
                </div>
            ),
        });

        // Étape 3 : Récapitulatif
        etapes.push({
            id: 'recapitulatif',
            label: t('remplacements.stepper.etape3Titre'),
            icon: FileCheck,
            content: (
                <div className="flex flex-col gap-[var(--gap-md)]">
                    <p style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }} className="text-[var(--color-text-secondary)]">
                        {t('remplacements.stepper.recapitulatif')}
                    </p>

                    <div className="rounded-[var(--radius-lg)] border border-[var(--color-bordure)] p-[var(--space-md)] flex flex-col gap-[var(--gap-sm)]">
                        {/* Cours sélectionné */}
                        <div className="flex items-center justify-between">
                            <span style={{ fontSize: 'clamp(0.6875rem, 0.6rem + 0.2vw, 0.8125rem)' }} className="text-[var(--color-text-secondary)]">{t('remplacements.colonnes.dateCours')}</span>
                            <span className="font-medium text-[var(--color-text-primary)]" style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}>
                                {coursSelectionne
                                    ? `${new Date(coursSelectionne.date).toLocaleDateString(locale, { weekday: 'long', day: '2-digit', month: 'long' })} — ${coursSelectionne.heureDebut}–${coursSelectionne.heureFin}`
                                    : '—'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span style={{ fontSize: 'clamp(0.6875rem, 0.6rem + 0.2vw, 0.8125rem)' }} className="text-[var(--color-text-secondary)]">{t('remplacements.colonnes.matiere')}</span>
                            <span className="font-medium text-[var(--color-text-primary)]" style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}>
                                {coursSelectionne?.matiere?.nom ?? '—'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span style={{ fontSize: 'clamp(0.6875rem, 0.6rem + 0.2vw, 0.8125rem)' }} className="text-[var(--color-text-secondary)]">{t('remplacements.colonnes.classe')}</span>
                            <span className="font-medium text-[var(--color-text-primary)]" style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}>
                                {coursSelectionne?.classeAnnee?.classe?.nom ?? '—'}
                            </span>
                        </div>
                        <div className="border-t border-[var(--color-bordure)] my-[var(--space-xs)]" />
                        <div className="flex items-center justify-between">
                            <span style={{ fontSize: 'clamp(0.6875rem, 0.6rem + 0.2vw, 0.8125rem)' }} className="text-[var(--color-text-secondary)]">{t('remplacements.colonnes.remplacantPropose')}</span>
                            <span className="font-medium text-[var(--color-text-primary)]" style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}>
                                {enseignantOptions.find(o => o.value === remplacantId)?.label ?? '—'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span style={{ fontSize: 'clamp(0.6875rem, 0.6rem + 0.2vw, 0.8125rem)' }} className="text-[var(--color-text-secondary)]">{t('remplacements.colonnes.motif')}</span>
                            <span className="font-medium text-[var(--color-text-primary)] text-right max-w-[60%]" style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}>
                                {motif || '—'}
                            </span>
                        </div>
                    </div>
                </div>
            ),
        });

        return etapes;
    }, [t, locale, skipEtape1, coursDisponibles, coursSelectionne, remplacantId, motif, enseignantOptions]);

    return (
        <StepperModal
            open={open}
            onOpenChange={handleClose}
            title={t('remplacements.actions.nouvelleDemande')}
            description={t('remplacements.subtitle')}
            steps={steps}
            onSubmit={handleSubmit}
            isSubmitting={creerRemplacement.isPending}
            size="lg"
        />
    );
}
