/**
 * ==================================
 * eLISAschool - Entité TypePersonnel
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 *
 * Type de personnel (ENSEIGNANT, DIRECTEUR, SURVEILLANT, etc.)
 * Source de vérité unique dans le module organisation.
 * Les seeds système sont protégés (estSysteme = true, non supprimables).
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

    @Column({ type: 'simple-json', nullable: true })
    permissionsDefaut?: string[];

    @Column({ type: 'uuid', nullable: true })
    roleIdParDefaut?: string;

    @Column({ type: 'varchar', length: 200, nullable: true })
    description?: string;

    @Column({ type: 'varchar', length: 30, nullable: true })
    modeRemunerationDefaut?: string;

    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    @Column({ type: 'boolean', default: false })
    estSysteme!: boolean;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
