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

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <Providers>
            <App />
        </Providers>
    </StrictMode>
);
