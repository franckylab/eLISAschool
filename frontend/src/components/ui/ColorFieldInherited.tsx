/**
 * ==================================
 * eLISAschool - ColorFieldInherited
 * ==================================
 * Wrapper de ColorPicker avec gestion de couleur héritée.
 *
 * Cas d'usage : créneau d'emploi du temps — la couleur par défaut
 * vient de la matière. L'utilisateur peut la personnaliser, puis
 * réinitialiser pour revenir à l'héritage.
 *
 * UX :
 * - value vide → placeholder "Auto" + aperçu couleur héritée (pointillés)
 * - value définie → ColorPicker normal + bouton ↩ reset
 *
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { RotateCcw } from 'lucide-react';
import { ColorPicker } from './ColorPicker';
import { cn } from '@/lib/cn';

interface ColorFieldInheritedProps {
    /** Couleur custom du créneau (vide = héritée) */
    value: string;
    /** Callback quand la couleur change */
    onChange: (value: string) => void;
    /** Couleur de la matière (utilisée quand value est vide) */
    inheritedColor?: string;
    /** Label descriptif de la source héritée (ex: "de la matière") */
    inheritedLabel?: string;
    /** Label du champ (ex: "Couleur") */
    label: string;
    /** Placeholder du champ HEX (défaut: "Auto") */
    placeholder?: string;
    /** Label du bouton reset (défaut: "Réinitialiser") */
    resetLabel?: string;
    /** Hint affiché sous le ColorPicker */
    hint?: string;
    /** Désactiver le champ */
    disabled?: boolean;
    /** Classe CSS supplémentaire */
    className?: string;
}

export function ColorFieldInherited({
    value,
    onChange,
    inheritedColor,
    inheritedLabel,
    label,
    placeholder = 'Auto',
    resetLabel = 'Réinitialiser',
    hint,
    disabled = false,
    className,
}: ColorFieldInheritedProps) {
    const estCustomise = !!value && value.trim() !== '';
    const hasInherited = !!inheritedColor;

    /** Réinitialiser → effacer la couleur custom */
    const handleReset = () => {
        onChange('');
    };

    return (
        <div className={cn('flex flex-col gap-[var(--gap-xs)]', className)}>
            <div className="flex items-start gap-[var(--gap-sm)]">
                {/* ColorPicker avec mode hérité */}
                <div className="flex-1 min-w-0">
                    <ColorPicker
                        label={label}
                        value={value}
                        onChange={onChange}
                        disabled={disabled}
                        placeholder={placeholder}
                        inheritedPreview={hasInherited ? { color: inheritedColor, label: inheritedLabel || 'Héritée' } : undefined}
                        sourceLabel={!estCustomise && hasInherited ? inheritedLabel : undefined}
                        hint={hint}
                    />
                </div>

                {/* Bouton reset (visible uniquement si customisé) */}
                {estCustomise && !disabled && (
                    <button
                        type="button"
                        onClick={handleReset}
                        className={cn(
                            'shrink-0 mt-1 inline-flex items-center gap-1 rounded-md border px-2 py-1.5',
                            'border-[var(--color-bordure)] bg-[var(--color-surface)]',
                            'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]',
                            'hover:bg-[var(--color-surface-hover)] hover:border-[var(--color-text-muted)]',
                            'transition-colors',
                            'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-dominant-600)]/40',
                        )}
                        style={{ fontSize: 'clamp(0.6875rem, 0.6rem + 0.2vw, 0.8125rem)' }}
                        title={resetLabel}
                        aria-label={resetLabel}
                    >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">{resetLabel}</span>
                    </button>
                )}
            </div>
        </div>
    );
}
