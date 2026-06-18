/**
 * ==================================
 * eLISAschool - Entités Cycles
 * ==================================
 * Version: 2.0.0
 * 
 * Changements v2.0:
 * - Ajout etablissementId pour support multi-tenant
 * - Chaque établissement possède ses propres cycles
 * - Contraintes UNIQUE transformées en index composites (nom/code + etablissementId)
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { Niveau } from '@modules/niveaux/entities';
import { Etablissement } from '@modules/etablissement/entities';

@Entity('cycles')
@Index(['etablissementId'])
@Index(['code', 'etablissementId'], { unique: true })
@Index(['nom', 'etablissementId'], { unique: true })
export class Cycle {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 100 })
    nom!: string; // "Enseignement Maternel", "Enseignement Primaire", etc.

    @Column({ type: 'varchar', length: 50 })
    code!: string; // "MATERNELLE", "PRIMAIRE", "COLLEGE", "LYCEE"

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'int', default: 0 })
    ordre!: number; // Ordre d'affichage

    @Column({ type: 'int', default: 0, name: 'dureeannees' })
    dureeAnnees!: number; // Durée en années (3, 6, 4, 3)

    @Column({ type: 'varchar', length: 50, nullable: true, name: 'diplomesanctionnant' })
    diplomeSanctionnant?: string; // "CEP", "BEPC", "BACCALAUREAT"

    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    /**
     * Relation multi-tenant : chaque cycle appartient à un établissement.
     * Permet à chaque établissement d'avoir ses propres cycles personnalisés.
     * NOTE: Nullable temporairement pour permettre la migration 072.
     * La migration rendra cette colonne NOT NULL après avoir dupliqué les données.
     */
    @Column({ type: 'uuid', nullable: true })
    etablissementId?: string;

    @ManyToOne(() => Etablissement, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement;

    @OneToMany(() => Niveau, (niveau) => niveau.cycle)
    niveaux?: Niveau[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
