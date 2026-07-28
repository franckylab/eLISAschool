import type { ReactNode } from 'react';

interface SectionSeparatorProps {
    title?: string;
    icon?: ReactNode;
}

export function SectionSeparator({ title, icon }: SectionSeparatorProps = {}) {
    if (!title) {
        return <div className="border-b border-[var(--color-bordure)]" />;
    }
    return (
        <div className="flex items-center gap-2 pb-2 border-b border-[var(--color-bordure)]">
            {icon && <span className="text-[var(--color-dominant-600)]">{icon}</span>}
            <span className="text-sm font-semibold text-[var(--color-text-primary)]">{title}</span>
        </div>
    );
}
