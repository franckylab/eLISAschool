/**
 * ==================================
 * eLISAschool - Entité RoleLimitationEtablissement
 * ==================================
 * Version: 2.0.0
 * 
 * Configuration des limitations multi-établissements par rôle.
 * Permet de définir dynamiquement :
 * - Le nombre maximum d'établissements par rôle
 * - Si le changement d'établissement est autorisé
 * - Si une validation est requise
 */

import {
    Entity,
    PrimaryColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Role } from '@modules/auth/entities';

@Entity('role_limitations_etablissements')
export class RoleLimitationEtablissement {
    @PrimaryColumn({ type: 'enum', enum: Role })
    role!: Role;

    /**
     * Nombre maximum d'établissements autorisés pour ce rôle
     * 999 = illimité (SUPER_ADMIN)
     * 1 = single-établissement uniquement (ÉLÈVE)
     */
    @Column({ type: 'int', default: 1 })
    maxEtablissements!: number;

    /**
     * L'utilisateur peut-il changer d'établissement actif ?
     * false = bloqué sur son établissement unique
     */
    @Column({ type: 'boolean', default: true })
    peutChanger!: boolean;

    /**
     * L'affectation à un nouvel établissement nécessite-t-elle une validation ?
     * true = nécessite validation SUPER_ADMIN
     */
    @Column({ type: 'boolean', default: false })
    necessiteValidation!: boolean;

    /**
     * Description de la limitation (pour documentation)
     */
    @Column({ type: 'varchar', length: 500, nullable: true })
    description?: string;

    @CreateDateColumn()
    creeAt!: Date;

    @UpdateDateColumn()
    majAt!: Date;
}

export default RoleLimitationEtablissement;
