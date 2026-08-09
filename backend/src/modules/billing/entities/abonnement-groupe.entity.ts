/**
 * ==================================
 * eLISAschool - Entité AbonnementGroupe
 * ==================================
 * 
 * Abonnement SaaS d'un groupe d'établissements.
 * Définit le plan, le mode de facturation (consolidée/individuelle/hybride),
 * la répartition (égale/proportionnelle/personnalisée) et la dégressivité.
 * 
 * Lot C v7 — Refonte SaaS
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { GroupeEtablissement } from '@modules/groupes-etablissements/entities';
import { PlanAbonnement } from './plan-abonnement.entity';

export enum StatutAbonnementGroupe {
    ACTIF = 'ACTIF',
    SUSPENDU = 'SUSPENDU',
    EXPIRE = 'EXPIRE',
    ANNULE = 'ANNULE',
}

export enum ModeFacturationGroupe {
    CONSOLIDEE = 'consolidee',
    INDIVIDUELLE = 'individuelle',
    HYBRIDE = 'hybride',
}

export enum RepartitionFacturation {
    EGALE = 'egale',
    PROPORTIONNELLE = 'proportionnelle',
    PERSONNALISEE = 'personnalisee',
}

@Entity('abonnements_groupe')
@Index(['planId'])
export class AbonnementGroupe {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    groupeEtablissementId!: string;

    @ManyToOne(() => GroupeEtablissement, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'groupeEtablissementId' })
    groupe!: GroupeEtablissement;

    @Column({ type: 'uuid' })
    planId!: string;

    @ManyToOne(() => PlanAbonnement, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'planId' })
    plan!: PlanAbonnement;

    @Column({ type: 'varchar', length: 30, default: StatutAbonnementGroupe.ACTIF })
    statut!: StatutAbonnementGroupe;

    /** Mode de facturation : consolidée (1 facture), individuelle (par membre), hybride */
    @Column({ type: 'varchar', length: 20, default: ModeFacturationGroupe.CONSOLIDEE })
    modeFacturation!: ModeFacturationGroupe;

    /** Tarif dégressif par nombre de membres (jsonb : { nbMin: pourcentage }) */
    @Column({ type: 'simple-json', nullable: true })
    tarifDegressif?: Record<string, number>;

    /** Répartition de la facture : égale, proportionnelle au nb d'élèves, personnalisée */
    @Column({ type: 'varchar', length: 30, default: RepartitionFacturation.PROPORTIONNELLE })
    repartitionFacturation!: RepartitionFacturation;

    @Column({ type: 'date' })
    dateDebut!: Date;

    @Column({ type: 'date', nullable: true })
    dateFin?: Date;

    @Column({ type: 'uuid', nullable: true })
    creePar?: string;

    @CreateDateColumn()
    creeAt!: Date;

    @UpdateDateColumn()
    majAt!: Date;
}
