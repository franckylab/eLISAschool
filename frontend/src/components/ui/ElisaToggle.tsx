/**
 * ==================================
 * eLISAschool - ElisaToggle
 * ==================================
 * Composant toggle/switch moderne avec animations Framer Motion
 * Utilise les variables CSS du thème pour la cohérence visuelle
 */

import { forwardRef, useId } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';

interface ElisaToggleProps {
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    label?: string;
    description?: string;
    disabled?: boolean;
    id?: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export const ElisaToggle = forwardRef<HTMLButtonElement, ElisaToggleProps>(
    (
        {
            checked,
            onCheckedChange,
            label,
            description,
            disabled = false,
            id: idProp,
            size = 'md',
            className,
        },
        ref,
    ) => {
        const generatedId = useId();
        const id = idProp || generatedId;

        const sizeConfig = {
            sm: {
                track: 'w-9 h-5',
                thumb: 'h-4 w-4',
                translate: 'translate-x-4',
            },
            md: {
                track: 'w-11 h-6',
                thumb: 'h-5 w-5',
                translate: 'translate-x-5',
            },
            lg: {
                track: 'w-14 h-7',
                thumb: 'h-6 w-6',
                translate: 'translate-x-7',
            },
        };

        const config = sizeConfig[size];

        return (
            <div className={cn('flex items-start gap-3', className)}>
                <button
                    ref={ref}
                    id={id}
                    type="button"
                    role="switch"
                    aria-checked={checked}
                    aria-disabled={disabled}
                    disabled={disabled}
                    onClick={() => !disabled && onCheckedChange(!checked)}
                    className={cn(
                        'relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-dominante)] focus-visible:ring-offset-2',
                        'disabled:cursor-not-allowed disabled:opacity-50',
                        config.track,
                        checked
                            ? 'bg-[var(--color-dominante)]'
                            : 'bg-[var(--color-bordure)]',
                    )}
                >
                    <span className="sr-only">
                        {label || 'Toggle'}
                    </span>
                    <motion.span
                        className={cn(
                            'pointer-events-none inline-block rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ease-in-out',
                            config.thumb,
                        )}
                        initial={false}
                        animate={{
                            x: checked ? config.translate.replace('translate-x-', '') : 0,
                        }}
                        transition={{
                            type: 'spring',
                            stiffness: 500,
                            damping: 30,
                        }}
                        style={{
                            transform: checked ? `translateX(${parseInt(config.translate.replace('translate-x-', ''))}px)` : 'translateX(0px)',
                        }}
                    />
                </button>

                {(label || description) && (
                    <div className="flex flex-col gap-0.5">
                        {label && (
                            <label
                                htmlFor={id}
                                className={cn(
                                    'font-medium text-[var(--color-texte)] cursor-pointer',
                                    disabled && 'opacity-50 cursor-not-allowed',
                                    size === 'sm' && 'text-sm',
                                    size === 'md' && 'text-sm',
                                    size === 'lg' && 'text-base',
                                )}
                                onClick={() => !disabled && onCheckedChange(!checked)}
                            >
                                {label}
                            </label>
                        )}
                        {description && (
                            <p className={cn(
                                'text-[var(--color-texte-secondaire)]',
                                size === 'sm' && 'text-xs',
                                size === 'md' && 'text-xs',
                                size === 'lg' && 'text-sm',
                            )}>
                                {description}
                            </p>
                        )}
                    </div>
                )}
            </div>
        );
    },
);

ElisaToggle.displayName = 'ElisaToggle';
