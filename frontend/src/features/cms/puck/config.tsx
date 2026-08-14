/**
 * ==================================
 * eLISAschool - Configuration Puck Editor
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Config Puck avec 18 composants mappant les SectionType CMS.
 * 6 catégories : hero, content, social, info, action, structure.
 */

import type { Config } from '@puckeditor/core';

// Hero
import { HeroPuck } from './components/HeroPuck';
import { HeroVideoPuck } from './components/HeroVideoPuck';
// Content
import { TextePuck } from './components/TextePuck';
import { GaleriePuck } from './components/GaleriePuck';
import { VideoPuck } from './components/VideoPuck';
import { TelechargementsPuck } from './components/TelechargementsPuck';
import { ActualitesPuck } from './components/ActualitesPuck';
import { HtmlCustomPuck } from './components/HtmlCustomPuck';
import { CarouselPuck } from './components/CarouselPuck';
import { GalerieMasonryPuck } from './components/GalerieMasonryPuck';
// Social
import { TemoignagesPuck } from './components/TemoignagesPuck';
import { EquipePuck } from './components/EquipePuck';
import { PartenairesPuck } from './components/PartenairesPuck';
import { TemoignageCarouselPuck } from './components/TemoignageCarouselPuck';
// Info
import { CarteInfosPuck } from './components/CarteInfosPuck';
import { ChiffresClesPuck } from './components/ChiffresClesPuck';
import { CartePuck } from './components/CartePuck';
import { HorairesPuck } from './components/HorairesPuck';
import { FaqPuck } from './components/FaqPuck';
import { TimelinePuck } from './components/TimelinePuck';
import { TabsPuck } from './components/TabsPuck';
import { IconeFeaturesPuck } from './components/IconeFeaturesPuck';
import { CompteursAnimesPuck } from './components/CompteursAnimesPuck';
import { PrixTabPuck } from './components/PrixTabPuck';
// Action
import { FormulairePuck } from './components/FormulairePuck';
import { AppelActionPuck } from './components/AppelActionPuck';
import { NewsletterPuck } from './components/NewsletterPuck';
// Structure
import { SeparateurPuck } from './components/SeparateurPuck';

// ==================================
// Config Puck — 28 composants, 6 catégories
// ==================================

export const puckConfig: Config = {
    categories: {
        hero: {
            title: 'Hero',
            components: ['HeroSection', 'HeroVideoSection'],
        },
        content: {
            title: 'Contenu',
            components: ['TexteSection', 'GalerieSection', 'VideoSection', 'TelechargementsSection', 'ActualitesSection', 'HtmlCustomSection', 'CarouselSection', 'GalerieMasonrySection'],
        },
        social: {
            title: 'Social',
            components: ['TemoignagesSection', 'EquipeSection', 'PartenairesSection', 'TemoignageCarouselSection'],
        },
        info: {
            title: 'Information',
            components: ['CarteInfosSection', 'ChiffresClesSection', 'CarteSection', 'HorairesSection', 'FaqSection', 'TimelineSection', 'TabsSection', 'IconeFeaturesSection', 'CompteursAnimesSection', 'PrixTabSection'],
        },
        action: {
            title: 'Action',
            components: ['FormulaireSection', 'AppelActionSection', 'NewsletterSection'],
        },
        structure: {
            title: 'Structure',
            components: ['SeparateurSection'],
        },
    },
    components: {
        // ── Hero ──
        HeroSection: HeroPuck,
        HeroVideoSection: HeroVideoPuck,

        // ── Contenu ──
        TexteSection: TextePuck,
        GalerieSection: GaleriePuck,
        VideoSection: VideoPuck,
        TelechargementsSection: TelechargementsPuck,
        ActualitesSection: ActualitesPuck,
        HtmlCustomSection: HtmlCustomPuck,
        CarouselSection: CarouselPuck,
        GalerieMasonrySection: GalerieMasonryPuck,

        // ── Social ──
        TemoignagesSection: TemoignagesPuck,
        EquipeSection: EquipePuck,
        PartenairesSection: PartenairesPuck,
        TemoignageCarouselSection: TemoignageCarouselPuck,

        // ── Information ──
        CarteInfosSection: CarteInfosPuck,
        ChiffresClesSection: ChiffresClesPuck,
        CarteSection: CartePuck,
        HorairesSection: HorairesPuck,
        FaqSection: FaqPuck,
        TimelineSection: TimelinePuck,
        TabsSection: TabsPuck,
        IconeFeaturesSection: IconeFeaturesPuck,
        CompteursAnimesSection: CompteursAnimesPuck,
        PrixTabSection: PrixTabPuck,

        // ── Action ──
        FormulaireSection: FormulairePuck,
        AppelActionSection: AppelActionPuck,
        NewsletterSection: NewsletterPuck,

        // ── Structure ──
        SeparateurSection: SeparateurPuck,
    },
};

// ==================================
// Mapping Puck type ↔ SectionType CMS
// ==================================

/** Puck component type → CMS SectionType enum value */
export const PUCK_TO_SECTION_TYPE: Record<string, string> = {
    HeroSection: 'HERO',
    HeroVideoSection: 'HERO_VIDEO',
    TexteSection: 'TEXTE',
    GalerieSection: 'GALERIE',
    GalerieMasonrySection: 'GALERIE_MASONRY',
    CarouselSection: 'CAROUSEL',
    CarteInfosSection: 'CARTE_INFOS',
    TemoignagesSection: 'TEMOIGNAGES',
    TemoignageCarouselSection: 'TEMOIGNAGE_CAROUSEL',
    ChiffresClesSection: 'CHIFFRES_CLES',
    CompteursAnimesSection: 'COMPTEURS_ANIMES',
    EquipeSection: 'EQUIPE',
    FormulaireSection: 'FORMULAIRE',
    CarteSection: 'CARTE',
    VideoSection: 'VIDEO',
    TelechargementsSection: 'TELECHARGEMENTS',
    ActualitesSection: 'ACTUALITES',
    HorairesSection: 'HORAIRES',
    PartenairesSection: 'PARTENAIRES',
    FaqSection: 'FAQ',
    AppelActionSection: 'APPEL_ACTION',
    NewsletterSection: 'NEWSLETTER',
    SeparateurSection: 'SEPARATEUR',
    HtmlCustomSection: 'HTML_CUSTOM',
    TimelineSection: 'TIMELINE',
    TabsSection: 'TABS',
    IconeFeaturesSection: 'ICONE_FEATURES',
    PrixTabSection: 'PRIX_TAB',
};

/** CMS SectionType → Puck component type */
export const SECTION_TYPE_TO_PUCK: Record<string, string> = Object.fromEntries(
    Object.entries(PUCK_TO_SECTION_TYPE).map(([puck, cms]) => [cms, puck]),
);
