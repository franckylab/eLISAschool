/**
 * ==================================
 * eLISAschool - ListLoading
 * ==================================
 * Skeleton de chargement pour les listes avec animation
 */

import { cn } from '@/lib/cn';

interface ListLoadingProps {
    rows?: number;
    className?: string;
    showAvatar?: boolean;
}

export function ListLoading({ rows = 5, className, showAvatar = true }: ListLoadingProps) {
    return (
        <div className={cn('space-y-3', className)}>
            {Array.from({ length: rows }).map((_, i) => (
                <div
                    key={i}
                    className="flex items-center gap-4 rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface)] p-4"
                >
                    {showAvatar && (
                        <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-[var(--color-surface-hover)]" />
                    )}
                    <div className="flex-1 space-y-2">
                        <div className="h-4 w-3/4 animate-pulse rounded bg-[var(--color-surface-hover)]" />
                        <div className="h-3 w-1/2 animate-pulse rounded bg-[var(--color-surface-hover)]" />
                    </div>
                    <div className="h-8 w-8 animate-pulse rounded bg-[var(--color-surface-hover)]" />
                </div>
            ))}
        </div>
    );
}
