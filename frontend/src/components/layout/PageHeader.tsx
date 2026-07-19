import { type ReactNode, Children, Fragment, isValidElement, cloneElement } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ChevronLeft } from 'lucide-react';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { cn } from '@/lib/cn';
import type { CardTone } from '@/components/ui/card-variants';

/**
 * Gradients opaques via inline style.
 * Les tons `dominant` et `accent` utilisent les alias de thème (`--color-dominante`, `--color-accent`)
 * qui s'adaptent au dark mode (contrairement aux paliers numériques fixes).
 */
const TONE_GRADIENT_BG: Record<CardTone, string> = {
    dominant: 'linear-gradient(135deg, var(--color-dominante), var(--color-dominant-800))',
    accent: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-800))',
    success: 'linear-gradient(135deg, #059669, #115e59)',
    danger: 'linear-gradient(135deg, #dc2626, #9f1239)',
    warning: 'linear-gradient(135deg, #d97706, #9a3412)',
    info: 'linear-gradient(135deg, #0891b2, #1e40af)',
    muted: 'linear-gradient(135deg, #4b5563, #1e293b)',
    purple: 'linear-gradient(135deg, #9333ea, #3730a3)',
    orange: 'linear-gradient(135deg, #ea580c, #991b1b)',
};

const TONE_ICON_BG: Record<CardTone, string> = {
    dominant: 'bg-dominant-50',
    accent: 'bg-accent-50',
    success: 'bg-emerald-50',
    danger: 'bg-red-50',
    warning: 'bg-amber-50',
    info: 'bg-cyan-50',
    muted: 'bg-gray-50',
    purple: 'bg-purple-50',
    orange: 'bg-orange-50',
};

const TONE_ICON_COLOR: Record<CardTone, string> = {
    dominant: 'text-dominant-600',
    accent: 'text-accent-600',
    success: 'text-emerald-600',
    danger: 'text-red-600',
    warning: 'text-amber-600',
    info: 'text-cyan-600',
    muted: 'text-gray-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600',
};

const TONE_GRADIENT_TEXT: Record<CardTone, string> = {
    dominant: 'text-dominant-200',
    accent: 'text-accent-200',
    success: 'text-emerald-200',
    danger: 'text-red-200',
    warning: 'text-amber-200',
    info: 'text-cyan-200',
    muted: 'text-gray-200',
    purple: 'text-purple-200',
    orange: 'text-orange-200',
};

interface MetadataItem {
    label: string;
    value: string;
    icon?: ReactNode;
    color?: CardTone;
}

interface StatusBadge {
    label: string;
    variant: 'success' | 'warning' | 'danger' | 'info';
}

interface PageHeaderProps {
    title?: string;
    /** @deprecated Utilisez `subtitle` */
    description?: string;
    subtitle?: string;
    variant?: 'simple' | 'gradient';
    tone?: CardTone;
    icon?: LucideIcon;
    iconContainerClass?: string;
    metadata?: MetadataItem[];
    status?: StatusBadge;
    actions?: ReactNode;
    onBack?: () => void;
    showBreadcrumbs?: boolean;
    breadcrumbLabel?: string;
    className?: string;
    children?: ReactNode;
}

/**
 * Applique récursivement un style glass-morphism aux boutons dans un entête gradient.
 * - Traverse les conteneurs (div) pour styler les boutons individuellement
 * - `!important` sur toutes les classes pour overwriter les variants (outline/danger/primary)
 * - Bouton normal → verre blanc profond (contraste élevé sur fond gradient)
 * - Bouton danger → verre teinté rouge (alerte sans clash visuel)
 * - `!backdrop-blur-sm` pour l'effet frost
 * - `active:!scale-[0.97]` pour le feedback tactile
 */
function gradientActionStyle(element: ReactNode): ReactNode {
    if (!isValidElement(element)) return element;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const props = element.props as any;

    // Conteneur HTML (div, span) → récursion dans les enfants
    if (typeof element.type === 'string') {
        const children = props?.children;
        const newChildren = children
            ? Children.map(children, gradientActionStyle)
            : children;
        return cloneElement(element as any, {
            ...props,
            children: newChildren,
        });
    }

    // Fragment (<>...</>) → récursion directe dans les enfants (évite de coller des classes à un Fragment)
    if (element.type === Fragment) {
        const children = props?.children;
        return children ? Children.map(children, gradientActionStyle) : children;
    }

    // Composant React (ElisaButton) → appliquer le glass-morphism
    const existing = props?.className || '';
    const isDanger = existing.includes('error') || existing.includes('red') || existing.includes('danger');

    const glass = isDanger
        ? '!bg-red-500/55 hover:!bg-red-500/70 !text-white !border-red-300/25 active:!scale-[0.97]'
        : '!bg-white/20 hover:!bg-white/35 !text-white !border-white/25 active:!bg-white/45 active:!scale-[0.97]';

    return cloneElement(element as any, {
        className: `${existing} ${glass} !backdrop-blur-sm !shadow-sm transition-all duration-150`,
    });
}

function StatusBadgeInner({ label, variant }: StatusBadge) {
    const colorMap = {
        success: 'bg-green-400/20 text-green-200',
        warning: 'bg-amber-400/20 text-amber-200',
        danger: 'bg-red-400/20 text-red-200',
        info: 'bg-blue-400/20 text-blue-200',
    };
    return (
        <span className={`inline-flex items-center gap-[clamp(0.25rem,0.75vw,0.375rem)] px-[clamp(0.5rem,1.5vw,0.75rem)] py-[clamp(0.125rem,0.3vw,0.125rem)] rounded-full text-[var(--text-xs)] font-medium ${colorMap[variant]}`}>
            <span className="h-[clamp(0.375rem,1vw,0.375rem)] w-[clamp(0.375rem,1vw,0.375rem)] rounded-full bg-current" />
            {label}
        </span>
    );
}

const backgroundSvgPaths: Record<string, string[]> = {
    Users: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'],
    Shield: ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'],
    GraduationCap: ['M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z', 'M22 10v6', 'M6 12.5V16a6 3 0 0 0 12 0v-3.5'],
    Group: ['M3 7V5c0-1.1.9-2 2-2h2', 'M17 3h2c1.1 0 2 .9 2 2v2', 'M21 17v2c0 1.1-.9 2-2 2h-2', 'M7 21H5c-1.1 0-2-.9-2-2v-2', 'M7 7h7v5H7z', 'M10 12h7v5H10z'],
    User: ['M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2', 'M12 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'],
    BookOpen: ['M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z', 'M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z'],
    Brain: ['M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z', 'M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z', 'M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4', 'M17.599 6.5a3 3 0 0 0 .399-1.375', 'M6.003 5.125A3 3 0 0 0 6.401 6.5', 'M3.477 10.896a4 4 0 0 1 .585-.396', 'M19.938 10.5a4 4 0 0 1 .585.396', 'M6 18a4 4 0 0 1-1.967-.516', 'M19.967 17.484A4 4 0 0 1 18 18'],
    Building2: ['M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z', 'M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2', 'M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2', 'M10 6h4', 'M10 10h4', 'M10 14h4', 'M10 18h4'],
    Calendar: ['M8 2v4', 'M16 2v4', 'M3 8h18', 'M21 10v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8z'],
    Briefcase: ['M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16', 'M2 20h20', 'M4 20V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12'],
    Settings: ['M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z', 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z'],
    Activity: ['M22 12h-4l-3 9L9 3l-3 9H2'],
    AlertTriangle: ['M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z', 'M12 9v4', 'M12 17h.01'],
    Lock: ['M18 8h-1V6a5 5 0 0 0-10 0v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2z', 'M12 16a2 2 0 1 0 0-4 2 2 0 0 0 0 4z', 'M12 16v2'],
    Medal: ['M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15', 'M11 12 5.12 2.2', 'm13 12 5.88-9.8', 'M8 7h8', 'M12 12A5 5 0 1 1 12 22A5 5 0 1 1 12 12', 'M12 18v-2h-.5'],
    Star: ['M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'],
    Clock: ['M12 2v4', 'M12 18v4', 'M4.93 4.93l2.83 2.83', 'M16.24 16.24l2.83 2.83', 'M2 12h4', 'M18 12h4', 'M4.93 19.07l2.83-2.83', 'M16.24 7.76l2.83-2.83'],
    ClockArrowUp: ['M13.228 21.925A10 10 0 1 1 21.994 12.338', 'M12 6v6l1.562.781', 'm14 18 4-4 4 4', 'M18 22v-8'],
    Ban: ['M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z', 'm4.93 4.93 14.14 14.14'],
    FileBadge2: ['M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z', 'M12 7A3 3 0 1 1 12 13A3 3 0 1 1 12 7', 'M14 2v4a2 2 0 0 0 2 2h4', 'm14 12.5 1 5.5-3-1-3 1 1-5.5'],
    Gauge: ['m12 14 4-4', 'M3.34 19a10 10 0 1 1 17.32 0'],
    IterationCcw: ['M20 10c0-4.4-3.6-8-8-8s-8 3.6-8 8 3.6 8 8 8h8', 'M16 14L20 18L16 22'],
};

export function PageHeader({
    title,
    description,
    subtitle = description,
    variant = 'simple',
    tone = 'dominant',
    icon: Icon,
    metadata,
    status,
    actions,
    onBack,
    showBreadcrumbs = true,
    breadcrumbLabel,
    className,
    children,
}: PageHeaderProps) {
    const ICON_SIZE = 'h-[clamp(1.75rem,6vw,2.5rem)] w-[clamp(1.75rem,6vw,2.5rem)]';
    const ICON_SM_SIZE = 'h-[clamp(1.25rem,4vw,2rem)] w-[clamp(1.25rem,4vw,2rem)]';
    const CHEVRON_SIZE = 'h-[clamp(0.875rem,3vw,1.25rem)] w-[clamp(0.875rem,3vw,1.25rem)]';
    const PADDING_CONTAINER = 'p-[clamp(1rem,4vw,2rem)]';
    const PADDING_ICON = 'p-[clamp(0.75rem,2.5vw,1rem)]';
    const PADDING_BACK = 'p-[clamp(0.375rem,1.5vw,0.5rem)]';
    const GAP_MAIN = 'gap-[clamp(0.75rem,3vw,1.25rem)]';
    const PADDING_ACTIONS = 'p-[clamp(0.375rem,1.5vw,0.5rem)]';

    if (variant === 'gradient') {
        const paths = Icon
            ? backgroundSvgPaths[Icon.displayName ?? Icon.name ?? '']
            : undefined;
        return (
            <div className={cn('relative overflow-hidden rounded-2xl mb-8', PADDING_CONTAINER, className)} style={{ background: TONE_GRADIENT_BG[tone] }}>
                {showBreadcrumbs && <Breadcrumbs inverted currentLabel={breadcrumbLabel || title} />}
                {Icon && paths && (
                    <div className="absolute top-0 right-0 w-[clamp(12rem,40vw,16rem)] h-[clamp(12rem,40vw,16rem)] opacity-10 pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full text-white">
                            {paths.map((d) => (
                                <path key={d} d={d} />
                            ))}
                        </svg>
                    </div>
                )}
                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-[clamp(0.75rem,3vw,1.25rem)]">
                    {children ? (
                        <div className={cn('flex items-center flex-1 min-w-0', GAP_MAIN)}>
                            {onBack && (
                                <button onClick={onBack} className={cn('-ml-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors shrink-0', PADDING_BACK)}>
                                    <ChevronLeft className={CHEVRON_SIZE} />
                                </button>
                            )}
                            {children}
                        </div>
                    ) : (
                        <div className={cn('flex items-center flex-wrap', GAP_MAIN)}>
                            {onBack && (
                                <button onClick={onBack} className={cn('-ml-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors shrink-0', PADDING_BACK)}>
                                    <ChevronLeft className={CHEVRON_SIZE} />
                                </button>
                            )}
                            {Icon && (
                                <div className={cn('bg-white/20 backdrop-blur-sm rounded-2xl shrink-0', PADDING_ICON)}>
                                    <Icon className={ICON_SIZE} />
                                </div>
                            )}
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-[clamp(0.5rem,2vw,0.75rem)] flex-wrap">
                                    <h1 className="text-[var(--text-3xl)] font-bold text-white leading-tight">{title}</h1>
                                    {status && <StatusBadgeInner {...status} />}
                                </div>
                                {subtitle && (
                                    <p className={cn('mt-1 text-[var(--text-sm)]', TONE_GRADIENT_TEXT[tone])}>{subtitle}</p>
                                )}
                                {metadata && (
                                    <div className="flex items-center gap-[clamp(0.5rem,2vw,0.75rem)] flex-wrap mt-2">
                                        {metadata.map((item, i) => (
                                            <span key={i} className={cn('inline-flex items-center gap-[clamp(0.25rem,0.75vw,0.375rem)] text-[var(--text-sm)]', TONE_GRADIENT_TEXT[tone])}>
                                                {item.icon && <span className={cn('h-[clamp(0.75rem,2vw,0.875rem)] w-[clamp(0.75rem,2vw,0.875rem)]')}>{item.icon}</span>}
                                                <span className="font-mono">{item.value}</span>
                                                {i < metadata.length - 1 && <span className="opacity-40">•</span>}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    {actions && (
                        <div className={cn('flex flex-wrap items-center gap-[clamp(0.375rem,1.5vw,0.5rem)] shrink-0 w-full sm:w-auto rounded-xl bg-white/10 backdrop-blur-md border border-white/15', PADDING_ACTIONS)}>
                            {Children.map(actions, gradientActionStyle)}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className={cn('mb-6', className)}>
            {showBreadcrumbs && <Breadcrumbs currentLabel={breadcrumbLabel} />}
            <div className="flex flex-col gap-[clamp(0.75rem,3vw,1rem)] sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-[clamp(0.75rem,3vw,1rem)] min-w-0">
                    {onBack && (
                        <button onClick={onBack} className={cn('rounded-lg hover:bg-[var(--color-surface-hover)] text-[var(--color-texte-secondaire)] hover:text-[var(--color-texte)] transition-colors mt-1 shrink-0', PADDING_BACK)}>
                            <ChevronLeft className={CHEVRON_SIZE} />
                        </button>
                    )}
                    {Icon && (
                        <div className={cn('p-[clamp(0.5rem,2vw,0.75rem)] rounded-xl shrink-0', TONE_ICON_BG[tone])}>
                            <Icon className={cn(ICON_SM_SIZE, TONE_ICON_COLOR[tone])} />
                        </div>
                    )}
                    <div className="min-w-0">
                        <h1 className="text-[var(--text-2xl)] font-bold text-[var(--color-texte)] truncate">{title}</h1>
                        {subtitle && (
                            <p className="mt-1 text-[var(--text-sm)] text-[var(--color-texte-secondaire)]">{subtitle}</p>
                        )}
                        {metadata && (
                            <div className="flex flex-wrap items-center gap-[clamp(0.5rem,2vw,0.75rem)] mt-2 text-[var(--text-sm)] text-[var(--color-texte-secondaire)]">
                                {metadata.map((item, i) => (
                                    <span key={i} className="inline-flex items-center gap-[clamp(0.25rem,0.75vw,0.375rem)]">
                                        {item.icon && <span className="h-[clamp(0.75rem,2vw,0.875rem)] w-[clamp(0.75rem,2vw,0.875rem)]">{item.icon}</span>}
                                        {item.value}
                                    </span>
                                ))}
                            </div>
                        )}
                        {children}
                    </div>
                </div>
                {actions && (
                    <div className="flex items-center gap-[clamp(0.5rem,2vw,0.75rem)] shrink-0 flex-wrap">{actions}</div>
                )}
            </div>
        </div>
    );
}
