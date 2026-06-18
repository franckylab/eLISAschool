/**
 * ==================================
 * eLISAschool - Entités Niveaux
 * ==================================
 * Version: 2.0.0
 * 
 * Changements v2.0:
 * - Ajout etablissementId pour support multi-tenant
 * - Chaque établissement possède ses propres niveaux
 * - Index composites pour requêtes multi-tenant performantes
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { Cycle } from '@modules/cycles/entities';
import { ExamenNational } from '@modules/examens-nationaux/entities';
import { SousSysteme, Etablissement } from '@modules/etablissement/entities';

@Entity('niveaux')
@Index(['cycleId'])
@Index(['etablissementId'])
@Index(['cycleId', 'etablissementId'])
@Index(['code', 'sousSysteme', 'etablissementId'], { unique: true })
export class Niveau {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 100 })
    nom!: string; // ex: 6ème, CP, Lower 6th

    @Column({ type: 'varchar', length: 50, nullable: true })
    code!: string; // ex: 6E, CP

    @Column({ type: 'uuid' })
    cycleId!: string;

    @ManyToOne(() => Cycle)
    @JoinColumn({ name: 'cycleId' })
    cycle?: Cycle;

    @Column({ type: 'uuid', nullable: true })
    examenNationalId?: string;

    @ManyToOne(() => ExamenNational, { nullable: true })
    @JoinColumn({ name: 'examenNationalId' })
    examenNational?: ExamenNational;

    @Column({ type: 'boolean', default: false })
    estClasseExamen!: boolean; // true pour CM2, 3ème, Terminale, etc.

    @Column({ type: 'enum', enum: SousSysteme, default: SousSysteme.FRANCOPHONE })
    sousSysteme!: SousSysteme;

    @Column({ type: 'int', default: 1 })
    ordre!: number; // Ordre dans le cycle

    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    /**
     * Relation multi-tenant : chaque niveau appartient à un établissement.
     * Permet à chaque établissement d'avoir ses propres niveaux personnalisés.
     * NOTE: Nullable temporairement pour permettre la migration 072.
     * La migration rendra cette colonne NOT NULL après avoir dupliqué les données.
     */
    @Column({ type: 'uuid', nullable: true })
    etablissementId?: string;

    @ManyToOne(() => Etablissement, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
