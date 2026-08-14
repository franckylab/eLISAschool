/**
 * ==================================
 * Interfaces typées — Contenu des 18 sections CMS
 * ==================================
 * Remplace Record<string, any> par des types stricts
 * depuis la DB jusqu'au rendu.
 */

// ==================================
// Types partagés
// ==================================

export interface BoutonSection {
    label: string;
    url: string;
    principal?: boolean;
    nouvelOnglet?: boolean;
}

export interface ImageMedia {
    url: string;
    alt?: string;
    legend?: string;
}

// ==================================
// 18 interfaces de contenu section
// ==================================

export interface HeroSectionContent {
    imageFond?: string;
    surtitre?: string;
    titre?: string;
    description?: string;
    boutons?: BoutonSection[];
}

export interface TexteSectionContent {
    html?: string;
    texte?: string;
}

export interface GalerieSectionContent {
    images?: ImageMedia[];
}

export interface CarteInfosSectionContent {
    cartes?: Array<{
        icone?: string;
        titre?: string;
        description?: string;
    }>;
}

export interface TemoignagesSectionContent {
    temoignages?: Array<{
        texte?: string;
        nom?: string;
        fonction?: string;
        avatar?: string;
    }>;
}

export interface ChiffresClesSectionContent {
    chiffres?: Array<{
        valeur?: string | number;
        label?: string;
        description?: string;
    }>;
}

export interface EquipeSectionContent {
    membres?: Array<{
        nom?: string;
        photo?: string;
        fonction?: string;
        bio?: string;
        email?: string;
        linkedin?: string;
        twitter?: string;
    }>;
}

export interface FormulaireSectionContent {
    description?: string;
}

export interface CarteSectionContent {
    latitude?: number;
    longitude?: number;
    adresse?: string;
}

export interface VideoSectionContent {
    youtubeId?: string;
    videoUrl?: string;
    poster?: string;
    titre?: string;
    description?: string;
}

export interface TelechargementsSectionContent {
    fichiers?: Array<{
        nom?: string;
        url?: string;
        description?: string;
        taille?: string;
    }>;
}

export interface ActualitesSectionContent {
    actualites?: Array<{
        titre?: string;
        date?: string;
        image?: string;
        resume?: string;
        lien?: string;
    }>;
}

export interface HorairesSectionContent {
    horaires?: Array<{
        jour?: string;
        horaires?: string;
    }>;
}

export interface PartenairesSectionContent {
    partenaires?: Array<{
        nom?: string;
        logo?: string;
        url?: string;
    }>;
}

export interface FaqSectionContent {
    faqs?: Array<{
        question?: string;
        reponse?: string;
    }>;
}

export interface AppelActionSectionContent {
    titre?: string;
    description?: string;
    icone?: string;
    bouton?: BoutonSection;
    imageFond?: string;
}

export interface SeparateurSectionContent {
    style?: 'ligne' | 'espace';
    hauteur?: number;
}

export interface HtmlCustomSectionContent {
    html?: string;
}

// ==================================
// Union type — toutes les sections
// ==================================

export type SectionContent =
    | HeroSectionContent
    | TexteSectionContent
    | GalerieSectionContent
    | CarteInfosSectionContent
    | TemoignagesSectionContent
    | ChiffresClesSectionContent
    | EquipeSectionContent
    | FormulaireSectionContent
    | CarteSectionContent
    | VideoSectionContent
    | TelechargementsSectionContent
    | ActualitesSectionContent
    | HorairesSectionContent
    | PartenairesSectionContent
    | FaqSectionContent
    | AppelActionSectionContent
    | SeparateurSectionContent
    | HtmlCustomSectionContent;

// ==================================
// Map type SectionType → Content
// ==================================

export interface SectionContentMap {
    HERO: HeroSectionContent;
    TEXTE: TexteSectionContent;
    GALERIE: GalerieSectionContent;
    CARTE_INFOS: CarteInfosSectionContent;
    TEMOIGNAGES: TemoignagesSectionContent;
    CHIFFRES_CLES: ChiffresClesSectionContent;
    EQUIPE: EquipeSectionContent;
    FORMULAIRE: FormulaireSectionContent;
    CARTE: CarteSectionContent;
    VIDEO: VideoSectionContent;
    TELECHARGEMENTS: TelechargementsSectionContent;
    ACTUALITES: ActualitesSectionContent;
    HORAIRES: HorairesSectionContent;
    PARTENAIRES: PartenairesSectionContent;
    FAQ: FaqSectionContent;
    APPEL_ACTION: AppelActionSectionContent;
    SEPARATEUR: SeparateurSectionContent;
    HTML_CUSTOM: HtmlCustomSectionContent;
}
