import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { Etablissement } from '@modules/etablissement/entities';

/**
 * ==================================
 * eLISAschool - Enums de catégorisation des templates
 * ==================================
 */

export enum NatureJuridique {
    PUBLIC_ETATIQUE = 'PUBLIC_ETATIQUE',
    PUBLIC_COMMUNAL = 'PUBLIC_COMMUNAL',
    PRIVE_LAIC = 'PRIVE_LAIC',
    PRIVE_CONFESSIONNEL = 'PRIVE_CONFESSIONNEL',
    PRIVE_ASSOCIATIF = 'PRIVE_ASSOCIATIF',
    COMPLEXE = 'COMPLEXE',
}

export enum SystemeEducatif {
    GENERAL = 'GENERAL',
    TECHNIQUE = 'TECHNIQUE',
    PROFESSIONNEL = 'PROFESSIONNEL',
    NORMAL = 'NORMAL',
    SUPERIEUR = 'SUPERIEUR',
}

export enum LangueEnseignement {
    FRANCOPHONE = 'FRANCOPHONE',
    ANGLOPHONE = 'ANGLOPHONE',
    BILINGUE = 'BILINGUE',
}

export enum NiveauEnseignement {
    MATERNEL = 'MATERNEL',
    PRIMAIRE = 'PRIMAIRE',
    COLLEGE = 'COLLEGE',
    LYCEE = 'LYCEE',
    POST_BAC = 'POST_BAC',
}

export enum ComplexiteStructurelle {
    STANDARD = 'STANDARD',
    AVANCE = 'AVANCE',
}

/**
 * Template de poste (refonte v4.0)
 * categoriePosteId supprimé — dérivé via fonction.categorie
 */
export interface TemplatePoste {
    ref: string;
    intitule: string;
    /** Variante accentuée possible dans certains templates */
    intitulé?: string;
    /** Code du niveau de responsabilité (résolu en UUID par le service) */
    niveauResponsabilite?: string;
    niveauResponsabiliteId?: string;
    fonctionRef?: string;
    fonctionId?: string;
    description?: string;
    nombrePostes: number;
}

export interface TemplateLienHierarchique {
    superieurRef: string;
    subordonneRef: string;
    typeRelation: string;
}

/**
 * Noeud de template d'organisation (refonte v4.0)
 * usageUnite + niveau → echelonCode (fusion dans EchelonStructurel)
 */
export interface NoeudTemplateOrganisation {
    echelonCode: string;
    nom: string;
    count: number;
    postes?: TemplatePoste[];
    hierarchie?: TemplateLienHierarchique[];
    enfants?: NoeudTemplateOrganisation[];
}

@Entity('templates_organisation')
@Index(['etablissementId'])
@Index(['actif'])
@Index(['nature'], { where: '"nature" IS NOT NULL' })
@Index(['systeme'], { where: '"systeme" IS NOT NULL' })
@Index(['langue'], { where: '"langue" IS NOT NULL' })
@Index(['complexite'], { where: '"complexite" IS NOT NULL' })
@Index(['ordre'])
export class TemplateOrganisation {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 200 })
    nom!: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'jsonb' })
    structure!: NoeudTemplateOrganisation;

    @Column({ type: 'uuid', nullable: true })
    etablissementId?: string | null;

    @ManyToOne(() => Etablissement, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement | null;

    @Column({ type: 'boolean', default: false })
    estSysteme!: boolean;

    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    // ─── Colonnes de catégorisation (v5.1) ───

    @Column({ type: 'varchar', length: 30, nullable: true })
    nature?: NatureJuridique;

    @Column({ type: 'varchar', length: 20, nullable: true })
    systeme?: SystemeEducatif;

    @Column({ type: 'varchar', length: 20, nullable: true })
    langue?: LangueEnseignement;

    @Column({ type: 'simple-array', nullable: true })
    niveaux?: NiveauEnseignement[];

    @Column({ type: 'varchar', length: 20, nullable: true })
    complexite?: ComplexiteStructurelle;

    @Column({ type: 'varchar', length: 50, nullable: true })
    categorie?: string;

    @Column({ type: 'int', default: 0 })
    ordre?: number;

    @Column({ type: 'varchar', length: 20, nullable: true })
    icone?: string;

    @Column({ type: 'jsonb', nullable: true })
    metadata?: Record<string, unknown>;

    /** Nom en anglais (pour i18n) */
    @Column({ type: 'varchar', length: 200, nullable: true })
    nomEn?: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
