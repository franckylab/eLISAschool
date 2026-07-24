/**
 * ==================================
 * eLISAschool - Entité Unité Organisationnelle
 * ==================================
 * Version: 4.0.0
 * Auteur: franck arlos chendjou
 *
 * Représente une unité structurelle au sein d'un établissement :
 * départements, services, commissions, équipes, etc.
 * Supporte une hiérarchie en arbre (parent/enfant).
 * Rattachée directement à l'établissement (après fusion Organisation → Etablissement).
 *
 * Refonte v4.0 :
 * - usageUniteId supprimé (fusionné dans EchelonStructurel)
 * - niveauOrganisationId → echelonStructurelId
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
import { Poste } from './poste.entity';
import { EchelonStructurel } from './echelon-structurel.entity';
import type { MembrePersonnel } from '@modules/personnel/entities';

/**
 * Statut d'une unité organisationnelle (enum fermé — non modifiable)
 */
export enum StatutUnite {
    ACTIF = 'ACTIF',
    EN_CREATION = 'EN_CREATION',
    EN_RESTRUCTURATION = 'EN_RESTRUCTURATION',
    ARCHIVE = 'ARCHIVE',
}

/**
 * Entité UniteOrganisationnelle
 * Permet de structurer l'établissement en unités hiérarchiques
 */
@Entity('unites_organisationnelles')
@Index(['etablissementId'])
@Index(['parentId'])
@Index(['code'])
export class UniteOrganisationnelle {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 100 })
    nom!: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    // FK vers EchelonStructurel (fusion de NiveauOrganisation + UsageUnite)
    @Column({ type: 'uuid', nullable: true })
    echelonStructurelId?: string;

    @ManyToOne(() => EchelonStructurel, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'echelonStructurelId' })
    echelonStructurel?: EchelonStructurel;

    @Column({ type: 'varchar', length: 50 })
    code!: string;

    @Column({ type: 'varchar', length: 30, default: StatutUnite.ACTIF })
    statut!: StatutUnite;

    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    // Référence à l'établissement (multi-tenancy)
    @Column({ type: 'uuid' })
    etablissementId!: string;

    // Auto-référence pour hiérarchie (parent/enfant)
    @Column({ type: 'uuid', nullable: true })
    parentId?: string;

    @Column({ type: 'int', default: 0 })
    ordre!: number;

    @Column({ type: 'varchar', length: 200, nullable: true })
    responsableNom?: string;

    @Column({ type: 'uuid', nullable: true })
    responsableId?: string;

    @ManyToOne('MembrePersonnel', { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'responsableId' })
    responsable?: MembrePersonnel;

    @Column({ type: 'varchar', length: 100, nullable: true })
    localisation?: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    // Relations
    @ManyToOne(() => Etablissement, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement;

    @ManyToOne(() => UniteOrganisationnelle, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'parentId' })
    parent?: UniteOrganisationnelle;

    @OneToMany(() => UniteOrganisationnelle, (unite) => unite.parent)
    enfants?: UniteOrganisationnelle[];

    @OneToMany(() => Poste, (poste) => poste.uniteOrganisationnelle)
    postes?: Poste[];
}
