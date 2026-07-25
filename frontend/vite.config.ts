/**
 * ==================================
 * eLISAschool - Configuration Vite
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import path from 'path';

export default defineConfig({
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
        },
    },
    server: {
        port: 7001,
        host: '0.0.0.0',
        // Configuration HMR pour Docker
        hmr: {
            protocol: 'ws',
            host: 'localhost',
            port: 7001,
            clientPort: 7001,
        },
        watch: {
            // Utiliser le polling pour Docker (compatible avec les volumes bind mount)
            usePolling: true,
            // Intervalle de vérification (ms)
            interval: 100,
            // Ignorer node_modules et .git
            ignored: ['**/node_modules/**', '**/.git/**'],
        },
        // Proxy Vite DÉSACTIVÉ - bug http-proxy-middleware dans Docker
        // Le frontend utilise VITE_API_URL pour appeler directement le backend
        // proxy: { ... } ← SUPPRIMÉ
    },
    build: {
        sourcemap: false,
        rollupOptions: {
            output: {
                manualChunks: {
                    'react-vendor': ['react', 'react-dom'],
                    'query-vendor': ['@tanstack/react-query'],
                    'router-vendor': ['@tanstack/react-router'],
                    'ui-vendor': ['framer-motion', 'lucide-react'],
                },
            },
        },
    },
    optimizeDeps: {
        include: ['react', 'react-dom', '@tanstack/react-query', 'zustand', 'i18next', 'html-to-image'],
    },
});
