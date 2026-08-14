/**
 * ==================================
 * eLISAschool - Entités CMS Contenu Dynamique
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * 5 entités de contenu dynamique pour les sections CMS :
 * - CmsActualite : Articles d'actualités
 * - CmsTemoignage : Témoignages (élèves, parents, personnel)
 * - CmsEvenement : Événements et rendez-vous
 * - CmsPartenaire : Partenaires de l'établissement
 * - CmsAbonnementNewsletter : Inscriptions newsletter publique
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    Index,
} from 'typeorm';

// ==================================
// Enums CMS Contenu
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
    ANCIEN_ELEVE = 'ANCIEN_ELEVE',
    PARTENAIRE = 'PARTENAIRE',
}

export enum TypeEvenement {
    REUNION = 'REUNION',
    CEREMONIE = 'CEREMONIE',
    SORTIE = 'SORTIE',
    COMPETITION = 'COMPETITION',
    JOURNEE_PORTES_OUVERTES = 'JOURNEE_PORTES_OUVERTES',
    AUTRE = 'AUTRE',
}

export enum CategoriePartenaire {
    SPONSOR = 'SPONSOR',
    ASSOCIATION = 'ASSOCIATION',
    INSTITUTION = 'INSTITUTION',
    ENTREPRISE = 'ENTREPRISE',
    FOURNISSEUR = 'FOURNISSEUR',
}

// ==================================
// CmsActualite — Articles d'actualités
// ==================================

@Entity('cms_actualites')
@Index(['etablissementId'])
@Index(['statut'])
@Index(['etablissementId', 'slug'], { unique: true })
export class CmsActualite {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    etablissementId!: string;

    @Column({ type: 'varchar', length: 200 })
    titre!: string;

    @Column({ type: 'varchar', length: 220 })
    slug!: string;

    @Column({ type: 'text', nullable: true })
    resume?: string;

    @Column({ type: 'text', nullable: true })
    contenu?: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    image?: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    categorie?: string;

    @Column({ type: 'varchar', length: 20, default: StatutActualite.BROUILLON })
    statut!: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    auteurNom?: string;

    @Column({ type: 'uuid', nullable: true })
    auteurId?: string;

    @Column({ type: 'timestamp', nullable: true })
    datePublication?: Date;

    @Column({ type: 'int', default: 0 })
    vues!: number;

    @Column({ type: 'boolean', default: false })
    estEnUne!: boolean;

    @Column({ type: 'jsonb', nullable: true })
    seo?: {
        metaTitle?: string;
        metaDescription?: string;
    };

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}

// ==================================
// CmsTemoignage — Témoignages
// ==================================

@Entity('cms_temoignages')
@Index(['etablissementId'])
@Index(['categorie'])
export class CmsTemoignage {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    etablissementId!: string;

    @Column({ type: 'varchar', length: 100 })
    nom!: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    role?: string;

    @Column({ type: 'varchar', length: 30, default: CategorieTemoignage.ELEVE })
    categorie!: string;

    @Column({ type: 'text' })
    texte!: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    photo?: string;

    @Column({ type: 'int', default: 5 })
    note!: number;

    @Column({ type: 'int', default: 0 })
    ordre!: number;

    @Column({ type: 'boolean', default: true })
    estVisible!: boolean;

    @Column({ type: 'boolean', default: false })
    estEnUne!: boolean;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}

// ==================================
// CmsEvenement — Événements
// ==================================

@Entity('cms_evenements')
@Index(['etablissementId'])
@Index(['dateDebut'])
export class CmsEvenement {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    etablissementId!: string;

    @Column({ type: 'varchar', length: 200 })
    titre!: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    image?: string;

    @Column({ type: 'timestamp' })
    dateDebut!: Date;

    @Column({ type: 'timestamp', nullable: true })
    dateFin?: Date;

    @Column({ type: 'varchar', length: 30, default: TypeEvenement.AUTRE })
    type!: string;

    @Column({ type: 'varchar', length: 200, nullable: true })
    lieu?: string;

    @Column({ type: 'boolean', default: true })
    estPublic!: boolean;

    @Column({ type: 'jsonb', nullable: true })
    metadata?: Record<string, unknown>;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}

// ==================================
// CmsPartenaire — Partenaires
// ==================================

@Entity('cms_partenaires')
@Index(['etablissementId'])
@Index(['categorie'])
export class CmsPartenaire {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    etablissementId!: string;

    @Column({ type: 'varchar', length: 150 })
    nom!: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    logo?: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    siteWeb?: string;

    @Column({ type: 'varchar', length: 30, default: CategoriePartenaire.PARTENAIRE })
    categorie!: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'int', default: 0 })
    ordre!: number;

    @Column({ type: 'boolean', default: false })
    estEnUne!: boolean;

    @Column({ type: 'boolean', default: true })
    estVisible!: boolean;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}

// ==================================
// CmsAbonnementNewsletter — Inscriptions newsletter
// ==================================

@Entity('cms_newsletter')
@Index(['etablissementId'])
@Index(['email', 'etablissementId'], { unique: true })
export class CmsAbonnementNewsletter {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    etablissementId!: string;

    @Column({ type: 'varchar', length: 255 })
    email!: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    nom?: string;

    @Column({ type: 'boolean', default: true })
    estActif!: boolean;

    @Column({ type: 'varchar', length: 50, nullable: true })
    source?: string;

    @CreateDateColumn()
    createdAt!: Date;

    @DeleteDateColumn()
    deletedAt?: Date;
}
