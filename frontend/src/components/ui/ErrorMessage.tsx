import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Info, XCircle, RefreshCw, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { ElisaButton } from './ElisaButton';

interface ErrorMessageProps {
    title?: string;
    message: string;
    variant?: 'error' | 'warning' | 'info';
    onRetry?: () => void;
    retryLabel?: string;
    className?: string;
    dismissible?: boolean;
    onDismiss?: () => void;
    autoDismissMs?: number;
}

const VARIANT_CONFIGS = {
    error: {
        bar: 'bg-red-500',
        bg: 'bg-red-50/80',
        icon: XCircle,
        iconColor: 'text-red-600',
        titleColor: 'text-red-900',
        textColor: 'text-red-700',
        buttonVariant: 'danger' as const,
        shadowHover: 'shadow-red-200/50',
    },
    warning: {
        bar: 'bg-amber-500',
        bg: 'bg-amber-50/80',
        icon: AlertTriangle,
        iconColor: 'text-amber-600',
        titleColor: 'text-amber-900',
        textColor: 'text-amber-700',
        buttonVariant: 'primary' as const,
        shadowHover: 'shadow-amber-200/50',
    },
    info: {
        bar: 'bg-blue-500',
        bg: 'bg-blue-50/80',
        icon: Info,
        iconColor: 'text-blue-600',
        titleColor: 'text-blue-900',
        textColor: 'text-blue-700',
        buttonVariant: 'primary' as const,
        shadowHover: 'shadow-blue-200/50',
    },
};

function AutoDismissProgress({ duration, onComplete }: { duration: number; onComplete: () => void }) {
    const [width, setWidth] = useState(100);

    useEffect(() => {
        const start = performance.now();
        const frame = () => {
            const elapsed = performance.now() - start;
            const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
            setWidth(remaining);
            if (remaining <= 0) onComplete();
            else requestAnimationFrame(frame);
        };
        const id = requestAnimationFrame(frame);
        return () => cancelAnimationFrame(id);
    }, [duration, onComplete]);

    return (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/5 overflow-hidden">
            <motion.div
                className="h-full bg-black/10 rounded-full"
                style={{ width: `${width}%` }}
            />
        </div>
    );
}

export function ErrorMessage({
    title,
    message,
    variant = 'error',
    onRetry,
    retryLabel = 'Réessayer',
    className = '',
    dismissible = false,
    onDismiss,
    autoDismissMs,
}: ErrorMessageProps) {
    const { t } = useTranslation('common');
    const [dismissed, setDismissed] = useState(false);

    const handleDismiss = useCallback(() => {
        setDismissed(true);
        onDismiss?.();
    }, [onDismiss]);

    const config = VARIANT_CONFIGS[variant];
    const Icon = config.icon;

    if (dismissed) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
            className={`relative overflow-hidden rounded-xl ${config.bg} backdrop-blur-sm ${className}`}
        >
            <div
                className={`absolute inset-y-0 left-0 w-1 rounded-r ${config.bar}`}
            />

            <div className="flex items-start gap-3 p-4 pl-5">
                <motion.div
                    initial={{ rotate: -12, scale: 0 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
                >
                    <Icon className={`h-5 w-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />
                </motion.div>

                <div className="flex-1 min-w-0">
                    {title && (
                        <h3 className={`text-sm font-semibold ${config.titleColor} mb-0.5`}>
                            {title}
                        </h3>
                    )}

                    <p className={`text-sm ${config.textColor} leading-relaxed`}>
                        {message}
                    </p>

                    {onRetry && (
                        <div className="mt-3">
                            <ElisaButton
                                variant={config.buttonVariant}
                                size="xs"
                                icon={<RefreshCw className="h-3.5 w-3.5" />}
                                onClick={onRetry}
                            >
                                {retryLabel}
                            </ElisaButton>
                        </div>
                    )}
                </div>

                {(dismissible || autoDismissMs) && handleDismiss && (
                    <button
                        onClick={handleDismiss}
                        className="flex-shrink-0 p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-black/5 transition-all"
                        aria-label={t('a11y.fermer')}
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {autoDismissMs && autoDismissMs > 0 && (
                <AutoDismissProgress
                    duration={autoDismissMs}
                    onComplete={handleDismiss}
                />
            )}
        </motion.div>
    );
}

/**
 * Composant pour état vide (aucune donnée)
 */
interface EmptyStateProps {
    icon: React.ElementType;
    title: string;
    description: string;
    actionLabel?: string;
    actionIcon?: React.ReactNode;
    onAction?: () => void;
    className?: string;
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    actionLabel,
    actionIcon,
    onAction,
    className = '',
}: EmptyStateProps) {
    return (
        <div className={`text-center py-12 bg-gray-50 dark:bg-gray-800/40 border border-transparent dark:border-gray-700/60 rounded-lg ${className}`}>
            <Icon className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">{title}</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">{description}</p>
            
            {actionLabel && onAction && (
                <ElisaButton
                    variant="primary"
                    size="sm"
                    icon={actionIcon}
                    onClick={onAction}
                >
                    {actionLabel}
                </ElisaButton>
            )}
        </div>
    );
}

/**
 * Composant pour état de chargement avec message
 */
interface LoadingStateProps {
    message?: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export function LoadingState({
    message = 'Chargement en cours...',
    size = 'md',
    className = '',
}: LoadingStateProps) {
    const sizes = {
        sm: { spinner: 'h-6 w-6', text: 'text-sm' },
        md: { spinner: 'h-10 w-10', text: 'text-base' },
        lg: { spinner: 'h-14 w-14', text: 'text-lg' },
    };

    const sizeConfig = sizes[size];

    return (
        <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
            <div className={`animate-spin rounded-full border-b-2 border-blue-600 dark:border-blue-400 ${sizeConfig.spinner}`} />
            <p className={`mt-4 text-gray-600 dark:text-gray-300 ${sizeConfig.text}`}>{message}</p>
        </div>
    );
}
