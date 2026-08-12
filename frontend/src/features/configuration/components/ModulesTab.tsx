import { useState, useMemo, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { SchoolLoading } from '@/components/feedback';
import {
    Blocks,
    Search,
    ChevronDown,
    ChevronRight,
    AlertTriangle,
    Loader2,
    CheckCircle2,
    Shield,
    Users,
    Settings,
    Bell,
    MessageSquare,
    FileText,
    CircleHelp,
    Megaphone,
    GraduationCap,
    FileSpreadsheet,
    CalendarDays,
    Calendar,
    UserCheck,
    Compass,
    BookOpen,
    Utensils,
    Bus,
    Car,
    Package,
    CreditCard,
    Users2,
    Trophy,
    FolderOpen,
    Printer,
    UserCog,
    Heart,
    BarChart2,
    Activity,
    Usb,
    Building2,
    UserPlus,
    LayoutDashboard,
    DoorOpen,
    GitBranch,
    Lock,
    Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import {
    useModuleRegistry,
    useToggleModule,
    useModuleImpact,
} from '../hooks/use-configuration';
import type { ModuleState, ModuleImpact } from '../types/configuration.types';
import { useAuthStore } from '@/stores/auth.store';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
    Shield, Users, Settings, Bell, MessageSquare, FileText, CircleHelp,
    Megaphone, GraduationCap, FileSpreadsheet, CalendarDays, Calendar,
    UserCheck, Compass, BookOpen, Utensils, Bus, Car, Package, CreditCard,
    Users2, Trophy, FolderOpen, Printer, UserCog, Heart, BarChart2,
    Activity, Usb, Building2, UserPlus, LayoutDashboard, DoorOpen, GitBranch,
};

const CATEGORY_LABELS: Record<string, string> = {
    CRITIQUE: 'Critiques',
    PREMIUM: 'Premium',
    ADDON: 'Add-ons',
};

const CATEGORY_COLORS: Record<string, string> = {
    CRITIQUE: 'border-red-200 bg-red-50 text-red-700',
    PREMIUM: 'border-amber-200 bg-amber-50 text-amber-700',
    ADDON: 'border-blue-200 bg-blue-50 text-blue-700',
};

const CATEGORY_HEADER_BG: Record<string, string> = {
    CRITIQUE: 'bg-red-50/50 border-red-100',
    PREMIUM: 'bg-amber-50/50 border-amber-100',
    ADDON: 'bg-blue-50/50 border-blue-100',
};

function getLucideIcon(iconName: string): React.ComponentType<{ className?: string }> {
    return ICON_MAP[iconName] || Blocks;
}

function groupByCategory(states: ModuleState[]): Record<string, ModuleState[]> {
    const groups: Record<string, ModuleState[]> = {};
    for (const s of states) {
        const cat = s.entry.category || 'ADDON';
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(s);
    }
    const sorted = Object.keys(groups).sort((a, b) => {
        const order = ['CRITIQUE', 'PREMIUM', 'ADDON'];
        const ia = order.indexOf(a);
        const ib = order.indexOf(b);
        return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    });
    const result: Record<string, ModuleState[]> = {};
    for (const key of sorted) {
        result[key] = groups[key];
    }
    return result;
}

function ModuleSearchBar({
    value,
    onChange,
    categoryFilter,
    onCategoryFilter,
    activeFilter,
    onActiveFilter,
    categories,
}: {
    value: string;
    onChange: (v: string) => void;
    categoryFilter: string;
    onCategoryFilter: (v: string) => void;
    activeFilter: string;
    onActiveFilter: (v: string) => void;
    categories: string[];
}) {
    return (
        <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                <input
                    type="text"
                    placeholder="Rechercher un module..."
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-dominante)]/30"
                />
            </div>
            <select
                value={categoryFilter}
                onChange={(e) => onCategoryFilter(e.target.value)}
                className="rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-dominante)]/30"
            >
                <option value="">Toutes catégories</option>
                {categories.map((cat) => (
                    <option key={cat} value={cat}>
                        {CATEGORY_LABELS[cat] || cat}
                    </option>
                ))}
            </select>
            <select
                value={activeFilter}
                onChange={(e) => onActiveFilter(e.target.value)}
                className="rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-dominante)]/30"
            >
                <option value="">Tous statuts</option>
                <option value="active">Actifs</option>
                <option value="inactive">Inactifs</option>
            </select>
        </div>
    );
}

function CategoryHeader({
    category,
    count,
    total,
    isExpanded,
    onToggle,
    onBulkToggle,
    isBulkToggling,
    canToggle,
}: {
    category: string;
    count: number;
    total: number;
    isExpanded: boolean;
    onToggle: () => void;
    onBulkToggle: (actif: boolean) => void;
    isBulkToggling: boolean;
    canToggle: boolean;
}) {
    const allActive = count === total;
    return (
        <div
            className={cn(
                'flex items-center justify-between px-4 py-3 rounded-lg border cursor-pointer transition-colors',
                CATEGORY_HEADER_BG[category] || 'bg-gray-50/50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700'
            )}
            onClick={onToggle}
        >
            <div className="flex items-center gap-3">
                {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                ) : (
                    <ChevronRight className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                )}
                <span className={cn(
                    'px-2.5 py-0.5 rounded-full text-xs font-semibold',
                    CATEGORY_COLORS[category] || 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-400'
                )}>
                    {CATEGORY_LABELS[category] || category}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                    {count}/{total} actifs
                </span>
            </div>
            {canToggle && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onBulkToggle(!allActive);
                    }}
                    disabled={isBulkToggling}
                    className={cn(
                        'px-3 py-1 rounded-md text-xs font-medium border transition-colors',
                        allActive
                            ? 'border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30'
                            : 'border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30',
                        isBulkToggling && 'opacity-50 cursor-not-allowed'
                    )}
                >
                    {isBulkToggling ? '...' : allActive ? 'Tout désactiver' : 'Tout activer'}
                </button>
            )}
        </div>
    );
}

function ModuleCard({
    state,
    onToggle,
    isToggling,
    canToggle,
    impact,
    isImpactLoading,
}: {
    state: ModuleState;
    onToggle: (moduleNom: string, actif: boolean) => void;
    isToggling: boolean;
    canToggle: boolean;
    impact: ModuleImpact | undefined;
    isImpactLoading: boolean;
}) {
    const { entry, actif, estAccessible, raisonBlocage, messageBlocage } = state;
    const Icon = getLucideIcon(entry.icon);
    const hasDeps = entry.dependencies && entry.dependencies.length > 0;
    const isLocked = !estAccessible;

    const hasDepsInactive = isImpactLoading
        ? false
        : impact && impact.modulesAActiver && impact.modulesAActiver.length > 0;

    const hasReverseActive = isImpactLoading
        ? false
        : impact && impact.modulesADesactiver && impact.modulesADesactiver.length > 0;

    const showToggleImpact = !actif && hasDepsInactive;
    const showDeactivateImpact = actif && hasReverseActive;

    // Label de raison de blocage
    const blocageLabel = raisonBlocage === 'PLAN_INSUFFICIENT' ? 'Plan requis'
        : raisonBlocage === 'ABONNEMENT_INACTIF' || raisonBlocage === 'ABONNEMENT_EXPIRE' || raisonBlocage === 'ABONNEMENT_SUSPENDU' ? 'Abonnement requis'
        : raisonBlocage === 'MODULE_DESACTIVE' ? 'Désactivé'
        : raisonBlocage === 'OVERRIDE_DESACTIVE' ? 'Désactivé (groupe)'
        : null;

    return (
        <div
            className={cn(
                'flex items-start gap-4 p-4 rounded-lg border transition-all duration-200',
                isLocked
                    ? 'border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 opacity-75'
                    : actif
                        ? 'border-[var(--color-dominante)]/30 bg-[var(--color-dominante)]/5 shadow-sm'
                        : 'border-[var(--color-bordure)] bg-[var(--color-surface)]',
            )}
        >
            <div className={cn(
                'flex items-center justify-center w-10 h-10 rounded-lg shrink-0',
                isLocked
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                    : actif
                        ? 'bg-[var(--color-dominante)]/10 text-[var(--color-dominante)]'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
            )}>
                {isLocked ? <Lock className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-[var(--color-texte)] text-sm">
                        {entry.label}
                    </h3>
                    {entry.premium && !isLocked && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 uppercase">
                            Premium
                        </span>
                    )}
                    {isLocked && blocageLabel && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 uppercase flex items-center gap-1">
                            <Lock className="h-2.5 w-2.5" />
                            {blocageLabel}
                        </span>
                    )}
                    {hasDeps && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                            {entry.dependencies.length} dépendance{entry.dependencies.length > 1 ? 's' : ''}
                        </span>
                    )}
                </div>

                <p className="text-xs text-[var(--color-texte-secondaire)] mt-0.5 line-clamp-1">
                    {entry.description}
                </p>

                {/* Message de blocage entitlement */}
                {isLocked && messageBlocage && (
                    <div className="mt-2 flex items-start gap-1.5 text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded px-2 py-1.5">
                        <Lock className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        <span>{messageBlocage}</span>
                    </div>
                )}

                {/* CTA Upgrader pour modules verrouillés */}
                {isLocked && (raisonBlocage === 'PLAN_INSUFFICIENT' || raisonBlocage === 'ABONNEMENT_INACTIF' || raisonBlocage === 'ABONNEMENT_EXPIRE') && (
                    <div className="mt-2">
                        <button
                            onClick={() => window.location.href = '/configuration/billing'}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 transition-all"
                        >
                            <Sparkles className="h-3 w-3" />
                            Upgrader le plan
                        </button>
                    </div>
                )}

                {showToggleImpact && impact && impact.modulesAActiver.length > 0 && (
                    <div className="mt-2 flex items-start gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-900/30 rounded px-2 py-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        <span>Activera aussi : {impact.modulesAActiver.join(', ')}</span>
                    </div>
                )}

                {showDeactivateImpact && impact && impact.modulesADesactiver.length > 0 && (
                    <div className="mt-2 flex items-start gap-1.5 text-xs text-red-600 dark:text-red-400 bg-red-50/80 dark:bg-red-900/30 rounded px-2 py-1.5">
                        <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        <span>Désactivera aussi : {impact.modulesADesactiver.join(', ')}</span>
                    </div>
                )}

                {isImpactLoading && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Analyse d'impact...</span>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-3 shrink-0">
                {isLocked ? (
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                        Verrouillé
                    </span>
                ) : (
                    <span
                        className={cn(
                            'px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                            actif
                                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                        )}
                    >
                        {actif ? 'Actif' : 'Inactif'}
                    </span>
                )}

                <button
                    onClick={() => !isLocked && onToggle(entry.name, !actif)}
                    disabled={isToggling || !canToggle || isLocked}
                    className={cn(
                        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-dominante)]/30',
                        isLocked
                            ? 'bg-gray-200 dark:bg-gray-700 cursor-not-allowed'
                            : actif
                                ? 'bg-[var(--color-dominante)]'
                                : 'bg-gray-300 dark:bg-gray-600',
                        (isToggling || !canToggle || isLocked) && 'cursor-not-allowed opacity-50'
                    )}
                    role="switch"
                    aria-checked={actif}
                    title={isLocked ? messageBlocage || 'Module verrouillé' : undefined}
                >
                    <span
                        className={cn(
                            'inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition-transform',
                            isLocked ? 'translate-x-[2px]' : actif ? 'translate-x-[22px]' : 'translate-x-[2px]'
                        )}
                    />
                </button>
            </div>
        </div>
    );
}

function ActivateConfirmDialog({
    open,
    moduleName: _moduleName,
    moduleLabel,
    actif,
    impact,
    isLoading,
    onConfirm,
    onCancel,
}: {
    open: boolean;
    moduleName: string;
    moduleLabel: string;
    actif: boolean;
    impact: ModuleImpact | undefined;
    isLoading: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    if (!open) return null;

    const hasCascade = impact && (
        (actif && impact.modulesAActiver.length > 0) ||
        (!actif && impact.modulesADesactiver.length > 0)
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/40" onClick={onCancel} />
            <div className="relative bg-[var(--color-surface)] rounded-xl shadow-2xl border border-[var(--color-bordure)] w-full max-w-md mx-4 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className={cn(
                        'p-2 rounded-full',
                        actif ? 'bg-emerald-100' : 'bg-red-100'
                    )}>
                        {actif ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        )}
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-[var(--color-texte)]">
                            {actif ? `Activer ${moduleLabel}` : `Désactiver ${moduleLabel}`}
                        </h3>
                        <p className="text-sm text-[var(--color-texte-secondaire)]">
                            {actif
                                ? "Ce module sera accessible dans l'application."
                                : 'Les fonctionnalités de ce module ne seront plus accessibles.'}
                        </p>
                    </div>
                </div>

                {hasCascade && (
                    <div className={cn(
                        'rounded-lg p-3 mb-4 text-sm',
                        actif
                            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                    )}>
                        {actif && impact && (
                            <>
                                <p className="font-medium mb-1">Modules qui seront également activés :</p>
                                <ul className="list-disc list-inside space-y-0.5">
                                    {impact.modulesAActiver.map((m) => (
                                        <li key={m}>{m}</li>
                                    ))}
                                </ul>
                            </>
                        )}
                        {!actif && impact && (
                            <>
                                <p className="font-medium mb-1">Modules qui seront également désactivés :</p>
                                <ul className="list-disc list-inside space-y-0.5">
                                    {impact.modulesADesactiver.map((m) => (
                                        <li key={m}>{m}</li>
                                    ))}
                                </ul>
                            </>
                        )}
                    </div>
                )}

                {impact && impact.conflits && impact.conflits.length > 0 && !actif && (
                    <div className="rounded-lg p-3 mb-4 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800 text-sm">
                        <p className="font-medium mb-1">Conflits détectés :</p>
                        <ul className="list-disc list-inside space-y-0.5">
                            {impact.conflits.map((c, i) => (
                                <li key={i}>{c}</li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="flex justify-end gap-3">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 rounded-lg border border-[var(--color-bordure)] text-sm font-medium text-[var(--color-texte)] hover:bg-[var(--color-surface-hover)] transition-colors"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={cn(
                            'px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors flex items-center gap-2',
                            actif
                                ? 'bg-emerald-600 hover:bg-emerald-700'
                                : 'bg-red-600 hover:bg-red-700',
                            isLoading && 'opacity-60 cursor-not-allowed'
                        )}
                    >
                        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                        {isLoading ? 'En cours...' : actif ? 'Activer' : 'Désactiver'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export function ModulesTab() {
    const { data: states, isLoading: isLoadingRegistry } = useModuleRegistry();
    const toggleModule = useToggleModule();
    const userRole = useAuthStore((s) => s.utilisateur?.role);

    // [RBAC-2] v5.1 — Toggle module = opération plateforme (SUPER_ADMIN uniquement)
    // ADMIN (client) ne peut plus activer/désactiver les modules globalement.
    const canToggle = userRole === 'SUPER_ADMIN';

    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [activeFilter, setActiveFilter] = useState('');
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
    const [pendingToggle, setPendingToggle] = useState<{ moduleNom: string; actif: boolean } | null>(null);
    const [bulkToggling, setBulkToggling] = useState<string | null>(null);

    const categories = useMemo(() => {
        if (!states) return [];
        const cats = new Set(states.map((s) => s.entry.category || 'ADDON'));
        return Array.from(cats).sort();
    }, [states]);

    useEffect(() => {
        if (categories.length > 0 && expandedCategories.size === 0) {
            setExpandedCategories(new Set(categories));
        }
    }, [categories, expandedCategories.size]);

    const filteredStates = useMemo(() => {
        if (!states) return [];
        return states.filter((s) => {
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                if (!s.entry.label.toLowerCase().includes(q) && !s.entry.description.toLowerCase().includes(q) && !s.entry.name.toLowerCase().includes(q)) {
                    return false;
                }
            }
            if (categoryFilter && (s.entry.category || 'ADDON') !== categoryFilter) return false;
            if (activeFilter === 'active' && !s.actif) return false;
            if (activeFilter === 'inactive' && s.actif) return false;
            return true;
        });
    }, [states, searchQuery, categoryFilter, activeFilter]);

    const grouped = useMemo(() => groupByCategory(filteredStates), [filteredStates]);

    const pendingModule = useMemo(() => {
        if (!pendingToggle || !states) return null;
        return states.find((s) => s.entry.name === pendingToggle.moduleNom) || null;
    }, [pendingToggle, states]);

    const {
        data: impactData,
        isLoading: isImpactLoading,
    } = useModuleImpact(pendingToggle?.moduleNom || '', pendingToggle?.actif ?? false);

    const handleToggleRequest = useCallback((moduleNom: string, actif: boolean) => {
        setPendingToggle({ moduleNom, actif });
    }, []);

    const handleToggleConfirm = useCallback(async () => {
        if (!pendingToggle) return;
        try {
            const result = await toggleModule.mutateAsync({
                moduleNom: pendingToggle.moduleNom,
                actif: pendingToggle.actif,
            });
            setPendingToggle(null);
            toast.success(result?.message || `Module ${pendingToggle.actif ? 'activé' : 'désactivé'}`, {
                duration: 3000,
            });
        } catch (error: any) {
            const msg = error?.response?.data?.message || error?.message || 'Erreur lors du changement';
            toast.error(msg);
        }
    }, [pendingToggle, toggleModule]);

    const handleBulkToggle = useCallback(async (category: string, actif: boolean) => {
        if (!states) return;
        const moduleNames = states
            .filter((s) => (s.entry.category || 'ADDON') === category)
            .map((s) => s.entry.name);
        if (moduleNames.length === 0) return;

        setBulkToggling(category);
        let successCount = 0;
        let errorCount = 0;

        for (const moduleNom of moduleNames) {
            try {
                await toggleModule.mutateAsync({ moduleNom, actif });
                successCount++;
            } catch {
                errorCount++;
            }
        }

        setBulkToggling(null);
        if (errorCount === 0) {
            toast.success(`${successCount} module${successCount > 1 ? 's' : ''} ${actif ? 'activé' : 'désactivé'}${successCount > 1 ? 's' : ''}`);
        } else {
            toast.warning(`${successCount} OK, ${errorCount} erreur${errorCount > 1 ? 's' : ''}`);
        }
    }, [states, toggleModule]);

    if (isLoadingRegistry) {
        return <SchoolLoading variant="compact" message="Chargement des modules..." />;
    }

    if (!states || states.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <Blocks className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-[var(--color-texte-secondaire)]">Aucun module disponible</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-[var(--color-texte)]">
                        Modules de l'Application
                    </h2>
                    <p className="text-sm text-[var(--color-texte-secondaire)]">
                        Activez ou désactivez les modules selon vos besoins
                    </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-[var(--color-texte-secondaire)]">
                    <Blocks className="h-4 w-4" />
                    <span>{states.filter((s) => s.actif).length}/{states.length} actifs</span>
                </div>
            </div>

            {!canToggle && (
                <div className="flex items-start gap-3 p-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 text-sm">
                    <Shield className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>Vous êtes en mode lecture. Seuls les administrateurs peuvent modifier l'activation des modules.</span>
                </div>
            )}

            <div className="flex items-start gap-3 p-4 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800 dark:text-amber-300">
                    <p className="font-medium">Attention</p>
                    <p>La désactivation d'un module peut affecter d'autres fonctionnalités dépendantes. Un dialogue de confirmation vous informera des impacts.</p>
                </div>
            </div>

            <ModuleSearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                categoryFilter={categoryFilter}
                onCategoryFilter={setCategoryFilter}
                activeFilter={activeFilter}
                onActiveFilter={setActiveFilter}
                categories={categories}
            />

            <div className="space-y-4">
                {Object.entries(grouped).map(([category, moduleStates]) => {
                    const isExpanded = expandedCategories.has(category);
                    const activeCount = moduleStates.filter((s) => s.actif).length;

                    if (moduleStates.length === 0) return null;

                    return (
                        <div key={category} className="space-y-2">
                            <CategoryHeader
                                category={category}
                                count={activeCount}
                                total={moduleStates.length}
                                isExpanded={isExpanded}
                                onToggle={() => {
                                    setExpandedCategories((prev) => {
                                        const next = new Set(prev);
                                        if (next.has(category)) next.delete(category);
                                        else next.add(category);
                                        return next;
                                    });
                                }}
                                onBulkToggle={(actif) => handleBulkToggle(category, actif)}
                                isBulkToggling={bulkToggling === category}
                                canToggle={canToggle}
                            />
                            {isExpanded && (
                                <div className="space-y-2 pl-4">
                                    {moduleStates.map((state) => (
                                        <ModuleCard
                                            key={state.entry.name}
                                            state={state}
                                            onToggle={handleToggleRequest}
                                            isToggling={toggleModule.isPending && pendingToggle?.moduleNom === state.entry.name}
                                            canToggle={canToggle}
                                            impact={
                                                pendingToggle?.moduleNom === state.entry.name
                                                    ? impactData
                                                    : undefined
                                            }
                                            isImpactLoading={
                                                isImpactLoading && pendingToggle?.moduleNom === state.entry.name
                                            }
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {pendingToggle && pendingModule && (
                <ActivateConfirmDialog
                    open={!!pendingToggle}
                    moduleName={pendingToggle.moduleNom}
                    moduleLabel={pendingModule.entry.label}
                    actif={pendingToggle.actif}
                    impact={impactData}
                    isLoading={toggleModule.isPending}
                    onConfirm={handleToggleConfirm}
                    onCancel={() => setPendingToggle(null)}
                />
            )}
        </div>
    );
}
