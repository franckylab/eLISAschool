/**
 * ==================================
 * eLISAschool - Modal Validation en Masse EDT
 * ==================================
 * 3 étapes (StepperModal partagé) :
 *  1. Aperçu — créneaux à valider (filtrés par contexte actuel)
 *  2. Résumé — statistiques, conflits, détails par jour
 *  3. Résultat — confirmation + bilan
 *
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ShieldCheck, Calendar, Clock, CheckCircle2,
    AlertTriangle, BookOpen, Eye, Sparkles,
} from 'lucide-react';
import { StepperModal, type StepperStep } from '@/components/modals/StepperModal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { useValiderCreneauxClasse } from '../hooks/use-emploi-du-temps';
import type { CreneauHoraire, JourSemaine } from '../types/edt.types';

/* ─── Types ─── */

interface EDTValidationMasseModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    creneaux: CreneauHoraire[];
    classeAnneeId: string;
    onSuccess: () => void;
}

/* ─── Constantses ─── */

const JOURS_ORDRE: JourSemaine[] = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'];

const JOURS_LABELS: Record<string, string> = {
    LUNDI: 'Lundi', MARDI: 'Mardi', MERCREDI: 'Mercredi',
    JEUDI: 'Jeudi', VENDREDI: 'Vendredi', SAMEDI: 'Samedi',
};

/* ─── Composant ─── */

export function EDTValidationMasseModal({
    open,
    onOpenChange,
    creneaux,
    classeAnneeId,
    onSuccess,
}: EDTValidationMasseModalProps) {
    const { t } = useTranslation('emplois');
    const validerMutation = useValiderCreneauxClasse();
    const [resultat, setResultat] = useState<{ nbValides: number; instancesGenerees: number } | null>(null);

    // ─── Données dérivées ────────────────────────────

    /** Créneaux PLANIFIE (éligibles à la validation) */
    const aValider = useMemo(
        () => creneaux.filter(c => c.statut === 'PLANIFIE'),
        [creneaux],
    );

    /** Créneaux déjà VALIDE */
    const dejaValides = useMemo(
        () => creneaux.filter(c => c.statut === 'VALIDE'),
        [creneaux],
    );

    /** Groupés par jour */
    const parJour = useMemo(() => {
        const grouped = new Map<string, CreneauHoraire[]>();
        for (const c of aValider) {
            const arr = grouped.get(c.jour) ?? [];
            arr.push(c);
            grouped.set(c.jour, arr);
        }
        return grouped;
    }, [aValider]);

    /** Créneaux avec genereAutomatiquement */
    const avecAuto = useMemo(
        () => aValider.filter(c => c.genereAutomatiquement),
        [aValider],
    );

    /** Matières distinctes */
    const matieresDistinctes = useMemo(() => {
        const ids = new Set(aValider.map(c => c.affectationMatiere?.matiereId).filter(Boolean));
        return ids.size;
    }, [aValider]);

    /** Total heures (estimé en minutes) */
    const totalMinutes = useMemo(
        () => aValider.reduce((sum, c) => sum + (c.dureeMinutes ?? 60), 0),
        [aValider],
    );

    // ─── Handlers ────────────────────────────────────

    const handleValider = async () => {
        const res = await validerMutation.mutateAsync(classeAnneeId);
        setResultat(res);
        onSuccess();
    };

    /** Reset état à la fermeture */
    const handleClose = (v: boolean) => {
        if (!v) {
            setResultat(null);
        }
        onOpenChange(v);
    };

    // ─── Étapes ──────────────────────────────────────

    const steps: StepperStep[] = [
        {
            id: 'apercu',
            label: t('validationMasse.etape1'),
            icon: Eye,
            validate: () => aValider.length > 0,
            validateError: t('validationMasse.aucunAValider'),
            content: (
                <div className="flex flex-col gap-[var(--gap-md)]">
                    {/* Résumé compact */}
                    <div className="flex items-center gap-[var(--gap-sm)] rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface-alt)] p-[var(--space-md)]">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-dominant-100)] dark:bg-[var(--color-dominant-900)]/30">
                            <ShieldCheck className="h-5 w-5 text-[var(--color-dominant-600)] dark:text-[var(--color-dominant-400)]" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[var(--color-text-primary)]" style={{ fontSize: 'clamp(0.875rem, 0.8rem + 0.3vw, 1rem)' }}>
                                {t('validationMasse.aValider', { count: aValider.length })}
                            </p>
                            <p className="text-[var(--color-text-secondary)]" style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}>
                                {t('validationMasse.dejaValides', { count: dejaValides.length })}
                            </p>
                        </div>
                    </div>

                    {aValider.length === 0 ? (
                        <div className="flex flex-col items-center py-[var(--space-lg)] text-center">
                            <CheckCircle2 className="h-12 w-12 text-[var(--color-success)] mb-[var(--space-md)]" />
                            <p className="font-medium text-[var(--color-text-primary)]">
                                {t('validationMasse.aucunAValider')}
                            </p>
                            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                                {t('validationMasse.tousValides')}
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Stats rapides */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-[var(--gap-sm)]">
                                <div className="rounded-lg border border-[var(--color-bordure)] p-[var(--space-sm)] text-center">
                                    <Calendar className="h-4 w-4 mx-auto text-[var(--color-dominant-600)] mb-1" />
                                    <p className="text-lg font-bold text-[var(--color-text-primary)]">{parJour.size}</p>
                                    <p className="text-xs text-[var(--color-text-secondary)]">{t('validationMasse.jours')}</p>
                                </div>
                                <div className="rounded-lg border border-[var(--color-bordure)] p-[var(--space-sm)] text-center">
                                    <BookOpen className="h-4 w-4 mx-auto text-[var(--color-accent-600)] mb-1" />
                                    <p className="text-lg font-bold text-[var(--color-text-primary)]">{matieresDistinctes}</p>
                                    <p className="text-xs text-[var(--color-text-secondary)]">{t('validationMasse.matieres')}</p>
                                </div>
                                <div className="rounded-lg border border-[var(--color-bordure)] p-[var(--space-sm)] text-center">
                                    <Clock className="h-4 w-4 mx-auto text-[var(--color-text-muted)] mb-1" />
                                    <p className="text-lg font-bold text-[var(--color-text-primary)]">{Math.round(totalMinutes / 60)}h</p>
                                    <p className="text-xs text-[var(--color-text-secondary)]">{t('validationMasse.totalHeures')}</p>
                                </div>
                                <div className="rounded-lg border border-[var(--color-bordure)] p-[var(--space-sm)] text-center">
                                    <Sparkles className="h-4 w-4 mx-auto text-[var(--color-success)] mb-1" />
                                    <p className="text-lg font-bold text-[var(--color-text-primary)]">{avecAuto.length}</p>
                                    <p className="text-xs text-[var(--color-text-secondary)]">{t('validationMasse.autoGen')}</p>
                                </div>
                            </div>

                            {/* Détail par jour */}
                            <div>
                                <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-[var(--space-xs)]">
                                    {t('validationMasse.parJour')}
                                </h4>
                                <div className="flex flex-col gap-[var(--space-xxs)]">
                                    {JOURS_ORDRE.filter(j => parJour.has(j)).map(jour => {
                                        const creneauxJour = parJour.get(jour)!;
                                        return (
                                            <div
                                                key={jour}
                                                className="flex items-center justify-between rounded-lg border border-[var(--color-bordure)] px-[var(--space-md)] py-[var(--space-sm)]"
                                            >
                                                <span className="text-sm font-medium text-[var(--color-text-primary)]">
                                                    {JOURS_LABELS[jour] ?? jour}
                                                </span>
                                                <div className="flex items-center gap-[var(--gap-sm)]">
                                                    <span className="text-xs text-[var(--color-text-secondary)]">
                                                        {creneauxJour.length} {creneauxJour.length === 1 ? t('validationMasse.creneau').toLowerCase() : t('validationMasse.creneaux').toLowerCase()}
                                                    </span>
                                                    <div className="flex -space-x-1">
                                                        {creneauxJour.slice(0, 4).map(c => {
                                                            const couleur = c.couleur || c.affectationMatiere?.matiere?.couleur || 'var(--color-dominant-500)';
                                                            return (
                                                                <div
                                                                    key={c.id}
                                                                    className="h-5 w-5 rounded-full border-2 border-[var(--color-surface)] flex items-center justify-center text-white"
                                                                    style={{ backgroundColor: couleur, fontSize: '8px', fontWeight: 700 }}
                                                                    title={c.affectationMatiere?.matiere?.nom ?? '—'}
                                                                >
                                                                    {c.affectationMatiere?.matiere?.nom?.charAt(0) ?? '?'}
                                                                </div>
                                                            );
                                                        })}
                                                        {creneauxJour.length > 4 && (
                                                            <div className="h-5 w-5 rounded-full border-2 border-[var(--color-surface)] bg-[var(--color-text-muted)] flex items-center justify-center text-white" style={{ fontSize: '7px' }}>
                                                                +{creneauxJour.length - 4}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Note auto-génération */}
                            {avecAuto.length > 0 && (
                                <div className="flex items-start gap-[var(--gap-xs)] rounded-lg border border-[var(--color-success)]/30 bg-[var(--color-success)]/5 p-[var(--space-sm)]">
                                    <Sparkles className="h-4 w-4 shrink-0 text-[var(--color-success)] mt-0.5" />
                                    <p className="text-xs text-[var(--color-text-secondary)]">
                                        {t('validationMasse.autoGenInfo', { count: avecAuto.length })}
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            ),
        },
        {
            id: 'resume',
            label: t('validationMasse.etape2'),
            icon: CheckCircle2,
            content: (
                <div className="flex flex-col gap-[var(--gap-md)]">
                    {/* Résumé visuel */}
                    <div className="flex items-center gap-[var(--gap-sm)] rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface-alt)] p-[var(--space-md)]">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-dominant-100)] dark:bg-[var(--color-dominant-900)]/30">
                            <ShieldCheck className="h-5 w-5 text-[var(--color-dominant-600)] dark:text-[var(--color-dominant-400)]" />
                        </div>
                        <div>
                            <p className="font-semibold text-[var(--color-text-primary)]" style={{ fontSize: 'clamp(0.875rem, 0.8rem + 0.3vw, 1rem)' }}>
                                {t('validationMasse.resumeValidation')}
                            </p>
                            <p className="text-xs text-[var(--color-text-secondary)]">
                                {t('validationMasse.resumeDescription')}
                            </p>
                        </div>
                    </div>

                    {/* Cartes résumé */}
                    <div className="grid grid-cols-2 gap-[var(--gap-sm)]">
                        <div className="rounded-lg border border-[var(--color-bordure)] p-[var(--space-md)]">
                            <p className="text-xs text-[var(--color-text-secondary)] mb-1">{t('validationMasse.totalAValider')}</p>
                            <p className="text-2xl font-bold text-[var(--color-dominant-600)]">{aValider.length}</p>
                        </div>
                        <div className="rounded-lg border border-[var(--color-bordure)] p-[var(--space-md)]">
                            <p className="text-xs text-[var(--color-text-secondary)] mb-1">{t('validationMasse.dejaValides')}</p>
                            <p className="text-2xl font-bold text-[var(--color-success)]">{dejaValides.length}</p>
                        </div>
                        <div className="rounded-lg border border-[var(--color-bordure)] p-[var(--space-md)]">
                            <p className="text-xs text-[var(--color-text-secondary)] mb-1">{t('validationMasse.joursOccupes')}</p>
                            <p className="text-2xl font-bold text-[var(--color-text-primary)]">{parJour.size}</p>
                        </div>
                        <div className="rounded-lg border border-[var(--color-bordure)] p-[var(--space-md)]">
                            <p className="text-xs text-[var(--color-text-secondary)] mb-1">{t('validationMasse.heuresCoursAuto')}</p>
                            <p className="text-2xl font-bold text-[var(--color-accent-600)]">{avecAuto.length}</p>
                        </div>
                    </div>

                    {/* Liste compacte des créneaux */}
                    <div>
                        <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-[var(--space-xs)]">
                            {t('validationMasse.detailCreneaux')}
                        </h4>
                        <div className="max-h-[200px] overflow-y-auto rounded-lg border border-[var(--color-bordure)]">
                            <table className="w-full text-xs">
                                <thead className="sticky top-0 bg-[var(--color-surface-alt)] border-b border-[var(--color-bordure)]">
                                    <tr>
                                        <th className="px-2 py-1.5 text-left font-medium text-[var(--color-text-secondary)]">{t('validationMasse.jour')}</th>
                                        <th className="px-2 py-1.5 text-left font-medium text-[var(--color-text-secondary)]">{t('matiere')}</th>
                                        <th className="px-2 py-1.5 text-left font-medium text-[var(--color-text-secondary)]">{t('horaire')}</th>
                                        <th className="px-2 py-1.5 text-left font-medium text-[var(--color-text-secondary)]">{t('salle')}</th>
                                        <th className="px-2 py-1.5 text-center font-medium text-[var(--color-text-secondary)]">Auto</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {aValider
                                        .sort((a, b) => {
                                            const jourA = JOURS_ORDRE.indexOf(a.jour);
                                            const jourB = JOURS_ORDRE.indexOf(b.jour);
                                            if (jourA !== jourB) return jourA - jourB;
                                            return a.heureDebut.localeCompare(b.heureDebut);
                                        })
                                        .map(c => (
                                            <tr key={c.id} className="border-b border-[var(--color-bordure)]/50 last:border-0">
                                                <td className="px-2 py-1.5 text-[var(--color-text-primary)]">{JOURS_LABELS[c.jour] ?? c.jour}</td>
                                                <td className="px-2 py-1.5">
                                                    <div className="flex items-center gap-1">
                                                        <div
                                                            className="h-2.5 w-2.5 rounded-full shrink-0"
                                                            style={{ backgroundColor: c.couleur || c.affectationMatiere?.matiere?.couleur || 'var(--color-dominant-500)' }}
                                                        />
                                                        <span className="truncate text-[var(--color-text-primary)]">
                                                            {c.affectationMatiere?.matiere?.nom ?? '—'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-2 py-1.5 text-[var(--color-text-secondary)]">{c.heureDebut}–{c.heureFin}</td>
                                                <td className="px-2 py-1.5 text-[var(--color-text-secondary)]">{c.salle?.code ?? c.salle?.nom ?? '—'}</td>
                                                <td className="px-2 py-1.5 text-center">
                                                    {c.genereAutomatiquement && (
                                                        <Sparkles className="h-3 w-3 text-[var(--color-success)] inline" />
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Avertissement */}
                    <div className="flex items-start gap-[var(--gap-xs)] rounded-lg border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/5 p-[var(--space-sm)]">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-[var(--color-warning)] mt-0.5" />
                        <p className="text-xs text-[var(--color-text-secondary)]">
                            {t('validationMasse.avertissementInfo')}
                        </p>
                    </div>
                </div>
            ),
        },
        {
            id: 'resultat',
            label: t('validationMasse.etape3'),
            icon: CheckCircle2,
            content: (
                <div className="flex flex-col items-center justify-center py-[var(--space-lg)] text-center">
                    {validerMutation.isPending ? (
                        <>
                            <div className="h-16 w-16 rounded-2xl bg-[var(--color-dominant-100)] dark:bg-[var(--color-dominant-900)]/30 flex items-center justify-center mb-[var(--space-md)]">
                                <ShieldCheck className="h-8 w-8 text-[var(--color-dominant-600)] dark:text-[var(--color-dominant-400)] animate-pulse" />
                            </div>
                            <p className="font-semibold text-[var(--color-text-primary)] mb-1">
                                {t('validationMasse.validationEnCours')}
                            </p>
                            <p className="text-sm text-[var(--color-text-secondary)]">
                                {t('validationMasse.pattiente')}
                            </p>
                        </>
                    ) : resultat ? (
                        <>
                            <div className="h-16 w-16 rounded-2xl bg-[var(--color-success)]/10 flex items-center justify-center mb-[var(--space-md)]">
                                <CheckCircle2 className="h-8 w-8 text-[var(--color-success)]" />
                            </div>
                            <p className="font-semibold text-[var(--color-text-primary)] mb-1" style={{ fontSize: 'clamp(1rem, 0.9rem + 0.4vw, 1.25rem)' }}>
                                {t('validationMasse.validationReussie')}
                            </p>
                            <p className="text-sm text-[var(--color-text-secondary)] mb-[var(--space-md)]">
                                {t('validationMasse.nbValides', { count: resultat.nbValides })}
                            </p>
                            <div className="flex items-center gap-[var(--gap-sm)]">
                                <ElisaButton
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleClose(false)}
                                >
                                    {t('fermer')}
                                </ElisaButton>
                                <ElisaButton
                                    variant="primary"
                                    size="sm"
                                    icon={<Eye className="h-4 w-4" />}
                                    onClick={() => handleClose(false)}
                                >
                                    {t('validationMasse.voirEDT')}
                                </ElisaButton>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="h-16 w-16 rounded-2xl bg-[var(--color-danger)]/10 flex items-center justify-center mb-[var(--space-md)]">
                                <AlertTriangle className="h-8 w-8 text-[var(--color-danger)]" />
                            </div>
                            <p className="font-semibold text-[var(--color-text-primary)] mb-1">
                                {t('validationMasse.erreurTitre')}
                            </p>
                            <p className="text-sm text-[var(--color-text-secondary)]">
                                {t('toasts.erreurValidation')}
                            </p>
                        </>
                    )}
                </div>
            ),
        },
    ];

    return (
        <StepperModal
            open={open}
            onOpenChange={handleClose}
            title={t('validationMasse.titre')}
            description={t('validationMasse.description')}
            steps={steps}
            size="2xl"
            onSubmit={handleValider}
            isSubmitting={validerMutation.isPending}
            nextLabels={[
                t('validationMasse.voirResume'),
                t('validationMasse.lancerValidation'),
                '',
            ]}
            hideFooterOnLastStep
            disableNextOnInvalid={aValider.length === 0}
        />
    );
}
