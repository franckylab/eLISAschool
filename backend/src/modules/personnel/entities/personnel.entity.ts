/**
 * ==================================
 * eLISAschool - Entités Personnel
 * ==================================
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    OneToOne,
    OneToMany,
    ManyToOne,
    JoinColumn,
    Index
} from 'typeorm';
import { Utilisateur } from '@modules/utilisateurs/entities/utilisateur.entity';
import { Etablissement } from '@modules/etablissement/entities';
import type { MembreFonction } from './membre-fonction.entity';

/**
 * Statut workflow d'un membre du personnel
 */
export enum StatutPersonnel {
    ACTIF = 'ACTIF',
    EN_ATTENTE_VALIDATION = 'EN_ATTENTE_VALIDATION',
    INACTIF = 'INACTIF',
    CONGE = 'CONGE',
}

@Entity('membres_personnel')
@Index(['utilisateurId'])
@Index(['etablissementId'])
@Index(['matricule', 'etablissementId'], { unique: true })
export class MembrePersonnel {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid', nullable: true, unique: true })
    utilisateurId?: string;

    @OneToOne(() => Utilisateur, u => u.membrePersonnel, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'utilisateurId' })
    utilisateur?: Utilisateur;

    @Column({ type: 'varchar', length: 50 })
    matricule!: string;

    @Column({ type: 'date' })
    dateEmbauche!: Date;

    @Column({ type: 'varchar', length: 30, default: StatutPersonnel.ACTIF })
    statut!: StatutPersonnel;

    @Column({ type: 'simple-json', nullable: true })
    specialites?: string[]; // IDs des matières ou noms

    @Column({ type: 'text', nullable: true })
    diplomes?: string;

    /**
     * Champs d'identification additionnels (v2.0)
     */
    @Column({ type: 'varchar', length: 200, nullable: true })
    posteExact?: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    service?: string;

    @Column({ type: 'simple-json', nullable: true })
    competences?: string[];

    // Spécifique enseignant
    @Column({ type: 'varchar', length: 200, nullable: true })
    specialitePrincipale?: string;

    // Champs professionnels (non dupliqués depuis ProfilUtilisateur)
    @Column({ type: 'varchar', length: 200, nullable: true })
    departement?: string;

    @Column({ type: 'int', nullable: true })
    anneesExperience?: number;

    @Column({ type: 'varchar', length: 50, nullable: true })
    educationNiveau?: string; // LICENCE, MASTER, DOCTORAT, AUTRE

    @Column({ type: 'simple-json', nullable: true })
    disponibilites?: Record<string, any>;

    @Column({ type: 'int', nullable: true })
    heuresMaxSemaine?: number;

    @Column({ type: 'simple-json', nullable: true })
    horairesTravail?: Record<string, any>;

    /**
     * Établissement du membre du personnel (multi-tenancy)
     */
    @Column({ type: 'uuid' })
    etablissementId!: string;

    @ManyToOne(() => Etablissement, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement;

    @OneToMany('MembreFonction', 'membrePersonnel')
    fonctions?: MembreFonction[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @DeleteDateColumn()
    deletedAt?: Date | null;
}
