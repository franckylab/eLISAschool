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
import { ConfigurationMatiereClasse } from './configuration-matiere-classe.entity';

/**
 * Statut de l'affectation matière (support workflow de validation)
 */
export enum StatutAffectationMatiere {
    ACTIVE = 'ACTIVE',
    EN_ATTENTE_VALIDATION = 'EN_ATTENTE_VALIDATION',
    INACTIVE = 'INACTIVE',
}

@Entity('affectations_matieres')
@Index(['classeAnneeId'])
@Index(['enseignantId'])
@Index(['etablissementId'])
@Index(['configurationId'])
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
     * Configuration matière-classe liée (contient coefficient, barème, volume horaire)
     * Permet de partager la même configuration entre plusieurs enseignants
     */
    @Column({ type: 'uuid', nullable: true })
    configurationId?: string;

    @ManyToOne(() => ConfigurationMatiereClasse, { nullable: true })
    @JoinColumn({ name: 'configurationId' })
    configuration?: ConfigurationMatiereClasse;

    /**
     * Coefficient spécifique à cette affectation (override du coefficient ConfigurationMatiereClasse).
     * Permet d'ajuster les coefficients par enseignant si nécessaire.
     * Si NULL, utilise le coefficient de ConfigurationMatiereClasse.
     * 
     * @deprecated Préférer l'utilisation de configurationId pour la cohérence
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
