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

    @Column({ type: 'enum', enum: ['ACTIF', 'EXCLU', 'ABANDON', 'DIPLOME'], default: 'ACTIF' })
    statut!: 'ACTIF' | 'EXCLU' | 'ABANDON' | 'DIPLOME';

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
