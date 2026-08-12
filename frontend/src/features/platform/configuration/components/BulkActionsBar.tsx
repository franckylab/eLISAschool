/**
 * ==================================
 * eLISAschool - BulkActionsBar
 * ==================================
 * Barre d'actions groupées pour les paramètres :
 *   - Réinitialiser la catégorie aux valeurs par défaut
 *   - Exporter les paramètres de la section
 *
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { RotateCcw, AlertTriangle } from 'lucide-react';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { CustomModal } from '@/components/modals/CustomModal';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface BulkActionsBarProps {
    /** Catégorie courante (pour reset) */
    categorie: string;
    /** Nombre total de paramètres dans la section */
    totalParams: number;
    /** Callback pour réinitialiser la catégorie */
    onResetCategorie: () => Promise<void>;
    /** Désactiver les actions (ex: en cours de chargement) */
    disabled?: boolean;
}

export function BulkActionsBar({
    categorie,
    totalParams,
    onResetCategorie,
    disabled = false,
}: BulkActionsBarProps) {
    const { t } = useTranslation('config-params');
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

    const handleReset = useCallback(async () => {
        setIsResetting(true);
        try {
            await onResetCategorie();
            toast.success(t('resetSucces'));
            setShowResetConfirm(false);
        } catch {
            toast.error(t('sauvegardeErreur'));
        } finally {
            setIsResetting(false);
        }
    }, [onResetCategorie, t]);

    if (totalParams === 0) return null;

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface-alt)] px-4 py-2.5"
            >
                {/* Info section */}
                <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                    <span className="font-medium text-[var(--color-text-primary)]">
                        {totalParams}
                    </span>
                    <span>{t('bulk.paramsDansSection')}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <ElisaButton
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowResetConfirm(true)}
                        disabled={disabled}
                        icon={<RotateCcw className="h-3.5 w-3.5" />}
                    >
                        {t('resetCategorie')}
                    </ElisaButton>
                </div>
            </motion.div>

            {/* Modal de confirmation reset */}
            <AnimatePresence>
                {showResetConfirm && (
                    <CustomModal
                        open={showResetConfirm}
                        onOpenChange={(v) => { if (!v) setShowResetConfirm(false); }}
                        title={t('resetConfirm')}
                        description={t('resetMessage')}
                        size="md"
                        draggable={false}
                        resizable={false}
                        footer={
                            <div className="flex gap-2 justify-end">
                                <ElisaButton
                                    variant="outline"
                                    onClick={() => setShowResetConfirm(false)}
                                >
                                    {t('annuler')}
                                </ElisaButton>
                                <ElisaButton
                                    variant="danger"
                                    onClick={handleReset}
                                    chargement={isResetting}
                                    icon={<AlertTriangle className="h-4 w-4" />}
                                >
                                    {t('resetConfirm')}
                                </ElisaButton>
                            </div>
                        }
                    >
                        <div className="flex items-start gap-3 py-2">
                            <AlertTriangle className="h-5 w-5 shrink-0 text-[var(--color-warning-600)]" />
                            <div className="text-sm text-[var(--color-text-secondary)]">
                                <p>
                                    {t('bulk.resetConfirmMessage', { categorie })}
                                </p>
                                <p className="mt-2 text-xs">
                                    {t('bulk.resetIrreversible')}
                                </p>
                            </div>
                        </div>
                    </CustomModal>
                )}
            </AnimatePresence>
        </>
    );
}
