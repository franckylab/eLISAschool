/**
 * ==================================
 * eLISAschool - Sidebar
 * ==================================
 * Navigation latérale par catégories de modules
 * Icônes Lucide, filtrage par permissions, collapse/expand
 */

import { useTranslation } from 'react-i18next';
import { Link, useMatchRoute } from '@tanstack/react-router';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    GraduationCap,
    Users,
    Calendar,
    CreditCard,
    MessageSquare,
    Bus,
    Library,
    Settings,
    Shield,
    UserCog,
    Building2,
    GraduationCap as LevelIcon,
    School,
    CalendarDays,
    Atom,
    UserRound,
    FolderTree,
    FileText,
    TrendingUp,
    Award,
    ScrollText,
    LayoutGrid,
    ChevronDown,
    ChevronRight,
    Target,
    BookOpen,
    DoorOpen,
    type LucideIcon,
} from 'lucide-react';
import { useSidebarStore } from '@/stores/sidebar.store';
import { useAuthStore } from '@/stores/auth.store';
import { useModulePermissions } from '@/hooks';
import { cn } from '@/lib/cn';
import { ElisaLogo } from '@/components/branding';
import { useState } from 'react';

interface NavItem {
    label: string;
    path: string;
    icon: LucideIcon;
    module?: string;
    children?: NavItem[];
}

interface NavSection {
    title: string;
    items: NavItem[];
}

// Composant pour les items avec sous-menus (accordéon)
function NavItemWithChildren({
    item,
    Icon,
    isActive,
    isCollapsed,
    matchRoute,
}: {
    item: NavItem;
    Icon: LucideIcon;
    isActive: boolean;
    isCollapsed: boolean;
    matchRoute: any;
}) {
    const [isExpanded, setIsExpanded] = useState(false);
    
    // Vérifier si un child est actif
    const isChildActive = item.children?.some(child => 
        matchRoute({ to: child.path, fuzzy: true })
    );
    
    // Auto-expand si un child est actif
    if (isChildActive && !isExpanded) {
        setIsExpanded(true);
    }
    
    return (
        <div>
            <div
                className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive || isChildActive
                        ? 'bg-[var(--color-dominante)]/10 text-[var(--color-dominante)]'
                        : 'text-[var(--color-texte-secondaire)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-texte)]',
                    isCollapsed && 'justify-center px-2',
                )}
                title={isCollapsed ? item.label : undefined}
            >
                {/* Lien vers la page parent */}
                <Link
                    to={item.path as any}
                    className="flex flex-1 items-center gap-3"
                    onClick={(e) => {
                        // Empêcher la propagation pour ne pas déclencher d'autres événements
                        e.stopPropagation();
                    }}
                >
                    <Icon className="h-5 w-5 shrink-0" />
                    {!isCollapsed && <span className="flex-1">{item.label}</span>}
                </Link>
                
                {/* Bouton pour expand/collapse (seulement si pas collapsé) */}
                {!isCollapsed && (
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsExpanded(!isExpanded);
                        }}
                        className="p-1 rounded hover:bg-[var(--color-surface-hover)] transition-colors"
                        aria-expanded={isExpanded}
                        aria-label={isExpanded ? 'Réduire le menu' : 'Développer le menu'}
                    >
                        {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                        ) : (
                            <ChevronRight className="h-4 w-4" />
                        )}
                    </button>
                )}
            </div>
            
            {/* Sous-menu */}
            {!isCollapsed && isExpanded && item.children && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="ml-4 mt-1 border-l-2 border-[var(--color-bordure)] pl-2"
                >
                    {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        const isChildActive = !!matchRoute({ to: child.path, fuzzy: true });
                        
                        return (
                            <Link
                                key={child.path}
                                to={child.path as any}
                                className={cn(
                                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                                    isChildActive
                                        ? 'bg-[var(--color-dominante)]/15 text-[var(--color-dominante)] translate-x-1'
                                        : 'text-[var(--color-texte-secondaire)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-texte)] hover:translate-x-0.5',
                                )}
                            >
                                <ChildIcon className="h-4 w-4 shrink-0" />
                                <span className="flex-1">{child.label}</span>
                                {/* Indicateur d'état actif */}
                                {isChildActive && (
                                    <motion.div
                                        layoutId="activeChildIndicator"
                                        className="h-1.5 w-1.5 rounded-full bg-[var(--color-dominante)]"
                                    />
                                )}
                            </Link>
                        );
                    })}
                </motion.div>
            )}
        </div>
    );
}

const NAV_SECTIONS: NavSection[] = [
    {
        title: 'Principal',
        items: [
            { label: 'Tableau de bord', path: '/dashboard', icon: LayoutDashboard },
        ],
    },
    {
        title: 'Organisation Académique',
        items: [
            { label: 'Établissements', path: '/etablissements', icon: Building2, module: 'etablissements' },
            { label: 'Groupes Étab.', path: '/groupes-etablissements', icon: FolderTree, module: 'groupes-etablissements' },
            {
                label: 'Structure Académique',
                path: '/parametres/structure-academique',
                icon: GraduationCap,
                children: [
                    { label: 'Vue d\'ensemble', path: '/parametres/structure-academique', icon: LayoutGrid },
                    { label: 'Cycles', path: '/cycles', icon: School, module: 'cycles' },
                    { label: 'Niveaux', path: '/niveaux', icon: LevelIcon, module: 'niveaux' },
                    { label: 'Filières', path: '/filieres', icon: Award, module: 'filieres' },
                    { label: 'Spécialités', path: '/specialites', icon: BookOpen, module: 'specialites' },
                    { label: 'Examens Nationaux', path: '/examens-nationaux', icon: FileText, module: 'examens-nationaux' },
                    { label: 'Diplômes Élèves', path: '/diplomes-eleves', icon: ScrollText, module: 'diplomes-eleves' },
                    { label: 'Compétences', path: '/competences', icon: Target, module: 'competences' },
                ]
            },
            { label: 'Classes', path: '/classes', icon: School, module: 'classes' },
            { label: 'Années Scolaires', path: '/annees-scolaires', icon: CalendarDays, module: 'anneesScolaires' },
            { label: 'Matières', path: '/matieres', icon: Atom, module: 'matieres' },
            { label: 'Programmes', path: '/programmes', icon: FileText, module: 'programmes' },
        ],
    },
    {
        title: 'Relations',
        items: [
            { label: 'Responsables', path: '/responsables-eleves', icon: Users, module: 'responsables-eleves' },
        ],
    },
    {
        title: 'Académique',
        items: [
            { label: 'Élèves', path: '/eleves', icon: Users, module: 'eleves' },
            { label: 'Personnel', path: '/personnel', icon: UserRound, module: 'personnel' },
            { label: 'Enseignants', path: '/enseignants', icon: GraduationCap, module: 'enseignants' },
            { label: 'Périodes', path: '/periodes', icon: Calendar, module: 'periodes' },
            { label: 'Notes', path: '/notes', icon: TrendingUp, module: 'notes' },
            { label: 'Bulletins', path: '/bulletins', icon: FileText, module: 'bulletins' },
            { label: 'Emploi du temps', path: '/emploi-du-temps', icon: Calendar, module: 'emploiDuTemps' },
            { label: 'Salles', path: '/salles', icon: DoorOpen, module: 'salles' },
        ],
    },
    {
        title: 'Administration',
        items: [
            { label: 'Utilisateurs', path: '/utilisateurs', icon: UserCog, module: 'utilisateurs' },
            { label: 'Rôles & Permissions', path: '/admin/roles', icon: Shield, module: 'roles' },
            { label: 'Finances', path: '/finances', icon: CreditCard, module: 'finances' },
            { label: 'Communication', path: '/communication', icon: MessageSquare, module: 'communication' },
            { label: 'Transport', path: '/transport', icon: Bus, module: 'transport' },
            { label: 'Bibliothèque', path: '/bibliotheque', icon: Library, module: 'bibliotheque' },
        ],
    },
    {
        title: 'Système',
        items: [
            { label: 'Configuration', path: '/configuration', icon: Settings },
            { label: 'Paramètres', path: '/parametres', icon: Settings },
        ],
    },
];

export function Sidebar() {
    const { t } = useTranslation('common');
    const { isCollapsed } = useSidebarStore();
    const utilisateur = useAuthStore((s) => s.utilisateur);
    const matchRoute = useMatchRoute();

    // Vérifier les permissions pour chaque module
    const etablissementsPerms = useModulePermissions('etablissements');
    const cyclesPerms = useModulePermissions('cycles');
    const niveauxPerms = useModulePermissions('niveaux');
    const filieresPerms = useModulePermissions('filieres');
    const specialitesPerms = useModulePermissions('specialites');
    const competencesPerms = useModulePermissions('competences');
    const examensNationauxPerms = useModulePermissions('examens-nationaux');
    const diplomesElevesPerms = useModulePermissions('diplomes-eleves');
    const classesPerms = useModulePermissions('classes');
    const anneesScolairesPerms = useModulePermissions('anneesScolaires');
    const matieresPerms = useModulePermissions('matieres');
    const elevesPerms = useModulePermissions('eleves');
    const personnelPerms = useModulePermissions('personnel');
    const enseignantsPerms = useModulePermissions('enseignants');
    const notesPerms = useModulePermissions('notes');
    const financesPerms = useModulePermissions('finances');
    const transportPerms = useModulePermissions('transport');
    const communicationPerms = useModulePermissions('messagerie');
    const utilisateursPerms = useModulePermissions('utilisateurs');
    const rolesPerms = useModulePermissions('roles');
    const sallesPerms = useModulePermissions('salles');

    // Filtrer les sections du sidebar selon les permissions de l'utilisateur
    const filteredSections = NAV_SECTIONS.map((section) => ({
        ...section,
        items: section.items
            .map((item) => {
                // Si l'item a des children, filtrer les children selon les permissions
                if (item.children) {
                    const filteredChildren = item.children.filter((child) => {
                        if (!child.module) return true;
                        const permsMap: Record<string, { canAccess: boolean }> = {
                            cycles: cyclesPerms,
                            niveaux: niveauxPerms,
                            filieres: filieresPerms,
                            specialites: specialitesPerms,
                            competences: competencesPerms,
                            'examens-nationaux': examensNationauxPerms,
                            'diplomes-eleves': diplomesElevesPerms,
                        };
                        const perms = permsMap[child.module];
                        return perms?.canAccess ?? true;
                    });
                    
                    // Retourner l'item avec ses children filtrés
                    return {
                        ...item,
                        children: filteredChildren,
                    };
                }
                
                // Item sans children - filtrage normal
                if (!item.module) return item;
                
                const permsMap: Record<string, { canAccess: boolean }> = {
                    etablissements: etablissementsPerms,
                    cycles: cyclesPerms,
                    niveaux: niveauxPerms,
                    filieres: filieresPerms,
                    'examens-nationaux': examensNationauxPerms,
                    'diplomes-eleves': diplomesElevesPerms,
                    classes: classesPerms,
                    anneesScolaires: anneesScolairesPerms,
                    matieres: matieresPerms,
                    eleves: elevesPerms,
                    personnel: personnelPerms,
                    enseignants: enseignantsPerms,
                    notes: notesPerms,
                    finances: financesPerms,
                    transport: transportPerms,
                    communication: communicationPerms,
                    utilisateurs: utilisateursPerms,
                    roles: rolesPerms,
                    salles: sallesPerms,
                };
                
                const perms = permsMap[item.module];
                return perms?.canAccess ?? true ? item : null;
            })
            .filter((item): item is NavItem => item !== null)
            .map((item) => {
                // Si l'item a des children vides, le retirer
                if (item.children && item.children.length === 0) {
                    return null;
                }
                return item;
            })
            .filter((item): item is NavItem => item !== null),
    })).filter((section) => section.items.length > 0); // Masquer les sections vides

    return (
        <div className="flex h-full flex-col">
            {/* Logo / Titre */}
            <div className="flex h-16 items-center justify-center border-b border-[var(--color-bordure)] px-4">
                <AnimatePresence mode="wait">
                    {!isCollapsed ? (
                        <motion.div
                            key="logo-full"
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -8 }}
                            transition={{ duration: 0.25, ease: 'easeOut' }}
                        >
                            <Link to="/dashboard" className="block transition-transform hover:scale-[1.02] active:scale-[0.98]">
                                <ElisaLogo variant="horizontal" size="sm" />
                            </Link>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="logo-mini"
                            initial={{ opacity: 0, scale: 0.85 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.85 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                        >
                            <Link to="/dashboard" className="block transition-transform hover:scale-110 active:scale-95">
                                <ElisaLogo variant="mini" size="sm" />
                            </Link>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-2">
                {filteredSections.map((section) => (
                    <div key={section.title} className="mb-4">
                        {!isCollapsed && (
                            <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-[var(--color-texte-secondaire)]">
                                {section.title}
                            </p>
                        )}
                        {section.items.map((item) => {
                            const Icon = item.icon;
                            const isActive = !!matchRoute({ to: item.path, fuzzy: true });
                            const hasChildren = item.children && item.children.length > 0;
                            
                            // Composant pour les items avec sous-menus
                            if (hasChildren) {
                                return (
                                    <NavItemWithChildren
                                        key={item.path}
                                        item={item}
                                        Icon={Icon}
                                        isActive={isActive}
                                        isCollapsed={isCollapsed}
                                        matchRoute={matchRoute}
                                    />
                                );
                            }
                            
                            // Composant pour les items simples
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path as any}
                                    className={cn(
                                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                                        isActive
                                            ? 'bg-[var(--color-dominante)]/10 text-[var(--color-dominante)]'
                                            : 'text-[var(--color-texte-secondaire)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-texte)]',
                                        isCollapsed && 'justify-center px-2',
                                    )}
                                    title={isCollapsed ? item.label : undefined}
                                >
                                    <Icon className="h-5 w-5 shrink-0" />
                                    {!isCollapsed && <span>{item.label}</span>}
                                </Link>
                            );
                        })}
                    </div>
                ))}
            </nav>

            {/* User info */}
            {utilisateur && !isCollapsed && (
                <div className="border-t border-[var(--color-bordure)] p-3">
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-dominante)] text-xs font-bold text-white">
                            {utilisateur.prenom?.[0]}{utilisateur.nom?.[0]}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-[var(--color-texte)]">
                                {utilisateur.prenom} {utilisateur.nom}
                            </p>
                            <p className="truncate text-xs text-[var(--color-texte-secondaire)]">
                                {t(`roles.${utilisateur.role}` as any, utilisateur.role)}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
