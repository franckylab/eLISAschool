/**
 * ==================================
 * eLISAschool - ElisaSelect v2.1
 * ==================================
 * Composant select basé sur @radix-ui/react-select avec animations.
 * v2.0 : prop searchable (filtrage live), variant compact (h-8), dark mode explicite.
 * v2.1 : contraintes viewport (max-h, max-w, avoidCollisions), items tronqués,
 *         scroll buttons avec gradient fade, aria-label support.
 */

import { forwardRef, useId, useState, useMemo } from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp, Search, X } from 'lucide-react';
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
    /** Affiche un input de recherche dans le dropdown (filtrage live côté client) */
    searchable?: boolean;
    /** Variant compact : h-8, text-xs — pour les filtres DataTable/FilterPanel */
    compact?: boolean;
    className?: string;
    name?: string;
    /** Accessibilité — label ARIA sur le trigger */
    'aria-label'?: string;
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
            searchable = false,
            compact = false,
            className,
            name,
            'aria-label': ariaLabel,
        },
        ref,
    ) => {
        const generatedId = useId();
        const id = generatedId;
        const [recherche, setRecherche] = useState('');

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

        // Filtrage des options par recherche (uniquement si searchable)
        const optionsFiltrees = useMemo(() => {
            if (!searchable || !recherche.trim()) return options;
            const q = recherche.toLowerCase();
            return options.filter((o) => o.label.toLowerCase().includes(q));
        }, [options, searchable, recherche]);

        // Reset recherche à la sélection
        const handleValueChange = (v: string) => {
            setRecherche('');
            onValueChange?.(v);
        };

        return (
            <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
                {label && (
                    <label className="text-sm font-medium text-[var(--color-text-primary)]">
                        {label}
                        {required && <span className="ml-1 text-[var(--color-danger)]">*</span>}
                    </label>
                )}
                <SelectPrimitive.Root
                    value={value}
                    defaultValue={defaultValue}
                    onValueChange={handleValueChange}
                    disabled={disabled}
                    required={required}
                    name={name}
                >
                    <SelectPrimitive.Trigger
                        ref={ref}
                        id={id}
                        aria-label={ariaLabel}
                        className={cn(
                            'inline-flex items-center justify-between rounded-lg border',
                            'bg-[var(--color-surface)] dark:bg-[var(--color-surface)]',
                            'px-3 text-sm',
                            'text-[var(--color-text-primary)] transition-colors',
                            'focus:border-[var(--color-dominant-500)] focus:outline-none focus:ring-2 focus:ring-[var(--color-dominant-500)]/20',
                            'disabled:cursor-not-allowed disabled:opacity-50',
                            compact
                                ? 'h-8 text-xs px-2'
                                : 'h-10',
                            error
                                ? 'border-[var(--color-danger)]'
                                : 'border-[var(--color-bordure)] dark:border-[var(--color-bordure)]',
                            className,
                        )}
                    >
                        <SelectPrimitive.Value placeholder={placeholder} />
                        <SelectPrimitive.Icon asChild>
                            <ChevronDown className={cn('text-[var(--color-text-secondary)]', compact ? 'h-3.5 w-3.5' : 'h-4 w-4')} />
                        </SelectPrimitive.Icon>
                    </SelectPrimitive.Trigger>

                    <SelectPrimitive.Portal>
                        <SelectPrimitive.Content
                            className={cn(
                                'z-[1100] overflow-hidden rounded-lg border',
                                'border-[var(--color-bordure)] dark:border-[var(--color-bordure)]',
                                'bg-[var(--color-surface)] dark:bg-[var(--color-surface)]',
                                'shadow-lg animate-in fade-in-0 zoom-in-95',
                                // Contraintes viewport — empêche le débordement écran
                                'max-h-[min(70vh,360px)]',
                                // Largeur = trigger, mais jamais plus que le viewport - 2rem
                                'w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-2rem)]',
                            )}
                            position="popper"
                            sideOffset={4}
                            avoidCollisions
                        >
                            {/* Barre de recherche (si searchable) */}
                            {searchable && (
                                <div className="flex items-center gap-1.5 border-b border-[var(--color-bordure)] dark:border-[var(--color-bordure)] px-2 py-1.5">
                                    <Search className="h-3.5 w-3.5 text-[var(--color-text-muted)] shrink-0" />
                                    <input
                                        type="text"
                                        value={recherche}
                                        onChange={(e) => setRecherche(e.target.value)}
                                        placeholder={placeholder}
                                        className="flex-1 min-w-0 bg-transparent text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
                                        onClick={(e) => e.stopPropagation()}
                                        onKeyDown={(e) => e.stopPropagation()}
                                    />
                                    {recherche && (
                                        <button
                                            type="button"
                                            onClick={() => setRecherche('')}
                                            className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    )}
                                </div>
                            )}

                            <SelectPrimitive.ScrollUpButton className="sticky top-0 z-10 flex h-6 cursor-default items-center justify-center bg-gradient-to-b from-[var(--color-surface)] to-[var(--color-surface)]/80 border-b border-[var(--color-bordure)]/50">
                                <ChevronUp className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                            </SelectPrimitive.ScrollUpButton>

                            <SelectPrimitive.Viewport className="p-1">
                                {optionsFiltrees
                                    .filter((option) => option.value !== undefined && option.value !== null)
                                    .map((option) => (
                                        <SelectPrimitive.Item
                                            key={option.value}
                                            value={option.value}
                                            disabled={option.disabled}
                                            className={cn(
                                                'relative flex cursor-pointer select-none items-center rounded-md px-8 py-2 text-sm outline-none',
                                                'text-[var(--color-text-primary)]',
                                                'focus:bg-[var(--color-surface-hover)] dark:focus:bg-[var(--color-surface-hover)]',
                                                'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
                                                compact && 'py-1.5 text-xs',
                                            )}
                                        >
                                            <span className="absolute left-2 flex h-4 w-4 items-center justify-center">
                                                <SelectPrimitive.ItemIndicator>
                                                    <Check className="h-4 w-4 text-[var(--color-dominant-500)]" />
                                                </SelectPrimitive.ItemIndicator>
                                            </span>
                                            <SelectPrimitive.ItemText className="truncate">
                                                {option.label}
                                            </SelectPrimitive.ItemText>
                                        </SelectPrimitive.Item>
                                    ))}
                                {/* Message aucun résultat (searchable) */}
                                {searchable && optionsFiltrees.length === 0 && (
                                    <div className="px-3 py-4 text-center text-sm text-[var(--color-text-muted)]">
                                        Aucun résultat
                                    </div>
                                )}
                            </SelectPrimitive.Viewport>

                            <SelectPrimitive.ScrollDownButton className="sticky bottom-0 z-10 flex h-6 cursor-default items-center justify-center bg-gradient-to-t from-[var(--color-surface)] to-[var(--color-surface)]/80 border-t border-[var(--color-bordure)]/50">
                                <ChevronDown className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                            </SelectPrimitive.ScrollDownButton>
                        </SelectPrimitive.Content>
                    </SelectPrimitive.Portal>
                </SelectPrimitive.Root>

                {error && (
                    <p className="text-xs text-[var(--color-danger)]" role="alert">{error}</p>
                )}
                {hint && !error && (
                    <p className="text-xs text-[var(--color-text-secondary)]">{hint}</p>
                )}
            </div>
        );
    },
);

ElisaSelect.displayName = 'ElisaSelect';
