/**
 * ==================================
 * eLISAschool - ErrorState
 * ==================================
 * État d'erreur avec bouton réessayer
 */

import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { cn } from '@/lib/cn';

interface ErrorStateProps {
    message?: string;
    onRetry?: () => void;
    className?: string;
}

export function ErrorState({ message, onRetry, className }: ErrorStateProps) {
    const { t } = useTranslation('common');

    return (
        <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-error)]/10">
                <AlertTriangle className="h-8 w-8 text-[var(--color-error)]" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--color-texte)]">
                {t('messages.erreurServeur')}
            </h3>
            {message && (
                <p className="mt-2 max-w-sm text-sm text-[var(--color-texte-secondaire)]">
                    {message}
                </p>
            )}
            {onRetry && (
                <ElisaButton
                    variant="outline"
                    size="sm"
                    className="mt-6"
                    onClick={onRetry}
                    icon={<RefreshCw className="h-4 w-4" />}
                >
                    {t('boutons.reessayer')}
                </ElisaButton>
            )}
        </div>
    );
}
