import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface SettingsRowProps {
    title: string;
    description: string;
    action: ReactNode;
    className?: string;
}

export function SettingsRow({ title, description, action, className }: SettingsRowProps) {
    return (
        <div className={cn('flex items-center justify-between rounded-lg bg-gray-50 p-4 dark:bg-gray-800/60', className)}>
            <div className="min-w-0 flex-1 mr-4">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{title}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{description}</p>
            </div>
            <div className="shrink-0">{action}</div>
        </div>
    );
}
