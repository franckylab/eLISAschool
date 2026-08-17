/**
 * ==================================
 * eLISAschool - Trust Badges
 * ==================================
 * Signaux de confiance pour la page des plans.
 *
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useTranslation } from 'react-i18next';
import { Shield, Lock, Headphones, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/cn';

// =============================================
// Types
// =============================================

interface TrustBadgesProps {
    className?: string;
}

// =============================================
// Données
// =============================================

interface Badge {
    icon: React.ComponentType<{ className?: string }>;
    labelKey: string;
    labelFallback: string;
    descriptionKey: string;
    descriptionFallback: string;
}

const BADGES: Badge[] = [
    {
        icon: Shield,
        labelKey: 'trust.securise',
        labelFallback: 'Paiement sécurisé',
        descriptionKey: 'trust.securiseDesc',
        descriptionFallback: 'Transactions chiffrées et conformes PCI DSS',
    },
    {
        icon: Lock,
        labelKey: 'trust.heberge',
        labelFallback: 'Données hébergées',
        descriptionKey: 'trust.hebergeDesc',
        descriptionFallback: 'Sauvegardes quotidiennes et chiffrement de bout en bout',
    },
    {
        icon: Headphones,
        labelKey: 'trust.support',
        labelFallback: 'Support réactif',
        descriptionKey: 'trust.supportDesc',
        descriptionFallback: 'Assistance technique disponible 6j/7',
    },
    {
        icon: RefreshCw,
        labelKey: 'trust.sansEngagement',
        labelFallback: 'Sans engagement',
        descriptionKey: 'trust.sansEngagementDesc',
        descriptionFallback: 'Annulez à tout moment sans frais',
    },
];

// =============================================
// Composant
// =============================================

export function TrustBadges({ className }: TrustBadgesProps) {
    const { t } = useTranslation('billing');

    return (
        <section className={cn('py-8', className)}>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {BADGES.map((badge) => {
                    const Icon = badge.icon;
                    return (
                        <div
                            key={badge.labelKey}
                            className="flex flex-col items-center gap-2 rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-4 text-center transition-colors hover:border-[var(--color-dominante)]/20"
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-dominante)]/10">
                                <Icon className="h-5 w-5 text-[var(--color-dominante)]" />
                            </div>
                            <p className="text-sm font-semibold text-[var(--color-texte)]">
                                {t(badge.labelKey, badge.labelFallback)}
                            </p>
                            <p className="text-xs text-[var(--color-texte-secondaire)]">
                                {t(badge.descriptionKey, badge.descriptionFallback)}
                            </p>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

export default TrustBadges;
