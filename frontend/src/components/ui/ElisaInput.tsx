/**
 * ==================================
 * eLISAschool - ElisaInput
 * ==================================
 * Champ de saisie avec label, erreur, icône
 * forwardRef pour React Hook Form
 */

import { forwardRef, type InputHTMLAttributes, type ReactNode, useId } from 'react';
import { cn } from '@/lib/cn';

interface ElisaInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
    label?: string;
    error?: string;
    hint?: string;
    icon?: ReactNode;
    iconRight?: ReactNode;
    iconRightClickable?: boolean;
    onIconRightClick?: () => void;
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
}

export const ElisaInput = forwardRef<HTMLInputElement, ElisaInputProps>(
    (
        {
            className,
            label,
            error,
            hint,
            icon,
            iconRight,
            iconRightClickable,
            onIconRightClick,
            size = 'md',
            fullWidth = true,
            id: idProp,
            required,
            disabled,
            ...props
        },
        ref,
    ) => {
        const generatedId = useId();
        const id = idProp || generatedId;

        const sizeClasses = {
            sm: 'h-8 px-3 text-sm',
            md: 'h-10 px-3 text-sm',
            lg: 'h-12 px-4 text-base',
        };

        return (
            <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
                {label && (
                    <label
                        htmlFor={id}
                        className="text-sm font-medium text-[var(--color-texte)]"
                    >
                        {label}
                        {required && <span className="ml-1 text-[var(--color-error)]">*</span>}
                    </label>
                )}
                <div className="relative">
                    {icon && (
                        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-texte-secondaire)]">
                            {icon}
                        </div>
                    )}
                    <input
                        ref={ref}
                        id={id}
                        className={cn(
                            'rounded-lg border bg-[var(--color-surface)] text-[var(--color-texte)] transition-colors',
                            'placeholder:text-[var(--color-texte-secondaire)]/60',
                            'focus:border-[var(--color-dominante)] focus:outline-none focus:ring-2 focus:ring-[var(--color-dominante)]/20',
                            'disabled:cursor-not-allowed disabled:opacity-50',
                            error
                                ? 'border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-[var(--color-error)]/20'
                                : 'border-[var(--color-bordure)]',
                            sizeClasses[size],
                            icon && 'pl-10',
                            iconRight && 'pr-10',
                            className,
                        )}
                        disabled={disabled}
                        required={required}
                        aria-invalid={!!error}
                        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
                        {...props}
                    />
                    {iconRight && (
                        iconRightClickable ? (
                            <button
                                type="button"
                                onClick={onIconRightClick}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-texte-secondaire)] hover:text-[var(--color-texte)] transition-colors cursor-pointer"
                                tabIndex={-1}
                            >
                                {iconRight}
                            </button>
                        ) : (
                            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-texte-secondaire)]">
                                {iconRight}
                            </div>
                        )
                    )}
                </div>
                {error && (
                    <p id={`${id}-error`} className="text-xs text-[var(--color-error)]" role="alert">
                        {error}
                    </p>
                )}
                {hint && !error && (
                    <p id={`${id}-hint`} className="text-xs text-[var(--color-texte-secondaire)]">
                        {hint}
                    </p>
                )}
            </div>
        );
    },
);

ElisaInput.displayName = 'ElisaInput';
