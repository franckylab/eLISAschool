/**
 * eLISAschool - Entités Cantine
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Utilisateur } from '@modules/auth/entities';

export enum StatutRepas {
    DISPONIBLE = 'DISPONIBLE',
    EPUISE = 'EPUISE',
    ANNULE = 'ANNULE',
    CONSOMME = 'CONSOMME',
}

@Entity('menus_cantine')
export class MenuCantine {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'date' })
    date!: Date;

    @Column({ type: 'varchar', length: 20, default: 'dejeuner' })
    typeRepas!: string;

    @Column({ type: 'varchar', length: 255 })
    platPrincipal!: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    accompagnement?: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    dessert?: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    prix!: number;

    @Column({ type: 'enum', enum: StatutRepas, default: StatutRepas.DISPONIBLE })
    statut!: StatutRepas;

    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    @Column({ type: 'simple-array', nullable: true })
    allergenes?: string[];

    @Column({ type: 'text', nullable: true })
    description?: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}

export enum StatutInscriptionCantine {
    ACTIVE = 'ACTIVE',
    SUSPENDUE = 'SUSPENDUE',
    RESILIEE = 'RESILIEE',
}

@Entity('inscriptions_cantine')
export class InscriptionCantine {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    eleveId!: string;

    @ManyToOne(() => Utilisateur)
    @JoinColumn({ name: 'eleveId' })
    eleve!: Utilisateur;

    @Column({ type: 'enum', enum: StatutInscriptionCantine, default: StatutInscriptionCantine.ACTIVE })
    statut!: StatutInscriptionCantine;

    @Column({ type: 'date', nullable: true })
    dateDebut?: Date;

    @Column({ type: 'date', nullable: true })
    dateFin?: Date;

    @Column({ type: 'simple-array', nullable: true })
    allergies?: string[];

    @Column({ type: 'text', nullable: true })
    regimeAlimentaire?: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    solde!: number;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}

@Entity('consommations_cantine')
export class ConsommationCantine {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    inscriptionId!: string;

    @ManyToOne(() => InscriptionCantine)
    @JoinColumn({ name: 'inscriptionId' })
    inscription!: InscriptionCantine;

    @Column({ type: 'uuid' })
    menuId!: string;

    @ManyToOne(() => MenuCantine)
    @JoinColumn({ name: 'menuId' })
    menu!: MenuCantine;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    montant!: number;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    date!: Date;

    @Column({ type: 'enum', enum: StatutRepas, default: StatutRepas.CONSOMME })
    statut!: StatutRepas;

    @Column({ type: 'boolean', default: false })
    paye!: boolean;

    @CreateDateColumn()
    createdAt!: Date;
}
