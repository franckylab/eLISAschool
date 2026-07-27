/**
 * ==================================
 * eLISAschool - Entités Affectation Matière (Enseignement)
 * ==================================
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index
} from 'typeorm';
import { Matiere } from './matiere.entity';
import { ClasseAnnee } from '@modules/classes/entities';
import { MembrePersonnel } from '@modules/personnel/entities';
import { Etablissement } from '@modules/etablissement/entities';

/**
 * Statut de l'affectation matière (support workflow de validation)
 */
export enum StatutAffectationMatiere {
    ACTIVE = 'ACTIVE',
    EN_ATTENTE_VALIDATION = 'EN_ATTENTE_VALIDATION',
    INACTIVE = 'INACTIVE',
}

/**
 * Statut de validation de l'affectation (absorbé depuis ConfigurationMatiereClasse)
 */
export enum StatutValidationAffectation {
    VALIDE = 'VALIDE',
    EN_ATTENTE_VALIDATION = 'EN_ATTENTE_VALIDATION',
    REJETE = 'REJETE',
}

@Entity('affectations_matieres')
@Index(['classeAnneeId'])
@Index(['enseignantId'])
@Index(['etablissementId'])
@Index(['classeAnneeId', 'etablissementId'])  // Index composite pour requêtes multi-tenant
@Index(['enseignantId', 'etablissementId'])  // Index composite pour enseignants par établissement
@Index(['enseignantId', 'matiereId', 'classeAnneeId', 'actif'], {
    where: 'actif = true',
})  // Contrainte unique partielle : un enseignant ne peut avoir qu'une seule affectation active par matière/classe-année
export class AffectationMatiere {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    matiereId!: string;

    @ManyToOne(() => Matiere)
    @JoinColumn({ name: 'matiereId' })
    matiere?: Matiere;

    @Column({ type: 'uuid' })
    classeAnneeId!: string;

    @ManyToOne(() => ClasseAnnee)
    @JoinColumn({ name: 'classeAnneeId' })
    classeAnnee?: ClasseAnnee;

    @Column({ type: 'uuid' })
    enseignantId!: string;

    @ManyToOne(() => MembrePersonnel)
    @JoinColumn({ name: 'enseignantId' })
    enseignant?: MembrePersonnel;

    /**
     * Établissement de l'affectation (multi-tenant)
     * Doit correspondre à classe.etablissementId
     */
    @Column({ type: 'uuid' })
    etablissementId!: string;

    @ManyToOne(() => Etablissement, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement;

    /**
     * La matière est-elle obligatoire pour cette classe (absorbé depuis ConfigurationMatiereClasse)
     */
    @Column({ type: 'boolean', default: true })
    obligatoire!: boolean;

    /**
     * Statut de validation de l'affectation (absorbé depuis ConfigurationMatiereClasse)
     */
    @Column({ type: 'varchar', length: 30, default: StatutValidationAffectation.VALIDE })
    statutValidation!: StatutValidationAffectation;

    /**
     * Coefficient spécifique à cette affectation.
     * Si NULL, utilise le coefficient de MatiereNiveau.
     */
    @Column({ type: 'float', nullable: true })
    coefficient?: number;

    /**
     * Statut de l'affectation (support workflow de validation)
     */
    @Column({ type: 'varchar', length: 30, default: StatutAffectationMatiere.ACTIVE })
    statut!: StatutAffectationMatiere;

    /**
     * Date de début de l'affectation
     */
    @Column({ type: 'date' })
    dateDebut!: Date;

    /**
     * Date de fin de l'affectation (NULL = toujours actif)
     */
    @Column({ type: 'date', nullable: true })
    dateFin?: Date;

    /**
     * Co-enseignants associés à cette affectation (co-enseignement).
     * L'enseignant principal reste enseignantId.
     */
    @Column({ type: 'simple-array', nullable: true })
    coEnseignantIds?: string[];

    /**
     * L'affectation est-elle actuellement active ?
     * Permet de gérer les remplacements d'enseignants en cours d'année
     */
    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
