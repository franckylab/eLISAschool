/**
 * ==================================
 * eLISAschool - Entité Classe Année (Instance annuelle de classe)
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Instance d'une classe pour une année scolaire spécifique.
 * Contient les informations qui changent chaque année :
 * - Professeur principal
 * - Effectifs
 * - Statut actif/inactif
 *
 * Le modèle de classe (nom, niveau, filière) est dans l'entité Classe.
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
import { Classe } from './classe.entity';
import { AnneeScolaire } from '@modules/annees-scolaires/entities';
import { MembrePersonnel } from '@modules/personnel/entities';
import { Salle } from '@modules/salles/entities';
import { ProgrammePedagogique } from '@modules/programmes/entities';
import { Etablissement } from '@modules/etablissement/entities';

/**
 * Statut de la classe année
 */
export enum StatutClasseAnnee {
    ACTIVE = 'ACTIVE',
    EN_ATTENTE_VALIDATION = 'EN_ATTENTE_VALIDATION',
    INACTIVE = 'INACTIVE',
    CLOTUREE = 'CLOTUREE',
}

@Entity('classes_annees')
@Index(['classeId'])
@Index(['anneeScolaireId'])
@Index(['etablissementId'])
@Index(['classeId', 'anneeScolaireId'], { unique: true })
@Index(['etablissementId', 'anneeScolaireId'])
@Index(['professeurPrincipalId'])
export class ClasseAnnee {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    /**
     * Classe (modèle permanent : nom, niveau, filière)
     */
    @Column({ type: 'uuid' })
    classeId!: string;

    @ManyToOne(() => Classe, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'classeId' })
    classe?: Classe;

    /**
     * Année scolaire de cette instance
     */
    @Column({ type: 'uuid' })
    anneeScolaireId!: string;

    @ManyToOne(() => AnneeScolaire, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'anneeScolaireId' })
    anneeScolaire?: AnneeScolaire;

    /**
     * Établissement (multi-tenant)
     */
    @Column({ type: 'uuid' })
    etablissementId!: string;

    @ManyToOne(() => Etablissement, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement;

    /**
     * Professeur principal pour cette année scolaire
     */
    @Column({ type: 'uuid', nullable: true })
    professeurPrincipalId?: string;

    @ManyToOne(() => MembrePersonnel, { nullable: true })
    @JoinColumn({ name: 'professeurPrincipalId' })
    professeurPrincipal?: MembrePersonnel;

    /**
     * Salle principale assignée à cette classe pour cette année scolaire
     * La capacité de cette salle borne l'effectif maximal (effectifMax)
     */
    @Column({ type: 'uuid', nullable: true })
    @Index()
    sallePrincipaleId?: string;

    @ManyToOne(() => Salle, { nullable: true })
    @JoinColumn({ name: 'sallePrincipaleId' })
    sallePrincipale?: Salle;

    /**
     * Effectif maximum autorisé pour cette classe cette année
     */
    @Column({ type: 'int', default: 50 })
    effectifMax!: number;

    /**
     * Effectif actuel (calculé automatiquement via AffectationEleve)
     */
    @Column({ type: 'int', default: 0 })
    effectifActuel!: number;

    /**
     * La classe année est-elle active ?
     * false = classe fermée (année terminée ou supprimée)
     */
    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    /**
     * Statut de la classe année (support workflow de validation)
     */
    @Column({ type: 'varchar', length: 30, default: StatutClasseAnnee.ACTIVE })
    statut!: StatutClasseAnnee;

    /**
     * Notes ou commentaires spécifiques à cette année
     */
    @Column({ type: 'text', nullable: true })
    notes?: string;

    /**
     * Programme pédagogique suivi par cette classe pour cette année.
     * Détermine les volumes horaires et coefficients via ProgrammeMatiere.
     * NULL = pas de programme associé (fallback sur MatiereNiveau uniquement).
     */
    @Column({ type: 'uuid', nullable: true })
    programmeId?: string;

    @ManyToOne(() => ProgrammePedagogique, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'programmeId' })
    programme?: ProgrammePedagogique;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
