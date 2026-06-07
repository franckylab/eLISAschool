/**
 * eLISAschool - Entités Cantine
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Utilisateur } from '@modules/auth/entities';
import { Eleve } from '@modules/eleves/entities';
import { Etablissement } from '@modules/etablissement/entities';

export enum StatutRepas {
    DISPONIBLE = 'DISPONIBLE',
    EPUISE = 'EPUISE',
    ANNULE = 'ANNULE',
    CONSOMME = 'CONSOMME',
}

@Entity('menus_cantine')
@Index(['etablissementId'])
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

    /**
     * Établissement du menu (multi-tenancy)
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

export enum StatutInscriptionCantine {
    ACTIVE = 'ACTIVE',
    SUSPENDUE = 'SUSPENDUE',
    RESILIEE = 'RESILIEE',
    EN_ATTENTE_VALIDATION = 'EN_ATTENTE_VALIDATION',
}

@Entity('inscriptions_cantine')
@Index(['etablissementId'])
export class InscriptionCantine {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    eleveId!: string;

    @ManyToOne(() => Eleve)
    @JoinColumn({ name: 'eleveId' })
    eleve!: Eleve;

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

    /**
     * Établissement de l'inscription cantine (multi-tenancy)
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

    /**
     * Établissement de la consommation (multi-tenancy)
     */
    @Column({ type: 'uuid' })
    etablissementId!: string;

    @ManyToOne(() => Etablissement, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement;

    @CreateDateColumn()
    createdAt!: Date;
}
