/**
 * ==================================
 * eLISAschool - Entité Poste
 * ==================================
 * Version: 4.0.0
 * Auteur: franck arlos chendjou
 *
 * Représente un poste au sein d'une unité organisationnelle.
 * La relation avec le personnel se fait via AffectationPoste (module personnel).
 * La catégorie du poste est dérivée via poste.fonction.categorie.
 *
 * Refonte v4.0 :
 * - categoriePosteId supprimé (dérivé via fonction.categorie)
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
    Index,
} from 'typeorm';
import { UniteOrganisationnelle } from './unite-organisationnelle.entity';
import { Fonction } from './fonction.entity';
import { NiveauResponsabilite } from './niveau-responsabilite.entity';

export enum StatutPoste {
    ACTIF = 'ACTIF',
    VACANT = 'VACANT',
    SUPPRIME = 'SUPPRIME',
    EN_ATTENTE = 'EN_ATTENTE',
}

@Entity('postes')
@Index(['uniteOrganisationnelleId'])
@Index(['code'])
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

    // FK vers Fonction — la catégorie attendue du poste est dérivée via fonction.categorie
    @Column({ type: 'uuid', nullable: true })
    fonctionId?: string;

    @ManyToOne(() => Fonction, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'fonctionId' })
    fonction?: Fonction;

    // FK directe vers NiveauResponsabilite (axe orthogonal : poids hiérarchique)
    @Column({ type: 'uuid', nullable: true })
    niveauResponsabiliteId?: string;

    @ManyToOne(() => NiveauResponsabilite, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'niveauResponsabiliteId' })
    niveauResponsabilite?: NiveauResponsabilite;

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

    @DeleteDateColumn()
    deletedAt?: Date;
}
