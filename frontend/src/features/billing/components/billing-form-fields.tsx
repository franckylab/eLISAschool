/**
 * ==================================
 * eLISAschool - Billing Form Fields (composants réutilisables)
 * ==================================
 *
 * Composants de formulaire génériques pour les modules billing
 * (promotions, packages, plans, providers, etc.).
 * Design épuré, responsive, dark mode via CSS variables.
 *
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { type ReactNode, useState, useRef, useEffect } from 'react';

// =============================================
// TYPES
// =============================================

interface BaseFieldProps {
    label: string;
    required?: boolean;
    /** Classe CSS supplémentaire pour le wrapper */
    className?: string;
}

// =============================================
// FORM INPUT
// =============================================

interface FormInputProps extends BaseFieldProps {
    value: string;
    onChange: (value: string) => void;
    type?: string;
    disabled?: boolean;
    placeholder?: string;
    min?: number;
    max?: number;
    /** Icône affichée à gauche de l'input */
    icon?: ReactNode;
    /** Texte d'aide affiché sous le champ */
    hint?: string;
}

export function FormInput({
    label,
    value,
    onChange,
    type = 'text',
    disabled,
    placeholder,
    required,
    min,
    max,
    icon,
    hint,
    className,
}: FormInputProps) {
    return (
        <div className={className}>
            <label className="block text-xs font-medium text-[var(--color-texte-muted)] mb-1">
                {label}{required && ' *'}
            </label>
            <div className="relative">
                {icon && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-texte-muted)]">
                        {icon}
                    </span>
                )}
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    placeholder={placeholder}
                    required={required}
                    min={min}
                    max={max}
                    className={`w-full rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface-hover)] px-3 py-2 text-sm text-[var(--color-texte)] placeholder:text-[var(--color-texte-muted)] focus:border-[var(--color-dominant-600)] focus:outline-none focus:ring-1 focus:ring-[var(--color-dominant-600)] disabled:opacity-50 disabled:cursor-not-allowed ${icon ? 'pl-9' : ''}`}
                />
            </div>
            {hint && (
                <p className="mt-0.5 text-[10px] text-[var(--color-texte-muted)]">{hint}</p>
            )}
        </div>
    );
}

// =============================================
// FORM SELECT
// =============================================

interface FormSelectProps extends BaseFieldProps {
    value: string;
    onChange: (value: string) => void;
    options: Array<{ value: string; label: string }>;
    disabled?: boolean;
    /** Texte d'aide affiché sous le select */
    hint?: string;
}

export function FormSelect({
    label,
    value,
    onChange,
    options,
    required,
    disabled,
    className,
    hint,
}: FormSelectProps) {
    return (
        <div className={className}>
            <label className="block text-xs font-medium text-[var(--color-texte-muted)] mb-1">
                {label}{required && ' *'}
            </label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className="w-full rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface-hover)] px-3 py-2 text-sm text-[var(--color-texte)] focus:border-[var(--color-dominant-600)] focus:outline-none focus:ring-1 focus:ring-[var(--color-dominant-600)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <option value="">— Sélectionner —</option>
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
            {hint && (
                <p className="mt-0.5 text-[10px] text-[var(--color-texte-muted)]">{hint}</p>
            )}
        </div>
    );
}

// =============================================
// FORM CHECKBOX
// =============================================

interface FormCheckboxProps {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    className?: string;
    /** Texte d'aide affiché sous le checkbox */
    hint?: string;
}

export function FormCheckbox({
    label,
    checked,
    onChange,
    className,
    hint,
}: FormCheckboxProps) {
    return (
        <label className={`flex items-center gap-2 text-sm text-[var(--color-texte)] cursor-pointer ${className ?? ''}`}>
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="rounded border-[var(--color-bordure)]"
            />
            <span className="flex flex-col">
                <span>{label}</span>
                {hint && (
                    <span className="text-[10px] text-[var(--color-texte-muted)]">{hint}</span>
                )}
            </span>
        </label>
    );
}

// =============================================
// FORM MULTI-SELECT (sélection multiple avec badges)
// =============================================

interface FormMultiSelectProps extends BaseFieldProps {
    /** IDs actuellementment sélectionnés */
    values: string[];
    /** Callback quand la sélection change */
    onChange: (values: string[]) => void;
    /** Options disponibles { value: id, label: nom, description?: sous-texte } */
    options: Array<{ value: string; label: string; description?: string }>;
    /** Texte affiché quand rien n'est sélectionné */
    placeholder?: string;
    /** Désactivé */
    disabled?: boolean;
    /** Sélectionner tout / désélectionner tout */
    showToggleAll?: boolean;
}

export function FormMultiSelect({
    label,
    values,
    onChange,
    options,
    placeholder = 'Sélectionner...',
    required,
    disabled,
    className,
    showToggleAll = false,
}: FormMultiSelectProps) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Fermer le dropdown au clic extérieur
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        if (open) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open]);

    const selectedLabels = values
        .map((v) => options.find((o) => o.value === v)?.label)
        .filter(Boolean);

    const toggle = (val: string) => {
        onChange(values.includes(val) ? values.filter((v) => v !== val) : [...values, val]);
    };

    const toggleAll = () => {
        onChange(values.length === options.length ? [] : options.map((o) => o.value));
    };

    return (
        <div className={className} ref={containerRef}>
            <label className="block text-xs font-medium text-[var(--color-texte-muted)] mb-1">
                {label}{required && ' *'}
            </label>
            {/* Trigger — affiche les badges sélectionnés */}
            <button
                type="button"
                onClick={() => !disabled && setOpen(!open)}
                disabled={disabled}
                className="w-full min-h-[38px] rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface-hover)] px-3 py-1.5 text-left text-sm text-[var(--color-texte)] focus:border-[var(--color-dominant-600)] focus:outline-none focus:ring-1 focus:ring-[var(--color-dominant-600)] disabled:opacity-50 disabled:cursor-not-allowed flex flex-wrap gap-1 items-center"
            >
                {selectedLabels.length === 0 ? (
                    <span className="text-[var(--color-texte-muted)]">{placeholder}</span>
                ) : (
                    selectedLabels.map((lbl) => (
                        <span
                            key={lbl}
                            className="inline-flex items-center gap-1 rounded-md bg-[var(--color-dominant-100)] text-[var(--color-dominant-700)] px-2 py-0.5 text-xs font-medium"
                        >
                            {lbl}
                        </span>
                    ))
                )}
            </button>
            {/* Dropdown */}
            {open && (
                <div className="mt-1 max-h-60 overflow-auto rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface)] shadow-lg z-50">
                    {showToggleAll && options.length > 1 && (
                        <button
                            type="button"
                            onClick={toggleAll}
                            className="w-full px-3 py-1.5 text-xs font-medium text-[var(--color-dominant-600)] hover:bg-[var(--color-surface-hover)] border-b border-[var(--color-bordure)] text-left"
                        >
                            {values.length === options.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                        </button>
                    )}
                    {options.map((opt) => {
                        const isSelected = values.includes(opt.value);
                        return (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => toggle(opt.value)}
                                className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-[var(--color-surface-hover)] transition-colors ${isSelected ? 'bg-[var(--color-dominant-50)]' : ''}`}
                            >
                                <input
                                    type="checkbox"
                                    checked={isSelected}
                                    readOnly
                                    className="rounded border-[var(--color-bordure)] pointer-events-none"
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="truncate text-[var(--color-texte)]">{opt.label}</div>
                                    {opt.description && (
                                        <div className="truncate text-[10px] text-[var(--color-texte-muted)]">{opt.description}</div>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                    {options.length === 0 && (
                        <div className="px-3 py-2 text-sm text-[var(--color-texte-muted)] italic">Aucune option disponible</div>
                    )}
                </div>
            )}
        </div>
    );
}

// =============================================
// FORM TEXTAREA
// =============================================

interface FormTextareaProps extends BaseFieldProps {
    value: string;
    onChange: (value: string) => void;
    rows?: number;
    placeholder?: string;
    disabled?: boolean;
    /** Mode monospace (pour IDs, JSON, etc.) */
    mono?: boolean;
}

export function FormTextarea({
    label,
    value,
    onChange,
    rows = 3,
    placeholder,
    required,
    disabled,
    mono,
    className,
}: FormTextareaProps) {
    return (
        <div className={className}>
            <label className="block text-xs font-medium text-[var(--color-texte-muted)] mb-1">
                {label}{required && ' *'}
            </label>
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                rows={rows}
                disabled={disabled}
                placeholder={placeholder}
                required={required}
                className={`w-full rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface-hover)] px-3 py-2 text-sm text-[var(--color-texte)] placeholder:text-[var(--color-texte-muted)] focus:border-[var(--color-dominant-600)] focus:outline-none focus:ring-1 focus:ring-[var(--color-dominant-600)] disabled:opacity-50 disabled:cursor-not-allowed ${mono ? 'font-mono' : ''}`}
            />
        </div>
    );
}
