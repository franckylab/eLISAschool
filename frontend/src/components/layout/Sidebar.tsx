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
    BookOpen,
    ClipboardList,
    Calendar,
    CreditCard,
    MessageSquare,
    Bus,
    Library,
    Settings,
    Shield,
    UserCog,
    Building2,
    Layers,
    GraduationCap as LevelIcon,
    School,
    CalendarDays,
    Atom,
    UserRound,
    FolderTree,
    FileText,
    TrendingUp,
    type LucideIcon,
} from 'lucide-react';
import { useSidebarStore } from '@/stores/sidebar.store';
import { useAuthStore } from '@/stores/auth.store';
import { useModulePermissions } from '@/hooks';
import { cn } from '@/lib/cn';
import { ElisaLogo } from '@/components/branding';

interface NavItem {
    label: string;
    path: string;
    icon: LucideIcon;
    module?: string;
}

interface NavSection {
    title: string;
    items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
    {
        title: 'Principal',
        items: [
            { label: 'Tableau de bord', path: '/dashboard', icon: LayoutDashboard },
        ],
    },
    {
        title: 'Structure Académique',
        items: [
            { label: 'Établissements', path: '/etablissements', icon: Building2, module: 'etablissements' },
            { label: 'Groupes Étab.', path: '/groupes-etablissements', icon: FolderTree, module: 'groupes-etablissements' },
            { label: 'Types Cycles', path: '/types-cycles', icon: Layers, module: 'types-cycles' },
            { label: 'Cycles', path: '/cycles', icon: Layers, module: 'cycles' },
            { label: 'Niveaux', path: '/niveaux', icon: LevelIcon, module: 'niveaux' },
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

    // Filtrer les sections du sidebar selon les permissions de l'utilisateur
    const filteredSections = NAV_SECTIONS.map((section) => ({
        ...section,
        items: section.items.filter((item) => {
            // Si pas de module spécifié, toujours afficher (Dashboard, etc.)
            if (!item.module) return true;

            // Vérifier les permissions pour le module
            const permsMap: Record<string, { canAccess: boolean }> = {
                etablissements: etablissementsPerms,
                cycles: cyclesPerms,
                niveaux: niveauxPerms,
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
            };

            const perms = permsMap[item.module];
            return perms?.canAccess ?? true;
        }),
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
                            const isActive = matchRoute({ to: item.path, fuzzy: true });

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
