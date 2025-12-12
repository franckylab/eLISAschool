/**
 * ==================================
 * eLISAschool - Entité Profil Utilisateur
 * ==================================
 * Version: 1.0.0
 * Auteur: xAI Éducation
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToOne,
    JoinColumn,
} from 'typeorm';
import { Utilisateur } from './utilisateur.entity';

/**
 * Genre
 */
export enum Genre {
    MASCULIN = 'M',
    FEMININ = 'F',
    AUTRE = 'A',
}

/**
 * Entité Profil Utilisateur
 * Informations personnelles détaillées de l'utilisateur
 */
@Entity('profils_utilisateurs')
export class ProfilUtilisateur {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    utilisateurId!: string;

    @OneToOne(() => Utilisateur, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'utilisateurId' })
    utilisateur!: Utilisateur;

    @Column({ type: 'varchar', length: 100 })
    nom!: string;

    @Column({ type: 'varchar', length: 100 })
    prenom!: string;

    @Column({ type: 'enum', enum: Genre, nullable: true })
    genre?: Genre;

    @Column({ type: 'date', nullable: true })
    dateNaissance?: Date;

    @Column({ type: 'varchar', length: 100, nullable: true })
    lieuNaissance?: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    nationalite?: string;

    @Column({ type: 'varchar', length: 20, nullable: true })
    telephone?: string;

    @Column({ type: 'varchar', length: 20, nullable: true })
    telephoneSecondaire?: string;

    @Column({ type: 'text', nullable: true })
    adresse?: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    ville?: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    quartier?: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    photo?: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    pieceIdentite?: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    numeroPieceIdentite?: string;

    @Column({ type: 'text', nullable: true })
    notes?: string;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt!: Date;

    /**
     * Retourne le nom complet de l'utilisateur
     */
    get nomComplet(): string {
        return `${this.prenom} ${this.nom}`;
    }
}

export default ProfilUtilisateur;
