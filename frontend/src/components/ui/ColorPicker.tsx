/**
 * ==================================
 * eLISAschool - ColorPicker v3.0
 * ==================================
 * Sélecteur de couleur professionnel — palette étendue, performance 60fps.
 *
 * Architecture :
 * - 54 couleurs organisées en 12 familles chromatiques
 * - Mode compact (12 couleurs) + extensible (toutes)
 * - Saisie HEX manuelle avec validation instantanée
 * - Swatches en React.memo (pas de re-render des non-sélectionnés)
 * - Transitions ciblées (pas transition-all → pas de layout thrash)
 * - 100% inline : pas de dialogue OS, pas de z-index, pas de focus trap
 *
 * Meilleures pratiques :
 * - JAMAIS d'<input type="color"> dans un CustomModal
 * - React.memo sur chaque swatch → O(1) re-render par sélection
 * - will-change: transform sur hover (GPU compositing)
 * - Pas d'useEffect pour la sync hex → dérivation directe
 *
 * Version: 3.0.0
 * Auteur: franck arlos chendjou
 */

import { useState, useCallback, useMemo, memo } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/cn';

/* ─── Palette complète : 54 couleurs (12 familles) ─── */

const FAMILLES_COULEURS: { nom: string; couleurs: string[] }[] = [
    { nom: 'Rouges',    couleurs: ['#B71C1C', '#E53935', '#EF5350', '#E57373', '#FFCDD2'] },
    { nom: 'Rosés',     couleurs: ['#C2185B', '#E91E63', '#F06292', '#F8BBD0'] },
    { nom: 'Oranges',   couleurs: ['#E65100', '#FB8C00', '#FF9800', '#FFB74D', '#FFE0B2'] },
    { nom: 'Jaunes',    couleurs: ['#F57F17', '#FBC02D', '#FFEB3B', '#FFF9C4'] },
    { nom: 'Verts',     couleurs: ['#1B5E20', '#43A047', '#66BB6A', '#81C784', '#C8E6C9'] },
    { nom: 'Turquoises', couleurs: ['#00695C', '#00897B', '#26A69A', '#80CBC4'] },
    { nom: 'Bleus',     couleurs: ['#0D47A1', '#1E88E5', '#42A5F5', '#64B5F6', '#BBDEFB'] },
    { nom: 'Indigo',    couleurs: ['#1A237E', '#3949AB', '#5C6BC0', '#9FA8DA'] },
    { nom: 'Violets',   couleurs: ['#4A148C', '#8E24AA', '#AB47BC', '#CE93D8', '#E1BEE7'] },
    { nom: 'Marron',    couleurs: ['#3E2723', '#6D4C41', '#8D6E63', '#BCAAA4'] },
    { nom: 'Neutres',   couleurs: ['#212121', '#424242', '#757575', '#9E9E9E', '#E0E0E0', '#F5F5F5'] },
];

/** Palette plate (toutes les couleurs) */
const PALETTE_COMPLETE: string[] = FAMILLES_COULEURS.flatMap(f => f.couleurs);

/** 12 couleurs les plus utiles pour le mode compact */
const PALETTE_COMPACT: string[] = [
    '#E53935', '#E91E63', '#FB8C00', '#FBC02D',
    '#43A047', '#26A69A', '#1E88E5', '#5C6BC0',
    '#8E24AA', '#6D4C41', '#424242', '#9E9E9E',
];

/* ─── Helpers ─── */

function isValidHex(color: string): boolean {
    return /^#[0-9A-Fa-f]{6}$/.test(color);
}

function normalizeHex(color: string): string {
    let hex = color.trim().replace(/^#/, '');
    if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    if (hex.length !== 6 || !/^[0-9A-Fa-f]{6}$/.test(hex)) return color.trim();
    return '#' + hex.toUpperCase();
}

/** Luminance relative WCAG */
function luminance(hex: string): number {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return 0.299 * r + 0.587 * g + 0.114 * b;
}

/* ─── Swatch bouton (memo-ized pour perf) ─── */

interface SwatchProps {
    color: string;
    isSelected: boolean;
    onSelect: (color: string) => void;
    disabled: boolean;
    size: 'sm' | 'md';
}

const Swatch = memo(function Swatch({ color, isSelected, onSelect, disabled, size }: SwatchProps) {
    const light = luminance(color) > 0.6;
    const dim = size === 'sm'
        ? 'clamp(1.375rem, 1.2rem + 0.4vw, 1.625rem)'
        : 'clamp(1.5rem, 1.3rem + 0.5vw, 1.75rem)';

    return (
        <button
            type="button"
            onClick={() => !disabled && onSelect(color)}
            disabled={disabled}
            className={cn(
                'rounded-md border shrink-0',
                'transition-transform duration-100 will-change-transform',
                'hover:scale-110 hover:z-10 active:scale-95',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-dominant-600)]/50',
                'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100',
                isSelected
                    ? 'border-[var(--color-dominant-600)] ring-2 ring-[var(--color-dominant-600)]/30 scale-110 z-10'
                    : 'border-[var(--color-bordure)] hover:border-[var(--color-text-muted)]',
            )}
            style={{ width: dim, height: dim, backgroundColor: color }}
            aria-label={color}
            aria-checked={isSelected}
            role="radio"
            title={color}
        >
            {isSelected && (
                <svg viewBox="0 0 12 12" className="w-full h-full p-[2px]" fill="none"
                    stroke={light ? '#333' : '#fff'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="2,6 5,9 10,3" />
                </svg>
            )}
        </button>
    );
}, (prev, next) => (
    prev.color === next.color
    && prev.isSelected === next.isSelected
    && prev.disabled === next.disabled
    && prev.size === next.size
    && prev.onSelect === next.onSelect
));

/* ─── Composant principal ─── */

interface ColorPickerProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    hint?: string;
    disabled?: boolean;
    sourceLabel?: string;
    showHexInput?: boolean;
    /** Couleurs compactes (défaut: 12 les plus utiles) */
    compactColors?: string[];
    /** @deprecated Utiliser compactColors. Palette personnalisée (remplace tout). */
    presetColors?: string[];
    /** Afficher toutes les couleurs par défaut (défaut: false) */
    defaultExpanded?: boolean;
    className?: string;
    /** Placeholder du champ HEX quand value est vide (ex: "Auto") */
    placeholder?: string;
    /** Couleur héritée affichée en aperçu quand value est vide (non sélectionnable, indicateur visuel) */
    inheritedPreview?: { color: string; label: string };
}

export function ColorPicker({
    label,
    value,
    onChange,
    error,
    hint,
    disabled = false,
    sourceLabel,
    showHexInput = true,
    compactColors = PALETTE_COMPACT,
    presetColors,
    defaultExpanded = false,
    className,
    placeholder,
    inheritedPreview,
}: ColorPickerProps) {
    // Rétro-compatibilité : presetColors remplace tout
    const couleursCompact = presetColors ?? compactColors;
    const couleursCompletes = presetColors ?? PALETTE_COMPLETE;
    const [hexInput, setHexInput] = useState(() => value.toUpperCase());
    const [isFocused, setIsFocused] = useState(false);
    const [expanded, setExpanded] = useState(defaultExpanded);

    const isValid = isValidHex(value);
    const upperValue = value.toUpperCase();
    const estVide = !value || value.trim() === '';
    const showInherited = estVide && !!inheritedPreview;

    // Sync hex input uniquement quand le focus n'est pas dedans
    const displayHex = isFocused ? hexInput : upperValue;

    /** Sélection instantanée depuis la palette */
    const handleSelect = useCallback(
        (color: string) => {
            const normalized = normalizeHex(color);
            setHexInput(normalized);
            onChange(normalized);
        },
        [onChange],
    );

    /** Saisie HEX manuelle */
    const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const raw = e.target.value;
            setHexInput(raw);
            const normalized = normalizeHex(raw);
            if (isValidHex(normalized)) onChange(normalized);
        },
        [onChange],
    );

    /** Blur → normaliser ou restaurer */
    const handleBlur = useCallback(() => {
        setIsFocused(false);
        const normalized = normalizeHex(hexInput);
        if (isValidHex(normalized)) {
            setHexInput(normalized);
            onChange(normalized);
        } else {
            setHexInput(upperValue);
        }
    }, [hexInput, upperValue, onChange]);

    /** Toggle expansion */
    const toggleExpanded = useCallback(() => setExpanded(p => !p), []);

    /** Couleurs affichées */
    const couleursAffichees = expanded ? couleursCompletes : couleursCompact;

    return (
        <div className={cn('flex flex-col gap-[var(--gap-xs)] w-full', className)}>
            {/* Label + source */}
            <div className="flex items-baseline gap-[var(--gap-xs)]">
                <label
                    className="font-medium text-[var(--color-text-primary)]"
                    style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)' }}
                >
                    {label}
                </label>
                {sourceLabel && (
                    <span
                        className="text-[var(--color-text-muted)] italic"
                        style={{ fontSize: 'clamp(0.6875rem, 0.6rem + 0.2vw, 0.8125rem)' }}
                    >
                        {sourceLabel}
                    </span>
                )}
            </div>

            {/* Aperçu + hex input */}
            <div className="flex items-center gap-[var(--gap-sm)]">
                {/* Aperçu couleur */}
                <div
                    className={cn(
                        'shrink-0 rounded-lg border-2',
                        showInherited ? 'border-dashed border-[var(--color-text-muted)]' :
                        isValid ? 'border-[var(--color-bordure)]' : 'border-[var(--color-danger)]',
                        disabled && 'opacity-50',
                    )}
                    style={{
                        width: 'clamp(2.25rem, 2rem + 1vw, 2.75rem)',
                        height: 'clamp(2.25rem, 2rem + 1vw, 2.75rem)',
                        backgroundColor: showInherited ? inheritedPreview!.color : (isValid ? value : undefined),
                    }}
                    role="img"
                    aria-label={showInherited ? `Couleur héritée: ${inheritedPreview!.color}` : `Couleur: ${isValid ? value : 'invalide'}`}
                />

                {/* Hex input */}
                {showHexInput && (
                    <input
                        type="text"
                        value={displayHex}
                        onChange={handleInputChange}
                        onFocus={() => setIsFocused(true)}
                        onBlur={handleBlur}
                        disabled={disabled}
                        placeholder={placeholder || "#RRGGBB"}
                        maxLength={7}
                        className={cn(
                            'flex-1 min-w-0 rounded-lg border font-mono uppercase tracking-wider',
                            'bg-[var(--color-surface)] text-[var(--color-text-primary)]',
                            'placeholder:text-[var(--color-text-muted)]',
                            'focus:outline-none focus:ring-2',
                            'h-[clamp(2rem,1.75rem+0.5vw,2.5rem)] px-3',
                            error || (!isValid && displayHex.length > 0)
                                ? 'border-[var(--color-danger)] focus:ring-[var(--color-danger)]/20'
                                : 'border-[var(--color-bordure)] focus:border-[var(--color-dominant-600)] focus:ring-[var(--color-dominant-600)]/20',
                            disabled && 'cursor-not-allowed opacity-50',
                        )}
                        style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}
                        aria-label={`${label} — code couleur HEX`}
                        spellCheck={false}
                        autoComplete="off"
                    />
                )}
            </div>

            {/* Palette swatches */}
            <div
                className="flex flex-wrap gap-[3px]"
                role="radiogroup"
                aria-label={`${label} — palette`}
            >
                {/* Swatch héritée (non sélectionnable, indicateur visuel) */}
                {showInherited && (
                    <div
                        className="relative rounded-md border-2 border-dashed border-[var(--color-text-muted)] shrink-0 flex items-center justify-center"
                        style={{
                            width: expanded ? 'clamp(1.375rem, 1.2rem + 0.4vw, 1.625rem)' : 'clamp(1.5rem, 1.3rem + 0.5vw, 1.75rem)',
                            height: expanded ? 'clamp(1.375rem, 1.2rem + 0.4vw, 1.625rem)' : 'clamp(1.5rem, 1.3rem + 0.5vw, 1.75rem)',
                            backgroundColor: inheritedPreview!.color,
                        }}
                        title={inheritedPreview!.label}
                        aria-label={inheritedPreview!.label}
                    >
                        <span
                            className="font-semibold rounded-sm bg-[var(--color-surface)]/80 px-0.5"
                            style={{
                                fontSize: 'clamp(0.5rem, 0.4rem + 0.15vw, 0.5625rem)',
                                color: 'var(--color-text-secondary)',
                            }}
                        >
                            A
                        </span>
                    </div>
                )}
                {couleursAffichees.map((color) => (
                    <Swatch
                        key={color}
                        color={color}
                        isSelected={isValid && upperValue === color.toUpperCase()}
                        onSelect={handleSelect}
                        disabled={disabled}
                        size={expanded ? 'sm' : 'md'}
                    />
                ))}
            </div>

            {/* Toggle expand/collapse (masqué si palette custom) */}
            {!presetColors && (
                <button
                    type="button"
                    onClick={toggleExpanded}
                    disabled={disabled}
                    className={cn(
                        'inline-flex items-center gap-1 self-start rounded-md px-2 py-0.5',
                        'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]',
                        'hover:bg-[var(--color-surface-hover)] transition-colors',
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-dominant-600)]/40',
                        'disabled:opacity-50',
                    )}
                    style={{ fontSize: 'clamp(0.6875rem, 0.6rem + 0.2vw, 0.8125rem)' }}
                    aria-expanded={expanded}
                >
                    {expanded ? (
                        <>
                            <ChevronUp className="h-3 w-3" />
                            <span>Réduire</span>
                        </>
                    ) : (
                        <>
                            <ChevronDown className="h-3 w-3" />
                            <span>Plus de couleurs ({couleursCompletes.length})</span>
                        </>
                    )}
                </button>
            )}

            {/* Familles (visibles seulement en mode étendu avec palette par défaut) */}
            {expanded && !presetColors && (
                <div
                    className="flex flex-col gap-[var(--gap-xxs)]"
                    style={{ fontSize: 'clamp(0.625rem, 0.55rem + 0.15vw, 0.75rem)' }}
                >
                    {FAMILLES_COULEURS.map((famille) => (
                        <div key={famille.nom} className="flex items-center gap-[var(--gap-xxs)]">
                            <span
                                className="text-[var(--color-text-muted)] w-[clamp(3.5rem,3rem+1vw,4.5rem)] shrink-0"
                            >
                                {famille.nom}
                            </span>
                            <div className="flex gap-[2px]">
                                {famille.couleurs.map((c) => (
                                    <div
                                        key={c}
                                        className="h-2.5 w-2.5 rounded-sm border border-[var(--color-bordure)]"
                                        style={{ backgroundColor: c }}
                                        title={c}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Erreur */}
            {error && (
                <p className="text-[var(--color-danger)]" style={{ fontSize: 'clamp(0.6875rem, 0.6rem + 0.2vw, 0.8125rem)' }} role="alert">
                    {error}
                </p>
            )}

            {/* Hint */}
            {hint && !error && (
                <p className="text-[var(--color-text-muted)]" style={{ fontSize: 'clamp(0.6875rem, 0.6rem + 0.2vw, 0.8125rem)' }}>
                    {hint}
                </p>
            )}
        </div>
    );
}
