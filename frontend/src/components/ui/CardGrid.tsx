import React from 'react';
import { motion, type Variants } from 'framer-motion';
import { cn } from '@/lib/cn';
import { Skeleton } from './Skeleton';

export interface CardGridColumns {
    default?: number;
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    '2xl'?: number;
}

export interface CardGridProps {
    children?: React.ReactNode;
    columns?: CardGridColumns;
    className?: string;
    loading?: boolean;
    skeletonCount?: number;
    staggerDelay?: number;
}

const gridCols: Record<string, (n: number) => string> = {
    default: (n) => `grid-cols-${n}`,
    xs: (n) => `xs:grid-cols-${n}`,
    sm: (n) => `sm:grid-cols-${n}`,
    md: (n) => `md:grid-cols-${n}`,
    lg: (n) => `lg:grid-cols-${n}`,
    xl: (n) => `xl:grid-cols-${n}`,
    '2xl': (n) => `2xl:grid-cols-${n}`,
};

function buildGridClass(columns: CardGridColumns): string {
    return Object.entries(columns)
        .map(([bp, n]) => {
            const fn = gridCols[bp];
            return fn ? fn(n) : '';
        })
        .filter(Boolean)
        .join(' ');
}

const containerVariants: Variants = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.08,
        },
    },
};

const childVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.4, ease: 'easeOut' },
    },
};

function CardGridSkeleton({ count = 4, columns }: { count?: number; columns: CardGridColumns }) {
    return (
        <div className={cn('grid gap-4', buildGridClass(columns))}>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3">
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

export function CardGrid({
    children,
    columns = { default: 1, sm: 2, lg: 4 },
    className,
    loading,
    skeletonCount = 4,
    staggerDelay = 0.08,
}: CardGridProps) {
    if (loading) {
        return <CardGridSkeleton count={skeletonCount} columns={columns} />;
    }

    const cols = buildGridClass(columns);

    return (
        <motion.div
            className={cn('grid gap-4', cols, className)}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {React.Children.map(children, (child, i) => (
                <motion.div
                    key={i}
                    variants={childVariants}
                    transition={{ delay: i * staggerDelay }}
                >
                    {child}
                </motion.div>
            ))}
        </motion.div>
    );
}
