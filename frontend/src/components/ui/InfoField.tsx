import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface InfoFieldProps {
    label: string;
    value: ReactNode;
    icon?: ReactNode;
    className?: string;
}

export function InfoField({ label, value, icon, className }: InfoFieldProps) {
    return (
        <div className={cn('flex items-start gap-3', className)}>
            {icon && <div className="mt-0.5 shrink-0 text-muted-foreground">{icon}</div>}
            <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-muted-foreground">{label}</p>
                <p className="mt-0.5 truncate text-sm font-medium text-card-foreground">{value ?? '—'}</p>
            </div>
        </div>
    );
}
