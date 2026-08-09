/**
 * ==================================
 * eLISAschool - Composants Réutilisables Billing
 * ==================================
 * [Phase 7.3] PlanCard, QuotaGauge, InvoiceStatus
 * Composants partagés pour les pages billing (client + plateforme).
 * Thème-aware (variables CSS) + dark mode.
 */

import { Check, Loader2, AlertTriangle } from 'lucide-react';

// =============================================
// PlanCard — Carte de plan tarifaire
// =============================================

interface PlanCardProps {
    nom: string;
    description?: string;
    prixBase: number;
    devise?: string;
    maxEleves: number;
    maxUtilisateurs: number;
    modulesInclus?: string[];
    badge?: string;
    actif?: boolean;
    selected?: boolean;
    onSelect?: () => void;
    loading?: boolean;
}

export function PlanCard({
    nom,
    description,
    prixBase,
    devise = 'XAF',
    maxEleves,
    maxUtilisateurs,
    modulesInclus = [],
    badge,
    actif = true,
    selected = false,
    onSelect,
    loading = false,
}: PlanCardProps) {
    return (
        <div
            onClick={onSelect}
            className={`relative rounded-xl border p-5 space-y-4 transition-all ${
                selected
                    ? 'border-[var(--color-dominante)] ring-2 ring-[var(--color-dominante)]/20'
                    : 'border-[var(--color-bordure)] hover:border-[var(--color-dominante)]/50'
            } ${onSelect ? 'cursor-pointer' : ''} ${!actif ? 'opacity-50' : ''}`}
        >
            {/* Badge */}
            {badge && (
                <span className="absolute -top-2.5 right-4 text-xs font-semibold bg-[var(--color-dominante)] text-white px-3 py-0.5 rounded-full">
                    {badge}
                </span>
            )}

            {/* En-tête */}
            <div>
                <h3 className="text-lg font-bold">{nom}</h3>
                {description && (
                    <p className="text-sm text-[var(--color-texte-muted)] mt-1">{description}</p>
                )}
            </div>

            {/* Prix */}
            <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">{prixBase.toLocaleString()}</span>
                <span className="text-sm text-[var(--color-texte-muted)]">{devise}/mois</span>
            </div>

            {/* Limites */}
            <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                    <span className="text-[var(--color-texte-muted)]">Élèves:</span>
                    <span className="font-semibold">{maxEleves === 0 ? '∞' : maxEleves.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[var(--color-texte-muted)]">Users:</span>
                    <span className="font-semibold">{maxUtilisateurs === 0 ? '∞' : maxUtilisateurs.toLocaleString()}</span>
                </div>
            </div>

            {/* Modules inclus */}
            {modulesInclus.length > 0 && (
                <div className="space-y-1.5">
                    <span className="text-xs font-medium text-[var(--color-texte-muted)]">Modules inclus :</span>
                    <div className="flex flex-wrap gap-1.5">
                        {modulesInclus.map((m) => (
                            <span
                                key={m}
                                className="inline-flex items-center gap-1 text-xs bg-[var(--color-dominante-bg)] text-[var(--color-dominante)] px-2 py-0.5 rounded-full"
                            >
                                <Check className="w-3 h-3" />
                                {m}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-surface)]/80 rounded-xl">
                    <Loader2 className="w-5 h-5 animate-spin text-[var(--color-dominante)]" />
                </div>
            )}
        </div>
    );
}

// =============================================
// QuotaGauge — Jauge de consommation quota
// =============================================

interface QuotaGaugeProps {
    label: string;
    current: number;
    max: number;
    unit?: string;
    showPercentage?: boolean;
    thresholds?: { warning: number; danger: number };
}

export function QuotaGauge({
    label,
    current,
    max,
    unit = '',
    showPercentage = true,
    thresholds = { warning: 80, danger: 90 },
}: QuotaGaugeProps) {
    const percentage = max > 0 ? Math.round((current / max) * 100) : 0;
    const isUnlimited = max === 0;

    const color = isUnlimited
        ? 'var(--color-success-500)'
        : percentage >= thresholds.danger
            ? 'var(--color-danger-500)'
            : percentage >= thresholds.warning
                ? 'var(--color-warning-500)'
                : 'var(--color-success-500)';

    return (
        <div className="space-y-1">
            <div className="flex justify-between items-center text-sm">
                <span className="font-medium">{label}</span>
                <div className="flex items-center gap-2">
                    <span className="text-[var(--color-texte-muted)]">
                        {current.toLocaleString()}{unit} / {isUnlimited ? '∞' : `${max.toLocaleString()}${unit}`}
                    </span>
                    {showPercentage && !isUnlimited && (
                        <span className="text-xs font-mono" style={{ color }}>
                            {percentage}%
                        </span>
                    )}
                </div>
            </div>
            <div className="h-2 rounded-full bg-[var(--color-surface-hover)] overflow-hidden">
                <div
                    className="h-2 rounded-full transition-all duration-300"
                    style={{
                        width: `${Math.min(percentage, 100)}%`,
                        backgroundColor: color,
                    }}
                />
            </div>
            {percentage >= thresholds.danger && !isUnlimited && (
                <div className="flex items-center gap-1 text-xs text-[var(--color-danger-500)]">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Quota critique</span>
                </div>
            )}
        </div>
    );
}

// =============================================
// InvoiceStatus — Badge de statut de facture
// =============================================

interface InvoiceStatusProps {
    status: string;
    size?: 'sm' | 'md';
}

const INVOICE_STATUS_MAP: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' }> = {
    PAYEE: { label: 'Payée', variant: 'success' },
    EMISE: { label: 'Émise', variant: 'info' },
    EN_RETARD: { label: 'En retard', variant: 'danger' },
    ANNULEE: { label: 'Annulée', variant: 'neutral' },
    AVOIR: { label: 'Avoir', variant: 'info' },
    EN_ATTENTE: { label: 'En attente', variant: 'warning' },
    EN_PAIEMENT: { label: 'En paiement', variant: 'info' },
    PARTIELLEMENT_PAYEE: { label: 'Partiellement payée', variant: 'warning' },
};

const VARIANT_STYLES: Record<string, string> = {
    success: 'bg-[var(--color-success-100)] text-[var(--color-success-700)]',
    warning: 'bg-[var(--color-warning-100)] text-[var(--color-warning-700)]',
    danger: 'bg-[var(--color-danger-100)] text-[var(--color-danger-700)]',
    info: 'bg-[var(--color-info-100)] text-[var(--color-info-700)]',
    neutral: 'bg-[var(--color-surface-hover)] text-[var(--color-texte-muted)]',
};

export function InvoiceStatus({ status, size = 'sm' }: InvoiceStatusProps) {
    const config = INVOICE_STATUS_MAP[status] || { label: status, variant: 'neutral' as const };
    const sizeClass = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2.5 py-1';

    return (
        <span className={`inline-flex items-center font-medium rounded-full ${VARIANT_STYLES[config.variant]} ${sizeClass}`}>
            {config.label}
        </span>
    );
}

// =============================================
// Exports
// =============================================

export type { PlanCardProps, QuotaGaugeProps, InvoiceStatusProps };
