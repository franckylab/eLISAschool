/**
 * ==================================
 * eLISAschool - Point d'entrée Frontend
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import '@/lib/i18n';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/app/App';
import { Providers } from '@/app/providers';
import '@/styles/globals.css';
import '@/styles/animations.css';
import { useAuthStore } from '@/stores/auth.store';

// Root-level error recovery for React crash (error 409 = unmounted root)
const ROOT_KEY = 'elisaschool:crash-recovery';
const bootstrap = () => {
    // Global error handler — capture TOUTES les erreurs non gérées
    window.addEventListener('error', (event) => {
        console.error('[Bootstrap] Erreur globale capturée:', event.error?.message || event.message);

        // React root unmounted (error 409) — reload immédiat
        if (event.error?.message?.includes('Cannot update an unmounted root') ||
            event.error?.message?.includes('Minified React error #409')) {
            event.preventDefault();
            console.warn('[Bootstrap] React root unmounted — rechargement');
            sessionStorage.setItem(ROOT_KEY, String(Date.now()));
            location.reload();
        }
    });

    // Capture des promesses rejetées non gérées
    window.addEventListener('unhandledrejection', (event) => {
        console.error('[Bootstrap] Promesse rejetée non gérée:', event.reason);
    });

    // Detect consecutive crashes — avoid infinite reload
    try {
        const lastCrash = parseInt(sessionStorage.getItem(ROOT_KEY) ?? '0', 10);
        if (lastCrash > 0 && Date.now() - lastCrash < 10000) {
            sessionStorage.removeItem(ROOT_KEY);
            document.body.innerHTML = `
                <div style="display:flex;min-height:100vh;align-items:center;justify-content:center;font-family:sans-serif">
                    <div style="text-align:center;max-width:400px;padding:2rem">
                        <h1 style="font-size:1.5rem;margin-bottom:0.5rem;color:#1f2937">Erreur critique</h1>
                        <p style="color:#6b7280;margin-bottom:1.5rem">L'application a rencontré une erreur irrécupérable. Veuillez vider le cache et réessayer.</p>
                        <button onclick="localStorage.clear();sessionStorage.clear();location.reload()"
                                style="padding:0.5rem 1rem;background:#28a745;color:white;border:none;border-radius:0.5rem;cursor:pointer">
                            Réinitialiser & recharger
                        </button>
                    </div>
                </div>
            `;
            return;
        }
    } catch { /* sessionStorage may be unavailable */ }

    // Initialize token sync at startup
    useAuthStore.getState().initialize();

    try {
        const rootElement = document.getElementById('root');
        if (!rootElement) {
            throw new Error('Element #root introuvable dans le DOM');
        }

        const root = createRoot(rootElement);
        root.render(
            <StrictMode>
                <Providers>
                    <App />
                </Providers>
            </StrictMode>
        );

        // Safety net : si le root est vide après 12s, forcer un rechargement
        setTimeout(() => {
            const rootEl = document.getElementById('root');
            if (rootEl && rootEl.children.length === 0) {
                console.error('[Bootstrap] Root vide après 12s — rechargement forcé');
                location.reload();
            }
        }, 12000);
    } catch (err) {
        console.error('[Bootstrap] React root creation failed:', err);
        sessionStorage.setItem(ROOT_KEY, String(Date.now()));
        location.reload();
    }
};

bootstrap();
