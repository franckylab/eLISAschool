/**
 * ==================================
 * eLISAschool - ElisaButton
 * ==================================
 * Bouton principal avec variants cva, animations Framer Motion,
 * support icône, état chargement et raccourci clavier
 */

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

const buttonVariants = cva(
    'inline-flex items-center justify-center font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-dominante)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
    {
        variants: {
            variant: {
                primary:
                    'bg-[var(--color-dominante)] text-white shadow-sm hover:opacity-90 active:scale-[0.98]',
                secondary:
                    'bg-[var(--color-secondaire)] text-[var(--color-texte)] shadow-sm hover:opacity-90 active:scale-[0.98]',
                accent:
                    'bg-[var(--color-accent)] text-white shadow-sm hover:opacity-90 active:scale-[0.98]',
                ghost:
                    'bg-transparent text-[var(--color-texte)] hover:bg-[var(--color-surface-hover)] active:bg-[var(--color-surface-hover)]',
                danger:
                    'bg-[var(--color-error)] text-white shadow-sm hover:opacity-90 active:scale-[0.98]',
                outline:
                    'border border-gray-300 dark:border-[var(--color-bordure)] bg-transparent text-[var(--color-texte)] hover:bg-[var(--color-surface-hover)] active:bg-[var(--color-surface-hover)]',
            },
            size: {
                xs: 'h-[clamp(1.5rem,1.25rem+0.5vw,1.75rem)] px-[clamp(0.375rem,0.3rem+0.2vw,0.5rem)]',
                sm: 'h-[clamp(1.75rem,1.5rem+0.5vw,2rem)] px-[clamp(0.5rem,0.4rem+0.3vw,0.75rem)]',
                md: 'h-[clamp(2rem,1.75rem+0.5vw,2.5rem)] px-[clamp(0.625rem,0.5rem+0.4vw,1rem)]',
                lg: 'h-[clamp(2.5rem,2.25rem+0.5vw,3rem)] px-[clamp(0.875rem,0.75rem+0.5vw,1.5rem)]',
                xl: 'h-[clamp(3rem,2.75rem+0.5vw,3.5rem)] px-[clamp(1.25rem,1rem+0.75vw,2rem)]',
            },
            fullWidth: {
                true: 'w-full',
                false: '',
            },
        },
        defaultVariants: {
            variant: 'primary',
            size: 'md',
            fullWidth: false,
        },
    },
);

type ButtonVariantProps = VariantProps<typeof buttonVariants>;

interface ElisaButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'>, ButtonVariantProps {
    children?: ReactNode;
    icon?: ReactNode;
    leftIcon?: ReactNode; // Alias pour icon (compatibilité)
    iconRight?: ReactNode;
    isLoading?: boolean;
    chargement?: boolean; // Alias français de isLoading
    loading?: boolean; // Alias alternatif
    loadingText?: string;
    shortcut?: string;
    type?: ButtonHTMLAttributes<HTMLButtonElement>['type'];
}

export const ElisaButton = forwardRef<HTMLButtonElement, ElisaButtonProps>(
    (
        {
            className,
            variant,
            size,
            fullWidth,
            children,
            icon,
            leftIcon,
            iconRight,
            isLoading = false,
            loadingText,
            shortcut,
            type = 'button',
            disabled,
            loading, // Extraire la prop 'loading' pour éviter qu'elle ne soit spreadée dans le DOM
            chargement, // Extraire la prop 'chargement' (alias français de isLoading)
            ...props
        },
        ref,
    ) => {
        // Utiliser soit isLoading, soit chargement, soit loading
        const isLoadingFinal = isLoading || chargement || loading;
        const iconSize = {
            xs: 'clamp(0.75rem, 0.65rem + 0.3vw, 0.875rem)',
            sm: 'clamp(0.875rem, 0.75rem + 0.4vw, 1rem)',
            md: 'clamp(1rem, 0.85rem + 0.5vw, 1.125rem)',
            lg: 'clamp(1.125rem, 1rem + 0.5vw, 1.25rem)',
            xl: 'clamp(1.25rem, 1.1rem + 0.5vw, 1.5rem)',
        }[size || 'md'];

        const textSize = {
            xs: 'clamp(0.625rem, 0.55rem + 0.2vw, 0.75rem)',
            sm: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)',
            md: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)',
            lg: 'clamp(0.875rem, 0.8rem + 0.3vw, 1rem)',
            xl: 'clamp(1rem, 0.9rem + 0.5vw, 1.125rem)',
        }[size || 'md'];

        const resolvedIcon = icon || leftIcon;
        return (
            <motion.button
                ref={ref}
                type={type}
                className={cn(buttonVariants({ variant, size, fullWidth, className }))}
                style={{ gap: 'var(--gap-sm)', borderRadius: 'var(--radius-md)', fontSize: textSize }}
                disabled={disabled || isLoadingFinal}
                whileHover={{ scale: disabled || isLoadingFinal ? 1 : 1.02 }}
                whileTap={{ scale: disabled || isLoadingFinal ? 1 : 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                {...(props as HTMLMotionProps<'button'>)}
            >
                {isLoadingFinal ? (
                    <>
                        <Loader2 className="animate-spin" style={{ width: iconSize, height: iconSize }} />
                        {loadingText || children}
                    </>
                ) : (
                    <>
                        {resolvedIcon && <span style={{ width: iconSize, height: iconSize, display: 'flex' }}>{resolvedIcon}</span>}
                        {children}
                        {iconRight && <span style={{ width: iconSize, height: iconSize, display: 'flex' }}>{iconRight}</span>}
                        {shortcut && (
                            <kbd className="ml-2 hidden rounded border border-white/20 opacity-60 sm:inline-block" style={{ padding: 'clamp(0.125rem, 0.1rem + 0.05vw, 0.25rem) clamp(0.25rem, 0.2rem + 0.1vw, 0.375rem)', fontSize: 'clamp(0.625rem, 0.55rem + 0.2vw, 0.75rem)' }}>
                                {shortcut}
                            </kbd>
                        )}
                    </>
                )}
            </motion.button>
        );
    },
);

ElisaButton.displayName = 'ElisaButton';
