/**
 * ==================================
 * eLISAschool - StepperModal Création Demande Remplacement
 * ==================================
 * 3 étapes : Sélection cours → Remplaçant + motif → Récapitulatif
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarClock, UserCheck, FileCheck } from 'lucide-react';
import { StepperModal } from '@/components/modals/StepperModal';
import type { StepperStep } from '@/components/modals/StepperModal';
import { useHeureCoursList } from '@/features/personnel/hooks/use-heure-cours';
import type { HeureCours } from '@/features/personnel/hooks/use-heure-cours';
import { useEnseignantOptions } from '@/features/emploi-du-temps/hooks/use-emploi-du-temps';
import { useCreerRemplacement } from '@/features/personnel/hooks/use-remplacement-heure-cours';
import { Badge } from '@/components/ui';

interface RemplacementStepperModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function RemplacementStepperModal({ open, onOpenChange }: RemplacementStepperModalProps) {
    const { t } = useTranslation('emplois');

    // ─── État du formulaire ──────────────────────────────
    const [coursSelectionne, setCoursSelectionne] = useState<HeureCours | null>(null);
    const [remplacantId, setRemplacantId] = useState('');
    const [motif, setMotif] = useState('');

    // ─── Hooks données ───────────────────────────────────
    const { data: coursPlanifie } = useHeureCoursList({ statutEffectue: 'PLANIFIE', limit: 100 });
    const { data: enseignantOptions = [] } = useEnseignantOptions();
    const creerRemplacement = useCreerRemplacement();

    // ─── Cours disponibles (PLANIFIE uniquement) ─────────
    const coursDisponibles = useMemo(() => {
        return (coursPlanifie?.items ?? []).filter(c => c.statutEffectue === 'PLANIFIE');
    }, [coursPlanifie?.items]);

    // ─── Reset à la fermeture ────────────────────────────
    const handleClose = useCallback(() => {
        setCoursSelectionne(null);
        setRemplacantId('');
        setMotif('');
        onOpenChange(false);
    }, [onOpenChange]);

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
    const steps: StepperStep[] = useMemo(() => [
        {
            id: 'selection-cours',
            label: t('remplacements.stepper.etape1Titre'),
            icon: CalendarClock,
            validate: () => !!coursSelectionne,
            validateError: t('remplacements.stepper.selectionnerCours'),
            content: (
                <div className="flex flex-col gap-[var(--gap-sm)]">
                    <p className="text-sm text-[var(--color-text-secondary)]">
                        {t('remplacements.stepper.etape1Description')}
                    </p>
                    {coursDisponibles.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-[var(--space-xl)] text-center">
                            <CalendarClock className="h-[clamp(2rem,4vw,3rem)] w-[clamp(2rem,4vw,3rem)] text-[var(--color-text-muted)] mb-[var(--space-sm)]" />
                            <p className="font-semibold text-[var(--color-text-primary)]">
                                {t('remplacements.stepper.aucunCours')}
                            </p>
                            <p className="text-sm text-[var(--color-text-secondary)]">
                                {t('remplacements.stepper.aucunCoursDescription')}
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-[var(--gap-xs)] max-h-[400px] overflow-y-auto rounded-lg border border-[var(--color-bordure)] p-[var(--space-xs)]">
                            {coursDisponibles.map((cours) => (
                                <button
                                    key={cours.id}
                                    type="button"
                                    onClick={() => setCoursSelectionne(cours)}
                                    className={`flex items-center gap-[var(--gap-sm)] rounded-lg border p-[var(--space-sm)] text-left transition-colors hover:bg-[var(--color-surface-hover)] ${
                                        coursSelectionne?.id === cours.id
                                            ? 'border-[var(--color-dominante)] bg-[var(--color-dominante)]/5'
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
                                                {new Date(cours.date).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' })}
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
        },
        {
            id: 'remplacant-motif',
            label: t('remplacements.stepper.etape2Titre'),
            icon: UserCheck,
            validate: () => !!remplacantId && motif.trim().length > 0,
            validateError: t('remplacements.stepper.choisirRemplacant'),
            content: (
                <div className="flex flex-col gap-[var(--gap-md)]">
                    <p className="text-sm text-[var(--color-text-secondary)]">
                        {t('remplacements.stepper.etape2Description')}
                    </p>

                    {/* Sélection remplaçant */}
                    <div className="flex flex-col gap-[var(--gap-xs)]">
                        <label className="text-sm font-medium text-[var(--color-text-primary)]">
                            {t('remplacements.stepper.choisirRemplacant')}
                        </label>
                        <select
                            value={remplacantId}
                            onChange={(e) => setRemplacantId(e.target.value)}
                            className="w-full rounded-[var(--radius-md)] border border-[var(--color-bordure)] bg-[var(--color-surface)] px-[var(--space-sm)] py-[var(--space-xs)] text-sm text-[var(--color-text-primary)] focus:border-[var(--color-dominante)] focus:outline-none focus:ring-2 focus:ring-[var(--color-dominante)]/20"
                            aria-label={t('remplacements.stepper.choisirRemplacant')}
                        >
                            <option value="">—</option>
                            {enseignantOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Motif */}
                    <div className="flex flex-col gap-[var(--gap-xs)]">
                        <label className="text-sm font-medium text-[var(--color-text-primary)]">
                            {t('remplacements.stepper.motifLabel')}
                        </label>
                        <textarea
                            value={motif}
                            onChange={(e) => setMotif(e.target.value)}
                            placeholder={t('remplacements.stepper.motifPlaceholder')}
                            rows={3}
                            className="w-full rounded-[var(--radius-md)] border border-[var(--color-bordure)] bg-[var(--color-surface)] px-[var(--space-sm)] py-[var(--space-xs)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-dominante)] focus:outline-none focus:ring-2 focus:ring-[var(--color-dominante)]/20 resize-none"
                        />
                    </div>
                </div>
            ),
        },
        {
            id: 'recapitulatif',
            label: t('remplacements.stepper.etape3Titre'),
            icon: FileCheck,
            content: (
                <div className="flex flex-col gap-[var(--gap-md)]">
                    <p className="text-sm text-[var(--color-text-secondary)]">
                        {t('remplacements.stepper.recapitulatif')}
                    </p>

                    <div className="rounded-lg border border-[var(--color-bordure)] p-[var(--space-md)] flex flex-col gap-[var(--gap-sm)]">
                        {/* Cours sélectionné */}
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-[var(--color-text-secondary)]">{t('remplacements.colonnes.dateCours')}</span>
                            <span className="font-medium text-[var(--color-text-primary)]">
                                {coursSelectionne
                                    ? `${new Date(coursSelectionne.date).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long' })} — ${coursSelectionne.heureDebut}–${coursSelectionne.heureFin}`
                                    : '—'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-[var(--color-text-secondary)]">{t('remplacements.colonnes.matiere')}</span>
                            <span className="font-medium text-[var(--color-text-primary)]">
                                {coursSelectionne?.matiere?.nom ?? '—'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-[var(--color-text-secondary)]">{t('remplacements.colonnes.classe')}</span>
                            <span className="font-medium text-[var(--color-text-primary)]">
                                {coursSelectionne?.classeAnnee?.classe?.nom ?? '—'}
                            </span>
                        </div>
                        <div className="border-t border-[var(--color-bordure)] my-[var(--space-xs)]" />
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-[var(--color-text-secondary)]">{t('remplacements.colonnes.remplacantPropose')}</span>
                            <span className="font-medium text-[var(--color-text-primary)]">
                                {enseignantOptions.find(o => o.value === remplacantId)?.label ?? '—'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-[var(--color-text-secondary)]">{t('remplacements.colonnes.motif')}</span>
                            <span className="font-medium text-[var(--color-text-primary)] text-right max-w-[60%]">
                                {motif || '—'}
                            </span>
                        </div>
                    </div>
                </div>
            ),
        },
    ], [t, coursDisponibles, coursSelectionne, remplacantId, motif, enseignantOptions]);

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
