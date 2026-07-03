/**
 * ==================================
 * eLISAschool - Entité PeriodeComposition
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Table de jointure pour la hiérarchie des périodes.
 * Relie un parent (ex: Trimestre) à un enfant (ex: Évaluation).
 * Porte le poids de composition et l'ordre dans le parent.
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
    Unique,
    Check,
} from 'typeorm';
import { Periode } from './periode.entity';

@Entity('periode_compositions')
@Unique('uq_composition', ['periodeParentId', 'periodeEnfantId'])
@Check('ck_different_periodes', '"periodeParentId" != "periodeEnfantId"')
export class PeriodeComposition {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    @Index('idx_composition_parent')
    periodeParentId!: string;

    @ManyToOne(() => Periode, (periode) => periode.compositionsEnfants, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'periodeParentId' })
    periodeParent?: Periode;

    @Column({ type: 'uuid' })
    @Index('idx_composition_enfant')
    periodeEnfantId!: string;

    @ManyToOne(() => Periode, (periode) => periode.compositionsParents, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'periodeEnfantId' })
    periodeEnfant?: Periode;

    /**
     * Ordre de l'enfant dans le parent (1 = premier, 2 = deuxième, etc.)
     */
    @Column({ type: 'int', default: 0 })
    ordre!: number;

    /**
     * Poids de composition — coefficient utilisé dans le calcul
     * de la moyenne pondérée du parent.
     *
     * Exemple : Évaluation 1 (poids=1) + Évaluation 2 (poids=2)
     * → Moyenne trim = (moy_seq1 × 1 + moy_seq2 × 2) / 3
     */
    @Column({ type: 'float', default: 1.0 })
    poids!: number;

    @CreateDateColumn()
    createdAt!: Date;
}
