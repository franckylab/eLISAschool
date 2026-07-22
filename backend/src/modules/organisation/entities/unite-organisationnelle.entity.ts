/**
 * ==================================
 * eLISAschool - Entité Unité Organisationnelle
 * ==================================
 * Version: 3.0.0
 * Auteur: franck arlos chendjou
 *
 * Représente une unité structurelle au sein d'un établissement :
 * départements, services, commissions, équipes, etc.
 * Supporte une hiérarchie en arbre (parent/enfant).
 * Rattachée directement à l'établissement (après fusion Organisation → Etablissement).
 *
 * Refonte v3.0 :
 * - usageUniteId : FK vers UsageUnite (remplace usageUniteCode)
 * - metadata supprimé
 * - typeUniteId supprimé (redondant avec UsageUnite)
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
import { NiveauOrganisation } from './niveau-organisation.entity';
import { UsageUnite } from './usage-unite.entity';

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

    // FK vers UsageUnite (remplace l'ancien usageUniteCode)
    @Column({ type: 'uuid', nullable: true })
    usageUniteId?: string;

    @ManyToOne(() => UsageUnite, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'usageUniteId' })
    usageUnite?: UsageUnite;

    // FK vers NiveauOrganisation
    @Column({ type: 'uuid', nullable: true })
    niveauOrganisationId?: string;

    @ManyToOne(() => NiveauOrganisation, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'niveauOrganisationId' })
    niveauOrganisation?: NiveauOrganisation;

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

    @Column({ type: 'varchar', length: 100, nullable: true })
    localisation?: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    telephone?: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    email?: string;

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
