/**
 * ==================================
 * eLISAschool - EmptyState
 * ==================================
 * État vide avec illustration, message et action optionnelle
 */

import { type ReactNode } from 'react';
import { FolderOpen } from 'lucide-react';
import { cn } from '@/lib/cn';

interface EmptyStateProps {
    icon?: ReactNode;
    title: string;
    description?: string;
    action?: ReactNode;
    className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
    return (
        <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-surface-hover)]">
                {icon || <FolderOpen className="h-8 w-8 text-[var(--color-texte-secondaire)]" />}
            </div>
            <h3 className="text-lg font-semibold text-[var(--color-texte)]">{title}</h3>
            {description && (
                <p className="mt-2 max-w-sm text-sm text-[var(--color-texte-secondaire)]">
                    {description}
                </p>
            )}
            {action && <div className="mt-6">{action}</div>}
        </div>
    );
}
