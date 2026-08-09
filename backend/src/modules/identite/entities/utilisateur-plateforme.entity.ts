/**
 * ==================================
 * eLISAschool - Entité UtilisateurPlateforme
 * ==================================
 * Modèle C — Auth0 Internalisé (Dual-Plane)
 *
 * Admins plateforme séparés des utilisateurs tenant.
 * Chaque ligne référence une identité globale.
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
import { Identite } from './identite.entity';
import { RolePlateforme } from '@shared/enums/platform-roles.enum';

/**
 * Entité UtilisateurPlateforme — admin hors-tenant.
 * Table : utilisateurs_plateforme
 */
@Entity('utilisateurs_plateforme')
export class UtilisateurPlateforme {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid', unique: true })
    @Index()
    identiteId!: string;

    @Column({ type: 'varchar', length: 30, default: RolePlateforme.SUPPORT })
    @Index()
    rolePlateforme!: RolePlateforme;

    @Column({ type: 'varchar', length: 100, nullable: true })
    prenom?: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    nom?: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    avatarUrl?: string;

    @Column({ type: 'timestamp', nullable: true })
    dernierAcces?: Date;

    @Column({ type: 'boolean', default: true })
    @Index()
    estActif!: boolean;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt!: Date;

    // =============================================
    // Relations
    // =============================================

    @ManyToOne(() => Identite, identite => identite.utilisateurPlateforme, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'identiteId' })
    identite!: Identite;
}
