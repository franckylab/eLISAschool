/**
 * ==================================
 * eLISAschool - ParameterField
 * ==================================
 * Composant de rendu adaptatif pour les paramètres système.
 * Choisit automatiquement le contrôle UI optimal selon typeValeur
 * et les options disponibles dans le paramètre.
 *
 * Mapping :
 *   BOOLEAN         → Toggle (ElisaToggle)
 *   NUMBER + options → Select (ElisaSelect)
 *   NUMBER (range)  → Input number avec min/max
 *   STRING + options → Select (ElisaSelect)
 *   STRING (libre)  → Input text
 *   JSON            → Textarea monospace
 *   ARRAY           → Textarea monospace (JSON)
 *   ENCRYPTED       → Input masqué avec reveal
 *
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Code, Info } from 'lucide-react';
import { ElisaToggle } from '@/components/ui/ElisaToggle';
import { ElisaSelect } from '@/components/ui/ElisaSelect';
import { ElisaMultiSelect } from '@/components/ui/ElisaMultiSelect';
import { ElisaInput } from '@/components/ui/ElisaInput';
import type { ParametreSysteme } from '@/features/configuration/types/configuration.types';

interface ParameterFieldProps {
    /** Paramètre complet depuis l'API */
    parametre: ParametreSysteme;
    /** Valeur actuelle (parsée) */
    valeur: any;
    /** Callback quand la valeur change */
    onChange: (cle: string, valeur: any) => void;
    /** Label humain (depuis i18n ou humanize) */
    label?: string;
    /** Description (override) */
    description?: string;
    /** Désactiver le champ */
    disabled?: boolean;
}

export function ParameterField({
    parametre,
    valeur,
    onChange,
    label,
    description,
    disabled = false,
}: ParameterFieldProps) {
    const { t } = useTranslation('config-params');
    const [revealed, setRevealed] = useState(false);

    const displayLabel = label || humanizeCle(parametre.cle);
    const displayDescription = description || parametre.description;
    const isModifiable = parametre.modifiableRuntime && !disabled;

    // Options depuis le paramètre (pour selects)
    const options = useMemo(() => {
        if (!parametre.options || parametre.options.length === 0) return null;
        return parametre.options.map(opt => ({
            value: opt.value,
            label: opt.label,
        }));
    }, [parametre.options]);

    const handleChange = useCallback((newValue: any) => {
        onChange(parametre.cle, newValue);
    }, [parametre.cle, onChange]);

    // Rendre le contrôle approprié selon le type
    const renderControl = () => {
        // BOOLEAN → Toggle
        if (parametre.typeValeur === 'BOOLEAN') {
            return (
                <ElisaToggle
                    checked={Boolean(valeur)}
                    onCheckedChange={handleChange}
                    label={displayLabel}
                    description={displayDescription}
                    disabled={!isModifiable}
                />
            );
        }

        // STRING avec options → Select
        if (parametre.typeValeur === 'STRING' && options && options.length > 0) {
            return (
                <ElisaSelect
                    label={displayLabel}
                    hint={displayDescription}
                    value={String(valeur ?? '')}
                    onValueChange={handleChange}
                    options={options}
                    disabled={!isModifiable}
                    searchable={options.length > 8}
                />
            );
        }

        // NUMBER avec options → Select
        if (parametre.typeValeur === 'NUMBER' && options && options.length > 0) {
            return (
                <ElisaSelect
                    label={displayLabel}
                    hint={displayDescription}
                    value={String(valeur ?? '')}
                    onValueChange={(val) => handleChange(Number(val))}
                    options={options}
                    disabled={!isModifiable}
                />
            );
        }

        // NUMBER sans options → Input number
        if (parametre.typeValeur === 'NUMBER') {
            const min = extraireContrainte(parametre.validation, 'min');
            const max = extraireContrainte(parametre.validation, 'max');

            return (
                <ElisaInput
                    label={displayLabel}
                    hint={displayDescription}
                    type="number"
                    min={min}
                    max={max}
                    value={String(valeur ?? 0)}
                    onChange={(e) => handleChange(Number(e.target.value))}
                    disabled={!isModifiable}
                />
            );
        }

        // STRING sans options → Input text
        if (parametre.typeValeur === 'STRING') {
            return (
                <ElisaInput
                    label={displayLabel}
                    hint={displayDescription}
                    value={String(valeur ?? '')}
                    onChange={(e) => handleChange(e.target.value)}
                    disabled={!isModifiable}
                    placeholder={parametre.valeurDefaut || ''}
                />
            );
        }

        // ENCRYPTED → Input masqué avec reveal
        if (parametre.typeValeur === 'ENCRYPTED') {
            return (
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-[var(--color-text-primary)]">
                            {displayLabel}
                        </label>
                        <button
                            type="button"
                            onClick={() => setRevealed(!revealed)}
                            className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                        >
                            {revealed ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            {revealed ? t('field.masquer', 'Masquer') : t('field.reveler', 'Révéler')}
                        </button>
                    </div>
                    <input
                        type={revealed ? 'text' : 'password'}
                        value={String(valeur ?? '')}
                        onChange={(e) => handleChange(e.target.value)}
                        disabled={!isModifiable}
                        className="w-full rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface)] px-3 py-2 font-mono text-sm text-[var(--color-text-primary)] focus:border-[var(--color-dominant-500)] focus:outline-none focus:ring-2 focus:ring-[var(--color-dominant-500)]/20 disabled:opacity-50"
                    />
                    {displayDescription && (
                        <p className="text-xs text-[var(--color-text-secondary)]">{displayDescription}</p>
                    )}
                </div>
            );
        }

        // ARRAY avec options → MultiSelect
        if (parametre.typeValeur === 'ARRAY' && options && options.length > 0) {
            // Valeur attendue : tableau de strings
            const arrayValue = Array.isArray(valeur) ? valeur : [];

            return (
                <ElisaMultiSelect
                    label={displayLabel}
                    hint={displayDescription}
                    value={arrayValue}
                    onValueChange={(newValues) => handleChange(newValues)}
                    options={options}
                    searchable={options.length > 6}
                    showSelectAll={options.length > 4}
                    disabled={!isModifiable}
                />
            );
        }

        // JSON / ARRAY → Textarea monospace
        if (parametre.typeValeur === 'JSON' || parametre.typeValeur === 'ARRAY') {
            const jsonValue = typeof valeur === 'string' ? valeur : JSON.stringify(valeur, null, 2);

            return (
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5">
                        <Code className="h-3.5 w-3.5 text-[var(--color-text-secondary)]" />
                        <label className="text-sm font-medium text-[var(--color-text-primary)]">
                            {displayLabel}
                        </label>
                        <span className="rounded bg-[var(--color-surface-hover)] px-1.5 py-0.5 text-[10px] font-mono text-[var(--color-text-secondary)]">
                            {parametre.typeValeur}
                        </span>
                    </div>
                    <textarea
                        value={jsonValue}
                        onChange={(e) => {
                            try {
                                // Tenter de parser pour vérifier la validité JSON
                                JSON.parse(e.target.value);
                                handleChange(e.target.value);
                            } catch {
                                // Permettre l'édition même si JSON invalide (en cours de saisie)
                                handleChange(e.target.value);
                            }
                        }}
                        disabled={!isModifiable}
                        rows={4}
                        className="w-full rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface)] px-3 py-2 font-mono text-xs text-[var(--color-text-primary)] focus:border-[var(--color-dominant-500)] focus:outline-none focus:ring-2 focus:ring-[var(--color-dominant-500)]/20 disabled:opacity-50 resize-y"
                        spellCheck={false}
                    />
                    {displayDescription && (
                        <p className="text-xs text-[var(--color-text-secondary)]">{displayDescription}</p>
                    )}
                </div>
            );
        }

        // Fallback : input text
        return (
            <ElisaInput
                label={displayLabel}
                hint={displayDescription}
                value={String(valeur ?? '')}
                onChange={(e) => handleChange(e.target.value)}
                disabled={!isModifiable}
            />
        );
    };

    return (
        <div className="group">
            {renderControl()}
        </div>
    );
}

/**
 * Humanize une clé technique en label lisible.
 * Ex: 'auth.session_duration' → 'Durée de session'
 */
export function humanizeCle(cle: string): string {
    const parts = cle.split('.');
    const lastPart = parts[parts.length - 1] || cle;
    // Remplacer underscores par espaces, capitaliser
    return lastPart
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Extrait une contrainte min/max d'un pattern de validation.
 * Ex: 'min:5,max:100' → 5 ou 100
 */
function extraireContrainte(validation: string | undefined, type: 'min' | 'max'): number | undefined {
    if (!validation) return undefined;
    const match = validation.match(new RegExp(`${type}:(\\d+)`));
    return match ? Number(match[1]) : undefined;
}
