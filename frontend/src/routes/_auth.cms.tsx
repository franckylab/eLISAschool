/**
 * ==================================
 * eLISAschool - Layout CMS (éditeur)
 * ==================================
 * Route: /_auth/cms
 * Layout pour l'éditeur CMS authentifié.
 */

import { createFileRoute, Outlet, Link } from '@tanstack/react-router';
import { FileText, Layout, Palette, Menu, Settings, ArrowLeft, Image, GitBranch } from 'lucide-react';

export const Route = createFileRoute('/_auth/cms')({
    component: CmsLayout,
});

function CmsLayout() {
    return (
        <div className="flex h-full flex-col">
            {/* Sous-navigation CMS */}
            <div className="border-b bg-card/50 px-6">
                <div className="flex items-center gap-6">
                    <Link
                        to="/dashboard"
                        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="h-3 w-3" />
                        Retour
                    </Link>
                    <div className="h-4 w-px bg-border" />
                    <nav className="flex items-center gap-1">
                        <CmsNavLink to="/cms" icon={<Layout className="h-4 w-4" />} label="Dashboard" exact />
                        <CmsNavLink to="/cms/pages" icon={<FileText className="h-4 w-4" />} label="Pages" />
                        <CmsNavLink to="/cms/medias" icon={<Image className="h-4 w-4" />} label="Médias" />
                        <CmsNavLink to="/cms/themes" icon={<Palette className="h-4 w-4" />} label="Thèmes" />
                        <CmsNavLink to="/cms/menus" icon={<Menu className="h-4 w-4" />} label="Menus" />
                        <CmsNavLink to="/cms/widgets" icon={<Settings className="h-4 w-4" />} label="Widgets" />
                        <CmsNavLink to="/cms/versions" icon={<GitBranch className="h-4 w-4" />} label="Versions" />
                    </nav>
                </div>
            </div>

            {/* Contenu */}
            <div className="flex-1 overflow-auto">
                <Outlet />
            </div>
        </div>
    );
}

function CmsNavLink({ to, icon, label, exact }: { to: string; icon: React.ReactNode; label: string; exact?: boolean }) {
    return (
        <Link
            to={to}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground data-[status=active]:bg-accent data-[status=active]:text-foreground"
            activeProps={{ 'data-status': 'active' }}
        >
            {icon}
            {label}
        </Link>
    );
}
