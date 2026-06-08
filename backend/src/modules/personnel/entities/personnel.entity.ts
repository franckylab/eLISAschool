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
    OneToOne,
    ManyToOne,
    JoinColumn,
    Index
} from 'typeorm';
import { Utilisateur } from '@modules/utilisateurs/entities/utilisateur.entity';
import { Etablissement } from '@modules/etablissement/entities';

@Entity('types_personnel')
export class TypePersonnel {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 50, unique: true })
    code!: string; // ENSEIGNANT, DIRECTEUR, SURVEILLANT...

    @Column({ type: 'varchar', length: 100 })
    nom!: string;

    @Column({ type: 'simple-json', nullable: true })
    permissionsDefaut?: string[]; // Liste des codes permissions

    @CreateDateColumn()
    createdAt!: Date;
}

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
export class MembrePersonnel {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    utilisateurId!: string;

    @OneToOne(() => Utilisateur)
    @JoinColumn({ name: 'utilisateurId' })
    utilisateur?: Utilisateur;

    @Column({ type: 'uuid', nullable: true })
    typePersonnelId?: string;

    @ManyToOne(() => TypePersonnel)
    @JoinColumn({ name: 'typePersonnelId' })
    typePersonnel?: TypePersonnel;

    @Column({ type: 'varchar', length: 50, unique: true })
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

    @Column({ type: 'uuid', nullable: true })
    responsableHierarchiqueId?: string;

    @ManyToOne(() => MembrePersonnel, { nullable: true })
    @JoinColumn({ name: 'responsableHierarchiqueId' })
    responsableHierarchique?: MembrePersonnel;

    @Column({ type: 'simple-json', nullable: true })
    competences?: string[];

    // Spécifique enseignant
    @Column({ type: 'varchar', length: 200, nullable: true })
    specialitePrincipale?: string;

    @Column({ type: 'int', nullable: true })
    anneesExperience?: number;

    @Column({ type: 'varchar', length: 50, nullable: true })
    educationNiveau?: string; // LICENCE, MASTER, DOCTORAT, AUTRE

    @Column({ type: 'varchar', length: 200, nullable: true })
    etablissementOrigine?: string;

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

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
