/**
 * ==================================
 * eLISAschool - Historique Score Santé Établissement
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Stocke les snapshots de score de santé à chaque recalcul
 * pour permettre la visualisation de l'évolution dans le temps.
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('historique_score_sante')
@Index(['etablissementId'])
@Index(['createdAt'])
@Index(['etablissementId', 'createdAt'])
export class HistoriqueScoreSante {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    etablissementId!: string;

    @Column({ type: 'int' })
    score!: number; // 0-100

    @Column({ type: 'varchar', length: 20 })
    categorie!: string; // 'sain' | 'attention' | 'critique'

    @Column({ type: 'int', nullable: true })
    scoreAbonnement!: number;

    @Column({ type: 'int', nullable: true })
    scorePaiements!: number;

    @Column({ type: 'int', nullable: true })
    scoreActivite!: number;

    @Column({ type: 'int', nullable: true })
    scoreModules!: number;

    @CreateDateColumn()
    createdAt!: Date;
}
