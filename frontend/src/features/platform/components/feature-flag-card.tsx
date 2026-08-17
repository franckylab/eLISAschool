/**
 * ==================================
 * eLISAschool - Carte Feature Flag partagée
 * ==================================
 * Composant réutilisable pour afficher une fonctionnalité (feature flag)
 * dans les pages marketplace et plan-form.
 * 3 variantes : inclus (dominant), gratuit (success), payant (conditionnel).
 */

import { Zap, Lock, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type FeatureFlagCardVariant = 'inclus' | 'gratuit' | 'payant';

interface FeatureFlagCardProps {
    variant: FeatureFlagCardVariant;
    nom: string;
    description?: string;
    /** Uniquement pour variant='payant' : la fonctionnalité est-elle incluse dans le plan actuel */
    incluseParPlan?: boolean;
    className?: string;
}

const variantStyles: Record<FeatureFlagCardVariant, {
    border: string;
    iconBg: string;
    iconColor: string;
    trailing?: string;
}> = {
    inclus: {
        border: 'border-[color-mix(in_srgb,var(--color-dominant-500)_20%,transparent)]',
        iconBg: 'bg-[color-mix(in_srgb,var(--color-dominant-600)_10%,transparent)]',
        iconColor: 'text-[var(--color-dominant-600)]',
        trailing: 'text-[var(--color-success-500)]',
    },
    gratuit: {
        border: 'border-[color-mix(in_srgb,var(--color-success-500)_20%,transparent)]',
        iconBg: 'bg-[color-mix(in_srgb,var(--color-success-500)_10%,transparent)]',
        iconColor: 'text-[var(--color-success-600)]',
        trailing: 'text-[var(--color-success-500)]',
    },
    payant: {
        border: '',
        iconBg: '',
        iconColor: '',
    },
};

export function FeatureFlagCard({ variant, nom, description, incluseParPlan, className }: FeatureFlagCardProps) {
    if (variant === 'payant') {
        const included = !!incluseParPlan;
        return (
            <div
                className={cn(
                    'flex items-start gap-3 rounded-xl border bg-[var(--color-surface)] p-4',
                    included
                        ? 'border-[color-mix(in_srgb,var(--color-success-500)_30%,transparent)]'
                        : 'border-[var(--color-border)]',
                    className,
                )}
            >
                <div
                    className={cn(
                        'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg',
                        included
                            ? 'bg-[color-mix(in_srgb,var(--color-success-500)_10%,transparent)]'
                            : 'bg-[color-mix(in_srgb,var(--color-warning-500)_10%,transparent)]',
                    )}
                >
                    {included
                        ? <Zap size={16} className="text-[var(--color-success-600)]" />
                        : <Lock size={16} className="text-[var(--color-warning-600)]" />}
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">{nom}</p>
                    {description && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-[var(--color-text-secondary)]">{description}</p>
                    )}
                    <p className="mt-1 text-[10px] font-medium">
                        {included
                            ? <span className="text-[var(--color-success-600)]">Incluse dans votre plan</span>
                            : <span className="text-[var(--color-text-muted)]">Disponible sur un plan supérieur</span>}
                    </p>
                </div>
            </div>
        );
    }

    const styles = variantStyles[variant];
    return (
        <div
            className={cn(
                'flex items-start gap-3 rounded-xl border bg-[var(--color-surface)] p-4',
                styles.border,
                className,
            )}
        >
            <div
                className={cn(
                    'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg',
                    styles.iconBg,
                )}
            >
                <Zap size={16} className={styles.iconColor} />
            </div>
            <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">{nom}</p>
                {description && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-[var(--color-text-secondary)]">{description}</p>
                )}
            </div>
            <CheckCircle size={16} className={cn('ml-auto flex-shrink-0', styles.trailing)} />
        </div>
    );
}

export type { FeatureFlagCardProps, FeatureFlagCardVariant };
