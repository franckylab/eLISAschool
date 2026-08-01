/**
 * ==================================
 * eLISAschool - Application principale
 * ==================================
 * Composant racine avec Router, ErrorBoundary et SplashScreen
 */

import { useEffect, useState } from 'react';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary';
import { SplashScreen } from '@/components/feedback/SplashScreen';
import { useThemeStore } from '@/stores/theme.store';
import { useAuthStore } from '@/stores/auth.store';
import { routeTree } from '@/routeTree.gen';
import { DebugPermissions } from '@/components/debug/DebugPermissions';
import { AlertTriangle, Home } from 'lucide-react';
import { Link } from '@tanstack/react-router';

// Durée minimum d'affichage du splash (ms)
const SPLASH_MIN_DURATION = 5000;

// Composant Not Found global avec design soigné
function GlobalNotFound() {
    return (
        <div className="flex min-h-[500px] items-center justify-center p-8">
            <div className="text-center space-y-6 max-w-md">
                <div className="relative">
                    <AlertTriangle className="h-20 w-20 text-yellow-500 mx-auto" />
                    <div className="absolute inset-0 h-20 w-20 mx-auto bg-yellow-500/20 rounded-full blur-xl" />
                </div>
                
                <div className="space-y-2">
                    <h2 className="text-3xl font-bold text-foreground">
                        Page non trouvée
                    </h2>
                    <p className="text-muted-foreground text-lg">
                        La page que vous cherchez n'existe pas ou a été déplacée.
                    </p>
                </div>

                <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
                    <p className="font-mono">Code d'erreur : 404</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                    <Link
                        to="/dashboard"
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                        <Home className="h-4 w-4" />
                        Retour au tableau de bord
                    </Link>
                    <button
                        onClick={() => window.history.back()}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                        Page précédente
                    </button>
                </div>
            </div>
        </div>
    );
}

// Créer le router avec configuration complète
const router = createRouter({
    routeTree,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    defaultNotFoundComponent: GlobalNotFound,
});

// Déclaration pour TanStack Router
declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router;
    }
}

// ─── Hook : gestion du splash screen ────────────────
function useSplashScreen() {
    const [splashVisible, setSplashVisible] = useState(true);
    const [minTimeElapsed, setMinTimeElapsed] = useState(false);
    const initialize = useAuthStore((state) => state.initialize);
    const _initialized = useAuthStore((state) => state._initialized);

    useEffect(() => {
        // Initialiser l'auth (sync tokens depuis localStorage)
        initialize();

        // Timer minimum 5s pour le branding
        const timer = setTimeout(() => setMinTimeElapsed(true), SPLASH_MIN_DURATION);
        return () => clearTimeout(timer);
    }, [initialize]);

    useEffect(() => {
        // Disparition du splash : les deux conditions sont remplies
        if (minTimeElapsed && _initialized) {
            // Petit délai pour la transition de sortie
            const fadeTimer = setTimeout(() => setSplashVisible(false), 300);
            return () => clearTimeout(fadeTimer);
        }
    }, [minTimeElapsed, _initialized]);

    return splashVisible;
}

export function App() {
    const appliquerTheme = useThemeStore((state) => state.appliquerTheme);
    const splashVisible = useSplashScreen();

    useEffect(() => {
        appliquerTheme();
    }, [appliquerTheme]);

    return (
        <ErrorBoundary>
            {/* Splash screen avec transition de sortie */}
            <AnimatePresence>
                {splashVisible && (
                    <motion.div
                        key="splash"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4, ease: 'easeInOut' }}
                    >
                        <SplashScreen statusMessage="Initialisation" />
                    </motion.div>
                )}
            </AnimatePresence>

            <RouterProvider router={router} />
            {/* Debug Panel - uniquement en développement */}
            {import.meta.env.DEV && <DebugPermissions />}
        </ErrorBoundary>
    );
}
