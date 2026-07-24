/**
 * ==================================
 * eLISAschool - Entité ProgrammeVersion
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 * Date: 2026-07-24
 *
 * Historisation des modifications de ProgrammePedagogique.
 * Chaque modification crée un snapshot JSONB.
 * ==================================
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { ProgrammePedagogique } from './programme-pedagogique.entity';

@Entity('programmes_versions')
@Index(['programmeId'])
export class ProgrammeVersion {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    programmeId!: string;

    @ManyToOne(() => ProgrammePedagogique, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'programmeId' })
    programme?: ProgrammePedagogique;

    /** Snapshot complet du programme au moment de la modification */
    @Column({ type: 'jsonb' })
    snapshot!: Record<string, unknown>;

    /** Identifiant de l'auteur de la modification */
    @Column({ type: 'varchar', length: 100, default: 'system' })
    modifiePar!: string;

    @CreateDateColumn()
    modifieAt!: Date;

    /** Commentaire optionnel sur la modification */
    @Column({ type: 'text', nullable: true })
    commentaire?: string;
}
