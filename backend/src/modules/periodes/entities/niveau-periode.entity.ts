/**
 * ==================================
 * eLISAschool - Entité NiveauPeriode
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Niveaux de périodicité configurables par établissement.
 * Remplace l'ancien enum TypePeriode (EVALUATION, TRIMESTRE, SEMESTRE, ANNEE).
 *
 * Chaque établissement définit ses propres niveaux :
 * - Niveau 0 : plus petite instance (base) — ex: "Évaluation"
 * - Niveau 1 : groupe de niveaux 0 — ex: "Trimestre"
 * - Niveau 2 : groupe de niveaux 1 — ex: "Semestre"
 * - Niveau 3 : niveau racine — ex: "Année"
 *
 * Chaque niveau est associé à un usage sémantique (via usageCode) qui détermine
 * les règles métier (saisie des notes, génération des bulletins, etc.).
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
import { Etablissement } from '@modules/etablissement/entities';

@Entity('niveaux_periode')
@Index(['etablissementId'])
@Index(['etablissementId', 'niveau'], { unique: true })
export class NiveauPeriode {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    /**
     * Établissement propriétaire (multi-tenant strict).
     */
    @Column({ type: 'uuid' })
    etablissementId!: string;

    /**
     * Niveau hiérarchique (0 = base, 1, 2, 3... = niveaux supérieurs).
     * Unique par établissement.
     */
    @Column({ type: 'integer' })
    niveau!: number;

    /**
     * Libellé personnalisé du niveau — ex: "Évaluation", "Trimestre", "Semestre", "Année"
     */
    @Column({ type: 'varchar', length: 50 })
    label!: string;

    /**
     * Code de l'usage associé (FK logique vers UsageNiveau.code).
     * Exemples : 'NOTES', 'BULLETIN', 'COMPOSITION', 'ANNEE', 'AUTRE'
     *
     * Détermine les règles métier applicables :
     * - NOTES : saisie des notes autorisée
     * - BULLETIN : génération des bulletins autorisée
     * - COMPOSITION : création de compositions autorisée
     * - ANNEE : niveau racine (pas de parent possible)
     * - AUTRE : usage libre
     */
    @Column({ type: 'varchar', length: 50 })
    usageCode!: string;

    /** Description optionnelle */
    @Column({ type: 'text', nullable: true })
    description?: string;

    @ManyToOne(() => Etablissement, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
