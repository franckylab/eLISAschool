/**
 * ==================================
 * eLISAschool - SaveBar
 * ==================================
 * Barre sticky affichée quand des modifications sont en attente.
 * Affiche le nombre de changements + boutons Annuler / Enregistrer.
 * Pattern extrait de SecuriteTab.tsx et généralisé.
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Save, RotateCcw, Info } from 'lucide-react';
import { ElisaButton } from '@/components/ui/ElisaButton';

interface SaveBarProps {
    /** Nombre de modifications en attente */
    modificationsCount: number;
    /** Afficher ou non la barre */
    visible: boolean;
    /** Callback sauvegarder */
    onSauvegarder: () => void;
    /** Callback annuler */
    onAnnuler: () => void;
    /** État de sauvegarde en cours */
    isSaving?: boolean;
    /** Label personnalisé (défaut: 'modifications') */
    label?: string;
}

export function SaveBar({
    modificationsCount,
    visible,
    onSauvegarder,
    onAnnuler,
    isSaving = false,
    label,
}: SaveBarProps) {
    const { t } = useTranslation('config-params');
    const displayLabel = label || t('modifications');

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    className="sticky bottom-4 z-50 rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-4 shadow-lg"
                >
                    <div className="flex items-center justify-between gap-4">
                        {/* Info */}
                        <div className="flex items-center gap-3 min-w-0">
                            <Info className="h-5 w-5 shrink-0 text-[var(--color-dominant-600)]" />
                            <span className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                                <span className="font-bold text-[var(--color-dominant-600)]">{modificationsCount}</span>
                                {' '}{displayLabel}
                            </span>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 shrink-0">
                            <ElisaButton
                                variant="outline"
                                size="sm"
                                onClick={onAnnuler}
                                icon={<RotateCcw className="h-4 w-4" />}
                            >
                                {t('saveBar.annuler', 'Annuler')}
                            </ElisaButton>

                            <ElisaButton
                                variant="primary"
                                size="sm"
                                onClick={onSauvegarder}
                                chargement={isSaving}
                                icon={<Save className="h-4 w-4" />}
                            >
                                {t('saveBar.enregistrer', 'Enregistrer')}
                            </ElisaButton>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
