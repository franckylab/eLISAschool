interface PosteCapaciteIndicatorProps {
    occupantsCount?: number | null;
    nombrePostes: number;
    size?: 'sm' | 'md';
}

export function PosteCapaciteIndicator({ occupantsCount = 0, nombrePostes, size = 'sm' }: PosteCapaciteIndicatorProps) {
    const safeCount = Math.max(0, Number(occupantsCount) || 0);
    const safeTotal = Math.max(1, Number(nombrePostes) || 1);
    const ratio = safeCount / safeTotal;
    const color = ratio >= 1 ? 'bg-destructive' : ratio >= 0.7 ? 'bg-warning' : 'bg-success';
    const h = size === 'sm' ? 'h-1.5' : 'h-2.5';
    const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs';

    return (
        <span className="inline-flex items-center gap-2 min-w-[100px]">
            <span className={`flex-1 ${h} bg-muted rounded-full overflow-hidden`}>
                <span
                    className={`block ${h} ${color} rounded-full transition-all`}
                    style={{ width: `${Math.min(ratio * 100, 100)}%` }}
                />
            </span>
            <span className={`${textSize} text-muted-foreground whitespace-nowrap font-mono`}>
                {safeCount}/{safeTotal}
            </span>
        </span>
    );
}
