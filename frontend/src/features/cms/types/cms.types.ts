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
    BROUILLON = 'BROUILLON',
    PUBLIE = 'PUBLIE',
    ARCHIVE = 'ARCHIVE',
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
    HERO = 'HERO',
    TEXTE = 'TEXTE',
    GALERIE = 'GALERIE',
    CARTE_INFOS = 'CARTE_INFOS',
    TEMOIGNAGES = 'TEMOIGNAGES',
    CHIFFRES_CLES = 'CHIFFRES_CLES',
    EQUIPE = 'EQUIPE',
    FORMULAIRE = 'FORMULAIRE',
    CARTE = 'CARTE',
    VIDEO = 'VIDEO',
    TELECHARGEMENTS = 'TELECHARGEMENTS',
    ACTUALITES = 'ACTUALITES',
    HORAIRES = 'HORAIRES',
    PARTENAIRES = 'PARTENAIRES',
    FAQ = 'FAQ',
    APPEL_ACTION = 'APPEL_ACTION',
    SEPARATEUR = 'SEPARATEUR',
    HTML_CUSTOM = 'HTML_CUSTOM',
    // v2 — nouvelles sections
    CAROUSEL = 'CAROUSEL',
    TIMELINE = 'TIMELINE',
    TABS = 'TABS',
    NEWSLETTER = 'NEWSLETTER',
    HERO_VIDEO = 'HERO_VIDEO',
    COMPTEURS_ANIMES = 'COMPTEURS_ANIMES',
    TEMOIGNAGE_CAROUSEL = 'TEMOIGNAGE_CAROUSEL',
    PRIX_TAB = 'PRIX_TAB',
    ICONE_FEATURES = 'ICONE_FEATURES',
    GALERIE_MASONRY = 'GALERIE_MASONRY',
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
    animations?: {
        type?: AnimationType;
        duration?: number;
        delay?: number;
        easing?: AnimationEasing;
        stagger?: boolean;
        hover?: HoverEffect;
        parallax?: boolean;
    };
    version?: number;
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
    version?: number;
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

// ==================================
// Templates CMS
// ==================================

export enum CategorieTemplate {
    ACCUEIL = 'accueil',
    PAGE = 'page',
    SPECIAL = 'special',
}

export interface CmsTemplateSectionDef {
    type: string;
    titre?: string;
    contenu: Record<string, any>;
    styles?: Record<string, any>;
    ordre: number;
    anchorId?: string;
}

export interface CmsTemplate {
    id: string;
    nom: string;
    code: string;
    description?: string;
    categorie: CategorieTemplate;
    sectionsDef: CmsTemplateSectionDef[];
    thumbnail?: string;
    estSysteme: boolean;
    actif: boolean;
    ordre: number;
    createdAt: string;
    updatedAt: string;
}

// ==================================
// Types Animations CMS avancées
// ==================================

/** Types d'animation d'entrée en scène (15 variants) */
export type AnimationType =
    | 'fade-in'
    | 'slide-up'
    | 'slide-down'
    | 'slide-left'
    | 'slide-right'
    | 'zoom'
    | 'zoom-out'
    | 'flip-x'
    | 'flip-y'
    | 'rotate'
    | 'blur'
    | 'scale-up'
    | 'bounce'
    | 'elastic'
    | 'none';

/** Courbes d'animation */
export type AnimationEasing =
    | 'easeOut'
    | 'easeIn'
    | 'easeInOut'
    | 'linear'
    | 'spring'
    | 'bounce'
    | 'elastic';

/** Effets de survol (hover) */
export type HoverEffect =
    | 'none'
    | 'lift'
    | 'glow'
    | 'scale'
    | 'tilt'
    | 'shadow'
    | 'border-glow';

/** Configuration d'animation complète pour une section */
export interface AnimationConfig {
    type?: AnimationType;
    duration?: number;
    delay?: number;
    easing?: AnimationEasing;
    stagger?: boolean;
    hover?: HoverEffect;
    parallax?: boolean;
}

// ==================================
// Contenu dynamique CMS (Phase 5A)
// ==================================

export enum StatutActualite {
    BROUILLON = 'BROUILLON',
    PUBLIE = 'PUBLIE',
    ARCHIVE = 'ARCHIVE',
}

export enum CategorieTemoignage {
    ELEVE = 'ELEVE',
    PARENT = 'PARENT',
    ENSEIGNANT = 'ENSEIGNANT',
    ANCIEN = 'ANCIEN',
    AUTRE = 'AUTRE',
}

export enum TypeEvenement {
    CULTUREL = 'CULTUREL',
    SPORTIF = 'SPORTIF',
    ACADEMIQUE = 'ACADEMIQUE',
    REUNION = 'REUNION',
    AUTRE = 'AUTRE',
}

export interface CmsActualite {
    id: string;
    etablissementId: string;
    titre: string;
    slug: string;
    resume?: string;
    contenu?: string;
    image?: string;
    categorie?: string;
    statut: StatutActualite;
    auteurNom?: string;
    auteurId?: string;
    datePublication?: string;
    vues: number;
    estEnUne: boolean;
    seo?: Record<string, any>;
    createdAt: string;
    updatedAt: string;
}

export interface CmsTemoignage {
    id: string;
    etablissementId: string;
    nom: string;
    role?: string;
    categorie: CategorieTemoignage;
    texte: string;
    photo?: string;
    note: number;
    ordre: number;
    estVisible: boolean;
    estEnUne: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CmsEvenement {
    id: string;
    etablissementId: string;
    titre: string;
    description?: string;
    image?: string;
    dateDebut: string;
    dateFin?: string;
    type: TypeEvenement;
    lieu?: string;
    estPublic: boolean;
    metadata?: Record<string, any>;
    createdAt: string;
    updatedAt: string;
}

export interface CmsPartenaire {
    id: string;
    etablissementId: string;
    nom: string;
    logo?: string;
    siteWeb?: string;
    categorie: string;
    description?: string;
    ordre: number;
    estEnUne: boolean;
    estVisible: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CmsAbonnementNewsletter {
    id: string;
    etablissementId: string;
    email: string;
    nom?: string;
    estActif: boolean;
    source?: string;
    createdAt: string;
    deletedAt?: string;
}
