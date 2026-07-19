import { type ReactNode, type ElementType, useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/cn';

const sizeMap = {
    xs: 'clamp(0.6875rem, 0.65rem + 0.15vw, 0.8125rem)',
    sm: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)',
    md: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)',
    lg: 'clamp(0.875rem, 0.8rem + 0.3vw, 1rem)',
} as const;

interface TextLabelProps {
    children: ReactNode;
    as?: ElementType;
    size?: keyof typeof sizeMap;
    weight?: 'medium' | 'semibold' | 'bold';
    truncate?: boolean;
    tooltip?: string;
    className?: string;
}

export function TextLabel({
    children,
    as: Tag = 'span',
    size = 'sm',
    weight = 'semibold',
    truncate = true,
    tooltip,
    className,
}: TextLabelProps) {
    const ref = useRef<HTMLElement>(null);
    const [isTruncated, setIsTruncated] = useState(false);

    useEffect(() => {
        if (!truncate || !ref.current) return;
        const el = ref.current;
        const check = () => setIsTruncated(el.scrollWidth > el.clientWidth + 1);
        check();
        const ro = new ResizeObserver(check);
        ro.observe(el);
        return () => ro.disconnect();
    }, [truncate, children]);

    const text =
        tooltip ??
        (typeof children === 'string' ? children : undefined);

    const showTooltip = truncate && isTruncated && text;

    return (
        <Tag
            ref={ref}
            title={showTooltip ? text : undefined}
            className={cn(
                'text-[var(--color-text-strong)]',
                truncate && 'truncate',
                className,
            )}
            style={{ fontSize: sizeMap[size], fontWeight: weight === 'bold' ? 700 : weight === 'semibold' ? 600 : 500 }}
        >
            {children}
        </Tag>
    );
}