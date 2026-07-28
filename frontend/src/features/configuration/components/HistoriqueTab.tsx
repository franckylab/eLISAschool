/**
 * ==================================
 * eLISAschool - Tab Historique Configuration
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { History, RotateCcw, Filter, Calendar, User } from 'lucide-react';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { cn } from '@/lib/cn';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import {
    useHistoriqueConfiguration,
    useRestaurerHistorique,
} from '../hooks/use-configuration';
import type { HistoriqueConfiguration } from '../types/configuration.types';

const ACTION_ICONS: Record<string, { bg: string; text: string; dot: string }> = {
    CREATE: {
        bg: 'bg-[var(--color-success)]/10',
        text: 'text-[var(--color-success)]',
        dot: 'bg-[var(--color-success)]',
    },
    UPDATE: {
        bg: 'bg-[var(--color-dominante)]/10',
        text: 'text-[var(--color-dominante)]',
        dot: 'bg-[var(--color-dominante)]',
    },
    DELETE: {
        bg: 'bg-[var(--color-danger)]/10',
        text: 'text-[var(--color-danger)]',
        dot: 'bg-[var(--color-danger)]',
    },
    RESTORE: {
        bg: 'bg-[var(--color-accent)]/10',
        text: 'text-[var(--color-accent)]',
        dot: 'bg-[var(--color-accent)]',
    },
};

const DEFAULT_ICON = {
    bg: 'bg-[var(--color-texte-secondaire)]/10',
    text: 'text-[var(--color-texte-secondaire)]',
    dot: 'bg-[var(--color-texte-secondaire)]',
};

export function HistoriqueTab() {
    const { t, i18n } = useTranslation('configuration');
    const locale = i18n.language === 'en' ? enUS : fr;

    const [filtres, setFiltres] = useState({
        page: 1,
        limit: 20,
        action: '',
        cible: '',
    });

    const [confirmCible, setConfirmCible] = useState<HistoriqueConfiguration | null>(null);

    const { data: historiqueResponse, isLoading } = useHistoriqueConfiguration(filtres);
    const restaurer = useRestaurerHistorique();

    const historique = historiqueResponse?.data || [];
    const meta = historiqueResponse?.meta;

    const handleRestaurer = async () => {
        if (!confirmCible) return;
        try {
            await restaurer.mutateAsync(confirmCible.id);
        } catch (error) {
            console.error('Erreur lors de la restauration:', error);
        } finally {
            setConfirmCible(null);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return format(date, 'dd/MM/yyyy HH:mm', { locale });
    };

    const actionLabel = (action: string): string => {
        const key = `sections.historique.${action === 'CREATE' ? 'creation' : action === 'UPDATE' ? 'modification' : action === 'DELETE' ? 'suppression' : 'restauration'}`;
        return t(key);
    };

    if (isLoading) {
        return (
            <div className="py-8 text-center text-[var(--color-texte-secondaire)]">
                {t('sections.historique.chargement')}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-[var(--color-texte)]">
                    {t('sections.historique.titreModifications')}
                </h2>
                <p className="text-sm text-[var(--color-texte-secondaire)]">
                    {t('sections.historique.sousTitreModifications')}
                </p>
            </div>

            {/* Filtres */}
            <div className="flex flex-wrap gap-3 p-4 bg-[var(--color-surface-hover)] rounded-lg">
                <div className="flex items-center gap-2">
                    <Filter className="h-[var(--icon-sm)] w-[var(--icon-sm)] text-[var(--color-texte-secondaire)]" />
                    <select
                        value={filtres.action}
                        onChange={(e) => setFiltres((prev) => ({ ...prev, action: e.target.value, page: 1 }))}
                        className="rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface)] px-3 py-1.5 text-sm focus:border-[var(--color-dominante)] focus:outline-none focus:ring-1 focus:ring-[var(--color-dominante)]"
                    >
                        <option value="">{t('sections.historique.toutesActions')}</option>
                        {(['CREATE', 'UPDATE', 'DELETE', 'RESTORE'] as const).map((key) => (
                            <option key={key} value={key}>
                                {actionLabel(key)}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Timeline */}
            <div className="space-y-4">
                {historique.length === 0 ? (
                    <div className="py-12 text-center text-[var(--color-texte-secondaire)]">
                        <History className="mx-auto mb-3 h-12 w-12 opacity-30" />
                        <p>{t('sections.historique.aucuneModification')}</p>
                    </div>
                ) : (
                    historique.map((entry) => {
                        const colors = ACTION_ICONS[entry.action] ?? DEFAULT_ICON;

                        return (
                            <div
                                key={entry.id}
                                className="relative border-l-2 border-[var(--color-bordure)] pl-8 pb-6 last:border-l-0"
                            >
                                {/* Point sur la timeline */}
                                <div
                                    className={cn(
                                        'absolute left-0 top-0 -translate-x-1/2 h-4 w-4 rounded-full border-2 border-[var(--color-surface)] shadow',
                                        colors.dot,
                                    )}
                                />

                                {/* Contenu */}
                                <div className="rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface)] p-4 shadow-sm">
                                    <div className="mb-2 flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="mb-1 flex items-center gap-2">
                                                <span
                                                    className={cn(
                                                        'rounded px-2 py-0.5 text-xs font-medium',
                                                        colors.bg,
                                                        colors.text,
                                                    )}
                                                >
                                                    {actionLabel(entry.action)}
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
                                            onClick={() => setConfirmCible(entry)}
                                            isLoading={restaurer.isPending}
                                        >
                                            {t('sections.historique.restaurer')}
                                        </ElisaButton>
                                    </div>

                                    <div className="mt-3 flex items-center gap-4 text-xs text-[var(--color-texte-secondaire)]">
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
                <div className="flex items-center justify-between border-t border-[var(--color-bordure)] pt-4">
                    <p className="text-sm text-[var(--color-texte-secondaire)]">
                        {t('sections.historique.pageSur', {
                            page: meta.currentPage,
                            total: meta.totalPages,
                            count: meta.totalItems,
                        })}
                    </p>
                    <div className="flex gap-2">
                        <ElisaButton
                            variant="outline"
                            size="sm"
                            disabled={meta.currentPage <= 1}
                            onClick={() => setFiltres((prev) => ({ ...prev, page: prev.page - 1 }))}
                        >
                            {t('sections.historique.precedent')}
                        </ElisaButton>
                        <ElisaButton
                            variant="outline"
                            size="sm"
                            disabled={meta.currentPage >= meta.totalPages}
                            onClick={() => setFiltres((prev) => ({ ...prev, page: prev.page + 1 }))}
                        >
                            {t('sections.historique.suivant')}
                        </ElisaButton>
                    </div>
                </div>
            )}

            {/* Confirmation restauration */}
            <ConfirmationModal
                isOpen={!!confirmCible}
                title={t('sections.historique.confirmerRestauration')}
                message={t('sections.historique.confirmerMessage', {
                    action: confirmCible ? actionLabel(confirmCible.action) : '',
                    cible: confirmCible?.cible ?? '',
                })}
                confirmLabel={t('sections.historique.restaurer')}
                variant="warning"
                onConfirm={handleRestaurer}
                onCancel={() => setConfirmCible(null)}
                isLoading={restaurer.isPending}
            />
        </div>
    );
}
