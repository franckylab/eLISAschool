/**
 * ==================================
 * eLISAschool - Entité PermissionPlateforme
 * ==================================
 * Modèle C — Auth0 Internalisé (Dual-Plane)
 *
 * Permissions dédiées à la plateforme, séparées des permissions tenant.
 * Table : permissions_plateforme
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    Index,
} from 'typeorm';

/**
 * Entité PermissionPlateforme.
 * Chaque permission a un code unique (ex: 'platform:users:manage'),
 * un module d'appartenance, et un ordre d'affichage.
 */
@Entity('permissions_plateforme')
export class PermissionPlateforme {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 100, unique: true })
    @Index()
    code!: string;

    @Column({ type: 'varchar', length: 200 })
    libelle!: string;

    @Column({ type: 'varchar', length: 50 })
    @Index()
    module!: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'boolean', default: true })
    estSysteme!: boolean;

    @Column({ type: 'integer', default: 0 })
    @Index()
    ordre!: number;
}
