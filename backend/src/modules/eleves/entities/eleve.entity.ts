/**
 * ==================================
 * eLISAschool - Entités Élèves
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
import { SousSysteme, Etablissement } from '@modules/etablissement/entities';

/**
 * Statut workflow d'un dossier élève
 */
export enum StatutEleve {
    ACTIF = 'ACTIF',
    EN_ATTENTE_VALIDATION = 'EN_ATTENTE_VALIDATION',
    EXCLU = 'EXCLU',
    ABANDON = 'ABANDON',
    DIPLOME = 'DIPLOME',
}

@Entity('eleves')
@Index(['utilisateurId'])
@Index(['matricule'])
@Index(['etablissementId'])
export class Eleve {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    utilisateurId!: string;

    @OneToOne(() => Utilisateur)
    @JoinColumn({ name: 'utilisateurId' })
    utilisateur?: Utilisateur;

    @Column({ type: 'varchar', length: 50, unique: true })
    matricule!: string;

    @Column({ type: 'date' })
    dateNaissance!: Date;

    @Column({ type: 'varchar', length: 100 })
    lieuNaissance!: string;

    @Column({ type: 'enum', enum: ['M', 'F'] })
    sexe!: 'M' | 'F';

    @Column({ type: 'varchar', length: 100, nullable: true })
    nationalite?: string;

    @Column({ type: 'enum', enum: SousSysteme, default: SousSysteme.FRANCOPHONE })
    sousSysteme!: SousSysteme;

    // Parents / Tuteurs (Simplifié pour l'instant)
    @Column({ type: 'varchar', length: 150, nullable: true })
    nomPere?: string;

    @Column({ type: 'varchar', length: 150, nullable: true })
    nomMere?: string;

    @Column({ type: 'varchar', length: 150, nullable: true })
    nomTuteur?: string;

    @Column({ type: 'varchar', length: 20, nullable: true })
    telephoneTuteur?: string;

    @Column({ type: 'date' })
    dateInscription!: Date;

    // ==================================
    // Champs d'identification additionnels (v2.0)
    // ==================================

    @Column({ type: 'varchar', length: 500, nullable: true })
    photo?: string;

    @Column({ type: 'varchar', length: 5, nullable: true })
    groupeSanguin?: string; // A+, A-, B+, B-, AB+, AB-, O+, O-

    @Column({ type: 'simple-json', nullable: true })
    allergies?: string[];

    @Column({ type: 'varchar', length: 200, nullable: true })
    nomContactUrgence?: string;

    @Column({ type: 'varchar', length: 20, nullable: true })
    telephoneContactUrgence?: string;

    @Column({ type: 'text', nullable: true })
    adresseDomicile?: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    ville?: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    quartier?: string;

    @Column({ type: 'varchar', length: 200, nullable: true })
    ecoleProvenance?: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    classeAnterieure?: string;

    @Column({ type: 'boolean', default: false })
    redoublement!: boolean;

    @Column({ type: 'boolean', default: false })
    boursier!: boolean;

    @Column({ type: 'boolean', default: false })
    regimeInterne!: boolean;

    @Column({ type: 'varchar', length: 30, default: StatutEleve.ACTIF })
    statut!: StatutEleve;

    @Column({ type: 'enum', enum: ['COMPLET', 'INCOMPLET'], default: 'INCOMPLET' })
    etatDossier!: 'COMPLET' | 'INCOMPLET';

    /**
     * Établissement de l'élève (multi-tenancy)
     */
    @Column({ type: 'uuid' })
    etablissementId!: string;

    @ManyToOne(() => Etablissement, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement;

    @Index(['etablissementId', 'matricule'], { unique: true })

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
