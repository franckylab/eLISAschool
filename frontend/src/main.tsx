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
import { useAuthStore } from '@/stores/auth.store';

// Root-level error recovery for React crash (error 409 = unmounted root)
const ROOT_KEY = 'elisaschool:crash-recovery';
const bootstrap = () => {
    // Global error handler for React root-level errors (error 409, etc.)
    window.addEventListener('error', (event) => {
        if (event.error?.message?.includes('Cannot update an unmounted root') ||
            event.error?.message?.includes('Minified React error #409')) {
            event.preventDefault();
            console.warn('[Bootstrap] React root unmounted — reloading');
            sessionStorage.setItem(ROOT_KEY, String(Date.now()));
            location.reload();
        }
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
        createRoot(document.getElementById('root')!).render(
            <StrictMode>
                <Providers>
                    <App />
                </Providers>
            </StrictMode>
        );
    } catch (err) {
        console.error('[Bootstrap] React root creation failed:', err);
        sessionStorage.setItem(ROOT_KEY, String(Date.now()));
        location.reload();
    }
};

bootstrap();
