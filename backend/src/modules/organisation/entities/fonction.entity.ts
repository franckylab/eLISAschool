/**
 * ==================================
 * eLISAschool - Entité Fonction
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 *
 * Fonction hiérarchique au sein de l'organisation.
 * Structure arborescente (parent/enfant) avec chemin matérialisé.
 * Déplacée depuis le module fonctions/ vers organisation/.
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
    Index,
} from 'typeorm';
import { Etablissement } from '@modules/etablissement/entities';
import { TypePersonnel } from './type-personnel.entity';

@Entity('fonctions')
@Index(['parentId'])
@Index(['etablissementId'])
@Index(['typePersonnelId'])
@Index(['code', 'etablissementId'], { unique: true })
export class Fonction {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 150 })
    nom!: string;

    @Column({ type: 'varchar', length: 50 })
    code!: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    // Auto-référence pour hiérarchie (parent/enfant)
    @Column({ type: 'uuid', nullable: true })
    parentId?: string;

    @ManyToOne(() => Fonction, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'parentId' })
    parent?: Fonction;

    @OneToMany(() => Fonction, (fonction) => fonction.parent)
    enfants?: Fonction[];

    @Column({ type: 'int', default: 0 })
    niveau!: number;

    @Column({ type: 'varchar', length: 500, nullable: true })
    chemin?: string;

    // Type statutaire porté par la fonction (ex: fonction « Professeur » ⟹ ENSEIGNANT).
    // Permet au poste de dériver son type attendu via poste.fonction.typePersonnel.
    @Column({ type: 'uuid', nullable: true })
    typePersonnelId?: string;

    @ManyToOne(() => TypePersonnel, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'typePersonnelId' })
    typePersonnel?: TypePersonnel;

    @Column({ type: 'jsonb', nullable: true })
    primesDefaut?: Record<string, any>;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    majorationDefaut?: number;

    @Column({ type: 'boolean', default: false })
    estSysteme!: boolean;

    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    @Column({ type: 'int', default: 1 })
    ordre!: number;

    @Column({ type: 'uuid' })
    etablissementId!: string;

    @ManyToOne(() => Etablissement, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
