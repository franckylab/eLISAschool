/**
 * ConfigModuleCard — Carte d'un module dans la configuration
 * Composant réutilisable (fusion P1.2 — renommé depuis ModuleCard.tsx)
 */
import { cn } from '@/lib/cn';
import {
    Shield, Users, Settings, Bell, MessageSquare, FileText, CircleHelp,
    Megaphone, GraduationCap, FileSpreadsheet, CalendarDays, Calendar,
    UserCheck, Compass, BookOpen, Utensils, Bus, Car, Package, CreditCard,
    Users2, Trophy, FolderOpen, Printer, UserCog, Heart, BarChart2,
    Activity, Usb, Building2, UserPlus, LayoutDashboard, DoorOpen,
    GitBranch, Lock, Unlock, ChevronRight, type LucideIcon,
} from 'lucide-react';
import type { ModuleRegistryEntry } from '@/features/configuration/types/configuration.types';

const ICON_MAP: Record<string, LucideIcon> = {
    Shield, Users, Settings, Bell, MessageSquare, FileText, CircleHelp,
    Megaphone, GraduationCap, FileSpreadsheet, CalendarDays, Calendar,
    UserCheck, Compass, BookOpen, Utensils, Bus, Car, Package, CreditCard,
    Users2, Trophy, FolderOpen, Printer, UserCog, Heart, BarChart2,
    Activity, Usb, Building2, UserPlus, LayoutDashboard, DoorOpen, GitBranch,
};

export interface ConfigModuleCardProps {
    module: ModuleRegistryEntry;
    actif: boolean;
    onToggle?: (code: string, actif: boolean) => void;
    onClick?: (code: string) => void;
    isToggling?: boolean;
    /** Mode compact pour grilles denses */
    compact?: boolean;
    className?: string;
}

const CATEGORIE_STYLES: Record<string, string> = {
    GRATUIT: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    PAYANT: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
};

// Refonte v3 — catégories binaires
const CATEGORIE_LABELS: Record<string, string> = {
    GRATUIT: 'Gratuit',
    PAYANT: 'Payant',
};

export function ConfigModuleCard({
    module,
    actif,
    onToggle,
    onClick,
    isToggling = false,
    compact = false,
    className,
}: ConfigModuleCardProps) {
    const Icon = ICON_MAP[module.icon] || Package;
    const isBase = module.category === 'GRATUIT';
    const isLocked = module.estAccessible === false;

    return (
        <div
            className={cn(
                'group relative rounded-xl border transition-all duration-200',
                'bg-white dark:bg-zinc-900/80',
                isLocked
                    ? 'border-zinc-200 dark:border-zinc-800 opacity-70'
                    : actif
                        ? 'border-emerald-500/30 shadow-sm shadow-emerald-500/5'
                        : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700',
                onClick && 'cursor-pointer',
                compact ? 'p-3' : 'p-4',
                className,
            )}
            onClick={() => onClick?.(module.name)}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
        >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
                <div className={cn('flex items-center gap-3', compact && 'gap-2')}>
                    <div
                        className={cn(
                            'flex items-center justify-center rounded-lg border',
                            compact ? 'h-8 w-8' : 'h-10 w-10',
                            isLocked
                                ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-400'
                                : actif
                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                    : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500',
                        )}
                    >
                        {isLocked ? (
                            <Lock className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
                        ) : (
                            <Icon className={compact ? 'h-4 w-4' : 'h-5 w-5'} />
                        )}
                    </div>
                    <div className="min-w-0">
                        <h3 className={cn(
                            'font-semibold text-zinc-900 dark:text-zinc-100 truncate',
                            compact && 'text-sm',
                        )}>
                            {module.label}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            {!compact && (
                                <span
                                    className={cn(
                                        'inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded border',
                                        CATEGORIE_STYLES[module.category] || CATEGORIE_STYLES.PAYANT,
                                    )}
                                >
                                    {CATEGORIE_LABELS[module.category] || module.category}
                                </span>
                            )}
                            {isLocked && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 uppercase">
                                    <Lock className="h-2.5 w-2.5" />
                                    {module.raisonBlocage === 'PLAN_INSUFFICIENT' ? 'Plan requis' :
                                     module.raisonBlocage?.startsWith('ABONNEMENT') ? 'Abonnement requis' :
                                     'Verrouillé'}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Toggle */}
                {onToggle && (
                    <button
                        type="button"
                        disabled={isToggling || isBase || isLocked}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (!isLocked) onToggle(module.name, !actif);
                        }}
                        className={cn(
                            'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
                            isLocked
                                ? 'bg-zinc-200 dark:bg-zinc-700 cursor-not-allowed'
                                : actif
                                    ? 'bg-emerald-500'
                                    : 'bg-zinc-300 dark:bg-zinc-700',
                            (isToggling || isBase || isLocked) && 'opacity-50 cursor-not-allowed',
                        )}
                        title={isLocked ? (module.messageBlocage || 'Module verrouillé') : isBase ? 'Module de base (non désactivable)' : actif ? 'Désactiver' : 'Activer'}
                    >
                        <span
                            className={cn(
                                'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform',
                                isLocked ? 'translate-x-0' : actif ? 'translate-x-5' : 'translate-x-0',
                            )}
                        />
                    </button>
                )}
            </div>

            {/* Description */}
            {!compact && module.description && (
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2">
                    {module.description}
                </p>
            )}

            {/* Message blocage */}
            {isLocked && !compact && module.messageBlocage && (
                <p className="mt-1.5 text-xs text-zinc-400 dark:text-zinc-500 italic">
                    {module.messageBlocage}
                </p>
            )}

            {/* Footer */}
            <div className={cn('flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500', compact ? 'mt-1' : 'mt-3')}>
                {isLocked ? (
                    <>
                        <Lock className="h-3 w-3 text-zinc-400" />
                        <span>Verrouillé</span>
                    </>
                ) : actif ? (
                    <>
                        <Unlock className="h-3 w-3 text-emerald-500" />
                        <span>Actif</span>
                    </>
                ) : (
                    <>
                        <Lock className="h-3 w-3" />
                        <span>Inactif</span>
                    </>
                )}
                {module.dependencies.length > 0 && (
                    <>
                        <span className="text-zinc-300 dark:text-zinc-700">·</span>
                        <span>{module.dependencies.length} dép.</span>
                    </>
                )}
                {onClick && (
                    <ChevronRight className="ml-auto h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
            </div>
        </div>
    );
}

export default ConfigModuleCard;
