/**
 * ==================================
 * eLISAschool - Entité Permission Plateforme
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Registre des ~40 permissions plateforme (Control Plane).
 * Chaque permission est identifiée par un code unique (ex: platform:users:read).
 * Modèle C — Auth0 Internalisé (Dual-Plane)
 */

import {
    Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
    UpdateDateColumn, Index,
} from 'typeorm';

@Entity('permissions_plateforme')
@Index(['code'], { unique: true })
@Index(['module'])
@Index(['ordre'])
export class PermissionPlateforme {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    /** Code unique (ex: platform:etablissements:read) */
    @Column({ type: 'varchar', length: 100, unique: true })
    code!: string;

    /** Libellé affiché */
    @Column({ type: 'varchar', length: 200 })
    libelle!: string;

    /** Module de rattachement (PILOTAGE, TENANTS, TECHNIQUE, SECURITE, IDENTITE) */
    @Column({ type: 'varchar', length: 50 })
    module!: string;

    @Column({ type: 'text', nullable: true })
    description!: string | null;

    /** Permission système (non supprimable) */
    @Column({ type: 'boolean', default: true })
    estSysteme!: boolean;

    /** Ordre d'affichage dans la matrice */
    @Column({ type: 'integer', default: 0 })
    ordre!: number;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
