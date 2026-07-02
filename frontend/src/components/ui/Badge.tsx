/**
 * ==================================
 * eLISAschool - Badge UI Component
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { type HTMLAttributes, type ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const badgeVariants = cva(
    'inline-flex items-center gap-1 rounded-full font-medium transition-colors whitespace-nowrap',
    {
        variants: {
            variant: {
                default: 'bg-[var(--color-dominante)]/10 text-[var(--color-dominante)] border border-[var(--color-dominante)]/20',
                success: 'bg-[var(--color-success)]/10 text-[var(--color-success)] border border-[var(--color-success)]/20',
                warning: 'bg-[var(--color-warning)]/10 text-[var(--color-warning)] border border-[var(--color-warning)]/20',
                danger: 'bg-[var(--color-danger)]/10 text-[var(--color-danger)] border border-[var(--color-danger)]/20',
                outline: 'border border-[var(--color-bordure)] text-[var(--color-texte-secondaire)] bg-transparent',
                secondary: 'bg-[var(--color-surface-hover)] text-[var(--color-texte)] border border-[var(--color-bordure)]',
            },
            size: {
                xs: 'px-1.5 py-0.5 text-[clamp(8px,0.6vw+0.3rem,10px)]',
                sm: 'px-2 py-0.5 text-[clamp(9px,0.7vw+0.3rem,11px)]',
                md: 'px-2.5 py-1 text-[clamp(10px,0.8vw+0.3rem,12px)]',
                lg: 'px-3 py-1.5 text-[clamp(11px,0.9vw+0.3rem,13px)]',
            },
            dot: {
                true: '',
                false: '',
            },
        },
        compoundVariants: [
            {
                variant: 'default',
                dot: true,
                className: 'bg-[var(--color-dominante)]/15',
            },
            {
                variant: 'success',
                dot: true,
                className: 'bg-[var(--color-success)]/15',
            },
        ],
        defaultVariants: {
            variant: 'default',
            size: 'sm',
        },
    }
);

interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {
    children: ReactNode;
    dot?: boolean;
    icon?: ReactNode;
}

function Badge({ className, variant, size, dot = false, icon, children, ...props }: BadgeProps) {
    return (
        <span
            className={cn(badgeVariants({ variant, size, className }))}
            {...props}
        >
            {/* Indicateur point animé */}
            {dot && (
                <span className="relative flex h-1.5 w-1.5">
                    <span className={cn(
                        'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
                        variant === 'success' && 'bg-[var(--color-success)]',
                        variant === 'warning' && 'bg-[var(--color-warning)]',
                        variant === 'danger' && 'bg-[var(--color-danger)]',
                        (!variant || variant === 'default') && 'bg-[var(--color-dominante)]',
                    )} />
                    <span className={cn(
                        'relative inline-flex h-1.5 w-1.5 rounded-full',
                        variant === 'success' && 'bg-[var(--color-success)]',
                        variant === 'warning' && 'bg-[var(--color-warning)]',
                        variant === 'danger' && 'bg-[var(--color-danger)]',
                        (!variant || variant === 'default') && 'bg-[var(--color-dominante)]',
                    )} />
                </span>
            )}
            {/* Icône optionnelle */}
            {icon && <span className="shrink-0">{icon}</span>}
            {children}
        </span>
    );
}

export { Badge, badgeVariants, type BadgeProps };
