/**
 * ==================================
 * eLISAschool - Entité Fond (Catalogue)
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Catalogue global des fonds SVG disponibles
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
    OneToMany,
} from 'typeorm';
import { FondEtablissement } from './fond-etablissement.entity';

/**
 * Catégorie de fond SVG
 */
export enum CategorieFond {
    INSTRUMENT_MESURE = 'instrument_mesure',
    INSTRUMENT_CALCUL = 'instrument_calcul',
    MATERIEL_LABORATOIRE = 'materiel_laboratoire',
    MATERIEL_INFORMATIQUE = 'materiel_informatique',
    MATERIEL_ELECTRIQUE = 'materiel_electrique',
    MATERIEL_BUREAU = 'materiel_bureau',
    MATERIEL_BATIMENT = 'materiel_batiment',
    OBJET_SALLE_CLASSE = 'objet_salle_classe',
    LIVRES_DOCUMENTATION = 'livres_documentation',
    SPORT_EDUCATION_PHYSIQUE = 'sport_education_physique',
    ARTS_CREATIVITE = 'arts_creativite',
    MUSIQUE = 'musique',
}

/**
 * Entité Fond
 * Représente un fond SVG disponible dans le catalogue global
 */
@Entity('fonds')
@Index(['categorie'])
@Index(['estActif'])
@Index(['estSysteme'])
export class Fond {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    /** Nom descriptif du fond */
    @Column({ type: 'varchar', length: 100 })
    nom!: string;

    /** Description du fond */
    @Column({ type: 'varchar', length: 255, nullable: true })
    description?: string;

    /** Catégorie du fond */
    @Column({ type: 'varchar', length: 50, enum: CategorieFond })
    categorie!: CategorieFond;

    /** Chemin relatif du fichier SVG */
    @Column({ type: 'varchar', length: 500 })
    cheminFichier!: string;

    /** URL complète du fond (générée) */
    @Column({ type: 'varchar', length: 500, nullable: true })
    url?: string;

    /** Source du fond */
    @Column({ type: 'varchar', length: 20, default: 'catalogue' })
    source!: 'catalogue' | 'upload';

    /** Fond actif dans le catalogue */
    @Column({ type: 'boolean', default: true })
    estActif!: boolean;

    /** Fond système (non supprimable) */
    @Column({ type: 'boolean', default: false })
    estSysteme!: boolean;

    /** Taille du fichier en octets */
    @Column({ type: 'int', nullable: true })
    tailleFichier?: number;

    /** Établissements qui utilisent ce fond */
    @OneToMany(() => FondEtablissement, (fe) => fe.fond)
    etablissements!: FondEtablissement[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
