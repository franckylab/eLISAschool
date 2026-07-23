import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X } from 'lucide-react';

interface SearchInputProps {
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    onClear?: () => void;
    debounceMs?: number;
    icon?: boolean;
    className?: string;
    autoFocus?: boolean;
    ariaLabel?: string;
}

export function SearchInput({
    value: externalValue,
    onChange,
    placeholder,
    debounceMs = 0,
    icon = true,
    className = '',
    autoFocus,
    ariaLabel,
}: SearchInputProps) {
    const { t } = useTranslation('common');
    const effectivePlaceholder = placeholder ?? t('a11y.rechercher');
    const isControlled = externalValue !== undefined;
    const [internalValue, setInternalValue] = useState('');
    const value = isControlled ? externalValue : internalValue;
    const onChangeRef = useRef(onChange);

    useEffect(() => {
        onChangeRef.current = onChange;
    });

    const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const next = e.target.value;
        if (!isControlled) setInternalValue(next);
        if (debounceMs > 0) {
            clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => {
                onChangeRef.current?.(next);
            }, debounceMs);
        } else {
            onChangeRef.current?.(next);
        }
    }, [isControlled, debounceMs]);

    useEffect(() => {
        return () => clearTimeout(debounceRef.current);
    }, []);

    const handleClear = useCallback(() => {
        if (!isControlled) setInternalValue('');
        onChangeRef.current?.('');
    }, [isControlled]);

    return (
        <div className={`relative flex-1 ${className}`} style={{ minWidth: 'clamp(120px, 30vw, 384px)', maxWidth: 'clamp(200px, 40vw, 512px)' }}>
            {icon && (
                <Search className="absolute left-[clamp(0.5rem,0.4rem+0.2vw,0.625rem)] top-1/2 h-[var(--icon-sm)] w-[var(--icon-sm)] -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
            )}
            <input
                type="text"
                value={value}
                onChange={handleChange}
                onKeyDown={(e) => {
                    if (e.key === 'Escape') handleClear();
                }}
                placeholder={effectivePlaceholder}
                autoFocus={autoFocus}
                aria-label={ariaLabel || effectivePlaceholder}
                className="w-full rounded-[var(--radius-md)] border border-[var(--color-bordure)] bg-[var(--color-surface)] py-[clamp(0.375rem,0.3rem+0.2vw,0.5rem)] pl-9 pr-[clamp(1.5rem,1.2rem+0.5vw,2rem)] text-sm focus:border-[var(--color-dominant-500)] focus:outline-none focus:ring-2 focus:ring-[var(--color-dominant-500)]/20 dark:bg-[var(--color-surface)] dark:border-[var(--color-bordure)]"
                style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}
            />
            {value && (
                <button
                    type="button"
                    onClick={handleClear}
                    className="absolute right-[clamp(0.5rem,0.4rem+0.2vw,0.625rem)] top-1/2 -translate-y-1/2 rounded-full p-0.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
                    aria-label={t('a11y.effacerRecherche')}
                >
                    <X className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />
                </button>
            )}
        </div>
    );
}
