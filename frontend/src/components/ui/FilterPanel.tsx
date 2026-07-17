import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
    SlidersHorizontal, Calendar,
    ChevronDown, RotateCcw,
} from 'lucide-react';

export interface FilterDef {
    key: string;
    label: string;
    type?: 'select' | 'date' | 'date-range' | 'text' | 'number';
    options?: { value: string; label: string }[];
    placeholder?: string;
    allOptionLabel?: string;
}

export interface FilterPanelProps {
    /** Whether the panel is expanded */
    open: boolean;
    /** Toggle callback (required when showToggle is true) */
    onOpenChange?: (open: boolean) => void;
    /** Filter definitions */
    filters: FilterDef[];
    /** Current filter values */
    values: Record<string, string>;
    /** Filter change callback */
    onChange: (key: string, value: string) => void;
    /** Clear all filters */
    onClear: () => void;
    /** Number of active filters (for badge) */
    activeCount: number;
    /** Show the toggle button row (default: true). Set to false to embed panel in parent toolbar */
    showToggle?: boolean;
    /** Custom toggle button (replaces default when showToggle is true) */
    toggleButton?: React.ReactNode;
    /** Custom actions rendered next to the toggle button */
    children?: React.ReactNode;
    className?: string;
}

function SelectFilter({
    def, value, onChange,
}: {
    def: FilterDef;
    value: string;
    onChange: (v: string) => void;
}) {
    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-[var(--radius-md)] border border-[var(--color-bordure)] bg-[var(--color-surface)] px-[clamp(0.5rem,0.4rem+0.3vw,0.75rem)] py-[clamp(0.375rem,0.3rem+0.2vw,0.5rem)] text-sm text-[var(--color-text-secondary)] focus:border-[var(--color-dominant-500)] focus:outline-none focus:ring-2 focus:ring-[var(--color-dominant-500)]/20 transition-shadow"
            style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}
            aria-label={def.label}
        >
            <option value="">{def.allOptionLabel ?? `Tous`}</option>
            {def.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
    );
}

function DateFilter({
    def, value, onChange,
}: {
    def: FilterDef;
    value: string;
    onChange: (v: string) => void;
}) {
    return (
        <div className="relative">
            <Calendar className="absolute left-[clamp(0.5rem,0.4rem+0.2vw,0.625rem)] top-1/2 h-[var(--icon-sm)] w-[var(--icon-sm)] -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
            <input
                type="date"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full rounded-[var(--radius-md)] border border-[var(--color-bordure)] bg-[var(--color-surface)] pl-[clamp(1.75rem,1.5rem+0.5vw,2rem)] pr-2 py-[clamp(0.375rem,0.3rem+0.2vw,0.5rem)] text-sm text-[var(--color-text-secondary)] focus:border-[var(--color-dominant-500)] focus:outline-none focus:ring-2 focus:ring-[var(--color-dominant-500)]/20 transition-shadow"
                style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}
                aria-label={def.label}
            />
        </div>
    );
}

function DateRangeFilter({
    def, value, onChange,
}: {
    def: FilterDef;
    value: string;
    onChange: (v: string) => void;
}) {
    const fromValue = value || '';
    const toValue = value || '';

    const [localFrom, setLocalFrom] = useState(fromValue);
    const [localTo, setLocalTo] = useState(toValue);

    const fromDebounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const toDebounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    useEffect(() => {
        setLocalFrom(fromValue);
    }, [fromValue]);

    useEffect(() => {
        setLocalTo(toValue);
    }, [toValue]);

    const handleFrom = useCallback((v: string) => {
        setLocalFrom(v);
        clearTimeout(fromDebounce.current);
        fromDebounce.current = setTimeout(() => onChange(v), 300);
    }, [onChange]);

    const handleTo = useCallback((v: string) => {
        setLocalTo(v);
        clearTimeout(toDebounce.current);
        toDebounce.current = setTimeout(() => onChange(v), 300);
    }, [onChange]);

    useEffect(() => {
        return () => {
            clearTimeout(fromDebounce.current);
            clearTimeout(toDebounce.current);
        };
    }, []);

    return (
        <div className="flex items-center gap-2">
            <div className="relative flex-1">
                <Calendar className="absolute left-[clamp(0.5rem,0.4rem+0.2vw,0.625rem)] top-1/2 h-[var(--icon-sm)] w-[var(--icon-sm)] -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
                <input
                    type="date"
                    value={localFrom}
                    onChange={(e) => handleFrom(e.target.value)}
                    className="w-full rounded-[var(--radius-md)] border border-[var(--color-bordure)] bg-[var(--color-surface)] pl-[clamp(1.75rem,1.5rem+0.5vw,2rem)] pr-2 py-[clamp(0.375rem,0.3rem+0.2vw,0.5rem)] text-sm text-[var(--color-text-secondary)] focus:border-[var(--color-dominant-500)] focus:outline-none focus:ring-2 focus:ring-[var(--color-dominant-500)]/20 transition-shadow"
                    style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}
                    aria-label={`${def.label} début`}
                />
            </div>
            <span className="text-xs text-[var(--color-text-muted)] flex-shrink-0">—</span>
            <div className="relative flex-1">
                <Calendar className="absolute left-[clamp(0.5rem,0.4rem+0.2vw,0.625rem)] top-1/2 h-[var(--icon-sm)] w-[var(--icon-sm)] -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
                <input
                    type="date"
                    value={localTo}
                    onChange={(e) => handleTo(e.target.value)}
                    className="w-full rounded-[var(--radius-md)] border border-[var(--color-bordure)] bg-[var(--color-surface)] pl-[clamp(1.75rem,1.5rem+0.5vw,2rem)] pr-2 py-[clamp(0.375rem,0.3rem+0.2vw,0.5rem)] text-sm text-[var(--color-text-secondary)] focus:border-[var(--color-dominant-500)] focus:outline-none focus:ring-2 focus:ring-[var(--color-dominant-500)]/20 transition-shadow"
                    style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}
                    aria-label={`${def.label} fin`}
                />
            </div>
        </div>
    );
}

function TextFilter({
    def, value, onChange,
}: {
    def: FilterDef;
    value: string;
    onChange: (v: string) => void;
}) {
    const [localVal, setLocalVal] = useState(value);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    useEffect(() => { setLocalVal(value); }, [value]);

    const handleChange = useCallback((v: string) => {
        setLocalVal(v);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => onChange(v), 300);
    }, [onChange]);

    useEffect(() => {
        return () => clearTimeout(debounceRef.current);
    }, []);

    return (
        <input
            type={def.type === 'number' ? 'number' : 'text'}
            value={localVal}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={def.placeholder ?? def.label}
            className="w-full rounded-[var(--radius-md)] border border-[var(--color-bordure)] bg-[var(--color-surface)] px-[clamp(0.5rem,0.4rem+0.3vw,0.75rem)] py-[clamp(0.375rem,0.3rem+0.2vw,0.5rem)] text-sm text-[var(--color-text-secondary)] focus:border-[var(--color-dominant-500)] focus:outline-none focus:ring-2 focus:ring-[var(--color-dominant-500)]/20 transition-shadow"
            style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}
            aria-label={def.label}
        />
    );
}

function FiltreRow({ def, value, onChange }: {
    def: FilterDef;
    value: string;
    onChange: (key: string, v: string) => void;
}) {
    const handleChange = useCallback((v: string) => onChange(def.key, v), [def.key, onChange]);

    if (def.type === 'date-range') {
        return <DateRangeFilter def={def} value={value} onChange={handleChange} />;
    }
    if (def.type === 'date') {
        return <DateFilter def={def} value={value} onChange={handleChange} />;
    }
    if (def.type === 'select' || def.options) {
        return <SelectFilter def={def} value={value} onChange={handleChange} />;
    }
    return <TextFilter def={def} value={value} onChange={handleChange} />;
}

export function FilterPanel({
    open, onOpenChange,
    filters, values, onChange, onClear,
    activeCount, showToggle = true,
    toggleButton, children,
    className = '',
}: FilterPanelProps) {
    const { t } = useTranslation();

    const hasActive = activeCount > 0;

    const colsClass = filters.some(f => f.type === 'date-range')
        ? 'grid-cols-1'
        : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

    return (
        <div className={`${showToggle ? 'border-b border-[var(--color-bordure)]' : ''} ${className}`}>
            {showToggle && (
                <div className="flex items-center gap-[var(--gap-sm)]" style={{ padding: 'var(--padding-toolbar)' }}>
                    {toggleButton ?? (
                        <button
                            type="button"
                            onClick={() => onOpenChange?.(!open)}
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-all duration-150 ${
                                hasActive
                                    ? 'border-[var(--color-dominant-500)]/30 bg-[var(--color-dominant-50)] dark:bg-[var(--color-dominant-900)]/20 text-[var(--color-dominant-600)] dark:text-[var(--color-dominant-400)]'
                                    : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)]'
                            }`}
                            title={t('boutons.filtrer')}
                        >
                            <SlidersHorizontal className="h-4 w-4" />
                            <span className="hidden sm:inline text-xs font-medium">{t('boutons.filtrer')}</span>
                            {hasActive && (
                                <span className="inline-flex items-center justify-center h-[18px] min-w-[18px] rounded-full bg-[var(--color-dominant-500)] text-[10px] font-bold text-white leading-none px-1">
                                    {activeCount}
                                </span>
                            )}
                            <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
                        </button>
                    )}

                    {children}

                    {hasActive && (
                        <button
                            type="button"
                            onClick={onClear}
                            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors ml-auto"
                            title={t('effacerFiltres')}
                        >
                            <RotateCcw className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">{t('effacerFiltres')}</span>
                        </button>
                    )}
                </div>
            )}

            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        key="filter-panel"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className={`grid ${colsClass} gap-[var(--gap-sm)]`} style={{ padding: '0 var(--padding-toolbar) var(--padding-toolbar)' }}>
                            {filters.map((def) => (
                                <div key={def.key} className="space-y-1">
                                    <label className="block text-[11px] font-medium text-[var(--color-text-muted)] tracking-wide uppercase">
                                        {def.label}
                                    </label>
                                    <FiltreRow
                                        def={def}
                                        value={values[def.key] ?? ''}
                                        onChange={onChange}
                                    />
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
