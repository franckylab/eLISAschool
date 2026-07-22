/**
 * ==================================
 * eLISAschool - Entité Poste
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 *
 * Représente un poste au sein d'une unité organisationnelle.
 * La relation avec le personnel se fait via AffectationPoste (module personnel).
 * Les jointures vers nomenclatures utilisent des FK UUID directes.
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
import { TypePersonnel } from './type-personnel.entity';
import { UniteOrganisationnelle } from './unite-organisationnelle.entity';
import { Fonction } from './fonction.entity';
import { NiveauResponsabilite } from './niveau-responsabilite.entity';
import { CategoriePoste } from './categorie-poste.entity';

export enum StatutPoste {
    ACTIF = 'ACTIF',
    VACANT = 'VACANT',
    SUPPRIME = 'SUPPRIME',
    EN_ATTENTE = 'EN_ATTENTE',
}

@Entity('postes')
@Index(['uniteOrganisationnelleId'])
@Index(['code'])
@Index(['categoriePosteId'])
@Index(['typePersonnelId'])
@Index(['statut'])
@Index(['fonctionId'])
@Index(['occupantsCount'])
export class Poste {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 100, default: '' })
    intitule!: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'varchar', length: 50 })
    code!: string;

    // FK directe vers CategoriePoste (remplace l'ancien categoriePosteCode)
    @Column({ type: 'uuid', nullable: true })
    categoriePosteId?: string;

    @ManyToOne(() => CategoriePoste, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'categoriePosteId' })
    categoriePoste?: CategoriePoste;

    // FK directe vers Fonction
    @Column({ type: 'uuid', nullable: true })
    fonctionId?: string;

    @ManyToOne(() => Fonction, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'fonctionId' })
    fonction?: Fonction;

    // FK directe vers NiveauResponsabilite (remplace l'ancien niveauResponsabiliteCode)
    @Column({ type: 'uuid', nullable: true })
    niveauResponsabiliteId?: string;

    @ManyToOne(() => NiveauResponsabilite, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'niveauResponsabiliteId' })
    niveauResponsabilite?: NiveauResponsabilite;

    // FK vers TypePersonnel
    @Column({ type: 'uuid', nullable: true })
    typePersonnelId?: string;

    @ManyToOne(() => TypePersonnel, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'typePersonnelId' })
    typePersonnel?: TypePersonnel;

    @Column({ type: 'enum', enum: StatutPoste, default: StatutPoste.ACTIF })
    statut!: StatutPoste;

    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    // Unité organisationnelle de rattachement
    @Column({ type: 'uuid' })
    uniteOrganisationnelleId!: string;

    @ManyToOne(() => UniteOrganisationnelle, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'uniteOrganisationnelleId' })
    uniteOrganisationnelle?: UniteOrganisationnelle;

    // Nombre de postes prévus et occupants (calculé via AffectationPoste)
    @Column({ type: 'int', default: 1 })
    nombrePostes!: number;

    @Column({ type: 'int', default: 0 })
    occupantsCount!: number;

    // Compétences et missions (JSONB — listes simples de strings)
    @Column({ type: 'jsonb', nullable: true })
    competencesRequises?: string[];

    @Column({ type: 'jsonb', nullable: true })
    missions?: string[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
