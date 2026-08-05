/**
 * ==================================
 * eLISAschool - Barre de filtres EDT
 * ==================================
 * Composant réutilisable : contexte (classe/enseignant/salle) + filtres avancés
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Filter, X, ChevronDown, Users, GraduationCap, DoorOpen } from 'lucide-react';
import type { JourSemaine } from '../types/edt.types';

export type ContexteType = 'classe' | 'enseignant' | 'salle';

interface OptionSimple {
    value: string;
    label: string;
}

export interface EDTFilterBarProps {
    contexteType: ContexteType;
    onContexteTypeChange: (type: ContexteType) => void;
    contexteFilter: string;
    onContexteFilterChange: (id: string) => void;
    contexteOptions: OptionSimple[];
    // Filtres avancés (optionnels)
    filtreMatiere?: string;
    onFiltreMatiereChange?: (id: string) => void;
    matiereOptions?: OptionSimple[];
    filtreJour?: JourSemaine;
    onFiltreJourChange?: (jour: JourSemaine | undefined) => void;
    filtrePeriode?: string;
    onFiltrePeriodeChange?: (id: string) => void;
    periodeOptions?: OptionSimple[];
}

const JOURS: JourSemaine[] = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'];

const CONTEXTE_ICONS: Record<ContexteType, React.ReactNode> = {
    classe: <Users className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />,
    enseignant: <GraduationCap className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />,
    salle: <DoorOpen className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />,
};

export function EDTFilterBar({
    contexteType,
    onContexteTypeChange,
    contexteFilter,
    onContexteFilterChange,
    contexteOptions,
    filtreMatiere,
    onFiltreMatiereChange,
    matiereOptions,
    filtreJour,
    onFiltreJourChange,
    filtrePeriode,
    onFiltrePeriodeChange,
    periodeOptions,
}: EDTFilterBarProps) {
    const { t } = useTranslation('emplois');
    const [filtresAvancesOuverts, setFiltresAvancesOuverts] = useState(false);

    const hasAdvancedFilters = !!(onFiltreMatiereChange || onFiltreJourChange || onFiltrePeriodeChange);
    const hasActiveFilters = !!(filtreMatiere || filtreJour || filtrePeriode);

    const selectClass =
        'h-[clamp(1.75rem,1.5rem+0.5vw,2.25rem)] rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface)] px-[var(--space-sm)] text-[var(--color-text-primary)] text-sm transition-colors hover:border-[var(--color-dominant-400)] focus:outline-none focus:ring-2 focus:ring-[var(--color-dominant-300)]';

    return (
        <div className="flex flex-col gap-[var(--gap-sm)]">
            {/* ─── Ligne 1 : Contexte + filtre principal ─── */}
            <div className="flex flex-wrap items-center gap-[var(--gap-sm)]">
                {/* Sélecteur de contexte */}
                <div className="flex rounded-lg border border-[var(--color-bordure)] overflow-hidden">
                    {(['classe', 'enseignant', 'salle'] as ContexteType[]).map((type) => (
                        <button
                            key={type}
                            onClick={() => onContexteTypeChange(type)}
                            className={`flex items-center gap-1 px-[var(--space-sm)] py-[var(--space-xs)] text-xs font-medium transition-colors ${
                                contexteType === type
                                    ? 'bg-[var(--color-dominant-100)] text-[var(--color-dominant-700)]'
                                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]'
                            }`}
                            aria-pressed={contexteType === type}
                        >
                            <span className="flex items-center">{CONTEXTE_ICONS[type]}</span>
                            <span className="hidden sm:inline">{t(`contexte.${type}`)}</span>
                        </button>
                    ))}
                </div>

                {/* Dropdown principal — options dynamiques selon le contexte */}
                <select
                    value={contexteFilter}
                    onChange={(e) => onContexteFilterChange(e.target.value)}
                    className={selectClass}
                    style={{ minWidth: 'clamp(120px, 30vw, 280px)' }}
                >
                    <option value="">
                        {contexteType === 'classe'
                            ? t('filtres.toutesClasses')
                            : contexteType === 'enseignant'
                                ? t('filtres.tousEnseignants')
                                : t('filtres.toutesSalles')}
                    </option>
                    {contexteOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>

                {/* Toggle filtres avancés */}
                {hasAdvancedFilters && (
                    <button
                        onClick={() => setFiltresAvancesOuverts(!filtresAvancesOuverts)}
                        className={`flex items-center gap-1 rounded-lg border px-[var(--space-sm)] py-[var(--space-xs)] text-xs font-medium transition-colors ${
                            filtresAvancesOuverts || hasActiveFilters
                                ? 'border-[var(--color-dominant-400)] bg-[var(--color-dominant-50)] text-[var(--color-dominant-700)]'
                                : 'border-[var(--color-bordure)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]'
                        }`}
                    >
                        <Filter className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />
                        <span className="hidden sm:inline">{t('filtres.avances')}</span>
                        <ChevronDown
                            className={`h-3 w-3 transition-transform ${filtresAvancesOuverts ? 'rotate-180' : ''}`}
                        />
                    </button>
                )}
            </div>

            {/* ─── Ligne 2 : Filtres avancés (pliable) ─── */}
            {filtresAvancesOuverts && hasAdvancedFilters && (
                <div className="flex flex-wrap items-center gap-[var(--gap-sm)] rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface-alt)] p-[var(--space-sm)]">
                    {/* Matière */}
                    {onFiltreMatiereChange && matiereOptions && (
                        <select
                            value={filtreMatiere ?? ''}
                            onChange={(e) => onFiltreMatiereChange(e.target.value)}
                            className={selectClass}
                        >
                            <option value="">{t('filtres.toutesMatieres')}</option>
                            {matiereOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    )}

                    {/* Période */}
                    {onFiltrePeriodeChange && periodeOptions && (
                        <select
                            value={filtrePeriode ?? ''}
                            onChange={(e) => onFiltrePeriodeChange(e.target.value)}
                            className={selectClass}
                        >
                            <option value="">{t('filtres.toutesPeriodes')}</option>
                            {periodeOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    )}

                    {/* Jour */}
                    {onFiltreJourChange && (
                        <select
                            value={filtreJour ?? ''}
                            onChange={(e) => onFiltreJourChange(e.target.value as JourSemaine || undefined)}
                            className={selectClass}
                        >
                            <option value="">{t('filtres.tousJours')}</option>
                            {JOURS.map((j) => (
                                <option key={j} value={j}>{t(`jours.${j.toLowerCase()}`)}</option>
                            ))}
                        </select>
                    )}

                    {/* Reset */}
                    {hasActiveFilters && (
                        <button
                            onClick={() => {
                                onFiltreMatiereChange?.('');
                                onFiltreJourChange?.(undefined);
                                onFiltrePeriodeChange?.('');
                            }}
                            className="flex items-center gap-1 rounded-lg border border-[var(--color-bordure)] px-[var(--space-sm)] py-[var(--space-xs)] text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors"
                        >
                            <X className="h-3 w-3" />
                            {t('filtres.reset')}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
