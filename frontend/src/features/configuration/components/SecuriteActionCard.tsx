/**
 * ==================================
 * eLISAschool - SecuriteActionCard
 * ==================================
 * Composant pour les actions de sécurité sensibles avec confirmation
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { AlertTriangle, Loader2, ShieldAlert } from 'lucide-react';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

interface SecuriteActionCardProps {
    action: 'invalidate-sessions' | 'reset-login-attempts' | 'force-password-reset';
    onExecute: (action: 'invalidate-sessions' | 'reset-login-attempts' | 'force-password-reset') => Promise<void>;
    isLoading: boolean;
}

export function SecuriteActionCard({ action, onExecute, isLoading }: SecuriteActionCardProps) {
    const { t } = useTranslation('securite-config');
    const [showConfirmation, setShowConfirmation] = useState(false);

    const config = {
        'invalidate-sessions': {
            titre: t('sections.securite.actions.deconnecterSessions.titre'),
            description: t('sections.securite.actions.deconnecterSessions.description'),
            confirmation: t('sections.securite.actions.deconnecterSessions.confirmation'),
            icon: ShieldAlert,
            couleur: 'red',
        },
        'reset-login-attempts': {
            titre: t('sections.securite.actions.resetEchecs.titre'),
            description: t('sections.securite.actions.resetEchecs.description'),
            confirmation: t('sections.securite.actions.resetEchecs.confirmation'),
            icon: AlertTriangle,
            couleur: 'orange',
        },
        'force-password-reset': {
            titre: t('sections.securite.actions.forcePasswordReset.titre'),
            description: t('sections.securite.actions.forcePasswordReset.description'),
            confirmation: t('sections.securite.actions.forcePasswordReset.confirmation'),
            icon: ShieldAlert,
            couleur: 'red',
        },
    };

    const actionConfig = config[action];
    const Icon = actionConfig.icon;

    const handleExecute = async () => {
        await onExecute(action);
        setShowConfirmation(false);
    };

    const borderColors: Record<string, string> = {
        red: 'border-[var(--color-error)]/30',
        orange: 'border-orange-500/30',
    };

    const bgColors: Record<string, string> = {
        red: 'bg-[var(--color-error)]/5',
        orange: 'bg-orange-500/5',
    };

    const iconColors: Record<string, string> = {
        red: 'text-[var(--color-error)]',
        orange: 'text-orange-500',
    };

    return (
        <>
            <motion.div
                className={`rounded-lg border ${borderColors[actionConfig.couleur]} ${bgColors[actionConfig.couleur]} p-4`}
                whileHover={{ scale: 1.01 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
                <div className="flex items-start gap-3">
                    <div className={`shrink-0 rounded-lg p-2 ${bgColors[actionConfig.couleur]}`}>
                        <Icon className={`h-5 w-5 ${iconColors[actionConfig.couleur]}`} />
                    </div>

                    <div className="flex-1 space-y-2">
                        <div>
                            <h4 className="text-sm font-semibold text-[var(--color-texte)]">
                                {actionConfig.titre}
                            </h4>
                            <p className="mt-1 text-xs text-[var(--color-texte-secondaire)]">
                                {actionConfig.description}
                            </p>
                        </div>

                        <ElisaButton
                            variant="danger"
                            size="sm"
                            onClick={() => setShowConfirmation(true)}
                            isLoading={isLoading}
                            loadingText="Exécution en cours..."
                            icon={isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
                        >
                            {t('boutons.executer')}
                        </ElisaButton>
                    </div>
                </div>
            </motion.div>

            <ConfirmationModal
                open={showConfirmation}
                onOpenChange={setShowConfirmation}
                title={actionConfig.titre}
                description={actionConfig.confirmation}
                confirmText={t('boutons.confirmer')}
                cancelText={t('boutons.annuler')}
                onConfirm={handleExecute}
                variant="danger"
            />
        </>
    );
}
