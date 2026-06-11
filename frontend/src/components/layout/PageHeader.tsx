/**
 * ==================================
 * eLISAschool - PageHeader
 * ==================================
 * En-tête de page avec titre, description et actions
 */

import { type ReactNode } from 'react';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { cn } from '@/lib/cn';

interface PageHeaderProps {
    title: string;
    description?: string;
    actions?: ReactNode;
    showBreadcrumbs?: boolean;
    className?: string;
}

export function PageHeader({
    title,
    description,
    actions,
    showBreadcrumbs = true,
    className,
}: PageHeaderProps) {
    return (
        <div className={cn('mb-6', className)}>
            {showBreadcrumbs && <Breadcrumbs />}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--color-texte)]">{title}</h1>
                    {description && (
                        <p className="mt-1 text-sm text-[var(--color-texte-secondaire)]">
                            {description}
                        </p>
                    )}
                </div>
                {actions && (
                    <div className="flex items-center gap-3">{actions}</div>
                )}
            </div>
        </div>
    );
}
