/**
 * ==================================
 * eLISAschool — Platform Skeleton Loading
 * ==================================
 * Composants de chargement skeleton pour les pages plateforme.
 * Utilisés pendant le fetch des données (React Query isLoading).
 */

/**
 * Skeleton générique — bloc rectangulaire animé
 */
export function SkeletonBlock({ className = '', height = 'h-4' }: { className?: string; height?: string }) {
    return (
        <div
            className={`rounded-md animate-pulse ${height} ${className}`}
            style={{ backgroundColor: 'var(--color-surface-hover)' }}
        />
    );
}

/**
 * Skeleton pour une carte KPI
 */
export function SkeletonKpiCard() {
    return (
        <div className="rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-[var(--space-md)] space-y-[var(--space-sm)]">
            <div className="flex items-center justify-between">
                <SkeletonBlock height="h-3" className="w-24" />
                <SkeletonBlock height="h-8 w-8" className="rounded-md" />
            </div>
            <SkeletonBlock height="h-7" className="w-20" />
            <SkeletonBlock height="h-3" className="w-16" />
        </div>
    );
}

/**
 * Skeleton pour une ligne de tableau
 */
export function SkeletonTableRow({ columns = 5 }: { columns?: number }) {
    return (
        <tr className="border-b border-[var(--color-bordure)]">
            {Array.from({ length: columns }).map((_, i) => (
                <td key={i} className="px-[var(--space-md)] py-[var(--space-sm)]">
                    <SkeletonBlock height="h-4" className={`w-${['16', '24', '20', '12', '16'][i % 5] || '20'}`} />
                </td>
            ))}
        </tr>
    );
}

/**
 * Skeleton pour une section complète
 */
export function SkeletonSection({ rows = 3, title = true }: { rows?: number; title?: boolean }) {
    return (
        <div className="rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] overflow-hidden">
            {title && (
                <div className="p-[var(--space-md)] border-b border-[var(--color-bordure)]">
                    <SkeletonBlock height="h-5" className="w-40" />
                </div>
            )}
            <div className="p-[var(--space-md)] space-y-[var(--space-sm)]">
                {Array.from({ length: rows }).map((_, i) => (
                    <SkeletonBlock key={i} height="h-4" className={`w-${['full', '3/4', '5/6', '2/3'][i % 4] || 'full'}`} />
                ))}
            </div>
        </div>
    );
}

/**
 * Skeleton pour le dashboard plateforme complet
 */
export function PlatformDashboardSkeleton() {
    return (
        <div className="p-[var(--space-lg)] space-y-[var(--space-lg)]">
            {/* Header skeleton */}
            <div className="flex items-center gap-[var(--gap-sm)]">
                <SkeletonBlock height="h-10 w-10" className="rounded-lg" />
                <div className="space-y-[var(--space-xs)]">
                    <SkeletonBlock height="h-6" className="w-48" />
                    <SkeletonBlock height="h-3" className="w-64" />
                </div>
            </div>
            {/* KPI cards skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[var(--gap-md)]">
                {Array.from({ length: 4 }).map((_, i) => <SkeletonKpiCard key={i} />)}
            </div>
            {/* Sections skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-[var(--gap-md)]">
                <SkeletonSection rows={5} />
                <SkeletonSection rows={5} />
            </div>
        </div>
    );
}
