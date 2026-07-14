export type CardTone =
    | 'dominant'
    | 'accent'
    | 'success'
    | 'danger'
    | 'warning'
    | 'info'
    | 'muted'
    | 'purple'
    | 'orange';

export const TONE_CLASSES: Record<CardTone, string> = {
    dominant: 'bg-dominant-600/10 text-dominant-700 dark:text-dominant-500 border-dominant-600/20',
    accent: 'bg-accent-600/10 text-accent-700 dark:text-accent-500 border-accent-600/20',
    success: 'bg-success/10 text-success border-success/20',
    danger: 'bg-danger/10 text-danger border-danger/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    info: 'bg-info/10 text-info border-info/20',
    muted: 'bg-surface-alt/40 text-text-secondary border-border',
    purple: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    orange: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
};

export interface TrendData {
    value: number;
    isPositive: boolean;
}

export interface BaseCardProps {
    className?: string;
    children?: React.ReactNode;
    tone?: CardTone;
}
