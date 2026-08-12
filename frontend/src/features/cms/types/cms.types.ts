/**
 * ==================================
 * eLISAschool - Types CMS (pages publiques)
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Types TypeScript pour le système CMS white-label.
 * Utilisés par les routes publiques /e/:code et l'éditeur CMS.
 */

// ==================================
// Enums CMS
// ==================================

export enum StatutPage {
    BROUILLON = 'brouillon',
    PUBLIE = 'publie',
    HORS_LIGNE = 'hors_ligne',
    PROGRAMME = 'programme',
}

export enum TemplatePage {
    PAGE_VIERGE = 'page_vierge',
    ACCUEIL = 'accueil',
    CONTACT = 'contact',
    GALERIE = 'galerie',
    ACTUALITES = 'actualites',
    INSCRIPTIONS = 'inscriptions',
    MENTIONS_LEGALES = 'mentions_legales',
}

export enum SectionType {
    HERO = 'hero',
    TEXTE = 'texte',
    GALERIE = 'galerie',
    CARTE_INFOS = 'carte_infos',
    TEMOIGNAGES = 'temoignages',
    CHIFFRES_CLES = 'chiffres_cles',
    EQUIPE = 'equipe',
    FORMULAIRE = 'formulaire',
    CARTE = 'carte',
    VIDEO = 'video',
    TELECHARGEMENTS = 'telechargements',
    ACTUALITES = 'actualites',
    HORAIRES = 'horaires',
    PARTENAIRES = 'partenaires',
    FAQ = 'faq',
    APPEL_ACTION = 'appel_action',
    SEPARATEUR = 'separateur',
    HTML_CUSTOM = 'html_custom',
}

export enum TypeMedia {
    IMAGE = 'image',
    VIDEO = 'video',
    DOCUMENT = 'document',
}

export enum EmplacementMenu {
    PRINCIPAL = 'principal',
    PIED_PAGE = 'pied_page',
    LATERAL = 'lateral',
}

export enum EmplacementWidget {
    SIDEBAR = 'sidebar',
    PIED_PAGE = 'pied_page',
    EN_TETE = 'en_tete',
    FLOTTANT = 'flottant',
}

// ==================================
// Entités CMS
// ==================================

export interface CmsSection {
    id: string;
    type: SectionType;
    titre?: string;
    contenu: Record<string, any>;
    ordre: number;
    visible: boolean;
    styles?: Record<string, any>;
    pageId: string;
}

export interface CmsPage {
    id: string;
    titre: string;
    slug: string;
    template: TemplatePage;
    statut: StatutPage;
    ordre: number;
    estPageAccueil: boolean;
    seo?: {
        metaTitre?: string;
        metaDescription?: string;
        ogImage?: string;
    };
    sections?: CmsSection[];
    etablissementId: string;
    createdAt: string;
    updatedAt: string;
}

export interface CmsTheme {
    id: string;
    nom: string;
    couleurs: {
        primaire: string;
        secondaire: string;
        accent: string;
        fond: string;
        texte: string;
        texteClair: string;
    };
    typographie: {
        titre: string;
        corps: string;
    };
    actif: boolean;
    etablissementId: string;
}

export interface CmsMenuItem {
    id: string;
    label: string;
    url?: string;
    pageSlug?: string;
    ordre: number;
    icone?: string;
    ouvrirdansNouvelOnglet: boolean;
    enfants?: CmsMenuItem[];
}

export interface CmsMenu {
    id: string;
    nom: string;
    emplacement: EmplacementMenu;
    items: CmsMenuItem[];
    etablissementId: string;
}

export interface CmsWidget {
    id: string;
    type: string;
    titre?: string;
    contenu: Record<string, any>;
    emplacement: EmplacementWidget;
    ordre: number;
    actif: boolean;
    etablissementId: string;
}

// ==================================
// Types API publique
// ==================================

export interface EtablissementPublic {
    id: string;
    nom: string;
    slogan?: string;
    pays: string;
    region?: string;
    ville: string;
    quartier?: string;
    adresse?: string;
    latitude?: number;
    longitude?: number;
    contactEmail?: string;
    contactTelephone?: string;
    logoBase64?: string;
    logoType?: string;
    couleurPrimaire?: string;
    couleurSecondaire?: string;
    siteWeb?: string;
    facebook?: string;
    twitter?: string;
    heuresOuverture?: string;
    heuresFermeture?: string;
    descriptionPublique?: string;
    codeEtablissement: string;
    sousSysteme?: string;
    type?: string;
    directeurNom?: string;
    devise?: string;
    fuseauHoraire?: string;
    langueDefaut?: string;
}

export interface PageAccueilData {
    etab: EtablissementPublic;
    page: CmsPage | null;
    sections: CmsSection[];
    theme: CmsTheme | null;
    menus: CmsMenu[];
    widgets: CmsWidget[];
}

export interface PagePubliqueData {
    page: CmsPage;
    sections: CmsSection[];
}
