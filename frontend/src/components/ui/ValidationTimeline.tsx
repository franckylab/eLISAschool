/**
 * ==================================
 * eLISAschool - Validation Timeline Component
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Timeline visuelle des étapes de validation multi-niveau.
 * Affiche chaque niveau avec décision, validateur, date et commentaire.
 */

import { useTranslation } from 'react-i18next';
import { CheckCircle2, XCircle, Clock, Circle, Shield } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatDistance } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import type { ValidationNiveau, StatutWorkflow } from '@/hooks/use-validation-workflow';

interface ValidationTimelineProps {
    historique?: ValidationNiveau[];
    niveauxRequis: number;
    niveauActuel: number;
    statut: StatutWorkflow;
    className?: string;
}

function iconeNiveau(decision: string, estActif: boolean, estFutur: boolean) {
    if (estFutur) return <Circle className="h-4 w-4 text-[var(--color-texte-secondaire)]" />;
    if (decision === 'APPROUVE') return <CheckCircle2 className="h-4 w-4 text-[var(--color-success)]" />;
    if (decision === 'REJETE') return <XCircle className="h-4 w-4 text-[var(--color-danger)]" />;
    if (estActif) return <Clock className="h-4 w-4 text-[var(--color-warning)]" />;
    return <Circle className="h-4 w-4 text-[var(--color-texte-secondaire)]" />;
}

function couleurLigne(decision: string) {
    if (decision === 'APPROUVE') return 'bg-[var(--color-success)]';
    if (decision === 'REJETE') return 'bg-[var(--color-danger)]';
    return 'bg-[var(--color-bordure)]';
}

export function ValidationTimeline({
    historique = [],
    niveauxRequis,
    niveauActuel,
    statut,
    className,
}: ValidationTimelineProps) {
    const { t, i18n } = useTranslation();
    const locale = i18n.language === 'en' ? enUS : fr;

    const niveaux = Array.from({ length: niveauxRequis }, (_, i) => {
        const niveau = i + 1;
        const entry = historique.find((h) => h.niveau === niveau);
        return {
            niveau,
            ...entry,
            estTraite: !!entry,
            estActif: !entry && niveau === niveauActuel + 1 && statut === 'EN_COURS',
            estFutur: !entry && niveau > niveauActuel,
        };
    });

    if (niveaux.length === 0) {
        return (
            <div className={cn('text-center py-6', className)}>
                <Shield className="mx-auto h-8 w-8 text-[var(--color-texte-secondaire)] mb-2" />
                <p className="text-sm text-[var(--color-texte-secondaire)]">
                    {t('validation.aucunNiveau')}
                </p>
            </div>
        );
    }

    return (
        <div className={cn('space-y-0', className)} role="list" aria-label={t('validation.timelineLabel')}>
            {niveaux.map((niveau, index) => (
                <div key={niveau.niveau} className="relative flex gap-3" role="listitem">
                    {/* Ligne verticale + icône */}
                    <div className="flex flex-col items-center">
                        {iconeNiveau(
                            niveau.estTraite ? (niveau.decision ?? '') : '',
                            niveau.estActif,
                            niveau.estFutur,
                        )}
                        {index < niveaux.length - 1 && (
                            <div
                                className={cn(
                                    'w-0.5 flex-1 min-h-[2rem]',
                                    niveau.estTraite
                                        ? couleurLigne(niveau.decision ?? '')
                                        : 'bg-[var(--color-bordure)]',
                                )}
                            />
                        )}
                    </div>

                    {/* Contenu */}
                    <div className={cn('flex-1 pb-5', index === niveaux.length - 1 && 'pb-0')}>
                        <div className={cn(
                            'rounded-lg border p-3',
                            niveau.estActif
                                ? 'border-[var(--color-warning)]/30 bg-[var(--color-warning)]/5'
                                : niveau.estFutur
                                    ? 'border-[var(--color-bordure)] bg-[var(--color-surface-hover)]/50 opacity-60'
                                    : 'border-[var(--color-bordure)] bg-[var(--color-surface)]',
                        )}>
                            {/* Header */}
                            <div className="flex items-center justify-between mb-1">
                                <span className={cn(
                                    'text-xs font-semibold uppercase tracking-wide',
                                    niveau.estActif && 'text-[var(--color-warning)]',
                                    niveau.estTraite && niveau.decision === 'APPROUVE' && 'text-[var(--color-success)]',
                                    niveau.estTraite && niveau.decision === 'REJETE' && 'text-[var(--color-danger)]',
                                    niveau.estFutur && 'text-[var(--color-texte-secondaire)]',
                                )}>
                                    {t('validation.niveau')} {niveau.niveau}
                                </span>
                                {niveau.estTraite && (
                                    <span className={cn(
                                        'text-xs font-medium',
                                        niveau.decision === 'APPROUVE' ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]',
                                    )}>
                                        {niveau.decision === 'APPROUVE' ? t('validation.approuve') : t('validation.rejete')}
                                    </span>
                                )}
                                {niveau.estActif && (
                                    <span className="text-xs font-medium text-[var(--color-warning)]">
                                        {t('validation.enAttente')}
                                    </span>
                                )}
                            </div>

                            {/* Rôle requis */}
                            <p className="text-xs text-[var(--color-texte-secondaire)]">
                                {t('validation.roleRequis')} : {niveau.roleRequis || t('validation.nonConfigure')}
                            </p>

                            {/* Validateurs et dates */}
                            {niveau.estTraite && (
                                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--color-texte-secondaire)]">
                                    {niveau.validateurNom && (
                                        <span>{niveau.validateurNom}</span>
                                    )}
                                    {niveau.dateValidation && (
                                        <span title={new Date(niveau.dateValidation).toLocaleString()}>
                                            {formatDistance(new Date(niveau.dateValidation), new Date(), { addSuffix: true, locale })}
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* Commentaire */}
                            {niveau.estTraite && niveau.commentaire && (
                                <p className="mt-2 text-xs italic text-[var(--color-texte-secondaire)] border-l-2 border-[var(--color-bordure)] pl-2">
                                    {niveau.commentaire}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
