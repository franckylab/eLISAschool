/**
 * ModuleImpactAnalysis — Analyse d'impact activation/désactivation
 * Composant réutilisable (P5.5 v7)
 */
import { cn } from '@/lib/cn';
import { AlertTriangle, ArrowUpCircle, ArrowDownCircle, XCircle, CheckCircle2, Loader2 } from 'lucide-react';
import type { ModuleImpact } from '@/features/configuration/types/configuration.types';

export interface ModuleImpactAnalysisProps {
    moduleNom: string;
    moduleLabel: string;
    action: 'activate' | 'deactivate';
    impact: ModuleImpact | null | undefined;
    isLoading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ModuleImpactAnalysis({
    moduleNom,
    moduleLabel,
    action,
    impact,
    isLoading = false,
    onConfirm,
    onCancel,
}: ModuleImpactAnalysisProps) {
    const isActivation = action === 'activate';
    const hasConflits = impact && impact.conflits.length > 0;
    const modulesImpactés = isActivation
        ? impact?.modulesAActiver ?? []
        : impact?.modulesADesactiver ?? [];

    return (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-4">
            {/* Header */}
            <div className="flex items-start gap-3">
                <div
                    className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                        isActivation
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-red-500/10 text-red-600 dark:text-red-400',
                    )}
                >
                    {isActivation ? (
                        <ArrowUpCircle className="h-5 w-5" />
                    ) : (
                        <ArrowDownCircle className="h-5 w-5" />
                    )}
                </div>
                <div>
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {isActivation ? 'Activation' : 'Désactivation'} de « {moduleLabel} »
                    </h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                        {isActivation
                            ? 'Cette action activera le module et ses dépendances requises.'
                            : 'Cette action désactivera le module et peut affecter d\'autres modules dépendants.'}
                    </p>
                </div>
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="flex items-center gap-2 text-sm text-zinc-500 py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyse de l'impact en cours...
                </div>
            )}

            {/* Impact details */}
            {!isLoading && impact && (
                <>
                    {/* Modules à activer/désactiver en cascade */}
                    {modulesImpactés.length > 0 && (
                        <div className={cn(
                            'rounded-lg border p-3',
                            isActivation
                                ? 'border-emerald-500/20 bg-emerald-500/5'
                                : 'border-red-500/20 bg-red-500/5',
                        )}>
                            <p className={cn(
                                'text-sm font-medium mb-2',
                                isActivation ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400',
                            )}>
                                {modulesImpactés.length} module{modulesImpactés.length > 1 ? 's' : ''} sera{modulesImpactés.length > 1 ? 'ont' : 'a'}{' '}
                                {isActivation ? 'activé(s) en cascade' : 'désactivé(s) en cascade'} :
                            </p>
                            <ul className="space-y-1">
                                {modulesImpactés.map((mod) => (
                                    <li key={mod} className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                                        {isActivation ? (
                                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                        ) : (
                                            <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                                        )}
                                        {mod}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Conflits / Warnings */}
                    {hasConflits && (
                        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                            <div className="flex items-start gap-2">
                                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    {impact!.conflits.map((conflit, i) => (
                                        <p key={i} className="text-sm text-amber-700 dark:text-amber-400">
                                            {conflit}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* No impact */}
                    {modulesImpactés.length === 0 && !hasConflits && (
                        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 text-center">
                            <CheckCircle2 className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
                            <p className="text-sm text-zinc-500">
                                Aucun impact sur d'autres modules détecté.
                            </p>
                        </div>
                    )}
                </>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className={cn(
                        'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                        'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800',
                    )}
                >
                    Annuler
                </button>
                <button
                    type="button"
                    onClick={onConfirm}
                    disabled={isLoading || hasConflits}
                    className={cn(
                        'rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors',
                        isActivation
                            ? 'bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50'
                            : 'bg-red-600 hover:bg-red-700 disabled:bg-red-600/50',
                        'disabled:cursor-not-allowed',
                    )}
                >
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isActivation ? (
                        'Confirmer l\'activation'
                    ) : (
                        'Confirmer la désactivation'
                    )}
                </button>
            </div>
        </div>
    );
}

export default ModuleImpactAnalysis;
