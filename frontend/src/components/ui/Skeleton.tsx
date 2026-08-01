/**
 * ==================================
 * eLISAschool - Composant Skeleton de Chargement
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 *
 * Skeleton theme-aware (variables CSS) — dark mode compatible
 * Variants : text, circular, rectangular, card
 * Animations : pulse, wave (shimmer), none
 */

import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular' | 'card';
    width?: string;
    height?: string;
    count?: number;
    animation?: 'pulse' | 'wave' | 'none';
}

/**
 * Composant Skeleton pour les états de chargement
 *
 * @example
 * <Skeleton variant="text" width="w-32" height="h-4" />
 * <Skeleton variant="circular" width="w-12" height="h-12" />
 * <Skeleton variant="card" count={3} />
 */
export function Skeleton({
    className,
    variant = 'text',
    width,
    height,
    count = 1,
    animation = 'pulse',
}: SkeletonProps) {
    const variantClasses = {
        text: 'rounded',
        circular: 'rounded-full',
        rectangular: 'rounded-md',
        card: 'rounded-lg p-[var(--space-md)] space-y-[var(--space-sm)]',
    };

    const dimensionClasses = [
        width && !width.startsWith('w-') ? `w-[${width}]` : width,
        height && !height.startsWith('h-') ? `h-[${height}]` : height,
    ].filter(Boolean).join(' ');

    // Fond theme-aware : surface-hover en pulse, surface en wave
    const bgBase = animation === 'wave'
        ? 'bg-[var(--color-surface)]'
        : 'bg-[var(--color-surface-hover)]';

    if (variant === 'card') {
        return (
            <div className={cn(
                'rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface)] p-[var(--space-md)] space-y-[var(--space-sm)]',
                className,
            )}>
                {Array.from({ length: count }).map((_, index) => (
                    <div key={index} className="space-y-[var(--space-xs)]">
                        <Skeleton animation={animation} className="h-[clamp(0.75rem,2vw,1rem)] w-3/4" />
                        <Skeleton animation={animation} className="h-[clamp(0.625rem,1.5vw,0.75rem)] w-full" />
                        <Skeleton animation={animation} className="h-[clamp(0.625rem,1.5vw,0.75rem)] w-5/6" />
                    </div>
                ))}
            </div>
        );
    }

    // Wave : overlay shimmer via classe CSS
    if (animation === 'wave') {
        return (
            <>
                {Array.from({ length: count }).map((_, index) => (
                    <div
                        key={index}
                        className={cn(
                            'skeleton-wave overflow-hidden rounded',
                            bgBase,
                            variantClasses[variant],
                            dimensionClasses,
                            className,
                        )}
                    />
                ))}
            </>
        );
    }

    // Pulse : animation via Framer Motion (plus fluide que CSS animate-pulse)
    return (
        <>
            {Array.from({ length: count }).map((_, index) => (
                <motion.div
                    key={index}
                    className={cn(
                        'rounded',
                        bgBase,
                        variantClasses[variant],
                        dimensionClasses,
                        className,
                    )}
                    {...(animation === 'pulse' ? {
                        animate: { opacity: [0.5, 1, 0.5] },
                        transition: {
                            duration: 1.5,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        },
                    } : {})}
                />
            ))}
        </>
    );
}

/**
 * Skeleton pour les lignes de tableau (DataTable)
 */
export function TableSkeleton({ rows = 5, columns = 4, showCheckbox = false }: {
    rows?: number;
    columns?: number;
    showCheckbox?: boolean;
}) {
    return (
        <div className="w-full">
            {/* Header */}
            <div className="flex items-center gap-[var(--gap-md)] border-b border-[var(--color-bordure)] px-[var(--space-md)] py-[var(--space-sm)]">
                {showCheckbox && <Skeleton className="h-4 w-4 rounded" animation="wave" />}
                {Array.from({ length: columns }).map((_, i) => (
                    <Skeleton
                        key={`h-${i}`}
                        className="h-[clamp(0.625rem,1.5vw,0.75rem)] flex-1"
                        animation="wave"
                    />
                ))}
            </div>

            {/* Rows */}
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <div
                    key={rowIndex}
                    className="flex items-center gap-[var(--gap-md)] border-b border-[var(--color-bordure)]/50 px-[var(--space-md)] py-[var(--space-sm)]"
                >
                    {showCheckbox && <Skeleton className="h-4 w-4 rounded" />}
                    {Array.from({ length: columns }).map((_, colIndex) => (
                        <Skeleton
                            key={colIndex}
                            className={cn(
                                'h-[clamp(0.625rem,1.5vw,0.875rem)] flex-1',
                                colIndex === 0 && 'w-1/3',
                            )}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
}

/**
 * Skeleton pour les cartes statistiques
 */
export function StatsCardSkeleton({ count = 4 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[var(--gap-md)]">
            {Array.from({ length: count }).map((_, index) => (
                <div
                    key={index}
                    className="rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface)] p-[var(--space-md)] space-y-[var(--space-sm)]"
                >
                    <div className="flex items-center gap-[var(--gap-sm)]">
                        <Skeleton variant="circular" width="w-10" height="h-10" />
                        <Skeleton className="w-24 h-4" />
                    </div>
                    <Skeleton className="w-20 h-[clamp(1.25rem,3vw,1.75rem)]" />
                </div>
            ))}
        </div>
    );
}

/**
 * Skeleton pour une page complète avec header et contenu
 */
export function PageSkeleton({ showHeader = true, showStats = true, showTable = true }: {
    showHeader?: boolean;
    showStats?: boolean;
    showTable?: boolean;
}) {
    return (
        <div className="flex flex-col gap-[var(--gap-lg)] p-[var(--space-lg)]">
            {showHeader && (
                <div className="flex items-center justify-between">
                    <div className="space-y-[var(--space-xs)]">
                        <Skeleton className="w-[clamp(180px,30vw,320px)] h-[clamp(1.25rem,3vw,1.75rem)]" />
                        <Skeleton className="w-[clamp(120px,20vw,240px)] h-4" />
                    </div>
                    <div className="flex gap-[var(--gap-sm)]">
                        <Skeleton className="w-[clamp(60px,10vw,100px)] h-[clamp(2rem,4vw,2.5rem)] rounded-lg" />
                        <Skeleton className="w-[clamp(60px,10vw,100px)] h-[clamp(2rem,4vw,2.5rem)] rounded-lg" />
                    </div>
                </div>
            )}

            {showStats && <StatsCardSkeleton />}

            {showTable && <TableSkeleton />}
        </div>
    );
}

/**
 * Skeleton pour formulaire en modale
 */
export function FormSkeleton({ fields = 6 }: { fields?: number }) {
    return (
        <div className="space-y-[var(--space-md)] p-[var(--space-lg)]">
            {Array.from({ length: fields }).map((_, index) => (
                <div key={index} className="space-y-[var(--space-xs)]">
                    <Skeleton className="w-32 h-4" />
                    <Skeleton className="w-full h-[clamp(2rem,4vw,2.5rem)] rounded-lg" />
                </div>
            ))}
            <div className="flex justify-end gap-[var(--gap-sm)] pt-[var(--space-md)]">
                <Skeleton className="w-24 h-10 rounded-lg" />
                <Skeleton className="w-24 h-10 rounded-lg" />
            </div>
        </div>
    );
}
