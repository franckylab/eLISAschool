/**
 * ==================================
 * eLISAschool - ParameterSearchBar
 * ==================================
 * Barre de recherche + filtres pour les paramètres.
 * Recherche textuelle (debounce 300ms) + filtre catégorie + filtre module.
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ElisaSelect } from '@/components/ui/ElisaSelect';
import type { CategorieParametre } from '@/features/configuration/types/configuration.types';

interface ParameterSearchBarProps {
    /** Valeur de recherche actuelle */
    recherche: string;
    /** Callback quand la recherche change (debounced) */
    onRechercheChange: (value: string) => void;
    /** Catégorie sélectionnée */
    categorieActive?: CategorieParametre;
    /** Module sélectionné */
    moduleActif?: string;
    /** Callback changement de module */
    onModuleChange?: (module: string | undefined) => void;
    /** Liste des modules disponibles */
    modulesDisponibles?: string[];
    /** Nombre total de paramètres affichés */
    totalAffiche?: number;
    /** Nombre total de paramètres */
    totalParams?: number;
}

export function ParameterSearchBar({
    recherche,
    onRechercheChange,
    moduleActif,
    onModuleChange,
    modulesDisponibles = [],
    totalAffiche,
    totalParams,
}: ParameterSearchBarProps) {
    const { t } = useTranslation('config-params');
    const [localValue, setLocalValue] = useState(recherche);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>();

    // Debounce 300ms sur la recherche
    useEffect(() => {
        debounceRef.current = setTimeout(() => {
            if (localValue !== recherche) {
                onRechercheChange(localValue);
            }
        }, 300);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [localValue, recherche, onRechercheChange]);

    // Sync depuis l'extérieur
    useEffect(() => {
        setLocalValue(recherche);
    }, [recherche]);

    const clearSearch = useCallback(() => {
        setLocalValue('');
        onRechercheChange('');
    }, [onRechercheChange]);

    // Options pour le filtre module (ElisaSelect)
    const moduleOptions = useMemo(() => {
        const opts = [{ value: '', label: t('search.tousModules', 'Tous les modules') }];
        for (const mod of modulesDisponibles) {
            opts.push({ value: mod, label: mod });
        }
        return opts;
    }, [modulesDisponibles, t]);

    const hasFilters = localValue || moduleActif;

    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Barre de recherche */}
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
                <input
                    type="text"
                    value={localValue}
                    onChange={(e) => setLocalValue(e.target.value)}
                    placeholder={t('search.placeholder', 'Rechercher un paramètre...')}
                    className="w-full rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface)] py-2 pl-10 pr-10 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-dominant-500)] focus:outline-none focus:ring-2 focus:ring-[var(--color-dominant-500)]/20"
                />
                {localValue && (
                    <button
                        onClick={clearSearch}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Filtre module — ElisaSelect */}
            {modulesDisponibles.length > 0 && onModuleChange && (
                <div className="w-full sm:w-48 shrink-0">
                    <ElisaSelect
                        options={moduleOptions}
                        value={moduleActif || ''}
                        onValueChange={(val) => onModuleChange(val || undefined)}
                        placeholder={t('search.tousModules', 'Tous les modules')}
                        compact
                    />
                </div>
            )}

            {/* Compteur */}
            {totalAffiche !== undefined && totalParams !== undefined && (
                <span className="text-xs text-[var(--color-text-secondary)] whitespace-nowrap">
                    {t('search.compteur', { affiche: totalAffiche, total: totalParams, totalPluriel: totalParams > 1 ? 's' : '' })}
                    {hasFilters && t('search.filtre')}
                </span>
            )}
        </div>
    );
}
