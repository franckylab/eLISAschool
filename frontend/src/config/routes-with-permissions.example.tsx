/**
 * ==================================
 * eLISAschool - Configuration des Routes avec Guards de Permissions
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Exemple de configuration des routes TanStack Router avec protection par permissions
 * Ce fichier montre comment intégrer RequirePermission dans votre routing
 */

import { createRouter, createRoute, createRootRoute } from '@tanstack/react-router';
import { RequirePermission, RequireRole } from '@/components/permissions';
import { UnauthorizedPage } from '@/features/system/components/unauthorized-page';

// Import des pages (exemple)
// import { DashboardPage } from '@/features/dashboard';
// import { ElevesPage } from '@/features/eleves';
// import { NotesPage } from '@/features/notes';
// import { FinancesPage } from '@/features/finances';
// import { LoginPage } from '@/features/auth';

// ==================================
// ROUTE RACINE
// ==================================

const rootRoute = createRootRoute({
    component: () => (
        <div>
            <Outlet />
        </div>
    ),
});

// ==================================
// ROUTES PUBLIQUES (pas d'authentification requise)
// ==================================

const loginRoute = createRoute({
    path: '/login',
    component: LoginPage, // Remplacer par votre composant Login
});

const forgotPasswordRoute = createRoute({
    path: '/forgot-password',
    component: ForgotPasswordPage,
});

// ==================================
// ROUTES PROTÉGÉES PAR AUTHENTIFICATION SEULEMENT
// ==================================

const dashboardRoute = createRoute({
    path: '/dashboard',
    // RequirePermission sans props = vérifie juste l'authentification
    element: (
        <RequirePermission>
            <DashboardPage />
        </RequirePermission>
    ),
});

const profileRoute = createRoute({
    path: '/profile',
    element: (
        <RequirePermission>
            <ProfilePage />
        </RequirePermission>
    ),
});

// ==================================
// ROUTES PROTÉGÉES PAR MODULE
// ==================================

const elevesRoute = createRoute({
    path: '/eleves',
    element: (
        <RequirePermission 
            module="eleves" 
            redirectTo="/unauthorized"
        >
            <ElevesPage />
        </RequirePermission>
    ),
});

const eleveDetailRoute = createRoute({
    path: '/eleves/$id',
    element: (
        <RequirePermission module="eleves">
            <EleveDetailPage />
        </RequirePermission>
    ),
});

const eleveEditRoute = createRoute({
    path: '/eleves/$id/edit',
    element: (
        <RequirePermission permission="eleves:edit">
            <EleveEditPage />
        </RequirePermission>
    ),
});

const notesRoute = createRoute({
    path: '/notes',
    element: (
        <RequirePermission module="notes">
            <NotesPage />
        </RequirePermission>
    ),
});

const bulletinsRoute = createRoute({
    path: '/bulletins',
    element: (
        <RequirePermission module="bulletins">
            <BulletinsPage />
        </RequirePermission>
    ),
});

const classesRoute = createRoute({
    path: '/classes',
    element: (
        <RequirePermission module="classes">
            <ClassesPage />
        </RequirePermission>
    ),
});

const matieresRoute = createRoute({
    path: '/matieres',
    element: (
        <RequirePermission module="matieres">
            <MatieresPage />
        </RequirePermission>
    ),
});

// ==================================
// ROUTES PROTÉGÉES PAR PERMISSIONS SPÉCIFIQUES
// ==================================

const financesRoute = createRoute({
    path: '/finances',
    element: (
        <RequirePermission 
            permissions={['finances:view', 'finances:manage']}
            mode="any"
            redirectTo="/unauthorized"
        >
            <FinancesPage />
        </RequirePermission>
    ),
});

const rapportsFinancesRoute = createRoute({
    path: '/rapports/finances',
    element: (
        <RequirePermission permission="rapports:finances:generate">
            <RapportsFinancesPage />
        </RequirePermission>
    ),
});

const rapportsBulletinsRoute = createRoute({
    path: '/rapports/bulletins',
    element: (
        <RequirePermission permission="rapports:bulletins:generate">
            <RapportsBulletinsPage />
        </RequirePermission>
    ),
});

// ==================================
// ROUTES PROTÉGÉES PAR RÔLE
// ==================================

const adminSettingsRoute = createRoute({
    path: '/admin/settings',
    element: (
        <RequireRole 
            roles={['ADMIN', 'SUPER_ADMIN']}
            redirectTo="/unauthorized"
        >
            <AdminSettingsPage />
        </RequireRole>
    ),
});

const adminRolesRoute = createRoute({
    path: '/admin/roles',
    element: (
        <RequireRole roles={['SUPER_ADMIN']}>
            <AdminRolesPage />
        </RequireRole>
    ),
});

const adminAuditRoute = createRoute({
    path: '/admin/audit',
    element: (
        <RequireRole roles={['ADMIN', 'SUPER_ADMIN']}>
            <AdminAuditPage />
        </RequireRole>
    ),
});

// ==================================
// ROUTES POUR MODULES OPTIONNELS
// ==================================

const cantineRoute = createRoute({
    path: '/cantine',
    element: (
        <RequirePermission module="cantine">
            <CantinePage />
        </RequirePermission>
    ),
});

const transportRoute = createRoute({
    path: '/transport',
    element: (
        <RequirePermission module="transport">
            <TransportPage />
        </RequirePermission>
    ),
});

const messagerieRoute = createRoute({
    path: '/messagerie',
    element: (
        <RequirePermission module="messagerie">
            <MessageriePage />
        </RequirePermission>
    ),
});

const sondagesRoute = createRoute({
    path: '/sondages',
    element: (
        <RequirePermission module="sondages">
            <SondagesPage />
        </RequirePermission>
    ),
});

// ==================================
// PAGE D'ERREUR ACCÈS REFUSÉ
// ==================================

const unauthorizedRoute = createRoute({
    path: '/unauthorized',
    component: UnauthorizedPage,
});

// ==================================
// PAGE 404
// ==================================

const notFoundRoute = createRoute({
    path: '/404',
    component: NotFoundPage,
});

// ==================================
// CONSTRUCTION DE L'ARBRE DE ROUTES
// ==================================

const routeTree = rootRoute.addChildren([
    // Routes publiques
    loginRoute,
    forgotPasswordRoute,
    
    // Routes protégées
    dashboardRoute,
    profileRoute,
    
    // Modules académiques
    elevesRoute,
    eleveDetailRoute,
    eleveEditRoute,
    notesRoute,
    bulletinsRoute,
    classesRoute,
    matieresRoute,
    
    // Modules administratifs
    financesRoute,
    rapportsFinancesRoute,
    rapportsBulletinsRoute,
    
    // Administration
    adminSettingsRoute,
    adminRolesRoute,
    adminAuditRoute,
    
    // Modules optionnels
    cantineRoute,
    transportRoute,
    messagerieRoute,
    sondagesRoute,
    
    // Pages d'erreur
    unauthorizedRoute,
    notFoundRoute,
]);

// ==================================
// CRÉATION DU ROUTER
// ==================================

export const router = createRouter({ 
    routeTree,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
});

// ==================================
// TYPES POUR TANSTACK ROUTER
// ==================================

declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router;
    }
}

export default router;
