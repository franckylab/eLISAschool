/**
 * eLISAschool - Entités Clubs
 */
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Utilisateur } from '@modules/auth/entities';
import { Eleve } from '@modules/eleves/entities';
import { Etablissement } from '@modules/etablissement/entities';

/**
 * Statut workflow d'un club
 */
export enum StatutClub {
    ACTIF = 'ACTIF',
    EN_ATTENTE_VALIDATION = 'EN_ATTENTE_VALIDATION',
    INACTIF = 'INACTIF',
}

@Entity('clubs')
@Index(['etablissementId'])
export class Club {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 100 })
    nom!: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'uuid', nullable: true })
    responsableId?: string;

    @ManyToOne(() => Utilisateur, { nullable: true })
    @JoinColumn({ name: 'responsableId' })
    responsable?: Utilisateur;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    budget!: number;

    @Column({ type: 'varchar', length: 50, nullable: true })
    horaires?: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    lieu?: string;

    @Column({ type: 'int', nullable: true })
    capaciteMax?: number;

    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    @Column({ type: 'varchar', length: 30, default: StatutClub.ACTIF })
    statut!: StatutClub;

    /**
     * Établissement du club (multi-tenancy)
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

@Entity('inscriptions_clubs')
@Index(['etablissementId'])
export class InscriptionClub {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    clubId!: string;

    @ManyToOne(() => Club)
    @JoinColumn({ name: 'clubId' })
    club!: Club;

    @Column({ type: 'uuid' })
    eleveId!: string;

    @ManyToOne(() => Eleve)
    @JoinColumn({ name: 'eleveId' })
    eleve!: Eleve;

    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    /**
     * Établissement de l'inscription au club (multi-tenancy)
     */
    @Column({ type: 'uuid' })
    etablissementId!: string;

    @ManyToOne(() => Etablissement, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement;

    @CreateDateColumn()
    inscritAt!: Date;
}

@Entity('evenements_clubs')
@Index(['etablissementId'])
export class EvenementClub {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    clubId!: string;

    @ManyToOne(() => Club)
    @JoinColumn({ name: 'clubId' })
    club!: Club;

    @Column({ type: 'varchar', length: 255 })
    titre!: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'timestamp' })
    dateDebut!: Date;

    @Column({ type: 'timestamp', nullable: true })
    dateFin?: Date;

    @Column({ type: 'varchar', length: 100, nullable: true })
    lieu?: string;

    /**
     * Établissement de l'événement (multi-tenancy)
     */
    @Column({ type: 'uuid' })
    etablissementId!: string;

    @ManyToOne(() => Etablissement, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement;

    @CreateDateColumn()
    createdAt!: Date;
}
