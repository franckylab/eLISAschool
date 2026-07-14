/**
 * ==================================
 * eLISAschool - Tab Historique Configuration
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useState } from 'react';
import { History, RotateCcw, Filter, Calendar, User } from 'lucide-react';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { cn } from '@/lib/cn';
import {
    useHistoriqueConfiguration,
    useRestaurerHistorique,
} from '../hooks/use-configuration';
import type { HistoriqueConfiguration } from '../types/configuration.types';

const ACTIONS_CONFIG: Record<string, { label: string; color: string }> = {
    CREATE: { label: 'Création', color: 'green' },
    UPDATE: { label: 'Modification', color: 'blue' },
    DELETE: { label: 'Suppression', color: 'red' },
    RESTORE: { label: 'Restauration', color: 'purple' },
};

export function HistoriqueTab() {
    const [filtres, setFiltres] = useState({
        page: 1,
        limit: 20,
        action: '',
        cible: '',
    });

    const { data: historiqueResponse, isLoading } = useHistoriqueConfiguration(filtres);
    const restaurer = useRestaurerHistorique();

    const historique = historiqueResponse?.data || [];
    const meta = historiqueResponse?.meta;

    const handleRestaurer = async (entry: HistoriqueConfiguration) => {
        if (!confirm(`Restaurer la configuration à cet état ?\n\nAction: ${entry.action}\nCible: ${entry.cible}`)) {
            return;
        }

        try {
            await restaurer.mutateAsync(entry.id);
        } catch (error) {
            console.error('Erreur lors de la restauration:', error);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (isLoading) {
        return <div className="py-8 text-center">Chargement de l'historique...</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-[var(--color-texte)]">
                    Historique des Modifications
                </h2>
                <p className="text-sm text-[var(--color-texte-secondaire)]">
                    Consultez et restaurez les versions précédentes de la configuration
                </p>
            </div>

            {/* Filtres */}
            <div className="flex flex-wrap gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <select
                        value={filtres.action}
                        onChange={(e) => setFiltres((prev) => ({ ...prev, action: e.target.value, page: 1 }))}
                        className="px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-dominante)]"
                    >
                        <option value="">Toutes les actions</option>
                        {Object.entries(ACTIONS_CONFIG).map(([key, config]) => (
                            <option key={key} value={key}>
                                {config.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Timeline */}
            <div className="space-y-4">
                {historique.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        <History className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p>Aucune modification dans l'historique</p>
                    </div>
                ) : (
                    historique.map((entry) => {
                        const actionConfig = ACTIONS_CONFIG[entry.action] || {
                            label: entry.action,
                            color: 'gray',
                        };

                        return (
                            <div
                                key={entry.id}
                                className="relative pl-8 pb-6 border-l-2 border-gray-200 dark:border-gray-700 last:border-l-0"
                            >
                                {/* Point sur la timeline */}
                                <div
                                    className={cn(
                                        'absolute left-0 top-0 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-white shadow',
                                        `bg-${actionConfig.color}-500`
                                    )}
                                />

                                {/* Contenu */}
                                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span
                                                    className={cn(
                                                        'px-2 py-0.5 rounded text-xs font-medium',
                                                        `bg-${actionConfig.color}-100 text-${actionConfig.color}-800`
                                                    )}
                                                >
                                                    {actionConfig.label}
                                                </span>
                                                <span className="text-sm font-medium text-[var(--color-texte)]">
                                                    {entry.cible}
                                                </span>
                                            </div>
                                            {entry.commentaire && (
                                                <p className="text-sm text-[var(--color-texte-secondaire)]">
                                                    {entry.commentaire}
                                                </p>
                                            )}
                                        </div>

                                        <ElisaButton
                                            variant="outline"
                                            size="sm"
                                            icon={<RotateCcw className="h-3 w-3" />}
                                            onClick={() => handleRestaurer(entry)}
                                            isLoading={restaurer.isPending}
                                        >
                                            Restaurer
                                        </ElisaButton>
                                    </div>

                                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mt-3">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {formatDate(entry.creeAt)}
                                        </div>
                                        {entry.utilisateurNom && (
                                            <div className="flex items-center gap-1">
                                                <User className="h-3 w-3" />
                                                {entry.utilisateurNom}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        Page {meta.currentPage} sur {meta.totalPages} ({meta.totalItems} entrées)
                    </p>
                    <div className="flex gap-2">
                        <ElisaButton
                            variant="outline"
                            size="sm"
                            disabled={!meta.hasPrev}
                            onClick={() => setFiltres((prev) => ({ ...prev, page: prev.page - 1 }))}
                        >
                            Précédent
                        </ElisaButton>
                        <ElisaButton
                            variant="outline"
                            size="sm"
                            disabled={!meta.hasNext}
                            onClick={() => setFiltres((prev) => ({ ...prev, page: prev.page + 1 }))}
                        >
                            Suivant
                        </ElisaButton>
                    </div>
                </div>
            )}
        </div>
    );
}
