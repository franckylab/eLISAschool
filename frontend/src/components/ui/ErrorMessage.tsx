/**
 * ==================================
 * eLISAschool - Composant Message d'Erreur Inline
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { AlertTriangle, Info, XCircle, RefreshCw } from 'lucide-react';
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
}

/**
 * Composant de message d'erreur inline pour les interfaces utilisateur
 * 
 * @example
 * <ErrorMessage 
 *   title="Erreur de chargement"
 *   message="Impossible de charger les données"
 *   onRetry={() => refetch()}
 * />
 */
export function ErrorMessage({
    title,
    message,
    variant = 'error',
    onRetry,
    retryLabel = 'Réessayer',
    className = '',
    dismissible = false,
    onDismiss,
}: ErrorMessageProps) {
    const variants = {
        error: {
            bg: 'bg-red-50',
            border: 'border-red-200',
            icon: XCircle,
            iconColor: 'text-red-600',
            titleColor: 'text-red-900',
            textColor: 'text-red-700',
            buttonVariant: 'danger' as const,
        },
        warning: {
            bg: 'bg-yellow-50',
            border: 'border-yellow-200',
            icon: AlertTriangle,
            iconColor: 'text-yellow-600',
            titleColor: 'text-yellow-900',
            textColor: 'text-yellow-700',
            buttonVariant: 'primary' as const,
        },
        info: {
            bg: 'bg-blue-50',
            border: 'border-blue-200',
            icon: Info,
            iconColor: 'text-blue-600',
            titleColor: 'text-blue-900',
            textColor: 'text-blue-700',
            buttonVariant: 'primary' as const,
        },
    };

    const variantConfig = variants[variant];
    const Icon = variantConfig.icon;

    return (
        <div className={`${variantConfig.bg} ${variantConfig.border} border rounded-lg p-6 ${className}`}>
            <div className="flex items-start gap-4">
                <Icon className={`h-6 w-6 ${variantConfig.iconColor} flex-shrink-0 mt-0.5`} />
                
                <div className="flex-1">
                    {title && (
                        <h3 className={`text-lg font-semibold ${variantConfig.titleColor} mb-2`}>
                            {title}
                        </h3>
                    )}
                    
                    <p className={`${variantConfig.textColor} leading-relaxed`}>
                        {message}
                    </p>

                    {onRetry && (
                        <div className="mt-4">
                            <ElisaButton
                                variant={variantConfig.buttonVariant}
                                size="sm"
                                icon={<RefreshCw className="h-4 w-4" />}
                                onClick={onRetry}
                            >
                                {retryLabel}
                            </ElisaButton>
                        </div>
                    )}
                </div>

                {dismissible && onDismiss && (
                    <button
                        onClick={onDismiss}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="Fermer"
                    >
                        <XCircle className="h-5 w-5" />
                    </button>
                )}
            </div>
        </div>
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
        <div className={`text-center py-12 bg-gray-50 rounded-lg ${className}`}>
            <Icon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">{title}</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">{description}</p>
            
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
            <div className={`animate-spin rounded-full border-b-2 border-blue-600 ${sizeConfig.spinner}`} />
            <p className={`mt-4 text-gray-600 ${sizeConfig.text}`}>{message}</p>
        </div>
    );
}
