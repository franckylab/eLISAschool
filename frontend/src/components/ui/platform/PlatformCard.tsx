/**
 * ==================================
 * eLISAschool - PlatformCard
 * ==================================
 * Composant carte partagé pour le panel admin plateforme.
 * Pattern A canonique : CSS vars eLISAschool (pas de tokens shadcn).
 * Ultra-responsif (clamp) + dark mode natif.
 *
 * Phase P1 — Restructuration Panel Admin v3
 */

import { type ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

// =============================================
// Variantes
// =============================================

type CardVariant = 'default' | 'hover' | 'flat' | 'outlined';
type CardSize = 'sm' | 'md' | 'lg';

const VARIANT_STYLES: Record<CardVariant, string> = {
    default: 'border border-[var(--color-bordure)] bg-[var(--color-surface)]',
    hover: 'border border-[var(--color-bordure)] bg-[var(--color-surface)] cursor-pointer',
    flat: 'bg-[var(--color-surface-alt)]',
    outlined: 'border border-dashed border-[var(--color-bordure)] bg-transparent',
};

const SIZE_PADDING: Record<CardSize, string> = {
    sm: 'clamp(0.625rem, 0.5rem + 0.4vw, 0.875rem)',
    md: 'clamp(0.875rem, 0.7rem + 0.5vw, 1.25rem)',
    lg: 'clamp(1.125rem, 0.9rem + 0.7vw, 1.75rem)',
};

// =============================================
// PlatformCard
// =============================================

interface PlatformCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
    children: ReactNode;
    variant?: CardVariant;
    size?: CardSize;
    header?: ReactNode;
    footer?: ReactNode;
    noAnimation?: boolean;
    className?: string;
}

export function PlatformCard({
    children,
    variant = 'default',
    size = 'md',
    header,
    footer,
    noAnimation = false,
    className,
    ...props
}: PlatformCardProps) {
    const Component = noAnimation ? 'div' : motion.div;
    const motionProps = noAnimation ? {} : {
        whileHover: variant === 'hover' ? { y: -2, scale: 1.01 } : undefined,
        transition: { duration: 0.2, ease: 'easeOut' },
    };

    return (
        <Component
            className={cn(
                'rounded-xl overflow-hidden',
                VARIANT_STYLES[variant],
                className,
            )}
            {...motionProps}
            {...(props as any)}
        >
            {header && (
                <div
                    className="border-b border-[var(--color-bordure)]"
                    style={{ padding: SIZE_PADDING[size] }}
                >
                    {header}
                </div>
            )}
            <div style={{ padding: SIZE_PADDING[size] }}>
                {children}
            </div>
            {footer && (
                <div
                    className="border-t border-[var(--color-bordure)] bg-[var(--color-surface-alt)]"
                    style={{ padding: SIZE_PADDING[size] }}
                >
                    {footer}
                </div>
            )}
        </Component>
    );
}

// =============================================
// PlatformCardHeader — En-tête de carte avec titre + action
// =============================================

interface PlatformCardHeaderProps {
    title: string;
    description?: string;
    icon?: ReactNode;
    action?: ReactNode;
}

export function PlatformCardHeader({ title, description, icon, action }: PlatformCardHeaderProps) {
    return (
        <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
                {icon && (
                    <div
                        className="shrink-0 rounded-lg flex items-center justify-center"
                        style={{
                            width: 'clamp(2rem, 1.6rem + 1vw, 2.5rem)',
                            height: 'clamp(2rem, 1.6rem + 1vw, 2.5rem)',
                            backgroundColor: 'color-mix(in srgb, var(--color-dominant-600) 10%, transparent)',
                        }}
                    >
                        {icon}
                    </div>
                )}
                <div className="min-w-0">
                    <h3
                        className="font-semibold text-[var(--color-text-primary)] truncate"
                        style={{ fontSize: 'clamp(0.875rem, 0.8rem + 0.3vw, 1rem)' }}
                    >
                        {title}
                    </h3>
                    {description && (
                        <p
                            className="text-[var(--color-text-muted)] mt-0.5"
                            style={{ fontSize: 'clamp(0.75rem, 0.68rem + 0.25vw, 0.875rem)' }}
                        >
                            {description}
                        </p>
                    )}
                </div>
            </div>
            {action && <div className="shrink-0">{action}</div>}
        </div>
    );
}

// =============================================
// PlatformCardGrid — Grille responsive de cartes
// =============================================

interface PlatformCardGridProps {
    children: ReactNode;
    columns?: {
        default?: number;
        sm?: number;
        md?: number;
        lg?: number;
        xl?: number;
    };
    gap?: string;
    className?: string;
}

export function PlatformCardGrid({
    children,
    columns = { default: 1, sm: 2, lg: 3, xl: 4 },
    gap = 'var(--gap-md)',
    className,
}: PlatformCardGridProps) {
    const cols = columns;
    return (
        <div
            className={cn('grid', className)}
            style={{
                gap,
                gridTemplateColumns: `repeat(${cols.default || 1}, 1fr)`,
            }}
        >
            {children}
        </div>
    );
}

export type { PlatformCardProps, PlatformCardHeaderProps, PlatformCardGridProps, CardVariant, CardSize };
