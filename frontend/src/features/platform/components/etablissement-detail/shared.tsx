/**
 * ==================================
 * eLISAschool - Composants partages detail etablissement plateforme
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Composants et utilitaires partages entre les 7 onglets
 * de la page detail etablissement du Control Plane.
 */

import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

// =============================================
// Composants de mise en page
// =============================================

export function SectionCard({ title, icon: Icon, children, fullWidth }: {
    title: string;
    icon: LucideIcon;
    children: React.ReactNode;
    fullWidth?: boolean;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl border p-[clamp(1rem,0.8rem+0.5vw,1.5rem)] space-y-[var(--space-md)] ${fullWidth ? 'lg:col-span-2' : ''}`}
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
        >
            <div className="flex items-center gap-[var(--gap-xs)]">
                <Icon className="h-[var(--icon-sm)] w-[var(--icon-sm)]" style={{ color: 'var(--color-dominant-600)' }} />
                <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{title}</h3>
            </div>
            {children}
        </motion.div>
    );
}

export function InfoGrid({ children }: { children: React.ReactNode }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-[var(--gap-sm)]">
            {children}
        </div>
    );
}

export function InfoField({ label, value, icon: Icon, href }: {
    label: string;
    value: React.ReactNode;
    icon?: LucideIcon;
    href?: string;
}) {
    const content = (
        <div className="flex items-start gap-[var(--gap-xs)]">
            {Icon && (
                <Icon
                    className="h-[var(--icon-xs)] w-[var(--icon-xs)] mt-0.5 shrink-0"
                    style={{ color: 'var(--color-text-muted)' }}
                />
            )}
            <div className="min-w-0 flex-1">
                <dt className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>{label}</dt>
                <dd className="text-sm mt-0.5 truncate" style={{ color: 'var(--color-text-primary)' }}>
                    {href ? (
                        <a href={href} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            {value || '—'}
                        </a>
                    ) : (
                        value || '—'
                    )}
                </dd>
            </div>
        </div>
    );
    return content;
}

// =============================================
// Boutons d'action
// =============================================

export function ActionButton({ onClick, children, variant = 'default', loading, icon: Icon }: {
    onClick: () => void;
    children: React.ReactNode;
    variant?: 'default' | 'danger' | 'success';
    loading?: boolean;
    icon?: LucideIcon;
}) {
    const colorMap = {
        default: {
            bg: 'var(--color-surface-alt)',
            border: 'var(--color-border)',
            text: 'var(--color-text-primary)',
            hover: 'var(--color-dominant-50)',
        },
        danger: {
            bg: 'color-mix(in srgb, var(--color-danger-500) 8%, transparent)',
            border: 'color-mix(in srgb, var(--color-danger-500) 20%, transparent)',
            text: 'var(--color-danger-600)',
            hover: 'color-mix(in srgb, var(--color-danger-500) 15%, transparent)',
        },
        success: {
            bg: 'color-mix(in srgb, var(--color-success-500) 8%, transparent)',
            border: 'color-mix(in srgb, var(--color-success-500) 20%, transparent)',
            text: 'var(--color-success-600)',
            hover: 'color-mix(in srgb, var(--color-success-500) 15%, transparent)',
        },
    };
    const colors = colorMap[variant];

    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            disabled={loading}
            className="flex items-center gap-[var(--gap-xs)] px-[var(--space-sm)] py-[var(--space-xs)] rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
            style={{
                backgroundColor: colors.bg,
                border: `1px solid ${colors.border}`,
                color: colors.text,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.hover; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = colors.bg; }}
        >
            {loading ? (
                <div className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : Icon ? (
                <Icon className="h-3 w-3" />
            ) : null}
            {children}
        </motion.button>
    );
}

// =============================================
// Badges
// =============================================

export function ConfigBadge({ label, value }: { label: string; value: string }) {
    return (
        <span
            className="inline-flex items-center gap-1 px-[var(--space-xs)] py-0.5 rounded-md text-xs"
            style={{
                backgroundColor: 'var(--color-surface-alt)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-secondary)',
            }}
        >
            <span style={{ color: 'var(--color-text-muted)' }}>{label}:</span>
            <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{value}</span>
        </span>
    );
}

// =============================================
// Skeletons par onglet
// =============================================

export function TabSkeleton({ variant }: { variant: 'identite' | 'sante' | 'activite' | 'configuration' | 'finances' | 'utilisateurs' | 'journal' }) {
    const skeletonBase = 'rounded-md animate-pulse';

    if (variant === 'identite') {
        return (
            <div className="space-y-[var(--space-lg)]">
                <div className={`${skeletonBase} h-32 w-full`} style={{ backgroundColor: 'var(--color-surface-hover)' }} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--gap-md)]">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className={`${skeletonBase} h-48`} style={{ backgroundColor: 'var(--color-surface-hover)' }} />
                    ))}
                </div>
            </div>
        );
    }

    if (variant === 'sante') {
        return (
            <div className="space-y-[var(--space-lg)]">
                <div className="flex items-center gap-[var(--gap-lg)]">
                    <div className={`${skeletonBase} h-32 w-32 rounded-full`} style={{ backgroundColor: 'var(--color-surface-hover)' }} />
                    <div className="flex-1 space-y-[var(--space-sm)]">
                        <div className={`${skeletonBase} h-6 w-3/4`} style={{ backgroundColor: 'var(--color-surface-hover)' }} />
                        <div className={`${skeletonBase} h-4 w-1/2`} style={{ backgroundColor: 'var(--color-surface-hover)' }} />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--gap-md)]">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className={`${skeletonBase} h-24`} style={{ backgroundColor: 'var(--color-surface-hover)' }} />
                    ))}
                </div>
            </div>
        );
    }

    if (variant === 'activite') {
        return (
            <div className="space-y-[var(--space-lg)]">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-[var(--gap-md)]">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className={`${skeletonBase} h-24`} style={{ backgroundColor: 'var(--color-surface-hover)' }} />
                    ))}
                </div>
                <div className={`${skeletonBase} h-64`} style={{ backgroundColor: 'var(--color-surface-hover)' }} />
            </div>
        );
    }

    if (variant === 'configuration') {
        return (
            <div className="space-y-[var(--space-lg)]">
                <div className={`${skeletonBase} h-48`} style={{ backgroundColor: 'var(--color-surface-hover)' }} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--gap-md)]">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className={`${skeletonBase} h-32`} style={{ backgroundColor: 'var(--color-surface-hover)' }} />
                    ))}
                </div>
            </div>
        );
    }

    if (variant === 'finances') {
        return (
            <div className="space-y-[var(--space-lg)]">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-[var(--gap-md)]">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className={`${skeletonBase} h-24`} style={{ backgroundColor: 'var(--color-surface-hover)' }} />
                    ))}
                </div>
                <div className={`${skeletonBase} h-64`} style={{ backgroundColor: 'var(--color-surface-hover)' }} />
            </div>
        );
    }

    if (variant === 'utilisateurs') {
        return (
            <div className="space-y-[var(--space-lg)]">
                <div className="grid grid-cols-3 gap-[var(--gap-md)]">
                    {[1, 2, 3].map(i => (
                        <div key={i} className={`${skeletonBase} h-20`} style={{ backgroundColor: 'var(--color-surface-hover)' }} />
                    ))}
                </div>
                <div className={`${skeletonBase} h-48`} style={{ backgroundColor: 'var(--color-surface-hover)' }} />
            </div>
        );
    }

    // journal
    return (
        <div className="space-y-[var(--space-lg)]">
            <div className="grid grid-cols-5 gap-[var(--gap-sm)]">
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className={`${skeletonBase} h-16`} style={{ backgroundColor: 'var(--color-surface-hover)' }} />
                ))}
            </div>
            <div className="space-y-[var(--space-sm)]">
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className={`${skeletonBase} h-12`} style={{ backgroundColor: 'var(--color-surface-hover)' }} />
                ))}
            </div>
        </div>
    );
}

// =============================================
// Fonctions utilitaires
// =============================================

export function getScoreColor(score: number): string {
    if (score >= 75) return 'var(--color-success-500)';
    if (score >= 40) return 'var(--color-warning-500)';
    return 'var(--color-danger-500)';
}

export function getTauxColor(taux: number): string {
    if (taux >= 90) return 'var(--color-danger-500)';
    if (taux >= 60) return 'var(--color-warning-500)';
    return 'var(--color-success-500)';
}

export function formatRelativeTime(dateStr: string): string {
    const now = Date.now();
    const date = new Date(dateStr).getTime();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "a l'instant";
    if (minutes < 60) return `il y a ${minutes}min`;
    if (hours < 24) return `il y a ${hours}h`;
    if (days < 7) return `il y a ${days}j`;
    if (days < 30) return `il y a ${Math.floor(days / 7)}sem`;
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}
