/**
 * ==================================
 * eLISAschool - MultiSelect
 * ==================================
 * Composant de sélection multiple basé sur @radix-ui/react-popover.
 * Affiche les éléments sélectionnés sous forme de tags supprimables.
 * Supporte : recherche, select all, deselect all, clavier.
 *
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useState, useMemo, useCallback, useRef, useId, forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { Check, ChevronDown, Search, X, CheckCheck, XCircle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { motion, AnimatePresence } from 'framer-motion';

interface MultiSelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}

interface ElisaMultiSelectProps {
    /** Options disponibles */
    options: MultiSelectOption[];
    /** Valeurs sélectionnées */
    value?: string[];
    /** Callback quand la sélection change */
    onValueChange?: (values: string[]) => void;
    /** Label affiché au-dessus */
    label?: string;
    /** Texte d'aide */
    hint?: string;
    /** Message d'erreur */
    error?: string;
    /** Placeholder dans le trigger */
    placeholder?: string;
    /** Désactiver le composant */
    disabled?: boolean;
    /** Obligatoire */
    required?: boolean;
    /** Afficher la barre de recherche */
    searchable?: boolean;
    /** Afficher les boutons "Tout" / "Aucun" */
    showSelectAll?: boolean;
    /** Nombre max de tags affichés avant collapse */
    maxVisibleTags?: number;
    /** Pleine largeur */
    fullWidth?: boolean;
    /** Classe CSS additionnelle */
    className?: string;
    /** Nom du champ (pour formulaires) */
    name?: string;
    /** Accessibilité */
    'aria-label'?: string;
}

export const ElisaMultiSelect = forwardRef<HTMLButtonElement, ElisaMultiSelectProps>(
    (
        {
            options,
            value = [],
            onValueChange,
            label,
            hint,
            error,
            placeholder = 'Sélectionner...',
            disabled = false,
            required = false,
            searchable = true,
            showSelectAll = false,
            maxVisibleTags = 3,
            fullWidth = true,
            className,
            name,
            'aria-label': ariaLabel,
        },
        ref,
    ) => {
        const { t } = useTranslation('config-params');
        const generatedId = useId();
        const [open, setOpen] = useState(false);
        const [recherche, setRecherche] = useState('');
        const searchInputRef = useRef<HTMLInputElement>(null);

        // Options filtrées par recherche
        const optionsFiltrees = useMemo(() => {
            if (!recherche.trim()) return options;
            const q = recherche.toLowerCase();
            return options.filter(o => o.label.toLowerCase().includes(q));
        }, [options, recherche]);

        // Compter les sélectionnés parmi les filtrées
        const selectedCount = value.length;
        const filteredSelectedCount = useMemo(
            () => optionsFiltrees.filter(o => value.includes(o.value)).length,
            [optionsFiltrees, value],
        );

        // Toggle une option
        const toggleOption = useCallback((optValue: string) => {
            const next = value.includes(optValue)
                ? value.filter(v => v !== optValue)
                : [...value, optValue];
            onValueChange?.(next);
        }, [value, onValueChange]);

        // Tout sélectionner / désélectionner (sur les options filtrées)
        const handleSelectAll = useCallback(() => {
            const allFilteredValues = optionsFiltrees.filter(o => !o.disabled).map(o => o.value);
            const allSelected = allFilteredValues.every(v => value.includes(v));

            if (allSelected) {
                // Désélectionner les filtrées
                onValueChange?.(value.filter(v => !allFilteredValues.includes(v)));
            } else {
                // Sélectionner les filtrées (union avec les déjà sélectionnées hors filtre)
                const horsFiltre = value.filter(v => !optionsFiltrees.some(o => o.value === v));
                onValueChange?.([...horsFiltre, ...allFilteredValues]);
            }
        }, [optionsFiltrees, value, onValueChange]);

        // Tout désélectionner
        const handleClearAll = useCallback(() => {
            onValueChange?.([]);
        }, [onValueChange]);

        // Retirer un tag
        const removeTag = useCallback((optValue: string) => {
            onValueChange?.(value.filter(v => v !== optValue));
        }, [value, onValueChange]);

        // Label du trigger
        const triggerLabel = useMemo(() => {
            if (selectedCount === 0) return placeholder || t('multiSelect.placeholder', 'Sélectionner...');
            if (selectedCount === 1) {
                const opt = options.find(o => o.value === value[0]);
                return opt?.label || `1 ${t('multiSelect.selectionne', 'sélectionné(s)')}`;
            }
            return `${selectedCount} ${t('multiSelect.selectionne', 'sélectionné(s)')}`;
        }, [selectedCount, value, options, placeholder, t]);

        // Options visible tags
        const visibleTags = value.slice(0, maxVisibleTags);
        const hiddenTagsCount = Math.max(0, value.length - maxVisibleTags);

        // Label d'option par value
        const labelByValue = useMemo(() => {
            const map = new Map<string, string>();
            for (const opt of options) map.set(opt.value, opt.label);
            return map;
        }, [options]);

        // Focus search input à l'ouverture
        const handleOpenChange = useCallback((isOpen: boolean) => {
            setOpen(isOpen);
            if (isOpen) {
                setRecherche('');
                setTimeout(() => searchInputRef.current?.focus(), 50);
            }
        }, []);

        // État "tout coché" parmi les filtrées
        const allFilteredSelected = optionsFiltrees.length > 0
            && optionsFiltrees.filter(o => !o.disabled).every(o => value.includes(o.value));

        return (
            <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full', className)}>
                {/* Label */}
                {label && (
                    <label className="text-sm font-medium text-[var(--color-text-primary)]">
                        {label}
                        {required && <span className="ml-1 text-[var(--color-danger)]">*</span>}
                    </label>
                )}

                <PopoverPrimitive.Root open={open} onOpenChange={handleOpenChange}>
                    {/* Trigger */}
                    <PopoverPrimitive.Trigger asChild>
                        <button
                            ref={ref}
                            type="button"
                            disabled={disabled}
                            aria-label={ariaLabel || label || placeholder}
                            aria-expanded={open}
                            className={cn(
                                'inline-flex items-center justify-between rounded-lg border',
                                'bg-[var(--color-surface)] px-3 text-sm min-h-[2.5rem]',
                                'text-[var(--color-text-primary)] transition-colors',
                                'focus:border-[var(--color-dominant-500)] focus:outline-none focus:ring-2 focus:ring-[var(--color-dominant-500)]/20',
                                'disabled:cursor-not-allowed disabled:opacity-50',
                                error
                                    ? 'border-[var(--color-danger)]'
                                    : 'border-[var(--color-bordure)]',
                            )}
                        >
                            <div className="flex flex-1 flex-wrap items-center gap-1 min-w-0 py-1">
                                {selectedCount === 0 ? (
                                    <span className="text-[var(--color-text-muted)] truncate">{placeholder}</span>
                                ) : (
                                    <>
                                        {visibleTags.map(v => (
                                            <span
                                                key={v}
                                                className="inline-flex items-center gap-1 rounded-md bg-[var(--color-dominant-100)] px-1.5 py-0.5 text-xs font-medium text-[var(--color-dominant-700)] dark:bg-[var(--color-dominant-900)]/30 dark:text-[var(--color-dominant-300)]"
                                            >
                                                <span className="truncate max-w-[120px]">{labelByValue.get(v) || v}</span>
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); removeTag(v); }}
                                                    className="rounded-sm hover:bg-[var(--color-dominant-200)] dark:hover:bg-[var(--color-dominant-800)] p-0.5 transition-colors"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </span>
                                        ))}
                                        {hiddenTagsCount > 0 && (
                                            <span className="text-xs text-[var(--color-text-secondary)]">
                                                +{hiddenTagsCount}
                                            </span>
                                        )}
                                    </>
                                )}
                            </div>
                            <ChevronDown className={cn(
                                'h-4 w-4 shrink-0 ml-2 text-[var(--color-text-secondary)] transition-transform',
                                open && 'rotate-180',
                            )} />
                        </button>
                    </PopoverPrimitive.Trigger>

                    <PopoverPrimitive.Portal>
                        <PopoverPrimitive.Content
                            className={cn(
                                'z-[1100] rounded-lg border',
                                'border-[var(--color-bordure)] bg-[var(--color-surface)]',
                                'shadow-lg animate-in fade-in-0 zoom-in-95',
                                'max-h-[min(70vh,360px)]',
                                'w-[var(--radix-popover-trigger-width)] max-w-[calc(100vw-2rem)]',
                            )}
                            sideOffset={4}
                            align="start"
                            avoidCollisions
                        >
                            {/* Barre de recherche */}
                            {searchable && (
                                <div className="flex items-center gap-1.5 border-b border-[var(--color-bordure)] px-2 py-1.5">
                                    <Search className="h-3.5 w-3.5 text-[var(--color-text-muted)] shrink-0" />
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        value={recherche}
                                        onChange={(e) => setRecherche(e.target.value)}
                                        placeholder={t('multiSelect.rechercher', 'Rechercher...')}
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

                            {/* Actions groupées */}
                            {showSelectAll && (
                                <div className="flex items-center justify-between border-b border-[var(--color-bordure)] px-2 py-1">
                                    <button
                                        type="button"
                                        onClick={handleSelectAll}
                                        className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                                    >
                                        <CheckCheck className="h-3 w-3" />
                                        {allFilteredSelected ? t('multiSelect.toutDeselectionner', 'Désélectionner') : t('multiSelect.toutSelectionner', 'Tout sélectionner')}
                                    </button>
                                    {selectedCount > 0 && (
                                        <button
                                            type="button"
                                            onClick={handleClearAll}
                                            className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-danger-600)] transition-colors"
                                        >
                                            <XCircle className="h-3 w-3" />
                                            {t('multiSelect.toutEffacer', 'Tout effacer')}
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Liste des options */}
                            <div className="overflow-y-auto p-1" style={{ maxHeight: '240px' }} role="listbox" aria-multiselectable="true" aria-label={ariaLabel || label}>
                                {optionsFiltrees.length === 0 ? (
                                    <div className="px-3 py-4 text-center text-sm text-[var(--color-text-muted)]">
                                        {t('multiSelect.aucunResultat', 'Aucun résultat')}
                                    </div>
                                ) : (
                                    optionsFiltrees.map((option) => {
                                        const isSelected = value.includes(option.value);
                                        return (
                                            <button
                                                key={option.value}
                                                type="button"
                                                role="option"
                                                aria-selected={isSelected}
                                                disabled={option.disabled}
                                                onClick={() => toggleOption(option.value)}
                                                className={cn(
                                                    'relative flex w-full cursor-pointer select-none items-center gap-2 rounded-md px-3 py-2 text-sm outline-none transition-colors',
                                                    'text-[var(--color-text-primary)]',
                                                    'hover:bg-[var(--color-surface-hover)]',
                                                    'disabled:pointer-events-none disabled:opacity-50',
                                                )}
                                            >
                                                {/* Checkbox visuelle */}
                                                <span className={cn(
                                                    'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                                                    isSelected
                                                        ? 'border-[var(--color-dominant-500)] bg-[var(--color-dominant-500)]'
                                                        : 'border-[var(--color-bordure)] bg-[var(--color-surface)]',
                                                )}>
                                                    {isSelected && <Check className="h-3 w-3 text-white" />}
                                                </span>
                                                <span className="truncate">{option.label}</span>
                                            </button>
                                        );
                                    })
                                )}
                            </div>

                            {/* Pied : compteur */}
                            {selectedCount > 0 && (
                                <div className="border-t border-[var(--color-bordure)] px-3 py-1.5">
                                    <span className="text-xs text-[var(--color-text-secondary)]">
                                        {t('multiSelect.elementSelectionne', { count: selectedCount, defaultValue: `${selectedCount} élément(s) sélectionné(s)` })}
                                    </span>
                                </div>
                            )}
                        </PopoverPrimitive.Content>
                    </PopoverPrimitive.Portal>
                </PopoverPrimitive.Root>

                {/* Input caché pour formulaires */}
                {name && (
                    <input type="hidden" name={name} value={JSON.stringify(value)} />
                )}

                {/* Erreur */}
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

ElisaMultiSelect.displayName = 'ElisaMultiSelect';
