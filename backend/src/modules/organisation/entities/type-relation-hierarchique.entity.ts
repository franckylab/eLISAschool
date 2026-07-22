/**
 * ==================================
 * eLISAschool - Entité TypeRelationHierarchique
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Type de relation hiérarchique (SUPERVISE_DIRECT, SUPERVISE_INDIRECT, etc.)
 * Conversion de l'enum PostgreSQL en table éditable.
 * Les seeds système sont protégés (estSysteme = true, non supprimables).
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
import { Etablissement } from '@modules/etablissement/entities';

@Entity('types_relation_hierarchique')
@Index(['etablissementId'])
@Index(['code', 'etablissementId'], { unique: true })
export class TypeRelationHierarchique {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 50 })
    code!: string;

    @Column({ type: 'varchar', length: 100 })
    label!: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'uuid', nullable: true })
    etablissementId?: string | null;

    @ManyToOne(() => Etablissement, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement | null;

    @Column({ type: 'boolean', default: false })
    estSysteme!: boolean;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
