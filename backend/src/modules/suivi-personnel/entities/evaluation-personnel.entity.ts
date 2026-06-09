/**
 * ==================================
 * eLISAschool - Entité EvaluationPersonnel
 * ==================================
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

export enum PeriodiciteEvaluation {
    MENSUELLE = 'MENSUELLE',
    TRIMESTRIELLE = 'TRIMESTRIELLE',
    SEMESTRIELLE = 'SEMESTRIELLE',
    ANNUELLE = 'ANNUELLE',
}

export enum StatutEvaluation {
    PLANIFIEE = 'PLANIFIEE',
    EN_COURS = 'EN_COURS',
    TERMINEE = 'TERMINEE',
}

@Entity('evaluations_personnel')
@Index(['membrePersonnelId'])
@Index(['evaluateurId'])
@Index(['periode'])
@Index(['etablissementId'])
@Index(['anneeScolaireId']) // ← NOUVEAU
@Index(['anneeScolaireId', 'membrePersonnelId']) // ← NOUVEAU
@Index(['periodeId']) // ← NOUVEAU: filtre par trimestre
@Index(['anneeScolaireId', 'periodeId']) // ← NOUVEAU: composite
export class EvaluationPersonnel {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    membrePersonnelId!: string;

    @ManyToOne(() => MembrePersonnel)
    @JoinColumn({ name: 'membrePersonnelId' })
    membrePersonnel?: MembrePersonnel;

    @Column({ type: 'uuid' })
    evaluateurId!: string;

    @ManyToOne(() => Utilisateur)
    @JoinColumn({ name: 'evaluateurId' })
    evaluateur?: Utilisateur;

    @Column({ type: 'varchar', length: 20 })
    periodicite!: PeriodiciteEvaluation;

    @Column({ type: 'varchar', length: 20, default: StatutEvaluation.PLANIFIEE })
    statut!: StatutEvaluation;

    @Column({ type: 'varchar', length: 50 })
    periode!: string; // "2026-T1", "2026-S1", "2026"

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    noteGlobale?: number;

    @Column({ type: 'text', nullable: true })
    pointsFort?: string;

    @Column({ type: 'text', nullable: true })
    pointsAmeliorer?: string;

    @Column({ type: 'text', nullable: true })
    objectifs?: string;

    @Column({ type: 'text', nullable: true })
    commentaires?: string;

    @Column({ type: 'boolean', default: false })
    visibleConcerned!: boolean;

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

    @Column({ type: 'uuid', nullable: true })
    periodeId?: string; // FK vers periodes

    @ManyToOne(() => Periode, { nullable: true })
    @JoinColumn({ name: 'periodeId' })
    periodeObj?: Periode;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
