/**
 * ==================================
 * eLISAschool - Platform Feedback Components
 * ==================================
 * StatusBadge, ConfirmAction, EmptyState
 * Composants de feedback pour le panel admin plateforme.
 * Pattern canonique : CSS vars eLISAschool (pas de tokens shadcn).
 *
 * Phase P1 — Restructuration Panel Admin v3
 */

import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { CustomModal } from '@/components/modals/CustomModal';

// =============================================
// StatusBadge — Badge de statut coloré (thème-aware)
// =============================================

interface StatusBadgeProps {
    status: string;
    label?: string;
    variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
}

const VARIANT_STYLES: Record<string, string> = {
    success: 'bg-[var(--color-success-100)] text-[var(--color-success-700)]',
    warning: 'bg-[var(--color-warning-100)] text-[var(--color-warning-700)]',
    danger: 'bg-[var(--color-danger-100)] text-[var(--color-danger-700)]',
    info: 'bg-[var(--color-info-100)] text-[var(--color-info-700)]',
    neutral: 'bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]',
};

const STATUS_VARIANT: Record<string, string> = {
    ACTIF: 'success',
    PAYEE: 'success',
    EMISE: 'info',
    SUSPENDU: 'warning',
    EN_RETARD: 'danger',
    EXPIRE: 'danger',
    ANNULE: 'neutral',
    BROUILLON: 'neutral',
    EN_ATTENTE: 'info',
    EN_PAIEMENT: 'info',
    PARTIELLEMENT_PAYEE: 'warning',
    AVOIR: 'info',
};

export function StatusBadge({ status, label, variant }: StatusBadgeProps) {
    const v = variant || STATUS_VARIANT[status] || 'neutral';
    const style = VARIANT_STYLES[v] || VARIANT_STYLES.neutral;

    return (
        <span
            className={`inline-flex items-center font-medium rounded-full ${style}`}
            style={{
                fontSize: 'clamp(0.625rem, 0.55rem + 0.25vw, 0.75rem)',
                padding: 'clamp(0.0625rem, 0.03rem + 0.15vw, 0.125rem) clamp(0.375rem, 0.3rem + 0.3vw, 0.625rem)',
            }}
        >
            {label || status}
        </span>
    );
}

// =============================================
// ConfirmAction — Modal de confirmation (thème-aware)
// =============================================

interface ConfirmActionProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'warning' | 'default';
    loading?: boolean;
    children?: ReactNode;
}

const CONFIRM_STYLES: Record<string, string> = {
    danger: 'bg-[var(--color-danger-600)] text-white hover:bg-[var(--color-danger-700)]',
    warning: 'bg-[var(--color-warning-600)] text-white hover:bg-[var(--color-warning-700)]',
    default: 'bg-[var(--color-dominant-600)] text-white hover:opacity-90',
};

export function ConfirmAction({
    open,
    onOpenChange,
    onConfirm,
    title,
    description,
    confirmLabel,
    cancelLabel,
    variant = 'default',
    loading = false,
    children,
}: ConfirmActionProps) {
    const { t } = useTranslation('admin');
    const _confirmLabel = confirmLabel ?? t('common:boutons.confirmer', 'Confirmer');
    const _cancelLabel = cancelLabel ?? t('common:boutons.annuler', 'Annuler');
    return (
        <CustomModal
            open={open}
            onOpenChange={onOpenChange}
            title={title}
            size="sm"
            closeOnOverlayClick={!loading}
            footer={
                <div className="flex items-center gap-[var(--gap-sm)]">
                    <button
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                        className="px-[var(--space-md)] py-[var(--space-sm)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                        style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.875rem)' }}
                    >
                        {_cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className={`flex items-center gap-[var(--gap-xs)] px-[var(--space-md)] py-[var(--space-sm)] rounded-[var(--radius-md)] disabled:opacity-50 ${CONFIRM_STYLES[variant]}`}
                        style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.875rem)' }}
                    >
                        {loading && <Loader2 className="h-[var(--icon-sm)] w-[var(--icon-sm)] animate-spin" />}
                        {_confirmLabel}
                    </button>
                </div>
            }
        >
            <div className="space-y-[var(--space-sm)]">
                <div className="flex items-start gap-[var(--gap-sm)]">
                    {variant === 'danger' && (
                        <AlertTriangle className="h-[var(--icon-md)] w-[var(--icon-md)] text-[var(--color-danger-500)] shrink-0 mt-0.5" />
                    )}
                    <p style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)' }} className="text-[var(--color-text-muted)]">
                        {description}
                    </p>
                </div>
                {children}
            </div>
        </CustomModal>
    );
}

// =============================================
// EmptyState — État vide avec CTA (thème-aware)
// =============================================

interface EmptyStateProps {
    icon?: ReactNode;
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
    return (
        <div
            className="flex flex-col items-center justify-center text-center border border-dashed border-[var(--color-border)] rounded-[var(--radius-lg)] bg-[var(--color-surface)]"
            style={{ padding: 'clamp(2rem, 1.5rem + 2vw, 3rem)' }}
        >
            {icon && <div className="text-[var(--color-text-muted)] mb-[var(--space-md)]">{icon}</div>}
            <h3
                className="font-medium text-[var(--color-text-primary)] mb-[var(--space-xs)]"
                style={{ fontSize: 'clamp(0.875rem, 0.8rem + 0.3vw, 1rem)' }}
            >
                {title}
            </h3>
            {description && (
                <p
                    className="text-[var(--color-text-muted)] max-w-sm mb-[var(--space-md)]"
                    style={{ fontSize: 'clamp(0.75rem, 0.68rem + 0.25vw, 0.875rem)' }}
                >
                    {description}
                </p>
            )}
            {actionLabel && onAction && (
                <button
                    onClick={onAction}
                    className="px-[var(--space-md)] py-[var(--space-sm)] text-sm bg-[var(--color-dominant-600)] text-white rounded-[var(--radius-md)] hover:opacity-90 transition-opacity"
                    style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.875rem)' }}
                >
                    {actionLabel}
                </button>
            )}
        </div>
    );
}
