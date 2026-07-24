/**
 * ==================================
 * eLISAschool - Entité TypePersonnel
 * ==================================
 * Version: 4.0.0
 * Auteur: franck arlos chendjou
 *
 * Type de personnel (TYPE_ENSEIGNANT, TYPE_DIRECTION, etc.)
 * Source de vérité unique dans le module organisation.
 * Les seeds système sont protégés (estSysteme = true, non supprimables).
 *
 * Refonte v4.0 :
 * - modeRemunerationDefaut supprimé (anomalie global→multi-tenant, déjà porté par TypeContratPersonnalise)
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';

@Entity('types_personnel')
@Index(['code'])
export class TypePersonnel {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 50, unique: true })
    code!: string; // ENSEIGNANT, DIRECTEUR, SURVEILLANT...

    @Column({ type: 'varchar', length: 100 })
    nom!: string;

    @Column({ type: 'varchar', length: 200, nullable: true })
    description?: string;

    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    @Column({ type: 'boolean', default: false })
    estSysteme!: boolean;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
