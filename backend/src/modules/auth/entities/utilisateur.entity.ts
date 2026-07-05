/**
 * ==================================
 * eLISAschool - Entité Utilisateur
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToOne,
    OneToMany,
    ManyToOne,
    JoinColumn,
    Index,
    BeforeInsert,
    BeforeUpdate,
} from 'typeorm';
import bcrypt from 'bcryptjs';
import { Etablissement } from '@modules/etablissement/entities';
// DEPRECATED: UtilisateurRole supprimé - rôles gérés exclusivement via UtilisateurEtablissement
import { UtilisateurPermission } from './utilisateur-permission.entity';
import { UtilisateurEtablissement } from './utilisateur-etablissement.entity';
import { ProfilUtilisateur } from './profil-utilisateur.entity';
import { Role } from '@shared/enums/roles.enum';

// Ré-exporter l'enum Role pour compatibilité
export { Role };

/**
 * Statut utilisateur
 */
export enum StatutUtilisateur {
    ACTIF = 'ACTIF',
    INACTIF = 'INACTIF',
    SUSPENDU = 'SUSPENDU',
    EN_ATTENTE_VALIDATION = 'EN_ATTENTE_VALIDATION',
}

/**
 * Entité Utilisateur
 * Table principale pour l'authentification et l'identification des utilisateurs
 */
@Entity('utilisateurs')
export class Utilisateur {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 255, unique: true })
    email!: string;

    @Column({ type: 'varchar', length: 50, unique: true })
    matricule!: string;

    // ==================================
    // Champs auth multi-mode (v2.0)
    // ==================================

    @Column({ type: 'varchar', length: 100, unique: true, nullable: true })
    @Index()
    pseudonyme?: string;

    @Column({ type: 'varchar', length: 100, unique: true, nullable: true })
    @Index()
    qrCodeId?: string;

    @Column({ type: 'varchar', length: 255, select: false })
    motDePasse!: string;

    @Column({ type: 'enum', enum: Role, default: Role.ELEVE })
    role!: Role;

    @Column({ type: 'enum', enum: StatutUtilisateur, default: StatutUtilisateur.EN_ATTENTE_VALIDATION })
    statut!: StatutUtilisateur;

    @Column({ type: 'boolean', default: false })
    emailVerifie!: boolean;

    @Column({ type: 'varchar', length: 255, nullable: true })
    tokenVerificationEmail?: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    tokenReinitialisationMdp?: string;

    @Column({ type: 'timestamp', nullable: true })
    expirationTokenMdp?: Date;

    // NOTE: tentativesConnexion et bloqueJusqua supprimés
    // Le blocage est maintenant géré par TentativeConnexion (système à deux niveaux)
    // Voir: tentative-connexion.entity.ts et blocage-auth.service.ts

    @Column({ type: 'timestamp', nullable: true })
    derniereConnexion?: Date;

    @Column({ type: 'varchar', length: 10, default: 'fr' })
    langue!: string;

    /**
     * NOUVEAU v3.0 - Nombre maximum d'établissements actifs
     * 0 = illimité (généralement pour super_admin)
     * 1 = mono-établissement (par défaut)
     * N = multi-établissements limités à N
     */
    @Column({ type: 'int', default: 1 })
    maxEtablissementsPersonnel!: number;

    // NOTE: etablissementId SUPPRIMÉ en v4.0
    // Multi-établissements géré exclusivement via utilisateur_etablissements

    @OneToOne(() => ProfilUtilisateur, profil => profil.utilisateur, { nullable: true })
    profil?: ProfilUtilisateur;

    /**
     * Relations RBAC v3.0 (Multi-tenant strict)
     * DEPRECATED: utilisateurRoles supprimé - rôles gérés exclusivement via utilisateurEtablissements
     */
    @OneToMany(() => UtilisateurPermission, up => up.utilisateur)
    utilisateurPermissions!: UtilisateurPermission[];

    /**
     * Relation multi-établissements (v2.0)
     * Un utilisateur peut être associé à plusieurs établissements
     */
    @OneToMany(() => UtilisateurEtablissement, ue => ue.utilisateur)
    utilisateurEtablissements!: UtilisateurEtablissement[];

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt!: Date;

    /**
     * Hash automatique du mot de passe avant insertion
     */
    @BeforeInsert()
    @BeforeUpdate()
    async hashMotDePasse(): Promise<void> {
        if (this.motDePasse && !this.motDePasse.startsWith('$2')) {
            const salt = await bcrypt.genSalt(12);
            this.motDePasse = await bcrypt.hash(this.motDePasse, salt);
        }
    }

    /**
     * Vérifie si le mot de passe correspond
     * @param motDePasse - Mot de passe en clair à vérifier
     */
    async verifierMotDePasse(motDePasse: string): Promise<boolean> {
        return bcrypt.compare(motDePasse, this.motDePasse);
    }

    // NOTE: méthode estBloque() supprimée
    // Le blocage est maintenant géré par BlocageAuthService.verifierBlocage()

    /**
     * Génère un matricule unique
     */
    static genererMatricule(prefix: string = 'EL'): string {
        const annee = new Date().getFullYear().toString().slice(-2);
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        return `${prefix}${annee}${random}`;
    }
}
