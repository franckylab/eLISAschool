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
import { Classe } from '@modules/classes/entities';
import { MembrePersonnel } from '@modules/personnel/entities';
import { AnneeScolaire } from '@modules/annees-scolaires/entities';
import { Etablissement } from '@modules/etablissement/entities';

/**
 * Statut de l'affectation matière (support workflow de validation)
 */
export enum StatutAffectationMatiere {
    ACTIVE = 'ACTIVE',
    EN_ATTENTE_VALIDATION = 'EN_ATTENTE_VALIDATION',
    INACTIVE = 'INACTIVE',
}

@Entity('affectations_matieres')
@Index(['classeId'])
@Index(['enseignantId'])
@Index(['etablissementId'])
@Index(['classeId', 'etablissementId'])  // Index composite pour requêtes multi-tenant
@Index(['enseignantId', 'etablissementId'])  // Index composite pour enseignants par établissement
export class AffectationMatiere {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    matiereId!: string;

    @ManyToOne(() => Matiere)
    @JoinColumn({ name: 'matiereId' })
    matiere?: Matiere;

    @Column({ type: 'uuid' })
    classeId!: string;

    @ManyToOne(() => Classe)
    @JoinColumn({ name: 'classeId' })
    classe?: Classe;

    @Column({ type: 'uuid' })
    enseignantId!: string;

    @ManyToOne(() => MembrePersonnel)
    @JoinColumn({ name: 'enseignantId' })
    enseignant?: MembrePersonnel;

    @Column({ type: 'uuid' })
    anneeScolaireId!: string;

    @ManyToOne(() => AnneeScolaire)
    @JoinColumn({ name: 'anneeScolaireId' })
    anneeScolaire?: AnneeScolaire;

    /**
     * Établissement de l'affectation (multi-tenant)
     * Doit correspondre à classe.etablissementId
     */
    @Column({ type: 'uuid' })
    etablissementId!: string;

    @ManyToOne(() => Etablissement, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement;

    @Column({ type: 'int', nullable: true })
    volumeHoraireHebdo?: number;

    /**
     * Coefficient spécifique à cette affectation (override du coefficient MatiereNiveau).
     * Permet d'ajuster les coefficients par classe pour les filières.
     * Si NULL, utilise le coefficient de MatiereNiveau.
     */
    @Column({ type: 'float', nullable: true })
    coefficient?: number;

    /**
     * Statut de l'affectation (support workflow de validation)
     */
    @Column({ type: 'varchar', length: 30, default: StatutAffectationMatiere.ACTIVE })
    statut!: StatutAffectationMatiere;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
