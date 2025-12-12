/**
 * eLISAschool - Entités Clubs
 */
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Utilisateur } from '@modules/auth/entities';

@Entity('clubs')
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

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}

@Entity('inscriptions_clubs')
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

    @ManyToOne(() => Utilisateur)
    @JoinColumn({ name: 'eleveId' })
    eleve!: Utilisateur;

    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    @CreateDateColumn()
    inscritAt!: Date;
}

@Entity('evenements_clubs')
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

    @CreateDateColumn()
    createdAt!: Date;
}
