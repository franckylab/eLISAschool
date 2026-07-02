/**
 * ==================================
 * eLISAschool - Entité UsageNiveau
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Table de configuration des usages des niveaux de périodicité.
 * Permet une flexibilité totale : usages système (partagés) + usages personnalisés par établissement.
 *
 * Exemples d'usages système : NOTES, BULLETIN, COMPOSITION, ANNEE, AUTRE
 * Exemples d'usages personnalisés : ÉVALUATION CONTINUE, EXAMEN BLANC, etc.
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

@Entity('usages_niveau')
@Index(['code'])
@Index(['etablissementId'])
export class UsageNiveau {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    /**
     * Code unique de l'usage (ex: 'NOTES', 'BULLETIN', 'CUSTOM_1')
     * Doit être unique par établissement (ou global si etablissementId = null)
     */
    @Column({ type: 'varchar', length: 50 })
    code!: string;

    /** Libellé lisible de l'usage (ex: 'Saisie des notes', 'Génération des bulletins') */
    @Column({ type: 'varchar', length: 100 })
    label!: string;

    /** Description optionnelle */
    @Column({ type: 'text', nullable: true })
    description?: string;

    /**
     * Établissement propriétaire.
     * null = usage système (visible et utilisable par tous les établissements).
     */
    @Column({ type: 'uuid', nullable: true })
    etablissementId?: string | null;

    @ManyToOne(() => Etablissement, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement | null;

    /**
     * Indique si c'est un usage système (non modifiable/supprimable par les admins normaux).
     * Les usages système ont etablissementId = null.
     */
    @Column({ type: 'boolean', default: false })
    estSysteme!: boolean;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
