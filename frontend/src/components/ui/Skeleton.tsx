/**
 * ==================================
 * eLISAschool - Composant Skeleton de Chargement
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

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
    const baseClasses = 'bg-gray-200 rounded-md overflow-hidden';
    
    const variantClasses = {
        text: 'rounded',
        circular: 'rounded-full',
        rectangular: 'rounded-md',
        card: 'rounded-lg p-4 space-y-3',
    };

    const dimensionClasses = [
        width && !width.startsWith('w-') ? `w-[${width}]` : width,
        height && !height.startsWith('h-') ? `h-[${height}]` : height,
    ].filter(Boolean).join(' ');

    const animationClass = animation === 'pulse' ? 'animate-pulse' : '';

    if (variant === 'card') {
        return (
            <div className={cn(baseClasses, variantClasses.card, className)}>
                {Array.from({ length: count }).map((_, index) => (
                    <div key={index} className="space-y-2">
                        <div className={cn(baseClasses, 'h-4 w-3/4', animationClass)} />
                        <div className={cn(baseClasses, 'h-3 w-full', animationClass)} />
                        <div className={cn(baseClasses, 'h-3 w-5/6', animationClass)} />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <>
            {Array.from({ length: count }).map((_, index) => (
                <motion.div
                    key={index}
                    className={cn(
                        baseClasses,
                        variantClasses[variant],
                        dimensionClasses,
                        animationClass,
                        className
                    )}
                    {...(animation === 'wave' ? {
                        animate: {
                            opacity: [0.5, 1, 0.5],
                        },
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
 * Skeleton pour les lignes de tableau
 */
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
    return (
        <div className="w-full space-y-2">
            {/* Header */}
            <div className="flex gap-4 p-3 bg-gray-100 rounded-lg">
                {Array.from({ length: columns }).map((_, i) => (
                    <Skeleton key={i} className="flex-1 h-4" />
                ))}
            </div>
            
            {/* Rows */}
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <div key={rowIndex} className="flex gap-4 p-3 border-b border-gray-100">
                    {Array.from({ length: columns }).map((_, colIndex) => (
                        <Skeleton key={colIndex} className="flex-1 h-4" />
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: count }).map((_, index) => (
                <div key={index} className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
                    <div className="flex items-center gap-3">
                        <Skeleton variant="circular" width="w-10" height="h-10" />
                        <Skeleton className="w-24 h-4" />
                    </div>
                    <Skeleton className="w-20 h-8" />
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
        <div className="flex flex-col gap-6 p-6">
            {showHeader && (
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <Skeleton className="w-64 h-8" />
                        <Skeleton className="w-48 h-4" />
                    </div>
                    <div className="flex gap-2">
                        <Skeleton className="w-24 h-10" />
                        <Skeleton className="w-24 h-10" />
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
        <div className="space-y-4 p-6">
            {Array.from({ length: fields }).map((_, index) => (
                <div key={index} className="space-y-2">
                    <Skeleton className="w-32 h-4" />
                    <Skeleton className="w-full h-10" />
                </div>
            ))}
            <div className="flex justify-end gap-2 pt-4">
                <Skeleton className="w-24 h-10" />
                <Skeleton className="w-24 h-10" />
            </div>
        </div>
    );
}
