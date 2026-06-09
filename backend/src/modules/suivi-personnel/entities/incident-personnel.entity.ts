/**
 * ==================================
 * eLISAschool - Entité IncidentPersonnel
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';
import { MembrePersonnel } from '@modules/personnel/entities';
import { Utilisateur } from '@modules/auth/entities';
import { Etablissement } from '@modules/etablissement/entities';
import { AnneeScolaire } from '@modules/annees-scolaires/entities';
import { Periode } from '@modules/periodes/entities';

export enum GraviteIncidentPersonnel {
    MINEUR = 'MINEUR',
    MODERE = 'MODERE',
    GRAVE = 'GRAVE',
    TRES_GRAVE = 'TRES_GRAVE',
}

export enum StatutIncidentPersonnel {
    SIGNALE = 'SIGNALE',
    EN_COURS = 'EN_COURS',
    RESOLU = 'RESOLU',
    SANCTIONNE = 'SANCTIONNE',
}

@Entity('incidents_personnel')
@Index(['membrePersonnelId'])
@Index(['declarantId'])
@Index(['gravite'])
@Index(['statut'])
@Index(['etablissementId'])
@Index(['anneeScolaireId']) // ← NOUVEAU
@Index(['anneeScolaireId', 'membrePersonnelId']) // ← NOUVEAU
@Index(['periodeId']) // ← NOUVEAU: filtre par trimestre
@Index(['anneeScolaireId', 'periodeId']) // ← NOUVEAU: composite
export class IncidentPersonnel {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    membrePersonnelId!: string;

    @ManyToOne(() => MembrePersonnel)
    @JoinColumn({ name: 'membrePersonnelId' })
    membrePersonnel?: MembrePersonnel;

    @Column({ type: 'uuid' })
    declarantId!: string;

    @ManyToOne(() => Utilisateur)
    @JoinColumn({ name: 'declarantId' })
    declarant?: Utilisateur;

    @Column({ type: 'timestamp' })
    dateIncident!: Date;

    @Column({ type: 'varchar', length: 20 })
    gravite!: GraviteIncidentPersonnel;

    @Column({ type: 'varchar', length: 20, default: StatutIncidentPersonnel.SIGNALE })
    statut!: StatutIncidentPersonnel;

    @Column({ type: 'varchar', length: 200 })
    type!: string; // RETARD, ABSENCE_NON_JUSTIFIEE, MANQUEMENT, INSUBORDINATION, AUTRE

    @Column({ type: 'text' })
    description!: string;

    @Column({ type: 'text', nullable: true })
    actionPrise?: string;

    @Column({ type: 'uuid' })
    etablissementId!: string;

    @ManyToOne(() => Etablissement)
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement;

    // ==================== LIEN PÉRIODE ACADÉMIQUE ====================
    @Column({ type: 'uuid' })
    anneeScolaireId!: string;

    @ManyToOne(() => AnneeScolaire)
    @JoinColumn({ name: 'anneeScolaireId' })
    anneeScolaire?: AnneeScolaire;

    // ==================== LIEN PÉRIODE/TRIMESTRE ====================
    @Column({ type: 'uuid', nullable: true })
    periodeId?: string;

    @ManyToOne(() => Periode, { nullable: true })
    @JoinColumn({ name: 'periodeId' })
    periode?: Periode;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
