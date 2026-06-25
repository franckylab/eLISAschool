/**
 * ==================================
 * eLISAschool - Auth Layout Route
 * ==================================
 * Layout commun pour les routes authentifiées
 * Inclut AuthGuard + PageLayout
 */

import { createFileRoute, Outlet, useRouter } from '@tanstack/react-router';
import { authGuard } from '@/app/route-guards';
import { PageLayout } from '@/components/layout/PageLayout';
import { AlertTriangle } from 'lucide-react';
import { useEtablissementRequired } from '@/hooks/use-etablissement-required';
import { useSessionExpired } from '@/hooks/use-session-expired';
import { EtablissementSelectionModal } from '@/components/auth/EtablissementSelectionModal';
import { useAuthStore } from '@/stores/auth.store';
import { useCallback } from 'react';

function AuthLayout() {
    console.log('[AuthLayout] Rendu du layout authentifié');
    
    // NOUVEAU: Écouter l'événement 'auth:etablissement-required'
    const {
        showEtablissementModal,
        etablissements,
        expiresIn,
        handleSelectEtablissement,
    } = useEtablissementRequired();

    console.log('[AuthLayout] État sélection établissement:', {
        showEtablissementModal,
        etablissementsCount: etablissements?.length ?? 0,
        expiresIn,
    });

    // NOUVEAU: Gérer l'expiration de session et la déconnexion
    useSessionExpired();

    const router = useRouter();
    const { reset } = useAuthStore();

    /**
     * Annulation de la sélection d'établissement dans le modal global.
     * Reset complet + navigation vers /login pour éviter toute connexion fantôme.
     */
    const handleCancelEtablissement = useCallback(() => {
        reset();
        router.navigate({ to: '/login', search: { redirect: undefined } });
    }, [reset, router]);

    return (
        <PageLayout>
            <Outlet />
            
            {/* Modal de sélection d'établissement (global) */}
            <EtablissementSelectionModal
                open={showEtablissementModal}
                etablissements={etablissements}
                onSelect={handleSelectEtablissement}
                onCancel={handleCancelEtablissement}
                expiresIn={expiresIn}
            />
        </PageLayout>
    );
}

function AuthNotFound() {
    return (
        <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center space-y-4">
                <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto" />
                <h2 className="text-2xl font-bold text-foreground">Page non trouvée</h2>
                <p className="text-muted-foreground max-w-md">
                    La page que vous cherchez n'existe pas ou a été déplacée.
                </p>
                <p className="text-sm text-muted-foreground font-mono bg-muted/50 rounded px-3 py-2">
                    Code d'erreur : 404
                </p>
            </div>
        </div>
    );
}

export const Route = createFileRoute('/_auth')({
    beforeLoad: () => {
        authGuard();
    },
    component: AuthLayout,
    notFoundComponent: AuthNotFound,
});
