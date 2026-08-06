/**
 * ==================================
 * eLISAschool - Légende Calendrier EDT
 * ==================================
 * Légende unifiée pour les vues calendrier (semaine, mois, jour)
 * Affiche les indicateurs visuels : jour férié, aujourd'hui, créneau validé, créneau en attente
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useTranslation } from 'react-i18next';
import { Star, CheckCircle2, Clock, Check } from 'lucide-react';
import type { JourFerie } from '../types/edt.types';

interface EDTLegendProps {
    joursFeries?: JourFerie[];
}

export function EDTLegend({ joursFeries }: EDTLegendProps = {}) {
    const { t } = useTranslation('emplois');

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
                    style={{ width: '0.75rem', height: '0.75rem' }}
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
                    style={{ width: '0.75rem', height: '0.75rem' }}
                >
                    <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                </span>
            ),
            label: t('legende.creneauValide'),
        },
        {
            icon: (
                <span
                    className="inline-flex items-center justify-center rounded-full bg-[var(--color-success)]"
                    style={{ width: '0.75rem', height: '0.75rem' }}
                >
                    <CheckCircle2 className="h-2 w-2 text-white" />
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
            className="flex flex-wrap items-center gap-x-[var(--gap-md)] gap-y-[var(--space-xs)] px-[var(--space-sm)] py-[var(--space-xs)] rounded-lg border border-[var(--color-bordure)]/60 bg-[var(--color-surface-alt)]/50"
            role="complementary"
            aria-label={t('legende.titre')}
        >
            <span
                className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide"
                style={{ fontSize: 'clamp(0.625rem, 0.58rem + 0.15vw, 0.6875rem)' }}
            >
                {t('legende.titre')}
            </span>
            {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-[var(--space-xxs)]">
                    {item.icon}
                    <span
                        className="text-[var(--color-text-secondary)]"
                        style={{ fontSize: 'clamp(0.6875rem, 0.6rem + 0.2vw, 0.8125rem)' }}
                    >
                        {item.label}
                    </span>
                </div>
            ))}
        </div>
    );
}
