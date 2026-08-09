/**
 * ==================================
 * eLISAschool - Composants Réutilisables Platform
 * ==================================
 * 
 * PlatformStatCard, StatusBadge, ConfirmAction, EmptyState
 * Composants partagés pour le panel admin plateforme.
 * Ultra-responsifs (clamp) + dark mode (variables CSS).
 * 
 * Phase P5.4 — Refonte SaaS v4
 */

import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { CustomModal } from '@/components/modals/CustomModal';

// =============================================
// PlatformStatCard — Carte statistique platform
// (Nom distinct du StatCard partagé @/components/ui/StatCard)
// =============================================

interface PlatformStatCardProps {
    label: string;
    value: string | number;
    sublabel?: string;
    icon?: ReactNode;
    tone?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
    trend?: 'up' | 'down' | 'neutral';
    loading?: boolean;
}

const TONE_TEXT: Record<string, string> = {
    success: 'text-[var(--color-success-600)]',
    warning: 'text-[var(--color-warning-600)]',
    danger: 'text-[var(--color-danger-600)]',
    info: 'text-[var(--color-info-600)]',
    neutral: 'text-[var(--color-text-secondary)]',
};

export function PlatformStatCard({ label, value, sublabel, icon, tone = 'neutral', trend, loading }: PlatformStatCardProps) {
    return (
        <div
            className="border border-[var(--color-border)] rounded-[var(--radius-lg)] bg-[var(--color-surface)] space-y-[var(--space-xs)]"
            style={{ padding: 'clamp(0.75rem, 0.6rem + 0.5vw, 1.25rem)' }}
        >
            <div className="flex items-center justify-between">
                <span
                    className="text-[var(--color-text-muted)] font-medium"
                    style={{ fontSize: 'clamp(0.6875rem, 0.6rem + 0.3vw, 0.8125rem)' }}
                >
                    {label}
                </span>
                {icon && <span className={TONE_TEXT[tone]}>{icon}</span>}
            </div>
            <div
                className={`font-bold ${TONE_TEXT[tone]} ${loading ? 'animate-pulse' : ''}`}
                style={{ fontSize: 'clamp(1.125rem, 0.9rem + 0.8vw, 1.5rem)' }}
            >
                {loading ? '...' : value}
            </div>
            {(sublabel || trend) && (
                <div
                    className="text-[var(--color-text-muted)] flex items-center gap-[var(--gap-xs)]"
                    style={{ fontSize: 'clamp(0.625rem, 0.55rem + 0.25vw, 0.75rem)' }}
                >
                    {trend === 'up' && <span className="text-[var(--color-success-500)]">&#8593;</span>}
                    {trend === 'down' && <span className="text-[var(--color-danger-500)]">&#8595;</span>}
                    {sublabel}
                </div>
            )}
        </div>
    );
}

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
            className="flex flex-col items-center justify-center text-center border border-dashed border-[var(--color-bordure)] rounded-[var(--radius-lg)] bg-[var(--color-surface)]"
            style={{ padding: 'clamp(2rem, 1.5rem + 2vw, 3rem)' }}
        >
            {icon && <div className="text-[var(--color-texte-muted)] mb-[var(--space-md)]">{icon}</div>}
            <h3
                className="font-medium text-[var(--color-texte)] mb-[var(--space-xs)]"
                style={{ fontSize: 'clamp(0.875rem, 0.8rem + 0.3vw, 1rem)' }}
            >
                {title}
            </h3>
            {description && (
                <p
                    className="text-[var(--color-texte-muted)] max-w-sm mb-[var(--space-md)]"
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

// =============================================
// PlatformSection — Section avec titre + icône
// =============================================

interface PlatformSectionProps {
    title: string;
    icon?: ReactNode;
    children: ReactNode;
    action?: ReactNode;
    className?: string;
}

export function PlatformSection({ title, icon, children, action, className = '' }: PlatformSectionProps) {
    return (
        <div
            className={`rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] space-y-4 ${className}`}
            style={{ padding: 'clamp(1rem, 0.8rem + 0.6vw, 1.5rem)' }}
        >
            <div className="flex items-center justify-between">
                <h2
                    className="font-semibold flex items-center gap-2"
                    style={{ fontSize: 'clamp(0.9375rem, 0.85rem + 0.3vw, 1.125rem)' }}
                >
                    {icon && <span className="text-[var(--color-texte-muted)]">{icon}</span>}
                    {title}
                </h2>
                {action}
            </div>
            {children}
        </div>
    );
}

// =============================================
// PlatformKeyValue — Ligne clé-valeur pour listes
// =============================================

interface PlatformKeyValueProps {
    label: string;
    value: string | number;
    valueClassName?: string;
    loading?: boolean;
}

export function PlatformKeyValue({ label, value, valueClassName = '', loading = false }: PlatformKeyValueProps) {
    return (
        <div className="flex items-center justify-between">
            <span
                className="text-[var(--color-texte-muted)]"
                style={{ fontSize: 'clamp(0.75rem, 0.68rem + 0.25vw, 0.875rem)' }}
            >
                {label}
            </span>
            <span
                className={`font-semibold ${loading ? 'animate-pulse' : ''} ${valueClassName}`}
                style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)' }}
            >
                {loading ? '...' : value}
            </span>
        </div>
    );
}
