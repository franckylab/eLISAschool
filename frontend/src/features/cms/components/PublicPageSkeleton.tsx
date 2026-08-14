/**
 * ==================================
 * eLISAschool - Composant PublicPageSkeleton
 * ==================================
 * Skeleton loading pour les pages publiques.
 * Remplace les spinners dans les routes publiques.
 */

export function PublicPageSkeleton() {
    return (
        <div className="min-h-screen bg-white dark:bg-gray-950">
            {/* Header skeleton */}
            <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/80">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800" />
                        <div className="h-5 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
                    </div>
                    <nav className="hidden items-center gap-6 md:flex">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-4 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-800" style={{ animationDelay: `${i * 100}ms` }} />
                        ))}
                    </nav>
                    <div className="h-9 w-24 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
                </div>
            </header>

            {/* Hero skeleton */}
            <section className="relative overflow-hidden py-20 md:py-32">
                <div className="mx-auto max-w-4xl px-4 text-center">
                    <div className="mx-auto mb-4 h-5 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
                    <div className="mx-auto mb-6 h-10 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
                    <div className="mx-auto mb-4 h-4 w-2/3 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
                    <div className="mx-auto mb-8 h-4 w-1/2 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
                    <div className="flex justify-center gap-4">
                        <div className="h-11 w-36 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
                        <div className="h-11 w-36 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" style={{ animationDelay: '150ms' }} />
                    </div>
                </div>
            </section>

            {/* Content blocks skeleton */}
            <section className="py-16">
                <div className="mx-auto max-w-6xl px-4">
                    {[1, 2, 3].map(block => (
                        <div key={block} className="mb-12">
                            <div className="mx-auto mb-6 h-7 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-800" style={{ animationDelay: `${block * 200}ms` }} />
                            <div className="grid gap-6 md:grid-cols-3">
                                {[1, 2, 3].map(card => (
                                    <div key={card} className="rounded-xl border border-gray-100 p-6 dark:border-gray-800">
                                        <div className="mb-4 h-12 w-12 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800" />
                                        <div className="mb-2 h-5 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
                                        <div className="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
                                        <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer skeleton */}
            <footer className="border-t border-gray-100 bg-gray-50 py-12 dark:border-gray-800 dark:bg-gray-900">
                <div className="mx-auto max-w-6xl px-4">
                    <div className="grid gap-8 md:grid-cols-3">
                        {[1, 2, 3].map(col => (
                            <div key={col}>
                                <div className="mb-4 h-5 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
                                {[1, 2, 3].map(item => (
                                    <div key={item} className="mb-2 h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </footer>
        </div>
    );
}
