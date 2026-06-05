/**
 * eLISAschool - Entités Cartes
 */
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Utilisateur } from '@modules/auth/entities';

export enum TypeCarte {
    SCOLAIRE = 'SCOLAIRE',
    ACCES = 'ACCES',
    CANTINE = 'CANTINE',
    TRANSPORT = 'TRANSPORT',
    BIBLIOTHEQUE = 'BIBLIOTHEQUE',
}

export enum StatutCarte {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    PERDUE = 'PERDUE',
    EXPIREE = 'EXPIREE',
    DESACTIVEE = 'DESACTIVEE',
}

@Entity('cartes')
export class Carte {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    utilisateurId!: string;

    @ManyToOne(() => Utilisateur)
    @JoinColumn({ name: 'utilisateurId' })
    utilisateur!: Utilisateur;

    @Column({ type: 'enum', enum: TypeCarte })
    type!: TypeCarte;

    @Column({ type: 'varchar', length: 50, unique: true })
    numeroCarte!: string;

    @Column({ type: 'text', nullable: true })
    qrCode?: string;

    @Column({ type: 'enum', enum: StatutCarte, default: StatutCarte.ACTIVE })
    statut!: StatutCarte;

    @Column({ type: 'date', nullable: true })
    dateExpiration?: Date;

    @Column({ type: 'varchar', length: 500, nullable: true })
    photoUrl?: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    etablissementNom?: string;

    @Column({ type: 'text', nullable: true })
    raisonDesactivation?: string;

    @Column({ type: 'simple-json', nullable: true })
    metadata?: Record<string, any>;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
