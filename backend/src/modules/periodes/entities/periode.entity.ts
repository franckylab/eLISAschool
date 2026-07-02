/**
 * ==================================
 * eLISAschool - Entité Période (v5.0 — Niveaux de périodicité)
 * ==================================
 * Version: 5.0.0
 * Auteur: franck arlos chendjou
 *
 * Refonte architecturale v5.0 :
 * - Suppression de l'enum TypePeriode (SEQUENCE, TRIMESTRE, SEMESTRE, ANNEE)
 * - Remplacement par FK niveauId vers NiveauPeriode (niveaux configurables)
 * - Chaque établissement définit ses propres niveaux et libellés
 * - Hiérarchie via table de jointure PeriodeComposition (inchangée)
 *
 * Historique :
 * - v3.0 : Suppression entité TypePeriode → enum inline
 * - v4.0 : Templates personnalisables
 * - v5.0 : Niveaux de périodicité configurables + usages sémantiques
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
import { AnneeScolaire } from '@modules/annees-scolaires/entities';
import { Etablissement } from '@modules/etablissement/entities';
import { NiveauPeriode } from './niveau-periode.entity';
import { PeriodeComposition } from './periode-composition.entity';

/**
 * Statut de la période (support workflow de clôture)
 */
export enum StatutPeriode {
    OUVERTE = 'OUVERTE',
    EN_ATTENTE_CLOTURE = 'EN_ATTENTE_CLOTURE',
    CLOTUREE = 'CLOTUREE',
}

@Entity('periodes')
@Index(['anneeScolaireId'])
@Index(['etablissementId'])
@Index(['niveauId'])
@Index(['anneeScolaireId', 'etablissementId'])
@Index(['anneeScolaireId', 'niveauId'])
export class Periode {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 100 })
    nom!: string;

    /**
     * FK vers NiveauPeriode — remplace l'ancien champ type (enum TypePeriode).
     * Détermine le niveau hiérarchique et l'usage sémantique de la période.
     */
    @Column({ type: 'uuid' })
    niveauId!: string;

    @ManyToOne(() => NiveauPeriode)
    @JoinColumn({ name: 'niveauId' })
    niveau?: NiveauPeriode;

    @Column({ type: 'uuid' })
    anneeScolaireId!: string;

    @ManyToOne(() => AnneeScolaire)
    @JoinColumn({ name: 'anneeScolaireId' })
    anneeScolaire?: AnneeScolaire;

    /**
     * Établissement de la période (multi-tenant)
     * Doit correspondre à anneeScolaire.etablissementId
     */
    @Column({ type: 'uuid' })
    etablissementId!: string;

    @ManyToOne(() => Etablissement, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement;

    @Column({ type: 'date' })
    dateDebut!: Date;

    @Column({ type: 'date' })
    dateFin!: Date;

    /**
     * Statut de la période (support workflow de clôture)
     */
    @Column({ type: 'varchar', length: 30, default: StatutPeriode.OUVERTE })
    statut!: StatutPeriode;

    // ==== RELATIONS HIÉRARCHIQUES ====

    /**
     * Compositions où cette période est PARENT
     * (ex: un trimestre qui contient des séquences)
     */
    @OneToMany(() => PeriodeComposition, (comp) => comp.periodeParent, { cascade: true })
    compositionsEnfants?: PeriodeComposition[];

    /**
     * Compositions où cette période est ENFANT
     * (ex: une séquence contenue dans un trimestre)
     */
    @OneToMany(() => PeriodeComposition, (comp) => comp.periodeEnfant)
    compositionsParents?: PeriodeComposition[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
