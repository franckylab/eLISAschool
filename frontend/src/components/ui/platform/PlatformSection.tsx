/**
 * ==================================
 * eLISAschool - Platform Section & KeyValue
 * ==================================
 * Composants de mise en page pour le panel admin plateforme.
 * Ultra-responsifs (clamp) + dark mode (variables CSS).
 *
 * Phase 1 — Refonte Panel Admin Enterprise
 */

import { type ReactNode } from 'react';

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
                    {icon && <span className="text-[var(--color-text-muted)]">{icon}</span>}
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
                className="text-[var(--color-text-muted)]"
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
