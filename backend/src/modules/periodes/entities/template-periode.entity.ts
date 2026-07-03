/**
 * ==================================
 * eLISAschool - Entité TemplatePeriode (v5.0 — Niveaux + Usages)
 * ==================================
 * Version: 5.0.0
 * Auteur: franck arlos chendjou
 *
 * Templates de hiérarchie de périodes personnalisables par établissement.
 * Structure JSON récursive utilisant des niveaux absolus et des usages sémantiques.
 *
 * Refonte v5.0 :
 * - Remplacement de `type` (enum TypePeriode) par `niveau` (number) + `usageCode` (string)
 * - Cohérence avec les règles métier basées sur l'usage
 * - Flexibilité totale (n'importe quel nombre de niveaux)
 *
 * Supporte les découpes arbitraires :
 * - 3 trimestres × 2 séquences (Cameroun francophone)
 * - 2 semestres × 3 séquences
 * - 4 terms (Afrique du Sud)
 * - 6 séquences directes
 * - etc.
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

/**
 * Structure d'un nœud dans l'arbre du template (v5.0).
 * Chaque nœud décrit un niveau de période et le nombre d'occurrences à générer.
 */
export interface NoeudTemplatePeriode {
    /** Niveau hiérarchique absolu (0 = base, 1, 2, 3...) */
    niveau: number;
    /** Code de l'usage sémantique (ex: 'NOTES', 'BULLETIN', 'ANNEE') */
    usageCode: string;
    /** Nombre d'occurrences à générer */
    count: number;
    /** Pattern de nommage — ex: "Trimestre {n}" où {n} est remplacé par le numéro */
    nom: string;
    /** Enfants de ce nœud (récursif) */
    enfants?: NoeudTemplatePeriode[];
}

@Entity('templates_periode')
@Index(['etablissementId'])
@Index(['actif'])
export class TemplatePeriodeEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    /** Nom lisible du template — ex: "3 Trimestres × 2 Évaluations" */
    @Column({ type: 'varchar', length: 200 })
    nom!: string;

    /** Description optionnelle */
    @Column({ type: 'text', nullable: true })
    description?: string;

    /**
     * Structure hiérarchique complète en JSON.
     * Contient l'arbre des types, counts et patterns de nommage.
     */
    @Column({ type: 'jsonb' })
    structure!: NoeudTemplatePeriode;

    /**
     * Établissement propriétaire.
     * null = template système (visible par tous).
     */
    @Column({ type: 'uuid', nullable: true })
    etablissementId?: string | null;

    @ManyToOne(() => Etablissement, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement | null;

    /**
     * Indique si c'est un template système (non supprimable par les admins normaux).
     * Les templates système ont etablissementId = null.
     */
    @Column({ type: 'boolean', default: false })
    estSysteme!: boolean;

    /** Activation/désactivation (soft delete logique) */
    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
