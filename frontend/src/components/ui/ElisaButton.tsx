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
    'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-dominante)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
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
                    'border border-[var(--color-bordure)] bg-transparent text-[var(--color-texte)] hover:bg-[var(--color-surface-hover)] active:bg-[var(--color-surface-hover)]',
            },
            size: {
                xs: 'h-7 px-2 text-xs',
                sm: 'h-8 px-3 text-sm',
                md: 'h-10 px-4 text-sm',
                lg: 'h-12 px-6 text-base',
                xl: 'h-14 px-8 text-lg',
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
    iconRight?: ReactNode;
    isLoading?: boolean;
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
            iconRight,
            isLoading = false,
            loadingText,
            shortcut,
            type = 'button',
            disabled,
            ...props
        },
        ref,
    ) => {
        return (
            <motion.button
                ref={ref}
                type={type}
                className={cn(buttonVariants({ variant, size, fullWidth, className }))}
                disabled={disabled || isLoading}
                whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
                whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                {...(props as HTMLMotionProps<'button'>)}
            >
                {isLoading ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {loadingText || children}
                    </>
                ) : (
                    <>
                        {icon}
                        {children}
                        {iconRight}
                        {shortcut && (
                            <kbd className="ml-2 hidden rounded border border-white/20 px-1.5 py-0.5 text-xs opacity-60 sm:inline-block">
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
