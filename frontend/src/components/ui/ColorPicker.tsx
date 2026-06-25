/**
 * ==================================
 * eLISAschool - ColorPicker
 * ==================================
 * Sélecteur de couleur avec aperçu visuel, validation et formatage HEX
 * Meilleures pratiques :
 * - Input natif type="color" caché pour l'accessibilité
 * - Aperçu visuel cliquable avec bordure et ombre
 * - Affichage de la valeur HEX en format monospace
 * - Validation du format HEX (#RRGGBB)
 * - Support complet du mode sombre/clair
 * - Ultra-responsif avec clamp()
 */

import { useState, useCallback } from 'react';
import { cn } from '@/lib/cn';

interface ColorPickerProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    hint?: string;
    disabled?: boolean;
    presetColors?: string[];
}

/**
 * Valide si une couleur est au format HEX valide
 */
function isValidHex(color: string): boolean {
    return /^#[0-9A-Fa-f]{6}$/.test(color);
}

/**
 * Normalise une couleur HEX (ajoute # si manquant, majuscules)
 */
function normalizeHex(color: string): string {
    let normalized = color.trim();
    if (!normalized.startsWith('#')) {
        normalized = '#' + normalized;
    }
    return normalized.toUpperCase();
}

export function ColorPicker({
    label,
    value,
    onChange,
    error,
    hint,
    disabled = false,
    presetColors = [
        '#28a745', // Vert (défaut eLISAschool)
        '#007bff', // Bleu
        '#dc3545', // Rouge
        '#ffc107', // Jaune/Orange
        '#6f42c1', // Violet
        '#fd7e14', // Orange
        '#20c997', // Turquoise
        '#6c757d', // Gris
    ],
}: ColorPickerProps) {
    const [inputValue, setInputValue] = useState(value);

    /**
     * Gère le changement via le sélecteur natif
     */
    const handleColorChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const newValue = e.target.value.toUpperCase();
            setInputValue(newValue);
            onChange(newValue);
        },
        [onChange]
    );

    /**
     * Gère la saisie manuelle du code HEX
     */
    const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const rawValue = e.target.value;
            setInputValue(rawValue);

            // Si le format est valide, mettre à jour la valeur
            const normalized = normalizeHex(rawValue);
            if (isValidHex(normalized)) {
                onChange(normalized);
            }
        },
        [onChange]
    );

    /**
     * Gère la sélection d'une couleur prédéfinie
     */
    const handlePresetClick = useCallback(
        (color: string) => {
            const normalized = normalizeHex(color);
            setInputValue(normalized);
            onChange(normalized);
        },
        [onChange]
    );

    /**
     * Gère le blur pour normaliser la valeur
     */
    const handleBlur = useCallback(() => {
        const normalized = normalizeHex(inputValue);
        if (isValidHex(normalized)) {
            setInputValue(normalized);
            onChange(normalized);
        } else {
            // Si invalide, restaurer la dernière valeur valide
            setInputValue(value);
        }
    }, [inputValue, value, onChange]);

    const isValid = isValidHex(value);

    return (
        <div className="flex flex-col gap-2 w-full">
            {/* Label */}
            <label className="text-sm font-medium text-[var(--color-texte)]">
                {label}
            </label>

            {/* Sélecteur de couleur */}
            <div className="flex items-center gap-3">
                {/* Input color natif (caché visuellement mais accessible) */}
                <div className="relative">
                    <input
                        type="color"
                        value={isValid ? value : '#28a745'}
                        onChange={handleColorChange}
                        disabled={disabled}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                        aria-label={`${label} - Sélecteur de couleur`}
                    />
                    {/* Aperçu visuel */}
                    <div
                        className={cn(
                            'w-12 h-12 rounded-lg border-2 transition-all',
                            isValid
                                ? 'border-[var(--color-bordure)] shadow-sm hover:shadow-md'
                                : 'border-[var(--color-error)]',
                            disabled && 'opacity-50 cursor-not-allowed'
                        )}
                        style={{ backgroundColor: isValid ? value : '#28a745' }}
                        role="img"
                        aria-label={`Couleur sélectionnée: ${value}`}
                    />
                </div>

                {/* Input texte pour saisie manuelle */}
                <div className="flex-1">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        disabled={disabled}
                        placeholder="#RRGGBB"
                        className={cn(
                            'w-full h-10 px-3 rounded-lg border text-sm font-mono uppercase',
                            'bg-[var(--color-surface)] text-[var(--color-texte)]',
                            'transition-colors placeholder:text-[var(--color-texte-secondaire)]/60',
                            'focus:outline-none focus:ring-2',
                            error || !isValid
                                ? 'border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-[var(--color-error)]/20'
                                : 'border-[var(--color-bordure)] focus:border-[var(--color-dominante)] focus:ring-[var(--color-dominante)]/20',
                            disabled && 'cursor-not-allowed opacity-50'
                        )}
                        aria-label={`${label} - Code couleur HEX`}
                    />
                </div>
            </div>

            {/* Couleurs prédéfinies */}
            <div className="flex flex-wrap gap-2 mt-1">
                {presetColors.map((color) => {
                    const normalized = normalizeHex(color);
                    const isSelected = value === normalized;
                    return (
                        <button
                            key={color}
                            type="button"
                            onClick={() => handlePresetClick(color)}
                            disabled={disabled}
                            className={cn(
                                'w-8 h-8 rounded-lg border-2 transition-all',
                                'hover:scale-110 hover:shadow-md',
                                'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100',
                                isSelected
                                    ? 'border-[var(--color-dominante)] ring-2 ring-[var(--color-dominante)]/30 shadow-md scale-110'
                                    : 'border-[var(--color-bordure)]'
                            )}
                            style={{ backgroundColor: color }}
                            aria-label={`Sélectionner couleur ${color}`}
                            aria-pressed={isSelected}
                        />
                    );
                })}
            </div>

            {/* Message d'erreur */}
            {error && (
                <p className="text-xs text-[var(--color-error)]" role="alert">
                    {error}
                </p>
            )}

            {/* Indice */}
            {hint && !error && (
                <p className="text-xs text-[var(--color-texte-secondaire)]">
                    {hint}
                </p>
            )}
        </div>
    );
}
