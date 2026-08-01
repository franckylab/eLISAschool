/**
 * ==================================
 * eLISAschool - Barre de progression
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Barre de progression thématique (couleurs établissement)
 * Modes : déterministe (pourcentage connu) / indéterminé (animation continue)
 * Responsive : clamp() sur toutes les dimensions
 */

import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';

interface ProgressBarProps {
    /** Mode : 'determinate' (valeur connue) ou 'indeterminate' (animation continue) */
    mode?: 'determinate' | 'indeterminate';
    /** Valeur 0-100 (mode determinate uniquement) */
    value?: number;
    /** Variante visuelle */
    variant?: 'default' | 'success' | 'danger' | 'accent';
    /** Taille (hauteur) */
    size?: 'sm' | 'md' | 'lg';
    /** Afficher le pourcentage */
    showValue?: boolean;
    /** Label personnalisé */
    label?: string;
    /** Classe CSS supplémentaire */
    className?: string;
}

const HEIGHT = {
    sm: 'clamp(2px, 0.3vw, 4px)',
    md: 'clamp(4px, 0.5vw, 6px)',
    lg: 'clamp(6px, 0.8vw, 10px)',
} as const;

const VARIANT_COLORS: Record<string, { bar: string; bg: string }> = {
    default: {
        bar: 'bg-[var(--color-dominante)]',
        bg: 'bg-[var(--color-bordure)]',
    },
    success: {
        bar: 'bg-[var(--color-dominante)]',
        bg: 'bg-[var(--color-bordure)]',
    },
    danger: {
        bar: 'bg-[var(--color-error, #ef4444)]',
        bg: 'bg-[var(--color-bordure)]',
    },
    accent: {
        bar: 'bg-[var(--color-accent)]',
        bg: 'bg-[var(--color-bordure)]',
    },
};

export function ProgressBar({
    mode = 'determinate',
    value = 0,
    variant = 'default',
    size = 'md',
    showValue = false,
    label,
    className,
}: ProgressBarProps) {
    const colors = VARIANT_COLORS[variant];
    const clampedValue = Math.max(0, Math.min(100, value));
    const height = HEIGHT[size];

    return (
        <div className={cn('w-full', className)}>
            {/* Label + valeur */}
            {(label || showValue) && (
                <div className="flex items-center justify-between mb-[var(--space-xxs)]">
                    {label && (
                        <span
                            className="text-[var(--color-texte-secondaire)]"
                            style={{ fontSize: 'clamp(0.625rem, 1.5vw, 0.75rem)' }}
                        >
                            {label}
                        </span>
                    )}
                    {showValue && mode === 'determinate' && (
                        <span
                            className="font-medium text-[var(--color-texte)]"
                            style={{ fontSize: 'clamp(0.625rem, 1.5vw, 0.75rem)' }}
                        >
                            {Math.round(clampedValue)}%
                        </span>
                    )}
                </div>
            )}

            {/* Barre */}
            <div
                className={cn('relative overflow-hidden rounded-full', colors.bg)}
                style={{ height }}
                role="progressbar"
                aria-valuenow={mode === 'determinate' ? clampedValue : undefined}
                aria-valuemin={0}
                aria-valuemax={100}
            >
                {mode === 'determinate' ? (
                    <motion.div
                        className={cn(
                            'h-full rounded-full relative overflow-hidden',
                            colors.bar,
                        )}
                        initial={{ width: 0 }}
                        animate={{ width: `${clampedValue}%` }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                    >
                        {/* Shimmer overlay */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                    </motion.div>
                ) : (
                    /* Indéterminé : barre animée qui glisse */
                    <motion.div
                        className={cn('absolute top-0 bottom-0 rounded-full', colors.bar)}
                        style={{ width: '35%' }}
                        animate={{
                            left: ['-35%', '100%'],
                        }}
                        transition={{
                            duration: 1.8,
                            repeat: Infinity,
                            ease: [0.65, 0, 0.35, 1],
                        }}
                    />
                )}
            </div>
        </div>
    );
}

export default ProgressBar;
