/**
 * ==================================
 * eLISAschool - Entité FondEtablissement
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Relation many-to-many entre établissements et fonds
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
import { Fond } from './fond.entity';

/**
 * Entité FondEtablissement
 * Gère la sélection des fonds par chaque établissement
 */
@Entity('fonds_etablissement')
@Index(['etablissementId'])
@Index(['fondId'])
@Index(['etablissementId', 'fondId'], { unique: true })
@Index(['actif'])
export class FondEtablissement {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    /** ID de l'établissement */
    @Column({ type: 'uuid' })
    etablissementId!: string;

    /** ID du fond */
    @Column({ type: 'uuid' })
    fondId!: string;

    /** Fond activé dans la rotation */
    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    /** Ordre d'affichage dans la rotation */
    @Column({ type: 'int', default: 0 })
    ordre!: number;

    /** Date d'ajout du fond */
    @CreateDateColumn()
    dateAjout!: Date;

    /** Relation vers le fond */
    @ManyToOne(() => Fond, (fond) => fond.etablissements)
    @JoinColumn({ name: 'fondId' })
    fond!: Fond;

    @UpdateDateColumn()
    updatedAt!: Date;
}
