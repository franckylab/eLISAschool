/**
 * ==================================
 * eLISAschool - ElisaSelect
 * ==================================
 * Composant select basé sur @radix-ui/react-select avec animations
 */

import { forwardRef, useId } from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/cn';

interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}

interface ElisaSelectProps {
    options: SelectOption[];
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    placeholder?: string;
    label?: string;
    error?: string;
    hint?: string;
    disabled?: boolean;
    required?: boolean;
    fullWidth?: boolean;
    className?: string;
    name?: string;
}

export const ElisaSelect = forwardRef<HTMLButtonElement, ElisaSelectProps>(
    (
        {
            options,
            value,
            defaultValue,
            onValueChange,
            placeholder = 'Sélectionner...',
            label,
            error,
            hint,
            disabled = false,
            required,
            fullWidth = true,
            className,
            name,
        },
        ref,
    ) => {
        const generatedId = useId();
        const id = generatedId;

        // Vérification en développement : alerter si des options ont des valeurs vides
        if (process.env.NODE_ENV === 'development') {
            const invalidOptions = options.filter(
                (opt) => opt.value === '' || opt.value === undefined || opt.value === null,
            );
            if (invalidOptions.length > 0) {
                console.warn(
                    `[ElisaSelect] Options avec valeurs vides détectées et ignorées:`,
                    invalidOptions.map((o) => o.label),
                );
            }
        }

        return (
            <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
                {label && (
                    <label className="text-sm font-medium text-[var(--color-texte)]">
                        {label}
                        {required && <span className="ml-1 text-[var(--color-error)]">*</span>}
                    </label>
                )}
                <SelectPrimitive.Root
                    value={value}
                    defaultValue={defaultValue}
                    onValueChange={onValueChange}
                    disabled={disabled}
                    required={required}
                    name={name}
                >
                    <SelectPrimitive.Trigger
                        ref={ref}
                        id={id}
                        className={cn(
                            'inline-flex h-10 items-center justify-between rounded-lg border bg-[var(--color-surface)] px-3 text-sm',
                            'text-[var(--color-texte)] transition-colors',
                            'focus:border-[var(--color-dominante)] focus:outline-none focus:ring-2 focus:ring-[var(--color-dominante)]/20',
                            'disabled:cursor-not-allowed disabled:opacity-50',
                            error
                                ? 'border-[var(--color-error)]'
                                : 'border-[var(--color-bordure)]',
                            className,
                        )}
                    >
                        <SelectPrimitive.Value placeholder={placeholder} />
                        <SelectPrimitive.Icon asChild>
                            <ChevronDown className="h-4 w-4 text-[var(--color-texte-secondaire)]" />
                        </SelectPrimitive.Icon>
                    </SelectPrimitive.Trigger>

                    <SelectPrimitive.Portal>
                        <SelectPrimitive.Content
                            className="z-[1100] max-h-60 overflow-hidden rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface)] shadow-lg animate-in fade-in-0 zoom-in-95"
                            position="popper"
                            sideOffset={4}
                        >
                            <SelectPrimitive.ScrollUpButton className="flex h-8 cursor-default items-center justify-center">
                                <ChevronUp className="h-4 w-4" />
                            </SelectPrimitive.ScrollUpButton>

                            <SelectPrimitive.Viewport className="p-1">
                                {options
                                    .filter((option) => option.value !== '' && option.value !== undefined && option.value !== null)
                                    .map((option) => (
                                        <SelectPrimitive.Item
                                            key={option.value}
                                            value={option.value}
                                            disabled={option.disabled}
                                            className={cn(
                                                'relative flex cursor-pointer select-none items-center rounded-md px-8 py-2 text-sm outline-none',
                                                'text-[var(--color-texte)]',
                                                'focus:bg-[var(--color-surface-hover)]',
                                                'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
                                            )}
                                        >
                                            <span className="absolute left-2 flex h-4 w-4 items-center justify-center">
                                                <SelectPrimitive.ItemIndicator>
                                                    <Check className="h-4 w-4 text-[var(--color-dominante)]" />
                                                </SelectPrimitive.ItemIndicator>
                                            </span>
                                            <SelectPrimitive.ItemText>
                                                {option.label}
                                            </SelectPrimitive.ItemText>
                                        </SelectPrimitive.Item>
                                    ))}
                            </SelectPrimitive.Viewport>

                            <SelectPrimitive.ScrollDownButton className="flex h-8 cursor-default items-center justify-center">
                                <ChevronDown className="h-4 w-4" />
                            </SelectPrimitive.ScrollDownButton>
                        </SelectPrimitive.Content>
                    </SelectPrimitive.Portal>
                </SelectPrimitive.Root>

                {error && (
                    <p className="text-xs text-[var(--color-error)]" role="alert">{error}</p>
                )}
                {hint && !error && (
                    <p className="text-xs text-[var(--color-texte-secondaire)]">{hint}</p>
                )}
            </div>
        );
    },
);

ElisaSelect.displayName = 'ElisaSelect';
