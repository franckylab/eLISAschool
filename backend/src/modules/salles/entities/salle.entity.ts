/**
 * ==================================
 * eLISAschool - Entité Salle
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Représente une salle physique dans l'établissement :
 * salles de cours, laboratoires, amphithéâtres, salles informatiques, etc.
 * Utilisée dans l'emploi du temps pour affecter les créneaux horaires.
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
import { Etablissement } from '@modules/etablissement/entities';

/**
 * Type de salle
 */
export enum TypeSalle {
    CLASSIQUE = 'CLASSIQUE',
    LABORATOIRE = 'LABORATOIRE',
    INFORMATIQUE = 'INFORMATIQUE',
    AMPHITHEATRE = 'AMPHITHEATRE',
    SPORT = 'SPORT',
    MUSIQUE = 'MUSIQUE',
    ARTS = 'ARTS',
    BIBLIOTHEQUE = 'BIBLIOTHEQUE',
    ADMINISTRATION = 'ADMINISTRATION',
    AUTRE = 'AUTRE',
}

/**
 * Statut de disponibilité d'une salle
 */
export enum StatutSalle {
    DISPONIBLE = 'DISPONIBLE',
    EN_MAINTENANCE = 'EN_MAINTENANCE',
    INDISPONIBLE = 'INDISPONIBLE',
}

@Entity('salles')
@Index(['etablissementId'])
@Index(['code', 'etablissementId'], { unique: true })
@Index(['typeSalle'])
@Index(['disponible'])
export class Salle {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 100 })
    nom!: string; // "Salle 101", "Amphi A", "Labo Chimie"

    @Column({ type: 'varchar', length: 50 })
    code!: string; // "S101", "AMPHI_A", "LABO_CHIM"

    @Column({ type: 'int', default: 30 })
    capacite!: number;

    @Column({ type: 'varchar', length: 100, nullable: true })
    localisation?: string; // "Bâtiment A, 1er étage"

    @Column({ type: 'varchar', length: 50, default: TypeSalle.CLASSIQUE })
    typeSalle!: TypeSalle;

    @Column({ type: 'jsonb', nullable: true })
    equipements?: string[]; // ["projecteur", "clim", "ordinateurs"]

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'varchar', length: 30, default: StatutSalle.DISPONIBLE })
    statut!: StatutSalle;

    @Column({ type: 'boolean', default: true })
    disponible!: boolean;

    /**
     * Établishment auquel la salle appartient (multi-tenancy)
     */
    @Column({ type: 'uuid' })
    etablissementId!: string;

    @ManyToOne(() => Etablissement, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
