/**
 * ==================================
 * eLISAschool - Entité UtilisateurEtablissement
 * ==================================
 * Version: 2.0.0
 * 
 * Table de jointure pour permettre à un utilisateur d'être associé
 * à plusieurs établissements avec des rôles différents.
 * 
 * Cas d'usage :
 * - Groupe scolaire (primaire + collège + lycée)
 * - Directeur régional multi-sites
 * - Remplacement/intérim entre établissements
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
import { Utilisateur } from '@modules/auth/entities/utilisateur.entity';
import { Etablissement } from '@modules/etablissement/entities';
import { Role } from './role.entity';

@Entity('utilisateur_etablissements')
@Index(['utilisateurId', 'etablissementId'], { unique: true })
@Index(['utilisateurId', 'actif'])
@Index(['etablissementId', 'actif'])
@Index(['roleId', 'actif'])  // Pour comptage des utilisateurs par rôle
@Index(['utilisateurId', 'etablissementId', 'actif'])  // Pour résolution des permissions
export class UtilisateurEtablissement {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    utilisateurId!: string;

    @ManyToOne(() => Utilisateur, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'utilisateurId' })
    utilisateur!: Utilisateur;

    @Column({ type: 'uuid' })
    etablissementId!: string;

    @ManyToOne(() => Etablissement, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'etablissementId' })
    etablissement!: Etablissement;

    /**
     * Rôle de l'utilisateur dans CET établissement
     * Peut être différent du rôle global
     */
    @Column({ type: 'uuid' })
    roleId!: string;

    @ManyToOne(() => Role, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'roleId' })
    role!: Role;

    /**
     * Indique si c'est l'établissement principal de l'utilisateur
     * Utilisé par défaut quand aucun établissement n'est spécifié
     */
    @Column({ type: 'boolean', default: false })
    etablissementPrincipal!: boolean;

    /**
     * Statut de l'affectation
     * Permet de désactiver sans supprimer (historique)
     */
    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    /**
     * Date de début d'affectation
     */
    @Column({ type: 'timestamp', nullable: true })
    dateDebut?: Date;

    /**
     * Date de fin d'affectation (null = indéterminée)
     */
    @Column({ type: 'timestamp', nullable: true })
    dateFin?: Date | null;

    /**
     * Motif de l'affectation (optionnel)
     */
    @Column({ type: 'varchar', length: 500, nullable: true })
    motif?: string;

    /**
     * Utilisateur qui a créé cette affectation (traçabilité)
     */
    @Column({ type: 'uuid', nullable: true })
    creePar?: string;

    @CreateDateColumn()
    creeAt!: Date;

    @UpdateDateColumn()
    majAt!: Date;
}

// Export nommé pour TypeORM (détection automatique via glob pattern)
