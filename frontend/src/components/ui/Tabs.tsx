import { useRef, useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { LucideIcon } from 'lucide-react';

export interface Tab {
    id: string;
    label: string;
    description?: string;
    icon?: LucideIcon;
    count?: number;
    disabled?: boolean;
}

export interface TabsBarProps {
    tabs: Tab[];
    activeTab: string;
    onTabChange: (tabId: string) => void;
    variant?: 'underline' | 'pills' | 'segmented';
    size?: 'sm' | 'md' | 'lg';
    scrollable?: boolean;
    showHeader?: boolean;
    className?: string;
}

const SCROLL_AMOUNT = 200;

const variantStyles = {
    underline: {
        container: 'border-b border-border',
        tab: (isActive: boolean) =>
            isActive
                ? 'bg-dominant-500/10 dark:bg-dominant-500/15 backdrop-blur-sm text-dominant-600 dark:text-dominant-400 border border-dominant-500/20 dark:border-dominant-500/30 border-b-0 rounded-t-lg -mb-px shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:bg-dominant-500/5 dark:hover:bg-dominant-500/10 hover:text-dominant-600 dark:hover:text-dominant-400 border border-transparent border-b-0 rounded-t-lg -mb-px',
        indicator: 'absolute bottom-0 left-0 right-0 h-0.5 bg-dominant-500 dark:bg-dominant-400 rounded-full',
    },
    pills: {
        container: 'bg-dominant-500/5 dark:bg-dominant-500/10 rounded-xl p-1 backdrop-blur-sm',
        tab: (isActive: boolean) =>
            isActive
                ? 'bg-white dark:bg-gray-800 text-dominant-700 dark:text-dominant-300 shadow-sm border border-dominant-200/50 dark:border-dominant-700/50 backdrop-blur-sm'
                : 'text-gray-500 dark:text-gray-400 hover:bg-dominant-500/5 dark:hover:bg-dominant-500/10 hover:text-dominant-600 dark:hover:text-dominant-400',
        indicator: '',
    },
    segmented: {
        container: 'bg-dominant-500/5 dark:bg-dominant-500/10 rounded-xl p-1 backdrop-blur-sm',
        tab: (isActive: boolean) =>
            isActive
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm border border-dominant-200/30 dark:border-dominant-700/30 backdrop-blur-sm'
                : 'text-gray-500 dark:text-gray-400 hover:bg-dominant-500/5 dark:hover:bg-dominant-500/10 hover:text-dominant-600 dark:hover:text-dominant-400',
        indicator: '',
    },
};

const sizeStyles = {
    sm: {
        button: 'px-2.5 py-1.5 text-xs gap-1.5',
        icon: 'h-3.5 w-3.5',
        count: 'text-[10px] px-1.5 py-0.5',
    },
    md: {
        button: 'px-3 py-2 text-sm gap-2',
        icon: 'h-4 w-4',
        count: 'text-xs px-2 py-0.5',
    },
    lg: {
        button: 'px-4 py-2.5 text-base gap-2.5',
        icon: 'h-5 w-5',
        count: 'text-sm px-2.5 py-0.5',
    },
};

function TabButton({
    tab,
    isActive,
    variant,
    size,
    onClick,
}: {
    tab: Tab;
    isActive: boolean;
    variant: 'underline' | 'pills' | 'segmented';
    size: 'sm' | 'md' | 'lg';
    onClick: () => void;
}) {
    const styles = variantStyles[variant];
    const sizes = sizeStyles[size];
    const Icon = tab.icon;

    return (
        <motion.button
            type="button"
            onClick={onClick}
            disabled={tab.disabled}
            whileHover={!tab.disabled ? { scale: 1.02 } : undefined}
            whileTap={!tab.disabled ? { scale: 0.97 } : undefined}
            className={cn(
                'relative inline-flex items-center justify-center whitespace-nowrap font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dominant-500/50',
                sizes.button,
                styles.tab(isActive),
                tab.disabled && 'opacity-40 cursor-not-allowed',
                variant !== 'underline' && 'rounded-lg',
                variant === 'underline' && '-mb-px',
            )}
            role="tab"
            aria-selected={isActive}
            aria-disabled={tab.disabled}
        >
            {Icon && <Icon className={cn('shrink-0', sizes.icon)} aria-hidden="true" />}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
                <span className={cn(
                    'inline-flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 font-medium',
                    sizes.count,
                    isActive && 'bg-dominant-100 dark:bg-dominant-900 text-dominant-700 dark:text-dominant-300',
                )}>
                    {tab.count}
                </span>
            )}
            {variant === 'underline' && isActive && (
                <motion.div
                    layoutId="tab-indicator"
                    className={styles.indicator}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
            )}
        </motion.button>
    );
}

export function TabsBar({
    tabs,
    activeTab,
    onTabChange,
    variant = 'underline',
    size = 'md',
    scrollable = true,
    showHeader = false,
    className,
}: TabsBarProps) {
    const { t } = useTranslation('common');
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const checkScroll = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 4);
        setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
    }, []);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el || !scrollable) return;
        checkScroll();
        el.addEventListener('scroll', checkScroll, { passive: true });
        const observer = new ResizeObserver(checkScroll);
        observer.observe(el);
        return () => {
            el.removeEventListener('scroll', checkScroll);
            observer.disconnect();
        };
    }, [scrollable, checkScroll, tabs.length]);

    const scroll = useCallback((direction: 'left' | 'right') => {
        const el = scrollRef.current;
        if (!el) return;
        el.scrollBy({
            left: direction === 'left' ? -SCROLL_AMOUNT : SCROLL_AMOUNT,
            behavior: 'smooth',
        });
    }, []);

    const styles = variantStyles[variant];
    const currentTab = tabs.find((t) => t.id === activeTab);

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={cn('relative', className)}
        >
            <div className={cn('flex items-center', styles.container)}>
                {scrollable && canScrollLeft && (
                    <motion.button
                        type="button"
                        onClick={() => scroll('left')}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="shrink-0 p-1.5 -ml-1 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-800/40 transition-colors"
                        aria-label={t('a11y.defilerGauche')}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </motion.button>
                )}

                <div
                    ref={scrollRef}
                    className={cn(
                        'flex items-center flex-1',
                        scrollable ? 'overflow-x-auto scrollbar-hide' : '',
                        variant === 'pills' || variant === 'segmented' ? 'gap-1' : 'gap-0',
                    )}
                    role="tablist"
                >
                    {variant === 'underline' ? (
                        <nav className="flex gap-0 -mb-px w-full">
                            {tabs.map((tab) => (
                                <TabButton
                                    key={tab.id}
                                    tab={tab}
                                    isActive={activeTab === tab.id}
                                    variant={variant}
                                    size={size}
                                    onClick={() => onTabChange(tab.id)}
                                />
                            ))}
                        </nav>
                    ) : (
                        <nav className="flex gap-1 w-full">
                            <LayoutGroup>
                                {tabs.map((tab) => (
                                    <TabButton
                                        key={tab.id}
                                        tab={tab}
                                        isActive={activeTab === tab.id}
                                        variant={variant}
                                        size={size}
                                        onClick={() => onTabChange(tab.id)}
                                    />
                                ))}
                            </LayoutGroup>
                        </nav>
                    )}
                </div>

                {scrollable && canScrollRight && (
                    <motion.button
                        type="button"
                        onClick={() => scroll('right')}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="shrink-0 p-1.5 -mr-1 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-800/40 transition-colors"
                        aria-label={t('a11y.defilerDroite')}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </motion.button>
                )}
            </div>

            {showHeader && currentTab && (
                <motion.div
                    key={currentTab.id}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-start gap-2.5 pt-3 pb-1"
                >
                    {currentTab.icon && (
                        <div className="shrink-0 mt-0.5 rounded-lg bg-dominant-500/10 dark:bg-dominant-500/20 p-1.5">
                            <currentTab.icon className="h-[clamp(0.875rem,2vw,1.125rem)] w-[clamp(0.875rem,2vw,1.125rem)] text-dominant-600 dark:text-dominant-400" />
                        </div>
                    )}
                    <div className="min-w-0">
                        <h2 className="text-[var(--text-sm)] font-semibold text-[var(--color-texte)] dark:text-[var(--color-texte)] leading-tight">
                            {currentTab.label}
                        </h2>
                        {currentTab.description && (
                            <p className="text-[var(--text-xs)] text-[var(--color-texte-secondaire)] mt-0.5 leading-relaxed">
                                {currentTab.description}
                            </p>
                        )}
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
}

export interface TabsContentProps {
    activeTab: string;
    children: React.ReactNode;
    className?: string;
    animate?: boolean;
}

export function TabsContent({ activeTab, children, className, animate = true }: TabsContentProps) {
    if (!animate) {
        return <div className={className}>{children}</div>;
    }

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className={className}
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
}
