/**
 * ==================================
 * eLISAschool - Entité Configuration Matière par Classe
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Configuration pédagogique d'une matière pour une classe donnée
 * dans une année scolaire et un établissement spécifiques.
 *
 * Fait le lien entre :
 * - MatiereNiveau (programme générique national)
 * - AffectationMatiere (affectation enseignant)
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
import { Matiere } from './matiere.entity';
import { ClasseAnnee } from '@modules/classes/entities';
import { Etablissement } from '@modules/etablissement/entities';

/**
 * Statut de la configuration matière-classe
 */
export enum StatutConfigurationMatiereClasse {
    ACTIVE = 'ACTIVE',
    EN_ATTENTE_VALIDATION = 'EN_ATTENTE_VALIDATION',
    INACTIVE = 'INACTIVE',
}

@Entity('configurations_matieres_classes')
@Index(['matiereId'])
@Index(['classeAnneeId'])
@Index(['etablissementId'])
@Index(['classeAnneeId', 'etablissementId'])
@Index(['matiereId', 'classeAnneeId', 'etablissementId'], { unique: true })
export class ConfigurationMatiereClasse {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    /**
     * Matière configurée
     */
    @Column({ type: 'uuid' })
    matiereId!: string;

    @ManyToOne(() => Matiere, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'matiereId' })
    matiere?: Matiere;

    /**
     * Classe concernée
     */
    @Column({ type: 'uuid' })
    classeAnneeId!: string;

    @ManyToOne(() => ClasseAnnee, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'classeAnneeId' })
    classeAnnee?: ClasseAnnee;

    /**
     * Établissement (multi-tenant)
     */
    @Column({ type: 'uuid' })
    etablissementId!: string;

    @ManyToOne(() => Etablissement, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement;

    /**
     * Coefficient spécifique à cette classe (override du MatiereNiveau).
     * Si NULL, utilise le coefficient du MatiereNiveau.
     */
    @Column({ type: 'float', nullable: true })
    coefficient?: number;

    /**
     * Barème spécifique à cette classe (override du MatiereNiveau).
     * Ex: 20 (système francophone), 100 (système anglophone/LMD)
     * Si NULL, utilise le barème du MatiereNiveau.
     */
    @Column({ type: 'int', nullable: true })
    bareme?: number;

    /**
     * Volume horaire hebdomadaire spécifique à cette classe.
     * Si NULL, utilise le volume horaire du MatiereNiveau.
     */
    @Column({ type: 'int', nullable: true })
    volumeHoraireHebdo?: number;

    /**
     * Crédits (système anglophone/LMD).
     * Si NULL, utilise les crédits du MatiereNiveau.
     */
    @Column({ type: 'float', nullable: true })
    credits?: number;

    /**
     * La matière est-elle obligatoire pour cette classe ?
     * Permet de rendre une matière optionnelle pour une classe spécifique.
     */
    @Column({ type: 'boolean', default: true })
    obligatoire!: boolean;

    /**
     * Statut de la configuration (support workflow de validation)
     */
    @Column({ type: 'varchar', length: 30, default: StatutConfigurationMatiereClasse.ACTIVE })
    statut!: StatutConfigurationMatiereClasse;

    /**
     * Notes de configuration spécifiques
     */
    @Column({ type: 'text', nullable: true })
    notes?: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
