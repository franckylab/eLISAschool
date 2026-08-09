/**
 * ==================================
 * eLISAschool - Entité ModuleOptionnel
 * ==================================
 * 
 * Module optionnel payable en supplément du plan de base.
 * Ex: module_transport, module_cantine, module_bibliotheque, etc.
 * 
 * Phase 4.1 — Refonte SaaS
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('modules_optionnels')
export class ModuleOptionnel {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 100 })
    nom!: string;

    @Column({ type: 'varchar', length: 100, unique: true })
    slug!: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    prixMensuel!: number;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    prixAnnuel!: number;

    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    @Column({ type: 'boolean', default: true })
    visible!: boolean;

    @Column({ type: 'int', default: 0 })
    ordre!: number;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
