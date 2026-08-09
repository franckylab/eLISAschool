/**
 * ==================================
 * eLISAschool - Configuration Vite
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import path from 'path';

export default defineConfig(({ mode }) => {
    // Charger les variables d'environnement (.env + .env.local)
    // loadEnv lit toutes les variables (pas seulement VITE_)
    const env = loadEnv(mode, process.cwd(), '');
    const backendUrl = env.BACKEND_URL || 'http://localhost:7000';

    return {
        plugins: [
        TanStackRouterVite({
            routesDirectory: './src/routes',
            generatedRouteTree: './src/routeTree.gen.ts',
        }),
        react(),
        tailwindcss(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.ico', 'icons/*.png', 'logos/*.svg'],
            manifest: {
                name: 'eLISAschool - Gestion Scolaire',
                short_name: 'eLISAschool',
                description: 'Application de gestion scolaire avancée pour établissements africains',
                theme_color: '#28a745',
                background_color: '#ffffff',
                display: 'standalone',
                orientation: 'portrait-primary',
                start_url: '/',
                scope: '/',
                icons: [
                    {
                        src: '/icons/icon-192.png',
                        sizes: '192x192',
                        type: 'image/png',
                    },
                    {
                        src: '/icons/icon-512.png',
                        sizes: '512x512',
                        type: 'image/png',
                    },
                    {
                        src: '/icons/icon-maskable-512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'maskable',
                    },
                ],
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
                cleanupOutdatedCaches: true,
                skipWaiting: true,
                clientsClaim: true,
                runtimeCaching: [
                    {
                        urlPattern: /^\/api\/.*/i,
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'api-cache',
                            expiration: { maxEntries: 50, maxAgeSeconds: 300 },
                        },
                    },
                    {
                        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'image-cache',
                            expiration: { maxEntries: 100, maxAgeSeconds: 86400 * 30 },
                        },
                    },
                ],
            },
            devOptions: {
                enabled: false, // Désactiver PWA en développement pour éviter les violations message
            },
        }),
        ],
        resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@shared': path.resolve(__dirname, '../shared/src'),
            // Phase fix v6 : @casl/ability est dans /app/node_modules mais le shared
            // est monté à /shared (hors /app). Sans cet alias, Vite ne résout pas
            // @casl/ability depuis /shared/src/casl/abilities.ts.
            '@casl/ability': path.resolve(__dirname, 'node_modules/@casl/ability'),
        },
        },
        server: {
        port: 7001,
        host: '0.0.0.0',
        // Autoriser les IPs du réseau local et noms de services Docker
        // Vite bloque les hosts non reconnus (protection DNS rebinding)
        allowedHosts: [
            'frontend_app', 'backend_api',
            'localhost', '127.0.0.1', '0.0.0.0',
            // Réseau local 10.0.0.0/24 (ajoutez d'autres sous-réseaux si nécessaire)
            ...Array.from({ length: 255 }, (_, i) => `10.0.0.${i + 1}`),
        ],
        // Configuration HMR pour Docker + nginx
        // Chemin personnalisé pour que nginx puisse router les WebSocket HMR
        hmr: {
            protocol: 'ws',
            path: '/__vite_hmr',
        },
        watch: {
            // Utiliser le polling pour Docker (compatible avec les volumes bind mount)
            usePolling: true,
            // Intervalle de vérification (ms)
            interval: 100,
            // Ignorer node_modules et .git
            ignored: ['**/node_modules/**', '**/.git/**'],
        },
        // Proxy Vite : redirige /api/* vers le backend
        // Essentiel pour le développement hors Docker (sans nginx)
        // BACKEND_URL : URL du backend (défaut: http://localhost:7000)
        // En Docker : nginx gère le proxy, ce proxy n'est pas utilisé
        proxy: {
            '/api': {
                target: backendUrl,
                changeOrigin: true,
            },
            '/uploads': {
                target: backendUrl,
                changeOrigin: true,
            },
            '/fonds-principal': {
                target: backendUrl,
                changeOrigin: true,
            },
        },
        },
        build: {
        sourcemap: false,
        rollupOptions: {
            output: {
                manualChunks: {
                    // Core vendors
                    'react-vendor': ['react', 'react-dom'],
                    'query-vendor': ['@tanstack/react-query'],
                    'router-vendor': ['@tanstack/react-router'],
                    'ui-vendor': ['framer-motion', 'lucide-react'],
                    // Phase E.4 — Code splitting admin/platform
                    // Note: @casl/react et recharts retirés (non installés)
                    'admin-vendor': ['@casl/ability'],
                    'admin-platform': [
                        './src/routes/platform.dashboard.tsx',
                        './src/routes/platform.configuration.tsx',
                        './src/routes/platform.etablissements.tsx',
                        './src/routes/platform.facturation.tsx',
                        './src/routes/platform.monitoring.tsx',
                        './src/routes/platform.modules.tsx',
                        './src/routes/platform.audit.tsx',
                    ],
                },
            },
        },
        },
        optimizeDeps: {
            include: ['react', 'react-dom', '@tanstack/react-query', 'zustand', 'i18next', 'html-to-image', '@casl/ability'],
        },
    };
});
