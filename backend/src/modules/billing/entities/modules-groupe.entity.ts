/**
 * ==================================
 * eLISAschool - Entité ModulesGroupe
 * ==================================
 * 
 * Override des modules du catalogue par groupe d'établissements.
 * Cascade : groupe → plan → établissement → catalogue.
 * 
 * Lot C v7 — Refonte SaaS
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { GroupeEtablissement } from '@modules/groupes-etablissements/entities';
import { ModuleCatalogue } from './module-catalogue.entity';

@Entity('modules_groupe')
@Index(['groupeEtablissementId'])
export class ModulesGroupe {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    groupeEtablissementId!: string;

    @ManyToOne(() => GroupeEtablissement, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'groupeEtablissementId' })
    groupe!: GroupeEtablissement;

    @Column({ type: 'uuid' })
    moduleCatalogueId!: string;

    @ManyToOne(() => ModuleCatalogue, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'moduleCatalogueId' })
    module!: ModuleCatalogue;

    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    @Column({ type: 'uuid', nullable: true })
    creePar?: string;

    @CreateDateColumn()
    creeAt!: Date;

    @UpdateDateColumn()
    majAt!: Date;
}
