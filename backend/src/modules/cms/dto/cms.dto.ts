/**
 * ==================================
 * eLISAschool - DTOs CMS (Zod schemas)
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { z } from 'zod';

// ==================================
// Schémas CMS Pages
// ==================================

export const seoSchema = z.object({
    metaTitle: z.string().max(200).optional(),
    metaDescription: z.string().max(500).optional(),
    metaKeywords: z.array(z.string().max(50)).max(20).optional(),
    ogImage: z.string().url().optional(),
});

export const createPageSchema = z.object({
    titre: z.string().min(1).max(200),
    slug: z.string().min(1).max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    template: z.string().max(50).default('custom'),
    statut: z.enum(['BROUILLON', 'PUBLIE', 'ARCHIVE']).default('BROUILLON'),
    ordre: z.number().int().min(0).default(0),
    pageParentId: z.string().uuid().optional(),
    metadata: z.record(z.unknown()).optional(),
    seo: seoSchema.optional(),
    estPageAccueil: z.boolean().default(false),
});

export const updatePageSchema = createPageSchema.partial().omit({ slug: true }).extend({
    version: z.number().int().min(0).optional(),
    focusPreferences: z.record(z.unknown()).optional(),
    qualiteScore: z.number().int().min(0).max(100).optional(),
    analytics: z.record(z.unknown()).optional(),
});

export const publierPageSchema = z.object({
    commentaire: z.string().max(255).optional(),
});

export const reordonnerSectionsSchema = z.object({
    sections: z.array(z.object({
        id: z.string().uuid(),
        ordre: z.number().int().min(0),
    })),
});

// ==================================
// Schémas CMS Sections
// ==================================

export const createSectionSchema = z.object({
    type: z.string().min(1).max(50),
    contenu: z.record(z.unknown()).default({}),
    ordre: z.number().int().min(0).default(0),
    styles: z.record(z.unknown()).optional(),
    visible: z.boolean().default(true),
    anchorId: z.string().max(50).optional(),
    conditionsVisibilite: z.object({
        breakpoints: z.object({ mobile: z.boolean(), tablet: z.boolean(), desktop: z.boolean(), wide: z.boolean() }).optional(),
        rolesAutorises: z.array(z.string()).optional(),
        rolesExclus: z.array(z.string()).optional(),
        dateDebut: z.string().optional(),
        dateFin: z.string().optional(),
        masquerComplet: z.boolean().optional(),
    }).optional(),
    styleConfig: z.record(z.unknown()).optional(),
});

export const updateSectionSchema = createSectionSchema.partial().extend({
    version: z.number().int().min(0).optional(),
});

// ==================================
// Schémas CMS Medias
// ==================================

export const createMediaSchema = z.object({
    nom: z.string().min(1).max(255),
    type: z.enum(['image', 'video', 'document', 'audio']),
    url: z.string().min(1).max(500),
    alt: z.string().max(255).optional(),
    taille: z.number().int().optional(),
    mimeType: z.string().max(50).optional(),
    largeur: z.number().int().optional(),
    hauteur: z.number().int().optional(),
    metadata: z.record(z.unknown()).optional(),
    dossier: z.string().max(100).optional(),
});

// ==================================
// Schémas CMS Themes
// ==================================

export const themeVariablesSchema = z.object({
    couleurFond: z.string().optional(),
    couleurTexte: z.string().optional(),
    couleurPrimaire: z.string().optional(),
    couleurSecondaire: z.string().optional(),
    couleurAccent: z.string().optional(),
    policeTitres: z.string().optional(),
    policeCorps: z.string().optional(),
    tailleTitre: z.string().optional(),
    tailleCorps: z.string().optional(),
    largeurMax: z.string().optional(),
    espacement: z.string().optional(),
    styleBordures: z.enum(['rounded', 'sharp', 'pill']).optional(),
    headerStyle: z.enum(['transparent', 'solid', 'gradient']).optional(),
    footerStyle: z.enum(['minimal', 'complet', 'sombre']).optional(),
});

export const createThemeSchema = z.object({
    nom: z.string().min(1).max(100),
    variables: themeVariablesSchema.default({}),
    polices: z.record(z.unknown()).optional(),
    actif: z.boolean().default(false),
});

export const updateThemeSchema = createThemeSchema.partial();

// ==================================
// Schémas CMS Menus
// ==================================

export const menuItemSchema = z.object({
    id: z.string().uuid(),
    label: z.string().min(1).max(100),
    type: z.enum(['page', 'url', 'ancre', 'sous-menu']),
    pageId: z.string().uuid().optional(),
    urlExterne: z.string().url().optional(),
    anchor: z.string().optional(),
    children: z.array(z.lazy(() => menuItemSchema)).optional(),
    ordre: z.number().int().min(0),
    visible: z.boolean().default(true),
    icon: z.string().optional(),
    nouvelleTab: z.boolean().optional(),
});

export const createMenuSchema = z.object({
    nom: z.string().min(1).max(100),
    emplacement: z.enum(['principal', 'pied_page', 'lateral']).default('principal'),
    items: z.array(menuItemSchema).default([]),
});

export const updateMenuSchema = createMenuSchema.partial();

// ==================================
// Schémas CMS Widgets
// ==================================

export const createWidgetSchema = z.object({
    type: z.string().min(1).max(50),
    titre: z.string().max(200).optional(),
    contenu: z.record(z.unknown()).default({}),
    emplacement: z.enum(['sidebar', 'pied_page', 'en_tete', 'flottant']).default('sidebar'),
    ordre: z.number().int().min(0).default(0),
    actif: z.boolean().default(true),
});

export const updateWidgetSchema = createWidgetSchema.partial();

// ==================================
// Schémas CMS Contact public
// ==================================

export const contactPublicSchema = z.object({
    nom: z.string().min(2).max(100),
    email: z.string().email(),
    sujet: z.string().min(2).max(200),
    message: z.string().min(10).max(5000),
    telephone: z.string().optional(),
    // Honeypot anti-spam — doit être vide
    _honeypot: z.string().max(0).optional(),
});

// ==================================
// Schémas CMS Templates
// ==================================

export const instancierTemplateSchema = z.object({
    titre: z.string().min(1).max(200).optional(),
    slug: z.string().max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
    publier: z.boolean().default(false),
});

// ==================================
// Schémas CMS Réinitialisation
// ==================================

export const reinitialiserCmsSchema = z.object({
    conserverMedias: z.boolean().default(true),
    inclureDemo: z.boolean().default(false),
});

// ==================================
// Schémas CMS Export/Import
// ==================================

export const exportPageSchema = z.object({
    inclureSections: z.boolean().default(true),
    inclureMetadata: z.boolean().default(true),
    format: z.enum(['json', 'puck']).default('json'),
});

export const importPageSchema = z.object({
    titre: z.string().min(1).max(200),
    slug: z.string().max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
    sections: z.array(z.object({
        type: z.string(),
        contenu: z.record(z.unknown()).default({}),
        ordre: z.number().int().min(0).default(0),
        visible: z.boolean().default(true),
        styles: z.record(z.unknown()).optional(),
    })).default([]),
    metadata: z.record(z.unknown()).optional(),
    statut: z.enum(['BROUILLON', 'PUBLIE']).default('BROUILLON'),
    ecraserExistante: z.boolean().default(false),
});

// ==================================
// Types inférés
// ==================================

export type CreatePageDto = z.infer<typeof createPageSchema>;
export type UpdatePageDto = z.infer<typeof updatePageSchema>;
export type CreateSectionDto = z.infer<typeof createSectionSchema>;
export type UpdateSectionDto = z.infer<typeof updateSectionSchema>;
export type CreateMediaDto = z.infer<typeof createMediaSchema>;
export type CreateThemeDto = z.infer<typeof createThemeSchema>;
export type UpdateThemeDto = z.infer<typeof updateThemeSchema>;
export type CreateMenuDto = z.infer<typeof createMenuSchema>;
export type UpdateMenuDto = z.infer<typeof updateMenuSchema>;
export type CreateWidgetDto = z.infer<typeof createWidgetSchema>;
export type UpdateWidgetDto = z.infer<typeof updateWidgetSchema>;
export type ContactPublicDto = z.infer<typeof contactPublicSchema>;
export type ReordonnerSectionsDto = z.infer<typeof reordonnerSectionsSchema>;
export type InstancierTemplateDto = z.infer<typeof instancierTemplateSchema>;
export type ReinitialiserCmsDto = z.infer<typeof reinitialiserCmsSchema>;
export type ExportPageDto = z.infer<typeof exportPageSchema>;
export type ImportPageDto = z.infer<typeof importPageSchema>;
