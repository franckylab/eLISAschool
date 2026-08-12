/**
 * ==================================
 * eLISAschool - Entités CMS (7 entités)
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Système CMS white-label pour pages publiques par établissement.
 * 7 entités : Page, Section, Media, Theme, Menu, Widget, Version
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
    Index,
} from 'typeorm';

// ==================================
// Enums CMS
// ==================================

export enum StatutPage {
    BROUILLON = 'BROUILLON',
    PUBLIE = 'PUBLIE',
    ARCHIVE = 'ARCHIVE',
}

export enum TemplatePage {
    ACCUEIL = 'accueil',
    CUSTOM = 'custom',
    GALERIE = 'galerie',
    ACTUALITES = 'actualites',
    CONTACT = 'contact',
    INSCRIPTIONS = 'inscriptions',
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
}

export enum TypeMedia {
    IMAGE = 'image',
    VIDEO = 'video',
    DOCUMENT = 'document',
    AUDIO = 'audio',
}

export enum EmplacementMenu {
    HEADER = 'header',
    FOOTER = 'footer',
    SIDEBAR = 'sidebar',
}

export enum EmplacementWidget {
    SIDEBAR = 'sidebar',
    FOOTER = 'footer',
    HEADER = 'header',
    HOMEPAGE = 'homepage',
}

export enum WidgetType {
    CONTACT_RAPIDE = 'CONTACT_RAPIDE',
    RESEAUX_SOCIAUX = 'RESEAUX_SOCIAUX',
    HORAIRES = 'HORAIRES',
    ACTUALITES_RECENTES = 'ACTUALITES_RECENTES',
    INSCRIPTION_RAPIDE = 'INSCRIPTION_RAPIDE',
    CARTE_GPS = 'CARTE_GPS',
    EVENEMENTS = 'EVENEMENTS',
    TEMOIGNAGE = 'TEMOIGNAGE',
    STATISTIQUES = 'STATISTIQUES',
    NEWSLETTER = 'NEWSLETTER',
}

export enum EntiteTypeVersion {
    PAGE = 'page',
    SECTION = 'section',
    THEME = 'theme',
    MENU = 'menu',
    WIDGET = 'widget',
}

// ==================================
// CmsPage — Pages de l'établissement
// ==================================

@Entity('cms_pages')
@Index(['etablissementId', 'slug'], { unique: true })
@Index(['etablissementId'])
@Index(['statut'])
export class CmsPage {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    etablissementId!: string;

    @Column({ type: 'varchar', length: 200 })
    titre!: string;

    @Column({ type: 'varchar', length: 200 })
    slug!: string;

    @Column({ type: 'varchar', length: 50, default: TemplatePage.CUSTOM })
    template!: string;

    @Column({ type: 'varchar', length: 20, default: StatutPage.BROUILLON })
    statut!: string;

    @Column({ type: 'int', default: 0 })
    ordre!: number;

    @Column({ type: 'uuid', nullable: true })
    pageParentId?: string;

    @Column({ type: 'jsonb', nullable: true })
    metadata?: Record<string, unknown>;

    @Column({ type: 'jsonb', nullable: true })
    seo?: {
        metaTitle?: string;
        metaDescription?: string;
        metaKeywords?: string[];
        ogImage?: string;
    };

    @Column({ type: 'boolean', default: false })
    estPageAccueil!: boolean;

    @ManyToOne(() => CmsPage, { nullable: true })
    @JoinColumn({ name: 'pageParentId' })
    pageParent?: CmsPage;

    @OneToMany(() => CmsSection, 'page', { cascade: true })
    sections!: CmsSection[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}

// ==================================
// CmsSection — Blocs de contenu
// ==================================

@Entity('cms_sections')
@Index(['pageId'])
export class CmsSection {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    pageId!: string;

    @Column({ type: 'varchar', length: 50 })
    type!: string;

    @Column({ type: 'jsonb', default: {} })
    contenu!: Record<string, unknown>;

    @Column({ type: 'int', default: 0 })
    ordre!: number;

    @Column({ type: 'jsonb', nullable: true })
    styles?: Record<string, unknown>;

    @Column({ type: 'boolean', default: true })
    visible!: boolean;

    @Column({ type: 'varchar', length: 50, nullable: true })
    anchorId?: string;

    @ManyToOne(() => CmsPage, 'sections')
    @JoinColumn({ name: 'pageId' })
    page!: CmsPage;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}

// ==================================
// CmsMedia — Bibliothèque médias
// ==================================

@Entity('cms_medias')
@Index(['etablissementId'])
@Index(['type'])
export class CmsMedia {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    etablissementId!: string;

    @Column({ type: 'varchar', length: 255 })
    nom!: string;

    @Column({ type: 'varchar', length: 20 })
    type!: string;

    @Column({ type: 'varchar', length: 500 })
    url!: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    alt?: string;

    @Column({ type: 'integer', nullable: true })
    taille?: number;

    @Column({ type: 'varchar', length: 50, nullable: true })
    mimeType?: string;

    @Column({ type: 'int', nullable: true })
    largeur?: number;

    @Column({ type: 'int', nullable: true })
    hauteur?: number;

    @Column({ type: 'jsonb', nullable: true })
    metadata?: Record<string, unknown>;

    @Column({ type: 'varchar', length: 100, nullable: true })
    dossier?: string;

    @CreateDateColumn()
    createdAt!: Date;
}

// ==================================
// CmsTheme — Thème visuel
// ==================================

@Entity('cms_themes')
@Index(['etablissementId'])
export class CmsTheme {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    etablissementId!: string;

    @Column({ type: 'varchar', length: 100 })
    nom!: string;

    @Column({ type: 'jsonb', default: {} })
    variables!: Record<string, unknown>;

    @Column({ type: 'jsonb', nullable: true })
    polices?: Record<string, unknown>;

    @Column({ type: 'boolean', default: false })
    actif!: boolean;

    @Column({ type: 'boolean', default: false })
    estSysteme!: boolean;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}

// ==================================
// CmsMenu — Navigation
// ==================================

@Entity('cms_menus')
@Index(['etablissementId'])
export class CmsMenu {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    etablissementId!: string;

    @Column({ type: 'varchar', length: 100 })
    nom!: string;

    @Column({ type: 'varchar', length: 30, default: EmplacementMenu.HEADER })
    emplacement!: string;

    @Column({ type: 'jsonb', default: [] })
    items!: Record<string, unknown>[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}

// ==================================
// CmsWidget — Widgets latéraux
// ==================================

@Entity('cms_widgets')
@Index(['etablissementId'])
export class CmsWidget {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    etablissementId!: string;

    @Column({ type: 'varchar', length: 50 })
    type!: string;

    @Column({ type: 'varchar', length: 200, nullable: true })
    titre?: string;

    @Column({ type: 'jsonb', default: {} })
    config!: Record<string, unknown>;

    @Column({ type: 'varchar', length: 30, default: EmplacementWidget.SIDEBAR })
    emplacement!: string;

    @Column({ type: 'int', default: 0 })
    ordre!: number;

    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    @CreateDateColumn()
    createdAt!: Date;
}

// ==================================
// CmsVersion — Historique & rollback
// ==================================

@Entity('cms_versions')
@Index(['etablissementId', 'entiteType', 'entiteId'])
export class CmsVersion {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    etablissementId!: string;

    @Column({ type: 'varchar', length: 50 })
    entiteType!: string;

    @Column({ type: 'uuid' })
    entiteId!: string;

    @Column({ type: 'jsonb' })
    snapshot!: Record<string, unknown>;

    @Column({ type: 'uuid', nullable: true })
    auteurId?: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    commentaire?: string;

    @Column({ type: 'int', default: 1 })
    version!: number;

    @CreateDateColumn()
    createdAt!: Date;
}
