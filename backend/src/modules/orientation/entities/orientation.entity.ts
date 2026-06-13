/**
 * ==================================
 * eLISAschool - Entités Orientation
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

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

/**
 * Type de filière
 */
export enum TypeFiliere {
    SCIENTIFIQUE = 'SCIENTIFIQUE',
    LITTERAIRE = 'LITTERAIRE',
    TECHNIQUE = 'TECHNIQUE',
    PROFESSIONNELLE = 'PROFESSIONNELLE',
    ARTISTIQUE = 'ARTISTIQUE',
}

/**
 * Profil d'orientation d'un élève
 */
@Entity('profils_orientation')
@Index(['eleveId'])
export class ProfilOrientation {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    eleveId!: string;

    @Column({ type: 'simple-json', nullable: true })
    interets?: string[];

    @Column({ type: 'simple-json', nullable: true })
    aptitudes?: { domaine: string; niveau: number }[];

    @Column({ type: 'simple-json', nullable: true })
    objectifs?: string[];

    @Column({ type: 'text', nullable: true })
    notes?: string;

    @Column({ type: 'simple-json', nullable: true })
    recommandations?: string[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}

/**
 * Fiche métier
 */
@Entity('fiches_metiers')
export class FicheMetier {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 255 })
    nom!: string;

    @Column({ type: 'text' })
    description!: string;

    @Column({ type: 'enum', enum: TypeFiliere })
    filiere!: TypeFiliere;

    @Column({ type: 'simple-json', nullable: true })
    competencesRequises?: string[];

    @Column({ type: 'simple-json', nullable: true })
    formationsRecommandees?: string[];

    @Column({ type: 'varchar', length: 100, nullable: true })
    salaireEstime?: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    debouches?: string;

    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    @CreateDateColumn()
    createdAt!: Date;
}

/**
 * Rendez-vous d'orientation
 */
@Entity('rdv_orientation')
@Index(['eleveId', 'date'])
export class RdvOrientation {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    eleveId!: string;

    @Column({ type: 'uuid' })
    conseillerId!: string;

    @Column({ type: 'timestamp' })
    date!: Date;

    @Column({ type: 'int', default: 30 })
    dureeMinutes!: number;

    @Column({ type: 'varchar', length: 500, nullable: true })
    motif?: string;

    @Column({ type: 'text', nullable: true })
    compteRendu?: string;

    @Column({ type: 'simple-json', nullable: true })
    recommandations?: string[];

    @Column({ type: 'varchar', length: 20, default: 'PLANIFIE' })
    statut!: 'PLANIFIE' | 'TERMINE' | 'ANNULE';

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}

export default { ProfilOrientation, FicheMetier, RdvOrientation, TypeFiliere };
