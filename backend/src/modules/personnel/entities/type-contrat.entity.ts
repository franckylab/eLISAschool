/**
 * ==================================
 * eLISAschool - Entité Type Contrat Personnalisé
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Permet de définir des types de contrat personnalisables par établissement.
 * Supporte les types système (protégés) et les types personnalisés.
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
    OneToMany,
} from 'typeorm';
import { Etablissement } from '@modules/etablissement/entities';
import { ContratPersonnel } from './contrat-personnel.entity';
import { ModeRemuneration } from '@modules/paie/entities/mode-remuneration.enum';

/**
 * Catégorie de contrat (pour organisation et filtrage)
 */
export enum CategorieContrat {
    EMPLOI_PERMANENT = 'EMPLOI_PERMANENT',
    EMPLOI_TEMPORAIRE = 'EMPLOI_TEMPORAIRE',
    STAGE_FORMATION = 'STAGE_FORMATION',
    FREELANCE = 'FREELANCE',
    TEMPS_PARTIEL = 'TEMPS_PARTIEL',
    APPRENTISSAGE = 'APPRENTISSAGE',
    AUTRE = 'AUTRE',
}

@Entity('types_contrat_personnalises')
@Index(['code', 'etablissementId'], { unique: true })
@Index(['etablissementId'])
@Index(['categorie'])
@Index(['actif'])
export class TypeContratPersonnalise {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 50 })
    code!: string; // CDD, CDI, APPRENTISSAGE, INTERIMAIRE...

    @Column({ type: 'varchar', length: 100 })
    nom!: string; // Contrat à durée déterminée, CDI, etc.

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'varchar', length: 50, default: CategorieContrat.EMPLOI_PERMANENT })
    categorie!: CategorieContrat;

    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    @Column({ type: 'boolean', default: false })
    estSysteme!: boolean; // true = type protégé du système

    @Column({ type: 'int', default: 0 })
    ordre!: number; // Pour l'affichage trié

    // Configuration par défaut pour ce type de contrat
    @Column({ type: 'varchar', length: 30, default: ModeRemuneration.MENSUEL })
    modeRemuneration!: ModeRemuneration;

    @Column({ type: 'boolean', default: false })
    renouvellementAutoDefaut!: boolean;

    @Column({ type: 'int', nullable: true })
    dureeMaxMois?: number; // null = illimité (CDI)

    @Column({ type: 'jsonb', nullable: true })
    clausesDefaut?: string[]; // Clauses suggérées pour ce type

    @Column({ type: 'jsonb', nullable: true })
    avantagesDefaut?: Record<string, any>; // Avantages associés

    // Multi-tenancy
    @Column({ type: 'uuid', nullable: true })
    etablissementId?: string; // null = type système global

    @ManyToOne(() => Etablissement, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement;

    // Relations
    @OneToMany(() => ContratPersonnel, (contrat) => contrat.typeContratEntity)
    contrats?: ContratPersonnel[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
