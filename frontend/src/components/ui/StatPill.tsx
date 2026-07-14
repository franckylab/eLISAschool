import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { TONE_CLASSES, type CardTone } from './card-variants';
import type { LucideIcon } from 'lucide-react';

export interface StatPillItem {
    icon?: LucideIcon;
    label: string;
    value: string | number;
    tone?: CardTone;
    subtitle?: string;
    onClick?: () => void;
    isActive?: boolean;
}

export interface StatPillProps {
    items: StatPillItem[];
    className?: string;
}

function StatPillButton({ item }: { item: StatPillItem }) {
    const activeTone = TONE_CLASSES[item.tone || 'muted'];
    const Icon = item.icon;

    return (
        <motion.button
            type="button"
            onClick={item.onClick}
            whileTap={{ scale: 0.97 }}
            className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold',
                'transition-all duration-150 whitespace-nowrap relative group',
                activeTone,
                item.isActive && 'ring-2 ring-offset-1 ring-dominant-500 shadow-sm',
                item.onClick && 'cursor-pointer hover:scale-105',
                !item.onClick && 'cursor-default',
            )}
        >
            {Icon && <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />}
            <span className="text-text-muted/70">{item.label}</span>
            <span>{item.value}</span>
            {item.subtitle && (
                <span className="text-[10px] text-text-muted/50 font-normal ml-0.5 hidden sm:inline">
                    {item.subtitle}
                </span>
            )}
        </motion.button>
    );
}

export function StatPill({ items, className }: StatPillProps) {
    return (
        <div
            className={cn(
                'flex flex-wrap items-center gap-2',
                className,
            )}
        >
            {items.map((item, index) => (
                <StatPillButton key={index} item={item} />
            ))}
        </div>
    );
}

export function StatPillScrollable({ items, className }: StatPillProps) {
    return (
        <div
            className={cn(
                'overflow-x-auto scrollbar-hide -mx-2 px-2',
                className,
            )}
        >
            <div className="flex items-center gap-2 min-w-max">
                {items.map((item, index) => (
                    <StatPillButton key={index} item={item} />
                ))}
            </div>
        </div>
    );
}
