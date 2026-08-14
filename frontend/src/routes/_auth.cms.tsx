/**
 * ==================================
 * eLISAschool - Layout CMS (éditeur)
 * ==================================
 * Route: /_auth/cms
 * Layout pour l'éditeur CMS authentifié.
 * Navigation enrichie — CMS V2
 */

import { createFileRoute, Outlet, Link } from '@tanstack/react-router';
import {
    FileText, Layout, Palette, Menu, Settings, ArrowLeft,
    Image, GitBranch, Layers, Newspaper, Sparkles,
} from 'lucide-react';

export const Route = createFileRoute('/_auth/cms')({
    component: CmsLayout,
});

function CmsLayout() {
    return (
        <div className="flex h-full flex-col">
            {/* Sous-navigation CMS */}
            <div className="shrink-0 border-b bg-card/50 px-6 py-2">
                <div className="flex items-center gap-6 overflow-x-auto">
                    <Link
                        to="/dashboard"
                        className="flex shrink-0 items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="h-3 w-3" />
                        Retour
                    </Link>
                    <div className="h-4 w-px shrink-0 bg-border" />
                    <nav className="flex items-center gap-1">
                        <CmsNavLink to="/cms" icon={<Layout className="h-4 w-4" />} label="Dashboard" exact />
                        <CmsNavLink to="/cms/pages" icon={<FileText className="h-4 w-4" />} label="Pages" />
                        <CmsNavLink to="/cms/contenu" icon={<Newspaper className="h-4 w-4" />} label="Contenu" badge="Nouveau" />
                        <CmsNavLink to="/cms/medias" icon={<Image className="h-4 w-4" />} label="Médias" />
                        <CmsNavLink to="/cms/themes" icon={<Palette className="h-4 w-4" />} label="Thèmes" />
                        <CmsNavLink to="/cms/menus" icon={<Menu className="h-4 w-4" />} label="Menus" />
                        <CmsNavLink to="/cms/widgets" icon={<Settings className="h-4 w-4" />} label="Widgets" />
                        <CmsNavLink to="/cms/versions" icon={<GitBranch className="h-4 w-4" />} label="Versions" />
                        <CmsNavLink to="/cms/templates" icon={<Layers className="h-4 w-4" />} label="Templates" />
                    </nav>
                    <div className="ml-auto hidden items-center gap-2 lg:flex">
                        <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                            <Sparkles className="h-3 w-3" />
                            CMS V2
                        </div>
                    </div>
                </div>
            </div>

            {/* Contenu — remplit l'espace restant */}
            <div className="flex min-h-0 flex-1 flex-col">
                <Outlet />
            </div>
        </div>
    );
}

function CmsNavLink({ to, icon, label, exact, badge }: {
    to: string;
    icon: React.ReactNode;
    label: string;
    exact?: boolean;
    badge?: string;
}) {
    return (
        <Link
            to={to}
            className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground data-[status=active]:bg-accent data-[status=active]:text-foreground"
            activeProps={{ 'data-status': 'active' }}
        >
            {icon}
            <span className="hidden sm:inline">{label}</span>
            {badge && (
                <span className="rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                    {badge}
                </span>
            )}
        </Link>
    );
}
