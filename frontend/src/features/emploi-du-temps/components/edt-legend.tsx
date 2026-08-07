/**
 * ==================================
 * eLISAschool - Légende Calendrier EDT
 * ==================================
 * Légende unifiée pour les vues calendrier (semaine, mois, jour)
 * Affiche les indicateurs visuels : jour férié, aujourd'hui, créneau validé, créneau en attente
 * Surface pleine avec contraste amélioré. Collapsible sur mobile.
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Star, CheckCircle2, Clock, Check, ChevronDown } from 'lucide-react';
import type { JourFerie } from '../types/edt.types';

interface EDTLegendProps {
    joursFeries?: JourFerie[];
}

export function EDTLegend({ joursFeries }: EDTLegendProps = {}) {
    const { t } = useTranslation('emplois');
    const [estReplie, setEstReplie] = useState(false);

    /** Couleur dynamique du premier jour férié à venir (ou le premier disponible) */
    const couleurJF = (() => {
        if (!joursFeries?.length) return 'var(--color-danger)';
        const now = new Date();
        const futur = joursFeries.find(jf => {
            if (!jf.date) return false;
            const d = new Date(jf.date);
            return d >= now;
        });
        return futur?.couleur || joursFeries[0]?.couleur || 'var(--color-danger)';
    })();

    const items = [
        {
            icon: (
                <span
                    className="inline-flex items-center justify-center rounded-full bg-[var(--color-dominant-600)]"
                    style={{ width: '0.625rem', height: '0.625rem' }}
                />
            ),
            label: t('legende.aujourdhui'),
        },
        {
            icon: (
                <Star
                    className="h-3 w-3 shrink-0 fill-current"
                    style={{ color: couleurJF }}
                />
            ),
            label: t('legende.jourFerie'),
        },
        {
            icon: (
                <span
                    className="inline-flex items-center justify-center rounded-full bg-[var(--color-success)]"
                    style={{ width: '0.625rem', height: '0.625rem' }}
                >
                    <Check className="h-2 w-2 text-white" strokeWidth={3} />
                </span>
            ),
            label: t('legende.creneauValide'),
        },
        {
            icon: (
                <span
                    className="inline-flex items-center justify-center rounded-full bg-[var(--color-success)]"
                    style={{ width: '0.625rem', height: '0.625rem' }}
                >
                    <CheckCircle2 className="h-1.5 w-1.5 text-white" />
                </span>
            ),
            label: t('legende.heuresCoursGenerees'),
        },
        {
            icon: (
                <Clock className="h-3 w-3 shrink-0" style={{ color: 'var(--color-text-muted)' }} />
            ),
            label: t('legende.creneauAttente'),
        },
    ];

    return (
        <div
            className="rounded-lg border border-gray-300 dark:border-[var(--color-bordure)] bg-[var(--color-surface-alt)]"
            role="complementary"
            aria-label={t('legende.titre')}
        >
            {/* En-tête collapsible */}
            <button
                type="button"
                onClick={() => setEstReplie(v => !v)}
                className="flex w-full items-center justify-between px-[var(--space-sm)] py-[var(--space-xs)]"
                aria-expanded={!estReplie}
            >
                <span
                    className="font-medium text-[var(--color-text-secondary)] uppercase tracking-wider"
                    style={{ fontSize: 'clamp(0.5625rem, 0.52rem + 0.15vw, 0.6875rem)' }}
                >
                    {t('legende.titre')}
                </span>
                <ChevronDown
                    className="h-3 w-3 text-[var(--color-text-muted)] transition-transform"
                    style={{ transform: estReplie ? 'rotate(-90deg)' : 'rotate(0deg)' }}
                />
            </button>

            {/* Items — masqués si replié */}
            {!estReplie && (
                <div className="flex flex-wrap items-center gap-x-[var(--gap-md)] gap-y-[var(--space-xxs)] px-[var(--space-sm)] pb-[var(--space-xs)]">
                    {items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-[var(--space-xxs)]">
                            {item.icon}
                            <span
                                className="text-[var(--color-text-primary)]"
                                style={{ fontSize: 'clamp(0.625rem, 0.57rem + 0.18vw, 0.75rem)' }}
                            >
                                {item.label}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
