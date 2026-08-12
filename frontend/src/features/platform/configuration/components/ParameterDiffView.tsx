/**
 * ==================================
 * eLISAschool - ParameterDiffView
 * ==================================
 * Preview des modifications avant sauvegarde.
 * Affiche un tableau comparatif ancien → nouveau avec highlight des changements.
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, AlertTriangle } from 'lucide-react';
import type { ParametreSysteme } from '@/features/configuration/types/configuration.types';
import { humanizeCle } from './ParameterField';

interface ParameterDiffViewProps {
    /** Paramètres complets depuis l'API */
    parametres: ParametreSysteme[];
    /** Valeurs originales (avant modification) */
    originalValues: Record<string, any>;
    /** Valeurs modifiées (actuelles) */
    editValues: Record<string, any>;
    /** Champs modifiés */
    dirtyFields: Set<string>;
}

export function ParameterDiffView({
    parametres,
    originalValues,
    editValues,
    dirtyFields,
}: ParameterDiffViewProps) {
    const { t } = useTranslation('config-params');

    const changes = useMemo(() => {
        if (dirtyFields.size === 0) return [];

        const paramMap = new Map(parametres.map(p => [p.cle, p]));
        const result: Array<{
            cle: string;
            label: string;
            ancienneValeur: string;
            nouvelleValeur: string;
            typeValeur: string;
            estCritique: boolean;
        }> = [];

        for (const cle of dirtyFields) {
            const param = paramMap.get(cle);
            if (!param) continue;

            const oldVal = formatValeur(originalValues[cle], param.typeValeur, t);
            const newVal = formatValeur(editValues[cle], param.typeValeur, t);

            result.push({
                cle,
                label: humanizeCle(cle),
                ancienneValeur: oldVal,
                nouvelleValeur: newVal,
                typeValeur: param.typeValeur,
                estCritique: param.categorie === 'SECURITE' || param.categorie === 'SYSTEME',
            });
        }

        return result.sort((a, b) => a.label.localeCompare(b.label));
    }, [parametres, originalValues, editValues, dirtyFields, t]);

    if (changes.length === 0) {
        return (
            <div className="rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface-alt)] p-6 text-center">
                <p className="text-sm text-[var(--color-text-secondary)]">
                    {t('diff.aucuneModification')}
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-lg border border-[var(--color-bordure)] overflow-hidden">
            {/* En-tête */}
            <div className="flex items-center gap-2 border-b border-[var(--color-bordure)] bg-[var(--color-surface-alt)] px-4 py-2">
                <AlertTriangle className="h-4 w-4 text-[var(--color-warning-600)]" />
                <span className="text-sm font-medium text-[var(--color-text-primary)]">
                    {changes.length} {t('diffView.modificationsAvant')}
                </span>
            </div>

            {/* Tableau diff */}
            <div className="divide-y divide-[var(--color-bordure)]">
                {changes.map((change) => (
                    <div
                        key={change.cle}
                        className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:gap-4"
                    >
                        {/* Label */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-[var(--color-text-primary)]">
                                    {change.label}
                                </span>
                                {change.estCritique && (
                                    <span className="rounded bg-[var(--color-warning-100)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-warning-700)]">
                                        {t('diffView.critique')}
                                    </span>
                                )}
                            </div>
                            <code className="text-[10px] text-[var(--color-text-muted)] font-mono">
                                {change.cle}
                            </code>
                        </div>

                        {/* Diff */}
                        <div className="flex items-center gap-2 text-sm">
                            <span className="rounded bg-[var(--color-danger-50)] px-2 py-1 font-mono text-xs text-[var(--color-danger-700)] line-through">
                                {change.ancienneValeur || t('diffView.vide')}
                            </span>
                            <ArrowRight className="h-3 w-3 shrink-0 text-[var(--color-text-muted)]" />
                            <span className="rounded bg-[var(--color-success-50)] px-2 py-1 font-mono text-xs text-[var(--color-success-700)]">
                                {change.nouvelleValeur || t('diffView.vide')}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/**
 * Formate une valeur pour l'affichage dans le diff (i18n-aware)
 */
function formatValeur(valeur: any, typeValeur: string, t: (key: string, fallback?: string) => string): string {
    if (valeur === null || valeur === undefined) return '';
    if (typeof valeur === 'boolean') return valeur ? t('diffView.active', 'Activé') : t('diffView.desactive', 'Désactivé');
    if (typeof valeur === 'object') return JSON.stringify(valeur).substring(0, 50) + '...';
    const str = String(valeur);
    return str.length > 50 ? str.substring(0, 50) + '...' : str;
}
