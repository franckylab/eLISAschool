/**
 * ==================================
 * eLISAschool - Contexte pages publiques CMS
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Contexte partagé entre le layout parent (e.$code.tsx)
 * et les routes enfants (slug, contact, galerie, inscriptions).
 * Évite les appels API redondants pour les données communes.
 */

import { createContext, useContext } from 'react';
import type { EtablissementPublic, CmsTheme, CmsMenu, CmsWidget } from '../types/cms.types';

export interface PublicPageContextValue {
    etab: EtablissementPublic;
    theme: CmsTheme | null | undefined;
    menus: CmsMenu[];
    widgets: CmsWidget[];
    code: string;
}

export const PublicPageContext = createContext<PublicPageContextValue | null>(null);

/**
 * Hook pour accéder aux données publiques partagées depuis le layout parent.
 * À utiliser dans les routes enfants de /e/$code.
 */
export function usePublicPage(): PublicPageContextValue {
    const ctx = useContext(PublicPageContext);
    if (!ctx) {
        throw new Error('usePublicPage() doit être utilisé à l\'intérieur de <PublicPageContext.Provider>');
    }
    return ctx;
}
