import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface ActivityItemProps {
    icon: ReactNode;
    title: string;
    description: string;
    color?: 'blue' | 'green' | 'red' | 'gray';
    className?: string;
}

const COLORS: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    green: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    red: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    gray: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

export function ActivityItem({ icon, title, description, color = 'gray', className }: ActivityItemProps) {
    return (
        <div className={cn('flex items-center gap-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-800/60', className)}>
            <div className={cn('rounded-full p-2', COLORS[color])}>
                {icon}
            </div>
            <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{title}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">{description}</p>
            </div>
        </div>
    );
}
