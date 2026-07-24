/**
 * ==================================
 * eLISAschool - Entité Echelon Structurel
 * ==================================
 * Version: 4.0.0
 * Auteur: franck arlos chendjou
 *
 * Représente un échelon dans la hiérarchie structurelle d'un établissement.
 * Fusion de NiveauOrganisation (profondeur hiérarchique) et UsageUnite (code programmatique).
 * Axe orthogonal à NiveauResponsabilite (poids hiérarchique vs profondeur structurelle).
 *
 * Refonte v4.0 :
 * - code : code programmatique (ex: 'DIRECTION', 'DEPARTEMENT', 'SERVICE')
 * - niveau : profondeur dans la hiérarchie (0 = racine)
 * - couleur : optionnelle pour organigramme
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

@Entity('echelons_structurels')
@Index(['etablissementId'])
@Index(['code', 'etablissementId'], { unique: true, where: '"etablissementId" IS NOT NULL' })
export class EchelonStructurel {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'int' })
    niveau!: number;

    @Column({ type: 'varchar', length: 50 })
    code!: string; // DIRECTION, DEPARTEMENT, SERVICE, EQUIPE...

    @Column({ type: 'varchar', length: 100 })
    label!: string;

    @Column({ type: 'varchar', length: 20, nullable: true })
    couleur?: string;

    @Column({ type: 'varchar', length: 200, nullable: true })
    description?: string;

    @Column({ type: 'boolean', default: false })
    estSysteme!: boolean;

    @Column({ type: 'uuid', nullable: true })
    etablissementId?: string | null;

    @ManyToOne(() => Etablissement, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement | null;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
